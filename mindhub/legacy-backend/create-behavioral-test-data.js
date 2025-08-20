/**
 * Crear datos de prueba para el sistema de análisis conductual
 * Este script insertará algunos eventos conductuales de ejemplo para demostrar la funcionalidad
 */

const { PrismaClient } = require('./generated/prisma');
const { v4: uuidv4 } = require('uuid');

async function createBehavioralTestData() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Creando datos de prueba para análisis conductual...');

    // Obtener algunos pacientes de ejemplo
    const patients = await prisma.patient.findMany({
      take: 5,
      include: {
        consultations: true
      }
    });

    console.log(`📋 Encontrados ${patients.length} pacientes para datos de prueba`);

    // Crear eventos conductuales para cada paciente
    for (const patient of patients) {
      console.log(`\n👤 Creando datos para: ${patient.firstName} ${patient.paternalLastName}`);
      
      // Simular diferentes patrones de comportamiento según el paciente
      let behaviorProfile = 'normal';
      
      // Roberto Sánchez - High Maintenance (muchas consultas)
      if (patient.id.includes('SNR')) {
        behaviorProfile = 'high_maintenance';
      }
      // Juan Pérez - At Risk (pocas consultas)
      else if (patient.id.includes('PRJ')) {
        behaviorProfile = 'at_risk';
      }
      // María Elena García - Compliant
      else if (patient.id.includes('GAM')) {
        behaviorProfile = 'compliant';
      }

      await createBehavioralEvents(prisma, patient, behaviorProfile);
      await createCommunicationEvents(prisma, patient, behaviorProfile);
    }

    console.log('\n✅ Datos de prueba creados exitosamente');
    console.log('📊 Ahora puedes ver el análisis conductual en el timeline de pacientes');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createBehavioralEvents(prisma, patient, behaviorProfile) {
  const events = [];
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 6); // Empezar hace 6 meses

  switch (behaviorProfile) {
    case 'high_maintenance':
      // Roberto: Muchas llegadas tarde y comunicaciones
      for (let i = 0; i < 8; i++) {
        const eventDate = new Date(baseDate);
        eventDate.setDate(eventDate.getDate() + (i * 20));
        
        if (i % 3 === 0) {
          events.push({
            id: uuidv4(),
            patient_id: patient.id,
            event_type: 'late_arrival',
            description: `Llegó ${15 + (i * 5)} minutos tarde`,
            delay_minutes: 15 + (i * 5),
            recorded_by: 'user-dr-alejandro',
            recorded_at: eventDate,
          });
        }
        
        if (i === 5) {
          events.push({
            id: uuidv4(),
            patient_id: patient.id,
            event_type: 'cancelled_last_minute',
            description: 'Canceló 2 horas antes por emergencia personal',
            recorded_by: 'user-dr-alejandro',
            recorded_at: eventDate,
          });
        }
      }
      break;

    case 'at_risk':
      // Juan: No-shows y cancelaciones
      for (let i = 0; i < 4; i++) {
        const eventDate = new Date(baseDate);
        eventDate.setMonth(eventDate.getMonth() + (i * 1.5));
        
        if (i % 2 === 0) {
          events.push({
            id: uuidv4(),
            patient_id: patient.id,
            event_type: 'no_show',
            description: 'No se presentó sin avisar',
            recorded_by: 'user-dr-alejandro',
            recorded_at: eventDate,
          });
        } else {
          events.push({
            id: uuidv4(),
            patient_id: patient.id,
            event_type: 'late_arrival',
            description: `Llegó ${30 + (i * 10)} minutos tarde`,
            delay_minutes: 30 + (i * 10),
            recorded_by: 'user-dr-alejandro',
            recorded_at: eventDate,
          });
        }
      }
      break;

    case 'compliant':
      // María Elena: Principalmente llegadas tempranas
      for (let i = 0; i < 3; i++) {
        const eventDate = new Date(baseDate);
        eventDate.setMonth(eventDate.getMonth() + (i * 2));
        
        events.push({
          id: uuidv4(),
          patient_id: patient.id,
          event_type: 'early_arrival',
          description: 'Llegó 10 minutos antes de su cita',
          recorded_by: 'user-dr-alejandro',
          recorded_at: eventDate,
        });
      }
      break;

    default:
      // Perfil normal: algunos retrasos menores
      const eventDate = new Date(baseDate);
      eventDate.setMonth(eventDate.getMonth() + 2);
      
      events.push({
        id: uuidv4(),
        patient_id: patient.id,
        event_type: 'late_arrival',
        description: 'Llegó 5 minutos tarde por tráfico',
        delay_minutes: 5,
        recorded_by: 'user-dr-alejandro',
        recorded_at: eventDate,
      });
      break;
  }

  // Insertar eventos
  for (const event of events) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO appointment_behavioral_logs 
      (id, patient_id, event_type, description, delay_minutes, recorded_by, recorded_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, event.id, event.patient_id, event.event_type, event.description, event.delay_minutes, event.recorded_by, event.recorded_at);
  }

  console.log(`  📝 Creados ${events.length} eventos conductuales`);
}

