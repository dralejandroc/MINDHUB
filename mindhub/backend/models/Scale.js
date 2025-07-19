/**
 * MODELO UNIVERSAL DE ESCALA
 * Representa una escala psicológica/médica completa con todos sus componentes
 */

class Scale {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.abbreviation = data.abbreviation;
    this.version = data.version || '1.0';
    this.category = data.category;
    this.subcategory = data.subcategory;
    this.description = data.description;
    this.author = data.author;
    this.publicationYear = data.publication_year;
    this.estimatedDurationMinutes = data.estimated_duration_minutes;
    this.administrationMode = data.administration_mode || 'both';
    this.targetPopulation = data.target_population;
    this.totalItems = data.total_items;
    this.scoringMethod = data.scoring_method;
    this.scoreRangeMin = data.score_range_min;
    this.scoreRangeMax = data.score_range_max;
    this.instructionsProfessional = data.instructions_professional;
    this.instructionsPatient = data.instructions_patient;
    this.isActive = data.is_active !== false;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    
    // Componentes relacionados (se cargan por separado)
    this.items = [];
    this.responseOptions = [];
    this.interpretationRules = [];
    this.subscales = [];
  }

  /**
   * Valida que la escala tenga todos los datos necesarios
   */
  validate() {
    const errors = [];

    if (!this.id) errors.push('ID es requerido');
    if (!this.name) errors.push('Nombre es requerido');
    if (!this.abbreviation) errors.push('Abreviación es requerida');
    if (!this.totalItems || this.totalItems < 1) errors.push('Total de items debe ser mayor a 0');
    
    // Validar modo de administración
    const validModes = ['self_administered', 'clinician_administered', 'both'];
    if (!validModes.includes(this.administrationMode)) {
      errors.push('Modo de administración inválido');
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
      name: this.name,
      abbreviation: this.abbreviation,
      version: this.version,
      category: this.category,
      subcategory: this.subcategory,
      description: this.description,
      author: this.author,
      publicationYear: this.publicationYear,
      estimatedDurationMinutes: this.estimatedDurationMinutes,
      administrationMode: this.administrationMode,
      targetPopulation: this.targetPopulation,
      totalItems: this.totalItems,
      scoringMethod: this.scoringMethod,
      scoreRange: {
        min: this.scoreRangeMin,
        max: this.scoreRangeMax
      },
      instructions: {
        professional: this.instructionsProfessional,
        patient: this.instructionsPatient
      },
      isActive: this.isActive,
      items: this.items.map(item => item.toJSON ? item.toJSON() : item),
      responseOptions: this.responseOptions.map(option => option.toJSON ? option.toJSON() : option),
      interpretationRules: this.interpretationRules.map(rule => rule.toJSON ? rule.toJSON() : rule),
      subscales: this.subscales.map(subscale => subscale.toJSON ? subscale.toJSON() : subscale)
    };
  }

  /**
   * Convierte a formato compatible con el frontend existente
   */
  toLegacyFormat() {
    return {
      id: this.id,
      name: this.name,
      abbreviation: this.abbreviation,
      description: this.description,
      totalItems: this.totalItems,
      estimatedDurationMinutes: this.estimatedDurationMinutes,
      administrationMode: this.administrationMode,
      items: this.items.map(item => ({
        id: item.id,
        number: item.itemNumber,
        text: item.itemText,
        subscale: item.subscale,
        reverseScored: item.reverseScored
      })),
      responseOptions: this.responseOptions.map(option => ({
        value: option.optionValue,
        label: option.optionLabel,
        score: option.scoreValue
      })),
      scoring: {
        method: this.scoringMethod,
        range: {
          min: this.scoreRangeMin,
          max: this.scoreRangeMax
        }
      },
      interpretation: this.interpretationRules.map(rule => ({
        minScore: rule.minScore,
        maxScore: rule.maxScore,
        severity: rule.severityLevel,
        label: rule.interpretationLabel,
        description: rule.description,
        recommendations: rule.recommendations ? rule.recommendations.split('\n') : []
      }))
    };
  }

  /**
   * Agrega un item a la escala
   */
  addItem(item) {
    this.items.push(item);
    this.items.sort((a, b) => a.itemNumber - b.itemNumber);
  }

  /**
   * Agrega una opción de respuesta
   */
  addResponseOption(option) {
    this.responseOptions.push(option);
    this.responseOptions.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Agrega una regla de interpretación
   */
  addInterpretationRule(rule) {
    this.interpretationRules.push(rule);
    this.interpretationRules.sort((a, b) => a.minScore - b.minScore);
  }

  /**
   * Agrega una subescala
   */
  addSubscale(subscale) {
    this.subscales.push(subscale);
  }

  /**
   * Obtiene items por subescala
   */
  getItemsBySubscale(subscaleName) {
    return this.items.filter(item => item.subscale === subscaleName);
  }

  /**
   * Calcula el rango de puntuación teórico
   */
  getTheoreticalScoreRange() {
    if (this.responseOptions.length === 0) {
      return { min: this.scoreRangeMin || 0, max: this.scoreRangeMax || 0 };
    }

    const minOptionScore = Math.min(...this.responseOptions.map(opt => opt.scoreValue));
    const maxOptionScore = Math.max(...this.responseOptions.map(opt => opt.scoreValue));

    return {
      min: minOptionScore * this.totalItems,
      max: maxOptionScore * this.totalItems
    };
  }

  /**
   * Verifica si la escala está completa (tiene todos los componentes necesarios)
   */
  isComplete() {
    return (
      this.items.length === this.totalItems &&
      this.responseOptions.length > 0 &&
      this.interpretationRules.length > 0
    );
  }

  /**
   * Crea una instancia desde datos de base de datos
   */
  static fromDatabase(dbData) {
    return new Scale(dbData);
  }

  /**
   * Crea una instancia desde datos de API
   */
  static fromAPI(apiData) {
    const scale = new Scale({
      id: apiData.id,
      name: apiData.name,
      abbreviation: apiData.abbreviation,
      version: apiData.version,
      category: apiData.category,
      subcategory: apiData.subcategory,
      description: apiData.description,
      author: apiData.author,
      publication_year: apiData.publicationYear,
      estimated_duration_minutes: apiData.estimatedDurationMinutes,
      administration_mode: apiData.administrationMode,
      target_population: apiData.targetPopulation,
      total_items: apiData.totalItems,
      scoring_method: apiData.scoringMethod,
      score_range_min: apiData.scoreRange?.min,
      score_range_max: apiData.scoreRange?.max,
      instructions_professional: apiData.instructions?.professional,
      instructions_patient: apiData.instructions?.patient,
      is_active: apiData.isActive
    });

    return scale;
  }
}

module.exports = Scale;