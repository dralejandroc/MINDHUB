const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWorkspaceSchema() {
  console.log('=== CHECKING WORKSPACE SCHEMA AND DATA ===\n');
  
  // First get user ID
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', 'dr_aleks_c@hotmail.com')
    .single();
  
  if (userError) {
    console.error('Error finding user:', userError);
    return;
  }
  
  console.log('User found:', userData);
  
  // Check for workspace without is_active filter
  const { data: workspaces, error: wsError } = await supabase
    .from('individual_workspaces')
    .select('*')
    .eq('owner_id', userData.id);
  
  console.log('\n=== WORKSPACES FOR USER ===');
  if (wsError) {
    console.error('Error:', wsError);
  } else if (!workspaces || workspaces.length === 0) {
    console.log('❌ NO WORKSPACES FOUND - CREATING ONE...');
    
    // Create workspace
    const workspaceId = crypto.randomUUID();
    const { data: newWorkspace, error: createError } = await supabase
      .from('individual_workspaces')
      .insert({
        id: workspaceId,
        owner_id: userData.id,
        workspace_name: 'Dr. Alejandro Consultorio',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Failed to create workspace:', createError);
    } else {
      console.log('✅ Created workspace:', newWorkspace);
    }
  } else {
    console.log(`✅ Found ${workspaces.length} workspace(s):`);
    workspaces.forEach(ws => {
      console.log('\nWorkspace:', {
        id: ws.id,
        name: ws.workspace_name,
        owner_id: ws.owner_id,
        created_at: ws.created_at
      });
      console.log('All columns:', Object.keys(ws));
    });
  }
  
  // Check patients in the workspace
  if (workspaces && workspaces.length > 0) {
    console.log('\n=== CHECKING PATIENTS IN WORKSPACE ===');
    const workspaceId = workspaces[0].id;
    
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, paternal_last_name, workspace_id')
      .eq('workspace_id', workspaceId)
      .limit(5);
    
    if (patientError) {
      console.error('Error fetching patients:', patientError);
    } else {
      console.log(`Found ${patients?.length || 0} patients in workspace ${workspaceId}`);
      patients?.forEach(p => {
        console.log(`  - ${p.first_name} ${p.paternal_last_name} (${p.id})`);
      });
    }
  }
  
  process.exit(0);
}

checkWorkspaceSchema().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});