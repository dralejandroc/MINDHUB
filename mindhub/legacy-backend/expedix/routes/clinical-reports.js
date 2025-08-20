/**
 * Clinical Reports and Data Export System for Expedix Hub
 * 
 * Comprehensive patient data export and clinical reporting system
 * for documentation, compliance, and clinical analysis
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Report types and configurations
 */
const REPORT_TYPES = {
  patient_summary: {
    name: "Resumen del Paciente",
    description: "Reporte completo de la información del paciente",
    permissions: ['read:patient_data'],
    formats: ['pdf', 'excel', 'json']
  },
  prescription_history: {
    name: "Historia de Prescripciones",
    description: "Historial completo de medicamentos prescritos",
    permissions: ['read:prescriptions'],
    formats: ['pdf', 'excel', 'json']
  },
  appointment_history: {
    name: "Historia de Citas",
    description: "Registro de todas las citas del paciente",
    permissions: ['read:appointments'],
    formats: ['pdf', 'excel', 'json']
  },
  clinical_assessment: {
    name: "Evaluaciones Clínicas",
    description: "Resultados de escalas y evaluaciones aplicadas",
    permissions: ['read:assessments'],
    formats: ['pdf', 'excel', 'json']
  },
  comprehensive_report: {
    name: "Reporte Integral",
    description: "Reporte completo con toda la información clínica",
    permissions: ['read:patient_data', 'read:prescriptions', 'read:appointments'],
    formats: ['pdf', 'excel']
  },
  statistical_summary: {
    name: "Resumen Estadístico",
    description: "Estadísticas y métricas de la práctica clínica",
    permissions: ['read:statistics'],
    formats: ['excel', 'json']
  }
};

/**
 * GET /api/expedix/clinical-reports/types
 * Get available report types
 */
router.get('/types',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:reports']),
  async (req, res) => {
    try {
      const userPermissions = req.user?.permissions || [];
      
      // Filter report types based on user permissions
      const availableReports = Object.entries(REPORT_TYPES)
        .filter(([key, report]) => 
          report.permissions.every(permission => userPermissions.includes(permission))
        )
        .reduce((acc, [key, report]) => {
          acc[key] = report;
          return acc;
        }, {});

      res.json({
        success: true,
        data: {
          reportTypes: availableReports,
          totalTypes: Object.keys(availableReports).length
        }
      });

    } catch (error) {
      logger.error('Failed to get report types', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve report types',
        message: 'An error occurred while retrieving available report types'
      });
    }
  }
);

/**
 * POST /api/expedix/clinical-reports/generate
 * Generate a clinical report
 */
router.post('/generate',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:reports']),
  [
    body('reportType').isIn(Object.keys(REPORT_TYPES)).withMessage('Invalid report type'),
    body('format').isIn(['pdf', 'excel', 'json']).withMessage('Invalid format'),
    body('patientId').optional().isUUID().withMessage('Invalid patient ID'),
    body('dateRange').optional().isObject(),
    body('dateRange.start').optional().isISO8601(),
    body('dateRange.end').optional().isISO8601(),
    body('filters').optional().isObject(),
    body('includePrivateNotes').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        reportType,
        format,
        patientId,
        dateRange,
        filters = {},
        includePrivateNotes = false
      } = req.body;

      const userId = req.user?.id;

      // Verify report type permissions
      const reportConfig = REPORT_TYPES[reportType];
      if (!reportConfig.formats.includes(format)) {
        return res.status(400).json({
          success: false,
          error: 'Format not supported for this report type'
        });
      }

      // Generate report based on type
      let reportData;
      switch (reportType) {
        case 'patient_summary':
          reportData = await generatePatientSummaryReport(patientId, dateRange, filters);
          break;
        case 'prescription_history':
          reportData = await generatePrescriptionHistoryReport(patientId, dateRange, filters);
          break;
        case 'appointment_history':
          reportData = await generateAppointmentHistoryReport(patientId, dateRange, filters);
          break;
        case 'clinical_assessment':
          reportData = await generateClinicalAssessmentReport(patientId, dateRange, filters);
          break;
        case 'comprehensive_report':
          reportData = await generateComprehensiveReport(patientId, dateRange, filters, includePrivateNotes);
          break;
        case 'statistical_summary':
          reportData = await generateStatisticalSummaryReport(dateRange, filters);
          break;
        default:
          throw new Error('Unsupported report type');
      }

      // Generate report ID for tracking
      const reportId = uuidv4();

      // Format and return report
      let responseData;
      let contentType;
      let filename;

      switch (format) {
        case 'json':
          responseData = reportData;
          contentType = 'application/json';
          filename = `${reportType}_${Date.now()}.json`;
          break;
        case 'pdf':
          responseData = await generatePDFReport(reportData, reportType, reportConfig);
          contentType = 'application/pdf';
          filename = `${reportType}_${Date.now()}.pdf`;
          break;
        case 'excel':
          responseData = await generateExcelReport(reportData, reportType, reportConfig);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `${reportType}_${Date.now()}.xlsx`;
          break;
      }

      // Log report generation
      logger.info('Clinical report generated', {
        reportId: reportId,
        reportType: reportType,
        format: format,
        patientId: patientId,
        generatedBy: userId,
        dataPoints: reportData.metadata?.totalRecords || 0
      });

      // Audit log for compliance
      await auditLogger.logDataAccess(
        userId,
        'clinical_report',
        patientId || 'multiple_patients',
        'generate',
        {
          reportType: reportType,
          format: format,
          dateRange: dateRange,
          reportId: reportId
        }
      );

      if (format === 'json') {
        res.json({
          success: true,
          data: responseData,
          metadata: {
            reportId: reportId,
            reportType: reportType,
            format: format,
            generatedAt: new Date().toISOString(),
            generatedBy: userId
          }
        });
      } else {
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(responseData);
      }

    } catch (error) {
      logger.error('Failed to generate clinical report', {
        error: error.message,
        stack: error.stack,
        reportType: req.body.reportType,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate report',
        message: 'An error occurred while generating the clinical report'
      });
    }
  }
);

/**
 * GET /api/expedix/clinical-reports/patient/:patientId/summary
 * Get patient summary for quick access
 */
router.get('/patient/:patientId/summary',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'nurse', 'patient', 'admin'], ['read:patient_data']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('includeAssessments').optional().isBoolean(),
    query('includePrescriptions').optional().isBoolean(),
    query('includeAppointments').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const {
        includeAssessments = true,
        includePrescriptions = true,
        includeAppointments = true
      } = req.query;

      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verify patient access
      if (userRole === 'patient' && userId !== patientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Patients can only access their own summary'
        });
      }

      const summary = await generatePatientSummaryReport(patientId, null, {
        includeAssessments,
        includePrescriptions,
        includeAppointments
      });

      // Log summary access
      logger.info('Patient summary accessed', {
        patientId: patientId,
        accessedBy: userId,
        userRole: userRole,
        sections: {
          assessments: includeAssessments,
          prescriptions: includePrescriptions,
          appointments: includeAppointments
        }
      });

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      logger.error('Failed to get patient summary', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve patient summary',
        message: 'An error occurred while retrieving patient summary'
      });
    }
  }
);

/**
 * Report generation functions
 */

async function generatePatientSummaryReport(patientId, dateRange, filters) {
  const patient = await executeQuery(
    (prisma) => prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        medicalHistory: true,
        familyHistory: true,
        emergencyContact: true,
        tagAssignments: {
          where: { isActive: true },
          include: { tag: true }
        },
        _count: {
          select: {
            consultations: true,
            prescriptions: true,
            appointments: true,
            scaleAdministrations: true
          }
        }
      }
    }),
    `getPatientSummary(${patientId})`
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Calculate age
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  // Get recent activities if requested
  let recentActivities = {};
  if (filters.includeAssessments) {
    recentActivities.assessments = await getRecentAssessments(patientId, 5);
  }
  if (filters.includePrescriptions) {
    recentActivities.prescriptions = await getRecentPrescriptions(patientId, 5);
  }
  if (filters.includeAppointments) {
    recentActivities.appointments = await getRecentAppointments(patientId, 5);
  }

  return {
    patient: {
      ...patient,
      age: age,
      fullName: `${patient.firstName} ${patient.lastName}`,
      emergencyContact: patient.emergencyContact ? JSON.parse(patient.emergencyContact) : null
    },
    tags: patient.tagAssignments.map(ta => ta.tag),
    statistics: patient._count,
    recentActivities: recentActivities,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalRecords: Object.values(patient._count).reduce((sum, count) => sum + count, 0)
    }
  };
}

