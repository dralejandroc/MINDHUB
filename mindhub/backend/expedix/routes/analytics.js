/**
 * Analytics API Routes for Expedix Hub
 * 
 * Dashboard analytics and statistics endpoints
 */

const express = require('express');
const { executeQuery } = require('../../shared/config/prisma');

const router = express.Router();

/**
 * GET /api/v1/expedix/analytics/patient-stats
 * Get patient statistics for dashboard
 */
router.get('/patient-stats', async (req, res) => {
  try {
    const stats = await executeQuery(
      async (prisma) => {
        const totalPatients = await prisma.patients.count({
          where: { isActive: true }
        });
        
        const activePatients = await prisma.patients.count({
          where: { 
            isActive: true,
            // Patients with recent activity (consultations in last 6 months)
            consultations: {
              some: {
                consultationDate: {
                  gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        });

        const newPatientsThisMonth = await prisma.patients.count({
          where: {
            isActive: true,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        });

        return {
          totalPatients,
          activePatients,
          newPatientsThisMonth,
          inactivePatients: totalPatients - activePatients
        };
      },
      'getPatientStats'
    );

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Failed to get patient stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve patient statistics',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/expedix/analytics/today-appointments
 * Get today's appointments
 */
router.get('/today-appointments', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // For now, return mock data since appointments table structure may vary
    const appointments = [];

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Failed to get today appointments:', error);
    res.status(500).json({
      error: 'Failed to retrieve today appointments',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/expedix/analytics/pending-assessments
 * Get pending assessments
 */
router.get('/pending-assessments', async (req, res) => {
  try {
    const pendingAssessments = await executeQuery(
      async (prisma) => {
        return await prisma.scaleAdministration.findMany({
          where: {
            status: 'pending'
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            scale: {
              select: {
                name: true,
                abbreviation: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        });
      },
      'getPendingAssessments'
    );

    res.json({
      success: true,
      data: pendingAssessments
    });

  } catch (error) {
    console.error('Failed to get pending assessments:', error);
    res.status(500).json({
      error: 'Failed to retrieve pending assessments',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/expedix/analytics/today-prescriptions
 * Get recent prescriptions (fallback to last prescriptions if none today)
 */
router.get('/today-prescriptions', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const prescriptions = await executeQuery(
      async (prisma) => {
        // First try to get today's prescriptions
        const todayPrescriptions = await prisma.prescription.findMany({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            },
            status: 'active'
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                medicalRecordNumber: true
              }
            },
            medication: {
              select: {
                name: true,
                genericName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // If no prescriptions today, get the last 10 prescriptions
        if (todayPrescriptions.length === 0) {
          return await prisma.prescription.findMany({
            where: {
              status: 'active'
            },
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  medicalRecordNumber: true
                }
              },
              medication: {
                select: {
                  name: true,
                  genericName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          });
        }

        return todayPrescriptions;
      },
      'getRecentPrescriptions'
    );

    res.json({
      success: true,
      data: prescriptions
    });

  } catch (error) {
    console.error('Failed to get recent prescriptions:', error);
    res.status(500).json({
      error: 'Failed to retrieve recent prescriptions',
      details: error.message
    });
  }
});

module.exports = router;