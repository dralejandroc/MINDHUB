const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function migrateApplicationTypes() {
  console.log('🔄 Iniciando migración de tipos de aplicación...');
  
  try {
    // Actualizar escalas típicamente autoaplicadas
    const autoaplicadas = await prisma.assessmentScale.updateMany({
      where: {
        abbreviation: { in: ['PHQ-9', 'GAD-7', 'BDI-II', 'BAI', 'PSS', 'DASS-21'] }
      },
      data: {
        applicationType: 'autoaplicada'
      }
    });
    console.log(`✅ Actualizadas ${autoaplicadas.count} escalas autoaplicadas`);

    // Actualizar escalas típicamente heteroaplicadas
    const heteroaplicadas = await prisma.assessmentScale.updateMany({
      where: {
        abbreviation: { in: ['MMSE', 'GDS-30', 'ADAS-COG', 'CDR', 'HRS-D'] }
      },
      data: {
        applicationType: 'heteroaplicada'
      }
    });
    console.log(`✅ Actualizadas ${heteroaplicadas.count} escalas heteroaplicadas`);

    // Actualizar escalas flexibles (pueden ser ambas)
    const flexibles = await prisma.assessmentScale.updateMany({
      where: {
        abbreviation: { in: ['GDS-15', 'WHOQOL-BREF', 'SF-36', 'STAI'] }
      },
      data: {
        applicationType: 'flexible'
      }
    });
    console.log(`✅ Actualizadas ${flexibles.count} escalas flexibles`);

    // Verificar los cambios
    const escalas = await prisma.assessmentScale.findMany({
      select: {
        abbreviation: true,
        name: true,
        applicationType: true
      },
      orderBy: [
        { applicationType: 'asc' },
        { abbreviation: 'asc' }
      ]
    });

    console.log('\n📊 Estado actual de las escalas:');
    escalas.forEach(escala => {
      console.log(`${escala.abbreviation} - ${escala.applicationType}`);
    });

    console.log('\n✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateApplicationTypes();