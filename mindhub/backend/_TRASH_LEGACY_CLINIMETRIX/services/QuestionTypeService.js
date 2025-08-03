/**
 * SERVICIO DE TIPOS DE PREGUNTAS
 * Maneja la lógica específica para diferentes tipos de preguntas en escalas clínicas
 */

class QuestionTypeService {
  constructor() {
    this.questionTypes = {
      likert: {
        validate: this.validateLikert.bind(this),
        process: this.processLikert.bind(this),
        render: this.renderLikert.bind(this)
      },
      dichotomous: {
        validate: this.validateDichotomous.bind(this),
        process: this.processDichotomous.bind(this),
        render: this.renderDichotomous.bind(this)
      },
      vas: {
        validate: this.validateVAS.bind(this),
        process: this.processVAS.bind(this),
        render: this.renderVAS.bind(this)
      },
      numeric: {
        validate: this.validateNumeric.bind(this),
        process: this.processNumeric.bind(this),
        render: this.renderNumeric.bind(this)
      },
      multiple_choice: {
        validate: this.validateMultipleChoice.bind(this),
        process: this.processMultipleChoice.bind(this),
        render: this.renderMultipleChoice.bind(this)
      },
      text: {
        validate: this.validateText.bind(this),
        process: this.processText.bind(this),
        render: this.renderText.bind(this)
      },
      ranking: {
        validate: this.validateRanking.bind(this),
        process: this.processRanking.bind(this),
        render: this.renderRanking.bind(this)
      },
      semantic_diff: {
        validate: this.validateSemanticDiff.bind(this),
        process: this.processSemanticDiff.bind(this),
        render: this.renderSemanticDiff.bind(this)
      },
      checklist: {
        validate: this.validateChecklist.bind(this),
        process: this.processChecklist.bind(this),
        render: this.renderChecklist.bind(this)
      },
      frequency: {
        validate: this.validateFrequency.bind(this),
        process: this.processFrequency.bind(this),
        render: this.renderFrequency.bind(this)
      }
    };
  }

  /**
   * Valida una respuesta según el tipo de pregunta
   */
  validateResponse(questionType, response, metadata = {}) {
    const handler = this.questionTypes[questionType];
    if (!handler) {
      throw new Error(`Tipo de pregunta no soportado: ${questionType}`);
    }
    return handler.validate(response, metadata);
  }

  /**
   * Procesa una respuesta y calcula el puntaje
   */
  processResponse(questionType, response, options = [], metadata = {}) {
    const handler = this.questionTypes[questionType];
    if (!handler) {
      throw new Error(`Tipo de pregunta no soportado: ${questionType}`);
    }
    return handler.process(response, options, metadata);
  }

  /**
   * Genera configuración de renderizado para frontend
   */
  getRenderConfig(questionType, item, options = [], metadata = {}) {
    const handler = this.questionTypes[questionType];
    if (!handler) {
      throw new Error(`Tipo de pregunta no soportado: ${questionType}`);
    }
    return handler.render(item, options, metadata);
  }

  // ==================== VALIDADORES ====================

  validateLikert(response, metadata) {
    if (!response && metadata.required !== false) {
      return { valid: false, error: 'Respuesta requerida' };
    }
    
    const numValue = parseInt(response);
    if (isNaN(numValue)) {
      return { valid: false, error: 'Respuesta debe ser numérica' };
    }
    
    const minOptions = metadata.min_options || 2;
    const maxOptions = metadata.max_options || 7;
    
    if (numValue < 0 || numValue >= maxOptions) {
      return { valid: false, error: `Valor fuera del rango 0-${maxOptions - 1}` };
    }
    
    return { valid: true };
  }

  validateDichotomous(response, metadata) {
    if (!response && metadata.required !== false) {
      return { valid: false, error: 'Respuesta requerida' };
    }
    
    const validValues = ['0', '1', 'true', 'false', 'yes', 'no', 'si', 'no'];
    if (!validValues.includes(response?.toLowerCase())) {
      return { valid: false, error: 'Respuesta debe ser dicotómica' };
    }
    
    return { valid: true };
  }

  validateVAS(response, metadata) {
    if (!response && metadata.required !== false) {
      return { valid: false, error: 'Respuesta requerida' };
    }
    
    const numValue = parseFloat(response);
    if (isNaN(numValue)) {
      return { valid: false, error: 'Respuesta debe ser numérica' };
    }
    
    const minValue = metadata.min_value || 0;
    const maxValue = metadata.max_value || 100;
    
    if (numValue < minValue || numValue > maxValue) {
      return { valid: false, error: `Valor fuera del rango ${minValue}-${maxValue}` };
    }
    
    return { valid: true };
  }

