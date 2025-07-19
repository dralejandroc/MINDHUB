/**
 * Test Authentication System
 * 
 * Simple test script to verify the authentication and authorization middleware
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const middleware = require('./shared/middleware');
const authRouter = require('./shared/routes/auth-endpoints');

const app = express();
app.use(express.json());

// Mount authentication routes
app.use('/api/auth', authRouter);

// Test endpoints with different authentication requirements
app.get('/api/test/public', 
  ...middleware.presets.public,
  (req, res) => {
    res.json({ message: 'Public endpoint - no authentication required' });
  }
);

app.get('/api/test/protected',
  ...middleware.presets.protected,
  (req, res) => {
    res.json({ 
      message: 'Protected endpoint - authentication required',
      user: req.user 
    });
  }
);

app.get('/api/test/psychiatrist-only',
  ...middleware.utils.forRoles(['psychiatrist'], ['read:patient_data']),
  (req, res) => {
    res.json({ 
      message: 'Psychiatrist-only endpoint',
      user: req.user 
    });
  }
);

app.get('/api/test/healthcare-professional',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse'], ['read:clinical_assessments']),
  (req, res) => {
    res.json({ 
      message: 'Healthcare professional endpoint',
      user: req.user 
    });
  }
);

app.get('/api/test/admin-only',
  ...middleware.presets.admin,
  (req, res) => {
    res.json({ 
      message: 'Admin-only endpoint',
      user: req.user 
    });
  }
);

// Test token generation function
function generateTestToken(userRole = 'psychiatrist') {
  const jwtSecret = process.env.JWT_SECRET || 'mindhub-secret-key';
  
  const payload = {
    sub: 'test-user-123',
    email: 'test@mindhub.com',
    name: 'Test User',
    role: userRole,
    permissions: getPermissionsForRole(userRole),
    organization_id: 'test-org-123',
    professional_license: 'TEST-LICENSE-123',
    session_id: 'test-session-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iss: 'mindhub.com',
    aud: 'mindhub-api'
  };
  
  return jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });
}

function getPermissionsForRole(role) {
  const rolePermissions = {
    psychiatrist: [
      'read:all_patient_data',
      'write:medical_records',
      'write:prescriptions',
      'write:diagnoses',
      'read:clinical_assessments',
      'write:clinical_assessments',
      'read:forms',
      'write:forms',
      'read:resources',
      'write:resources'
    ],
    psychologist: [
      'read:patient_data',
      'read:medical_records',
      'write:psychological_reports',
      'read:clinical_assessments',
      'write:clinical_assessments',
      'read:forms',
      'write:forms',
      'read:resources'
    ],
    nurse: [
      'read:patient_basic_data',
      'write:care_notes',
      'read:treatment_plans',
      'write:vital_signs',
      'read:forms',
      'write:form_submissions'
    ],
    admin: [
      'read:all_data',
      'write:all_data',
      'manage:users',
      'manage:roles',
      'read:audit_logs',
      'manage:system_config'
    ],
    patient: [
      'read:own_data',
      'write:own_forms',
      'read:own_assessments',
      'read:assigned_resources'
    ]
  };
  
  return rolePermissions[role] || [];
}

// Test function
async function runTests() {
  console.log('🧪 Testing MindHub Authentication System\n');
  
  // Test 1: Public endpoint (no auth required)
  console.log('1. Testing public endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/test/public');
    const data = await response.json();
    console.log('✅ Public endpoint works:', data.message);
  } catch (error) {
    console.log('❌ Public endpoint failed:', error.message);
  }
  
  // Test 2: Protected endpoint without token
  console.log('\n2. Testing protected endpoint without token...');
  try {
    const response = await fetch('http://localhost:3000/api/test/protected');
    const data = await response.json();
    if (response.status === 401) {
      console.log('✅ Protected endpoint correctly rejected unauthorized request');
    } else {
      console.log('❌ Protected endpoint should have rejected unauthorized request');
    }
  } catch (error) {
    console.log('❌ Protected endpoint test failed:', error.message);
  }
  
  // Test 3: Protected endpoint with valid token
  console.log('\n3. Testing protected endpoint with valid token...');
  try {
    const token = generateTestToken('psychiatrist');
    const response = await fetch('http://localhost:3000/api/test/protected', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (response.status === 200) {
      console.log('✅ Protected endpoint works with valid token');
      console.log('   User:', data.user.email, '| Role:', data.user.role);
    } else {
      console.log('❌ Protected endpoint failed with valid token');
    }
  } catch (error) {
    console.log('❌ Protected endpoint test failed:', error.message);
  }
  
  // Test 4: Role-based access control
  console.log('\n4. Testing role-based access control...');
  try {
    const nurseToken = generateTestToken('nurse');
    const response = await fetch('http://localhost:3000/api/test/psychiatrist-only', {
      headers: {
        'Authorization': `Bearer ${nurseToken}`
      }
    });
    const data = await response.json();
    if (response.status === 403) {
      console.log('✅ RBAC correctly denied nurse access to psychiatrist-only endpoint');
    } else {
      console.log('❌ RBAC should have denied nurse access to psychiatrist-only endpoint');
    }
  } catch (error) {
    console.log('❌ RBAC test failed:', error.message);
  }
  
  // Test 5: Multiple roles endpoint
  console.log('\n5. Testing multiple roles endpoint...');
  try {
    const psychologistToken = generateTestToken('psychologist');
    const response = await fetch('http://localhost:3000/api/test/healthcare-professional', {
      headers: {
        'Authorization': `Bearer ${psychologistToken}`
      }
    });
    const data = await response.json();
    if (response.status === 200) {
      console.log('✅ Multiple roles endpoint works for psychologist');
    } else {
      console.log('❌ Multiple roles endpoint failed for psychologist');
    }
  } catch (error) {
    console.log('❌ Multiple roles test failed:', error.message);
  }
  
  console.log('\n🎉 Authentication system tests completed');
}

// Start test server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📚 Available test endpoints:`);
  console.log(`   GET /api/test/public - Public endpoint`);
  console.log(`   GET /api/test/protected - Protected endpoint`);
  console.log(`   GET /api/test/psychiatrist-only - Psychiatrist only`);
  console.log(`   GET /api/test/healthcare-professional - Healthcare professional`);
  console.log(`   GET /api/test/admin-only - Admin only`);
  console.log(`   GET /api/auth/providers - Available identity providers`);
  console.log(`\n🔑 Test tokens:`);
  console.log(`   Psychiatrist: ${generateTestToken('psychiatrist')}`);
  console.log(`   Psychologist: ${generateTestToken('psychologist')}`);
  console.log(`   Nurse: ${generateTestToken('nurse')}`);
  console.log(`   Admin: ${generateTestToken('admin')}`);
  console.log(`   Patient: ${generateTestToken('patient')}`);
  
  // Run automated tests after server starts
  setTimeout(runTests, 1000);
});

module.exports = app;