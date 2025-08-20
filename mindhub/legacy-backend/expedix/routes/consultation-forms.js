const express = require('express');
const router = express.Router();

// Simulación de base de datos en memoria (reemplazar con DB real)
let formTemplates = new Map();
let consultationForms = new Map();
let formSubmissions = new Map();

// Tipos de campos disponibles
const FIELD_TYPES = {
  SHORT_TEXT: 'short_text',
  LONG_TEXT: 'long_text',
  PARAGRAPH: 'paragraph',
  NUMBER: 'number',
  DROPDOWN: 'dropdown',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  MULTI_SELECT: 'multi_select',
  SLIDER: 'slider',
  RATING: 'rating',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  EMAIL: 'email',
  PHONE: 'phone',
  URL: 'url',
  FILE_UPLOAD: 'file_upload',
  SIGNATURE: 'signature',
  SECTION_HEADER: 'section_header',
  DIVIDER: 'divider',
  CALCULATED_FIELD: 'calculated_field',
  MULTI_SELECT_GRID: 'multi_select_grid',
  LIKERT_SCALE: 'likert_scale',
  YES_NO: 'yes_no',
  SCALE_10: 'scale_10'
};

// Templates predefinidos para evaluaciones clínicas
const initPredefinedTemplates = () => {
  const primeraVezPsicologia = {
    id: 'primera_vez_psicologia',
    name: 'Primera Vez - Psicología',
    description: 'Evaluación inicial completa para primera consulta psicológica con enfoque cognitivo-conductual',
    category: 'psychology',
    isSystem: true,
    createdAt: new Date().toISOString(),
    icon: '🧠',
    specialty: ['psicologia', 'psicologia-clinica'],
    estimatedDuration: 90,
    autoSelection: {
      conditions: [
        "patient.specialty === 'psicologia'",
        "patient.visits === 0",
        "appointment.type === 'primera-vez'"
      ],
      reason: "Primera consulta psicológica"
    },
    fields: [
      // Motivo de Consulta
      {
        id: 'motivo_consulta_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Motivo de Consulta',
        required: false,
        order: 1,
        styling: {
          backgroundColor: 'var(--primary-50)',
          textColor: 'var(--primary-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'problema_principal',
        type: FIELD_TYPES.LONG_TEXT,
        label: 'Problema Principal',
        required: true,
        order: 2,
        placeholder: 'Descripción del motivo principal de consulta según el paciente',
        validation: { minLength: 10, maxLength: 1000 }
      },
      {
        id: 'inicio_sintomas',
        type: FIELD_TYPES.MULTI_SELECT_GRID,
        label: 'Inicio y Evolución',
        required: true,
        order: 3,
        rows: [
          { id: 'fecha_inicio', label: 'Tiempo desde el inicio' },
          { id: 'evolucion', label: 'Evolución' },
          { id: 'intensidad_actual', label: 'Intensidad actual (1-10)' }
        ],
        columns: [
          { id: 'menos_1_mes', label: 'Menos de 1 mes' },
          { id: '1_3_meses', label: '1-3 meses' },
          { id: '3_6_meses', label: '3-6 meses' },
          { id: '6_meses_1_año', label: '6 meses - 1 año' },
          { id: '1_2_años', label: '1-2 años' },
          { id: 'mas_2_años', label: 'Más de 2 años' }
        ]
      },
      {
        id: 'factores_precipitantes',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Factores Precipitantes',
        required: false,
        order: 4,
        options: [
          { value: 'perdida_duelo', label: 'Pérdida/duelo' },
          { value: 'problemas_laborales', label: 'Problemas laborales' },
          { value: 'problemas_familiares', label: 'Problemas familiares' },
          { value: 'problemas_pareja', label: 'Problemas de pareja' },
          { value: 'problemas_economicos', label: 'Problemas económicos' },
          { value: 'problemas_salud', label: 'Problemas de salud' },
          { value: 'cambios_vitales', label: 'Cambios vitales importantes' },
          { value: 'trauma_accidente', label: 'Trauma/accidente' },
          { value: 'abuso_sustancias', label: 'Abuso de sustancias' },
          { value: 'otros', label: 'Otros' }
        ]
      },
      // Historia Vital
      {
        id: 'historia_vital_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Historia Vital',
        required: false,
        order: 5,
        styling: {
          backgroundColor: 'var(--primary-50)',
          textColor: 'var(--primary-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'desarrollo_temprano',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Desarrollo Temprano',
        required: true,
        order: 6,
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'retrasos_menores', label: 'Retrasos menores' },
          { value: 'retrasos_significativos', label: 'Retrasos significativos' },
          { value: 'informacion_insuficiente', label: 'Información insuficiente' }
        ]
      },
      {
        id: 'historia_familiar',
        type: FIELD_TYPES.MULTI_SELECT_GRID,
        label: 'Historia Familiar',
        required: true,
        order: 7,
        rows: [
          { id: 'estructura_familiar', label: 'Estructura familiar' },
          { id: 'dinamica_familiar', label: 'Dinámica familiar' }
        ],
        columns: [
          { id: 'nuclear', label: 'Nuclear' },
          { id: 'monoparental', label: 'Monoparental' },
          { id: 'extensa', label: 'Extensa' },
          { id: 'reconstituida', label: 'Reconstituida' },
          { id: 'adoptiva', label: 'Adoptiva' },
          { id: 'otros', label: 'Otros' }
        ]
      },
      // Antecedentes
      {
        id: 'antecedentes_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Antecedentes',
        required: false,
        order: 8,
        styling: {
          backgroundColor: 'var(--primary-50)',
          textColor: 'var(--primary-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'antecedentes_psicologicos',
        type: FIELD_TYPES.YES_NO,
        label: '¿Ha recibido terapia psicológica anteriormente?',
        required: true,
        order: 9
      },
      {
        id: 'detalles_terapia_previa',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Detalles de Terapia Previa',
        required: false,
        order: 10,
        placeholder: 'Tipo de terapia, duración, resultados...',
        conditionalLogic: {
          showWhen: {
            field: 'antecedentes_psicologicos',
            operator: 'equals',
            value: 'yes'
          }
        }
      },
      {
        id: 'medicacion_actual',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Medicación Psiquiátrica Actual',
        required: false,
        order: 11,
        placeholder: 'Medicamentos psiquiátricos actuales (nombre, dosis, tiempo de uso)'
      },
      // Evaluación por Esferas
      {
        id: 'evaluacion_esferas_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Evaluación por Esferas',
        required: false,
        order: 12,
        styling: {
          backgroundColor: 'var(--primary-50)',
          textColor: 'var(--primary-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'esfera_cognitiva',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Esfera Cognitiva - Pensamientos Automáticos',
        required: true,
        order: 13,
        options: [
          { value: 'catastrofizacion', label: 'Catastrofización' },
          { value: 'pensamiento_dicotomico', label: 'Pensamiento dicotómico' },
          { value: 'personalizacion', label: 'Personalización' },
          { value: 'filtro_mental', label: 'Filtro mental' },
          { value: 'descalificacion', label: 'Descalificación' },
          { value: 'lectura_mental', label: 'Lectura mental' },
          { value: 'ninguno_identificado', label: 'Ninguno identificado' }
        ]
      },
      {
        id: 'esfera_emocional',
        type: FIELD_TYPES.LIKERT_SCALE,
        label: 'Esfera Emocional - Niveles Actuales',
        required: true,
        order: 14,
        items: [
          { id: 'ansiedad', label: 'Nivel de ansiedad' },
          { id: 'depresion', label: 'Nivel de depresión' },
          { id: 'irritabilidad', label: 'Irritabilidad' },
          { id: 'regulacion_emocional', label: 'Regulación emocional' }
        ],
        scale: {
          min: 0,
          max: 10,
          labels: ['0 - Ausente', '2 - Leve', '4 - Moderado', '6 - Considerable', '8 - Severo', '10 - Extremo']
        }
      },
      {
        id: 'esfera_conductual',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Esfera Conductual - Conductas Problema',
        required: true,
        order: 15,
        options: [
          { value: 'evitacion', label: 'Evitación' },
          { value: 'aislamiento', label: 'Aislamiento' },
          { value: 'agresividad', label: 'Agresividad' },
          { value: 'autolesion', label: 'Autolesión' },
          { value: 'impulsividad', label: 'Impulsividad' },
          { value: 'compulsiones', label: 'Compulsiones' },
          { value: 'rituales', label: 'Rituales' },
          { value: 'ninguna_identificada', label: 'Ninguna identificada' }
        ]
      },
      // Impresión Diagnóstica
      {
        id: 'impresion_diagnostica_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Impresión Diagnóstica',
        required: false,
        order: 16,
        styling: {
          backgroundColor: 'var(--accent-50)',
          textColor: 'var(--accent-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'hipotesis_diagnosticas',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Hipótesis Diagnósticas (CIE-10)',
        required: true,
        order: 17,
        options: [
          { value: 'F32.0', label: 'F32.0 - Episodio depresivo leve' },
          { value: 'F32.1', label: 'F32.1 - Episodio depresivo moderado' },
          { value: 'F32.2', label: 'F32.2 - Episodio depresivo grave' },
          { value: 'F41.0', label: 'F41.0 - Trastorno de pánico' },
          { value: 'F41.1', label: 'F41.1 - Trastorno de ansiedad generalizada' },
          { value: 'F43.1', label: 'F43.1 - Trastorno de estrés postraumático' },
          { value: 'F60.3', label: 'F60.3 - Trastorno límite de personalidad' },
          { value: 'F90.0', label: 'F90.0 - TDAH' }
        ]
      },
      {
        id: 'factores_mantenimiento',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Factores de Mantenimiento',
        required: true,
        order: 18,
        placeholder: 'Factores cognitivos, conductuales, emocionales y ambientales que mantienen el problema'
      },
      {
        id: 'fortalezas_paciente',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Fortalezas del Paciente',
        required: true,
        order: 19,
        options: [
          { value: 'motivacion_cambio', label: 'Motivación al cambio' },
          { value: 'alianza_terapeutica', label: 'Buena alianza terapéutica' },
          { value: 'insight', label: 'Insight adecuado' },
          { value: 'red_apoyo', label: 'Red de apoyo sólida' },
          { value: 'recursos_economicos', label: 'Recursos económicos' },
          { value: 'habilidades_afrontamiento', label: 'Habilidades de afrontamiento' },
          { value: 'inteligencia_emocional', label: 'Inteligencia emocional' },
          { value: 'flexibilidad_cognitiva', label: 'Flexibilidad cognitiva' },
          { value: 'adherencia_tratamiento', label: 'Adherencia al tratamiento' },
          { value: 'estabilidad_laboral', label: 'Estabilidad laboral' }
        ]
      },
      // Plan de Tratamiento
      {
        id: 'plan_tratamiento_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Plan de Tratamiento',
        required: false,
        order: 20,
        styling: {
          backgroundColor: 'var(--success-50)',
          textColor: 'var(--success-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'objetivos_terapeuticos',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Objetivos Terapéuticos Principales',
        required: true,
        order: 21,
        placeholder: 'Describir 3-5 objetivos específicos y medibles'
      },
      {
        id: 'estrategias_intervencion',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Estrategias de Intervención',
        required: true,
        order: 22,
        options: [
          { value: 'reestructuracion_cognitiva', label: 'Reestructuración cognitiva' },
          { value: 'exposicion_gradual', label: 'Exposición gradual' },
          { value: 'tecnicas_relajacion', label: 'Técnicas de relajación' },
          { value: 'mindfulness', label: 'Mindfulness' },
          { value: 'activacion_conductual', label: 'Activación conductual' },
          { value: 'habilidades_sociales', label: 'Entrenamiento en habilidades sociales' },
          { value: 'psicoeducacion', label: 'Psicoeducación' },
          { value: 'terapia_familiar', label: 'Terapia familiar' },
          { value: 'prevencion_recaidas', label: 'Prevención de recaídas' },
          { value: 'act', label: 'Terapia de aceptación y compromiso' }
        ]
      },
      {
        id: 'frecuencia_sesiones',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Frecuencia de Sesiones',
        required: true,
        order: 23,
        options: [
          { value: 'semanal', label: 'Semanal' },
          { value: 'quincenal', label: 'Quincenal' },
          { value: 'mensual', label: 'Mensual' },
          { value: 'segun_necesidad', label: 'Según necesidad' },
          { value: 'intensiva', label: 'Intensiva (2+ por semana)' }
        ]
      },
      {
        id: 'duracion_estimada',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Duración Estimada del Tratamiento',
        required: true,
        order: 24,
        options: [
          { value: '1_3_meses', label: '1-3 meses' },
          { value: '3_6_meses', label: '3-6 meses' },
          { value: '6_12_meses', label: '6-12 meses' },
          { value: '1_2_años', label: '1-2 años' },
          { value: 'mas_2_años', label: 'Más de 2 años' },
          { value: 'indefinido', label: 'Indefinido' }
        ]
      }
    ]
  };

  // Template de Primera Vez - Psiquiatría
  const primeraVezPsiquiatria = {
    id: 'primera_vez_psiquiatria',
    name: 'Primera Vez - Psiquiatría',
    description: 'Evaluación psiquiátrica inicial completa con examen mental detallado',
    category: 'psychiatry',
    isSystem: true,
    createdAt: new Date().toISOString(),
    icon: '🧬',
    specialty: ['psiquiatria', 'psiquiatria-clinica'],
    estimatedDuration: 60,
    autoSelection: {
      conditions: [
        "patient.specialty === 'psiquiatria'",
        "patient.visits === 0",
        "appointment.type === 'primera-vez'"
      ],
      reason: "Primera consulta psiquiátrica"
    },
    fields: [
      // SUBJETIVO
      {
        id: 'subjetivo_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'SUBJETIVO',
        required: false,
        order: 1,
        styling: {
          backgroundColor: 'var(--primary-50)',
          textColor: 'var(--primary-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'motivo_consulta',
        type: FIELD_TYPES.LONG_TEXT,
        label: 'Motivo de Consulta',
        required: true,
        order: 2,
        placeholder: 'Descripción detallada del motivo de consulta según el paciente y/o familiares',
        validation: { minLength: 10, maxLength: 2000 }
      },
      {
        id: 'personalidad_premorbida',
        type: FIELD_TYPES.LONG_TEXT,
        label: 'Personalidad Premórbida/Antecedentes de Relevancia',
        required: true,
        order: 3,
        placeholder: 'Personalidad previa, antecedentes familiares, personales, desarrollo psicomotor, historia médica relevante',
        validation: { minLength: 10, maxLength: 2000 }
      },
      {
        id: 'subjetivo_general',
        type: FIELD_TYPES.LONG_TEXT,
        label: 'Subjetivo',
        required: true,
        order: 4,
        placeholder: 'Información subjetiva adicional, evolución del cuadro, factores precipitantes y desencadenantes',
        validation: { minLength: 10, maxLength: 2000 }
      },
      {
        id: 'sintomas',
        type: FIELD_TYPES.LONG_TEXT,
        label: 'Síntomas',
        required: true,
        order: 5,
        placeholder: 'Descripción detallada de la sintomatología actual',
        validation: { minLength: 10, maxLength: 2000 }
      },
      {
        id: 'tiempo_evolucion',
        type: FIELD_TYPES.MULTI_SELECT_GRID,
        label: 'Tiempo de Evolución de Síntomas',
        required: true,
        order: 6,
        rows: [
          { id: 'cantidad', label: 'Cantidad' },
          { id: 'unidad', label: 'Unidad de tiempo' }
        ],
        columns: [
          { id: '1_7', label: '1-7' },
          { id: '8_30', label: '8-30' },
          { id: '1_3_meses', label: '1-3 meses' },
          { id: '4_6_meses', label: '4-6 meses' },
          { id: '7_12_meses', label: '7-12 meses' },
          { id: 'mas_1_año', label: 'Más de 1 año' }
        ]
      },
      // OBJETIVO
      {
        id: 'objetivo_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'OBJETIVO',
        required: false,
        order: 7,
        styling: {
          backgroundColor: 'var(--accent-50)',
          textColor: 'var(--accent-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'inspeccion_general',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Descripción de la Inspección',
        required: true,
        order: 8,
        placeholder: 'Descripción general del paciente, aspecto físico, vestimenta, comportamiento observado'
      },
      {
        id: 'signos_vitales',
        type: FIELD_TYPES.MULTI_SELECT_GRID,
        label: 'Signos Vitales',
        required: true,
        order: 9,
        rows: [
          { id: 'talla', label: 'Talla (cm)' },
          { id: 'peso', label: 'Peso (kg)' },
          { id: 'fc', label: 'FC (lpm)' },
          { id: 'fr', label: 'FR (rpm)' },
          { id: 'ta_sistolica', label: 'TA Sistólica (mmHg)' },
          { id: 'ta_diastolica', label: 'TA Diastólica (mmHg)' }
        ],
        columns: [
          { id: 'valor', label: 'Valor' }
        ]
      },
      {
        id: 'examen_mental_apariencia',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Apariencia',
        required: true,
        order: 10,
        options: [
          { value: 'adecuada', label: 'Adecuada' },
          { value: 'desalinada', label: 'Desaliñada' },
          { value: 'extrana', label: 'Extraña' },
          { value: 'poca_higiene', label: 'Poca higiene' },
          { value: 'otro', label: 'Otro' }
        ]
      },
      {
        id: 'examen_mental_actitud',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Actitud',
        required: true,
        order: 11,
        options: [
          { value: 'adecuada', label: 'Adecuada' },
          { value: 'negativa', label: 'Negativa' },
          { value: 'indiferente', label: 'Indiferente' },
          { value: 'irritable', label: 'Irritable' },
          { value: 'iracundo', label: 'Iracundo' },
          { value: 'deprimida', label: 'Deprimida' },
          { value: 'exaltada', label: 'Exaltada' }
        ]
      },
      {
        id: 'examen_mental_conciencia',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Conciencia',
        required: true,
        order: 12,
        options: [
          { value: 'adecuada', label: 'Adecuada' },
          { value: 'somnoliento', label: 'Somnoliento' },
          { value: 'letargo', label: 'Letargo' },
          { value: 'sopor', label: 'Sopor' },
          { value: 'obnubilacion', label: 'Obnubilación' },
          { value: 'estupor', label: 'Estupor' },
          { value: 'alteracion_cualitativa', label: 'Alteración cualitativa (P.e. Disociación)' }
        ]
      },
      {
        id: 'examen_mental_orientacion',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Orientación',
        required: true,
        order: 13,
        options: [
          { value: 'bien_orientado_3_esferas', label: 'Bien orientado en 3 esferas' },
          { value: 'desorientado_1_esfera', label: 'Desorientado en 1 esfera (especificar)' },
          { value: 'desorientado_2_esferas', label: 'Desorientado en 2 esferas (especificar)' },
          { value: 'desorientado_3_esferas', label: 'Desorientado en 3 esferas' }
        ]
      },
      {
        id: 'examen_mental_atencion',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Atención',
        required: true,
        order: 14,
        options: [
          { value: 'adecuada', label: 'Adecuada' },
          { value: 'distraida', label: 'Distraída' },
          { value: 'desinteresada', label: 'Desinteresada' },
          { value: 'aprosexia', label: 'Aprosexia' },
          { value: 'hipoprosexia', label: 'Hipoprosexia' }
        ]
      },
      {
        id: 'examen_mental_lenguaje',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Lenguaje',
        required: true,
        order: 15,
        options: [
          { value: 'adecuado', label: 'Adecuado' },
          { value: 'incoherente', label: 'Incoherente' },
          { value: 'incongruente', label: 'Incongruente' },
          { value: 'afasia', label: 'Afasia' },
          { value: 'disartria', label: 'Disartria' },
          { value: 'taquilalia', label: 'Taquilalia' },
          { value: 'verborrea', label: 'Verborrea' },
          { value: 'mutismo', label: 'Mutismo' },
          { value: 'jergafasia', label: 'Jergafasia' },
          { value: 'dislalia', label: 'Dislalia' },
          { value: 'disfemia', label: 'Disfemia' },
          { value: 'bradilalia', label: 'Bradilalia' },
          { value: 'neologismos', label: 'Neologismos' },
          { value: 'ecolalia', label: 'Ecolalia' }
        ]
      },
      {
        id: 'examen_mental_pensamiento',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Examen Mental - Pensamiento',
        required: true,
        order: 16,
        options: [
          { value: 'adecuado', label: 'Adecuado/Sin alteraciones' },
          { value: 'asociaciones_laxas', label: 'Asociaciones laxas' },
          { value: 'descarrilamientos', label: 'Descarrilamientos' },
          { value: 'incoherencias', label: 'Incoherencias' },
          { value: 'tangencialidad', label: 'Tangencialidad' },
          { value: 'circunstancialidad', label: 'Circunstancialidad' },
          { value: 'esquizofasia', label: 'Esquizofasia' },
          { value: 'ideas_deliroides', label: 'Ideas deliroides' },
          { value: 'ideas_sobrevaloradas', label: 'Ideas sobrevaloradas' },
          { value: 'ideas_delirantes', label: 'Ideas delirantes' },
          { value: 'ideas_obsesivas', label: 'Ideas obsesivas' },
          { value: 'ideas_fobicas', label: 'Ideas fóbicas' },
          { value: 'fuga_ideas', label: 'Fuga de ideas' },
          { value: 'bloqueo_pensamiento', label: 'Bloqueo del pensamiento' },
          { value: 'bradipsiquia', label: 'Bradipsiquia' },
          { value: 'pobreza_contenido', label: 'Pobreza del contenido' },
          { value: 'perseveracion', label: 'Perseveración' }
        ]
      },
      {
        id: 'examen_mental_afecto',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Afecto',
        required: true,
        order: 17,
        options: [
          { value: 'eutimia', label: 'Eutimia' },
          { value: 'tristeza', label: 'Tristeza' },
          { value: 'hipotimia', label: 'Hipotimia' },
          { value: 'depresivo', label: 'Depresivo' },
          { value: 'euforia', label: 'Euforia' },
          { value: 'disforia', label: 'Disforia' },
          { value: 'hipomania', label: 'Hipomanía' },
          { value: 'aplanamiento_afectivo', label: 'Aplanamiento afectivo' },
          { value: 'disonancia_ideo_afectiva', label: 'Disonancia ideo-afectiva' },
          { value: 'labilidad_afectiva', label: 'Labilidad afectiva' },
          { value: 'abulia', label: 'Abulia' }
        ]
      },
      {
        id: 'examen_mental_sensopercepcion',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Sensopercepción',
        required: true,
        order: 18,
        options: [
          { value: 'sin_alteraciones', label: 'Sin alteraciones sensoperceptivas' },
          { value: 'pseudoalucinaciones', label: 'Pseudoalucinaciones' },
          { value: 'ilusiones', label: 'Ilusiones' },
          { value: 'alucinaciones', label: 'Alucinaciones' }
        ]
      },
      {
        id: 'examen_mental_memoria',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Memoria',
        required: true,
        order: 19,
        options: [
          { value: 'adecuada', label: 'Adecuada' },
          { value: 'amnesia_retrograda', label: 'Amnesia retrógrada' },
          { value: 'amnesia_anterograda', label: 'Amnesia anterógrada' },
          { value: 'amnesia_global_transitoria', label: 'Amnesia global transitoria' },
          { value: 'confabulaciones', label: 'Confabulaciones' },
          { value: 'deja_vu', label: 'Deja vu' },
          { value: 'jamais_vu', label: 'Jamais Vu' },
          { value: 'hipomnesia', label: 'Hipomnesia' }
        ]
      },
      {
        id: 'examen_mental_juicio',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Juicio',
        required: true,
        order: 20,
        options: [
          { value: 'adecuado', label: 'Adecuado' },
          { value: 'autocritico', label: 'Autocrítico' },
          { value: 'heterocritico', label: 'Heterocrítico' },
          { value: 'fuera_marco_realidad', label: 'Fuera del marco de la realidad' },
          { value: 'fallas_adaptativas', label: 'Fallas adaptativas' },
          { value: 'debilitado', label: 'Debilitado' },
          { value: 'insuficiente', label: 'Insuficiente' }
        ]
      },
      {
        id: 'examen_mental_inteligencia',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Examen Mental - Inteligencia',
        required: true,
        order: 21,
        options: [
          { value: 'suficiente', label: 'Suficiente' },
          { value: 'adecuada_estrato', label: 'Adecuada para el estrato sociocultural' },
          { value: 'deteriorada', label: 'Deteriorada' },
          { value: 'deficiente', label: 'Deficiente' },
          { value: 'muy_deficiente', label: 'Muy deficiente' },
          { value: 'muy_limitada', label: 'Muy limitada' },
          { value: 'retraso_evidente', label: 'Retraso evidente' }
        ]
      },
      {
        id: 'tratamientos_previos',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Tratamientos o Abordajes Previos',
        required: false,
        order: 22,
        placeholder: 'Descripción de tratamientos psiquiátricos, psicológicos, farmacológicos previos y su efectividad'
      },
      {
        id: 'factores_riesgo',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Factores de Riesgo',
        required: true,
        order: 23,
        options: [
          { value: 'ideacion_suicida', label: 'Ideación suicida' },
          { value: 'ideacion_homicida', label: 'Ideación homicida' },
          { value: 'autolesion', label: 'Autolesión' },
          { value: 'heteroagresion', label: 'Heteroagresión' },
          { value: 'impulsividad', label: 'Impulsividad' },
          { value: 'abuso_sustancias', label: 'Abuso de sustancias' },
          { value: 'falta_insight', label: 'Falta de insight' },
          { value: 'aislamiento_social', label: 'Aislamiento social' },
          { value: 'incumplimiento_terapeutico', label: 'Incumplimiento terapéutico' }
        ]
      },
      {
        id: 'factores_riesgo_descripcion',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Descripción Detallada de Factores de Riesgo',
        required: true,
        order: 24,
        placeholder: 'Descripción detallada de factores de riesgo identificados'
      },
      {
        id: 'fortalezas',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Fortalezas',
        required: true,
        order: 25,
        placeholder: 'Recursos personales, familiares, sociales y factores protectores identificados'
      },
      // PLAN
      {
        id: 'plan_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'PLAN',
        required: false,
        order: 26,
        styling: {
          backgroundColor: 'var(--success-50)',
          textColor: 'var(--success-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'conclusiones',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Conclusiones',
        required: true,
        order: 27,
        placeholder: 'Síntesis diagnóstica, impresión clínica y plan de tratamiento'
      },
      {
        id: 'tags_diagnosticos',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Tags',
        required: false,
        order: 28,
        options: [
          { value: 'primera_vez', label: 'Primera vez' },
          { value: 'seguimiento', label: 'Seguimiento' },
          { value: 'urgencia', label: 'Urgencia' },
          { value: 'crisis', label: 'Crisis' },
          { value: 'estable', label: 'Estable' },
          { value: 'mejoría', label: 'Mejoría' },
          { value: 'recaída', label: 'Recaída' }
        ]
      },
      {
        id: 'tipo_clasificacion',
        type: FIELD_TYPES.RADIO,
        label: 'Tipo de Clasificación Diagnóstica',
        required: true,
        order: 29,
        options: [
          { value: 'cie10', label: 'CIE-10' },
          { value: 'dsm5', label: 'DSM-5' },
          { value: 'manual', label: 'Ingreso manual' }
        ]
      },
      {
        id: 'diagnostico_principal',
        type: FIELD_TYPES.SHORT_TEXT,
        label: 'Diagnóstico Principal',
        required: true,
        order: 30,
        placeholder: 'Diagnóstico principal según clasificación seleccionada'
      },
      {
        id: 'diagnosticos_secundarios',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Diagnósticos Secundarios',
        required: false,
        order: 31,
        placeholder: 'Diagnósticos secundarios (máximo 5)'
      },
      {
        id: 'tiempo_seguimiento',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Próxima Cita - Tiempo de Seguimiento',
        required: true,
        order: 32,
        options: [
          { value: '1_semana', label: '1 semana' },
          { value: '2_semanas', label: '2 semanas' },
          { value: '3_semanas', label: '3 semanas' },
          { value: '4_semanas', label: '4 semanas' },
          { value: '6_semanas', label: '6 semanas' },
          { value: '8_semanas', label: '8 semanas' },
          { value: '3_meses', label: '3 meses' },
          { value: '6_meses', label: '6 meses' },
          { value: '12_meses', label: '12 meses' }
        ]
      },
      {
        id: 'notas_cita',
        type: FIELD_TYPES.SHORT_TEXT,
        label: 'Notas para la Próxima Cita',
        required: false,
        order: 33,
        placeholder: 'Notas adicionales para la próxima cita'
      }
    ]
  };

  // Template de Subsecuente Psicología
  const subsecuentePsicologia = {
    id: 'subsecuente_psicologia',
    name: 'Consulta Subsecuente - Psicología',
    description: 'Seguimiento psicológico enfocado en progreso del plan de tratamiento',
    category: 'psychology_followup',
    isSystem: true,
    createdAt: new Date().toISOString(),
    icon: '📈',
    specialty: ['psicologia', 'psicologia-clinica'],
    estimatedDuration: 50,
    autoSelection: {
      conditions: [
        "patient.specialty === 'psicologia'",
        "patient.visits > 0",
        "appointment.type === 'seguimiento'"
      ],
      reason: "Consulta de seguimiento psicológico"
    },
    fields: [
      // Resumen de Consulta Anterior
      {
        id: 'resumen_previo_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Resumen de Consulta Anterior',
        required: false,
        order: 1,
        styling: {
          backgroundColor: 'var(--blue-50)',
          textColor: 'var(--blue-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'ultima_consulta',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Resumen de Última Consulta',
        required: false,
        order: 2,
        placeholder: 'Se cargará automáticamente del expediente...',
        readonly: true
      },
      {
        id: 'objetivos_previos',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Objetivos del Plan de Tratamiento',
        required: false,
        order: 3,
        placeholder: 'Se cargarán automáticamente del plan de tratamiento...',
        readonly: true
      },
      {
        id: 'tareas_asignadas_prev',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Tareas Asignadas Anteriormente',
        required: false,
        order: 4,
        placeholder: 'Se cargarán automáticamente de la consulta previa...',
        readonly: true
      },
      // Estado Actual
      {
        id: 'estado_actual_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Estado Actual',
        required: false,
        order: 5,
        styling: {
          backgroundColor: 'var(--green-50)',
          textColor: 'var(--green-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'estado_animo',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Estado de Ánimo Comparado con Sesión Anterior',
        required: true,
        order: 6,
        options: [
          { value: 'mejor', label: 'Mejor' },
          { value: 'igual', label: 'Igual' },
          { value: 'peor', label: 'Peor' },
          { value: 'fluctuante', label: 'Fluctuante' }
        ]
      },
      {
        id: 'nivel_funcionamiento',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Nivel de Funcionamiento',
        required: true,
        order: 7,
        options: [
          { value: 'mejorado', label: 'Mejorado' },
          { value: 'estable', label: 'Estable' },
          { value: 'deteriorado', label: 'Deteriorado' },
          { value: 'variable', label: 'Variable' }
        ]
      },
      {
        id: 'motivacion_terapia',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Motivación hacia la Terapia',
        required: true,
        order: 8,
        options: [
          { value: 'alta', label: 'Alta' },
          { value: 'moderada', label: 'Moderada' },
          { value: 'baja', label: 'Baja' },
          { value: 'ambivalente', label: 'Ambivalente' }
        ]
      },
      {
        id: 'autoevaluacion_progreso',
        type: FIELD_TYPES.SLIDER,
        label: 'Autoevaluación de Progreso (1-10)',
        required: true,
        order: 9,
        validation: {
          min: 1,
          max: 10,
          step: 1
        },
        defaultValue: 5,
        displayValue: true,
        labels: {
          min: 'Ningún progreso',
          max: 'Progreso excelente'
        }
      },
      {
        id: 'intensidad_sintomas',
        type: FIELD_TYPES.SLIDER,
        label: 'Intensidad de Síntomas Actual (0-10)',
        required: true,
        order: 10,
        validation: {
          min: 0,
          max: 10,
          step: 1
        },
        defaultValue: 5,
        displayValue: true,
        labels: {
          min: 'Sin síntomas',
          max: 'Síntomas severos'
        }
      },
      {
        id: 'frecuencia_sintomas',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Frecuencia de Síntomas',
        required: true,
        order: 11,
        options: [
          { value: 'diaria', label: 'Diaria' },
          { value: 'varias_veces_semana', label: 'Varias veces por semana' },
          { value: 'semanal', label: 'Semanal' },
          { value: 'ocasional', label: 'Ocasional' },
          { value: 'rara_vez', label: 'Rara vez' }
        ]
      },
      {
        id: 'cambios_sintomas',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Cambios en los Síntomas',
        required: true,
        order: 12,
        options: [
          { value: 'disminucion_intensidad', label: 'Disminución de intensidad' },
          { value: 'aumento_intensidad', label: 'Aumento de intensidad' },
          { value: 'nuevos_sintomas', label: 'Nuevos síntomas' },
          { value: 'desaparicion_sintomas', label: 'Desaparición de síntomas' },
          { value: 'sin_cambios', label: 'Sin cambios' },
          { value: 'mas_manejables', label: 'Síntomas más manejables' }
        ]
      },
      {
        id: 'descripcion_cambios',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Descripción de Cambios en Sintomatología',
        required: false,
        order: 13,
        placeholder: 'Describir cambios específicos en la sintomatología desde la última sesión'
      },
      {
        id: 'eventos_significativos',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Eventos Significativos desde la Última Sesión',
        required: false,
        order: 14,
        placeholder: 'Eventos importantes que hayan ocurrido y puedan afectar el proceso terapéutico'
      },
      // Adherencia al Tratamiento
      {
        id: 'adherencia_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Adherencia al Tratamiento',
        required: false,
        order: 15,
        styling: {
          backgroundColor: 'var(--yellow-50)',
          textColor: 'var(--yellow-700)',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'cumplimiento_tareas',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Cumplimiento de Tareas Asignadas',
        required: true,
        order: 16,
        options: [
          { value: 'completo', label: 'Completo' },
          { value: 'parcial', label: 'Parcial' },
          { value: 'minimo', label: 'Mínimo' },
          { value: 'no_realizo', label: 'No realizó' }
        ]
      },
      {
        id: 'practica_tecnicas',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Práctica de Técnicas Enseñadas',
        required: true,
        order: 17,
        options: [
          { value: 'diariamente', label: 'Diariamente' },
          { value: 'varias_veces_semana', label: 'Varias veces por semana' },
          { value: 'ocasionalmente', label: 'Ocasionalmente' },
          { value: 'no_practico', label: 'No practicó' }
        ]
      },
      {
        id: 'dificultades_adherencia',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Dificultades para la Adherencia',
        required: false,
        order: 18,
        options: [
          { value: 'falta_tiempo', label: 'Falta de tiempo' },
          { value: 'olvido', label: 'Olvido' },
          { value: 'falta_motivacion', label: 'Falta de motivación' },
          { value: 'dificultad_tecnica', label: 'Dificultad técnica' },
          { value: 'resistencia', label: 'Resistencia' },
          { value: 'eventos_externos', label: 'Eventos externos' },
          { value: 'ninguna_dificultad', label: 'Ninguna dificultad' }
        ]
      },
      // Progreso en Objetivos
      {
        id: 'progreso_objetivos_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Progreso en Objetivos Terapéuticos',
        required: false,
        order: 19,
        styling: {
          backgroundColor: 'var(--purple-50)',
          textColor: 'var(--purple-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'revision_objetivos',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Revisión de Objetivos del Plan de Tratamiento',
        required: true,
        order: 20,
        placeholder: 'Evaluar el progreso de cada objetivo del plan de tratamiento, especificar logros y áreas que necesitan más trabajo'
      },
      {
        id: 'porcentaje_avance_general',
        type: FIELD_TYPES.SLIDER,
        label: 'Porcentaje de Avance General (%)',
        required: true,
        order: 21,
        validation: {
          min: 0,
          max: 100,
          step: 10
        },
        defaultValue: 50,
        displayValue: true,
        suffix: '%',
        labels: {
          min: 'Sin progreso',
          max: 'Objetivos logrados'
        }
      },
      {
        id: 'logros_sesion',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Logros de la Sesión',
        required: true,
        order: 22,
        placeholder: 'Principales logros, insights o avances conseguidos durante la sesión'
      },
      {
        id: 'dificultades_encontradas',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Dificultades Encontradas',
        required: false,
        order: 23,
        options: [
          { value: 'resistencia_cambio', label: 'Resistencia al cambio' },
          { value: 'dificultades_cognitivas', label: 'Dificultades cognitivas' },
          { value: 'problemas_externos', label: 'Problemas externos' },
          { value: 'falta_recursos', label: 'Falta de recursos' },
          { value: 'comorbilidad', label: 'Comorbilidad' },
          { value: 'dinamicas_familiares', label: 'Dinámicas familiares' },
          { value: 'laborales_academicas', label: 'Laborales/académicas' }
        ]
      },
      {
        id: 'descripcion_dificultades',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Descripción de Dificultades y Cómo se Abordaron',
        required: false,
        order: 24,
        placeholder: 'Descripción específica de las dificultades y estrategias utilizadas para abordarlas'
      },
      // Intervención de la Sesión
      {
        id: 'intervencion_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Intervención de la Sesión',
        required: false,
        order: 25,
        styling: {
          backgroundColor: 'var(--indigo-50)',
          textColor: 'var(--indigo-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'tecnicas_utilizadas',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Técnicas Utilizadas en la Sesión',
        required: true,
        order: 26,
        options: [
          { value: 'reestructuracion_cognitiva', label: 'Reestructuración cognitiva' },
          { value: 'tecnicas_exposicion', label: 'Técnicas de exposición' },
          { value: 'relajacion_respiracion', label: 'Relajación/Respiración' },
          { value: 'mindfulness', label: 'Mindfulness' },
          { value: 'activacion_conductual', label: 'Activación conductual' },
          { value: 'psicoeducacion', label: 'Psicoeducación' },
          { value: 'role_playing', label: 'Role playing' },
          { value: 'tecnicas_narrativas', label: 'Técnicas narrativas' },
          { value: 'trabajo_emociones', label: 'Trabajo con emociones' },
          { value: 'resolucion_problemas', label: 'Resolución de problemas' },
          { value: 'tecnicas_aceptacion', label: 'Técnicas de aceptación' },
          { value: 'entrenamiento_habilidades', label: 'Entrenamiento en habilidades' }
        ]
      },
      {
        id: 'contenido_sesion',
        type: FIELD_TYPES.LONG_TEXT,
        label: 'Contenido Principal de la Sesión',
        required: true,
        order: 27,
        placeholder: 'Descripción del contenido principal trabajado durante la sesión',
        validation: { minLength: 20, maxLength: 1500 }
      },
      {
        id: 'insights_paciente',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Insights del Paciente',
        required: false,
        order: 28,
        placeholder: 'Principales insights, conexiones o comprensiones del paciente durante la sesión'
      },
      // Plan de Seguimiento
      {
        id: 'plan_seguimiento_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'Plan de Seguimiento',
        required: false,
        order: 29,
        styling: {
          backgroundColor: 'var(--teal-50)',
          textColor: 'var(--teal-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      {
        id: 'tareas_casa',
        type: FIELD_TYPES.LONG_TEXT,
        label: 'Tareas para Casa',
        required: true,
        order: 30,
        placeholder: 'Especificar tareas asignadas, frecuencia y objetivos de cada una',
        validation: { minLength: 10, maxLength: 800 }
      },
      {
        id: 'objetivos_proxima_sesion',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Objetivos para Próxima Sesión',
        required: true,
        order: 31,
        placeholder: 'Objetivos específicos a trabajar en la siguiente sesión'
      },
      {
        id: 'requiere_ajustes_plan',
        type: FIELD_TYPES.YES_NO,
        label: '¿Requiere Ajustes al Plan de Tratamiento?',
        required: true,
        order: 32
      },
      {
        id: 'tipo_ajustes',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Tipo de Ajustes Necesarios',
        required: false,
        order: 33,
        options: [
          { value: 'cambio_tecnicas', label: 'Cambio de técnicas' },
          { value: 'nuevos_objetivos', label: 'Nuevos objetivos' },
          { value: 'modificar_frecuencia', label: 'Modificar frecuencia' },
          { value: 'incluir_otros_profesionales', label: 'Incluir otros profesionales' },
          { value: 'cambio_enfoque', label: 'Cambio de enfoque' }
        ],
        conditionalLogic: {
          showWhen: {
            field: 'requiere_ajustes_plan',
            operator: 'equals',
            value: 'yes'
          }
        }
      },
      {
        id: 'descripcion_ajustes',
        type: FIELD_TYPES.PARAGRAPH,
        label: 'Descripción de Ajustes al Plan',
        required: false,
        order: 34,
        placeholder: 'Describir los ajustes necesarios al plan de tratamiento',
        conditionalLogic: {
          showWhen: {
            field: 'requiere_ajustes_plan',
            operator: 'equals',
            value: 'yes'
          }
        }
      },
      {
        id: 'tiempo_seguimiento_psico',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Tiempo para Próxima Cita',
        required: true,
        order: 35,
        options: [
          { value: '1_semana', label: '1 semana' },
          { value: '2_semanas', label: '2 semanas' },
          { value: '3_semanas', label: '3 semanas' },
          { value: '4_semanas', label: '4 semanas' },
          { value: 'segun_necesidad', label: 'Según necesidad' }
        ]
      }
    ]
  };

  // Template: Alta Psiquiátrica
  const altaPsiquiatria = {
    id: 'alta-psiquiatria',
    name: 'Alta Psiquiátrica',
    description: 'Nota de alta psiquiátrica con resumen completo del tratamiento y recomendaciones',
    icon: '🎯',
    category: 'psiquiatria',
    estimatedDuration: 30,
    version: '1.0',
    customizable: true,
    specialty: ['psiquiatria'],
    createdAt: new Date().toISOString(),
    fields: [
      {
        id: 'tiempo-seguimiento',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Tiempo Total de Seguimiento',
        category: 'resumen-tratamiento',
        required: true,
        placeholder: 'Resumen del tiempo total de seguimiento, fechas relevantes y número de consultas',
        rows: 2
      },
      {
        id: 'diagnosticos-tratados',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Diagnósticos Tratados',
        category: 'resumen-tratamiento',
        required: true,
        placeholder: 'Diagnóstico inicial, evolución diagnóstica y diagnóstico final',
        rows: 3
      },
      {
        id: 'medicamentos-utilizados',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Medicamentos Utilizados Durante el Tratamiento',
        category: 'resumen-tratamiento',
        required: true,
        placeholder: 'Medicamentos actuales y previos, dosis máximas alcanzadas, duración de tratamientos',
        rows: 4
      },
      {
        id: 'modificaciones-farmacologicas',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Modificaciones Farmacológicas Realizadas',
        category: 'resumen-tratamiento',
        required: true,
        placeholder: 'Ajustes de dosis, cambios de medicamentos, adiciones, suspensiones y razones',
        rows: 3
      },
      {
        id: 'tiempo-remision',
        type: FIELD_TYPES.SELECT,
        label: 'Tipo de Remisión',
        category: 'evolucion-clinica',
        required: true,
        options: ['Remisión completa', 'Remisión parcial', 'Respuesta clínica', 'Estabilización']
      },
      {
        id: 'inicio-remision',
        type: FIELD_TYPES.DATE,
        label: 'Fecha de Inicio de Remisión',
        category: 'evolucion-clinica',
        required: true
      },
      {
        id: 'criterios-remision',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Criterios de Remisión Cumplidos',
        category: 'evolucion-clinica',
        required: true,
        options: ['Ausencia de síntomas', 'Funcionamiento normal', 'Escalas en rango normal', 'Medicación estable', 'Sin crisis']
      },
      {
        id: 'progreso-clinico',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Progreso Clínico Observado',
        category: 'evolucion-clinica',
        required: true,
        placeholder: 'Resumen del progreso clínico, mejorías observadas, cambios en funcionamiento',
        rows: 4
      },
      {
        id: 'apoyo-psicoterapeutico',
        type: FIELD_TYPES.SELECT,
        label: 'Recibió Apoyo Psicoterapéutico',
        category: 'recursos-utilizados',
        required: false,
        options: ['Sí', 'No']
      },
      {
        id: 'tipo-psicoterapia',
        type: FIELD_TYPES.TEXT,
        label: 'Tipo de Psicoterapia Recibida',
        category: 'recursos-utilizados',
        required: false,
        placeholder: 'Especificar tipo y duración del proceso psicoterapéutico'
      },
      {
        id: 'coordinacion-tratamiento',
        type: FIELD_TYPES.SELECT,
        label: 'Coordinación del Tratamiento',
        category: 'recursos-utilizados',
        required: false,
        options: ['Excelente', 'Buena', 'Regular', 'Limitada', 'No aplica']
      },
      {
        id: 'fortaleza-red-apoyo',
        type: FIELD_TYPES.SELECT,
        label: 'Fortaleza de Red de Apoyo',
        category: 'recursos-utilizados',
        required: true,
        options: ['Muy fuerte', 'Fuerte', 'Moderada', 'Débil', 'Ausente']
      },
      {
        id: 'participacion-familia',
        type: FIELD_TYPES.SELECT,
        label: 'Participación de la Familia',
        category: 'recursos-utilizados',
        required: true,
        options: ['Muy activa', 'Activa', 'Moderada', 'Limitada', 'Ausente']
      },
      {
        id: 'motivo-alta',
        type: FIELD_TYPES.SELECT,
        label: 'Motivo del Alta',
        category: 'motivo-alta',
        required: true,
        options: [
          'Remisión completa de síntomas',
          'Remisión parcial con funcionamiento adecuado',
          'Estabilización clínica',
          'Transferencia a otro nivel de atención',
          'Solicitud del paciente',
          'Falta de adherencia al tratamiento',
          'Cambio de residencia',
          'Otro'
        ]
      },
      {
        id: 'criterios-cumplidos',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Criterios de Alta Cumplidos',
        category: 'motivo-alta',
        required: true,
        options: [
          'Ausencia o control de síntomas psiquiátricos',
          'Funcionamiento psicosocial adecuado',
          'Medicación estable y bien tolerada',
          'Insight y adherencia al tratamiento',
          'Red de apoyo funcional',
          'Plan de contingencia establecido',
          'Seguimiento programado',
          'Recursos de apoyo disponibles'
        ]
      },
      {
        id: 'estado-mental-alta',
        type: FIELD_TYPES.SELECT,
        label: 'Estado Mental al Alta',
        category: 'motivo-alta',
        required: true,
        options: ['Eutímico', 'Estable', 'Mejoría significativa', 'Mejoría parcial', 'Sin cambios']
      },
      {
        id: 'funcionamiento-global',
        type: FIELD_TYPES.NUMBER,
        label: 'Funcionamiento Global (GAF 1-100)',
        category: 'motivo-alta',
        required: true,
        min: 1,
        max: 100
      },
      {
        id: 'riesgo-actual',
        type: FIELD_TYPES.SELECT,
        label: 'Riesgo Actual',
        category: 'motivo-alta',
        required: true,
        options: ['Sin riesgo', 'Riesgo bajo', 'Riesgo moderado', 'Riesgo alto']
      },
      {
        id: 'requiere-medicacion',
        type: FIELD_TYPES.SELECT,
        label: 'Requiere Medicación de Mantenimiento',
        category: 'plan-mantenimiento',
        required: true,
        options: ['Sí', 'No']
      },
      {
        id: 'duracion-medicacion',
        type: FIELD_TYPES.SELECT,
        label: 'Duración Recomendada de Medicación',
        category: 'plan-mantenimiento',
        required: false,
        options: ['3 meses', '6 meses', '1 año', '2 años', 'Indefinido', 'A evaluar']
      },
      {
        id: 'monitorizacion-requerida',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Monitorización Requerida',
        category: 'plan-mantenimiento',
        required: false,
        options: ['Niveles séricos', 'Función hepática', 'Función renal', 'Hemograma', 'Peso', 'Presión arterial']
      },
      {
        id: 'frecuencia-seguimiento',
        type: FIELD_TYPES.SELECT,
        label: 'Frecuencia de Seguimiento Inicial',
        category: 'plan-mantenimiento',
        required: true,
        options: ['1 mes', '2 meses', '3 meses', '6 meses', 'SOS', 'No requiere']
      },
      {
        id: 'tipo-seguimiento',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Tipo de Seguimiento',
        category: 'plan-mantenimiento',
        required: true,
        options: ['Psiquiatría', 'Psicología', 'Medicina familiar', 'Trabajo social', 'Otro especialista']
      },
      {
        id: 'objetivos-seguimiento',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Objetivos del Seguimiento',
        category: 'plan-mantenimiento',
        required: true,
        options: ['Monitoreo de síntomas', 'Adherencia a medicación', 'Efectos secundarios', 'Funcionamiento', 'Prevención de recaídas']
      },
      {
        id: 'senales-alarma',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Señales de Alarma para el Paciente y Familia',
        category: 'plan-mantenimiento',
        required: true,
        options: [
          'Reaparición de síntomas previos',
          'Cambios en el estado de ánimo',
          'Alteraciones del sueño',
          'Aislamiento social',
          'Descuido del autocuidado',
          'Ideas de muerte o suicidio',
          'Consumo de alcohol o drogas',
          'Conflictos familiares o laborales',
          'Abandono de medicación',
          'Pérdida de insight'
        ]
      },
      {
        id: 'contacto-emergencia',
        type: FIELD_TYPES.TEXT,
        label: 'Contacto en Caso de Emergencia',
        category: 'plan-mantenimiento',
        required: true,
        placeholder: 'Teléfono y nombre del contacto de emergencia'
      },
      {
        id: 'que-hacer-crisis',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Qué Hacer en Caso de Crisis',
        category: 'plan-mantenimiento',
        required: true,
        placeholder: 'Instrucciones específicas para manejo de crisis',
        rows: 3
      },
      {
        id: 'cuando-buscar-ayuda',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Cuándo Buscar Ayuda Profesional',
        category: 'plan-mantenimiento',
        required: true,
        placeholder: 'Situaciones que requieren ayuda profesional inmediata',
        rows: 2
      },
      {
        id: 'recursos-disponibles',
        type: FIELD_TYPES.TEXT,
        label: 'Recursos Comunitarios Disponibles',
        category: 'plan-mantenimiento',
        required: false,
        placeholder: 'Recursos comunitarios y de emergencia disponibles'
      }
    ]
  };

  // Template: Evento Entre Consultas
  const eventoEntreConsultas = {
    id: 'evento-entre-consultas',
    name: 'Evento Entre Consultas',
    description: 'Registro rápido de incidentes o eventos reportados por el paciente entre consultas programadas',
    icon: '⚡',
    category: 'general',
    estimatedDuration: 10,
    version: '1.0',
    customizable: true,
    specialty: ['psicologia', 'psiquiatria', 'medicina-general'],
    createdAt: new Date().toISOString(),
    fields: [
      {
        id: 'tipo-contacto',
        type: FIELD_TYPES.SELECT,
        label: 'Tipo de Contacto',
        category: 'evento-info',
        required: true,
        options: [
          'Llamada telefónica',
          'Mensaje/WhatsApp',
          'Correo electrónico',
          'Visita presencial urgente',
          'Familiar/Acompañante reporta',
          'Otro profesional reporta'
        ]
      },
      {
        id: 'fecha-evento',
        type: FIELD_TYPES.DATE,
        label: 'Fecha del Evento',
        category: 'evento-info',
        required: true
      },
      {
        id: 'hora-evento',
        type: FIELD_TYPES.TIME,
        label: 'Hora Aproximada del Evento',
        category: 'evento-info',
        required: false
      },
      {
        id: 'momento-dia',
        type: FIELD_TYPES.SELECT,
        label: 'Momento del Día (si no se especifica hora)',
        category: 'evento-info',
        required: false,
        options: ['Madrugada', 'Mañana', 'Tarde', 'Noche', 'No especificado']
      },
      {
        id: 'descripcion-evento',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Descripción del Evento/Incidente',
        category: 'evento-info',
        required: true,
        placeholder: 'Descripción detallada del evento, síntomas, situación o incidente reportado por el paciente',
        rows: 4
      },
      {
        id: 'nivel-urgencia',
        type: FIELD_TYPES.SELECT,
        label: 'Nivel de Urgencia',
        category: 'evento-info',
        required: true,
        options: ['Baja', 'Moderada', 'Alta', 'Crítica']
      },
      {
        id: 'riesgo-inmediato',
        type: FIELD_TYPES.SELECT,
        label: 'Presenta Riesgo Inmediato',
        category: 'evento-info',
        required: true,
        options: ['Sí', 'No']
      },
      {
        id: 'tipo-riesgo',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Tipo de Riesgo (si aplica)',
        category: 'evento-info',
        required: false,
        options: ['Autolesión', 'Suicidio', 'Heteroagresión', 'Descompensación', 'Crisis de pánico', 'Síntomas psicóticos', 'Abuso de sustancias', 'Otro']
      },
      {
        id: 'requiere-atencion-inmediata',
        type: FIELD_TYPES.SELECT,
        label: 'Requiere Atención Inmediata',
        category: 'evento-info',
        required: true,
        options: ['Sí', 'No']
      },
      {
        id: 'accion-tomada',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Acción Tomada',
        category: 'respuesta-inmediata',
        required: true,
        options: [
          'Contención telefónica',
          'Orientación psicológica',
          'Técnicas de relajación',
          'Activación de red de apoyo',
          'Cita de urgencia programada',
          'Referencia a urgencias',
          'Contacto con familiar',
          'Ajuste de medicación (solo psiquiatría)',
          'Seguimiento telefónico programado',
          'Recursos psicoeducativos enviados'
        ]
      },
      {
        id: 'orientacion-dada',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Orientación/Instrucciones Dadas',
        category: 'respuesta-inmediata',
        required: true,
        placeholder: 'Orientaciones específicas, técnicas enseñadas, instrucciones o recomendaciones dadas al paciente',
        rows: 3
      },
      {
        id: 'requiere-seguimiento',
        type: FIELD_TYPES.SELECT,
        label: 'Requiere Seguimiento',
        category: 'respuesta-inmediata',
        required: true,
        options: ['Sí', 'No']
      },
      {
        id: 'tipo-seguimiento-evento',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Tipo de Seguimiento (si aplica)',
        category: 'respuesta-inmediata',
        required: false,
        options: ['Llamada en 24h', 'Llamada en 48h', 'Adelantar próxima cita', 'Cita de urgencia', 'Monitoreo diario', 'Involucrar familia', 'Interconsulta', 'Hospitalización']
      },
      {
        id: 'fecha-seguimiento',
        type: FIELD_TYPES.DATE,
        label: 'Fecha de Seguimiento Programado',
        category: 'respuesta-inmediata',
        required: false
      },
      {
        id: 'notas-seguimiento',
        type: FIELD_TYPES.TEXT,
        label: 'Notas Adicionales sobre Seguimiento',
        category: 'respuesta-inmediata',
        required: false,
        placeholder: 'Notas adicionales sobre el plan de seguimiento'
      },
      {
        id: 'alertas',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Alertas a Generar',
        category: 'respuesta-inmediata',
        required: false,
        options: ['Notificar en próxima consulta', 'Alerta en expediente', 'Informar a otros profesionales']
      }
    ]
  };

  // Template: Subsecuente Psiquiatría
  const subsecuentePsiquiatria = {
    id: 'subsecuente-psiquiatria',
    name: 'Consulta Subsecuente - Psiquiatría',
    description: 'Seguimiento psiquiátrico con evaluación de respuesta al tratamiento y examen mental',
    icon: '🔄',
    category: 'psiquiatria',
    estimatedDuration: 30,
    version: '1.0',
    customizable: true,
    specialty: ['psiquiatria'],
    createdAt: new Date().toISOString(),
    fields: [
      {
        id: 'evolucion-sintomas-psiq',
        type: FIELD_TYPES.SELECT,
        label: 'Estado General Comparado con Consulta Anterior',
        category: 'subjetivo-seguimiento',
        required: true,
        options: ['Mucho mejor', 'Mejor', 'Igual', 'Peor', 'Mucho peor']
      },
      {
        id: 'porcentaje-mejoria',
        type: FIELD_TYPES.NUMBER,
        label: 'Porcentaje de Mejoría Global (0-100%)',
        category: 'subjetivo-seguimiento',
        required: true,
        min: 0,
        max: 100
      },
      {
        id: 'sintomas-residuales',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Síntomas Residuales',
        category: 'subjetivo-seguimiento',
        required: false,
        placeholder: 'Descripción de síntomas que persisten',
        rows: 2
      },
      {
        id: 'nuevos-sintomas',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Nuevos Síntomas',
        category: 'subjetivo-seguimiento',
        required: false,
        placeholder: 'Nuevos síntomas aparecidos desde la última consulta',
        rows: 2
      },
      {
        id: 'tiempo-mejoria',
        type: FIELD_TYPES.SELECT,
        label: 'Tiempo de Aparición de Mejoría',
        category: 'subjetivo-seguimiento',
        required: true,
        options: ['Inmediata (días)', 'Temprana (1-2 semanas)', 'Gradual (2-4 semanas)', 'Tardía (>4 semanas)', 'Sin mejoría']
      },
      {
        id: 'adherencia-cumplimiento',
        type: FIELD_TYPES.SELECT,
        label: 'Adherencia a la Medicación',
        category: 'subjetivo-seguimiento',
        required: true,
        options: ['100% (todas las dosis)', '75-99% (mayoría de dosis)', '50-74% (la mitad)', '25-49% (menos de la mitad)', '0-24% (muy pocas dosis)']
      },
      {
        id: 'olvidos-frecuencia',
        type: FIELD_TYPES.SELECT,
        label: 'Frecuencia de Olvidos',
        category: 'subjetivo-seguimiento',
        required: true,
        options: ['Nunca', 'Raramente', 'Ocasionalmente', 'Frecuentemente', 'Muy frecuentemente']
      },
      {
        id: 'razones-incumplimiento',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Razones de Incumplimiento (si aplica)',
        category: 'subjetivo-seguimiento',
        required: false,
        options: ['Olvidos', 'Efectos secundarios', 'Mejoría percibida', 'Falta de eficacia', 'Costo', 'Estigma', 'Complejidad del régimen', 'Ninguna']
      },
      {
        id: 'presenta-efectos-secundarios',
        type: FIELD_TYPES.SELECT,
        label: 'Presenta Efectos Secundarios',
        category: 'subjetivo-seguimiento',
        required: true,
        options: ['Sí', 'No']
      },
      {
        id: 'efectos-presentes',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Efectos Secundarios Presentes',
        category: 'subjetivo-seguimiento',
        required: false,
        options: [
          'Somnolencia/Sedación', 'Insomnio', 'Mareos', 'Cefalea', 'Náuseas/Vómitos',
          'Cambios de peso', 'Sequedad de boca', 'Estreñimiento', 'Diarrea', 'Temblor',
          'Rigidez muscular', 'Inquietud/Acatisia', 'Cambios en libido', 'Disfunción sexual',
          'Visión borrosa', 'Otros'
        ]
      },
      {
        id: 'severidad-efectos',
        type: FIELD_TYPES.SELECT,
        label: 'Severidad de Efectos Secundarios',
        category: 'subjetivo-seguimiento',
        required: false,
        options: ['Leves', 'Moderados', 'Severos', 'Intolerables']
      },
      {
        id: 'eventos-intercurrentes',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Eventos Intercurrentes',
        category: 'subjetivo-seguimiento',
        required: false,
        placeholder: 'Eventos médicos, psicológicos o sociales relevantes ocurridos desde la última consulta',
        rows: 3
      },
      {
        id: 'inspeccion-seguimiento',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Inspección General',
        category: 'objetivo-seguimiento',
        required: true,
        placeholder: 'Aspecto general, vestimenta, higiene, comportamiento observado en esta consulta',
        rows: 2
      },
      {
        id: 'peso-actual',
        type: FIELD_TYPES.NUMBER,
        label: 'Peso Actual (kg)',
        category: 'objetivo-seguimiento',
        required: false,
        min: 10,
        max: 300,
        step: 0.1
      },
      {
        id: 'fc-actual',
        type: FIELD_TYPES.NUMBER,
        label: 'Frecuencia Cardíaca (lpm)',
        category: 'objetivo-seguimiento',
        required: false,
        min: 30,
        max: 200
      },
      {
        id: 'ta-sistolica',
        type: FIELD_TYPES.NUMBER,
        label: 'TA Sistólica (mmHg)',
        category: 'objetivo-seguimiento',
        required: false,
        min: 60,
        max: 250
      },
      {
        id: 'ta-diastolica',
        type: FIELD_TYPES.NUMBER,
        label: 'TA Diastólica (mmHg)',
        category: 'objetivo-seguimiento',
        required: false,
        min: 40,
        max: 150
      },
      {
        id: 'apariencia-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Apariencia',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Adecuada', 'Desaliñada', 'Extraña', 'Poca higiene', 'Otro']
      },
      {
        id: 'actitud-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Actitud',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Adecuada', 'Negativa', 'Indiferente', 'Irritable', 'Iracundo', 'Deprimida', 'Exaltada']
      },
      {
        id: 'conciencia-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Conciencia',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Adecuada', 'Somnoliento', 'Letargo', 'Sopor', 'Obnubilación', 'Estupor', 'Alteración cualitativa']
      },
      {
        id: 'orientacion-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Orientación',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Bien orientado en 3 esferas', 'Desorientado en 1 esfera', 'Desorientado en 2 esferas', 'Desorientado en 3 esferas']
      },
      {
        id: 'atencion-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Atención',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Adecuada', 'Distraída', 'Desinteresada', 'Aprosexia', 'Hipoprosexia']
      },
      {
        id: 'lenguaje-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Lenguaje',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Adecuado', 'Incoherente', 'Incongruente', 'Afasia', 'Disartria', 'Taquilalia', 'Verborrea', 'Mutismo', 'Bradilalia']
      },
      {
        id: 'pensamiento-mental',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Pensamiento',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Adecuado/Sin alteraciones', 'Asociaciones laxas', 'Descarrilamientos', 'Ideas delirantes', 'Ideas obsesivas', 'Ideas fóbicas', 'Fuga de ideas', 'Bloqueo del pensamiento', 'Bradipsiquia']
      },
      {
        id: 'afecto-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Afecto',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Eutimia', 'Tristeza', 'Hipotimia', 'Depresivo', 'Euforia', 'Disforia', 'Hipomanía', 'Aplanamiento afectivo', 'Labilidad afectiva']
      },
      {
        id: 'sensopercepcion-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Sensopercepción',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Sin alteraciones', 'Pseudoalucinaciones', 'Ilusiones', 'Alucinaciones']
      },
      {
        id: 'memoria-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Memoria',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Adecuada', 'Amnesia retrógrada', 'Amnesia anterógrada', 'Hipomnesia', 'Confabulaciones']
      },
      {
        id: 'juicio-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Juicio',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Adecuado', 'Autocrítico', 'Heterocrítico', 'Fuera de realidad', 'Debilitado', 'Insuficiente']
      },
      {
        id: 'insight-mental',
        type: FIELD_TYPES.SELECT,
        label: 'Insight',
        category: 'objetivo-seguimiento',
        required: true,
        options: ['Completo', 'Parcial', 'Limitado', 'Ausente']
      },
      {
        id: 'tipo-respuesta-tratamiento',
        type: FIELD_TYPES.SELECT,
        label: 'Tipo de Respuesta al Tratamiento',
        category: 'evaluacion-respuesta',
        required: true,
        options: ['Remisión completa', 'Respuesta parcial', 'Respuesta mínima', 'Sin respuesta', 'Empeoramiento']
      },
      {
        id: 'tiempo-respuesta-tratamiento',
        type: FIELD_TYPES.SELECT,
        label: 'Tiempo de Respuesta',
        category: 'evaluacion-respuesta',
        required: true,
        options: ['1-2 semanas', '2-4 semanas', '4-6 semanas', '6-8 semanas', '>8 semanas', 'Sin respuesta aún']
      },
      {
        id: 'criterios-respuesta',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Criterios de Respuesta',
        category: 'evaluacion-respuesta',
        required: true,
        options: ['Reducción de síntomas >50%', 'Mejoría funcional', 'Mejor calidad de vida', 'Reducción de crisis', 'Mejor adherencia', 'Insight mejorado']
      },
      {
        id: 'areas-mejoria',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Áreas de Mejoría',
        category: 'evaluacion-respuesta',
        required: true,
        options: ['Estado de ánimo', 'Ansiedad', 'Psicosis', 'Sueño', 'Apetito', 'Energía', 'Concentración', 'Relaciones sociales', 'Funcionamiento laboral']
      },
      {
        id: 'gaf-actual',
        type: FIELD_TYPES.NUMBER,
        label: 'GAF Actual (1-100)',
        category: 'evaluacion-respuesta',
        required: true,
        min: 1,
        max: 100
      },
      {
        id: 'funcionamiento-laboral',
        type: FIELD_TYPES.SELECT,
        label: 'Funcionamiento Laboral',
        category: 'evaluacion-respuesta',
        required: true,
        options: ['Normal', 'Levemente alterado', 'Moderadamente alterado', 'Severamente alterado', 'No aplica']
      },
      {
        id: 'funcionamiento-social',
        type: FIELD_TYPES.SELECT,
        label: 'Funcionamiento Social',
        category: 'evaluacion-respuesta',
        required: true,
        options: ['Normal', 'Levemente alterado', 'Moderadamente alterado', 'Severamente alterado']
      },
      {
        id: 'autocuidado',
        type: FIELD_TYPES.SELECT,
        label: 'Autocuidado',
        category: 'evaluacion-respuesta',
        required: true,
        options: ['Independiente', 'Asistencia mínima', 'Asistencia moderada', 'Asistencia total']
      },
      {
        id: 'impresion-clinica-actual',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Impresión Clínica Actual',
        category: 'plan-seguimiento-psiq',
        required: true,
        placeholder: 'Evaluación del estado actual, respuesta al tratamiento y pronóstico',
        rows: 3
      },
      {
        id: 'requiere-ajustes-medicacion',
        type: FIELD_TYPES.SELECT,
        label: 'Requiere Ajustes a la Medicación',
        category: 'plan-seguimiento-psiq',
        required: true,
        options: ['Sí', 'No']
      },
      {
        id: 'tipo-ajuste',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Tipo de Ajuste (si aplica)',
        category: 'plan-seguimiento-psiq',
        required: false,
        options: ['Aumento de dosis', 'Disminución de dosis', 'Cambio de medicamento', 'Adición de medicamento', 'Suspensión de medicamento', 'Cambio de horario']
      },
      {
        id: 'razon-ajuste',
        type: FIELD_TYPES.SELECT,
        label: 'Razón del Ajuste',
        category: 'plan-seguimiento-psiq',
        required: false,
        options: ['Falta de eficacia', 'Efectos secundarios', 'Mejoría clínica', 'Optimización', 'Simplificación', 'Costo']
      },
      {
        id: 'descripcion-ajustes',
        type: FIELD_TYPES.TEXTAREA,
        label: 'Descripción de Ajustes Realizados',
        category: 'plan-seguimiento-psiq',
        required: false,
        placeholder: 'Describir específicamente los ajustes realizados',
        rows: 2
      },
      {
        id: 'parametros-monitorear',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Parámetros a Monitorear',
        category: 'plan-seguimiento-psiq',
        required: true,
        options: ['Efectividad clínica', 'Efectos secundarios', 'Adherencia', 'Niveles séricos', 'Función hepática', 'Función renal', 'Peso', 'Presión arterial', 'Hemograma']
      },
      {
        id: 'frecuencia-monitoreo',
        type: FIELD_TYPES.SELECT,
        label: 'Frecuencia de Monitoreo',
        category: 'plan-seguimiento-psiq',
        required: true,
        options: ['Semanal', 'Quincenal', 'Mensual', 'Bimensual', 'Trimestral', 'Según necesidad']
      },
      {
        id: 'laboratorios-requeridos',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Laboratorios Requeridos',
        category: 'plan-seguimiento-psiq',
        required: false,
        options: ['Hemograma completo', 'Química sanguínea', 'Perfil hepático', 'Perfil tiroideo', 'Niveles de medicamento', 'Ninguno']
      },
      {
        id: 'tiempo-proxima-cita',
        type: FIELD_TYPES.SELECT,
        label: 'Tiempo para Próxima Cita',
        category: 'plan-seguimiento-psiq',
        required: true,
        options: ['1 semana', '2 semanas', '3 semanas', '4 semanas', '6 semanas', '8 semanas', '3 meses', '6 meses', 'Según necesidad']
      },
      {
        id: 'tipo-proxima-cita',
        type: FIELD_TYPES.SELECT,
        label: 'Tipo de Próxima Cita',
        category: 'plan-seguimiento-psiq',
        required: true,
        options: ['Seguimiento rutinario', 'Evaluación de respuesta', 'Monitoreo de efectos secundarios', 'Ajuste de medicación', 'Urgente']
      },
      {
        id: 'objetivos-proxima-cita',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Objetivos de la Próxima Cita',
        category: 'plan-seguimiento-psiq',
        required: true,
        options: ['Evaluar respuesta', 'Monitorear efectos secundarios', 'Revisar adherencia', 'Ajustar dosis', 'Evaluar funcionamiento', 'Resultados de laboratorio']
      },
      {
        id: 'notas-especiales-cita',
        type: FIELD_TYPES.TEXT,
        label: 'Notas Especiales para la Próxima Consulta',
        category: 'plan-seguimiento-psiq',
        required: false,
        placeholder: 'Notas especiales para recordar en la próxima consulta'
      }
    ]
  };

  formTemplates.set(primeraVezPsicologia.id, primeraVezPsicologia);
  formTemplates.set(primeraVezPsiquiatria.id, primeraVezPsiquiatria);
  formTemplates.set(subsecuentePsicologia.id, subsecuentePsicologia);
  formTemplates.set(altaPsiquiatria.id, altaPsiquiatria);
  formTemplates.set(eventoEntreConsultas.id, eventoEntreConsultas);
  formTemplates.set(subsecuentePsiquiatria.id, subsecuentePsiquiatria);
};

initPredefinedTemplates();

// ==================== TEMPLATE MANAGEMENT ====================

// Obtener todos los templates
router.get('/templates', (req, res) => {
  try {
    const { category, search } = req.query;
    let templates = Array.from(formTemplates.values());

    // Filtros
    if (category && category !== 'all') {
      templates = templates.filter(template => template.category === category);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm)
      );
    }

    // Ordenar por fecha de creación
    templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: templates,
      total: templates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo templates',
      error: error.message
    });
  }
});

// Obtener template específico
router.get('/templates/:id', (req, res) => {
  try {
    const templateId = req.params.id;

    if (!formTemplates.has(templateId)) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    const template = formTemplates.get(templateId);
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo template',
      error: error.message
    });
  }
});

// Crear nuevo template
router.post('/templates', (req, res) => {
  try {
    const { name, description, category, fields } = req.body;

    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate = {
      id: templateId,
      name,
      description,
      category: category || 'custom',
      isSystem: false,
      createdAt: new Date().toISOString(),
      fields: fields.map((field, index) => ({
        ...field,
        id: field.id || `field_${index + 1}`,
        order: field.order || index + 1
      }))
    };

    formTemplates.set(templateId, newTemplate);

    res.status(201).json({
      success: true,
      message: 'Template creado exitosamente',
      data: newTemplate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando template',
      error: error.message
    });
  }
});

// Actualizar template
router.put('/templates/:id', (req, res) => {
  try {
    const templateId = req.params.id;
    const updates = req.body;

    if (!formTemplates.has(templateId)) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    const template = formTemplates.get(templateId);

    // No permitir editar templates del sistema
    if (template.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden editar templates del sistema'
      });
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      id: templateId, // Preservar ID
      isSystem: template.isSystem, // Preservar flag de sistema
      updatedAt: new Date().toISOString()
    };

    formTemplates.set(templateId, updatedTemplate);

    res.json({
      success: true,
      message: 'Template actualizado exitosamente',
      data: updatedTemplate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error actualizando template',
      error: error.message
    });
  }
});

// Eliminar template
router.delete('/templates/:id', (req, res) => {
  try {
    const templateId = req.params.id;

    if (!formTemplates.has(templateId)) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    const template = formTemplates.get(templateId);

    // No permitir eliminar templates del sistema
    if (template.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden eliminar templates del sistema'
      });
    }

    formTemplates.delete(templateId);

    res.json({
      success: true,
      message: 'Template eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error eliminando template',
      error: error.message
    });
  }
});

// ==================== FORM INSTANCES ====================

// Crear instancia de formulario para un paciente
router.post('/forms', (req, res) => {
  try {
    const { templateId, patientId, consultationId, title } = req.body;

    if (!formTemplates.has(templateId)) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    const template = formTemplates.get(templateId);
    const formId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const formInstance = {
      id: formId,
      templateId,
      patientId,
      consultationId: consultationId || null,
      title: title || template.name,
      status: 'draft',
      createdAt: new Date().toISOString(),
      fields: template.fields.map(field => ({
        ...field,
        value: field.defaultValue || null,
        touched: false
      }))
    };

    consultationForms.set(formId, formInstance);

    res.status(201).json({
      success: true,
      message: 'Formulario creado exitosamente',
      data: formInstance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando formulario',
      error: error.message
    });
  }
});

// Obtener formularios de un paciente
router.get('/forms/patient/:patientId', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { status, templateId } = req.query;

    let forms = Array.from(consultationForms.values()).filter(form => form.patientId === patientId);

    // Filtros
    if (status && status !== 'all') {
      forms = forms.filter(form => form.status === status);
    }

    if (templateId) {
      forms = forms.filter(form => form.templateId === templateId);
    }

    // Agregar información del template
    forms = forms.map(form => ({
      ...form,
      template: formTemplates.get(form.templateId)
    }));

    // Ordenar por fecha de creación
    forms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: forms,
      total: forms.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo formularios del paciente',
      error: error.message
    });
  }
});

// Obtener formulario específico
router.get('/forms/:id', (req, res) => {
  try {
    const formId = req.params.id;

    if (!consultationForms.has(formId)) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    const form = consultationForms.get(formId);
    const template = formTemplates.get(form.templateId);

    res.json({
      success: true,
      data: {
        ...form,
        template
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo formulario',
      error: error.message
    });
  }
});

// Actualizar datos del formulario
router.put('/forms/:id', (req, res) => {
  try {
    const formId = req.params.id;
    const { fieldId, value, autoSave } = req.body;

    if (!consultationForms.has(formId)) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    const form = consultationForms.get(formId);

    // Actualizar campo específico
    if (fieldId) {
      const fieldIndex = form.fields.findIndex(field => field.id === fieldId);
      if (fieldIndex !== -1) {
        form.fields[fieldIndex].value = value;
        form.fields[fieldIndex].touched = true;
      }
    }

    // Recalcular campos calculados
    calculateDependentFields(form);

    form.updatedAt = new Date().toISOString();
    if (!autoSave) {
      form.status = 'in_progress';
    }

    consultationForms.set(formId, form);

    res.json({
      success: true,
      message: 'Formulario actualizado exitosamente',
      data: form
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error actualizando formulario',
      error: error.message
    });
  }
});

// Completar formulario
router.post('/forms/:id/complete', (req, res) => {
  try {
    const formId = req.params.id;

    if (!consultationForms.has(formId)) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    const form = consultationForms.get(formId);

    // Validar campos requeridos
    const missingFields = form.fields.filter(field => 
      field.required && (field.value === null || field.value === undefined || field.value === '')
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
        missingFields: missingFields.map(field => ({ id: field.id, label: field.label }))
      });
    }

    // Calcular puntuaciones finales
    calculateDependentFields(form);

    form.status = 'completed';
    form.completedAt = new Date().toISOString();

    // Generar resumen automático
    form.summary = generateFormSummary(form);

    consultationForms.set(formId, form);

    // Crear entrada en submissions para historial
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const submission = {
      id: submissionId,
      formId,
      patientId: form.patientId,
      templateId: form.templateId,
      submittedAt: new Date().toISOString(),
      data: form.fields,
      summary: form.summary
    };

    formSubmissions.set(submissionId, submission);

    res.json({
      success: true,
      message: 'Formulario completado exitosamente',
      data: form
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completando formulario',
      error: error.message
    });
  }
});

// ==================== REPORTING & ANALYTICS ====================

// Obtener estadísticas de formularios
router.get('/analytics/stats', (req, res) => {
  try {
    const { startDate, endDate, templateId } = req.query;
    let forms = Array.from(consultationForms.values());
    let submissions = Array.from(formSubmissions.values());

    // Filtros de fecha
    if (startDate) {
      const start = new Date(startDate);
      forms = forms.filter(form => new Date(form.createdAt) >= start);
      submissions = submissions.filter(sub => new Date(sub.submittedAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      forms = forms.filter(form => new Date(form.createdAt) <= end);
      submissions = submissions.filter(sub => new Date(sub.submittedAt) <= end);
    }

    if (templateId) {
      forms = forms.filter(form => form.templateId === templateId);
      submissions = submissions.filter(sub => sub.templateId === templateId);
    }

    const stats = {
      totalForms: forms.length,
      completedForms: forms.filter(f => f.status === 'completed').length,
      inProgressForms: forms.filter(f => f.status === 'in_progress').length,
      draftForms: forms.filter(f => f.status === 'draft').length,
      completionRate: forms.length > 0 ? Math.round((submissions.length / forms.length) * 100) : 0,
      averageCompletionTime: calculateAverageCompletionTime(forms),
      mostUsedTemplates: getMostUsedTemplates(forms),
      dailySubmissions: getDailySubmissions(submissions)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
});

// Obtener respuestas agregadas por template
router.get('/analytics/aggregated/:templateId', (req, res) => {
  try {
    const templateId = req.params.templateId;
    const submissions = Array.from(formSubmissions.values())
      .filter(sub => sub.templateId === templateId);

    if (submissions.length === 0) {
      return res.json({
        success: true,
        data: { totalSubmissions: 0, aggregatedData: {} }
      });
    }

    const template = formTemplates.get(templateId);
    const aggregatedData = {};

    // Agregar datos por campo
    template.fields.forEach(field => {
      const values = submissions
        .map(sub => sub.data.find(d => d.id === field.id)?.value)
        .filter(value => value !== null && value !== undefined);

      switch (field.type) {
        case FIELD_TYPES.SLIDER:
        case FIELD_TYPES.RATING:
        case FIELD_TYPES.NUMBER:
          aggregatedData[field.id] = {
            type: 'numeric',
            average: values.length > 0 ? values.reduce((sum, val) => sum + Number(val), 0) / values.length : 0,
            min: values.length > 0 ? Math.min(...values.map(Number)) : 0,
            max: values.length > 0 ? Math.max(...values.map(Number)) : 0,
            count: values.length
          };
          break;

        case FIELD_TYPES.DROPDOWN:
        case FIELD_TYPES.RADIO:
          const frequency = {};
          values.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
          });
          aggregatedData[field.id] = {
            type: 'categorical',
            frequency,
            mostCommon: Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b, ''),
            count: values.length
          };
          break;

        case FIELD_TYPES.MULTI_SELECT:
          const allOptions = {};
          values.forEach(value => {
            if (Array.isArray(value)) {
              value.forEach(option => {
                allOptions[option] = (allOptions[option] || 0) + 1;
              });
            }
          });
          aggregatedData[field.id] = {
            type: 'multi_categorical',
            frequency: allOptions,
            count: values.length
          };
          break;
      }
    });

    res.json({
      success: true,
      data: {
        totalSubmissions: submissions.length,
        aggregatedData,
        template: template
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos agregados',
      error: error.message
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

function calculateDependentFields(form) {
  const calculatedFields = form.fields.filter(field => field.type === FIELD_TYPES.CALCULATED_FIELD);
  
  calculatedFields.forEach(calcField => {
    const calculation = calcField.calculation;
    let result = 0;

    switch (calculation.type) {
      case 'sum':
        result = calculation.fields.reduce((sum, fieldPath) => {
          const value = getFieldValue(form, fieldPath);
          return sum + (Number(value) || 0);
        }, 0);
        break;

      case 'average':
        const values = calculation.fields.map(fieldPath => Number(getFieldValue(form, fieldPath)) || 0);
        result = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        break;

      case 'risk_assessment':
        result = calculateRiskScore(form, calculation);
        break;
    }

    // Actualizar valor del campo calculado
    const fieldIndex = form.fields.findIndex(field => field.id === calcField.id);
    if (fieldIndex !== -1) {
      form.fields[fieldIndex].value = result;
      form.fields[fieldIndex].calculatedAt = new Date().toISOString();
    }
  });
}

function getFieldValue(form, fieldPath) {
  const parts = fieldPath.split('.');
  const fieldId = parts[0];
  const subfield = parts[1];

  const field = form.fields.find(f => f.id === fieldId);
  if (!field) return null;

  if (subfield && field.value && typeof field.value === 'object') {
    return field.value[subfield];
  }

  return field.value;
}

function calculateRiskScore(form, calculation) {
  let score = 0;

  // Ejemplo de algoritmo de riesgo suicida
  if (calculation.algorithm === 'suicide_risk') {
    const thoughts = getFieldValue(form, 'suicidal_thoughts');
    const plan = getFieldValue(form, 'suicide_plan');
    const means = getFieldValue(form, 'suicide_means');
    const protectiveFactors = getFieldValue(form, 'protective_factors') || [];

    // Puntuación por pensamientos suicidas
    const thoughtsScore = {
      'never': 0,
      'rarely': 2,
      'sometimes': 4,
      'often': 6,
      'always': 8
    };
    score += thoughtsScore[thoughts] || 0;

    // Puntuación por plan
    if (plan === 'yes') score += 2;

    // Puntuación por medios
    if (means === 'yes') score += 2;

    // Reducir por factores protectores
    const protectionReduction = Math.min(protectiveFactors.length * 0.5, 3);
    score = Math.max(0, score - protectionReduction);
  }

  return Math.round(score);
}

function generateFormSummary(form) {
  const summary = {
    completedAt: new Date().toISOString(),
    totalFields: form.fields.length,
    completedFields: form.fields.filter(f => f.value !== null && f.value !== undefined && f.value !== '').length,
    keyFindings: [],
    scores: {},
    recommendations: []
  };

  // Extraer hallazgos clave y puntuaciones
  form.fields.forEach(field => {
    if (field.type === FIELD_TYPES.CALCULATED_FIELD && field.value !== null) {
      summary.scores[field.id] = {
        label: field.label,
        value: field.value,
        interpretation: getInterpretation(field, field.value)
      };
    }

    // Identificar respuestas de alto riesgo o importancia
    if (field.required && field.value) {
      if (field.type === FIELD_TYPES.SLIDER || field.type === FIELD_TYPES.RATING) {
        const numValue = Number(field.value);
        if (numValue >= 8) {
          summary.keyFindings.push(`${field.label}: Puntuación alta (${numValue}/10)`);
        }
      }
    }
  });

  return summary;
}

function getInterpretation(field, value) {
  if (field.interpretation && field.interpretation.ranges) {
    const range = field.interpretation.ranges.find(r => value >= r.min && value <= r.max);
    return range ? range.label : 'Sin interpretación disponible';
  }
  return null;
}

function calculateAverageCompletionTime(forms) {
  const completedForms = forms.filter(f => f.status === 'completed' && f.completedAt);
  if (completedForms.length === 0) return 0;

  const totalTime = completedForms.reduce((sum, form) => {
    const created = new Date(form.createdAt);
    const completed = new Date(form.completedAt);
    return sum + (completed.getTime() - created.getTime());
  }, 0);

  return Math.round(totalTime / completedForms.length / (1000 * 60)); // en minutos
}

function getMostUsedTemplates(forms) {
  const templateCount = {};
  forms.forEach(form => {
    templateCount[form.templateId] = (templateCount[form.templateId] || 0) + 1;
  });

  return Object.entries(templateCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([templateId, count]) => ({
      templateId,
      templateName: formTemplates.get(templateId)?.name || 'Template desconocido',
      count
    }));
}

function getDailySubmissions(submissions) {
  const dailyCount = {};
  submissions.forEach(sub => {
    const date = new Date(sub.submittedAt).toISOString().split('T')[0];
    dailyCount[date] = (dailyCount[date] || 0) + 1;
  });

  return Object.entries(dailyCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

// Obtener tipos de campos disponibles
router.get('/field-types', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(FIELD_TYPES).map(([key, value]) => ({
      key,
      value,
      label: key.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))
  });
});

module.exports = router;