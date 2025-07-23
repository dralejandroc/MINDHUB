/**
 * Routes para exportación de datos de pacientes
 * /api/v1/expedix/export/*
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ExportService = require('../services/ExportService');
const { authenticate } = require('../../shared/middleware');

const exportService = new ExportService();

/**
 * POST /api/v1/expedix/export/consultation
 * Exportar consulta individual en PDF
 */
router.post('/consultation', authenticate, async (req, res) => {
  try {
    const { consultationId } = req.body;
    const userId = req.user.id;

    if (!consultationId) {
      return res.status(400).json({
        success: false,
        message: 'ID de consulta requerido'
      });
    }

    const filePath = await exportService.exportConsultation(consultationId, userId);
    const fileName = path.basename(filePath);

    // Establecer headers para descarga
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    // Enviar archivo y eliminar después
    res.sendFile(filePath, (err) => {
      if (!err) {
        // Eliminar archivo temporal después de 5 segundos
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.error('Error cleaning up consultation export:', cleanupError);
          }
        }, 5000);
      }
    });

  } catch (error) {
    console.error('Error exporting consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar consulta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/expedix/export/patient-record
 * Exportar expediente completo de paciente
 */
router.post('/patient-record', authenticate, async (req, res) => {
  try {
    const { patientId, options = {} } = req.body;
    const userId = req.user.id;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'ID de paciente requerido'
      });
    }

    // Opciones de exportación con valores por defecto
    const exportOptions = {
      includeIndividualConsultations: options.includeIndividualConsultations || false,
      includeAssessments: options.includeAssessments !== false, // true por defecto
      includeDocumentsList: options.includeDocumentsList !== false,
      format: options.format || 'complete' // 'complete' | 'summary'
    };

    const zipPath = await exportService.exportPatientRecord(patientId, userId, exportOptions);
    const fileName = path.basename(zipPath);

    // Establecer headers para descarga del ZIP
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/zip');
    
    // Enviar archivo ZIP y eliminar después
    res.sendFile(zipPath, (err) => {
      if (!err) {
        // Eliminar archivo temporal después de 10 segundos
        setTimeout(() => {
          try {
            fs.unlinkSync(zipPath);
          } catch (cleanupError) {
            console.error('Error cleaning up record export:', cleanupError);
          }
        }, 10000);
      }
    });

  } catch (error) {
    console.error('Error exporting patient record:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar expediente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/expedix/export/patients-table
 * Exportar tabla de pacientes en Excel
 */
router.post('/patients-table', authenticate, async (req, res) => {
  try {
    const { filters = {} } = req.body;
    const userId = req.user.id;

    // Filtros con valores por defecto
    const exportFilters = {
      includeInactive: filters.includeInactive || false,
      includeStats: filters.includeStats !== false, // true por defecto
      searchTerm: filters.searchTerm || null,
      dateRange: filters.dateRange || null
    };

    const filePath = await exportService.exportPatientsTable(userId, exportFilters);
    const fileName = path.basename(filePath);

    // Establecer headers para descarga del Excel
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Enviar archivo y eliminar después
    res.sendFile(filePath, (err) => {
      if (!err) {
        // Eliminar archivo temporal después de 5 segundos
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.error('Error cleaning up table export:', cleanupError);
          }
        }, 5000);
      }
    });

  } catch (error) {
    console.error('Error exporting patients table:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar tabla de pacientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/expedix/export/bulk-options/:patientId
 * Obtener opciones disponibles para exportación masiva de un paciente
 */
router.get('/bulk-options/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        createdBy: userId
      },
      include: {
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

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Opciones disponibles según el contenido del expediente
    const options = {
      patient: {
        name: `${patient.firstName} ${patient.paternalLastName}`,
        medicalRecordNumber: patient.medicalRecordNumber
      },
      available: {
        consultations: patient._count.consultations,
        prescriptions: patient._count.prescriptions,
        medicalHistory: patient._count.medicalHistory,
        assessments: patient._count.scaleAdministrations,
        documents: patient._count.documents
      },
      exportSizes: {
        summary: '1-2 páginas (500KB aprox.)',
        complete: `${Math.ceil(patient._count.consultations / 4) + 3} páginas (${Math.ceil((patient._count.consultations * 0.3 + 2))} MB aprox.)`,
        withIndividualConsultations: `Expediente + ${patient._count.consultations} archivos separados (${Math.ceil((patient._count.consultations * 0.5 + 2))} MB aprox.)`
      },
      recommendations: {
        summary: 'Recomendado para revisión rápida y referencias',
        complete: 'Recomendado para transferencias y archivo completo',
        withIndividualConsultations: 'Recomendado para análisis detallado y presentaciones'
      }
    };

    res.json({
      success: true,
      data: options
    });

  } catch (error) {
    console.error('Error getting export options:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener opciones de exportación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/expedix/export/cleanup
 * Limpiar archivos temporales antiguos (solo para administradores)
 */
router.post('/cleanup', authenticate, async (req, res) => {
  try {
    // TODO: Verificar permisos de administrador
    
    const { olderThanHours = 24 } = req.body;
    
    await exportService.cleanupTempFiles(olderThanHours);
    
    res.json({
      success: true,
      message: 'Limpieza de archivos temporales completada'
    });

  } catch (error) {
    console.error('Error cleaning up export files:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la limpieza de archivos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/expedix/export/formats
 * Obtener formatos de exportación disponibles y sus características
 */
router.get('/formats', authenticate, async (req, res) => {
  try {
    const formats = {
      consultation: {
        name: 'Consulta Individual',
        format: 'PDF',
        size: '200-500KB',
        description: 'PDF compacto con información de una consulta específica',
        includes: ['Datos del paciente', 'Motivo de consulta', 'Notas SOAP', 'Diagnóstico', 'Plan de tratamiento', 'Medicamentos (si aplica)']
      },
      patientRecordSummary: {
        name: 'Expediente Resumen',
        format: 'PDF',
        size: '500KB-1MB',
        description: 'Resumen ejecutivo del expediente completo del paciente',
        includes: ['Datos personales', 'Resumen médico', 'Últimas 5 consultas', 'Medicamentos activos', 'Condiciones crónicas', 'Evaluaciones recientes']
      },
      patientRecordComplete: {
        name: 'Expediente Completo',
        format: 'ZIP (PDF principal + archivos adicionales)',
        size: '2-10MB',
        description: 'Expediente completo con todas las consultas y evaluaciones',
        includes: ['Todo del resumen', 'Historial completo de consultas', 'Todas las evaluaciones', 'Lista de documentos', 'Consultas individuales (opcional)']
      },
      patientsTable: {
        name: 'Tabla de Pacientes',
        format: 'Excel (XLSX)',
        size: '100KB-2MB',
        description: 'Tabla con datos de todos los pacientes en formato Excel',
        includes: ['Datos personales', 'Contacto', 'Estadísticas básicas', 'Fechas importantes', 'Gráficos y estadísticas (hoja separada)']
      }
    };

    res.json({
      success: true,
      data: formats
    });

  } catch (error) {
    console.error('Error getting export formats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener formatos de exportación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;