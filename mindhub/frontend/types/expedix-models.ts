
interface Diagnosis {
  id: string;
  code?: string;
  description: string;
  category?: string;
  system?: 'CIE-10' | 'DSM-5TR' | 'CIE-11' | 'custom';
  isPrimary?: boolean;
  notes?: string;
}

export interface MentalExamDetailed {
  apariencia: {
    aspecto_general: "Adecuado" | "Descuidado" | "Desaliñado" | "Extravagante" | "Raro";
    higiene: "Buena" | "Regular" | "Mala";
    vestimenta:
    | "Apropiada para contexto"
    | "Inapropiada para clima"
    | "Inapropiada para situación"
    | "Descuidada"
    | "Extravagante"
    | "Desaliñada";
    edad_aparente: "Aparenta edad cronológica" | "Aparenta mayor edad" | "Aparenta menor edad";
    complexion: "Normal" | "Delgado" | "Sobrepeso" | "Obesidad" | "Caquéctico";
    facies: "Normal" | "Ansiosa" | "Deprimida" | "Inexpresiva" | "Dolorosa" | "Eufórica";
    caracteristicas_distintivas: string;
  };

  conducta: {
    nivel_psicomotor:
    | "Normal"
    | "Aumentada (inquietud)"
    | "Aumentada (agitación)"
    | "Disminuida (enlentecimiento)"
    | "Disminuida (estupor)"
    | "Catatonía";
    contacto_visual: "Adecuado" | "Evitativo" | "Fijo/penetrante" | "Ausente" | "Variable";
    postura: "Normal / Relajada" | "Tensa" | "Encorvada" | "Rígida" | "Rara";
    marcha: "Normal" | "Lenta" | "Rápida" | "Atáxica" | "Parkinsoniana" | "No evaluada";
    movimientos_anormales:
    | "Ninguno"
    | "Temblor"
    | "Discinesias"
    | "Tics"
    | "Manierismos"
    | "Estereotipias"
    | "Acatisia"
    | "Distonía";
    cooperacion_entrevista: "Cooperador" | "Parcialmente cooperador" | "No cooperador" | "Hostil" | "Oposicionista";
  };

  actitud: {
    actitud_general:
    | "Colaboradora"
    | "Amable"
    | "Suspicaz"
    | "Irritable / Hostil"
    | "Indiferente"
    | "Defensiva"
    | "Seductora"
    | "Manipuladora"
    | "Demandante"
    | "Evasiva";
    rapport: "Fácil de establecer" | "Difícil de establecer" | "No se logró establecer / no valorable";
  };

  habla: {
    velocidad: "Normal" | "Rápida" | "Lenta" | "Presionada (taquilalia)" | "Bradilalia";
    volumen: "Normal" | "Alto" | "Bajo" | "Susurrante" | "Variable";
    tono: "Normal" | "Monótono" | "Variable" | "Elevado";
    articulacion: "Clara" | "Disártrica" | "Farfullante" | "Musitante";
    cantidad: "Normal" | "Verborreico (logorrea)" | "Lacónico" | "Mutismo";
    latencia_respuesta: "Normal" | "Aumentada" | "Disminuida";
    prosodia: "Normal" | "Aprosódica" | "Disprosódica";
  };

  afecto: {
    tipo:
    | "Eutímico"
    | "Ansioso"
    | "Deprimido"
    | "Irritable"
    | "Eufórico"
    | "Disfórico"
    | "Apático"
    | "Lábil"
    | "Aplanado"
    | "Embotado"
    | "Inapropiado";
    rango_afectivo: "Amplio" | "Normal" | "Restringido" | "Constreñido" | "Aplanado";
    intensidad: "Normal" | "Aumentada" | "Disminuida";
    reactividad: "Reactivo" | "Poco reactivo" | "No reactivo";
    congruencia: "Congruente" | "Incongruente";
    estabilidad: "Estable" | "Lábil";
  };

  animo: {
    estado_animo: string;
    nivel: number; // 0-10 si quieres
    concordancia_animo_afecto: "Concordante" | "Discordante";
  };

  pensamiento_proceso: {
    curso_pensamiento:
    | "Lógico y coherente"
    | "Circunstancial"
    | "Tangencial"
    | "Laxo (asociaciones laxas)"
    | "Fuga de ideas"
    | "Perseverativo"
    | "Bloqueo del pensamiento"
    | "Incoherente"
    | "Disgregado";
    velocidad_pensamiento: "Normal" | "Acelerado (taquipsiquia)" | "Enlentecido (bradipsiquia)";
    contenido_discurso: "Apropiado y relevante" | "Pobre" | "Vago" | "Perseverativo" | "Tangencial";
  };

  pensamiento_contenido: {
    ideas_muerte: "Ausentes" | "Presentes pasivas" | "Presentes activas";
    ideacion_suicida:
    | "Ausente"
    | "Pasiva sin plan"
    | "Activa sin plan"
    | "Activa con plan sin intención"
    | "Activa con plan e intención";
    plan_suicida: string;
    ideacion_homicida: "Ausente" | "Presente sin plan" | "Presente con plan";
    delirios: string[];
    caracteristicas_delirios: "No aplica" | "Sistematizados" | "No sistematizados" | "Encapsulados" | "Expansivos";
    ideas_sobrevaloradas: "Ausentes" | "Presentes";
    obsesiones: "Ausentes" | "Presentes";
    tipo_obsesiones: string[];
    compulsiones: "Ausentes" | "Presentes";
    tipo_compulsiones: string[];
    fobias: "Ausentes" | "Presentes";
    preocupaciones_excesivas: "Ausentes" | "Presentes";
  };

  percepcion: {
    alucinaciones_auditivas:
    | "Ausentes"
    | "Presentes - voces comentadoras"
    | "Presentes - voces comandatorias"
    | "Presentes - voces dialogantes"
    | "Presentes - otros sonidos"
    | "No evaluado";
    alucinaciones_auditivas_caracteristicas: string;

    alucinaciones_visuales: "Ausentes" | "Presentes - simples" | "Presentes - complejas" | "No evaluado";
    alucinaciones_visuales_caracteristicas: string;

    alucinaciones_tactiles: "Ausentes" | "Presentes" | "No evaluado";
    alucinaciones_tactiles_caracteristicas: string;

    alucinaciones_olfatorias: "Ausentes" | "Presentes" | "No evaluado";
    alucinaciones_olfatorias_caracteristicas: string;

    alucinaciones_gustativas: "Ausentes" | "Presentes" | "No evaluado";
    alucinaciones_gustativas_caracteristicas: string;

    ilusiones: "Ausentes" | "Presentes" | "No evaluado";
    ilusiones_caracteristicas: string;

    despersonalizacion: "Ausente" | "Presente" | "No evaluado";
    despersonalizacion_caracteristicas: string;

    desrealizacion: "Ausente" | "Presente" | "No evaluado";
    desrealizacion_caracteristicas: string;
  };

  cognicion: {
    nivel_conciencia: "Alerta" | "Somnoliento" | "Estuporoso" | "Comatoso";
    orientacion_persona: "Orientado" | "Desorientado" | "No evaluado";
    orientacion_lugar: "Orientado" | "Desorientado" | "No evaluado";
    orientacion_tiempo: "Orientado" | "Desorientado" | "No evaluado";
    orientacion_situacion: "Orientado" | "Desorientado" | "No evaluado";
    atencion: "Normal" | "Hipoprosexia" | "Hiperprosexia" | "Distraibilidad";
    concentracion: "Adecuada" | "Disminuida";
    memoria_inmediata: "Conservada" | "Alterada" | "No evaluado";
    memoria_reciente: "Conservada" | "Alterada" | "No evaluado";
    memoria_remota: "Conservada" | "Alterada" | "No evaluado";
    capacidad_abstracta: "Normal" | "Concreta" | "Alterada" | "No evaluado";
    calculo: "Conservado" | "Alterado" | "No evaluado";
    inteligencia_clinica_estimada:
    | "Superior"
    | "Normal"
    | "Limítrofe"
    | "Deficiente leve"
    | "Deficiente moderada"
    | "Deficiente severa"
    | "No evaluado";
    funciones_ejecutivas: "Sin alteraciones aparentes" | "Con alteraciones aparentes" | "No evaluado";
  };

  insight_juicio: {
    insight: "Completo" | "Parcial" | "Ausente (nulo)" | "No evaluado";
    grado: string;
    juicio: "Conservado" | "Parcialmente alterado" | "Severamente alterado" | "No evaluado";
    juicio_social: "Adecuado" | "Inadecuado" | "No evaluado";
    control_impulsos: "Adecuado" | "Parcialmente alterado" | "Severamente alterado" | "No evaluado";
  };

  funcionalidad: {
    nivel_global: number; // por ej 0-100
    laboral_escolar: "Sin afectación" | "Afectación leve" | "Afectación moderada" | "Afectación severa" | "Incapacitante" | "No evaluada";
    funcionalidad_social: "Sin afectación" | "Afectación leve" | "Afectación moderada" | "Afectación severa" | "Aislamiento completo" | "No evaluada";
    autocuidado:
    | "Independiente"
    | "Requiere supervisión ocasional"
    | "Requiere supervisión constante"
    | "Requiere asistencia parcial"
    | "Dependiente total"
    | "No evaluado";
  };
};

export interface SintomalogiaActual {
  motivo_consulta: string;
  queja_principal: string;
  sintoma_principal: string;
  historia_sintomas_actuales: string;
  duracion_sintomas: string;
  factores_precipitantes: string;
  referido_por: "Autoreferencia" | "Médico" | "Psicologo" | "Familiar" | "Otro Profesional";
  nombre_refiere: string;
  padecimiento_actual: string;
  curso_enfermedad: "Agudo" | "Subagudo" | "Crónico" | "Episódico" | "Progresivo";
  sintomas_cardinales: string;
  impacto_fucional: "Nulo" | "Mínimo" | "Leve" | "Moderado" | "Severo" | "Incapacitante";
  espera_terapia: string;
  terapia_antes: "Sí" | "No";
  terapia_funciono: string;
  descripcion_problema: string;
  situaciones_problema: string;
  pensamientos_asociados: string;
  emociones_asociadas: string;
  conductas_asociadas: string;
  consecuencias: string;
  intentos_previos_solucion: string;
  impactos_vida: "Personal" | "Hogar" | "Familia" | "Relaciones interpersonales" | "Escuela o trabajo";
  sueno: "Regular" | "Irregular" | "Bueno" | "Insomnio" | "Invertido";
  apetito: "Bueno" | "Bajo" | "Alto" | "Problematico";
  energia: "Buena" | "Baja" | "Alta" | "Irregular";
  nivel_funcionamiento: string;
};

export interface HistoriaPersonal {
  desarrollo_temprano: string;
  relacion_padres: string;
  relacion_hermanos: string;
  experiencias_escolares: string;
  historia_relacion_pareja: string;
  patron_relaciones: string;
  experiencias_traumaticas: string;
  fortalezas_personales: string;
  valores_importantes: string;
  metas_vida: string;
}

export interface HistoriaRiesgo {
  ideacion_suicida_previa: "Si" | "No" | "Desconocido";
  intentos_suicidio_previos: "Si" | "No";
  intentos_suicidio_detalle: string;
  autolesiones_no_suicidas: "Si" | "No";
  autolesiones_no_suicidas_detalle: string;
  ideacion_homicida_previa: "Si" | "No";
  ideacion_homicida_detalle: string;
  conductas_violentas_previas: "Si" | "No";
  conductas_violentas_detalle: string;
  acceso_armas: "Si" | "No";
  acceso_armas_detalle: string;
  acceso_medicamentos_cantidad: "Si" | "No";
  acceso_medicamentos_cantidad_detalle: string;
  acceso_medios_letales: "Si" | "No";
  acceso_medios_letales_detalle: string;
  otro_factor_riesgo: "Si" | "No";
  otro_factor_riesgo_detalle: string;
  conducta_agresiva: "Si" | "No";
  conducta_agresiva_detalle: string;
  nivel_riesgo: "Bajo" | "Moderado" | "Alto" | "NA";
  plan_seguridad: string;
  eventos_precipitantes: string;
  uso_sustancias_recienta: "Si" | "No";
  uso_sustancias_recienta_detalle: string;
  suspension_medicamentos: "Si" | "No";
  suspension_medicamentos_detalle: string;
  estresores_identificados: "Si" | "No";
  estresores_identificados_detalle: string;
  perdidas_recientes: "Si" | "No";
  perdidas_recientes_detalle: string;
}

export interface AntecedentesPsiquiatricos {
  diagnosticos_previos: string[];
  diagnosticos_previos_detalle: string;
  hospitalizaciones_previas: "Si" | "No";
  motivos_hospitalizacion: string;
  tratamientos_previos: "Si" | "No";
  tratamientos_previos_detalle: {
    medicamento: string;
    dosis: string;
    durecion: string;
    respuesta: string;
    motivo_suspension: string;
  },
  psiquiatra_tratante: string;
  psicoterapias_previas: "Si" | "No";
  psicoterapias_previas_detalle: {
    tipo: string;
    duracion: string;
    terapeuta: string;
    resultado: string;
  },
  tec: "Si" | "No";
  tec_detalle: string;
  emt: "Si" | "No";
  emt_detalle: string;
  otros_tratamientos_somaticos: string;
};

export interface UsoSustancias {
  tabaco: "Nunca" | "Exfumador" | "Actual";
  alcohol: "Ocasional" | "Social" | "Abuso" | "Dependencia";
  cannabis: "Si" | "No";
  cannabis_frecuencia: "Previo" | "Ocasional" | "Abuso" | "Dependencia";
  cocaina: "Si" | "No";
  cocaina_frecuencia: "Previo" | "Ocasional" | "Abuso" | "Dependencia";
  opioides: "Si" | "No";
  opioides_frecuencia: "Previo" | "Ocasional" | "Abuso" | "Dependencia";
  benzodiacepinas: "Si" | "No";
  benzodiacepinas_frecuencia: "Previo" | "Ocasional" | "Abuso" | "Dependencia";
  otras_sustancias: "Si" | "No";
  otras_sustancias_detalle: string;
  tratamientos_previos_accidente: "Si" | "No";
  tratamientos_previos_accidente_detalle: string;
  internamientos_previos_sustancias: "Si" | "No";
  internamientos_previos_sustancias_detalle: string;
  ultima_intoxicacion: string;
  inicio_abstinencia: string;
}

export interface AntecedentesMedicos {
  enfermedades_cronicas: (
    | "Diabetes"
    | "Hipertensión"
    | "Enfermedad cardíaca"
    | "Enfermedad pulmonar"
    | "Enfermedad renal"
    | "Enfermedad hepática"
    | "Otra"
  )[];
  cirugias_previas: "Si" | "No";
  cirugias_previas_detalle: [{
    precedimiento: string;
    fecha: string;
    hospital: string;
  }];
  hospitalizaciones_medicas: string;
  alergias_medicamentos: "Si" | "No";
  alergias_medicamentos_detalle: [{
    medicamento: string;
    reaccion: string;
  }];
  otras_alergias: string;
  medicamentos_actuales: [{
    medicamento: string;
    dosis: string;
    frecuencia: string;
    indicacion: string;
  }];
  condiciones_neurologicas: ("Epilepsia" | "EVC" | "Alzheimer" | "Parkinson" | "Otro")[];
  enfermedades_endocrinas: ("Hipotiroidismo" | "Hipertiroidismo" | "SOP" | "Addison")[];
  embarazo_actual: "Si" | "No" | "NA";
  lactancia: "Si" | "No" | "NA";
  ultima_menstruacion: string;
  metodo_anticonceptivo: "Si" | "No" | "NA";
  metodo_anticonceptivo_detalle: string;
}

export interface AntecedentesHeredofamiliares {
  antecedentes_psicologicos: [{
    parentesco: string;
    diagnostico: string;
    tratamiento: string;
    suicidio: "Si" | "No";
  }];
  derpesion: [{
    parentesco: string;
    diagnostico: string;
    tratamiento: string;
    suicidio: "Si" | "No";
  }];
  trastorno_bipolar: [{
    parentesco: string;
    diagnostico: string;
    tratamiento: string;
    suicidio: "Si" | "No";
  }];
  esquizofrenia: [{
    parentesco: string;
    diagnostico: string;
    tratamiento: string;
    suicidio: "Si" | "No";
  }];
  ansiedad: [{
    parentesco: string;
    diagnostico: string;
    tratamiento: string;
    suicidio: "Si" | "No";
  }];
  uso_sustancias: [{
    parentesco: string;
    diagnostico: string;
    tratamiento: string;
    suicidio: "Si" | "No";
  }];
  suicidio: [{
    parentesco: string;
    diagnostico: string;
    tratamiento: string;
    suicidio: "Si" | "No";
  }];
  tdah: [{
    parentesco: string;
    diagnostico: string;
    tratamiento: string;
    suicidio: "Si" | "No";
  }];
  demencia: [{
    parentesco: string;
    diagnostico: string;
    tratamiento: string;
    suicidio: "Si" | "No";
  }];
  enfermedades_relevantes: string;
}

