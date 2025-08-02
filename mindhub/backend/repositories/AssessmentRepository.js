/**
 * REPOSITORIO DE EVALUACIONES
 * Maneja todas las operaciones de base de datos relacionadas con evaluaciones completadas
 */

const { PrismaClient } = require('../generated/prisma');
const Assessment = require('../models/Assessment');

const prisma = new PrismaClient();

class AssessmentRepository {

  /**
   * Guarda una evaluación completa
   */
  async saveAssessment(assessmentData) {
    try {
      const assessment = Assessment.fromAPI(assessmentData);
      const validation = assessment.validate();
      
      if (!validation.isValid) {
        throw new Error(`Datos de evaluación inválidos: ${validation.errors.join(', ')}`);
      }

      // Insertar evaluación principal usando Prisma
      const savedAssessment = await prisma.scaleAdministration.create({
        data: {
          id: assessment.id,
          scaleId: assessment.scaleId,
          patientId: assessment.patientId,
          administratorId: assessment.createdBy,
          administrationDate: new Date(assessment.completedAt),
          administrationType: assessment.administrationMode,
          status: 'completed',
          totalScore: assessment.totalScore,
          completionTime: null, // Se puede calcular si tenemos los datos
          startedAt: null, // Se puede agregar si tenemos los datos
          completedAt: new Date(assessment.completedAt),
          notes: assessment.patientName ? `Paciente: ${assessment.patientName}` : null
        }
      });

      // Guardar respuestas individuales
      if (assessmentData.responses && assessmentData.responses.length > 0) {
        await this.saveAssessmentResponses(assessment.id, assessment.scaleId, assessmentData.responses);
      }

      return assessment;
      
    } catch (error) {
      console.error('Error guardando evaluación:', error);
      throw error;
    }
  }

  /**
   * Guarda las respuestas individuales de una evaluación
   */
  async saveAssessmentResponses(assessmentId, scaleId, responses) {
    try {
      const responsePromises = responses.map(async (response) => {
        return prisma.itemResponse.create({
          data: {
            administrationId: assessmentId,
            scaleItemId: response.itemId,
            responseValue: response.value,
            responseText: response.text || null,
            score: response.score || null,
            wasSkipped: response.skipped || false,
            responseTime: response.responseTime || null
          }
        });
      });

      await Promise.all(responsePromises);
      
    } catch (error) {
      console.error('Error guardando respuestas:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las evaluaciones de un paciente específico
   */
  async getAssessmentsByPatient(patientId) {
    try {
      const assessments = await prisma.scaleAdministration.findMany({
        where: { patientId },
        include: {
          scale: true,
          responses: {
            include: {
              scaleItem: true
            }
          }
        },
        orderBy: { administrationDate: 'desc' }
      });

      return assessments.map(assessment => Assessment.fromDB(assessment));
      
    } catch (error) {
      console.error('Error obteniendo evaluaciones por paciente:', error);
      throw error;
    }
  }

  /**
   * Obtiene una evaluación específica por ID
   */
  async getAssessmentById(assessmentId) {
    try {
      const assessment = await prisma.scaleAdministration.findUnique({
        where: { id: assessmentId },
        include: {
          scale: true,
          responses: {
            include: {
              scaleItem: true
            }
          }
        }
      });

      if (!assessment) {
        return null;
      }

      return Assessment.fromDB(assessment);
      
    } catch (error) {
      console.error('Error obteniendo evaluación por ID:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de evaluaciones por escala
   */
  async getAssessmentStats(scaleId = null) {
    try {
      const where = scaleId ? { scaleId } : {};
      
      const stats = await prisma.scaleAdministration.aggregate({
        where,
        _count: true,
        _avg: {
          totalScore: true
        },
        _min: {
          administrationDate: true
        },
        _max: {
          administrationDate: true
        }
      });

      return {
        totalAssessments: stats._count,
        averageScore: stats._avg.totalScore,
        firstAssessment: stats._min.administrationDate,
        lastAssessment: stats._max.administrationDate
      };
      
    } catch (error) {
      console.error('Error obteniendo estadísticas de evaluaciones:', error);
      throw error;
    }
  }

  /**
   * Elimina una evaluación y todas sus respuestas
   */
  async deleteAssessment(assessmentId) {
    try {
      // Prisma manejará la eliminación en cascada de las respuestas
      await prisma.scaleAdministration.delete({
        where: { id: assessmentId }
      });

      return true;
      
    } catch (error) {
      console.error('Error eliminando evaluación:', error);
      throw error;
    }
  }

  /**
   * Busca evaluaciones con filtros
   */
  async searchAssessments(filters = {}) {
    try {
      const where = {};
      
      if (filters.scaleId) {
        where.scaleId = filters.scaleId;
      }
      
      if (filters.patientId) {
        where.patientId = filters.patientId;
      }
      
      if (filters.dateFrom) {
        where.administrationDate = {
          ...where.administrationDate,
          gte: new Date(filters.dateFrom)
        };
      }
      
      if (filters.dateTo) {
        where.administrationDate = {
          ...where.administrationDate,
          lte: new Date(filters.dateTo)
        };
      }

      const assessments = await prisma.scaleAdministration.findMany({
        where,
        include: {
          scale: true,
          patient: true
        },
        orderBy: { administrationDate: 'desc' },
        take: filters.limit || 100
      });

      return assessments.map(assessment => Assessment.fromDB(assessment));
      
    } catch (error) {
      console.error('Error buscando evaluaciones:', error);
      throw error;
    }
  }

}

// Cerrar conexión Prisma al terminar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = AssessmentRepository;