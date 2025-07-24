/**
 * ID Validation Utilities
 * Provides validation for different ID formats used in the MindHub platform
 */

/**
 * Validates if a value is a valid UUID (version 1-5)
 * @param {string} value - The value to validate
 * @returns {boolean} - True if valid UUID
 */
const isValidUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Validates if a value is a valid cuid (Collision-resistant Unique Identifier)
 * @param {string} value - The value to validate
 * @returns {boolean} - True if valid cuid
 */
const isValidCuid = (value) => {
  const cuidRegex = /^[a-z0-9]{25}$/;
  return cuidRegex.test(value);
};

/**
 * Validates if a value is a valid readable patient ID
 * Formats: 
 * - Individual: AAR19800315-2507[A-Z]?
 * - Clinic: CLI001-AAR19800315-2507[A-Z]?
 * @param {string} value - The value to validate
 * @returns {boolean} - True if valid readable patient ID
 */
const isValidReadablePatientId = (value) => {
  // Formato individual: AAR19800315-2507[A-Z]?
  const individualPattern = /^[A-Z]{2}[A-Z][0-9]{8}-[0-9]{4}[A-Z]?$/;
  
  // Formato con clínica: CLI001-AAR19800315-2507[A-Z]?
  const clinicPattern = /^CLI\d{3}-[A-Z]{2}[A-Z][0-9]{8}-[0-9]{4}[A-Z]?$/;
  
  return individualPattern.test(value) || clinicPattern.test(value);
};

/**
 * Validates if a value is either a valid UUID, cuid, or readable patient ID
 * @param {string} value - The value to validate
 * @returns {boolean} - True if valid UUID, cuid, or readable patient ID
 */
const isValidId = (value) => {
  return isValidUUID(value) || isValidCuid(value) || isValidReadablePatientId(value);
};

/**
 * Express-validator custom validator for patient IDs
 * Accepts both UUID and cuid formats
 */
const validatePatientId = (value) => {
  if (!isValidId(value)) {
    throw new Error('Invalid patient ID format');
  }
  return true;
};

/**
 * Express-validator custom validator for any entity ID
 * Accepts both UUID and cuid formats
 */
const validateEntityId = (value) => {
  if (!isValidId(value)) {
    throw new Error('Invalid ID format');
  }
  return true;
};

module.exports = {
  isValidUUID,
  isValidCuid,
  isValidReadablePatientId,
  isValidId,
  validatePatientId,
  validateEntityId
};