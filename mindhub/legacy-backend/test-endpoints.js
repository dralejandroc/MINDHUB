#!/usr/bin/env node

/**
 * TEST DE ENDPOINTS DEL SISTEMA UNIVERSAL
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🧪 Probando endpoints del sistema universal...\n');

  try {
    // Test 1: Health check
    console.log('1. Health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('   ✅ Status:', health.data.status);
    console.log('   ✅ System:', health.data.system);
    console.log();

    // Test 2: List all scales
    console.log('2. Listando todas las escalas...');
    const scales = await axios.get(`${BASE_URL}/api/scales`);
    console.log('   ✅ Escalas encontradas:', scales.data.count);
    scales.data.data.forEach(scale => {
      console.log(`   - ${scale.id}: ${scale.name} (${scale.totalItems} items)`);
    });
    console.log();

    // Test 3: Get PHQ-9 details
    console.log('3. Detalles de PHQ-9...');
    const phq9 = await axios.get(`${BASE_URL}/api/scales/phq-9`);
    console.log('   ✅ Nombre:', phq9.data.data.name);
    console.log('   ✅ Items:', phq9.data.data.items.length);
    console.log('   ✅ Opciones de respuesta:', phq9.data.data.responseOptions.length);
    console.log();

    // Test 4: Process assessment
    console.log('4. Procesando evaluación...');
    const responses = [
      { itemNumber: 1, value: '2', label: 'Más de la mitad de los días', score: 2 },
      { itemNumber: 2, value: '1', label: 'Varios días', score: 1 },
      { itemNumber: 3, value: '2', label: 'Más de la mitad de los días', score: 2 },
      { itemNumber: 4, value: '3', label: 'Casi todos los días', score: 3 },
      { itemNumber: 5, value: '1', label: 'Varios días', score: 1 },
      { itemNumber: 6, value: '2', label: 'Más de la mitad de los días', score: 2 },
      { itemNumber: 7, value: '1', label: 'Varios días', score: 1 },
      { itemNumber: 8, value: '0', label: 'Nunca', score: 0 },
      { itemNumber: 9, value: '0', label: 'Nunca', score: 0 }
    ];

    const assessment = await axios.post(`${BASE_URL}/api/scales/phq-9/process`, {
      responses: responses
    });
    
    console.log('   ✅ Puntuación total:', assessment.data.data.totalScore);
    console.log('   ✅ Severidad:', assessment.data.data.interpretation.severity);
    console.log('   ✅ Interpretación:', assessment.data.data.interpretation.label);
    console.log();

    // Test 5: Database stats
    console.log('5. Estadísticas de base de datos...');
    const dbStats = await axios.get(`${BASE_URL}/api/test/db-stats`);
    console.log('   ✅ Escalas:', dbStats.data.stats.scales);
    console.log('   ✅ Items:', dbStats.data.stats.items);
    console.log('   ✅ Opciones de respuesta:', dbStats.data.stats.response_options);
    console.log('   ✅ Reglas de interpretación:', dbStats.data.stats.interpretation_rules);
    console.log();

    console.log('🎉 ¡Todos los tests pasaron exitosamente!');
    console.log();
    console.log('📋 URLs para probar en el navegador:');
    console.log(`   🏠 Home: ${BASE_URL}/`);
    console.log(`   ❤️  Health: ${BASE_URL}/health`);
    console.log(`   📊 Scales: ${BASE_URL}/api/scales`);
    console.log(`   🧠 PHQ-9: ${BASE_URL}/api/scales/phq-9`);
    console.log(`   📈 DB Stats: ${BASE_URL}/api/test/db-stats`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testEndpoints();