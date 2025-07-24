/**
 * Script para crear datos de prueba para MindHub
 * - Dr. Alejandro Contreras como usuario principal
 * - 6 pacientes de prueba con datos variados
 */

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

// Función para generar número de expediente médico único
async function generateMedicalRecordNumber() {
  const year = new Date().getFullYear();
  const prefix = 'EXP';
  
  // Obtener el conteo de pacientes creados este año
  const count = await prisma.patient.count({
    where: {
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1)
      }
    }
  });
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${year}-${sequence}`;
}

async function createTestData() {
  console.log('🏥 Creando datos de prueba para MindHub...\n');
  
  try {
    // 1. Crear roles si no existen
    console.log('📋 Creando roles...');
    await prisma.role.createMany({
      data: [
        { 
          id: 'role-psychiatrist', 
          name: 'psychiatrist', 
          description: 'Médico Psiquiatra con acceso completo' 
        },
        { 
          id: 'role-psychologist', 
          name: 'psychologist', 
          description: 'Psicólogo clínico' 
        },
        { 
          id: 'role-admin', 
          name: 'admin', 
          description: 'Administrador del sistema' 
        }
      ],
      skipDuplicates: true
    });
    console.log('✅ Roles creados\n');

    // 2. Crear Dr. Alejandro Contreras
    console.log('👨‍⚕️ Creando usuario Dr. Alejandro Contreras...');
    const drAlejandro = await prisma.user.upsert({
      where: { email: 'dr_aleks_c@hotmail.com' },
      update: {},
      create: {
        id: 'user-dr-alejandro',
        auth0Id: 'auth0|dr_alejandro_contreras',
        email: 'dr_aleks_c@hotmail.com',
        name: 'Dr. Alejandro Contreras',
        picture: null,
        lastLoginAt: new Date()
      }
    });

    // Asignar rol de psiquiatra
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: drAlejandro.id,
          roleId: 'role-psychiatrist'
        }
      },
      update: {},
      create: {
        userId: drAlejandro.id,
        roleId: 'role-psychiatrist'
      }
    });
    console.log(`✅ Usuario creado: ${drAlejandro.name} (${drAlejandro.email})\n`);

    // 3. Crear 6 pacientes de prueba
    console.log('👥 Creando 6 pacientes de prueba...');
    
    const testPatients = [
      {
        firstName: 'María Elena',
        lastName: 'García',
        paternalLastName: 'García',
        maternalLastName: 'López',
        dateOfBirth: new Date('1985-03-15'),
        gender: 'female',
        email: 'maria.garcia@email.com',
        phone: '+52-555-0001',
        address: 'Av. Insurgentes Sur 1234, Col. Del Valle',
        city: 'Ciudad de México',
        state: 'CDMX',
        postalCode: '03100',
        curp: 'GALM850315MDFPRS09',
        bloodType: 'O+',
        allergies: 'Penicilina',
        emergencyContact: '+52-555-0002',
        emergencyContactName: 'José García',
        emergencyContactPhone: '+52-555-0002'
      },
      {
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        paternalLastName: 'Rodríguez',
        maternalLastName: 'Martínez',
        dateOfBirth: new Date('1990-07-22'),
        gender: 'male',
        email: 'carlos.rodriguez@email.com',
        phone: '+52-555-0003',
        address: 'Calle Reforma 567, Col. Centro',
        city: 'Guadalajara',
        state: 'Jalisco',
        postalCode: '44100',
        curp: 'ROMC900722HJCMRT08',
        bloodType: 'A+',
        allergies: 'Ninguna conocida',
        emergencyContact: '+52-555-0004',
        emergencyContactName: 'Ana Martínez',
        emergencyContactPhone: '+52-555-0004'
      },
      {
        firstName: 'Ana Sofía',
        lastName: 'Hernández',
        paternalLastName: 'Hernández',
        maternalLastName: 'Vázquez',
        dateOfBirth: new Date('1978-11-08'),
        gender: 'female',
        email: 'ana.hernandez@email.com',
        phone: '+52-555-0005',
        address: 'Av. Universidad 890, Col. Copilco',
        city: 'Ciudad de México',
        state: 'CDMX',
        postalCode: '04360',
        curp: 'HEVA781108MDFRZN07',
        bloodType: 'B-',
        allergies: 'Aspirina, Mariscos',
        emergencyContact: '+52-555-0006',
        emergencyContactName: 'Roberto Hernández',
        emergencyContactPhone: '+52-555-0006'
      },
      {
        firstName: 'Luis Miguel',
        lastName: 'Torres',
        paternalLastName: 'Torres',
        maternalLastName: 'Jiménez',
        dateOfBirth: new Date('1995-12-30'),
        gender: 'male',
        email: 'luis.torres@email.com',
        phone: '+52-555-0007',
        address: 'Blvd. Kukulcán 123, Zona Hotelera',
        city: 'Cancún',
        state: 'Quintana Roo',
        postalCode: '77500',
        curp: 'TOJL951230HQTRMS06',
        bloodType: 'AB+',
        allergies: 'Látex',
        emergencyContact: '+52-555-0008',
        emergencyContactName: 'Carmen Jiménez',
        emergencyContactPhone: '+52-555-0008'
      },
      {
        firstName: 'Patricia',
        lastName: 'Morales',
        paternalLastName: 'Morales',
        maternalLastName: 'Ruiz',
        dateOfBirth: new Date('1982-05-18'),
        gender: 'female',
        email: 'patricia.morales@email.com',
        phone: '+52-555-0009',
        address: 'Calle Hidalgo 456, Col. Centro Histórico',
        city: 'Puebla',
        state: 'Puebla',
        postalCode: '72000',
        curp: 'MORP820518MPLLTS05',
        bloodType: 'O-',
        allergies: 'Ninguna conocida',
        emergencyContact: '+52-555-0010',
        emergencyContactName: 'Miguel Ruiz',
        emergencyContactPhone: '+52-555-0010'
      },
      {
        firstName: 'Roberto',
        lastName: 'Sánchez',
        paternalLastName: 'Sánchez',
        maternalLastName: 'Flores',
        dateOfBirth: new Date('1988-09-12'),
        gender: 'male',
        email: 'roberto.sanchez@email.com',
        phone: '+52-555-0011',
        address: 'Av. Revolución 789, Col. San Ángel',
        city: 'Ciudad de México',
        state: 'CDMX',
        postalCode: '01000',
        curp: 'SAFR880912HDFNLB04',
        bloodType: 'A-',
        allergies: 'Polen, Polvo',
        emergencyContact: '+52-555-0012',
        emergencyContactName: 'Isabel Flores',
        emergencyContactPhone: '+52-555-0012'
      }
    ];

    const createdPatients = [];
    
    for (let i = 0; i < testPatients.length; i++) {
      const patientData = testPatients[i];
      const medicalRecordNumber = await generateMedicalRecordNumber();
      
      const patient = await prisma.patient.create({
        data: {
          ...patientData,
          medicalRecordNumber,
          createdBy: drAlejandro.id,
          consentToTreatment: true,
          consentToDataProcessing: true,
          isActive: true
        }
      });
      
      createdPatients.push(patient);
      console.log(`✅ Paciente creado: ${patient.firstName} ${patient.lastName} (${patient.medicalRecordNumber})`);
      
      // Crear historial médico inicial para cada paciente
      await prisma.medicalHistory.create({
        data: {
          patientId: patient.id,
          condition: 'Registro inicial en sistema',
          status: 'active',
          notes: `Paciente registrado por ${drAlejandro.name} el ${new Date().toLocaleDateString('es-MX')}`,
        }
      });
    }

    // 4. Crear algunas consultas de ejemplo
    console.log('\n💬 Creando consultas de ejemplo...');
    
    const sampleConsultations = [
      {
        patientId: createdPatients[0].id,
        consultationDate: new Date('2024-01-15T10:00:00'),
        reason: 'Evaluación inicial - síntomas de ansiedad',
        notes: 'Paciente refiere síntomas de ansiedad generalizada. Se recomienda evaluación con escalas.',
        diagnosis: 'Trastorno de ansiedad generalizada (F41.1)',
        treatmentPlan: 'Terapia cognitivo-conductual, seguimiento en 2 semanas',
        status: 'completed'
      },
      {
        patientId: createdPatients[1].id,
        consultationDate: new Date('2024-01-20T14:30:00'),
        reason: 'Seguimiento - estado de ánimo deprimido',
        notes: 'Paciente continúa con síntomas depresivos. Respuesta parcial al tratamiento.',
        diagnosis: 'Episodio depresivo moderado (F32.1)',
        treatmentPlan: 'Ajuste de medicación, continuación de psicoterapia',
        status: 'completed'
      },
      {
        patientId: createdPatients[2].id,
        consultationDate: new Date('2024-01-25T16:00:00'),
        reason: 'Evaluación cognitiva - problemas de memoria',
        notes: 'Evaluación neuropsicológica solicitada por familiares.',
        diagnosis: 'Pendiente evaluación completa',
        treatmentPlan: 'Aplicación de escalas cognitivas, laboratorios',
        status: 'completed'
      }
    ];

    for (const consultation of sampleConsultations) {
      await prisma.consultation.create({
        data: {
          ...consultation,
          consultantId: drAlejandro.id
        }
      });
    }
    console.log('✅ Consultas de ejemplo creadas\n');

    // 5. Resumen final
    console.log('📊 RESUMEN DE DATOS CREADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👨‍⚕️ Usuario: ${drAlejandro.name} (${drAlejandro.email})`);
    console.log(`👥 Pacientes: ${createdPatients.length}`);
    console.log(`💬 Consultas: ${sampleConsultations.length}`);
    console.log('\n📋 PACIENTES CREADOS:');
    
    createdPatients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.firstName} ${patient.lastName}`);
      console.log(`   📋 Expediente: ${patient.medicalRecordNumber}`);
      console.log(`   📧 Email: ${patient.email}`);
      console.log(`   📱 Teléfono: ${patient.phone}`);
      console.log(`   🏠 Ciudad: ${patient.city}, ${patient.state}`);
      console.log('');
    });

    console.log('🎉 ¡Datos de prueba creados exitosamente!');
    console.log('\n📌 INSTRUCCIONES DE USO:');
    console.log('1. Inicia sesión con: dr_aleks_c@hotmail.com');
    console.log('2. Ve al módulo Expedix para ver los pacientes');
    console.log('3. Los pacientes tienen consultas y historial médico');
    console.log('4. Puedes crear evaluaciones clínicas en Clinimetrix');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    
    // Información adicional para debugging
    if (error.code === 'P2002') {
      console.error('🔍 Error de duplicado. Verifica que no existan registros duplicados.');
    } else if (error.code === 'P2025') {
      console.error('🔍 Registro no encontrado. Verifica las relaciones entre modelos.');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  createTestData()
    .catch((error) => {
      console.error('💥 Fallo crítico:', error);
      process.exit(1);
    });
}

module.exports = { createTestData };