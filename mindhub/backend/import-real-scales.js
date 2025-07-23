/**
 * Script para importar las escalas reales desde los seeds SQL
 * Usa las configuraciones de administration modes definidas
 */
const { PrismaClient } = require('./generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuración de modos de administración
const administrationModes = require('./seeds/scales-administration-modes');

function getAdministrationConfig(abbreviation) {
  const config = administrationModes.find(m => m.abbreviation === abbreviation);
  return config ? config.administration_mode : 'both'; // Default: flexible
}

function mapApplicationType(administrationMode) {
  switch (administrationMode) {
    case 'clinician_administered':
      return 'heteroaplicada';
    case 'self_administered':
      return 'autoaplicada';
    case 'both':
      return 'flexible';
    default:
      return 'flexible';
  }
}

async function executeSQLFile(filePath) {
  try {
    console.log(`📄 Procesando: ${path.basename(filePath)}`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Extraer datos de la escala del INSERT principal
    const scaleInsertMatch = sql.match(/INSERT INTO scales \(([\s\S]*?)\) VALUES \(([\s\S]*?)\);/);
    
    if (!scaleInsertMatch) {
      console.log(`⚠️  No se encontró INSERT de escala en ${filePath}`);
      return null;
    }
    
    // Parsear los valores (simplificado para los datos más importantes)
    const values = scaleInsertMatch[2];
    const valueArray = values.split(',').map(v => v.trim().replace(/^'|'$/g, ''));
    
    const scaleData = {
      id: valueArray[0].replace(/'/g, ''),
      name: valueArray[1].replace(/'/g, ''),
      abbreviation: valueArray[2].replace(/'/g, ''),
      version: valueArray[3].replace(/'/g, '') || '1.0',
      category: valueArray[4].replace(/'/g, ''),
      subcategory: valueArray[5].replace(/'/g, '') || null,
      description: valueArray[6].replace(/'/g, ''),
      author: valueArray[7].replace(/'/g, '') || null,
      publicationYear: parseInt(valueArray[8]) || null,
      estimatedDurationMinutes: parseInt(valueArray[9]) || 5,
      targetPopulation: valueArray[11].replace(/'/g, '') || 'Adultos',
      totalItems: parseInt(valueArray[12]) || 10,
      scoringMethod: valueArray[13].replace(/'/g, '') || 'sum',
      scoreRangeMin: parseInt(valueArray[14]) || 0,
      scoreRangeMax: parseInt(valueArray[15]) || 30,
      instructionsProfessional: valueArray[16].replace(/'/g, '') || null,
      instructionsPatient: valueArray[17].replace(/'/g, '') || null,
      isActive: true
    };
    
    // Obtener configuración de administration mode
    const adminMode = getAdministrationConfig(scaleData.abbreviation);
    scaleData.administrationMode = adminMode;
    
    console.log(`  📋 ${scaleData.abbreviation}: ${scaleData.name}`);
    console.log(`  🔧 Modo: ${adminMode} → ${mapApplicationType(adminMode)}`);
    
    return scaleData;
    
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return null;
  }
}

async function importRealScales() {
  console.log('🌱 Importando escalas reales desde seeds...');
  
  try {
    const seedsDir = './database/seeds';
    const seedFiles = fs.readdirSync(seedsDir).filter(f => f.endsWith('-seed.sql'));
    
    console.log(`📊 Encontrados ${seedFiles.length} archivos de seeds:`);
    seedFiles.forEach(file => console.log(`  - ${file}`));
    
    const scalesData = [];
    
    // Procesar cada archivo de seed
    for (const seedFile of seedFiles) {
      const filePath = path.join(seedsDir, seedFile);
      const scaleData = await executeSQLFile(filePath);
      
      if (scaleData) {
        scalesData.push(scaleData);
      }
    }
    
    console.log(`\n💾 Creando ${scalesData.length} escalas en la base de datos...`);
    
    // Crear las escalas en la base de datos
    for (const scaleData of scalesData) {
      try {
        await prisma.scale.create({
          data: scaleData
        });
        console.log(`  ✅ Creada: ${scaleData.abbreviation}`);
      } catch (error) {
        console.error(`  ❌ Error creando ${scaleData.abbreviation}:`, error.message);
      }
    }
    
    // Verificar resultados
    console.log('\n📊 Verificando escalas importadas...');
    const importedScales = await prisma.scale.findMany({
      select: {
        abbreviation: true,
        name: true,
        administrationMode: true,
        category: true
      },
      orderBy: { abbreviation: 'asc' }
    });
    
    console.log(`\n✅ ${importedScales.length} escalas importadas exitosamente:`);
    
    // Agrupar por tipo
    const byType = {
      autoaplicada: [],
      heteroaplicada: [],
      flexible: []
    };
    
    importedScales.forEach(scale => {
      const appType = mapApplicationType(scale.administrationMode);
      byType[appType].push(scale);
    });
    
    console.log('\n📋 Por tipo de aplicación:');
    console.log(`🙋‍♀️ Autoaplicadas (${byType.autoaplicada.length}):`);
    byType.autoaplicada.forEach(s => console.log(`  - ${s.abbreviation}: ${s.name}`));
    
    console.log(`👨‍⚕️ Heteroaplicadas (${byType.heteroaplicada.length}):`);
    byType.heteroaplicada.forEach(s => console.log(`  - ${s.abbreviation}: ${s.name}`));
    
    console.log(`🔄 Flexibles (${byType.flexible.length}):`);
    byType.flexible.forEach(s => console.log(`  - ${s.abbreviation}: ${s.name}`));
    
    console.log('\n🎉 Importación completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importRealScales();