#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration using service role key for admin operations
const supabaseUrl = 'https://jvbcpldzoyicefdtnwkd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function checkExistingData() {
  try {
    console.log('🔍 Checking existing data for security fixes...\n');
    
    // 1. Check existing clinics
    console.log('🏥 Checking existing clinics:');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name, created_by, created_at');
    
    if (clinicsError) {
      console.error('❌ Error fetching clinics:', clinicsError);
    } else {
      console.log(`✅ Found ${clinics.length} clinics:`);
      clinics.forEach(clinic => {
        console.log(`   • ${clinic.id} - ${clinic.name}`);
      });
    }
    
    // 2. Check patients clinic_id status
    console.log('\n👥 Checking patients clinic_id status:');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, clinic_id, first_name, last_name');
    
    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError);
    } else {
      const withClinicId = patients.filter(p => p.clinic_id !== null);
      const withoutClinicId = patients.filter(p => p.clinic_id === null);
      
      console.log(`📊 Total patients: ${patients.length}`);
      console.log(`✅ With clinic_id: ${withClinicId.length}`);
      console.log(`❌ WITHOUT clinic_id (NULL): ${withoutClinicId.length}`);
      
      if (withClinicId.length > 0) {
        const uniqueClinicIds = [...new Set(withClinicId.map(p => p.clinic_id))];
        console.log(`🏥 Unique clinic_ids in patients: ${uniqueClinicIds.length}`);
        uniqueClinicIds.forEach(cid => {
          const count = withClinicId.filter(p => p.clinic_id === cid).length;
          console.log(`   • ${cid}: ${count} patients`);
        });
      }
    }
    
    // 3. Check consultations structure
    console.log('\n📋 Checking consultations table structure:');
    const { data: consultations, error: consultError } = await supabase
      .from('consultations')
      .select('*')
      .limit(1);
    
    if (consultError) {
      console.error('❌ Error fetching consultations:', consultError);
    } else if (consultations.length > 0) {
      const columns = Object.keys(consultations[0]);
      console.log(`📋 Consultations columns: ${columns.join(', ')}`);
      
      // Check if clinic_id column exists
      if (columns.includes('clinic_id')) {
        console.log('✅ clinic_id column EXISTS in consultations');
        
        // Check consultation clinic_id values
        const { data: allConsultations, error: allConsultError } = await supabase
          .from('consultations')
          .select('id, clinic_id, patient_id');
        
        if (!allConsultError && allConsultations) {
          const withClinicId = allConsultations.filter(c => c.clinic_id !== null);
          const withoutClinicId = allConsultations.filter(c => c.clinic_id === null);
          
          console.log(`📊 Total consultations: ${allConsultations.length}`);
          console.log(`✅ With clinic_id: ${withClinicId.length}`);
          console.log(`❌ WITHOUT clinic_id (NULL): ${withoutClinicId.length}`);
        }
      } else {
        console.log('❌ clinic_id column DOES NOT EXIST in consultations');
      }
    } else {
      console.log('📋 No consultations found - table might be empty');
    }
    
    // 4. Check profiles for professional information
    console.log('\n👨‍⚕️ Checking profiles (professionals):');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, clinic_id, clinic_role')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`✅ Found ${profiles.length} profiles (showing first 5):`);
      profiles.forEach(profile => {
        console.log(`   • ${profile.id} - ${profile.email} - Clinic: ${profile.clinic_id} - Role: ${profile.clinic_role}`);
      });
    }
    
    // 5. Generate corrected SQL with actual clinic_id values
    if (clinics && clinics.length > 0) {
      console.log('\n🔧 Generating corrected SQL script...');
      const validClinicId = clinics[0].id; // Use first valid clinic
      
      console.log(`📋 Will use clinic_id: ${validClinicId} for corrections`);
      
      // Create corrected SQL
      let correctedSQL = `-- CORRECTED SECURITY FIXES WITH VALID CLINIC_ID
-- Using valid clinic_id: ${validClinicId}

-- 1. Fix consultations - add clinic_id if column doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultations' AND column_name = 'clinic_id'
    ) THEN
        ALTER TABLE consultations ADD COLUMN clinic_id UUID REFERENCES clinics(id);
    END IF;
END $$;

-- 2. Update consultations with valid clinic_id from patients
UPDATE consultations 
SET clinic_id = (
  SELECT p.clinic_id FROM patients p 
  WHERE p.id = consultations.patient_id AND p.clinic_id IS NOT NULL
  LIMIT 1
)
WHERE clinic_id IS NULL AND patient_id IS NOT NULL;

-- 3. For consultations still without clinic_id, use valid clinic
UPDATE consultations 
SET clinic_id = '${validClinicId}'
WHERE clinic_id IS NULL;

-- 4. Update patients with NULL clinic_id
UPDATE patients 
SET clinic_id = '${validClinicId}'
WHERE clinic_id IS NULL;

-- 5. Make clinic_id NOT NULL (after fixing data)
ALTER TABLE consultations ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE patients ALTER COLUMN clinic_id SET NOT NULL;

-- 6. Create performance indexes
CREATE INDEX IF NOT EXISTS consultations_clinic_id_idx ON consultations(clinic_id);
CREATE INDEX IF NOT EXISTS patients_clinic_id_idx ON patients(clinic_id);

SELECT 'CORRECTED SECURITY FIXES APPLIED' as status;
`;

      // Write corrected SQL to file
      require('fs').writeFileSync('/Users/alekscon/MINDHUB-Pro/CRITICAL_SECURITY_FIXES_CORRECTED.sql', correctedSQL);
      console.log('✅ Created corrected SQL file: CRITICAL_SECURITY_FIXES_CORRECTED.sql');
    }
    
  } catch (error) {
    console.error('💥 Error checking data:', error);
  }
}

checkExistingData();