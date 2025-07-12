/**
 * Dashboard API Routes
 * 
 * Provides aggregated data and statistics for the main dashboard.
 * Integrates data from all four hubs: Expedix, Clinimetrix, FormX, and Resources.
 */

const express = require('express');
const { getPrismaClient, executeQuery, executeTransaction } = require('../config/prisma');
const { logger } = require('../config/storage');

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get comprehensive statistics from all hubs
    const stats = await executeTransaction([
      // Total patients (Expedix)
      (prisma) => prisma.patient.count({
        where: { isActive: true }
      }),
      
      // Active patients with recent activity (last 30 days)
      (prisma) => prisma.patient.count({
        where: {
          isActive: true,
          consultations: {
            some: {
              consultationDate: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }),
      
      // Pending assessments (Clinimetrix)
      (prisma) => prisma.scaleAdministration.count({
        where: {
          status: { in: ['not_started', 'in_progress'] }
        }
      }),
      
      // Completed assessments today
      (prisma) => prisma.scaleAdministration.count({
        where: {
          status: 'completed',
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      
      // Scheduled consultations (next 7 days)
      (prisma) => prisma.consultation.count({
        where: {
          status: 'scheduled',
          consultationDate: {
            gte: new Date(),
            lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Forms created this month (FormX)
      (prisma) => prisma.form.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Form submissions today
      (prisma) => prisma.formSubmission.count({
        where: {
          submittedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ], 'getDashboardStats');

    const [
      totalPatients,
      activePatients,
      pendingAssessments,
      completedAssessmentsToday,
      scheduledAppointments,
      formsCreatedThisMonth,
      formSubmissionsToday
    ] = stats;

    // Log dashboard access
    logger.info('Dashboard stats accessed', {
      userId,
      ipAddress: req.ip,
      stats: {
        totalPatients,
        activePatients,
        pendingAssessments,
        completedAssessmentsToday,
        scheduledAppointments
      }
    });

    res.json({
      success: true,
      data: {
        totalPatients,
        activePatients,
        pendingAssessments,
        completedAssessmentsToday,
        scheduledAppointments,
        formsCreatedThisMonth,
        formSubmissionsToday
      }
    });

  } catch (error) {
    logger.error('Failed to get dashboard stats', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to retrieve dashboard statistics',
      details: error.message
    });
  }
});

/**
 * GET /api/dashboard/recent-activity
 * Get recent activity across all hubs
 */
router.get('/recent-activity', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit) || 20;

    // Get recent activities from all hubs
    const activities = await executeTransaction([
      // Recent assessments (Clinimetrix)
      (prisma) => prisma.scaleAdministration.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          scale: {
            select: { name: true, abbreviation: true }
          },
          session: {
            include: {
              patient: {
                select: { firstName: true, lastName: true, medicalRecordNumber: true }
              }
            }
          }
        }
      }),
      
      // Recent consultations (Expedix)
      (prisma) => prisma.consultation.findMany({
        take: 10,
        orderBy: { consultationDate: 'desc' },
        include: {
          patient: {
            select: { firstName: true, lastName: true, medicalRecordNumber: true }
          },
          creator: {
            select: { name: true }
          }
        }
      }),
      
      // Recent patient registrations (Expedix)
      (prisma) => prisma.patient.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { name: true }
          }
        }
      }),
      
      // Recent form submissions (FormX)
      (prisma) => prisma.formSubmission.findMany({
        take: 10,
        orderBy: { submittedAt: 'desc' },
        include: {
          form: {
            select: { title: true }
          }
        }
      })
    ], 'getRecentActivity');

    const [assessments, consultations, patients, formSubmissions] = activities;

    // Format activities into a unified structure
    const formattedActivities = [];

    // Add assessments
    assessments.forEach(assessment => {
      formattedActivities.push({
        id: `assessment_${assessment.id}`,
        type: 'assessment',
        description: `Evaluación ${assessment.scale.abbreviation} ${assessment.status === 'completed' ? 'completada' : assessment.status === 'in_progress' ? 'en progreso' : 'pendiente'}`,
        timestamp: assessment.createdAt,
        patientName: assessment.session?.patient ? `${assessment.session.patient.firstName} ${assessment.session.patient.lastName}` : 'Paciente desconocido',
        status: assessment.status === 'completed' ? 'completed' : assessment.status === 'in_progress' ? 'in_progress' : 'pending',
        hub: 'clinimetrix'
      });
    });

    // Add consultations
    consultations.forEach(consultation => {
      formattedActivities.push({
        id: `consultation_${consultation.id}`,
        type: 'consultation',
        description: `Consulta ${consultation.consultationType} ${consultation.status === 'completed' ? 'completada' : consultation.status === 'in_progress' ? 'en progreso' : 'programada'}`,
        timestamp: consultation.consultationDate,
        patientName: `${consultation.patient.firstName} ${consultation.patient.lastName}`,
        status: consultation.status === 'completed' ? 'completed' : consultation.status === 'in_progress' ? 'in_progress' : 'pending',
        hub: 'expedix'
      });
    });

    // Add patient registrations
    patients.forEach(patient => {
      formattedActivities.push({
        id: `patient_${patient.id}`,
        type: 'patient_registration',
        description: 'Nuevo paciente registrado',
        timestamp: patient.createdAt,
        patientName: `${patient.firstName} ${patient.lastName}`,
        status: 'completed',
        hub: 'expedix'
      });
    });

    // Add form submissions
    formSubmissions.forEach(submission => {
      formattedActivities.push({
        id: `form_${submission.id}`,
        type: 'form_submission',
        description: `Formulario "${submission.form.title}" enviado`,
        timestamp: submission.submittedAt,
        patientName: submission.submitterName || 'Usuario anónimo',
        status: 'completed',
        hub: 'formx'
      });
    });

    // Sort by timestamp (most recent first) and limit
    const sortedActivities = formattedActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      data: sortedActivities
    });

  } catch (error) {
    logger.error('Failed to get recent activity', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to retrieve recent activity',
      details: error.message
    });
  }
});

