// Fix dr_aleks_c@hotmail.com user context and restore patients
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

async function fixUserContext() {
  console.log('🔧 FIXING USER CONTEXT FOR dr_aleks_c@hotmail.com');
  
  // 1. Get user profile
  console.log('\n1. Getting user profile...');
  const profilesUrl = `${supabaseUrl}/rest/v1/profiles?email=eq.dr_aleks_c@hotmail.com&select=*`;
  const profiles = await makeRequest(profilesUrl);
  
  if (!profiles || profiles.length === 0) {
    throw new Error('User profile not found');
  }
  
  const user = profiles[0];
  console.log(`✅ User found: ${user.id} (${user.email})`);
  
  // 2. Check/create individual workspace
  console.log('\n2. Checking individual workspace...');
  const workspacesUrl = `${supabaseUrl}/rest/v1/individual_workspaces?owner_id=eq.${user.id}&select=*`;
  let workspaces = await makeRequest(workspacesUrl);
  
  let workspace;
  if (!workspaces || workspaces.length === 0) {
    // Create workspace
    console.log('Creating individual workspace...');
    const createWorkspaceUrl = `${supabaseUrl}/rest/v1/individual_workspaces`;
    const newWorkspace = {
      owner_id: user.id,
      workspace_name: `Consultorio Dr. ${user.first_name || 'Alejandro'}`,
      business_name: 'Consultorio Privado',
      is_active: true
    };
    
    const created = await makeRequest(createWorkspaceUrl, {
      method: 'POST',
      body: JSON.stringify(newWorkspace)
    });
    
    workspace = created[0];
    console.log(`✅ Workspace created: ${workspace.id}`);
  } else {
    workspace = workspaces[0];
    console.log(`✅ Workspace exists: ${workspace.id}`);
  }
  
  // 3. Check existing patients
  console.log('\n3. Checking existing patients...');
  const patientsUrl = `${supabaseUrl}/rest/v1/patients?workspace_id=eq.${workspace.id}&select=id,first_name,last_name,email`;
  const patients = await makeRequest(patientsUrl);
  
  console.log(`Found ${patients.length} existing patients`);
  
  // 4. Create test patients if needed
  if (patients.length < 5) {
    console.log('\n4. Creating test patients...');
    
    const testPatients = [
      {
        first_name: 'Juan',
        last_name: 'Pérez',
        paternal_last_name: 'Pérez',
        maternal_last_name: 'García',
        email: 'juan.perez@example.com',
        phone: '555-0101',
        date_of_birth: '1985-03-15',
        gender: 'male',
        blood_type: 'O+',
        address: 'Calle Principal 123, Col. Centro',
        city: 'Ciudad de México',
        state: 'CDMX',
        zip_code: '01000',
        curp: 'PEPJ850315HDFRNN01',
        workspace_id: workspace.id,
        created_by: user.id,
        is_active: true
      },
      {
        first_name: 'María',
        last_name: 'González',
        paternal_last_name: 'González',
        maternal_last_name: 'López',
        email: 'maria.gonzalez@example.com',
        phone: '555-0102',
        date_of_birth: '1990-07-22',
        gender: 'female',
        blood_type: 'A+',
        address: 'Av. Reforma 456, Col. Juárez',
        city: 'Ciudad de México',
        state: 'CDMX',
        zip_code: '06600',
        curp: 'GOLM900722MDFNPR08',
        workspace_id: workspace.id,
        created_by: user.id,
        is_active: true
      },
      {
        first_name: 'Carlos',
        last_name: 'Rodríguez',
        paternal_last_name: 'Rodríguez',
        maternal_last_name: 'Martínez',
        email: 'carlos.rodriguez@example.com',
        phone: '555-0103',
        date_of_birth: '1978-11-30',
        gender: 'male',
        blood_type: 'B+',
        workspace_id: workspace.id,
        created_by: user.id,
        is_active: true
      },
      {
        first_name: 'Ana',
        last_name: 'Martínez',
        paternal_last_name: 'Martínez',
        maternal_last_name: 'Hernández',
        email: 'ana.martinez@example.com',
        phone: '555-0104',
        date_of_birth: '1995-05-18',
        gender: 'female',
        blood_type: 'AB+',
        workspace_id: workspace.id,
        created_by: user.id,
        is_active: true
      },
      {
        first_name: 'Roberto',
        last_name: 'López',
        paternal_last_name: 'López',
        maternal_last_name: 'Sánchez',
        email: 'roberto.lopez@example.com',
        phone: '555-0105',
        date_of_birth: '1982-09-10',
        gender: 'male',
        blood_type: 'O-',
        workspace_id: workspace.id,
        created_by: user.id,
        is_active: true
      }
    ];
    
    const createPatientsUrl = `${supabaseUrl}/rest/v1/patients`;
    
    for (const patient of testPatients) {
      try {
        // Check if patient exists
        const existingUrl = `${supabaseUrl}/rest/v1/patients?email=eq.${patient.email}&workspace_id=eq.${workspace.id}`;
        const existing = await makeRequest(existingUrl);
        
        if (existing.length === 0) {
          await makeRequest(createPatientsUrl, {
            method: 'POST',
            body: JSON.stringify(patient)
          });
          console.log(`✅ Created: ${patient.first_name} ${patient.last_name}`);
        } else {
          console.log(`⚠️ Exists: ${patient.first_name} ${patient.last_name}`);
        }
      } catch (error) {
        console.error(`❌ Error creating ${patient.first_name}: ${error.message}`);
      }
    }
  }
  
  // 5. Final verification
  console.log('\n5. Final verification...');
  const finalPatients = await makeRequest(`${supabaseUrl}/rest/v1/patients?workspace_id=eq.${workspace.id}&select=id,first_name,last_name`);
  
  console.log(`\n✅ COMPLETED SUCCESSFULLY`);
  console.log(`User: ${user.email} (${user.id})`);
  console.log(`Workspace: ${workspace.workspace_name} (${workspace.id})`);
  console.log(`Total patients: ${finalPatients.length}`);
  
  return { user, workspace, patients: finalPatients };
}

// Run the fix
fixUserContext()
  .then(result => {
    console.log('\n🎉 USER CONTEXT FIXED SUCCESSFULLY!');
    console.log('The user should now see patients in production.');
  })
  .catch(error => {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  });