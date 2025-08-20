// Test API directly
const { executeQuery, executeTransaction } = require('./shared/config/prisma');

async function testAPI() {
  try {
    console.log('Testing API functions...');
    
    const [scales, totalCount] = await executeTransaction([
      (prisma) => prisma.assessmentScale.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              scaleAdministrations: true
            }
          },
          scaleItems: {
            select: {
              id: true,
              itemNumber: true,
              displayOrder: true
            },
            orderBy: { displayOrder: 'asc' }
          }
        },
        take: 20,
        orderBy: { name: 'asc' }
      }),
      (prisma) => prisma.assessmentScale.count({ where: { isActive: true } })
    ], 'getScales');

    console.log('Scales found:', scales.length);
    console.log('Total count:', totalCount);
    console.log('First scale:', scales[0] ? scales[0].abbreviation : 'None');
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testAPI();