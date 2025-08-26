// Add missing columns to patients table via Supabase API
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

async function addMissingColumns() {
  console.log('🔧 ADDING MISSING COLUMNS TO PATIENTS TABLE\n');
  
  try {
    // Try to execute SQL to add missing columns
    console.log('1. Attempting to add education_level column via SQL...');
    
    try {
      const sqlUrl = `${supabaseUrl}/rest/v1/rpc/sql`;
      await makeRequest(sqlUrl, {
        method: 'POST',
        body: JSON.stringify({
          query: `
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'patients' 
                    AND column_name = 'education_level'
                ) THEN
                    ALTER TABLE patients ADD COLUMN education_level VARCHAR(100);
                    RAISE NOTICE 'Added education_level column';
                ELSE
                    RAISE NOTICE 'education_level column already exists';
                END IF;
            END $$;
          `
        })
      });
      console.log('✅ SQL executed successfully');
    } catch (sqlError) {
      console.log('⚠️ SQL method not available, using alternative approach');
      
      // Alternative: Try to create a patient with education_level to see if it works
      console.log('2. Testing if education_level field is accepted...');
      
      const testPatientData = {
        first_name: 'Test',
        last_name: 'Education',
        email: 'test-education@example.com',
        phone: '555-0001',
        date_of_birth: '1990-01-01',
        gender: 'male',
        education_level: 'Licenciatura',
        is_active: true
      };
      
      try {
        const createUrl = `${supabaseUrl}/rest/v1/patients`;
        const newPatient = await makeRequest(createUrl, {
          method: 'POST',
          body: JSON.stringify(testPatientData)
        });
        console.log('✅ education_level field accepted:', newPatient[0].id);
        
        // Clean up test patient
        const deleteUrl = `${supabaseUrl}/rest/v1/patients?id=eq.${newPatient[0].id}`;
        await makeRequest(deleteUrl, { method: 'DELETE' });
        console.log('✅ Test patient cleaned up');
        
      } catch (createError) {
        console.log('❌ education_level field not accepted:', createError.message);
        
        if (createError.message.includes('education_level')) {
          console.log('\n📋 SOLUTION: The education_level column needs to be added to the patients table.');
          console.log('This needs to be done via Supabase Dashboard:');
          console.log('1. Go to https://supabase.com/dashboard');
          console.log('2. Select the jvbcpldzoyicefdtnwkd project');
          console.log('3. Go to Table Editor → patients');
          console.log('4. Add new column: education_level (varchar, nullable)');
        }
      }
    }
    
    // Check current table structure
    console.log('\n3. Checking current table structure...');
    
    const patientsUrl = `${supabaseUrl}/rest/v1/patients?select=*&limit=1`;
    const patients = await makeRequest(patientsUrl);
    
    if (patients && patients.length > 0) {
      const firstPatient = patients[0];
      const hasEducationLevel = firstPatient.hasOwnProperty('education_level');
      const hasOccupation = firstPatient.hasOwnProperty('occupation');
      const hasAddress = firstPatient.hasOwnProperty('address');
      
      console.log(`  ✓ education_level exists: ${hasEducationLevel}`);
      console.log(`  ✓ occupation exists: ${hasOccupation}`);
      console.log(`  ✓ address exists: ${hasAddress}`);
      
      if (!hasEducationLevel) {
        console.log('\n❌ COLUMN MISSING: education_level');
        console.log('This column must be added via Supabase Dashboard or SQL access.');
      } else {
        console.log('\n✅ All required columns exist');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the column addition check
addMissingColumns();