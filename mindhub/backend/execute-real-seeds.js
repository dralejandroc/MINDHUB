/**
 * Script para ejecutar los seeds SQL reales directamente
 */
const { PrismaClient } = require('./generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function executeRealSeeds() {
  console.log('🌱 Ejecutando seeds SQL reales...');
  
  try {
    // 1. Limpiar base de datos
    console.log('🧹 Limpiando datos existentes...');
    await prisma.scale.deleteMany({});
    
    // 2. Crear tablas SQL si no existen
    console.log('📋 Creando tablas SQL...');
    const createTablesSQL = fs.readFileSync('./create-seeds-tables.sql', 'utf8');
    const statements = createTablesSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.includes('SHOW'));
    
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (error) {
        // Ignorar errores de tabla ya existe
        if (!error.message.includes('already exists')) {
          console.error('Error creando tabla:', error.message);
        }
      }
    }
    console.log('✅ Tablas preparadas');
    
    // 3. Ejecutar seeds reales (empezar con 3 escalas clave)
    const prioritySeeds = ['phq9-seed.sql', 'gad-7-seed.sql', 'gds15-seed.sql'];
    
    for (const seedFile of prioritySeeds) {
      const filePath = path.join('./database/seeds', seedFile);
      
      if (fs.existsSync(filePath)) {
        console.log(`📊 Ejecutando ${seedFile}...`);
        
        try {
          const seedSQL = fs.readFileSync(filePath, 'utf8');
          
          // Dividir y limpiar statements
          const seedStatements = seedSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
          
          for (const statement of seedStatements) {
            await prisma.$executeRawUnsafe(statement + ';');
          }
          
          console.log(`✅ ${seedFile} ejecutado correctamente`);
          
        } catch (error) {
          console.error(`❌ Error ejecutando ${seedFile}:`, error.message);
        }
      } else {
        console.log(`⚠️  Archivo no encontrado: ${seedFile}`);
      }
    }
    
    // 4. Verificar que las escalas se crearon
    console.log('\n📊 Verificando escalas creadas...');
    
    const scalesCreated = await prisma.$queryRawUnsafe(`
      SELECT abbreviation, name, administration_mode, is_active 
      FROM scales 
      WHERE is_active = 1
      ORDER BY abbreviation
    `);
    
    console.log(`✅ ${scalesCreated.length} escalas reales importadas:`);
    scalesCreated.forEach(scale => {
      console.log(`  - ${scale.abbreviation}: ${scale.name} (${scale.administration_mode})`);
    });
    
    console.log('\n🎉 Seeds reales ejecutados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

executeRealSeeds();