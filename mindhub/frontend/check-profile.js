const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvbcpldzoyicefdtnwkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  console.log('Checking profile configuration for dr_aleks_c@hotmail.com...\n');
  
  // Get auth user first
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  const drAleks = authData?.users?.find(u => u.email === 'dr_aleks_c@hotmail.com');
  if (!drAleks) {
    console.error('User dr_aleks_c@hotmail.com not found in auth.users');
    return;
  }
  
  console.log(`Auth User Found:`);
  console.log(`- Email: ${drAleks.email}`);
  console.log(`- ID: ${drAleks.id}`);
  console.log(`- Created: ${drAleks.created_at}`);
  
  // Check profiles table
  console.log('\n--- Checking profiles table ---');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', drAleks.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching profile:', profileError);
    
    // Try to create profile if it doesn't exist
    console.log('\nProfile not found, creating profile for dr_aleks_c@hotmail.com...');
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: drAleks.id,
        email: drAleks.email,
        license_type: 'individual',
        individual_workspace_id: '8a956bcb-abca-409e-8ae8-2604372084cf',
        clinic_id: null,
        clinic_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating profile:', createError);
    } else {
      console.log('✅ Profile created successfully!');
      console.log('Profile:', newProfile);
    }
  } else {
    console.log('\nProfile found:');
    console.log(`- License Type: ${profile.license_type}`);
    console.log(`- Individual Workspace ID: ${profile.individual_workspace_id}`);
    console.log(`- Clinic ID: ${profile.clinic_id}`);
    console.log(`- Clinic Role: ${profile.clinic_role}`);
    
    // Update profile if needed
    if (profile.license_type !== 'individual' || profile.individual_workspace_id !== '8a956bcb-abca-409e-8ae8-2604372084cf') {
      console.log('\n⚠️ Profile needs update...');
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          license_type: 'individual',
          individual_workspace_id: '8a956bcb-abca-409e-8ae8-2604372084cf',
          clinic_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', drAleks.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating profile:', updateError);
      } else {
        console.log('✅ Profile updated successfully!');
        console.log('Updated profile:', updatedProfile);
      }
    } else {
      console.log('\n✅ Profile is correctly configured!');
    }
  }
  
  // Verify patients with this workspace
  console.log('\n--- Checking patients with workspace_id ---');
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id, first_name, paternal_last_name, workspace_id')
    .eq('workspace_id', '8a956bcb-abca-409e-8ae8-2604372084cf')
    .limit(5);
  
  if (patientsError) {
    console.error('Error fetching patients:', patientsError);
  } else {
    console.log(`\nPatients with workspace_id '8a956bcb-abca-409e-8ae8-2604372084cf': ${patients?.length || 0}`);
    if (patients && patients.length > 0) {
      patients.forEach(p => {
        console.log(`- ${p.first_name} ${p.paternal_last_name || ''} (workspace: ${p.workspace_id})`);
      });
    }
  }
  
  process.exit(0);
}

checkProfile();