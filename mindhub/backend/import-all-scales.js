/**
 * Script para importar TODAS las escalas reales desde JSONs
 * Maneja opciones específicas por item correctamente
 */
const { PrismaClient } = require('./generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Mapear administration_mode a application_type
function getApplicationType(adminMode) {
  switch (adminMode) {
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

async function importScaleFromJSON(jsonPath) {
  try {
    const fileName = path.basename(jsonPath, '.json');
    console.log(`📄 Importando: ${fileName.toUpperCase()}`);
    
    // Leer JSON
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const { scale, responseOptions, items, interpretationRules } = jsonData;
    
    // Limpiar escala existente
    await prisma.$executeRaw`DELETE FROM scales WHERE id = ${scale.id}`;
    
    // 1. Crear la escala
    await prisma.$executeRaw`
      INSERT INTO scales (
        id, name, abbreviation, version, category, subcategory, description,
        author, publication_year, estimated_duration_minutes, administration_mode,
        application_type, target_population, total_items, scoring_method, score_range_min,
        score_range_max, instructions_professional, instructions_patient, is_active,
        created_at, updated_at
      ) VALUES (
        ${scale.id}, ${scale.name}, ${scale.abbreviation}, ${scale.version || '1.0'},
        ${scale.category}, ${scale.subcategory || null}, ${scale.description},
        ${scale.author}, ${scale.publication_year || null}, ${scale.estimated_duration_minutes || 5},
        ${scale.administration_mode}, ${getApplicationType(scale.administration_mode)},
        ${scale.target_population}, ${scale.total_items}, ${scale.scoring_method},
        ${scale.score_range_min || 0}, ${scale.score_range_max || 30},
        ${scale.instructions_professional || ''}, ${scale.instructions_patient || ''},
        1, NOW(), NOW()
      )
    `;
    
    // 2. Crear items con sus opciones específicas
    const itemsWithSpecificOptions = [];
    
    for (const item of items) {
      await prisma.$executeRaw`
        INSERT INTO scale_items (
          id, scale_id, item_number, item_text, item_code, subscale, 
          reverse_scored, is_active, created_at, updated_at
        ) VALUES (
          ${item.id}, ${scale.id}, ${item.number}, ${item.text},
          ${JSON.stringify(item.responseOptions || [])}, ${item.subscale || null},
          ${item.reverseScored ? 1 : 0}, 1, NOW(), NOW()
        )
      `;
      
      // Si el item tiene opciones específicas (array de objetos), recordarlo
      if (Array.isArray(item.responseOptions) && 
          item.responseOptions.length > 0 && 
          typeof item.responseOptions[0] === 'object') {
        itemsWithSpecificOptions.push(item);
      }
    }
    
    // 3. Crear opciones GENERALES (nivel escala)
    let generalOptionsCount = 0;
    if (responseOptions && Array.isArray(responseOptions)) {
      for (const option of responseOptions) {
        await prisma.$executeRaw`
          INSERT INTO scale_response_options (
            id, scale_id, option_value, option_label, score_value, 
            display_order, is_active, created_at, updated_at
          ) VALUES (
            ${option.id}, ${scale.id}, ${option.value}, ${option.label},
            ${option.score}, ${option.orderIndex || 1}, 1, NOW(), NOW()
          )
        `;
        generalOptionsCount++;
      }
    }
    
    // 4. Crear opciones ESPECÍFICAS por item
    let specificOptionsCount = 0;
    for (const item of itemsWithSpecificOptions) {
      for (const option of item.responseOptions) {
        await prisma.$executeRaw`
          INSERT INTO scale_response_options (
            id, scale_id, option_value, option_label, score_value, 
            display_order, is_active, created_at, updated_at
          ) VALUES (
            ${option.id}, ${scale.id}, ${option.value}, ${option.label},
            ${option.score}, ${option.orderIndex || 1}, 1, NOW(), NOW()
          )
        `;
        specificOptionsCount++;
      }
    }
    
    // 5. Crear reglas de interpretación
    let rulesCount = 0;
    if (interpretationRules && Array.isArray(interpretationRules)) {
      for (const rule of interpretationRules) {
        await prisma.$executeRaw`
          INSERT INTO scale_interpretation_rules (
            id, scale_id, min_score, max_score, severity_level, interpretation_label,
            color_code, description, recommendations, is_active, created_at, updated_at
          ) VALUES (
            ${rule.id}, ${scale.id}, ${rule.minScore}, ${rule.maxScore},
            ${rule.severityLevel}, ${rule.label}, ${rule.color || '#000000'}, 
            ${rule.description}, ${rule.recommendations}, 1, NOW(), NOW()
          )
        `;
        rulesCount++;
      }
    }
    
    console.log(`  ✅ ${scale.abbreviation}: ${items.length} items, ${generalOptionsCount + specificOptionsCount} opciones, ${rulesCount} reglas`);
    
    return {
      abbreviation: scale.abbreviation,
      name: scale.name,
      applicationType: getApplicationType(scale.administration_mode),
      itemsCount: items.length,
      optionsCount: generalOptionsCount + specificOptionsCount,
      rulesCount: rulesCount,
      itemsWithSpecificOptions: itemsWithSpecificOptions.length
    };
    
  } catch (error) {
    console.error(`❌ Error importando ${path.basename(jsonPath)}:`, error.message);
    return null;
  }
}

async function importAllScales() {
  console.log('📥 Importando TODAS las escalas reales desde JSONs...\n');
  
  try {
    const scalesDir = '/Users/alekscon/Desktop/PROYECTO-MindHub/Escalas Json';
    const jsonFiles = fs.readdirSync(scalesDir).filter(file => file.endsWith('.json'));
    
    console.log(`📋 Encontradas ${jsonFiles.length} escalas para importar:\n`);
    
    const results = [];
    let successful = 0;
    let failed = 0;
    
    for (const jsonFile of jsonFiles) {
      const jsonPath = path.join(scalesDir, jsonFile);
      const result = await importScaleFromJSON(jsonPath);
      
      if (result) {
        results.push(result);
        successful++;
      } else {
        failed++;
      }
    }
    
    // Resumen final
    console.log(`\n📊 RESUMEN DE IMPORTACIÓN:`);
    console.log(`  ✅ Exitosas: ${successful}`);
    console.log(`  ❌ Fallidas: ${failed}`);
    console.log(`  📝 Total: ${jsonFiles.length}`);
    
    if (results.length > 0) {
      console.log(`\n📋 ESCALAS IMPORTADAS:`);
      
      results.forEach(result => {
        console.log(`  • ${result.abbreviation} - ${result.applicationType}`);
        console.log(`    Items: ${result.itemsCount} | Opciones: ${result.optionsCount} | Reglas: ${result.rulesCount}`);
        if (result.itemsWithSpecificOptions > 0) {
          console.log(`    ⚠️  ${result.itemsWithSpecificOptions} items con opciones específicas`);
        }
      });
      
      // Verificar con ScaleRepository
      console.log('\n🔍 Verificando acceso via ScaleRepository...');
      const ScaleRepository = require('./repositories/ScaleRepository');
      const scaleRepo = new ScaleRepository();
      
      const allScales = await scaleRepo.getAllActiveScales();
      console.log(`✅ ${allScales.length} escalas accesibles via API`);
      
      // Mostrar tipos de aplicación
      const autoaplicadas = allScales.filter(s => s.applicationType === 'autoaplicada');
      const heteroaplicadas = allScales.filter(s => s.applicationType === 'heteroaplicada');
      const flexibles = allScales.filter(s => s.applicationType === 'flexible');
      
      console.log(`\n📋 DISTRIBUCIÓN POR TIPO:`);
      console.log(`  🔵 Autoaplicadas: ${autoaplicadas.length}`);
      console.log(`  🟡 Heteroaplicadas: ${heteroaplicadas.length}`);
      console.log(`  🟢 Flexibles: ${flexibles.length}`);
    }
    
    console.log('\n🎉 Importación de todas las escalas completada!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importAllScales();