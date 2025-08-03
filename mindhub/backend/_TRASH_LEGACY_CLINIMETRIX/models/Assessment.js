/**
 * MODELO DE EVALUACIÓN COMPLETADA
 * Representa una evaluación de escala completada por un paciente
 */

class Assessment {
  constructor(data = {}) {
    this.id = data.id;
    this.scaleId = data.scale_id;
    this.patientId = data.patient_id;
    this.patientName = data.patient_name;
    this.totalScore = data.total_score;
    this.completionPercentage = data.completion_percentage || 100;
    this.administrationMode = data.administration_mode || 'presencial-mismo';
    this.completedAt = data.completed_at;
    this.createdBy = data.created_by;
    
    // Componentes relacionados (se cargan por separado)
    this.responses = [];
    this.subscaleResults = [];
    this.interpretation = null;
  }

  /**
   * Valida que la evaluación tenga todos los datos necesarios
   */
  validate() {
    const errors = [];

    if (!this.id) errors.push('ID es requerido');
    if (!this.scaleId) errors.push('Scale ID es requerido');
    if (this.totalScore === undefined || this.totalScore === null) errors.push('Puntuación total es requerida');
    
    // Validar modo de administración
    const validModes = ['presencial-mismo', 'presencial-otro', 'distancia'];
    if (!validModes.includes(this.administrationMode)) {
      errors.push('Modo de administración inválido');
    }

    // Validar porcentaje de completitud
    if (this.completionPercentage < 0 || this.completionPercentage > 100) {
      errors.push('Porcentaje de completitud debe estar entre 0 y 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convierte a formato JSON para API
   */
  toJSON() {
    return {
      id: this.id,
      scaleId: this.scaleId,
      patientId: this.patientId,
      patientName: this.patientName,
      totalScore: this.totalScore,
      completionPercentage: this.completionPercentage,
      administrationMode: this.administrationMode,
      completedAt: this.completedAt,
      createdBy: this.createdBy,
      responses: this.responses.map(response => response.toJSON ? response.toJSON() : response),
      subscaleResults: this.subscaleResults.map(result => result.toJSON ? result.toJSON() : result),
      interpretation: this.interpretation
    };
  }

  /**
   * Convierte a formato compatible con el frontend existente
   */
  toLegacyFormat() {
    return {
      id: this.id,
      scaleId: this.scaleId,
      patient: {
        id: this.patientId,
        name: this.patientName
      },
      results: {
        totalScore: this.totalScore,
        completionPercentage: this.completionPercentage,
        interpretation: this.interpretation,
        subscaleScores: this.subscaleResults.reduce((acc, result) => {
          acc[result.subscaleCode] = {
            name: result.subscaleName,
            score: result.score
          };
          return acc;
        }, {}),
        alerts: this.getAlerts()
      },
      responses: this.responses.map(response => ({
        itemNumber: response.itemNumber,
        value: response.responseValue,
        label: response.responseLabel,
        score: response.scoreValue
      })),
      metadata: {
        administrationMode: this.administrationMode,
        completedAt: this.completedAt,
        createdBy: this.createdBy
      }
    };
  }

  /**
   * Convierte a formato de base de datos
   */
  toDatabaseFormat() {
    return {
      id: this.id,
      scale_id: this.scaleId,
      patient_id: this.patientId,
      patient_name: this.patientName,
      total_score: this.totalScore,
      completion_percentage: this.completionPercentage,
      administration_mode: this.administrationMode,
      completed_at: this.completedAt,
      created_by: this.createdBy
    };
  }

  /**
   * Agrega una respuesta a la evaluación
   */
  addResponse(response) {
    this.responses.push(response);
    this.responses.sort((a, b) => a.itemNumber - b.itemNumber);
  }

  /**
   * Agrega un resultado de subescala
   */
  addSubscaleResult(result) {
    this.subscaleResults.push(result);
  }

  /**
   * Establece la interpretación de la evaluación
   */
  setInterpretation(interpretation) {
    this.interpretation = interpretation;
  }

  /**
   * Calcula la puntuación total basada en las respuestas
   */
  calculateTotalScore() {
    this.totalScore = this.responses.reduce((sum, response) => sum + response.scoreValue, 0);
    return this.totalScore;
  }

  /**
   * Calcula el porcentaje de completitud
   */
  calculateCompletionPercentage(totalItems) {
    this.completionPercentage = (this.responses.length / totalItems) * 100;
    return this.completionPercentage;
  }

  /**
   * Obtiene alertas basadas en las respuestas
   */
  getAlerts() {
    const alerts = [];
    
    // Ejemplo: alertas para respuestas de riesgo
    this.responses.forEach(response => {
      if (response.scoreValue >= 3 && response.itemNumber === 9) { // Ejemplo: item 9 con puntuación alta
        alerts.push({
          itemNumber: response.itemNumber,
          message: 'Respuesta indica posible riesgo - requiere atención especial',
          severity: 'high'
        });
      }
    });

    return alerts;
  }

  /**
   * Verifica si la evaluación está completa
   */
  isComplete(totalItems) {
    return this.responses.length === totalItems;
  }

  /**
   * Obtiene respuesta por número de item
   */
  getResponseByItem(itemNumber) {
    return this.responses.find(response => response.itemNumber === itemNumber);
  }

  /**
   * Obtiene respuestas por subescala
   */
  getResponsesBySubscale(subscaleName) {
    // Esto requeriría información adicional sobre qué items pertenecen a cada subescala
    // Se implementaría con información de la escala
    return this.responses.filter(response => {
      // Lógica para filtrar por subescala
      return true; // Placeholder
    });
  }

  /**
   * Crea una instancia desde datos de base de datos
   */
  static fromDatabase(dbData) {
    return new Assessment(dbData);
  }

  /**
   * Crea una instancia desde datos de API
   */
  static fromAPI(apiData) {
    return new Assessment({
      id: apiData.id,
      scale_id: apiData.scaleId,
      patient_id: apiData.patientId,
      patient_name: apiData.patientName,
      total_score: apiData.totalScore,
      completion_percentage: apiData.completionPercentage,
      administration_mode: apiData.administrationMode,
      completed_at: apiData.completedAt,
      created_by: apiData.createdBy
    });
  }

  /**
   * Genera un ID único para la evaluación
   */
  static generateId() {
    return `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = Assessment;