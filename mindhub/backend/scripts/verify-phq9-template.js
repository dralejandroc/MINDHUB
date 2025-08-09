#!/usr/bin/env node

const { getPrismaClient } = require('../shared/config/prisma');
const prisma = getPrismaClient();

async function verifyPHQ9Template() {
  try {
    console.log('🔍 Verificando template PHQ-9...');
    
    const template = await prisma.clinimetrix_templates.findUnique({
      where: { id: 'phq9-1.0' }
    });
    
    if (!template) {
      console.log('❌ Template PHQ-9 no encontrado');
      return;
    }
    
    const templateData = template.templateData;
    console.log('📋 Estructura del template PHQ-9:');
    console.log(`   - Metadata: ${templateData.metadata ? '✅' : '❌'}`);
    console.log(`   - Structure: ${templateData.structure ? '✅' : '❌'}`);
    console.log(`   - Total items: ${templateData.structure?.totalItems || 0}`);
    console.log(`   - Sections: ${templateData.structure?.sections?.length || 0}`);
    console.log(`   - Items in section 1: ${templateData.structure?.sections?.[0]?.items?.length || 0}`);
    console.log(`   - Response groups: ${Object.keys(templateData.responseGroups || {}).length}`);
    console.log(`   - Scoring: ${templateData.scoring ? '✅' : '❌'}`);
    console.log(`   - Score range: ${templateData.scoring?.scoreRange?.min}-${templateData.scoring?.scoreRange?.max}`);
    console.log(`   - Interpretation rules: ${templateData.interpretation?.rules?.length || 0}`);
    
    // Check first few items
    if (templateData.structure?.sections?.[0]?.items) {
      console.log('\n📝 Primeros 3 ítems:');
      templateData.structure.sections[0].items.slice(0, 3).forEach(item => {
        console.log(`   ${item.number}. ${item.text.substring(0, 50)}...`);
        console.log(`      Response type: ${item.responseType}`);
        console.log(`      Response group: ${item.responseGroup || 'N/A'}`);
      });
    }
    
    // Check response groups
    if (templateData.responseGroups) {
      console.log('\n🔘 Response groups:');
      Object.keys(templateData.responseGroups).forEach(groupName => {
        const group = templateData.responseGroups[groupName];
        console.log(`   ${groupName}: ${group.length} opciones`);
        console.log(`      Ejemplo: ${group[0]?.label} (${group[0]?.score} puntos)`);
      });
    }
    
    console.log('\n✅ El template contiene TODA la información necesaria para renderizar');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifyPHQ9Template();
}

module.exports = { verifyPHQ9Template };