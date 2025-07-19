#!/usr/bin/env node

/**
 * Script Súper Simplificado para Agregar Múltiples Escalas
 * Procesa TODOS los JSONs en la carpeta templates de una sola vez
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Función para convertir JSON a SQL
function jsonToSQL(scaleData) {
  const scale = scaleData.scale;
  const items = scaleData.items || [];
  const responseOptions = scaleData.responseOptions || [];
  const interpretationRules = scaleData.interpretationRules || [];
  const subscales = scaleData.subscales || [];
  
  let sql = `-- =====================================================
-- SEED SQL para escala ${scale.abbreviation}
-- ${scale.name}
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    '${scale.id}',
    '${scale.name.replace(/'/g, "''")}',
    '${scale.abbreviation}',
    '${scale.version || '1.0'}',
    '${scale.category}',
    ${scale.subcategory ? `'${scale.subcategory}'` : 'NULL'},
    '${(scale.description || '').replace(/'/g, "''")}',
    ${scale.author ? `'${scale.author.replace(/'/g, "''")}'` : 'NULL'},
    ${scale.publication_year || 'NULL'},
    ${scale.estimated_duration_minutes || 10},
    '${scale.administration_mode || 'self_administered'}',
    '${(scale.target_population || 'adults').replace(/'/g, "''")}',
    ${scale.total_items},
    '${scale.scoring_method || 'sum'}',
    ${scale.score_range_min || 0},
    ${scale.score_range_max},
    '${(scale.instructions_professional || '').replace(/'/g, "''")}',
    '${(scale.instructions_patient || '').replace(/'/g, "''")}',
    1
);

`;

  // Insertar items
  if (items.length > 0) {
    sql += '-- Insertar items\nINSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES\n';
    
    const itemsSQL = items.map((item, index) => {
      const reverseScored = item.reverseScored ? 1 : 0;
      const subscale = item.subscale ? `'${item.subscale}'` : 'NULL';
      const itemCode = item.item_code || `${scale.abbreviation.toUpperCase()}${item.number}`;
      
      return `('${item.id}', '${scale.id}', ${item.number}, '${item.text.replace(/'/g, "''")}', '${itemCode}', ${subscale}, ${reverseScored}, 1)`;
    });
    
    sql += itemsSQL.join(',\n') + ';\n\n';
  }

  // Insertar opciones de respuesta
  if (responseOptions.length > 0) {
    sql += '-- Insertar opciones de respuesta\nINSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES\n';
    
    const optionsSQL = responseOptions.map((option, index) => {
      const displayOrder = option.orderIndex !== undefined ? option.orderIndex : index;
      return `('${option.id}', '${scale.id}', '${option.value}', '${option.label.replace(/'/g, "''")}', ${option.score}, ${displayOrder}, 1)`;
    });
    
    sql += optionsSQL.join(',\n') + ';\n\n';
  }

  // Insertar reglas de interpretación
  if (interpretationRules.length > 0) {
    sql += '-- Insertar reglas de interpretación\n';
    
    const rulesSQL = interpretationRules.map(rule => {
      const recommendations = rule.recommendations ? rule.recommendations.replace(/'/g, "''").replace(/\n/g, '\\n') : '';
      
      return `INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('${rule.id}', '${scale.id}', ${rule.minScore}, ${rule.maxScore}, '${rule.severityLevel}', '${rule.label.replace(/'/g, "''")}', '${rule.color || '#95A5A6'}', '${(rule.description || '').replace(/'/g, "''")}', '${recommendations}', 1);`;
    });
    
    sql += rulesSQL.join('\n\n') + '\n\n';
  }

  // Insertar subescalas
  if (subscales.length > 0) {
    sql += '-- Insertar subescalas\nINSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES\n';
    
    const subscalesSQL = subscales.map(subscale => {
      const code = subscale.subscale_code || subscale.id.split('-').pop();
      return `('${subscale.id}', '${scale.id}', '${subscale.name.replace(/'/g, "''")}', '${code}', ${subscale.min_score || 0}, ${subscale.max_score}, '${(subscale.description || '').replace(/'/g, "''")}', 1)`;
    });
    
    sql += subscalesSQL.join(',\n') + ';\n';
  }

  return sql;
}

// Función principal
async function procesarTodasLasEscalas() {
  console.log(`${colors.blue}🚀 Procesador Masivo de Escalas Clínicas${colors.reset}\n`);
  
  const templatesDir = path.join(__dirname, '..', 'database', 'templates');
  const seedsDir = path.join(__dirname, '..', 'database', 'seeds');
  
  // Verificar que existan las carpetas
  if (!fs.existsSync(templatesDir)) {
    console.error(`${colors.red}❌ No existe la carpeta templates: ${templatesDir}${colors.reset}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(seedsDir)) {
    fs.mkdirSync(seedsDir, { recursive: true });
  }
  
  // Leer todos los archivos JSON
  const jsonFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'));
  
  if (jsonFiles.length === 0) {
    console.log(`${colors.yellow}⚠️  No hay archivos JSON en la carpeta templates${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`${colors.green}📋 Encontrados ${jsonFiles.length} archivos JSON para procesar${colors.reset}\n`);
  
  let exitosas = 0;
  let errores = 0;
  
  // Procesar cada archivo
  for (const jsonFile of jsonFiles) {
    const jsonPath = path.join(templatesDir, jsonFile);
    const scaleName = path.basename(jsonFile, '.json');
    
    try {
      console.log(`${colors.blue}📄 Procesando: ${jsonFile}${colors.reset}`);
      
      // Leer y parsear JSON
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      const scaleData = JSON.parse(jsonContent);
      
      // Validar estructura básica
      if (!scaleData.scale || !scaleData.scale.id) {
        throw new Error('JSON inválido: falta scale.id');
      }
      
      // Convertir a SQL
      const sql = jsonToSQL(scaleData);
      
      // Guardar SQL
      const sqlPath = path.join(seedsDir, `${scaleName}-seed.sql`);
      fs.writeFileSync(sqlPath, sql);
      
      console.log(`${colors.green}   ✅ SQL generado: ${scaleName}-seed.sql${colors.reset}`);
      exitosas++;
      
    } catch (error) {
      console.error(`${colors.red}   ❌ Error: ${error.message}${colors.reset}`);
      errores++;
    }
  }
  
  console.log(`\n${colors.green}========================================${colors.reset}`);
  console.log(`${colors.green}✅ Procesadas exitosamente: ${exitosas}${colors.reset}`);
  if (errores > 0) {
    console.log(`${colors.red}❌ Con errores: ${errores}${colors.reset}`);
  }
  
  // Preguntar si quiere aplicar las migraciones
  if (exitosas > 0) {
    console.log(`\n${colors.yellow}🔄 ¿Deseas aplicar todas las escalas a la base de datos ahora?${colors.reset}`);
    console.log(`   Ejecuta: ${colors.blue}npm run universal:migrate${colors.reset}`);
    
    // O aplicar automáticamente
    if (process.argv.includes('--auto-migrate')) {
      console.log(`\n${colors.blue}🔄 Aplicando migraciones automáticamente...${colors.reset}`);
      try {
        execSync('npm run universal:migrate', { stdio: 'inherit' });
        console.log(`${colors.green}✅ Todas las escalas han sido agregadas a la base de datos${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}❌ Error al aplicar migraciones${colors.reset}`);
      }
    }
  }
}

// Ejecutar
procesarTodasLasEscalas().catch(console.error);