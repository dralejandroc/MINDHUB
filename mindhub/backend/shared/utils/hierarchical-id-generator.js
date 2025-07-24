/**
 * Generador de IDs Jerárquicos para MindHub
 * 
 * ARQUITECTURA UNIFICADA:
 * - Patient ID: SNR19880911-2507
 * - Event IDs: SNR19880911-2507-C001, SNR19880911-2507-CL001, etc.
 * 
 * PREFIJOS POR HUB:
 * - C: Expedix (Consultas, Prescripciones, Notas)
 * - CL: Clinimetrix (Evaluaciones, Escalas)
 * - FX: FormX (Formularios, Consentimientos)
 * - AG: Agenda (Citas, Lista de Espera)
 * - RC: Recursos (Materiales, Tareas)
 */

const { getPrismaClient } = require('../config/prisma');

/**
 * Prefijos de eventos por hub de MindHub
 */
const HUB_PREFIXES = {
  // Expedix - Gestión de Pacientes
  CONSULTATION: 'C',
  PRESCRIPTION: 'P', 
  CLINICAL_NOTE: 'N',
  
  // Clinimetrix - Escalas Clínicas
  ASSESSMENT: 'CL',
  SCALE_ADMINISTRATION: 'CL',
  ASSESSMENT_RESULT: 'CL',
  
  // FormX - Formularios
  FORM_SUBMISSION: 'FX',
  CONSENT_FORM: 'FX',
  QUESTIONNAIRE: 'FX',
  
  // Agenda - Sistema de Citas
  APPOINTMENT: 'AG',
  WAITING_LIST: 'AG',
  SCHEDULE_BLOCK: 'AG',
  
  // Recursos - Materiales Psicoeducativos
  RESOURCE_DISTRIBUTION: 'RC',
  TASK_ASSIGNMENT: 'RC',
  RESOURCE_DOWNLOAD: 'RC'
};

/**
 * Genera un ID jerárquico para un evento médico
 * @param {string} patientId - ID del paciente (ej: SNR19880911-2507)
 * @param {string} eventType - Tipo de evento (ej: 'CONSULTATION', 'ASSESSMENT')
 * @param {string} [subtype] - Subtipo opcional (ej: 'GDS30', 'CONSENT')
 * @returns {Promise<string>} ID jerárquico generado
 */
async function generateHierarchicalEventId(patientId, eventType, subtype = null) {
  try {
    const prefix = HUB_PREFIXES[eventType];
    if (!prefix) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    // Obtener el siguiente número de secuencia para este tipo de evento
    const sequence = await getNextSequenceNumber(patientId, prefix);
    const sequenceStr = sequence.toString().padStart(3, '0'); // 001, 002, etc.

    // Construir ID base
    let eventId = `${patientId}-${prefix}${sequenceStr}`;

    // Agregar subtipo si se especifica
    if (subtype) {
      eventId += `-${subtype.toUpperCase()}`;
    }

    console.log(`📝 ID jerárquico generado: ${eventId}`);
    console.log(`   - Paciente: ${patientId}`);
    console.log(`   - Tipo: ${eventType} (${prefix})`);
    console.log(`   - Secuencia: ${sequence}`);
    if (subtype) console.log(`   - Subtipo: ${subtype}`);

    return eventId;

  } catch (error) {
    console.error('❌ Error generando ID jerárquico:', error);
    throw new Error(`Failed to generate hierarchical ID: ${error.message}`);
  }
}

/**
 * Obtiene el siguiente número de secuencia para un tipo de evento
 * @param {string} patientId - ID del paciente
 * @param {string} prefix - Prefijo del hub (C, CL, FX, AG, RC)
 * @returns {Promise<number>} Siguiente número de secuencia
 */