/**
 * GET /api/dashboard/alerts
 * Get system alerts and notifications
 */
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get system alerts
    const alerts = await executeTransaction([
      // Overdue assessments
      (prisma) => prisma.scaleAdministration.count({
        where: {
          status: { in: ['not_started', 'in_progress'] },
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // More than 24 hours old
          }
        }
      }),
      
      // Patients without recent consultations (over 90 days)
      (prisma) => prisma.patient.count({
        where: {
          isActive: true,
          consultations: {
            none: {
              consultationDate: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }),
      
      // Expired assessment tokens
      (prisma) => prisma.assessmentToken.count({
        where: {
          isActive: true,
          expiresAt: {
            lt: new Date()
          }
        }
      })
    ], 'getDashboardAlerts');

    const [overdueAssessments, patientsWithoutRecentConsultations, expiredTokens] = alerts;

    const systemAlerts = [];

    if (overdueAssessments > 0) {
      systemAlerts.push({
        id: 'overdue_assessments',
        type: 'warning',
        title: 'Evaluaciones Atrasadas',
        message: `${overdueAssessments} evaluaciones pendientes por más de 24 horas`,
        action: '/clinimetrix/assessments?status=overdue'
      });
    }

    if (patientsWithoutRecentConsultations > 0) {
      systemAlerts.push({
        id: 'inactive_patients',
        type: 'info',
        title: 'Pacientes sin Consultas Recientes',
        message: `${patientsWithoutRecentConsultations} pacientes sin consultas en los últimos 90 días`,
        action: '/expedix/patients?filter=inactive'
      });
    }

    if (expiredTokens > 0) {
      systemAlerts.push({
        id: 'expired_tokens',
        type: 'error',
        title: 'Tokens Expirados',
        message: `${expiredTokens} tokens de evaluación han expirado`,
        action: '/clinimetrix/tokens?status=expired'
      });
    }

    res.json({
      success: true,
      data: systemAlerts
    });

  } catch (error) {
    logger.error('Failed to get dashboard alerts', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to retrieve dashboard alerts',
      details: error.message
    });
  }
});

/**
 * GET /api/dashboard/quick-stats/:hub
 * Get specific hub statistics
 */
router.get('/quick-stats/:hub', async (req, res) => {
  try {
    const { hub } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let stats = {};

    switch (hub) {
      case 'expedix':
        stats = await executeTransaction([
          (prisma) => prisma.patient.count({ where: { isActive: true } }),
          (prisma) => prisma.consultation.count({
            where: {
              consultationDate: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          }),
          (prisma) => prisma.prescription.count({
            where: { status: 'active' }
          })
        ], 'getExpedixStats');
        
        stats = {
          totalPatients: stats[0],
          consultationsThisWeek: stats[1],
          activePrescriptions: stats[2]
        };
        break;

      case 'clinimetrix':
        stats = await executeTransaction([
          (prisma) => prisma.assessmentScale.count({ where: { isActive: true } }),
          (prisma) => prisma.scaleAdministration.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }),
          (prisma) => prisma.scaleAdministration.count({
            where: { status: 'completed' }
          })
        ], 'getClinimetrixStats');
        
        stats = {
          availableScales: stats[0],
          assessmentsThisMonth: stats[1],
          totalCompletedAssessments: stats[2]
        };
        break;

      case 'formx':
        stats = await executeTransaction([
          (prisma) => prisma.form.count({ where: { isActive: true } }),
          (prisma) => prisma.formSubmission.count({
            where: {
              submittedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }),
          (prisma) => prisma.formTemplate.count({ where: { isPublic: true } })
        ], 'getFormxStats');
        
        stats = {
          activeForms: stats[0],
          submissionsThisMonth: stats[1],
          publicTemplates: stats[2]
        };
        break;

      case 'resources':
        stats = await executeTransaction([
          (prisma) => prisma.resource.count({ where: { isActive: true } }),
          (prisma) => prisma.resourceAccess.count({
            where: {
              accessedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }),
          (prisma) => prisma.resource.count({
            where: {
              category: 'scale_documentation'
            }
          })
        ], 'getResourcesStats');
        
        stats = {
          totalResources: stats[0],
          accessesThisMonth: stats[1],
          scaleDocuments: stats[2]
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid hub specified' });
    }

    res.json({
      success: true,
      hub,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get hub stats', {
      error: error.message,
      hub: req.params.hub,
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to retrieve hub statistics',
      details: error.message
    });
  }
});

module.exports = router;