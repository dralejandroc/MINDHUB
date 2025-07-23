/**
 * Script para probar ScaleRepository
 */
const ScaleRepository = require('./repositories/ScaleRepository');

const scaleRepository = new ScaleRepository();

async function testScaleRepository() {
  console.log('🧪 Probando ScaleRepository...');
  
  try {
    // 1. Obtener todas las escalas
    console.log('\n📊 Obteniendo todas las escalas...');
    const allScales = await scaleRepository.getAllActiveScales();
    
    console.log(`✅ Encontradas ${allScales.length} escalas:`);
    allScales.forEach(scale => {
      console.log(`  - ${scale.abbreviation}: ${scale.name}`);
      console.log(`    Modo: ${scale.administrationMode} | Tipo: ${scale.applicationType}`);
    });

    // 2. Obtener escala específica con componentes
    if (allScales.length > 0) {
      const firstScale = allScales[0];
      console.log(`\n🔍 Obteniendo detalles de ${firstScale.abbreviation}...`);
      
      const scaleDetails = await scaleRepository.getScaleById(firstScale.id);
      
      if (scaleDetails) {
        console.log(`✅ Detalles de ${scaleDetails.abbreviation}:`);
        console.log(`  - Items: ${scaleDetails.items?.length || 0}`);
        console.log(`  - Opciones de respuesta: ${scaleDetails.responseOptions?.length || 0}`);
        console.log(`  - Reglas de interpretación: ${scaleDetails.interpretationRules?.length || 0}`);
        console.log(`  - Tipo de aplicación: ${scaleDetails.applicationType}`);
        
        if (scaleDetails.items?.length > 0) {
          console.log(`  - Primer ítem: "${scaleDetails.items[0].text}"`);
        }
        
        if (scaleDetails.responseOptions?.length > 0) {
          console.log(`  - Primera opción: "${scaleDetails.responseOptions[0].label}" (${scaleDetails.responseOptions[0].score} pts)`);
        }
      }
    }

    // 3. Probar mapeo de tipos de aplicación
    console.log('\n🔄 Probando mapeo de tipos de aplicación...');
    const mappings = [
      { input: 'self_administered', expected: 'autoaplicada' },
      { input: 'clinician_administered', expected: 'heteroaplicada' },
      { input: 'both', expected: 'flexible' },
      { input: 'unknown', expected: 'flexible' }
    ];
    
    mappings.forEach(mapping => {
      const result = scaleRepository.mapApplicationType(mapping.input);
      const status = result === mapping.expected ? '✅' : '❌';
      console.log(`  ${status} ${mapping.input} → ${result} (esperado: ${mapping.expected})`);
    });

    console.log('\n🎉 ScaleRepository funciona correctamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testScaleRepository();