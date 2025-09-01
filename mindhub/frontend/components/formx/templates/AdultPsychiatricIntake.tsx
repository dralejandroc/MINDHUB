'use client';

import { FormField } from '../types';

export const ADULT_PSYCHIATRIC_INTAKE_TEMPLATE = {
  name: 'Formulario de Primera Vez - Adulto (18-60 años)',
  description: 'Formulario completo de admisión psiquiátrica para adultos',
  category: 'Psiquiatría Adultos',
  estimatedTime: '15-20 min',
  instructions: `¡Hola y bienvenido al consultorio! Este formulario es el primer paso para comprender qué es lo que realmente necesita y cómo podemos trabajar juntos para alcanzar sus metas en la salud mental. Si tiene dudas, no hay problema, podemos platicarlo durante la consulta.`,
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
      options: ['Masculino', 'Femenino', 'Otro'],
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
      label: 'Número celular',
      placeholder: 'Ej: 6621234567',
      required: true
    },
    {
      id: 'email',
      type: 'email',
      label: 'Correo electrónico',
      placeholder: 'ejemplo@ejemplo.com',
      required: true
    },
    
    // INFORMACIÓN ADICIONAL ESTADO CIVIL
    {
      id: 'tiempo_divorcio',
      type: 'text',
      label: '¿Hace cuánto tiempo se divorció?',
      placeholder: 'Especifique hace cuanto tiempo se divorció, incluyendo separación',
      required: false,
      description: 'Solo si aplica'
    },
    {
      id: 'primer_matrimonio',
      type: 'radio',
      label: '¿Es este su primer y único matrimonio?',
      options: ['Sí', 'No'],
      required: false
    },
    {
      id: 'tiempo_matrimonio_actual',
      type: 'text',
      label: '¿Cuánto tiempo tiene su matrimonio actual?',
      required: false
    },
    {
      id: 'tiempo_union_libre',
      type: 'text',
      label: '¿Cuánto tiempo tiene viviendo con su pareja actual?',
      placeholder: 'Especifique el tiempo en unión libre',
      required: false
    },

    // OCUPACIÓN Y EDUCACIÓN
    {
      id: 'ocupacion_actual',
      type: 'select',
      label: 'Ocupación actual',
      options: [
        'Empleado', 'Empresario/Dueño de negocio', 'Profesionista independiente', 
        'Estudiante', 'Jubilado/Pensionado', 'Hogar', 'Desempleado', 'Otro'
      ],
      required: true
    },
    {
      id: 'actividad_economica',
      type: 'text',
      label: 'Especifique su principal actividad económica actual',
      placeholder: 'De donde obtiene sus principales fuentes de ingreso económico',
      required: true
    },
    {
      id: 'ultimo_grado_estudios',
      type: 'select',
      label: 'Último grado de estudios',
      options: [
        'Primaria', 'Secundaria', 'Preparatoria/Bachillerato', 
        'Licenciatura', 'Maestría', 'Doctorado'
      ],
      required: true
    },
    {
      id: 'tipo_licenciatura',
      type: 'text',
      label: 'Especifique que tipo de licenciatura estudió',
      placeholder: 'P.e. Lic en Administración de empresas, Licenciatura en derecho',
      required: false
    },
    {
      id: 'hijos_sexo_edad',
      type: 'text',
      label: '¿Si usted tiene hijos, podría decirnos sexo y edad de cada uno?',
      placeholder: 'Solo sexo y edad (P.e. M12, F8)',
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
      required: true
    },
    {
      id: 'familia_nuclear',
      type: 'select',
      label: 'Familia Nuclear',
      options: [
        'Vivo solo(a)', 'Con pareja', 'Con pareja e hijos', 'Con padres',
        'Con otros familiares', 'Con roommates/compañeros'
      ],
      required: true,
      description: 'Con quién vive o quién es su principal red de apoyo'
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
      id: 'como_encontro_consultorio',
      type: 'select',
      label: '¿Por qué medio encontró el consultorio?',
      options: [
        'Recomendación de familiar/amigo', 'Referencia médica', 'Internet/Google',
        'Redes sociales', 'Directorio médico', 'Otro'
      ],
      required: true
    },
    {
      id: 'quien_llena_formulario',
      type: 'text',
      label: 'En caso de NO ser el paciente el que llene este formulario, especificar',
      placeholder: 'Quien llena el formulario y qué relación tiene con el paciente',
      required: false
    },
    {
      id: 'referencia_medica',
      type: 'text',
      label: 'Si fue enviado por otro médico o psicólogo por favor indique quién lo envió',
      placeholder: 'Escriba el nombre del profesional',
      required: false
    },
    {
      id: 'motivo_referencia',
      type: 'textarea',
      label: 'Si conoce el motivo por el cual fue enviado, por favor, anótelo',
      placeholder: 'Escriba lo que le dijo el profesional antes de enviarle aquí',
      required: false
    },

    // SITUACIÓN ACTUAL - MOTIVO DE CONSULTA
    {
      id: 'principales_problemas',
      type: 'textarea',
      label: '¿Cuáles diría usted que son los principales problemas o preocupaciones que lo hacen acudir a consulta?',
      placeholder: 'Escriba síntomas (P.e. desánimo, cansancio, insomnio, ansiedad etc.)',
      required: true,
      description: 'Describa detalladamente sus síntomas principales'
    },
    {
      id: 'expectativas_tratamiento',
      type: 'textarea',
      label: 'En pocas palabras describa qué es lo que espera recibir de la atención psiquiátrica',
      placeholder: 'Escriba intención de la visita (P.e. medicamento, seguimiento, psicoterapia etc)',
      required: false
    },

    // MOLESTIAS FÍSICAS
    {
      id: 'molestias_fisicas',
      type: 'checkbox',
      label: '¿Ha tenido alguna de las siguientes molestias en los últimos 6 meses?',
      options: [
        'Dolor de pecho', 'Fatiga', 'Mareo', 'Falta de aire',
        'Dolor de espalda', 'Dolor de estómago', 'Dolor de cabeza',
        'Migraña', 'Colon irritable', 'Insomnio'
      ],
      required: false
    },

    // EVALUACIÓN DEL SUEÑO
    {
      id: 'situacion_sueno',
      type: 'radio',
      label: 'Seleccione la que mejor describa su situación actual de sueño',
      options: [
        'Duermo bien, siento que descanso',
        'Tengo problemas para quedarme dormido',
        'Frecuentemente me despierto por las noches',
        'Me despierto por la madrugada y no puedo volver a dormir',
        'Duermo todo el tiempo y además quiero dormir siesta'
      ],
      required: false
    },

    // EJERCICIO Y ACTIVIDAD FÍSICA
    {
      id: 'actividad_fisica',
      type: 'radio',
      label: '¿Realiza actividad física o ejercicio con regularidad?',
      options: ['Sí', 'No'],
      required: true
    },
    {
      id: 'tipo_ejercicio',
      type: 'radio',
      label: 'Si es afirmativo, seleccione la afirmación que describa mejor su actividad durante el último año',
      options: [
        'Hago ejercicio físico vigoroso más de 4 veces por semana',
        'Hago ejercicio moderado más de 4 veces por semana',
        'Hago ejercicio pero MENOS de 4 veces por semana',
        'Ocasionalmente llego a realizar alguna actividad física',
        'NO hago ejercicio ni actividad física de ningún tipo'
      ],
      required: false
    },

    // ANTECEDENTES PSIQUIÁTRICOS
    {
      id: 'tratamiento_salud_mental',
      type: 'radio',
      label: '¿Alguna vez ha recibido tratamiento por trastornos de salud mental?',
      options: ['Sí', 'No'],
      required: true
    },
    {
      id: 'tipo_tratamiento_previo',
      type: 'checkbox',
      label: 'Si su respuesta es afirmativa, qué tipo de tratamiento recibió',
      options: ['Medicamentos', 'Psicoterapia', 'Hospitalización', 'Otro'],
      required: false
    },
    {
      id: 'tratamiento_actual',
      type: 'radio',
      label: '¿Está llevando tratamiento en la actualidad?',
      options: ['Sí', 'No'],
      required: true
    },
    {
      id: 'medicamentos_actuales',
      type: 'radio',
      label: '¿Está tomando o ha tomado algún medicamento para el tratamiento de problemas emocionales?',
      options: ['Sí', 'No'],
      required: false
    },
    {
      id: 'medicamentos_sin_receta',
      type: 'radio',
      label: '¿Está tomando algún medicamento SIN prescripción médica, hierbas y/o vitaminas?',
      options: ['Sí', 'No'],
      required: false
    },
    {
      id: 'detalles_medicamentos',
      type: 'textarea',
      label: 'Si la respuesta es SÍ a cualquiera de las anteriores, indique qué medicamentos está tomando',
      placeholder: 'Anote nombre del medicamento o suplemento, dosis y tiempo de uso',
      required: false
    },

    // ANTECEDENTES MÉDICOS GENERALES
    {
      id: 'diagnosticos_medicos',
      type: 'checkbox',
      label: 'Seleccione si alguna vez ha sido diagnosticado o en sospecha de tener cualquier de los siguientes',
      options: [
        'Diabetes', 'Hipertensión arterial', 'Convulsiones/epilepsia',
        'Enfermedad cardiaca', 'Cáncer', 'Enfermedad tiroidea',
        'Anemia', 'Asma', 'Enfermedad renal', 'Enfermedad hepática',
        'Trastornos del sistema digestivo', 'Enfermedades de la piel',
        'Migraña', 'Problemas de audición', 'Problemas visuales',
        'Ninguno de los anteriores'
      ],
      required: true
    },

    // ANTECEDENTES PSIQUIÁTRICOS ESPECÍFICOS
    {
      id: 'diagnosticos_psiquiatricos',
      type: 'checkbox',
      label: 'Seleccione si alguna vez ha sido diagnosticado o en sospecha de tener cualquier de los siguientes trastornos psiquiátricos',
      options: [
        'Depresión mayor', 'Trastorno bipolar', 'Ansiedad', 'Ataques de pánico',
        'Depresión postparto', 'Alucinaciones', 'Anorexia', 'TDAH',
        'Adicciones', 'Ninguno de los anteriores'
      ],
      required: false
    },

    // ABUSO Y VIOLENCIA
    {
      id: 'experiencias_abuso',
      type: 'checkbox',
      label: '¿Ha experimentado alguno de los siguientes (de parte de terceros hacia usted) en LOS ÚLTIMOS 6 MESES?',
      options: [
        'Abuso verbal (Que le griten, amenacen, pongan sobrenombres etc)',
        'Abuso emocional (Que perciba manipulación, aislamiento, que lo/a menosprecien, etc.)',
        'Abuso físico (Que le empujen, peguen, o le ocasionen restricción física de alguna forma)',
        'Abuso sexual (Que existieran tocamientos sin su consentimiento, coito sin permiso, besos sin consentimiento)',
        'Ninguno de los anteriores'
      ],
      required: false,
      description: 'Esta información es confidencial y nos ayuda a brindar mejor atención'
    },

    // CONSUMO DE SUSTANCIAS
    {
      id: 'consumo_sustancias',
      type: 'checkbox',
      label: '¿Bebe ALCOHOL, consume DROGAS, fuma o fumó tabaco en algún momento? Seleccione la afirmación que describa mejor su situación durante el último año',
      options: [
        'NO consumo alcohol ni sustancias',
        'Fumo tabaco con frecuencia mayor a 5 cigarrillos por día',
        'Bebo alcohol de manera social menos de una vez cada 2 semanas',
        'Consumo marihuana regularmente, más de una vez por semana',
        'He pensado en la necesidad de reducir mi consumo de sustancias',
        'Me critican por mi consumo de alcohol o por el uso de otras drogas',
        'Siento culpa por mi forma de beber o consumir sustancias',
        'He tenido necesidad de un trago o droga en la mañana para empezar el día, tranquilizarse o para quitarse la resaca (cruda)',
        'Actualmente busco ayuda para dejar de consumir sustancias'
      ],
      required: true
    },

    // DETALLES DE CONSUMO
    {
      id: 'detalles_alcohol',
      type: 'text',
      label: 'Si consume ALCOHOL, indique con qué frecuencia consume, qué cantidad y tipo de bebida',
      placeholder: 'Por ejemplo: 3 cervezas cada semana, o 2 bebidas preparadas con vodka cada 2 semanas',
      required: false
    },
    {
      id: 'detalles_marihuana',
      type: 'text',
      label: 'Si consume MARIHUANA, indique con qué frecuencia consume, cantidad y tipo de consumo',
      placeholder: 'Por ejemplo: 2 cigarrillos de marihuana cada 2 días, o vape de cannabis menos de una vez por semana',
      required: false
    },
    {
      id: 'otras_sustancias',
      type: 'textarea',
      label: 'Si consume OTRAS SUSTANCIAS, indique con qué tipo de droga consume, con qué regularidad lo hace y desde cuándo',
      placeholder: 'Por ejemplo: cocaína cada fin de semana desde hace 1 año, o anfetaminas menos de una vez al mes desde hace 2 años',
      required: false
    },

    // EVALUACIÓN DE ESTRÉS
    {
      id: 'situacion_estres',
      type: 'radio',
      label: 'En relación al estrés, seleccione la afirmación que mejor describa su situación ACTUAL',
      options: [
        'Sé lidiar con el estrés cotidiano y no considero represente un problema en mi vida',
        'Me enfrento a situaciones estresantes en el hogar, la escuela o el trabajo, pero no creo que me afecten',
        'Las situaciones de estrés que vivo cotidianamente me desgastan y creo que merma mi salud',
        'El estrés me ha ocasionado enfermedades y molestias físicas',
        'Vivo estrés todos los días de mi vida'
      ],
      required: false
    },

    // ESCALA DE INCAPACIDAD
    {
      id: 'nivel_incapacidad',
      type: 'radio',
      label: 'Escala de evaluación de las alteraciones. Marque el enunciado que mejor describa cuánto piensa usted que sus síntomas de salud mental están alterando su vida en el hogar o en el trabajo',
      options: [
        'SIN incapacidad. Los síntomas no están presentes más de lo esperado ni interfieren con la vida',
        'Muy POCA incapacidad. Los síntomas están presentes con un poco más frecuencia o intensidad de lo esperado, y sólo rara vez interfieren con la vida',
        'Incapacidad LEVE. Los síntomas están presentes con más frecuencia o intensidad de lo esperado, y a veces interfieren con la vida',
        'Incapacidad moderada. Los síntomas están presentes con mucha más frecuencia o intensidad de lo esperado, y por lo general interfieren con la vida',
        'Incapacidad GRAVE. Los síntomas están presentes con muchísima más frecuencia o intensidad que lo esperado, y la mayoría de las veces interfieren con la vida',
        'Incapacidad MUY grave. Los síntomas están presentes con tanta frecuencia e intensidad superior a la que se espera que casi siempre interfieren con la vida',
        'MÁXIMA incapacidad (profunda). Los síntomas son tan frecuentes o intensos que interfieren completamente con la vida'
      ],
      required: true,
      description: 'Compárese con otra persona de su misma edad y sexo, en las mismas situaciones'
    },

    // INFORMACIÓN ADICIONAL
    {
      id: 'informacion_adicional',
      type: 'textarea',
      label: 'Si considera que hay algo más que deba saber, que considere importante relacionado con el motivo de consulta o antecedentes, por favor anótelo aquí',
      placeholder: 'Cualquier cosa que considere relevante nos ayuda a conocerle mejor',
      required: false,
      description: 'Espacio libre para información adicional que considere importante'
    }
  ]
};