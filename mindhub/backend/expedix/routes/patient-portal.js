/**
 * Patient Portal Integration for Expedix Hub
 * 
 * Patient-facing portal with appointment confirmations, form pre-filling,
 * and secure access to medical information
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Portal access levels and permissions
 */
const PORTAL_ACCESS_LEVELS = {
  BASIC: {
    level: 1,
    permissions: ['view:appointments', 'view:basic_info', 'update:contact_info']
  },
  STANDARD: {
    level: 2,
    permissions: ['view:appointments', 'view:basic_info', 'update:contact_info', 'view:documents', 'view:prescriptions']
  },
  FULL: {
    level: 3,
    permissions: ['view:appointments', 'view:basic_info', 'update:contact_info', 'view:documents', 'view:prescriptions', 'view:test_results', 'schedule:appointments']
  }
};

/**
 * POST /api/expedix/patient-portal/request-access
 * Request portal access for a patient
 */
router.post('/request-access',
  [
    body('patientIdentifier').isString().isLength({ min: 1 }).withMessage('Patient identifier is required'),
    body('identifierType').isIn(['curp', 'medicalRecord', 'email']).withMessage('Invalid identifier type'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
    body('contactMethod').isIn(['email', 'sms']).withMessage('Invalid contact method'),
    body('email').optional().isEmail().withMessage('Valid email required if email contact method selected'),
    body('cellPhone').optional().isMobilePhone('es-MX').withMessage('Valid Mexican cell phone required if SMS contact method selected')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        patientIdentifier,
        identifierType,
        dateOfBirth,
        contactMethod,
        email,
        cellPhone
      } = req.body;

      // Build patient search criteria
      let whereClause = {
        dateOfBirth: new Date(dateOfBirth)
      };

      switch (identifierType) {
        case 'curp':
          whereClause.curp = patientIdentifier.toUpperCase();
          break;
        case 'medicalRecord':
          whereClause.medicalRecordNumber = patientIdentifier;
          break;
        case 'email':
          whereClause.email = patientIdentifier.toLowerCase();
          break;
      }

      // Find patient
      const patient = await executeQuery(
        (prisma) => prisma.patient.findFirst({
          where: whereClause,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            cellPhone: true,
            medicalRecordNumber: true,
            portalAccess: true
          }
        }),
        'findPatientForPortalAccess'
      );

      if (!patient) {
        // Log failed access attempt for security
        logger.warn('Failed portal access request - patient not found', {
          identifier: patientIdentifier,
          identifierType: identifierType,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(404).json({
          success: false,
          error: 'Patient not found',
          message: 'No patient found with the provided information'
        });
      }

      // Generate secure access token
      const accessToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

      // Create or update portal access request
      const portalRequest = await executeQuery(
        (prisma) => prisma.patientPortalAccess.upsert({
          where: { patientId: patient.id },
          update: {
            accessToken: accessToken,
            tokenExpiresAt: expiresAt,
            requestedAt: new Date(),
            isActive: false, // Requires verification
            accessLevel: 'BASIC',
            lastRequestIP: req.ip
          },
          create: {
            id: uuidv4(),
            patientId: patient.id,
            accessToken: accessToken,
            tokenExpiresAt: expiresAt,
            requestedAt: new Date(),
            isActive: false,
            accessLevel: 'BASIC',
            lastRequestIP: req.ip,
            createdAt: new Date()
          }
        }),
        'createPortalAccessRequest'
      );

      // Send verification message (simulate - in real implementation would send email/SMS)
      const verificationMethod = contactMethod === 'email' ? 
        (email || patient.email) : 
        (cellPhone || patient.cellPhone);

      if (!verificationMethod) {
        return res.status(400).json({
          success: false,
          error: 'Contact method not available',
          message: `Patient does not have a ${contactMethod} on file`
        });
      }

      // Log portal access request
      logger.info('Portal access requested', {
        patientId: patient.id,
        medicalRecordNumber: patient.medicalRecordNumber,
        contactMethod: contactMethod,
        ipAddress: req.ip
      });

      // Audit log
      await auditLogger.logDataAccess(
        patient.id,
        'portal_access_request',
        patient.id,
        'request',
        {
          identifierType: identifierType,
          contactMethod: contactMethod,
          ipAddress: req.ip
        }
      );

      res.json({
        success: true,
        message: 'Portal access verification sent',
        data: {
          verificationSent: true,
          contactMethod: contactMethod,
          maskedContact: maskContactInfo(verificationMethod, contactMethod),
          expiresIn: '24 hours'
        }
      });

    } catch (error) {
      logger.error('Failed to request portal access', {
        error: error.message,
        stack: error.stack,
        patientIdentifier: req.body.patientIdentifier
      });

      res.status(500).json({
        success: false,
        error: 'Failed to process portal access request',
        message: 'An error occurred while processing your request'
      });
    }
  }
);

/**
 * POST /api/expedix/patient-portal/verify-access
 * Verify portal access token and activate account
 */
router.post('/verify-access',
  [
    body('accessToken').isString().isLength({ min: 64, max: 64 }).withMessage('Invalid access token'),
    body('newPassword').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { accessToken, newPassword } = req.body;

      // Find and verify access token
      const portalAccess = await executeQuery(
        (prisma) => prisma.patientPortalAccess.findFirst({
          where: {
            accessToken: accessToken,
            tokenExpiresAt: { gt: new Date() },
            isActive: false
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                medicalRecordNumber: true
              }
            }
          }
        }),
        'verifyPortalAccessToken'
      );

      if (!portalAccess) {
        logger.warn('Invalid or expired portal access token', {
          accessToken: accessToken.substring(0, 8) + '...',
          ipAddress: req.ip
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid or expired access token'
        });
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Activate portal access
      const activatedAccess = await executeQuery(
        (prisma) => prisma.patientPortalAccess.update({
          where: { id: portalAccess.id },
          data: {
            isActive: true,
            password: hashedPassword,
            activatedAt: new Date(),
            accessToken: null, // Clear token after use
            tokenExpiresAt: null,
            lastLoginAt: new Date(),
            loginCount: 1
          }
        }),
        'activatePortalAccess'
      );

      // Generate JWT for session
      const sessionToken = jwt.sign(
        {
          patientId: portalAccess.patient.id,
          portalAccessId: portalAccess.id,
          accessLevel: portalAccess.accessLevel,
          type: 'patient_portal'
        },
        process.env.JWT_SECRET || 'mindhub-secret',
        { expiresIn: '8h' }
      );

      // Log successful activation
      logger.info('Portal access activated', {
        patientId: portalAccess.patient.id,
        medicalRecordNumber: portalAccess.patient.medicalRecordNumber,
        accessLevel: portalAccess.accessLevel,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Portal access activated successfully',
        data: {
          sessionToken: sessionToken,
          patient: {
            id: portalAccess.patient.id,
            firstName: portalAccess.patient.firstName,
            lastName: portalAccess.patient.lastName,
            medicalRecordNumber: portalAccess.patient.medicalRecordNumber
          },
          accessLevel: portalAccess.accessLevel,
          permissions: PORTAL_ACCESS_LEVELS[portalAccess.accessLevel].permissions
        }
      });

    } catch (error) {
      logger.error('Failed to verify portal access', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to verify access',
        message: 'An error occurred while verifying portal access'
      });
    }
  }
);

/**
 * POST /api/expedix/patient-portal/login
 * Login to patient portal
 */
router.post('/login',
  [
    body('medicalRecordNumber').isString().isLength({ min: 1 }).withMessage('Medical record number required'),
    body('password').isString().isLength({ min: 1 }).withMessage('Password required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { medicalRecordNumber, password } = req.body;

      // Find patient with portal access
      const portalAccess = await executeQuery(
        (prisma) => prisma.patientPortalAccess.findFirst({
          where: {
            patient: {
              medicalRecordNumber: medicalRecordNumber
            },
            isActive: true
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                medicalRecordNumber: true
              }
            }
          }
        }),
        'findPatientPortalAccess'
      );

      if (!portalAccess) {
        logger.warn('Portal login attempt for non-existent or inactive account', {
          medicalRecordNumber: medicalRecordNumber,
          ipAddress: req.ip
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, portalAccess.password);

      if (!isValidPassword) {
        // Log failed login attempt
        await executeQuery(
          (prisma) => prisma.patientPortalAccess.update({
            where: { id: portalAccess.id },
            data: {
              failedLoginAttempts: { increment: 1 },
              lastFailedLoginAt: new Date()
            }
          }),
          'incrementFailedLogin'
        );

        logger.warn('Portal login failed - invalid password', {
          patientId: portalAccess.patient.id,
          medicalRecordNumber: medicalRecordNumber,
          ipAddress: req.ip
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Check for account lockout (after 5 failed attempts)
      if (portalAccess.failedLoginAttempts >= 5) {
        const lockoutTime = new Date(portalAccess.lastFailedLoginAt.getTime() + (30 * 60 * 1000)); // 30 minutes
        if (new Date() < lockoutTime) {
          return res.status(423).json({
            success: false,
            error: 'Account temporarily locked',
            message: 'Too many failed login attempts. Please try again later.'
          });
        }
      }

      // Update login stats
      await executeQuery(
        (prisma) => prisma.patientPortalAccess.update({
          where: { id: portalAccess.id },
          data: {
            lastLoginAt: new Date(),
            loginCount: { increment: 1 },
            failedLoginAttempts: 0, // Reset on successful login
            lastLoginIP: req.ip
          }
        }),
        'updateLoginStats'
      );

      // Generate JWT session token
      const sessionToken = jwt.sign(
        {
          patientId: portalAccess.patient.id,
          portalAccessId: portalAccess.id,
          accessLevel: portalAccess.accessLevel,
          type: 'patient_portal'
        },
        process.env.JWT_SECRET || 'mindhub-secret',
        { expiresIn: '8h' }
      );

      // Log successful login
      logger.info('Patient portal login successful', {
        patientId: portalAccess.patient.id,
        medicalRecordNumber: medicalRecordNumber,
        accessLevel: portalAccess.accessLevel,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          sessionToken: sessionToken,
          patient: {
            id: portalAccess.patient.id,
            firstName: portalAccess.patient.firstName,
            lastName: portalAccess.patient.lastName,
            medicalRecordNumber: portalAccess.patient.medicalRecordNumber
          },
          accessLevel: portalAccess.accessLevel,
          permissions: PORTAL_ACCESS_LEVELS[portalAccess.accessLevel].permissions,
          lastLogin: portalAccess.lastLoginAt
        }
      });

    } catch (error) {
      logger.error('Failed to process portal login', {
        error: error.message,
        stack: error.stack,
        medicalRecordNumber: req.body.medicalRecordNumber
      });

      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: 'An error occurred while processing login'
      });
    }
  }
);

/**
 * Middleware to verify patient portal JWT token
 */
const verifyPortalToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mindhub-secret');
    
    if (decoded.type !== 'patient_portal') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    req.portalUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

/**
 * GET /api/expedix/patient-portal/dashboard
 * Get patient dashboard information
 */
router.get('/dashboard',
  verifyPortalToken,
  async (req, res) => {
    try {
      const { patientId } = req.portalUser;

      // Get patient overview
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          include: {
            _count: {
              select: {
                appointments: {
                  where: { status: { in: ['scheduled', 'confirmed'] } }
                },
                prescriptions: {
                  where: { status: 'active' }
                },
                documents: {
                  where: { 
                    isActive: true,
                    isConfidential: false,
                    securityLevel: { lte: 2 }
                  }
                }
              }
            }
          }
        }),
        `getPatientDashboard(${patientId})`
      );

      // Get upcoming appointments
      const upcomingAppointments = await executeQuery(
        (prisma) => prisma.appointment.findMany({
          where: {
            patientId: patientId,
            appointmentDate: { gte: new Date() },
            status: { in: ['scheduled', 'confirmed'] }
          },
          include: {
            provider: {
              select: {
                name: true,
                specialization: true
              }
            }
          },
          orderBy: { appointmentDate: 'asc' },
          take: 5
        }),
        'getUpcomingAppointments'
      );

      // Get recent activities
      const recentActivities = await getRecentPatientActivities(patientId);

      res.json({
        success: true,
        data: {
          patient: {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            medicalRecordNumber: patient.medicalRecordNumber,
            email: patient.email,
            cellPhone: patient.cellPhone
          },
          overview: {
            upcomingAppointments: patient._count.appointments,
            activePrescriptions: patient._count.prescriptions,
            availableDocuments: patient._count.documents
          },
          upcomingAppointments: upcomingAppointments,
          recentActivities: recentActivities
        }
      });

    } catch (error) {
      logger.error('Failed to get patient dashboard', {
        error: error.message,
        patientId: req.portalUser?.patientId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to load dashboard',
        message: 'An error occurred while loading dashboard data'
      });
    }
  }
);