async function getNextSequenceNumber(patientId, prefix) {
  const prisma = getPrismaClient();
  
  try {
    // Buscar el último ID de este tipo para este paciente
    let lastEvent = null;
    
    switch (prefix) {
      case 'C':
      case 'P':
      case 'N':
        // Expedix - Consultas, Prescripciones, Notas
        lastEvent = await prisma.consultation.findFirst({
          where: {
            patientId: patientId,
            id: { startsWith: `${patientId}-${prefix}` }
          },
          orderBy: { id: 'desc' }
        });
        break;
        
      case 'CL':
        // Clinimetrix - Evaluaciones
        // TODO: Implementar cuando tengamos el modelo de evaluaciones
        break;
        
      case 'FX':
        // FormX - Formularios
        // TODO: Implementar cuando tengamos el modelo de formularios
        break;
        
      case 'AG':
        // Agenda - Citas
        // TODO: Implementar cuando tengamos el modelo de agenda
        break;
        
      case 'RC':
        // Recursos - Distribuciones
        // TODO: Implementar cuando tengamos el modelo de recursos
        break;
    }

    if (!lastEvent) {
      return 1; // Primer evento de este tipo
    }

    // Extraer número de secuencia del último ID
    const idParts = lastEvent.id.split('-');
    const lastPart = idParts[idParts.length - 1];
    
    // Si tiene subtipo (ej: CL001-GDS30), tomar la parte numérica
    const numericPart = lastPart.replace(/[A-Z]/g, '');
    const lastSequence = parseInt(numericPart) || 0;
    
    return lastSequence + 1;

  } catch (error) {
    console.error('❌ Error obteniendo secuencia:', error);
    return 1; // Fallback al primer número
  }
}

/**
 * Valida si un ID jerárquico tiene el formato correcto
 * @param {string} eventId - ID a validar
 * @returns {boolean} True si es válido
 */
function validateHierarchicalEventId(eventId) {
  // Formato: SNR19880911-2507-C001 o SNR19880911-2507-CL001-GDS30
  const pattern = /^[A-Z]{2}[A-Z][0-9]{8}-[0-9]{4}[A-Z]?-(C|CL|FX|AG|RC)[0-9]{3}(-[A-Z0-9]+)?$/;
  return pattern.test(eventId);
}

/**
 * Extrae información de un ID jerárquico
 * @param {string} eventId - ID a decodificar
 * @returns {Object} Información extraída
 */
function decodeHierarchicalEventId(eventId) {
  if (!validateHierarchicalEventId(eventId)) {
    throw new Error(`Invalid hierarchical event ID format: ${eventId}`);
  }

  const parts = eventId.split('-');
  const patientId = `${parts[0]}-${parts[1]}`;
  const eventPart = parts[2];
  const subtype = parts[3] || null;

  const prefix = eventPart.replace(/[0-9]/g, '');
  const sequence = parseInt(eventPart.replace(/[A-Z]/g, ''));

  return {
    patientId,
    prefix,
    sequence,
    subtype,
    hubType: getHubTypeFromPrefix(prefix),
    eventType: getEventTypeFromPrefix(prefix)
  };
}

/**
 * Obtiene el tipo de hub desde el prefijo
 */
function getHubTypeFromPrefix(prefix) {
  switch (prefix) {
    case 'C':
    case 'P':
    case 'N':
      return 'Expedix';
    case 'CL':
      return 'Clinimetrix';
    case 'FX':
      return 'FormX';
    case 'AG':
      return 'Agenda';
    case 'RC':
      return 'Recursos';
    default:
      return 'Unknown';
  }
}

/**
 * Obtiene el tipo de evento desde el prefijo
 */
function getEventTypeFromPrefix(prefix) {
  switch (prefix) {
    case 'C':
      return 'Consultation';
    case 'P':
      return 'Prescription';
    case 'N':
      return 'Clinical Note';
    case 'CL':
      return 'Assessment';
    case 'FX':
      return 'Form Submission';
    case 'AG':
      return 'Appointment';
    case 'RC':
      return 'Resource Distribution';
    default:
      return 'Unknown';
  }
}

module.exports = {
  generateHierarchicalEventId,
  validateHierarchicalEventId,
  decodeHierarchicalEventId,
  getNextSequenceNumber,
  HUB_PREFIXES,
  getHubTypeFromPrefix,
  getEventTypeFromPrefix
};