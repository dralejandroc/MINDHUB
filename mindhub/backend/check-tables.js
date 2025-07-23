const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🔍 Verificando tablas y datos...');

    // Verificar tabla assessment_scales de Prisma
    console.log('\n📊 Tabla assessment_scales (Prisma):');
    const prismaScales = await prisma.assessmentScale.findMany({
      select: {
        id: true,
        name: true,
        abbreviation: true,
        administrationMode: true,
        applicationType: true
      }
    });
    
    console.log(`Encontradas ${prismaScales.length} escalas en assessment_scales`);
    prismaScales.forEach(scale => {
      console.log(`  - ${scale.abbreviation}: ${scale.name} (adminMode: ${scale.administrationMode}, appType: ${scale.applicationType})`);
    });

    // Verificar si existe tabla scales (del seed SQL)
    console.log('\n📊 Verificando tabla scales (SQL seeds):');
    try {
      const sqlScales = await prisma.$queryRaw`SELECT COUNT(*) as count FROM scales WHERE is_active = 1`;
      console.log(`Encontradas ${sqlScales[0].count} escalas en tabla scales`);
      
      if (sqlScales[0].count > 0) {
        const sampleScales = await prisma.$queryRaw`SELECT id, name, abbreviation, administration_mode FROM scales WHERE is_active = 1 LIMIT 5`;
        console.log('Muestra de escalas en tabla scales:');
        sampleScales.forEach(scale => {
          console.log(`  - ${scale.abbreviation}: ${scale.name} (${scale.administration_mode})`);
        });
      }
    } catch (error) {
      console.log('❌ Tabla scales no existe o está vacía');
    }

    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();