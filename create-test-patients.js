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

async function createTestPatients() {
  try {
    console.log('🔍 Checking existing data...\n');
    
    // First, check if we can access database with service role
    console.log('🔐 Using service role key for admin operations');
    
    // Check available tables
    console.log('📊 Checking database structure...');
    
    try {
      // Check if we can list tables by trying common ones
      const tableTests = [
        { name: 'clinics', label: 'Clinics' },
        { name: 'clinic_configurations', label: 'Clinic Configurations' },
        { name: 'patients', label: 'Patients' },
        { name: 'consultations', label: 'Consultations' }
      ];
      
      for (const table of tableTests) {
        try {
          const { data, error, count } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.log(`❌ ${table.label} table: ${error.message}`);
          } else {
            console.log(`✅ ${table.label} table: ${count || 0} records`);
          }
        } catch (err) {
          console.log(`⚠️ ${table.label} table: Access error`);
        }
      }
      
      // Get the actual structure of patients table by fetching first record
      console.log('\n🔍 Checking patients table structure...');
      const { data: samplePatients, error: structureError } = await supabase
        .from('patients')
        .select('*')
        .limit(1);
      
      if (structureError) {
        console.log('❌ Cannot check patients structure:', structureError.message);
      } else if (samplePatients && samplePatients.length > 0) {
        console.log('📋 Patients table columns:', Object.keys(samplePatients[0]));
        console.log('📋 Sample patient data structure:');
        console.log('   - allergies type:', typeof samplePatients[0].allergies, '=', samplePatients[0].allergies);
        console.log('   - chronic_conditions type:', typeof samplePatients[0].chronic_conditions, '=', samplePatients[0].chronic_conditions);
        console.log('   - current_medications type:', typeof samplePatients[0].current_medications, '=', samplePatients[0].current_medications);
      } else {
        console.log('📋 Patients table is empty - cannot determine structure');
      }

      // Check consultations table structure too
      console.log('\n🔍 Checking consultations table structure...');
      const { data: sampleConsultations, error: consultStructureError } = await supabase
        .from('consultations')
        .select('*')
        .limit(1);
      
      if (consultStructureError) {
        console.log('❌ Cannot check consultations structure:', consultStructureError.message);
      } else if (sampleConsultations && sampleConsultations.length > 0) {
        console.log('📋 Consultations table columns:', Object.keys(sampleConsultations[0]));
      } else {
        console.log('📋 Consultations table is empty - cannot determine structure');
      }
    } catch (dbError) {
      console.error('❌ Database structure check failed:', dbError.message);
    }
    
    // Check for clinics and their configurations
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*');
    
    const { data: clinicConfigs, error: configsError } = await supabase
      .from('clinic_configurations')
      .select('*');
    
    if (clinicsError) {
      console.error('❌ Error fetching clinics:', clinicsError);
      return;
    }
    
    console.log('🏥 Available clinics:', clinics);
    
    if (configsError) {
      console.error('❌ Error fetching clinic configurations:', configsError);
    } else {
      console.log('⚙️ Available clinic configurations:', clinicConfigs?.length || 0);
    }
    
    // Check for existing patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*');
    
    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError);
      return;
    }
    
    console.log('👥 Existing patients:', patients.length);
    
    // Check what clinic_id the existing patients have
    let existingClinicIds = [];
    if (patients && patients.length > 0) {
      existingClinicIds = [...new Set(patients.map(p => p.clinic_id))];
      console.log('🏥 Existing patient clinic IDs:', existingClinicIds);
      
      // Check if any existing patients belong to our clinic
      const ourPatients = patients.filter(p => p.clinic_id === clinics[0]?.id);
      console.log('👥 Patients in our clinic:', ourPatients.length);
    }
    
    // If we have a clinic, create test patients
    if (clinics && clinics.length > 0) {
      const clinic = clinics[0];
      console.log(`\n🏥 Using clinic: ${clinic.name} (${clinic.id})`);
      
      // Check if there's a working clinic ID from existing patients
      const workingClinicId = existingClinicIds.find(id => id !== null);
      if (workingClinicId && workingClinicId !== clinic.id) {
        console.log(`🔄 Found working clinic ID from existing patients: ${workingClinicId}`);
        console.log(`🔄 Will use this instead of ${clinic.id} to avoid constraint issues`);
        clinic.id = workingClinicId; // Override with working clinic ID
      }
      
      // First, ensure clinic configuration exists
      const existingConfig = clinicConfigs?.find(config => config.clinic_id === clinic.id);
      
      if (!existingConfig) {
        console.log('⚙️ Creating missing clinic configuration...');
        
        // Let's check what the clinic_configurations structure looks like first
        const { data: sampleConfigs, error: configStructureError } = await supabase
          .from('clinic_configurations')
          .select('*')
          .limit(1);
        
        if (sampleConfigs && sampleConfigs.length > 0) {
          console.log('📋 Clinic configurations columns:', Object.keys(sampleConfigs[0]));
        }
        
        // Based on the structure, create a proper clinic configuration
        // The table seems to expect clinic information, not clinic_id
        const defaultConfig = {
          clinic_name: clinic.name,
          address: clinic.address,
          phone: clinic.phone,
          email: clinic.email,
          tax_id: clinic.rfc,
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: configData, error: configError } = await supabase
          .from('clinic_configurations')
          .insert([defaultConfig])
          .select();
        
        if (configError) {
          console.error('❌ Error creating clinic configuration:', configError);
          console.log('⚙️ Proceeding without clinic configuration...');
          // Don't return, try to create patients anyway
        } else {
          console.log('✅ Created clinic configuration successfully');
        }
      } else {
        console.log('✅ Clinic configuration already exists');
      }
      
      const timestamp = Date.now();
      const testPatients = [
        {
          id: crypto.randomUUID(),
          clinic_id: clinic.id,
          medical_record_number: `MRN-001-${timestamp}`,
          first_name: 'María',
          last_name: 'González',
          paternal_last_name: 'González',
          maternal_last_name: 'López',
          email: `maria.gonzalez.${timestamp}@email.com`,
          phone: '+52 55 1234 5678',
          date_of_birth: '1985-03-15',
          gender: 'female',
          address: 'Calle Principal 123',
          city: 'Ciudad de México',
          state: 'CDMX',
          postal_code: '06100',
          country: 'México',
          curp: 'GOLM850315MDFLPR09',
          emergency_contact_name: 'Juan González',
          emergency_contact_phone: '+52 55 1234 5679',
          emergency_contact_relationship: 'Esposo',
          allergies: [],
          chronic_conditions: [],
          current_medications: [],
          consent_to_treatment: true,
          consent_to_data_processing: true,
          patient_category: 'regular',
          is_active: true,
          created_by: 'a2733be9-6292-4381-a594-6fa386052052',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          clinic_id: clinic.id,
          medical_record_number: `MRN-002-${timestamp}`,
          first_name: 'Carlos',
          last_name: 'Rodríguez',
          paternal_last_name: 'Rodríguez',
          maternal_last_name: 'Hernández',
          email: `carlos.rodriguez.${timestamp}@email.com`,
          phone: '+52 55 1234 5680',
          date_of_birth: '1978-07-22',
          gender: 'male',
          address: 'Avenida Central 456',
          city: 'Ciudad de México',
          state: 'CDMX',
          postal_code: '06200',
          country: 'México',
          curp: 'ROHC780722HDFRRL05',
          emergency_contact_name: 'Ana Rodríguez',
          emergency_contact_phone: '+52 55 1234 5681',
          emergency_contact_relationship: 'Esposa',
          allergies: ['Penicilina'],
          chronic_conditions: ['Diabetes tipo 2'],
          current_medications: ['Metformina 500mg'],
          consent_to_treatment: true,
          consent_to_data_processing: true,
          patient_category: 'regular',
          is_active: true,
          created_by: 'a2733be9-6292-4381-a594-6fa386052052',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          clinic_id: clinic.id,
          medical_record_number: `MRN-003-${timestamp}`,
          first_name: 'Ana',
          last_name: 'Martínez',
          paternal_last_name: 'Martínez',
          maternal_last_name: 'Silva',
          email: `ana.martinez.${timestamp}@email.com`,
          phone: '+52 55 1234 5682',
          date_of_birth: '1992-11-08',
          gender: 'female',
          address: 'Plaza Mayor 789',
          city: 'Ciudad de México',
          state: 'CDMX',
          postal_code: '06300',
          country: 'México',
          curp: 'MASA921108MDFRLR08',
          emergency_contact_name: 'Luis Martínez',
          emergency_contact_phone: '+52 55 1234 5683',
          emergency_contact_relationship: 'Hermano',
          allergies: ['Aspirina', 'Mariscos'],
          chronic_conditions: ['Asma'],
          current_medications: ['Salbutamol inhalado'],
          consent_to_treatment: true,
          consent_to_data_processing: true,
          patient_category: 'regular',
          is_active: true,
          created_by: 'a2733be9-6292-4381-a594-6fa386052052',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      console.log('\n📝 Creating test patients...');
      
      for (const patient of testPatients) {
        const { data, error } = await supabase
          .from('patients')
          .insert([patient])
          .select();
        
        if (error) {
          console.error(`❌ Error creating patient ${patient.first_name}:`, error);
        } else {
          console.log(`✅ Created patient: ${patient.first_name} ${patient.last_name}`);
        }
      }
      
      // Create some test consultations
      console.log('\n📋 Creating test consultations...');
      
      const { data: newPatients, error: newPatientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinic.id);
      
      if (newPatientsError) {
        console.error('❌ Error fetching new patients:', newPatientsError);
        return;
      }
      
      if (newPatients && newPatients.length > 0) {
        const testConsultations = [
          {
            id: crypto.randomUUID(),
            patient_id: newPatients[0].id,
            professional_id: 'a2733be9-6292-4381-a594-6fa386052052', // Use admin ID as professional
            consultation_date: new Date().toISOString(),
            consultation_type: 'seguimiento',
            chief_complaint: 'Consulta de seguimiento',
            history_present_illness: 'Paciente refiere mejoría general',
            physical_examination: 'Exploración física normal',
            assessment: 'Evolución favorable',
            plan: 'Continuar con medicación actual',
            notes: 'Paciente muestra mejoría significativa',
            diagnosis: ['Evolución favorable'],
            treatment_plan: 'Continuar con medicación actual',
            status: 'completed',
            duration_minutes: 30,
            is_billable: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            patient_id: newPatients[1].id,
            professional_id: 'a2733be9-6292-4381-a594-6fa386052052', // Use admin ID as professional
            consultation_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
            consultation_type: 'primera_vez',
            chief_complaint: 'Primera consulta',
            history_present_illness: 'Paciente solicita evaluación inicial',
            physical_examination: 'Exploración física completa realizada',
            assessment: 'Evaluación inicial completada',
            plan: 'Iniciar tratamiento según protocolo',
            notes: 'Nueva evaluación completa realizada satisfactoriamente',
            diagnosis: ['Evaluación inicial'],
            treatment_plan: 'Iniciar tratamiento',
            status: 'completed',
            duration_minutes: 45,
            is_billable: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        for (const consultation of testConsultations) {
          const { data, error } = await supabase
            .from('consultations')
            .insert([consultation])
            .select();
          
          if (error) {
            console.error('❌ Error creating consultation:', error);
          } else {
            console.log('✅ Created consultation for patient');
          }
        }
      }
      
      // Final verification
      console.log('\n' + '='.repeat(60));
      console.log('📊 FINAL VERIFICATION');
      console.log('='.repeat(60));
      
      const { data: finalPatients, error: finalError } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinic.id);
      
      if (!finalError && finalPatients) {
        console.log(`✅ Total patients in clinic: ${finalPatients.length}`);
        finalPatients.forEach(p => {
          console.log(`   • ${p.first_name} ${p.last_name} (${p.email})`);
        });
      }
      
      const { data: finalConsultations, error: consultError } = await supabase
        .from('consultations')
        .select('*');
      
      if (!consultError && finalConsultations) {
        console.log(`✅ Total consultations in database: ${finalConsultations.length}`);
        const recentConsultations = finalConsultations.filter(c => {
          const consDate = new Date(c.consultation_date);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return consDate >= yesterday;
        });
        console.log(`📅 Recent consultations (last 24h): ${recentConsultations.length}`);
      }
      
    } else {
      console.log('❌ No clinics found. Need to create clinic first.');
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

createTestPatients();