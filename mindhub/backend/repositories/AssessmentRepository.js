/**
 * REPOSITORIO DE EVALUACIONES
 * Maneja todas las operaciones de base de datos relacionadas con evaluaciones completadas
 */

const dbConnection = require('../database/connection');
const Assessment = require('../models/Assessment');

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

      // Insertar evaluación principal
      const insertAssessmentQuery = `
        INSERT INTO assessments (
          id, scale_id, patient_id, patient_name, total_score, 
          completion_percentage, administration_mode, completed_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await dbConnection.run(insertAssessmentQuery, [
        assessment.id, assessment.scaleId, assessment.patientId, 
        assessment.patientName, assessment.totalScore, assessment.completionPercentage,
        assessment.administrationMode, assessment.completedAt, assessment.createdBy
      ]);

      // Guardar respuestas individuales
      if (assessmentData.responses && assessmentData.responses.length > 0) {
        await this.saveAssessmentResponses(assessment.id, assessment.scaleId, assessmentData.responses);
      }

      // Guardar resultados de subescalas
      if (assessmentData.subscaleResults && assessmentData.subscaleResults.length > 0) {
        await this.saveSubscaleResults(assessment.id, assessmentData.subscaleResults);
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
      const insertResponseQuery = `
        INSERT INTO assessment_responses (
          id, assessment_id, scale_id, item_number, response_value, 
          response_label, score_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      for (const response of responses) {
        const responseId = `${assessmentId}_response_${response.itemNumber}`;
        
        await dbConnection.run(insertResponseQuery, [
          responseId, assessmentId, scaleId, response.itemNumber,
          response.value, response.label, response.score
        ]);
      }
      
    } catch (error) {
      console.error('Error guardando respuestas de evaluación:', error);
      throw error;
    }
  }

  /**
   * Guarda los resultados de subescalas
   */
  async saveSubscaleResults(assessmentId, subscaleResults) {
    try {
      const insertSubscaleQuery = `
        INSERT INTO assessment_subscale_results (
          id, assessment_id, subscale_code, subscale_name, score
        ) VALUES (?, ?, ?, ?, ?)
      `;

      for (const result of subscaleResults) {
        const resultId = `${assessmentId}_subscale_${result.code}`;
        
        await dbConnection.run(insertSubscaleQuery, [
          resultId, assessmentId, result.code, result.name, result.score
        ]);
      }
      
    } catch (error) {
      console.error('Error guardando resultados de subescalas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una evaluación por ID con todos sus datos
   */
  async getAssessmentById(assessmentId) {
    try {
      // Obtener datos básicos de la evaluación
      const assessmentQuery = `SELECT * FROM assessments WHERE id = ?`;
      const assessmentRows = await dbConnection.query(assessmentQuery, [assessmentId]);
      
      if (assessmentRows.length === 0) {
        return null;
      }

      const assessment = Assessment.fromDatabase(assessmentRows[0]);

      // Cargar respuestas
      const responsesQuery = `
        SELECT * FROM assessment_responses 
        WHERE assessment_id = ? 
        ORDER BY item_number
      `;
      const responses = await dbConnection.query(responsesQuery, [assessmentId]);
      assessment.responses = responses;

      // Cargar resultados de subescalas
      const subscalesQuery = `
        SELECT * FROM assessment_subscale_results 
        WHERE assessment_id = ?
      `;
      const subscaleResults = await dbConnection.query(subscalesQuery, [assessmentId]);
      assessment.subscaleResults = subscaleResults;

      return assessment;
      
    } catch (error) {
      console.error(`Error obteniendo evaluación ${assessmentId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene evaluaciones por paciente
   */
  async getAssessmentsByPatient(patientId) {
    try {
      const query = `
        SELECT a.*, s.name as scale_name, s.abbreviation as scale_abbreviation
        FROM assessments a
        JOIN scales s ON a.scale_id = s.id
        WHERE a.patient_id = ?
        ORDER BY a.completed_at DESC
      `;
      
      const rows = await dbConnection.query(query, [patientId]);
      return rows.map(row => Assessment.fromDatabase(row));
      
    } catch (error) {
      console.error(`Error obteniendo evaluaciones del paciente ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene evaluaciones por escala
   */
  async getAssessmentsByScale(scaleId, limit = 100) {
    try {
      const query = `
        SELECT * FROM assessments 
        WHERE scale_id = ? 
        ORDER BY completed_at DESC 
        LIMIT ?
      `;
      
      const rows = await dbConnection.query(query, [scaleId, limit]);
      return rows.map(row => Assessment.fromDatabase(row));
      
    } catch (error) {
      console.error(`Error obteniendo evaluaciones de escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene evaluaciones recientes
   */
  async getRecentAssessments(limit = 50) {
    try {
      const query = `
        SELECT a.*, s.name as scale_name, s.abbreviation as scale_abbreviation
        FROM assessments a
        JOIN scales s ON a.scale_id = s.id
        ORDER BY a.completed_at DESC
        LIMIT ?
      `;
      
      const rows = await dbConnection.query(query, [limit]);
      return rows.map(row => Assessment.fromDatabase(row));
      
    } catch (error) {
      console.error('Error obteniendo evaluaciones recientes:', error);
      throw error;
    }
  }

  /**
   * Busca evaluaciones por criterios
   */
  async searchAssessments(criteria) {
    try {
      let query = `
        SELECT a.*, s.name as scale_name, s.abbreviation as scale_abbreviation
        FROM assessments a
        JOIN scales s ON a.scale_id = s.id
        WHERE 1=1
      `;
      const params = [];

      if (criteria.scaleId) {
        query += ` AND a.scale_id = ?`;
        params.push(criteria.scaleId);
      }

      if (criteria.patientName) {
        query += ` AND a.patient_name LIKE ?`;
        params.push(`%${criteria.patientName}%`);
      }

      if (criteria.dateFrom) {
        query += ` AND a.completed_at >= ?`;
        params.push(criteria.dateFrom);
      }

      if (criteria.dateTo) {
        query += ` AND a.completed_at <= ?`;
        params.push(criteria.dateTo);
      }

      if (criteria.administrationMode) {
        query += ` AND a.administration_mode = ?`;
        params.push(criteria.administrationMode);
      }

      query += ` ORDER BY a.completed_at DESC LIMIT ?`;
      params.push(criteria.limit || 100);
      
      const rows = await dbConnection.query(query, params);
      return rows.map(row => Assessment.fromDatabase(row));
      
    } catch (error) {
      console.error('Error buscando evaluaciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de evaluaciones
   */
  async getAssessmentStats(scaleId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_assessments,
          AVG(total_score) as avg_score,
          MIN(total_score) as min_score,
          MAX(total_score) as max_score,
          AVG(completion_percentage) as avg_completion,
          COUNT(DISTINCT patient_id) as unique_patients
        FROM assessments
      `;
      const params = [];

      if (scaleId) {
        query += ` WHERE scale_id = ?`;
        params.push(scaleId);
      }

      const rows = await dbConnection.query(query, params);
      return rows[0];
      
    } catch (error) {
      console.error('Error obteniendo estadísticas de evaluaciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene distribución de puntuaciones para una escala
   */
  async getScoreDistribution(scaleId) {
    try {
      const query = `
        SELECT 
          total_score,
          COUNT(*) as frequency
        FROM assessments 
        WHERE scale_id = ?
        GROUP BY total_score
        ORDER BY total_score
      `;
      
      const rows = await dbConnection.query(query, [scaleId]);
      return rows;
      
    } catch (error) {
      console.error(`Error obteniendo distribución de puntuaciones para ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una evaluación (soft delete)
   */
  async deleteAssessment(assessmentId) {
    try {
      // En lugar de eliminar, marcar como inactiva o eliminar físicamente
      const deleteQuery = `DELETE FROM assessments WHERE id = ?`;
      await dbConnection.run(deleteQuery, [assessmentId]);
      
    } catch (error) {
      console.error(`Error eliminando evaluación ${assessmentId}:`, error);
      throw error;
    }
  }

  /**
   * Exporta evaluaciones a formato CSV
   */
  async exportAssessmentsToCsv(criteria) {
    try {
      const assessments = await this.searchAssessments(criteria);
      
      const csvHeaders = [
        'ID', 'Escala', 'Paciente', 'Puntuación Total', 
        'Completitud %', 'Modo Administración', 'Fecha Completada'
      ];
      
      const csvRows = assessments.map(assessment => [
        assessment.id,
        assessment.scale_abbreviation || assessment.scaleId,
        assessment.patientName || 'Anónimo',
        assessment.totalScore,
        assessment.completionPercentage,
        assessment.administrationMode,
        assessment.completedAt
      ]);
      
      return {
        headers: csvHeaders,
        rows: csvRows
      };
      
    } catch (error) {
      console.error('Error exportando evaluaciones a CSV:', error);
      throw error;
    }
  }

  /**
   * Obtiene evaluaciones incompletas (por si se implementa guardado parcial)
   */
  async getIncompleteAssessments() {
    try {
      const query = `
        SELECT * FROM assessments 
        WHERE completion_percentage < 100 
        ORDER BY completed_at DESC
      `;
      
      const rows = await dbConnection.query(query);
      return rows.map(row => Assessment.fromDatabase(row));
      
    } catch (error) {
      console.error('Error obteniendo evaluaciones incompletas:', error);
      throw error;
    }
  }
}

module.exports = AssessmentRepository;