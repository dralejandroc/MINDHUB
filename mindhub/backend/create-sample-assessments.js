/**
 * Script para crear evaluaciones BDI-21 de ejemplo mostrando progreso temporal
 * Simula un tratamiento exitoso con mejoría gradual
 */

const { PrismaClient } = require('./generated/prisma');

async function createSampleAssessments() {
  const prisma = new PrismaClient();
  
  try {
    const patientId = 'PRJ19900514-2507';
    const scaleId = 'bdi-21';
    
    // Obtener el usuario de sistema
    const systemUser = await prisma.user.findUnique({
      where: { auth0Id: 'system' }
    });
    
    if (!systemUser) {
      throw new Error('Usuario de sistema no encontrado');
    }

    // Obtener información de la escala BDI-21
    const scale = await prisma.scale.findUnique({
      where: { id: scaleId },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' }
        },
        subscales: true,
        interpretationRules: {
          orderBy: { minScore: 'asc' }
        }
      }
    });

    if (!scale) {
      throw new Error('Escala BDI-21 no encontrada');
    }

    console.log(`📊 Escala encontrada: ${scale.name} con ${scale.items.length} items`);
    console.log(`📋 Subescalas: ${scale.subscales.length}`);

    // Fechas de evaluación (hacia atrás desde hoy)
    const now = new Date();
    const evaluationDates = [
      new Date(now.getTime() - (12 * 7 * 24 * 60 * 60 * 1000)), // 12 semanas atrás
      new Date(now.getTime() - (6 * 7 * 24 * 60 * 60 * 1000)),  // 6 semanas atrás  
      new Date(now.getTime() - (4 * 7 * 24 * 60 * 60 * 1000)),  // 4 semanas atrás
      new Date(now.getTime() - (2 * 7 * 24 * 60 * 60 * 1000)),  // 2 semanas atrás
    ];

    // Puntajes simulados mostrando mejoría gradual (BDI-21 de 0-63 puntos)
    const simulatedScores = [
      {
        week: 12,
        totalScore: 35, // Depresión severa
        severity: 'severe',
        interpretation: 'Depresión severa',
        notes: 'Evaluación inicial - Inicio de tratamiento. Paciente presenta síntomas severos de depresión.',
        responses: generateBDIResponses(35, scale.items) // Genera respuestas que sumen ~35
      },
      {
        week: 6,
        totalScore: 22, // Depresión moderada
        severity: 'moderate', 
        interpretation: 'Depresión moderada',
        notes: 'Evaluación a las 6 semanas - Mejoría notable con el tratamiento farmacológico y psicoterapia.',
        responses: generateBDIResponses(22, scale.items) // Genera respuestas que sumen ~22
      },
      {
        week: 4,
        totalScore: 16, // Depresión leve
        severity: 'mild',
        interpretation: 'Depresión leve',
        notes: 'Evaluación a las 4 semanas - Continúa la mejoría. Paciente reporta mejor estado de ánimo.',
        responses: generateBDIResponses(16, scale.items) // Genera respuestas que sumen ~16
      },
      {
        week: 2,
        totalScore: 8, // Depresión mínima
        severity: 'minimal',
        interpretation: 'Depresión mínima',
        notes: 'Evaluación reciente - Síntomas casi remitidos. Mantener tratamiento actual.',
        responses: generateBDIResponses(8, scale.items) // Genera respuestas que sumen ~8
      }
    ];

    console.log('\n🚀 Creando evaluaciones BDI-21 simuladas...\n');

    for (let i = 0; i < simulatedScores.length; i++) {
      const scoreData = simulatedScores[i];
      const evaluationDate = evaluationDates[i];
      
      console.log(`📅 Semana ${scoreData.week}: Puntaje ${scoreData.totalScore} (${scoreData.severity})`);

      // Crear la administración
      const administration = await prisma.scaleAdministration.create({
        data: {
          patientId,
          scaleId,
          administratorId: systemUser.id,
          administrationDate: evaluationDate,
          administrationType: 'clinician_administered',
          status: 'completed',
          totalScore: scoreData.totalScore,
          rawScore: scoreData.totalScore,
          percentileScore: Math.round((scoreData.totalScore / 63) * 100 * 100) / 100,
          severity: scoreData.severity,
          interpretation: scoreData.interpretation,
          notes: scoreData.notes,
          startedAt: new Date(evaluationDate.getTime() - (30 * 60 * 1000)), // 30 min antes
          completedAt: evaluationDate,
          createdAt: evaluationDate,
          updatedAt: evaluationDate
        }
      });

      // Crear las respuestas individuales
      for (const responseData of scoreData.responses) {
        await prisma.itemResponse.create({
          data: {
            administrationId: administration.id,
            scaleItemId: responseData.itemId,
            responseValue: responseData.value.toString(),
            responseText: responseData.text,
            score: responseData.score,
            wasSkipped: false,
            responseTime: Math.floor(Math.random() * 30000) + 5000, // 5-35 segundos
            createdAt: evaluationDate
          }
        });
      }

      // Calcular y crear puntajes de subescalas
      const subscaleScores = calculateSubscaleScores(scoreData.responses, scale.subscales);
      
      for (const subscaleScore of subscaleScores) {
        const subscale = scale.subscales.find(s => s.id === subscaleScore.subscaleId);
        if (subscale) {
          await prisma.scaleSubscaleScore.create({
            data: {
              administrationId: administration.id,
              subscaleId: subscale.id,
              subscaleName: subscale.subscaleName,
              score: subscaleScore.score,
              rawScore: subscaleScore.score,
              percentileScore: Math.round((subscaleScore.score / subscaleScore.maxScore) * 100 * 100) / 100,
              interpretation: `Puntaje: ${subscaleScore.score}/${subscaleScore.maxScore}`,
              severity: subscaleScore.score > (subscaleScore.maxScore * 0.7) ? 'Alto' : 
                       subscaleScore.score > (subscaleScore.maxScore * 0.3) ? 'Normal' : 'Bajo',
              createdAt: evaluationDate,
              updatedAt: evaluationDate
            }
          });
        }
      }

      console.log(`   ✅ Administración creada: ${administration.id}`);
      console.log(`   📊 Subescalas calculadas: ${subscaleScores.length}`);
    }

    console.log('\n🎯 ¡Evaluaciones simuladas creadas exitosamente!');
    console.log(`📈 Progreso simulado: 35 → 22 → 16 → 8 puntos (mejoría significativa)`);
    console.log(`📅 Periodo: ${evaluationDates[0].toLocaleDateString()} a ${evaluationDates[evaluationDates.length-1].toLocaleDateString()}`);

    // Mostrar resumen final
    const totalAssessments = await prisma.scaleAdministration.count({
      where: { patientId, scaleId }
    });
    
    console.log(`\n📋 Total de evaluaciones BDI-21 para Juan: ${totalAssessments}`);

  } catch (error) {
    console.error('❌ Error creando evaluaciones simuladas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Genera respuestas BDI-21 que resulten en un puntaje específico
 */
function generateBDIResponses(targetScore, items) {
  const responses = [];
  let currentScore = 0;
  const remainingItems = [...items];
  
  // Distribución de respuestas para lograr el puntaje objetivo
  while (currentScore < targetScore && remainingItems.length > 0) {
    const item = remainingItems.shift();
    
    // Calcular qué puntaje asignar a este item
    const remainingScore = targetScore - currentScore;
    const remainingItemsCount = remainingItems.length + 1;
    
    // Puntaje promedio necesario por item restante
    const avgNeeded = remainingScore / remainingItemsCount;
    
    // Seleccionar un puntaje (0-3 para BDI-21)
    let score;
    if (avgNeeded >= 2.5) score = 3;
    else if (avgNeeded >= 1.5) score = 2;
    else if (avgNeeded >= 0.5) score = 1;
    else score = 0;
    
    // Ajustar si nos pasamos
    if (currentScore + score > targetScore) {
      score = Math.max(0, targetScore - currentScore);
    }
    
    const responseTexts = [
      ['No me siento triste', 'Me siento triste gran parte del tiempo', 'Estoy triste siempre', 'Estoy tan triste o soy tan infeliz que no puedo soportarlo'],
      ['No estoy desalentado respecto del futuro', 'Me siento más desalentado respecto del futuro que lo que solía estar', 'No espero que las cosas funcionen para mí', 'Siento que no hay esperanza para mi futuro y que sólo puede empeorar'],
      ['No me siento como un fracasado', 'He fracasado más de lo que hubiera debido', 'Cuando miro hacia atrás, veo muchos fracasos', 'Siento que como persona soy un fracaso total']
    ];
    
    const textIndex = Math.min(item.itemNumber - 1, responseTexts.length - 1);
    const text = responseTexts[textIndex] ? responseTexts[textIndex][score] : `Respuesta nivel ${score}`;
    
    responses.push({
      itemId: item.id,
      value: score,
      text: text,
      score: score
    });
    
    currentScore += score;
  }
  
  // Completar items restantes con puntaje 0
  while (remainingItems.length > 0) {
    const item = remainingItems.shift();
    responses.push({
      itemId: item.id,
      value: 0,
      text: 'No aplica / Mínimo',
      score: 0
    });
  }
  
  return responses;
}

/**
 * Calcula puntajes de subescalas basado en las respuestas
 */
function calculateSubscaleScores(responses, subscales) {
  const subscaleScores = [];
  
  for (const subscale of subscales) {
    try {
      const subscaleItems = Array.isArray(subscale.items) 
        ? subscale.items 
        : JSON.parse(subscale.items || '[]');
      
      if (subscaleItems.length === 0) continue;
      
      // Filtrar respuestas que pertenecen a esta subescala
      const subscaleResponses = responses.filter(response => {
        // Extraer número de item del ID (ej: "bdi-21-item-1" -> 1)
        const itemNumber = parseInt(response.itemId.split('-').pop());
        return subscaleItems.includes(itemNumber);
      });
      
      if (subscaleResponses.length === 0) continue;
      
      const score = subscaleResponses.reduce((sum, response) => sum + response.score, 0);
      const maxScore = subscaleItems.length * 3; // BDI-21 tiene puntaje máximo 3 por item
      
      subscaleScores.push({
        subscaleId: subscale.id,
        score,
        maxScore
      });
      
    } catch (error) {
      console.warn(`⚠️ Error calculando subescala ${subscale.subscaleName}:`, error);
    }
  }
  
  return subscaleScores;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createSampleAssessments();
}

module.exports = { createSampleAssessments };