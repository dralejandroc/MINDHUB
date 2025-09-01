'use client';

import { FormField } from '../types';

export const ADOLESCENT_PSYCHIATRIC_INTAKE_TEMPLATE = {
  name: 'Formulario de Primera Vez - Adolescente (12-17 años)',
  description: 'Formulario completo de admisión psiquiátrica para adolescentes',
  category: 'Psiquiatría Adolescentes',
  estimatedTime: '12-15 min',
  instructions: `¡Hola! Este formulario nos ayuda a conocerte mejor y entender cómo podemos ayudarte. Si hay algo que no entiendas o tienes dudas, no hay problema, lo platicaremos cuando nos veamos. Puedes pedir ayuda a tus padres si lo necesitas.`,
  fields: [
    // DATOS GENERALES
    {
      id: 'nombre_completo',
      type: 'text',
      label: 'Nombre completo',
      placeholder: 'Tu nombre completo',
      required: true,
      description: 'Escribe tu nombre completo'
    },
    {
      id: 'edad',
      type: 'text',
      label: 'Edad',
      placeholder: 'Años que tienes',
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
      options: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'],
      required: true
    },
    {
      id: 'telefono',
      type: 'tel',
      label: 'Número de celular',
      placeholder: 'Tu número de celular (si tienes)',
      required: false
    },
    {
      id: 'telefono_padres',
      type: 'tel',
      label: 'Número de celular de tus padres/tutor',
      placeholder: 'Número de contacto de emergencia',
      required: true
    },
    {
      id: 'email',
      type: 'email',
      label: 'Correo electrónico',
      placeholder: 'tu.correo@ejemplo.com (si tienes)',
      required: false
    },

    // INFORMACIÓN ESCOLAR
    {
      id: 'grado_escolar',
      type: 'select',
      label: '¿En qué grado/año escolar estás?',
      options: [
        '6° Primaria', '1° Secundaria', '2° Secundaria', '3° Secundaria',
        '1° Preparatoria/Bachillerato', '2° Preparatoria/Bachillerato', '3° Preparatoria/Bachillerato',
        'No estoy estudiando actualmente', 'Otro'
      ],
      required: true
    },
    {
      id: 'escuela_nombre',
      type: 'text',
      label: '¿Cuál es el nombre de tu escuela?',
      placeholder: 'Nombre de tu escuela',
      required: false
    },
    {
      id: 'rendimiento_escolar',
      type: 'select',
      label: '¿Cómo consideras tu rendimiento escolar?',
      options: [
        'Excelente (9-10)', 'Bueno (8-8.9)', 'Regular (7-7.9)', 
        'Bajo (6-6.9)', 'Muy bajo (menos de 6)', 'No aplica'
      ],
      required: false
    },
    {
      id: 'problemas_escolares',
      type: 'checkbox',
      label: '¿Has tenido algunos de estos problemas en la escuela?',
      options: [
        'Dificultades para concentrarme', 'Problemas con maestros',
        'Problemas con compañeros/bullying', 'Bajo rendimiento académico',
        'Faltar mucho a clases', 'Suspensiones o reportes disciplinarios',
        'Ansiedad en exámenes', 'Ninguno de los anteriores'
      ],
      required: false
    },

    // FAMILIA Y HOGAR
    {
      id: 'con_quien_vives',
      type: 'checkbox',
      label: '¿Con quién vives en casa?',
      options: [
        'Mamá', 'Papá', 'Padrastro', 'Madrastra', 'Hermanos',
        'Abuelos', 'Tíos', 'Otros familiares', 'Familia adoptiva'
      ],
      required: true
    },
    {
      id: 'estado_civil_padres',
      type: 'select',
      label: 'El estado de tus padres es:',
      options: [
        'Casados y viven juntos', 'Divorciados', 'Separados',
        'Uno de ellos falleció', 'Nunca estuvieron casados',
        'Vueltos a casar', 'No lo sé'
      ],
      required: false
    },
    {
      id: 'hermanos',
      type: 'text',
      label: '¿Tienes hermanos? ¿Cuántos y qué edades tienen?',
      placeholder: 'Ej: 1 hermano de 15, 1 hermana de 10',
      required: false
    },
    {
      id: 'ambiente_familiar',
      type: 'radio',
      label: '¿Cómo describes el ambiente en tu casa?',
      options: [
        'Muy tranquilo y feliz', 'Generalmente tranquilo', 'A veces hay problemas',
        'Frecuentemente hay conflictos', 'Muy estresante', 'Prefiero no responder'
      ],
      required: false
    },

    // DIRECCIÓN Y RELIGIÓN
    {
      id: 'direccion',
      type: 'text',
      label: 'Dirección donde vives',
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
      label: '¿Practicas alguna religión?',
      options: [
        'Católica', 'Cristiana/Protestante', 'Judía', 'Musulmana',
        'Budista', 'Otra', 'Ninguna', 'Prefiero no decir'
      ],
      required: false
    },

    // REFERENCIA Y CONSULTA
    {
      id: 'decision_consulta',
      type: 'radio',
      label: '¿Vienes a esta consulta porque tú quisiste o porque alguien más lo decidió?',
      options: ['Porque yo quise', 'Porque mis padres lo decidieron', 'Porque otro familiar lo decidió', 'Porque mi escuela lo recomendó', 'Porque un médico me envió'],
      required: true
    },
    {
      id: 'como_encontraron_consultorio',
      type: 'select',
      label: '¿Cómo encontraron este consultorio?',
      options: [
        'Recomendación de familiar/amigo', 'Referencia médica', 'Internet/Google',
        'Redes sociales', 'Directorio médico', 'Seguro médico', 'No lo sé', 'Otro'
      ],
      required: false
    },
    {
      id: 'referencia_medica',
      type: 'text',
      label: 'Si fuiste enviado por otro médico o psicólogo, ¿quién te envió?',
      placeholder: 'Nombre del profesional',
      required: false
    },

    // SITUACIÓN ACTUAL - MOTIVO DE CONSULTA
    {
      id: 'principales_problemas',
      type: 'textarea',
      label: '¿Cuáles son las principales cosas que te preocupan o te hacen sentir mal?',
      placeholder: 'Puedes escribir sobre cómo te sientes, qué te preocupa, si hay algo que te molesta, etc.',
      required: true,
      description: 'Describe con tus palabras lo que sientes'
    },
    {
      id: 'que_esperas',
      type: 'textarea',
      label: '¿Qué esperas de estas consultas? ¿En qué te gustaría que te ayudáramos?',
      placeholder: 'Por ejemplo: sentirme mejor, entender lo que me pasa, etc.',
      required: false
    },

    // SÍNTOMAS Y MOLESTIAS
    {
      id: 'sintomas_emocionales',
      type: 'checkbox',
      label: '¿Has sentido alguna de estas cosas en las últimas semanas?',
      options: [
        'Tristeza o ganas de llorar', 'Nervios o ansiedad', 'Enojo o irritabilidad',
        'Miedo o temores', 'Sentirme solo(a)', 'No tener ganas de hacer nada',
        'Pensamientos negativos sobre mí mismo(a)', 'Dificultad para concentrarme',
        'Cambios en mi apetito', 'Problemas para dormir', 'Ninguna de las anteriores'
      ],
      required: false
    },

    // MOLESTIAS FÍSICAS
    {
      id: 'molestias_fisicas',
      type: 'checkbox',
      label: '¿Has tenido alguna de estas molestias físicas últimamente?',
      options: [
        'Dolores de cabeza', 'Dolor de estómago', 'Cansancio',
        'Mareos', 'Falta de aire', 'Dolores musculares',
        'Problemas para dormir', 'Pérdida o aumento de peso',
        'Ninguna de las anteriores'
      ],
      required: false
    },

    // SUEÑO
    {
      id: 'situacion_sueno',
      type: 'radio',
      label: '¿Cómo has estado durmiendo últimamente?',
      options: [
        'Duermo bien y descanso',
        'Me cuesta trabajo quedarme dormido(a)',
        'Me despierto varias veces en la noche',
        'Me despierto muy temprano y no puedo volver a dormir',
        'Duermo demasiado y siempre tengo sueño'
      ],
      required: false
    },

    // ACTIVIDADES Y EJERCICIO
    {
      id: 'actividad_fisica',
      type: 'radio',
      label: '¿Haces ejercicio o deporte regularmente?',
      options: ['Sí', 'No'],
      required: true
    },
    {
      id: 'tipo_ejercicio',
      type: 'text',
      label: 'Si haces ejercicio, ¿qué tipo de actividad o deporte practicas?',
      placeholder: 'Por ejemplo: fútbol, natación, correr, baile, etc.',
      required: false
    },
    {
      id: 'actividades_favoritas',
      type: 'text',
      label: '¿Qué actividades te gusta hacer en tu tiempo libre?',
      placeholder: 'Por ejemplo: videojuegos, leer, música, estar con amigos, etc.',
      required: false
    },

    // RELACIONES SOCIALES
    {
      id: 'amigos',
      type: 'radio',
      label: '¿Tienes amigos cercanos?',
      options: [
        'Sí, tengo varios amigos cercanos', 'Tengo algunos amigos',
        'Tengo pocos amigos', 'No tengo amigos cercanos',
        'Prefiero estar solo(a)'
      ],
      required: false
    },
    {
      id: 'problemas_sociales',
      type: 'checkbox',
      label: '¿Has tenido algunos de estos problemas con otras personas?',
      options: [
        'Dificultad para hacer amigos', 'Problemas para mantener amistades',
        'Me molestan o me hacen bullying', 'Peleas frecuentes',
        'Me siento rechazado(a)', 'Prefiero estar solo(a)',
        'Ninguno de los anteriores'
      ],
      required: false
    },

    // ANTECEDENTES DE SALUD MENTAL
    {
      id: 'tratamiento_previo',
      type: 'radio',
      label: '¿Alguna vez has ido con un psicólogo, psiquiatra o consejero antes?',
      options: ['Sí', 'No', 'No estoy seguro(a)'],
      required: true
    },
    {
      id: 'tipo_tratamiento_previo',
      type: 'checkbox',
      label: 'Si has ido antes, ¿qué tipo de ayuda recibiste?',
      options: ['Pláticas/terapia', 'Medicamentos', 'Hospitalización', 'Otro', 'No recuerdo'],
      required: false
    },
    {
      id: 'medicamentos_actuales',
      type: 'radio',
      label: '¿Actualmente tomas algún medicamento?',
      options: ['Sí', 'No', 'No estoy seguro(a)'],
      required: false
    },
    {
      id: 'detalles_medicamentos',
      type: 'text',
      label: 'Si tomas medicamentos, ¿cuáles son?',
      placeholder: 'Nombre del medicamento y para qué es',
      required: false
    },

    // ANTECEDENTES MÉDICOS
    {
      id: 'problemas_medicos',
      type: 'checkbox',
      label: '¿Has tenido alguno de estos problemas de salud?',
      options: [
        'Asma', 'Diabetes', 'Epilepsia/convulsiones', 'Problemas del corazón',
        'Problemas de la tiroides', 'Alergias importantes', 'Problemas de visión',
        'Problemas de audición', 'Lesiones en la cabeza', 'Operaciones importantes',
        'Ninguno de los anteriores'
      ],
      required: false
    },

    // FAMILIA Y ANTECEDENTES
    {
      id: 'antecedentes_familiares',
      type: 'checkbox',
      label: '¿Alguien en tu familia ha tenido problemas de salud mental?',
      options: [
        'Depresión', 'Ansiedad', 'Bipolaridad', 'Esquizofrenia',
        'Problemas de adicción', 'Intentos de suicidio', 'TDAH',
        'Trastornos alimentarios', 'No que yo sepa', 'Prefiero no responder'
      ],
      required: false,
      description: 'Incluye papás, hermanos, abuelos, tíos'
    },

    // SITUACIONES DIFÍCILES
    {
      id: 'experiencias_dificiles',
      type: 'checkbox',
      label: '¿Has vivido alguna de estas situaciones difíciles?',
      options: [
        'Divorcio de mis padres', 'Muerte de alguien cercano', 'Mudanza frecuente',
        'Problemas económicos en casa', 'Enfermedad grave (mía o de familia)',
        'Accidentes', 'Violencia en casa', 'Bullying en la escuela',
        'Abuso de cualquier tipo', 'Ninguna de las anteriores', 'Prefiero no responder'
      ],
      required: false,
      description: 'Esta información es confidencial y nos ayuda a entenderte mejor'
    },

    // CONSUMO DE SUSTANCIAS (adaptado para adolescentes)
    {
      id: 'consumo_sustancias',
      type: 'checkbox',
      label: '¿Has probado alguna de estas sustancias? (Honestidad total, no te vamos a regañar)',
      options: [
        'No he probado nada', 'Alcohol', 'Cigarrillos', 'Marihuana',
        'Vape/cigarrillos electrónicos', 'Medicamentos sin receta',
        'Otras drogas', 'Prefiero no responder'
      ],
      required: false,
      description: 'Esta información es confidencial y nos ayuda a brindarte mejor atención'
    },
    {
      id: 'frecuencia_consumo',
      type: 'text',
      label: 'Si has probado algo, ¿con qué frecuencia lo usas?',
      placeholder: 'Por ejemplo: solo una vez, fines de semana, etc.',
      required: false
    },

    // EVALUACIÓN FUNCIONAL
    {
      id: 'como_te_sientes',
      type: 'scale',
      label: 'En una escala del 1 al 10, ¿cómo te has sentido en general últimamente?',
      min: 1,
      max: 10,
      required: false,
      description: '1 = Muy mal, 10 = Muy bien'
    },
    {
      id: 'interferencia_vida',
      type: 'radio',
      label: '¿Cuánto interfieren tus problemas con tu vida diaria?',
      options: [
        'Nada, estoy bien', 'Un poco, pero puedo hacer mis cosas',
        'Bastante, me cuesta trabajo hacer mis actividades',
        'Mucho, no puedo hacer muchas cosas que antes hacía',
        'Demasiado, casi no puedo hacer nada'
      ],
      required: false
    },

    // INFORMACIÓN ADICIONAL
    {
      id: 'informacion_adicional',
      type: 'textarea',
      label: '¿Hay algo más que quieras contarnos que crees que es importante?',
      placeholder: 'Cualquier cosa que sientes que debemos saber para ayudarte mejor',
      required: false,
      description: 'Espacio libre para que escribas lo que quieras'
    }
  ]
};