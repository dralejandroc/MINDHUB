const { PrismaClient } = require('../generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function cleanAndReimport() {
  try {
    console.log('🧹 Limpiando base de datos ClinimetrixPro...');
    
    // Limpiar todas las tablas
    await prisma.clinimetrixAssessment.deleteMany({});
    await prisma.clinimetrixRegistry.deleteMany({});
    await prisma.clinimetrixTemplate.deleteMany({});
    
    console.log('✅ Base de datos limpiada');
    
    // Reimportar solo las escalas autorizadas
    const scalesDir = path.join(__dirname, '..', 'templates', 'scales');
    const files = fs.readdirSync(scalesDir).filter(file => file.endsWith('.json'));
    
    console.log(`\n📥 Importando ${files.length} escalas autorizadas...`);
    
    for (const file of files) {
      const filePath = path.join(scalesDir, file);
      const templateData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`\n→ Importando ${templateData.metadata.abbreviation}...`);
      
      // Crear template
      const template = await prisma.clinimetrixTemplate.create({
        data: {
          id: templateData.metadata.id,
          templateData: templateData,
          version: templateData.metadata.version,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Crear entrada en registry
      await prisma.clinimetrixRegistry.create({
        data: {
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
          isFeatured: ['PHQ-9', 'GADI', 'BDI-21', 'MADRS'].includes(templateData.metadata.abbreviation),
          tags: JSON.stringify([templateData.metadata.category, templateData.metadata.subcategory].filter(Boolean)),
          lastValidated: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ ${templateData.metadata.abbreviation} importado correctamente`);
    }
    
    // Resumen final
    const totalTemplates = await prisma.clinimetrixTemplate.count();
    const categories = await prisma.clinimetrixRegistry.groupBy({
      by: ['category'],
      _count: true
    });
    
    console.log(`\n📊 Resumen Final:`);
    console.log(`   Total de escalas: ${totalTemplates}`);
    console.log(`\n📋 Por Categoría:`);
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count} escalas`);
    });
    
    // Verificar integridad
    console.log(`\n🔍 Verificando integridad...`);
    const allScales = await prisma.clinimetrixRegistry.findMany({
      select: { abbreviation: true, name: true }
    });
    
    console.log(`\n✨ Escalas disponibles en ClinimetrixPro:`);
    allScales.forEach(scale => {
      console.log(`   - ${scale.abbreviation}: ${scale.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndReimport();