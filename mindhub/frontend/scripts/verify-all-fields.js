// Verify all required fields for the patients table
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

async function verifyFields() {
  console.log('🔍 VERIFYING ALL REQUIRED PATIENT FIELDS\n');
  
  // Required fields for the frontend forms
  const requiredFields = [
    'education_level',
    'allergies',
    'medical_history',
    'current_medications',
    'chronic_conditions'
  ];
  
  try {
    // Get a patient to check current structure
    const patientsUrl = `${supabaseUrl}/rest/v1/patients?select=*&limit=1`;
    const patients = await makeRequest(patientsUrl);
    
    if (patients && patients.length > 0) {
      const firstPatient = patients[0];
      console.log('📊 FIELD VERIFICATION RESULTS:\n');
      
      requiredFields.forEach(field => {
        const exists = firstPatient.hasOwnProperty(field);
        const value = exists ? firstPatient[field] : 'NOT_EXISTS';
        const status = exists ? '✅' : '❌';
        const type = exists ? typeof value : 'missing';
        
        console.log(`${status} ${field}: ${type} ${exists && value !== null ? `(${String(value).substring(0, 20)}...)` : '(null/missing)'}`);
      });
      
      // Also check existing fields that should be there
      const existingFields = [
        'first_name',
        'paternal_last_name',
        'maternal_last_name',
        'date_of_birth',
        'gender',
        'phone',
        'email',
        'address',
        'occupation',
        'emergency_contact_name',
        'emergency_contact_phone',
        'workspace_id',
        'created_by'
      ];
      
      console.log('\n📋 EXISTING FIELDS CHECK:\n');
      existingFields.forEach(field => {
        const exists = firstPatient.hasOwnProperty(field);
        const status = exists ? '✅' : '❌';
        console.log(`${status} ${field}`);
      });
      
      // Count missing fields
      const missingFields = requiredFields.filter(field => !firstPatient.hasOwnProperty(field));
      
      console.log('\n🔧 MISSING FIELDS SUMMARY:\n');
      
      if (missingFields.length > 0) {
        console.log('❌ Missing fields that need to be added:');
        missingFields.forEach(field => {
          console.log(`   - ${field}`);
        });
        
        console.log('\n📝 SQL to add missing columns:');
        console.log('```sql');
        missingFields.forEach(field => {
          let columnType = 'TEXT'; // Default
          if (field.includes('_level')) columnType = 'VARCHAR(100)';
          if (field.includes('allergies') || field.includes('medications') || field.includes('conditions')) columnType = 'TEXT[]';
          
          console.log(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS ${field} ${columnType};`);
        });
        console.log('```');
        
      } else {
        console.log('✅ All required fields exist in the table');
      }
      
    } else {
      console.log('❌ No patients found to verify structure');
    }
    
  } catch (error) {
    console.error('❌ Error verifying fields:', error.message);
  }
}

// Run verification
verifyFields();