/**
 * Test Script for ClinimetrixPro Template Validator
 * Tests validation of existing templates and schema compliance
 */

const TemplateValidator = require('../shared/validators/TemplateValidator');
const { PrismaClient } = require('../generated/prisma');

async function testTemplateValidator() {
  console.log('🧪 Testing ClinimetrixPro Template Validator\n');
  
  const validator = new TemplateValidator();
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Validate all templates in database
    console.log('📋 Test 1: Validating all templates in database...');
    
    const templates = await prisma.clinimetrixTemplate.findMany({
      where: { isActive: true }
    });
    
    console.log(`Found ${templates.length} active templates`);
    
    if (templates.length === 0) {
      console.log('⚠️ No active templates found in database');
      return;
    }
    
    // Validate each template individually for detailed results
    console.log('\n📊 Individual Template Validation Results:');
    console.log('================================================');
    
    for (const template of templates) {
      const templateData = template.templateData;
      const validation = validator.validateTemplate(templateData);
      const summary = validator.getValidationSummary(templateData);
      
      console.log(`\n🔍 Template: ${templateData.metadata?.name || 'Unknown'} (${templateData.metadata?.id || template.id})`);
      console.log(`   Status: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   Score: ${summary.validationScore}/100`);
      console.log(`   Errors: ${summary.errorCount} | Warnings: ${summary.warningCount} | Critical: ${summary.criticalErrorCount}`);
      
      if (summary.recommendations.length > 0) {
        console.log(`   Recommendations:`);
        summary.recommendations.forEach(rec => console.log(`     ${rec}`));
      }
      
      if (!validation.isValid) {
        console.log(`   ❌ Validation Errors:`);
        validation.errors.slice(0, 3).forEach(error => {
          console.log(`     - ${error.field}: ${error.message}`);
        });
        if (validation.errors.length > 3) {
          console.log(`     ... and ${validation.errors.length - 3} more errors`);
        }
      }
      
      if (validation.warnings.length > 0) {
        console.log(`   ⚠️ Warnings:`);
        validation.warnings.slice(0, 2).forEach(warning => {
          console.log(`     - ${warning.field}: ${warning.message}`);
        });
        if (validation.warnings.length > 2) {
          console.log(`     ... and ${validation.warnings.length - 2} more warnings`);
        }
      }
    }
    
    // Test 2: Batch validation
    console.log('\n\n📋 Test 2: Batch validation summary...');
    
    const templateData = templates.map(t => t.templateData);
    const batchValidation = validator.validateTemplates(templateData);
    
    console.log('================================================');
    console.log(`📊 Batch Validation Summary:`);
    console.log(`   Total Templates: ${batchValidation.totalTemplates}`);
    console.log(`   Valid Templates: ${batchValidation.validTemplates} (${Math.round(batchValidation.validTemplates/batchValidation.totalTemplates*100)}%)`);
    console.log(`   Invalid Templates: ${batchValidation.invalidTemplates}`);
    console.log(`   Total Errors: ${batchValidation.summary.totalErrors}`);
    console.log(`   Total Warnings: ${batchValidation.summary.totalWarnings}`);
    console.log(`   Critical Errors: ${batchValidation.summary.criticalErrors}`);
    
    // Test 3: Test with invalid template
    console.log('\n\n📋 Test 3: Testing with invalid template...');
    
    const invalidTemplate = {
      metadata: {
        // Missing required fields
        id: "test-invalid"
      },
      // Missing required sections
    };
    
    const invalidValidation = validator.validateTemplate(invalidTemplate);
    console.log(`Invalid template validation:`);
    console.log(`   Valid: ${invalidValidation.isValid}`);
    console.log(`   Errors: ${invalidValidation.summary.totalErrors}`);
    console.log(`   Critical Errors: ${invalidValidation.summary.criticalErrors}`);
    
    // Test 4: Schema loading test
    console.log('\n\n📋 Test 4: Schema loading verification...');
    
    console.log(`Schema loaded: ${!!validator.schema ? '✅ Yes' : '❌ No'}`);
    console.log(`Validator ready: ${!!validator.validate ? '✅ Yes' : '❌ No'}`);
    
    console.log('\n🎉 Template Validator Tests Completed!');
    
    // Summary recommendations
    if (batchValidation.summary.criticalErrors > 0) {
      console.log('\n🔴 CRITICAL: Fix critical errors before production deployment');
    } else if (batchValidation.summary.totalErrors > 0) {
      console.log('\n🟡 WARNING: Some templates have validation errors');
    } else {
      console.log('\n✅ SUCCESS: All templates pass validation!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
if (require.main === module) {
  testTemplateValidator().catch(console.error);
}

module.exports = { testTemplateValidator };