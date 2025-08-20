#!/usr/bin/env node

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function getResponseGroups() {
  // Primero veo qué opciones de respuesta hay en ScaleResponseOption para BITE
  const biteOptions = await prisma.scaleResponseOption.findMany({
    where: { scaleId: 'bite' }
  });
  
  console.log('BITE ScaleResponseOption:', biteOptions.length);
  biteOptions.forEach(opt => {
    console.log(`  - ${opt.responseGroup}: ${opt.optionLabel} (${opt.scoreValue})`);
  });
  
  // Verificar si existe una tabla de opciones por grupo
  console.log('\nPrisma models available:');
  console.log(Object.keys(prisma).filter(key => !key.startsWith('$')));
  
  await prisma.$disconnect();
}

getResponseGroups().catch(console.error);