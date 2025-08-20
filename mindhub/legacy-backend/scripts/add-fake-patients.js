/**
 * Script para agregar 10 pacientes falsos a la base de datos de producción
 * Distribución: 3 niños, 2 adolescentes, 3 adultos, 2 adultos mayores
 */

const { getPrismaClient } = require('../shared/config/prisma');
const { v4: uuidv4 } = require('uuid');

const prisma = getPrismaClient();

// Datos de pacientes falsos organizados por grupo de edad
const fakePatients = [
  // 3 Niños (6-12 años)
  {
    firstName: 'Sofia',
    lastName: 'García Mendoza',
    dateOfBirth: '2015-03-15', // 10 años
    gender: 'female',
    email: 'sofia.garcia.demo@mindhub.cloud',
    phone: '+52 55 1234 5601',
    address: JSON.stringify({
      street: 'Av. Revolución 1234',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '03100',
      country: 'México'
    }),
    emergencyContact: JSON.stringify({
      name: 'María Elena Mendoza',
      relationship: 'Madre',
      phone: '+52 55 1234 5602'
    }),
    medicalHistory: JSON.stringify({
      allergies: ['Ninguna conocida'],
      medications: [],
      conditions: ['Ansiedad leve'],
      notes: 'Paciente pediátrico con episodios de ansiedad escolar'
    }),
    familyHistory: JSON.stringify({
      psychiatric: ['Ansiedad - madre'],
      medical: ['Diabetes - abuelo paterno']
    }),
    tags: ['Pediatría', 'Ansiedad', 'Primera consulta']
  },
  {
    firstName: 'Diego',
    lastName: 'Hernández López',
    dateOfBirth: '2017-08-22', // 8 años
    gender: 'male',
    email: 'diego.hernandez.demo@mindhub.cloud',
    phone: '+52 55 1234 5603',
    address: JSON.stringify({
      street: 'Calle Insurgentes 567',
      city: 'Guadalajara',
      state: 'Jalisco',
      zipCode: '44100',
      country: 'México'
    }),
    emergencyContact: JSON.stringify({
      name: 'Carlos Hernández',
      relationship: 'Padre',
      phone: '+52 33 1234 5604'
    }),
    medicalHistory: JSON.stringify({
      allergies: ['Polen'],
      medications: [],
      conditions: ['TDAH leve'],
      notes: 'Evaluación por dificultades de atención en el aula'
    }),
    familyHistory: JSON.stringify({
      psychiatric: ['TDAH - hermano mayor'],
      medical: ['Asma - madre']
    }),
    tags: ['Pediatría', 'TDAH', 'Seguimiento']
  },
  {
    firstName: 'Isabella',
    lastName: 'Martín Vázquez',
    dateOfBirth: '2016-11-10', // 9 años
    gender: 'female',
    email: 'isabella.martin.demo@mindhub.cloud',
    phone: '+52 55 1234 5605',
    address: JSON.stringify({
      street: 'Paseo de la Reforma 890',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '06600',
      country: 'México'
    }),
    emergencyContact: JSON.stringify({
      name: 'Ana Vázquez',
      relationship: 'Madre',
      phone: '+52 55 1234 5606'
    }),
    medicalHistory: JSON.stringify({
      allergies: ['Mariscos'],
      medications: [],
      conditions: ['Mutismo selectivo'],
      notes: 'Dificultades para hablar en entornos sociales específicos'
    }),
    familyHistory: JSON.stringify({
      psychiatric: ['Ansiedad social - madre'],
      medical: ['Hipertensión - abuelo']
    }),
    tags: ['Pediatría', 'Mutismo selectivo', 'Terapia familiar']
  },

  // 2 Adolescentes (13-17 años)
  {
    firstName: 'Alejandro',
    lastName: 'Ruiz Morales',
    dateOfBirth: '2009-05-18', // 16 años
    gender: 'male',
    email: 'alejandro.ruiz.demo@mindhub.cloud',
    phone: '+52 55 1234 5607',
    address: JSON.stringify({
      street: 'Av. Universidad 456',
      city: 'Monterrey',
      state: 'Nuevo León',
      zipCode: '64000',
      country: 'México'
    }),
    emergencyContact: JSON.stringify({
      name: 'Patricia Morales',
      relationship: 'Madre',
      phone: '+52 81 1234 5608'
    }),
    medicalHistory: JSON.stringify({
      allergies: ['Ninguna conocida'],
      medications: [],
      conditions: ['Depresión leve', 'Ansiedad social'],
      notes: 'Episodio depresivo relacionado con presión académica'
    }),
    familyHistory: JSON.stringify({
      psychiatric: ['Depresión - madre', 'Trastorno bipolar - tío'],
      medical: ['Diabetes tipo 2 - padre']
    }),
    tags: ['Adolescentes', 'Depresión', 'Ansiedad social', 'Presión académica']
  },
  {
    firstName: 'Camila',
    lastName: 'Torres Castillo',
    dateOfBirth: '2010-01-25', // 15 años
    gender: 'female',
    email: 'camila.torres.demo@mindhub.cloud',
    phone: '+52 55 1234 5609',
    address: JSON.stringify({
      street: 'Calle Morelos 123',
      city: 'Puebla',
      state: 'Puebla',
      zipCode: '72000',
      country: 'México'
    }),
    emergencyContact: JSON.stringify({
      name: 'Roberto Torres',
      relationship: 'Padre',
      phone: '+52 22 1234 5610'
    }),
    medicalHistory: JSON.stringify({
      allergies: ['Penicilina'],
      medications: [],
      conditions: ['Trastorno de la conducta alimentaria'],
      notes: 'Seguimiento por patrones alimentarios restrictivos'
    }),
    familyHistory: JSON.stringify({
      psychiatric: ['Ansiedad - abuela'],
      medical: ['Obesidad - familia paterna']
    }),
    tags: ['Adolescentes', 'TCA', 'Nutrición', 'Seguimiento intensivo']
  },

  // 3 Adultos (18-64 años)
  {
    firstName: 'María José',
    lastName: 'Sánchez Rivera',
    dateOfBirth: '1985-09-12', // 39 años
    gender: 'female',
    email: 'maria.sanchez.demo@mindhub.cloud',
    phone: '+52 55 1234 5611',
    address: JSON.stringify({
      street: 'Av. Constituyentes 789',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '11800',
      country: 'México'
    }),
    emergencyContact: JSON.stringify({
      name: 'Juan Carlos Rivera',
      relationship: 'Esposo',
      phone: '+52 55 1234 5612'
    }),
    medicalHistory: JSON.stringify({
      allergies: ['Ibuprofeno'],
      medications: ['Sertralina 50mg'],
      conditions: ['Trastorno depresivo mayor', 'Trastorno de ansiedad generalizada'],
      notes: 'Episodio depresivo mayor con buena respuesta al tratamiento farmacológico'
    }),
    familyHistory: JSON.stringify({
      psychiatric: ['Depresión - madre', 'Trastorno bipolar - hermana'],
      medical: ['Hipertensión - padre', 'Diabetes - abuela']
    }),
    tags: ['Adultos', 'Depresión mayor', 'TAG', 'Farmacoterapia']
  },
  {
    firstName: 'Roberto',
    lastName: 'Méndez Guerrero',
    dateOfBirth: '1978-04-30', // 47 años
    gender: 'male',
    email: 'roberto.mendez.demo@mindhub.cloud',
    phone: '+52 55 1234 5613',
    address: JSON.stringify({
      street: 'Calle Reforma 234',
      city: 'Querétaro',
      state: 'Querétaro',
      zipCode: '76000',
      country: 'México'
    }),
    emergencyContact: JSON.stringify({
      name: 'Sofía Guerrero',
      relationship: 'Esposa',
      phone: '+52 442 1234 5614'
    }),
    medicalHistory: JSON.stringify({
      allergies: ['Ninguna conocida'],
      medications: ['Escitalopram 10mg', 'Lorazepam 1mg SOS'],
      conditions: ['Trastorno de pánico', 'Agorafobia'],
      notes: 'Crisis de pánico recurrentes con evitación de espacios públicos'
    }),
    familyHistory: JSON.stringify({
      psychiatric: ['Ansiedad - madre'],
      medical: ['Cardiopatía - padre', 'Cáncer - hermano']
    }),
    tags: ['Adultos', 'Pánico', 'Agorafobia', 'Tratamiento combinado']
  },
  {
    firstName: 'Ana Patricia',
    lastName: 'Flores Delgado',
    dateOfBirth: '1992-12-08', // 32 años
    gender: 'female',
    email: 'ana.flores.demo@mindhub.cloud',
    phone: '+52 55 1234 5615',
    address: JSON.stringify({
      street: 'Av. Juárez 567',
      city: 'Tijuana',
      state: 'Baja California',
      zipCode: '22000',
      country: 'México'
    }),
    emergencyContact: JSON.stringify({
      name: 'Luis Delgado',
      relationship: 'Hermano',
      phone: '+52 664 1234 5616'
    }),
    medicalHistory: JSON.stringify({
      allergies: ['Sulfamidas'],
      medications: [],
      conditions: ['Trastorno límite de la personalidad'],
      notes: 'Terapia dialéctica conductual en curso, episodios de disregulación emocional'
    }),
    familyHistory: JSON.stringify({
      psychiatric: ['Trastorno bipolar - padre', 'Suicidio - tío'],
      medical: ['Diabetes - madre']
    }),
    tags: ['Adultos', 'TLP', 'DBT', 'Disregulación emocional']
  },

  // 2 Adultos mayores (65+ años)
  {
    firstName: 'Eduardo',
    lastName: 'Vargas Peña',
    dateOfBirth: '1952-07-20', // 72 años
    gender: 'male',
    email: 'eduardo.vargas.demo@mindhub.cloud',
    phone: '+52 55 1234 5617',
    address: JSON.stringify({
      street: 'Calle Hidalgo 890',
      city: 'Mérida',
      state: 'Yucatán',
      zipCode: '97000',
      country: 'México'
    }),
    emergencyContact: JSON.stringify({
      name: 'Carmen Peña',
      relationship: 'Esposa',
      phone: '+52 999 1234 5618'
    }),
    medicalHistory: JSON.stringify({
      allergies: ['Aspirina'],
      medications: ['Donepezilo 5mg', 'Memantina 10mg'],
      conditions: ['Deterioro cognitivo leve', 'Síntomas depresivos'],
      notes: 'Seguimiento por deterioro cognitivo con componente depresivo asociado'
    }),
    familyHistory: JSON.stringify({
      psychiatric: ['Demencia - madre'],
      medical: ['Alzheimer - padre', 'Hipertensión - hermanos']
    }),
    tags: ['Adultos mayores', 'Deterioro cognitivo', 'Depresión geriátrica']
  },
  {
    firstName: 'Carmen',
    lastName: 'Jiménez Ortega',
    dateOfBirth: '1948-02-14', // 77 años
    gender: 'female',
    email: 'carmen.jimenez.demo@mindhub.cloud',
    phone: '+52 55 1234 5619',
    address: JSON.stringify({
      street: 'Av. Independencia 345',
      city: 'Oaxaca',
      state: 'Oaxaca',
      zipCode: '68000',
      country: 'México'
    }),
    emergencyContact: JSON.stringify({
      name: 'Miguel Ortega',
      relationship: 'Hijo',
      phone: '+52 951 1234 5620'
    }),
    medicalHistory: JSON.stringify({
      allergies: ['Codeína'],
      medications: ['Trazodona 50mg', 'Mirtazapina 15mg'],
      conditions: ['Depresión mayor', 'Insomnio crónico', 'Duelo complicado'],
      notes: 'Episodio depresivo posterior a pérdida del cónyuge, insomnio severo'
    }),
    familyHistory: JSON.stringify({
      psychiatric: ['Depresión - hermana'],
      medical: ['Diabetes - múltiples familiares', 'Hipertensión - hermanos']
    }),
    tags: ['Adultos mayores', 'Depresión mayor', 'Duelo', 'Insomnio']
  }
];

