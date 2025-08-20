#!/usr/bin/env node

/**
 * HERRAMIENTAS DE DESARROLLO PARA MINDHUB
 * Script unificado para operaciones comunes de desarrollo
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.blue}[STEP]${colors.reset} ${msg}`)
};

/**
 * Ejecutar comando de manera asíncrona
 */
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { 
      stdio: 'inherit',
      shell: true 
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    proc.on('error', reject);
  });
}

/**
 * Mostrar menú principal
 */
function showMainMenu() {
  console.log(`
${colors.magenta}╔════════════════════════════════════════════════╗${colors.reset}
${colors.magenta}║              MINDHUB DEV TOOLS                 ║${colors.reset}
${colors.magenta}║          Herramientas de Desarrollo            ║${colors.reset}
${colors.magenta}╚════════════════════════════════════════════════╝${colors.reset}

${colors.blue}Base de datos:${colors.reset}
  1. migrate        - Ejecutar migraciones y seeds
  2. reset-db       - Resetear base de datos completa
  3. db-stats       - Mostrar estadísticas de BD
  
${colors.blue}Escalas:${colors.reset}
  4. add-scale      - Crear nueva escala
  5. list-scales    - Listar escalas existentes
  6. validate-scale - Validar escala específica
  
${colors.blue}Desarrollo:${colors.reset}
  7. start-dev      - Iniciar servidor de desarrollo
  8. test-api       - Probar endpoints API
  9. backup-db      - Hacer backup de la BD
  
${colors.blue}Utilidades:${colors.reset}
  10. logs          - Ver logs del servidor
  11. clean         - Limpiar archivos temporales
  12. help          - Mostrar ayuda detallada

${colors.yellow}Uso: node dev-tools.js <comando> [argumentos]${colors.reset}
${colors.yellow}Ejemplo: node dev-tools.js migrate${colors.reset}
  `);
}

/**
 * Ejecutar migración
 */
async function runMigration() {
  log.step('Ejecutando migraciones...');
  try {
    await runCommand('node', [path.join(__dirname, 'run-migrations.js')]);
    log.success('Migraciones completadas');
  } catch (error) {
    log.error(`Error en migraciones: ${error.message}`);
  }
}

/**
 * Resetear base de datos
 */
async function resetDatabase() {
  log.step('Reseteando base de datos...');
  try {
    await runCommand('node', [path.join(__dirname, 'reset-database.js')]);
    log.success('Base de datos reseteada');
  } catch (error) {
    log.error(`Error reseteando BD: ${error.message}`);
  }
}

/**
 * Mostrar estadísticas de BD
 */
async function showDbStats() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, '../mindhub.db');
  
  if (!fs.existsSync(dbPath)) {
    log.error('Base de datos no encontrada. Ejecuta migrate primero.');
    return;
  }
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          (SELECT COUNT(*) FROM scales WHERE is_active = 1) as active_scales,
          (SELECT COUNT(*) FROM scales WHERE is_active = 0) as inactive_scales,
          (SELECT COUNT(*) FROM scale_items) as total_items,
          (SELECT COUNT(*) FROM scale_response_options) as total_response_options,
          (SELECT COUNT(*) FROM scale_interpretation_rules) as total_interpretation_rules,
          (SELECT COUNT(*) FROM assessments) as total_assessments,
          (SELECT COUNT(*) FROM assessment_responses) as total_responses
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });
    
    console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}
${colors.cyan}║                     ESTADÍSTICAS DB                      ║${colors.reset}
${colors.cyan}╠══════════════════════════════════════════════════════════╣${colors.reset}
${colors.cyan}║${colors.reset} Escalas activas:        ${stats.active_scales.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}║${colors.reset} Escalas inactivas:      ${stats.inactive_scales.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}║${colors.reset} Ítems totales:          ${stats.total_items.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}║${colors.reset} Opciones de respuesta:  ${stats.total_response_options.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}║${colors.reset} Reglas interpretación:  ${stats.total_interpretation_rules.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}║${colors.reset} Evaluaciones:           ${stats.total_assessments.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}║${colors.reset} Respuestas:             ${stats.total_responses.toString().padStart(8)} ${colors.cyan}║${colors.reset}
${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}
    `);
    
  } catch (error) {
    log.error(`Error obteniendo estadísticas: ${error.message}`);
  } finally {
    db.close();
  }
}

/**
 * Crear nueva escala
 */
async function addScale(scaleId, action = 'template') {
  if (!scaleId) {
    log.error('Debes especificar el ID de la escala');
    log.info('Ejemplo: node dev-tools.js add-scale gad7');
    return;
  }
  
  log.step(`Creando escala: ${scaleId}`);
  try {
    const actionFlag = action === 'generate' ? '--generate' : '--template';
    await runCommand('node', [path.join(__dirname, 'add-scale.js'), scaleId, actionFlag]);
    log.success(`Escala ${scaleId} procesada con ${action}`);
  } catch (error) {
    log.error(`Error creando escala: ${error.message}`);
  }
}

/**
 * Listar escalas existentes
 */
async function listScales() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, '../mindhub.db');
  
  if (!fs.existsSync(dbPath)) {
    log.error('Base de datos no encontrada. Ejecuta migrate primero.');
    return;
  }
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    const scales = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id, name, abbreviation, category, total_items, 
          estimated_duration_minutes, is_active,
          created_at
        FROM scales 
        ORDER BY category, name
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`\n${colors.cyan}ESCALAS DISPONIBLES:${colors.reset}`);
    console.log(`${colors.cyan}${'ID'.padEnd(15)} ${'Nombre'.padEnd(30)} ${'Items'.padEnd(6)} ${'Duración'.padEnd(9)} ${'Estado'.padEnd(8)} ${'Categoría'}${colors.reset}`);
    console.log(`${colors.cyan}${'-'.repeat(80)}${colors.reset}`);
    
    scales.forEach(scale => {
      const status = scale.is_active ? `${colors.green}Activa${colors.reset}` : `${colors.red}Inactiva${colors.reset}`;
      console.log(`${scale.id.padEnd(15)} ${scale.name.padEnd(30)} ${scale.total_items.toString().padEnd(6)} ${scale.estimated_duration_minutes.toString().padEnd(9)} ${status.padEnd(15)} ${scale.category}`);
    });
    
    console.log(`\n${colors.cyan}Total: ${scales.length} escalas${colors.reset}`);
    
  } catch (error) {
    log.error(`Error listando escalas: ${error.message}`);
  } finally {
    db.close();
  }
}

/**
 * Iniciar servidor de desarrollo
 */
async function startDev() {
  log.step('Iniciando servidor de desarrollo...');
  try {
    await runCommand('node', [path.join(__dirname, '../server-dev.js')]);
  } catch (error) {
    log.error(`Error iniciando servidor: ${error.message}`);
  }
}

/**
 * Probar API
 */
async function testApi() {
  log.step('Probando endpoints API...');
  try {
    await runCommand('node', [path.join(__dirname, '../test-api.js')]);
  } catch (error) {
    log.error(`Error probando API: ${error.message}`);
  }
}

/**
 * Hacer backup de BD
 */
async function backupDb() {
  const dbPath = path.join(__dirname, '../mindhub.db');
  const backupPath = path.join(__dirname, `../backups/mindhub-backup-${Date.now()}.db`);
  
  // Crear directorio de backups
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  if (!fs.existsSync(dbPath)) {
    log.error('Base de datos no encontrada');
    return;
  }
  
  try {
    fs.copyFileSync(dbPath, backupPath);
    log.success(`Backup creado: ${backupPath}`);
  } catch (error) {
    log.error(`Error creando backup: ${error.message}`);
  }
}

/**
 * Limpiar archivos temporales
 */
async function clean() {
  log.step('Limpiando archivos temporales...');
  
  const tempDirs = [
    path.join(__dirname, '../tmp'),
    path.join(__dirname, '../logs'),
    path.join(__dirname, '../node_modules/.cache')
  ];
  
  for (const dir of tempDirs) {
    if (fs.existsSync(dir)) {
      try {
        await runCommand('rm', ['-rf', dir]);
        log.success(`Limpiado: ${dir}`);
      } catch (error) {
        log.warning(`No se pudo limpiar: ${dir}`);
      }
    }
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showMainMenu();
    return;
  }
  
  const command = args[0];
  const extraArgs = args.slice(1);
  
  try {
    switch (command) {
      case 'migrate':
        await runMigration();
        break;
        
      case 'reset-db':
        await resetDatabase();
        break;
        
      case 'db-stats':
        await showDbStats();
        break;
        
      case 'add-scale':
        await addScale(extraArgs[0], extraArgs[1]);
        break;
        
      case 'list-scales':
        await listScales();
        break;
        
      case 'start-dev':
        await startDev();
        break;
        
      case 'test-api':
        await testApi();
        break;
        
      case 'backup-db':
        await backupDb();
        break;
        
      case 'clean':
        await clean();
        break;
        
      case 'help':
        showMainMenu();
        break;
        
      default:
        log.error(`Comando no reconocido: ${command}`);
        showMainMenu();
    }
    
  } catch (error) {
    log.error(`Error ejecutando comando: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };