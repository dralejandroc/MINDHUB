/**
 * Emergency Contacts API Routes for Expedix Hub
 * 
 * Comprehensive emergency contact management with healthcare compliance
 * and privacy protection implementing NOM-024-SSA3-2010 requirements
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Validation middleware for emergency contacts
 */
const validateEmergencyContact = [
  body('patientId')
    .isUUID()
    .withMessage('Invalid patient ID format'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('relationship')
    .isIn(['spouse', 'parent', 'child', 'sibling', 'friend', 'other'])
    .withMessage('Invalid relationship type'),
  
  body('phone')
    .isMobilePhone('es-MX')
    .withMessage('Invalid Mexican phone number'),
  
  body('alternatePhone')
    .optional()
    .isMobilePhone('es-MX')
    .withMessage('Invalid alternate phone number'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be boolean'),
  
  body('canMakeDecisions')
    .optional()
    .isBoolean()
    .withMessage('canMakeDecisions must be boolean'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

/**
 * GET /api/expedix/emergency-contacts/:patientId
 * Get emergency contacts for a patient
 */
router.get('/:patientId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_data']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { patientId } = req.params;

      // Get emergency contacts
      const contacts = await executeQuery(
        (prisma) => prisma.emergencyContact.findMany({
          where: {
            patientId,
            isActive: true
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            creator: {
              select: { id: true, name: true }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'desc' }
          ]
        }),
        `getEmergencyContacts(${patientId})`
      );

      // Apply role-based filtering
      const filteredContacts = contacts.map(contact => {
        // Patients can see all their emergency contacts
        // Healthcare providers can see all contacts
        // Apply any additional filtering based on role if needed
        return contact;
      });

      // Log access for compliance
      logger.info('Emergency contacts accessed', {
        patientId,
        userId: req.user?.id,
        contactCount: contacts.length,
        userRole: req.user?.role
      });

      res.json({
        success: true,
        data: filteredContacts,
        count: filteredContacts.length
      });

    } catch (error) {
      logger.error('Failed to get emergency contacts', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to retrieve emergency contacts', 
        details: error.message 
      });
    }
  }
);

/**
 * GET /api/expedix/emergency-contacts/contact/:id
 * Get specific emergency contact details
 */
router.get('/contact/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_data']),
  [
    param('id').isUUID().withMessage('Invalid contact ID format')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const contact = await executeQuery(
        (prisma) => prisma.emergencyContact.findUnique({
          where: { id },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            creator: {
              select: { id: true, name: true }
            }
          }
        }),
        `getEmergencyContact(${id})`
      );

      if (!contact) {
        return res.status(404).json({ error: 'Emergency contact not found' });
      }

      // Check patient access permissions
      if (req.user?.role === 'patient' && contact.patient.id !== req.user?.patientId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        success: true,
        data: contact
      });

    } catch (error) {
      logger.error('Failed to get emergency contact', {
        error: error.message,
        contactId: req.params.id,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to retrieve emergency contact', 
        details: error.message 
      });
    }
  }
);

/**
 * POST /api/expedix/emergency-contacts
 * Create new emergency contact
 */
router.post('/',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']),
  validateEmergencyContact,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const contactData = req.body;
      const userId = req.user?.id;

      // Verify patient exists
      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: contactData.patientId },
          select: { id: true, medicalRecordNumber: true }
        }),
        `verifyPatient(${contactData.patientId})`
      );

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Create emergency contact
      const contact = await executeTransaction([
        async (prisma) => {
          // If this is primary contact, unset other primary contacts
          if (contactData.isPrimary) {
            await prisma.emergencyContact.updateMany({
              where: {
                patientId: contactData.patientId,
                isPrimary: true
              },
              data: { isPrimary: false }
            });
          }

          // Create new contact
          const newContact = await prisma.emergencyContact.create({
            data: {
              ...contactData,
              createdBy: userId,
              isActive: true
            },
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  medicalRecordNumber: true
                }
              },
              creator: {
                select: { id: true, name: true }
              }
            }
          });

          return newContact;
        }
      ], 'createEmergencyContact');

      // Log creation for compliance
      await auditLogger.logDataModification(
        userId,
        'EMERGENCY_CONTACT_CREATE',
        {
          contactId: contact.id,
          patientId: contactData.patientId,
          medicalRecordNumber: patient.medicalRecordNumber,
          contactName: contactData.name,
          relationship: contactData.relationship,
          isPrimary: contactData.isPrimary
        }
      );

      res.status(201).json({
        success: true,
        message: 'Emergency contact created successfully',
        data: contact
      });

    } catch (error) {
      logger.error('Failed to create emergency contact', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to create emergency contact', 
        details: error.message 
      });
    }
  }
);

