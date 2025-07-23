/**
 * Script para importar escalas reales directamente desde JSON usando Prisma
 */
const { PrismaClient } = require('./generated/prisma');
const fs = require('fs');

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

async function importFromJSON(jsonPath) {
  try {
    console.log(`📄 Importando desde JSON: ${jsonPath}`);
    
    // Leer JSON
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const { scale, responseOptions, items, interpretationRules } = jsonData;
    
    // 1. Crear la escala usando SQL directo con parámetros
    await prisma.$executeRaw`
      INSERT INTO scales (
        id, name, abbreviation, version, category, subcategory, description,
        author, publication_year, estimated_duration_minutes, administration_mode,
        application_type, target_population, total_items, scoring_method, score_range_min,
        score_range_max, instructions_professional, instructions_patient, is_active,
        created_at, updated_at
      ) VALUES (
        ${scale.id}, ${scale.name}, ${scale.abbreviation}, ${scale.version},
        ${scale.category}, ${scale.subcategory || null}, ${scale.description},
        ${scale.author}, ${scale.publication_year || null}, ${scale.estimated_duration_minutes},
        ${scale.administration_mode}, ${getApplicationType(scale.administration_mode)},
        ${scale.target_population}, ${scale.total_items}, ${scale.scoring_method},
        ${scale.score_range_min}, ${scale.score_range_max}, ${scale.instructions_professional},
        ${scale.instructions_patient}, 1, NOW(), NOW()
      )
    `;
    
    console.log(`  ✅ Escala creada: ${scale.abbreviation}`);
    
    // 2. Crear items
    for (const item of items) {
      await prisma.$executeRaw`
        INSERT INTO scale_items (
          id, scale_id, item_number, item_text, item_code, subscale, 
          reverse_scored, is_active, created_at, updated_at
        ) VALUES (
          ${item.id}, ${scale.id}, ${item.number}, ${item.text},
          ${`${scale.abbreviation}${item.number}`}, ${null},
          ${item.reverseScored ? 1 : 0}, 1, NOW(), NOW()
        )
      `;
    }
    
    console.log(`  ✅ ${items.length} items creados`);
    
    // 3. Crear opciones de respuesta principales
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
    }
    
    // Opciones especiales del ítem 10
    const item10 = items.find(item => item.number === 10);
    if (item10 && Array.isArray(item10.responseOptions)) {
      for (const option of item10.responseOptions) {
        await prisma.$executeRaw`
          INSERT INTO scale_response_options (
            id, scale_id, option_value, option_label, score_value, 
            display_order, is_active, created_at, updated_at
          ) VALUES (
            ${option.id}, ${scale.id}, ${option.value}, ${option.label},
            ${option.score}, ${option.orderIndex || 1}, 1, NOW(), NOW()
          )
        `;
      }
    }
    
    const totalOptions = responseOptions.length + (item10 && Array.isArray(item10.responseOptions) ? item10.responseOptions.length : 0);
    console.log(`  ✅ ${totalOptions} opciones creadas`);
    
    // 4. Crear reglas de interpretación
    for (const rule of interpretationRules) {
      await prisma.$executeRaw`
        INSERT INTO scale_interpretation_rules (
          id, scale_id, min_score, max_score, severity_level, interpretation_label,
          color_code, description, recommendations, is_active, created_at, updated_at
        ) VALUES (
          ${rule.id}, ${scale.id}, ${rule.minScore}, ${rule.maxScore},
          ${rule.severityLevel}, ${rule.label}, ${rule.color}, ${rule.description},
          ${rule.recommendations}, 1, NOW(), NOW()
        )
      `;
    }
    
    console.log(`  ✅ ${interpretationRules.length} reglas creadas`);
    
    return {
      abbreviation: scale.abbreviation,
      name: scale.name,
      applicationType: getApplicationType(scale.administration_mode),
      itemsCount: items.length,
      optionsCount: totalOptions,
      rulesCount: interpretationRules.length
    };
    
  } catch (error) {
    console.error(`❌ Error importando ${jsonPath}:`, error.message);
    return null;
  }
}

async function importRealScale() {
  console.log('📥 Importando escala real desde JSON...');
  
  try {
    // Limpiar PHQ-9 existente
    await prisma.$executeRaw`DELETE FROM scales WHERE id = 'phq9'`;
    
    // Importar desde JSON real
    const jsonPath = '/Users/alekscon/Desktop/PROYECTO-MindHub/Escalas Json/phq9.json';
    const result = await importFromJSON(jsonPath);
    
    if (result) {
      console.log(`\n📊 Escala importada exitosamente:`);
      console.log(`  - Escala: ${result.abbreviation} - ${result.name}`);
      console.log(`  - Tipo: ${result.applicationType}`);
      console.log(`  - Items: ${result.itemsCount}`);
      console.log(`  - Opciones: ${result.optionsCount}`);
      console.log(`  - Reglas: ${result.rulesCount}`);
      
      // Verificar que se puede leer desde la API
      console.log('\n🔍 Verificando con ScaleRepository...');
      const ScaleRepository = require('./repositories/ScaleRepository');
      const scaleRepo = new ScaleRepository();
      
      const scaleFromRepo = await scaleRepo.getScaleById('phq9');
      if (scaleFromRepo) {
        console.log(`✅ Escala accesible via ScaleRepository:`);
        console.log(`  - ${scaleFromRepo.abbreviation}: ${scaleFromRepo.name}`);
        console.log(`  - Tipo: ${scaleFromRepo.applicationType}`);
        console.log(`  - Items: ${scaleFromRepo.items?.length || 0}`);
        console.log(`  - Opciones: ${scaleFromRepo.responseOptions?.length || 0}`);
        console.log(`  - Reglas: ${scaleFromRepo.interpretationRules?.length || 0}`);
      }
    }
    
    console.log('\n🎉 Importación completada!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importRealScale();