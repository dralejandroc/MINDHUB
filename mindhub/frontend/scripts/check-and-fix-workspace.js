const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixWorkspace() {
  console.log('=== CHECKING WORKSPACE FOR dr_aleks_c@hotmail.com ===\n');
  
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
  
  // Check for workspace
  const { data: workspaces, error: wsError } = await supabase
    .from('individual_workspaces')
    .select('*')
    .eq('owner_id', userData.id);
  
  console.log('\n=== CURRENT WORKSPACES ===');
  if (wsError) {
    console.error('Error:', wsError);
  } else if (!workspaces || workspaces.length === 0) {
    console.log('❌ NO WORKSPACES FOUND FOR THIS USER');
    
    // Create workspace if missing
    console.log('\n=== CREATING DEFAULT WORKSPACE ===');
    const workspaceId = crypto.randomUUID();
    const { data: newWorkspace, error: createError } = await supabase
      .from('individual_workspaces')
      .insert({
        id: workspaceId,
        owner_id: userData.id,
        workspace_name: 'Dr. Alejandro Consultorio',
        is_active: true,
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
    console.log(`Found ${workspaces.length} workspace(s):`);
    workspaces.forEach(ws => {
      console.log(`  - ${ws.id}: "${ws.workspace_name}" (active: ${ws.is_active})`);
    });
    
    // Check if any are active
    const activeWorkspaces = workspaces.filter(ws => ws.is_active);
    if (activeWorkspaces.length === 0) {
      console.log('\n❌ No ACTIVE workspaces found');
      
      // Activate the first workspace
      const { data: activated, error: activateError } = await supabase
        .from('individual_workspaces')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', workspaces[0].id)
        .select()
        .single();
      
      if (activateError) {
        console.error('Failed to activate workspace:', activateError);
      } else {
        console.log('✅ Activated workspace:', activated);
      }
    } else {
      console.log('\n✅ Active workspace found:', {
        id: activeWorkspaces[0].id,
        name: activeWorkspaces[0].workspace_name
      });
    }
  }
  
  // Re-check to confirm
  console.log('\n=== VERIFICATION ===');
  const { data: finalCheck, error: finalError } = await supabase
    .from('individual_workspaces')
    .select('id, workspace_name, is_active')
    .eq('owner_id', userData.id)
    .eq('is_active', true)
    .single();
  
  if (finalError) {
    console.error('❌ Final check error:', finalError);
  } else {
    console.log('✅ Active workspace confirmed:', finalCheck);
  }
  
  process.exit(0);
}

checkAndFixWorkspace().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});