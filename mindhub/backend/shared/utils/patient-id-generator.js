/**
 * Generador de IDs legibles para pacientes
 * 
 * FORMATOS:
 * - Individual: SAR19800315-2507A
 * - Clínica: CLI001-SAR19800315-2507A
 * 
 * COMPONENTES:
 * - CLI001: Código de clínica (opcional)
 * - SA: Primeras 2 letras apellido paterno
 * - R: Primera letra nombre
 * - 19800315: Fecha nacimiento (YYYYMMDD)
 * - 25: Año creación (últimos 2 dígitos)
 * - 07: Mes creación (01-12)
 * - A: Sufijo para evitar colisiones (A, B, C...)
 */

const { getPrismaClient } = require('../config/prisma');
const { getClinicCode } = require('./clinic-id-generator');

/**
 * Genera un ID legible para un paciente
 * @param {Object} patientData - Datos del paciente
 * @param {string} patientData.firstName - Nombre del paciente
 * @param {string} patientData.paternalLastName - Apellido paterno
 * @param {Date|string} patientData.dateOfBirth - Fecha de nacimiento
 * @param {string} [patientData.clinicId] - ID de clínica (opcional)
 * @param {Date} [creationDate] - Fecha de creación (por defecto: ahora)
 * @returns {Promise<string>} ID generado
 */
async function generateReadablePatientId(patientData, creationDate = new Date()) {
  try {
    // Extraer y limpiar componentes
    const lastName = (patientData.paternalLastName || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '') // Solo letras
      .substring(0, 2)
      .padEnd(2, 'X'); // Rellenar con X si es muy corto

    const firstName = (patientData.firstName || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '') // Solo letras
      .substring(0, 1)
      .padEnd(1, 'X'); // Rellenar con X si está vacío

    // Formatear fecha de nacimiento
    const birthDate = new Date(patientData.dateOfBirth);
    const birthYear = birthDate.getFullYear().toString();
    const birthMonth = (birthDate.getMonth() + 1).toString().padStart(2, '0');
    const birthDay = birthDate.getDate().toString().padStart(2, '0');
    const birthFormatted = `${birthYear}${birthMonth}${birthDay}`;

    // Formatear fecha de creación
    const creationYear = creationDate.getFullYear().toString().slice(-2); // Últimos 2 dígitos
    const creationMonth = (creationDate.getMonth() + 1).toString().padStart(2, '0');

    // Generar ID base del paciente
    const patientBaseId = `${lastName}${firstName}${birthFormatted}-${creationYear}${creationMonth}`;

    // Determinar si necesita prefijo de clínica
    let finalId;
    if (patientData.clinicId) {
      const clinicCode = getClinicCode(patientData.clinicId);
      if (clinicCode) {
        // Formato con clínica: CLI001-SAR19800315-2507A
        const clinicPatientBaseId = `${clinicCode}-${patientBaseId}`;
        finalId = await findAvailableId(clinicPatientBaseId);
        
        console.log(`🏥 ID con clínica generado: ${finalId}`);
        console.log(`   - Clínica: ${clinicCode} (${patientData.clinicId})`);
      } else {
        console.log(`⚠️ Código de clínica no válido para ${patientData.clinicId}, usando formato individual`);
        finalId = await findAvailableId(patientBaseId);
      }
    } else {
      // Formato individual: SAR19800315-2507A
      finalId = await findAvailableId(patientBaseId);
      console.log(`👤 ID individual generado: ${finalId}`);
    }

    console.log(`   - Apellido: ${lastName} (${patientData.paternalLastName})`);
    console.log(`   - Nombre: ${firstName} (${patientData.firstName})`);
    console.log(`   - Nacimiento: ${birthFormatted} (${birthDate.toLocaleDateString('es-ES')})`);
    console.log(`   - Creación: ${creationYear}${creationMonth} (${creationDate.toLocaleDateString('es-ES')})`);

    return finalId;

  } catch (error) {
    console.error('❌ Error generando ID de paciente:', error);
    throw new Error(`Failed to generate patient ID: ${error.message}`);
  }
}

