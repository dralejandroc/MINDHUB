/**
 * Script para crear datos reales de timeline para Roberto Sánchez Flores
 * - Consultas desde enero 2025 hasta la fecha
 * - Datos conectados a la base de datos MySQL/MAMP
 * - Todo ligado al usuario (Dr. Alejandro Contreras)
 */

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

// Lorem ipsum texts for realistic consultation data
const loremTexts = {
  chief_complaints: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum in nulla vel magna tristique.",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    "Ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris congue elementum urna.",
    "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis."
  ],
  objective_findings: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vitae congue eu consequat ac felis donec et odio pellentesque.",
    "Consectetur adipiscing elit pellentesque habitant morbi tristique senectus. Et netus et malesuada fames ac turpis egestas.",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud.",
    "Ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi morbi tempus iaculis urna.",
    "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas sed."
  ],
  assessments: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Assessment findings indicate normal parameters.",
    "Consectetur adipiscing elit, sed do eiusmod tempor incididunt. Clinical assessment shows improvement.",
    "Ut aliquip ex ea commodo consequat. Duis aute irure dolor. Assessment reveals stable condition.",
    "Excepteur sint occaecat cupidatat non proident. Assessment indicates continued monitoring needed.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Assessment shows positive response.",
    "Pellentesque habitant morbi tristique senectus. Assessment indicates good progress overall.",
    "Sed do eiusmod tempor incididunt ut labore. Assessment reveals no significant changes."
  ],
  plans: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Continue current treatment plan with follow-up.",
    "Consectetur adipiscing elit, sed do eiusmod tempor. Adjust medication dosage and schedule follow-up.",
    "Ut aliquip ex ea commodo consequat. Duis aute irure. Implement lifestyle modifications and monitoring.",
    "Excepteur sint occaecat cupidatat non proident. Continue therapy with weekly sessions.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Plan includes regular monitoring.",
    "Pellentesque habitant morbi tristique senectus. Plan involves gradual dose reduction.",
    "Sed do eiusmod tempor incididunt ut labore. Plan includes nutritional counseling."
  ]
};

function getRandomText(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function createRobertoTimelineData() {
  console.log('🏥 Creando datos de timeline para Roberto Sánchez Flores...\n');

  try {
    // Buscar al Dr. Alejandro Contreras
    let doctor = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'alejandro.contreras@mindhub.com' },
          { email: 'dr_aleks_c@hotmail.com' }
        ]
      }
    });

    if (!doctor) {
      console.log('👨‍⚕️ Creando Dr. Alejandro Contreras...');
      doctor = await prisma.user.create({
        data: {
          email: 'dr_aleks_c@hotmail.com',
          firstName: 'Alejandro',
          lastName: 'Contreras',
          role: 'doctor',
          isActive: true,
          preferences: {
            language: 'es',
            timezone: 'America/Mexico_City'
          }
        }
      });
    }

    console.log(`✅ Dr. encontrado: ${doctor.firstName} ${doctor.lastName}`);

    // Buscar a Roberto Sánchez Flores
    let roberto = await prisma.patient.findFirst({
      where: {
        firstName: 'Roberto',
        paternalLastName: 'Sánchez',
        maternalLastName: 'Flores'
      }
    });

    if (!roberto) {
      console.log('📝 Roberto Sánchez Flores no encontrado, creándolo...');
      
      // Crear Roberto si no existe
      roberto = await prisma.patient.create({
        data: {
          medicalRecordNumber: `EXP-2025-0001`,
          firstName: 'Roberto',
          paternalLastName: 'Sánchez',
          maternalLastName: 'Flores',
          dateOfBirth: new Date('1980-03-15'),
          gender: 'masculine',
          email: 'roberto.sanchez@email.com',
          phone: '555-0123',
          address: 'Calle Principal 123, Ciudad de México',
          emergencyContactName: 'María Sánchez',
          emergencyContactPhone: '555-0124',
          userId: doctor.id
        }
      });
    }

    console.log(`✅ Paciente encontrado: ${roberto.firstName} ${roberto.paternalLastName} ${roberto.maternalLastName}`);

    // Eliminar datos existentes de consultas para este paciente
    await prisma.consultation.deleteMany({
      where: {
        patientId: roberto.id
      }
    });

    console.log('🗑️ Datos existentes eliminados');

    // Crear consultas desde enero 2025 hasta ahora
    const startDate = new Date('2025-01-01');
    const endDate = new Date();
    const consultations = [];

    // Generar 8-12 consultas en el período
    const numberOfConsultations = Math.floor(Math.random() * 5) + 8; // 8-12 consultas

    console.log(`📅 Creando ${numberOfConsultations} consultas...`);

    for (let i = 0; i < numberOfConsultations; i++) {
      const consultationDate = getRandomDate(startDate, endDate);
      
      const consultation = await prisma.consultation.create({
        data: {
          patientId: roberto.id,
          consultantId: doctor.id,
          consultationDate: consultationDate,
          reason: getRandomText(loremTexts.chief_complaints),
          notes: `Consulta ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
          diagnosis: i % 2 === 0 ? getRandomText(loremTexts.assessments) : null,
          treatmentPlan: getRandomText(loremTexts.plans),
          status: 'completed',
          createdAt: consultationDate,
          updatedAt: consultationDate
        }
      });

      consultations.push(consultation);
      console.log(`✅ Consulta ${i + 1} creada: ${consultationDate.toLocaleDateString('es-ES')}`);
    }

    // Por ahora solo trabajamos con consultas, las notas se pueden agregar después
    const clinicalNotes = [];

    console.log('\n🎉 Datos de timeline creados exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - Paciente: Roberto Sánchez Flores`);
    console.log(`   - Consultas creadas: ${consultations.length}`);
    console.log(`   - Notas clínicas: ${clinicalNotes.length}`);
    console.log(`   - Período: Enero 2025 - ${endDate.toLocaleDateString('es-ES')}`);
    console.log(`   - Doctor: Dr. ${doctor.firstName} ${doctor.lastName}`);
    
    console.log('\n📋 Fechas de consultas creadas:');
    consultations
      .sort((a, b) => new Date(a.consultationDate) - new Date(b.consultationDate))
      .forEach((consultation, index) => {
        console.log(`   ${index + 1}. ${new Date(consultation.consultationDate).toLocaleDateString('es-ES')}`);
      });

  } catch (error) {
    console.error('❌ Error creando datos de timeline:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si el archivo es llamado directamente
if (require.main === module) {
  createRobertoTimelineData();
}

module.exports = { createRobertoTimelineData };