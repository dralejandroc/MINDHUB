/**
 * Generador de IDs para Clínicas en MindHub
 * 
 * FORMATO: CLI001-Hospital-ABC
 * - CLI: Prefijo fijo para clínicas
 * - 001: Número secuencial
 * - Hospital-ABC: Nombre simplificado
 */

const { getPrismaClient, executeQuery } = require('../config/prisma');

/**
 * Genera un ID único para una clínica
 * @param {string} clinicName - Nombre de la clínica
 * @returns {Promise<string>} ID de clínica generado
 */
async function generateClinicId(clinicName) {
  try {
    // Limpiar y simplificar nombre de clínica
    const cleanName = clinicName
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Solo letras, números y espacios
      .replace(/\s+/g, '-') // Espacios a guiones
      .substring(0, 20) // Máximo 20 caracteres
      .toUpperCase();

    // Obtener siguiente número secuencial
    const existingClinics = await executeQuery(
      (prisma) => prisma.clinic.findMany({
        where: {
          id: { startsWith: 'CLI' }
        },
        select: { id: true },
        orderBy: { id: 'desc' }
      }),
      'getExistingClinics'
    );

    let nextSequence = 1;
    if (existingClinics.length > 0) {
      // Extraer número del último ID
      const lastId = existingClinics[0].id;
      const numberMatch = lastId.match(/CLI(\d+)/);
      if (numberMatch) {
        nextSequence = parseInt(numberMatch[1]) + 1;
      }
    }

    // Formatear secuencia con padding
    const sequenceStr = nextSequence.toString().padStart(3, '0');

    // Construir ID final
    const clinicId = `CLI${sequenceStr}-${cleanName}`;

    // Verificar que no existe (muy improbable)
    const existing = await executeQuery(
      (prisma) => prisma.clinic.findUnique({
        where: { id: clinicId }
      }),
      'checkClinicExists'
    );

    if (existing) {
      // Si existe, agregar sufijo numérico
      return `${clinicId}-${Date.now().toString().slice(-4)}`;
    }

    console.log(`🏥 ID de clínica generado: ${clinicId}`);
    console.log(`   - Nombre original: ${clinicName}`);
    console.log(`   - Nombre limpio: ${cleanName}`);
    console.log(`   - Secuencia: ${sequenceStr}`);

    return clinicId;

  } catch (error) {
    console.error('❌ Error generando ID de clínica:', error);
    throw new Error(`Failed to generate clinic ID: ${error.message}`);
  }
}

/**
 * Genera código corto de clínica para IDs de pacientes
 * @param {string} clinicId - ID de la clínica (ej: CLI001-Hospital-ABC)
 * @returns {string} Código corto (ej: CLI001)
 */
function getClinicCode(clinicId) {
  if (!clinicId) return null;
  
  // Extraer solo el código CLI###
  const match = clinicId.match(/^(CLI\d{3})/);
  return match ? match[1] : clinicId.substring(0, 6);
}

/**
 * Valida formato de ID de clínica
 * @param {string} clinicId - ID a validar
 * @returns {boolean} True si es válido
 */
function validateClinicId(clinicId) {
  // Formato: CLI001-NOMBRE o solo CLI001
  const pattern = /^CLI\d{3}(-[A-Z0-9-]+)?$/;
  return pattern.test(clinicId);
}

/**
 * Extrae información de un ID de clínica
 * @param {string} clinicId - ID a decodificar
 * @returns {Object} Información extraída
 */
function decodeClinicId(clinicId) {
  if (!validateClinicId(clinicId)) {
    throw new Error(`Invalid clinic ID format: ${clinicId}`);
  }

  const parts = clinicId.split('-');
  const code = parts[0]; // CLI001
  const nameSlug = parts.slice(1).join('-'); // HOSPITAL-ABC

  const sequence = parseInt(code.replace('CLI', ''));

  return {
    code,
    sequence,
    nameSlug,
    hasName: nameSlug.length > 0
  };
}

module.exports = {
  generateClinicId,
  getClinicCode,
  validateClinicId,
  decodeClinicId
};