const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvbcpldzoyicefdtnwkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPatients() {
  console.log('Checking patients in Supabase...\n');
  
  // Get all patients
  const { data: allPatients, error: allError } = await supabase
    .from('patients')
    .select('*')
    .limit(5)
    .order('created_at', { ascending: false });
  
  if (allError) {
    console.error('Error fetching all patients:', allError);
  } else {
    console.log(`Patients found: ${allPatients?.length || 0}`);
    if (allPatients && allPatients.length > 0) {
      console.log('\nPatient columns:', Object.keys(allPatients[0]));
      console.log('\nFirst 5 patients:');
      allPatients.forEach(p => {
        console.log(`- ${p.first_name} ${p.paternal_last_name || p.maternal_last_name || ''}`);
        console.log(`  ID: ${p.id}`);
        console.log(`  Created: ${p.created_at}`);
      });
    }
  }
  
  // Check auth.users table
  console.log('\n--- Checking auth.users table ---');
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
  } else {
    const drAleks = authData?.users?.find(u => u.email === 'dr_aleks_c@hotmail.com');
    if (drAleks) {
      console.log(`\nUser found: ${drAleks.email}`);
      console.log(`User ID: ${drAleks.id}`);
      
      // Try to find patients with this workspace_id
      const { data: workspacePatients, error: wsError } = await supabase
        .from('patients')
        .select('*')
        .eq('workspace_id', '8a956bcb-abca-409e-8ae8-2604372084cf')
        .limit(10);
      
      if (wsError) {
        console.error('Error fetching workspace patients:', wsError);
      } else {
        console.log(`\nPatients in workspace: ${workspacePatients?.length || 0}`);
        if (workspacePatients && workspacePatients.length > 0) {
          workspacePatients.forEach(p => {
            console.log(`- ${p.first_name} ${p.paternal_last_name || ''}`);
          });
        }
      }
    }
  }
  
  process.exit(0);
}

checkPatients();