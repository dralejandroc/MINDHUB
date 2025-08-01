const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../../generated/prisma');

const prisma = new PrismaClient();

// Simple login endpoint for development
router.post('/login', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find or create user
    let user = await prisma.users.findFirst({
      where: { email: email }
    });

    if (!user && email === 'dr_aleks_c@hotmail.com') {
      // Create Dr. Alejandro if doesn't exist
      user = await prisma.users.create({
        data: {
          id: 'user-dr-alejandro',
          auth0Id: 'dev-dr-alejandro',
          email: email,
          name: name || 'Dr. Alejandro Contreras',
          picture: null,
          role: 'doctor',
          speciality: 'Psychiatrist',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user stats
    const patientCount = await prisma.patients.count({
      where: { createdBy: user.id }
    });

    const consultationCount = await prisma.consultations.count({
      where: { doctorId: user.id }
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        speciality: user.speciality,
        stats: {
          patients: patientCount,
          consultations: consultationCount
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user dashboard data
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get dashboard stats
    const patients = await prisma.patients.findMany({
      where: { createdBy: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const consultations = await prisma.consultations.findMany({
      where: { doctorId: userId },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            medicalRecordNumber: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Calculate weekly stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyConsultations = await prisma.consultations.count({
      where: {
        doctorId: userId,
        date: {
          gte: oneWeekAgo
        }
      }
    });

    // Get assessment statistics for the user's patients
    const userPatientIds = patients.map(p => p.id);
    
    const totalAssessments = await prisma.scaleAdministration.count({
      where: {
        patientId: {
          in: userPatientIds
        }
      }
    });

    const weeklyAssessments = await prisma.scaleAdministration.count({
      where: {
        patientId: {
          in: userPatientIds
        },
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    // Get most recent assessments for recent activity
    const recentAssessments = await prisma.scaleAdministration.findMany({
      where: {
        patientId: {
          in: userPatientIds
        }
      },
      include: {
        scale: {
          select: {
            name: true,
            abbreviation: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Generate alerts from recent high severity assessments
    const recentHighSeverityAssessments = await prisma.scaleAdministration.count({
      where: {
        patientId: {
          in: userPatientIds
        },
        severity: {
          in: ['severe', 'high']
        },
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          speciality: user.speciality
        },
        stats: {
          totalPatients: patients.length,
          activePatients: patients.filter(p => p.isActive).length,
          totalConsultations: consultations.length,
          weeklyConsultations: weeklyConsultations,
          completedAssessments: totalAssessments,
          weeklyAssessments: weeklyAssessments,
          pendingAlerts: recentHighSeverityAssessments
        },
        patients: patients.slice(0, 10),
        recentConsultations: consultations,
        recentAssessments: recentAssessments.map(assessment => ({
          id: assessment.id,
          scaleName: assessment.scale?.name || 'Escala desconocida',
          scaleAbbreviation: assessment.scale?.abbreviation || '',
          patientName: `${assessment.patient?.firstName} ${assessment.patient?.lastName}`,
          totalScore: assessment.totalScore,
          severity: assessment.severity,
          date: assessment.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;