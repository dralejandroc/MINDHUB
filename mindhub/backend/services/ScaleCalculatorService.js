/**
 * SERVICIO DE CÁLCULO UNIVERSAL PARA ESCALAS
 * Maneja cálculos de puntuación e interpretación para cualquier escala
 */

class ScaleCalculatorService {

  /**
   * Calcula puntuaciones totales y de subescalas
   */
  calculateScores(scale, responses) {
    try {
      const results = {
        totalScore: 0,
        subscaleScores: {},
        validResponses: 0,
        skippedItems: []
      };

      // Mapear respuestas por número de item
      const responseMap = new Map();
      responses.forEach(response => {
        responseMap.set(response.itemNumber, response);
      });

      // Calcular puntuación total
      scale.items.forEach(item => {
        const response = responseMap.get(item.number);
        
        if (response) {
          let score = response.scoreValue || response.score;
          
          // Aplicar puntuación inversa si es necesario
          if (item.reverseScored) {
            const maxScore = Math.max(...scale.responseOptions.map(opt => opt.score));
            const minScore = Math.min(...scale.responseOptions.map(opt => opt.score));
            score = maxScore + minScore - score;
          }
          
          results.totalScore += score;
          results.validResponses++;

          // Acumular puntuación por subescala
          if (item.subscale) {
            if (!results.subscaleScores[item.subscale]) {
              results.subscaleScores[item.subscale] = {
                name: item.subscale,
                score: 0,
                itemCount: 0
              };
            }
            results.subscaleScores[item.subscale].score += score;
            results.subscaleScores[item.subscale].itemCount++;
          }
        } else {
          results.skippedItems.push(item.itemNumber);
        }
      });

      // Calcular promedios de subescalas si es necesario
      Object.keys(results.subscaleScores).forEach(subscaleKey => {
        const subscale = results.subscaleScores[subscaleKey];
        subscale.average = subscale.score / subscale.itemCount;
      });

      return results;

    } catch (error) {
      console.error('Error calculando puntuaciones:', error);
      throw error;
    }
  }

  /**
   * Interpreta una puntuación basada en las reglas de la escala
   */
  interpretScore(scale, totalScore) {
    try {
      // Buscar la regla de interpretación apropiada
      const rule = scale.interpretationRules.find(rule => 
        totalScore >= rule.minScore && totalScore <= rule.maxScore
      );

      if (!rule) {
        return {
          severity: 'unknown',
          label: 'No determinado',
          description: `Puntuación ${totalScore} fuera de rangos establecidos`,
          recommendations: []
        };
      }

      return {
        severity: rule.severity,
        label: rule.label,
        description: rule.description || `Puntuación: ${totalScore}`,
        recommendations: rule.recommendations || [],
        colorCode: rule.color
      };

    } catch (error) {
      console.error('Error interpretando puntuación:', error);
      throw error;
    }
  }

  /**
   * Detecta alertas basadas en respuestas específicas
   */
  detectAlerts(scale, responses) {
    try {
      const criticalAlerts = [];
      const highScoreItems = [];
      const processedItems = new Set();

      // Procesar respuestas buscando items críticos y puntuaciones máximas
      responses.forEach(response => {
        if (processedItems.has(response.itemNumber)) {
          return;
        }
        processedItems.add(response.itemNumber);

        const item = scale.items.find(item => item.number === response.itemNumber);
        if (!item) return;

        // Detectar items críticos (ideación suicida, autolesión)
        if (this.isCriticalItem(scale, response)) {
          criticalAlerts.push({
            itemNumber: response.itemNumber,
            message: this.getCriticalItemMessage(item, response),
            severity: 'critical',
            type: 'critical_item',
            itemText: item.text
          });
        } 
        // Detectar puntuaciones máximas no críticas
        else if (this.isMaxScoreResponse(scale, response)) {
          highScoreItems.push({
            itemNumber: response.itemNumber,
            itemText: item.text,
            score: response.scoreValue || response.score
          });
        }
      });

      const alerts = [...criticalAlerts];

      // Agregar alerta grupal para puntuaciones máximas si hay varias
      if (highScoreItems.length > 0) {
        if (highScoreItems.length >= 3) {
          // Crear mensaje detallado con lista de ítems
          const itemsList = highScoreItems.map(item => 
            `Ítem ${item.itemNumber}: ${this.getSpecificHighScoreMessage(item.itemText, item.score, scale)}`
          ).join('\n');
          
          alerts.push({
            itemNumber: null,
            message: `⚠️ Síntomas Prominentes Detectados`,
            severity: 'medium',
            type: 'grouped_high_scores',
            affectedItems: highScoreItems.map(item => item.itemNumber),
            detailedMessage: `Se detectaron ${highScoreItems.length} ítems con puntuación máxima que requieren atención clínica específica:\n\n${itemsList}\n\nEstos síntomas prominentes sugieren áreas de preocupación significativa que deben ser evaluadas en profundidad durante la consulta clínica.`,
            itemsDetails: highScoreItems.map(item => ({
              itemNumber: item.itemNumber,
              description: this.getSpecificHighScoreMessage(item.itemText, item.score, scale),
              originalText: item.itemText,
              score: item.score
            }))
          });
        } else {
          // Mostrar individualmente si son pocas
          highScoreItems.forEach(item => {
            alerts.push({
              itemNumber: item.itemNumber,
              message: this.getSpecificHighScoreMessage(item.itemText, item.score, scale),
              severity: 'medium',
              type: 'high_score'
            });
          });
        }
      }

      return alerts;

    } catch (error) {
      console.error('Error detectando alertas:', error);
      return [];
    }
  }

