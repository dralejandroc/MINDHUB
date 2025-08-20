/**
 * ExportService.js
 * Servicio para la exportación de datos de pacientes en diferentes formatos
 * Optimizado para minimizar uso de recursos y espacio en disco
 */

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

class ExportService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../../temp/exports');
    this.ensureTempDir();
    
    // Configuración de página optimizada para ahorrar espacio
    this.pdfConfig = {
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      fontSize: {
        title: 14,
        subtitle: 12,
        normal: 10,
        small: 8
      },
      spacing: {
        line: 12,
        paragraph: 8,
        section: 15
      }
    };
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Exporta una consulta individual en PDF
   * @param {string} consultationId - ID de la consulta
   * @param {string} userId - ID del usuario/clínica
   * @returns {Promise<string>} - Path del archivo generado
   */
  async exportConsultation(consultationId, userId) {
    try {
      const consultation = await prisma.consultation.findFirst({
        where: {
          id: consultationId,
          patient: { createdBy: userId }
        },
        include: {
          patient: true,
          consultant: {
            select: { firstName: true, lastName: true, email: true }
          },
          prescriptions: {
            include: { medication: true }
          }
        }
      });

      if (!consultation) {
        throw new Error('Consulta no encontrada');
      }

      const fileName = `consulta-${consultation.patient.medicalRecordNumber}-${new Date(consultation.consultationDate).toISOString().split('T')[0]}.pdf`;
      const filePath = path.join(this.tempDir, fileName);

      const doc = new PDFDocument(this.pdfConfig);
      doc.pipe(fs.createWriteStream(filePath));

      // Header compacto
      this.addConsultationHeader(doc, consultation);
      
      // Información del paciente (1 línea)
      this.addPatientSummary(doc, consultation.patient);
      
      // Contenido de la consulta
      this.addConsultationContent(doc, consultation);
      
      // Prescripciones si existen
      if (consultation.prescriptions?.length > 0) {
        this.addPrescriptionsSummary(doc, consultation.prescriptions);
      }

      doc.end();

      return filePath;
    } catch (error) {
      console.error('Error exporting consultation:', error);
      throw error;
    }
  }

  /**
   * Exporta el expediente completo de un paciente (optimizado)
   * @param {string} patientId - ID del paciente
   * @param {string} userId - ID del usuario/clínica
   * @param {Object} options - Opciones de exportación
   * @returns {Promise<string>} - Path del archivo ZIP generado
   */
  async exportPatientRecord(patientId, userId, options = {}) {
    try {
      const patient = await this.getPatientCompleteData(patientId, userId);
      
      if (!patient) {
        throw new Error('Paciente no encontrado');
      }

      const exportName = `expediente-${patient.medicalRecordNumber}-${Date.now()}`;
      const exportDir = path.join(this.tempDir, exportName);
      const zipPath = path.join(this.tempDir, `${exportName}.zip`);

      // Crear directorio temporal
      fs.mkdirSync(exportDir, { recursive: true });

      // Generar expediente principal en PDF (compacto)
      const mainRecordPath = await this.generateCompactPatientRecord(patient, exportDir);
      
      // Exportar consultas individuales (opcional)
      if (options.includeIndividualConsultations) {
        await this.exportConsultationsIndividually(patient.consultations, exportDir);
      }

      // Exportar evaluaciones (opcional)
      if (options.includeAssessments && patient.scaleAdministrations?.length > 0) {
        await this.exportAssessmentsSummary(patient.scaleAdministrations, exportDir);
      }

      // Crear archivo ZIP
      await this.createZipArchive(exportDir, zipPath);
      
      // Limpiar directorio temporal
      fs.rmSync(exportDir, { recursive: true, force: true });

      return zipPath;
    } catch (error) {
      console.error('Error exporting patient record:', error);
      throw error;
    }
  }

  /**
   * Exporta tabla de datos de pacientes en Excel
   * @param {string} userId - ID del usuario/clínica
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<string>} - Path del archivo Excel generado
   */
  async exportPatientsTable(userId, filters = {}) {
    try {
      const patients = await this.getPatientsForTable(userId, filters);
      
      const fileName = `pacientes-${Date.now()}.xlsx`;
      const filePath = path.join(this.tempDir, fileName);

      const workbook = new ExcelJS.Workbook();
      
      // Hoja principal con datos de pacientes
      const mainSheet = workbook.addWorksheet('Pacientes');
      this.setupPatientsSheet(mainSheet, patients);

      // Hoja de estadísticas si se solicita
      if (filters.includeStats) {
        const statsSheet = workbook.addWorksheet('Estadísticas');
        this.setupStatsSheet(statsSheet, patients);
      }

      await workbook.xlsx.writeFile(filePath);
      return filePath;
    } catch (error) {
      console.error('Error exporting patients table:', error);
      throw error;
    }
  }

  // ============ Métodos auxiliares para PDF ============

  addConsultationHeader(doc, consultation) {
    doc.fontSize(this.pdfConfig.fontSize.title)
       .text('CONSULTA MÉDICA', { align: 'center' })
       .fontSize(this.pdfConfig.fontSize.small)
       .text(`Fecha: ${new Date(consultation.consultationDate).toLocaleDateString('es-MX')}`, { align: 'right' })
       .moveDown(0.5);
  }

  addPatientSummary(doc, patient) {
    const age = this.calculateAge(patient.dateOfBirth);
    const summary = `${patient.firstName} ${patient.paternalLastName} ${patient.maternalLastName || ''} | ${age} años | ${patient.gender === 'masculine' ? 'M' : 'F'} | Exp: ${patient.medicalRecordNumber}`;
    
    doc.fontSize(this.pdfConfig.fontSize.normal)
       .text(summary, { align: 'left' })
       .moveDown(0.5);
  }

  addConsultationContent(doc, consultation) {
    const sections = [
      { title: 'MOTIVO', content: consultation.reason },
      { title: 'NOTAS', content: consultation.notes },
      { title: 'DIAGNÓSTICO', content: consultation.diagnosis },
      { title: 'PLAN', content: consultation.treatmentPlan }
    ];

    sections.forEach(section => {
      if (section.content?.trim()) {
        doc.fontSize(this.pdfConfig.fontSize.subtitle)
           .text(section.title, { underline: true })
           .fontSize(this.pdfConfig.fontSize.normal)
           .text(section.content, { align: 'justify' })
           .moveDown(0.3);
      }
    });
  }

  addPrescriptionsSummary(doc, prescriptions) {
    doc.fontSize(this.pdfConfig.fontSize.subtitle)
       .text('MEDICAMENTOS', { underline: true })
       .fontSize(this.pdfConfig.fontSize.normal);
    
    prescriptions.forEach(prescription => {
      const medication = prescription.medication;
      doc.text(`• ${medication.name} - ${prescription.dosage} - ${prescription.frequency}`);
    });
  }

  // ============ Métodos para expediente completo ============

  async getPatientCompleteData(patientId, userId) {
    return await prisma.patient.findFirst({
      where: {
        id: patientId,
        createdBy: userId
      },
      include: {
        consultations: {
          orderBy: { consultationDate: 'desc' },
          include: {
            consultant: {
              select: { firstName: true, lastName: true }
            },
            prescriptions: {
              include: { medication: true }
            }
          }
        },
        prescriptions: {
          where: { status: 'active' },
          include: { medication: true }
        },
        medicalHistory: {
          orderBy: { diagnosedAt: 'desc' }
        },
        scaleAdministrations: {
          orderBy: { administrationDate: 'desc' },
          include: {
            scale: {
              select: { name: true, abbreviation: true }
            }
          }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            consultations: true,
            prescriptions: true,
            medicalHistory: true,
            scaleAdministrations: true,
            documents: true
          }
        }
      }
    });
  }

  async generateCompactPatientRecord(patient, exportDir) {
    const fileName = `expediente-${patient.medicalRecordNumber}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument(this.pdfConfig);
    doc.pipe(fs.createWriteStream(filePath));

    // Página 1: Datos generales y resumen
    this.addPatientHeaderPage(doc, patient);
    
    // Página 2: Historial médico y consultas recientes
    doc.addPage();
    this.addMedicalHistoryPage(doc, patient);
    
    // Página 3: Medicamentos y evaluaciones (si existen)
    if (patient.prescriptions?.length > 0 || patient.scaleAdministrations?.length > 0) {
      doc.addPage();
      this.addMedicationsAndAssessmentsPage(doc, patient);
    }

    doc.end();
    return filePath;
  }

  addPatientHeaderPage(doc, patient) {
    // Encabezado del expediente
    doc.fontSize(16).text('EXPEDIENTE MÉDICO', { align: 'center' })
       .moveDown(0.5);
    
    // Datos personales en formato compacto
    const personalData = [
      [`Expediente: ${patient.medicalRecordNumber}`, `Fecha: ${new Date().toLocaleDateString('es-MX')}`],
      [`Nombre: ${patient.firstName} ${patient.paternalLastName} ${patient.maternalLastName || ''}`, `Edad: ${this.calculateAge(patient.dateOfBirth)} años`],
      [`Nacimiento: ${new Date(patient.dateOfBirth).toLocaleDateString('es-MX')}`, `Género: ${patient.gender === 'masculine' ? 'Masculino' : 'Femenino'}`],
      [`Teléfono: ${patient.phone || 'N/A'}`, `Email: ${patient.email || 'N/A'}`],
      [`CURP: ${patient.curp || 'N/A'}`, `Tipo de sangre: ${patient.bloodType || 'N/A'}`]
    ];

    doc.fontSize(10);
    personalData.forEach(([left, right]) => {
      doc.text(left, 50, doc.y, { width: 250, continued: true })
         .text(right, 300, doc.y, { width: 250 });
    });

    doc.moveDown(0.5);

    // Alergias y contacto de emergencia
    if (patient.allergies) {
      doc.fontSize(12).text('ALERGIAS:', { underline: true })
         .fontSize(10).text(patient.allergies)
         .moveDown(0.3);
    }

    if (patient.emergencyContactName) {
      doc.fontSize(12).text('CONTACTO DE EMERGENCIA:', { underline: true })
         .fontSize(10).text(`${patient.emergencyContactName} - ${patient.emergencyContactPhone || 'N/A'}`)
         .moveDown(0.3);
    }

    // Resumen numérico
    doc.fontSize(12).text('RESUMEN DEL EXPEDIENTE:', { underline: true })
       .fontSize(10)
       .text(`Consultas: ${patient._count?.consultations || 0}`)
       .text(`Medicamentos activos: ${patient._count?.prescriptions || 0}`)
       .text(`Condiciones médicas: ${patient._count?.medicalHistory || 0}`)
       .text(`Evaluaciones: ${patient._count?.scaleAdministrations || 0}`)
       .text(`Documentos: ${patient._count?.documents || 0}`);
  }

  addMedicalHistoryPage(doc, patient) {
    doc.fontSize(14).text('HISTORIAL MÉDICO', { align: 'center' })
       .moveDown(0.5);

    // Condiciones médicas
    if (patient.medicalHistory?.length > 0) {
      doc.fontSize(12).text('CONDICIONES MÉDICAS:', { underline: true });
      patient.medicalHistory.slice(0, 10).forEach(condition => {
        doc.fontSize(10)
           .text(`• ${condition.condition} (${new Date(condition.diagnosedAt).toLocaleDateString('es-MX')})`);
      });
      doc.moveDown(0.5);
    }

    // Últimas consultas (resumen)
    if (patient.consultations?.length > 0) {
      doc.fontSize(12).text('ÚLTIMAS CONSULTAS:', { underline: true });
      patient.consultations.slice(0, 5).forEach(consultation => {
        const date = new Date(consultation.consultationDate).toLocaleDateString('es-MX');
        const doctor = consultation.consultant ? 
          `${consultation.consultant.firstName} ${consultation.consultant.lastName}` : 'N/A';
        
        doc.fontSize(10)
           .text(`${date} - Dr. ${doctor}`, { continued: true })
           .text(` | ${consultation.reason?.substring(0, 80) || 'Sin motivo especificado'}...`);
        
        if (consultation.diagnosis) {
          doc.fontSize(9)
             .text(`  Dx: ${consultation.diagnosis.substring(0, 100)}...`, { indent: 20 });
        }
        doc.moveDown(0.2);
      });
    }
  }

  addMedicationsAndAssessmentsPage(doc, patient) {
    doc.fontSize(14).text('MEDICAMENTOS Y EVALUACIONES', { align: 'center' })
       .moveDown(0.5);

    // Medicamentos activos
    if (patient.prescriptions?.length > 0) {
      doc.fontSize(12).text('MEDICAMENTOS ACTIVOS:', { underline: true });
      patient.prescriptions.forEach(prescription => {
        doc.fontSize(10)
           .text(`• ${prescription.medication.name} - ${prescription.dosage} - ${prescription.frequency}`);
      });
      doc.moveDown(0.5);
    }

    // Evaluaciones recientes
    if (patient.scaleAdministrations?.length > 0) {
      doc.fontSize(12).text('EVALUACIONES RECIENTES:', { underline: true });
      patient.scaleAdministrations.slice(0, 10).forEach(assessment => {
        const date = new Date(assessment.administrationDate).toLocaleDateString('es-MX');
        doc.fontSize(10)
           .text(`• ${assessment.scale.name} (${date}) - Puntuación: ${assessment.totalScore} - ${assessment.severity || 'N/A'}`);
      });
    }
  }

  // ============ Métodos para exportación de Excel ============

  async getPatientsForTable(userId, filters) {
    const whereClause = {
      createdBy: userId,
      isActive: filters.includeInactive ? undefined : true
    };

    if (filters.searchTerm) {
      whereClause.OR = [
        { firstName: { contains: filters.searchTerm, mode: 'insensitive' } },
        { lastName: { contains: filters.searchTerm, mode: 'insensitive' } },
        { medicalRecordNumber: { contains: filters.searchTerm, mode: 'insensitive' } }
      ];
    }

    return await prisma.patient.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            consultations: true,
            prescriptions: true,
            medicalHistory: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  setupPatientsSheet(sheet, patients) {
    // Encabezados
    const headers = [
      'Expediente', 'Nombre', 'Apellidos', 'Edad', 'Género',
      'Teléfono', 'Email', 'Ciudad', 'CURP', 'Tipo Sangre',
      'Alergias', 'Consultas', 'Medicamentos', 'Historial', 'Fecha Registro'
    ];

    sheet.addRow(headers);
    
    // Formatear encabezados
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Datos de pacientes
    patients.forEach(patient => {
      sheet.addRow([
        patient.medicalRecordNumber,
        patient.firstName,
        `${patient.paternalLastName} ${patient.maternalLastName || ''}`.trim(),
        this.calculateAge(patient.dateOfBirth),
        patient.gender === 'masculine' ? 'M' : 'F',
        patient.phone || '',
        patient.email || '',
        patient.city || '',
        patient.curp || '',
        patient.bloodType || '',
        patient.allergies || '',
        patient._count?.consultations || 0,
        patient._count?.prescriptions || 0,
        patient._count?.medicalHistory || 0,
        new Date(patient.createdAt).toLocaleDateString('es-MX')
      ]);
    });

    // Ajustar ancho de columnas
    sheet.columns.forEach(column => {
      column.width = 15;
    });
  }

  setupStatsSheet(sheet, patients) {
    sheet.addRow(['ESTADÍSTICAS DE PACIENTES']);
    sheet.addRow([]);
    sheet.addRow(['Total de pacientes:', patients.length]);
    
    // Estadísticas por género
    const genderStats = patients.reduce((acc, p) => {
      acc[p.gender] = (acc[p.gender] || 0) + 1;
      return acc;
    }, {});
    
    sheet.addRow(['Por género:']);
    Object.entries(genderStats).forEach(([gender, count]) => {
      sheet.addRow(['', gender === 'masculine' ? 'Masculino' : 'Femenino', count]);
    });
    
    // Estadísticas por edad
    const ageRanges = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
    patients.forEach(p => {
      const age = this.calculateAge(p.dateOfBirth);
      if (age <= 18) ageRanges['0-18']++;
      else if (age <= 35) ageRanges['19-35']++;
      else if (age <= 50) ageRanges['36-50']++;
      else if (age <= 65) ageRanges['51-65']++;
      else ageRanges['65+']++;
    });
    
    sheet.addRow([]);
    sheet.addRow(['Por rango de edad:']);
    Object.entries(ageRanges).forEach(([range, count]) => {
      sheet.addRow(['', range, count]);
    });
  }

  // ============ Métodos de utilidad ============

  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  async createZipArchive(sourceDir, targetPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(targetPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(targetPath));
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  async exportConsultationsIndividually(consultations, exportDir) {
    const consultDir = path.join(exportDir, 'consultas');
    fs.mkdirSync(consultDir, { recursive: true });

    for (const consultation of consultations.slice(0, 20)) { // Limitar a 20 consultas
      const fileName = `consulta-${new Date(consultation.consultationDate).toISOString().split('T')[0]}.pdf`;
      const filePath = path.join(consultDir, fileName);

      const doc = new PDFDocument(this.pdfConfig);
      doc.pipe(fs.createWriteStream(filePath));

      this.addConsultationHeader(doc, consultation);
      this.addConsultationContent(doc, consultation);
      
      doc.end();
    }
  }

  async exportAssessmentsSummary(assessments, exportDir) {
    const fileName = 'evaluaciones-resumen.pdf';
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument(this.pdfConfig);
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(14).text('RESUMEN DE EVALUACIONES', { align: 'center' })
       .moveDown(0.5);

    assessments.forEach(assessment => {
      const date = new Date(assessment.administrationDate).toLocaleDateString('es-MX');
      doc.fontSize(10)
         .text(`${date} - ${assessment.scale.name}`)
         .text(`Puntuación: ${assessment.totalScore} | Severidad: ${assessment.severity || 'N/A'}`)
         .text(`Interpretación: ${assessment.interpretation?.substring(0, 200) || 'N/A'}...`)
         .moveDown(0.3);
    });

    doc.end();
  }

  // Método para limpiar archivos temporales antiguos
  async cleanupTempFiles(olderThanHours = 24) {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        const ageInHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        if (ageInHours > olderThanHours) {
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`Cleaned up old export file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

module.exports = ExportService;