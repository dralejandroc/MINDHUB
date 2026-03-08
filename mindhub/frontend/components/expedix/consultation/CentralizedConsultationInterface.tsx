'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { Card } from '@/components/ui/Card';
import { FullscreenHandwritingPad } from '@/components/inputs/FullscreenHandwritingPad';
import { Button } from '@/components/ui/Button';
// import { ChevronDownIcon, Icon } from 'lucide-react';
import {
  ArrowLeftIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalendarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  PrinterIcon,
  CogIcon,
  TrashIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { expedixApi, type Patient, type Prescription } from '@/lib/api/expedix-client';
import { useAuthenticatedFetch } from '@/lib/api/supabase-auth';
import { format, set, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import ConsultationPreviewDialog from './ConsultationPreviewDialog';
import { MentalExamFormatter, type MentalExamData } from '@/lib/utils/mental-exam-formatter';
import { PrintConfigManager, type PrintConfig } from '@/lib/utils/print-config';
import PrintConfigDialog from '../PrintConfigDialog';
import { PrescriptionCreator } from '../../prescriptions/PrescriptionCreator';
import { MedicationModal } from '../MedicationModal';
import { PrescriptionDesigner } from '../PrescriptionDesigner';
import DiagnosesSelector from './components/DiagnosesSelector';
import { IconButton } from '@/components/design-system/Button';
import Swal from 'sweetalert2';
import RecetasAddForm from './RecetasAddForm';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import { EvaluationsMultiSelect } from './EvaluationsMultiselect';
import toast from 'react-hot-toast';
import moment from 'moment';
import { ConsultationData, Consultation, MentalExamDetailed } from 'types/expedix-models';
import { supabase } from '@/lib/supabase/client';
import { DictationTextarea } from '@/components/inputs/DictationTextarea';
import {
  checkboxesDelirios, checkboxesTiposCompulsiones, checkboxesTiposObsesiones, optionsAlucinacionesAuditivas,
  optionsAlucinacionesOlfatorias, optionsAlucinacionesGustativas, optionsAlucinacionesTactiles, optionsAlucinacionesVisuales, optionsDespersonalizacion, optionsDesrealizacion, optionsIlusiones
} from './helpers';
import { MultiSelectChips } from '@/components/inputs/MultiSelectChipsProps';
import { cleanStructuredData, generateNarrativeHTML } from '@/lib/utils/narrative-engine';

interface CentralizedConsultationInterfaceProps {
  patient: Patient;
  consultationId?: string;
  onClose: () => void;
  onSave?: (data: any) => void;
}

interface ConsultationTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  fields_config: string[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  identifier: string;
}

type FieldKey =
  | 'mentalExam'
  | 'medications'
  | 'nextAppointment'
  | 'currentCondition'
  | 'physicalExamination'
  | 'diagnosis'
  | 'additionalInstructions'
  | 'vitalSigns'
  | 'evaluations'
  | 'labOrders'
  | 'labResults'
  // nuevas secciones
  | 'sintomatologiaActual'
  | 'antecedentesPsiquiatricos'
  | 'historiaRiesgo'
  | 'usoSustancias'
  | 'antecedentesMedicos'
  | 'antecedentesHeredofamiliares'
  | 'historiaPersonalSocial'
  | 'estadoInicio'
  | 'contenidoSesion'
  | 'planManejo'
  | 'analisisConclusiones'
  | 'formulacionCaso'
  | 'redApoyo'
  | 'intervencionCrisis'
  | 'resultadosGabinete'
  | 'labOrdersRequest';

type SectionMode = 'text' | 'canvas' | null;

const resolveTemplateBySelectValue = (
  templatesArr: ConsultationTemplate[],
  selectedValue: string
): ConsultationTemplate | null => {
  if (!Array.isArray(templatesArr) || templatesArr.length === 0) return null;
  if (!selectedValue) return null;

  // Regla:
  // - custom => match por identifier
  // - no custom => match por template_type
  return (
    templatesArr.find(t => t.template_type === 'custom' && t.identifier === selectedValue) ||
    templatesArr.find(t => t.template_type !== 'custom' && t.template_type === selectedValue) ||
    null
  );
};

const defaultConsultationTypes = [
  { value: 'general', label: 'Consulta General' },
  { value: 'initial', label: 'Primera Consulta' },
  { value: 'followup', label: 'Consulta de Seguimiento' },
  { value: 'emergency', label: 'Consulta de Emergencia' },
  { value: 'specialized', label: 'Consulta Especializada' }
]

// Maps legacy Spanish-label values (stored in old consultations) back to canonical keys
const LEGACY_CONSULTATION_TYPE_MAP: Record<string, string> = {
  'Consulta General': 'general',
  'Primera Consulta': 'initial',
  'Consulta de Seguimiento': 'followup',
  'Consulta de Emergencia': 'emergency',
  'Consulta Especializada': 'specialized',
};

/** Normalises a raw consultation_type value that may be a legacy Spanish label into the canonical key used by the select options and resolveTemplateBySelectValue. */
const normalizeConsultationType = (raw: string | undefined | null): string => {
  if (!raw) return 'general';
  return LEGACY_CONSULTATION_TYPE_MAP[raw] ?? raw;
};

type UIMode = 'history' | 'detail';

type SidebarView = 'consultations' | 'prescriptions' | 'appointments';

const initMentalExamDetailed: MentalExamDetailed = {
  apariencia: {
    aspecto_general: "Adecuado",
    higiene: "Buena",
    vestimenta: "Apropiada para contexto",
    edad_aparente: "Aparenta edad cronológica",
    complexion: "Normal",
    facies: "Normal",
    caracteristicas_distintivas: "",
  },
  conducta: {
    nivel_psicomotor: "Normal",
    contacto_visual: "Adecuado",
    postura: "Normal / Relajada",
    marcha: "Normal",
    movimientos_anormales: "Ninguno",
    cooperacion_entrevista: "Cooperador",
  },
  actitud: {
    actitud_general: "Colaboradora",
    rapport: "Fácil de establecer",
  },
  habla: {
    velocidad: "Normal",
    volumen: "Normal",
    tono: "Normal",
    articulacion: "Clara",
    cantidad: "Normal",
    latencia_respuesta: "Normal",
    prosodia: "Normal",
  },
  afecto: {
    tipo: "Eutímico",
    rango_afectivo: "Normal",
    intensidad: "Normal",
    reactividad: "Reactivo",
    congruencia: "Congruente",
    estabilidad: "Estable",
  },
  animo: {
    estado_animo: "",
    nivel: 5,
    concordancia_animo_afecto: "Concordante",
  },
  pensamiento_proceso: {
    curso_pensamiento: "Lógico y coherente",
    velocidad_pensamiento: "Normal",
    contenido_discurso: "Apropiado y relevante",
  },
  pensamiento_contenido: {
    ideas_muerte: "Ausentes",
    ideacion_suicida: "Ausente",
    plan_suicida: "",
    ideacion_homicida: "Ausente",
    delirios: [],
    caracteristicas_delirios: "No aplica",
    ideas_sobrevaloradas: "Ausentes",
    obsesiones: "Ausentes",
    tipo_obsesiones: [],
    compulsiones: "Ausentes",
    tipo_compulsiones: [],
    fobias: "Ausentes",
    preocupaciones_excesivas: "Ausentes",
  },
  percepcion: {
    alucinaciones_auditivas: "Ausentes",
    alucinaciones_auditivas_caracteristicas: "",
    alucinaciones_visuales: "Ausentes",
    alucinaciones_visuales_caracteristicas: "",
    alucinaciones_tactiles: "Ausentes",
    alucinaciones_tactiles_caracteristicas: "",
    alucinaciones_olfatorias: "Ausentes",
    alucinaciones_olfatorias_caracteristicas: "",
    alucinaciones_gustativas: "Ausentes",
    alucinaciones_gustativas_caracteristicas: "",
    ilusiones: "Ausentes",
    ilusiones_caracteristicas: "",
    despersonalizacion: "Ausente",
    despersonalizacion_caracteristicas: "",
    desrealizacion: "Ausente",
    desrealizacion_caracteristicas: "",
  },
  cognicion: {
    nivel_conciencia: "Alerta",
    orientacion_persona: "Orientado",
    orientacion_lugar: "Orientado",
    orientacion_tiempo: "Orientado",
    orientacion_situacion: "Orientado",
    atencion: "Normal",
    concentracion: "Adecuada",
    memoria_inmediata: "Conservada",
    memoria_reciente: "Conservada",
    memoria_remota: "Conservada",
    capacidad_abstracta: "Normal",
    calculo: "Conservado",
    inteligencia_clinica_estimada: "Normal",
    funciones_ejecutivas: "Sin alteraciones aparentes",
  },
  insight_juicio: {
    insight: "Completo",
    grado: "",
    juicio: "Conservado",
    juicio_social: "Adecuado",
    control_impulsos: "Adecuado",
  },
  funcionalidad: {
    nivel_global: 100,
    laboral_escolar: "Sin afectación",
    funcionalidad_social: "Sin afectación",
    autocuidado: "Independiente",
  },
};

const initFormData = {
  consultation_type: 'general',
  consultation_date: new Date().toISOString().split('T')[0],
  current_condition: '',
  diagnosis: '',
  diagnoses: [],
  evaluations: [],
  vital_signs: {
    height: '',
    weight: '',
    blood_pressure: { systolic: '', diastolic: '' },
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: ''
  },
  treatment_plan: '',
  physical_examination: '',
  prescriptions: [],
  indications: [],
  additional_instructions: '',
  next_appointment: { date: '', time: '' },
  mental_exam: initMentalExamDetailed,
  sintomatologia_actual: {
    motivo_consulta: '',
    queja_principal: '',
    sintoma_principal: '',
    historia_sintomas_actuales: '',
    duracion_sintomas: '',
    factores_precipitantes: '',
    referido_por: 'Autoreferencia' as const,
    nombre_refiere: '',
    padecimiento_actual: '',
    curso_enfermedad: 'Agudo' as const,
    sintomas_cardinales: '',
    impacto_fucional: 'Nulo' as const,
    espera_terapia: '',
    terapia_antes: 'No' as const,
    terapia_funciono: '',
    descripcion_problema: '',
    situaciones_problema: '',
    pensamientos_asociados: '',
    emociones_asociadas: '',
    conductas_asociadas: '',
    consecuencias: '',
    intentos_previos_solucion: '',
    impactos_vida: 'Personal' as const,
    sueno: 'Regular' as const,
    apetito: 'Bueno' as const,
    energia: 'Buena' as const,
    nivel_funcionamiento: '',
  },
  historia_personal: {
    desarrollo_temprano: '',
    relacion_padres: '',
    relacion_hermanos: '',
    experiencias_escolares: '',
    historia_relacion_pareja: '',
    patron_relaciones: '',
    experiencias_traumaticas: '',
    fortalezas_personales: '',
    valores_importantes: '',
    metas_vida: '',
  },
  antecedentes_psiquiatricos: {
    diagnosticos_previos: [] as string[],
    diagnosticos_previos_detalle: '',
    hospitalizaciones_previas: 'No' as const,
    motivos_hospitalizacion: '',
    tratamientos_previos: 'No' as const,
    tratamientos_previos_detalle: { medicamento: '', dosis: '', durecion: '', respuesta: '', motivo_suspension: '' },
    psiquiatra_tratante: '',
    psicoterapias_previas: 'No' as const,
    psicoterapias_previas_detalle: { tipo: '', duracion: '', terapeuta: '', resultado: '' },
    tec: 'No' as const,
    tec_detalle: '',
    emt: 'No' as const,
    emt_detalle: '',
    otros_tratamientos_somaticos: '',
  },
  historia_riesgo: {
    ideacion_suicida_previa: 'No' as const,
    intentos_suicidio_previos: 'No' as const,
    intentos_suicidio_detalle: '',
    autolesiones_no_suicidas: 'No' as const,
    autolesiones_no_suicidas_detalle: '',
    ideacion_homicida_previa: 'No' as const,
    ideacion_homicida_detalle: '',
    conductas_violentas_previas: 'No' as const,
    conductas_violentas_detalle: '',
    acceso_armas: 'No' as const,
    acceso_armas_detalle: '',
    acceso_medicamentos_cantidad: 'No' as const,
    acceso_medicamentos_cantidad_detalle: '',
    acceso_medios_letales: 'No' as const,
    acceso_medios_letales_detalle: '',
    otro_factor_riesgo: 'No' as const,
    otro_factor_riesgo_detalle: '',
    conducta_agresiva: 'No' as const,
    conducta_agresiva_detalle: '',
    nivel_riesgo: 'NA' as const,
    plan_seguridad: '',
    eventos_precipitantes: '',
    uso_sustancias_recienta: 'No' as const,
    uso_sustancias_recienta_detalle: '',
    suspension_medicamentos: 'No' as const,
    suspension_medicamentos_detalle: '',
    estresores_identificados: 'No' as const,
    estresores_identificados_detalle: '',
    perdidas_recientes: 'No' as const,
    perdidas_recientes_detalle: '',
  },
  uso_sustancias: {
    tabaco: 'Nunca' as const,
    alcohol: 'Ocasional' as const,
    cannabis: 'No' as const,
    cannabis_frecuencia: 'Previo' as const,
    cocaina: 'No' as const,
    cocaina_frecuencia: 'Previo' as const,
    opioides: 'No' as const,
    opioides_frecuencia: 'Previo' as const,
    benzodiacepinas: 'No' as const,
    benzodiacepinas_frecuencia: 'Previo' as const,
    otras_sustancias: 'No' as const,
    otras_sustancias_detalle: '',
    tratamientos_previos_accidente: 'No' as const,
    tratamientos_previos_accidente_detalle: '',
    internamientos_previos_sustancias: 'No' as const,
    internamientos_previos_sustancias_detalle: '',
    ultima_intoxicacion: '',
    inicio_abstinencia: '',
  },
  antecedentes_medicos: {
    enfermedades_cronicas: [] as string[],
    cirugias_previas: 'No' as const,
    cirugias_previas_detalle: [{ precedimiento: '', fecha: '', hospital: '' }] as [{ precedimiento: string; fecha: string; hospital: string }],
    hospitalizaciones_medicas: '',
    alergias_medicamentos: 'No' as const,
    alergias_medicamentos_detalle: [{ medicamento: '', reaccion: '' }] as [{ medicamento: string; reaccion: string }],
    otras_alergias: '',
    medicamentos_actuales: [{ medicamento: '', dosis: '', frecuencia: '', indicacion: '' }] as [{ medicamento: string; dosis: string; frecuencia: string; indicacion: string }],
    condiciones_neurologicas: [] as string[],
    enfermedades_endocrinas: [] as string[],
    embarazo_actual: 'NA' as const,
    lactancia: 'NA' as const,
    ultima_menstruacion: '',
    metodo_anticonceptivo: 'NA' as const,
    metodo_anticonceptivo_detalle: '',
  },
  antecedentes_heredofamiliares: {
    antecedentes_psicologicos: [{ parentesco: '', diagnostico: '', tratamiento: '', suicidio: 'No' as const }] as [{ parentesco: string; diagnostico: string; tratamiento: string; suicidio: 'Si' | 'No' }],
    derpesion: [{ parentesco: '', diagnostico: '', tratamiento: '', suicidio: 'No' as const }] as [{ parentesco: string; diagnostico: string; tratamiento: string; suicidio: 'Si' | 'No' }],
    trastorno_bipolar: [{ parentesco: '', diagnostico: '', tratamiento: '', suicidio: 'No' as const }] as [{ parentesco: string; diagnostico: string; tratamiento: string; suicidio: 'Si' | 'No' }],
    esquizofrenia: [{ parentesco: '', diagnostico: '', tratamiento: '', suicidio: 'No' as const }] as [{ parentesco: string; diagnostico: string; tratamiento: string; suicidio: 'Si' | 'No' }],
    ansiedad: [{ parentesco: '', diagnostico: '', tratamiento: '', suicidio: 'No' as const }] as [{ parentesco: string; diagnostico: string; tratamiento: string; suicidio: 'Si' | 'No' }],
    uso_sustancias: [{ parentesco: '', diagnostico: '', tratamiento: '', suicidio: 'No' as const }] as [{ parentesco: string; diagnostico: string; tratamiento: string; suicidio: 'Si' | 'No' }],
    suicidio: [{ parentesco: '', diagnostico: '', tratamiento: '', suicidio: 'No' as const }] as [{ parentesco: string; diagnostico: string; tratamiento: string; suicidio: 'Si' | 'No' }],
    tdah: [{ parentesco: '', diagnostico: '', tratamiento: '', suicidio: 'No' as const }] as [{ parentesco: string; diagnostico: string; tratamiento: string; suicidio: 'Si' | 'No' }],
    demencia: [{ parentesco: '', diagnostico: '', tratamiento: '', suicidio: 'No' as const }] as [{ parentesco: string; diagnostico: string; tratamiento: string; suicidio: 'Si' | 'No' }],
    enfermedades_relevantes: '',
  },
  historia_personal_social: {
    embarazo_parto: '',
    desarrollo_psicomotor: 'Normal' as const,
    desarrollo_psicomotor_detalle: '',
    historia_escolar: '',
    problemas_aprendizaje: 'No' as const,
    problemas_aprendizaje_detalle: '',
    historia_laboral: '',
    situacion_laboral_actual: '',
    historia_relaciones: '',
    relacion_actual: '',
    hijos: [{ pareja: '', sexo: '', edad: 0 }] as [{ pareja: string; sexo: string; edad: number }],
    convivencia_actual: '',
    apoyo_social: 5,
    situacion_economica: 'Buena' as const,
    situacion_legal: 'No' as const,
    situacion_legal_detalle: '',
    trauma_infantil: 'No' as const,
    trauma_infantil_detalle: '',
    abuso_fisico: 'No interrogado' as const,
    abuso_sexual: 'No interrogado' as const,
    negligencia: 'No interrogado' as const,
    voilencia_domestica: 'No interrogado' as const,
    intereses_pasatiempos: '',
    fortalezas_paciente: '',
  },
  plan_manejo: {
    farmacoterapia_indicada: 'No' as const,
    efectos_secundarios_reportados: '',
    estresores_actuales: '',
    plan_manejo_tratamiento: '',
    tiempo_seguimiento_meses: 'Corto plazo' as const,
    psicoterapia_indicada: 'No' as const,
    numero_sesiones_previstas: 0,
    receta: '',
    enfoque_terapeutico_propuesto: '',
    objetivos_terapeuticos: '',
    tarea_proxima_sesion: '',
    tareas_asignadas_previamente: '',
    frecuencia_sesiones: 'Semanal' as const,
    duracion_estimada: '',
    necesidad_evaluacion_psiquiatrica: 'No' as const,
    necesidad_pruebas_neuropsicologicas: 'No' as const,
    tipo_pruebas_neuropsicologicas: 'Cognitivas' as const,
    contrato_terapeutico: 'No' as const,
    referencias_interconsultas: '',
    psicoeducacion_proporcionada: '',
    temas_a_continuar: '',
    progreso: 'Nulo' as const,
    proxima_cita: '',
    cambios_plan_tratamiento: '',
  },
  analisis_conclusiones: {
    analisis_clinico: '',
    diagnostico_principal: [],
    diagnosticos_secundarios: [],
    diagnostico_diferencial: '',
    formulacion_caso: '',
    notas_privadas: '',
    observaciones_progreso: '',
    estado_emocional: '',
    nivel_malestar_cierre: 5,
    cambios_ultima_visita: '',
    adherencia_tratamiento: 'Nulo' as const,
    adherencia_detalle: '',
    pronostico: 'No se puede pronosticar aún' as const,
    pronostico_detalle: '',
  },
  formulacion_caso: {
    hipotesis_trabajo: '',
    factores_predisponentes: '',
    factores_precipitantes: '',
    factores_mantenimiento: '',
    factores_protectores: '',
    diagnostico_presuntivo: '',
  },
  estado_inicio: {
    estado_emocional: '',
    nivel_malestar: 5,
    eventos_ultima_sesion: '',
    trae_hoy: '',
  },
  contenido_sesion: {
    temas_principales: '',
    tecnicas_utilizadas: [] as string[],
    momentos_significativos: '',
    insights_paciente: '',
    emociones_trabajadas: [] as string[],
    emociones_trabajadas_detalle: '',
    resistencias_observadas: '',
  },
  otros_campos: {
    documentos: [] as string[],
    estudios_gabinete: {
      tac: { check: 'No' as const, detalle: '' },
      rm: { check: 'No' as const, detalle: '' },
      ultrasonido: { check: 'No' as const, detalle: '' },
      poligrafia: { check: 'No' as const, detalle: '' },
      polisomnografia: { check: 'No' as const, detalle: '' },
      otro: { check: 'No' as const, detalle: '' },
    },
    estudios_laboratorio: [],
    tipo_urgencia: 'Sentida' as const,
    evaluacion_intento_suicidio: {
      intencional: '',
      peligrosidad: '',
      impulsividad: '',
    },
  },
  red_apoyo: {
    redes_disponibles: 'No' as const,
    redes_disponibles_detalle: '',
    contencion: 'No' as const,
    contencion_detalle: '',
    contacto_emergencia: 'No' as const,
    contacto_emergencia_detalle: '',
  },
  intervencion_crisis: {
    intervencion_crisis: '',
    contencion_verbal: '',
    medicacion_urgencia: '',
    restriccion_medios: 'No' as const,
    restriccion_medios_detalle: '',
    llamada_familia: 'No' as const,
    llamada_familia_detalle: '',
    psicoeducacion: '',
    responsable_egreso: { nombre: '', parentesco: '', telefono: '' },
    destino: 'Alta' as const,
    justificacion: '',
    criterios_hospitalizacion: 'No' as const,
    criterios_hospitalizacion_detalle: '',
    consentimiento_paciente: 'No' as const,
    consentimiento_paciente_detalle: '',
    consentimiento_familiar: 'No' as const,
    consentimiento_familiar_detalle: '',
    plan_egreso: '',
    instrucciones: '',
    numeros_emergencia: [] as string[],
    indicaciones_escrito: '',
  },
  resultados_gabinete: '',
  lab_orders_request: '',
} as ConsultationData

// Safe date formatting function to avoid Invalid time value errors
const safeFormatDate = (dateString: string | null | undefined, formatStr: string = 'dd MMM yyyy'): string => {
  if (!dateString) return 'Fecha no disponible';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return format(date, formatStr, { locale: es });
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', dateString);
    return 'Fecha no válida';
  }
};

export default function CentralizedConsultationInterface({
  patient,
  consultationId,
  onClose,
  onSave
}: CentralizedConsultationInterfaceProps) {

  const callRef = useRef(true);
  // Authenticated API client
  const authenticatedFetch = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [templates, setTemplates] = useState<ConsultationTemplate[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [IdConsultation, setIdConsultation] = useState<string | null>(consultationId || null);
  const [uiMode, setUiMode] = useState<UIMode>(consultationId ? 'detail' : 'history');
  const [historyTab, setHistoryTab] = useState<SidebarView>('consultations'); // reutiliza tu tipo
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);
  const [consultationsSelectTypes, setConsultationsSelectTypes] = useState<{ value: string; label: string }[]>(defaultConsultationTypes);

  // Navigation states
  const [sidebarView, setSidebarView] = useState<SidebarView>('consultations');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [currentConsultationIndex, setCurrentConsultationIndex] = useState(0);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Print states
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showPrintConfig, setShowPrintConfig] = useState(false);

  // Prescription modal state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showPrescriptionDesigner, setShowPrescriptionDesigner] = useState(false);

  // Form states
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showReceta, setShowReceta] = useState<boolean>(false);
  const [consultationData, setConsultationData] = useState<ConsultationData>(initFormData);

  const [evaluationCatalog, setEvaluationCatalog] = useState<any>(null);
  const [clinicName, setClinicName] = useState<string>('');
  const [professionalName, setProfessionalName] = useState<string>('');

  const [activeTemplate, setActiveTemplate] = useState<ConsultationTemplate | null>(null);
  const [activeFields, setActiveFields] = useState<Set<string> | null>(null);

  // states from pad
  const [openPad, setOpenPad] = useState(false);
  const [noteImg, setNoteImg] = useState<string | null>(null);

  // Section modes: null = not selected, 'text' = free text, 'canvas' = handwriting pad
  const [sectionModes, setSectionModes] = useState<Partial<Record<FieldKey, SectionMode>>>({});


  // Per-section free text content stored when the user selects Texto Libre mode
  const [sectionFreeText, setSectionFreeText] = useState<Partial<Record<FieldKey, string>>>({});
  const setSectionMode = (key: FieldKey, mode: SectionMode) => {
    setSectionModes(prev => ({ ...prev, [key]: mode }));
  };

  // Sections that do NOT have mode selection
  const SECTIONS_WITHOUT_MODE: FieldKey[] = ['evaluations', 'medications', 'nextAppointment', 'diagnosis'];

  // Helper to render mode selector + content for a section
  const renderSectionWithMode = (
    key: FieldKey,
    title: string,
    content: React.ReactNode,
    cardClassName: string = 'p-6'
  ) => {
    if (!isVisible(key)) return null;
    if (SECTIONS_WITHOUT_MODE.includes(key)) return null; // handled separately

    const mode = sectionModes[key] ?? null;

    return (
      <Card key={key} className={cardClassName}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSectionMode(key, 'text')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${mode === 'text'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
            >
              ✏️ Texto Libre
            </button>
            <button
              type="button"
              onClick={() => setSectionMode(key, 'canvas')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${mode === 'canvas'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
            >
              🎨 Canva
            </button>
          </div>
        </div>
        {mode === null && (
          <p className="text-sm text-gray-400 italic">Selecciona un modo para capturar el contenido de esta sección.</p>
        )}
        {mode === 'text' && content}
        {mode === 'canvas' && (
          <CanvasSectionPad sectionKey={key} title={title} />
        )}
      </Card>
    );
  };

  type ExpedixConfig = {
    settings?: {
      prescriptionPrintSettings?: any;
    };
  };

  const [expedixConfig, setExpedixConfig] = useState<ExpedixConfig | null>(null);

  // Helper function to get authentication headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token || ''}`,
      'Content-Type': 'application/json'
    };
  };

  // Load patient data and consultations
  useEffect(() => {

    if (callRef.current) {
      console.log('cargando data', patient.id, consultationId);
      loadPatientData();
      getEvaluationsCatalog();
      getClinicData();
      loadTemplates();
      loadExpedixConfig();
      callRef.current = false;
    }

  }, [patient.id, consultationId]);

  // Cada vez que cambie el tipo seleccionado o los templates, recalculamos
  useEffect(() => {
    const t = resolveTemplateBySelectValue(templates, consultationData.consultation_type);

    setActiveTemplate(t);

    // Si no hay template o fields_config vacío => NO filtrar (mostrar todo)
    if (!t || !Array.isArray(t.fields_config) || t.fields_config.length === 0) {
      setActiveFields(null);
      return;
    }

    setActiveFields(new Set(t.fields_config));
  }, [templates, consultationData.consultation_type]);

  const isVisible = (key: FieldKey) => {
    // null => no hay filtro => todo visible
    if (!activeFields) return true;
    // Clave exacta (formato antiguo: 'mentalExam', 'vitalSigns', etc.)
    if (activeFields.has(key)) return true;
    // Formato dotted: si existe cualquier 'key.campo' la sección es visible
    for (const f of activeFields) {
      if (f.startsWith(key + '.')) return true;
    }
    return false;
  };

  // Per-section canvas data (dataUrl of saved drawing)
  const [sectionCanvasData, setSectionCanvasData] = useState<Partial<Record<FieldKey, string>>>({});
  const [openCanvasSection, setOpenCanvasSection] = useState<FieldKey | null>(null);

  const CanvasSectionPad = ({ sectionKey, title }: { sectionKey: FieldKey; title: string }) => {
    const savedImg = sectionCanvasData[sectionKey];
    return (
      <div>
        {savedImg ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-600 font-medium">Nota guardada:</div>
            <img src={savedImg} alt={`nota-${sectionKey}`} className="border rounded-lg max-w-full" />
            <button
              type="button"
              onClick={() => setOpenCanvasSection(sectionKey)}
              className="mt-2 px-3 py-1.5 rounded-md text-sm border border-gray-300 hover:bg-gray-50 text-gray-600"
            >
              ✏️ Editar nota
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpenCanvasSection(sectionKey)}
            className="px-4 py-2 rounded-md text-sm bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100"
          >
            🎨 Abrir lienzo para {title}
          </button>
        )}
        <FullscreenHandwritingPad
          open={openCanvasSection === sectionKey}
          onClose={() => setOpenCanvasSection(null)}
          onSavePng={({ dataUrl }) => {
            setSectionCanvasData(prev => ({ ...prev, [sectionKey]: dataUrl }));
            setOpenCanvasSection(null);
          }}
          onSaveSvg={({ svg }) => {
            console.log(`svg saved for ${sectionKey}`, svg);
            setOpenCanvasSection(null);
          }}
        />
      </div>
    );
  };

  const loadExpedixConfig = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/expedix/django/configuration/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        console.warn('No se pudo cargar expedix config', res.status);
        return;
      }

      const json = await res.json();
      // según tu backend: { success: true, data: {...} }
      if (json?.results.length > 0) {
        // console.log('results expedix settings:', json.results[0]);
        setExpedixConfig(json.results[0]);
      }
      // const data = json?.data ?? null;
      // setExpedixConfig(data);
    } catch (err) {
      console.error('Error cargando expedix config', err);
    }
  }, [authenticatedFetch]);


  const loadTemplates = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/expedix/consultation-templates/', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const templatesData = data?.data ?? data ?? [];
      const templatesArr = Array.isArray(templatesData) ? templatesData : [];

      setTemplates(templatesArr);

      // =========================================================
      // Construir select types SIN duplicar
      // Regla:
      // - Si template_type !== 'custom' => value = template_type y label = name
      // - Si template_type === 'custom' => value = identifier y label = name
      // - Mantener también los defaultConsultationTypes si no hay plantilla que los reemplace
      // - Ordenar: default primero (si hay), luego el resto
      // =========================================================

      // 1) Partimos de defaults como base
      const base = new Map<string, { value: string; label: string }>();
      defaultConsultationTypes.forEach((t) => base.set(t.value, t));

      // 2) Aplicar templates encima (sobrescriben label si match por template_type)
      let defaultOption: { value: string; label: string } | null = null;

      for (const t of templatesArr) {
        // si no es custom, mapea por template_type (sobrescribe label del default)
        if (t.template_type !== 'custom') {
          const key = t.template_type; // 'initial', 'general', etc.
          if (key) {
            base.set(key, { value: key, label: t.name || base.get(key)?.label || key });
          }
        } else {
          // custom: se agrega por identifier (nuevo option)
          const key = t.identifier;
          if (key) {
            base.set(key, { value: key, label: t.name || key });
          }
        }

        if (t.is_default) {
          // El default debe usar el value que corresponda a su tipo
          const value = t.template_type === 'custom' ? t.identifier : t.template_type;
          if (value) defaultOption = { value, label: t.name || value };
        }
      }

      // 3) Convertir a array
      const options = Array.from(base.values());

      // 4) Ordenar: default primero, luego defaults en su orden original,
      //    luego custom (los que no están en defaultConsultationTypes)
      const defaultOrder = defaultConsultationTypes.map((d) => d.value);

      options.sort((a, b) => {
        // defaultOption hasta arriba
        if (defaultOption) {
          if (a.value === defaultOption.value) return -1;
          if (b.value === defaultOption.value) return 1;
        }

        const ai = defaultOrder.indexOf(a.value);
        const bi = defaultOrder.indexOf(b.value);

        const aIsDefault = ai !== -1;
        const bIsDefault = bi !== -1;

        if (aIsDefault && bIsDefault) return ai - bi; // respeta orden base
        if (aIsDefault) return -1;
        if (bIsDefault) return 1;

        // custom al final por orden alfabético
        return a.label.localeCompare(b.label);
      });

      setConsultationsSelectTypes(options);
    } catch (error) {
      console.error('Error loading consultation templates:', error);
      setTemplates([]);
      setConsultationsSelectTypes(defaultConsultationTypes);
    } finally {
      setLoading(false);
    }
  };


  const getClinicData = async () => {
    try {
      const response = await expedixApi.getClinicData();
      const data = response?.data;

      if (!data) return;

      // 👨‍⚕️ Nombre del doctor (workspace)
      const workspaceName = data.available_contexts?.workspace?.name || '';
      setProfessionalName(workspaceName);

      // 🏥 Clínica (si existe)
      const clinics = data.available_contexts?.clinics || [];

      if (clinics.length > 0) {
        // Si hay clínicas, usamos la primera (o la activa si luego agregas selección)
        setClinicName(clinics[0].name);
      } else {
        // Fallback: consultorio individual
        setClinicName(data.available_contexts?.workspace?.business_name || workspaceName);
      }

    } catch (error) {
      console.log('error getClinicData:', error);
    }
  };

  const getEvaluationsCatalog = async () => {
    try {
      const response = await clinimetrixProClient.getTemplateCatalog();

      setEvaluationCatalog(response);
    } catch (error) {
      console.error('Error fetching evaluations catalog:', error);
    }
  };

  const loadPatientData = async () => {
    try {
      setLoading(true);

      // Load patient consultations
      const consultationsResponse = await expedixApi.getPatientConsultations(patient.id);
      const patientConsultations = consultationsResponse?.data || [];
      // console.log('consultations:', consultationsResponse);

      setConsultations(patientConsultations);

      // Load prescriptions
      const prescriptionsResponse = await expedixApi.getPatientPrescriptions(patient.id);
      // console.log('prescriptionsResponse:', prescriptionsResponse);
      setPrescriptions(prescriptionsResponse?.data || []);

      // Load next appointment from agenda
      await loadNextAppointment();

      // Set current consultation
      if (consultationId) {
        const existing = patientConsultations.find(c => c.id === consultationId);
        // console.log('existing:', existing);
        if (existing) {
          setCurrentConsultation(existing);
          loadConsultationData(existing);
        }
      } else {
        // Create new consultation
        // loadNewConsultation();
        resetFormForNewConsultation();
        // await createNewConsultation();
      }

    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextAppointment = async () => {
    try {
      // This would call the agenda API to get the next appointment for this patient
      const response = await authenticatedFetch(`/api/agenda/appointments/next?patientId=${patient.id}`);
      if (response.ok) {
        const data = await response.json();
        setNextAppointment(data.next_appointment || data.data);
      }
    } catch (error) {
      console.error('Error loading next appointment:', error);
    }
  };

  const createNewConsultation = async () => {
    try {
      // Auto-create consultation when opened
      const newConsultation = {
        patient_id: patient.id, // Changed from patientId to patient_id to match backend
        consultation_date: new Date().toISOString(),
        consultation_type: 'general',
        status: 'draft',
        current_condition: '',
        diagnosis: ''
      };

      const response = await expedixApi.createConsultation(newConsultation);
      if (response?.data) {
        setCurrentConsultation(response.data);
        setConsultations(prev => [response.data, ...prev]);
      }
    } catch (error) {
      console.error('Error creating consultation:', error);
    }
  };


  // Helper to deep merge objects so nested fields aren't lost from older data
  const deepMerge = (target: any, source: any): any => {
    if (typeof target !== 'object' || target === null) return source !== undefined ? source : target;
    if (typeof source !== 'object' || source === null) return target;

    if (Array.isArray(target) && Array.isArray(source)) return source;

    const output = { ...target };
    Object.keys(source).forEach(key => {
      if (source[key] !== undefined && source[key] !== null) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key]) {
          output[key] = deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      }
    });
    return output;
  };

  const loadConsultationData = async (consultation: Consultation) => {
    // setLoading(true);
    toast.loading('Cargando datos de la consulta...');
    try {
      setIdConsultation(consultation.id);
      const consultationsResponse = await expedixApi.getPatientConsultations(patient.id, consultation.id);

      if (consultationsResponse?.data && consultationsResponse.data.length > 0) {

        // Load consultation details into form
        const data = consultationsResponse.data[0];
        console.log('Loaded consultation data:', data);
        if (data.prescriptions.length > 0) {
          setShowReceta(true);
        } else {
          setShowReceta(false);
        }

        // Restore section modes and alternative data from otros_campos if available
        if (data.otros_campos) {
          if (data.otros_campos.sectionModes) setSectionModes(data.otros_campos.sectionModes);
          if (data.otros_campos.sectionFreeText) setSectionFreeText(data.otros_campos.sectionFreeText);
          if (data.otros_campos.sectionCanvasData) setSectionCanvasData(data.otros_campos.sectionCanvasData);
        }
        setConsultationData(prev => ({
          ...deepMerge(initFormData, data),
          consultation_type: normalizeConsultationType(data.consultation_type),
          consultation_date: data.consultation_date ? moment(data.consultation_date).format('YYYY-MM-DD') : new Date().toISOString().split('T')[0],
          current_condition: data.current_condition || '',
          diagnosis: data.diagnosis || '',
          diagnoses: data.diagnoses || [],
          evaluations: data.evaluations || [],
          treatment_plan: data.treatment_plan || '',
          physical_examination: data.physical_examination || '',
          prescriptions: data.prescriptions || [],
          indications: data.indications || [],
          additional_instructions: data.additional_instructions || '',
          next_appointment: data.next_appointment || { date: '', time: '' },
        }) as ConsultationData);
      }
      // setLoading(false);
      toast.dismiss();
    } catch (error) {
      console.error('Error loading consultation data:', error);
      toast.dismiss();
      toast.error('Error al cargar los datos de la consulta.');
      setIdConsultation(null);
      // setLoading(false);
    }
  };

  const openConsultationDetail = (consultation: Consultation, index: number) => {
    setCurrentConsultation(consultation);
    setCurrentConsultationIndex(index);
    setUiMode('detail');
    loadConsultationData(consultation);
  };

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    if (isAutoSaving) return; // Prevent multiple simultaneous auto-saves

    try {
      if (IdConsultation) {
        setIsAutoSaving(true);

        // Preparar diagnósticos para guardado
        const primaryDiagnosis = consultationData.diagnoses.find(d => d.isPrimary) || consultationData.diagnoses[0];
        const diagnosesText = consultationData.diagnoses.length > 0
          ? consultationData.diagnoses.map(d => {
            let text = d.code ? `${d.code} - ${d.description}` : d.description;
            if (d.isPrimary) text = `[PRINCIPAL] ${text}`;
            if (d.notes) text += ` (${d.notes})`;
            return text;
          }).join('\n')
          : consultationData.diagnosis; // Fallback para compatibilidad

        const updateData = {
          patient_id: patient.id,
          subjective: consultationData.current_condition,
          objective: `${consultationData.vital_signs.height ? `Talla: ${consultationData.vital_signs.height}cm` : ''} ${consultationData.vital_signs.weight ? `Peso: ${consultationData.vital_signs.weight}kg` : ''} ${consultationData.vital_signs.blood_pressure?.systolic ? `TA: ${consultationData.vital_signs.blood_pressure?.systolic}/${consultationData.vital_signs.blood_pressure?.diastolic}` : ''} ${consultationData.vital_signs.temperature ? `Temp: ${consultationData.vital_signs.temperature}°C` : ''} ${consultationData.vital_signs.heartRate ? `FC: ${consultationData.vital_signs.heartRate}bpm` : ''}`.trim(),
          assessment: diagnosesText,
          // Agregar los diagnósticos estructurados como campo adicional
          diagnoses_structured: consultationData.diagnoses,
          plan: consultationData.additional_instructions || '',
          status: 'draft', // Auto-saved consultations are drafts
          consultation_type: consultationData.consultation_type
        };

        // await expedixApi.createConsultation(updateData);
        await expedixApi.updateConsultation(IdConsultation, updateData);
        setLastSaved(new Date());
        console.log('✅ Auto-saved consultation data');
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [consultationData, patient.id, isAutoSaving]);

  // Auto-save effect with debounce
  useEffect(() => {
    const autoSaveTimeout = setTimeout(() => {
      // Only auto-save if there's content in key fields
      const hasContent = consultationData.current_condition.trim() ||
        consultationData.diagnosis.trim() ||
        consultationData.diagnoses.length > 0 ||
        consultationData.additional_instructions?.trim();

      if (hasContent && IdConsultation) {
        handleAutoSave();
      }
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimeout);
  }, [consultationData]);

  const handleSaveConsultation = async () => {
    console.log('💾 Saving consultation data...', consultationData);
    console.log('consultationId', IdConsultation);

    if (IdConsultation) {
      // Update existing consultation
      try {
        // Formatear examen mental para almacenamiento
        // const formattedMentalExam = MentalExamFormatter.formatForStorage(consultationData.mental_exam as MentalExamData);

        const updateData = {
          ...consultationData,
          otros_campos: {
            ...(consultationData.otros_campos || {}),
            sectionModes,
            sectionFreeText,
            sectionCanvasData
          },
          status: 'completed',
          updated_at: new Date().toISOString()
        };

        console.log('💾 Saving consultation with structured mental exam:', updateData);

        await expedixApi.updateConsultation(IdConsultation, updateData);

        // // Refresh consultations list
        // await loadPatientData();

        // if (onSave) {
        //   onSave(updateData);
        // }

        // // Show success message
        // console.log('✅ Consultation saved successfully with mental exam data');

      } catch (error) {
        console.error('❌ Error saving consultation:', error);
      }
    } else {
      try {
        // create new consultation

        // Preparar diagnósticos para guardado
        const primaryDiagnosis = consultationData.diagnoses.find(d => d.isPrimary) || consultationData.diagnoses[0];
        const diagnosesText = consultationData.diagnoses.length > 0
          ? consultationData.diagnoses.map(d => {
            let text = d.code ? `${d.code} - ${d.description}` : d.description;
            if (d.isPrimary) text = `[PRINCIPAL] ${text}`;
            if (d.notes) text += ` (${d.notes})`;
            return text;
          }).join('\n')
          : consultationData.diagnosis;

        const updateData = {
          patient_id: patient.id,
          subjective: consultationData.current_condition,
          objective: `${consultationData.vital_signs.height ? `Talla: ${consultationData.vital_signs.height}cm` : ''} ${consultationData.vital_signs.weight ? `Peso: ${consultationData.vital_signs.weight}kg` : ''} ${consultationData.vital_signs.blood_pressure?.systolic ? `TA: ${consultationData.vital_signs.blood_pressure?.systolic}/${consultationData.vital_signs.blood_pressure?.diastolic}` : ''} ${consultationData.vital_signs.temperature ? `Temp: ${consultationData.vital_signs.temperature}°C` : ''} ${consultationData.vital_signs.heartRate ? `FC: ${consultationData.vital_signs.heartRate}bpm` : ''}`.trim(),
          assessment: diagnosesText,
          // Agregar los diagnósticos estructurados como campo adicional
          diagnoses_structured: consultationData.diagnoses,
          plan: consultationData.additional_instructions || '',
          status: 'draft', // Auto-saved consultations are drafts
          consultation_type: consultationData.consultation_type,
          otros_campos: {
            ...(consultationData.otros_campos || {}),
            sectionModes,
            sectionFreeText,
            sectionCanvasData
          }
        };

        await expedixApi.createConsultation(updateData);

      } catch (error) {
        console.log('error creando new consultation', error);

      }
    }
  };

  // Print handlers
  const handlePrintConsultation = () => {
    if (!currentConsultation) {
      console.warn('No consultation available for printing');
      return;
    }

    const printData = {
      type: 'consultation',
      consultation: currentConsultation,
      consultationData,
      patient,
      sectionModes,
      sectionFreeText,
      sectionCanvasData
      // formattedMentalExam: MentalExamFormatter.formatForStorage(consultationData.mental_exam as MentalExamData)
    };

    // Abrir ventana de impresión
    openPrintWindow(printData);
    setShowPrintMenu(false);
  };

  const handlePrintPrescription = () => {
    if (!consultationData.prescriptions || consultationData.prescriptions.length === 0) {
      alert('No hay medicamentos en esta consulta para imprimir');
      return;
    }

    const printData = {
      type: 'prescription',
      consultation: currentConsultation,
      consultationData,
      patient,
      prescriptions: consultationData.prescriptions
    };

    openPrintWindow(printData);
    setShowPrintMenu(false);
  };

  const handlePrintMedicalRecord = () => {
    const printData = {
      type: 'medical_record',
      patient,
      consultations,
      prescriptions,
      currentConsultation
    };

    openPrintWindow(printData);
    setShowPrintMenu(false);
  };

  const openPrintWindow = (printData: any) => {
    // Crear una nueva ventana para impresión
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor permite ventanas emergentes para imprimir');
      return;
    }

    // Generar HTML para impresión
    const html = generatePrintHTML(printData);
    printWindow.document.write(html);
    printWindow.document.close();

    // Esperar a que se cargue completamente antes de imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // No cerrar automáticamente para que el usuario pueda revisar
      }, 500);
    };
  };

  const handleSaveMedications = (prescriptions: any[], indications: any[]) => {
    setConsultationData(prev => ({
      ...prev,
      prescriptions: prescriptions,
      medicationIndications: indications
    }));
  };

  const generatePrintHTML = (printData: any): string => {
    const { type, patient, consultationData: formData, formattedMentalExam, sectionModes = {}, sectionFreeText = {}, sectionCanvasData = {} } = printData;

    // config base (para estilos “generales” si tu PrintConfigManager ya trae cosas de clínica)
    const config = PrintConfigManager.getCurrentConfig();
    const styles = `<style>${PrintConfigManager.generateStyles(config)}</style>`;

    if (type === 'consultation') {
      return generateConsultationHTML(styles, config, patient, formData, formattedMentalExam, sectionModes, sectionFreeText, sectionCanvasData);
    }

    if (type === 'prescription') {
      // ✅ 1) si hay configuración en BD, úsala
      const htmlFromDb = generatePrescriptionHTMLFromExpedixSettings(styles, patient, formData, expedixConfig);
      if (htmlFromDb) return htmlFromDb;

      // ✅ 2) fallback a lo que ya tenías
      return generatePrescriptionHTML(styles, config, patient, formData);
    }

    if (type === 'medical_record') {
      return generateMedicalRecordHTML(styles, config, printData);
    }

    return '';
  };


  const generatePrescriptionHTMLFromExpedixSettings = (
    baseStyles: string,
    patient: Patient,
    formData: any,
    cfg: any
  ): string => {
    console.log(' lo que llega:', cfg);

    const s = cfg?.settings?.prescriptionPrintSettings;
    if (!s) {
      // fallback: si no hay config, regresa vacío y usas el método anterior
      return '';
    }

    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: es });

    const include = s.includeFields || {};
    const margins = s.margins || { top: 20, bottom: 20, left: 20, right: 20 };

    // datos paciente (según tu modelo)
    const fullName = `${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}`.trim();
    const birthDate = (patient as any)?.date_of_birth || (patient as any)?.birth_date;

    const headerText = s.headerText || 'RECETA MÉDICA';
    const footerText = s.footerText || '';

    // papel/orientación
    const paperSize = s.paperSize || 'Letter';        // "Letter" | "A4"
    const orientation = s.orientation || 'portrait';  // "portrait" | "landscape"

    // tamaños
    const font = s.fontSize || { header: 16, medication: 12, instructions: 10, footer: 8 };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Receta Médica - ${fullName}</title>

        ${baseStyles}

        <style>
          @page {
            size: ${paperSize} ${orientation};
            margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
          }

          body { font-family: Arial, sans-serif; font-size: 12px; }
          .prescription-header { text-align: center; font-size: ${font.header}px; font-weight: bold; margin-bottom: 12px; }
          .patient-info { margin-bottom: 12px; }
          .rx-symbol { font-size: 24px; font-weight: bold; margin: 8px 0; }
          .medication { margin: 8px 0; padding: 6px; border-left: 3px solid #007bff; }
          .medication-name { font-weight: bold; font-size: ${font.medication}px; }
          .medication-details { font-size: ${font.instructions}px; margin-left: 10px; }
          .footer { margin-top: 18px; font-size: ${font.footer}px; color: #555; }
          .signature-area { margin-top: 20px; text-align: center; }
          .signature-line { width: 260px; border-top: 1px solid #000; margin: 0 auto 6px auto; }
        </style>
      </head>

      <body>
        ${headerText ? `<div class="prescription-header">${headerText}</div>` : ''}

        ${(include.patientName || include.patientAge || include.patientBirthDate || include.date) ? `
          <div class="patient-info">
            ${include.patientName ? `<div><strong>${fullName}</strong></div>` : ''}
            ${include.patientAge ? `<div>Edad: ${patient.age} años</div>` : ''}
            ${include.patientBirthDate && birthDate ? `<div>F. Nac: ${safeFormatDate(birthDate, 'dd/MM/yyyy')}</div>` : ''}
            ${include.date ? `<div>Fecha: ${currentDate}</div>` : ''}
          </div>
        ` : ''}

        <div class="rx-symbol">℞</div>

        ${(formData.prescriptions || []).map((med: any, index: number) => `
          <div class="medication">
            <div class="medication-name">${index + 1}. ${med.name || 'Medicamento'}</div>
            <div class="medication-details">
              ${med.dosage ? `Dosis: ${med.dosage}<br>` : ''}
              ${med.frequency ? `Frecuencia: ${med.frequency}<br>` : ''}
              ${med.duration ? `Duración: ${med.duration}<br>` : ''}
              ${med.instructions ? `Indicaciones: ${med.instructions}` : ''}
            </div>
          </div>
        `).join('')}

        ${include.doctorSignature ? `
          <div class="signature-area">
            <div class="signature-line"></div>
            <div>Firma del médico</div>
          </div>
        ` : ''}

        ${footerText ? `<div class="footer">${footerText}</div>` : ''}
      </body>
      </html>
    `;
  };


  const generateConsultationHTML = (
    styles: string,
    config: PrintConfig,
    patient: Patient,
    formData: any,
    formattedMentalExam: any,
    sectionModes: any = {},
    sectionFreeText: any = {},
    sectionCanvasData: any = {}
  ): string => {
    const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });

    // Helper to recursively render JSON objects as a readable list for HTML print
    const renderStructuredDataHTML = (data: any): string => {
      if (data === null || data === undefined || data === '') return '';

      if (typeof data !== 'object') {
        return `<span>${String(data)}</span>`;
      }

      if (Array.isArray(data)) {
        if (data.length === 0) return '';
        return `
          <ul style="margin: 4px 0 4px 20px; padding: 0;">
            ${data.map(item => `<li>${renderStructuredDataHTML(item)}</li>`).join('')}
          </ul>
        `;
      }

      const entries = Object.entries(data).filter(([_, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length === 0) return '';

      return `
        <div style="margin-top: 4px;">
          ${entries.map(([key, value]) => {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/^./, (str: string) => str.toUpperCase());

        return `
              <div style="margin-left: 8px; margin-bottom: 4px; border-left: 2px solid #eee; padding-left: 8px;">
                <span style="font-weight: 600; color: #444;">${formattedKey}: </span>
                <div style="display: inline-block; vertical-align: top;">${renderStructuredDataHTML(value)}</div>
              </div>
            `;
      }).join('')}
        </div>
      `;
    };

    const SECTION_MAP: Record<string, { title: string; dataKey: string }> = {
      currentCondition: { title: 'Padecimiento Actual', dataKey: 'current_condition' },
      physicalExamination: { title: 'Exploración Física', dataKey: 'physical_examination' },
      diagnosis: { title: 'Diagnóstico', dataKey: 'diagnosis' },
      sintomatologiaActual: { title: 'Sintomatología Actual', dataKey: 'sintomatologia_actual' },
      antecedentesMedicos: { title: 'Antecedentes Médicos', dataKey: 'antecedentes_medicos' },
      antecedentesPsiquiatricos: { title: 'Antecedentes Psiquiátricos', dataKey: 'antecedentes_psiquiatricos' },
      usoSustancias: { title: 'Uso de Sustancias', dataKey: 'uso_sustancias' },
      historiaRiesgo: { title: 'Historia de Riesgo', dataKey: 'historia_riesgo' },
      historiaPersonal: { title: 'Historia Personal', dataKey: 'historia_personal' },
      historiaPersonalSocial: { title: 'Historia Personal y Social', dataKey: 'historia_personal_social' },
      antecedentesHeredofamiliares: { title: 'Antecedentes Heredofamiliares', dataKey: 'antecedentes_heredofamiliares' },
      estadoInicio: { title: 'Estado al Inicio', dataKey: 'estado_inicio' },
      contenidoSesion: { title: 'Contenido de la Sesión', dataKey: 'contenido_sesion' },
      planManejo: { title: 'Plan de Manejo', dataKey: 'plan_manejo' },
      analisisConclusiones: { title: 'Análisis y Conclusiones', dataKey: 'analisis_conclusiones' },
      formulacionCaso: { title: 'Formulación de Caso', dataKey: 'formulacion_caso' },
      redApoyo: { title: 'Red de Apoyo', dataKey: 'red_apoyo' },
      intervencionCrisis: { title: 'Intervención en Crisis', dataKey: 'intervencion_crisis' },
      mentalExam: { title: 'Examen Mental', dataKey: 'mental_exam' },
    };

    const renderSectionHTML = (sectionKey: string, config: { title: string; dataKey: string }) => {
      const mode = sectionModes[sectionKey] || null;
      const freeText = sectionFreeText[sectionKey];
      const canvasData = sectionCanvasData[sectionKey];
      const structuredData = formData[config.dataKey];

      const cleanedData = cleanStructuredData(structuredData);
      const hasStructuredData = () => !!cleanedData;

      if (mode === 'text' && !freeText) return '';
      if (mode === 'canvas' && !canvasData) return '';
      if ((mode === null || mode === undefined) && !hasStructuredData()) return '';

      let contentHTML = '';
      if (mode === 'text') {
        contentHTML = `<p style="color: #333; white-space: pre-wrap; margin: 0;">${freeText}</p>`;
      } else if (mode === 'canvas') {
        contentHTML = `
          <div style="border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9; text-align: center;">
            <img src="${canvasData}" alt="Dibujo - ${config.title}" style="max-width: 100%; height: auto;" />
          </div>
        `;
      } else {
        contentHTML = `<div style="font-size: 13px; color: #333; line-height: 1.6; text-align: justify;">${generateNarrativeHTML(cleanedData)}</div>`;
      }

      return `
        <div class="section" style="margin-bottom: 20px;">
          <div class="section-title" style="font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">${config.title}</div>
          <div class="section-content">${contentHTML}</div>
        </div>
      `;
    };

    const dynamicSectionsHTML = Object.entries(SECTION_MAP)
      .map(([key, config]) => renderSectionHTML(key, config))
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Nota de Consulta - ${patient.first_name} ${patient.paternal_last_name}</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${config.clinicName}</div>
          <div class="clinic-info">${config.doctorName} • Cédula Prof: ${config.professionalId}</div>
          <div class="clinic-info">Tel: ${config.phone || ''} • Email: ${config.email || ''}</div>
        </div>
        
        <div class="patient-info">
          <div><strong>${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}</strong></div>
          <div>Edad: ${patient.age} años</div>
          <div>Fecha: ${currentDate}</div>
          <div>Tipo: ${formData.consultation_type || ''}</div>
        </div>
        
        ${(formData.vital_signs && Object.values(formData.vital_signs).some(v => v)) ? `
        <div class="section">
          <div class="section-title">Signos Vitales</div>
          <div class="compact-row">
            ${formData.vital_signs.height ? `<div>Altura: ${formData.vital_signs.height} cm</div>` : ''}
            ${formData.vital_signs.weight ? `<div>Peso: ${formData.vital_signs.weight} kg</div>` : ''}
            ${formData.vital_signs.temperature ? `<div>Temp: ${formData.vital_signs.temperature}°C</div>` : ''}
          </div>
          <div class="compact-row">
            ${formData.vital_signs.blood_pressure?.systolic ? `<div>PA: ${formData.vital_signs.blood_pressure?.systolic}/${formData.vital_signs.blood_pressure?.diastolic} mmHg</div>` : ''}
            ${formData.vital_signs.heartRate ? `<div>FC: ${formData.vital_signs.heartRate} lpm</div>` : ''}
            ${formData.vital_signs.oxygenSaturation ? `<div>SpO2: ${formData.vital_signs.oxygenSaturation}%</div>` : ''}
          </div>
        </div>
        ` : ''}

        ${dynamicSectionsHTML}
        
        ${(formData.prescriptions && formData.prescriptions.length > 0) ? `
        <div class="section">
          <div class="section-title">Medicamentos Recetados</div>
          ${formData.prescriptions.map((med: any, index: number) => `
            <div style="border-left: 3px solid #007bff; padding-left: 10px; margin-bottom: 10px;">
              <div style="font-weight: bold;">${index + 1}. ${med.name || 'Medicamento'}</div>
              <div style="font-size: 12px; color: #555;">
                ${med.dosage ? `Dosis: ${med.dosage}<br>` : ''}
                ${med.frequency ? `Frecuencia: ${med.frequency}<br>` : ''}
                ${med.duration ? `Duración: ${med.duration}<br>` : ''}
                ${med.instructions ? `Indicaciones: ${med.instructions}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${formData.additional_instructions ? `
        <div class="section">
          <div class="section-title">Instrucciones Adicionales</div>
          <div class="section-content"><p style="white-space: pre-wrap; margin: 0;">${formData.additional_instructions}</p></div>
        </div>
        ` : ''}
        
        ${(formData.next_appointment && (formData.next_appointment.date || formData.next_appointment.time)) ? `
        <div class="section">
          <div class="section-title">Próxima Cita</div>
          <div class="section-content">
            ${formData.next_appointment.date ? `Fecha: ${format(new Date(formData.next_appointment.date), 'dd/MM/yyyy', { locale: es })}` : ''}
            ${formData.next_appointment.time ? ` - Hora: ${formData.next_appointment.time}` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="signature-area" style="margin-top: 50px; text-align: center;">
          <div class="signature-line" style="border-top: 1px solid #000; width: 200px; margin: 0 auto 10px auto;"></div>
          <div>${config.doctorName}</div>
          <div>Cédula Profesional: ${config.professionalId}</div>
        </div>
        
        <div class="footer" style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 10px; color: #777; text-align: center;">
          Documento generado por MindHub • ${currentDate}
        </div>
      </body>
      </html>
    `;
  };

  const generatePrescriptionHTML = (styles: string, config: PrintConfig, patient: Patient, formData: any): string => {
    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: es });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receta Médica - ${patient.first_name} ${patient.paternal_last_name}</title>
        ${styles}
        <style>
          .prescription-header { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
          .rx-symbol { font-size: 24px; font-weight: bold; margin: 10px 0; }
          .medication { margin: 8px 0; padding: 6px; border-left: 3px solid #007bff; }
          .medication-name { font-weight: bold; font-size: 12px; }
          .medication-details { font-size: 10px; margin-left: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${config.clinicName}</div>
          <div class="clinic-info">${config.doctorName} • Cédula Prof: ${config.professionalId}</div>
          <div class="clinic-info">Tel: ${config.phone} • Email: ${config.email}</div>
        </div>
        
        ${config.prescription.includeHeader ? `<div class="prescription-header">RECETA MÉDICA</div>` : ''}
        
        ${config.prescription.includePatientInfo ? `
        <div class="patient-info">
          <div><strong>${patient.first_name} ${patient.paternal_last_name}</strong></div>
          ${config.prescription.includeAge ? `<div>Edad: ${patient.age} años</div>` : ''}
          ${config.prescription.includeDate ? `<div>Fecha: ${currentDate}</div>` : ''}
        </div>
        ` : ''}
        
        ${config.prescription.rxSymbol ? `<div class="rx-symbol">℞</div>` : ''}
        
        ${(formData.prescriptions || []).map((med: any, index: number) => `
          <div class="medication">
            <div class="medication-name">${config.prescription.numberedMedications ? `${index + 1}. ` : ''}${med.name || 'Medicamento'}</div>
            <div class="medication-details">
              ${med.dosage ? `Dosis: ${med.dosage}` : ''}<br>
              ${med.frequency ? `Frecuencia: ${med.frequency}` : ''}<br>
              ${med.duration ? `Duración: ${med.duration}` : ''}<br>
              ${med.instructions ? `Instrucciones: ${med.instructions}` : ''}
            </div>
          </div>
        `).join('')}
        
        <div class="signature-area">
          <div class="signature-line"></div>
          <div>${config.doctorName}</div>
          <div>Cédula Profesional: ${config.professionalId}</div>
        </div>
      </body>
      </html>
    `;
  };

  const generateMedicalRecordHTML = (styles: string, config: PrintConfig, printData: any): string => {
    const { patient, consultations = [] } = printData;
    const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });

    const SECTION_MAP: Record<string, string> = {
      'current_condition': 'Padecimiento Actual',
      'physical_examination': 'Exploración Física',
      'diagnosis': 'Diagnóstico',
      'plan_manejo': 'Plan de Manejo',
      'analisis_conclusiones': 'Análisis y Conclusiones',
      'mental_exam': 'Examen Mental'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Expediente Médico - ${patient.first_name} ${patient.paternal_last_name}</title>
        ${styles}
        <style>
          .record-header { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 20px; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px; }
          .consultation-card { margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
          .consultation-header { background-color: #f8fafc; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
          .consultation-date { font-weight: bold; color: #2d3748; font-size: 14px; }
          .consultation-type { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
          .consultation-body { padding: 15px; }
          .vital-signs-row { display: flex; gap: 20px; margin-bottom: 15px; padding: 8px; background: #fdf2f2; border-radius: 6px; font-size: 12px; }
          .section-block { margin-bottom: 12px; }
          .section-label { font-weight: bold; color: #4a5568; font-size: 13px; margin-bottom: 4px; border-bottom: 1px solid #edf2f7; display: block; }
          .section-text { font-size: 12px; color: #2d3748; line-height: 1.5; text-align: justify; }
          .prescription-box { margin-top: 10px; padding: 10px; border-left: 3px solid #3182ce; background: #ebf8ff; }
          .prescription-title { font-weight: bold; font-size: 12px; margin-bottom: 5px; color: #2b6cb0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${config.clinicName}</div>
          <div class="clinic-info">${config.doctorName} • Cédula Prof: ${config.professionalId}</div>
          <div class="clinic-info">Tel: ${config.phone} • Email: ${config.email}</div>
        </div>
        
        <div class="record-header">EXPEDIENTE CLÍNICO COMPLETO</div>
        
        <div class="patient-info">
          <div><strong>Paciente:</strong> ${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}</div>
          <div><strong>Edad:</strong> ${patient.age} años</div>
          <div><strong>Género:</strong> ${patient.gender || 'No especificado'}</div>
          <div><strong>CURP:</strong> ${patient.curp || 'N/A'}</div>
        </div>

        ${consultations.length === 0 ? '<p style="text-align: center; margin-top: 50px; color: #666;">No hay consultas registradas en el historial.</p>' : ''}

        ${consultations.map((c: any) => {
      const dateStr = c.date ? format(new Date(c.date), 'dd/MM/yyyy', { locale: es }) : 'Fecha no registrada';
      const cleanedData = cleanStructuredData(c.data || {});

      return `
            <div class="consultation-card">
              <div class="consultation-header">
                <span class="consultation-date">Consulta del ${dateStr}</span>
                <span class="consultation-type">${c.consultation_type || 'General'}</span>
              </div>
              <div class="consultation-body">
                ${(c.vital_signs && Object.values(c.vital_signs).some(v => v)) ? `
                  <div class="vital-signs-row">
                    ${c.vital_signs.weight ? `<span><strong>Peso:</strong> ${c.vital_signs.weight}kg</span>` : ''}
                    ${c.vital_signs.height ? `<span><strong>Talla:</strong> ${c.vital_signs.height}cm</span>` : ''}
                    ${c.vital_signs.blood_pressure?.systolic ? `<span><strong>PA:</strong> ${c.vital_signs.blood_pressure.systolic}/${c.vital_signs.blood_pressure.diastolic}</span>` : ''}
                    ${c.vital_signs.heartRate ? `<span><strong>FC:</strong> ${c.vital_signs.heartRate}</span>` : ''}
                  </div>
                ` : ''}

                ${Object.entries(SECTION_MAP).map(([key, label]) => {
        const sectionData = cleanedData ? cleanedData[key] : null;
        if (!sectionData) return '';
        return `
                    <div class="section-block">
                      <span class="section-label">${label}</span>
                      <div class="section-text">${generateNarrativeHTML(sectionData)}</div>
                    </div>
                  `;
      }).join('')}

                ${(c.prescriptions && c.prescriptions.length > 0) ? `
                  <div class="prescription-box">
                    <div class="prescription-title">Plan Farmacológico:</div>
                    ${c.prescriptions.map((p: any) => `
                      <div style="font-size: 11px; margin-bottom: 4px;">
                        • <strong>${p.name}</strong> - ${p.instructions || ''}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
    }).join('')}

        <div class="footer">
          Documento generado automáticamente por MindHub el ${currentDate}
        </div>
      </body>
      </html>
    `;
  };

  const handleNavigateConsultation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentConsultationIndex > 0) {
      const newIndex = currentConsultationIndex - 1;
      setCurrentConsultationIndex(newIndex);
      const consultation = consultations[newIndex];
      setCurrentConsultation(consultation);
      loadConsultationData(consultation);
    } else if (direction === 'next' && currentConsultationIndex < consultations.length - 1) {
      const newIndex = currentConsultationIndex + 1;
      setCurrentConsultationIndex(newIndex);
      const consultation = consultations[newIndex];
      setCurrentConsultation(consultation);
      loadConsultationData(consultation);
    }
  };

  const loadNewConsultation = () => {
    console.log('Loading new consultation form');
    setCurrentConsultation(null);
    setConsultationData(initFormData);
  }

  const handleDeleteConsultation = async (consultationId: string) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await expedixApi.deleteConsultation(consultationId);
          // Swal.fire('Eliminado', 'La consulta ha sido eliminada.', 'success');
          toast.success('Consulta eliminada correctamente.');
          // Recargar la lista de consultas por paciente
          setConsultations(prev => prev.filter(c => c.id !== consultationId));
          // Si la consulta eliminada es la actual, limpiar el formulario
          if (currentConsultation?.id === consultationId) {
            setCurrentConsultation(null);
            loadNewConsultation();
          }
        } catch (error) {
          console.error('Error deleting consultation:', error);
          Swal.fire('Error', 'No se pudo eliminar la consulta.', 'error');
        }
      }
    });
  };

  const updateConsultationFn = (updatedFields: Partial<ConsultationData>) => {
    setConsultationData(prev => ({
      ...prev,
      ...updatedFields
    }));
  };

  const handleDeletePrescription = async () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción borrará la receta actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setShowReceta(false);

      }
    });
  };

  const resetFormForNewConsultation = () => {
    setShowReceta(false);
    setConsultationData(initFormData);
  };

  const startNewConsultation = async () => {
    setLoading(true);
    resetFormForNewConsultation();
    setCurrentConsultationIndex(0);
    setUiMode('detail');
    setLoading(false);
  };

  const toggleExpanded = (id: string) => {
    setExpandedConsultationId(prev => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando consulta...</p>
        </div>
      </div>
    );
  }

  if (uiMode === 'history') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex flex-col">
          {/* Header simple (sin navegación de consultas + sin vista previa/imprimir) */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={onClose}>
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Volver
                </Button>

                <div className="ml-2">
                  <div className="font-semibold text-gray-900">
                    {patient.first_name} {patient.paternal_last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {patient.age} años • #{patient.id.slice(0, 8)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Crear Consulta desde historial */}
                <Button variant="primary" onClick={() => startNewConsultation()}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Crear Consulta
                </Button>
              </div>
            </div>

            {/* Tabs (Consultas / Recetas / Citas) */}
            <div className="mt-4 flex border-b border-gray-200">
              {[
                { id: 'consultations', label: 'Consultas', icon: DocumentTextIcon },
                { id: 'prescriptions', label: 'Recetas', icon: ClockIcon },
                { id: 'appointments', label: 'Citas', icon: CalendarIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHistoryTab(tab.id as SidebarView)}
                  className={`flex-1 py-3 px-2 text-xs font-medium transition-colors ${historyTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <tab.icon className="h-4 w-4 mx-auto mb-1" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto space-y-4">

              {historyTab === 'consultations' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Historial de Consultas</h2>
                    <span className="text-sm text-gray-500">{consultations.length}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {consultations.map((c, idx) => {
                      const motivo = (c.current_condition || '').trim();
                      const dx = (c.diagnosis || '').trim();

                      // Si tienes updated_at en el objeto (muchas veces sí)
                      const updatedAt = (c as any).updated_at || (c as any).updatedAt;

                      // Conteos opcionales (depende cómo venga tu API)
                      const prescriptionsCount =
                        Array.isArray((c as any).prescriptions) ? (c as any).prescriptions.length : 0;

                      const evaluationsCount =
                        Array.isArray((c as any).evaluations) ? (c as any).evaluations.length : 0;

                      const hasVitals =
                        !!(c as any).vital_signs &&
                        typeof (c as any).vital_signs === 'object' &&
                        Object.keys((c as any).vital_signs).length > 0;

                      const durationMinutes = (c as any).duration_minutes ?? (c as any).durationMinutes;

                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleExpanded(c.id)}
                          className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm transition cursor-pointer
                            ${expandedConsultationId === c.id ? 'shadow-md' : 'hover:shadow-md'}
                          `}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-900 truncate">
                                  {c.consultation_type || 'Consulta'}
                                </div>

                                {/* opcional: ID corto */}
                                <span className="text-[11px] text-gray-500">
                                  #{c.id.slice(0, 8)}
                                </span>
                              </div>

                              <div className="text-xs text-gray-600 mt-1">
                                {safeFormatDate(c.consultation_date, 'dd MMM yyyy')}
                              </div>
                            </div>

                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${c.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}
                            >
                              {c.status === 'completed' ? 'Completada' : 'Borrador'}
                            </span>
                            <div className="flex items-center gap-2">
                              <ChevronDownIcon
                                className={`h-4 w-4 text-gray-400 transition-transform ${expandedConsultationId === c.id ? 'rotate-180' : ''
                                  }`}
                              />
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {prescriptionsCount > 0 && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                💊 {prescriptionsCount} receta{prescriptionsCount > 1 ? 's' : ''}
                              </span>
                            )}

                            {evaluationsCount > 0 && (
                              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                🧠 {evaluationsCount} eval.
                              </span>
                            )}

                            {hasVitals && (
                              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                                ❤️ signos vitales
                              </span>
                            )}

                            {typeof durationMinutes === 'number' && durationMinutes > 0 && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                ⏱ {durationMinutes} min
                              </span>
                            )}
                          </div>

                          {/* Body */}
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Motivo</div>
                              <div className="text-gray-800 line-clamp-2">
                                {motivo || 'Sin descripción'}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500 mb-1">Diagnóstico</div>
                              <div className="text-gray-800 line-clamp-2">
                                {dx || 'No registrado'}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500 mb-1">Meta</div>
                              <div className="text-gray-800">
                                {updatedAt
                                  ? `Actualizada ${safeFormatDate(updatedAt, 'dd MMM yyyy')}`
                                  : '—'}
                              </div>
                            </div>
                          </div>

                          {expandedConsultationId === c.id && (
                            <div className="mt-4 border-t border-gray-200 pt-4 space-y-4 text-sm text-gray-800">

                              {motivo && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Motivo de consulta</div>
                                  <p className="whitespace-pre-line">{motivo}</p>
                                </div>
                              )}

                              {dx && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Diagnóstico</div>
                                  <p className="whitespace-pre-line">{dx}</p>
                                </div>
                              )}

                              {(c as any).physical_examination && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Exploración física</div>
                                  <p className="whitespace-pre-line">
                                    {(c as any).physical_examination}
                                  </p>
                                </div>
                              )}

                              {(c as any).notes && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Notas clínicas</div>
                                  <p className="whitespace-pre-line">
                                    {(c as any).notes}
                                  </p>
                                </div>
                              )}

                            </div>
                          )}


                          {/* Footer */}
                          <div className="mt-5 flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openConsultationDetail(c, idx);
                              }}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Ver consulta
                            </Button>

                            <IconButton
                              icon={<TrashIcon className="h-4 w-4 text-red-600" />}
                              size="sm"
                              variant="ghost"
                              ariaLabel="Eliminar consulta"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConsultation(c.id);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {historyTab === 'prescriptions' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recetas</h2>
                    <span className="text-sm text-gray-500">{prescriptions.length}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prescriptions?.map((p) => (
                      <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="font-medium text-gray-900">Receta #{p.id.slice(0, 8)}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {safeFormatDate(p.created_at, 'dd MMM yyyy')}
                        </div>
                        <div className="mt-3 text-sm text-gray-700 line-clamp-3">
                          {/* si luego tienes resumen de meds, aquí */}
                          Receta guardada
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {historyTab === 'appointments' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Citas</h2>
                  </div>

                  {nextAppointment ? (
                    <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-green-600" />
                        <div className="font-medium text-green-900">Próxima cita</div>
                      </div>
                      <div className="text-sm text-green-800 mt-2">
                        {safeFormatDate(nextAppointment.date, 'dd MMMM yyyy')} • {nextAppointment.time}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="text-sm text-gray-700">No hay citas programadas</div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Patient History Navigation */}
      <div className={`${sidebarCollapsed ? 'w-10' : 'w-80'} transition-all duration-300 bg-white shadow-lg border-r border-gray-200 flex flex-col overflow-hidden shrink-0`}>
        {/* Patient Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center justify-between mb-2">
            {!sidebarCollapsed && (
              <Button variant="outline" size="sm" onClick={onClose}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Volver
              </Button>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ml-auto p-1 rounded hover:bg-primary-200 text-primary-700 transition-colors"
              title={sidebarCollapsed ? 'Expandir historial' : 'Colapsar historial'}
            >
              {sidebarCollapsed
                ? <ChevronRightIcon className="h-4 w-4" />
                : <ChevronLeftIcon className="h-4 w-4" />
              }
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-primary-700" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-gray-900">
                    {patient.first_name} {patient.paternal_last_name}
                  </h2>
                  {/* Autosave indicator */}
                  {isAutoSaving && (
                    <div className="flex items-center space-x-1 text-xs text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Guardando...</span>
                    </div>
                  )}
                  {lastSaved && !isAutoSaving && (
                    <div className="text-xs text-green-600 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Guardado {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {patient.age} años • #{patient.id.slice(0, 8)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className={`flex border-b border-gray-200 ${sidebarCollapsed ? 'hidden' : ''}`}>
          {[
            { id: 'consultations', label: 'Consultas', icon: DocumentTextIcon },
            { id: 'prescriptions', label: 'Recetas', icon: ClockIcon },
            { id: 'appointments', label: 'Citas', icon: CalendarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSidebarView(tab.id as SidebarView)}
              className={`flex-1 py-3 px-2 text-xs font-medium transition-colors ${sidebarView === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.icon className="h-4 w-4 mx-auto mb-1" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'hidden' : ''}`}>
          {sidebarView === 'consultations' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Consultas Anteriores</h3>
                <span className="text-sm text-gray-500">{consultations.length}</span>
              </div>
              {consultations.map((consultation, index) => (
                <div
                  key={consultation.id}
                  onClick={() => {
                    setCurrentConsultation(consultation);
                    setCurrentConsultationIndex(index);
                    loadConsultationData(consultation);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${currentConsultation?.id === consultation.id
                    ? 'border-primary-200 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {consultation.consultation_type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${consultation.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {consultation.status === 'completed' ? 'Completada' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {safeFormatDate(consultation.consultation_date, 'dd MMM yyyy')}
                  </p>
                  <p className="text-xs text-gray-700 line-clamp-2">
                    {consultation.diagnosis || consultation.current_condition || 'Sin diagnóstico'}
                  </p>
                  <p className="flex justify-end">
                    <IconButton
                      icon={<TrashIcon className="h-4 w-4 text-red-600" />}
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      ariaLabel="Eliminar consulta"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConsultation(consultation.id);
                      }}
                    />
                  </p>
                </div>
              ))}
            </div>
          )}

          {sidebarView === 'prescriptions' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Recetas</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{prescriptions.length}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrescriptionModal(true)}
                    className="text-xs"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Nueva
                  </Button>
                </div>
              </div>
              {prescriptions?.map((prescription) => (
                <div key={prescription.id} className="p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Receta #{prescription.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {safeFormatDate(prescription.created_at, 'dd MMM')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {/* {prescription.medications.map((med, index) => (
                      <p key={index} className="text-xs text-gray-700">
                        • {med.name} - {med.dosage}
                      </p>
                    ))} */}
                    {/* {prescription.medication_name} */}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sidebarView === 'appointments' && (
            <div className="p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Próximas Citas</h3>
              {nextAppointment ? (
                <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <CalendarIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Próxima cita</span>
                  </div>
                  <p className="text-sm text-green-800">
                    {safeFormatDate(nextAppointment.date, 'dd MMMM yyyy')}
                  </p>
                  <p className="text-sm text-green-700">{nextAppointment.time}</p>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600">No hay citas programadas</p>
                  <Button size="sm" className="mt-2" variant="outline">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Programar cita
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Current Consultation */}
      <div className="flex-1 flex flex-col">
        {/* Header with Navigation */}
        <div className={`bg-white border-b border-gray-200 transition-all duration-300 ${headerCollapsed ? 'px-3 py-1' : 'px-6 py-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!headerCollapsed && (
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentConsultation ? 'Editar Consulta' : 'Nueva Consulta'}
                </h1>
              )}
              {consultations.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateConsultation('prev')}
                    disabled={currentConsultationIndex === 0}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentConsultationIndex + 1} de {consultations.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateConsultation('next')}
                    disabled={currentConsultationIndex === consultations.length - 1}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {headerCollapsed ? (
                <>
                  <button
                    onClick={() => setUiMode('history')}
                    title="Historial"
                    className="p-1.5 rounded border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={startNewConsultation}
                    title="Crear Consulta"
                    className="p-1.5 rounded bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowPreviewDialog(true)}
                    title="Vista previa"
                    className="p-1.5 rounded border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setUiMode('history')}>
                    ← Historial
                  </Button>
                  <Button variant="primary" onClick={startNewConsultation}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Crear Consulta
                  </Button>
                  <Button variant="outline" onClick={() => setShowPreviewDialog(true)}>
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Vista previa
                  </Button>
                </>
              )}

              {/* Print Menu — siempre en DOM para que el dropdown funcione en ambos modos */}
              <div className="relative">
                {headerCollapsed ? (
                  <button
                    onClick={() => setShowPrintMenu(!showPrintMenu)}
                    disabled={!currentConsultation}
                    title="Imprimir"
                    className="p-1.5 rounded border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40"
                  >
                    <PrinterIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowPrintMenu(!showPrintMenu)}
                    disabled={!currentConsultation}
                  >
                    <PrinterIcon className="h-4 w-4 mr-1" />
                    Imprimir
                  </Button>
                )}

                {showPrintMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowPrintMenu(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                      <div className="py-1">
                        <button
                          onClick={handlePrintConsultation}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          Nota de Consulta
                        </button>
                        <button
                          onClick={handlePrintPrescription}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          disabled={!consultationData.prescriptions || consultationData.prescriptions.length === 0}
                        >
                          📋 Receta Médica
                        </button>
                        <button
                          onClick={handlePrintMedicalRecord}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          📁 Expediente Completo
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            setShowPrintConfig(true);
                            setShowPrintMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <CogIcon className="h-4 w-4 mr-2" />
                          Configurar Impresión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Toggle header */}
              <button
                onClick={() => setHeaderCollapsed(!headerCollapsed)}
                title={headerCollapsed ? 'Expandir barra' : 'Compactar barra'}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors"
              >
                {headerCollapsed
                  ? <ChevronDownIcon className="h-4 w-4" />
                  : <ChevronUpIcon className="h-4 w-4" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Consultation Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de consulta
                  </label>
                  <select
                    value={consultationData.consultation_type}
                    defaultValue={consultationData.consultation_type}
                    onChange={(e) => setConsultationData(prev => ({
                      ...prev,
                      consultation_type: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    {
                      consultationsSelectTypes?.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de consulta
                  </label>
                  <input
                    type="date"
                    value={consultationData.consultation_date}
                    onChange={(e) => setConsultationData(prev => ({
                      ...prev,
                      consultation_date: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </Card>

            {/* Antecedentes Médicos */}
            {isVisible('antecedentesMedicos') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🏥 Antecedentes Médicos</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('antecedentesMedicos', sectionModes['antecedentesMedicos'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['antecedentesMedicos'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('antecedentesMedicos', sectionModes['antecedentesMedicos'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['antecedentesMedicos'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['antecedentesMedicos'] === 'canvas' && <CanvasSectionPad sectionKey="antecedentesMedicos" title="Antecedentes Médicos" />}
              {sectionModes['antecedentesMedicos'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['antecedentesMedicos'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, antecedentesMedicos: v }))}
                  placeholder="Escribe libremente sobre antecedentes médicos..."
                  rows={6}
                />
              )}
              {(sectionModes['antecedentesMedicos'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cirugías previas</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_medicos?.cirugias_previas ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, cirugias_previas: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alergias a medicamentos</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_medicos?.alergias_medicamentos ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, alergias_medicamentos: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Otras alergias</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_medicos?.otras_alergias ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, otras_alergias: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Embarazo actual</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_medicos?.embarazo_actual ?? 'NA'} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, embarazo_actual: e.target.value as any } }))}>
                      <option value="NA">NA</option>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lactancia</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_medicos?.lactancia ?? 'NA'} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, lactancia: e.target.value as any } }))}>
                      <option value="NA">NA</option>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Última menstruación</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_medicos?.ultima_menstruacion ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, ultima_menstruacion: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método anticonceptivo</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_medicos?.metodo_anticonceptivo ?? 'NA'} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, metodo_anticonceptivo: e.target.value as any } }))}>
                      <option value="NA">NA</option>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalle método anticonceptivo</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_medicos?.metodo_anticonceptivo_detalle ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, metodo_anticonceptivo_detalle: e.target.value } }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospitalizaciones médicas</label>
                    <DictationTextarea rows={2} value={consultationData.antecedentes_medicos?.hospitalizaciones_medicas ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, hospitalizaciones_medicas: v } }))} placeholder="Hospitalizaciones médicas previas..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enfermedades crónicas</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Diabetes', 'Hipertensión', 'Enfermedad cardíaca', 'Enfermedad pulmonar', 'Enfermedad renal', 'Enfermedad hepática', 'Otra'] as const).map((enf) => (
                        <label key={enf} className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={(consultationData.antecedentes_medicos?.enfermedades_cronicas ?? []).includes(enf)} onChange={(e) => {
                            const current = [...(consultationData.antecedentes_medicos?.enfermedades_cronicas ?? [])];
                            if (e.target.checked) current.push(enf); else current.splice(current.indexOf(enf), 1);
                            setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, enfermedades_cronicas: current as any } }));
                          }} />
                          {enf}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Condiciones neurológicas</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Epilepsia', 'EVC', 'Alzheimer', 'Parkinson', 'Otro'] as const).map((cond) => (
                        <label key={cond} className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={(consultationData.antecedentes_medicos?.condiciones_neurologicas ?? []).includes(cond)} onChange={(e) => {
                            const current = [...(consultationData.antecedentes_medicos?.condiciones_neurologicas ?? [])];
                            if (e.target.checked) current.push(cond); else current.splice(current.indexOf(cond), 1);
                            setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, condiciones_neurologicas: current as any } }));
                          }} />
                          {cond}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enfermedades endocrinas</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Hipotiroidismo', 'Hipertiroidismo', 'SOP', 'Addison'] as const).map((enf) => (
                        <label key={enf} className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={(consultationData.antecedentes_medicos?.enfermedades_endocrinas ?? []).includes(enf)} onChange={(e) => {
                            const current = [...(consultationData.antecedentes_medicos?.enfermedades_endocrinas ?? [])];
                            if (e.target.checked) current.push(enf); else current.splice(current.indexOf(enf), 1);
                            setConsultationData(prev => ({ ...prev, antecedentes_medicos: { ...prev.antecedentes_medicos, enfermedades_endocrinas: current as any } }));
                          }} />
                          {enf}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>)}
            </Card>)}

            {/* Antecedentes Heredofamiliares */}
            {isVisible('antecedentesHeredofamiliares') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">👨‍👩‍👧 Antecedentes Heredofamiliares</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('antecedentesHeredofamiliares', sectionModes['antecedentesHeredofamiliares'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['antecedentesHeredofamiliares'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('antecedentesHeredofamiliares', sectionModes['antecedentesHeredofamiliares'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['antecedentesHeredofamiliares'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['antecedentesHeredofamiliares'] === 'canvas' && <CanvasSectionPad sectionKey="antecedentesHeredofamiliares" title="Antecedentes Heredofamiliares" />}
              {sectionModes['antecedentesHeredofamiliares'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['antecedentesHeredofamiliares'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, antecedentesHeredofamiliares: v }))}
                  placeholder="Escribe libremente sobre antecedentes heredofamiliares..."
                  rows={6}
                />
              )}
              {(sectionModes['antecedentesHeredofamiliares'] ?? null) === null && (<>
                <div className="space-y-3">
                  {([
                    { key: 'derpesion', label: 'Depresión' },
                    { key: 'trastorno_bipolar', label: 'Trastorno Bipolar' },
                    { key: 'esquizofrenia', label: 'Esquizofrenia' },
                    { key: 'ansiedad', label: 'Ansiedad' },
                    { key: 'uso_sustancias', label: 'Uso de Sustancias' },
                    { key: 'suicidio', label: 'Suicidio' },
                    { key: 'tdah', label: 'TDAH' },
                    { key: 'demencia', label: 'Demencia' },
                  ] as { key: keyof typeof consultationData.antecedentes_heredofamiliares; label: string }[]).map(({ key, label }) => {
                    const row = (consultationData.antecedentes_heredofamiliares as any)?.[key]?.[0] ?? { parentesco: '', diagnostico: '', tratamiento: '', suicidio: 'No' };
                    return (
                      <div key={String(key)} className="border rounded p-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{label}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Parentesco</label>
                            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={row.parentesco} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_heredofamiliares: { ...prev.antecedentes_heredofamiliares, [key]: [{ ...row, parentesco: e.target.value }] } }))} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Diagnóstico</label>
                            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={row.diagnostico} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_heredofamiliares: { ...prev.antecedentes_heredofamiliares, [key]: [{ ...row, diagnostico: e.target.value }] } }))} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Tratamiento</label>
                            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={row.tratamiento} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_heredofamiliares: { ...prev.antecedentes_heredofamiliares, [key]: [{ ...row, tratamiento: e.target.value }] } }))} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Suicidio</label>
                            <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={row.suicidio} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_heredofamiliares: { ...prev.antecedentes_heredofamiliares, [key]: [{ ...row, suicidio: e.target.value }] } }))}>
                              <option value="Si">Sí</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enfermedades relevantes en familia</label>
                    <DictationTextarea rows={2} value={consultationData.antecedentes_heredofamiliares?.enfermedades_relevantes ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, antecedentes_heredofamiliares: { ...prev.antecedentes_heredofamiliares, enfermedades_relevantes: v } }))} placeholder="Otras enfermedades relevantes en la familia..." />
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Antecedentes Psiquiátricos */}
            {isVisible('antecedentesPsiquiatricos') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🧬 Antecedentes Psiquiátricos</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('antecedentesPsiquiatricos', sectionModes['antecedentesPsiquiatricos'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['antecedentesPsiquiatricos'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('antecedentesPsiquiatricos', sectionModes['antecedentesPsiquiatricos'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['antecedentesPsiquiatricos'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['antecedentesPsiquiatricos'] === 'canvas' && <CanvasSectionPad sectionKey="antecedentesPsiquiatricos" title="Antecedentes Psiquiátricos" />}
              {sectionModes['antecedentesPsiquiatricos'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['antecedentesPsiquiatricos'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, antecedentesPsiquiatricos: v }))}
                  placeholder="Escribe libremente sobre antecedentes psiquiátricos..."
                  rows={6}
                />
              )}
              {(sectionModes['antecedentesPsiquiatricos'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospitalizaciones previas</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_psiquiatricos?.hospitalizaciones_previas ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_psiquiatricos: { ...prev.antecedentes_psiquiatricos, hospitalizaciones_previas: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivos de hospitalización</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_psiquiatricos?.motivos_hospitalizacion ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_psiquiatricos: { ...prev.antecedentes_psiquiatricos, motivos_hospitalizacion: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Psiquiatra tratante</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_psiquiatricos?.psiquiatra_tratante ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_psiquiatricos: { ...prev.antecedentes_psiquiatricos, psiquiatra_tratante: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Psicoterapias previas</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_psiquiatricos?.psicoterapias_previas ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_psiquiatricos: { ...prev.antecedentes_psiquiatricos, psicoterapias_previas: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TEC</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_psiquiatricos?.tec ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_psiquiatricos: { ...prev.antecedentes_psiquiatricos, tec: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EMT</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.antecedentes_psiquiatricos?.emt ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_psiquiatricos: { ...prev.antecedentes_psiquiatricos, emt: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnósticos previos (detalle)</label>
                    <DictationTextarea rows={2} value={consultationData.antecedentes_psiquiatricos?.diagnosticos_previos_detalle ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, antecedentes_psiquiatricos: { ...prev.antecedentes_psiquiatricos, diagnosticos_previos_detalle: v } }))} placeholder="Detalles de diagnósticos previos..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Otros tratamientos somáticos</label>
                    <DictationTextarea rows={2} value={consultationData.antecedentes_psiquiatricos?.otros_tratamientos_somaticos ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, antecedentes_psiquiatricos: { ...prev.antecedentes_psiquiatricos, otros_tratamientos_somaticos: v } }))} placeholder="Otros tratamientos somáticos..." />
                  </div>
                  <div className="md:col-span-2 border-t pt-3">
                    <h4 className="font-medium text-gray-700 mb-2 text-sm">Último medicamento psiquiátrico</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {(['medicamento', 'dosis', 'durecion', 'respuesta', 'motivo_suspension'] as const).map((field) => (
                        <div key={field}>
                          <label className="block text-xs text-gray-500 mb-1 capitalize">{field.replace('_', ' ')}</label>
                          <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={(consultationData.antecedentes_psiquiatricos?.tratamientos_previos_detalle as any)?.[field] ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, antecedentes_psiquiatricos: { ...prev.antecedentes_psiquiatricos, tratamientos_previos_detalle: { ...prev.antecedentes_psiquiatricos?.tratamientos_previos_detalle, [field]: e.target.value } } }))} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Historia Personal y Social */}
            {isVisible('historiaPersonalSocial') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">📋 Historia Personal y Social</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('historiaPersonalSocial', sectionModes['historiaPersonalSocial'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['historiaPersonalSocial'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('historiaPersonalSocial', sectionModes['historiaPersonalSocial'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['historiaPersonalSocial'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['historiaPersonalSocial'] === 'canvas' && <CanvasSectionPad sectionKey="historiaPersonalSocial" title="Historia Personal y Social" />}
              {sectionModes['historiaPersonalSocial'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['historiaPersonalSocial'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, historiaPersonalSocial: v }))}
                  placeholder="Escribe libremente sobre historia personal y social..."
                  rows={6}
                />
              )}
              {(sectionModes['historiaPersonalSocial'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Embarazo y parto</label>
                    <DictationTextarea rows={2} value={consultationData.historia_personal_social?.embarazo_parto ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, embarazo_parto: v } }))} placeholder="Antecedentes perinatales..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desarrollo psicomotor</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.historia_personal_social?.desarrollo_psicomotor ?? 'Normal'} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, desarrollo_psicomotor: e.target.value as any } }))}>
                      <option value="Normal">Normal</option>
                      <option value="Retraso">Retraso</option>
                      <option value="Desconocido">Desconocido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Historia escolar</label>
                    <DictationTextarea rows={2} value={consultationData.historia_personal_social?.historia_escolar ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, historia_escolar: v } }))} placeholder="Historia académica..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Problemas de aprendizaje</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.historia_personal_social?.problemas_aprendizaje ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, problemas_aprendizaje: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                      <option value="Desconocido">Desconocido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Historia laboral</label>
                    <DictationTextarea rows={2} value={consultationData.historia_personal_social?.historia_laboral ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, historia_laboral: v } }))} placeholder="Historia laboral..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Situación laboral actual</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.historia_personal_social?.situacion_laboral_actual ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, situacion_laboral_actual: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relación actual</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.historia_personal_social?.relacion_actual ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, relacion_actual: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Convivencia actual</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.historia_personal_social?.convivencia_actual ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, convivencia_actual: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apoyo social (0-10)</label>
                    <input type="number" min={0} max={10} className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.historia_personal_social?.apoyo_social ?? 5} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, apoyo_social: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Situación económica</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.historia_personal_social?.situacion_economica ?? 'Buena'} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, situacion_economica: e.target.value as any } }))}>
                      <option value="Mala">Mala</option>
                      <option value="Precaria">Precaria</option>
                      <option value="Buena">Buena</option>
                      <option value="Excelente">Excelente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Situación legal</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.historia_personal_social?.situacion_legal ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, situacion_legal: e.target.value as any } }))}>
                      <option value="Si">Sí (problemas legales)</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trauma infantil</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.historia_personal_social?.trauma_infantil ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, trauma_infantil: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  {([
                    { key: 'abuso_fisico', label: 'Abuso físico' },
                    { key: 'abuso_sexual', label: 'Abuso sexual' },
                    { key: 'negligencia', label: 'Negligencia' },
                    { key: 'voilencia_domestica', label: 'Violencia doméstica' },
                  ] as { key: keyof typeof consultationData.historia_personal_social; label: string }[]).map(({ key, label }) => (
                    <div key={String(key)}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={(consultationData.historia_personal_social as any)?.[key] ?? 'No interrogado'} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, [key]: e.target.value } }))}>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                        <option value="Prefiere no decir">Prefiere no decir</option>
                        <option value="No interrogado">No interrogado</option>
                      </select>
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intereses y pasatiempos</label>
                    <DictationTextarea rows={2} value={consultationData.historia_personal_social?.intereses_pasatiempos ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, intereses_pasatiempos: v } }))} placeholder="Intereses y pasatiempos del paciente..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fortalezas del paciente</label>
                    <DictationTextarea rows={2} value={consultationData.historia_personal_social?.fortalezas_paciente ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, historia_personal_social: { ...prev.historia_personal_social, fortalezas_paciente: v } }))} placeholder="Fortalezas identificadas..." />
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Historia de Riesgo */}
            {isVisible('historiaRiesgo') && (<Card className="p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">⚠️ Historia de Riesgo</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('historiaRiesgo', sectionModes['historiaRiesgo'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['historiaRiesgo'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('historiaRiesgo', sectionModes['historiaRiesgo'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['historiaRiesgo'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['historiaRiesgo'] === 'canvas' && <CanvasSectionPad sectionKey="historiaRiesgo" title="Historia de Riesgo" />}
              {sectionModes['historiaRiesgo'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['historiaRiesgo'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, historiaRiesgo: v }))}
                  placeholder="Escribe libremente sobre historia de riesgo..."
                  rows={6}
                />
              )}
              {(sectionModes['historiaRiesgo'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    { key: 'ideacion_suicida_previa', label: 'Ideación suicida previa', opts: ['Si', 'No', 'Desconocido'] },
                    { key: 'intentos_suicidio_previos', label: 'Intentos de suicidio previos', opts: ['Si', 'No'] },
                    { key: 'autolesiones_no_suicidas', label: 'Autolesiones no suicidas', opts: ['Si', 'No'] },
                    { key: 'ideacion_homicida_previa', label: 'Ideación homicida previa', opts: ['Si', 'No'] },
                    { key: 'conductas_violentas_previas', label: 'Conductas violentas previas', opts: ['Si', 'No'] },
                    { key: 'acceso_armas', label: 'Acceso a armas', opts: ['Si', 'No'] },
                    { key: 'acceso_medicamentos_cantidad', label: 'Acceso a medicamentos (cantidad letal)', opts: ['Si', 'No'] },
                    { key: 'acceso_medios_letales', label: 'Acceso a medios letales', opts: ['Si', 'No'] },
                    { key: 'conducta_agresiva', label: 'Conducta agresiva', opts: ['Si', 'No'] },
                    { key: 'uso_sustancias_recienta', label: 'Uso de sustancias reciente', opts: ['Si', 'No'] },
                    { key: 'suspension_medicamentos', label: 'Suspensión de medicamentos', opts: ['Si', 'No'] },
                    { key: 'estresores_identificados', label: 'Estresores identificados', opts: ['Si', 'No'] },
                    { key: 'perdidas_recientes', label: 'Pérdidas recientes', opts: ['Si', 'No'] },
                  ] as { key: keyof typeof consultationData.historia_riesgo; label: string; opts: string[] }[]).map(({ key, label, opts }) => (
                    <div key={String(key)}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={(consultationData.historia_riesgo as any)?.[key] ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_riesgo: { ...prev.historia_riesgo, [key]: e.target.value } }))}>
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de riesgo</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.historia_riesgo?.nivel_riesgo ?? 'NA'} onChange={(e) => setConsultationData(prev => ({ ...prev, historia_riesgo: { ...prev.historia_riesgo, nivel_riesgo: e.target.value as any } }))}>
                      <option value="NA">NA</option>
                      <option value="Bajo">Bajo</option>
                      <option value="Moderado">Moderado</option>
                      <option value="Alto">Alto</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan de seguridad</label>
                    <DictationTextarea rows={2} value={consultationData.historia_riesgo?.plan_seguridad ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, historia_riesgo: { ...prev.historia_riesgo, plan_seguridad: v } }))} placeholder="Plan de seguridad establecido..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eventos precipitantes</label>
                    <DictationTextarea rows={2} value={consultationData.historia_riesgo?.eventos_precipitantes ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, historia_riesgo: { ...prev.historia_riesgo, eventos_precipitantes: v } }))} placeholder="Eventos precipitantes identificados..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalle intentos de suicidio</label>
                    <DictationTextarea rows={2} value={consultationData.historia_riesgo?.intentos_suicidio_detalle ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, historia_riesgo: { ...prev.historia_riesgo, intentos_suicidio_detalle: v } }))} placeholder="Detalle..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalle autolesiones no suicidas</label>
                    <DictationTextarea rows={2} value={consultationData.historia_riesgo?.autolesiones_no_suicidas_detalle ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, historia_riesgo: { ...prev.historia_riesgo, autolesiones_no_suicidas_detalle: v } }))} placeholder="Detalle..." />
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Uso de Sustancias */}
            {isVisible('usoSustancias') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">💊 Uso de Sustancias</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('usoSustancias', sectionModes['usoSustancias'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['usoSustancias'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('usoSustancias', sectionModes['usoSustancias'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['usoSustancias'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['usoSustancias'] === 'canvas' && <CanvasSectionPad sectionKey="usoSustancias" title="Uso de Sustancias" />}
              {sectionModes['usoSustancias'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['usoSustancias'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, usoSustancias: v }))}
                  placeholder="Escribe libremente sobre uso de sustancias..."
                  rows={6}
                />
              )}
              {(sectionModes['usoSustancias'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tabaco</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.uso_sustancias?.tabaco ?? 'Nunca'} onChange={(e) => setConsultationData(prev => ({ ...prev, uso_sustancias: { ...prev.uso_sustancias, tabaco: e.target.value as any } }))}>
                      <option value="Nunca">Nunca</option>
                      <option value="Exfumador">Exfumador</option>
                      <option value="Actual">Actual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alcohol</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.uso_sustancias?.alcohol ?? 'Ocasional'} onChange={(e) => setConsultationData(prev => ({ ...prev, uso_sustancias: { ...prev.uso_sustancias, alcohol: e.target.value as any } }))}>
                      <option value="Ocasional">Ocasional</option>
                      <option value="Social">Social</option>
                      <option value="Abuso">Abuso</option>
                      <option value="Dependencia">Dependencia</option>
                    </select>
                  </div>
                  {([
                    { key: 'cannabis', freqKey: 'cannabis_frecuencia', label: 'Cannabis' },
                    { key: 'cocaina', freqKey: 'cocaina_frecuencia', label: 'Cocaína' },
                    { key: 'opioides', freqKey: 'opioides_frecuencia', label: 'Opioides' },
                    { key: 'benzodiacepinas', freqKey: 'benzodiacepinas_frecuencia', label: 'Benzodiacepinas' },
                  ] as { key: keyof typeof consultationData.uso_sustancias; freqKey: keyof typeof consultationData.uso_sustancias; label: string }[]).map(({ key, freqKey, label }) => (
                    <div key={String(key)} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">{label}</label>
                      <div className="flex gap-2">
                        <select className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm" value={(consultationData.uso_sustancias as any)?.[key] ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, uso_sustancias: { ...prev.uso_sustancias, [key]: e.target.value } }))}>
                          <option value="Si">Sí</option>
                          <option value="No">No</option>
                        </select>
                        <select className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm" value={(consultationData.uso_sustancias as any)?.[freqKey] ?? 'Previo'} onChange={(e) => setConsultationData(prev => ({ ...prev, uso_sustancias: { ...prev.uso_sustancias, [freqKey]: e.target.value } }))}>
                          <option value="Previo">Previo</option>
                          <option value="Ocasional">Ocasional</option>
                          <option value="Abuso">Abuso</option>
                          <option value="Dependencia">Dependencia</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Otras sustancias</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.uso_sustancias?.otras_sustancias ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, uso_sustancias: { ...prev.uso_sustancias, otras_sustancias: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalle otras sustancias</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.uso_sustancias?.otras_sustancias_detalle ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, uso_sustancias: { ...prev.uso_sustancias, otras_sustancias_detalle: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Última intoxicación</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.uso_sustancias?.ultima_intoxicacion ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, uso_sustancias: { ...prev.uso_sustancias, ultima_intoxicacion: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inicio de abstinencia</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.uso_sustancias?.inicio_abstinencia ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, uso_sustancias: { ...prev.uso_sustancias, inicio_abstinencia: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internamientos previos por sustancias</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.uso_sustancias?.internamientos_previos_sustancias ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, uso_sustancias: { ...prev.uso_sustancias, internamientos_previos_sustancias: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Estado de Inicio */}
            {isVisible('estadoInicio') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🌡️ Estado al Inicio de la Sesión</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('estadoInicio', sectionModes['estadoInicio'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['estadoInicio'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('estadoInicio', sectionModes['estadoInicio'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['estadoInicio'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['estadoInicio'] === 'canvas' && <CanvasSectionPad sectionKey="estadoInicio" title="Estado al Inicio de la Sesión" />}
              {sectionModes['estadoInicio'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['estadoInicio'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, estadoInicio: v }))}
                  placeholder="Escribe libremente sobre el estado al inicio de la sesión..."
                  rows={6}
                />
              )}
              {(sectionModes['estadoInicio'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado emocional</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.estado_inicio?.estado_emocional ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, estado_inicio: { ...prev.estado_inicio, estado_emocional: e.target.value } }))} placeholder="Estado emocional al inicio..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de malestar (0-10)</label>
                    <input type="number" min={0} max={10} className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.estado_inicio?.nivel_malestar ?? 5} onChange={(e) => setConsultationData(prev => ({ ...prev, estado_inicio: { ...prev.estado_inicio, nivel_malestar: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eventos desde última sesión</label>
                    <DictationTextarea rows={2} value={consultationData.estado_inicio?.eventos_ultima_sesion ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, estado_inicio: { ...prev.estado_inicio, eventos_ultima_sesion: v } }))} placeholder="Eventos relevantes desde la última sesión..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué trae hoy?</label>
                    <DictationTextarea rows={2} value={consultationData.estado_inicio?.trae_hoy ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, estado_inicio: { ...prev.estado_inicio, trae_hoy: v } }))} placeholder="Tema principal que trae el paciente hoy..." />
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Current Condition */}
            {isVisible('currentCondition') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Padecimiento Actual</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('currentCondition', sectionModes['currentCondition'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['currentCondition'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('currentCondition', sectionModes['currentCondition'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['currentCondition'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['currentCondition'] === 'canvas' && <CanvasSectionPad sectionKey="currentCondition" title="Padecimiento Actual" />}
              {sectionModes['currentCondition'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['currentCondition'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, currentCondition: v }))}
                  placeholder="Describe el padecimiento actual del paciente..."
                  rows={6}
                />
              )}
              {(sectionModes['currentCondition'] ?? null) === null && (<>
                <DictationTextarea
                  value={consultationData.current_condition}
                  onChange={(value) => setConsultationData(prev => ({
                    ...prev,
                    current_condition: value
                  }))}
                  placeholder="Describe el padecimiento actual del paciente..."
                  rows={4}
                />
              </>)}
            </Card>)}
            {/* Sintomatología Actual */}
            {isVisible('sintomatologiaActual') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🩺 Sintomatología Actual</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('sintomatologiaActual', sectionModes['sintomatologiaActual'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['sintomatologiaActual'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('sintomatologiaActual', sectionModes['sintomatologiaActual'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['sintomatologiaActual'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['sintomatologiaActual'] === 'canvas' && <CanvasSectionPad sectionKey="sintomatologiaActual" title="Sintomatología Actual" />}
              {sectionModes['sintomatologiaActual'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['sintomatologiaActual'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, sintomatologiaActual: v }))}
                  placeholder="Escribe libremente sobre la sintomatología actual..."
                  rows={6}
                />
              )}
              {(sectionModes['sintomatologiaActual'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de consulta</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.motivo_consulta ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, motivo_consulta: v } }))} placeholder="Motivo de consulta..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Queja principal</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.queja_principal ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, queja_principal: v } }))} placeholder="Queja principal..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Síntoma principal</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.sintoma_principal ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, sintoma_principal: v } }))} placeholder="Síntoma principal..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duración de síntomas</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.sintomatologia_actual?.duracion_sintomas ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, duracion_sintomas: e.target.value } }))} placeholder="Ej. 3 meses..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referido por</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.sintomatologia_actual?.referido_por ?? 'Autoreferencia'} onChange={(e) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, referido_por: e.target.value as any } }))}>
                      <option value="Autoreferencia">Autoreferencia</option>
                      <option value="Médico">Médico</option>
                      <option value="Psicologo">Psicólogo</option>
                      <option value="Familiar">Familiar</option>
                      <option value="Otro Profesional">Otro Profesional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de quien refiere</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.sintomatologia_actual?.nombre_refiere ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, nombre_refiere: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso de enfermedad</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.sintomatologia_actual?.curso_enfermedad ?? 'Agudo'} onChange={(e) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, curso_enfermedad: e.target.value as any } }))}>
                      <option value="Agudo">Agudo</option>
                      <option value="Subagudo">Subagudo</option>
                      <option value="Crónico">Crónico</option>
                      <option value="Episódico">Episódico</option>
                      <option value="Progresivo">Progresivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Impacto funcional</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.sintomatologia_actual?.impacto_fucional ?? 'Nulo'} onChange={(e) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, impacto_fucional: e.target.value as any } }))}>
                      <option value="Nulo">Nulo</option>
                      <option value="Mínimo">Mínimo</option>
                      <option value="Leve">Leve</option>
                      <option value="Moderado">Moderado</option>
                      <option value="Severo">Severo</option>
                      <option value="Incapacitante">Incapacitante</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sueño</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.sintomatologia_actual?.sueno ?? 'Regular'} onChange={(e) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, sueno: e.target.value as any } }))}>
                      <option value="Regular">Regular</option>
                      <option value="Irregular">Irregular</option>
                      <option value="Bueno">Bueno</option>
                      <option value="Insomnio">Insomnio</option>
                      <option value="Invertido">Invertido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apetito</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.sintomatologia_actual?.apetito ?? 'Bueno'} onChange={(e) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, apetito: e.target.value as any } }))}>
                      <option value="Bueno">Bueno</option>
                      <option value="Bajo">Bajo</option>
                      <option value="Alto">Alto</option>
                      <option value="Problematico">Problemático</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Energía</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.sintomatologia_actual?.energia ?? 'Buena'} onChange={(e) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, energia: e.target.value as any } }))}>
                      <option value="Buena">Buena</option>
                      <option value="Baja">Baja</option>
                      <option value="Alta">Alta</option>
                      <option value="Irregular">Irregular</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Terapia anterior</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.sintomatologia_actual?.terapia_antes ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, terapia_antes: e.target.value as any } }))}>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Historia de síntomas actuales</label>
                    <DictationTextarea rows={3} value={consultationData.sintomatologia_actual?.historia_sintomas_actuales ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, historia_sintomas_actuales: v } }))} placeholder="Historia detallada..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Factores precipitantes</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.factores_precipitantes ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, factores_precipitantes: v } }))} placeholder="Factores precipitantes identificados..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas cardinales</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.sintomas_cardinales ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, sintomas_cardinales: v } }))} placeholder="Síntomas cardinales..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pensamientos asociados</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.pensamientos_asociados ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, pensamientos_asociados: v } }))} placeholder="Pensamientos asociados..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emociones asociadas</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.emociones_asociadas ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, emociones_asociadas: v } }))} placeholder="Emociones asociadas..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conductas asociadas</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.conductas_asociadas ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, conductas_asociadas: v } }))} placeholder="Conductas asociadas..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consecuencias</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.consecuencias ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, consecuencias: v } }))} placeholder="Consecuencias identificadas..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intentos previos de solución</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.intentos_previos_solucion ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, intentos_previos_solucion: v } }))} placeholder="Intentos previos de solución..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de funcionamiento</label>
                    <DictationTextarea rows={2} value={consultationData.sintomatologia_actual?.nivel_funcionamiento ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, sintomatologia_actual: { ...prev.sintomatologia_actual, nivel_funcionamiento: v } }))} placeholder="Nivel de funcionamiento global..." />
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Vital Signs */}
            {isVisible('vitalSigns') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Signos Vitales</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('vitalSigns', sectionModes['vitalSigns'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['vitalSigns'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('vitalSigns', sectionModes['vitalSigns'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['vitalSigns'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['vitalSigns'] === 'canvas' && <CanvasSectionPad sectionKey="vitalSigns" title="Signos Vitales" />}
              {sectionModes['vitalSigns'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['vitalSigns'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, vitalSigns: v }))}
                  placeholder="Escribe libremente sobre los signos vitales..."
                  rows={6}
                />
              )}
              {(sectionModes['vitalSigns'] ?? null) === null && (<>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      value={consultationData.vital_signs.height}
                      onChange={(e) => setConsultationData(prev => ({
                        ...prev,
                        vital_signs: { ...prev.vital_signs, height: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      value={consultationData.vital_signs.weight}
                      onChange={(e) => setConsultationData(prev => ({
                        ...prev,
                        vital_signs: { ...prev.vital_signs, weight: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperatura (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={consultationData.vital_signs.temperature}
                      onChange={(e) => setConsultationData(prev => ({
                        ...prev,
                        vital_signs: { ...prev.vital_signs, temperature: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presión Arterial
                    </label>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="Sistólica"
                          value={consultationData.vital_signs.blood_pressure?.systolic}
                          onChange={(e) =>
                            setConsultationData(prev => ({
                              ...prev,
                              vital_signs: {
                                ...prev.vital_signs,
                                blood_pressure: {
                                  ...prev.vital_signs.blood_pressure,
                                  systolic: e.target.value
                                }
                              }
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="Diastólica"
                          value={consultationData.vital_signs.blood_pressure?.diastolic}
                          onChange={(e) =>
                            setConsultationData(prev => ({
                              ...prev,
                              vital_signs: {
                                ...prev.vital_signs,
                                blood_pressure: {
                                  ...prev.vital_signs.blood_pressure,
                                  diastolic: e.target.value
                                }
                              }
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frecuencia Cardíaca
                    </label>
                    <input
                      type="number"
                      value={consultationData.vital_signs.heartRate}
                      onChange={(e) => setConsultationData(prev => ({
                        ...prev,
                        vital_signs: { ...prev.vital_signs, heartRate: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saturación O2 (%)
                    </label>
                    <input
                      type="number"
                      value={consultationData.vital_signs.oxygenSaturation}
                      onChange={(e) => setConsultationData(prev => ({
                        ...prev,
                        vital_signs: { ...prev.vital_signs, oxygenSaturation: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Physical Examination */}
            {isVisible('physicalExamination') && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Exploración Física</h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSectionMode('physicalExamination', sectionModes['physicalExamination'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['physicalExamination'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                    <button type="button" onClick={() => setSectionMode('physicalExamination', sectionModes['physicalExamination'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['physicalExamination'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                  </div>
                </div>
                {sectionModes['physicalExamination'] === 'canvas' && <CanvasSectionPad sectionKey="physicalExamination" title="Exploración Física" />}
                {sectionModes['physicalExamination'] === 'text' && (
                  <DictationTextarea
                    value={sectionFreeText['physicalExamination'] ?? ''}
                    onChange={(v) => setSectionFreeText(prev => ({ ...prev, physicalExamination: v }))}
                    placeholder="Describe los hallazgos de la exploración física..."
                    rows={6}
                  />
                )}
                {(sectionModes['physicalExamination'] ?? null) === null && (<>
                  <DictationTextarea
                    label="Exploración Física"
                    value={consultationData.physical_examination}
                    onChange={(next) =>
                      setConsultationData(prev => ({ ...prev, physical_examination: next }))
                    }
                    placeholder="Describe los hallazgos..."
                    rows={5}
                  />
                </>)}
              </Card>)}
            {/* Mental Exam - Modern Dropdown Interface */}
            {isVisible('mentalExam') && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    🧠 Examen Mental
                    <span className="text-sm font-normal text-gray-500 ml-2">Selección estructurada con opciones personalizables</span>
                  </h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSectionMode('mentalExam', sectionModes['mentalExam'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['mentalExam'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                    <button type="button" onClick={() => setSectionMode('mentalExam', sectionModes['mentalExam'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['mentalExam'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                  </div>
                </div>
                {sectionModes['mentalExam'] === 'canvas' && <CanvasSectionPad sectionKey="mentalExam" title="Examen Mental" />}
                {sectionModes['mentalExam'] === 'text' && (
                  <DictationTextarea
                    value={sectionFreeText['mentalExam'] ?? ''}
                    onChange={(v) => setSectionFreeText(prev => ({ ...prev, mentalExam: v }))}
                    placeholder="Escribe libremente el examen mental..."
                    rows={6}
                  />
                )}
                {(sectionModes['mentalExam'] ?? null) === null && (<>

                  <div className="space-y-6">
                    {/* Apariencia */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">1. Apariencia</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Aspecto General</label>
                          <select
                            value={consultationData.mental_exam.apariencia.aspecto_general}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: {
                                ...prev.mental_exam,
                                apariencia: {
                                  ...prev.mental_exam.apariencia,
                                  aspecto_general: e.target.value as typeof prev.mental_exam.apariencia.aspecto_general
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Adecuado">Bien cuidado</option>
                            <option value="Descuidado">Descuidado</option>
                            <option value="Desaliñado">Desaliñado</option>
                            <option value="Extravagante">Extravagante</option>
                            <option value="Raro">Raro</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Higiene</label>
                          <select
                            value={consultationData.mental_exam.apariencia.higiene}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, apariencia: { ...prev.mental_exam.apariencia, higiene: e.target.value as typeof prev.mental_exam.apariencia.higiene } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Buena">Buena</option>
                            <option value="Regular">Regular</option>
                            <option value="Mala">Mala</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Vestimenta</label>
                          <select
                            value={consultationData.mental_exam.apariencia.vestimenta}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, apariencia: { ...prev.mental_exam.apariencia, vestimenta: e.target.value as typeof prev.mental_exam.apariencia.vestimenta } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Apropiada para contexto">Apropiada para contexto</option>
                            <option value="Inapropiada para clima">Inapropiada para clima</option>
                            <option value="Inapropiada para situación">Inapropiada para situación</option>
                            <option value="Descuidada">Descuidada</option>
                            <option value="Desaliñada">Desaliñada</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Edad aparente vs cronológica</label>
                          <select
                            value={consultationData.mental_exam.apariencia.edad_aparente}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, apariencia: { ...prev.mental_exam.apariencia, edad_aparente: e.target.value as typeof prev.mental_exam.apariencia.edad_aparente } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Aparenta edad cronológica">Aparenta edad cronológica</option>
                            <option value="Aparenta mayor edad">Aparenta mayor edad</option>
                            <option value="Aparenta menor edad">Aparenta menor edad</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Complexión</label>
                          <select
                            value={consultationData.mental_exam.apariencia.complexion}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, apariencia: { ...prev.mental_exam.apariencia, complexion: e.target.value as typeof prev.mental_exam.apariencia.complexion } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Delgado">Delgado</option>
                            <option value="Sobrepeso">Sobrepeso</option>
                            <option value="Obesidad">Obesidad</option>
                            <option value="Caquectico">Caquectico</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Facies</label>
                          <select
                            value={consultationData.mental_exam.apariencia.facies}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, apariencia: { ...prev.mental_exam.apariencia, facies: e.target.value as typeof prev.mental_exam.apariencia.facies } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Ansiosa">Ansiosa</option>
                            <option value="Deprimida">Deprimida</option>
                            <option value="Inexpresiva">Inexpresiva</option>
                            <option value="Dolorosa">Dolorosa</option>
                            <option value="Eufórica">Eufórica</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Características distintivas</label>
                          <textarea
                            value={consultationData.mental_exam.apariencia.caracteristicas_distintivas}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, apariencia: { ...prev.mental_exam.apariencia, caracteristicas_distintivas: e.target.value } }
                            }))}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Detalles específicos sobre apariencia y comportamiento..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Conducta y actividad psicomotora */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">2. Conducta Y Actividad Psicomotora</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de actividad psicomotora</label>
                          <select
                            value={consultationData.mental_exam.conducta.nivel_psicomotor}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, conducta: { ...prev.mental_exam.conducta, nivel_psicomotor: e.target.value as typeof prev.mental_exam.conducta.nivel_psicomotor } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Aumentada (inquietud)">Aumentada (inquietud)</option>
                            <option value="Aumentada (agitación)">Aumentada (agitación)</option>
                            <option value="Disminuida (enlentecimiento)">Disminuida (enlentecimiento)</option>
                            <option value="Disminuida (estupor)">Disminuida (estupor)</option>
                            <option value="Catatonía">Catatonía</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contacto Visual</label>
                          <select
                            value={consultationData.mental_exam.conducta.contacto_visual}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, conducta: { ...prev.mental_exam.conducta, contacto_visual: e.target.value as typeof prev.mental_exam.conducta.contacto_visual } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Adecuando">Adecuado</option>
                            <option value="Evitativo">Evitativo</option>
                            <option value="Fijo/penetrante">Fijo/penetrante</option>
                            <option value="Ausente">Ausente</option>
                            <option value="Variable">Variable</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Postura</label>
                          <select
                            value={consultationData.mental_exam.conducta.postura}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, conducta: { ...prev.mental_exam.conducta, postura: e.target.value as typeof prev.mental_exam.conducta.postura } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Relajada">Relajada</option>
                            <option value="Tensa">Tensa</option>
                            <option value="Encorvada">Encorvada</option>
                            <option value="Rígida">Rígida</option>
                            <option value="Rara">Rara</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Marcha</label>
                          <select
                            value={consultationData.mental_exam.conducta.marcha}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, conducta: { ...prev.mental_exam.conducta, marcha: e.target.value as typeof prev.mental_exam.conducta.marcha } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Lenta">Lenta</option>
                            <option value="Rápida">Rápida</option>
                            <option value="Atáxica">Atáxica</option>
                            <option value="Parkinsoniana">Parkinsoniana</option>
                            <option value="No evaluada">No evaluada</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Marcha</label>
                          <select
                            value={consultationData.mental_exam.conducta.marcha}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, conducta: { ...prev.mental_exam.conducta, marcha: e.target.value as typeof prev.mental_exam.conducta.marcha } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Lenta">Lenta</option>
                            <option value="Rápida">Rápida</option>
                            <option value="Atáxica">Atáxica</option>
                            <option value="Parkinsoniana">Parkinsoniana</option>
                            <option value="No evaluada">No evaluada</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Movimientos anormales</label>
                          <select
                            value={consultationData.mental_exam.conducta.movimientos_anormales}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, conducta: { ...prev.mental_exam.conducta, movimientos_anormales: e.target.value as typeof prev.mental_exam.conducta.movimientos_anormales } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Ninguno">Ninguna</option>
                            <option value="Temblor">Temblor</option>
                            <option value="Discinesias">Discinesias</option>
                            <option value="Tics">Tics</option>
                            <option value="Manierismos">Manierismos</option>
                            <option value="Estereotipias">Estereotipias</option>
                            <option value="Acatisia">Acatisia</option>
                            <option value="Distonía">Distonía</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cooperación con la entrevista</label>
                          <select
                            value={consultationData.mental_exam.conducta.cooperacion_entrevista}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, conducta: { ...prev.mental_exam.conducta, cooperacion_entrevista: e.target.value as typeof prev.mental_exam.conducta.cooperacion_entrevista } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Cooperador">Cooperador</option>
                            <option value="Parcialmente cooperador">Parcialmente cooperador</option>
                            <option value="No cooperador">No cooperador</option>
                            <option value="Hostil">Hostil</option>
                            <option value="Oposicionista">Oposicionista</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Actitud hacia el entrevistador */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">3. Actitud Hacia el Entrevistador</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Actitud General</label>
                          <select
                            value={consultationData.mental_exam.actitud.actitud_general}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, actitud: { ...prev.mental_exam.actitud, actitud_general: e.target.value as typeof prev.mental_exam.actitud.actitud_general } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Colaboradora">Colaboradora</option>
                            <option value="Amable">Amable</option>
                            <option value="Suspicaz">Suspicaz</option>
                            <option value="Irritable / Hostil">Irritable / Hostil</option>
                            <option value="Indiferente">Indiferente</option>
                            <option value="Defensiva">Defensiva</option>
                            <option value="Seductora">Seductora</option>
                            <option value="Manipuladora">Manipuladora</option>
                            <option value="Demandante">Demandante</option>
                            <option value="Evasiva">Evasiva</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rapport</label>
                          <select
                            value={consultationData.mental_exam.actitud.rapport}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, actitud: { ...prev.mental_exam.actitud, rapport: e.target.value as typeof prev.mental_exam.actitud.rapport } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Fácil de establecer">Fácil de establecer</option>
                            <option value="Difícil de establecer">Difícil de establecer</option>
                            <option value="No se logró establecer / no valorable">No se logró establecer / no valorable</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Habla y Lenguaje */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">4. Habla y Lenguaje</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Velocidad</label>
                          <select
                            value={consultationData.mental_exam.habla.velocidad}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, habla: { ...prev.mental_exam.habla, velocidad: e.target.value as typeof prev.mental_exam.habla.velocidad } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Rápida">Rápida</option>
                            <option value="Lenta">Lenta</option>
                            <option value="Presionada (taquilalia)">Presionada (taquilalia)</option>
                            <option value="Bradilalia">Bradilalia</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Volumen</label>
                          <select
                            value={consultationData.mental_exam.habla.volumen}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, habla: { ...prev.mental_exam.habla, volumen: e.target.value as typeof prev.mental_exam.habla.volumen } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Alto">Alto</option>
                            <option value="Bajo">Bajo</option>
                            <option value="Susurrante">Susurrante</option>
                            <option value="Variable">Variable</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tono</label>
                          <select
                            value={consultationData.mental_exam.habla.tono}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, habla: { ...prev.mental_exam.habla, tono: e.target.value as typeof prev.mental_exam.habla.tono } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Monótono">Monótono</option>
                            <option value="Variable">Variable</option>
                            <option value="Elevado">Elevado</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Articulacón</label>
                          <select
                            value={consultationData.mental_exam.habla.articulacion}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, habla: { ...prev.mental_exam.habla, articulacion: e.target.value as typeof prev.mental_exam.habla.articulacion } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Clara">Clara</option>
                            <option value="Disártrica">Disártrica</option>
                            <option value="Farfullante">Farfullante</option>
                            <option value="Musitante">Musitante</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                          <select
                            value={consultationData.mental_exam.habla.cantidad}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, habla: { ...prev.mental_exam.habla, cantidad: e.target.value as typeof prev.mental_exam.habla.cantidad } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Verborreico (logorrea)">Verborreico (logorrea)</option>
                            <option value="Lacónico">Lacónico</option>
                            <option value="Mutismo">Mutismo</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Latencia de respuesta</label>
                          <select
                            value={consultationData.mental_exam.habla.latencia_respuesta}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, habla: { ...prev.mental_exam.habla, latencia_respuesta: e.target.value as typeof prev.mental_exam.habla.latencia_respuesta } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Aumentada">Aumentada</option>
                            <option value="Disminuida">Disminuida</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Prosodia</label>
                          <select
                            value={consultationData.mental_exam.habla.prosodia}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, habla: { ...prev.mental_exam.habla, prosodia: e.target.value as typeof prev.mental_exam.habla.prosodia } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Aprosódica">Aprosódica</option>
                            <option value="Disprosódica">Disprosódica</option>
                          </select>
                        </div>

                      </div>
                    </div>

                    {/* Afecto */}
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">5. Afecto</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de afecto observado</label>
                          <select
                            value={consultationData.mental_exam.afecto.tipo}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, afecto: { ...prev.mental_exam.afecto, tipo: e.target.value as typeof prev.mental_exam.afecto.tipo } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Eutímico">Eutímico</option>
                            <option value="Ansioso">Ansioso</option>
                            <option value="Deprimido">Deprimido</option>
                            <option value="Irritable">Irritable</option>
                            <option value="Eufórico">Eufórico</option>
                            <option value="Disfórico">Disfórico</option>
                            <option value="Apático">Apático</option>
                            <option value="Lábil">Lábil</option>
                            <option value="Aplanado">Aplanado</option>
                            <option value="Embotado">Embotado</option>
                            <option value="Inapropiado">Inapropiado</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rango afectivo</label>
                          <select
                            value={consultationData.mental_exam.afecto.rango_afectivo}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, afecto: { ...prev.mental_exam.afecto, rango_afectivo: e.target.value as typeof prev.mental_exam.afecto.rango_afectivo } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Amplio">Amplio</option>
                            <option value="Normal">Normal</option>
                            <option value="Restringido">Restringido</option>
                            <option value="Constreñido">Constreñido</option>
                            <option value="Aplanado">Aplanado</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Intensidad</label>
                          <select
                            value={consultationData.mental_exam.afecto.intensidad}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, afecto: { ...prev.mental_exam.afecto, intensidad: e.target.value as typeof prev.mental_exam.afecto.intensidad } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Aumentada">Aumentada</option>
                            <option value="Disminuida">Disminuida</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reactividad</label>
                          <select
                            value={consultationData.mental_exam.afecto.reactividad}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, afecto: { ...prev.mental_exam.afecto, reactividad: e.target.value as typeof prev.mental_exam.afecto.reactividad } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Reactivo">Reactivo</option>
                            <option value="Poco reactivo">Poco reactivo</option>
                            <option value="No reactivo">No reactivo</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Congruencia con contenido</label>
                          <select
                            value={consultationData.mental_exam.afecto.congruencia}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, afecto: { ...prev.mental_exam.afecto, congruencia: e.target.value as typeof prev.mental_exam.afecto.congruencia } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Congruente">Congruente</option>
                            <option value="Incongruente">Incongruente</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Estabilidad</label>
                          <select
                            value={consultationData.mental_exam.afecto.estabilidad}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, afecto: { ...prev.mental_exam.afecto, estabilidad: e.target.value as typeof prev.mental_exam.afecto.estabilidad } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Estable">Estable</option>
                            <option value="Lábil">Lábil</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Estado de Ánimo */}
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">6. Estado de Ánimo</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Estado de ánimo subjetivo (palabras del paciente)</label>
                          <textarea
                            value={consultationData.mental_exam.animo.estado_animo}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, animo: { ...prev.mental_exam.animo, estado_animo: e.target.value } }
                            }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Ej: 'Me siento triste y sin energía'..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nivel subjetivo (escala)</label>
                          <input
                            type="number"
                            value={consultationData.mental_exam.animo.nivel}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, animo: { ...prev.mental_exam.animo, nivel: parseInt(e.target.value) } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="0 (peor estado) a 10 (mejor estado)"
                            min={0}
                            max={10}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Concordancia ánimo-afecto</label>
                          <select
                            value={consultationData.mental_exam.animo.concordancia_animo_afecto}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, animo: { ...prev.mental_exam.animo, concordancia_animo_afecto: e.target.value as typeof prev.mental_exam.animo.concordancia_animo_afecto } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Concordante">Concordante</option>
                            <option value="Discordante">Discordante</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Pensamiento Proceso (Forma) */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">7. Pensamiento Proceso (Forma)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Curso del Pensamiento</label>
                          <select
                            value={consultationData.mental_exam.pensamiento_proceso.curso_pensamiento}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, pensamiento_proceso: { ...prev.mental_exam.pensamiento_proceso, curso_pensamiento: e.target.value as typeof prev.mental_exam.pensamiento_proceso.curso_pensamiento } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Lógico y coherente">Lógico y coherente</option>
                            <option value="Circunstancial">Circunstancial</option>
                            <option value="Tangencial">Tangencial</option>
                            <option value="Laxo (asociaciones laxas)">Laxo (asociaciones laxas)</option>
                            <option value="Fuga de ideas">Fuga de ideas</option>
                            <option value="Perseverativo">Perseverativo</option>
                            <option value="Bloqueo del pensamiento">Bloqueo del pensamiento</option>
                            <option value="Incoherente">Incoherente</option>
                            <option value="Disgregado">Disgregado</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Velocidad del Pensamiento</label>
                          <select
                            value={consultationData.mental_exam.pensamiento_proceso.velocidad_pensamiento}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, pensamiento_proceso: { ...prev.mental_exam.pensamiento_proceso, velocidad_pensamiento: e.target.value as typeof prev.mental_exam.pensamiento_proceso.velocidad_pensamiento } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Lógico y coherente">Normal</option>
                            <option value="Acelerado (taquipsiquia)">Acelerado (taquipsiquia)</option>
                            <option value="Enlentecido (bradipsiquia)">Enlentecido (bradipsiquia)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contenido del Discurso</label>
                          <select
                            value={consultationData.mental_exam.pensamiento_proceso.contenido_discurso}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, pensamiento_proceso: { ...prev.mental_exam.pensamiento_proceso, contenido_discurso: e.target.value as typeof prev.mental_exam.pensamiento_proceso.contenido_discurso } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Apropiado y relevante">Apropiado y relevante</option>
                            <option value="Pobre">Pobre</option>
                            <option value="Vago">Vago</option>
                            <option value="Perseverativo">Perseverativo</option>
                            <option value="Tangencial">Tangencial</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Pensamiento Contenido */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">8. Pensamiento Contenido</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ideas de Muerte</label>
                          <select
                            value={consultationData.mental_exam.pensamiento_contenido.ideas_muerte}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, pensamiento_contenido: { ...prev.mental_exam.pensamiento_contenido, ideas_muerte: e.target.value as typeof prev.mental_exam.pensamiento_contenido.ideas_muerte } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Ausentes">Ausentes</option>
                            <option value="Presentes pasivas">Presentes pasivas</option>
                            <option value="Presentes activas">Presentes activas</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ideación Suicida</label>
                          <select
                            value={consultationData.mental_exam.pensamiento_contenido.ideacion_suicida}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, pensamiento_contenido: { ...prev.mental_exam.pensamiento_contenido, ideacion_suicida: e.target.value as typeof prev.mental_exam.pensamiento_contenido.ideacion_suicida } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Ausentes">Ausentes</option>
                            <option value="Pasiva sin plan">Pasiva sin plan</option>
                            <option value="Activa sin plan">Activa sin plan</option>
                            <option value="Activa con plan sin intención">Activa con plan sin intención</option>
                            <option value="Activa con plan e intención">Activa con plan e intención</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Plan Suicida</label>
                          <textarea
                            value={consultationData.mental_exam.pensamiento_contenido.plan_suicida}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, pensamiento_contenido: { ...prev.mental_exam.pensamiento_contenido, plan_suicida: e.target.value } }
                            }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Descripción detallada del plan suicida (si aplica)..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ideación Homocida</label>
                          <select
                            value={consultationData.mental_exam.pensamiento_contenido.ideacion_homicida}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, pensamiento_contenido: { ...prev.mental_exam.pensamiento_contenido, ideacion_homicida: e.target.value as typeof prev.mental_exam.pensamiento_contenido.ideacion_homicida } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Ausente">Ausente</option>
                            <option value="Presente sin plan">Presente sin plan</option>
                            <option value="Presente con plan">Presente con plan</option>
                          </select>
                        </div>

                        {/* checkbox multiple */}
                        <MultiSelectChips
                          label="Delirios"
                          options={checkboxesDelirios} // [{value,label}]
                          value={consultationData?.mental_exam?.pensamiento_contenido?.delirios ?? []}
                          onChange={(next) => {
                            setConsultationData((prev) => ({
                              ...prev,
                              mental_exam: {
                                ...(prev.mental_exam ?? {}),
                                pensamiento_contenido: {
                                  ...(prev.mental_exam?.pensamiento_contenido ?? {}),
                                  delirios: next, // ✅ array de strings
                                },
                              },
                            }));
                          }}
                          placeholder="Selecciona uno o varios..."
                        />

                        {consultationData.mental_exam.pensamiento_contenido.delirios.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Caracteristicas de Delirios</label>
                            <textarea
                              value={consultationData.mental_exam.pensamiento_contenido.caracteristicas_delirios}
                              onChange={(e) => setConsultationData(prev => ({
                                ...prev,
                                mental_exam: { ...prev.mental_exam, pensamiento_contenido: { ...prev.mental_exam.pensamiento_contenido, caracteristicas_delirios: e.target.value as typeof prev.mental_exam.pensamiento_contenido.caracteristicas_delirios } }
                              }))}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Descripción detallada de características de delirios (si aplica)..."
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ideas Sobrevaloradas</label>
                          <select
                            value={consultationData.mental_exam.pensamiento_contenido.ideas_sobrevaloradas}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, pensamiento_contenido: { ...prev.mental_exam.pensamiento_contenido, ideas_sobrevaloradas: e.target.value as typeof prev.mental_exam.pensamiento_contenido.ideas_sobrevaloradas } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Ausentes">Ausentes</option>
                            <option value="Presentes">Presentes</option>
                          </select>
                        </div>

                        <div>
                          <MultiSelectChips
                            label='Obseciones'
                            options={checkboxesTiposObsesiones} // [{value,label}]
                            value={consultationData?.mental_exam?.pensamiento_contenido?.tipo_obsesiones ?? []}
                            onChange={(next) => {
                              setConsultationData((prev) => ({
                                ...prev,
                                mental_exam: {
                                  ...(prev.mental_exam ?? {}),
                                  pensamiento_contenido: {
                                    ...(prev.mental_exam?.pensamiento_contenido ?? {}),
                                    tipo_obsesiones: next, // ✅ array de strings
                                  },
                                },
                              }));
                            }}
                            placeholder="Selecciona uno o varios..."
                          />
                        </div>

                        <div>
                          <MultiSelectChips
                            label='Compulsiones'
                            options={checkboxesTiposCompulsiones} // [{value,label}]
                            value={consultationData?.mental_exam?.pensamiento_contenido?.tipo_compulsiones ?? []}
                            onChange={(next) => {
                              setConsultationData((prev) => ({
                                ...prev,
                                mental_exam: {
                                  ...(prev.mental_exam ?? {}),
                                  pensamiento_contenido: {
                                    ...(prev.mental_exam?.pensamiento_contenido ?? {}),
                                    tipo_compulsiones: next, // ✅ array de strings
                                  },
                                },
                              }));
                            }}
                            placeholder="Selecciona uno o varios..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fobias</label>
                          <select
                            value={consultationData.mental_exam.pensamiento_contenido.fobias}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, pensamiento_contenido: { ...prev.mental_exam.pensamiento_contenido, fobias: e.target.value as typeof prev.mental_exam.pensamiento_contenido.fobias } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Ausentes">Ausentes</option>
                            <option value="Presentes">Presentes</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Preocupaciones Excesivas</label>
                          <select
                            value={consultationData.mental_exam.pensamiento_contenido.preocupaciones_excesivas}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, pensamiento_contenido: { ...prev.mental_exam.pensamiento_contenido, preocupaciones_excesivas: e.target.value as typeof prev.mental_exam.pensamiento_contenido.preocupaciones_excesivas } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Ausentes">Ausentes</option>
                            <option value="Presentes">Presentes</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Percepcion */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">9. Percepción</h4>
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alucinaciones Auditivas</label>
                          <select
                            value={consultationData.mental_exam.percepcion.alucinaciones_auditivas}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, alucinaciones_auditivas: e.target.value as typeof prev.mental_exam.percepcion.alucinaciones_auditivas } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            {
                              optionsAlucinacionesAuditivas.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))
                            }
                          </select>
                        </div>
                        {consultationData.mental_exam.percepcion.alucinaciones_auditivas !== 'Ausentes' && consultationData.mental_exam.percepcion.alucinaciones_auditivas !== 'No evaluado' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Características de Alucinaciones Auditivas</label>
                            <textarea
                              value={consultationData.mental_exam.percepcion.alucinaciones_auditivas_caracteristicas}
                              onChange={(e) => setConsultationData(prev => ({
                                ...prev,
                                mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, alucinaciones_auditivas_caracteristicas: e.target.value } }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alucinaciones Visuales</label>
                          <select
                            value={consultationData.mental_exam.percepcion.alucinaciones_visuales}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, alucinaciones_visuales: e.target.value as typeof prev.mental_exam.percepcion.alucinaciones_visuales } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            {
                              optionsAlucinacionesVisuales.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))
                            }
                          </select>
                        </div>
                        {consultationData.mental_exam.percepcion.alucinaciones_visuales !== 'Ausentes' && consultationData.mental_exam.percepcion.alucinaciones_visuales !== 'No evaluado' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Características de Alucinaciones Visuales</label>
                            <textarea
                              value={consultationData.mental_exam.percepcion.alucinaciones_visuales_caracteristicas}
                              onChange={(e) => setConsultationData(prev => ({
                                ...prev,
                                mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, alucinaciones_visuales_caracteristicas: e.target.value } }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alucinaciones Táctiles</label>
                          <select
                            value={consultationData.mental_exam.percepcion.alucinaciones_tactiles}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, alucinaciones_tactiles: e.target.value as typeof prev.mental_exam.percepcion.alucinaciones_tactiles } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            {
                              optionsAlucinacionesTactiles.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))
                            }
                          </select>
                        </div>
                        {consultationData.mental_exam.percepcion.alucinaciones_tactiles !== 'Ausentes' && consultationData.mental_exam.percepcion.alucinaciones_tactiles !== 'No evaluado' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Características de Alucinaciones Táctiles</label>
                            <textarea
                              value={consultationData.mental_exam.percepcion.alucinaciones_tactiles_caracteristicas}
                              onChange={(e) => setConsultationData(prev => ({
                                ...prev,
                                mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, alucinaciones_tactiles_caracteristicas: e.target.value } }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alucinaciones Olfativas</label>
                          <select
                            value={consultationData.mental_exam.percepcion.alucinaciones_olfatorias}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, alucinaciones_olfatorias: e.target.value as typeof prev.mental_exam.percepcion.alucinaciones_olfatorias } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            {
                              optionsAlucinacionesOlfatorias.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))
                            }
                          </select>
                        </div>
                        {consultationData.mental_exam.percepcion.alucinaciones_olfatorias !== 'Ausentes' && consultationData.mental_exam.percepcion.alucinaciones_olfatorias !== 'No evaluado' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Características de Alucinaciones Olfativas</label>
                            <textarea
                              value={consultationData.mental_exam.percepcion.alucinaciones_olfatorias_caracteristicas}
                              onChange={(e) => setConsultationData(prev => ({
                                ...prev,
                                mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, alucinaciones_olfatorias_caracteristicas: e.target.value } }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alucinaciones Gustativas</label>
                          <select
                            value={consultationData.mental_exam.percepcion.alucinaciones_gustativas}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, alucinaciones_gustativas: e.target.value as typeof prev.mental_exam.percepcion.alucinaciones_gustativas } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            {
                              optionsAlucinacionesGustativas.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))
                            }
                          </select>
                        </div>
                        {consultationData.mental_exam.percepcion.alucinaciones_gustativas !== 'Ausentes' && consultationData.mental_exam.percepcion.alucinaciones_gustativas !== 'No evaluado' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Características de Alucinaciones Gustativas</label>
                            <textarea
                              value={consultationData.mental_exam.percepcion.alucinaciones_gustativas_caracteristicas}
                              onChange={(e) => setConsultationData(prev => ({
                                ...prev,
                                mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, alucinaciones_gustativas_caracteristicas: e.target.value } }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ilusiones</label>
                          <select
                            value={consultationData.mental_exam.percepcion.ilusiones}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, ilusiones: e.target.value as typeof prev.mental_exam.percepcion.ilusiones } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            {optionsIlusiones.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        {consultationData.mental_exam.percepcion.ilusiones !== 'Ausentes' && consultationData.mental_exam.percepcion.ilusiones !== 'No evaluado' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Características de Ilusiones</label>
                            <textarea
                              value={consultationData.mental_exam.percepcion.ilusiones_caracteristicas}
                              onChange={(e) => setConsultationData(prev => ({
                                ...prev,
                                mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, ilusiones_caracteristicas: e.target.value } }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Despersonalización</label>
                          <select
                            value={consultationData.mental_exam.percepcion.despersonalizacion}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, despersonalizacion: e.target.value as typeof prev.mental_exam.percepcion.despersonalizacion } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            {optionsDespersonalizacion.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        {consultationData.mental_exam.percepcion.despersonalizacion !== 'Ausente' && consultationData.mental_exam.percepcion.despersonalizacion !== 'No evaluado' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Características de Despersonalización</label>
                            <textarea
                              value={consultationData.mental_exam.percepcion.despersonalizacion_caracteristicas}
                              onChange={(e) => setConsultationData(prev => ({
                                ...prev,
                                mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, despersonalizacion_caracteristicas: e.target.value } }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Desrealización</label>
                          <select
                            value={consultationData.mental_exam.percepcion.desrealizacion}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, desrealizacion: e.target.value as typeof prev.mental_exam.percepcion.desrealizacion } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            {optionsDesrealizacion.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        {consultationData.mental_exam.percepcion.desrealizacion !== 'Ausente' && consultationData.mental_exam.percepcion.desrealizacion !== 'No evaluado' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Características de Desrealización</label>
                            <textarea
                              value={consultationData.mental_exam.percepcion.desrealizacion_caracteristicas}
                              onChange={(e) => setConsultationData(prev => ({
                                ...prev,
                                mental_exam: { ...prev.mental_exam, percepcion: { ...prev.mental_exam.percepcion, desrealizacion_caracteristicas: e.target.value } }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cognición */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">10. Cognición</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de conciencia</label>
                          <select
                            value={consultationData.mental_exam.cognicion.nivel_conciencia}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, nivel_conciencia: e.target.value as typeof prev.mental_exam.cognicion.nivel_conciencia } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Alerta">Alerta</option>
                            <option value="Somnoliento">Somnoliento</option>
                            <option value="Estuporoso">Estuporoso</option>
                            <option value="Comatoso">Comatoso</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Orientación en Persona</label>
                          <select
                            value={consultationData.mental_exam.cognicion.orientacion_persona}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, orientacion_persona: e.target.value as typeof prev.mental_exam.cognicion.orientacion_persona } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Orientado">Orientado</option>
                            <option value="Desorientado">Desorientado</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Orientación en Lugar</label>
                          <select
                            value={consultationData.mental_exam.cognicion.orientacion_lugar}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, orientacion_lugar: e.target.value as typeof prev.mental_exam.cognicion.orientacion_lugar } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Orientado">Orientado</option>
                            <option value="Desorientado">Desorientado</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Orientación en Tiempo</label>
                          <select
                            value={consultationData.mental_exam.cognicion.orientacion_tiempo}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, orientacion_tiempo: e.target.value as typeof prev.mental_exam.cognicion.orientacion_tiempo } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Orientado">Orientado</option>
                            <option value="Desorientado">Desorientado</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Orientación en Situación/Circunstancia</label>
                          <select
                            value={consultationData.mental_exam.cognicion.orientacion_situacion}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, orientacion_situacion: e.target.value as typeof prev.mental_exam.cognicion.orientacion_situacion } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Orientado">Orientado</option>
                            <option value="Desorientado">Desorientado</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Atención</label>
                          <select
                            value={consultationData.mental_exam.cognicion.atencion}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, atencion: e.target.value as typeof prev.mental_exam.cognicion.atencion } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Hipoprosexia">Hipoprosexia</option>
                            <option value="Hiperprosexia">Hiperprosexia</option>
                            <option value="Distraibilidad">Distraibilidad</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Concentración</label>
                          <select
                            value={consultationData.mental_exam.cognicion.concentracion}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, concentracion: e.target.value as typeof prev.mental_exam.cognicion.concentracion } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Adecuada">Adecuada</option>
                            <option value="Disminuida">Disminuida</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Memoria inmediata (registro)</label>
                          <select
                            value={consultationData.mental_exam.cognicion.memoria_inmediata}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, memoria_inmediata: e.target.value as typeof prev.mental_exam.cognicion.memoria_inmediata } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Conservada">Conservada</option>
                            <option value="Alterada">Alterada</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Memoria reciente (corto plazo)</label>
                          <select
                            value={consultationData.mental_exam.cognicion.memoria_reciente}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, memoria_reciente: e.target.value as typeof prev.mental_exam.cognicion.memoria_reciente } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Conservada">Conservada</option>
                            <option value="Alterada">Alterada</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Memoria remota (largo plazo)</label>
                          <select
                            value={consultationData.mental_exam.cognicion.memoria_remota}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, memoria_remota: e.target.value as typeof prev.mental_exam.cognicion.memoria_remota } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Conservada">Conservada</option>
                            <option value="Alterada">Alterada</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Capacidad de abstracción</label>
                          <select
                            value={consultationData.mental_exam.cognicion.capacidad_abstracta}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, capacidad_abstracta: e.target.value as typeof prev.mental_exam.cognicion.capacidad_abstracta } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Normal">Normal</option>
                            <option value="Concreta">Concreta</option>
                            <option value="Alterada">Alterada</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cálculo</label>
                          <select
                            value={consultationData.mental_exam.cognicion.calculo}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, calculo: e.target.value as typeof prev.mental_exam.cognicion.calculo } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Conservado">Conservado</option>
                            <option value="Alterado">Alterado</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Inteligencia clínica estimada</label>
                          <select
                            value={consultationData.mental_exam.cognicion.inteligencia_clinica_estimada}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, inteligencia_clinica_estimada: e.target.value as typeof prev.mental_exam.cognicion.inteligencia_clinica_estimada } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Superior">Superior</option>
                            <option value="Normal">Normal</option>
                            <option value="Limítrofe">Limítrofe</option>
                            <option value="Deficiente leve">Deficiente leve</option>
                            <option value="Deficiente moderada">Deficiente moderada</option>
                            <option value="Deficiente severa">Deficiente severa</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Funciones ejecutivas (impresión clínica)</label>
                          <select
                            value={consultationData.mental_exam.cognicion.funciones_ejecutivas}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, funciones_ejecutivas: e.target.value as typeof prev.mental_exam.cognicion.funciones_ejecutivas } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Sin alteraciones aparentes">Sin alteraciones aparentes</option>
                            <option value="Con alteraciones aparentes">Con alteraciones aparentes</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Insight Juicio */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">11. Insight y Juicio</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Insight (conciencia de enfermedad)</label>
                          <select
                            value={consultationData.mental_exam.cognicion.nivel_conciencia}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, cognicion: { ...prev.mental_exam.cognicion, nivel_conciencia: e.target.value as typeof prev.mental_exam.cognicion.nivel_conciencia } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Completo">Completo</option>
                            <option value="Parcial">Parcial</option>
                            <option value="Ausente (nulo)">Ausente (nulo)</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium tet-gray-700 mb-2">Grado de insight</label>
                          <textarea
                            value={consultationData.mental_exam.insight_juicio.grado}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, insight_juicio: { ...prev.mental_exam.insight_juicio, grado: e.target.value } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Juicio</label>
                          <select
                            value={consultationData.mental_exam.insight_juicio.juicio}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, insight_juicio: { ...prev.mental_exam.insight_juicio, juicio: e.target.value as typeof prev.mental_exam.insight_juicio.juicio } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Conservado">Conservado</option>
                            <option value="Parcialmente alterado">Parcialmente alterado</option>
                            <option value="Suavemente alterado">Suavemente alterado</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Juicio Social</label>
                          <select
                            value={consultationData.mental_exam.insight_juicio.juicio_social}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, insight_juicio: { ...prev.mental_exam.insight_juicio, juicio_social: e.target.value as typeof prev.mental_exam.insight_juicio.juicio_social } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Adecuado">Adecuado</option>
                            <option value="Inadecuado">Inadecuado</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Control de Impulsos</label>
                          <select
                            value={consultationData.mental_exam.insight_juicio.control_impulsos}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, insight_juicio: { ...prev.mental_exam.insight_juicio, control_impulsos: e.target.value as typeof prev.mental_exam.insight_juicio.control_impulsos } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Adecuado">Adecuado</option>
                            <option value="Parcialmente alterado">Parcialmente alterado</option>
                            <option value="Severamente alterado">Severamente alterado</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Funcionalidad */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-4">12. Funcionalidad</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de funcionamiento global (GAF/EEAG)</label>
                          {/* escala numerica */}
                          <input
                            type="number"
                            value={consultationData.mental_exam.funcionalidad.nivel_global}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, funcionalidad: { ...prev.mental_exam.funcionalidad, nivel_global: e.target.value ? parseInt(e.target.value) : 0 } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            min={0}
                            max={100}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Funcionalidad laboral/escolar</label>
                          <select
                            value={consultationData.mental_exam.funcionalidad.laboral_escolar}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, funcionalidad: { ...prev.mental_exam.funcionalidad, laboral_escolar: e.target.value as typeof prev.mental_exam.funcionalidad.laboral_escolar } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Sin afectación">Sin afectación</option>
                            <option value="Afectación leve">Dificultades leves</option>
                            <option value="Afectación moderada">Dificultades moderadas</option>
                            <option value="Afectación severa">Dificultades severas</option>
                            <option value="Incapacitante">Incapacitante</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Funcionalidad social</label>
                          <select
                            value={consultationData.mental_exam.funcionalidad.funcionalidad_social}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, funcionalidad: { ...prev.mental_exam.funcionalidad, funcionalidad_social: e.target.value as typeof prev.mental_exam.funcionalidad.funcionalidad_social } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Sin afectación">Sin afectación</option>
                            <option value="Afectación leve">Afectación leve</option>
                            <option value="Afectación moderada">Afectación moderada</option>
                            <option value="Afectación severa">Afectación severa</option>
                            <option value="Aislamiento severo">Aislamiento severo</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Autocuidado</label>
                          <select
                            value={consultationData.mental_exam.funcionalidad.autocuidado}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              mental_exam: { ...prev.mental_exam, funcionalidad: { ...prev.mental_exam.funcionalidad, autocuidado: e.target.value as typeof prev.mental_exam.funcionalidad.autocuidado } }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Independiente">Independiente</option>
                            <option value="Requiere supervisión ocasional">Requiere supervisión ocasional</option>
                            <option value="Requiere supervisión constante">Requiere supervisión constante</option>
                            <option value="Requiere asistencia parcial">Requiere asistencia parcial</option>
                            <option value="Dependiente total">Dependiente total</option>
                            <option value="No evaluado">No evaluado</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </>)}
              </Card>)}
            {/* Diagnosis - Advanced Selector with CIE-10/DSM-5TR Integration */}
            {isVisible('diagnosis') && (<Card className="p-6">
              <DiagnosesSelector
                selectedDiagnoses={consultationData.diagnoses}
                onChange={(diagnoses) => {
                  setConsultationData(prev => ({
                    ...prev,
                    diagnoses,
                    // Mantener compatibilidad con el campo diagnosis antiguo
                    diagnosis: diagnoses.length > 0
                      ? diagnoses.find(d => d.isPrimary)?.description || diagnoses[0].description
                      : ''
                  }));
                }}
                maxDiagnoses={8}
                allowCustom={true}
                className=""
              />
            </Card>)}
            {isVisible('evaluations') && (<Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluaciones</h3>
              <EvaluationsMultiSelect
                evaluationCatalog={evaluationCatalog}
                selected={consultationData.evaluations ?? []}
                onChange={(next) =>
                  setConsultationData(prev => ({
                    ...prev,
                    evaluations: next,
                  }))
                }
              />
            </Card>)}
            {isVisible('labResults') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🧪 Resultados de Estudios de Laboratorio</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('labResults', sectionModes['labResults'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['labResults'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('labResults', sectionModes['labResults'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['labResults'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['labResults'] === 'canvas' && <CanvasSectionPad sectionKey="labResults" title="Resultados de Estudios de Laboratorio" />}
              {sectionModes['labResults'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['labResults'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, labResults: v }))}
                  placeholder="Escribe libremente sobre los resultados de laboratorio..."
                  rows={6}
                />
              )}
              {(sectionModes['labResults'] ?? null) === null && (<>
                {consultationData.otros_campos.estudios_laboratorio.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Sin resultados registrados.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border px-3 py-2 text-left">Estudio</th>
                          <th className="border px-3 py-2 text-left">Categoría</th>
                          <th className="border px-3 py-2 text-left">Valor</th>
                          <th className="border px-3 py-2 text-left">Unidad</th>
                          <th className="border px-3 py-2 text-left">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultationData.otros_campos.estudios_laboratorio.map((lab, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border px-3 py-2">{lab.name}</td>
                            <td className="border px-3 py-2 text-gray-500">{lab.category}</td>
                            <td className="border px-3 py-2 font-medium">{lab.value ?? '—'}</td>
                            <td className="border px-3 py-2 text-gray-500">{lab.unit ?? '—'}</td>
                            <td className="border px-3 py-2 text-gray-500">{lab.takenAt ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-3">
                  <textarea
                    placeholder="Notas sobre resultados de laboratorio..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </>)}
            </Card>)}
            {/* Resultados de Gabinete (nuevo) */}
            {isVisible('resultadosGabinete') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🩻 Resultados de Gabinete</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('resultadosGabinete', sectionModes['resultadosGabinete'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['resultadosGabinete'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('resultadosGabinete', sectionModes['resultadosGabinete'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['resultadosGabinete'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['resultadosGabinete'] === 'canvas' && <CanvasSectionPad sectionKey="resultadosGabinete" title="Resultados de Gabinete" />}
              {sectionModes['resultadosGabinete'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['resultadosGabinete'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, resultadosGabinete: v }))}
                  placeholder="Resultados de estudios de gabinete (TAC, RM, ultrasonido, etc.)..."
                  rows={6}
                />
              )}
              {(sectionModes['resultadosGabinete'] ?? null) === null && (<>
                <DictationTextarea
                  value={(consultationData as any).resultados_gabinete ?? ''}
                  onChange={(value) => setConsultationData(prev => ({ ...prev, resultados_gabinete: value } as any))}
                  placeholder="Resultados de estudios de gabinete (TAC, RM, ultrasonido, etc.)..."
                  rows={5}
                />
              </>)}
            </Card>)}
            {/* Análisis y Conclusiones */}
            {isVisible('analisisConclusiones') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🔬 Análisis y Conclusiones</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('analisisConclusiones', sectionModes['analisisConclusiones'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['analisisConclusiones'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('analisisConclusiones', sectionModes['analisisConclusiones'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['analisisConclusiones'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['analisisConclusiones'] === 'canvas' && <CanvasSectionPad sectionKey="analisisConclusiones" title="Análisis y Conclusiones" />}
              {sectionModes['analisisConclusiones'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['analisisConclusiones'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, analisisConclusiones: v }))}
                  placeholder="Escribe libremente el análisis y conclusiones..."
                  rows={6}
                />
              )}
              {(sectionModes['analisisConclusiones'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Análisis clínico</label>
                    <DictationTextarea rows={3} value={consultationData.analisis_conclusiones?.analisis_clinico ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, analisis_conclusiones: { ...prev.analisis_conclusiones, analisis_clinico: v } }))} placeholder="Análisis clínico detallado..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico diferencial</label>
                    <DictationTextarea rows={2} value={consultationData.analisis_conclusiones?.diagnostico_diferencial ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, analisis_conclusiones: { ...prev.analisis_conclusiones, diagnostico_diferencial: v } }))} placeholder="Diagnósticos diferenciales..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones de progreso</label>
                    <DictationTextarea rows={2} value={consultationData.analisis_conclusiones?.observaciones_progreso ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, analisis_conclusiones: { ...prev.analisis_conclusiones, observaciones_progreso: v } }))} placeholder="Observaciones del progreso del paciente..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado emocional</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.analisis_conclusiones?.estado_emocional ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, analisis_conclusiones: { ...prev.analisis_conclusiones, estado_emocional: e.target.value } }))} placeholder="Estado emocional al cierre..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de malestar al cierre (0-10)</label>
                    <input type="number" min={0} max={10} className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.analisis_conclusiones?.nivel_malestar_cierre ?? 5} onChange={(e) => setConsultationData(prev => ({ ...prev, analisis_conclusiones: { ...prev.analisis_conclusiones, nivel_malestar_cierre: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adherencia al tratamiento</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.analisis_conclusiones?.adherencia_tratamiento ?? 'Nulo'} onChange={(e) => setConsultationData(prev => ({ ...prev, analisis_conclusiones: { ...prev.analisis_conclusiones, adherencia_tratamiento: e.target.value as any } }))}>
                      <option value="Nulo">Nulo</option>
                      <option value="Malo">Malo</option>
                      <option value="Regular">Regular</option>
                      <option value="Bueno">Bueno</option>
                      <option value="Muy bueno">Muy bueno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pronóstico</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.analisis_conclusiones?.pronostico ?? 'No se puede pronosticar aún'} onChange={(e) => setConsultationData(prev => ({ ...prev, analisis_conclusiones: { ...prev.analisis_conclusiones, pronostico: e.target.value as any } }))}>
                      <option value="No se puede pronosticar aún">No se puede pronosticar aún</option>
                      <option value="Reservado">Reservado</option>
                      <option value="Negativo">Negativo</option>
                      <option value="Dependiente de apego terapéutico">Dependiente de apego terapéutico</option>
                      <option value="Dependiente de cese de factores de riesgo">Dependiente de cese de factores de riesgo</option>
                      <option value="Bueno a corto plazo">Bueno a corto plazo</option>
                      <option value="Bueno a largo plazo">Bueno a largo plazo</option>
                      <option value="Crónico controlable">Crónico controlable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalle pronóstico</label>
                    <DictationTextarea rows={2} value={consultationData.analisis_conclusiones?.pronostico_detalle ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, analisis_conclusiones: { ...prev.analisis_conclusiones, pronostico_detalle: v } }))} placeholder="Detalle del pronóstico..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cambios desde última visita</label>
                    <DictationTextarea rows={2} value={consultationData.analisis_conclusiones?.cambios_ultima_visita ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, analisis_conclusiones: { ...prev.analisis_conclusiones, cambios_ultima_visita: v } }))} placeholder="Cambios observados desde la última visita..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas privadas</label>
                    <DictationTextarea rows={2} value={consultationData.analisis_conclusiones?.notas_privadas ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, analisis_conclusiones: { ...prev.analisis_conclusiones, notas_privadas: v } }))} placeholder="Notas privadas del clínico (no se imprimen)..." />
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Formulación del Caso */}
            {isVisible('formulacionCaso') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">📐 Formulación del Caso</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('formulacionCaso', sectionModes['formulacionCaso'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['formulacionCaso'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('formulacionCaso', sectionModes['formulacionCaso'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['formulacionCaso'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['formulacionCaso'] === 'canvas' && <CanvasSectionPad sectionKey="formulacionCaso" title="Formulación del Caso" />}
              {sectionModes['formulacionCaso'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['formulacionCaso'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, formulacionCaso: v }))}
                  placeholder="Escribe libremente la formulación del caso..."
                  rows={6}
                />
              )}
              {(sectionModes['formulacionCaso'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    { key: 'hipotesis_trabajo', label: 'Hipótesis de trabajo' },
                    { key: 'factores_predisponentes', label: 'Factores predisponentes' },
                    { key: 'factores_precipitantes', label: 'Factores precipitantes' },
                    { key: 'factores_mantenimiento', label: 'Factores de mantenimiento' },
                    { key: 'factores_protectores', label: 'Factores protectores' },
                    { key: 'diagnostico_presuntivo', label: 'Diagnóstico presuntivo' },
                  ] as { key: keyof typeof consultationData.formulacion_caso; label: string }[]).map(({ key, label }) => (
                    <div key={String(key)}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <DictationTextarea rows={2} value={(consultationData.formulacion_caso as any)?.[key] ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, formulacion_caso: { ...prev.formulacion_caso, [key]: v } }))} placeholder={`${label}...`} />
                    </div>
                  ))}
                </div>
              </>)}
            </Card>)}
            {/* Plan de Manejo */}
            {/* NOTE: contenidoSesion has no mode selector per spec as it's not in the 25-field list */}
            {isVisible('planManejo') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🗓️ Plan y Manejo</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('planManejo', sectionModes['planManejo'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['planManejo'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('planManejo', sectionModes['planManejo'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['planManejo'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['planManejo'] === 'canvas' && <CanvasSectionPad sectionKey="planManejo" title="Plan y Manejo" />}
              {sectionModes['planManejo'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['planManejo'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, planManejo: v }))}
                  placeholder="Escribe libremente el plan y manejo..."
                  rows={6}
                />
              )}
              {(sectionModes['planManejo'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farmacoterapia indicada</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.plan_manejo?.farmacoterapia_indicada ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, farmacoterapia_indicada: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                      <option value="Dudoso">Dudoso</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Psicoterapia indicada</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.plan_manejo?.psicoterapia_indicada ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, psicoterapia_indicada: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                      <option value="Dudoso">Dudoso</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia de sesiones</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.plan_manejo?.frecuencia_sesiones ?? 'Semanal'} onChange={(e) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, frecuencia_sesiones: e.target.value as any } }))}>
                      <option value="Semanal">Semanal</option>
                      <option value="Quincenal">Quincenal</option>
                      <option value="Cada 3er Semana">Cada 3ª semana</option>
                      <option value="Mensual">Mensual</option>
                      <option value="Irregular">Irregular</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de sesiones previstas</label>
                    <input type="number" min={0} className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.plan_manejo?.numero_sesiones_previstas ?? 0} onChange={(e) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, numero_sesiones_previstas: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de seguimiento</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.plan_manejo?.tiempo_seguimiento_meses ?? 'Corto plazo'} onChange={(e) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, tiempo_seguimiento_meses: e.target.value as any } }))}>
                      <option value="Corto plazo">Corto plazo</option>
                      <option value="Largo plazo">Largo plazo</option>
                      <option value="Crónico">Crónico</option>
                      <option value="Indeterminado">Indeterminado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Progreso</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.plan_manejo?.progreso ?? 'Nulo'} onChange={(e) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, progreso: e.target.value as any } }))}>
                      <option value="Nulo">Nulo</option>
                      <option value="Mínimo">Mínimo</option>
                      <option value="Regular">Regular</option>
                      <option value="Bueno">Bueno</option>
                      <option value="Muy bueno">Muy bueno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Necesidad de evaluación psiquiátrica</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.plan_manejo?.necesidad_evaluacion_psiquiatrica ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, necesidad_evaluacion_psiquiatrica: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contrato terapéutico</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.plan_manejo?.contrato_terapeutico ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, contrato_terapeutico: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan de manejo / tratamiento</label>
                    <DictationTextarea rows={3} value={consultationData.plan_manejo?.plan_manejo_tratamiento ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, plan_manejo_tratamiento: v } }))} placeholder="Plan de manejo detallado..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enfoque terapéutico propuesto</label>
                    <DictationTextarea rows={2} value={consultationData.plan_manejo?.enfoque_terapeutico_propuesto ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, enfoque_terapeutico_propuesto: v } }))} placeholder="Enfoque terapéutico propuesto..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objetivos terapéuticos</label>
                    <DictationTextarea rows={2} value={consultationData.plan_manejo?.objetivos_terapeuticos ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, objetivos_terapeuticos: v } }))} placeholder="Objetivos terapéuticos..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarea próxima sesión</label>
                    <DictationTextarea rows={2} value={consultationData.plan_manejo?.tarea_proxima_sesion ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, tarea_proxima_sesion: v } }))} placeholder="Tarea para la próxima sesión..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tareas asignadas previamente</label>
                    <DictationTextarea rows={2} value={consultationData.plan_manejo?.tareas_asignadas_previamente ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, tareas_asignadas_previamente: v } }))} placeholder="Tareas asignadas previamente..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referencias / Interconsultas</label>
                    <DictationTextarea rows={2} value={consultationData.plan_manejo?.referencias_interconsultas ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, referencias_interconsultas: v } }))} placeholder="Referencias e interconsultas..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Psicoeducación proporcionada</label>
                    <DictationTextarea rows={2} value={consultationData.plan_manejo?.psicoeducacion_proporcionada ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, psicoeducacion_proporcionada: v } }))} placeholder="Psicoeducación proporcionada..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temas a continuar</label>
                    <DictationTextarea rows={2} value={consultationData.plan_manejo?.temas_a_continuar ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, temas_a_continuar: v } }))} placeholder="Temas a continuar en próximas sesiones..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cambios en plan de tratamiento</label>
                    <DictationTextarea rows={2} value={consultationData.plan_manejo?.cambios_plan_tratamiento ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, plan_manejo: { ...prev.plan_manejo, cambios_plan_tratamiento: v } }))} placeholder="Cambios al plan de tratamiento..." />
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Red de Apoyo */}
            {isVisible('redApoyo') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🤝 Red de Apoyo</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('redApoyo', sectionModes['redApoyo'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['redApoyo'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('redApoyo', sectionModes['redApoyo'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['redApoyo'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['redApoyo'] === 'canvas' && <CanvasSectionPad sectionKey="redApoyo" title="Red de Apoyo" />}
              {sectionModes['redApoyo'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['redApoyo'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, redApoyo: v }))}
                  placeholder="Escribe libremente sobre la red de apoyo..."
                  rows={6}
                />
              )}
              {(sectionModes['redApoyo'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Redes disponibles</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.red_apoyo?.redes_disponibles ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, red_apoyo: { ...prev.red_apoyo, redes_disponibles: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalle redes disponibles</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.red_apoyo?.redes_disponibles_detalle ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, red_apoyo: { ...prev.red_apoyo, redes_disponibles_detalle: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contención</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.red_apoyo?.contencion ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, red_apoyo: { ...prev.red_apoyo, contencion: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalle contención</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.red_apoyo?.contencion_detalle ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, red_apoyo: { ...prev.red_apoyo, contencion_detalle: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de emergencia</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.red_apoyo?.contacto_emergencia ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, red_apoyo: { ...prev.red_apoyo, contacto_emergencia: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalle contacto de emergencia</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.red_apoyo?.contacto_emergencia_detalle ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, red_apoyo: { ...prev.red_apoyo, contacto_emergencia_detalle: e.target.value } }))} />
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Intervención en Crisis */}
            {isVisible('intervencionCrisis') && (<Card className="p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🚨 Intervención en Crisis</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('intervencionCrisis', sectionModes['intervencionCrisis'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['intervencionCrisis'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('intervencionCrisis', sectionModes['intervencionCrisis'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['intervencionCrisis'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['intervencionCrisis'] === 'canvas' && <CanvasSectionPad sectionKey="intervencionCrisis" title="Intervención en Crisis" />}
              {sectionModes['intervencionCrisis'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['intervencionCrisis'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, intervencionCrisis: v }))}
                  placeholder="Escribe libremente sobre la intervención en crisis..."
                  rows={6}
                />
              )}
              {(sectionModes['intervencionCrisis'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intervención en crisis</label>
                    <DictationTextarea rows={2} value={consultationData.intervencion_crisis?.intervencion_crisis ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, intervencion_crisis: v } }))} placeholder="Descripción de la intervención en crisis..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contención verbal</label>
                    <DictationTextarea rows={2} value={consultationData.intervencion_crisis?.contencion_verbal ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, contencion_verbal: v } }))} placeholder="Técnicas de contención verbal utilizadas..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medicación de urgencia</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.intervencion_crisis?.medicacion_urgencia ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, medicacion_urgencia: e.target.value } }))} placeholder="Medicación de urgencia administrada..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Restricción de medios</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.intervencion_crisis?.restriccion_medios ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, restriccion_medios: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Llamada a familia</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.intervencion_crisis?.llamada_familia ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, llamada_familia: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.intervencion_crisis?.destino ?? 'Alta'} onChange={(e) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, destino: e.target.value as any } }))}>
                      <option value="Alta">Alta</option>
                      <option value="Hospitalización">Hospitalización</option>
                      <option value="Traslado otro hospital">Traslado a otro hospital</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Criterios de hospitalización</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.intervencion_crisis?.criterios_hospitalizacion ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, criterios_hospitalizacion: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consentimiento paciente</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.intervencion_crisis?.consentimiento_paciente ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, consentimiento_paciente: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consentimiento familiar</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={consultationData.intervencion_crisis?.consentimiento_familiar ?? 'No'} onChange={(e) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, consentimiento_familiar: e.target.value as any } }))}>
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan de egreso</label>
                    <DictationTextarea rows={2} value={consultationData.intervencion_crisis?.plan_egreso ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, plan_egreso: v } }))} placeholder="Plan de egreso..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones</label>
                    <DictationTextarea rows={2} value={consultationData.intervencion_crisis?.instrucciones ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, instrucciones: v } }))} placeholder="Instrucciones al egreso..." />
                  </div>
                  <div className="md:col-span-2 border-t pt-3">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Responsable de egreso</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {(['nombre', 'parentesco', 'telefono'] as const).map((field) => (
                        <div key={field}>
                          <label className="block text-xs text-gray-500 mb-1 capitalize">{field}</label>
                          <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={consultationData.intervencion_crisis?.responsable_egreso?.[field] ?? ''} onChange={(e) => setConsultationData(prev => ({ ...prev, intervencion_crisis: { ...prev.intervencion_crisis, responsable_egreso: { ...prev.intervencion_crisis?.responsable_egreso, [field]: e.target.value } } }))} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>)}
            </Card>)}
            {/* Recetas / Medications Section - Optimized UI */}
            {isVisible('medications') && (
              <>
                {!showReceta ? (
                  <Button type='button' onClick={() => setShowReceta(true)}>Agregar Receta</Button>) : (
                  <Card className="p-6 border-l-4 border-teal-500">
                    <RecetasAddForm
                      prescriptions={consultationData.prescriptions || []}
                      treatment_plan={consultationData.treatment_plan || ''}
                      handleDeletePrescription={handleDeletePrescription}
                      updateConsultationFn={updateConsultationFn}
                    />
                  </Card>)}
              </>)}
            {isVisible('additionalInstructions') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Indicaciones al Paciente</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('additionalInstructions', sectionModes['additionalInstructions'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['additionalInstructions'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('additionalInstructions', sectionModes['additionalInstructions'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['additionalInstructions'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['additionalInstructions'] === 'canvas' && <CanvasSectionPad sectionKey="additionalInstructions" title="Indicaciones al Paciente" />}
              {sectionModes['additionalInstructions'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['additionalInstructions'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, additionalInstructions: v }))}
                  placeholder="Instrucciones para el paciente..."
                  rows={6}
                />
              )}
              {(sectionModes['additionalInstructions'] ?? null) === null && (<>
                <DictationTextarea
                  value={consultationData.additional_instructions}
                  onChange={(value) => setConsultationData(prev => ({
                    ...prev,
                    additional_instructions: value
                  }))}
                  placeholder="Instrucciones para el paciente..."
                  rows={4}
                />
              </>)}
            </Card>)}
            {isVisible('labOrders') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🔬 Solicitud de Estudios de Gabinete</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('labOrders', sectionModes['labOrders'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['labOrders'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('labOrders', sectionModes['labOrders'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['labOrders'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['labOrders'] === 'canvas' && <CanvasSectionPad sectionKey="labOrders" title="Solicitud de Estudios de Gabinete" />}
              {sectionModes['labOrders'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['labOrders'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, labOrders: v }))}
                  placeholder="Escribe libremente la solicitud de estudios de gabinete..."
                  rows={6}
                />
              )}
              {(sectionModes['labOrders'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['tac', 'rm', 'ultrasonido', 'poligrafia', 'polisomnografia', 'otro'] as const).map((estudio) => {
                    const labels: Record<string, string> = {
                      tac: 'TAC', rm: 'Resonancia Magnética', ultrasonido: 'Ultrasonido',
                      poligrafia: 'Poligrafía', polisomnografia: 'Polisomnografía', otro: 'Otro'
                    };
                    return (
                      <div key={estudio} className="border rounded-lg p-3">
                        <label className="flex items-center gap-2 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={consultationData.otros_campos.estudios_gabinete[estudio].check === 'Si'}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              otros_campos: {
                                ...prev.otros_campos,
                                estudios_gabinete: {
                                  ...prev.otros_campos.estudios_gabinete,
                                  [estudio]: { ...prev.otros_campos.estudios_gabinete[estudio], check: e.target.checked ? 'Si' : 'No' }
                                }
                              }
                            }))}
                            className="rounded"
                          />
                          <span className="font-medium text-sm">{labels[estudio]}</span>
                        </label>
                        {consultationData.otros_campos.estudios_gabinete[estudio].check === 'Si' && (
                          <input
                            type="text"
                            placeholder="Indicaciones / detalles..."
                            value={consultationData.otros_campos.estudios_gabinete[estudio].detalle}
                            onChange={(e) => setConsultationData(prev => ({
                              ...prev,
                              otros_campos: {
                                ...prev.otros_campos,
                                estudios_gabinete: {
                                  ...prev.otros_campos.estudios_gabinete,
                                  [estudio]: { ...prev.otros_campos.estudios_gabinete[estudio], detalle: e.target.value }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>)}
            </Card>)}
            {/* Solicitud de Laboratorios - lab orders request (nuevo) */}
            {isVisible('labOrdersRequest') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🧫 Solicitud de Laboratorios</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('labOrdersRequest', sectionModes['labOrdersRequest'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['labOrdersRequest'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('labOrdersRequest', sectionModes['labOrdersRequest'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['labOrdersRequest'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['labOrdersRequest'] === 'canvas' && <CanvasSectionPad sectionKey="labOrdersRequest" title="Solicitud de Laboratorios" />}
              {sectionModes['labOrdersRequest'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['labOrdersRequest'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, labOrdersRequest: v }))}
                  placeholder="Solicitud de estudios de laboratorio (biometría, química sanguínea, etc.)..."
                  rows={6}
                />
              )}
              {(sectionModes['labOrdersRequest'] ?? null) === null && (<>
                <DictationTextarea
                  value={(consultationData as any).lab_orders_request ?? ''}
                  onChange={(value) => setConsultationData(prev => ({ ...prev, lab_orders_request: value } as any))}
                  placeholder="Solicitud de estudios de laboratorio (biometría, química sanguínea, etc.)..."
                  rows={5}
                />
              </>)}
            </Card>)}

            <Card className="p-6">
              <div className="p-4">
                <Button onClick={() => setOpenPad(true)}>Abrir nota a mano</Button>

                {noteImg && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Nota guardada:</div>
                    <img src={noteImg} alt="nota" className="border rounded-lg max-w-full" />
                  </div>
                )}

                <FullscreenHandwritingPad
                  open={openPad}
                  onClose={() => setOpenPad(false)}
                  onSavePng={({ dataUrl }) => {
                    setNoteImg(dataUrl);
                    setOpenPad(false);
                  }}
                  onSaveSvg={({ svg }) => {
                    console.log(svg);
                    setOpenPad(false);
                  }}
                />
              </div>
            </Card>

            {/* Next Appointment */}
            {isVisible('nextAppointment') && (<Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Próxima Cita</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={consultationData.next_appointment.date}
                    onChange={(e) => setConsultationData(prev => ({
                      ...prev,
                      next_appointment: { ...prev.next_appointment, date: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={consultationData.next_appointment.time}
                    onChange={(e) => setConsultationData(prev => ({
                      ...prev,
                      next_appointment: { ...prev.next_appointment, time: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </Card>)}
            {/* Contenido de Sesión */}
            {isVisible('contenidoSesion') && (<Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">📝 Contenido de Sesión</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSectionMode('contenidoSesion', sectionModes['contenidoSesion'] === 'text' ? null : 'text')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['contenidoSesion'] === 'text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>✏️ Texto Libre</button>
                  <button type="button" onClick={() => setSectionMode('contenidoSesion', sectionModes['contenidoSesion'] === 'canvas' ? null : 'canvas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${sectionModes['contenidoSesion'] === 'canvas' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🎨 Canva</button>
                </div>
              </div>
              {sectionModes['contenidoSesion'] === 'canvas' && <CanvasSectionPad sectionKey="contenidoSesion" title="Contenido de Sesión" />}
              {sectionModes['contenidoSesion'] === 'text' && (
                <DictationTextarea
                  value={sectionFreeText['contenidoSesion'] ?? ''}
                  onChange={(v) => setSectionFreeText(prev => ({ ...prev, contenidoSesion: v }))}
                  placeholder="Escribe libremente el contenido de la sesión..."
                  rows={6}
                />
              )}
              {(sectionModes['contenidoSesion'] ?? null) === null && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temas principales</label>
                    <DictationTextarea rows={3} value={consultationData.contenido_sesion?.temas_principales ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, contenido_sesion: { ...prev.contenido_sesion, temas_principales: v } }))} placeholder="Temas trabajados en sesión..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Momentos significativos</label>
                    <DictationTextarea rows={2} value={consultationData.contenido_sesion?.momentos_significativos ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, contenido_sesion: { ...prev.contenido_sesion, momentos_significativos: v } }))} placeholder="Momentos significativos de la sesión..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Insights del paciente</label>
                    <DictationTextarea rows={2} value={consultationData.contenido_sesion?.insights_paciente ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, contenido_sesion: { ...prev.contenido_sesion, insights_paciente: v } }))} placeholder="Insights observados..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emociones trabajadas (detalle)</label>
                    <DictationTextarea rows={2} value={consultationData.contenido_sesion?.emociones_trabajadas_detalle ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, contenido_sesion: { ...prev.contenido_sesion, emociones_trabajadas_detalle: v } }))} placeholder="Descripción de emociones trabajadas..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resistencias observadas</label>
                    <DictationTextarea rows={2} value={consultationData.contenido_sesion?.resistencias_observadas ?? ''} onChange={(v) => setConsultationData(prev => ({ ...prev, contenido_sesion: { ...prev.contenido_sesion, resistencias_observadas: v } }))} placeholder="Resistencias observadas durante la sesión..." />
                  </div>
                </div>
              </>)}
            </Card>)}

            {/* Save Button - Moved to bottom */}
            <div className="mt-8 flex justify-center sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200">
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowPreviewDialog(true)}>
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Vista previa
                </Button>
                <Button variant="primary" onClick={handleSaveConsultation} className="px-8">
                  Guardar y terminar consulta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <ConsultationPreviewDialog
        isOpen={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        patient={patient}
        sectionModes={sectionModes}
        sectionFreeText={sectionFreeText}
        sectionCanvasData={sectionCanvasData}
        consultationData={{
          ...consultationData,
          // mental_exam: {
          //   descripcionInspeccion: consultationData.mental_exam.customAppearance || consultationData.mental_exam.appearance || '',
          //   apariencia: consultationData.mental_exam.appearance || consultationData.mental_exam.customAppearance || '',
          //   actitud: consultationData.mental_exam.attitude || '',
          //   conciencia: consultationData.mental_exam.consciousness || '',
          //   orientacion: consultationData.mental_exam.orientation || '',
          //   atencion: consultationData.mental_exam.attention || '',
          //   lenguaje: consultationData.mental_exam.customSpeech || `${consultationData.mental_exam.speechRate} ${consultationData.mental_exam.speechVolume} ${consultationData.mental_exam.speechFluency}`.trim() || '',
          //   afecto: consultationData.mental_exam.customAffect || `${consultationData.mental_exam.affectIntensity} ${consultationData.mental_exam.affectQuality}`.trim() || '',
          //   sensopercepcion: consultationData.mental_exam.customPerceptions || consultationData.mental_exam.perceptions || '',
          //   memoria: consultationData.mental_exam.memory || '',
          //   pensamientoPrincipal: consultationData.mental_exam.thoughtContent || '',
          //   pensamientoDetalles: consultationData.mental_exam.customThought || consultationData.mental_exam.thoughtProcess || ''
          // }
        }}
        professionalName={professionalName}
        // clinicName={`${config.clinicName}`}
        clinicName={clinicName}

      />

      {/* Print Configuration Dialog */}
      {showPrintConfig && (
        <PrintConfigDialog
          onClose={() => setShowPrintConfig(false)}
          onSave={(config) => {
            console.log('✅ Print configuration saved:', config);
            // La configuración ya se guarda automáticamente en PrintConfigDialog
          }}
        />
      )}

      {/* Prescription Creator Modal */}
      {showPrescriptionModal && (
        <PrescriptionCreator
          patient={{
            ...patient,
            last_name: patient.paternal_last_name,
            date_of_birth: patient.birth_date,
            allergies: patient.allergies ? patient.allergies.split(',').map(a => a.trim()) : undefined,
            chronic_conditions: patient.medical_history ? patient.medical_history.split(',').map(c => c.trim()) : undefined
          }}
          onCancel={() => setShowPrescriptionModal(false)}
          onSuccess={async (prescriptionData) => {
            try {
              console.log('💊 Creating prescription:', prescriptionData);
              // Refresh prescriptions after creation
              const prescriptionsResponse = await expedixApi.getPatientPrescriptions(patient.id);
              setPrescriptions(prescriptionsResponse?.data || []);
              setShowPrescriptionModal(false);
            } catch (error) {
              console.error('❌ Error creating prescription:', error);
            }
          }}
        />
      )}

      {/* Medication Modal */}
      <MedicationModal
        isOpen={showMedicationModal}
        onClose={() => setShowMedicationModal(false)}
        onSave={handleSaveMedications}
        currentMedications={consultationData.prescriptions || []}
        currentIndications={consultationData.indications || []}
      />

      {/* Prescription Designer Modal */}
      <PrescriptionDesigner
        isOpen={showPrescriptionDesigner}
        onClose={() => setShowPrescriptionDesigner(false)}
        onSaveTemplate={(template) => {
          // Guardar plantilla en localStorage o API
          const existingTemplates = JSON.parse(localStorage.getItem('mindhub_prescription_templates') || '[]');
          const updatedTemplates = [...existingTemplates, template];
          localStorage.setItem('mindhub_prescription_templates', JSON.stringify(updatedTemplates));
          setShowPrescriptionDesigner(false);
        }}
        sampleData={{
          doctor: {
            first_name: 'Dr. Alejandro',
            last_name: 'Contreras',
            specialty: 'Psiquiatría',
            license: '12345678'
          },
          patient: patient || {
            first_name: 'Paciente',
            paternal_last_name: 'Ejemplo',
            maternal_last_name: 'Demo',
            age: 35
          },
          medications: consultationData.prescriptions || [],
          clinic: {
            name: 'MindHub Clínica',
            address: 'Av. Revolución 123, Col. Centro, CDMX',
            phone: '+52 55 1234 5678'
          }
        }}
      />
    </div>
  );
}