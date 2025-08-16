/**
 * =================================================================
 * |                    API Route Definitions                      |
 * |                 SINGLE SOURCE OF TRUTH                        |
 * =================================================================
 *
 * This file contains the canonical definitions for all API routes in the application.
 * It is used by both the frontend and backend to ensure consistency.
 *
 * Structure:
 * - The object keys should mirror the backend's modular structure (e.g., 'expedix', 'clinimetrixPro').
 * - The values are the route paths *without* the '/api' prefix.
 * - This allows helper functions to build the correct full path for either
 *   frontend proxy calls or direct backend calls.
 *
 */
const API_ROUTES = {
  health: '/health',
  feedback: '/feedback',
  admin: {
    runMigration: '/admin/run-migration',
  },
  expedix: {
    patients: '/expedix/patients',
    patientById: (id: string) => `/expedix/patients/${id}`,
    consultations: '/expedix/consultations',
    consultationById: (id: string) => `/expedix/consultations/${id}`,
    patientTimeline: '/expedix/patient-timeline',
    clinicConfiguration: '/expedix/clinic-configuration',
    clinicConfigurationDefault: '/expedix/clinic-configuration/default',
    // Prescriptions
    prescriptions: '/expedix/prescriptions',
    patientPrescriptions: (patientId: string) => `/expedix/prescriptions/${patientId}`,
    prescriptionById: (id: string) => `/expedix/prescriptions/single/${id}`,
    // Appointments
    appointments: '/expedix/appointments',
    appointmentById: (id: string) => `/expedix/appointments/${id}`,
    // Documents
    documentsById: (patientId: string) => `/expedix/documents/${patientId}`,
    uploadDocument: (patientId: string) => `/expedix/documents/${patientId}/upload`,
    downloadDocument: (documentId: string) => `/expedix/documents/download/${documentId}`,
    // Medical History
    medicalHistoryById: (patientId: string) => `/expedix/medical-history/${patientId}`,
    // Analytics
    patientStats: '/expedix/analytics/patient-stats',
    todayAppointments: '/expedix/analytics/today-appointments',
    pendingAssessments: '/expedix/analytics/pending-assessments',
    todayPrescriptions: '/expedix/analytics/today-prescriptions',
    // Portal
    portalAccess: (patientId: string) => `/expedix/portal/${patientId}/access`,
    confirmAppointment: '/expedix/portal/confirm-appointment',
    // Drug Interactions
    drugInteractionsCheck: '/expedix/drug-interactions/check',
    // Forms
    consultationTemplates: '/expedix/forms/consultation-templates',
    createConsultationForm: '/expedix/forms/consultation-forms',
    consultationFormById: (formId: string) => `/expedix/forms/forms/${formId}`,
    completeConsultationForm: (formId: string) => `/expedix/forms/forms/${formId}/complete`,
    patientConsultationForms: (patientId: string) => `/expedix/forms/forms/patient/${patientId}`,
  },
  clinimetrixPro: {
    // Current-generation system
    templates: '/clinimetrix-pro/templates',
    assessments: '/clinimetrix-pro/assessments',
    templateCatalog: '/clinimetrix-pro/templates/catalog',
    templateById: (id: string) => `/clinimetrix-pro/templates/${id}`,
    remoteAssessments: '/clinimetrix-pro/remote-assessments',
    validation: '/clinimetrix-pro/validation',
  },
  finance: {
    income: '/finance/income',
    cashRegister: '/finance/cash-register',
    stats: '/finance/stats',
  },
  frontdesk: {
    stats: {
      today: '/frontdesk/stats/today',
    },
    appointments: {
      today: '/frontdesk/appointments/today',
      schedule: '/frontdesk/appointments/schedule',
      slots: '/frontdesk/appointments/slots',
      status: (id: string) => `/frontdesk/appointments/${id}/status`,
    },
    tasks: {
      pending: '/frontdesk/tasks/pending',
    },
    payments: {
      pending: (patientId: string) => `/frontdesk/payments/pending/${patientId}`,
      process: '/frontdesk/payments/process',
      payPending: (pendingId: string) => `/frontdesk/payments/pay-pending/${pendingId}`,
    },
    behavioral: {
      logEvent: (id: string) => `/frontdesk/appointments/${id}/behavioral-event`,
      getHistory: (patientId: string) => `/frontdesk/patients/${patientId}/behavioral-history`,
    }
  },
  resources: {
    base: '/resources',
    documents: '/resources/documents',
    library: '/resources/library',
  },
  agenda: {
    waitingList: '/agenda/waiting-list',
    waitingListById: (id: string) => `/agenda/waiting-list/${id}`,
    availableSlots: '/agenda/available-slots',
    scheduleAppointment: '/agenda/schedule-appointment',
    appointments: '/agenda/appointments',
    appointmentById: (id: string) => `/agenda/appointments/${id}`,
  },
} as const;

export default API_ROUTES;