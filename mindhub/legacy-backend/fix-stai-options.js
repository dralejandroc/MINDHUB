/**
 * Fix STAI response options in database
 * Current: PHQ-9 options (wrong)
 * Correct: STAI options
 */

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function fixStaiOptions() {
  try {
    console.log('🔧 Fixing STAI response options...');
    
    // Current wrong options
    const currentOptions = await prisma.scaleResponseOption.findMany({
      where: { scaleId: 'stai' },
      orderBy: { displayOrder: 'asc' }
    });
    
    console.log('❌ Current wrong options:');
    currentOptions.forEach(opt => {
      console.log(`  ${opt.optionValue}: ${opt.optionLabel}`);
    });
    
    // Correct STAI options
    const correctOptions = {
      '0': 'Nada',
      '1': 'Algo', 
      '2': 'Bastante',
      '3': 'Mucho'
    };
    
    // Update each option
    for (const [value, label] of Object.entries(correctOptions)) {
      await prisma.scaleResponseOption.updateMany({
        where: { 
          scaleId: 'stai',
          optionValue: value
        },
        data: { 
          optionLabel: label,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated option ${value}: ${label}`);
    }
    
    // Verify changes
    const updatedOptions = await prisma.scaleResponseOption.findMany({
      where: { scaleId: 'stai' },
      orderBy: { displayOrder: 'asc' }
    });
    
    console.log('✅ Updated correct options:');
    updatedOptions.forEach(opt => {
      console.log(`  ${opt.optionValue}: ${opt.optionLabel}`);
    });
    
    console.log('🎉 STAI options fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing STAI options:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStaiOptions();