/**
 * Assessment Scoring Service
 * 
 * Servicio especializado para el cálculo automático de puntajes de escalas clínicas
 * Implementa lógica de scoring universal para diferentes tipos de escalas
 */

const { PrismaClient } = require('../../generated/prisma');

class AssessmentScoringService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Calcula y guarda automáticamente los puntajes de una evaluación completa
   * @param {string} administrationId - ID de la administración de la escala
   * @param {Object[]} responses - Array de respuestas del paciente
   * @param {string} patientId - ID del paciente
   * @param {string} scaleId - ID de la escala
   * @param {string} administratorId - ID del administrador
   * @returns {Promise<Object>} - Resultado completo con puntajes calculados
   */
  async processAndSaveAssessment(administrationId, responses, patientId, scaleId, administratorId) {
    try {
      console.log(`🔄 Procesando evaluación ${administrationId} para escala ${scaleId}`);

      // 1. Obtener información completa de la escala
      const scale = await this.getScaleWithDetails(scaleId);
      if (!scale) {
        throw new Error(`Escala ${scaleId} no encontrada`);
      }

      // 2. Validar respuestas
      const validatedResponses = await this.validateResponses(responses, scale);

      // 3. Calcular puntaje total
      const totalScore = await this.calculateTotalScore(validatedResponses, scale);

      // 4. Calcular puntajes de subescalas
      const subscaleScores = await this.calculateSubscaleScores(validatedResponses, scale);

      // 5. Obtener interpretación y severidad
      const interpretation = await this.getInterpretation(totalScore, scale);

      // 6. Guardar todos los resultados en la base de datos
      const savedAssessment = await this.saveAssessmentResults({
        administrationId,
        totalScore,
        subscaleScores,
        interpretation,
        responses: validatedResponses,
        completedAt: new Date()
      });

      console.log(`✅ Evaluación ${administrationId} procesada y guardada exitosamente`);
      console.log(`📊 Puntaje total: ${totalScore.raw} (${interpretation.severity})`);
      console.log(`📋 Subescalas calculadas: ${subscaleScores.length}`);

      return {
        success: true,
        administrationId,
        totalScore,
        subscaleScores,
        interpretation,
        scale: {
          id: scale.id,
          name: scale.name,
          abbreviation: scale.abbreviation
        },
        completedAt: savedAssessment.completedAt
      };

    } catch (error) {
      console.error(`❌ Error procesando evaluación ${administrationId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la escala con todos sus detalles necesarios para el scoring
   */
  async getScaleWithDetails(scaleId) {
    return await this.prisma.scale.findUnique({
      where: { id: scaleId },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
          include: {
            scale_item_specific_options: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        },
        responseOptions: {
          orderBy: { displayOrder: 'asc' }
        },
        subscales: {
          orderBy: { id: 'asc' }
        },
        interpretationRules: {
          orderBy: { minScore: 'asc' }
        }
      }
    });
  }

  /**
   * Valida las respuestas contra la estructura de la escala
   */
  async validateResponses(responses, scale) {
    const validatedResponses = [];
    
    for (const response of responses) {
      const item = scale.items.find(i => i.id === response.itemId);
      if (!item) {
        console.warn(`⚠️ Item ${response.itemId} no encontrado en escala ${scale.id}`);
        continue;
      }

      // Obtener el puntaje numérico de la respuesta
      let score = null;
      
      // Si el item tiene opciones específicas, buscar ahí
      if (item.scale_item_specific_options && item.scale_item_specific_options.length > 0) {
        const option = item.scale_item_specific_options.find(opt => opt.optionValue === response.value);
        score = option ? option.scoreValue : null;
      } 
      // Si no, usar las opciones globales de la escala
      else if (scale.responseOptions && scale.responseOptions.length > 0) {
        const option = scale.responseOptions.find(opt => opt.optionValue === response.value);
        score = option ? option.scoreValue : null;
      }

      // Aplicar reverse scoring si es necesario
      if (item.reverseScored && score !== null) {
        // Determinar el puntaje máximo para reverse scoring
        const maxScore = item.scale_item_specific_options.length > 0 
          ? Math.max(...item.scale_item_specific_options.map(opt => opt.scoreValue))
          : Math.max(...scale.responseOptions.map(opt => opt.scoreValue));
        
        score = maxScore - score;
        console.log(`🔄 Reverse scoring aplicado al item ${item.itemNumber}: ${response.value} -> ${score}`);
      }

      validatedResponses.push({
        ...response,
        itemNumber: item.itemNumber,
        score,
        itemId: item.id,
        reverseScored: item.reverseScored || false
      });
    }

    return validatedResponses;
  }

  /**
   * Calcula el puntaje total de la escala
   */
  async calculateTotalScore(responses, scale) {
    const validScores = responses.filter(r => r.score !== null).map(r => r.score);
    
    if (validScores.length === 0) {
      throw new Error('No se encontraron respuestas válidas para calcular puntaje');
    }

    const rawScore = validScores.reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = scale.scoreRangeMax || (scale.totalItems * Math.max(...scale.responseOptions.map(opt => opt.scoreValue)));
    const minPossibleScore = scale.scoreRangeMin || 0;
    
    // Calcular percentile (simplificado)
    const percentileScore = ((rawScore - minPossibleScore) / (maxPossibleScore - minPossibleScore)) * 100;

    return {
      raw: rawScore,
      percentile: Math.round(percentileScore * 100) / 100,
      max: maxPossibleScore,
      min: minPossibleScore,
      validResponses: validScores.length,
      totalItems: scale.totalItems
    };
  }

  /**
   * Calcula los puntajes de todas las subescalas
   */
  async calculateSubscaleScores(responses, scale) {
    if (!scale.subscales || scale.subscales.length === 0) {
      console.log(`ℹ️ Escala ${scale.id} no tiene subescalas definidas`);
      return [];
    }

    const subscaleScores = [];

    for (const subscale of scale.subscales) {
      try {
        // Los items de la subescala están almacenados como JSON array
        const subscaleItemNumbers = Array.isArray(subscale.items) 
          ? subscale.items 
          : JSON.parse(subscale.items || '[]');

        if (subscaleItemNumbers.length === 0) {
          console.warn(`⚠️ Subescala ${subscale.subscaleName} no tiene items definidos`);
          continue;
        }

        // Filtrar respuestas que pertenecen a esta subescala
        const subscaleResponses = responses.filter(response => 
          subscaleItemNumbers.includes(response.itemNumber)
        );

        if (subscaleResponses.length === 0) {
          console.warn(`⚠️ No se encontraron respuestas para subescala ${subscale.subscaleName}`);
          continue;
        }

        // Calcular puntaje de la subescala
        const validScores = subscaleResponses.filter(r => r.score !== null).map(r => r.score);
        const rawScore = validScores.reduce((sum, score) => sum + score, 0);
        
        // Calcular percentile para la subescala
        const maxScore = subscale.maxScore || (subscaleItemNumbers.length * Math.max(...scale.responseOptions.map(opt => opt.scoreValue)));
        const minScore = subscale.minScore || 0;
        const percentileScore = ((rawScore - minScore) / (maxScore - minScore)) * 100;

        subscaleScores.push({
          subscaleId: subscale.id,
          subscaleName: subscale.subscaleName,
          rawScore,
          percentileScore: Math.round(percentileScore * 100) / 100,
          maxScore,
          minScore,
          validResponses: validScores.length,
          totalItems: subscaleItemNumbers.length
        });

        console.log(`📊 Subescala ${subscale.subscaleName}: ${rawScore}/${maxScore} (${Math.round(percentileScore)}%)`);

      } catch (error) {
        console.error(`❌ Error calculando subescala ${subscale.subscaleName}:`, error);
      }
    }

    return subscaleScores;
  }

  /**
   * Obtiene la interpretación basada en el puntaje total
   */
  async getInterpretation(totalScore, scale) {
    if (!scale.interpretationRules || scale.interpretationRules.length === 0) {
      return {
        severity: 'Normal',
        interpretation: 'Puntaje dentro de rango normal',
        description: 'No se encontraron reglas de interpretación específicas para esta escala.',
        color: '#22c55e'
      };
    }

    // Buscar la regla de interpretación que corresponde al puntaje
    const rule = scale.interpretationRules.find(rule => 
      totalScore.raw >= rule.minScore && totalScore.raw <= rule.maxScore
    );

    if (rule) {
      return {
        severity: rule.severityLevel,
        interpretation: rule.interpretationLabel,
        description: rule.description || '',
        recommendations: rule.recommendations || '',
        color: rule.colorCode || '#6b7280'
      };
    }

    // Si no se encuentra regla específica, determinar basado en percentile
    if (totalScore.percentile >= 85) {
      return { severity: 'Alto', interpretation: 'Puntaje elevado', description: 'El puntaje se encuentra en el rango superior.', color: '#ef4444' };
    } else if (totalScore.percentile >= 70) {
      return { severity: 'Moderado-Alto', interpretation: 'Puntaje moderadamente elevado', description: 'El puntaje se encuentra por encima del promedio.', color: '#f97316' };
    } else if (totalScore.percentile >= 30) {
      return { severity: 'Normal', interpretation: 'Puntaje normal', description: 'El puntaje se encuentra dentro del rango normal.', color: '#22c55e' };
    } else {
      return { severity: 'Bajo', interpretation: 'Puntaje bajo', description: 'El puntaje se encuentra por debajo del promedio.', color: '#3b82f6' };
    }
  }

  /**
   * Guarda todos los resultados en la base de datos
   */
  async saveAssessmentResults({ administrationId, totalScore, subscaleScores, interpretation, responses, completedAt }) {
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Actualizar la administración principal
      const updatedAdministration = await prisma.scaleAdministration.update({
        where: { id: administrationId },
        data: {
          status: 'completed',
          totalScore: totalScore.raw,
          rawScore: totalScore.raw,
          percentileScore: totalScore.percentile,
          severity: interpretation.severity,
          interpretation: interpretation.interpretation,
          completedAt,
          updatedAt: new Date()
        }
      });

      // 2. Guardar respuestas individuales
      for (const response of responses) {
        await prisma.itemResponse.upsert({
          where: {
            administrationId_scaleItemId: {
              administrationId,
              scaleItemId: response.itemId
            }
          },
          update: {
            responseValue: response.value,
            responseText: response.text || null,
            score: response.score,
            wasSkipped: response.skipped || false,
            responseTime: response.responseTime || null
          },
          create: {
            administrationId,
            scaleItemId: response.itemId,
            responseValue: response.value,
            responseText: response.text || null,
            score: response.score,
            wasSkipped: response.skipped || false,
            responseTime: response.responseTime || null
          }
        });
      }

      // 3. Guardar puntajes de subescalas
      for (const subscaleScore of subscaleScores) {
        await prisma.scaleSubscaleScore.upsert({
          where: {
            administrationId_subscaleId: {
              administrationId,
              subscaleId: subscaleScore.subscaleId
            }
          },
          update: {
            subscaleName: subscaleScore.subscaleName,
            score: subscaleScore.rawScore,
            rawScore: subscaleScore.rawScore,
            percentileScore: subscaleScore.percentileScore,
            interpretation: `Puntaje: ${subscaleScore.rawScore}/${subscaleScore.maxScore}`,
            severity: subscaleScore.percentileScore >= 70 ? 'Alto' : subscaleScore.percentileScore >= 30 ? 'Normal' : 'Bajo'
          },
          create: {
            administrationId,
            subscaleId: subscaleScore.subscaleId,
            subscaleName: subscaleScore.subscaleName,
            score: subscaleScore.rawScore,
            rawScore: subscaleScore.rawScore,
            percentileScore: subscaleScore.percentileScore,
            interpretation: `Puntaje: ${subscaleScore.rawScore}/${subscaleScore.maxScore}`,
            severity: subscaleScore.percentileScore >= 70 ? 'Alto' : subscaleScore.percentileScore >= 30 ? 'Normal' : 'Bajo'
          }
        });
      }

      return updatedAdministration;
    });
  }

  /**
   * Obtiene el historial temporal de una escala específica para un paciente
   */
  async getPatientScaleHistory(patientId, scaleId) {
    const administrations = await this.prisma.scaleAdministration.findMany({
      where: {
        patientId,
        scaleId,
        status: 'completed'
      },
      include: {
        subscaleScores: {
          include: {
            subscale: true
          }
        }
      },
      orderBy: {
        administrationDate: 'asc'
      }
    });

    return administrations.map(admin => ({
      id: admin.id,
      date: admin.administrationDate,
      totalScore: admin.totalScore,
      severity: admin.severity,
      interpretation: admin.interpretation,
      subscaleScores: admin.subscaleScores.map(sub => ({
        name: sub.subscaleName,
        score: sub.score,
        severity: sub.severity
      }))
    }));
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = AssessmentScoringService;