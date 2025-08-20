const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Analizando datos legacy vs ClinimetrixPro...\n');
  
  // Check legacy tables
  console.log('📊 SISTEMA UNIVERSAL (LEGACY):');
  try {
    const scales = await prisma.scale.count();
    const scaleItems = await prisma.scaleItem.count();
    const scaleResponseOptions = await prisma.scaleResponseOption.count();
    const scaleSubscales = await prisma.scaleSubscale.count();
    const scaleInterpretationRules = await prisma.scaleInterpretationRule.count();
    
    console.log(`   - scales: ${scales} registros`);
    console.log(`   - scale_items: ${scaleItems} registros`);
    console.log(`   - scale_response_options: ${scaleResponseOptions} registros`);
    console.log(`   - scale_subscales: ${scaleSubscales} registros`);
    console.log(`   - scale_interpretation_rules: ${scaleInterpretationRules} registros`);
  } catch (e) {
    console.log('   ❌ Error accediendo al sistema legacy:', e.message);
  }
  
  console.log('\n📊 CLINIMETRIX PRO:');
  try {
    const templates = await prisma.clinimetrixTemplate.count();
    const registry = await prisma.clinimetrixRegistry.count();
    const assessments = await prisma.clinimetrixAssessment.count();
    
    console.log(`   - clinimetrix_templates: ${templates} registros`);
    console.log(`   - clinimetrix_registry: ${registry} registros`);
    console.log(`   - clinimetrix_assessments: ${assessments} registros`);
  } catch (e) {
    console.log('   ❌ Error accediendo a ClinimetrixPro:', e.message);
  }
  
  await prisma.$disconnect();
}

checkData();