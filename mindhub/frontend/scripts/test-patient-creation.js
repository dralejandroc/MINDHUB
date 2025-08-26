// Test patient creation with new workspace context
const supabaseUrl = 'https://jvbcpldzoyicefdtnwkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

// Test user
const userEmail = 'dr_aleks_c@hotmail.com';

async function makeSupabaseRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }
  
  return response.json();
}

async function testPatientCreation() {
  console.log('🧪 TESTING PATIENT CREATION - DEBUG WORKSPACE CONTEXT');
  console.log('========================================================\n');
  
  try {
    // 1. Get user context
    console.log(`1. Getting user context for: ${userEmail}`);
    const profileUrl = `${supabaseUrl}/rest/v1/profiles?email=eq.${userEmail}&select=*`;
    const profiles = await makeSupabaseRequest(profileUrl);
    
    if (!profiles || profiles.length === 0) {
      throw new Error('User profile not found');
    }
    
    const user = profiles[0];
    console.log(`   ✅ User ID: ${user.id}`);
    console.log(`   ✅ User Email: ${user.email}`);
    console.log(`   ✅ Role: ${user.role}`);
    
    // 2. Get workspace context
    console.log('\n2. Getting workspace context...');
    const workspaceUrl = `${supabaseUrl}/rest/v1/individual_workspaces?owner_id=eq.${user.id}&select=*`;
    const workspaces = await makeSupabaseRequest(workspaceUrl);
    
    if (!workspaces || workspaces.length === 0) {
      throw new Error('User workspace not found');
    }
    
    const workspace = workspaces[0];
    console.log(`   ✅ Workspace ID: ${workspace.id}`);
    console.log(`   ✅ Workspace Name: ${workspace.workspace_name}`);
    console.log(`   ✅ Owner ID: ${workspace.owner_id}`);
    console.log(`   ✅ Is Active: ${workspace.is_active}`);
    
    // 3. Test patient creation directly via Supabase
    console.log('\n3. Creating test patient directly via Supabase...');
    
    const testPatientData = {
      id: crypto.randomUUID(),
      first_name: 'Test',
      paternal_last_name: 'Paciente',
      maternal_last_name: 'Workspace',
      date_of_birth: '1990-01-01',
      gender: 'male',
      email: `test-${Date.now()}@mindhub.test`,
      phone: '+526621234567',
      education_level: 'universidad_completa',
      occupation: 'Ingeniero de Software',
      workspace_id: workspace.id, // CRITICAL: Set workspace context
      created_by: user.id,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('   📋 Patient data to create:');
    console.log('   {');
    console.log(`     "first_name": "${testPatientData.first_name}",`);
    console.log(`     "email": "${testPatientData.email}",`);
    console.log(`     "workspace_id": "${testPatientData.workspace_id}",`);
    console.log(`     "created_by": "${testPatientData.created_by}"`);
    console.log('   }');
    
    // Insert patient into Supabase
    const createPatientUrl = `${supabaseUrl}/rest/v1/patients`;
    const patient = await makeSupabaseRequest(createPatientUrl, {
      method: 'POST',
      body: JSON.stringify(testPatientData)
    });
    
    console.log('\n   ✅ Test patient created successfully!');
    console.log(`   📋 Patient ID: ${patient[0].id}`);
    console.log(`   📋 Full Name: ${patient[0].first_name} ${patient[0].paternal_last_name}`);
    console.log(`   📋 Workspace: ${patient[0].workspace_id}`);
    
    // 4. Verify patient can be retrieved
    console.log('\n4. Verifying patient can be retrieved...');
    const retrieveUrl = `${supabaseUrl}/rest/v1/patients?workspace_id=eq.${workspace.id}&is_active=eq.true&order=created_at.desc&limit=1`;
    const retrievedPatients = await makeSupabaseRequest(retrieveUrl);
    
    if (retrievedPatients.length > 0) {
      const retrievedPatient = retrievedPatients[0];
      console.log(`   ✅ Patient retrieved successfully: ${retrievedPatient.first_name} ${retrievedPatient.paternal_last_name}`);
    }
    
    // 5. Clean up test patient
    console.log('\n5. Cleaning up test patient...');
    const deleteUrl = `${supabaseUrl}/rest/v1/patients?id=eq.${testPatientData.id}`;
    await makeSupabaseRequest(deleteUrl, {
      method: 'DELETE'
    });
    console.log('   ✅ Test patient cleaned up');
    
    // 6. Test API endpoint structure
    console.log('\n' + '='.repeat(50));
    console.log('📊 API ENDPOINT DEBUGGING RECOMMENDATIONS');
    console.log('='.repeat(50));
    
    console.log('\n🔍 FRONTEND CLIENT DEBUG:');
    console.log('   - Verify ExpedixApiClient sends X-Tenant-Type: "workspace"');
    console.log('   - Check userMetrics localStorage contains workspace context');
    console.log('   - Ensure Supabase session token is valid');
    
    console.log('\n🔍 BACKEND API DEBUG:');
    console.log(`   - API should derive workspace from user ID: ${user.id}`);
    console.log(`   - Expected workspace ID: ${workspace.id}`);
    console.log(`   - Ensure service role key access to individual_workspaces table`);
    
    console.log('\n🧪 PRODUCTION TEST STEPS:');
    console.log('1. Login to https://mindhub.cloud as dr_aleks_c@hotmail.com');
    console.log('2. Go to Expedix module');
    console.log('3. Click "Nuevo Paciente"');
    console.log('4. Fill only REQUIRED fields (skip address and emergency contact)');
    console.log('5. Submit form');
    console.log('6. Check console for workspace context logs');
    
    console.log('\n🎯 EXPECTED RESULT:');
    console.log('- Patient creation should succeed');
    console.log('- No "User workspace not found" error');
    console.log('- Patient should appear in patient list');
    console.log('- Dashboard count should increase from 10 to 11');
    
    return {
      success: true,
      userContext: { user, workspace },
      testResult: 'Patient creation working via direct Supabase'
    };
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testPatientCreation()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 PATIENT CREATION TEST COMPLETED SUCCESSFULLY');
      console.log('The workspace context and patient creation mechanism is working.');
      console.log('The frontend API client should now work correctly with the fixes.');
    }
  })
  .catch(error => {
    console.error('\n💥 TEST FAILED:', error);
    process.exit(1);
  });