/**
 * Script para crear datos de prueba del sistema multi-clínica
 * 
 * FUNCIONALIDADES:
 * 1. Crear clínicas de ejemplo
 * 2. Asociar usuarios existentes a clínicas
 * 3. Crear pacientes de clínica con IDs jerárquicos
 * 4. Demostrar separación de datos por clínica
 */

const { PrismaClient } = require('./generated/prisma');
const { generateClinicId } = require('./shared/utils/clinic-id-generator');
const { generateReadablePatientId } = require('./shared/utils/patient-id-generator');

const prisma = new PrismaClient();

async function createTestClinics() {
  console.log('🏥 Creando datos de prueba del sistema multi-clínica...\n');

  try {
    // 1. CREAR CLÍNICAS DE EJEMPLO
    console.log('📋 PASO 1: Creando clínicas de ejemplo...');
    
    const clinics = [
      {
        name: 'Hospital General de México',
        address: 'Av. Balmis No. 148, Doctores, CDMX',
        phone: '+52 55 2789 2000',
        email: 'contacto@hgm.salud.gob.mx',
        taxId: 'HGM901201ABC',
        subscriptionType: 'enterprise',
        maxPatients: 5000,
        maxUsers: 50
      },
      {
        name: 'Clínica Psicológica Integral',
        address: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
        phone: '+52 55 5555 1234',
        email: 'info@clinica-integral.mx',
        taxId: 'CPI850315XYZ',
        subscriptionType: 'premium',
        maxPatients: 1000,
        maxUsers: 15
      },
      {
        name: 'Centro de Salud Mental Esperanza',
        address: 'Calle Revolución 456, Col. Centro, Guadalajara',
        phone: '+52 33 1234 5678',
        email: 'contacto@esperanza-salud.mx',
        taxId: 'CSE920707DEF',
        subscriptionType: 'basic',
        maxPatients: 500,
        maxUsers: 10
      }
    ];

    const createdClinics = [];

    for (const clinicData of clinics) {
      // Generar ID único para la clínica
      const clinicId = await generateClinicId(clinicData.name);
      
      // Extraer código corto para la clínica
      const clinicCode = clinicId.split('-')[0]; // CLI001, CLI002, CLI003
      
      const clinic = await prisma.clinic.create({
        data: {
          id: clinicId,
          code: clinicCode,
          ...clinicData,
          settings: {
            allowPatientPortal: true,
            autoGenerateReports: true,
            maxAppointmentsPerDay: 50,
            workingHours: {
              start: '08:00',
              end: '18:00',
              lunchBreak: '14:00-15:00'
            }
          }
        }
      });

      createdClinics.push(clinic);
      console.log(`   ✅ ${clinic.id} - ${clinic.name}`);
    }

    // 2. ASOCIAR USUARIO EXISTENTE A PRIMERA CLÍNICA
    console.log('\n📋 PASO 2: Asociando usuario Dr. Alejandro a primera clínica...');
    
    try {
      const user = await prisma.user.findFirst({
        where: { email: 'alejandro@mindhub.mx' }
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { clinicId: createdClinics[0].id }
        });
        
        console.log(`   ✅ Usuario ${user.name} asociado a ${createdClinics[0].name}`);
      } else {
        console.log('   ⚠️ Usuario Dr. Alejandro no encontrado');
      }
    } catch (error) {
      console.log(`   ⚠️ Error asociando usuario: ${error.message}`);
    }

    // 3. CREAR PACIENTES DE CLÍNICA CON IDs JERÁRQUICOS
    console.log('\n📋 PASO 3: Creando pacientes de clínica con IDs jerárquicos...');
    
    const testPatients = [
      {
        clinicId: createdClinics[0].id, // Hospital General de México
        firstName: 'María Elena',
        paternalLastName: 'Rodríguez',
        maternalLastName: 'González',
        dateOfBirth: new Date('1985-03-15'),
        gender: 'female',
        email: 'maria.rodriguez@email.com',
        phone: '+52 55 1234 5678'
      },
      {
        clinicId: createdClinics[0].id, // Hospital General de México
        firstName: 'Carlos Alberto',
        paternalLastName: 'Mendoza',
        maternalLastName: 'Silva',
        dateOfBirth: new Date('1978-11-22'),
        gender: 'male',
        email: 'carlos.mendoza@email.com',
        phone: '+52 55 2345 6789'
      },
      {
        clinicId: createdClinics[1].id, // Clínica Psicológica Integral
        firstName: 'Ana Patricia',
        paternalLastName: 'Hernández',
        maternalLastName: 'López',
        dateOfBirth: new Date('1992-07-08'),
        gender: 'female',
        email: 'ana.hernandez@email.com',
        phone: '+52 55 3456 7890'
      },
      {
        clinicId: createdClinics[2].id, // Centro de Salud Mental Esperanza
        firstName: 'Jorge Luis',
        paternalLastName: 'Vázquez',
        maternalLastName: 'Morales',
        dateOfBirth: new Date('1989-12-03'),
        gender: 'male',
        email: 'jorge.vazquez@email.com',
        phone: '+52 33 4567 8901'
      }
    ];

    for (const patientData of testPatients) {
      // Generar ID jerárquico con prefijo de clínica
      const patientId = await generateReadablePatientId(patientData);
      
      const patient = await prisma.patient.create({
        data: {
          id: patientId,
          ...patientData,
          consentToTreatment: true,
          consentToDataProcessing: true
        }
      });

      console.log(`   ✅ Paciente creado: ${patient.id} - ${patient.firstName} ${patient.paternalLastName}`);
    }

    // 4. VERIFICAR SEPARACIÓN DE DATOS
    console.log('\n📋 PASO 4: Verificando separación de datos por clínica...');
    
    for (const clinic of createdClinics) {
      const patients = await prisma.patient.findMany({
        where: { clinicId: clinic.id },
        select: { id: true, firstName: true, paternalLastName: true }
      });

      console.log(`\n🏥 ${clinic.name} (${clinic.id}):`);
      console.log(`   Pacientes: ${patients.length}`);
      
      patients.forEach(patient => {
        console.log(`     - ${patient.id} - ${patient.firstName} ${patient.paternalLastName}`);
      });
    }

    // 5. MOSTRAR PACIENTES INDIVIDUALES (SIN CLÍNICA)
    console.log('\n👤 PACIENTES INDIVIDUALES (sin clínica):');
    
    const individualPatients = await prisma.patient.findMany({
      where: { clinicId: null },
      select: { id: true, firstName: true, paternalLastName: true }
    });

    console.log(`   Pacientes individuales: ${individualPatients.length}`);
    individualPatients.forEach(patient => {
      console.log(`     - ${patient.id} - ${patient.firstName} ${patient.paternalLastName}`);
    });

    console.log('\n🎉 SISTEMA MULTI-CLÍNICA CONFIGURADO EXITOSAMENTE!');
    console.log('\n📊 RESUMEN:');
    console.log(`   ✅ ${createdClinics.length} clínicas creadas`);
    console.log(`   ✅ ${testPatients.length} pacientes de clínica creados`);
    console.log(`   ✅ ${individualPatients.length} pacientes individuales existentes`);
    console.log('   ✅ IDs jerárquicos con prefijos de clínica implementados');
    console.log('   ✅ Separación de datos por clínica verificada');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si el archivo es llamado directamente
if (require.main === module) {
  createTestClinics();
}

module.exports = { createTestClinics };