#!/usr/bin/env node

/**
 * SCRIPT DE PRUEBA PARA EL SISTEMA UNIVERSAL DE ESCALAS
 * Prueba los endpoints principales sin necesidad de servidor
 */

const ScaleRepository = require('./repositories/ScaleRepository');
const UniversalScaleService = require('./services/UniversalScaleService');
const ScaleCalculatorService = require('./services/ScaleCalculatorService');

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
  test: (msg) => console.log(`${colors.blue}[TEST]${colors.reset} ${msg}`)
};

async function testUniversalSystem() {
  console.log(`
${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}
${colors.blue}║    PRUEBA DEL SISTEMA UNIVERSAL DE ESCALAS    ║${colors.reset}
${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}
  `);

  const scaleRepository = new ScaleRepository();
  const scaleService = new UniversalScaleService();
  const calculatorService = new ScaleCalculatorService();

  try {
    // Test 1: Listar todas las escalas
    log.test('1. Listando todas las escalas...');
    const scales = await scaleService.getAllScales();
    log.success(`${scales.length} escalas encontradas:`);
    scales.forEach(scale => {
      console.log(`   - ${scale.id}: ${scale.name} (${scale.totalItems} ítems)`);
    });
    console.log();

    // Test 2: Obtener escala específica (RADS-2)
    log.test('2. Obteniendo detalles de RADS-2...');
    const rads2 = await scaleService.getScaleById('rads-2');
    if (rads2) {
      log.success('RADS-2 cargado exitosamente:');
      console.log(`   - Nombre: ${rads2.name}`);
      console.log(`   - Items: ${rads2.items.length}`);
      console.log(`   - Opciones de respuesta: ${rads2.responseOptions.length}`);
      console.log(`   - Reglas de interpretación: ${rads2.interpretationRules?.length || 0}`);
    }
    console.log();

    // Test 3: Procesar una evaluación de ejemplo con RADS-2
    log.test('3. Procesando evaluación de ejemplo con alertas...');
    const mockResponses = [
      { itemNumber: 1, value: '4', label: 'La mayoría del tiempo', score: 4 },
      { itemNumber: 2, value: '3', label: 'A veces', score: 3 },
      { itemNumber: 3, value: '4', label: 'La mayoría del tiempo', score: 4 },
      { itemNumber: 4, value: '2', label: 'Pocas veces', score: 2 },
      { itemNumber: 5, value: '4', label: 'La mayoría del tiempo', score: 4 },
      { itemNumber: 6, value: '3', label: 'A veces', score: 3 },
      { itemNumber: 7, value: '2', label: 'Pocas veces', score: 2 },
      { itemNumber: 8, value: '1', label: 'Casi nunca', score: 1 },
      { itemNumber: 9, value: '3', label: 'A veces', score: 3 },
      { itemNumber: 10, value: '4', label: 'La mayoría del tiempo', score: 4 }
    ];

    const results = await scaleService.processAssessment('rads-2', mockResponses);
    log.success('Evaluación procesada:');
    console.log(`   - Puntuación total: ${results.totalScore}`);
    console.log(`   - Severidad: ${results.interpretation.severity}`);
    console.log(`   - Interpretación: ${results.interpretation.label}`);
    console.log(`   - Descripción: ${results.interpretation.description}`);
    
    if (results.alerts && results.alerts.length > 0) {
      console.log(`   - Alertas generadas (${results.alerts.length}):`);
      results.alerts.forEach((alert, index) => {
        console.log(`     ${index + 1}. [${alert.severity.toUpperCase()}] ${alert.message}`);
        if (alert.type === 'grouped_high_scores' && alert.affectedItems) {
          console.log(`        Ítems afectados: ${alert.affectedItems.join(', ')}`);
        } else if (alert.itemNumber) {
          console.log(`        Ítem: ${alert.itemNumber}`);
        }
      });
    } else {
      console.log('   - Sin alertas generadas');
    }
    console.log();

    // Test 4: Buscar escalas
    log.test('4. Buscando escalas por categoría...');
    const anxietyScales = await scaleService.getScalesByCategory('ansiedad');
    log.success(`${anxietyScales.length} escalas de ansiedad encontradas`);
    console.log();

    // Test 5: Validar completitud de escala
    log.test('5. Validando completitud de escalas...');
    for (const scale of scales) {
      const validation = await scaleService.validateScaleCompleteness(scale.id);
      const status = validation.isValid ? '✅' : '❌';
      console.log(`   ${status} ${scale.id}: ${validation.isValid ? 'Válida' : 'Inválida'}`);
      if (!validation.isValid) {
        validation.errors.forEach(error => console.log(`      - ${error}`));
      }
    }
    console.log();

    // Test 6: Estadísticas de base de datos
    log.test('6. Estadísticas de base de datos...');
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, 'mindhub.db');
    const db = new sqlite3.Database(dbPath);
    
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          (SELECT COUNT(*) FROM scales WHERE is_active = 1) as active_scales,
          (SELECT COUNT(*) FROM scale_items) as total_items,
          (SELECT COUNT(*) FROM scale_response_options) as total_response_options,
          (SELECT COUNT(*) FROM scale_interpretation_rules) as total_interpretation_rules,
          (SELECT COUNT(*) FROM assessments) as total_assessments
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });
    
    db.close();
    
    log.success('Estadísticas:');
    console.log(`   - Escalas activas: ${stats.active_scales}`);
    console.log(`   - Items totales: ${stats.total_items}`);
    console.log(`   - Opciones de respuesta: ${stats.total_response_options}`);
    console.log(`   - Reglas de interpretación: ${stats.total_interpretation_rules}`);
    console.log(`   - Evaluaciones guardadas: ${stats.total_assessments}`);
    console.log();

    log.success('✅ Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    log.error(`Error durante las pruebas: ${error.message}`);
    console.error(error);
  }
}

// Ejecutar pruebas
testUniversalSystem();