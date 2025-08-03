const { PrismaClient } = require('../generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importTemplates() {
  try {
    const scalesDir = path.join(__dirname, '..', 'templates', 'scales');
    const files = fs.readdirSync(scalesDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${files.length} template files to import...`);
    
    for (const file of files) {
      const filePath = path.join(scalesDir, file);
      const templateData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`\nImporting ${templateData.metadata.abbreviation} (${templateData.metadata.name})...`);
      
      // Create or update template
      const template = await prisma.clinimetrixTemplate.upsert({
        where: { id: templateData.metadata.id },
        update: {
          templateData: templateData,
          version: templateData.metadata.version,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          id: templateData.metadata.id,
          templateData: templateData,
          version: templateData.metadata.version,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Create or update registry entry
      await prisma.clinimetrixRegistry.upsert({
        where: { templateId: template.id },
        update: {
          abbreviation: templateData.metadata.abbreviation,
          name: templateData.metadata.name,
          category: templateData.metadata.category,
          subcategory: templateData.metadata.subcategory || null,
          description: templateData.metadata.description || '',
          version: templateData.metadata.version,
          language: templateData.metadata.language,
          authors: Array.isArray(templateData.metadata.authors) ? templateData.metadata.authors.join(', ') : templateData.metadata.authors,
          year: templateData.metadata.year ? templateData.metadata.year.toString() : '2023',
          administrationMode: templateData.metadata.administrationMode,
          estimatedDurationMinutes: parseInt(templateData.metadata.estimatedDurationMinutes) || 10,
          targetPopulation: JSON.stringify(templateData.metadata.targetPopulation),
          totalItems: templateData.structure.totalItems,
          scoreRangeMin: templateData.scoring.scoreRange.min,
          scoreRangeMax: templateData.scoring.scoreRange.max,
          psychometricProperties: JSON.stringify(templateData.documentation.psychometricProperties || {}),
          clinicalValidation: JSON.stringify(templateData.documentation.clinicalValidation || {}),
          isPublic: true,
          isFeatured: false,
          tags: JSON.stringify([templateData.metadata.category, templateData.metadata.subcategory].filter(Boolean)),
          lastValidated: new Date(),
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          templateId: template.id,
          abbreviation: templateData.metadata.abbreviation,
          name: templateData.metadata.name,
          category: templateData.metadata.category,
          subcategory: templateData.metadata.subcategory || null,
          description: templateData.metadata.description || '',
          version: templateData.metadata.version,
          language: templateData.metadata.language,
          authors: Array.isArray(templateData.metadata.authors) ? templateData.metadata.authors.join(', ') : templateData.metadata.authors,
          year: templateData.metadata.year ? templateData.metadata.year.toString() : '2023',
          administrationMode: templateData.metadata.administrationMode,
          estimatedDurationMinutes: parseInt(templateData.metadata.estimatedDurationMinutes) || 10,
          targetPopulation: JSON.stringify(templateData.metadata.targetPopulation),
          totalItems: templateData.structure.totalItems,
          scoreRangeMin: templateData.scoring.scoreRange.min,
          scoreRangeMax: templateData.scoring.scoreRange.max,
          psychometricProperties: JSON.stringify(templateData.documentation.psychometricProperties || {}),
          clinicalValidation: JSON.stringify(templateData.documentation.clinicalValidation || {}),
          isPublic: true,
          isFeatured: false,
          tags: JSON.stringify([templateData.metadata.category, templateData.metadata.subcategory].filter(Boolean)),
          lastValidated: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Successfully imported ${templateData.metadata.abbreviation}`);
    }
    
    console.log(`\n🎉 Successfully imported ${files.length} templates!`);
    
    // Show summary
    const totalTemplates = await prisma.clinimetrixTemplate.count();
    const totalRegistry = await prisma.clinimetrixRegistry.count();
    
    console.log(`\n📊 Database Summary:`);
    console.log(`   Templates: ${totalTemplates}`);
    console.log(`   Registry entries: ${totalRegistry}`);
    
    // Show by category
    const categories = await prisma.clinimetrixRegistry.groupBy({
      by: ['category'],
      _count: {
        _all: true
      }
    });
    
    console.log(`\n📋 By Category:`);
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count._all} scales`);
    });
    
  } catch (error) {
    console.error('Error importing templates:', error);
    if (error.code === 'P2002') {
      console.error('Duplicate key error - template may already exist');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  importTemplates();
}

module.exports = { importTemplates };