export interface HistoriaPersonalSocial {
  embarazo_parto: string;
  desarrollo_psicomotor: "Normal" | "Retraso" | "Desconocido";
  desarrollo_psicomotor_detalle: string;
  historia_escolar: string;
  problemas_aprendizaje: "Si" | "No" | "Desconocido";
  problemas_aprendizaje_detalle: string;
  historia_laboral: string;
  situacion_laboral_actual: string;
  historia_relaciones: string;
  relacion_actual: string;
  hijos: [{
    pareja: string;
    sexo: string;
    edad: number;
  }];
  convivencia_actual: string;
  apoyo_social: number;
  situacion_economica: "Mala" | "Precaria" | "Buena" | "Excelente";
  situacion_legal: "Si" | "No";
  situacion_legal_detalle: string;
  trauma_infantil: "Si" | "No";
  trauma_infantil_detalle: string;
  abuso_fisico: "Si" | "No" | "Prefiere no decir" | "No interrogado";
  abuso_sexual: "Si" | "No" | "Prefiere no decir" | "No interrogado";
  negligencia: "Si" | "No" | "Prefiere no decir" | "No interrogado";
  voilencia_domestica: "Si" | "No" | "Prefiere no decir" | "No interrogado";
  intereses_pasatiempos: string;
  fortalezas_paciente: string;
}

export interface PlanManejo {
  farmacoterapia_indicada: "Si" | "No" | "Dudoso";
  efectos_secundarios_reportados: string;
  estresores_actuales: string;
  plan_manejo_tratamiento: string;
  tiempo_seguimiento_meses: "Corto plazo" | "Largo plazo" | "Crónico" | "Indeterminado";
  psicoterapia_indicada: "Si" | "No" | "Dudoso";
  numero_sesiones_previstas: number;
  receta: string;
  enfoque_terapeutico_propuesto: string;
  objetivos_terapeuticos: string;
  tarea_proxima_sesion: string;
  tareas_asignadas_previamente: string;
  frecuencia_sesiones: "Semanal" | "Quincenal" | "Cada 3er Semana" | "Mensual" | "Irregular";
  duracion_estimada: string;
  necesidad_evaluacion_psiquiatrica: "Si" | "No";
  necesidad_pruebas_neuropsicologicas: "Si" | "No";
  tipo_pruebas_neuropsicologicas: "Cognitivas" | "Emocionales" | "Funcionales" | "Otra";
  contrato_terapeutico: "Si" | "No";
  referencias_interconsultas: string;
  psicoeducacion_proporcionada: string;
  temas_a_continuar: string;
  progreso: "Nulo" | "Mínimo" | "Regular" | "Bueno" | "Muy bueno";
  proxima_cita: string; // ISO date string
  cambios_plan_tratamiento: string;
}

export interface AnalisisConclusiones {
  analisis_clinico: string;
  diagnostico_principal: Diagnosis[];
  diagnosticos_secundarios: Diagnosis[];
  diagnostico_diferencial: string;
  formulacion_caso: string;
  notas_privadas: string;
  observaciones_progreso: string;
  estado_emocional: string;
  nivel_malestar_cierre: number; // 0-10
  cambios_ultima_visita: string;
  adherencia_tratamiento: "Nulo" | "Malo" | "Regular" | "Bueno" | "Muy bueno";
  adherencia_detalle: string;
  pronostico: "No se puede pronosticar aún" | "Reservado" | "Negativo" | "Dependiente de apego terapéutico" | "Dependiente de cese de factores de riesgo" | "Bueno a corto plazo" | "Bueno a largo plazo" | "Crónico controlable";
  pronostico_detalle: string;
}

export interface FormulacionCaso {
  hipotesis_trabajo: string;
  factores_predisponentes: string;
  factores_precipitantes: string;
  factores_mantenimiento: string;
  factores_protectores: string;
  diagnostico_presuntivo: string;
}

export interface EstadoInicio {
  estado_emocional: string;
  nivel_malestar: number; // 0-10
  eventos_ultima_sesion: string;
  trae_hoy: string;
}

export interface ContenidoSesion {
  temas_principales: string;
  tecnicas_utilizadas: string[];
  momentos_significativos: string;
  insights_paciente: string;
  emociones_trabajadas: string[];
  emociones_trabajadas_detalle: string;
  resistencias_observadas: string;
}

export interface TriajeInicial {
  motivo_urgencia: string;
  quien_trajo: string;
  viene_voluntario: "Si" | "No" | "Desconocido";
}

