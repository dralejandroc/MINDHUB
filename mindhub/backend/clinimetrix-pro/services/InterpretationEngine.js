/**
 * ClinimetrixPro Interpretation Engine
 * 
 * Handles clinical interpretation of assessment scores based on 
 * template-defined interpretation rules and clinical guidelines.
 */

const { logger } = require('../../shared/config/logging');

class InterpretationEngine {
  constructor() {
    this.interpretationCache = new Map();
  }

  /**
   * Get clinical interpretation for a given score
   * @param {Object} template - Complete template JSON
   * @param {number} totalScore - Total calculated score
   * @param {Object} subscaleScores - Subscale scores object
   * @returns {Object} Interpretation results
   */
  async getInterpretation(template, totalScore, subscaleScores = {}) {
    try {
      logger.info('Generating interpretation', {
        templateId: template.metadata.id,
        totalScore: totalScore,
        subscaleCount: Object.keys(subscaleScores).length
      });

      // Find matching interpretation rule
      const interpretationRule = this.findMatchingRule(template, totalScore);
      
      if (!interpretationRule) {
        logger.warn('No interpretation rule found for score', {
          templateId: template.metadata.id,
          totalScore: totalScore,
          availableRules: template.interpretation.rules.length
        });
        
        return this.createDefaultInterpretation(totalScore, template);
      }

      // Process subscale interpretations
      const subscaleInterpretations = this.getSubscaleInterpretations(
        template, 
        subscaleScores
      );

      // Generate comprehensive interpretation
      const interpretation = {
        // Basic interpretation data
        rule: interpretationRule,
        score: totalScore,
        severity: interpretationRule.severity,
        label: interpretationRule.label,
        color: interpretationRule.color,
        
        // Clinical interpretation details
        clinicalInterpretation: interpretationRule.clinicalInterpretation,
        clinicalSignificance: interpretationRule.clinicalSignificance,
        differentialConsiderations: interpretationRule.differentialConsiderations,
        
        // Professional recommendations
        professionalRecommendations: interpretationRule.professionalRecommendations || {},
        
        // Prognostic information
        prognosticImplications: interpretationRule.prognosticImplications,
        
        // Subscale interpretations
        subscaleInterpretations: subscaleInterpretations,
        
        // Clinical guidelines and warnings
        clinicalGuidelines: this.getApplicableGuidelines(template, interpretationRule),
        warningFlags: this.checkWarningFlags(template, totalScore, subscaleScores),
        
        // Additional context
        scoreRange: {
          min: interpretationRule.minScore,
          max: interpretationRule.maxScore,
          total: template.scoring.scoreRange
        },
        
        // Confidence and reliability indicators
        interpretationConfidence: this.calculateInterpretationConfidence(
          template, 
          totalScore, 
          interpretationRule
        ),
        
        // Metadata
        interpretationTimestamp: new Date().toISOString(),
        templateVersion: template.metadata.version
      };

      // Add contextual recommendations based on severity
      interpretation.contextualRecommendations = this.generateContextualRecommendations(
        template, 
        interpretation
      );

      logger.info('Interpretation generated successfully', {
        templateId: template.metadata.id,
        severity: interpretation.severity,
        hasRecommendations: !!interpretation.professionalRecommendations.immediate
      });

      return interpretation;

    } catch (error) {
      logger.error('Error generating interpretation', {
        error: error.message,
        templateId: template?.metadata?.id,
        totalScore: totalScore
      });
      
      return this.createErrorInterpretation(error, totalScore);
    }
  }

  /**
   * Find the interpretation rule that matches the given score
   */
  findMatchingRule(template, score) {
    if (!template.interpretation || !template.interpretation.rules) {
      return null;
    }

    return template.interpretation.rules.find(rule => {
      return score >= rule.minScore && score <= rule.maxScore;
    });
  }

  /**
   * Get interpretations for individual subscales
   */
  getSubscaleInterpretations(template, subscaleScores) {
    const interpretations = {};

    Object.entries(subscaleScores).forEach(([subscaleId, subscaleData]) => {
      // Find the subscale definition
      const subscaleDefinition = template.scoring.subscales?.find(
        sub => sub.id === subscaleId
      );

      if (!subscaleDefinition) return;

      // Calculate subscale interpretation
      const subscaleInterpretation = {
        name: subscaleData.name,
        score: subscaleData.score,
        scoreRange: subscaleData.scoreRange,
        
        // Basic severity assessment based on percentage of maximum
        severity: this.calculateSubscaleSeverity(
          subscaleData.score, 
          subscaleData.scoreRange
        ),
        
        // Completion and quality
        completionPercentage: subscaleData.completionPercentage,
        reliability: subscaleData.completionPercentage >= 80 ? 'reliable' : 'limited',
        
        // Clinical significance
        clinicalSignificance: this.assessSubscaleClinicalSignificance(
          subscaleData.score,
          subscaleData.scoreRange,
          subscaleDefinition
        )
      };

      interpretations[subscaleId] = subscaleInterpretation;
    });

    return interpretations;
  }

