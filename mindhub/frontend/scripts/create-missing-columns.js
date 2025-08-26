// Create missing columns in patients table via Supabase Management API
const fetch = require('node-fetch');

// These are the REAL credentials for the production database
const supabaseUrl = 'https://jvbcpldzoyicefdtnwkd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

async function createMissingColumns() {
  console.log('🔧 CREATING MISSING COLUMNS IN PATIENTS TABLE');
  console.log('Target: Production Supabase database');
  console.log('Project: jvbcpldzoyicefdtnwkd\n');
  
  try {
    // Method 1: Try using pg_cron or SQL functions
    console.log('1. Attempting to create columns via SQL execution...\n');
    
    const sqlCommands = [
      'ALTER TABLE patients ADD COLUMN IF NOT EXISTS education_level VARCHAR(100);',
      'ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_history TEXT;'
    ];
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(`Executing: ${sql}`);
      
      try {
        // Try the /rpc/exec endpoint first
        let response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: sql })
        });
        
        if (!response.ok) {
          // Try alternative RPC endpoints
          const alternatives = ['sql', 'execute_sql', 'run_sql', 'query'];
          
          for (const alt of alternatives) {
            try {
              console.log(`  Trying /rpc/${alt}...`);
              response = await fetch(`${supabaseUrl}/rest/v1/rpc/${alt}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                  query: sql,
                  sql: sql,
                  statement: sql 
                })
              });
              
              if (response.ok) {
                console.log(`  ✅ Success via /rpc/${alt}`);
                break;
              }
            } catch (altError) {
              console.log(`  ❌ Failed /rpc/${alt}: ${altError.message}`);
            }
          }
        }
        
        if (response.ok) {
          const result = await response.json();
          console.log(`  ✅ Column created successfully`);
        } else {
          const error = await response.text();
          console.log(`  ❌ SQL execution failed: ${error}`);
        }
        
      } catch (sqlError) {
        console.log(`  ❌ SQL execution error: ${sqlError.message}`);
      }
    }
    
    // Method 2: Verify by trying to create a test record
    console.log('\n2. Verifying columns exist by testing insertion...\n');
    
    const testPatientData = {
      id: '00000000-0000-0000-0000-000000000001',
      first_name: 'Test',
      paternal_last_name: 'Column',
      email: 'test-columns@example.com',
      phone: '555-0001',
      date_of_birth: '1990-01-01',
      gender: 'male',
      education_level: 'Test Education Level',
      medical_history: 'Test medical history data',
      is_active: true
    };
    
    try {
      const createResponse = await fetch(`${supabaseUrl}/rest/v1/patients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(testPatientData)
      });
      
      if (createResponse.ok) {
        const newPatient = await createResponse.json();
        console.log('✅ Test patient created successfully with new columns');
        console.log(`   ID: ${newPatient[0].id}`);
        console.log(`   education_level: ${newPatient[0].education_level}`);
        console.log(`   medical_history: ${newPatient[0].medical_history}`);
        
        // Clean up test patient
        try {
          await fetch(`${supabaseUrl}/rest/v1/patients?id=eq.${testPatientData.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            }
          });
          console.log('✅ Test patient cleaned up');
        } catch (cleanupError) {
          console.log('⚠️ Test patient cleanup failed (not critical)');
        }
        
      } else {
        const error = await createResponse.text();
        console.log('❌ Test patient creation failed:', error);
        
        if (error.includes('education_level') || error.includes('medical_history')) {
          console.log('\n🚨 COLUMNS STILL MISSING - Manual intervention required');
          console.log('\n📋 NEXT STEPS:');
          console.log('1. Log into Supabase Dashboard: https://supabase.com/dashboard');
          console.log('2. Select project: jvbcpldzoyicefdtnwkd');
          console.log('3. Go to SQL Editor');
          console.log('4. Execute this SQL:');
          console.log('\n```sql');
          console.log('ALTER TABLE patients ADD COLUMN IF NOT EXISTS education_level VARCHAR(100);');
          console.log('ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_history TEXT;');
          console.log('```');
          console.log('\n5. Verify columns were created');
        }
      }
      
    } catch (testError) {
      console.log('❌ Test insertion error:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
  }
}

// Run the column creation
createMissingColumns()
  .then(() => {
    console.log('\n🏁 COLUMN CREATION PROCESS COMPLETED');
  })
  .catch(error => {
    console.error('\n💥 PROCESS FAILED:', error);
    process.exit(1);
  });