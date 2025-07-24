/**
 * Script mínimo para crear datos de prueba esenciales
 * - Dr. Alejandro Contreras
 * - 3 pacientes básicos
 * 
 * Uso: node create-minimal-test-data.js
 */

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function createMinimalTestData() {
  console.log('🚀 Creando datos mínimos de prueba...\n');
  
  try {
    // 1. Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión a base de datos establecida\n');

    // 2. Crear Dr. Alejandro Contreras
    console.log('👨‍⚕️ Creando Dr. Alejandro Contreras...');
    const doctor = await prisma.user.upsert({
      where: { email: 'dr_aleks_c@hotmail.com' },
      update: {
        name: 'Dr. Alejandro Contreras',
        lastLoginAt: new Date()
      },
      create: {
        auth0Id: `auth0|dr_alejandro_${Date.now()}`,
        email: 'dr_aleks_c@hotmail.com',
        name: 'Dr. Alejandro Contreras',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Doctor creado: ${doctor.name} (ID: ${doctor.id})\n`);

    // 3. Crear 3 pacientes básicos
    console.log('👥 Creando pacientes de prueba...');
    
    const patients = [
      {
        firstName: 'María',
        lastName: 'González',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'female',
        email: 'maria.gonzalez@test.com',
        phone: '+52-555-1001'
      },
      {
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        dateOfBirth: new Date('1990-08-22'),
        gender: 'male',
        email: 'carlos.rodriguez@test.com',
        phone: '+52-555-1002'
      },
      {
        firstName: 'Ana',
        lastName: 'Martínez',
        dateOfBirth: new Date('1978-12-03'),
        gender: 'female',
        email: 'ana.martinez@test.com',
        phone: '+52-555-1003'
      }
    ];

    const createdPatients = [];
    
    for (let i = 0; i < patients.length; i++) {
      const patientData = patients[i];
      
      // Generar número de expediente único
      const year = new Date().getFullYear();
      const sequence = (i + 1).toString().padStart(4, '0');
      const medicalRecordNumber = `EXP-${year}-${sequence}`;
      
      const patient = await prisma.patient.create({
        data: {
          ...patientData,
          medicalRecordNumber,
          createdBy: doctor.id,
          consentToTreatment: true,
          consentToDataProcessing: true,
          isActive: true
        }
      });
      
      createdPatients.push(patient);
      console.log(`✅ ${patient.firstName} ${patient.lastName} - ${patient.medicalRecordNumber}`);
    }

    // 4. Crear una consulta de ejemplo
    console.log('\n💬 Creando consulta de ejemplo...');
    await prisma.consultation.create({
      data: {
        patientId: createdPatients[0].id,
        consultantId: doctor.id,
        consultationDate: new Date(),
        reason: 'Consulta inicial - evaluación general',
        notes: 'Primera consulta. Paciente estable.',
        status: 'completed'
      }
    });
    console.log('✅ Consulta creada\n');

    // 5. Resumen
    console.log('📊 DATOS CREADOS:');
    console.log('━━━━━━━━━━━━━━━━━━');
    console.log(`👨‍⚕️ Doctor: ${doctor.name}`);
    console.log(`📧 Email: ${doctor.email}`);
    console.log(`👥 Pacientes: ${createdPatients.length}`);
    console.log(`💬 Consultas: 1`);
    console.log('\n🎉 ¡Datos mínimos creados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
createMinimalTestData()
  .catch(console.error);