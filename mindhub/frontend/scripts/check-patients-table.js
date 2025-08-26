// Check real patients table structure in Supabase
const supabaseUrl = 'https://jvbcpldzoyicefdtnwkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

async function makeRequest(url, options = {}) {
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

async function checkTableStructure() {
  console.log('🔍 CHECKING PATIENTS TABLE STRUCTURE\n');
  
  try {
    // 1. Check if table exists by trying to select with limit 0
    console.log('1. Testing table access...');
    
    try {
      const testUrl = `${supabaseUrl}/rest/v1/patients?select=*&limit=0`;
      await makeRequest(testUrl);
      console.log('✅ Table accessible');
    } catch (error) {
      console.log('❌ Table access error:', error.message);
      return;
    }
    
    // 2. Get workspace for user dr_aleks_c@hotmail.com
    console.log('\n2. Getting workspace context...');
    const userEmail = 'dr_aleks_c@hotmail.com';
    
    const profileUrl = `${supabaseUrl}/rest/v1/profiles?email=eq.${userEmail}&select=*`;
    const profiles = await makeRequest(profileUrl);
    
    if (!profiles || profiles.length === 0) {
      throw new Error('User profile not found');
    }
    
    const user = profiles[0];
    console.log('✅ User found:', user.id);
    
    const workspaceUrl = `${supabaseUrl}/rest/v1/individual_workspaces?owner_id=eq.${user.id}&select=*`;
    const workspaces = await makeRequest(workspaceUrl);
    
    let workspace = null;
    if (workspaces && workspaces.length > 0) {
      workspace = workspaces[0];
      console.log('✅ Workspace found:', workspace.id);
    } else {
      console.log('⚠️ No workspace found');
    }
    
    // 3. Check existing patients
    console.log('\n3. Checking existing patients...');
    
    let patientsUrl = `${supabaseUrl}/rest/v1/patients?select=*&is_active=eq.true`;
    if (workspace) {
      patientsUrl += `&workspace_id=eq.${workspace.id}`;
    }
    
    const patients = await makeRequest(patientsUrl);
    console.log(`Found ${patients.length} patients`);
    
    if (patients.length > 0) {
      console.log('\nFirst patient fields:');
      const firstPatient = patients[0];
      const fields = Object.keys(firstPatient).sort();
      fields.forEach(field => {
        const value = firstPatient[field];
        const type = typeof value;
        const preview = type === 'string' && value.length > 30 ? 
          `${value.substring(0, 30)}...` : value;
        console.log(`  - ${field}: ${type} = ${preview}`);
      });
      
      // Check specific problematic fields
      console.log('\n📊 Field Analysis:');
      console.log(`  ✓ education_level exists: ${firstPatient.hasOwnProperty('education_level')}`);
      console.log(`  ✓ occupation exists: ${firstPatient.hasOwnProperty('occupation')}`);
      console.log(`  ✓ address exists: ${firstPatient.hasOwnProperty('address')}`);
      console.log(`  ✓ phone exists: ${firstPatient.hasOwnProperty('phone')}`);
      console.log(`  ✓ emergency_contact_name exists: ${firstPatient.hasOwnProperty('emergency_contact_name')}`);
      console.log(`  ✓ emergency_contact_phone exists: ${firstPatient.hasOwnProperty('emergency_contact_phone')}`);
      console.log(`  ✓ workspace_id exists: ${firstPatient.hasOwnProperty('workspace_id')}`);
      console.log(`  ✓ created_by exists: ${firstPatient.hasOwnProperty('created_by')}`);
    }
    
    // 4. Try to create a test patient to see what fails
    console.log('\n4. Testing patient creation...');
    
    const testPatientData = {
      first_name: 'Test',
      last_name: 'Patient',
      email: 'test@example.com',
      phone: '555-0001',
      date_of_birth: '1990-01-01',
      gender: 'male',
      workspace_id: workspace ? workspace.id : null,
      created_by: user.id,
      is_active: true
    };
    
    try {
      const createUrl = `${supabaseUrl}/rest/v1/patients`;
      const newPatient = await makeRequest(createUrl, {
        method: 'POST',
        body: JSON.stringify(testPatientData)
      });
      console.log('✅ Test patient created successfully:', newPatient[0].id);
      
      // Clean up test patient
      const deleteUrl = `${supabaseUrl}/rest/v1/patients?id=eq.${newPatient[0].id}`;
      await makeRequest(deleteUrl, { method: 'DELETE' });
      console.log('✅ Test patient cleaned up');
      
    } catch (createError) {
      console.log('❌ Test patient creation failed:', createError.message);
    }
    
    console.log('\n✅ TABLE STRUCTURE CHECK COMPLETED');
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  }
}

// Run the check
checkTableStructure();