  /**
   * Determina si una respuesta tiene puntuación máxima
   */
  isMaxScoreResponse(scale, response) {
    const maxScore = Math.max(...scale.responseOptions.map(opt => opt.score));
    return (response.scoreValue || response.score) === maxScore;
  }

  /**
   * Determina si una respuesta es de alto riesgo (obsoleto - usar isMaxScoreResponse)
   */
  isHighRiskResponse(scale, response) {
    return this.isMaxScoreResponse(scale, response);
  }

  /**
   * Determina si un item es crítico (ej: ideación suicida)
   */
  isCriticalItem(scale, response) {
    // Buscar palabras clave en el texto del item
    const item = scale.items.find(item => item.number === response.itemNumber);
    if (!item) return false;

    const criticalKeywords = [
      'suicid', 'muerte', 'morir', 'vida', 'lastimar', 'daño',
      'autolesión', 'cortarse', 'acabar', 'terminar'
    ];

    const itemText = item.text.toLowerCase();
    const hasCriticalKeyword = criticalKeywords.some(keyword => 
      itemText.includes(keyword)
    );

    // Si contiene palabra clave crítica y la respuesta no es "nunca" o el mínimo
    const minScore = Math.min(...scale.responseOptions.map(opt => opt.score));
    return hasCriticalKeyword && (response.scoreValue || response.score) > minScore;
  }

  /**
   * Genera mensaje específico para item crítico
   */
  getCriticalItemMessage(item, response) {
    if (!item) return 'Item crítico requiere atención inmediata';

    const itemText = item.text.toLowerCase();
    
    if (itemText.includes('suicid') || itemText.includes('muerte') || itemText.includes('morir')) {
      return `CRÍTICO: Ideación suicida reportada - requiere evaluación de riesgo inmediata`;
    }
    if (itemText.includes('lastimar') || itemText.includes('daño') || itemText.includes('hacerme daño')) {
      return `CRÍTICO: Ideación de autolesión - evaluación urgente requerida`;
    }
    if (itemText.includes('vida') && (itemText.includes('vale') || itemText.includes('valor'))) {
      return `CRÍTICO: Cuestionamiento del valor de la vida - evaluación inmediata`;
    }
    if (itemText.includes('herirse') || itemText.includes('cortarse')) {
      return `CRÍTICO: Conductas autolesivas reportadas - intervención requerida`;
    }
    
    return `ALTO RIESGO: Ítem ${item.number} indica síntomas significativos`;
  }

  /**
   * Genera mensaje específico para puntuación alta (mejorado)
   */
  getSpecificHighScoreMessage(itemText, score, scale) {
    const scaleName = scale.abbreviation || scale.name;
    
    // Mensajes más específicos según el contenido del ítem
    if (itemText.toLowerCase().includes('ánimo') || itemText.toLowerCase().includes('humor')) {
      return `Alteración significativa del estado de ánimo (puntuación ${score})`;
    }
    if (itemText.toLowerCase().includes('sueño') || itemText.toLowerCase().includes('dormir')) {
      return `Trastorno severo del sueño reportado (puntuación ${score})`;
    }
    if (itemText.toLowerCase().includes('concentra') || itemText.toLowerCase().includes('atenció')) {
      return `Dificultades graves de concentración (puntuación ${score})`;
    }
    if (itemText.toLowerCase().includes('energía') || itemText.toLowerCase().includes('fatiga')) {
      return `Pérdida severa de energía/fatiga extrema (puntuación ${score})`;
    }
    if (itemText.toLowerCase().includes('interés') || itemText.toLowerCase().includes('actividad')) {
      return `Pérdida significativa de interés en actividades (puntuación ${score})`;
    }
    if (itemText.toLowerCase().includes('ansiedad') || itemText.toLowerCase().includes('nervios')) {
      return `Niveles severos de ansiedad reportados (puntuación ${score})`;
    }
    if (itemText.toLowerCase().includes('preocup') || itemText.toLowerCase().includes('inquiet')) {
      return `Preocupación excesiva persistente (puntuación ${score})`;
    }
    
    // Mensaje genérico para otros casos
    return `Síntoma severo detectado: puntuación máxima (${score}) en ${scaleName}`;
  }

