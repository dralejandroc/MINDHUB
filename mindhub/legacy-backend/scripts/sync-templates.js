#!/usr/bin/env node

/**
 * Script para sincronizar templates JSON a seeds SQL
 * Uso: 
 *   node scripts/sync-templates.js              // Sincroniza todos los templates
 *   node scripts/sync-templates.js [scale-name] // Sincroniza una escala específica
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../database/templates');
const SEEDS_DIR = path.join(__dirname, '../database/seeds');

// Crear directorio seeds si no existe
if (!fs.existsSync(SEEDS_DIR)) {
  fs.mkdirSync(SEEDS_DIR, { recursive: true });
}

/**
 * Convierte un template JSON a SQL seed
 */
function jsonToSQL(jsonData, scaleId) {
  const scale = jsonData;
  let sql = '';
  
  // Validar campos requeridos
  if (!scale.name || !scale.id) {
    throw new Error(`Faltan campos requeridos en ${scaleId}: name, id`);
  }
  
  sql += `-- ${scale.name} (${scale.abbreviation || scale.id})\n`;
  sql += `-- Generado automáticamente desde ${scaleId}.json\n`;
  sql += `-- Fecha: ${new Date().toISOString()}\n\n`;
  
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
  
  // 1. Insertar escala principal
  sql += `-- 1. Escala principal\n`;
  sql += `INSERT INTO scales (\n`;
  sql += `  id, name, abbreviation, description, version, category, subcategory,\n`;
  sql += `  author, publication_year, total_items, estimated_duration_minutes,\n`;
  sql += `  administration_mode, target_population, scoring_method,\n`;
  sql += `  score_range_min, score_range_max, instructions_professional, instructions_patient,\n`;
  sql += `  created_at, updated_at\n`;
  sql += `) VALUES (\n`;
  sql += `  '${scale.id}',\n`;
  sql += `  '${(scale.name || '').replace(/'/g, "\\'")}',\n`;
  sql += `  '${scale.abbreviation || scale.id.toUpperCase()}',\n`;
  sql += `  '${(scale.description || '').replace(/'/g, "\\'")}',\n`;
  sql += `  '${scale.version || '1.0'}',\n`;
  sql += `  '${scale.category || 'general'}',\n`;
  sql += `  '${scale.subcategory || ''}',\n`;
  sql += `  '${(scale.author || '').replace(/'/g, "\\'")}',\n`;
  sql += `  ${scale.publication_year || new Date().getFullYear()},\n`;
  sql += `  ${scale.total_items || scale.totalItems || 0},\n`;
  sql += `  ${scale.estimated_duration_minutes || scale.estimatedDurationMinutes || 10},\n`;
  sql += `  '${scale.administration_mode || scale.administrationMode || 'self_administered'}',\n`;
  sql += `  '${(scale.target_population || scale.targetPopulation || '').replace(/'/g, "\\'")}',\n`;
  sql += `  '${scale.scoring_method || scale.scoringMethod || 'sum'}',\n`;
  sql += `  ${scale.score_range_min || scale.scoreRangeMin || 0},\n`;
  sql += `  ${scale.score_range_max || scale.scoreRangeMax || 100},\n`;
  sql += `  '${(scale.instructions_professional || scale.instructionsProfessional || '').replace(/'/g, "\\'")}',\n`;
  sql += `  '${(scale.instructions_patient || scale.instructionsPatient || '').replace(/'/g, "\\'")}',\n`;
  sql += `  NOW(),\n`;
  sql += `  NOW()\n`;
  sql += `);\n\n`;

  // 2. Insertar opciones de respuesta globales
  if (scale.responseOptions && scale.responseOptions.length > 0) {
    sql += `-- 2. Opciones de respuesta globales\n`;
    scale.responseOptions.forEach(option => {
      sql += `INSERT INTO scale_response_options (\n`;
      sql += `  id, scale_id, option_value, option_label, score_value, display_order,\n`;
      sql += `  option_type, metadata, is_active, created_at, updated_at\n`;
      sql += `) VALUES (\n`;
      sql += `  '${option.id}',\n`;
      sql += `  '${scale.id}',\n`;
      sql += `  '${option.value}',\n`;
      sql += `  '${option.label.replace(/'/g, "\\'")}',\n`;
      sql += `  ${option.score},\n`;
      sql += `  ${option.orderIndex || 0},\n`;
      sql += `  '${option.optionType || 'standard'}',\n`;
      sql += `  '${JSON.stringify(option.metadata || {}).replace(/'/g, "\\'")}',\n`;
      sql += `  true,\n`;
      sql += `  NOW(),\n`;
      sql += `  NOW()\n`;
      sql += `);\n\n`;
    });
  }

  // 3. Insertar ítems
  if (scale.items && scale.items.length > 0) {
    sql += `-- 3. Ítems de la escala\n`;
    scale.items.forEach(item => {
      sql += `INSERT INTO scale_items (\n`;
      sql += `  id, scale_id, item_number, item_text, item_code, subscale,\n`;
      sql += `  reverse_scored, question_type, alert_trigger, alert_condition,\n`;
      sql += `  help_text, required, metadata, is_active, created_at, updated_at\n`;
      sql += `) VALUES (\n`;
      sql += `  '${item.id}',\n`;
      sql += `  '${scale.id}',\n`;
      sql += `  ${item.number},\n`;
      sql += `  '${item.text.replace(/'/g, "\\'")}',\n`;
      sql += `  '${item.id.toUpperCase()}',\n`;
      sql += `  null,\n`;
      sql += `  ${item.reverseScored || false},\n`;
      sql += `  '${item.questionType || 'likert'}',\n`;
      sql += `  ${item.alertTrigger || false},\n`;
      sql += `  '${item.alertCondition || ''}',\n`;
      sql += `  '${(item.helpText || '').replace(/'/g, "\\'")}',\n`;
      sql += `  ${item.required !== false},\n`;
      sql += `  '${JSON.stringify(item.metadata || {}).replace(/'/g, "\\'")}',\n`;
      sql += `  true,\n`;
      sql += `  NOW(),\n`;
      sql += `  NOW()\n`;
      sql += `);\n\n`;

      // 3b. Insertar relaciones ítem-opciones
      if (item.responseOptions && item.responseOptions.length > 0) {
        item.responseOptions.forEach(optionId => {
          sql += `INSERT INTO item_response_options (item_id, response_option_id) VALUES ('${item.id}', '${optionId}');\n`;
        });
        sql += `\n`;
      }

      // 3c. Insertar opciones específicas del ítem
      if (item.specificOptions && item.specificOptions.length > 0) {
        item.specificOptions.forEach((option, index) => {
          sql += `INSERT INTO scale_item_specific_options (\n`;
          sql += `  id, item_id, option_value, option_label, score_value, display_order,\n`;
          sql += `  is_active, metadata, created_at, updated_at\n`;
          sql += `) VALUES (\n`;
          sql += `  '${item.id}-opt-${index}',\n`;
          sql += `  '${item.id}',\n`;
          sql += `  '${option.value}',\n`;
          sql += `  '${option.label.replace(/'/g, "\\'")}',\n`;
          sql += `  ${option.score},\n`;
          sql += `  ${index},\n`;
          sql += `  true,\n`;
          sql += `  '${JSON.stringify(option.metadata || {}).replace(/'/g, "\\'")}',\n`;
          sql += `  NOW(),\n`;
          sql += `  NOW()\n`;
          sql += `);\n\n`;
        });
      }
    });
  }

  // 4. Insertar subescalas
  if (scale.subscales && scale.subscales.length > 0) {
    sql += `-- 4. Subescalas\n`;
    scale.subscales.forEach(subscale => {
      sql += `INSERT INTO scale_subscales (\n`;
      sql += `  id, scale_id, name, description, items, min_score, max_score,\n`;
      sql += `  references, cronbach_alpha, created_at, updated_at\n`;
      sql += `) VALUES (\n`;
      sql += `  '${subscale.id}',\n`;
      sql += `  '${scale.id}',\n`;
      sql += `  '${subscale.name.replace(/'/g, "\\'")}',\n`;
      sql += `  '${subscale.description.replace(/'/g, "\\'")}',\n`;
      sql += `  '${JSON.stringify(subscale.items)}',\n`;
      sql += `  ${subscale.min_score},\n`;
      sql += `  ${subscale.max_score},\n`;
      sql += `  '${subscale.referencias_bibliograficas || ''}',\n`;
      sql += `  ${subscale.indice_cronbach || 0.0},\n`;
      sql += `  NOW(),\n`;
      sql += `  NOW()\n`;
      sql += `);\n\n`;
    });
  }

  // 5. Insertar reglas de interpretación
  if (scale.interpretationRules && scale.interpretationRules.length > 0) {
    sql += `-- 5. Reglas de interpretación\n`;
    scale.interpretationRules.forEach(rule => {
      sql += `INSERT INTO scale_interpretation_rules (\n`;
      sql += `  id, scale_id, min_score, max_score, severity_level, label,\n`;
      sql += `  color, description, recommendations, created_at, updated_at\n`;
      sql += `) VALUES (\n`;
      sql += `  '${rule.id}',\n`;
      sql += `  '${scale.id}',\n`;
      sql += `  ${rule.min_score},\n`;
      sql += `  ${rule.max_score},\n`;
      sql += `  '${rule.severity_level}',\n`;
      sql += `  '${rule.label.replace(/'/g, "\\'")}',\n`;
      sql += `  '${rule.color}',\n`;
      sql += `  '${rule.description.replace(/'/g, "\\'")}',\n`;
      sql += `  '${rule.recommendations.replace(/'/g, "\\'")}',\n`;
      sql += `  NOW(),\n`;
      sql += `  NOW()\n`;
      sql += `);\n\n`;
    });
  }

  // 6. Insertar documentación científica
  if (scale.documentation) {
    sql += `-- 6. Documentación científica\n`;
    sql += `INSERT INTO scale_documentation (\n`;
    sql += `  id, scale_id, content_md, references, validation_studies,\n`;
    sql += `  psychometric_properties, clinical_applications, created_at, updated_at\n`;
    sql += `) VALUES (\n`;
    sql += `  '${scale.id}-doc',\n`;
    sql += `  '${scale.id}',\n`;
    sql += `  '${scale.documentation.content_md.replace(/'/g, "\\'")}',\n`;
    sql += `  '${JSON.stringify(scale.documentation.references || []).replace(/'/g, "\\'")}',\n`;
    sql += `  '${JSON.stringify(scale.documentation.validation_studies || []).replace(/'/g, "\\'")}',\n`;
    sql += `  '${JSON.stringify(scale.documentation.psychometric_properties || {}).replace(/'/g, "\\'")}',\n`;
    sql += `  '${JSON.stringify(scale.documentation.clinical_applications || []).replace(/'/g, "\\'")}',\n`;
    sql += `  NOW(),\n`;
    sql += `  NOW()\n`;
    sql += `);\n\n`;
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  
  return sql;
}

/**
 * Sincroniza un template específico
 */
function syncTemplate(scaleId) {
  const templatePath = path.join(TEMPLATES_DIR, `${scaleId}.json`);
  const seedPath = path.join(SEEDS_DIR, `${scaleId}_seed.sql`);

  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template no encontrado: ${templatePath}`);
    return false;
  }

  try {
    console.log(`🔄 Sincronizando ${scaleId}...`);
    
    // Leer archivo (puede ser markdown+JSON o JSON puro)
    const fileContent = fs.readFileSync(templatePath, 'utf8');
    
    // Extraer JSON del archivo (buscar primer '{' hasta último '}')
    const jsonStart = fileContent.indexOf('{');
    const jsonEnd = fileContent.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No se encontró JSON válido en el archivo');
    }
    
    const jsonContent = fileContent.substring(jsonStart, jsonEnd);
    const jsonData = JSON.parse(jsonContent);
    
    // Algunos templates tienen estructura anidada con "scale"
    const scaleData = jsonData.scale || jsonData;
    
    // Generar SQL
    const sqlContent = jsonToSQL(scaleData, scaleId);
    
    // Escribir seed
    fs.writeFileSync(seedPath, sqlContent, 'utf8');
    
    console.log(`✅ ${scaleId} sincronizado → ${seedPath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error sincronizando ${scaleId}:`, error.message);
    return false;
  }
}

/**
 * Sincroniza todos los templates
 */
function syncAllTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.error(`❌ Directorio de templates no encontrado: ${TEMPLATES_DIR}`);
    return;
  }

  const templates = fs.readdirSync(TEMPLATES_DIR)
    .filter(file => file.endsWith('.json') && file !== 'universal-scale-template.json')
    .map(file => file.replace('.json', ''));

  if (templates.length === 0) {
    console.log(`⚠️  No se encontraron templates en ${TEMPLATES_DIR}`);
    return;
  }

  console.log(`🎯 Encontrados ${templates.length} templates: ${templates.join(', ')}\n`);

  let success = 0;
  let failed = 0;

  templates.forEach(scaleId => {
    if (syncTemplate(scaleId)) {
      success++;
    } else {
      failed++;
    }
  });

  console.log(`\n📊 Resumen: ${success} exitosos, ${failed} fallidos`);
}

// Ejecutar script
const targetScale = process.argv[2];

if (targetScale) {
  console.log(`🎯 Sincronizando escala específica: ${targetScale}\n`);
  syncTemplate(targetScale);
} else {
  console.log(`🎯 Sincronizando todos los templates\n`);
  syncAllTemplates();
}