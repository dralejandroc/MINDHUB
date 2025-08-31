#!/usr/bin/env node

/**
 * Script para verificar que GraphQL está funcionando y puede ver pacientes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPatients() {
  console.log('🔍 Checking patients in Supabase...\n');
  
  try {
    // 1. Check patients table directly
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, clinic_id, is_active, created_at')
      .limit(10);
    
    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError);
    } else {
      console.log(`✅ Found ${patients?.length || 0} patients in database`);
      if (patients && patients.length > 0) {
        console.log('\n📋 Sample patients:');
        patients.slice(0, 3).forEach(p => {
          console.log(`  - ${p.first_name} ${p.last_name || ''} (ID: ${p.id.substring(0, 8)}..., clinic: ${p.clinic_id?.substring(0, 8) || 'none'})`);
        });
      }
    }
    
    // 2. Test GraphQL endpoint
    console.log('\n🚀 Testing GraphQL endpoint...');
    const graphqlUrl = `${supabaseUrl}/graphql/v1`;
    
    const query = `
      query TestPatients {
        patientsCollection(first: 5) {
          edges {
            node {
              id
              first_name
              last_name
              clinic_id
            }
          }
        }
      }
    `;
    
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
    } else {
      const graphqlPatients = result.data?.patientsCollection?.edges || [];
      console.log(`✅ GraphQL returned ${graphqlPatients.length} patients`);
      
      if (graphqlPatients.length > 0) {
        console.log('\n📋 GraphQL patients:');
        graphqlPatients.forEach(edge => {
          const p = edge.node;
          console.log(`  - ${p.first_name} ${p.last_name || ''} (clinic: ${p.clinic_id?.substring(0, 8) || 'none'})`);
        });
      }
    }
    
    // 3. Check RLS policies
    console.log('\n🔐 Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('check_policies', { table_name: 'patients' })
      .single();
    
    if (policiesError) {
      console.log('⚠️  Could not check RLS policies (may need special permissions)');
    } else {
      console.log('RLS policies:', policies);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPatients().then(() => {
  console.log('\n✅ Check complete!');
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});