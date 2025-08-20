const express = require('express');
const router = express.Router();
const axios = require('axios');
const tokenService = require('../services/token-service');
const hubLinkMiddleware = require('../middleware/hub-link-middleware');
const auditLogger = require('../../shared/utils/audit-logger');

// =============================================================================
// CONFIGURACIÓN DE SERVICIOS
// =============================================================================

const serviceConfig = {
    clinimetrix: {
        baseUrl: process.env.CLINIMETRIX_URL || 'http://localhost:3001',
        timeout: 30000
    },
    expedix: {
        baseUrl: process.env.EXPEDIX_URL || 'http://localhost:3002',
        timeout: 30000
    },
    formx: {
        baseUrl: process.env.FORMX_URL || 'http://localhost:3003',
        timeout: 30000
    },
    resources: {
        baseUrl: process.env.RESOURCES_URL || 'http://localhost:3004',
        timeout: 30000
    }
};

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

async function makeHubRequest(hubName, endpoint, method = 'GET', data = null, headers = {}) {
    const config = serviceConfig[hubName];
    if (!config) {
        throw new Error(`Hub configuration not found: ${hubName}`);
    }

    const requestConfig = {
        method,
        url: `${config.baseUrl}${endpoint}`,
        timeout: config.timeout,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestConfig.data = data;
    }

    try {
        const response = await axios(requestConfig);
        return response.data;
    } catch (error) {
        console.error(`Hub request failed - ${hubName}:`, error.message);
        throw error;
    }
}

// =============================================================================
// GENERACIÓN DE TOKENS DE ENLACE
// =============================================================================

// Generar token para Clinimetrix → Expedix
router.post('/generate-token/clinimetrix-to-expedix', async (req, res) => {
    try {
        const { userId, patientId, administrationId, permissions } = req.body;

        if (!userId || !patientId || !administrationId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, patientId, administrationId'
            });
        }

        const token = tokenService.generateClinimetrixToExpedixToken(
            userId, 
            patientId, 
            administrationId, 
            permissions
        );

        auditLogger.logTokenGeneration({
            tokenType: 'clinimetrix-to-expedix',
            userId,
            entityId: administrationId,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            token,
            expiresIn: 1800,
            operation: 'attach_assessment_results'
        });
    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate hub link token'
        });
    }
});

// Generar token para Expedix → Clinimetrix
router.post('/generate-token/expedix-to-clinimetrix', async (req, res) => {
    try {
        const { userId, patientId, consultationId, scaleIds, permissions } = req.body;

        if (!userId || !patientId || !consultationId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, patientId, consultationId'
            });
        }

        const token = tokenService.generateExpedixToClinimetrixToken(
            userId, 
            patientId, 
            consultationId, 
            scaleIds, 
            permissions
        );

        auditLogger.logTokenGeneration({
            tokenType: 'expedix-to-clinimetrix',
            userId,
            entityId: consultationId,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            token,
            expiresIn: 3600,
            operation: 'request_assessment'
        });
    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate hub link token'
        });
    }
});

// Generar token para FormX integration
router.post('/generate-token/to-formx', async (req, res) => {
    try {
        const { userId, sourceHub, entityId, formType, permissions } = req.body;

        if (!userId || !sourceHub || !entityId || !formType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, sourceHub, entityId, formType'
            });
        }

        const token = tokenService.generateFormXIntegrationToken(
            userId, 
            sourceHub, 
            entityId, 
            formType, 
            permissions
        );

        auditLogger.logTokenGeneration({
            tokenType: 'to-formx',
            userId,
            entityId,
            sourceHub,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            token,
            expiresIn: 7200,
            operation: 'generate_custom_form'
        });
    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate hub link token'
        });
    }
});

