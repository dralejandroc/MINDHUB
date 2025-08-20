// Test database connection
const { PrismaClient } = require('./generated/prisma');

async function testDB() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test raw query
    const rawResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM assessment_scales WHERE isActive = 1`;
    console.log('Raw query result:', rawResult);
    
    // Test Prisma query
    const prismaResult = await prisma.assessmentScale.findMany({
      where: { isActive: true },
      select: { id: true, name: true, abbreviation: true }
    });
    console.log('Prisma query result:', prismaResult);
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();