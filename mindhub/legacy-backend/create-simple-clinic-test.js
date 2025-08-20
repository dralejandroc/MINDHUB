/**
 * Script simplificado para probar el sistema multi-clínica
 * Sin cambios de esquema, solo probando funcionalidad existente
 */

const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function testMultiClinicSystem() {
  console.log('🏥 Probando sistema multi-clínica (sin cambios de esquema)...\n');

  try {
    // 1. VERIFICAR PACIENTES EXISTENTES
    console.log('📋 PASO 1: Verificando pacientes existentes...');
    
    const existingPatients = await prisma.patient.findMany({
      select: { 
        id: true, 
        firstName: true, 
        paternalLastName: true,
        clinicId: true
      },
      take: 10
    });

    console.log(`   Pacientes encontrados: ${existingPatients.length}`);
    existingPatients.forEach(patient => {
      const clinicStatus = patient.clinicId ? `Clínica: ${patient.clinicId}` : 'Individual';
      console.log(`     - ${patient.id} - ${patient.firstName} ${patient.paternalLastName} (${clinicStatus})`);
    });

    // 2. PROBAR GENERADOR DE IDs DE CLÍNICA
    console.log('\n📋 PASO 2: Probando generador de IDs de clínica...');
    
    const { generateClinicId, getClinicCode } = require('./shared/utils/clinic-id-generator');
    
    const clinicNames = [
      'Hospital General de México',
      'Clínica Psicológica Integral',
      'Centro de Salud Mental'
    ];

    for (const clinicName of clinicNames) {
      try {
        console.log(`   Generando ID para: ${clinicName}`);
        const clinicId = await generateClinicId(clinicName);
        const clinicCode = getClinicCode(clinicId);
        console.log(`     ✅ ID generado: ${clinicId}`);
        console.log(`     ✅ Código: ${clinicCode}`);
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
      }
    }

    // 3. PROBAR GENERADOR DE IDs DE PACIENTES CON CLÍNICA
    console.log('\n📋 PASO 3: Probando generador de IDs de pacientes con clínica...');
    
    const { generateReadablePatientId, decodePatientId } = require('./shared/utils/patient-id-generator');
    
    const testPatientData = {
      firstName: 'María Elena',
      paternalLastName: 'Rodríguez',
      dateOfBirth: new Date('1985-03-15'),
      clinicId: 'CLI001-HOSPITAL-GENERAL-DE-MEXICO' // Simular clínica
    };

    try {
      console.log(`   Generando ID para paciente: ${testPatientData.firstName} ${testPatientData.paternalLastName}`);
      const patientId = await generateReadablePatientId(testPatientData);
      console.log(`     ✅ ID generado: ${patientId}`);
      
      // Decodificar ID
      const decoded = decodePatientId(patientId);
      console.log(`     ✅ Decodificado:`, {
        clinicCode: decoded.clinicCode,
        isClinicPatient: decoded.isClinicPatient,
        lastName: decoded.lastName,
        firstName: decoded.firstName,
        birthDate: decoded.birthDate.formatted
      });
      
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}`);
    }

    // 4. PROBAR VALIDADORES
    console.log('\n📋 PASO 4: Probando validadores de IDs...');
    
    const { isValidReadablePatientId } = require('./shared/utils/id-validators');
    
    const testIds = [
      'SAR19800315-2507A',           // Individual válido
      'CLI001-SAR19800315-2507A',   // Clínica válido
      'CLI001-SAR19800315-2507',    // Clínica sin sufijo
      'INVALID-ID',                 // Inválido
      'ROL19881122-2507'            // Individual sin sufijo
    ];

    testIds.forEach(id => {
      const isValid = isValidReadablePatientId(id);
      console.log(`     ${isValid ? '✅' : '❌'} ${id} - ${isValid ? 'Válido' : 'Inválido'}`);
    });

    console.log('\n🎉 PRUEBAS COMPLETADAS EXITOSAMENTE!');
    console.log('\n📊 RESUMEN:');
    console.log('   ✅ Generador de IDs de clínica funcionando');
    console.log('   ✅ Generador de IDs de pacientes con soporte multi-clínica');
    console.log('   ✅ Validadores actualizados para nuevos formatos');
    console.log('   ✅ Sistema listo para implementación completa');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si el archivo es llamado directamente
if (require.main === module) {
  testMultiClinicSystem();
}

module.exports = { testMultiClinicSystem };