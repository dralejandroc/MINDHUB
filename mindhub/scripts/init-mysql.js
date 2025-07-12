#!/usr/bin/env node

const mysql = require('../backend/shared/config/mysql');
const { v4: uuidv4 } = require('uuid');

async function initializeDatabase() {
  console.log('🚀 Initializing MindHub MySQL Database...\n');
  
  try {
    // Initialize schema
    console.log('📋 Creating database schema...');
    await mysql.initializeSchema();
    console.log('✅ Schema created successfully!\n');
    
    // Create demo professional user
    console.log('👤 Creating demo professional user...');
    const professionalId = uuidv4();
    await mysql.query(`
      INSERT INTO users (id, email, name, role, auth0_id)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [professionalId, 'demo@mindhub.com', 'Dr. Demo Professional', 'professional', 'auth0|demo']);
    console.log('✅ Demo user created!\n');
    
    // Create some demo patients
    console.log('👥 Creating demo patients...');
    const patients = [
      {
        id: uuidv4(),
        firstName: 'María Elena',
        paternalLastName: 'González',
        maternalLastName: 'López',
        birthDate: '1985-03-15',
        gender: 'feminine',
        email: 'maria.gonzalez@email.com',
        cellPhone: '+526621234567',
      },
      {
        id: uuidv4(),
        firstName: 'Carlos Alberto',
        paternalLastName: 'Rodríguez',
        maternalLastName: 'Hernández',
        birthDate: '1978-07-22',
        gender: 'masculine',
        email: 'carlos.rodriguez@email.com',
        cellPhone: '+526627654321',
      },
      {
        id: uuidv4(),
        firstName: 'Ana Sofía',
        paternalLastName: 'Martínez',
        maternalLastName: 'Silva',
        birthDate: '1992-11-08',
        gender: 'feminine',
        email: 'ana.martinez@email.com',
        cellPhone: '+526629876543',
      }
    ];
    
    for (const patient of patients) {
      await mysql.query(`
        INSERT INTO patients (
          id, professional_id, first_name, paternal_last_name, maternal_last_name,
          birth_date, gender, email, cell_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE email = VALUES(email)
      `, [
        patient.id, professionalId, patient.firstName, patient.paternalLastName,
        patient.maternalLastName, patient.birthDate, patient.gender,
        patient.email, patient.cellPhone
      ]);
      console.log(`✅ Created patient: ${patient.firstName} ${patient.paternalLastName}`);
    }
    
    // Create demo consultation
    console.log('\n📅 Creating demo consultation...');
    const consultationId = uuidv4();
    await mysql.query(`
      INSERT INTO consultations (
        id, patient_id, professional_id, consultation_date,
        chief_complaint, current_illness, diagnosis_code, diagnosis_text,
        treatment_plan, status
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)
    `, [
      consultationId, patients[0].id, professionalId,
      'Síntomas de ansiedad y dificultad para dormir',
      'Paciente refiere ansiedad aumentada en las últimas 3 semanas, con dificultad para conciliar el sueño',
      'F41.1',
      'Trastorno de ansiedad generalizada',
      'Psicoterapia cognitivo-conductual, técnicas de relajación, considerar medicación si no hay mejoría',
      'completed'
    ]);
    
    // Add vital signs
    await mysql.query(`
      INSERT INTO vital_signs (
        id, consultation_id, blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, respiratory_rate, temperature, oxygen_saturation,
        weight, height
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(), consultationId, 120, 80, 72, 16, 36.5, 98, 65.5, 165
    ]);
    
    // Add prescription
    await mysql.query(`
      INSERT INTO prescriptions (
        id, consultation_id, medication_name, presentation, concentration,
        substance, dosage_instructions, quantity, duration
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(), consultationId, 'Sertralina', 'Tableta', '50mg',
      'Sertralina HCl', 'Tomar 1 tableta cada 24 horas en ayunas por la mañana',
      '30 tabletas', '30 días'
    ]);
    console.log('✅ Demo consultation created!\n');
    
    // Create demo PHQ-9 assessment
    console.log('📊 Creating demo PHQ-9 assessment...');
    await mysql.query(`
      INSERT INTO phq9_assessments (
        id, patient_id, professional_id, consultation_id, assessment_date,
        item_1, item_2, item_3, item_4, item_5, item_6, item_7, item_8, item_9,
        functional_impact, total_score, severity, suicide_risk
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(), patients[0].id, professionalId, consultationId,
      2, 2, 1, 2, 1, 1, 0, 1, 0,
      'somewhat_difficult', 10, 'moderate', false
    ]);
    console.log('✅ PHQ-9 assessment created!\n');
    
    // Create demo resources
    console.log('📚 Creating demo resources...');
    const resources = [
      {
        title: 'Guía de Manejo de Ansiedad',
        description: 'Manual completo para el tratamiento de trastornos de ansiedad',
        category: 'Trastornos de Ansiedad',
        fileType: 'PDF'
      },
      {
        title: 'Protocolo PHQ-9',
        description: 'Protocolo para aplicación del cuestionario PHQ-9',
        category: 'Evaluaciones',
        fileType: 'PDF'
      },
      {
        title: 'Técnicas de Relajación Muscular',
        description: 'Video instructivo sobre relajación muscular progresiva',
        category: 'Técnicas Terapéuticas',
        fileType: 'Video'
      }
    ];
    
    for (const resource of resources) {
      await mysql.query(`
        INSERT INTO resources (
          id, professional_id, title, description, category,
          file_type, file_path, file_size, mime_type, is_public
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), professionalId, resource.title, resource.description,
        resource.category, resource.fileType,
        `/uploads/resources/${resource.title.toLowerCase().replace(/ /g, '-')}.${resource.fileType.toLowerCase()}`,
        1024000, 'application/pdf', true
      ]);
      console.log(`✅ Created resource: ${resource.title}`);
    }
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📌 Demo Credentials:');
    console.log('   Email: demo@mindhub.com');
    console.log('   Password: Use Auth0 or bypass auth in development\n');
    
    // Test the connection
    const healthy = await mysql.healthCheck();
    console.log(`💓 Database health check: ${healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await mysql.closePool();
    process.exit(0);
  }
}

// Run initialization
initializeDatabase();