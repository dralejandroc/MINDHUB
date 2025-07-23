/**
 * Script para crear escalas de prueba usando Prisma
 */
const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function createTestScales() {
  console.log('🧪 Creando escalas de prueba...');
  
  try {
    // 1. PHQ-9 - Autoaplicada
    const phq9 = await prisma.scale.create({
      data: {
        id: 'phq9',
        name: 'Cuestionario de Salud del Paciente-9',
        abbreviation: 'PHQ-9',
        version: '1.0',
        category: 'depression',
        subcategory: 'screening',
        description: 'Cuestionario de autoevaluación para la detección y valoración de la gravedad de la depresión',
        author: 'Kroenke, Spitzer y Williams',
        publicationYear: 2001,
        estimatedDurationMinutes: 5,
        administrationMode: 'self_administered',
        targetPopulation: 'Adultos mayores de 18 años',
        totalItems: 9,
        scoringMethod: 'sum',
        scoreRangeMin: 0,
        scoreRangeMax: 27,
        instructionsProfessional: 'Escala breve con alta confiabilidades para evaluar sintomatología depresiva',
        instructionsPatient: 'Durante las últimas DOS SEMANAS, ¿con qué frecuencia le ha afectado alguno de los siguientes problemas?',
        isActive: true
      }
    });

    // 2. GAD-7 - Flexible
    const gad7 = await prisma.scale.create({
      data: {
        id: 'gad7',
        name: 'Escala de Ansiedad Generalizada',
        abbreviation: 'GAD-7',
        version: '1.0',
        category: 'anxiety',
        subcategory: 'screening',
        description: 'Cuestionario para evaluar ansiedad generalizada',
        author: 'Spitzer, Kroenke, Williams y Löwe',
        publicationYear: 2006,
        estimatedDurationMinutes: 3,
        administrationMode: 'both',
        targetPopulation: 'Adultos',
        totalItems: 7,
        scoringMethod: 'sum',
        scoreRangeMin: 0,
        scoreRangeMax: 21,
        instructionsProfessional: 'Escala para evaluar síntomas de ansiedad generalizada',
        instructionsPatient: 'Durante las últimas 2 semanas, ¿con qué frecuencia ha tenido molestias debido a los siguientes problemas?',
        isActive: true
      }
    });

    // 3. MMSE - Solo heteroaplicada
    const mmse = await prisma.scale.create({
      data: {
        id: 'mmse',
        name: 'Mini Examen del Estado Mental',
        abbreviation: 'MMSE',
        version: '1.0',
        category: 'cognitive',
        subcategory: 'screening',
        description: 'Evaluación cognitiva breve que requiere administración profesional',
        author: 'Folstein, Folstein y McHugh',
        publicationYear: 1975,
        estimatedDurationMinutes: 10,
        administrationMode: 'clinician_administered',
        targetPopulation: 'Adultos y adultos mayores',
        totalItems: 11,
        scoringMethod: 'sum',
        scoreRangeMin: 0,
        scoreRangeMax: 30,
        instructionsProfessional: 'Requiere observación clínica y evaluación directa del profesional',
        instructionsPatient: 'El profesional le hará algunas preguntas para evaluar su función cognitiva',
        isActive: true
      }
    });

    console.log('✅ Escalas creadas:');
    console.log(`  - ${phq9.abbreviation}: ${phq9.administrationMode} (autoaplicada)`);
    console.log(`  - ${gad7.abbreviation}: ${gad7.administrationMode} (flexible)`);  
    console.log(`  - ${mmse.abbreviation}: ${mmse.administrationMode} (heteroaplicada)`);

    console.log('\n🎉 Escalas de prueba creadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestScales();