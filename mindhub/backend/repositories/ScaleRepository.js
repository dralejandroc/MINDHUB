/**
 * REPOSITORIO UNIVERSAL DE ESCALAS
 * Maneja todas las operaciones de base de datos relacionadas con escalas
 */

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class ScaleRepository {
  
  /**
   * Obtiene todas las escalas activas (solo de seeds)
   */
  async getAllActiveScales() {
    try {
      const scales = await prisma.$queryRaw`
        SELECT * FROM scales 
        WHERE is_active = 1 
        ORDER BY category ASC, name ASC
      `;
      
      return scales.map(scale => ({
        id: scale.id,
        name: scale.name,
        abbreviation: scale.abbreviation,
        version: scale.version,
        category: scale.category,
        subcategory: scale.subcategory,
        description: scale.description,
        author: scale.author,
        publicationYear: scale.publication_year,
        estimatedDurationMinutes: scale.estimated_duration_minutes,
        administrationMode: scale.administration_mode,
        targetPopulation: scale.target_population,
        totalItems: scale.total_items,
        scoringMethod: scale.scoring_method,
        scoreRangeMin: scale.score_range_min,
        scoreRangeMax: scale.score_range_max,
        instructionsProfessional: scale.instructions_professional,
        instructionsPatient: scale.instructions_patient,
        isActive: scale.is_active
      }));
      
    } catch (error) {
      console.error('Error obteniendo escalas activas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una escala por ID con todos sus componentes
   */
  async getScaleById(scaleId) {
    try {
      const scale = await prisma.assessmentScale.findFirst({
        where: {
          id: scaleId,
          isActive: true
        }
      });
      
      if (!scale) {
        return null;
      }
      
      // Cargar componentes reales desde las tablas de seeds
      const items = await this.getScaleItemsFromSeeds(scaleId);
      const responseOptions = await this.getScaleResponseOptionsFromSeeds(scaleId);
      const interpretationRules = await this.getScaleInterpretationRulesFromSeeds(scaleId);
      const subscales = await this.getScaleSubscalesFromSeeds(scaleId);
      const instructions = await this.getScaleInstructionsFromSeeds(scaleId);
      
      // Retornar escala con componentes reales
      return {
        ...scale,
        items,
        responseOptions,
        interpretationRules,
        instructions,
        subscales,
        scoringMethod: scale.scoringMethod || 'sum',
        scoreRange: { min: scale.scoreRangeMin || 0, max: scale.scoreRangeMax || 100 }
      };
      
    } catch (error) {
      console.error(`Error obteniendo escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene los items reales de una escala desde la tabla scale_items
   */
  async getScaleItemsFromSeeds(scaleId) {
    try {
      const items = await prisma.$queryRaw`
        SELECT * FROM scale_items 
        WHERE scale_id = ${scaleId} AND is_active = 1 
        ORDER BY item_number
      `;
      
      return items.map(item => ({
        id: item.id,
        number: item.item_number,
        text: item.item_text,
        code: item.item_code,
        subscale: item.subscale,
        alertTrigger: false,
        alertCondition: null,
        reverseScored: item.reverse_scored || false
      }));
      
    } catch (error) {
      console.error(`Error obteniendo items de escala ${scaleId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene las opciones de respuesta reales desde la tabla scale_response_options
   */
  async getScaleResponseOptionsFromSeeds(scaleId) {
    try {
      const options = await prisma.$queryRaw`
        SELECT * FROM scale_response_options 
        WHERE scale_id = ${scaleId} AND is_active = 1 
        ORDER BY display_order
      `;
      
      return options.map(option => ({
        value: option.option_value,
        label: option.option_label,
        score: option.score_value
      }));
      
    } catch (error) {
      console.error(`Error obteniendo opciones de respuesta de escala ${scaleId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene las reglas de interpretación reales desde la tabla scale_interpretation_rules
   */
  async getScaleInterpretationRulesFromSeeds(scaleId) {
    try {
      const rules = await prisma.$queryRaw`
        SELECT * FROM scale_interpretation_rules 
        WHERE scale_id = ${scaleId} AND is_active = 1 
        ORDER BY min_score
      `;
      
      return rules.map(rule => ({
        minScore: rule.min_score,
        maxScore: rule.max_score,
        severity: rule.severity_level,
        label: rule.interpretation_label,
        color: rule.color_code,
        description: rule.description,
        recommendations: rule.recommendations ? rule.recommendations.split('\n').filter(r => r.trim()) : []
      }));
      
    } catch (error) {
      console.error(`Error obteniendo reglas de interpretación de escala ${scaleId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene las subescalas reales desde la tabla scale_subscales
   */
  async getScaleSubscalesFromSeeds(scaleId) {
    try {
      const subscales = await prisma.$queryRaw`
        SELECT * FROM scale_subscales 
        WHERE scale_id = ${scaleId} AND is_active = 1 
        ORDER BY subscale_name
      `;
      
      return subscales.map(subscale => ({
        id: subscale.id,
        name: subscale.subscale_name,
        code: subscale.subscale_code,
        minScore: subscale.min_score,
        maxScore: subscale.max_score,
        description: subscale.description,
        items: [] // Se puede llenar con los números de items si es necesario
      }));
      
    } catch (error) {
      console.error(`Error obteniendo subescalas de escala ${scaleId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene las instrucciones desde la escala principal
   */
  async getScaleInstructionsFromSeeds(scaleId) {
    try {
      const scaleInfo = await prisma.$queryRaw`
        SELECT instructions_professional, instructions_patient 
        FROM scales 
        WHERE id = ${scaleId} AND is_active = 1
      `;
      
      if (scaleInfo && scaleInfo.length > 0) {
        const info = scaleInfo[0];
        const instructions = [];
        
        if (info.instructions_professional) {
          instructions.push(`Profesional: ${info.instructions_professional}`);
        }
        
        if (info.instructions_patient) {
          instructions.push(`Paciente: ${info.instructions_patient}`);
        }
        
        return instructions;
      }
      
      return [];
      
    } catch (error) {
      console.error(`Error obteniendo instrucciones de escala ${scaleId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene escalas por categoría
   */
  async getScalesByCategory(category) {
    try {
      const query = `
        SELECT * FROM scales 
        WHERE category = ? AND is_active = 1 
        ORDER BY name
      `;
      
      const rows = await dbConnection.query(query, [category]);
      return rows.map(row => Scale.fromDatabase(row));
      
    } catch (error) {
      console.error(`Error obteniendo escalas por categoría ${category}:`, error);
      throw error;
    }
  }

  /**
   * Busca escalas por término de búsqueda
   */
  async searchScales(searchTerm) {
    try {
      const query = `
        SELECT * FROM scales 
        WHERE (name LIKE ? OR abbreviation LIKE ? OR description LIKE ?) 
        AND is_active = 1 
        ORDER BY name
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const rows = await dbConnection.query(query, [searchPattern, searchPattern, searchPattern]);
      return rows.map(row => Scale.fromDatabase(row));
      
    } catch (error) {
      console.error(`Error buscando escalas con término ${searchTerm}:`, error);
      throw error;
    }
  }

  /**
   * Carga todos los componentes relacionados de una escala
   */
  async loadScaleComponents(scale) {
    try {
      // Cargar items
      const items = await this.getScaleItems(scale.id);
      items.forEach(item => scale.addItem(item));

      // Cargar opciones de respuesta
      const responseOptions = await this.getScaleResponseOptions(scale.id);
      responseOptions.forEach(option => scale.addResponseOption(option));

      // Cargar reglas de interpretación
      const interpretationRules = await this.getScaleInterpretationRules(scale.id);
      interpretationRules.forEach(rule => scale.addInterpretationRule(rule));

      // Cargar subescalas
      const subscales = await this.getScaleSubscales(scale.id);
      subscales.forEach(subscale => scale.addSubscale(subscale));

    } catch (error) {
      console.error(`Error cargando componentes de escala ${scale.id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene los items de una escala
   */
  async getScaleItems(scaleId) {
    try {
      const query = `
        SELECT * FROM scale_items 
        WHERE scale_id = ? AND is_active = 1 
        ORDER BY item_number
      `;
      
      const rows = await dbConnection.query(query, [scaleId]);
      return rows.map(row => ScaleItem.fromDatabase(row));
      
    } catch (error) {
      console.error(`Error obteniendo items de escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene las opciones de respuesta de una escala
   */
  async getScaleResponseOptions(scaleId) {
    try {
      const query = `
        SELECT * FROM scale_response_options 
        WHERE scale_id = ? AND is_active = 1 
        ORDER BY display_order
      `;
      
      const rows = await dbConnection.query(query, [scaleId]);
      return rows.map(row => ScaleResponseOption.fromDatabase(row));
      
    } catch (error) {
      console.error(`Error obteniendo opciones de respuesta de escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene las reglas de interpretación de una escala
   */
  async getScaleInterpretationRules(scaleId) {
    try {
      const query = `
        SELECT * FROM scale_interpretation_rules 
        WHERE scale_id = ? AND is_active = 1 
        ORDER BY min_score
      `;
      
      const rows = await dbConnection.query(query, [scaleId]);
      return rows;
      
    } catch (error) {
      console.error(`Error obteniendo reglas de interpretación de escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene las subescalas de una escala
   */
  async getScaleSubscales(scaleId) {
    try {
      const query = `
        SELECT * FROM scale_subscales 
        WHERE scale_id = ? AND is_active = 1 
        ORDER BY subscale_name
      `;
      
      const rows = await dbConnection.query(query, [scaleId]);
      return rows;
      
    } catch (error) {
      console.error(`Error obteniendo subescalas de escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva escala completa
   */
  async createScale(scaleData) {
    try {
      const scale = Scale.fromAPI(scaleData);
      const validation = scale.validate();
      
      if (!validation.isValid) {
        throw new Error(`Datos de escala inválidos: ${validation.errors.join(', ')}`);
      }

      // Insertar escala básica
      const insertScaleQuery = `
        INSERT INTO scales (
          id, name, abbreviation, version, category, subcategory, description, 
          author, publication_year, estimated_duration_minutes, administration_mode,
          target_population, total_items, scoring_method, score_range_min, 
          score_range_max, instructions_professional, instructions_patient, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await dbConnection.run(insertScaleQuery, [
        scale.id, scale.name, scale.abbreviation, scale.version,
        scale.category, scale.subcategory, scale.description,
        scale.author, scale.publicationYear, scale.estimatedDurationMinutes,
        scale.administrationMode, scale.targetPopulation, scale.totalItems,
        scale.scoringMethod, scale.scoreRangeMin, scale.scoreRangeMax,
        scale.instructionsProfessional, scale.instructionsPatient, scale.isActive
      ]);

      return scale;
      
    } catch (error) {
      console.error('Error creando escala:', error);
      throw error;
    }
  }

  /**
   * Actualiza una escala existente
   */
  async updateScale(scaleId, scaleData) {
    try {
      const updateQuery = `
        UPDATE scales SET 
          name = ?, abbreviation = ?, version = ?, category = ?, subcategory = ?,
          description = ?, author = ?, publication_year = ?, 
          estimated_duration_minutes = ?, administration_mode = ?,
          target_population = ?, total_items = ?, scoring_method = ?,
          score_range_min = ?, score_range_max = ?, 
          instructions_professional = ?, instructions_patient = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await dbConnection.run(updateQuery, [
        scaleData.name, scaleData.abbreviation, scaleData.version,
        scaleData.category, scaleData.subcategory, scaleData.description,
        scaleData.author, scaleData.publicationYear, scaleData.estimatedDurationMinutes,
        scaleData.administrationMode, scaleData.targetPopulation, scaleData.totalItems,
        scaleData.scoringMethod, scaleData.scoreRangeMin, scaleData.scoreRangeMax,
        scaleData.instructionsProfessional, scaleData.instructionsPatient,
        scaleId
      ]);

      return await this.getScaleById(scaleId);
      
    } catch (error) {
      console.error(`Error actualizando escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Desactiva una escala (soft delete)
   */
  async deactivateScale(scaleId) {
    try {
      const query = `UPDATE scales SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await dbConnection.run(query, [scaleId]);
      
    } catch (error) {
      console.error(`Error desactivando escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de uso de escalas
   */
  async getScaleStats() {
    try {
      const query = `
        SELECT 
          s.id,
          s.name,
          s.abbreviation,
          COUNT(a.id) as assessment_count,
          MAX(a.completed_at) as last_used
        FROM scales s
        LEFT JOIN assessments a ON s.id = a.scale_id
        WHERE s.is_active = 1
        GROUP BY s.id, s.name, s.abbreviation
        ORDER BY assessment_count DESC, s.name
      `;
      
      const rows = await dbConnection.query(query);
      return rows;
      
    } catch (error) {
      console.error('Error obteniendo estadísticas de escalas:', error);
      throw error;
    }
  }

  /**
   * Verifica si una escala existe
   */
  async scaleExists(scaleId) {
    try {
      const query = `SELECT COUNT(*) as count FROM scales WHERE id = ?`;
      const rows = await dbConnection.query(query, [scaleId]);
      return rows[0].count > 0;
      
    } catch (error) {
      console.error(`Error verificando existencia de escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  async getCategories() {
    try {
      const query = `
        SELECT DISTINCT category 
        FROM scales 
        WHERE category IS NOT NULL AND is_active = 1 
        ORDER BY category
      `;
      
      const rows = await dbConnection.query(query);
      return rows.map(row => row.category);
      
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  }
}

module.exports = ScaleRepository;