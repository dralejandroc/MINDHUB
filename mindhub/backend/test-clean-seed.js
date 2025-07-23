const { PrismaClient } = require('./generated/prisma');
const fs = require('fs');
const prisma = new PrismaClient();

async function testCleanSeed() {
  try {
    console.log('🧪 Probando seed SQL limpio...');
    
    // Limpiar datos existentes
    await prisma.$executeRawUnsafe('DELETE FROM scales WHERE id = "phq9"');
    
    // Ejecutar seed limpio
    const seedSQL = fs.readFileSync('./database/seeds/phq9-seed-clean.sql', 'utf8');
    const statements = seedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement + ';');
    }
    
    // Verificar resultado
    const scale = await prisma.$queryRawUnsafe('SELECT * FROM scales WHERE id = "phq9"');
    const items = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM scale_items WHERE scale_id = "phq9"');
    const options = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM scale_response_options WHERE scale_id = "phq9"');
    const rules = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM scale_interpretation_rules WHERE scale_id = "phq9"');
    
    console.log('✅ PHQ-9 importado correctamente:');
    console.log(`  - Escala: ${scale[0].abbreviation} - ${scale[0].name}`);
    console.log(`  - Tipo: ${scale[0].application_type}`);
    console.log(`  - Items: ${items[0].count}`);
    console.log(`  - Opciones: ${options[0].count}`);
    console.log(`  - Reglas: ${rules[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCleanSeed();