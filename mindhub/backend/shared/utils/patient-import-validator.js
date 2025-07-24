/**
 * Validador y procesador de importaciones masivas de pacientes
 * 
 * FUNCIONALIDADES:
 * 1. Validar datos de CSV/Excel
 * 2. Detectar errores y duplicados
 * 3. Generar preview de importación
 * 4. Preparar datos para inserción
 */

const { validatePatientIdFormat } = require('./id-validators');
const { generateReadablePatientId } = require('./patient-id-generator');

/**
 * Reglas de validación para campos de pacientes
 */
const VALIDATION_RULES = {
  first_name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    message: 'Nombre debe tener 2-50 caracteres, solo letras y espacios'
  },
  
  paternal_last_name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    message: 'Apellido paterno debe tener 2-50 caracteres, solo letras y espacios'
  },
  
  maternal_last_name: {
    required: false,
    type: 'string',
    maxLength: 50,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
    message: 'Apellido materno debe tener máximo 50 caracteres, solo letras y espacios'
  },
  
  birth_date: {
    required: true,
    type: 'date',
    format: 'YYYY-MM-DD',
    minDate: new Date('1900-01-01'),
    maxDate: new Date(),
    message: 'Fecha de nacimiento requerida, formato YYYY-MM-DD, entre 1900 y hoy'
  },
  
  gender: {
    required: true,
    type: 'enum',
    values: ['male', 'female', 'masculine', 'feminine', 'other', 'prefer_not_to_say'],
    message: 'Género requerido: male, female, masculine, feminine, other, prefer_not_to_say'
  },
  
  email: {
    required: false,
    type: 'email',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email debe tener formato válido'
  },
  
  cell_phone: {
    required: false,
    type: 'phone',
    pattern: /^(\+52\s?)?(\(?\d{2,3}\)?[\s\-]?)?\d{4}[\s\-]?\d{4}$/,
    message: 'Teléfono debe ser formato mexicano válido'
  },
  
  address: {
    required: false,
    type: 'string',
    maxLength: 200,
    message: 'Dirección debe tener máximo 200 caracteres'
  },
  
  city: {
    required: false,
    type: 'string',
    maxLength: 100,
    message: 'Ciudad debe tener máximo 100 caracteres'
  },
  
  state: {
    required: false,
    type: 'string',
    maxLength: 100,
    message: 'Estado debe tener máximo 100 caracteres'
  },
  
  postal_code: {
    required: false,
    type: 'string',
    pattern: /^\d{5}$/,
    message: 'Código postal debe tener 5 dígitos'
  },
  
  curp: {
    required: false,
    type: 'string',
    pattern: /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/,
    length: 18,
    message: 'CURP debe tener 18 caracteres con formato válido'
  },
  
  rfc: {
    required: false,
    type: 'string',
    pattern: /^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$/,
    message: 'RFC debe tener formato válido (12-13 caracteres)'
  },
  
  blood_type: {
    required: false,
    type: 'enum',
    values: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    message: 'Tipo de sangre debe ser: O+, O-, A+, A-, B+, B-, AB+, AB-'
  },
  
  allergies: {
    required: false,
    type: 'string',
    maxLength: 500,
    message: 'Alergias debe tener máximo 500 caracteres'
  },
  
  emergency_contact_name: {
    required: false,
    type: 'string',
    maxLength: 100,
    message: 'Nombre de contacto de emergencia debe tener máximo 100 caracteres'
  },
  
  emergency_contact_phone: {
    required: false,
    type: 'phone',
    pattern: /^(\+52\s?)?(\(?\d{2,3}\)?[\s\-]?)?\d{4}[\s\-]?\d{4}$/,
    message: 'Teléfono de contacto debe ser formato mexicano válido'
  },
  
  clinic_id: {
    required: false,
    type: 'string',
    pattern: /^CLI\d{3}-[A-Z0-9-]+$/,
    message: 'ID de clínica debe tener formato CLI###-NOMBRE'
  }
};