export interface OtrosCampos {
  documentos: string[];
  estudios_gabinete: {
    tac: { check: "Si" | "No"; detalle: string };
    rm: { check: "Si" | "No"; detalle: string };
    ultrasonido: { check: "Si" | "No"; detalle: string };
    poligrafia: { check: "Si" | "No"; detalle: string };
    polisomnografia: { check: "Si" | "No"; detalle: string };
    otro: { check: "Si" | "No"; detalle: string };
  }
  estudios_laboratorio: LabResult[];
  tipo_urgencia: "Sentida" | "Real" | "Intento de suicidio" | "Legal";
  evaluacion_intento_suicidio: {
    intencional: string;
    peligrosidad: string;
    impulsividad: string;
  };
  sectionModes?: Record<string, 'text' | 'canvas' | null>;
  sectionFreeText?: Record<string, string>;
  sectionCanvasData?: Record<string, string>;
}

export interface RedApoyo {
  redes_disponibles: "Si" | "No";
  redes_disponibles_detalle: string;
  contencion: "Si" | "No";
  contencion_detalle: string;
  contacto_emergencia: "Si" | "No";
  contacto_emergencia_detalle: string;
}

export interface IntrvencionCrisis {
  intervencion_crisis: string;
  contencion_verbal: string;
  medicacion_urgencia: string;
  restriccion_medios: "Si" | "No";
  restriccion_medios_detalle: string;
  llamada_familia: "Si" | "No";
  llamada_familia_detalle: string;
  psicoeducacion: string;
  responsable_egreso: {
    nombre: string;
    parentesco: string;
    telefono: string;
  }
  destino: "Alta" | "Hospitalización" | "Traslado otro hospital";
  justificacion: string;
  criterios_hospitalizacion: "Si" | "No";
  criterios_hospitalizacion_detalle: string;
  consentimiento_paciente: "Si" | "No";
  consentimiento_paciente_detalle: string;
  consentimiento_familiar: "Si" | "No";
  consentimiento_familiar_detalle: string;
  plan_egreso: string;
  instrucciones: string;
  numeros_emergencia: string[];
  indicaciones_escrito: string;
}



export interface ConsultationData {
  consultation_type: string;
  consultation_date: string;
  current_condition: string;
  diagnosis: string;
  diagnoses: Diagnosis[];
  evaluations: string[]; // Array of evaluation IDs
  vital_signs: {
    height: string;
    weight: string;
    blood_pressure: { systolic: string; diastolic: string };
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
    oxygenSaturation: string;
  };
  physical_examination: string;
  prescriptions: any[];
  treatment_plan: string;
  indications: any[];
  additional_instructions: string;
  next_appointment: { date: string; time: string };
  mental_exam: MentalExamDetailed;
  sintomatologia_actual: SintomalogiaActual;
  historia_personal: HistoriaPersonal;
  antecedentes_psiquiatricos: AntecedentesPsiquiatricos;
  historia_riesgo: HistoriaRiesgo;
  uso_sustancias: UsoSustancias;
  antecedentes_medicos: AntecedentesMedicos;
  antecedentes_heredofamiliares: AntecedentesHeredofamiliares;
  historia_personal_social: HistoriaPersonalSocial;
  plan_manejo: PlanManejo;
  analisis_conclusiones: AnalisisConclusiones;
  formulacion_caso: FormulacionCaso;
  estado_inicio: EstadoInicio;
  contenido_sesion: ContenidoSesion;
  otros_campos: OtrosCampos;
  red_apoyo: RedApoyo;
  intervencion_crisis: IntrvencionCrisis;
  // DB-level metadata blob (stores canvas, section modes, etc.)
  consultation_metadata?: Record<string, any>;
}

export interface Consultation {
  id: string;
  date: string;
  consultation_type: string;
  consultation_date: string;
  diagnosis: string;
  current_condition: string;
  next_appointment?: {
    date: string;
    time: string;
  };
  status: 'draft' | 'completed';
  created_at: string;
}

export type LabValueType = 'number' | 'text';

export interface LabResult {
  code: string;          // Ej: "Hb", "TSH", "TOX-10"
  name: string;          // Ej: "Hemoglobina"
  category: string;      // Ej: "BiometriaHematica"
  valueType: LabValueType;
  value: number | string | null;
  unit?: string;
  takenAt?: string;      // ISO date
  notes?: string;
}