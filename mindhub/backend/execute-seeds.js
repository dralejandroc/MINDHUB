/**
 * Script para crear tablas de seeds y ejecutar los datos SQL
 */
const { PrismaClient } = require('./generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function executeSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Dividir por declaraciones SQL (separadas por ;)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.toUpperCase().includes('SELECT') || statement.toUpperCase().includes('SHOW')) {
        // Para SELECT queries, usamos $queryRawUnsafe para ver resultados
        try {
          const result = await prisma.$queryRawUnsafe(statement);
          console.log('Query result:', result);
        } catch (error) {
          // Ignorar errores en SELECT queries
        }
      } else {
        // Para INSERT/CREATE queries
        await prisma.$executeRawUnsafe(statement);
      }
    }
    
    console.log(`✅ Ejecutado: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error ejecutando ${filePath}:`, error.message);
  }
}

async function executeSeeds() {
  console.log('🌱 Iniciando ejecución de seeds SQL...');
  
  try {
    // 1. Crear tablas primero
    console.log('\n📋 Creando tablas...');
    await executeSQLFile('./create-seeds-tables.sql');
    
    // 2. Ejecutar seeds de escalas
    console.log('\n📊 Insertando escalas...');
    const seedsDir = './database/seeds';
    const seedFiles = [
      'phq9-seed.sql',
      'gad-7-seed.sql',
      'gds15-seed.sql'
    ];
    
    for (const seedFile of seedFiles) {
      const filePath = path.join(seedsDir, seedFile);
      if (fs.existsSync(filePath)) {
        await executeSQLFile(filePath);
      } else {
        console.log(`⚠️  Archivo no encontrado: ${seedFile}`);
      }
    }
    
    // 3. Aplicar tipos de aplicación según la configuración
    console.log('\n🔧 Aplicando tipos de aplicación...');
    const administrationModes = require('./seeds/scales-administration-modes');
    
    for (const modeConfig of administrationModes) {
      const { abbreviation, administration_mode } = modeConfig;
      
      let applicationType;
      if (administration_mode === 'clinician_administered') {
        applicationType = 'heteroaplicada';
      } else if (administration_mode === 'self_administered') {
        applicationType = 'autoaplicada';
      } else if (administration_mode === 'both') {
        applicationType = 'flexible';
      } else {
        applicationType = 'flexible'; // Default
      }
      
      await prisma.$executeRawUnsafe(
        `UPDATE scales SET administration_mode = ?, application_type = ? WHERE abbreviation = ?`,
        administration_mode,
        applicationType,
        abbreviation
      );
    }
    
    // 4. Verificar resultados
    console.log('\n📊 Verificando escalas insertadas...');
    const scales = await prisma.$queryRawUnsafe(`
      SELECT abbreviation, name, administration_mode, application_type 
      FROM scales 
      WHERE is_active = 1 
      ORDER BY abbreviation
    `);
    
    console.log('\n✅ Escalas disponibles:');
    scales.forEach(scale => {
      console.log(`  - ${scale.abbreviation}: ${scale.name}`);
      console.log(`    Modo: ${scale.administration_mode} | Tipo: ${scale.application_type || 'N/A'}`);
    });
    
    console.log('\n🎉 Seeds ejecutados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  executeSeeds();
}

module.exports = { executeSeeds, executeSQLFile };