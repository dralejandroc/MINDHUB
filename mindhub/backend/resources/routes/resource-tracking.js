/**
 * Resource Tracking API Routes for MindHub Resources Library
 * 
 * Manages sending resources to patients and tracking their usage,
 * including integration with Expedix timeline and usage analytics.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const authMiddleware = require('../../shared/middleware/auth-middleware');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const PersonalizationService = require('../services/PersonalizationService');
const SecureDownloadService = require('../services/SecureDownloadService');

const router = express.Router();

// Initialize services
const personalizationService = new PersonalizationService();
const downloadService = new SecureDownloadService();

/**
 * @route POST /api/resources/send
 * @desc Send resource to patient via specified method
 * @access Private
 */
router.post('/send',
  authMiddleware.authenticate,
  [
    body('resourceId')
      .notEmpty()
      .withMessage('Resource ID is required'),
    body('patientId')
      .notEmpty()
      .withMessage('Patient ID is required'),
    body('method')
      .isIn(['email', 'download', 'print'])
      .withMessage('Method must be email, download, or print'),
    body('personalizedContent')
      .optional()
      .isObject()
      .withMessage('Personalized content must be an object'),
    body('customMessage')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Custom message cannot exceed 1000 characters')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { 
        resourceId, 
        patientId, 
        method, 
        personalizedContent, 
        customMessage,
        sessionId 
      } = req.body;
      const userId = req.user.id;

      // Get resource details
      const resource = await getResourceDetails(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Get patient details
      const patient = await getPatientDetails(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Check if resource was already sent recently (avoid duplicates)
      const recentSend = await checkRecentSend(resourceId, patientId, 24); // 24 hours
      if (recentSend) {
        return res.status(409).json({
          success: false,
          message: 'Este recurso ya fue enviado al paciente en las últimas 24 horas',
          lastSent: recentSend.sentAt
        });
      }

      // Create resource usage record
      const usageRecord = await createResourceUsage({
        resourceId,
        patientId,
        practitionerId: userId,
        clinicId: req.user.clinicId,
        sessionId,
        method,
        personalizedContent: personalizedContent || {},
        customMessage
      });

      // Process sending based on method
      let sendResult;
      switch (method) {
        case 'email':
          sendResult = await sendResourceByEmail(resource, patient, personalizedContent, customMessage, usageRecord.id);
          break;
        case 'download':
          sendResult = await generateDownloadLink(resource, patient, personalizedContent, usageRecord.id);
          break;
        case 'print':
          sendResult = await preparePrintVersion(resource, patient, personalizedContent, usageRecord.id);
          break;
        default:
          throw new Error('Unsupported send method');
      }

      // Update usage record with send details
      await updateResourceUsage(usageRecord.id, {
        status: 'sent',
        deliveryDetails: sendResult.deliveryDetails,
        sentAt: new Date()
      });

      // Add to Expedix timeline if session provided
      if (sessionId) {
        await addToExpedixTimeline({
          sessionId,
          patientId,
          resourceId,
          resourceTitle: resource.title,
          method,
          sentAt: new Date(),
          usageRecordId: usageRecord.id
        });
      }

      // Log activity
      await logResourceActivity({
        eventType: 'resource_sent',
        resourceId,
        patientId,
        userId,
        method,
        metadata: {
          deliveryDetails: sendResult.deliveryDetails,
          personalizedContent: personalizedContent || {},
          sessionId
        }
      });

      res.json({
        success: true,
        message: `Recurso enviado exitosamente por ${method}`,
        data: {
          usageRecordId: usageRecord.id,
          method,
          sentAt: new Date(),
          deliveryDetails: sendResult.deliveryDetails,
          expedixTimelineId: sendResult.expedixTimelineId
        }
      });

    } catch (error) {
      console.error('Error sending resource:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al enviar el recurso',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route GET /api/resources/tracking/patient/:patientId
 * @desc Get tracking history for a specific patient
 * @access Private
 */
router.get('/tracking/patient/:patientId',
  authMiddleware.authenticate,
  [
    param('patientId')
      .notEmpty()
      .withMessage('Patient ID is required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['sent', 'viewed', 'downloaded', 'completed'])
      .withMessage('Invalid status filter'),
    query('method')
      .optional()
      .isIn(['email', 'download', 'print'])
      .withMessage('Invalid method filter')
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { limit = 50, status, method } = req.query;

      // Build query filters
      const filters = {
        patientId,
        practitionerId: req.user.id
      };

      if (status) filters.status = status;
      if (method) filters.method = method;

      // Get tracking records
      const trackingRecords = await getPatientResourceTracking(filters, {
        limit: parseInt(limit),
        orderBy: 'sentAt',
        order: 'desc'
      });

      // Get summary statistics
      const summary = await getPatientTrackingSummary(patientId, req.user.id);

      res.json({
        success: true,
        data: {
          records: trackingRecords,
          summary,
          total: trackingRecords.length
        }
      });

    } catch (error) {
      console.error('Error getting patient tracking:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener el seguimiento del paciente',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route PUT /api/resources/tracking/:usageId/status
 * @desc Update resource usage status (viewed, downloaded, completed)
 * @access Private
 */
router.put('/tracking/:usageId/status',
  authMiddleware.authenticate,
  [
    param('usageId')
      .notEmpty()
      .withMessage('Usage ID is required'),
    body('status')
      .isIn(['viewed', 'downloaded', 'completed'])
      .withMessage('Invalid status'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  async (req, res) => {
    try {
      const { usageId } = req.params;
      const { status, notes } = req.body;

      // Get current usage record
      const usageRecord = await getResourceUsageById(usageId);
      if (!usageRecord) {
        return res.status(404).json({
          success: false,
          message: 'Usage record not found'
        });
      }

      // Verify user has access to this record
      if (usageRecord.practitionerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this usage record'
        });
      }

      // Update status with timestamp
      const updateData = {
        status,
        practitionerNotes: notes,
        updatedAt: new Date()
      };

      // Add specific timestamp based on status
      switch (status) {
        case 'viewed':
          updateData.viewedAt = new Date();
          break;
        case 'downloaded':
          updateData.downloadedAt = new Date();
          break;
        case 'completed':
          updateData.completedAt = new Date();
          break;
      }

      await updateResourceUsage(usageId, updateData);

      // Log status change
      await logResourceActivity({
        eventType: `resource_${status}`,
        resourceId: usageRecord.resourceId,
        patientId: usageRecord.patientId,
        userId: req.user.id,
        metadata: {
          usageRecordId: usageId,
          previousStatus: usageRecord.status,
          newStatus: status,
          notes
        }
      });

      res.json({
        success: true,
        message: `Estado actualizado a ${status}`,
        data: {
          usageId,
          status,
          updatedAt: updateData.updatedAt
        }
      });

    } catch (error) {
      console.error('Error updating tracking status:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el estado',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route GET /api/resources/tracking/analytics
 * @desc Get resource usage analytics for the practitioner
 * @access Private
 */
router.get('/tracking/analytics',
  authMiddleware.authenticate,
  [
    query('period')
      .optional()
      .isIn(['week', 'month', 'quarter', 'year'])
      .withMessage('Invalid period'),
    query('groupBy')
      .optional()
      .isIn(['resource', 'category', 'method', 'patient'])
      .withMessage('Invalid groupBy parameter')
  ],
  async (req, res) => {
    try {
      const { period = 'month', groupBy = 'resource' } = req.query;
      const userId = req.user.id;

      // Calculate date range
      const dateRange = calculateDateRange(period);

      // Get analytics data
      const analytics = await getResourceAnalytics({
        practitionerId: userId,
        startDate: dateRange.start,
        endDate: dateRange.end,
        groupBy
      });

      res.json({
        success: true,
        data: {
          period,
          groupBy,
          dateRange,
          analytics
        }
      });

    } catch (error) {
      console.error('Error getting analytics:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener las analíticas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Helper Functions

async function sendResourceByEmail(resource, patient, personalizationData, customMessage, usageRecordId) {
  try {
    // Create email transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Generate personalized content
    let emailContent = resource.content.rawText;
    if (resource.content.hasVariables && personalizationData) {
      emailContent = await personalizationService.personalizeText(
        resource.content.rawText,
        personalizationData.variables || {}
      );
    }

    // Prepare email
    const emailSubject = `Recurso psicoeducativo: ${resource.title}`;
    const emailBody = `
Estimado/a ${patient.first_name},

${customMessage || 'Te comparto el siguiente recurso psicoeducativo que puede ser útil para tu tratamiento.'}

${emailContent}

---
Este mensaje fue enviado desde ${personalizationData?.clinicName || 'la clínica'}.
Si tienes dudas, no dudes en contactarnos.
    `;

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: patient.email,
      subject: emailSubject,
      text: emailBody
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      deliveryDetails: {
        emailAddress: patient.email,
        emailSubject: emailSubject,
        emailMessage: customMessage,
        messageId: info.messageId,
        sentAt: new Date()
      }
    };

  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

async function generateDownloadLink(resource, patient, personalizationData, usageRecordId) {
  try {
    // Generate secure download token
    const tokenResult = await downloadService.generateDownloadToken(
      resource.id,
      patient.id,
      {
        ipAddress: '0.0.0.0', // Allow from any IP for patient access
        userAgent: 'patient-portal',
        personalizationData
      }
    );

    return {
      deliveryDetails: {
        downloadToken: tokenResult.downloadToken,
        downloadUrl: tokenResult.downloadUrl,
        expiresAt: tokenResult.expiresAt,
        generatedAt: new Date()
      }
    };

  } catch (error) {
    console.error('Error generating download link:', error);
    throw new Error('Failed to generate download link');
  }
}

async function preparePrintVersion(resource, patient, personalizationData, usageRecordId) {
  try {
    // Generate print-ready PDF
    let content = resource.content.rawText;
    if (resource.content.hasVariables && personalizationData) {
      content = await personalizationService.personalizeText(
        content,
        personalizationData.variables || {}
      );
    }

    const pdfBuffer = await personalizationService.generatePersonalizedPDF(
      content,
      personalizationData?.variables || {},
      {
        allowLogo: true,
        allowCustomColors: false,
        allowFontCustomization: false
      }
    );

    // Store PDF temporarily for print access
    const printId = require('uuid').v4();
    const printPath = `/tmp/print_${printId}.pdf`;
    
    require('fs').writeFileSync(printPath, pdfBuffer);

    return {
      deliveryDetails: {
        printId,
        printPath,
        printReady: true,
        generatedAt: new Date()
      }
    };

  } catch (error) {
    console.error('Error preparing print version:', error);
    throw new Error('Failed to prepare print version');
  }
}

// Database helper functions (implement with your database layer)
async function getResourceDetails(resourceId) {
  // Implement with Firestore
  const FirestoreConfig = require('../../shared/config/firestore-resources-config');
  const firestoreConfig = new FirestoreConfig();
  await firestoreConfig.initialize();
  
  const resourceDoc = await firestoreConfig.getDocument('resources', resourceId).get();
  if (!resourceDoc.exists) {
    return null;
  }
  
  return { id: resourceDoc.id, ...resourceDoc.data() };
}

async function getPatientDetails(patientId) {
  // Implement with your patient database
  // This is a mock implementation
  return {
    id: patientId,
    first_name: 'Patient',
    email: 'patient@example.com'
  };
}

async function createResourceUsage(usageData) {
  // Implement with Firestore
  const FirestoreConfig = require('../../shared/config/firestore-resources-config');
  const firestoreConfig = new FirestoreConfig();
  await firestoreConfig.initialize();
  
  const usageCollection = firestoreConfig.getCollection('resourceUsage');
  const docRef = await usageCollection.add({
    ...usageData,
    createdAt: new Date(),
    status: 'pending'
  });
  
  return { id: docRef.id, ...usageData };
}

async function updateResourceUsage(usageId, updateData) {
  const FirestoreConfig = require('../../shared/config/firestore-resources-config');
  const firestoreConfig = new FirestoreConfig();
  await firestoreConfig.initialize();
  
  const usageDoc = firestoreConfig.getDocument('resourceUsage', usageId);
  await usageDoc.update(updateData);
  
  return true;
}

async function checkRecentSend(resourceId, patientId, hoursAgo) {
  // Check if resource was sent to patient within specified hours
  const cutoffTime = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
  
  const FirestoreConfig = require('../../shared/config/firestore-resources-config');
  const firestoreConfig = new FirestoreConfig();
  await firestoreConfig.initialize();
  
  const usageCollection = firestoreConfig.getCollection('resourceUsage');
  const query = await usageCollection
    .where('resourceId', '==', resourceId)
    .where('patientId', '==', patientId)
    .where('sentAt', '>=', cutoffTime)
    .limit(1)
    .get();
  
  if (!query.empty) {
    const doc = query.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  
  return null;
}

async function addToExpedixTimeline(timelineData) {
  // Implement integration with Expedix timeline
  // This would be specific to your Expedix implementation
  console.log('Adding to Expedix timeline:', timelineData);
  return { expedixTimelineId: 'timeline_' + Date.now() };
}

async function logResourceActivity(activityData) {
  const FirestoreConfig = require('../../shared/config/firestore-resources-config');
  const firestoreConfig = new FirestoreConfig();
  await firestoreConfig.initialize();
  
  const logsCollection = firestoreConfig.getCollection('accessLogs');
  await logsCollection.add({
    ...activityData,
    timestamp: new Date()
  });
}

function calculateDateRange(period) {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return { start, end: now };
}

module.exports = router;