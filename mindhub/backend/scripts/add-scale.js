#!/usr/bin/env node

/**
 * SCRIPT PARA AGREGAR NUEVAS ESCALAS
 * Genera seeds SQL a partir de definiciones JSON
 */

const fs = require('fs');
const path = require('path');

// Configuración
const SEEDS_PATH = path.join(__dirname, '../database/seeds');
const TEMPLATES_PATH = path.join(__dirname, '../database/templates');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.blue}[STEP]${colors.reset} ${msg}`)
};

/**
 * Generar SQL seed a partir de definición JSON
 */
function generateSeedSQL(scaleData) {
  const { scale, items, responseOptions, interpretationRules, subscales } = scaleData;
  
  let sql = `-- SEED PARA ESCALA: ${scale.name}\n`;
  sql += `-- Generado automáticamente el ${new Date().toISOString()}\n\n`;
  
  // INSERT para la escala principal
  sql += `-- Insertar escala principal\n`;
  sql += `INSERT INTO scales (\n`;
  sql += `  id, name, abbreviation, version, category, subcategory,\n`;
  sql += `  description, author, year_published, estimated_duration_minutes,\n`;
  sql += `  administration_mode, target_population, total_items, scoring_method,\n`;
  sql += `  score_min, score_max, is_active, created_at\n`;
  sql += `) VALUES (\n`;
  sql += `  '${scale.id}',\n`;
  sql += `  '${scale.name}',\n`;
  sql += `  '${scale.abbreviation}',\n`;
  sql += `  '${scale.version || '1.0'}',\n`;
  sql += `  '${scale.category}',\n`;
  sql += `  ${scale.subcategory ? `'${scale.subcategory}'` : 'NULL'},\n`;
  sql += `  '${scale.description}',\n`;
  sql += `  ${scale.author ? `'${scale.author}'` : 'NULL'},\n`;
  sql += `  ${scale.yearPublished || 'NULL'},\n`;
  sql += `  ${scale.estimatedDurationMinutes},\n`;
  sql += `  '${scale.administrationMode}',\n`;
  sql += `  '${scale.targetPopulation}',\n`;
  sql += `  ${scale.totalItems},\n`;
  sql += `  '${scale.scoringMethod}',\n`;
  sql += `  ${scale.scoreMin},\n`;
  sql += `  ${scale.scoreMax},\n`;
  sql += `  1,\n`;
  sql += `  CURRENT_TIMESTAMP\n`;
  sql += `);\n\n`;
  
  // INSERT para opciones de respuesta
  if (responseOptions && responseOptions.length > 0) {
    sql += `-- Insertar opciones de respuesta\n`;
    responseOptions.forEach(option => {
      sql += `INSERT INTO scale_response_options (\n`;
      sql += `  id, scale_id, value, label, score, order_index\n`;
      sql += `) VALUES (\n`;
      sql += `  '${option.id}',\n`;
      sql += `  '${scale.id}',\n`;
      sql += `  '${option.value}',\n`;
      sql += `  '${option.label}',\n`;
      sql += `  ${option.score},\n`;
      sql += `  ${option.orderIndex}\n`;
      sql += `);\n\n`;
    });
  }
  
  // INSERT para ítems
  if (items && items.length > 0) {
    sql += `-- Insertar ítems\n`;
    items.forEach(item => {
      sql += `INSERT INTO scale_items (\n`;
      sql += `  id, scale_id, item_number, text, subscale_id,\n`;
      sql += `  reverse_scored, alert_trigger, alert_condition, comments\n`;
      sql += `) VALUES (\n`;
      sql += `  '${item.id}',\n`;
      sql += `  '${scale.id}',\n`;
      sql += `  ${item.number},\n`;
      sql += `  '${item.text}',\n`;
      sql += `  ${item.subscaleId ? `'${item.subscaleId}'` : 'NULL'},\n`;
      sql += `  ${item.reverseScored ? 1 : 0},\n`;
      sql += `  ${item.alertTrigger ? 1 : 0},\n`;
      sql += `  ${item.alertCondition ? `'${item.alertCondition}'` : 'NULL'},\n`;
      sql += `  ${item.comments ? `'${item.comments}'` : 'NULL'}\n`;
      sql += `);\n\n`;
    });
  }
  
  // INSERT para reglas de interpretación
  if (interpretationRules && interpretationRules.length > 0) {
    sql += `-- Insertar reglas de interpretación\n`;
    interpretationRules.forEach(rule => {
      sql += `INSERT INTO scale_interpretation_rules (\n`;
      sql += `  id, scale_id, min_score, max_score, severity_level,\n`;
      sql += `  interpretation_label, color_code, description, recommendations\n`;
      sql += `) VALUES (\n`;
      sql += `  '${rule.id}',\n`;
      sql += `  '${scale.id}',\n`;
      sql += `  ${rule.minScore},\n`;
      sql += `  ${rule.maxScore},\n`;
      sql += `  '${rule.severityLevel}',\n`;
      sql += `  '${rule.label}',\n`;
      sql += `  '${rule.color}',\n`;
      sql += `  ${rule.description ? `'${rule.description}'` : 'NULL'},\n`;
      sql += `  ${rule.recommendations ? `'${rule.recommendations}'` : 'NULL'}\n`;
      sql += `);\n\n`;
    });
  }
  
  // INSERT para subescalas
  if (subscales && subscales.length > 0) {
    sql += `-- Insertar subescalas\n`;
    subscales.forEach(subscale => {
      sql += `INSERT INTO scale_subscales (\n`;
      sql += `  id, scale_id, subscale_name, subscale_code,\n`;
      sql += `  min_score, max_score, description\n`;
      sql += `) VALUES (\n`;
      sql += `  '${subscale.id}',\n`;
      sql += `  '${scale.id}',\n`;
      sql += `  '${subscale.name}',\n`;
      sql += `  '${subscale.code}',\n`;
      sql += `  ${subscale.minScore || 0},\n`;
      sql += `  ${subscale.maxScore || 0},\n`;
      sql += `  ${subscale.description ? `'${subscale.description}'` : 'NULL'}\n`;
      sql += `);\n\n`;
    });
  }
  
  return sql;
}

/**
 * Crear template JSON para una nueva escala
 */
function createScaleTemplate(scaleId) {
  const template = {
    scale: {
      id: scaleId,
      name: "Nombre de la Escala",
      abbreviation: "ESC",
      version: "1.0",
      category: "categoria",
      subcategory: "subcategoria",
      description: "Descripción de la escala",
      author: "Autor",
      yearPublished: 2024,
      estimatedDurationMinutes: 10,
      administrationMode: "self_administered",
      targetPopulation: "adultos",
      totalItems: 5,
      scoringMethod: "sum",
      scoreMin: 0,
      scoreMax: 20
    },
    responseOptions: [
      {
        id: `${scaleId}-opt-0`,
        value: "0",
        label: "Nunca",
        score: 0,
        orderIndex: 1
      },
      {
        id: `${scaleId}-opt-1`,
        value: "1",
        label: "A veces",
        score: 1,
        orderIndex: 2
      },
      {
        id: `${scaleId}-opt-2`,
        value: "2",
        label: "Frecuentemente",
        score: 2,
        orderIndex: 3
      },
      {
        id: `${scaleId}-opt-3`,
        value: "3",
        label: "Casi siempre",
        score: 3,
        orderIndex: 4
      }
    ],
    items: [
      {
        id: `${scaleId}-item-1`,
        number: 1,
        text: "Pregunta 1",
        subscaleId: null,
        reverseScored: false,
        alertTrigger: false,
        alertCondition: null,
        comments: null
      },
      {
        id: `${scaleId}-item-2`,
        number: 2,
        text: "Pregunta 2",
        subscaleId: null,
        reverseScored: false,
        alertTrigger: false,
        alertCondition: null,
        comments: null
      },
      {
        id: `${scaleId}-item-3`,
        number: 3,
        text: "Pregunta 3",
        subscaleId: null,
        reverseScored: false,
        alertTrigger: false,
        alertCondition: null,
        comments: null
      },
      {
        id: `${scaleId}-item-4`,
        number: 4,
        text: "Pregunta 4",
        subscaleId: null,
        reverseScored: false,
        alertTrigger: false,
        alertCondition: null,
        comments: null
      },
      {
        id: `${scaleId}-item-5`,
        number: 5,
        text: "Pregunta 5",
        subscaleId: null,
        reverseScored: false,
        alertTrigger: true,
        alertCondition: "score >= 2",
        comments: "Ítem crítico"
      }
    ],
    interpretationRules: [
      {
        id: `${scaleId}-int-minimal`,
        minScore: 0,
        maxScore: 4,
        severityLevel: "minimal",
        label: "Mínimo",
        color: "#27AE60",
        description: "Nivel mínimo",
        recommendations: "Mantener seguimiento rutinario"
      },
      {
        id: `${scaleId}-int-mild`,
        minScore: 5,
        maxScore: 9,
        severityLevel: "mild",
        label: "Leve",
        color: "#F39C12",
        description: "Nivel leve",
        recommendations: "Considerar intervención preventiva"
      },
      {
        id: `${scaleId}-int-moderate`,
        minScore: 10,
        maxScore: 14,
        severityLevel: "moderate",
        label: "Moderado",
        color: "#E67E22",
        description: "Nivel moderado",
        recommendations: "Intervención recomendada"
      },
      {
        id: `${scaleId}-int-severe`,
        minScore: 15,
        maxScore: 20,
        severityLevel: "severe",
        label: "Severo",
        color: "#E74C3C",
        description: "Nivel severo",
        recommendations: "Intervención urgente requerida"
      }
    ],
    subscales: []
  };
  
  return template;
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}
${colors.blue}║           AGREGAR NUEVA ESCALA                 ║${colors.reset}
${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}

Uso:
  node add-scale.js <scale-id>              # Crear template JSON
  node add-scale.js <scale-id> --generate   # Generar SQL desde JSON
  node add-scale.js <scale-id> --template   # Crear template (default)

Ejemplos:
  node add-scale.js gad7 --template
  node add-scale.js gad7 --generate
    `);
    return;
  }
  
  const scaleId = args[0];
  const action = args[1] || '--template';
  
  // Crear directorios si no existen
  if (!fs.existsSync(TEMPLATES_PATH)) {
    fs.mkdirSync(TEMPLATES_PATH, { recursive: true });
  }
  
  if (!fs.existsSync(SEEDS_PATH)) {
    fs.mkdirSync(SEEDS_PATH, { recursive: true });
  }
  
  try {
    if (action === '--template') {
      // Crear template JSON
      const templatePath = path.join(TEMPLATES_PATH, `${scaleId}.json`);
      
      if (fs.existsSync(templatePath)) {
        log.warning(`Template ya existe: ${templatePath}`);
        return;
      }
      
      const template = createScaleTemplate(scaleId);
      fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
      
      log.success(`Template creado: ${templatePath}`);
      log.info('Edita el archivo JSON y luego ejecuta con --generate');
      
    } else if (action === '--generate') {
      // Generar SQL desde JSON
      const templatePath = path.join(TEMPLATES_PATH, `${scaleId}.json`);
      const seedPath = path.join(SEEDS_PATH, `${scaleId}-seed.sql`);
      
      if (!fs.existsSync(templatePath)) {
        log.error(`Template no encontrado: ${templatePath}`);
        log.info('Ejecuta primero con --template para crear el template');
        return;
      }
      
      log.step(`Leyendo template: ${templatePath}`);
      const scaleData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      
      log.step(`Generando SQL seed...`);
      const sql = generateSeedSQL(scaleData);
      
      fs.writeFileSync(seedPath, sql);
      log.success(`SQL seed generado: ${seedPath}`);
      log.info('Ejecuta run-migrations.js para aplicar los cambios');
      
    } else {
      log.error(`Acción no válida: ${action}`);
      log.info('Usa --template o --generate');
    }
    
  } catch (error) {
    log.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, createScaleTemplate, generateSeedSQL };