async function addFakePatients() {
  try {
    console.log('🚀 Agregando 10 pacientes falsos a la base de datos...\n');

    for (let i = 0; i < fakePatients.length; i++) {
      const patientData = fakePatients[i];
      
      console.log(`📋 Creando paciente ${i + 1}/10: ${patientData.firstName} ${patientData.lastName}`);
      
      // Generate unique IDs
      const patientId = uuidv4();
      
      // Calculate age
      const birthDate = new Date(patientData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      const patient = await prisma.patients.create({
        data: {
          id: patientId,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          dateOfBirth: new Date(patientData.dateOfBirth),
          gender: patientData.gender,
          email: patientData.email,
          phone: patientData.phone,
          address: patientData.address,
          emergencyContact: patientData.emergencyContact,
          allergies: JSON.parse(patientData.medicalHistory).allergies.join(', '),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`   ✅ Creado: ID ${patient.id}, Edad ${age} años`);
      
      // Add patient tags if needed (this would require a separate tags system)
      console.log(`   🏷️  Tags: ${patientData.tags.join(', ')}`);
    }

    console.log('\n🎉 ¡Todos los pacientes han sido creados exitosamente!');
    
    // Verify creation
    const totalPatients = await prisma.patients.count();
    console.log(`\n📊 Total de pacientes en la base de datos: ${totalPatients}`);
    
    // Show summary by age group
    const children = await prisma.patients.count({
      where: {
        dateOfBirth: {
          gte: new Date('2012-01-01') // Niños: 12 años o menos
        }
      }
    });
    
    const adolescents = await prisma.patients.count({
      where: {
        dateOfBirth: {
          gte: new Date('2007-01-01'),
          lt: new Date('2012-01-01') // Adolescentes: 13-17 años
        }
      }
    });
    
    const adults = await prisma.patients.count({
      where: {
        dateOfBirth: {
          gte: new Date('1960-01-01'),
          lt: new Date('2007-01-01') // Adultos: 18-64 años
        }
      }
    });
    
    const elderly = await prisma.patients.count({
      where: {
        dateOfBirth: {
          lt: new Date('1960-01-01') // Adultos mayores: 65+ años
        }
      }
    });
    
    console.log('\n👥 Distribución por grupos de edad:');
    console.log(`   👶 Niños (≤12 años): ${children}`);
    console.log(`   🧒 Adolescentes (13-17 años): ${adolescents}`);
    console.log(`   👨 Adultos (18-64 años): ${adults}`);
    console.log(`   👴 Adultos mayores (≥65 años): ${elderly}`);
    
  } catch (error) {
    console.error('❌ Error al crear pacientes falsos:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  addFakePatients();
}

module.exports = { addFakePatients, fakePatients };