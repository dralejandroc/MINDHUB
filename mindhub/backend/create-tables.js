const { PrismaClient } = require('./generated/prisma');
const fs = require('fs');
const prisma = new PrismaClient();

async function createTables() {
  try {
    console.log('📋 Creando tablas SQL...');
    const createSQL = fs.readFileSync('./create-seeds-tables.sql', 'utf8');
    const statements = createSQL.split(';').filter(s => s.trim() && !s.includes('SHOW'));
    
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement + ';');
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error('Error:', error.message);
        }
      }
    }
    console.log('✅ Tablas creadas/verificadas');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTables();