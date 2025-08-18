/**
 * =====================================================================
 * MINDHUB - ENDPOINTS ÚNICOS Y CONSOLIDADOS
 * FUENTE DE VERDAD PARA TODAS LAS APIs
 * =====================================================================
 * 
 * Este archivo define TODOS los endpoints del sistema MindHub
 * de manera única y consistente. NO debe haber duplicados.
 */

const express = require('express');
const router = express.Router();

// =====================================================================
// CONFIGURACIÓN BASE
// =====================================================================

const API_VERSION = 'v2.0';
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://mindhub-production.up.railway.app'
  : 'http://localhost:3002';

// =====================================================================
// HEALTH CHECK Y INFORMACIÓN DEL SISTEMA
// =====================================================================

/**
 * GET /api/health
 * Health check general del sistema
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    services: {
      expedix: 'active',
      clinimetrix_pro: 'active',
      formx: 'active',
      database: 'connected',
      auth: 'clerk'
    }
  });
});

/**
 * GET /api/
 * Información general de la API
 */
router.get('/', (req, res) => {
  res.json({
    name: 'MindHub Healthcare Platform API',
    version: API_VERSION,
    description: 'Unified API for mental healthcare management',
    endpoints: {
      // Expedix endpoints
      expedix: {
        base: '/api/expedix',
        patients: '/api/expedix/patients',
        consultations: '/api/expedix/consultations',
        medical_history: '/api/expedix/medical-history'
      },
      // ClinimetrixPro endpoints
      clinimetrix: {
        base: '/api/clinimetrix-pro',
        templates: '/api/clinimetrix-pro/templates',
        assessments: '/api/clinimetrix-pro/assessments',
        remote_assessments: '/api/clinimetrix-pro/remote-assessments'
      },
      // FormX endpoints
      formx: {
        base: '/api/formx',
        templates: '/api/formx/templates',
        assignments: '/api/formx/assignments'
      }
    }
  });
});

// =====================================================================
// EXPEDIX - GESTIÓN DE PACIENTES
// =====================================================================

const expedixRouter = express.Router();

// Pacientes
expedixRouter.get('/patients', async (req, res) => {
  // Implementar lógica
  res.json({ patients: [], total: 0 });
});

expedixRouter.post('/patients', async (req, res) => {
  // Implementar lógica
  res.status(201).json({ message: 'Patient created' });
});

expedixRouter.get('/patients/:id', async (req, res) => {
  // Implementar lógica
  res.json({ patient: null });
});

expedixRouter.put('/patients/:id', async (req, res) => {
  // Implementar lógica
  res.json({ message: 'Patient updated' });
});

expedixRouter.delete('/patients/:id', async (req, res) => {
  // Implementar lógica
  res.json({ message: 'Patient deleted' });
});

// Historial médico
expedixRouter.get('/patients/:patientId/medical-history', async (req, res) => {
  // Implementar lógica
  res.json({ history: [] });
});

expedixRouter.post('/patients/:patientId/medical-history', async (req, res) => {
  // Implementar lógica
  res.status(201).json({ message: 'Medical history added' });
});

// Consultas
expedixRouter.get('/patients/:patientId/consultations', async (req, res) => {
  // Implementar lógica
  res.json({ consultations: [] });
});

expedixRouter.post('/patients/:patientId/consultations', async (req, res) => {
  // Implementar lógica
  res.status(201).json({ message: 'Consultation created' });
});

expedixRouter.get('/consultations/:id', async (req, res) => {
  // Implementar lógica
  res.json({ consultation: null });
});

expedixRouter.put('/consultations/:id', async (req, res) => {
  // Implementar lógica
  res.json({ message: 'Consultation updated' });
});

// =====================================================================
// CLINIMETRIX PRO - EVALUACIONES CLÍNICAS
// =====================================================================

const clinimetrixRouter = express.Router();

// Registry de escalas
clinimetrixRouter.get('/templates/catalog', async (req, res) => {
  // Implementar lógica
  res.json({ templates: [], total: 0, categories: [] });
});

clinimetrixRouter.get('/templates/:id', async (req, res) => {
  // Implementar lógica
  res.json({ template: null });
});

// Evaluaciones
clinimetrixRouter.post('/assessments', async (req, res) => {
  // Implementar lógica
  res.status(201).json({ assessmentId: 'new-assessment-id' });
});

clinimetrixRouter.get('/assessments/:id', async (req, res) => {
  // Implementar lógica
  res.json({ assessment: null });
});

clinimetrixRouter.put('/assessments/:id/responses', async (req, res) => {
  // Implementar lógica
  res.json({ message: 'Responses saved' });
});

clinimetrixRouter.post('/assessments/:id/complete', async (req, res) => {
  // Implementar lógica
  res.json({ scores: {}, interpretation: {} });
});

clinimetrixRouter.get('/patients/:patientId/assessments', async (req, res) => {
  // Implementar lógica
  res.json({ assessments: [] });
});

// Evaluaciones remotas
clinimetrixRouter.post('/remote-assessments', async (req, res) => {
  // Implementar lógica
  res.status(201).json({ 
    accessToken: 'remote-token',
    link: `${BASE_URL}/assessment/remote-token`
  });
});

clinimetrixRouter.get('/remote-assessments/:token', async (req, res) => {
  // Implementar lógica
  res.json({ assessment: null });
});

clinimetrixRouter.post('/remote-assessments/:token/submit', async (req, res) => {
  // Implementar lógica
  res.json({ message: 'Assessment submitted' });
});

