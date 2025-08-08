const EmailService = require('./services/EmailServiceZoho');

async function testEmailSystem() {
  console.log('🧪 Testing Email System...\n');

  // Test connection
  console.log('1. Testing connection...');
  const connectionOk = await EmailService.verifyConnection();
  if (!connectionOk) {
    console.error('❌ Connection failed');
    return;
  }
  console.log('✅ Connection successful\n');

  // Test verification email
  console.log('2. Testing verification email...');
  const testEmail = process.argv[2] || 'test@example.com';
  const testName = 'Usuario de Prueba';
  const testToken = 'test-token-123';

  try {
    const result = await EmailService.sendVerificationEmail(testEmail, testName, testToken);
    if (result.success) {
      console.log('✅ Verification email sent successfully');
      console.log(`📧 Message ID: ${result.messageId}`);
    } else {
      console.error('❌ Verification email failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Verification email error:', error);
  }

  console.log('\n🏁 Email system test completed');
}

// Run test
if (require.main === module) {
  testEmailSystem().catch(console.error);
}

module.exports = testEmailSystem;