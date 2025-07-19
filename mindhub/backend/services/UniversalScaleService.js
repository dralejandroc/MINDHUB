/**
 * SERVICIO UNIVERSAL DE ESCALAS
 * Lógica de negocio para operaciones con escalas
 */

const ScaleRepository = require('../repositories/ScaleRepository');
const ScaleCalculatorService = require('./ScaleCalculatorService');
const ScaleValidationService = require('./ScaleValidationService');

class UniversalScaleService {
  constructor() {
    this.scaleRepository = new ScaleRepository();
    this.calculator = new ScaleCalculatorService();
    this.validator = new ScaleValidationService();
  }

  /**
   * Obtiene todas las escalas disponibles
   */
  async getAllScales() {
    try {
      const scales = await this.scaleRepository.getAllActiveScales();
      return scales;
    } catch (error) {
      console.error('Error obteniendo todas las escalas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una escala específica por ID
   */
  async getScaleById(scaleId) {
    try {
      const scale = await this.scaleRepository.getScaleById(scaleId);
      if (!scale) {
        throw new Error(`Escala ${scaleId} no encontrada`);
      }
      return scale;
    } catch (error) {
      console.error(`Error obteniendo escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Busca escalas por término
   */
  async searchScales(searchTerm) {
    try {
      const scales = await this.scaleRepository.searchScales(searchTerm);
      return scales.map(scale => scale.toLegacyFormat());
    } catch (error) {
      console.error(`Error buscando escalas con término ${searchTerm}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene escalas por categoría
   */
  async getScalesByCategory(category) {
    try {
      const scales = await this.scaleRepository.getScalesByCategory(category);
      return scales.map(scale => scale.toLegacyFormat());
    } catch (error) {
      console.error(`Error obteniendo escalas por categoría ${category}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  async getCategories() {
    try {
      return await this.scaleRepository.getCategories();
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  }

  /**
   * Calcula puntuación y genera interpretación para una evaluación
   */
  async processAssessment(scaleId, responses) {
    try {
      // Obtener la escala completa
      const scale = await this.scaleRepository.getScaleById(scaleId);
      if (!scale) {
        throw new Error(`Escala ${scaleId} no encontrada`);
      }

      // Validar respuestas
      const validation = this.validator.validateResponses(scale, responses);
      if (!validation.isValid) {
        throw new Error(`Respuestas inválidas: ${validation.errors.join(', ')}`);
      }

      // Calcular puntuaciones
      const results = this.calculator.calculateScores(scale, responses);

      // Generar interpretación
      const interpretation = this.calculator.interpretScore(scale, results.totalScore);

      // Detectar alertas
      const alerts = this.calculator.detectAlerts(scale, responses);

      return {
        scaleId: scaleId,
        scaleName: scale.name,
        scaleAbbreviation: scale.abbreviation,
        totalScore: results.totalScore,
        subscaleScores: results.subscaleScores,
        interpretation: interpretation,
        alerts: alerts,
        validResponses: responses.length,
        completionPercentage: (responses.length / scale.totalItems) * 100,
        calculatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error procesando evaluación para escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Valida que una escala esté completa antes de ser usada
   */
  async validateScaleCompleteness(scaleId) {
    try {
      const scale = await this.scaleRepository.getScaleById(scaleId);
      if (!scale) {
        return { isValid: false, errors: ['Escala no encontrada'] };
      }

      return this.validator.validateScaleCompleteness(scale);
    } catch (error) {
      console.error(`Error validando completitud de escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de uso de escalas
   */
  async getScaleUsageStats() {
    try {
      return await this.scaleRepository.getScaleStats();
    } catch (error) {
      console.error('Error obteniendo estadísticas de uso:', error);
      throw error;
    }
  }

  /**
   * Prepara datos de escala para el renderizador universal
   */
  async prepareScaleForRenderer(scaleId) {
    try {
      const scale = await this.scaleRepository.getScaleById(scaleId);
      if (!scale) {
        throw new Error(`Escala ${scaleId} no encontrada`);
      }

      // Verificar completitud
      if (!scale.isComplete()) {
        throw new Error(`Escala ${scaleId} está incompleta`);
      }

      // Formatear para el renderizador universal
      return {
        id: scale.id,
        name: scale.name,
        abbreviation: scale.abbreviation,
        description: scale.description,
        totalItems: scale.totalItems,
        estimatedDurationMinutes: scale.estimatedDurationMinutes,
        administrationMode: scale.administrationMode,
        instructions: {
          professional: scale.instructionsProfessional,
          patient: scale.instructionsPatient
        },
        items: scale.items.map(item => ({
          id: item.id,
          number: item.itemNumber,
          text: item.itemText,
          subscale: item.subscale,
          reverseScored: item.reverseScored
        })),
        responseOptions: scale.responseOptions.map(option => ({
          value: option.optionValue,
          label: option.optionLabel,
          score: option.scoreValue
        })),
        scoring: {
          method: scale.scoringMethod,
          range: {
            min: scale.scoreRangeMin,
            max: scale.scoreRangeMax
          }
        },
        interpretation: {
          rules: scale.interpretationRules,
          subscales: scale.subscales
        }
      };

    } catch (error) {
      console.error(`Error preparando escala ${scaleId} para renderizador:`, error);
      throw error;
    }
  }

  /**
   * Obtiene metadatos de una escala sin cargar todos los componentes
   */
  async getScaleMetadata(scaleId) {
    try {
      const scaleQuery = `SELECT * FROM scales WHERE id = ? AND is_active = 1`;
      const scaleRows = await this.scaleRepository.dbConnection.query(scaleQuery, [scaleId]);
      
      if (scaleRows.length === 0) {
        return null;
      }

      const scale = scaleRows[0];
      return {
        id: scale.id,
        name: scale.name,
        abbreviation: scale.abbreviation,
        description: scale.description,
        category: scale.category,
        subcategory: scale.subcategory,
        totalItems: scale.total_items,
        estimatedDurationMinutes: scale.estimated_duration_minutes,
        administrationMode: scale.administration_mode,
        targetPopulation: scale.target_population
      };

    } catch (error) {
      console.error(`Error obteniendo metadatos de escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva escala desde datos de API
   */
  async createScale(scaleData) {
    try {
      // Validar datos básicos
      if (!scaleData.id || !scaleData.name || !scaleData.abbreviation) {
        throw new Error('Datos básicos de escala requeridos: id, name, abbreviation');
      }

      // Verificar que no exista
      const exists = await this.scaleRepository.scaleExists(scaleData.id);
      if (exists) {
        throw new Error(`Escala con ID ${scaleData.id} ya existe`);
      }

      // Crear la escala
      const scale = await this.scaleRepository.createScale(scaleData);
      return scale.toLegacyFormat();

    } catch (error) {
      console.error('Error creando nueva escala:', error);
      throw error;
    }
  }

  /**
   * Actualiza una escala existente
   */
  async updateScale(scaleId, scaleData) {
    try {
      const scale = await this.scaleRepository.updateScale(scaleId, scaleData);
      if (!scale) {
        throw new Error(`Escala ${scaleId} no encontrada`);
      }
      return scale.toLegacyFormat();
    } catch (error) {
      console.error(`Error actualizando escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Desactiva una escala
   */
  async deactivateScale(scaleId) {
    try {
      await this.scaleRepository.deactivateScale(scaleId);
      return { success: true, message: `Escala ${scaleId} desactivada` };
    } catch (error) {
      console.error(`Error desactivando escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene escalas recomendadas para un paciente/contexto
   */
  async getRecommendedScales(context = {}) {
    try {
      // Lógica para recomendar escalas basada en contexto
      // Por ejemplo: edad, diagnóstico, especialidad, etc.
      
      let scales = await this.scaleRepository.getAllActiveScales();
      
      // Filtrar por población objetivo si se especifica
      if (context.targetPopulation) {
        scales = scales.filter(scale => 
          !scale.targetPopulation || 
          scale.targetPopulation.includes(context.targetPopulation)
        );
      }

      // Filtrar por categoría si se especifica
      if (context.category) {
        scales = scales.filter(scale => scale.category === context.category);
      }

      // Ordenar por popularidad de uso
      const stats = await this.scaleRepository.getScaleStats();
      const statsMap = new Map(stats.map(stat => [stat.id, stat.assessment_count]));
      
      scales.sort((a, b) => {
        const aCount = statsMap.get(a.id) || 0;
        const bCount = statsMap.get(b.id) || 0;
        return bCount - aCount;
      });

      return scales.slice(0, 10).map(scale => scale.toLegacyFormat());

    } catch (error) {
      console.error('Error obteniendo escalas recomendadas:', error);
      throw error;
    }
  }
}

module.exports = UniversalScaleService;