// =====================================================================
// FORMX - FORMULARIOS DINÁMICOS
// =====================================================================

const formxRouter = express.Router();

// Templates de formularios
formxRouter.get('/templates', async (req, res) => {
  // Implementar lógica
  res.json({ templates: [], total: 0 });
});

formxRouter.post('/templates', async (req, res) => {
  // Implementar lógica
  res.status(201).json({ templateId: 'new-template-id' });
});

formxRouter.get('/templates/:id', async (req, res) => {
  // Implementar lógica
  res.json({ template: null });
});

formxRouter.put('/templates/:id', async (req, res) => {
  // Implementar lógica
  res.json({ message: 'Template updated' });
});

formxRouter.delete('/templates/:id', async (req, res) => {
  // Implementar lógica
  res.json({ message: 'Template deleted' });
});

// Asignaciones de formularios
formxRouter.post('/assignments', async (req, res) => {
  // Implementar lógica
  res.status(201).json({
    assignmentId: 'new-assignment-id',
    accessToken: 'form-token',
    link: `${BASE_URL}/form/form-token`
  });
});

formxRouter.get('/assignments/:id', async (req, res) => {
  // Implementar lógica
  res.json({ assignment: null });
});

formxRouter.get('/patients/:patientId/assignments', async (req, res) => {
  // Implementar lógica
  res.json({ assignments: [] });
});

// Formularios públicos (sin auth)
formxRouter.get('/form/:token', async (req, res) => {
  // Implementar lógica
  res.json({ form: null });
});

formxRouter.post('/form/:token/submit', async (req, res) => {
  // Implementar lógica
  res.json({ message: 'Form submitted' });
});

// Integración con Expedix
formxRouter.post('/assignments/:id/sync-expedix', async (req, res) => {
  // Implementar lógica
  res.json({ message: 'Synced to Expedix' });
});

// =====================================================================
// MONTAJE DE RUTAS EN EL ROUTER PRINCIPAL
// =====================================================================

router.use('/expedix', expedixRouter);
router.use('/clinimetrix-pro', clinimetrixRouter);
router.use('/formx', formxRouter);

// =====================================================================
// MIDDLEWARE DE ERROR HANDLING
// =====================================================================

router.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// =====================================================================
// 404 HANDLER
// =====================================================================

router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      health: 'GET /api/health',
      expedix: {
        patients: 'GET /api/expedix/patients',
        patient: 'GET /api/expedix/patients/:id',
        consultations: 'GET /api/expedix/patients/:patientId/consultations'
      },
      clinimetrix: {
        catalog: 'GET /api/clinimetrix-pro/templates/catalog',
        template: 'GET /api/clinimetrix-pro/templates/:id',
        assessments: 'POST /api/clinimetrix-pro/assessments'
      },
      formx: {
        templates: 'GET /api/formx/templates',
        assignments: 'POST /api/formx/assignments'
      }
    }
  });
});

module.exports = router;

// =====================================================================
// DOCUMENTACIÓN DE ENDPOINTS
// =====================================================================

/*

EXPEDIX ENDPOINTS:
==================
GET    /api/expedix/patients                     - Listar pacientes
POST   /api/expedix/patients                     - Crear paciente
GET    /api/expedix/patients/:id                 - Obtener paciente
PUT    /api/expedix/patients/:id                 - Actualizar paciente
DELETE /api/expedix/patients/:id                 - Eliminar paciente
GET    /api/expedix/patients/:id/medical-history - Historial médico
POST   /api/expedix/patients/:id/medical-history - Agregar historial
GET    /api/expedix/patients/:id/consultations   - Consultas del paciente
POST   /api/expedix/patients/:id/consultations   - Nueva consulta
GET    /api/expedix/consultations/:id            - Obtener consulta
PUT    /api/expedix/consultations/:id            - Actualizar consulta

CLINIMETRIX PRO ENDPOINTS:
==========================
GET    /api/clinimetrix-pro/templates/catalog    - Catálogo de escalas
GET    /api/clinimetrix-pro/templates/:id        - Obtener template
POST   /api/clinimetrix-pro/assessments          - Nueva evaluación
GET    /api/clinimetrix-pro/assessments/:id      - Obtener evaluación
PUT    /api/clinimetrix-pro/assessments/:id/responses - Guardar respuestas
POST   /api/clinimetrix-pro/assessments/:id/complete  - Completar evaluación
GET    /api/clinimetrix-pro/patients/:id/assessments  - Evaluaciones del paciente
POST   /api/clinimetrix-pro/remote-assessments   - Crear evaluación remota
GET    /api/clinimetrix-pro/remote-assessments/:token - Obtener evaluación remota
POST   /api/clinimetrix-pro/remote-assessments/:token/submit - Enviar evaluación

FORMX ENDPOINTS:
================
GET    /api/formx/templates                      - Listar templates
POST   /api/formx/templates                      - Crear template
GET    /api/formx/templates/:id                  - Obtener template
PUT    /api/formx/templates/:id                  - Actualizar template
DELETE /api/formx/templates/:id                  - Eliminar template
POST   /api/formx/assignments                    - Asignar formulario
GET    /api/formx/assignments/:id                - Obtener asignación
GET    /api/formx/patients/:id/assignments       - Asignaciones del paciente
GET    /api/formx/form/:token                    - Formulario público
POST   /api/formx/form/:token/submit             - Enviar formulario
POST   /api/formx/assignments/:id/sync-expedix   - Sincronizar con Expedix

*/