/**
 * GET /api/expedix/patient-portal/appointments
 * Get patient appointments
 */
router.get('/appointments',
  verifyPortalToken,
  [
    query('status').optional().isIn(['all', 'upcoming', 'past', 'confirmed', 'scheduled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  async (req, res) => {
    try {
      const { patientId } = req.portalUser;
      const { status = 'upcoming', page = 1, limit = 10 } = req.query;

      // Build where clause
      let whereClause = { patientId: patientId };

      switch (status) {
        case 'upcoming':
          whereClause.appointmentDate = { gte: new Date() };
          whereClause.status = { in: ['scheduled', 'confirmed'] };
          break;
        case 'past':
          whereClause.appointmentDate = { lt: new Date() };
          break;
        case 'confirmed':
          whereClause.status = 'confirmed';
          break;
        case 'scheduled':
          whereClause.status = 'scheduled';
          break;
        // 'all' - no additional filters
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [appointments, totalCount] = await executeTransaction([
        (prisma) => prisma.appointment.findMany({
          where: whereClause,
          include: {
            provider: {
              select: {
                name: true,
                specialization: true
              }
            },
            confirmations: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { appointmentDate: status === 'past' ? 'desc' : 'asc' }
        }),
        (prisma) => prisma.appointment.count({ where: whereClause })
      ], 'getPatientAppointments');

      res.json({
        success: true,
        data: {
          appointments: appointments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get patient appointments', {
        error: error.message,
        patientId: req.portalUser?.patientId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to load appointments',
        message: 'An error occurred while loading appointments'
      });
    }
  }
);

/**
 * POST /api/expedix/patient-portal/appointments/:appointmentId/confirm
 * Confirm an appointment
 */
router.post('/appointments/:appointmentId/confirm',
  verifyPortalToken,
  [
    param('appointmentId').isUUID().withMessage('Invalid appointment ID'),
    body('confirmationMethod').isIn(['portal', 'email', 'sms']).withMessage('Invalid confirmation method'),
    body('notes').optional().isString().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const { patientId } = req.portalUser;
      const { appointmentId } = req.params;
      const { confirmationMethod, notes } = req.body;

      // Verify appointment belongs to patient
      const appointment = await executeQuery(
        (prisma) => prisma.appointment.findFirst({
          where: {
            id: appointmentId,
            patientId: patientId,
            status: 'scheduled'
          },
          include: {
            provider: {
              select: { name: true }
            }
          }
        }),
        `verifyAppointmentForConfirmation(${appointmentId})`
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found or cannot be confirmed'
        });
      }

      // Create confirmation record
      const confirmation = await executeTransaction([
        // Update appointment status
        (prisma) => prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy: patientId
          }
        }),
        // Create confirmation record
        (prisma) => prisma.appointmentConfirmation.create({
          data: {
            id: uuidv4(),
            appointmentId: appointmentId,
            confirmedBy: patientId,
            confirmationMethod: confirmationMethod,
            confirmedAt: new Date(),
            notes: notes,
            isPatientConfirmation: true
          }
        })
      ], 'confirmPatientAppointment');

      // Log confirmation
      logger.info('Patient appointment confirmed via portal', {
        appointmentId: appointmentId,
        patientId: patientId,
        confirmationMethod: confirmationMethod,
        appointmentDate: appointment.appointmentDate
      });

      res.json({
        success: true,
        message: 'Appointment confirmed successfully',
        data: {
          appointment: confirmation[0],
          confirmation: confirmation[1]
        }
      });

    } catch (error) {
      logger.error('Failed to confirm appointment', {
        error: error.message,
        appointmentId: req.params.appointmentId,
        patientId: req.portalUser?.patientId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to confirm appointment',
        message: 'An error occurred while confirming the appointment'
      });
    }
  }
);

/**
 * GET /api/expedix/patient-portal/forms/prefill/:formType
 * Get pre-filled form data for patient
 */