/**
 * Valida un campo individual
 * @param {string} fieldName - Nombre del campo
 * @param {any} value - Valor a validar
 * @param {number} rowIndex - Índice de la fila (para errores)
 * @returns {Object} Resultado de validación
 */
function validateField(fieldName, value, rowIndex = 0) {
  const rule = VALIDATION_RULES[fieldName];
  if (!rule) {
    return { valid: true };
  }

  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Convertir a string y limpiar
  const cleanValue = value !== null && value !== undefined ? String(value).trim() : '';

  // Validar campo requerido
  if (rule.required && (!cleanValue || cleanValue === '')) {
    result.valid = false;
    result.errors.push({
      field: fieldName,
      row: rowIndex,
      message: `${fieldName} es requerido`,
      value: cleanValue
    });
    return result;
  }

  // Si está vacío y no es requerido, es válido
  if (!cleanValue && !rule.required) {
    return result;
  }

  // Validar longitud mínima/máxima
  if (rule.minLength && cleanValue.length < rule.minLength) {
    result.valid = false;
    result.errors.push({
      field: fieldName,
      row: rowIndex,
      message: `${fieldName} debe tener al menos ${rule.minLength} caracteres`,
      value: cleanValue
    });
  }

  if (rule.maxLength && cleanValue.length > rule.maxLength) {
    result.valid = false;
    result.errors.push({
      field: fieldName,
      row: rowIndex,
      message: `${fieldName} debe tener máximo ${rule.maxLength} caracteres`,
      value: cleanValue
    });
  }

  // Validar longitud exacta
  if (rule.length && cleanValue.length !== rule.length) {
    result.valid = false;
    result.errors.push({
      field: fieldName,
      row: rowIndex,
      message: `${fieldName} debe tener exactamente ${rule.length} caracteres`,
      value: cleanValue
    });
  }

  // Validar patrón regex
  if (rule.pattern && !rule.pattern.test(cleanValue)) {
    result.valid = false;
    result.errors.push({
      field: fieldName,
      row: rowIndex,
      message: rule.message || `${fieldName} no tiene formato válido`,
      value: cleanValue
    });
  }

  // Validar enumeraciones
  if (rule.type === 'enum' && rule.values && !rule.values.includes(cleanValue)) {
    result.valid = false;
    result.errors.push({
      field: fieldName,
      row: rowIndex,
      message: `${fieldName} debe ser uno de: ${rule.values.join(', ')}`,
      value: cleanValue
    });
  }

  // Validar fechas
  if (rule.type === 'date') {
    const dateValue = new Date(cleanValue);
    if (isNaN(dateValue.getTime())) {
      result.valid = false;
      result.errors.push({
        field: fieldName,
        row: rowIndex,
        message: `${fieldName} debe ser una fecha válida (${rule.format})`,
        value: cleanValue
      });
    } else {
      // Validar rango de fechas
      if (rule.minDate && dateValue < rule.minDate) {
        result.valid = false;
        result.errors.push({
          field: fieldName,
          row: rowIndex,
          message: `${fieldName} debe ser posterior a ${rule.minDate.toISOString().split('T')[0]}`,
          value: cleanValue
        });
      }
      
      if (rule.maxDate && dateValue > rule.maxDate) {
        result.valid = false;
        result.errors.push({
          field: fieldName,
          row: rowIndex,
          message: `${fieldName} debe ser anterior a ${rule.maxDate.toISOString().split('T')[0]}`,
          value: cleanValue
        });
      }
    }
  }

  return result;
}

/**
 * Valida una fila completa de datos de paciente
 * @param {Object} rowData - Datos de la fila
 * @param {number} rowIndex - Índice de la fila
 * @returns {Object} Resultado de validación
 */
