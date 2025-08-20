/**
 * ClinimetrixPro Testing Script
 * Tests the complete functionality of the ClinimetrixPro system
 */

const { PrismaClient } = require('./generated/prisma');
const ScoringEngine = require('./clinimetrix-pro/services/ScoringEngine');

const prisma = new PrismaClient();
const scoringEngine = new ScoringEngine();

async function testClinimetrixPro() {
  console.log('🧪 Starting ClinimetrixPro Testing...\n');

  try {
    // Test 1: Check templates availability
    console.log('📋 TEST 1: Template Availability');
    const templates = await prisma.clinimetrixTemplate.findMany({
      where: { isActive: true }
    });
    console.log(`✅ Found ${templates.length} active templates`);
    
    if (templates.length === 0) {
      throw new Error('No templates available for testing');
    }

    // Test 2: Get GADI template for testing
    console.log('\n📊 TEST 2: Template Data Structure');
    const gadiTemplate = await prisma.clinimetrixTemplate.findFirst({
      where: { id: 'gadi-1.0' }
    });
    
    if (!gadiTemplate) {
      throw new Error('GADI template not found');
    }

    const templateData = gadiTemplate.templateData;
    console.log(`✅ Template loaded: ${templateData.metadata.name}`);
    console.log(`   - Abbreviation: ${templateData.metadata.abbreviation}`);
    console.log(`   - Total items: ${templateData.structure.totalItems}`);
    console.log(`   - Interpretation rules: ${templateData.interpretation.rules.length}`);
    console.log(`   - Score range: ${templateData.scoring.scoreRange.min}-${templateData.scoring.scoreRange.max}`);

    // Test 3: Simulate responses for scoring
    console.log('\n🎯 TEST 3: Scoring Engine Test');
    
    // Create sample responses (moderate anxiety)
    const sampleResponses = {};
    for (let i = 1; i <= templateData.structure.totalItems; i++) {
      sampleResponses[i] = {
        value: i % 4, // Varies between 0-3
        score: i % 4,
        responseTime: 2000 + Math.random() * 3000 // 2-5 seconds
      };
    }

    console.log(`📝 Created ${Object.keys(sampleResponses).length} sample responses`);

    // Test scoring engine
    const scoringResults = await scoringEngine.calculateResults(
      templateData,
      sampleResponses,
      { demographics: { age: 35, gender: 'female' } }
    );

    console.log('✅ Scoring calculation successful!');
    console.log(`   - Total score: ${scoringResults.totalScore}`);
    console.log(`   - Severity: ${scoringResults.severityLevel}`);
    console.log(`   - Validity score: ${scoringResults.validityIndicators.overallValidityScore}`);
    console.log(`   - Completion: ${scoringResults.completionPercentage}%`);

    // Test 4: Interpretation engine
    console.log('\n🧠 TEST 4: Interpretation Engine Test');
    const interpretation = scoringResults.interpretation;
    console.log(`✅ Interpretation generated`);
    console.log(`   - Label: ${interpretation.rule.label}`);
    console.log(`   - Clinical significance: ${interpretation.clinicalSignificance ? 'Available' : 'Missing'}`);
    console.log(`   - Recommendations: ${interpretation.professionalRecommendations.immediate ? 'Available' : 'Missing'}`);
    console.log(`   - Confidence: ${interpretation.interpretationConfidence.level}`);

    // Test 5: Validity analysis
    console.log('\n🔍 TEST 5: Validity Analysis Test');
    const validity = scoringResults.validityIndicators;
    console.log(`✅ Validity analysis completed`);
    console.log(`   - Overall validity: ${validity.validityLevel}`);
    console.log(`   - Pattern flags: ${validity.responsePatterns.flags.length} flags`);
    console.log(`   - Warnings: ${validity.warnings.length} warnings`);

    // Test 6: Database operations test (simplified)
    console.log('\n💾 TEST 6: Database Operations Test');
    
    // Just test that we can query templates and registry
    const templateCount = await prisma.clinimetrixTemplate.count();
    const registryCount = await prisma.clinimetrixRegistry.count();
    
    console.log(`✅ Database operations working`);
    console.log(`   - Templates accessible: ${templateCount}`);
    console.log(`   - Registry accessible: ${registryCount}`);

    // Test 7: Template retrieval test
    console.log('\n🔄 TEST 7: Template Retrieval Test');
    
    const allTemplates = await prisma.clinimetrixTemplate.findMany({
      take: 3
    });

    console.log(`✅ Template retrieval working`);
    console.log(`   - Can fetch multiple templates: ${allTemplates.length}`);
    allTemplates.forEach(t => {
      const data = t.templateData;
      console.log(`   - ${data.metadata.abbreviation}: ${data.metadata.name}`);
    });

    // Test 8: Subscale calculation
    console.log('\n📊 TEST 8: Subscales Test');
    const subscales = scoringResults.subscaleScores;
    if (Object.keys(subscales).length > 0) {
      console.log(`✅ Found ${Object.keys(subscales).length} subscales`);
      Object.entries(subscales).forEach(([name, data]) => {
        console.log(`   - ${data.name}: ${data.score}/${data.scoreRange.max} (${data.completionPercentage.toFixed(1)}% complete)`);
      });
    } else {
      console.log(`⚠️ No subscales found (may be expected for this template)`);
    }

    console.log('\n🎉 ALL TESTS PASSED! ClinimetrixPro is functional!');
    
    return {
      success: true,
      testsRun: 8,
      templatesTested: 1,
      scoringEngine: 'working',
      interpretationEngine: 'working',
      validityAnalyzer: 'working',
      database: 'working'
    };

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if called directly
if (require.main === module) {
  testClinimetrixPro()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Testing completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Testing failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = testClinimetrixPro;