/**
 * Script para crear notas extensas en las consultas de Roberto Sánchez Flores
 * - Notas clínicas largas y detalladas
 * - Aprovecha el nuevo campo LONGTEXT
 */

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

// Notas extensas realistas para consultas psicológicas/médicas
const extensiveNotes = [
  `CONSULTA PSICOLÓGICA - SESIÓN INICIAL

MOTIVO DE CONSULTA:
Lorem ipsum dolor sit amet, consectetur adipiscing elit. El paciente refiere episodios recurrentes de ansiedad generalizada que han incrementado en frecuencia e intensidad durante los últimos 6 meses. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

ANTECEDENTES:
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.

OBSERVACIONES CLÍNICAS:
Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

ANÁLISIS DEL ESTADO MENTAL:
Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.

PLAN TERAPÉUTICO:
Nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti.

RECOMENDACIONES:
Quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.`,

  `SEGUIMIENTO TERAPÉUTICO - SESIÓN 2

EVOLUCIÓN CLÍNICA:
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. El paciente muestra signos de mejoría en su capacidad de autorregulación emocional. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

TÉCNICAS APLICADAS:
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Se implementaron técnicas de respiración diafragmática y mindfulness para el manejo de la ansiedad. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

RESPUESTA DEL PACIENTE:
Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. El paciente reporta una reducción del 40% en los episodios de ansiedad.

TAREAS ASIGNADAS:
Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Se asignaron ejercicios de relajación progresiva para practicar en casa, 15 minutos diarios.

OBSERVACIONES ADICIONALES:
Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. El paciente manifiesta buena adherencia al tratamiento y motivación para continuar.

PRÓXIMA SESIÓN:
Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Se programará nueva sesión en 2 semanas para evaluar progreso y ajustar estrategias terapéuticas según sea necesario.`,

  `EVALUACIÓN INTERMEDIA - SESIÓN 5

RESUMEN DEL PROGRESO:
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Después de 5 sesiones, el paciente ha demostrado avances significativos en el manejo de sus síntomas ansiosos. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. La frecuencia de los ataques de pánico ha disminuido de 3-4 por semana a 1 cada 10 días aproximadamente.

HERRAMIENTAS DESARROLLADAS:
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. El paciente ha internalizado exitosamente las técnicas de:
- Respiración diafragmática (dominio: 85%)
- Técnicas de grounding (dominio: 70%)
- Reestructuración cognitiva básica (dominio: 60%)
- Mindfulness y atención plena (dominio: 75%)

ANÁLISIS COGNITIVO-CONDUCTUAL:
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Se observa una modificación positiva en los patrones de pensamiento catastrófico. El paciente ha logrado identificar y cuestionar sus pensamientos automáticos negativos en aproximadamente el 65% de las situaciones desencadenantes.

ÁREA FAMILIAR Y SOCIAL:
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Las relaciones interpersonales han mejorado notablemente. El paciente reporta mayor facilidad para comunicar sus necesidades y límites personales.

AJUSTES AL PLAN TERAPÉUTICO:
Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Se incorporarán técnicas de exposición gradual para situaciones específicas que aún generan ansiedad moderada. Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

OBJETIVOS PARA LAS PRÓXIMAS SESIONES:
Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.`
];

function getRandomExtensiveNote() {
  return extensiveNotes[Math.floor(Math.random() * extensiveNotes.length)];
}

async function updateRobertoWithExtensiveNotes() {
  console.log('📝 Actualizando consultas de Roberto con notas extensas...\n');

  try {
    // Buscar a Roberto Sánchez Flores
    const roberto = await prisma.patient.findFirst({
      where: {
        firstName: 'Roberto',
        paternalLastName: 'Sánchez',
        maternalLastName: 'Flores'
      }
    });

    if (!roberto) {
      console.error('❌ Roberto Sánchez Flores no encontrado');
      return;
    }

    console.log(`✅ Paciente encontrado: ${roberto.firstName} ${roberto.paternalLastName} ${roberto.maternalLastName}`);

    // Obtener todas las consultas de Roberto
    const consultations = await prisma.consultation.findMany({
      where: {
        patientId: roberto.id
      },
      orderBy: {
        consultationDate: 'asc'
      }
    });

    console.log(`📅 Encontradas ${consultations.length} consultas para actualizar`);

    // Actualizar cada consulta con notas extensas
    for (let i = 0; i < consultations.length; i++) {
      const consultation = consultations[i];
      const extendedNote = `${getRandomExtensiveNote()}

DATOS TÉCNICOS DE LA SESIÓN:
- Duración: 60 minutos
- Modalidad: Presencial
- Técnicas utilizadas: Terapia Cognitivo-Conductual, Mindfulness
- Estado emocional inicial: Lorem ipsum dolor sit amet
- Estado emocional final: Consectetur adipiscing elit
- Nivel de cooperación: Excelente
- Adherencia a recomendaciones previas: Alta

PRÓXIMOS PASOS:
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

NOTAS ADICIONALES:
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.

---
Sesión actualizada: ${new Date().toLocaleDateString('es-ES')}
Dr. Alejandro Contreras - Psicólogo Clínico
Expediente: ${roberto.medicalRecordNumber}`;

      await prisma.consultation.update({
        where: {
          id: consultation.id
        },
        data: {
          notes: extendedNote
        }
      });

      console.log(`✅ Consulta ${i + 1} actualizada: ${new Date(consultation.consultationDate).toLocaleDateString('es-ES')}`);
    }

    console.log('\n🎉 Todas las consultas han sido actualizadas con notas extensas!');
    console.log(`📊 Resumen:`);
    console.log(`   - Paciente: Roberto Sánchez Flores`);
    console.log(`   - Consultas actualizadas: ${consultations.length}`);
    console.log(`   - Promedio de caracteres por nota: ~2,500`);
    console.log(`   - Capacidad máxima del campo notes: 4GB (LONGTEXT)`);
    
    // Mostrar una muestra de la primera nota
    const updatedConsultation = await prisma.consultation.findFirst({
      where: {
        patientId: roberto.id
      },
      orderBy: {
        consultationDate: 'desc'
      }
    });

    console.log('\n📝 Muestra de nota actualizada (primeros 300 caracteres):');
    console.log('---');
    console.log(updatedConsultation.notes.substring(0, 300) + '...');
    console.log('---');

  } catch (error) {
    console.error('❌ Error actualizando consultas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si el archivo es llamado directamente
if (require.main === module) {
  updateRobertoWithExtensiveNotes();
}

module.exports = { updateRobertoWithExtensiveNotes };