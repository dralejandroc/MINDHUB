#!/usr/bin/env node

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning all response options...');
  await prisma.scaleResponseOption.deleteMany({});
  console.log('✅ Cleaned all response options');
  await prisma.$disconnect();
}

cleanup().catch(console.error);