async function createCommunicationEvents(prisma, patient, behaviorProfile) {
  const communications = [];
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 4);

  switch (behaviorProfile) {
    case 'high_maintenance':
      // Roberto: Muchas comunicaciones
      for (let i = 0; i < 12; i++) {
        const commDate = new Date(baseDate);
        commDate.setDate(commDate.getDate() + (i * 10));
        
        communications.push({
          id: uuidv4(),
          patient_id: patient.id,
          communication_type: i % 2 === 0 ? 'whatsapp' : 'phone_call',
          direction: i % 3 === 0 ? 'outgoing' : 'incoming',
          content: i % 2 === 0 ? 'Pregunta sobre efectos secundarios' : 'Solicita cambio de horario',
          duration: i % 2 === 1 ? 180 + (i * 30) : null, // Solo para llamadas
          recorded_by: 'user-dr-alejandro',
          communication_date: commDate,
        });
      }
      break;

    case 'at_risk':
      // Juan: Comunicaciones esporádicas
      for (let i = 0; i < 2; i++) {
        const commDate = new Date(baseDate);
        commDate.setMonth(commDate.getMonth() + (i * 3));
        
        communications.push({
          id: uuidv4(),
          patient_id: patient.id,
          communication_type: 'phone_call',
          direction: 'incoming',
          content: 'Llama después de largo tiempo sin contacto',
          duration: 120,
          recorded_by: 'user-dr-alejandro',
          communication_date: commDate,
        });
      }
      break;

    case 'compliant':
      // María Elena: Comunicación apropiada
      for (let i = 0; i < 4; i++) {
        const commDate = new Date(baseDate);
        commDate.setMonth(commDate.getMonth() + i);
        
        communications.push({
          id: uuidv4(),
          patient_id: patient.id,
          communication_type: 'whatsapp',
          direction: 'incoming',
          content: 'Consulta apropiada sobre tratamiento',
          recorded_by: 'user-dr-alejandro',
          communication_date: commDate,
        });
      }
      break;

    default:
      // Comunicación normal
      const commDate = new Date(baseDate);
      commDate.setMonth(commDate.getMonth() + 1);
      
      communications.push({
        id: uuidv4(),
        patient_id: patient.id,
        communication_type: 'phone_call',
        direction: 'incoming',
        content: 'Consulta de rutina',
        duration: 180,
        recorded_by: 'user-dr-alejandro',
        communication_date: commDate,
      });
      break;
  }

  // Insertar comunicaciones
  for (const comm of communications) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO patient_communications 
      (id, patient_id, communication_type, direction, content, duration, recorded_by, communication_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, comm.id, comm.patient_id, comm.communication_type, comm.direction, comm.content, comm.duration, comm.recorded_by, comm.communication_date);
  }

  console.log(`  💬 Creadas ${communications.length} comunicaciones`);
}

// Ejecutar script
createBehavioralTestData();