/**
 * PUT /api/expedix/emergency-contacts/:id
 * Update emergency contact
 */
router.put('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']),
  [
    param('id').isUUID().withMessage('Invalid contact ID format'),
    ...validateEmergencyContact
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      // Get current contact
      const currentContact = await executeQuery(
        (prisma) => prisma.emergencyContact.findUnique({
          where: { id },
          select: {
            id: true,
            patientId: true,
            name: true,
            relationship: true,
            isActive: true
          }
        }),
        `getCurrentContact(${id})`
      );

      if (!currentContact) {
        return res.status(404).json({ error: 'Emergency contact not found' });
      }

      if (!currentContact.isActive) {
        return res.status(400).json({ error: 'Cannot update inactive contact' });
      }

      // Update contact
      const updatedContact = await executeTransaction([
        async (prisma) => {
          // If this is being set as primary, unset other primary contacts
          if (updateData.isPrimary && updateData.isPrimary !== currentContact.isPrimary) {
            await prisma.emergencyContact.updateMany({
              where: {
                patientId: currentContact.patientId,
                isPrimary: true,
                id: { not: id }
              },
              data: { isPrimary: false }
            });
          }

          // Update the contact
          return await prisma.emergencyContact.update({
            where: { id },
            data: {
              ...updateData,
              updatedAt: new Date()
            },
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  medicalRecordNumber: true
                }
              },
              creator: {
                select: { id: true, name: true }
              }
            }
          });
        }
      ], 'updateEmergencyContact');

      // Log update for compliance
      await auditLogger.logDataModification(
        userId,
        'EMERGENCY_CONTACT_UPDATE',
        {
          contactId: id,
          patientId: currentContact.patientId,
          contactName: currentContact.name,
          changes: Object.keys(updateData)
        }
      );

      res.json({
        success: true,
        message: 'Emergency contact updated successfully',
        data: updatedContact
      });

    } catch (error) {
      logger.error('Failed to update emergency contact', {
        error: error.message,
        contactId: req.params.id,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to update emergency contact', 
        details: error.message 
      });
    }
  }
);

/**
 * DELETE /api/expedix/emergency-contacts/:id
 * Soft delete emergency contact
 */
