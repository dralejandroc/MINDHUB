/**
 * Prisma Database Test Script
 * 
 * Tests the Prisma ORM connection and basic operations.
 */

const { getPrismaClient, testConnection, getDatabaseHealth } = require('../backend/shared/config/prisma');

async function testPrismaConnection() {
  console.log('🧪 Testing Prisma Database Connection...\n');

  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Basic connection: SUCCESS');
    } else {
      console.log('❌ Basic connection: FAILED');
      return false;
    }

    // Test health check
    console.log('\n2. Getting database health information...');
    const health = await getDatabaseHealth();
    console.log('📊 Database Health:', JSON.stringify(health, null, 2));

    // Test Prisma client operations
    console.log('\n3. Testing Prisma client operations...');
    const prisma = getPrismaClient();

    // Test schema access
    console.log('   - Testing schema access...');
    
    // Try to count roles (should work even with empty tables)
    const roleCount = await prisma.role.count();
    console.log(`   ✅ Roles table accessible: ${roleCount} records`);

    // Try to count users
    const userCount = await prisma.user.count();
    console.log(`   ✅ Users table accessible: ${userCount} records`);

    // Try to count patients
    const patientCount = await prisma.patient.count();
    console.log(`   ✅ Patients table accessible: ${patientCount} records`);

    // Try to count assessment scales
    const scaleCount = await prisma.assessmentScale.count();
    console.log(`   ✅ Assessment scales table accessible: ${scaleCount} records`);

    // Try to count resources
    const resourceCount = await prisma.resource.count();
    console.log(`   ✅ Resources table accessible: ${resourceCount} records`);

    console.log('\n✅ All Prisma tests passed successfully!');
    console.log('\n🚀 Prisma ORM is ready for development.');
    
    return true;

  } catch (error) {
    console.error('\n❌ Prisma test failed:');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    if (error.meta) {
      console.error('Error Meta:', error.meta);
    }

    console.log('\n💡 Troubleshooting suggestions:');
    console.log('1. Make sure PostgreSQL is running: docker-compose up -d postgres');
    console.log('2. Check database exists: npm run db:push');
    console.log('3. Verify environment variables in .env file');
    console.log('4. Run database setup: ./scripts/setup-database.sh');
    
    return false;
  } finally {
    // Cleanup
    const prisma = getPrismaClient();
    await prisma.$disconnect();
  }
}

// Run test if called directly
if (require.main === module) {
  testPrismaConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testPrismaConnection };