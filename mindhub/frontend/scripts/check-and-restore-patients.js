// Script to check and restore test patients for Dr. Alejandro
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jvbcpldzoicefdtnwkd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserAndWorkspace() {
  console.log('\n📊 CHECKING USER AND WORKSPACE STATUS\n');
  
  try {
    // 1. Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'dr_aleks_c@hotmail.com')
      .single();
    
    if (profileError || !profile) {
      console.error('❌ User profile not found:', profileError);
      return null;
    }
    
    console.log('✅ User found:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Name:', profile.full_name);
    console.log('   Role:', profile.role);
    
    // 2. Check individual workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('individual_workspaces')
      .select('*')
      .eq('owner_id', profile.id)
      .single();
    
    if (workspaceError || !workspace) {
      console.log('⚠️ No individual workspace found for user');
      // Create workspace if needed
      const { data: newWorkspace, error: createError } = await supabase
        .from('individual_workspaces')
        .insert({
          owner_id: profile.id,
          workspace_name: `Consultorio Dr. ${profile.full_name}`,
          business_name: 'Consultorio Privado',
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating workspace:', createError);
        return null;
      }
      
      console.log('✅ Workspace created:', newWorkspace.id);
      return { profile, workspace: newWorkspace };
    }
    
    console.log('✅ Workspace found:');
    console.log('   ID:', workspace.id);
    console.log('   Name:', workspace.workspace_name);
    console.log('   Active:', workspace.is_active);
    
    return { profile, workspace };
    
  } catch (error) {
    console.error('❌ Error checking user/workspace:', error);
    return null;
  }
}

async function checkExistingPatients(workspaceId) {
  console.log('\n📊 CHECKING EXISTING PATIENTS\n');
  
  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching patients:', error);
      return [];
    }
    
    console.log(`Found ${patients?.length || 0} patients in workspace`);
    
    if (patients && patients.length > 0) {
      console.log('\nExisting patients:');
      patients.slice(0, 5).forEach(p => {
        console.log(`   - ${p.first_name} ${p.last_name} (${p.email})`);
      });
      if (patients.length > 5) {
        console.log(`   ... and ${patients.length - 5} more`);
      }
    }
    
    return patients || [];
    
  } catch (error) {
    console.error('❌ Error checking patients:', error);
    return [];
  }
}

async function createTestPatients(workspaceId, userId) {
  console.log('\n🔧 CREATING TEST PATIENTS\n');
  
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
      workspace_id: workspaceId,
      created_by: userId,
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
      workspace_id: workspaceId,
      created_by: userId,
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
      address: 'Calle Madero 789, Col. Roma',
      city: 'Ciudad de México',
      state: 'CDMX',
      zip_code: '06700',
      curp: 'ROMC781130HDFDRR05',
      workspace_id: workspaceId,
      created_by: userId,
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
      address: 'Av. Insurgentes 321, Col. Condesa',
      city: 'Ciudad de México',
      state: 'CDMX',
      zip_code: '06140',
      curp: 'MAHA950518MDFRRN09',
      workspace_id: workspaceId,
      created_by: userId,
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
      address: 'Calle Hidalgo 654, Col. Del Valle',
      city: 'Ciudad de México',
      state: 'CDMX',
      zip_code: '03100',
      curp: 'LOSR820910HDFPNB02',
      workspace_id: workspaceId,
      created_by: userId,
      is_active: true
    }
  ];
  
  try {
    // Insert patients one by one to handle potential duplicates
    const results = [];
    for (const patient of testPatients) {
      try {
        // Check if patient already exists
        const { data: existing } = await supabase
          .from('patients')
          .select('id')
          .eq('email', patient.email)
          .eq('workspace_id', workspaceId)
          .single();
        
        if (existing) {
          console.log(`   ⚠️ Patient ${patient.first_name} ${patient.last_name} already exists`);
          results.push(existing);
        } else {
          const { data: newPatient, error } = await supabase
            .from('patients')
            .insert(patient)
            .select()
            .single();
          
          if (error) {
            console.error(`   ❌ Error creating ${patient.first_name} ${patient.last_name}:`, error.message);
          } else {
            console.log(`   ✅ Created patient: ${patient.first_name} ${patient.last_name}`);
            results.push(newPatient);
          }
        }
      } catch (err) {
        console.error(`   ❌ Error processing ${patient.first_name}:`, err);
      }
    }
    
    console.log(`\n✅ Total patients processed: ${results.length}`);
    return results;
    
  } catch (error) {
    console.error('❌ Error creating test patients:', error);
    return [];
  }
}

async function main() {
  console.log('========================================');
  console.log('  MINDHUB - PATIENT DATA CHECK & RESTORE');
  console.log('========================================');
  
  // 1. Check user and workspace
  const userInfo = await checkUserAndWorkspace();
  if (!userInfo) {
    console.log('\n❌ Cannot proceed without user/workspace');
    return;
  }
  
  const { profile, workspace } = userInfo;
  
  // 2. Check existing patients
  const existingPatients = await checkExistingPatients(workspace.id);
  
  // 3. Create test patients if needed
  if (existingPatients.length === 0) {
    console.log('\n⚠️ No patients found, creating test data...');
    await createTestPatients(workspace.id, profile.id);
  } else if (existingPatients.length < 5) {
    console.log('\n⚠️ Less than 5 patients found, adding more test data...');
    await createTestPatients(workspace.id, profile.id);
  }
  
  // 4. Final verification
  console.log('\n📊 FINAL VERIFICATION\n');
  const finalPatients = await checkExistingPatients(workspace.id);
  
  console.log('\n========================================');
  console.log('  PROCESS COMPLETED');
  console.log('========================================');
  console.log(`Total patients in workspace: ${finalPatients.length}`);
  console.log(`Workspace ID: ${workspace.id}`);
  console.log(`User ID: ${profile.id}`);
  console.log('\n✅ Data ready for testing!');
}

// Run the script
main().catch(console.error);