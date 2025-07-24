// Clinical Patient Categories - Complete Implementation
// Separated for maintainability

export const generateCategoryTimeline = (category: string, userType: 'clinic' | 'individual', startDate: Date) => {
  const timeline: any[] = [];

  switch (category) {
    case 'inconstante':
      // <50% asistencia, faltas constantes, no sigue instrucciones
      
      // Intentos de citas con muchas faltas
      for (let i = 0; i < 10; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i * 0.8);
        
        if (i === 1 || i === 3 || i === 5 || i === 7) {
          // No shows frecuentes
          timeline.push({
            id: `noshow-${i}`,
            type: 'no_show',
            title: 'Falta a la cita',
            description: 'Paciente no se presentó sin justificación',
            date: date.toISOString(),
            time: '14:00',
            status: 'missed',
            priority: 'high',
            behaviorImpact: 'negative'
          });
        } else if (i === 2 || i === 6) {
          // Reprogramaciones last minute
          const rescheduleDate = new Date(date);
          rescheduleDate.setHours(rescheduleDate.getHours() - 2);
          timeline.push({
            id: `reschedule-${i}`,
            type: 'reschedule',
            title: 'Reprogramación de último momento',
            description: 'Solicita cambio 2 horas antes',
            date: rescheduleDate.toISOString(),
            status: 'rescheduled',
            priority: 'medium',
            behaviorImpact: 'negative'
          });
        } else {
          // Consultas completadas (pocas)
          timeline.push({
            id: `consult-${i}`,
            type: 'consultation',
            subtype: 'regular',
            title: `Consulta #${i + 1}`,
            description: 'Seguimiento irregular',
            date: date.toISOString(),
            time: '14:00',
            status: 'completed',
            priority: 'medium',
            professional: { name: 'Dr. Alejandro Contreras', role: userType === 'clinic' ? 'Psiquiatra' : 'Médico' },
            behaviorImpact: 'neutral'
          });
        }
      }
      break;

    case 'potencial':
      // Persona interesada pero no ha acudido a primera cita
      
      // Contacto inicial
      const contactDate = new Date(startDate);
      contactDate.setMonth(contactDate.getMonth() + 10);
      timeline.push({
        id: 'initial-contact',
        type: 'communication',
        subtype: 'phone_call',
        title: 'Primer contacto',
        description: 'Pregunta sobre servicios y costos',
        date: contactDate.toISOString(),
        status: 'completed',
        priority: 'low',
        behaviorImpact: 'neutral'
      });

      // Cita programada pero no confirmada
      const pendingDate = new Date();
      pendingDate.setDate(pendingDate.getDate() + 7);
      timeline.push({
        id: 'pending-appointment',
        type: 'appointment',
        title: 'Primera cita programada',
        description: 'Cita pendiente de confirmación',
        date: pendingDate.toISOString(),
        time: '16:00',
        status: 'pending',
        priority: 'medium',
        behaviorImpact: 'neutral'
      });
      break;

    case 'integracion_inicial':
      // 100% asistencia primeras 2 citas, en proceso de iniciar seguimiento
      
      // Valoración inicial
      const initialEval = new Date(startDate);
      initialEval.setMonth(initialEval.getMonth() + 10);
      timeline.push({
        id: 'initial-evaluation',
        type: 'consultation',
        subtype: 'regular',
        title: 'Valoración inicial',
        description: 'Primera evaluación diagnóstica',
        date: initialEval.toISOString(),
        time: '10:00',
        status: 'completed',
        priority: 'high',
        professional: { name: 'Dr. Alejandro Contreras', role: userType === 'clinic' ? 'Psiquiatra' : 'Médico' },
        behaviorImpact: 'positive'
      });

      // Segunda cita
      const secondAppt = new Date(initialEval);
      secondAppt.setDate(secondAppt.getDate() + 14);
      timeline.push({
        id: 'second-appointment',
        type: 'consultation',
        subtype: 'followup',
        title: 'Segunda consulta',
        description: 'Revisión de plan de tratamiento',
        date: secondAppt.toISOString(),
        time: '10:00',
        status: 'completed',
        priority: 'medium',
        professional: { name: 'Dr. Alejandro Contreras', role: userType === 'clinic' ? 'Psiquiatra' : 'Médico' },
        behaviorImpact: 'positive'
      });

      // Próxima cita programada
      const nextAppt = new Date();
      nextAppt.setDate(nextAppt.getDate() + 14);
      timeline.push({
        id: 'third-appointment',
        type: 'appointment',
        title: 'Tercera consulta programada',
        description: 'Inicio formal del seguimiento',
        date: nextAppt.toISOString(),
        time: '10:00',
        status: 'pending',
        priority: 'medium',
        behaviorImpact: 'positive'
      });
      break;

    case 'acompañamiento':
      // >50% asistencia, requiere intervención adicional, resistencia al cambio
      
      // Consultas regulares con resistencia
      for (let i = 0; i < 8; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i * 1.5);
        timeline.push({
          id: `resistant-consult-${i}`,
          type: 'consultation',
          subtype: 'regular',
          title: `Consulta #${i + 1}`,
          description: i % 3 === 0 ? 'Resistencia a seguir recomendaciones' : 'Seguimiento con adherencia parcial',
          date: date.toISOString(),
          time: '11:00',
          status: 'completed',
          priority: 'medium',
          professional: { name: 'Dr. Alejandro Contreras', role: userType === 'clinic' ? 'Psiquiatra' : 'Médico' },
          behaviorImpact: i % 3 === 0 ? 'concerning' : 'neutral'
        });
      }

      // Múltiples comunicaciones por dudas
      for (let i = 0; i < 6; i++) {
        const commDate = new Date(startDate);
        commDate.setMonth(commDate.getMonth() + i * 2);
        timeline.push({
          id: `resistance-comm-${i}`,
          type: 'communication',
          subtype: i % 2 === 0 ? 'whatsapp' : 'phone_call',
          title: i % 2 === 0 ? 'Mensaje sobre efectos' : 'Llamada por dudas',
          description: 'Expresa resistencia a tratamiento recomendado',
          date: commDate.toISOString(),
          status: 'completed',
          priority: 'medium',
          behaviorImpact: 'concerning'
        });
      }

      // Recomendación rechazada
      const rejectionDate = new Date(startDate);
      rejectionDate.setMonth(rejectionDate.getMonth() + 6);
      timeline.push({
        id: 'intervention-rejected',
        type: 'alert',
        title: 'Intervención rechazada',
        description: userType === 'clinic' ? 'Rechaza referencia a psicología' : 'No acepta ajuste de medicación',
        date: rejectionDate.toISOString(),
        status: 'pending',
        priority: 'high',
        behaviorImpact: 'concerning'
      });
      break;

    case 'integracion_avanzada':
      // 80% asistencia 3 meses, 2 servicios (clínica) o seguimiento estable (individual)
      
      if (userType === 'clinic') {
        // Psiquiatría
        for (let i = 0; i < 5; i++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i * 0.6);
          timeline.push({
            id: `advanced-psych-${i}`,
            type: 'consultation',
            subtype: 'regular',
            title: `Consulta Psiquiátrica #${i + 1}`,
            description: 'Seguimiento farmacológico estable',
            date: date.toISOString(),
            time: '14:00',
            status: 'completed',
            priority: 'medium',
            professional: { name: 'Dr. Alejandro Contreras', role: 'Psiquiatra' },
            behaviorImpact: 'positive'
          });
        }

        // Psicología
        for (let i = 0; i < 8; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i * 10);
          timeline.push({
            id: `advanced-therapy-${i}`,
            type: 'consultation',
            subtype: 'regular',
            title: `Sesión Psicológica #${i + 1}`,
            description: 'Terapia cognitivo-conductual en progreso',
            date: date.toISOString(),
            time: '16:00',
            status: 'completed',
            priority: 'medium',
            professional: { name: 'Lic. Ana García', role: 'Psicóloga' },
            behaviorImpact: 'positive'
          });
        }

        // Primera participación en programa psicoeducativo
        const programDate = new Date(startDate);
        programDate.setMonth(programDate.getMonth() + 2);
        timeline.push({
          id: 'first-program',
          type: 'consultation',
          subtype: 'regular',
          title: 'Primer programa psicoeducativo',
          description: 'Participación en taller de mindfulness',
          date: programDate.toISOString(),
          time: '18:00',
          status: 'completed',
          priority: 'medium',
          professional: { name: 'Lic. Carmen Ruiz', role: 'Facilitadora' },
          behaviorImpact: 'positive'
        });

      } else {
        // Individual: seguimiento consistente
        for (let i = 0; i < 10; i++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i * 1.2);
          timeline.push({
            id: `stable-consult-${i}`,
            type: 'consultation',
            subtype: 'regular',
            title: `Consulta #${i + 1}`,
            description: 'Progreso terapéutico consistente',
            date: date.toISOString(),
            time: '15:00',
            status: 'completed',
            priority: 'medium',
            professional: { name: 'Dr. Alejandro Contreras', role: 'Médico' },
            behaviorImpact: 'positive'
          });
        }
      }
      break;

    case 'alta':
      // Completó seguimiento, 80% asistencia, dado de alta
      
      // Últimas consultas del tratamiento
      for (let i = 0; i < 6; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i * 2);
        timeline.push({
          id: `final-consult-${i}`,
          type: 'consultation',
          subtype: 'regular',
          title: `Consulta Final #${i + 1}`,
          description: i === 5 ? 'Evaluación pre-alta' : 'Seguimiento hacia el alta',
          date: date.toISOString(),
          time: '12:00',
          status: 'completed',
          priority: 'medium',
          professional: { name: 'Dr. Alejandro Contreras', role: userType === 'clinic' ? 'Psiquiatra' : 'Médico' },
          behaviorImpact: 'positive'
        });
      }

      // Alta médica
      const dischargeDate = new Date(startDate);
      dischargeDate.setMonth(dischargeDate.getMonth() + 11);
      timeline.push({
        id: 'medical-discharge',
        type: 'alert',
        title: 'Alta médica',
        description: 'Objetivos terapéuticos alcanzados exitosamente',
        date: dischargeDate.toISOString(),
        status: 'completed',
        priority: 'low',
        behaviorImpact: 'positive'
      });

      // Seguimiento post-alta
      const followUpDate = new Date(dischargeDate);
      followUpDate.setMonth(followUpDate.getMonth() + 3);
      timeline.push({
        id: 'post-discharge-followup',
        type: 'communication',
        subtype: 'phone_call',
        title: 'Seguimiento post-alta',
        description: 'Llamada de seguimiento a los 3 meses',
        date: followUpDate.toISOString(),
        status: 'completed',
        priority: 'low',
        behaviorImpact: 'positive'
      });
      break;

    default:
      // Potencial por defecto
      timeline.push({
        id: 'default-contact',
        type: 'communication',
        subtype: 'phone_call',
        title: 'Contacto inicial',
        description: 'Consulta sobre servicios disponibles',
        date: new Date().toISOString(),
        status: 'completed',
        priority: 'low',
        behaviorImpact: 'neutral'
      });
      break;
  }

  return timeline;
};