function validatePatientRow(rowData, rowIndex = 0) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    cleanedData: {}
  };

  // Validar cada campo
  Object.keys(VALIDATION_RULES).forEach(fieldName => {
    const fieldResult = validateField(fieldName, rowData[fieldName], rowIndex);
    
    if (!fieldResult.valid) {
      result.valid = false;
      result.errors.push(...fieldResult.errors);
    }
    
    result.warnings.push(...fieldResult.warnings);
    
    // Limpiar y normalizar datos
    if (rowData[fieldName] !== null && rowData[fieldName] !== undefined) {
      const cleanValue = String(rowData[fieldName]).trim();
      if (cleanValue) {
        result.cleanedData[fieldName] = cleanValue;
      }
    }
  });

  // Validaciones cruzadas
  
  // Validar consistencia de fecha de nacimiento con CURP
  if (result.cleanedData.curp && result.cleanedData.birth_date) {
    const curpDate = result.cleanedData.curp.substring(4, 10);
    const birthDate = result.cleanedData.birth_date.replace(/-/g, '').substring(2);
    
    if (curpDate !== birthDate) {
      result.warnings.push({
        field: 'curp',
        row: rowIndex,
        message: 'La fecha de nacimiento en CURP no coincide con birth_date',
        value: result.cleanedData.curp
      });
    }
  }

  // Validar que teléfono de emergencia no sea igual al personal
  if (result.cleanedData.cell_phone && result.cleanedData.emergency_contact_phone) {
    if (result.cleanedData.cell_phone === result.cleanedData.emergency_contact_phone) {
      result.warnings.push({
        field: 'emergency_contact_phone',
        row: rowIndex,
        message: 'Teléfono de emergencia es igual al teléfono personal',
        value: result.cleanedData.emergency_contact_phone
      });
    }
  }

  return result;
}

/**
 * Detecta duplicados en los datos de importación
 * @param {Array} patients - Array de datos de pacientes
 * @returns {Object} Resultado de detección de duplicados
 */
function detectDuplicates(patients) {
  const duplicates = {
    byName: [],
    byEmail: [],
    byCurp: [],
    byPhone: []
  };

  const seenNames = new Map();
  const seenEmails = new Map();
  const seenCurps = new Map();
  const seenPhones = new Map();

  patients.forEach((patient, index) => {
    // Detectar duplicados por nombre y fecha de nacimiento
    if (patient.first_name && patient.paternal_last_name && patient.birth_date) {
      const nameKey = `${patient.first_name.toLowerCase()}_${patient.paternal_last_name.toLowerCase()}_${patient.birth_date}`;
      
      if (seenNames.has(nameKey)) {
        duplicates.byName.push({
          current: { index, data: patient },
          duplicate: seenNames.get(nameKey),
          key: nameKey
        });
      } else {
        seenNames.set(nameKey, { index, data: patient });
      }
    }

    // Detectar duplicados por email
    if (patient.email) {
      const emailKey = patient.email.toLowerCase();
      if (seenEmails.has(emailKey)) {
        duplicates.byEmail.push({
          current: { index, data: patient },
          duplicate: seenEmails.get(emailKey),
          key: emailKey
        });
      } else {
        seenEmails.set(emailKey, { index, data: patient });
      }
    }

    // Detectar duplicados por CURP
    if (patient.curp) {
      const curpKey = patient.curp.toUpperCase();
      if (seenCurps.has(curpKey)) {
        duplicates.byCurp.push({
          current: { index, data: patient },
          duplicate: seenCurps.get(curpKey),
          key: curpKey
        });
      } else {
        seenCurps.set(curpKey, { index, data: patient });
      }
    }

    // Detectar duplicados por teléfono
    if (patient.cell_phone) {
      const phoneKey = patient.cell_phone.replace(/[\s\-\(\)]/g, '');
      if (seenPhones.has(phoneKey)) {
        duplicates.byPhone.push({
          current: { index, data: patient },
          duplicate: seenPhones.get(phoneKey),
          key: phoneKey
        });
      } else {
        seenPhones.set(phoneKey, { index, data: patient });
      }
    }
  });

  return {
    found: duplicates.byName.length > 0 || duplicates.byEmail.length > 0 || 
           duplicates.byCurp.length > 0 || duplicates.byPhone.length > 0,
    duplicates,
    summary: {
      byName: duplicates.byName.length,
      byEmail: duplicates.byEmail.length,
      byCurp: duplicates.byCurp.length,
      byPhone: duplicates.byPhone.length,
      total: duplicates.byName.length + duplicates.byEmail.length + 
             duplicates.byCurp.length + duplicates.byPhone.length
    }
  };
}

/**
 * Valida y procesa un conjunto completo de datos de importación
 * @param {Array} rawData - Datos sin procesar del CSV/Excel
 * @param {Object} options - Opciones de validación
 * @returns {Object} Resultado completo de validación
 */
async function validateImportData(rawData, options = {}) {
  const result = {
    valid: true,
    summary: {
      totalRows: rawData.length,
      validRows: 0,
      invalidRows: 0,
      warnings: 0,
      duplicates: 0
    },
    validatedData: [],
    errors: [],
    warnings: [],
    duplicates: {},
    preview: []
  };

  // Validar cada fila
  for (let i = 0; i < rawData.length; i++) {
    const rowData = rawData[i];
    const rowResult = validatePatientRow(rowData, i + 1);

    if (rowResult.valid) {
      result.summary.validRows++;
      result.validatedData.push({
        rowIndex: i + 1,
        originalData: rowData,
        cleanedData: rowResult.cleanedData
      });
    } else {
      result.valid = false;
      result.summary.invalidRows++;
      result.errors.push(...rowResult.errors);
    }

    result.warnings.push(...rowResult.warnings);
    result.summary.warnings += rowResult.warnings.length;
  }

  // Detectar duplicados en datos válidos
  const validPatients = result.validatedData.map(item => item.cleanedData);
  const duplicateResult = detectDuplicates(validPatients);
  
  result.duplicates = duplicateResult;
  result.summary.duplicates = duplicateResult.summary.total;

  if (duplicateResult.found) {
    result.valid = false;
  }

  // Generar preview de los primeros 10 registros válidos
  result.preview = result.validatedData.slice(0, 10).map(item => ({
    rowIndex: item.rowIndex,
    preview: {
      fullName: `${item.cleanedData.first_name} ${item.cleanedData.paternal_last_name} ${item.cleanedData.maternal_last_name || ''}`.trim(),
      birthDate: item.cleanedData.birth_date,
      gender: item.cleanedData.gender,
      email: item.cleanedData.email || 'Sin email',
      phone: item.cleanedData.cell_phone || 'Sin teléfono',
      clinic: item.cleanedData.clinic_id || 'Individual',
      completeness: calculateCompleteness(item.cleanedData)
    }
  }));

  return result;
}

/**
 * Calcula el porcentaje de completitud de los datos de un paciente
 * @param {Object} patientData - Datos del paciente  
 * @returns {number} Porcentaje de completitud (0-100)
 */
function calculateCompleteness(patientData) {
  const allFields = Object.keys(VALIDATION_RULES);
  const requiredFields = allFields.filter(field => VALIDATION_RULES[field].required);
  const optionalFields = allFields.filter(field => !VALIDATION_RULES[field].required);

  const completedRequired = requiredFields.filter(field => 
    patientData[field] && String(patientData[field]).trim()
  ).length;
  
  const completedOptional = optionalFields.filter(field => 
    patientData[field] && String(patientData[field]).trim()
  ).length;

  // Peso 80% campos requeridos, 20% opcionales
  const requiredScore = (completedRequired / requiredFields.length) * 80;
  const optionalScore = (completedOptional / optionalFields.length) * 20;

  return Math.round(requiredScore + optionalScore);
}

module.exports = {
  VALIDATION_RULES,
  validateField,
  validatePatientRow,
  detectDuplicates,
  validateImportData,
  calculateCompleteness
};