  /**
   * Calculate severity for a subscale based on score percentage
   */
  calculateSubscaleSeverity(score, scoreRange) {
    if (!scoreRange || !scoreRange.max) return 'unknown';

    const percentage = (score / scoreRange.max) * 100;

    if (percentage <= 25) return 'minimal';
    if (percentage <= 50) return 'mild';
    if (percentage <= 75) return 'moderate';
    return 'severe';
  }

  /**
   * Assess clinical significance of subscale scores
   */
  assessSubscaleClinicalSignificance(score, scoreRange, subscaleDefinition) {
    const percentage = (score / scoreRange.max) * 100;
    
    if (percentage >= 75) {
      return `Puntuación elevada en ${subscaleDefinition.name} que sugiere sintomatología clínicamente significativa en esta dimensión.`;
    } else if (percentage >= 50) {
      return `Puntuación moderada en ${subscaleDefinition.name} que indica presencia de síntomas que requieren atención clínica.`;
    } else if (percentage >= 25) {
      return `Puntuación leve en ${subscaleDefinition.name} que sugiere síntomas mínimos o subclínicos.`;
    } else {
      return `Puntuación dentro de rangos normales para ${subscaleDefinition.name}.`;
    }
  }

  /**
   * Get applicable clinical guidelines for the interpretation
   */
  getApplicableGuidelines(template, interpretationRule) {
    const guidelines = template.interpretation?.clinicalGuidelines || {};
    
    return {
      contraindications: guidelines.contraindications || [],
      specialConsiderations: guidelines.specialConsiderations || [],
      applicableWarnings: guidelines.warningFlags?.filter(flag => 
        this.checkFlagCondition(flag.condition, interpretationRule)
      ) || []
    };
  }

  /**
   * Check if warning flags should be triggered
   */
  checkWarningFlags(template, totalScore, subscaleScores) {
    const warnings = [];
    const warningFlags = template.interpretation?.clinicalGuidelines?.warningFlags || [];

    warningFlags.forEach(flag => {
      if (this.evaluateWarningCondition(flag.condition, totalScore, subscaleScores)) {
        warnings.push({
          type: flag.type || 'warning',
          message: flag.message,
          condition: flag.condition,
          severity: flag.severity || 'medium',
          actionRequired: flag.actionRequired || false
        });
      }
    });

    return warnings;
  }

