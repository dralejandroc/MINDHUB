/**
 * =====================================================================
 * MINDHUB - ENDPOINTS ÚNICOS Y CONSOLIDADOS (POST-MIGRACIÓN VERCEL)
 * FUENTE DE VERDAD PARA TODAS LAS APIs
 * =====================================================================
 * 
 * Este archivo define TODOS los endpoints del sistema MindHub 
 * después de la migración completa a Vercel + Supabase + Django.
 * 
 * ARQUITECTURA ACTUAL:
 * - Frontend: Next.js en Vercel (https://mindhub.cloud)
 * - API Routes: Next.js en Vercel (/api/*)
 * - Backend Django: Vercel (https://mindhub-django-backend.vercel.app)
 * - Database: Supabase PostgreSQL
 * - Auth: Supabase Auth (SIN Clerk)
 * 
 * ❌ OBSOLETO: Railway, Clerk, MySQL
 * ✅ ACTUAL: Vercel, Supabase, PostgreSQL, Django híbrido
 */

const express = require('express');
const router = express.Router();

// =====================================================================
// CONFIGURACIÓN BASE - NUEVA ARQUITECTURA VERCEL + SUPABASE
// =====================================================================

const API_VERSION = 'v3.0-post-migration';

// URLs de producción actuales
const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://mindhub.cloud'
  : 'http://localhost:3000';

const DJANGO_BACKEND_URL = process.env.NODE_ENV === 'production'
  ? 'https://mindhub-django-backend.vercel.app'
  : 'http://localhost:8000';

// Base URL para API Routes de Next.js
const API_ROUTES_BASE = process.env.NODE_ENV === 'production'
  ? 'https://mindhub.cloud/api'
  : 'http://localhost:3000/api';

// =====================================================================
// HEALTH CHECK Y INFORMACIÓN DEL SISTEMA
// =====================================================================

/**
 * GET /api/health
 * Health check general del sistema - ARQUITECTURA NUEVA
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    architecture: {
      frontend: 'Next.js on Vercel',
      backend: 'Django on Vercel (hybrid)',
      database: 'Supabase PostgreSQL',
      auth: 'Supabase Auth',
      deployment: 'Vercel',
      legacy_removed: ['Railway', 'Clerk', 'MySQL']
    },
    services: {
      expedix: 'active',
      clinimetrix_pro: 'active - hybrid React+Django',
      formx: 'planned - Django forms',
      agenda: 'active',
      database: 'supabase-postgresql',
      auth: 'supabase-auth'
    },
    urls: {
      frontend: FRONTEND_URL,
      django_backend: DJANGO_BACKEND_URL,
      api_routes: API_ROUTES_BASE
    }
  });
});

/**
 * GET /api/
 * Información general de la API - POST-MIGRACIÓN VERCEL
 */
