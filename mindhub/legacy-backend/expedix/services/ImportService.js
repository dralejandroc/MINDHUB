/**
 * ImportService.js
 * Servicio para la importación masiva de pacientes desde archivos Excel/CSV
 * Solo disponible para usuarios Premium y Clínicas
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

class ImportService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../../temp/imports');
    this.templatesDir = path.join(__dirname, '../../../templates');
    this.ensureDirs();
    
    // Mapeo de campos requeridos y opcionales
    this.requiredFields = [
      'firstName',
      'paternalLastName',
      'dateOfBirth',
      'gender',
      'phone'
    ];
    
    this.optionalFields = [
      'maternalLastName',
      'email',
      'address',
      'city',
      'state',
      'postalCode',
      'bloodType',
      'allergies',
      'emergencyContactName',
      'emergencyContactPhone',
      'rfc',
      'curp'
    ];
    
    this.allFields = [...this.requiredFields, ...this.optionalFields];
  }

  ensureDirs() {
    [this.tempDir, this.templatesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Genera una plantilla de Excel para importación de pacientes
   * @param {string} templateType - 'basic' | 'complete' | 'clinic'
   * @returns {Promise<string>} - Path del archivo de plantilla generado
   */
  async generateImportTemplate(templateType = 'complete') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Pacientes');
      
      // Configurar propiedades del workbook
      workbook.creator = 'MindHub Expedix';
      workbook.lastModifiedBy = 'Sistema';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Definir campos según el tipo de plantilla
      let fieldsToInclude = [];
      let exampleData = [];
      
      switch (templateType) {
        case 'basic':
          fieldsToInclude = [
            'firstName', 'paternalLastName', 'maternalLastName',
            'dateOfBirth', 'gender', 'phone', 'email'
          ];
          exampleData = [{
            firstName: 'Juan',
            paternalLastName: 'García',
            maternalLastName: 'López',
            dateOfBirth: '1985-03-15',
            gender: 'masculine',
            phone: '5551234567',
            email: 'juan.garcia@email.com'
          }];
          break;
          
        case 'complete':
          fieldsToInclude = this.allFields;
          exampleData = [{
            firstName: 'María',
            paternalLastName: 'Rodríguez',
            maternalLastName: 'Martínez',
            dateOfBirth: '1990-07-22',
            gender: 'feminine',
            phone: '5559876543',
            email: 'maria.rodriguez@email.com',
            address: 'Av. Reforma 123, Col. Centro',
            city: 'Ciudad de México',
            state: 'CDMX',
            postalCode: '06000',
            bloodType: 'O+',
            allergies: 'Penicilina, Polen',
            emergencyContactName: 'Pedro Rodríguez',
            emergencyContactPhone: '5551111111',
            rfc: 'ROMA900722XXX',
            curp: 'ROMA900722MDFDRR01'
          }];
          break;
          
        case 'clinic':
          fieldsToInclude = [...this.allFields, 'assignedDoctor', 'patientGroup', 'insurance'];
          exampleData = [{
            firstName: 'Carlos',
            paternalLastName: 'Sánchez',
            maternalLastName: 'Pérez',
            dateOfBirth: '1975-11-30',
            gender: 'masculine',
            phone: '5556789012',
            email: 'carlos.sanchez@email.com',
            address: 'Calle Morelos 456',
            city: 'Guadalajara',
            state: 'Jalisco',
            postalCode: '44100',
            bloodType: 'A-',
            allergies: 'Ninguna conocida',
            emergencyContactName: 'Ana Sánchez',
            emergencyContactPhone: '5552222222',
            assignedDoctor: 'Dr. López',
            patientGroup: 'Diabetes',
            insurance: 'IMSS'
          }];
          break;
      }
      
      // Crear encabezados
      const headers = fieldsToInclude.map(field => {
        return this.getFieldDisplayName(field);
      });
      
      // Agregar fila de encabezados
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0891B2' } // Color MindHub
      };
      headerRow.alignment = { horizontal: 'center' };
      
      // Agregar fila de ejemplo
      const exampleRow = exampleData.map(example => {
        return fieldsToInclude.map(field => example[field] || '');
      });
      
      exampleRow.forEach(row => {
        const addedRow = worksheet.addRow(row);
        addedRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F4F8' }
        };
      });
      
      // Ajustar ancho de columnas
      worksheet.columns.forEach((column, index) => {
        const field = fieldsToInclude[index];
        column.width = this.getColumnWidth(field);
        
        // Agregar validación para campos específicos
        this.addColumnValidation(worksheet, column, field, index + 1);
      });
      
      // Agregar hoja de instrucciones
      this.addInstructionsSheet(workbook, templateType);
      
      // Guardar archivo
      const fileName = `plantilla-pacientes-${templateType}-${Date.now()}.xlsx`;
      const filePath = path.join(this.templatesDir, fileName);
      
      await workbook.xlsx.writeFile(filePath);
      return filePath;
      
    } catch (error) {
      console.error('Error generating import template:', error);
      throw error;
    }
  }

  /**
   * Procesa un archivo de importación de pacientes
   * @param {string} filePath - Ruta del archivo a procesar
   * @param {string} userId - ID del usuario que importa
   * @param {Object} options - Opciones de importación
   * @returns {Promise<Object>} - Resultado del procesamiento
   */
  async processImportFile(filePath, userId, options = {}) {
    try {
      // Verificar permisos del usuario
      await this.checkUserPermissions(userId);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const worksheet = workbook.getWorksheet('Pacientes') || workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No se encontró la hoja de "Pacientes" en el archivo');
      }
      
      const results = {
        total: 0,
        processed: 0,
        errors: [],
        warnings: [],
        patients: []
      };
      
      // Procesar encabezados
      const headers = [];
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = this.mapHeaderToField(cell.text);
      });
      
      // Validar que existan los campos requeridos
      const missingFields = this.requiredFields.filter(field => 
        !headers.includes(field)
      );
      
      if (missingFields.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }
      
      // Procesar filas de datos
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        try {
          const patientData = this.extractPatientData(row, headers);
          
          if (this.isEmptyRow(patientData)) {
            return; // Skip empty rows
          }
          
          results.total++;
          
          // Validar datos del paciente
          const validation = this.validatePatientData(patientData, rowNumber);
          
          if (validation.errors.length > 0) {
            results.errors.push(...validation.errors);
            return;
          }
          
          if (validation.warnings.length > 0) {
            results.warnings.push(...validation.warnings);
          }
          
          // Preparar datos para inserción
          const processedPatient = this.preparePatientForDatabase(patientData, userId);
          results.patients.push(processedPatient);
          results.processed++;
          
        } catch (error) {
          results.errors.push({
            row: rowNumber,
            error: error.message,
            type: 'PROCESSING_ERROR'
          });
        }
      });
      
      // Si no hay errores críticos, proceder con la inserción
      if (options.dryRun !== true && results.errors.length === 0) {
        await this.insertPatients(results.patients, userId);
      }
      
      return results;
      
    } catch (error) {
      console.error('Error processing import file:', error);
      throw error;
    }
  }

  /**
   * Verifica que el usuario tenga permisos para importar pacientes
   */
  async checkUserPermissions(userId) {
    // TODO: Implementar verificación real de permisos
    // Por ahora, simular que todos los usuarios pueden importar
    // En producción, verificar que sea Premium o Clínica
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        subscription: true, 
        accountType: true,
        limits: true 
      }
    }).catch(() => null);
    
    // Simular verificación de permisos
    const isPremium = user?.subscription === 'premium' || 
                     user?.subscription === 'unlimited' ||
                     user?.accountType === 'clinic';
    
    if (!isPremium) {
      throw new Error('La importación masiva de pacientes solo está disponible para usuarios Premium y Clínicas');
    }
    
    return true;
  }

  /**
   * Inserta los pacientes validados en la base de datos
   */
  async insertPatients(patients, userId) {
    const transaction = await prisma.$transaction(async (prisma) => {
      const results = [];
      
      for (const patient of patients) {
        try {
          const created = await prisma.patient.create({
            data: {
              ...patient,
              createdBy: userId
            }
          });
          results.push(created);
        } catch (error) {
          console.error('Error inserting patient:', error);
          // En caso de error, continuar con el siguiente
          results.push({ error: error.message, data: patient });
        }
      }
      
      return results;
    });
    
    return transaction;
  }

  // ============ Métodos auxiliares ============

  getFieldDisplayName(field) {
    const fieldMap = {
      firstName: 'Nombre',
      paternalLastName: 'Apellido Paterno',
      maternalLastName: 'Apellido Materno',
      dateOfBirth: 'Fecha de Nacimiento (YYYY-MM-DD)',
      gender: 'Género (masculine/feminine)',
      phone: 'Teléfono',
      email: 'Email',
      address: 'Dirección',
      city: 'Ciudad',
      state: 'Estado',
      postalCode: 'Código Postal',
      bloodType: 'Tipo de Sangre',
      allergies: 'Alergias',
      emergencyContactName: 'Contacto de Emergencia',
      emergencyContactPhone: 'Teléfono de Emergencia',
      rfc: 'RFC',
      curp: 'CURP',
      assignedDoctor: 'Doctor Asignado',
      patientGroup: 'Grupo de Paciente',
      insurance: 'Seguro Médico'
    };
    
    return fieldMap[field] || field;
  }

  getColumnWidth(field) {
    const widthMap = {
      firstName: 15,
      paternalLastName: 18,
      maternalLastName: 18,
      dateOfBirth: 20,
      gender: 18,
      phone: 15,
      email: 25,
      address: 30,
      city: 15,
      state: 12,
      postalCode: 12,
      bloodType: 12,
      allergies: 25,
      emergencyContactName: 20,
      emergencyContactPhone: 18,
      rfc: 15,
      curp: 20
    };
    
    return widthMap[field] || 15;
  }

  addColumnValidation(worksheet, column, field, colIndex) {
    const colLetter = String.fromCharCode(64 + colIndex);
    
    switch (field) {
      case 'gender':
        worksheet.dataValidations.add(`${colLetter}2:${colLetter}1000`, {
          type: 'list',
          allowBlank: false,
          formulae: ['"masculine,feminine"'],
          showErrorMessage: true,
          errorTitle: 'Valor inválido',
          error: 'Debe ser "masculine" o "feminine"'
        });
        break;
        
      case 'dateOfBirth':
        worksheet.dataValidations.add(`${colLetter}2:${colLetter}1000`, {
          type: 'date',
          allowBlank: false,
          showErrorMessage: true,
          errorTitle: 'Fecha inválida',
          error: 'Debe ser una fecha válida en formato YYYY-MM-DD'
        });
        break;
        
      case 'email':
        worksheet.dataValidations.add(`${colLetter}2:${colLetter}1000`, {
          type: 'custom',
          allowBlank: true,
          formulae: ['ISERROR(FIND("@",A2))=FALSE'],
          showErrorMessage: true,
          errorTitle: 'Email inválido',
          error: 'Debe ser un email válido'
        });
        break;
    }
  }

  addInstructionsSheet(workbook, templateType) {
    const instructionsSheet = workbook.addWorksheet('Instrucciones');
    
    const instructions = [
      'INSTRUCCIONES PARA IMPORTACIÓN DE PACIENTES',
      '',
      '1. CAMPOS REQUERIDOS (obligatorios):',
      '   • Nombre',
      '   • Apellido Paterno', 
      '   • Fecha de Nacimiento (formato: YYYY-MM-DD, ejemplo: 1985-03-15)',
      '   • Género (solo "masculine" o "feminine")',
      '   • Teléfono',
      '',
      '2. CAMPOS OPCIONALES:',
      '   • Todos los demás campos pueden dejarse vacíos',
      '',
      '3. FORMATOS ESPECIALES:',
      '   • Fechas: YYYY-MM-DD (ejemplo: 1990-12-25)',
      '   • Género: masculine o feminine (exactamente así)',
      '   • Teléfono: Solo números, con o sin código de área',
      '   • Email: Debe incluir @ y dominio válido',
      '',
      '4. LÍMITES:',
      templateType === 'basic' ? '   • Máximo 100 pacientes por importación' :
      templateType === 'complete' ? '   • Máximo 500 pacientes por importación' :
      '   • Máximo 1000 pacientes por importación (solo clínicas)',
      '',
      '5. CONSEJOS:',
      '   • No modifique los nombres de las columnas',
      '   • Elimine la fila de ejemplo antes de importar',
      '   • Revise los datos antes de guardar',
      '   • Mantenga copias de respaldo de sus datos',
      '',
      '6. SOPORTE:',
      '   • En caso de errores, contacte al soporte técnico',
      '   • Incluya el archivo y descripción del problema'
    ];
    
    instructions.forEach((line, index) => {
      const row = instructionsSheet.addRow([line]);
      if (index === 0) {
        row.font = { bold: true, size: 16 };
      } else if (line.match(/^\d+\./)) {
        row.font = { bold: true, size: 12 };
      }
    });
    
    instructionsSheet.getColumn(1).width = 80;
  }

  mapHeaderToField(headerText) {
    const headerMap = {
      'Nombre': 'firstName',
      'Apellido Paterno': 'paternalLastName',
      'Apellido Materno': 'maternalLastName',
      'Fecha de Nacimiento (YYYY-MM-DD)': 'dateOfBirth',
      'Género (masculine/feminine)': 'gender',
      'Teléfono': 'phone',
      'Email': 'email',
      'Dirección': 'address',
      'Ciudad': 'city',
      'Estado': 'state',
      'Código Postal': 'postalCode',
      'Tipo de Sangre': 'bloodType',
      'Alergias': 'allergies',
      'Contacto de Emergencia': 'emergencyContactName',
      'Teléfono de Emergencia': 'emergencyContactPhone',
      'RFC': 'rfc',
      'CURP': 'curp'
    };
    
    return headerMap[headerText] || null;
  }

  extractPatientData(row, headers) {
    const patientData = {};
    
    row.eachCell((cell, colNumber) => {
      const field = headers[colNumber];
      if (field) {
        patientData[field] = cell.text?.trim() || '';
      }
    });
    
    return patientData;
  }

  isEmptyRow(patientData) {
    const nonEmptyValues = Object.values(patientData).filter(value => 
      value && value.toString().trim() !== ''
    );
    return nonEmptyValues.length === 0;
  }

  validatePatientData(patientData, rowNumber) {
    const errors = [];
    const warnings = [];
    
    // Validar campos requeridos
    this.requiredFields.forEach(field => {
      if (!patientData[field] || patientData[field].trim() === '') {
        errors.push({
          row: rowNumber,
          field: this.getFieldDisplayName(field),
          error: 'Campo requerido vacío',
          type: 'REQUIRED_FIELD'
        });
      }
    });
    
    // Validaciones específicas
    if (patientData.dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(patientData.dateOfBirth)) {
        errors.push({
          row: rowNumber,
          field: 'Fecha de Nacimiento',
          error: 'Formato de fecha inválido. Use YYYY-MM-DD',
          type: 'FORMAT_ERROR'
        });
      } else {
        const date = new Date(patientData.dateOfBirth);
        const today = new Date();
        if (date >= today) {
          errors.push({
            row: rowNumber,
            field: 'Fecha de Nacimiento',
            error: 'La fecha de nacimiento debe ser anterior a hoy',
            type: 'LOGIC_ERROR'
          });
        }
        if (today.getFullYear() - date.getFullYear() > 120) {
          warnings.push({
            row: rowNumber,
            field: 'Fecha de Nacimiento',
            warning: 'Edad mayor a 120 años, verifique la fecha',
            type: 'DATA_WARNING'
          });
        }
      }
    }
    
    if (patientData.gender && !['masculine', 'feminine'].includes(patientData.gender)) {
      errors.push({
        row: rowNumber,
        field: 'Género',
        error: 'Debe ser "masculine" o "feminine"',
        type: 'VALUE_ERROR'
      });
    }
    
    if (patientData.email && patientData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patientData.email)) {
        errors.push({
          row: rowNumber,
          field: 'Email',
          error: 'Formato de email inválido',
          type: 'FORMAT_ERROR'
        });
      }
    }
    
    return { errors, warnings };
  }

  preparePatientForDatabase(patientData, userId) {
    const prepared = {
      firstName: patientData.firstName?.trim(),
      paternalLastName: patientData.paternalLastName?.trim(),
      maternalLastName: patientData.maternalLastName?.trim() || null,
      dateOfBirth: new Date(patientData.dateOfBirth),
      gender: patientData.gender,
      phone: patientData.phone?.trim(),
      email: patientData.email?.trim() || null,
      address: patientData.address?.trim() || null,
      city: patientData.city?.trim() || null,
      state: patientData.state?.trim() || null,
      postalCode: patientData.postalCode?.trim() || null,
      bloodType: patientData.bloodType?.trim() || null,
      allergies: patientData.allergies?.trim() || null,
      emergencyContactName: patientData.emergencyContactName?.trim() || null,
      emergencyContactPhone: patientData.emergencyContactPhone?.trim() || null,
      rfc: patientData.rfc?.trim() || null,
      curp: patientData.curp?.trim() || this.generateCURP(patientData),
      medicalRecordNumber: this.generateMedicalRecordNumber(),
      consentToTreatment: true,
      consentToDataProcessing: true,
      isActive: true
    };
    
    return prepared;
  }

  generateMedicalRecordNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `EXP-${year}-${random}`;
  }

  generateCURP(patientData) {
    // Generar CURP básico (incompleto) para demostración
    const lastName = patientData.paternalLastName?.substring(0, 2).toUpperCase() || 'XX';
    const firstName = patientData.firstName?.substring(0, 2).toUpperCase() || 'XX';
    const date = patientData.dateOfBirth ? patientData.dateOfBirth.replace(/-/g, '').substring(2) : '000101';
    const gender = patientData.gender === 'masculine' ? 'H' : 'M';
    
    return `${lastName}${firstName}${date}${gender}XX000`;
  }

  // Método para limpiar archivos temporales
  async cleanupTempFiles(olderThanHours = 2) {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        const ageInHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        if (ageInHours > olderThanHours) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old import file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

module.exports = ImportService;