  validateNumeric(response, metadata) {
    return this.validateVAS(response, metadata); // Similar logic
  }

  validateMultipleChoice(response, metadata) {
    if (!response && metadata.required !== false) {
      return { valid: false, error: 'Respuesta requerida' };
    }
    
    // Validar que la respuesta sea una de las opciones válidas
    return { valid: true };
  }

  validateText(response, metadata) {
    if (!response && metadata.required) {
      return { valid: false, error: 'Respuesta requerida' };
    }
    
    if (response && metadata.max_length && response.length > metadata.max_length) {
      return { valid: false, error: `Texto excede ${metadata.max_length} caracteres` };
    }
    
    return { valid: true };
  }

  validateRanking(response, metadata) {
    if (!response && metadata.required !== false) {
      return { valid: false, error: 'Respuesta requerida' };
    }
    
    if (!Array.isArray(response)) {
      return { valid: false, error: 'Respuesta debe ser un array' };
    }
    
    return { valid: true };
  }

  validateSemanticDiff(response, metadata) {
    return this.validateNumeric(response, metadata);
  }

  validateChecklist(response, metadata) {
    if (!Array.isArray(response)) {
      return { valid: false, error: 'Respuesta debe ser un array' };
    }
    
    const minSelections = metadata.min_selections || 0;
    if (response.length < minSelections) {
      return { valid: false, error: `Debe seleccionar al menos ${minSelections} opciones` };
    }
    
    return { valid: true };
  }

  validateFrequency(response, metadata) {
    return this.validateLikert(response, metadata);
  }

  // ==================== PROCESADORES ====================

  processLikert(response, options, metadata) {
    const selectedOption = options.find(opt => opt.value === response);
    return {
      score: selectedOption ? selectedOption.score : 0,
      rawResponse: response,
      processedResponse: selectedOption ? selectedOption.label : response
    };
  }

  processDichotomous(response, options, metadata) {
    // Normalizar respuesta dicotómica
    const normalizedResponse = this.normalizeDichotomous(response);
    const selectedOption = options.find(opt => opt.value === normalizedResponse);
    
    return {
      score: selectedOption ? selectedOption.score : 0,
      rawResponse: response,
      processedResponse: normalizedResponse
    };
  }

  processVAS(response, options, metadata) {
    const numValue = parseFloat(response);
    const minValue = metadata.min_value || 0;
    const maxValue = metadata.max_value || 100;
    
    // Escalar VAS a rango de puntuación de la escala
    const scaledScore = this.scaleVASScore(numValue, minValue, maxValue, metadata.scale_range);
    
    return {
      score: scaledScore,
      rawResponse: response,
      processedResponse: numValue
    };
  }

  processNumeric(response, options, metadata) {
    const numValue = parseFloat(response);
    return {
      score: numValue,
      rawResponse: response,
      processedResponse: numValue
    };
  }

  processMultipleChoice(response, options, metadata) {
    return this.processLikert(response, options, metadata);
  }

  processText(response, options, metadata) {
    // Texto libre generalmente no tiene puntuación numérica
    return {
      score: 0,
      rawResponse: response,
      processedResponse: response,
      requiresManualScoring: true
    };
  }

  processRanking(response, options, metadata) {
    // Procesar ranking según algoritmo específico
    const totalScore = this.calculateRankingScore(response, options, metadata);
    
    return {
      score: totalScore,
      rawResponse: response,
      processedResponse: response
    };
  }

  processSemanticDiff(response, options, metadata) {
    const numValue = parseFloat(response);
    const scalePoints = metadata.scale_points || 7;
    const midPoint = Math.ceil(scalePoints / 2);
    
    // Calcular distancia desde punto neutral
    const distanceFromNeutral = Math.abs(numValue - midPoint);
    
    return {
      score: distanceFromNeutral,
      rawResponse: response,
      processedResponse: numValue
    };
  }

  processChecklist(response, options, metadata) {
    // Sumar puntuaciones de items seleccionados
    const totalScore = response.reduce((sum, selectedValue) => {
      const option = options.find(opt => opt.value === selectedValue);
      return sum + (option ? option.score : 0);
    }, 0);
    
    return {
      score: totalScore,
      rawResponse: response,
      processedResponse: response
    };
  }

  processFrequency(response, options, metadata) {
    return this.processLikert(response, options, metadata);
  }

  // ==================== CONFIGURADORES DE RENDERIZADO ====================

  renderLikert(item, options, metadata) {
    return {
      componentType: 'LikertQuestion',
      props: {
        item,
        options,
        layout: metadata.layout || 'vertical',
        showNumbers: metadata.show_numbers !== false,
        showLabels: metadata.show_labels !== false
      }
    };
  }

