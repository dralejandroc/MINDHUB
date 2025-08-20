#!/usr/bin/env node

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkBiteResponseOptions() {
  // Buscar todas las opciones de respuesta de BITE
  const biteOptions = await prisma.scaleResponseOption.findMany({
    where: { scaleId: 'bite' }
  });
  
  console.log('BITE opciones en ScaleResponseOption:', biteOptions.length);
  
  // Agrupar por responseGroup
  const grouped = {};
  biteOptions.forEach(opt => {
    if (!grouped[opt.responseGroup]) grouped[opt.responseGroup] = [];
    grouped[opt.responseGroup].push(opt);
  });
  
  Object.keys(grouped).forEach(group => {
    console.log(`${group}: ${grouped[group].length} opciones`);
    grouped[group].slice(0, 2).forEach(opt => {
      console.log(`  - ${opt.optionLabel} (${opt.scoreValue})`);
    });
  });
  
  await prisma.$disconnect();
}

checkBiteResponseOptions().catch(console.error);