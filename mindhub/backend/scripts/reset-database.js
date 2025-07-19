#!/usr/bin/env node

/**
 * SCRIPT DE RESET DE BASE DE DATOS
 * Elimina la base de datos actual y la recrea desde cero
 */

const fs = require('fs');
const path = require('path');
const { main: runMigrations } = require('./run-migrations');

// Configuración
const DB_PATH = path.join(__dirname, '../mindhub.db');

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
 * Confirmar acción con el usuario
 */
function confirmAction() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`${colors.yellow}¿Estás seguro de que deseas ELIMINAR la base de datos actual? (y/N): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Función principal
 */
async function main() {
  console.log(`
${colors.red}╔════════════════════════════════════════════════╗${colors.reset}
${colors.red}║              RESET BASE DE DATOS               ║${colors.reset}
${colors.red}║         ⚠️  OPERACIÓN DESTRUCTIVA  ⚠️         ║${colors.reset}
${colors.red}╚════════════════════════════════════════════════╝${colors.reset}
  `);
  
  try {
    // Verificar si existe la base de datos
    if (fs.existsSync(DB_PATH)) {
      log.info(`Base de datos encontrada en: ${DB_PATH}`);
      
      // Solicitar confirmación
      const confirmed = await confirmAction();
      
      if (!confirmed) {
        log.info('Operación cancelada por el usuario');
        return;
      }
      
      // Eliminar base de datos
      log.step('Eliminando base de datos actual...');
      fs.unlinkSync(DB_PATH);
      log.success('Base de datos eliminada');
      
    } else {
      log.info('No se encontró base de datos existente');
    }
    
    // Recrear base de datos
    log.step('Recreando base de datos...');
    await runMigrations();
    
    log.success('¡Base de datos recreada exitosamente!');
    
  } catch (error) {
    log.error(`Error durante el reset: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };