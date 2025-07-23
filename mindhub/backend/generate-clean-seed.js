/**
 * Script para generar seeds SQL limpios desde JSONs reales
 */
const fs = require('fs');
const path = require('path');

// Función para escapar strings SQL
function escapeSQLString(str) {
  if (!str) return 'NULL';
  return `'${str.toString().replace(/'/g, "''")}'`;
}

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

function generateScaleSeed(jsonPath, outputPath) {
  try {
    console.log(`📄 Procesando: ${path.basename(jsonPath)}`);
    
    // Leer JSON
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const { scale, responseOptions, items, interpretationRules, subscales } = jsonData;
    
    let sql = '';
    
    // Header
    sql += `-- =====================================================\n`;
    sql += `-- SEED SQL para escala ${scale.abbreviation}\n`;
    sql += `-- ${scale.name}\n`;
    sql += `-- Generado desde JSON limpio\n`;
    sql += `-- =====================================================\n\n`;
    
    // 1. Insertar escala principal
    sql += `-- Insertar escala principal\n`;
    sql += `INSERT INTO scales (\n`;
    sql += `    id, name, abbreviation, version, category, subcategory, description,\n`;
    sql += `    author, publication_year, estimated_duration_minutes, administration_mode,\n`;
    sql += `    application_type, target_population, total_items, scoring_method, score_range_min,\n`;
    sql += `    score_range_max, instructions_professional, instructions_patient, is_active,\n`;
    sql += `    created_at, updated_at\n`;
    sql += `) VALUES (\n`;
    sql += `    ${escapeSQLString(scale.id)},\n`;
    sql += `    ${escapeSQLString(scale.name)},\n`;
    sql += `    ${escapeSQLString(scale.abbreviation)},\n`;
    sql += `    ${escapeSQLString(scale.version)},\n`;
    sql += `    ${escapeSQLString(scale.category)},\n`;
    sql += `    ${escapeSQLString(scale.subcategory)},\n`;
    sql += `    ${escapeSQLString(scale.description)},\n`;
    sql += `    ${escapeSQLString(scale.author)},\n`;
    sql += `    ${scale.publication_year || 'NULL'},\n`;
    sql += `    ${scale.estimated_duration_minutes || 5},\n`;
    sql += `    ${escapeSQLString(scale.administration_mode)},\n`;
    sql += `    ${escapeSQLString(getApplicationType(scale.administration_mode))},\n`;
    sql += `    ${escapeSQLString(scale.target_population)},\n`;
    sql += `    ${scale.total_items},\n`;
    sql += `    ${escapeSQLString(scale.scoring_method)},\n`;
    sql += `    ${scale.score_range_min || 0},\n`;
    sql += `    ${scale.score_range_max || 30},\n`;
    sql += `    ${escapeSQLString(scale.instructions_professional)},\n`;
    sql += `    ${escapeSQLString(scale.instructions_patient)},\n`;
    sql += `    1,\n`;
    sql += `    NOW(),\n`;
    sql += `    NOW()\n`;
    sql += `);\n\n`;
    
    // 2. Insertar items
    sql += `-- Insertar items\n`;
    const itemsSQL = [];
    
    items.forEach((item, index) => {
      const itemSQL = `(${escapeSQLString(item.id)}, ${escapeSQLString(scale.id)}, ${item.number}, ${escapeSQLString(item.text)}, ${escapeSQLString(`${scale.abbreviation}${item.number}`)}, NULL, ${item.reverseScored ? 1 : 0}, 1, NOW(), NOW())`;
      itemsSQL.push(itemSQL);
    });
    
    sql += `INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active, created_at, updated_at) VALUES\n`;
    sql += itemsSQL.join(',\n') + ';\n\n';
    
    // 3. Insertar opciones de respuesta principales
    sql += `-- Insertar opciones de respuesta principales\n`;
    const optionsSQL = [];
    
    responseOptions.forEach(option => {
      const optionSQL = `(${escapeSQLString(option.id)}, ${escapeSQLString(scale.id)}, ${escapeSQLString(option.value)}, ${escapeSQLString(option.label)}, ${option.score}, ${option.orderIndex || 1}, 1, NOW(), NOW())`;
      optionsSQL.push(optionSQL);
    });
    
    // Opciones especiales del ítem 10 (si existen)
    const item10 = items.find(item => item.number === 10);
    if (item10 && Array.isArray(item10.responseOptions)) {
      item10.responseOptions.forEach(option => {
        const optionSQL = `(${escapeSQLString(option.id)}, ${escapeSQLString(scale.id)}, ${escapeSQLString(option.value)}, ${escapeSQLString(option.label)}, ${option.score}, ${option.orderIndex || 1}, 1, NOW(), NOW())`;
        optionsSQL.push(optionSQL);
      });
    }
    
    sql += `INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active, created_at, updated_at) VALUES\n`;
    sql += optionsSQL.join(',\n') + ';\n\n';
    
    // 4. Insertar reglas de interpretación
    sql += `-- Insertar reglas de interpretación\n`;
    const interpretationSQL = [];
    
    interpretationRules.forEach(rule => {
      const ruleSQL = `(${escapeSQLString(rule.id)}, ${escapeSQLString(scale.id)}, ${rule.minScore}, ${rule.maxScore}, ${escapeSQLString(rule.severityLevel)}, ${escapeSQLString(rule.label)}, ${escapeSQLString(rule.color)}, ${escapeSQLString(rule.description)}, ${escapeSQLString(rule.recommendations)}, 1, NOW(), NOW())`;
      interpretationSQL.push(ruleSQL);
    });
    
    sql += `INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active, created_at, updated_at) VALUES\n`;
    sql += interpretationSQL.join(',\n') + ';\n\n';
    
    // 5. Footer
    sql += `-- =====================================================\n`;
    sql += `-- Fin del seed para ${scale.abbreviation}\n`;
    sql += `-- =====================================================\n`;
    
    // Escribir archivo
    fs.writeFileSync(outputPath, sql, 'utf8');
    console.log(`✅ Generado: ${path.basename(outputPath)}`);
    
    return {
      abbreviation: scale.abbreviation,
      name: scale.name,
      applicationType: getApplicationType(scale.administration_mode),
      itemsCount: items.length,
      optionsCount: responseOptions.length + (item10 && Array.isArray(item10.responseOptions) ? item10.responseOptions.length : 0),
      rulesCount: interpretationRules.length
    };
    
  } catch (error) {
    console.error(`❌ Error procesando ${jsonPath}:`, error.message);
    return null;
  }
}

// Generar seed desde el JSON del PHQ-9
const jsonPath = '/Users/alekscon/Desktop/PROYECTO-MindHub/Escalas Json/phq9.json';
const outputPath = './database/seeds/phq9-seed-clean.sql';

console.log('🧹 Generando seed SQL limpio desde JSON real...');

const result = generateScaleSeed(jsonPath, outputPath);

if (result) {
  console.log(`\n📊 Seed generado exitosamente:`);
  console.log(`  - Escala: ${result.abbreviation} - ${result.name}`);
  console.log(`  - Tipo: ${result.applicationType}`);  
  console.log(`  - Items: ${result.itemsCount}`);
  console.log(`  - Opciones: ${result.optionsCount}`);
  console.log(`  - Reglas: ${result.rulesCount}`);
  console.log(`\n✅ Archivo creado: ${outputPath}`);
} else {
  console.log('❌ Error generando seed');
}

module.exports = { generateScaleSeed, escapeSQLString, getApplicationType };