router.get('/', (req, res) => {
  res.json({
    name: 'MindHub Healthcare Platform API',
    version: API_VERSION,
    description: 'Unified API for mental healthcare management - Vercel + Supabase architecture',
    migration_status: 'COMPLETED - Railway/Clerk/MySQL removed, Vercel/Supabase/PostgreSQL active',
    architecture: {
      type: 'Hybrid React + Django',
      frontend: 'Next.js on Vercel (https://mindhub.cloud)',
      api_routes: 'Next.js API Routes on Vercel (/api/*)',
      backend: 'Django on Vercel (ClinimetrixPro hybrid)',
      database: 'Supabase PostgreSQL',
      auth: 'Supabase Auth'
    },
    endpoints: {
      // Expedix endpoints - via Next.js API Routes
      expedix: {
        base: `${API_ROUTES_BASE}/expedix`,
        patients: `${API_ROUTES_BASE}/expedix/patients`,
        consultations: `${API_ROUTES_BASE}/expedix/consultations`,
        medical_history: `${API_ROUTES_BASE}/expedix/medical-history`,
        prescriptions: `${API_ROUTES_BASE}/expedix/prescriptions`,
        appointments: `${API_ROUTES_BASE}/expedix/appointments`
      },
      // ClinimetrixPro endpoints - HÍBRIDO React + Django
      clinimetrix: {
        base: `${API_ROUTES_BASE}/clinimetrix-pro`,
        selector: `${FRONTEND_URL}/hubs/clinimetrix`, // React UI
        templates: `${API_ROUTES_BASE}/clinimetrix-pro/templates`,
        assessments: `${DJANGO_BACKEND_URL}/assessments/`, // Django backend
        focused_take: `${DJANGO_BACKEND_URL}/assessments/{id}/focused-take/`, // Django evaluation
        bridge: `${API_ROUTES_BASE}/clinimetrix-pro/bridge`, // React <-> Django bridge
        catalog: `${DJANGO_BACKEND_URL}/scales/api/catalog/` // Django catalog
      },
      // FormX endpoints - PLANIFICADO para Django
      formx: {
        base: `${DJANGO_BACKEND_URL}/formx/`,
        templates: `${DJANGO_BACKEND_URL}/formx/templates/`,
        assignments: `${DJANGO_BACKEND_URL}/formx/assignments/`,
        status: 'planned - Django forms implementation'
      },
      // Agenda endpoints - via Next.js API Routes
      agenda: {
        base: `${API_ROUTES_BASE}/agenda`,
        appointments: `${API_ROUTES_BASE}/agenda/appointments`,
        daily_stats: `${API_ROUTES_BASE}/agenda/daily-stats`,
        waiting_list: `${API_ROUTES_BASE}/agenda/waiting-list`
      },
      // System endpoints
      system: {
        health: `${API_ROUTES_BASE}/health`,
        version: `${API_ROUTES_BASE}/version`,
        auth: 'Supabase Auth - https://jvbcpldzoyicefdtnwkd.supabase.co'
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
    link: `${DJANGO_BACKEND_URL}/assessment/remote-token`
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
    link: `${DJANGO_BACKEND_URL}/form/form-token`
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
// DOCUMENTACIÓN DE ENDPOINTS - POST-MIGRACIÓN VERCEL + SUPABASE
// =====================================================================

/*

🚀 ARQUITECTURA NUEVA (POST-MIGRACIÓN):
=======================================
✅ Frontend: Next.js en Vercel (https://mindhub.cloud)
✅ API Routes: Next.js en Vercel (/api/*)
✅ Backend Django: Vercel (https://mindhub-django-backend.vercel.app)
✅ Database: Supabase PostgreSQL
✅ Auth: Supabase Auth

❌ REMOVIDO: Railway, Clerk, MySQL

🔄 EXPEDIX ENDPOINTS (Next.js API Routes):
==========================================
GET    https://mindhub.cloud/api/expedix/patients                     - Listar pacientes
POST   https://mindhub.cloud/api/expedix/patients                     - Crear paciente
GET    https://mindhub.cloud/api/expedix/patients/:id                 - Obtener paciente
PUT    https://mindhub.cloud/api/expedix/patients/:id                 - Actualizar paciente
DELETE https://mindhub.cloud/api/expedix/patients/:id                 - Eliminar paciente
GET    https://mindhub.cloud/api/expedix/patients/:id/medical-history - Historial médico
POST   https://mindhub.cloud/api/expedix/patients/:id/medical-history - Agregar historial
GET    https://mindhub.cloud/api/expedix/patients/:id/consultations   - Consultas del paciente
POST   https://mindhub.cloud/api/expedix/patients/:id/consultations   - Nueva consulta
GET    https://mindhub.cloud/api/expedix/consultations/:id            - Obtener consulta
PUT    https://mindhub.cloud/api/expedix/consultations/:id            - Actualizar consulta
GET    https://mindhub.cloud/api/expedix/prescriptions                - Listar recetas
POST   https://mindhub.cloud/api/expedix/prescriptions                - Crear receta
GET    https://mindhub.cloud/api/expedix/appointments                 - Listar citas
POST   https://mindhub.cloud/api/expedix/appointments                 - Crear cita

🧠 CLINIMETRIX PRO ENDPOINTS (HÍBRIDO React + Django):
======================================================
✨ FLUJO HÍBRIDO:
1. React UI: https://mindhub.cloud/hubs/clinimetrix (Selector + integración Expedix)
2. Django Backend: https://mindhub-django-backend.vercel.app (Evaluación + scoring)
3. React Results: https://mindhub.cloud/hubs/clinimetrix (Resultados + exportación)

📋 ENDPOINTS ESPECÍFICOS:
GET    https://mindhub.cloud/api/clinimetrix-pro/catalog              - Catálogo desde Django
POST   https://mindhub.cloud/api/clinimetrix-pro/bridge               - Bridge React → Django
GET    https://mindhub-django-backend.vercel.app/scales/api/catalog/  - Catálogo Django directo
GET    https://mindhub-django-backend.vercel.app/assessments/{id}/focused-take/ - Evaluación Django
POST   https://mindhub-django-backend.vercel.app/assessments/api/create-from-react/ - Crear desde React
GET    https://mindhub.cloud/api/clinimetrix-pro/templates            - Templates disponibles
POST   https://mindhub.cloud/api/clinimetrix-pro/assessments          - Nueva evaluación
GET    https://mindhub.cloud/api/clinimetrix-pro/patients/:id/assessments - Evaluaciones del paciente

🌟 ESCALAS DISPONIBLES (29 migradas):
AQ-Adolescent, AQ-Child, BDI-13, Cuestionario Salamanca v2007, DTS, DY-BOCS, EAT-26, EMUN-AR, 
ESADFUN, GADI, GDS-5, GDS-15, GDS-30, HARS, HDRS-17, IPDE-CIE10, IPDE-DSMIV, MADRS, MOCA, 
MOS Sleep Scale, PANSS, PHQ-9, RADS-2, SSS-V, STAI, Y-BOCS, YGTSS

📝 FORMX ENDPOINTS (PLANIFICADO - Django Forms):
================================================
GET    https://mindhub-django-backend.vercel.app/formx/templates/     - Listar templates (Django)
POST   https://mindhub-django-backend.vercel.app/formx/templates/     - Crear template (Django)
GET    https://mindhub-django-backend.vercel.app/formx/templates/:id  - Obtener template (Django)
PUT    https://mindhub-django-backend.vercel.app/formx/templates/:id  - Actualizar template (Django)
DELETE https://mindhub-django-backend.vercel.app/formx/templates/:id  - Eliminar template (Django)
POST   https://mindhub-django-backend.vercel.app/formx/assignments/   - Asignar formulario (Django)
GET    https://mindhub-django-backend.vercel.app/formx/assignments/:id - Obtener asignación (Django)
GET    https://mindhub-django-backend.vercel.app/formx/form/:token    - Formulario público (Django)
POST   https://mindhub-django-backend.vercel.app/formx/form/:token/submit - Enviar formulario (Django)

📅 AGENDA ENDPOINTS (Next.js API Routes):
=========================================
GET    https://mindhub.cloud/api/agenda/appointments                  - Listar citas
POST   https://mindhub.cloud/api/agenda/appointments                  - Crear cita
GET    https://mindhub.cloud/api/agenda/appointments/:id              - Obtener cita
PUT    https://mindhub.cloud/api/agenda/appointments/:id              - Actualizar cita
GET    https://mindhub.cloud/api/agenda/daily-stats                   - Estadísticas diarias
GET    https://mindhub.cloud/api/agenda/waiting-list                  - Lista de espera

🔧 SYSTEM ENDPOINTS:
===================
GET    https://mindhub.cloud/api/health                               - Health check completo
GET    https://mindhub.cloud/api/version                              - Información de versión
GET    https://mindhub.cloud/api/                                     - Información general API

🔐 AUTHENTICATION (Supabase Auth):
==================================
- Auth Provider: Supabase (https://jvbcpldzoyicefdtnwkd.supabase.co)
- Sign In: https://mindhub.cloud/auth/sign-in
- Sign Up: https://mindhub.cloud/auth/sign-up
- Dashboard: https://mindhub.cloud/dashboard
- Tokens: JWT via Supabase
- RLS: Row Level Security en PostgreSQL

💾 DATABASE (Supabase PostgreSQL):
==================================
- Provider: Supabase PostgreSQL
- URL: Configurado vía variables de entorno
- Tables: patients, users, clinimetrix_*, formx_*, agenda_*
- Security: Row Level Security (RLS)
- Backup: Automático vía Supabase

*/