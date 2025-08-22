#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvbcpldzoyicefdtnwkd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkForeignKeys() {
  try {
    console.log('🔍 Investigating foreign key constraints...\n');
    
    // Check clinic_configurations table
    console.log('⚙️ Checking clinic_configurations:');
    const { data: configs, error: configError } = await supabase
      .from('clinic_configurations')
      .select('*');
    
    if (configError) {
      console.error('❌ Error fetching clinic_configurations:', configError);
    } else {
      console.log(`✅ Found ${configs.length} clinic configurations:`);
      configs.forEach(config => {
        console.log(`   • ID: ${config.id || 'N/A'}`);
        console.log(`   • Clinic Name: ${config.clinic_name || 'N/A'}`);
        console.log(`   • Fields: ${Object.keys(config).join(', ')}`);
        console.log('   ---');
      });
    }
    
    // Check actual structure of clinic_configurations table
    console.log('\n📋 Getting clinic_configurations structure:');
    const { data: configSample, error: configStructError } = await supabase
      .from('clinic_configurations')
      .select('*')
      .limit(1);
    
    if (configSample && configSample.length > 0) {
      console.log('📋 Clinic configurations columns:', Object.keys(configSample[0]));
    }
    
    // Get schema information using raw SQL
    console.log('\n🏗️ Checking foreign key constraints on patients table:');
    
    const { data: constraints, error: constraintError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
          FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'patients';
        `
      });
    
    if (constraintError) {
      console.error('❌ Error getting constraints:', constraintError);
      
      // Alternative: Check patients table structure directly
      console.log('\n📋 Checking patients table structure instead:');
      const { data: patientSample, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .limit(1);
      
      if (patientSample && patientSample.length > 0) {
        console.log('📋 Patients columns:', Object.keys(patientSample[0]));
        
        // Check what clinic_id values exist
        const { data: allPatients, error: allPatientsError } = await supabase
          .from('patients')
          .select('clinic_id')
          .not('clinic_id', 'is', null);
        
        if (!allPatientsError && allPatients) {
          const uniqueClinicIds = [...new Set(allPatients.map(p => p.clinic_id))];
          console.log('\n🏥 Unique clinic_id values in patients:', uniqueClinicIds);
        }
      }
    } else {
      console.log('✅ Foreign key constraints on patients:');
      constraints.forEach(constraint => {
        console.log(`   • ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      });
    }
    
    // Check if we have the correct clinic in clinic_configurations
    const validClinicId = 'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0';
    
    console.log(`\n🔍 Checking if clinic_id ${validClinicId} exists in clinic_configurations:`);
    const { data: matchingConfig, error: matchError } = await supabase
      .from('clinic_configurations')
      .select('*')
      .eq('id', validClinicId);
    
    if (matchError) {
      console.error('❌ Error checking clinic configuration:', matchError);
    } else if (matchingConfig && matchingConfig.length > 0) {
      console.log('✅ Found matching clinic configuration');
    } else {
      console.log('❌ NO matching clinic configuration found');
      
      // Check what IDs exist in clinic_configurations
      const { data: allConfigs, error: allConfigsError } = await supabase
        .from('clinic_configurations')
        .select('id, clinic_name');
      
      if (!allConfigsError) {
        console.log('\n📋 Available clinic_configuration IDs:');
        allConfigs.forEach(config => {
          console.log(`   • ${config.id}: ${config.clinic_name || 'Unnamed'}`);
        });
      }
    }
    
    // Check clinics table too
    console.log(`\n🏥 Checking clinics table for ${validClinicId}:`);
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', validClinicId);
    
    if (!clinicError && clinic && clinic.length > 0) {
      console.log('✅ Found in clinics table:', clinic[0].name);
    } else {
      console.log('❌ NOT found in clinics table');
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

checkForeignKeys();