// Generar token para vista unificada del paciente
router.post('/generate-token/patient-timeline', async (req, res) => {
    try {
        const { userId, patientId, requestingHub, permissions } = req.body;

        if (!userId || !patientId || !requestingHub) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, patientId, requestingHub'
            });
        }

        const token = tokenService.generatePatientTimelineToken(
            userId, 
            patientId, 
            requestingHub, 
            permissions
        );

        auditLogger.logTokenGeneration({
            tokenType: 'patient-timeline',
            userId,
            entityId: patientId,
            requestingHub,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            token,
            expiresIn: 900,
            operation: 'get_patient_timeline'
        });
    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate hub link token'
        });
    }
});

// =============================================================================
// OPERACIONES INTER-HUB PROTEGIDAS
// =============================================================================

// Middleware común para todas las operaciones
router.use('/operation/*', [
    hubLinkMiddleware.validateHubLinkToken,
    hubLinkMiddleware.logHubInteraction
]);

// Clinimetrix → Expedix: Adjuntar resultados de evaluación
router.post('/operation/clinimetrix-to-expedix/attach-results',
    hubLinkMiddleware.validateHubAccess(['clinimetrix'], ['expedix']),
    hubLinkMiddleware.validateOperation(['attach_assessment_results']),
    hubLinkMiddleware.requirePermission('read_assessment'),
    hubLinkMiddleware.requirePermission('write_medical_history'),
    async (req, res) => {
        try {
            const { administrationId } = req.hubLink;
            const { targetPatientId, consultationId, notes } = req.body;

            // 1. Obtener resultados de Clinimetrix
            const assessmentResults = await makeHubRequest(
                'clinimetrix', 
                `/api/clinical-scales/administration/${administrationId}/results`
            );

            if (!assessmentResults.success) {
                return res.status(404).json({
                    success: false,
                    error: 'Assessment results not found'
                });
            }

            // 2. Transformar datos para Expedix
            const expedixData = {
                patientId: targetPatientId,
                consultationId: consultationId,
                assessmentType: 'clinical_scale',
                assessmentData: {
                    scaleId: assessmentResults.data.scaleId,
                    scaleName: assessmentResults.data.scaleName,
                    scores: assessmentResults.data.calculatedScores,
                    interpretation: assessmentResults.data.interpretation,
                    administrationDate: assessmentResults.data.completedAt,
                    administeredBy: req.hubLink.userId
                },
                notes: notes || `Evaluación ${assessmentResults.data.scaleName} adjuntada desde Clinimetrix`,
                attachedBy: req.hubLink.userId,
                attachedAt: new Date().toISOString()
            };

            // 3. Enviar a Expedix
            const expedixResponse = await makeHubRequest(
                'expedix',
                '/api/medical-history/attach-assessment',
                'POST',
                expedixData
            );

            res.json({
                success: true,
                data: {
                    assessmentId: administrationId,
                    expedixRecordId: expedixResponse.data?.recordId,
                    status: 'attached_successfully'
                },
                message: 'Assessment results successfully attached to medical history'
            });

        } catch (error) {
            console.error('Clinimetrix to Expedix operation failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to attach assessment results to medical history'
            });
        }
    }
);

// Expedix → Clinimetrix: Solicitar evaluación
router.post('/operation/expedix-to-clinimetrix/request-assessment',
    hubLinkMiddleware.validateHubAccess(['expedix'], ['clinimetrix']),
    hubLinkMiddleware.validateOperation(['request_assessment']),
    hubLinkMiddleware.requirePermission('read_patient'),
    hubLinkMiddleware.requirePermission('create_assessment'),
    async (req, res) => {
        try {
            const { entityId: consultationId } = req.hubLink;
            const { patientId, scaleIds, priority, instructions } = req.body;

            // 1. Validar que la consulta existe en Expedix
            const consultation = await makeHubRequest(
                'expedix',
                `/api/consultations/${consultationId}`
            );

            if (!consultation.success) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found'
                });
            }

            // 2. Crear sesión de evaluación en Clinimetrix
            const assessmentData = {
                patientId: patientId,
                requestedBy: req.hubLink.userId,
                sourceConsultation: consultationId,
                sourceHub: 'expedix',
                scaleIds: scaleIds || [],
                priority: priority || 'medium',
                instructions: instructions || 'Evaluación solicitada desde consulta médica',
                requestedAt: new Date().toISOString()
            };

            const clinimetrixResponse = await makeHubRequest(
                'clinimetrix',
                '/api/assessment-sessions/create-from-consultation',
                'POST',
                assessmentData
            );

            res.json({
                success: true,
                data: {
                    sessionId: clinimetrixResponse.data?.sessionId,
                    consultationId: consultationId,
                    status: 'assessment_requested',
                    assessmentUrl: clinimetrixResponse.data?.assessmentUrl
                },
                message: 'Clinical assessment successfully requested'
            });

        } catch (error) {
            console.error('Expedix to Clinimetrix operation failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to request clinical assessment'
            });
        }
    }
);

// Cualquier Hub → FormX: Generar formulario personalizado
router.post('/operation/to-formx/generate-form',
    hubLinkMiddleware.validateHubAccess([], ['formx']),
    hubLinkMiddleware.validateOperation(['generate_custom_form']),
    hubLinkMiddleware.requirePermission('create_form'),
    async (req, res) => {
        try {
            const { sourceHub, entityId } = req.hubLink;
            const { formType, templateId, customizations, targetAudience } = req.body;

            const formData = {
                sourceHub: sourceHub,
                sourceEntityId: entityId,
                formType: formType,
                templateId: templateId,
                customizations: customizations || {},
                targetAudience: targetAudience || 'patient',
                generatedBy: req.hubLink.userId,
                generatedAt: new Date().toISOString()
            };

            const formxResponse = await makeHubRequest(
                'formx',
                '/api/forms/generate-from-hub',
                'POST',
                formData
            );

            res.json({
                success: true,
                data: {
                    formId: formxResponse.data?.formId,
                    formUrl: formxResponse.data?.formUrl,
                    sourceEntity: entityId,
                    status: 'form_generated'
                },
                message: 'Custom form successfully generated'
            });

        } catch (error) {
            console.error('FormX generation operation failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate custom form'
            });
        }
    }
);

// Vista unificada del paciente
router.get('/operation/patient-timeline/:patientId',
    hubLinkMiddleware.validateOperation(['get_patient_timeline']),
    hubLinkMiddleware.requirePermission('read_patient_data'),
    async (req, res) => {
        try {
            const { patientId } = req.params;
            const { requestingHub } = req.hubLink;

            const timelineData = {
                patientId: patientId,
                requestingHub: requestingHub,
                expedix: {},
                clinimetrix: {},
                formx: {},
                resources: {}
            };

            // Recopilar datos de cada hub en paralelo
            const hubRequests = [];

            // Expedix - Datos del paciente y consultas
            hubRequests.push(
                makeHubRequest('expedix', `/api/patients/${patientId}/timeline`)
                    .then(data => timelineData.expedix = data.data || {})
                    .catch(err => timelineData.expedix = { error: err.message })
            );

            // Clinimetrix - Evaluaciones
            hubRequests.push(
                makeHubRequest('clinimetrix', `/api/patients/${patientId}/assessments`)
                    .then(data => timelineData.clinimetrix = data.data || {})
                    .catch(err => timelineData.clinimetrix = { error: err.message })
            );

            // FormX - Formularios completados
            hubRequests.push(
                makeHubRequest('formx', `/api/patients/${patientId}/submissions`)
                    .then(data => timelineData.formx = data.data || {})
                    .catch(err => timelineData.formx = { error: err.message })
            );

            // Esperar todas las respuestas
            await Promise.all(hubRequests);

            res.json({
                success: true,
                data: timelineData,
                message: 'Patient timeline data retrieved successfully'
            });

        } catch (error) {
            console.error('Patient timeline operation failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve patient timeline'
            });
        }
    }
);

module.exports = router;