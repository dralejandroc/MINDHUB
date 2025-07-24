/**
 * Generador de plantillas Excel/CSV para importación masiva de pacientes
 * 
 * FUNCIONALIDADES:
 * 1. Generar plantilla Excel con campos requeridos
 * 2. Generar plantilla CSV 
 * 3. Incluir validaciones y ejemplos
 * 4. Soporte para clínicas e individuales
 */

/**
 * Definición de campos de la plantilla de pacientes
 */
const PATIENT_TEMPLATE_FIELDS = {
  // Campos requeridos
  required: [
    {
      field: 'first_name',
      label: 'Nombre',
      type: 'text',
      maxLength: 50,
      example: 'María Elena',
      validation: 'Requerido, 2-50 caracteres'
    },
    {
      field: 'paternal_last_name',
      label: 'Apellido Paterno',
      type: 'text',
      maxLength: 50,
      example: 'Rodríguez',
      validation: 'Requerido, 2-50 caracteres'
    },
    {
      field: 'birth_date',
      label: 'Fecha de Nacimiento',
      type: 'date',
      format: 'YYYY-MM-DD',
      example: '1985-03-15',
      validation: 'Requerido, formato YYYY-MM-DD'
    },
    {
      field: 'gender',
      label: 'Género',
      type: 'select',
      options: ['male', 'female', 'masculine', 'feminine', 'other', 'prefer_not_to_say'],
      example: 'female',
      validation: 'Requerido, opciones válidas: male, female, masculine, feminine, other, prefer_not_to_say'
    }
  ],

  // Campos opcionales
  optional: [
    {
      field: 'maternal_last_name',
      label: 'Apellido Materno',
      type: 'text',
      maxLength: 50,
      example: 'González',
      validation: 'Opcional, máximo 50 caracteres'
    },
    {
      field: 'email',
      label: 'Correo Electrónico',
      type: 'email',
      example: 'maria.rodriguez@email.com',
      validation: 'Opcional, formato de email válido'
    },
    {
      field: 'cell_phone',
      label: 'Teléfono Celular',
      type: 'phone',
      example: '+52 55 1234 5678',
      validation: 'Opcional, formato de teléfono mexicano'
    },
    {
      field: 'address',
      label: 'Dirección',
      type: 'text',
      maxLength: 200,
      example: 'Av. Insurgentes Sur 1234, Col. Del Valle',
      validation: 'Opcional, máximo 200 caracteres'
    },
    {
      field: 'city',
      label: 'Ciudad',
      type: 'text',
      maxLength: 100,
      example: 'Ciudad de México',
      validation: 'Opcional, máximo 100 caracteres'
    },
    {
      field: 'state',
      label: 'Estado',
      type: 'text',
      maxLength: 100,
      example: 'CDMX',
      validation: 'Opcional, máximo 100 caracteres'
    },
    {
      field: 'postal_code',
      label: 'Código Postal',
      type: 'text',
      maxLength: 10,
      example: '03100',
      validation: 'Opcional, máximo 10 caracteres'
    },
    {
      field: 'curp',
      label: 'CURP',
      type: 'text',
      pattern: '^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$',
      example: 'ROGM850315MDFNZR09',
      validation: 'Opcional, formato CURP válido (18 caracteres)'
    },
    {
      field: 'rfc',
      label: 'RFC',
      type: 'text',
      maxLength: 13,
      example: 'ROGM850315AB1',
      validation: 'Opcional, formato RFC válido'
    },
    {
      field: 'blood_type',
      label: 'Tipo de Sangre',
      type: 'select',
      options: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
      example: 'O+',
      validation: 'Opcional, tipos válidos: O+, O-, A+, A-, B+, B-, AB+, AB-'
    },
    {
      field: 'allergies',
      label: 'Alergias',
      type: 'text',
      maxLength: 500,
      example: 'Alergia a penicilina, polen',
      validation: 'Opcional, máximo 500 caracteres'
    },
    {
      field: 'emergency_contact_name',
      label: 'Nombre Contacto de Emergencia',
      type: 'text',
      maxLength: 100,
      example: 'Juan Rodríguez Pérez',
      validation: 'Opcional, máximo 100 caracteres'
    },
    {
      field: 'emergency_contact_phone',
      label: 'Teléfono Contacto de Emergencia',
      type: 'phone',
      example: '+52 55 9876 5432',
      validation: 'Opcional, formato de teléfono mexicano'
    }
  ],

  // Campos para clínicas
  clinic: [
    {
      field: 'clinic_id',
      label: 'ID de Clínica',
      type: 'text',
      example: 'CLI001-HOSPITAL-GENERAL',
      validation: 'Opcional, dejar vacío para pacientes individuales. Formato: CLI###-NOMBRE'
    }
  ]
};

/**
 * Genera array de headers para CSV/Excel
 * @param {boolean} includeClinic - Incluir campos de clínica
 * @returns {Array} Array de headers
 */
function generateHeaders(includeClinic = true) {
  const headers = [];
  
  // Agregar campos requeridos
  PATIENT_TEMPLATE_FIELDS.required.forEach(field => {
    headers.push({
      field: field.field,
      label: field.label,
      required: true,
      type: field.type,
      validation: field.validation,
      example: field.example
    });
  });

  // Agregar campos opcionales
  PATIENT_TEMPLATE_FIELDS.optional.forEach(field => {
    headers.push({
      field: field.field,
      label: field.label,
      required: false,
      type: field.type,
      validation: field.validation,
      example: field.example
    });
  });

  // Agregar campos de clínica si se solicita
  if (includeClinic) {
    PATIENT_TEMPLATE_FIELDS.clinic.forEach(field => {
      headers.push({
        field: field.field,
        label: field.label,
        required: false,
        type: field.type,
        validation: field.validation,
        example: field.example
      });
    });
  }

  return headers;
}

/**
 * Genera contenido CSV de la plantilla
 * @param {boolean} includeClinic - Incluir campos de clínica
 * @param {boolean} includeExamples - Incluir fila de ejemplos
 * @returns {string} Contenido CSV
 */
function generateCSVTemplate(includeClinic = true, includeExamples = true) {
  const headers = generateHeaders(includeClinic);
  
  let csvContent = '';
  
  // Header con nombres de campos
  const fieldNames = headers.map(h => h.field).join(',');
  csvContent += fieldNames + '\n';
  
  // Header con etiquetas (comentario)
  const labels = headers.map(h => `"${h.label}"`).join(',');
  csvContent += `# ${labels}\n`;
  
  // Header con validaciones (comentario)
  const validations = headers.map(h => `"${h.validation}"`).join(',');
  csvContent += `# ${validations}\n`;
  
  // Fila de ejemplos si se solicita
  if (includeExamples) {
    const examples = headers.map(h => {
      if (h.type === 'text' || h.type === 'email' || h.type === 'phone') {
        return `"${h.example}"`;
      }
      return h.example;
    }).join(',');
    csvContent += examples + '\n';
  }
  
  return csvContent;
}

/**
 * Genera datos de ejemplo para la plantilla
 * @param {number} count - Número de ejemplos a generar
 * @param {boolean} includeClinic - Incluir campos de clínica
 * @returns {Array} Array de objetos de ejemplo
 */
function generateExampleData(count = 5, includeClinic = true) {
  const examples = [
    {
      first_name: 'María Elena',
      paternal_last_name: 'Rodríguez',
      maternal_last_name: 'González',
      birth_date: '1985-03-15',
      gender: 'female',
      email: 'maria.rodriguez@email.com',
      cell_phone: '+52 55 1234 5678',
      address: 'Av. Insurgentes Sur 1234, Col. Del Valle',
      city: 'Ciudad de México',
      state: 'CDMX',
      postal_code: '03100',
      blood_type: 'O+',
      emergency_contact_name: 'Juan Rodríguez Pérez',
      emergency_contact_phone: '+52 55 9876 5432',
      clinic_id: includeClinic ? 'CLI001-HOSPITAL-GENERAL' : ''
    },
    {
      first_name: 'Carlos Alberto',
      paternal_last_name: 'Mendoza',
      maternal_last_name: 'Silva',
      birth_date: '1978-11-22',
      gender: 'male',
      email: 'carlos.mendoza@email.com',
      cell_phone: '+52 55 2345 6789',
      address: 'Calle Revolución 456, Col. Centro',
      city: 'Guadalajara',
      state: 'Jalisco',
      postal_code: '44100',
      blood_type: 'A+',
      emergency_contact_name: 'Ana Mendoza López',
      emergency_contact_phone: '+52 33 1234 5678',
      clinic_id: includeClinic ? 'CLI002-CLINICA-INTEGRAL' : ''
    },
    {
      first_name: 'Ana Patricia',
      paternal_last_name: 'Hernández',
      maternal_last_name: 'López',
      birth_date: '1992-07-08',
      gender: 'female',
      email: 'ana.hernandez@email.com',
      cell_phone: '+52 81 3456 7890',
      address: 'Av. Constitución 789, Col. Moderna',
      city: 'Monterrey',
      state: 'Nuevo León',
      postal_code: '64700',
      blood_type: 'B+',
      allergies: 'Alergia a penicilina',
      emergency_contact_name: 'Luis Hernández Morales',
      emergency_contact_phone: '+52 81 9876 5432',
      clinic_id: includeClinic ? '' : '' // Individual
    },
    {
      first_name: 'Jorge Luis',
      paternal_last_name: 'Vázquez',
      maternal_last_name: 'Morales',
      birth_date: '1989-12-03',
      gender: 'male',
      email: 'jorge.vazquez@email.com',
      cell_phone: '+52 33 4567 8901',
      address: 'Blvd. Miguel de Cervantes 321, Col. Moderna',
      city: 'Guadalajara',
      state: 'Jalisco',
      postal_code: '44600',
      blood_type: 'AB+',
      emergency_contact_name: 'Carmen Vázquez Torres',
      emergency_contact_phone: '+52 33 8765 4321',
      clinic_id: includeClinic ? 'CLI003-CENTRO-SALUD-MENTAL' : ''
    },
    {
      first_name: 'Sofía Isabel',
      paternal_last_name: 'Morales',
      maternal_last_name: 'Ramírez',
      birth_date: '1995-05-20',
      gender: 'feminine',
      email: 'sofia.morales@email.com',
      cell_phone: '+52 55 5678 9012',
      address: 'Calle Juárez 654, Col. Histórica',
      city: 'Puebla',
      state: 'Puebla',
      postal_code: '72000',
      blood_type: 'O-',
      allergies: 'Alergia a mariscos, lactosa',
      emergency_contact_name: 'Roberto Morales Jiménez',
      emergency_contact_phone: '+52 22 6789 0123',
      clinic_id: includeClinic ? '' : '' // Individual
    }
  ];

  return examples.slice(0, Math.min(count, examples.length));
}

/**
 * Genera documentación de la plantilla
 * @returns {string} Documentación en formato texto
 */
function generateDocumentation() {
  const headers = generateHeaders(true);
  
  let doc = `PLANTILLA DE IMPORTACIÓN MASIVA DE PACIENTES - MINDHUB
==================================================

INSTRUCCIONES DE USO:
1. Complete los campos requeridos (marcados con *)
2. Los campos opcionales pueden dejarse vacíos
3. Respete los formatos especificados
4. Guarde el archivo como CSV (UTF-8) o Excel (.xlsx)
5. Use la función de importación en MindHub/Expedix

CAMPOS DISPONIBLES:
==================

`;

  // Campos requeridos
  doc += 'CAMPOS REQUERIDOS (*):\n';
  doc += '---------------------\n';
  headers.filter(h => h.required).forEach(field => {
    doc += `${field.field.toUpperCase()}\n`;
    doc += `  Etiqueta: ${field.label}\n`;
    doc += `  Tipo: ${field.type}\n`;
    doc += `  Validación: ${field.validation}\n`;
    doc += `  Ejemplo: ${field.example}\n\n`;
  });

  // Campos opcionales
  doc += 'CAMPOS OPCIONALES:\n';
  doc += '-----------------\n';
  headers.filter(h => !h.required).forEach(field => {
    doc += `${field.field.toUpperCase()}\n`;
    doc += `  Etiqueta: ${field.label}\n`;
    doc += `  Tipo: ${field.type}\n`;
    doc += `  Validación: ${field.validation}\n`;
    doc += `  Ejemplo: ${field.example}\n\n`;
  });

  doc += `FORMATOS ESPECIALES:
===================

FECHAS:
- Formato: YYYY-MM-DD (ejemplo: 1985-03-15)
- Use siempre 4 dígitos para el año

TELÉFONOS:
- Formato mexicano recomendado: +52 ## #### ####
- También acepta: 55 1234 5678, (55) 1234-5678

GÉNERO:
- Opciones válidas: male, female, masculine, feminine, other, prefer_not_to_say
- Use exactamente estos valores (en inglés, minúsculas)

TIPO DE SANGRE:
- Opciones válidas: O+, O-, A+, A-, B+, B-, AB+, AB-

CURP:
- Formato: AAAA######HAAAAA## (18 caracteres)
- Ejemplo: ROGM850315MDFNZR09

CLÍNICAS:
- Formato: CLI###-NOMBRE-CLINICA
- Dejar vacío para pacientes individuales
- Ejemplo: CLI001-HOSPITAL-GENERAL

NOTAS IMPORTANTES:
==================

• Los pacientes con clinic_id serán asociados a esa clínica
• Los pacientes sin clinic_id serán individuales
• Se generarán IDs únicos automáticamente
• Los campos de contacto de emergencia son recomendables
• Las alergias deben listarse separadas por comas
• Todos los textos deben estar en UTF-8

SOPORTE:
========
Para dudas sobre la importación, contacte al administrador del sistema.

Generado por MindHub - Sistema de Gestión Sanitaria
Fecha: ${new Date().toLocaleDateString('es-ES')}
`;

  return doc;
}

module.exports = {
  PATIENT_TEMPLATE_FIELDS,
  generateHeaders,
  generateCSVTemplate,
  generateExampleData,
  generateDocumentation
};