/**
 * Encuentra un ID disponible agregando sufijos A, B, C... si es necesario
 * @param {string} baseId - ID base a verificar
 * @returns {Promise<string>} ID disponible
 */
async function findAvailableId(baseId) {
  const prisma = getPrismaClient();
  
  // Verificar si el ID base está disponible
  const existing = await prisma.patient.findUnique({
    where: { id: baseId }
  });

  if (!existing) {
    return baseId;
  }

  // Si existe, intentar con sufijos A, B, C...
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (const letter of alphabet) {
    const candidateId = `${baseId}${letter}`;
    
    const existingWithSuffix = await prisma.patient.findUnique({
      where: { id: candidateId }
    });

    if (!existingWithSuffix) {
      console.log(`⚠️ Colisión detectada para ${baseId}, usando ${candidateId}`);
      return candidateId;
    }
  }

  // Si agotamos el alfabeto (muy improbable), usar timestamp
  const timestamp = Date.now().toString().slice(-4);
  const fallbackId = `${baseId}${timestamp}`;
  
  console.log(`⚠️ Alfabeto agotado para ${baseId}, usando fallback ${fallbackId}`);
  return fallbackId;
}

/**
 * Valida si un ID tiene el formato correcto
 * @param {string} patientId - ID a validar
 * @returns {boolean} True si es válido
 */
function validatePatientIdFormat(patientId) {
  // Formato individual: AAR19800315-2507[A-Z]?
  const individualPattern = /^[A-Z]{2}[A-Z][0-9]{8}-[0-9]{4}[A-Z]?$/;
  
  // Formato con clínica: CLI001-AAR19800315-2507[A-Z]?
  const clinicPattern = /^CLI\d{3}-[A-Z]{2}[A-Z][0-9]{8}-[0-9]{4}[A-Z]?$/;
  
  return individualPattern.test(patientId) || clinicPattern.test(patientId);
}

/**
 * Extrae información de un ID de paciente
 * @param {string} patientId - ID a decodificar
 * @returns {Object} Información extraída
 */
function decodePatientId(patientId) {
  if (!validatePatientIdFormat(patientId)) {
    throw new Error(`Invalid patient ID format: ${patientId}`);
  }

  let clinicCode = null;
  let patientPart = patientId;

  // Verificar si tiene prefijo de clínica
  if (patientId.startsWith('CLI')) {
    const parts = patientId.split('-');
    if (parts.length >= 3) {
      clinicCode = parts[0]; // CLI001
      patientPart = parts.slice(1).join('-'); // SAR19800315-2507A
    }
  }

  const [personalPart, datePart] = patientPart.split('-');
  
  const lastName = personalPart.substring(0, 2);
  const firstName = personalPart.substring(2, 3);
  const birthDate = personalPart.substring(3, 11);
  
  const creationYear = '20' + datePart.substring(0, 2);
  const creationMonth = datePart.substring(2, 4);
  const suffix = datePart.substring(4) || '';

  return {
    clinicCode,
    isClinicPatient: clinicCode !== null,
    lastName,
    firstName,
    birthDate: {
      year: birthDate.substring(0, 4),
      month: birthDate.substring(4, 6),
      day: birthDate.substring(6, 8),
      formatted: `${birthDate.substring(0, 4)}-${birthDate.substring(4, 6)}-${birthDate.substring(6, 8)}`
    },
    creation: {
      year: creationYear,
      month: creationMonth,
      formatted: `${creationYear}-${creationMonth}`
    },
    suffix,
    hasCollision: suffix.length > 0
  };
}

module.exports = {
  generateReadablePatientId,
  validatePatientIdFormat,
  decodePatientId,
  findAvailableId
};