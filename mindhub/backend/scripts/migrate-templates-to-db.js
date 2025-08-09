#!/usr/bin/env node

/**
 * ClinimetrixPro Templates Migration Script
 * 
 * Migrates JSON scale templates from /templates/scales/ to database
 * Creates entries in clinimetrix_templates and clinimetrix_registry
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { getPrismaClient } = require('../shared/config/prisma');

const prisma = getPrismaClient();
const TEMPLATES_DIR = path.join(__dirname, '../templates/scales');

// Default system user for migration (set to null to avoid foreign key constraint)
const SYSTEM_USER_ID = null;

/**
 * Generate unique template ID
 */
function generateTemplateId(abbreviation, version) {
  return `${abbreviation.toLowerCase()}-${version}`.replace(/[^a-z0-9\-]/g, '-');
}

/**
 * Generate content hash for template
 */
function generateTemplateHash(templateData) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(templateData, null, 0))
    .digest('hex');
}

/**
 * Validate template structure
 */
function validateTemplate(template, filename) {
  const errors = [];

  // Required metadata fields
  if (!template.metadata?.id) errors.push(`${filename}: Missing metadata.id`);
  if (!template.metadata?.name) errors.push(`${filename}: Missing metadata.name`);
  if (!template.metadata?.abbreviation) errors.push(`${filename}: Missing metadata.abbreviation`);
  if (!template.metadata?.version) errors.push(`${filename}: Missing metadata.version`);

  // Required structure
  if (!template.structure?.totalItems) errors.push(`${filename}: Missing structure.totalItems`);
  if (!template.structure?.sections?.length) errors.push(`${filename}: Missing structure.sections`);

  // Required scoring
  if (!template.scoring?.method) errors.push(`${filename}: Missing scoring.method`);
  if (!template.scoring?.scoreRange) errors.push(`${filename}: Missing scoring.scoreRange`);

  // Required interpretation
  if (!template.interpretation?.rules?.length) errors.push(`${filename}: Missing interpretation.rules`);

  return errors;
}

/**
 * Extract registry data from template
 */
function extractRegistryData(template) {
  const metadata = template.metadata;
  const documentation = template.documentation || {};

  return {
    id: `registry-${template.metadata.id}`,
    templateId: template.metadata.id,
    displayName: metadata.name,
    shortDescription: metadata.description,
    detailedDescription: documentation.purpose || metadata.description,
    keywords: JSON.stringify([
      metadata.abbreviation,
      metadata.category,
      metadata.subcategory,
      ...(metadata.targetPopulation?.clinicalConditions || [])
    ].filter(Boolean)),
    tags: JSON.stringify([
      metadata.category,
      metadata.subcategory,
      metadata.language || 'es',
      metadata.administrationMode || 'both'
    ].filter(Boolean)),
    difficultyLevel: 'intermediate',
    certificationRequired: false,
    ageGroups: JSON.stringify(metadata.targetPopulation?.ageGroups || ['adults']),
    clinicalConditions: JSON.stringify(metadata.targetPopulation?.clinicalConditions || []),
    contraindications: JSON.stringify(template.interpretation?.clinicalGuidelines?.contraindications || []),
    specialConsiderations: template.interpretation?.clinicalGuidelines?.specialConsiderations?.join('; ') || null,
    psychometricProperties: JSON.stringify(documentation.psychometricProperties || {}),
    bibliography: JSON.stringify(documentation.bibliography || []),
    normativeData: JSON.stringify(documentation.normativeData || {}),
    cutoffPoints: JSON.stringify(documentation.normativeData?.cutoffPoints || []),
    sensitivitySpecificity: JSON.stringify({
      sensitivity: documentation.psychometricProperties?.validity?.sensitivity,
      specificity: documentation.psychometricProperties?.validity?.specificity
    }),
    isFeatured: ['PHQ-9', 'GAD-7', 'GADI'].includes(metadata.abbreviation),
    isRecommended: true,
    popularityScore: 0.0,
    publishedAt: new Date()
  };
}

/**
 * Process single template file
 */
async function processTemplate(filename) {
  try {
    const filePath = path.join(TEMPLATES_DIR, filename);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    console.log(`📄 Processing: ${filename}`);

    // Parse JSON
    let template;
    try {
      template = JSON.parse(fileContent);
    } catch (parseError) {
      console.error(`❌ JSON parse error in ${filename}:`, parseError.message);
      return { success: false, error: `JSON parse error: ${parseError.message}` };
    }

    // Validate template
    const validationErrors = validateTemplate(template, filename);
    if (validationErrors.length > 0) {
      console.error(`❌ Validation errors in ${filename}:`);
      validationErrors.forEach(error => console.error(`   ${error}`));
      return { success: false, error: `Validation failed: ${validationErrors.join(', ')}` };
    }

    // Generate IDs and hash
    const templateId = template.metadata.id || generateTemplateId(
      template.metadata.abbreviation, 
      template.metadata.version
    );
    const templateHash = generateTemplateHash(template);

    // Check if template already exists
    const existingTemplate = await prisma.clinimetrix_templates.findUnique({
      where: { id: templateId }
    });

    if (existingTemplate) {
      console.log(`⚠️  Template ${templateId} already exists, skipping...`);
      return { success: true, skipped: true };
    }

    // Create template record
    const templateRecord = {
      id: templateId,
      name: template.metadata.name,
      abbreviation: template.metadata.abbreviation,
      version: template.metadata.version,
      category: template.metadata.category,
      subcategory: template.metadata.subcategory,
      template_json: JSON.stringify(template, null, 2),
      template_hash: templateHash,
      is_active: true,
      is_validated: true,
      validation_errors: null,
      created_by: SYSTEM_USER_ID,
      estimated_duration_minutes: template.metadata.estimatedDurationMinutes || null,
      target_population: template.metadata.targetPopulation?.demographics || null,
      administration_mode: template.metadata.administrationMode || 'both',
      language: template.metadata.language || 'es',
      compatibility_level: 'stable'
    };

    // Create registry record
    const registryRecord = extractRegistryData(template);

    // Insert into database
    await prisma.$transaction(async (tx) => {
      // Insert template
      await tx.clinimetrix_templates.create({
        data: templateRecord
      });

      // Insert registry
      await tx.clinimetrix_registry.create({
        data: registryRecord
      });
    });

    console.log(`✅ Successfully migrated: ${template.metadata.abbreviation} (${templateId})`);
    return { 
      success: true, 
      templateId, 
      abbreviation: template.metadata.abbreviation 
    };

  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function migrateTemplates() {
  try {
    console.log('🚀 Starting ClinimetrixPro templates migration...\n');

    // Check if templates directory exists
    try {
      await fs.access(TEMPLATES_DIR);
    } catch (error) {
      console.error(`❌ Templates directory not found: ${TEMPLATES_DIR}`);
      process.exit(1);
    }

    // Get all JSON files
    const files = await fs.readdir(TEMPLATES_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    if (jsonFiles.length === 0) {
      console.log('⚠️  No JSON template files found in templates/scales/');
      process.exit(0);
    }

    console.log(`📋 Found ${jsonFiles.length} template files:`);
    jsonFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');

    // Process each template
    const results = [];
    for (const filename of jsonFiles) {
      const result = await processTemplate(filename);
      results.push({ filename, ...result });
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log('===================');
    
    const successful = results.filter(r => r.success && !r.skipped);
    const skipped = results.filter(r => r.success && r.skipped);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successfully migrated: ${successful.length}`);
    successful.forEach(r => console.log(`   - ${r.abbreviation} (${r.templateId})`));

    if (skipped.length > 0) {
      console.log(`⚠️  Skipped (already existed): ${skipped.length}`);
      skipped.forEach(r => console.log(`   - ${r.filename}`));
    }

    if (failed.length > 0) {
      console.log(`❌ Failed: ${failed.length}`);
      failed.forEach(r => console.log(`   - ${r.filename}: ${r.error}`));
    }

    // Verify final counts
    const templatesCount = await prisma.clinimetrix_templates.count();
    const registryCount = await prisma.clinimetrix_registry.count();

    console.log(`\n📈 Database Status:`);
    console.log(`   Templates: ${templatesCount}`);
    console.log(`   Registry entries: ${registryCount}`);

    console.log('\n🎉 Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute migration if called directly
if (require.main === module) {
  migrateTemplates();
}

module.exports = { migrateTemplates };