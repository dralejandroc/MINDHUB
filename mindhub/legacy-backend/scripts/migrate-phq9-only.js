#!/usr/bin/env node

/**
 * ClinimetrixPro PHQ-9 Template Migration (Simplified)
 * 
 * Migrates only PHQ-9 template as a test to verify the system works
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { getPrismaClient } = require('../shared/config/prisma');

const prisma = getPrismaClient();

/**
 * Generate content hash for template
 */
function generateTemplateHash(templateData) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(templateData, null, 0))
    .digest('hex');
}

/**
 * Main migration function
 */
async function migratePHQ9() {
  try {
    console.log('🚀 Starting PHQ-9 template migration (simplified)...\n');

    // Read PHQ-9 template
    const phq9Path = path.join(__dirname, '../templates/scales/phq9-1.0.json');
    const phq9Content = await fs.readFile(phq9Path, 'utf-8');
    const phq9Template = JSON.parse(phq9Content);

    console.log('📄 Processing PHQ-9 template...');

    // Generate hash
    const templateHash = generateTemplateHash(phq9Template);

    // Check if template already exists
    const existingTemplate = await prisma.clinimetrix_templates.findUnique({
      where: { id: 'phq9-1.0' }
    });

    if (existingTemplate) {
      console.log('⚠️  PHQ-9 template already exists, updating...');
    }

    // Create/Update template record (using current schema)
    const templateRecord = {
      id: 'phq9-1.0',
      templateData: phq9Template, // JSON object, not string
      version: '1.0',
      isActive: true
    };

    // Create registry record
    const registryRecord = {
      id: 'registry-phq9-1.0',
      templateId: 'phq9-1.0',
      displayName: 'PHQ-9 - Cuestionario de Salud del Paciente',
      shortDescription: 'Instrumento de cribado para depresión mayor',
      detailedDescription: 'El PHQ-9 es un cuestionario de 9 ítems basado en los criterios del DSM-5 para episodio depresivo mayor. Útil para cribado, diagnóstico y monitoreo de severidad.',
      keywords: JSON.stringify(['PHQ-9', 'Depresión', 'Screening', 'DSM-5']),
      tags: JSON.stringify(['Depresión', 'Screening', 'Validated', 'Primary Care']),
      difficultyLevel: 'basic',
      certificationRequired: false,
      ageGroups: JSON.stringify(['adults']),
      clinicalConditions: JSON.stringify(['Depression', 'Major Depressive Episode']),
      contraindications: JSON.stringify([]),
      specialConsiderations: 'Evaluar riesgo suicida si ítem 9 es positivo',
      psychometricProperties: JSON.stringify({
        sensitivity: 88,
        specificity: 88,
        cronbachAlpha: 0.89
      }),
      bibliography: JSON.stringify([
        'Kroenke K, Spitzer RL, Williams JB. The PHQ-9. J Gen Intern Med. 2001;16(9):606-13.',
        'Manea L, Gilbody S, McMillan D. A diagnostic meta-analysis of the Patient Health Questionnaire-9 (PHQ-9) algorithm scoring method as a screen for depression. Gen Hosp Psychiatry. 2015;37(1):67-75.'
      ]),
      normativeData: JSON.stringify({}),
      cutoffPoints: JSON.stringify([
        { score: 10, condition: 'Major Depression', sensitivity: 88, specificity: 88 }
      ]),
      sensitivitySpecificity: JSON.stringify({ sensitivity: 88, specificity: 88 }),
      isFeatured: true,
      isRecommended: true,
      popularityScore: 95.0,
      publishedAt: new Date()
    };

    // Insert into database
    await prisma.$transaction(async (tx) => {
      // Upsert template
      await tx.clinimetrix_templates.upsert({
        where: { id: templateRecord.id },
        create: templateRecord,
        update: {
          templateData: templateRecord.templateData,
          version: templateRecord.version,
          isActive: true
        }
      });

      // Upsert registry
      await tx.clinimetrix_registry.upsert({
        where: { id: registryRecord.id },
        create: registryRecord,
        update: {
          displayName: registryRecord.displayName,
          shortDescription: registryRecord.shortDescription,
          isFeatured: registryRecord.isFeatured,
          isRecommended: registryRecord.isRecommended
        }
      });
    });

    console.log('✅ PHQ-9 template migrated successfully!');

    // Verify
    const templatesCount = await prisma.clinimetrix_templates.count();
    const registryCount = await prisma.clinimetrix_registry.count();

    console.log(`\n📈 Database Status:`);
    console.log(`   Templates: ${templatesCount}`);
    console.log(`   Registry entries: ${registryCount}`);

    console.log('\n🎉 PHQ-9 migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute migration if called directly
if (require.main === module) {
  migratePHQ9();
}

module.exports = { migratePHQ9 };