router.get('/forms/prefill/:formType',
  verifyPortalToken,
  [
    param('formType').isIn(['basic_registration', 'medical_history', 'family_history', 'emergency_contact']).withMessage('Invalid form type')
  ],
  async (req, res) => {
    try {
      const { patientId } = req.portalUser;
      const { formType } = req.params;

      // Get patient data for pre-filling
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          include: {
            medicalHistory: true,
            familyHistory: true
          }
        }),
        `getPatientForFormPrefill(${patientId})`
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      // Build pre-filled form data based on form type
      let prefillData = {};

      switch (formType) {
        case 'basic_registration':
          prefillData = {
            firstName: patient.firstName,
            lastName: patient.lastName,
            paternalLastName: patient.paternalLastName,
            maternalLastName: patient.maternalLastName,
            dateOfBirth: patient.dateOfBirth,
            curp: patient.curp,
            email: patient.email,
            cellPhone: patient.cellPhone,
            address: patient.address,
            city: patient.city,
            state: patient.state,
            postalCode: patient.postalCode,
            occupation: patient.occupation,
            maritalStatus: patient.maritalStatus
          };
          break;

        case 'medical_history':
          prefillData = patient.medicalHistory ? {
            allergies: patient.medicalHistory.allergies,
            currentMedications: patient.medicalHistory.currentMedications,
            surgicalHistory: patient.medicalHistory.surgicalHistory,
            chronicConditions: patient.medicalHistory.chronicConditions,
            previousTreatments: patient.medicalHistory.previousTreatments
          } : {};
          break;

        case 'family_history':
          prefillData = patient.familyHistory ? {
            mentalHealthHistory: patient.familyHistory.mentalHealthHistory,
            medicalConditions: patient.familyHistory.medicalConditions,
            hereditaryDiseases: patient.familyHistory.hereditaryDiseases
          } : {};
          break;

        case 'emergency_contact':
          const emergencyContact = patient.emergencyContact ? 
            JSON.parse(patient.emergencyContact) : {};
          prefillData = emergencyContact;
          break;
      }

      res.json({
        success: true,
        data: {
          formType: formType,
          prefillData: prefillData,
          lastUpdated: patient.updatedAt
        }
      });

    } catch (error) {
      logger.error('Failed to get form prefill data', {
        error: error.message,
        formType: req.params.formType,
        patientId: req.portalUser?.patientId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to load form data',
        message: 'An error occurred while loading form data'
      });
    }
  }
);

/**
 * Helper functions
 */

function maskContactInfo(contact, type) {
  if (type === 'email') {
    const [username, domain] = contact.split('@');
    return `${username.substring(0, 2)}***@${domain}`;
  } else if (type === 'sms') {
    return `***${contact.slice(-4)}`;
  }
  return contact;
}

async function getRecentPatientActivities(patientId) {
  const activities = [];

  try {
    // Get recent appointments
    const recentAppointments = await executeQuery(
      (prisma) => prisma.appointment.findMany({
        where: {
          patientId: patientId,
          appointmentDate: {
            gte: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)) // Last 30 days
          }
        },
        include: {
          provider: { select: { name: true } }
        },
        orderBy: { appointmentDate: 'desc' },
        take: 5
      }),
      'getRecentAppointmentActivities'
    );

    activities.push(...recentAppointments.map(apt => ({
      type: 'appointment',
      date: apt.appointmentDate,
      description: `Cita con ${apt.provider.name}`,
      status: apt.status
    })));

    // Get recent prescriptions
    const recentPrescriptions = await executeQuery(
      (prisma) => prisma.prescription.findMany({
        where: {
          patientId: patientId,
          prescribedAt: {
            gte: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
          }
        },
        include: {
          medication: { select: { genericName: true } }
        },
        orderBy: { prescribedAt: 'desc' },
        take: 3
      }),
      'getRecentPrescriptionActivities'
    );

    activities.push(...recentPrescriptions.map(presc => ({
      type: 'prescription',
      date: presc.prescribedAt,
      description: `Prescripción: ${presc.medication.genericName}`,
      status: presc.status
    })));

    // Sort all activities by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    return activities.slice(0, 10); // Return top 10 most recent
  } catch (error) {
    logger.error('Failed to get recent patient activities', {
      error: error.message,
      patientId: patientId
    });
    return [];
  }
}

module.exports = router;