  /**
   * Genera mensaje específico para puntuación alta (versión simple - obsoleta)
   */
  getHighScoreMessage(item, response) {
    if (!item) return 'Puntuación máxima detectada';
    return `"${item.text}" - puntuación máxima (${response.scoreValue || response.score})`;
  }

  /**
   * Genera mensaje de alerta apropiado (obsoleto)
   */
  getAlertMessage(scale, response) {
    const item = scale.items.find(item => item.number === response.itemNumber);
    if (!item) return 'Respuesta de alto riesgo detectada';

    if (this.isCriticalItem(scale, response)) {
      return this.getCriticalItemMessage(item, response);
    }

    return this.getHighScoreMessage(item, response);
  }

  /**
   * Determina la severidad de la alerta
   */
  getAlertSeverity(scale, response) {
    if (this.isCriticalItem(scale, response)) {
      return 'critical';
    }

    const maxScore = Math.max(...scale.responseOptions.map(opt => opt.score));
    const ratio = (response.scoreValue || response.score) / maxScore;

    if (ratio >= 0.9) return 'high';
    if (ratio >= 0.75) return 'medium';
    return 'low';
  }

  /**
   * Calcula percentiles basados en datos normativos (si están disponibles)
   */
  calculatePercentile(scale, totalScore, normativeData = null) {
    try {
      if (!normativeData) {
        return null; // Sin datos normativos disponibles
      }

      // Implementar cálculo de percentil
      const scoresBelow = normativeData.filter(score => score < totalScore).length;
      const percentile = (scoresBelow / normativeData.length) * 100;

      return Math.round(percentile);

    } catch (error) {
      console.error('Error calculando percentil:', error);
      return null;
    }
  }

  /**
   * Verifica la consistencia de respuestas
   */
  checkResponseConsistency(scale, responses) {
    try {
      const consistencyChecks = {
        isConsistent: true,
        warnings: [],
        score: 100
      };

      // Verificar patrones de respuesta inusuales
      const scores = responses.map(r => r.scoreValue || r.score);
      
      // Detectar respuesta en patrón (todas iguales)
      const uniqueScores = [...new Set(scores)];
      if (uniqueScores.length === 1 && responses.length > 5) {
        consistencyChecks.warnings.push('Patrón de respuesta uniforme detectado');
        consistencyChecks.score -= 20;
      }

      // Detectar respuestas extremas predominantes
      const maxScore = Math.max(...scale.responseOptions.map(opt => opt.score));
      const minScore = Math.min(...scale.responseOptions.map(opt => opt.score));
      
      const extremeResponses = scores.filter(score => 
        score === maxScore || score === minScore
      ).length;
      
      const extremeRatio = extremeResponses / scores.length;
      if (extremeRatio > 0.8) {
        consistencyChecks.warnings.push('Alto porcentaje de respuestas extremas');
        consistencyChecks.score -= 15;
      }

      // Verificar tiempo de respuesta si está disponible
      // (Esta lógica se implementaría si se captura tiempo por item)

      consistencyChecks.isConsistent = consistencyChecks.score >= 70;
      
      return consistencyChecks;

    } catch (error) {
      console.error('Error verificando consistencia de respuestas:', error);
      return { isConsistent: true, warnings: [], score: 100 };
    }
  }

  /**
   * Genera reporte completo de evaluación
   */
  generateAssessmentReport(scale, responses) {
    try {
      const scores = this.calculateScores(scale, responses);
      const interpretation = this.interpretScore(scale, scores.totalScore);
      const alerts = this.detectAlerts(scale, responses);
      const consistency = this.checkResponseConsistency(scale, responses);

      return {
        scale: {
          id: scale.id,
          name: scale.name,
          abbreviation: scale.abbreviation
        },
        scores: scores,
        interpretation: interpretation,
        alerts: alerts,
        consistency: consistency,
        completionPercentage: (scores.validResponses / scale.totalItems) * 100,
        reportGeneratedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generando reporte de evaluación:', error);
      throw error;
    }
  }

  /**
   * Convierte puntuación bruta a puntuación estándar (T-score, z-score, etc.)
   */
  convertToStandardScore(rawScore, normativeData, scoreType = 'tscore') {
    try {
      if (!normativeData || !normativeData.mean || !normativeData.standardDeviation) {
        return null;
      }

      const zScore = (rawScore - normativeData.mean) / normativeData.standardDeviation;

      switch (scoreType) {
        case 'zscore':
          return Math.round(zScore * 100) / 100;
        case 'tscore':
          return Math.round((zScore * 10 + 50) * 100) / 100;
        case 'iqscore':
          return Math.round((zScore * 15 + 100) * 100) / 100;
        default:
          return zScore;
      }

    } catch (error) {
      console.error('Error convirtiendo a puntuación estándar:', error);
      return null;
    }
  }
}

module.exports = ScaleCalculatorService;