  /**
   * Evaluate warning flag conditions
   */
  evaluateWarningCondition(condition, totalScore, subscaleScores) {
    // Simple condition evaluation - can be extended for complex conditions
    try {
      // Replace placeholders with actual values
      let evaluationString = condition
        .replace(/totalScore/g, totalScore)
        .replace(/score/g, totalScore);

      // Add subscale score replacements
      Object.entries(subscaleScores).forEach(([subscaleId, data]) => {
        const regex = new RegExp(`${subscaleId}Score`, 'g');
        evaluationString = evaluationString.replace(regex, data.score);
      });

      // Safely evaluate the condition (in production, use a safer evaluation method)
      return eval(evaluationString);
    } catch (error) {
      logger.warn('Error evaluating warning condition', {
        condition: condition,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Calculate confidence in the interpretation
   */
  calculateInterpretationConfidence(template, score, rule) {
    // Base confidence on how well the score fits within the rule range
    const rangeSize = rule.maxScore - rule.minScore;
    const scorePosition = score - rule.minScore;
    const centerDistance = Math.abs(scorePosition - (rangeSize / 2));
    
    // Higher confidence when score is near the center of the range
    const positionConfidence = 1 - (centerDistance / (rangeSize / 2));
    
    // Additional factors that could affect confidence
    const factors = {
      positionConfidence: positionConfidence,
      ruleSpecificity: rangeSize <= 5 ? 1.0 : rangeSize <= 10 ? 0.8 : 0.6,
      templateMaturity: template.metadata.version >= '2.0' ? 1.0 : 0.8
    };

    // Calculate weighted confidence
    const confidence = (
      factors.positionConfidence * 0.5 +
      factors.ruleSpecificity * 0.3 +
      factors.templateMaturity * 0.2
    );

    return {
      score: Math.round(confidence * 100),
      level: confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low',
      factors: factors
    };
  }

  /**
   * Generate contextual recommendations based on interpretation
   */
  generateContextualRecommendations(template, interpretation) {
    const recommendations = {
      immediate: [],
      followUp: [],
      preventive: []
    };

    // Add severity-based recommendations
    switch (interpretation.severity) {
      case 'very_severe':
      case 'severe':
        recommendations.immediate.push(
          'Considerar evaluación inmediata del riesgo de crisis',
          'Iniciar intervención terapéutica intensiva sin dilación'
        );
        recommendations.followUp.push('Seguimiento semanal durante el primer mes');
        break;

      case 'moderate':
        recommendations.immediate.push('Iniciar intervención terapéutica activa');
        recommendations.followUp.push('Seguimiento quincenal las primeras 6 semanas');
        break;

      case 'mild':
        recommendations.immediate.push('Considerar intervención preventiva');
        recommendations.followUp.push('Seguimiento mensual por 3 meses');
        break;

      case 'minimal':
        recommendations.preventive.push('Psicoeducación y estrategias de autocuidado');
        recommendations.followUp.push('Seguimiento trimestral');
        break;
    }

    // Add template-specific recommendations
    const templateType = template.metadata.category.toLowerCase();
    this.addTemplateSpecificRecommendations(templateType, interpretation, recommendations);

    return recommendations;
  }

  /**
   * Add template-specific recommendations based on scale type
   */
  addTemplateSpecificRecommendations(templateType, interpretation, recommendations) {
    switch (templateType) {
      case 'ansiedad':
      case 'anxiety':
        if (interpretation.severity === 'severe') {
          recommendations.immediate.push('Evaluar necesidad de ansiolíticos de acción rápida');
        }
        recommendations.preventive.push('Técnicas de relajación y manejo de estrés');
        break;

      case 'depresión':
      case 'depression':
        if (interpretation.severity === 'severe') {
          recommendations.immediate.push('Evaluación de riesgo suicida mandatoria');
        }
        recommendations.followUp.push('Monitoreo de efectos secundarios si se inicia farmacoterapia');
        break;

      case 'psicosis':
      case 'psychosis':
        recommendations.immediate.push('Evaluación psiquiátrica especializada');
        recommendations.followUp.push('Adherencia terapéutica y monitoreo de efectos adversos');
        break;
    }
  }

  /**
   * Check if a flag condition applies
   */
  checkFlagCondition(condition, interpretationRule) {
    // Simple implementation - can be enhanced
    return interpretationRule.severity === 'severe' || interpretationRule.severity === 'very_severe';
  }

  /**
   * Create default interpretation when no rule matches
   */
  createDefaultInterpretation(score, template) {
    return {
      score: score,
      severity: 'unknown',
      label: 'Puntuación fuera de rango',
      color: '#6b7280',
      clinicalInterpretation: 'La puntuación obtenida está fuera de los rangos de interpretación definidos para esta escala.',
      clinicalSignificance: 'Se requiere revisión manual de la puntuación y las respuestas.',
      differentialConsiderations: 'Verificar la correcta aplicación y puntuación de la escala.',
      professionalRecommendations: {
        immediate: 'Revisar respuestas y recalcular puntuación',
        treatment: 'Consultar manual de la escala para interpretación',
        monitoring: 'Reaplicar escala si es necesario'
      },
      prognosticImplications: 'No se puede determinar pronóstico con puntuación fuera de rango.',
      interpretationConfidence: { score: 0, level: 'none' },
      warningFlags: [{
        type: 'error',
        message: 'Puntuación fuera de rango válido',
        severity: 'high'
      }]
    };
  }

  /**
   * Create error interpretation
   */
  createErrorInterpretation(error, score) {
    return {
      score: score,
      severity: 'error',
      label: 'Error en interpretación',
      color: '#ef4444',
      clinicalInterpretation: 'Se produjo un error al interpretar la puntuación.',
      clinicalSignificance: 'No se puede determinar significancia clínica debido a error en el procesamiento.',
      error: error.message,
      professionalRecommendations: {
        immediate: 'Contactar soporte técnico',
        treatment: 'Usar interpretación manual temporalmente'
      },
      interpretationConfidence: { score: 0, level: 'none' }
    };
  }

  /**
   * Clear interpretation cache
   */
  clearCache() {
    this.interpretationCache.clear();
    logger.info('Interpretation cache cleared');
  }
}

module.exports = InterpretationEngine;