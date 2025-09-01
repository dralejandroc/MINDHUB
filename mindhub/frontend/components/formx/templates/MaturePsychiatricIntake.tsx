'use client';

import { FormField } from '../types';

export const MATURE_PSYCHIATRIC_INTAKE_TEMPLATE = {
  name: 'Formulario de Primera Vez - Adulto Maduro (61+ años)',
  description: 'Formulario completo de admisión psiquiátrica para adultos mayores',
  category: 'Psiquiatría Geriátrica',
  estimatedTime: '20-25 min',
  instructions: `Este formulario está diseñado especialmente para adultos mayores. Nos ayuda a entender mejor su situación de salud integral y cómo podemos brindarle la mejor atención. Si necesita ayuda para llenar alguna sección o tiene dudas, podemos revisarlo juntos durante la consulta.`,
  fields: [
    // DATOS GENERALES
    {
      id: 'nombre_completo',
      type: 'text',
      label: 'Nombre completo',
      placeholder: 'Nombre y apellidos',
      required: true,
      description: 'Escriba su nombre completo'
    },
    {
      id: 'edad',
      type: 'text',
      label: 'Edad',
      placeholder: 'Años cumplidos',
      required: true
    },
    {
      id: 'fecha_nacimiento',
      type: 'date',
      label: 'Fecha de nacimiento',
      required: true
    },
    {
      id: 'sexo',
      type: 'select',
      label: 'Sexo',
      options: ['Masculino', 'Femenino'],
      required: true
    },
    {
      id: 'estado_civil',
      type: 'select',
      label: 'Estado civil',
      options: ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)', 'Unión libre', 'Separado(a)'],
      required: true
    },
    {
      id: 'telefono',
      type: 'tel',
      label: 'Número de teléfono',
      placeholder: 'Su número de teléfono',
      required: true
    },
    {
      id: 'email',
      type: 'email',
      label: 'Correo electrónico',
      placeholder: 'su.correo@ejemplo.com',
      required: false,
      description: 'Si no tiene, puede dejar vacío'
    },

    // INFORMACIÓN ADICIONAL ESTADO CIVIL
    {
      id: 'tiempo_viudez',
      type: 'text',
      label: 'Si es viudo(a), ¿hace cuánto tiempo enviudó?',
      placeholder: 'Especifique el tiempo',
      required: false
    },
    {
      id: 'tiempo_matrimonio',
      type: 'text',
      label: 'Si está casado(a), ¿cuánto tiempo lleva de matrimonio?',
      required: false
    },
    {
      id: 'cuidador_principal',
      type: 'text',
      label: '¿Quién es su cuidador principal o persona de apoyo más cercana?',
      placeholder: 'Nombre y relación (hijo, hija, esposo/a, etc.)',
      required: false
    },

    // SITUACIÓN LABORAL/ECONÓMICA
    {
      id: 'situacion_laboral',
      type: 'select',
      label: 'Situación laboral actual',
      options: [
        'Jubilado/Pensionado', 'Trabajando tiempo completo', 'Trabajando medio tiempo',
        'Sin trabajar por salud', 'Sin trabajar por decisión propia', 'Buscando trabajo', 'Hogar'
      ],
      required: true
    },
    {
      id: 'profesion_anterior',
      type: 'text',
      label: '¿A qué se dedicaba antes de jubilarse?',
      placeholder: 'Su profesión u oficio anterior',
      required: false
    },
    {
      id: 'tiempo_jubilacion',
      type: 'text',
      label: 'Si está jubilado(a), ¿hace cuánto tiempo se jubiló?',
      placeholder: 'Años o meses desde la jubilación',
      required: false
    },
    {
      id: 'situacion_economica',
      type: 'radio',
      label: '¿Cómo considera su situación económica actual?',
      options: [
        'Muy buena, sin preocupaciones', 'Buena, cómoda', 'Regular, alcanza para lo básico',
        'Difícil, con algunas carencias', 'Muy difícil, con muchas necesidades'
      ],
      required: false
    },

    // EDUCACIÓN
    {
      id: 'ultimo_grado_estudios',
      type: 'select',
      label: 'Último grado de estudios completado',
      options: [
        'Sin estudios formales', 'Primaria incompleta', 'Primaria completa',
        'Secundaria incompleta', 'Secundaria completa', 'Preparatoria/Bachillerato',
        'Carrera técnica', 'Licenciatura', 'Maestría', 'Doctorado'
      ],
      required: true
    },

    // FAMILIA Y RED DE APOYO
    {
      id: 'hijos',
      type: 'text',
      label: '¿Tiene hijos? ¿Cuántos y qué edades tienen?',
      placeholder: 'Número de hijos y sus edades aproximadas',
      required: false
    },
    {
      id: 'con_quien_vive',
      type: 'select',
      label: '¿Con quién vive actualmente?',
      options: [
        'Solo(a)', 'Con esposo(a)/pareja', 'Con hijos', 'Con otros familiares',
        'En casa de reposo/geriátrico', 'Con cuidador', 'Con amigos'
      ],
      required: true
    },
    {
      id: 'red_apoyo',
      type: 'radio',
      label: '¿Cuenta con una buena red de apoyo familiar y social?',
      options: [
        'Sí, tengo mucho apoyo', 'Sí, tengo apoyo suficiente', 'Algo de apoyo',
        'Poco apoyo', 'Casi nada de apoyo'
      ],
      required: false
    },
    {
      id: 'frecuencia_contacto_familia',
      type: 'select',
      label: '¿Con qué frecuencia tiene contacto con familiares?',
      options: [
        'Diariamente', 'Varias veces por semana', 'Una vez por semana',
        'Varias veces por mes', 'Una vez por mes', 'Rara vez', 'Nunca'
      ],
      required: false
    },

    // DIRECCIÓN
    {
      id: 'direccion',
      type: 'text',
      label: 'Dirección',
      required: true
    },
    {
      id: 'colonia',
      type: 'text',
      label: 'Colonia',
      required: false
    },
    {
      id: 'ciudad',
      type: 'text',
      label: 'Ciudad',
      required: false
    },
    {
      id: 'religion',
      type: 'select',
      label: 'Religión',
      options: [
        'Católica', 'Protestante/Cristiana', 'Judía', 'Musulmana',
        'Budista', 'Otra', 'Ninguna'
      ],
      required: false
    },

    // REFERENCIA Y CONSULTA
    {
      id: 'voluntad_propia',
      type: 'radio',
      label: '¿Viene usted a valoración por voluntad propia?',
      options: ['Sí', 'No'],
      required: true
    },
    {
      id: 'quien_sugiere_consulta',
      type: 'select',
      label: 'Si no fue por voluntad propia, ¿quién sugirió la consulta?',
      options: [
        'Familiar', 'Médico de cabecera', 'Otro especialista', 'Trabajador social',
        'Personal de casa de reposo', 'Otro'
      ],
      required: false
    },
    {
      id: 'como_encontro_consultorio',
      type: 'select',
      label: '¿Cómo encontró este consultorio?',
      options: [
        'Recomendación de familiar/amigo', 'Referencia médica', 'Internet',
        'Directorio médico', 'Seguro médico', 'Otro'
      ],
      required: false
    },

    // SITUACIÓN ACTUAL - MOTIVO DE CONSULTA
    {
      id: 'principales_problemas',
      type: 'textarea',
      label: '¿Cuáles diría usted que son los principales problemas o preocupaciones que lo hacen acudir a consulta?',
      placeholder: 'Describa sus síntomas principales (ej: olvidos, tristeza, nervios, insomnio, etc.)',
      required: true,
      description: 'Sea lo más específico posible'
    },
    {
      id: 'cuando_comenzaron_problemas',
      type: 'text',
      label: '¿Cuándo comenzaron estos problemas?',
      placeholder: 'Hace cuánto tiempo notó estos síntomas',
      required: false
    },
    {
      id: 'expectativas_tratamiento',
      type: 'textarea',
      label: '¿Qué espera del tratamiento psiquiátrico?',
      placeholder: 'Sus expectativas y objetivos',
      required: false
    },

    // SÍNTOMAS ESPECÍFICOS PARA ADULTOS MAYORES
    {
      id: 'problemas_memoria',
      type: 'radio',
      label: '¿Ha notado problemas de memoria?',
      options: [
        'No, mi memoria está bien', 'Olvidos menores normales para mi edad',
        'Olvidos que me preocupan un poco', 'Olvidos que me preocupan mucho',
        'Problemas serios de memoria'
      ],
      required: false
    },
    {
      id: 'tipo_olvidos',
      type: 'checkbox',
      label: 'Si tiene problemas de memoria, ¿qué tipo de cosas olvida?',
      options: [
        'Nombres de personas conocidas', 'Dónde puse las cosas', 'Citas o eventos importantes',
        'Cómo llegar a lugares conocidos', 'Conversaciones recientes',
        'Si tomé mis medicamentos', 'Eventos recientes', 'Habilidades que antes dominaba'
      ],
      required: false
    },
    {
      id: 'confusion_desorientacion',
      type: 'radio',
      label: '¿Se ha sentido confundido(a) o desorientado(a)?',
      options: [
        'Nunca', 'Rara vez', 'Ocasionalmente', 'Frecuentemente', 'Constantemente'
      ],
      required: false
    },

    // ESTADO FÍSICO Y FUNCIONAL
    {
      id: 'independencia_actividades',
      type: 'radio',
      label: '¿Puede realizar sus actividades diarias básicas (bañarse, vestirse, comer) sin ayuda?',
      options: [
        'Sí, completamente independiente', 'Necesito poca ayuda',
        'Necesito ayuda moderada', 'Necesito mucha ayuda', 'Dependo completamente de otros'
      ],
      required: false
    },
    {
      id: 'movilidad',
      type: 'radio',
      label: '¿Cómo es su movilidad?',
      options: [
        'Camino sin problemas', 'Camino con algo de dificultad',
        'Uso bastón', 'Uso andadera', 'Uso silla de ruedas', 'Estoy en cama'
      ],
      required: false
    },
    {
      id: 'caidas',
      type: 'radio',
      label: '¿Ha tenido caídas en los últimos 6 meses?',
      options: ['No', 'Una caída', '2-3 caídas', 'Más de 3 caídas'],
      required: false
    },

    // MOLESTIAS FÍSICAS
    {
      id: 'molestias_fisicas',
      type: 'checkbox',
      label: '¿Ha tenido alguna de las siguientes molestias en los últimos meses?',
      options: [
        'Dolores articulares', 'Dolor de espalda', 'Dolor de cabeza',
        'Problemas digestivos', 'Mareos', 'Fatiga/cansancio extremo',
        'Falta de aire', 'Dolor en el pecho', 'Problemas urinarios',
        'Estreñimiento', 'Pérdida de apetito', 'Pérdida de peso sin razón'
      ],
      required: false
    },

    // SUEÑO
    {
      id: 'problemas_sueno',
      type: 'checkbox',
      label: '¿Tiene problemas con el sueño?',
      options: [
        'Dificultad para quedarse dormido', 'Se despierta muy temprano',
        'Se despierta varias veces por la noche', 'Pesadillas',
        'Duerme demasiado durante el día', 'No se siente descansado',
        'Camina o habla dormido', 'Ronca mucho', 'No tengo problemas de sueño'
      ],
      required: false
    },
    {
      id: 'horas_sueno',
      type: 'select',
      label: '¿Cuántas horas duerme por noche aproximadamente?',
      options: [
        'Menos de 4 horas', '4-5 horas', '6-7 horas', '8-9 horas', 'Más de 9 horas'
      ],
      required: false
    },

    // ALIMENTACIÓN
    {
      id: 'cambios_apetito',
      type: 'radio',
      label: '¿Ha notado cambios en su apetito?',
      options: [
        'Sin cambios', 'Come menos que antes', 'Come mucho más que antes',
        'Ha perdido interés en la comida', 'Le sabe diferente la comida'
      ],
      required: false
    },
    {
      id: 'cambio_peso',
      type: 'radio',
      label: '¿Ha tenido cambios importantes de peso en los últimos meses?',
      options: [
        'No', 'He perdido peso (menos de 5 kg)', 'He perdido peso (más de 5 kg)',
        'He subido peso (menos de 5 kg)', 'He subido peso (más de 5 kg)'
      ],
      required: false
    },

    // ACTIVIDADES Y EJERCICIO
    {
      id: 'actividad_fisica',
      type: 'radio',
      label: '¿Realiza algún tipo de ejercicio o actividad física?',
      options: [
        'Sí, ejercicio regular', 'Sí, camino regularmente', 'Ocasionalmente',
        'Muy rara vez', 'No puedo por problemas físicos', 'No hago nada de ejercicio'
      ],
      required: false
    },
    {
      id: 'actividades_placenteras',
      type: 'text',
      label: '¿Qué actividades le dan placer o disfruta hacer?',
      placeholder: 'Hobbies, pasatiempos, actividades sociales, etc.',
      required: false
    },
    {
      id: 'perdida_interes',
      type: 'radio',
      label: '¿Ha perdido interés en actividades que antes disfrutaba?',
      options: ['No', 'Un poco', 'Bastante', 'Mucho', 'He perdido interés en todo'],
      required: false
    },

    // ESTADO EMOCIONAL
    {
      id: 'estado_animo',
      type: 'checkbox',
      label: '¿Cómo ha estado su estado de ánimo últimamente?',
      options: [
        'Generalmente alegre', 'A menudo triste o deprimido',
        'Muy ansioso o nervioso', 'Irritable o enojón',
        'Sin emociones (plano)', 'Cambia de humor frecuentemente',
        'Desesperanzado', 'Con ganas de llorar', 'Aburrido constantemente'
      ],
      required: false
    },
    {
      id: 'pensamientos_muerte',
      type: 'radio',
      label: '¿Ha tenido pensamientos sobre la muerte o morir?',
      options: [
        'No', 'Pensamientos normales sobre el envejecimiento',
        'Pensamientos ocasionales sobre la muerte', 'Pensamientos frecuentes sobre morir',
        'Deseos de morir', 'Prefiero no responder'
      ],
      required: false,
      description: 'Esta información es confidencial y nos ayuda a brindar mejor atención'
    },

    // MEDICAMENTOS Y TRATAMIENTOS ACTUALES
    {
      id: 'medicamentos_actuales',
      type: 'textarea',
      label: '¿Qué medicamentos toma actualmente?',
      placeholder: 'Liste todos los medicamentos con dosis si las recuerda',
      required: false,
      description: 'Incluya medicamentos para cualquier condición (presión, diabetes, corazón, etc.)'
    },
    {
      id: 'dificultad_medicamentos',
      type: 'radio',
      label: '¿Tiene dificultad para recordar tomar sus medicamentos?',
      options: ['No', 'A veces', 'Frecuentemente', 'Siempre', 'Alguien me ayuda'],
      required: false
    },
    {
      id: 'efectos_secundarios',
      type: 'radio',
      label: '¿Ha notado efectos secundarios de sus medicamentos?',
      options: ['No', 'Algunos leves', 'Algunos molestos', 'Efectos severos', 'No estoy seguro'],
      required: false
    },

    // ANTECEDENTES MÉDICOS PRINCIPALES
    {
      id: 'condiciones_medicas',
      type: 'checkbox',
      label: '¿Tiene o ha tenido alguna de estas condiciones médicas?',
      options: [
        'Presión arterial alta', 'Diabetes', 'Problemas del corazón',
        'Derrame cerebral (embolia)', 'Enfermedad de Parkinson', 'Alzheimer/demencia',
        'Cáncer', 'Problemas de la tiroides', 'Artritis', 'Osteoporosis',
        'Problemas renales', 'Problemas del hígado', 'Epilepsia',
        'Problemas respiratorios/pulmonares', 'Ninguna de las anteriores'
      ],
      required: false
    },

    // ANTECEDENTES PSIQUIÁTRICOS
    {
      id: 'tratamiento_psiquiatrico_previo',
      type: 'radio',
      label: '¿Ha recibido tratamiento psiquiátrico o psicológico anteriormente?',
      options: ['No', 'Sí, hace muchos años', 'Sí, hace algunos años', 'Sí, recientemente'],
      required: false
    },
    {
      id: 'hospitalizaciones_psiquiatricas',
      type: 'radio',
      label: '¿Ha sido hospitalizado por problemas de salud mental?',
      options: ['No', 'Sí, una vez', 'Sí, varias veces'],
      required: false
    },
    {
      id: 'medicamentos_psiquiatricos_previos',
      type: 'textarea',
      label: 'Si ha tomado medicamentos psiquiátricos antes, ¿cuáles fueron?',
      placeholder: 'Nombres de medicamentos y cómo le funcionaron',
      required: false
    },

    // ANTECEDENTES FAMILIARES
    {
      id: 'antecedentes_familiares',
      type: 'checkbox',
      label: '¿Alguien en su familia ha tenido problemas de salud mental?',
      options: [
        'Depresión', 'Ansiedad', 'Bipolaridad', 'Esquizofrenia', 'Alzheimer/demencia',
        'Problemas de adicción', 'Suicidio', 'Ninguno que yo sepa'
      ],
      required: false
    },

    // CONSUMO DE SUSTANCIAS
    {
      id: 'consumo_alcohol',
      type: 'radio',
      label: '¿Consume bebidas alcohólicas?',
      options: [
        'No bebo alcohol', 'Ocasionalmente (menos de una vez por semana)',
        'Socialmente (1-2 veces por semana)', 'Regularmente (3-4 veces por semana)',
        'Diariamente', 'Solía beber pero ya no'
      ],
      required: false
    },
    {
      id: 'tabaquismo',
      type: 'radio',
      label: '¿Fuma o ha fumado?',
      options: [
        'Nunca he fumado', 'Fumé pero dejé hace más de 10 años',
        'Fumé pero dejé hace menos de 10 años', 'Fumo ocasionalmente',
        'Fumo regularmente'
      ],
      required: false
    },

    // EVALUACIÓN FUNCIONAL
    {
      id: 'interferencia_problemas',
      type: 'radio',
      label: '¿Cuánto interfieren sus problemas actuales with su vida diaria?',
      options: [
        'Nada, funciono normalmente', 'Un poco, pero manejo bien',
        'Moderadamente, algunas dificultades', 'Bastante, muchas dificultades',
        'Mucho, no puedo funcionar bien'
      ],
      required: false
    },
    {
      id: 'cambios_personalidad',
      type: 'radio',
      label: '¿Familiares han notado cambios en su personalidad o comportamiento?',
      options: ['No', 'Cambios menores', 'Algunos cambios', 'Cambios importantes', 'No lo sé'],
      required: false
    },

    // SEGURIDAD Y CUIDADOS
    {
      id: 'conduce_vehiculo',
      type: 'radio',
      label: '¿Todavía maneja/conduce automóvil?',
      options: [
        'Sí, sin problemas', 'Sí, pero solo distancias cortas',
        'Sí, pero evito ciertas situaciones', 'Ya no manejo', 'Nunca manejé'
      ],
      required: false
    },
    {
      id: 'manejo_finanzas',
      type: 'radio',
      label: '¿Maneja sus finanzas (pagar cuentas, hacer compras) sin ayuda?',
      options: [
        'Sí, completamente independiente', 'Con poca ayuda',
        'Con ayuda moderada', 'Con mucha ayuda', 'Alguien más las maneja'
      ],
      required: false
    },

    // INFORMACIÓN ADICIONAL
    {
      id: 'preocupaciones_familiares',
      type: 'textarea',
      label: '¿Hay preocupaciones específicas de sus familiares sobre su salud mental?',
      placeholder: 'Lo que han observado sus familiares',
      required: false
    },
    {
      id: 'informacion_adicional',
      type: 'textarea',
      label: '¿Hay algo más que considere importante que debamos saber?',
      placeholder: 'Cualquier información adicional relevante',
      required: false,
      description: 'Historia de vida, eventos importantes, preocupaciones especiales, etc.'
    }
  ]
};