#!/usr/bin/env node

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkScaleResponseOptions() {
  const scales = await prisma.scale.findMany({
    include: {
      responseOptions: true,
      items: {
        include: {
          scale_item_specific_options: true
        }
      }
    }
  });
  
  console.log('📊 ANÁLISIS DE RESPONSE OPTIONS POR ESCALA:');
  console.log('');
  
  let problemScales = 0;
  
  scales.forEach(scale => {
    const globalOptions = scale.responseOptions.length;
    
    // Contar opciones específicas por ítem
    const specificOptions = scale.items.reduce((sum, item) => {
      return sum + (item.scale_item_specific_options?.length || 0);
    }, 0);
    
    const totalOptions = globalOptions + specificOptions;
    
    console.log(`${scale.abbreviation} (${scale.id}):`);
    console.log(`  - Global responseOptions: ${globalOptions}`);  
    console.log(`  - Items: ${scale.items.length}`);
    console.log(`  - Specific options: ${specificOptions}`);
    console.log(`  - TOTAL OPTIONS: ${totalOptions}`);
    
    if (totalOptions === 0) {
      console.log(`  ⚠️  PROBLEMA: Sin opciones de respuesta`);
      problemScales++;
    }
    
    // Revisar si hay items sin response_group
    const itemsWithoutGroup = scale.items.filter(item => !item.responseGroup && item.scale_item_specific_options.length === 0);
    if (itemsWithoutGroup.length > 0) {
      console.log(`  ⚠️  PROBLEMA: ${itemsWithoutGroup.length} ítems sin grupo de respuesta ni opciones específicas`);
    }
    
    console.log('');
  });
  
  console.log(`🔍 RESUMEN: ${problemScales} escalas con problemas de ${scales.length} totales`);
  
  await prisma.$disconnect();
}

checkScaleResponseOptions().catch(console.error);