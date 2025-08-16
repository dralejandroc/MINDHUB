/**
 * API_ROUTES - Configuración centralizada de rutas de API para MindHub
 * Definición de rutas sin base URL para máxima flexibilidad
 * 
 * IMPORTANTE:
 * - Estas rutas NO incluyen base URL
 * - Se usan con api-url-builders.ts para construir URLs completas
 * - Cliente: usa createApiUrl() para proxy /api
 * - Servidor: usa createBackendApiUrl() para Railway directo
 */

/**
 * EXPEDIX - Gestión de Pacientes y Expedientes Médicos
 */
export const expedix = {
  // Pacientes
  patients: '/expedix/patients',
  patientById: (id: string) => `/expedix/patients/${id}`,
  
  // Citas
  appointments: '/expedix/appointments',
  appointmentById: (id: string) => `/expedix/appointments/${id}`,
  appointmentStatus: (id: string) => `/expedix/appointments/${id}/status`,
  
  // Prescripciones
  prescriptions: '/expedix/prescriptions',
  prescriptionById: (id: string) => `/expedix/prescriptions/${id}`,
  prescriptionPdf: (id: string) => `/expedix/prescriptions/${id}/pdf`,
  patientPrescriptions: (patientId: string) => `/expedix/prescriptions/patient/${patientId}`,
  
  // Documentos
  patientDocuments: (patientId: string) => `/expedix/documents/${patientId}`,
  uploadDocument: (patientId: string) => `/expedix/documents/${patientId}/upload`,
  downloadDocument: (documentId: string) => `/expedix/documents/download/${documentId}`,
  
  // Historia Médica
  medicalHistory: (patientId: string) => `/expedix/medical-history/${patientId}`,
  
  // Analytics y Reportes
  patientStats: '/expedix/analytics/patient-stats',
  todayAppointments: '/expedix/analytics/today-appointments',
  pendingAssessments: '/expedix/analytics/pending-assessments',
  todayPrescriptions: '/expedix/analytics/today-prescriptions',
  
  // Portal de Pacientes
  portalAccess: (patientId: string) => `/expedix/portal/${patientId}/access`,
  confirmAppointment: '/expedix/portal/confirm-appointment',
  
  // Interacciones de Medicamentos
  drugInteractions: '/expedix/drug-interactions/check',
  
  // Formularios de Consulta
  consultationTemplates: '/expedix/forms/templates',
  consultationTemplateById: (templateId: string) => `/expedix/forms/templates/${templateId}`,
  consultationForms: '/expedix/forms/forms',
  consultationFormById: (formId: string) => `/expedix/forms/forms/${formId}`,
  completeConsultationForm: (formId: string) => `/expedix/forms/forms/${formId}/complete`,
  patientConsultationForms: (patientId: string) => `/expedix/forms/forms/patient/${patientId}`,
  
  // Configuración de Clínica
  clinicConfiguration: '/expedix/clinic-configuration',
  defaultClinicConfig: '/expedix/clinic-configuration/default',
  
  // Consultas
  consultations: '/expedix/consultations',
} as const;

/**
 * CLINIMETRIX PRO - Sistema de Escalas y Evaluaciones Clínicas
 */
export const clinimetrixPro = {
  // Base
  base: '/clinimetrix-pro',
  
  // Templates y Catálogo
  templates: '/clinimetrix-pro/templates',
  templateCatalog: '/clinimetrix-pro/templates/catalog',
  templateById: (templateId: string) => `/clinimetrix-pro/templates/${templateId}`,
  
  // Evaluaciones
  assessments: '/clinimetrix-pro/assessments',
  assessmentById: (assessmentId: string) => `/clinimetrix-pro/assessments/${assessmentId}`,
  newAssessment: '/clinimetrix-pro/assessments/new',
  completeAssessment: (assessmentId: string) => `/clinimetrix-pro/assessments/${assessmentId}/complete`,
  assessmentResponses: (assessmentId: string) => `/clinimetrix-pro/assessments/${assessmentId}/responses`,
  patientAssessments: (patientId: string) => `/clinimetrix-pro/assessments/patient/${patientId}`,
  
  // Scoring y Reportes
  assessmentScore: (assessmentId: string) => `/clinimetrix-pro/assessments/${assessmentId}/score`,
  assessmentReport: (assessmentId: string) => `/clinimetrix-pro/assessments/${assessmentId}/report`,
  assessmentPdf: (assessmentId: string) => `/clinimetrix-pro/assessments/${assessmentId}/pdf`,
  
  // Registry
  registry: '/clinimetrix-pro/registry',
  registrySearch: '/clinimetrix-pro/registry/search',
} as const;

/**
 * FORMX - Generador de Formularios
 */
export const formx = {
  // Base
  forms: '/formx/forms',
  formById: (formId: string) => `/formx/forms/${formId}`,
  
  // Templates
  templates: '/formx/templates',
  templateById: (templateId: string) => `/formx/templates/${templateId}`,
  
  // Respuestas
  formResponses: (formId: string) => `/formx/forms/${formId}/responses`,
  submitForm: (formId: string) => `/formx/forms/${formId}/submit`,
  
  // Analytics
  formAnalytics: (formId: string) => `/formx/forms/${formId}/analytics`,
} as const;

/**
 * AGENDA - Sistema de Citas y Programación
 */
export const agenda = {
  // Citas
  appointments: '/agenda/appointments',
  appointmentById: (appointmentId: string) => `/agenda/appointments/${appointmentId}`,
  
  // Horarios
  schedules: '/agenda/schedules',
  scheduleById: (scheduleId: string) => `/agenda/schedules/${scheduleId}`,
  
  // Lista de Espera
  waitingList: '/agenda/waiting-list',
  
  // Configuración
  configuration: '/agenda/configuration',
} as const;

/**
 * FINANCE - Sistema Financiero
 */
export const finance = {
  // Ingresos
  income: '/finance/income',
  incomeById: (incomeId: string) => `/finance/income/${incomeId}`,
  
  // Estadísticas
  stats: '/finance/stats',
  
  // Configuración
  config: '/finance/config',
  discountPlans: '/finance/config/discount-plans',
  services: '/finance/config/services',
  
  // Caja Registradora (Legacy)
  cashRegister: '/finance/cash-register',
  cashCuts: '/finance/cash-register/cuts',
  dailyCuts: '/finance/cash-register/cuts/daily',
} as const;

/**
 * FRONTDESK - Recepción
 */
export const frontdesk = {
  // Citas de Hoy
  todayAppointments: '/frontdesk/appointments/today',
  
  // Estadísticas
  todayStats: '/frontdesk/stats/today',
  
  // Tareas Pendientes
  pendingTasks: '/frontdesk/tasks/pending',
} as const;

/**
 * RESOURCES - Gestión de Recursos
 */
export const resources = {
  // Base
  resources: '/resources',
  resourceById: (resourceId: string) => `/resources/${resourceId}`,
  
  // Biblioteca
  library: '/resources/library',
  
  // Documentos
  documents: '/resources/documents',
  patientDocuments: '/resources/documents/patients',
  sendToPatient: '/resources/documents/send-to-patient',
  
  // Storage
  storageQuota: '/resources/storage/quota',
  storageStats: '/resources/storage/stats',
  
  // Tracking
  patientTracking: (patientId: string) => `/resources/tracking/patient/${patientId}`,
} as const;

/**
 * ADMIN - Administración del Sistema
 */
export const admin = {
  // Migraciones
  runMigration: '/admin/run-migration',
  
  // Health Checks
  health: '/health',
  backendHealth: '/health/backend',
  
  // Test
  testBackend: '/test-backend',
} as const;

/**
 * FEEDBACK - Sistema de Retroalimentación
 */
export const feedback = {
  feedback: '/feedback',
} as const;

/**
 * Rutas Consolidadas por Módulo
 */
const API_ROUTES = {
  expedix,
  clinimetrixPro,
  formx,
  agenda,
  finance,
  frontdesk,
  resources,
  admin,
  feedback,
} as const;

/**
 * Tipos para autocompletado
 */
export type APIModule = keyof typeof API_ROUTES;

/**
 * Default export con toda la configuración
 */
export default API_ROUTES;