/**
 * SERVICIO DE VALIDACIÓN PARA ESCALAS
 * Valida escalas, respuestas y datos de evaluación
 */

const QuestionTypeService = require('./QuestionTypeService');

class ScaleValidationService {
  
  constructor() {
    this.questionTypeService = new QuestionTypeService();
  }

  /**
   * Valida que una escala esté completa y correcta
   */
  validateScaleCompleteness(scale) {
    try {
      const errors = [];

      // Validar datos básicos
      if (!scale.id) errors.push('ID de escala es requerido');
      if (!scale.name) errors.push('Nombre de escala es requerido');
      if (!scale.abbreviation) errors.push('Abreviación es requerida');
      if (!scale.totalItems || scale.totalItems < 1) errors.push('Total de items debe ser mayor a 0');

      // Validar items
      if (scale.items.length === 0) {
        errors.push('La escala debe tener al menos un item');
      } else {
        if (scale.items.length !== scale.totalItems) {
          errors.push(`Número de items (${scale.items.length}) no coincide con totalItems (${scale.totalItems})`);
        }

        // Validar numeración secuencial
        const itemNumbers = scale.items.map(item => item.number).sort((a, b) => a - b);
        for (let i = 0; i < itemNumbers.length; i++) {
          if (itemNumbers[i] !== i + 1) {
            errors.push(`Item número ${i + 1} faltante o numeración incorrecta`);
            break;
          }
        }

        // Validar texto de items
        scale.items.forEach(item => {
          if (!item.text || item.text.trim() === '') {
            errors.push(`Item ${item.number} no tiene texto`);
          }
        });
      }

      // Validar opciones de respuesta
      if (scale.responseOptions.length === 0) {
        errors.push('La escala debe tener al menos una opción de respuesta');
      } else {
        const values = scale.responseOptions.map(opt => opt.value);
        const uniqueValues = [...new Set(values)];
        if (values.length !== uniqueValues.length) {
          errors.push('Valores de opciones de respuesta duplicados');
        }

        scale.responseOptions.forEach(option => {
          if (!option.label || option.label.trim() === '') {
            errors.push(`Opción ${option.value} no tiene etiqueta`);
          }
          if (option.score === undefined || option.score === null) {
            errors.push(`Opción ${option.value} no tiene valor de puntuación`);
          }
        });
      }

      // Validar reglas de interpretación
      if (scale.interpretationRules.length === 0) {
        errors.push('La escala debe tener al menos una regla de interpretación');
      } else {
        // Verificar que no haya gaps en los rangos
        const sortedRules = scale.interpretationRules.sort((a, b) => a.minScore - b.minScore);
        
        for (let i = 0; i < sortedRules.length - 1; i++) {
          const currentRule = sortedRules[i];
          const nextRule = sortedRules[i + 1];
          
          if (currentRule.maxScore + 1 !== nextRule.minScore) {
            errors.push(`Gap en reglas de interpretación entre ${currentRule.maxScore} y ${nextRule.minScore}`);
          }
        }

        // Verificar que las reglas cubran todo el rango posible
        const theoreticalRange = scale.scoreRange || { min: 0, max: 100 };
        const firstRule = sortedRules[0];
        const lastRule = sortedRules[sortedRules.length - 1];

        if (firstRule.minScore > theoreticalRange.min) {
          errors.push(`Primera regla de interpretación no cubre puntuación mínima posible (${theoreticalRange.min})`);
        }
        if (lastRule.maxScore < theoreticalRange.max) {
          errors.push(`Última regla de interpretación no cubre puntuación máxima posible (${theoreticalRange.max})`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      console.error('Error validando completitud de escala:', error);
      return {
        isValid: false,
        errors: ['Error interno validando escala']
      };
    }
  }

  /**
   * Valida las respuestas de una evaluación
   */
  validateResponses(scale, responses) {
    try {
      const errors = [];

      if (!Array.isArray(responses)) {
        errors.push('Respuestas debe ser un array');
        return { isValid: false, errors };
      }

      if (responses.length === 0) {
        errors.push('Debe haber al menos una respuesta');
        return { isValid: false, errors };
      }

      // Validar cada respuesta
      responses.forEach((response, index) => {
        const responseErrors = this.validateSingleResponse(scale, response, index);
        errors.push(...responseErrors);
      });

      // Validar que no haya respuestas duplicadas para el mismo item
      const itemNumbers = responses.map(r => r.itemNumber);
      const uniqueItems = [...new Set(itemNumbers)];
      if (itemNumbers.length !== uniqueItems.length) {
        errors.push('Respuestas duplicadas para el mismo item');
      }

      // Validar que todos los items respondidos existan en la escala
      const validItemNumbers = scale.items.map(item => item.number);
      itemNumbers.forEach(itemNum => {
        if (!validItemNumbers.includes(itemNum)) {
          errors.push(`Item ${itemNum} no existe en la escala`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      console.error('Error validando respuestas:', error);
      return {
        isValid: false,
        errors: ['Error interno validando respuestas']
      };
    }
  }

  /**
   * Valida una respuesta individual
   */
  validateSingleResponse(scale, response, index) {
    const errors = [];

    // Validar estructura básica
    if (!response.itemNumber) {
      errors.push(`Respuesta ${index + 1}: itemNumber es requerido`);
    }
    if (!response.value && response.value !== 0) {
      errors.push(`Respuesta ${index + 1}: value es requerido`);
    }
    if (!response.label) {
      errors.push(`Respuesta ${index + 1}: label es requerido`);
    }
    if (response.score === undefined || response.score === null) {
      errors.push(`Respuesta ${index + 1}: score es requerido`);
    }

    // Validar que el valor de respuesta sea válido para la escala
    if (response.value !== undefined) {
      const validValues = scale.responseOptions.map(opt => opt.value);
      if (!validValues.includes(response.value)) {
        errors.push(`Respuesta ${index + 1}: valor "${response.value}" no es válido para esta escala`);
      }
    }

    // Validar que el score corresponda al valor seleccionado
    if (response.value !== undefined && response.score !== undefined) {
      const expectedOption = scale.responseOptions.find(opt => opt.value === response.value);
      if (expectedOption && expectedOption.score !== response.score) {
        errors.push(`Respuesta ${index + 1}: score ${response.score} no corresponde al valor "${response.value}"`);
      }
    }

    return errors;
  }

  /**
   * Valida datos de evaluación completa
   */
  validateAssessmentData(assessmentData) {
    try {
      const errors = [];

      // Validar campos básicos
      if (!assessmentData.scaleId) {
        errors.push('Scale ID es requerido');
      }
      if (!assessmentData.responses || !Array.isArray(assessmentData.responses)) {
        errors.push('Respuestas son requeridas y deben ser un array');
      }
      if (assessmentData.totalScore === undefined || assessmentData.totalScore === null) {
        errors.push('Puntuación total es requerida');
      }

      // Validar modo de administración
      const validModes = ['presencial-mismo', 'presencial-otro', 'distancia'];
      if (assessmentData.administrationMode && !validModes.includes(assessmentData.administrationMode)) {
        errors.push('Modo de administración inválido');
      }

      // Validar porcentaje de completitud
      if (assessmentData.completionPercentage !== undefined) {
        if (assessmentData.completionPercentage < 0 || assessmentData.completionPercentage > 100) {
          errors.push('Porcentaje de completitud debe estar entre 0 y 100');
        }
      }

      // Validar que el nombre del paciente no esté vacío si se proporciona
      if (assessmentData.patientName && assessmentData.patientName.trim() === '') {
        errors.push('Nombre del paciente no puede estar vacío');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      console.error('Error validando datos de evaluación:', error);
      return {
        isValid: false,
        errors: ['Error interno validando datos de evaluación']
      };
    }
  }

  /**
   * Valida que la puntuación calculada sea coherente
   */
  validateScoreConsistency(scale, responses, calculatedScore) {
    try {
      const errors = [];

      // Calcular puntuación esperada manualmente
      let expectedScore = 0;
      responses.forEach(response => {
        const item = scale.items.find(item => item.number === response.itemNumber);
        let score = response.score;
        
        // Aplicar puntuación inversa si es necesario
        if (item && item.reverseScored) {
          const maxScore = Math.max(...scale.responseOptions.map(opt => opt.score));
          const minScore = Math.min(...scale.responseOptions.map(opt => opt.score));
          score = maxScore + minScore - score;
        }
        
        expectedScore += score;
      });

      // Comparar con la puntuación calculada
      if (Math.abs(expectedScore - calculatedScore) > 0.01) {
        errors.push(`Puntuación inconsistente: esperada ${expectedScore}, calculada ${calculatedScore}`);
      }

      // Validar que la puntuación esté dentro del rango teórico
      const theoreticalRange = scale.scoreRange || { min: 0, max: 100 };
      if (calculatedScore < theoreticalRange.min || calculatedScore > theoreticalRange.max) {
        errors.push(`Puntuación ${calculatedScore} fuera del rango teórico (${theoreticalRange.min}-${theoreticalRange.max})`);
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      console.error('Error validando consistencia de puntuación:', error);
      return {
        isValid: false,
        errors: ['Error interno validando consistencia de puntuación']
      };
    }
  }

  /**
   * Valida formato de datos para importación de escala
   */
  validateScaleImportFormat(importData) {
    try {
      const errors = [];

      // Validar estructura básica
      if (!importData.scale) {
        errors.push('Datos de escala son requeridos');
        return { isValid: false, errors };
      }

      const scale = importData.scale;

      // Validar campos obligatorios
      const requiredFields = ['id', 'name', 'abbreviation', 'totalItems'];
      requiredFields.forEach(field => {
        if (!scale[field]) {
          errors.push(`Campo ${field} es requerido en datos de escala`);
        }
      });

      // Validar items
      if (!importData.items || !Array.isArray(importData.items)) {
        errors.push('Items son requeridos y deben ser un array');
      } else {
        if (importData.items.length !== scale.totalItems) {
          errors.push(`Número de items (${importData.items.length}) no coincide con totalItems (${scale.totalItems})`);
        }

        importData.items.forEach((item, index) => {
          if (!item.number || !item.text) {
            errors.push(`Item ${index + 1}: number e text son requeridos`);
          }
        });
      }

      // Validar opciones de respuesta
      if (!importData.responseOptions || !Array.isArray(importData.responseOptions)) {
        errors.push('Opciones de respuesta son requeridas y deben ser un array');
      } else {
        importData.responseOptions.forEach((option, index) => {
          if (!option.value || !option.label || option.score === undefined) {
            errors.push(`Opción ${index + 1}: value, label y score son requeridos`);
          }
        });
      }

      // Validar reglas de interpretación
      if (!importData.interpretationRules || !Array.isArray(importData.interpretationRules)) {
        errors.push('Reglas de interpretación son requeridas y deben ser un array');
      } else {
        importData.interpretationRules.forEach((rule, index) => {
          if (rule.minScore === undefined || rule.maxScore === undefined || !rule.severity) {
            errors.push(`Regla ${index + 1}: minScore, maxScore y severity son requeridos`);
          }
        });
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      console.error('Error validando formato de importación:', error);
      return {
        isValid: false,
        errors: ['Error interno validando formato de importación']
      };
    }
  }

  /**
   * Valida integridad referencial entre componentes de escala
   */
  validateReferentialIntegrity(scale) {
    try {
      const errors = [];

      // Validar que items con subescala tengan definidas las subescalas
      const itemSubscales = [...new Set(scale.items.map(item => item.subscale).filter(Boolean))];
      const definedSubscales = scale.subscales.map(sub => sub.subscale_code || sub.subscale_name);

      itemSubscales.forEach(subscale => {
        if (!definedSubscales.includes(subscale)) {
          errors.push(`Subescala "${subscale}" usada en items pero no definida en subescalas`);
        }
      });

      // Validar que todas las subescalas definidas tengan items
      definedSubscales.forEach(subscale => {
        const hasItems = scale.items.some(item => item.subscale === subscale);
        if (!hasItems) {
          errors.push(`Subescala "${subscale}" definida pero sin items asociados`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      console.error('Error validando integridad referencial:', error);
      return {
        isValid: false,
        errors: ['Error interno validando integridad referencial']
      };
    }
  }

  /**
   * Valida que los datos cumplan con estándares de calidad
   */
  validateQualityStandards(scale) {
    try {
      const warnings = [];

      // Verificar longitud de textos
      scale.items.forEach(item => {
        if (item.text.length > 200) {
          warnings.push(`Item ${item.number}: texto muy largo (>${200} caracteres)`);
        }
        if (item.text.length < 10) {
          warnings.push(`Item ${item.number}: texto muy corto (<10 caracteres)`);
        }
      });

      // Verificar balance de opciones de respuesta
      if (scale.responseOptions.length < 2) {
        warnings.push('Pocas opciones de respuesta (recomendado: 3-7)');
      }
      if (scale.responseOptions.length > 10) {
        warnings.push('Muchas opciones de respuesta (recomendado: 3-7)');
      }

      // Verificar metadatos
      if (!scale.description || scale.description.trim() === '') {
        warnings.push('Descripción de escala faltante');
      }
      if (!scale.author || scale.author.trim() === '') {
        warnings.push('Autor de escala faltante');
      }
      if (!scale.publicationYear) {
        warnings.push('Año de publicación faltante');
      }

      return {
        hasWarnings: warnings.length > 0,
        warnings: warnings
      };

    } catch (error) {
      console.error('Error validando estándares de calidad:', error);
      return {
        hasWarnings: false,
        warnings: []
      };
    }
  }

  // ==================== VALIDACIONES ESPECÍFICAS PARA TIPOS DE PREGUNTAS ====================

  /**
   * Valida respuesta según tipo de pregunta
   */
  validateQuestionResponse(item, response, options = []) {
    try {
      const questionType = item.questionType || 'likert';
      const metadata = item.metadata || {};
      
      // Usar QuestionTypeService para validar
      const validation = this.questionTypeService.validateResponse(questionType, response, metadata);
      
      if (!validation.valid) {
        return {
          isValid: false,
          errors: [`Item ${item.number}: ${validation.error}`]
        };
      }

      // Validaciones adicionales específicas
      const additionalValidation = this.validateAdditionalQuestionConstraints(item, response, options);
      
      return {
        isValid: additionalValidation.isValid,
        errors: additionalValidation.errors
      };

    } catch (error) {
      console.error('Error validando respuesta de pregunta:', error);
      return {
        isValid: false,
        errors: [`Error interno validando respuesta del item ${item.number}`]
      };
    }
  }

  /**
   * Valida configuración de tipos de pregunta en escala
   */
  validateQuestionTypeConfiguration(scale) {
    try {
      const errors = [];

      scale.items.forEach(item => {
        const questionType = item.questionType || 'likert';
        const metadata = item.metadata || {};

        // Validar que el tipo de pregunta sea soportado
        const supportedTypes = ['likert', 'dichotomous', 'vas', 'numeric', 'multiple_choice', 'text', 'ranking', 'semantic_diff', 'checklist', 'frequency'];
        if (!supportedTypes.includes(questionType)) {
          errors.push(`Item ${item.number}: tipo de pregunta '${questionType}' no soportado`);
        }

        // Validar configuración específica por tipo
        switch (questionType) {
          case 'dichotomous':
            if (scale.responseOptions.length !== 2) {
              errors.push(`Item ${item.number}: preguntas dicotómicas requieren exactamente 2 opciones`);
            }
            break;

          case 'vas':
            if (!metadata.min_value || !metadata.max_value) {
              errors.push(`Item ${item.number}: VAS requiere min_value y max_value en metadata`);
            }
            break;

          case 'numeric':
            if (metadata.min_value === undefined || metadata.max_value === undefined) {
              errors.push(`Item ${item.number}: pregunta numérica requiere min_value y max_value en metadata`);
            }
            break;

          case 'text':
            if (!metadata.max_length) {
              errors.push(`Item ${item.number}: pregunta de texto requiere max_length en metadata`);
            }
            break;

          case 'checklist':
            if (item.responseOptions && item.responseOptions.length === 0) {
              errors.push(`Item ${item.number}: checklist requiere opciones específicas`);
            }
            break;

          case 'ranking':
            if (item.responseOptions && item.responseOptions.length < 2) {
              errors.push(`Item ${item.number}: ranking requiere al menos 2 opciones`);
            }
            break;

          case 'semantic_diff':
            if (!metadata.left_concept || !metadata.right_concept) {
              errors.push(`Item ${item.number}: diferencial semántico requiere left_concept y right_concept en metadata`);
            }
            break;
        }

        // Validar campos obligatorios para todos los tipos
        if (item.required === undefined) {
          errors.push(`Item ${item.number}: campo 'required' debe estar definido`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      console.error('Error validando configuración de tipos de pregunta:', error);
      return {
        isValid: false,
        errors: ['Error interno validando configuración de tipos de pregunta']
      };
    }
  }

  /**
   * Valida restricciones adicionales específicas por tipo de pregunta
   */
  validateAdditionalQuestionConstraints(item, response, options = []) {
    try {
      const errors = [];
      const questionType = item.questionType || 'likert';
      const metadata = item.metadata || {};

      // Validar campos obligatorios
      if (item.required && (!response || response === '')) {
        errors.push(`Item ${item.number}: respuesta requerida`);
      }

      // Validar condiciones de alerta
      if (item.alertTrigger && item.alertCondition && response) {
        const alertValidation = this.evaluateAlertCondition(response, item.alertCondition);
        if (alertValidation.shouldAlert) {
          // No es un error, pero registrar para procesamiento posterior
          console.log(`Alert triggered for item ${item.number}: ${item.alertCondition}`);
        }
      }

      // Validaciones específicas por tipo
      switch (questionType) {
        case 'checklist':
          if (Array.isArray(response)) {
            const minSelections = metadata.min_selections || 0;
            const maxSelections = metadata.max_selections || options.length;
            
            if (response.length < minSelections) {
              errors.push(`Item ${item.number}: debe seleccionar al menos ${minSelections} opciones`);
            }
            if (response.length > maxSelections) {
              errors.push(`Item ${item.number}: no puede seleccionar más de ${maxSelections} opciones`);
            }
          }
          break;

        case 'ranking':
          if (typeof response === 'string') {
            try {
              const rankingData = JSON.parse(response);
              const maxRank = metadata.max_rank || options.length;
              
              Object.values(rankingData).forEach(rank => {
                if (rank > maxRank) {
                  errors.push(`Item ${item.number}: ranking no puede exceder ${maxRank}`);
                }
              });
            } catch (e) {
              errors.push(`Item ${item.number}: formato de ranking inválido`);
            }
          }
          break;

        case 'text':
          if (response && response.length > metadata.max_length) {
            errors.push(`Item ${item.number}: texto excede ${metadata.max_length} caracteres`);
          }
          break;
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      console.error('Error validando restricciones adicionales:', error);
      return {
        isValid: false,
        errors: [`Error interno validando restricciones del item ${item.number}`]
      };
    }
  }

  /**
   * Evalúa condición de alerta
   */
  evaluateAlertCondition(response, condition) {
    try {
      const numericResponse = parseFloat(response);
      
      if (condition.startsWith('≥')) {
        const threshold = parseFloat(condition.substring(1));
        return { shouldAlert: numericResponse >= threshold };
      }
      
      if (condition.startsWith('≤')) {
        const threshold = parseFloat(condition.substring(1));
        return { shouldAlert: numericResponse <= threshold };
      }
      
      if (condition.startsWith('=')) {
        const value = condition.substring(1);
        return { shouldAlert: response === value };
      }
      
      if (condition.startsWith('>')) {
        const threshold = parseFloat(condition.substring(1));
        return { shouldAlert: numericResponse > threshold };
      }
      
      if (condition.startsWith('<')) {
        const threshold = parseFloat(condition.substring(1));
        return { shouldAlert: numericResponse < threshold };
      }

      return { shouldAlert: false };

    } catch (error) {
      console.error('Error evaluando condición de alerta:', error);
      return { shouldAlert: false };
    }
  }

  /**
   * Valida lógica condicional de escalas
   */
  validateConditionalLogic(scale, responses) {
    try {
      const errors = [];
      
      if (!scale.validationRules || !scale.validationRules.conditionalLogic) {
        return { isValid: true, errors: [] };
      }

      scale.validationRules.conditionalLogic.forEach(rule => {
        const condition = rule.condition;
        const action = rule.action;
        const target = rule.target;

        // Evaluar condición
        const conditionMet = this.evaluateConditionalRule(condition, responses);
        
        if (conditionMet) {
          // Verificar que la acción se haya cumplido
          switch (action) {
            case 'require_item':
              const targetResponse = responses.find(r => r.itemId === target);
              if (!targetResponse || !targetResponse.response) {
                errors.push(`Item ${target} es requerido cuando se cumple: ${condition}`);
              }
              break;
              
            case 'show_item':
              // Verificar que el item esté visible (esto depende de la implementación del frontend)
              break;
          }
        }
      });

      return {
        isValid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      console.error('Error validando lógica condicional:', error);
      return {
        isValid: false,
        errors: ['Error interno validando lógica condicional']
      };
    }
  }

  /**
   * Evalúa regla condicional
   */
  evaluateConditionalRule(condition, responses) {
    try {
      // Formato: "item_1 >= 3"
      const parts = condition.split(' ');
      if (parts.length !== 3) return false;
      
      const itemRef = parts[0];
      const operator = parts[1];
      const value = parts[2];
      
      // Extraer número de item
      const itemNumber = parseInt(itemRef.split('_')[1]);
      const response = responses.find(r => r.itemNumber === itemNumber);
      
      if (!response) return false;
      
      const responseValue = parseFloat(response.response);
      const compareValue = parseFloat(value);
      
      switch (operator) {
        case '>=': return responseValue >= compareValue;
        case '<=': return responseValue <= compareValue;
        case '>': return responseValue > compareValue;
        case '<': return responseValue < compareValue;
        case '=': return responseValue === compareValue;
        case '!=': return responseValue !== compareValue;
        default: return false;
      }

    } catch (error) {
      console.error('Error evaluando regla condicional:', error);
      return false;
    }
  }
}

module.exports = ScaleValidationService;