'use client';

import { FormField } from '../types';

export const CHILD_PSYCHIATRIC_INTAKE_TEMPLATE = {
  name: 'Formulario de Primera Vez - Niño (5-11 años)',
  description: 'Formulario completo de admisión psiquiátrica para niños (llenado por padres/tutores)',
  category: 'Psiquiatría Infantil',
  estimatedTime: '10-15 min',
  instructions: `Este formulario debe ser llenado por los padres o tutores del niño. Nos ayuda a conocer mejor a su hijo/a y entender cómo podemos ayudarlo. Si hay preguntas que no sabe cómo responder, no se preocupe, las platicaremos durante la consulta.`,
  fields: [
    // DATOS GENERALES DEL NIÑO
    {
      id: 'nombre_completo_nino',
      type: 'text',
      label: 'Nombre completo del niño/a',
      placeholder: 'Nombre completo del menor',
      required: true,
      description: 'Escriba el nombre completo del niño/a'
    },
    {
      id: 'edad',
      type: 'text',
      label: 'Edad del niño/a',
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
      label: 'Sexo del niño/a',
      options: ['Masculino', 'Femenino'],
      required: true
    },

    // DATOS DE LOS PADRES/TUTORES
    {
      id: 'nombre_padre_madre',
      type: 'text',
      label: 'Nombre completo del padre/madre/tutor que llena el formulario',
      required: true,
      description: 'Su nombre completo'
    },
    {
      id: 'relacion_con_nino',
      type: 'select',
      label: '¿Cuál es su relación con el niño/a?',
      options: ['Madre', 'Padre', 'Madrastra', 'Padrastro', 'Abuela', 'Abuelo', 'Tía', 'Tío', 'Tutor legal', 'Otro'],
      required: true
    },
    {
      id: 'telefono_contacto',
      type: 'tel',
      label: 'Número de teléfono de contacto',
      placeholder: 'Su número de celular',
      required: true
    },
    {
      id: 'email_contacto',
      type: 'email',
      label: 'Correo electrónico',
      placeholder: 'su.correo@ejemplo.com',
      required: true
    },

    // INFORMACIÓN ESCOLAR
    {
      id: 'grado_escolar',
      type: 'select',
      label: '¿En qué grado escolar está el niño/a?',
      options: [
        'Preescolar (1°)', 'Preescolar (2°)', 'Preescolar (3°)',
        '1° Primaria', '2° Primaria', '3° Primaria', 
        '4° Primaria', '5° Primaria', '6° Primaria',
        'No asiste a la escuela', 'Educación especial'
      ],
      required: true
    },
    {
      id: 'nombre_escuela',
      type: 'text',
      label: 'Nombre de la escuela',
      placeholder: 'Nombre completo de la escuela',
      required: false
    },
    {
      id: 'rendimiento_escolar',
      type: 'radio',
      label: '¿Cómo considera el rendimiento escolar de su hijo/a?',
      options: [
        'Excelente', 'Bueno', 'Regular', 'Bajo', 'Muy bajo', 'No aplica'
      ],
      required: false
    },
    {
      id: 'problemas_escolares',
      type: 'checkbox',
      label: '¿Su hijo/a ha presentado algunos de estos problemas en la escuela?',
      options: [
        'Dificultades para concentrarse', 'Problemas de conducta',
        'Dificultades para hacer amigos', 'Problemas con maestros',
        'Bajo rendimiento académico', 'Hiperactividad',
        'Agresividad con compañeros', 'Timidez excesiva',
        'Llanto frecuente', 'No querer ir a la escuela',
        'Ninguno de los anteriores'
      ],
      required: false
    },

    // DESARROLLO Y ANTECEDENTES
    {
      id: 'embarazo_parto',
      type: 'radio',
      label: '¿Cómo fue el embarazo y parto?',
      options: [
        'Sin complicaciones', 'Algunas complicaciones menores', 
        'Complicaciones importantes', 'No lo recuerdo/No lo sé'
      ],
      required: false
    },
    {
      id: 'desarrollo_temprano',
      type: 'radio',
      label: '¿Su hijo/a alcanzó los hitos del desarrollo (caminar, hablar, control de esfínteres) a tiempo?',
      options: ['Sí, todo a tiempo', 'Algunas cosas tarde', 'Muchas cosas tarde', 'No estoy seguro(a)'],
      required: false
    },
    {
      id: 'problemas_lenguaje',
      type: 'radio',
      label: '¿Su hijo/a tiene o ha tenido problemas del habla o lenguaje?',
      options: ['No', 'Sí, leves', 'Sí, moderados', 'Sí, severos'],
      required: false
    },

    // FAMILIA Y HOGAR
    {
      id: 'estructura_familiar',
      type: 'checkbox',
      label: '¿Con quién vive el niño/a en casa?',
      options: [
        'Madre biológica', 'Padre biológico', 'Madrastra', 'Padrastro',
        'Hermanos', 'Medios hermanos', 'Abuelos', 'Otros familiares',
        'Familia adoptiva', 'Familia de acogida'
      ],
      required: true
    },
    {
      id: 'estado_civil_padres',
      type: 'select',
      label: 'El estado civil de los padres del niño/a es:',
      options: [
        'Casados y viven juntos', 'Divorciados', 'Separados',
        'Uno de ellos falleció', 'Nunca estuvieron casados',
        'Vueltos a casar', 'Unión libre'
      ],
      required: false
    },
    {
      id: 'hermanos',
      type: 'text',
      label: '¿Tiene hermanos? ¿Cuántos y qué edades?',
      placeholder: 'Ej: 1 hermano de 8 años, 1 hermana de 3 años',
      required: false
    },
    {
      id: 'ambiente_familiar',
      type: 'radio',
      label: '¿Cómo describe el ambiente en su hogar?',
      options: [
        'Muy tranquilo y estable', 'Generalmente tranquilo', 
        'A veces hay tensiones', 'Frecuentemente hay conflictos',
        'Muy estresante', 'Inestable'
      ],
      required: false
    },

    // DIRECCIÓN
    {
      id: 'direccion',
      type: 'text',
      label: 'Dirección donde vive el niño/a',
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

    // MOTIVO DE CONSULTA
    {
      id: 'decision_consulta',
      type: 'radio',
      label: '¿Quién decidió traer al niño/a a consulta?',
      options: [
        'Los padres por iniciativa propia', 'Recomendación de la escuela',
        'Referencia del pediatra', 'Referencia de otro especialista',
        'Servicios sociales', 'Otro'
      ],
      required: true
    },
    {
      id: 'como_encontro_consultorio',
      type: 'select',
      label: '¿Cómo encontró este consultorio?',
      options: [
        'Recomendación de familiar/amigo', 'Referencia médica', 'Internet/Google',
        'Redes sociales', 'Directorio médico', 'Seguro médico', 'Otro'
      ],
      required: false
    },

    // PROBLEMAS ACTUALES
    {
      id: 'principales_preocupaciones',
      type: 'textarea',
      label: '¿Cuáles son sus principales preocupaciones sobre su hijo/a? ¿Qué comportamientos o síntomas ha notado?',
      placeholder: 'Describa detalladamente lo que ha observado en su hijo/a',
      required: true,
      description: 'Sea lo más específico posible'
    },
    {
      id: 'cuando_comenzaron_problemas',
      type: 'text',
      label: '¿Cuándo comenzaron a notar estos problemas?',
      placeholder: 'Hace cuánto tiempo, edad del niño, situación específica',
      required: false
    },
    {
      id: 'que_esperan_tratamiento',
      type: 'textarea',
      label: '¿Qué esperan de este tratamiento? ¿En qué les gustaría que ayudáramos a su hijo/a?',
      required: false
    },

    // COMPORTAMIENTO
    {
      id: 'comportamientos_preocupantes',
      type: 'checkbox',
      label: '¿Su hijo/a presenta algunos de estos comportamientos?',
      options: [
        'Rabietas frecuentes e intensas', 'Agresividad hacia otros niños',
        'Agresividad hacia adultos', 'Destruir juguetes o cosas',
        'Desobediencia extrema', 'Mentir frecuentemente',
        'Robar cosas', 'Lastimarse a sí mismo/a',
        'Comportamientos repetitivos', 'Miedos excesivos',
        'Separarse de los padres es muy difícil', 'Problemas para dormir',
        'Pesadillas frecuentes', 'Mojar la cama', 'Problemas para comer',
        'Ninguno de los anteriores'
      ],
      required: false
    },

    // EMOCIONES
    {
      id: 'estado_emocional',
      type: 'checkbox',
      label: '¿Cómo observa emocionalmente a su hijo/a?',
      options: [
        'Generalmente alegre', 'A menudo triste', 'Muy ansioso/nervioso',
        'Muy enojón/irritable', 'Cambia de humor rápidamente',
        'Poco expresivo emocionalmente', 'Llora con mucha facilidad',
        'Muy miedoso', 'Sin interés en actividades', 'Muy preocupado'
      ],
      required: false
    },

    // SOCIALIZACIÓN
    {
      id: 'habilidades_sociales',
      type: 'radio',
      label: '¿Cómo se relaciona su hijo/a con otros niños?',
      options: [
        'Muy bien, tiene muchos amigos', 'Bien, tiene algunos amigos',
        'Regular, le cuesta hacer amigos', 'Mal, prefiere estar solo',
        'Muy mal, tiene conflictos frecuentes', 'No tiene oportunidad de socializar'
      ],
      required: false
    },
    {
      id: 'relacion_con_adultos',
      type: 'radio',
      label: '¿Cómo se relaciona con adultos (maestros, familiares, etc.)?',
      options: [
        'Muy bien, es respetuoso y colaborativo', 'Bien, generalmente coopera',
        'Regular, a veces presenta problemas', 'Mal, frecuentes conflictos',
        'Muy mal, muy desafiante'
      ],
      required: false
    },

    // ACTIVIDADES Y RUTINA
    {
      id: 'actividades_favoritas',
      type: 'text',
      label: '¿Cuáles son las actividades favoritas de su hijo/a?',
      placeholder: 'Juegos, deportes, programas de TV, etc.',
      required: false
    },
    {
      id: 'tiempo_pantallas',
      type: 'select',
      label: '¿Cuánto tiempo pasa su hijo/a frente a pantallas (TV, tablet, celular, videojuegos) al día?',
      options: [
        'Menos de 1 hora', '1-2 horas', '2-4 horas', 
        '4-6 horas', 'Más de 6 horas', 'No uso pantallas'
      ],
      required: false
    },
    {
      id: 'actividad_fisica',
      type: 'radio',
      label: '¿Su hijo/a realiza actividad física regularmente?',
      options: ['Sí, diariamente', 'Sí, varias veces por semana', 'Ocasionalmente', 'Rara vez', 'Nunca'],
      required: false
    },

    // SUEÑO Y ALIMENTACIÓN
    {
      id: 'patrones_sueno',
      type: 'radio',
      label: '¿Cómo duerme su hijo/a?',
      options: [
        'Muy bien, duerme toda la noche', 'Bien, ocasionalmente se despierta',
        'Regular, se despierta varias veces', 'Mal, dificultad para dormir',
        'Muy mal, problemas severos de sueño'
      ],
      required: false
    },
    {
      id: 'horas_sueno',
      type: 'select',
      label: '¿Cuántas horas duerme aproximadamente por noche?',
      options: ['Menos de 8 horas', '8-9 horas', '10-11 horas', '12 o más horas'],
      required: false
    },
    {
      id: 'alimentacion',
      type: 'radio',
      label: '¿Cómo es la alimentación de su hijo/a?',
      options: [
        'Muy buena, come de todo', 'Buena, come la mayoría de alimentos',
        'Regular, es algo selectivo', 'Mala, muy selectivo con comidas',
        'Muy mala, problemas serios de alimentación'
      ],
      required: false
    },

    // ANTECEDENTES MÉDICOS
    {
      id: 'problemas_medicos',
      type: 'checkbox',
      label: '¿Su hijo/a ha tenido alguno de estos problemas de salud?',
      options: [
        'Asma', 'Alergias importantes', 'Epilepsia/convulsiones',
        'Problemas del corazón', 'Diabetes', 'Problemas de la tiroides',
        'Problemas de visión', 'Problemas de audición', 'Lesiones en la cabeza',
        'Operaciones importantes', 'Hospitalizaciones', 'Ninguno de los anteriores'
      ],
      required: false
    },
    {
      id: 'medicamentos_actuales',
      type: 'radio',
      label: '¿Su hijo/a toma actualmente algún medicamento?',
      options: ['Sí', 'No'],
      required: false
    },
    {
      id: 'detalles_medicamentos',
      type: 'text',
      label: 'Si toma medicamentos, ¿cuáles son?',
      placeholder: 'Nombre del medicamento y para qué es',
      required: false
    },

    // ANTECEDENTES DE DESARROLLO
    {
      id: 'preocupaciones_desarrollo',
      type: 'checkbox',
      label: '¿Ha tenido preocupaciones sobre el desarrollo de su hijo/a en alguna de estas áreas?',
      options: [
        'Habla/Lenguaje', 'Motricidad (caminar, coordinar movimientos)',
        'Socialización', 'Aprendizaje', 'Control de esfínteres',
        'Independencia para actividades diarias', 'Comportamiento',
        'Emociones', 'Atención/Concentración', 'Ninguna'
      ],
      required: false
    },

    // ANTECEDENTES FAMILIARES
    {
      id: 'antecedentes_familiares',
      type: 'checkbox',
      label: '¿Alguien en su familia (padres, hermanos, abuelos, tíos) ha tenido problemas de salud mental?',
      options: [
        'Depresión', 'Ansiedad', 'Bipolaridad', 'Esquizofrenia',
        'TDAH', 'Autismo', 'Problemas de aprendizaje', 'Discapacidad intelectual',
        'Problemas de adicción', 'Intentos de suicidio', 'Trastornos alimentarios',
        'No que sepamos', 'Prefiero no responder'
      ],
      required: false,
      description: 'Esta información nos ayuda a entender mejor las necesidades del niño'
    },

    // EXPERIENCIAS TRAUMÁTICAS
    {
      id: 'experiencias_dificiles',
      type: 'checkbox',
      label: '¿Su hijo/a ha vivido alguna de estas situaciones difíciles?',
      options: [
        'Divorcio o separación de los padres', 'Muerte de alguien cercano',
        'Mudanzas frecuentes', 'Problemas económicos familiares severos',
        'Enfermedad grave (propia o familiar)', 'Accidentes',
        'Violencia doméstica', 'Abuso de cualquier tipo',
        'Bullying severo', 'Cambios importantes en la familia',
        'Ninguna de las anteriores', 'Prefiero no responder'
      ],
      required: false,
      description: 'Esta información es estrictamente confidencial'
    },

    // TRATAMIENTO PREVIO
    {
      id: 'tratamiento_previo',
      type: 'radio',
      label: '¿Su hijo/a ha recibido previamente tratamiento psicológico o psiquiátrico?',
      options: ['Sí', 'No'],
      required: true
    },
    {
      id: 'tipo_tratamiento_previo',
      type: 'checkbox',
      label: 'Si ha recibido tratamiento, ¿de qué tipo?',
      options: [
        'Terapia psicológica individual', 'Terapia familiar', 'Terapia de grupo',
        'Medicamentos psiquiátricos', 'Terapia ocupacional',
        'Terapia de lenguaje', 'Educación especial', 'Otro'
      ],
      required: false
    },
    {
      id: 'resultado_tratamiento_previo',
      type: 'radio',
      label: 'Si recibió tratamiento antes, ¿cómo fue el resultado?',
      options: ['Muy bueno', 'Bueno', 'Regular', 'Poco efectivo', 'No funcionó'],
      required: false
    },

    // EVALUACIÓN FUNCIONAL
    {
      id: 'interferencia_actividades',
      type: 'radio',
      label: '¿Cuánto interfieren los problemas actuales con las actividades diarias de su hijo/a?',
      options: [
        'Nada, funciona normalmente', 'Un poco, pero puede hacer la mayoría de cosas',
        'Bastante, le cuesta trabajo hacer varias actividades',
        'Mucho, no puede hacer muchas actividades normales',
        'Extremo, casi no puede funcionar normalmente'
      ],
      required: false
    },
    {
      id: 'interferencia_familia',
      type: 'radio',
      label: '¿Cuánto afectan estos problemas a la dinámica familiar?',
      options: [
        'Nada', 'Un poco', 'Moderadamente', 'Bastante', 'Mucho'
      ],
      required: false
    },

    // INFORMACIÓN ADICIONAL
    {
      id: 'informacion_adicional',
      type: 'textarea',
      label: '¿Hay algo más que considere importante que debamos saber sobre su hijo/a?',
      placeholder: 'Cualquier información adicional que pueda ayudarnos a entender mejor a su hijo/a',
      required: false,
      description: 'Fortalezas, intereses especiales, situaciones particulares, etc.'
    }
  ]
};