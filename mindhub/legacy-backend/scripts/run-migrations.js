#!/usr/bin/env node

/**
 * SCRIPT DE MIGRACIÓN AUTOMÁTICA
 * Ejecuta migraciones de base de datos y seeds automáticamente
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configuración
const DB_PATH = path.join(__dirname, '../mindhub.db');
const MIGRATIONS_PATH = path.join(__dirname, '../database/migrations');
const SEEDS_PATH = path.join(__dirname, '../database/seeds');

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
 * Crear tabla de migraciones si no existe
 */
function createMigrationsTable(db) {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        success INTEGER DEFAULT 1,
        error_message TEXT
      )
    `;
    
    db.run(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Verificar si una migración ya fue ejecutada
 */
function isMigrationExecuted(db, filename) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM migrations WHERE filename = ? AND success = 1`;
    
    db.get(sql, [filename], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
}

/**
 * Marcar migración como ejecutada
 */
function markMigrationAsExecuted(db, filename, success = true, errorMessage = null) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR REPLACE INTO migrations (filename, success, error_message)
      VALUES (?, ?, ?)
    `;
    
    db.run(sql, [filename, success ? 1 : 0, errorMessage], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Ejecutar un archivo SQL
 */
function executeSqlFile(db, filePath) {
  return new Promise((resolve, reject) => {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Dividir en comandos individuales (por punto y coma)
    const commands = sql.split(';').filter(cmd => cmd.trim());
    
    let completedCommands = 0;
    
    function executeNextCommand() {
      if (completedCommands >= commands.length) {
        resolve();
        return;
      }
      
      const command = commands[completedCommands].trim();
      if (!command) {
        completedCommands++;
        executeNextCommand();
        return;
      }
      
      db.run(command, (err) => {
        if (err) {
          reject(new Error(`Error executing command ${completedCommands + 1}: ${err.message}`));
        } else {
          completedCommands++;
          executeNextCommand();
        }
      });
    }
    
    executeNextCommand();
  });
}

/**
 * Ejecutar migraciones
 */
async function runMigrations(db) {
  log.step('Ejecutando migraciones...');
  
  if (!fs.existsSync(MIGRATIONS_PATH)) {
    log.warning('Directorio de migraciones no encontrado');
    return;
  }
  
  const migrationFiles = fs.readdirSync(MIGRATIONS_PATH)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (migrationFiles.length === 0) {
    log.info('No hay migraciones para ejecutar');
    return;
  }
  
  for (const filename of migrationFiles) {
    const filePath = path.join(MIGRATIONS_PATH, filename);
    
    try {
      const alreadyExecuted = await isMigrationExecuted(db, filename);
      
      if (alreadyExecuted) {
        log.info(`Migración ${filename} ya ejecutada - omitiendo`);
        continue;
      }
      
      log.step(`Ejecutando migración: ${filename}`);
      await executeSqlFile(db, filePath);
      await markMigrationAsExecuted(db, filename, true);
      log.success(`Migración ${filename} ejecutada exitosamente`);
      
    } catch (error) {
      log.error(`Error en migración ${filename}: ${error.message}`);
      await markMigrationAsExecuted(db, filename, false, error.message);
      throw error;
    }
  }
  
  log.success(`${migrationFiles.length} migraciones procesadas`);
}

/**
 * Ejecutar seeds
 */
async function runSeeds(db) {
  log.step('Ejecutando seeds...');
  
  if (!fs.existsSync(SEEDS_PATH)) {
    log.warning('Directorio de seeds no encontrado');
    return;
  }
  
  const seedFiles = fs.readdirSync(SEEDS_PATH)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (seedFiles.length === 0) {
    log.info('No hay seeds para ejecutar');
    return;
  }
  
  for (const filename of seedFiles) {
    const filePath = path.join(SEEDS_PATH, filename);
    
    try {
      // Para seeds, verificamos si ya hay datos
      const scaleId = filename.replace('-seed.sql', '');
      const existingData = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM scales WHERE id = ?', [scaleId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (existingData) {
        log.info(`Seed ${filename} ya aplicado (escala ${scaleId} existe) - omitiendo`);
        continue;
      }
      
      log.step(`Ejecutando seed: ${filename}`);
      await executeSqlFile(db, filePath);
      log.success(`Seed ${filename} ejecutado exitosamente`);
      
    } catch (error) {
      log.error(`Error en seed ${filename}: ${error.message}`);
      // Los seeds no son críticos, continuamos
    }
  }
  
  log.success(`${seedFiles.length} seeds procesados`);
}

/**
 * Verificar estructura de la base de datos
 */
async function verifyDatabaseStructure(db) {
  log.step('Verificando estructura de la base de datos...');
  
  const requiredTables = [
    'scales',
    'scale_items',
    'scale_response_options',
    'scale_interpretation_rules',
    'scale_subscales',
    'assessments',
    'assessment_responses',
    'assessment_subscale_results'
  ];
  
  for (const tableName of requiredTables) {
    const tableExists = await new Promise((resolve, reject) => {
      db.get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
    
    if (tableExists) {
      log.success(`✓ Tabla ${tableName} existe`);
    } else {
      log.error(`✗ Tabla ${tableName} NO existe`);
      throw new Error(`Tabla requerida ${tableName} no encontrada`);
    }
  }
  
  log.success('Estructura de base de datos verificada');
}

/**
 * Mostrar estadísticas de la base de datos
 */
async function showDatabaseStats(db) {
  log.step('Estadísticas de la base de datos:');
  
  const stats = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        (SELECT COUNT(*) FROM scales) as total_scales,
        (SELECT COUNT(*) FROM scale_items) as total_items,
        (SELECT COUNT(*) FROM scale_response_options) as total_response_options,
        (SELECT COUNT(*) FROM scale_interpretation_rules) as total_interpretation_rules,
        (SELECT COUNT(*) FROM assessments) as total_assessments
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows[0]);
    });
  });
  
  console.log(`
${colors.cyan}╔═══════════════════════════════╗${colors.reset}
${colors.cyan}║       ESTADÍSTICAS DB         ║${colors.reset}
${colors.cyan}╠═══════════════════════════════╣${colors.reset}
${colors.cyan}║${colors.reset} Escalas:             ${stats.total_scales.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}║${colors.reset} Ítems:               ${stats.total_items.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}║${colors.reset} Opciones respuesta:  ${stats.total_response_options.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}║${colors.reset} Reglas interpretación: ${stats.total_interpretation_rules.toString().padStart(5)} ${colors.cyan}║${colors.reset}
${colors.cyan}║${colors.reset} Evaluaciones:        ${stats.total_assessments.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}╚═══════════════════════════════╝${colors.reset}
  `);
}

/**
 * Función principal
 */
async function main() {
  console.log(`
${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}
${colors.blue}║          MIGRACIÓN AUTOMÁTICA MINDHUB          ║${colors.reset}
${colors.blue}║         Sistema Universal de Escalas          ║${colors.reset}
${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}
  `);
  
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      return;
    }
    // Habilitar foreign keys en SQLite
    db.run('PRAGMA foreign_keys = ON');
  });
  
  try {
    // Crear tabla de migraciones
    await createMigrationsTable(db);
    
    // Ejecutar migraciones
    await runMigrations(db);
    
    // Verificar estructura
    await verifyDatabaseStructure(db);
    
    // Ejecutar seeds
    await runSeeds(db);
    
    // Mostrar estadísticas
    await showDatabaseStats(db);
    
    log.success('¡Migración completa exitosa!');
    
  } catch (error) {
    log.error(`Error durante la migración: ${error.message}`);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };