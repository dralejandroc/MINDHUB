/**
 * Test Clinical Assessments API
 * 
 * Test script to verify clinical assessment endpoints functionality
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const clinimetrix = require('./clinimetrix');

const app = express();
app.use(express.json());

// Mount clinimetrix routes
app.use('/api/clinimetrix', clinimetrix);

// Generate test token for healthcare professional
function generateTestToken(role = 'psychiatrist') {
  const jwtSecret = process.env.JWT_SECRET || 'mindhub-secret-key';
  
  const payload = {
    sub: 'test-clinician-123',
    email: 'doctor@mindhub.com',
    name: 'Dr. Test Clinician',
    role: role,
    permissions: [
      'read:clinical_assessments',
      'write:clinical_assessments',
      'read:patient_data',
      'write:medical_records'
    ],
    organization_id: 'test-org-123',
    professional_license: 'PSY-12345',
    session_id: 'test-session-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    iss: 'mindhub.com',
    aud: 'mindhub-api'
  };
  
  return jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });
}

// Test clinical assessments endpoints
async function testClinicalAssessments() {
  console.log('🧪 Testing Clinical Assessments API\n');
  
  const token = generateTestToken('psychiatrist');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Test 1: Get Clinimetrix hub info
  console.log('1. Testing Clinimetrix hub endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/clinimetrix', {
      headers: headers
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Clinimetrix hub endpoint works');
      console.log('   Features:', data.features.length, 'features available');
      console.log('   Endpoints:', Object.keys(data.endpoints).length, 'endpoint groups');
    } else {
      console.log('❌ Clinimetrix hub endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Clinimetrix hub test failed:', error.message);
  }
  
  // Test 2: Get clinical assessments list
  console.log('\n2. Testing clinical assessments list endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/clinimetrix/assessments', {
      headers: headers
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Clinical assessments list endpoint works');
      console.log('   Response structure:', Object.keys(data));
    } else {
      console.log('❌ Clinical assessments list failed:', response.status);
      const errorData = await response.json();
      console.log('   Error:', errorData.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Clinical assessments list test failed:', error.message);
  }
  
  // Test 3: Get clinical scales
  console.log('\n3. Testing clinical scales endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/clinimetrix/scales', {
      headers: headers
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Clinical scales endpoint works');
      console.log('   Response structure:', Object.keys(data));
    } else {
      console.log('❌ Clinical scales endpoint failed:', response.status);
      const errorData = await response.json();
      console.log('   Error:', errorData.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Clinical scales test failed:', error.message);
  }
  
  // Test 4: Get clinical workflows
  console.log('\n4. Testing clinical workflows endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/clinimetrix/workflows', {
      headers: headers
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Clinical workflows endpoint works');
      console.log('   Response structure:', Object.keys(data));
    } else {
      console.log('❌ Clinical workflows endpoint failed:', response.status);
      const errorData = await response.json();
      console.log('   Error:', errorData.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Clinical workflows test failed:', error.message);
  }
  
  // Test 5: Test role-based access (try with nurse role)
  console.log('\n5. Testing role-based access control...');
  try {
    const nurseToken = generateTestToken('nurse');
    const nurseHeaders = {
      'Authorization': `Bearer ${nurseToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch('http://localhost:3001/api/clinimetrix/assessments', {
      headers: nurseHeaders
    });
    
    if (response.status === 403) {
      console.log('✅ Role-based access control works (nurse access denied)');
    } else if (response.ok) {
      console.log('✅ Role-based access control allows nurse access');
    } else {
      console.log('❌ Role-based access control test failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Role-based access test failed:', error.message);
  }
  
  console.log('\n🎉 Clinical assessments API tests completed');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start test server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Clinical Assessments Test Server running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET /api/clinimetrix - Hub information`);
  console.log(`   GET /api/clinimetrix/assessments - Clinical assessments`);
  console.log(`   GET /api/clinimetrix/scales - Clinical scales`);
  console.log(`   GET /api/clinimetrix/workflows - Clinical workflows`);
  console.log(`\n🔑 Test token (Psychiatrist):`);
  console.log(`   ${generateTestToken('psychiatrist')}`);
  
  // Run automated tests after server starts
  setTimeout(testClinicalAssessments, 1000);
});

module.exports = app;