  renderDichotomous(item, options, metadata) {
    return {
      componentType: 'DichotomousQuestion',
      props: {
        item,
        options,
        layout: metadata.layout || 'horizontal',
        style: metadata.style || 'buttons'
      }
    };
  }

  renderVAS(item, options, metadata) {
    return {
      componentType: 'VASQuestion',
      props: {
        item,
        minValue: metadata.min_value || 0,
        maxValue: metadata.max_value || 100,
        step: metadata.step || 1,
        leftLabel: metadata.left_label || 'Mínimo',
        rightLabel: metadata.right_label || 'Máximo',
        showScale: metadata.show_scale !== false
      }
    };
  }

  renderNumeric(item, options, metadata) {
    return {
      componentType: 'NumericQuestion',
      props: {
        item,
        minValue: metadata.min_value || 0,
        maxValue: metadata.max_value || 10,
        step: metadata.step || 1,
        layout: metadata.layout || 'scale'
      }
    };
  }

  renderMultipleChoice(item, options, metadata) {
    return {
      componentType: 'MultipleChoiceQuestion',
      props: {
        item,
        options,
        layout: metadata.layout || 'vertical',
        randomize: metadata.randomize || false
      }
    };
  }

  renderText(item, options, metadata) {
    return {
      componentType: 'TextQuestion',
      props: {
        item,
        maxLength: metadata.max_length || 500,
        rows: metadata.rows || 3,
        placeholder: metadata.placeholder || 'Escriba su respuesta aquí...'
      }
    };
  }

  renderRanking(item, options, metadata) {
    return {
      componentType: 'RankingQuestion',
      props: {
        item,
        options,
        maxRank: metadata.max_rank || options.length,
        allowTies: metadata.allow_ties || false
      }
    };
  }

  renderSemanticDiff(item, options, metadata) {
    return {
      componentType: 'SemanticDifferentialQuestion',
      props: {
        item,
        leftConcept: metadata.left_concept || 'Negativo',
        rightConcept: metadata.right_concept || 'Positivo',
        scalePoints: metadata.scale_points || 7,
        showNumbers: metadata.show_numbers !== false
      }
    };
  }

  renderChecklist(item, options, metadata) {
    return {
      componentType: 'ChecklistQuestion',
      props: {
        item,
        options,
        minSelections: metadata.min_selections || 0,
        maxSelections: metadata.max_selections || options.length,
        layout: metadata.layout || 'vertical'
      }
    };
  }

  renderFrequency(item, options, metadata) {
    return {
      componentType: 'FrequencyQuestion',
      props: {
        item,
        options,
        timeFrame: metadata.time_frame || 'weeks',
        layout: metadata.layout || 'vertical'
      }
    };
  }

  // ==================== UTILIDADES ====================

  normalizeDichotomous(response) {
    const responseStr = response?.toString()?.toLowerCase();
    
    if (['true', 'yes', 'si', 'sí', '1'].includes(responseStr)) {
      return '1';
    }
    if (['false', 'no', '0'].includes(responseStr)) {
      return '0';
    }
    
    return response;
  }

  scaleVASScore(value, minVAS, maxVAS, scaleRange) {
    if (!scaleRange || !scaleRange.min || !scaleRange.max) {
      return value; // Sin escalamiento
    }
    
    const percentage = (value - minVAS) / (maxVAS - minVAS);
    return Math.round(scaleRange.min + (percentage * (scaleRange.max - scaleRange.min)));
  }

  calculateRankingScore(rankings, options, metadata) {
    // Algoritmo básico: puntuación inversa al ranking
    let totalScore = 0;
    const maxRank = options.length;
    
    rankings.forEach((ranking, index) => {
      const rankPosition = ranking.rank || (index + 1);
      const score = maxRank - rankPosition + 1;
      totalScore += score;
    });
    
    return totalScore;
  }

  /**
   * Obtiene la configuración de metadatos para un tipo de pregunta
   */
  getQuestionTypeMetadata(questionType) {
    const defaultMetadata = {
      likert: { min_options: 2, max_options: 7, required: true },
      dichotomous: { required: true },
      vas: { min_value: 0, max_value: 100, required: true },
      numeric: { min_value: 0, max_value: 10, required: true },
      multiple_choice: { required: true },
      text: { max_length: 500, required: false },
      ranking: { required: true },
      semantic_diff: { scale_points: 7, required: true },
      checklist: { min_selections: 0, required: false },
      frequency: { time_frame: 'weeks', required: true }
    };
    
    return defaultMetadata[questionType] || {};
  }
}

module.exports = QuestionTypeService;