router.delete('/:id',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']),
  [
    param('id').isUUID().withMessage('Invalid contact ID format'),
    body('reason').optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      // Get contact details
      const contact = await executeQuery(
        (prisma) => prisma.emergencyContact.findUnique({
          where: { id },
          select: {
            id: true,
            patientId: true,
            name: true,
            relationship: true,
            isActive: true,
            isPrimary: true
          }
        }),
        `getContact(${id})`
      );

      if (!contact) {
        return res.status(404).json({ error: 'Emergency contact not found' });
      }

      if (!contact.isActive) {
        return res.status(400).json({ error: 'Contact is already inactive' });
      }

      // Check if this is the only emergency contact
      const contactCount = await executeQuery(
        (prisma) => prisma.emergencyContact.count({
          where: {
            patientId: contact.patientId,
            isActive: true
          }
        }),
        'countActiveContacts'
      );

      if (contactCount === 1) {
        return res.status(400).json({ 
          error: 'Cannot delete the last emergency contact for a patient' 
        });
      }

      // Soft delete contact
      await executeTransaction([
        async (prisma) => {
          // Deactivate the contact
          await prisma.emergencyContact.update({
            where: { id },
            data: {
              isActive: false,
              isPrimary: false,
              deactivatedAt: new Date(),
              deactivatedBy: userId,
              deactivationReason: reason
            }
          });

          // If this was the primary contact, make another contact primary
          if (contact.isPrimary) {
            const nextContact = await prisma.emergencyContact.findFirst({
              where: {
                patientId: contact.patientId,
                isActive: true,
                id: { not: id }
              },
              orderBy: { createdAt: 'asc' }
            });

            if (nextContact) {
              await prisma.emergencyContact.update({
                where: { id: nextContact.id },
                data: { isPrimary: true }
              });
            }
          }
        }
      ], 'deleteEmergencyContact');

      // Log deletion for compliance
      await auditLogger.logDataModification(
        userId,
        'EMERGENCY_CONTACT_DELETE',
        {
          contactId: id,
          patientId: contact.patientId,
          contactName: contact.name,
          relationship: contact.relationship,
          reason: reason || 'No reason provided'
        }
      );

      res.json({
        success: true,
        message: 'Emergency contact deactivated successfully'
      });

    } catch (error) {
      logger.error('Failed to deactivate emergency contact', {
        error: error.message,
        contactId: req.params.id,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to deactivate emergency contact', 
        details: error.message 
      });
    }
  }
);

/**
 * POST /api/expedix/emergency-contacts/:id/primary
 * Set emergency contact as primary
 */
router.post('/:id/primary',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['write:patient_data']),
  [
    param('id').isUUID().withMessage('Invalid contact ID format')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Get contact details
      const contact = await executeQuery(
        (prisma) => prisma.emergencyContact.findUnique({
          where: { id },
          select: {
            id: true,
            patientId: true,
            name: true,
            isActive: true,
            isPrimary: true
          }
        }),
        `getContact(${id})`
      );

      if (!contact) {
        return res.status(404).json({ error: 'Emergency contact not found' });
      }

      if (!contact.isActive) {
        return res.status(400).json({ error: 'Cannot set inactive contact as primary' });
      }

      if (contact.isPrimary) {
        return res.status(400).json({ error: 'Contact is already primary' });
      }

      // Set as primary
      await executeTransaction([
        async (prisma) => {
          // Remove primary status from other contacts
          await prisma.emergencyContact.updateMany({
            where: {
              patientId: contact.patientId,
              isPrimary: true
            },
            data: { isPrimary: false }
          });

          // Set this contact as primary
          await prisma.emergencyContact.update({
            where: { id },
            data: { isPrimary: true }
          });
        }
      ], 'setPrimaryContact');

      // Log change for compliance
      await auditLogger.logDataModification(
        userId,
        'EMERGENCY_CONTACT_PRIMARY_SET',
        {
          contactId: id,
          patientId: contact.patientId,
          contactName: contact.name
        }
      );

      res.json({
        success: true,
        message: 'Emergency contact set as primary successfully'
      });

    } catch (error) {
      logger.error('Failed to set primary emergency contact', {
        error: error.message,
        contactId: req.params.id,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to set primary emergency contact', 
        details: error.message 
      });
    }
  }
);

/**
 * GET /api/expedix/emergency-contacts/:patientId/primary
 * Get primary emergency contact for a patient
 */
router.get('/:patientId/primary',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_data']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format')
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const primaryContact = await executeQuery(
        (prisma) => prisma.emergencyContact.findFirst({
          where: {
            patientId,
            isPrimary: true,
            isActive: true
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            }
          }
        }),
        `getPrimaryContact(${patientId})`
      );

      if (!primaryContact) {
        return res.status(404).json({ error: 'No primary emergency contact found' });
      }

      res.json({
        success: true,
        data: primaryContact
      });

    } catch (error) {
      logger.error('Failed to get primary emergency contact', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to retrieve primary emergency contact', 
        details: error.message 
      });
    }
  }
);

module.exports = router;