async function generatePrescriptionHistoryReport(patientId, dateRange, filters) {
  const whereClause = { patientId };
  
  if (dateRange) {
    whereClause.prescribedAt = {};
    if (dateRange.start) whereClause.prescribedAt.gte = new Date(dateRange.start);
    if (dateRange.end) whereClause.prescribedAt.lte = new Date(dateRange.end);
  }

  const prescriptions = await executeQuery(
    (prisma) => prisma.prescription.findMany({
      where: whereClause,
      include: {
        medication: true,
        prescriber: {
          select: { name: true, license: true, specialization: true }
        },
        prescriptionHistory: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { prescribedAt: 'desc' }
    }),
    `getPrescriptionHistory(${patientId})`
  );

  return {
    prescriptions: prescriptions,
    summary: {
      totalPrescriptions: prescriptions.length,
      activePrescriptions: prescriptions.filter(p => p.status === 'active').length,
      longTermTreatments: prescriptions.filter(p => p.isLongTermTreatment).length,
      uniqueMedications: new Set(prescriptions.map(p => p.medication.genericName)).size
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      totalRecords: prescriptions.length,
      dateRange: dateRange
    }
  };
}

async function generateAppointmentHistoryReport(patientId, dateRange, filters) {
  const whereClause = { patientId };
  
  if (dateRange) {
    whereClause.appointmentDate = {};
    if (dateRange.start) whereClause.appointmentDate.gte = new Date(dateRange.start);
    if (dateRange.end) whereClause.appointmentDate.lte = new Date(dateRange.end);
  }

  const appointments = await executeQuery(
    (prisma) => prisma.appointment.findMany({
      where: whereClause,
      include: {
        provider: {
          select: { name: true, specialization: true }
        },
        confirmations: true,
        appointmentHistory: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    }),
    `getAppointmentHistory(${patientId})`
  );

  const statusSummary = appointments.reduce((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1;
    return acc;
  }, {});

  return {
    appointments: appointments,
    summary: {
      totalAppointments: appointments.length,
      statusBreakdown: statusSummary,
      averageAppointmentDuration: appointments.reduce((sum, a) => sum + a.duration, 0) / appointments.length || 0,
      confirmationRate: (appointments.filter(a => a.status === 'confirmed').length / appointments.length * 100) || 0
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      totalRecords: appointments.length,
      dateRange: dateRange
    }
  };
}

async function generateClinicalAssessmentReport(patientId, dateRange, filters) {
  // This would integrate with Clinimetrix data
  // For now, return placeholder structure
  return {
    assessments: [],
    summary: {
      totalAssessments: 0,
      scalesUsed: [],
      averageScores: {},
      progressTracking: []
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      totalRecords: 0,
      dateRange: dateRange,
      note: "Assessment data integration with Clinimetrix pending"
    }
  };
}

async function generateComprehensiveReport(patientId, dateRange, filters, includePrivateNotes) {
  const [patientSummary, prescriptionHistory, appointmentHistory, assessmentHistory] = await Promise.all([
    generatePatientSummaryReport(patientId, dateRange, { includeAssessments: true, includePrescriptions: true, includeAppointments: true }),
    generatePrescriptionHistoryReport(patientId, dateRange, filters),
    generateAppointmentHistoryReport(patientId, dateRange, filters),
    generateClinicalAssessmentReport(patientId, dateRange, filters)
  ]);

  return {
    patientSummary: patientSummary,
    prescriptionHistory: prescriptionHistory,
    appointmentHistory: appointmentHistory,
    assessmentHistory: assessmentHistory,
    metadata: {
      generatedAt: new Date().toISOString(),
      reportType: 'comprehensive',
      includePrivateNotes: includePrivateNotes,
      sections: ['patient_summary', 'prescriptions', 'appointments', 'assessments']
    }
  };
}

async function generateStatisticalSummaryReport(dateRange, filters) {
  // This would generate practice-wide statistics
  return {
    patientStatistics: {
      totalPatients: 0,
      newPatientsThisPeriod: 0,
      activePatients: 0
    },
    appointmentStatistics: {
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      noShowRate: 0
    },
    prescriptionStatistics: {
      totalPrescriptions: 0,
      mostPrescribedMedications: [],
      averageTreatmentDuration: 0
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      reportType: 'statistical_summary',
      dateRange: dateRange
    }
  };
}

/**
 * Helper functions for report formatting
 */

async function generatePDFReport(data, reportType, config) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // PDF Header
      doc.fontSize(16).font('Helvetica-Bold').text(config.name, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-MX')}`, { align: 'right' });
      doc.moveDown(2);

      // Content based on report type
      if (reportType === 'patient_summary' && data.patient) {
        // Patient basic info
        doc.fontSize(12).font('Helvetica-Bold').text('Información del Paciente');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Nombre: ${data.patient.fullName}`);
        doc.text(`Expediente: ${data.patient.medicalRecordNumber}`);
        doc.text(`Edad: ${data.patient.age} años`);
        doc.text(`Fecha de nacimiento: ${new Date(data.patient.dateOfBirth).toLocaleDateString('es-MX')}`);
        doc.moveDown();

        // Tags if any
        if (data.tags && data.tags.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Etiquetas');
          doc.fontSize(10).font('Helvetica');
          data.tags.forEach(tag => {
            doc.text(`• ${tag.name} (${tag.category})`);
          });
          doc.moveDown();
        }

        // Statistics
        doc.fontSize(12).font('Helvetica-Bold').text('Estadísticas');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Consultas: ${data.statistics.consultations}`);
        doc.text(`Prescripciones: ${data.statistics.prescriptions}`);
        doc.text(`Citas: ${data.statistics.appointments}`);
        doc.text(`Evaluaciones: ${data.statistics.scaleAdministrations}`);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function generateExcelReport(data, reportType, config) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(config.name);

  // Add headers and data based on report type
  if (reportType === 'patient_summary' && data.patient) {
    worksheet.addRow(['Campo', 'Valor']);
    worksheet.addRow(['Nombre', data.patient.fullName]);
    worksheet.addRow(['Expediente', data.patient.medicalRecordNumber]);
    worksheet.addRow(['Edad', data.patient.age]);
    worksheet.addRow(['Consultas', data.statistics.consultations]);
    worksheet.addRow(['Prescripciones', data.statistics.prescriptions]);
    worksheet.addRow(['Citas', data.statistics.appointments]);
  }

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.columns.forEach(column => {
    column.width = 20;
  });

  return await workbook.xlsx.writeBuffer();
}

async function getRecentAssessments(patientId, limit) {
  // This would integrate with Clinimetrix
  return [];
}

async function getRecentPrescriptions(patientId, limit) {
  return await executeQuery(
    (prisma) => prisma.prescription.findMany({
      where: { patientId },
      include: {
        medication: {
          select: { genericName: true, therapeuticClass: true }
        }
      },
      orderBy: { prescribedAt: 'desc' },
      take: limit
    }),
    `getRecentPrescriptions(${patientId})`
  );
}

async function getRecentAppointments(patientId, limit) {
  return await executeQuery(
    (prisma) => prisma.appointment.findMany({
      where: { patientId },
      include: {
        provider: {
          select: { name: true, specialization: true }
        }
      },
      orderBy: { appointmentDate: 'desc' },
      take: limit
    }),
    `getRecentAppointments(${patientId})`
  );
}

module.exports = router;