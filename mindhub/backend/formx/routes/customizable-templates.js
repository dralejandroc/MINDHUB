/**
 * Customizable Templates System for FormX Hub
 * 
 * Creates customizable patient record templates that are predefined but editable
 * based on EXPEDIENTE ELEONOR analysis and user preferences
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Base template configurations for different medical specialties
 * Based on EXPEDIENTE ELEONOR analysis
 */
const BASE_TEMPLATE_CONFIGS = {
  mentalHealth: {
    name: "Plantilla de Salud Mental",
    description: "Plantilla especializada para consultas de salud mental",
    category: "mental_health",
    sections: [
      {
        id: "basic_info",
        title: "Información Básica",
        order: 1,
        customizable: true,
        fields: [
          { id: "firstName", type: "text", required: true, customizable: false },
          { id: "lastName", type: "text", required: true, customizable: false },
          { id: "dateOfBirth", type: "date", required: true, customizable: false },
          { id: "gender", type: "select", required: true, customizable: true },
          { id: "education", type: "select", required: false, customizable: true },
          { id: "occupation", type: "text", required: false, customizable: true },
          { id: "maritalStatus", type: "select", required: false, customizable: true }
        ]
      },
      {
        id: "mental_health_history",
        title: "Historia de Salud Mental",
        order: 2,
        customizable: true,
        fields: [
          { id: "previousTreatment", type: "boolean", required: true, customizable: true },
          { id: "currentMedications", type: "textarea", required: false, customizable: true },
          { id: "substanceUse", type: "multiselect", required: false, customizable: true },
          { id: "familyMentalHealth", type: "textarea", required: false, customizable: true },
          { id: "traumaHistory", type: "boolean", required: false, customizable: true }
        ]
      },
      {
        id: "current_symptoms",
        title: "Síntomas Actuales",
        order: 3,
        customizable: true,
        fields: [
          { id: "primaryConcern", type: "textarea", required: true, customizable: true },
          { id: "symptomDuration", type: "select", required: true, customizable: true },
          { id: "symptomSeverity", type: "scale", required: true, customizable: true },
          { id: "triggerEvents", type: "textarea", required: false, customizable: true }
        ]
      }
    ],
    printSettings: {
      marginLeft: 2,
      marginTop: 4.2,
      fontSize: 10,
      logoPosition: "top-left",
      customizable: true
    }
  },
  
  generalMedicine: {
    name: "Plantilla de Medicina General",
    description: "Plantilla para consultas de medicina general",
    category: "general_medicine",
    sections: [
      {
        id: "basic_info",
        title: "Información del Paciente",
        order: 1,
        customizable: true,
        fields: [
          { id: "firstName", type: "text", required: true, customizable: false },
          { id: "lastName", type: "text", required: true, customizable: false },
          { id: "dateOfBirth", type: "date", required: true, customizable: false },
          { id: "gender", type: "select", required: true, customizable: true },
          { id: "weight", type: "number", required: false, customizable: true },
          { id: "height", type: "number", required: false, customizable: true },
          { id: "bloodType", type: "select", required: false, customizable: true }
        ]
      },
      {
        id: "chief_complaint",
        title: "Motivo de Consulta",
        order: 2,
        customizable: true,
        fields: [
          { id: "chiefComplaint", type: "textarea", required: true, customizable: true },
          { id: "symptomDuration", type: "text", required: true, customizable: true },
          { id: "painScale", type: "scale", required: false, customizable: true },
          { id: "associatedSymptoms", type: "multiselect", required: false, customizable: true }
        ]
      },
      {
        id: "vital_signs",
        title: "Signos Vitales",
        order: 3,
        customizable: true,
        fields: [
          { id: "bloodPressure", type: "text", required: false, customizable: true },
          { id: "heartRate", type: "number", required: false, customizable: true },
          { id: "temperature", type: "number", required: false, customizable: true },
          { id: "respiratoryRate", type: "number", required: false, customizable: true },
          { id: "oxygenSaturation", type: "number", required: false, customizable: true }
        ]
      }
    ],
    printSettings: {
      marginLeft: 1.5,
      marginTop: 3.8,
      fontSize: 10,
      logoPosition: "top-center",
      customizable: true
    }
  },

  pediatrics: {
    name: "Plantilla Pediátrica",
    description: "Plantilla especializada para consultas pediátricas",
    category: "pediatrics",
    sections: [
      {
        id: "patient_info",
        title: "Información del Menor",
        order: 1,
        customizable: true,
        fields: [
          { id: "firstName", type: "text", required: true, customizable: false },
          { id: "lastName", type: "text", required: true, customizable: false },
          { id: "dateOfBirth", type: "date", required: true, customizable: false },
          { id: "gender", type: "select", required: true, customizable: false },
          { id: "currentWeight", type: "number", required: true, customizable: true },
          { id: "currentHeight", type: "number", required: true, customizable: true },
          { id: "headCircumference", type: "number", required: false, customizable: true }
        ]
      },
      {
        id: "guardian_info",
        title: "Información del Tutor",
        order: 2,
        customizable: true,
        fields: [
          { id: "guardianName", type: "text", required: true, customizable: false },
          { id: "relationship", type: "select", required: true, customizable: false },
          { id: "guardianPhone", type: "tel", required: true, customizable: false },
          { id: "guardianEmail", type: "email", required: false, customizable: true }
        ]
      },
      {
        id: "developmental_history",
        title: "Historia del Desarrollo",
        order: 3,
        customizable: true,
        fields: [
          { id: "birthHistory", type: "textarea", required: false, customizable: true },
          { id: "developmentalMilestones", type: "multiselect", required: false, customizable: true },
          { id: "vaccinations", type: "multiselect", required: true, customizable: true },
          { id: "feedingHistory", type: "textarea", required: false, customizable: true }
        ]
      }
    ],
    printSettings: {
      marginLeft: 2.2,
      marginTop: 4.5,
      fontSize: 9,
      logoPosition: "top-right",
      customizable: true
    }
  }
};

/**
 * GET /api/v1/formx/customizable-templates/base-templates
 * Get available base template configurations
 */
router.get('/base-templates',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  async (req, res) => {
    try {
      const baseTemplates = Object.keys(BASE_TEMPLATE_CONFIGS).map(key => ({
        id: key,
        ...BASE_TEMPLATE_CONFIGS[key],
        sectionsCount: BASE_TEMPLATE_CONFIGS[key].sections.length,
        fieldsCount: BASE_TEMPLATE_CONFIGS[key].sections.reduce((sum, section) => sum + section.fields.length, 0),
        customizableFields: BASE_TEMPLATE_CONFIGS[key].sections.reduce((sum, section) => 
          sum + section.fields.filter(field => field.customizable).length, 0)
      }));

      res.json({
        success: true,
        data: baseTemplates,
        message: 'Base template configurations retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get base template configurations', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve base templates',
        message: 'An error occurred while retrieving base template configurations'
      });
    }
  }
);

/**
 * POST /api/v1/formx/customizable-templates/create-custom
 * Create a custom template based on a base template with user modifications
 */
router.post('/create-custom',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:forms']),
  [
    body('baseTemplateId').isIn(Object.keys(BASE_TEMPLATE_CONFIGS)).withMessage('Invalid base template ID'),
    body('customizations').isObject().withMessage('Customizations must be an object'),
    body('templateName').isString().isLength({ min: 2, max: 100 }).withMessage('Template name must be 2-100 characters'),
    body('description').optional().isString().isLength({ max: 500 }),
    body('isPrivate').optional().isBoolean()
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
        baseTemplateId,
        customizations,
        templateName,
        description,
        isPrivate = false
      } = req.body;

      const userId = req.user?.id;
      const baseTemplate = BASE_TEMPLATE_CONFIGS[baseTemplateId];

      // Apply customizations to base template
      const customizedTemplate = applyCustomizations(baseTemplate, customizations);

      // Create custom template in database
      const customTemplate = await executeTransaction([
        // Create the form
        (prisma) => prisma.form.create({
          data: {
            id: uuidv4(),
            name: templateName,
            description: description || `Plantilla personalizada basada en ${baseTemplate.name}`,
            category: `${baseTemplate.category}_custom`,
            isTemplate: true,
            isPrivate: isPrivate,
            baseTemplateId: baseTemplateId,
            estimatedDuration: calculateEstimatedDuration(customizedTemplate),
            isActive: true,
            createdBy: userId,
            customizationData: customizations
          }
        }),
        // Create form version with customized schema
        (prisma, results) => {
          const formId = results[0].id;
          return prisma.formVersion.create({
            data: {
              id: uuidv4(),
              formId: formId,
              versionNumber: 1,
              formSchema: {
                sections: customizedTemplate.sections,
                printSettings: customizedTemplate.printSettings,
                baseTemplate: baseTemplateId,
                customizations: customizations
              },
              validationRules: generateValidationRules(customizedTemplate),
              isPublished: true,
              publishedAt: new Date(),
              publishedBy: userId
            }
          });
        }
      ], 'createCustomTemplate');

      // Update form with current version
      await executeQuery(
        (prisma) => prisma.form.update({
          where: { id: customTemplate[0].id },
          data: { currentVersionId: customTemplate[1].id }
        }),
        'updateFormWithVersion'
      );

      // Log template creation
      logger.info('Custom template created', {
        templateId: customTemplate[0].id,
        templateName: templateName,
        baseTemplate: baseTemplateId,
        createdBy: userId,
        isPrivate: isPrivate,
        customizationsApplied: Object.keys(customizations).length
      });

      res.status(201).json({
        success: true,
        message: 'Custom template created successfully',
        data: {
          template: {
            ...customTemplate[0],
            version: customTemplate[1]
          },
          customizedSchema: customizedTemplate
        }
      });

    } catch (error) {
      logger.error('Failed to create custom template', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create custom template',
        message: 'An error occurred while creating the custom template'
      });
    }
  }
);

/**
 * GET /api/v1/formx/customizable-templates/user-templates
 * Get user's custom templates
 */
router.get('/user-templates',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:forms']),
  [
    query('includeShared').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const includeShared = req.query.includeShared === 'true';

      const whereClause = {
        isTemplate: true,
        OR: [
          { createdBy: userId },
          ...(includeShared ? [{ isPrivate: false }] : [])
        ]
      };

      const userTemplates = await executeQuery(
        (prisma) => prisma.form.findMany({
          where: whereClause,
          include: {
            currentVersion: {
              select: {
                versionNumber: true,
                formSchema: true,
                publishedAt: true
              }
            },
            creator: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                patientForms: true
              }
            }
          },
          orderBy: [
            { createdAt: 'desc' }
          ]
        }),
        'getUserCustomTemplates'
      );

      // Process templates to include usage statistics
      const processedTemplates = userTemplates.map(template => ({
        ...template,
        isOwnTemplate: template.createdBy === userId,
        usageCount: template._count.patientForms,
        baseTemplate: template.baseTemplateId,
        lastModified: template.currentVersion?.publishedAt || template.createdAt
      }));

      res.json({
        success: true,
        data: processedTemplates,
        summary: {
          total: processedTemplates.length,
          ownTemplates: processedTemplates.filter(t => t.isOwnTemplate).length,
          sharedTemplates: processedTemplates.filter(t => !t.isOwnTemplate).length
        }
      });

    } catch (error) {
      logger.error('Failed to get user templates', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user templates',
        message: 'An error occurred while retrieving user templates'
      });
    }
  }
);

/**
 * PUT /api/v1/formx/customizable-templates/:id/customize
 * Modify an existing custom template
 */
router.put('/:id/customize',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:forms']),
  [
    param('id').isUUID().withMessage('Invalid template ID format'),
    body('customizations').isObject().withMessage('Customizations must be an object'),
    body('versionComment').optional().isString().isLength({ max: 200 })
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

      const { id } = req.params;
      const { customizations, versionComment } = req.body;
      const userId = req.user?.id;

      // Get existing template
      const existingTemplate = await executeQuery(
        (prisma) => prisma.form.findUnique({
          where: { id },
          include: {
            currentVersion: true
          }
        }),
        `getExistingTemplate(${id})`
      );

      if (!existingTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Check permissions
      if (existingTemplate.createdBy !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Permission denied',
          message: 'You can only modify your own templates'
        });
      }

      // Get base template and apply new customizations
      const baseTemplate = BASE_TEMPLATE_CONFIGS[existingTemplate.baseTemplateId];
      const customizedTemplate = applyCustomizations(baseTemplate, customizations);

      // Create new version
      const newVersion = await executeQuery(
        (prisma) => prisma.formVersion.create({
          data: {
            id: uuidv4(),
            formId: id,
            versionNumber: existingTemplate.currentVersion.versionNumber + 1,
            formSchema: {
              sections: customizedTemplate.sections,
              printSettings: customizedTemplate.printSettings,
              baseTemplate: existingTemplate.baseTemplateId,
              customizations: customizations
            },
            validationRules: generateValidationRules(customizedTemplate),
            isPublished: true,
            publishedAt: new Date(),
            publishedBy: userId,
            versionComment: versionComment
          }
        }),
        'createNewTemplateVersion'
      );

      // Update template with new version and customization data
      const updatedTemplate = await executeQuery(
        (prisma) => prisma.form.update({
          where: { id },
          data: {
            currentVersionId: newVersion.id,
            customizationData: customizations,
            updatedAt: new Date()
          },
          include: {
            currentVersion: true
          }
        }),
        'updateTemplateVersion'
      );

      // Log template modification
      logger.info('Template customizations updated', {
        templateId: id,
        newVersionNumber: newVersion.versionNumber,
        modifiedBy: userId,
        customizationsCount: Object.keys(customizations).length
      });

      res.json({
        success: true,
        message: 'Template customizations updated successfully',
        data: {
          template: updatedTemplate,
          newVersion: newVersion,
          customizedSchema: customizedTemplate
        }
      });

    } catch (error) {
      logger.error('Failed to update template customizations', {
        error: error.message,
        templateId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update template',
        message: 'An error occurred while updating template customizations'
      });
    }
  }
);

/**
 * Helper functions
 */

function applyCustomizations(baseTemplate, customizations) {
  const customized = JSON.parse(JSON.stringify(baseTemplate)); // Deep clone

  // Apply section customizations
  if (customizations.sections) {
    customizations.sections.forEach(sectionCustomization => {
      const section = customized.sections.find(s => s.id === sectionCustomization.id);
      if (section && section.customizable) {
        // Apply section-level changes
        if (sectionCustomization.title) section.title = sectionCustomization.title;
        if (sectionCustomization.order !== undefined) section.order = sectionCustomization.order;
        if (sectionCustomization.hidden !== undefined) section.hidden = sectionCustomization.hidden;

        // Apply field-level changes
        if (sectionCustomization.fields) {
          sectionCustomization.fields.forEach(fieldCustomization => {
            const field = section.fields.find(f => f.id === fieldCustomization.id);
            if (field && field.customizable) {
              Object.assign(field, fieldCustomization);
            }
          });
        }

        // Add new fields if specified
        if (sectionCustomization.newFields) {
          section.fields.push(...sectionCustomization.newFields);
        }
      }
    });
  }

  // Apply print settings customizations
  if (customizations.printSettings && customized.printSettings.customizable) {
    Object.assign(customized.printSettings, customizations.printSettings);
  }

  // Apply global customizations
  if (customizations.globalSettings) {
    customized.globalSettings = { ...customized.globalSettings, ...customizations.globalSettings };
  }

  return customized;
}

function generateValidationRules(template) {
  const rules = {
    requiredFields: [],
    fieldValidations: {}
  };

  template.sections.forEach(section => {
    if (!section.hidden) {
      section.fields.forEach(field => {
        if (field.required) {
          rules.requiredFields.push(field.id);
        }

        if (field.validation) {
          rules.fieldValidations[field.id] = field.validation;
        }
      });
    }
  });

  return rules;
}

function calculateEstimatedDuration(template) {
  const fieldCount = template.sections.reduce((sum, section) => 
    sum + (section.hidden ? 0 : section.fields.length), 0);
  
  // Estimate 30 seconds per field on average
  return Math.max(5, Math.round(fieldCount * 0.5));
}

module.exports = router;