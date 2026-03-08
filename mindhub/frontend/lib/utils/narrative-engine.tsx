'use client';

import React from 'react';

// ─── Spanish field labels ────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  // Apariencia
  aspecto_general: 'Aspecto general',
  higiene: 'Higiene',
  vestimenta: 'Vestimenta',
  edad_aparente: 'Edad aparente',
  complexion: 'Complexión',
  facies: 'Facies',
  caracteristicas_distintivas: 'Características distintivas',
  // Conducta
  nivel_psicomotor: 'Nivel psicomotor',
  contacto_visual: 'Contacto visual',
  postura: 'Postura',
  marcha: 'Marcha',
  movimientos_anormales: 'Movimientos anormales',
  cooperacion_entrevista: 'Cooperación en entrevista',
  // Actitud
  actitud_general: 'Actitud general',
  rapport: 'Rapport',
  // Habla
  velocidad: 'Velocidad',
  volumen: 'Volumen',
  tono: 'Tono',
  articulacion: 'Articulación',
  cantidad: 'Cantidad',
  latencia_respuesta: 'Latencia de respuesta',
  prosodia: 'Prosodia',
  // Afecto
  tipo: 'Tipo de afecto',
  rango_afectivo: 'Rango afectivo',
  intensidad: 'Intensidad',
  reactividad: 'Reactividad',
  congruencia: 'Congruencia',
  estabilidad: 'Estabilidad',
  // Ánimo
  estado_animo: 'Estado de ánimo',
  nivel: 'Nivel de malestar (0–10)',
  concordancia_animo_afecto: 'Concordancia ánimo–afecto',
  // Pensamiento proceso
  curso_pensamiento: 'Curso del pensamiento',
  velocidad_pensamiento: 'Velocidad del pensamiento',
  contenido_discurso: 'Contenido del discurso',
  // Pensamiento contenido
  ideas_muerte: 'Ideas de muerte',
  ideacion_suicida: 'Ideación suicida',
  plan_suicida: 'Plan suicida',
  ideacion_homicida: 'Ideación homicida',
  delirios: 'Delirios',
  caracteristicas_delirios: 'Características de delirios',
  ideas_sobrevaloradas: 'Ideas sobrevaloradas',
  obsesiones: 'Obsesiones',
  tipo_obsesiones: 'Tipo de obsesiones',
  compulsiones: 'Compulsiones',
  tipo_compulsiones: 'Tipo de compulsiones',
  fobias: 'Fobias',
  preocupaciones_excesivas: 'Preocupaciones excesivas',
  // Percepción
  alucinaciones_auditivas: 'Alucinaciones auditivas',
  alucinaciones_auditivas_caracteristicas: 'Características (auditivas)',
  alucinaciones_visuales: 'Alucinaciones visuales',
  alucinaciones_visuales_caracteristicas: 'Características (visuales)',
  alucinaciones_tactiles: 'Alucinaciones táctiles',
  alucinaciones_tactiles_caracteristicas: 'Características (táctiles)',
  alucinaciones_olfatorias: 'Alucinaciones olfatorias',
  alucinaciones_olfatorias_caracteristicas: 'Características (olfatorias)',
  alucinaciones_gustativas: 'Alucinaciones gustativas',
  alucinaciones_gustativas_caracteristicas: 'Características (gustativas)',
  ilusiones: 'Ilusiones',
  ilusiones_caracteristicas: 'Características (ilusiones)',
  despersonalizacion: 'Despersonalización',
  despersonalizacion_caracteristicas: 'Características (despersonalización)',
  desrealizacion: 'Desrealización',
  desrealizacion_caracteristicas: 'Características (desrealización)',
  // Cognición
  nivel_conciencia: 'Nivel de conciencia',
  orientacion_persona: 'Orientación en persona',
  orientacion_lugar: 'Orientación en lugar',
  orientacion_tiempo: 'Orientación en tiempo',
  orientacion_situacion: 'Orientación en situación',
  atencion: 'Atención',
  concentracion: 'Concentración',
  memoria_inmediata: 'Memoria inmediata',
  memoria_reciente: 'Memoria reciente',
  memoria_remota: 'Memoria remota',
  capacidad_abstracta: 'Capacidad abstracta',
  calculo: 'Cálculo',
  inteligencia_clinica_estimada: 'Inteligencia clínica estimada',
  funciones_ejecutivas: 'Funciones ejecutivas',
  // Insight y juicio
  insight: 'Insight',
  grado: 'Grado de insight',
  juicio: 'Juicio',
  juicio_social: 'Juicio social',
  control_impulsos: 'Control de impulsos',
  // Funcionalidad
  nivel_global: 'Nivel global (GAF)',
  laboral_escolar: 'Funcionamiento laboral/escolar',
  funcionalidad_social: 'Funcionalidad social',
  autocuidado: 'Autocuidado',
  // Sintomatología actual
  motivo_consulta: 'Motivo de consulta',
  queja_principal: 'Queja principal',
  sintoma_principal: 'Síntoma principal',
  historia_sintomas_actuales: 'Historia de síntomas actuales',
  duracion_sintomas: 'Duración de síntomas',
  factores_precipitantes: 'Factores precipitantes',
  referido_por: 'Referido por',
  nombre_refiere: 'Nombre de quien refiere',
  padecimiento_actual: 'Padecimiento actual',
  curso_enfermedad: 'Curso de la enfermedad',
  sintomas_cardinales: 'Síntomas cardinales',
  impacto_fucional: 'Impacto funcional',
  espera_terapia: 'Expectativas de terapia',
  terapia_antes: 'Terapia previa',
  terapia_funciono: 'Efectividad de terapia previa',
  descripcion_problema: 'Descripción del problema',
  situaciones_problema: 'Situaciones problema',
  pensamientos_asociados: 'Pensamientos asociados',
  emociones_asociadas: 'Emociones asociadas',
  conductas_asociadas: 'Conductas asociadas',
  consecuencias: 'Consecuencias',
  intentos_previos_solucion: 'Intentos previos de solución',
  impactos_vida: 'Impactos en la vida',
  sueno: 'Sueño',
  apetito: 'Apetito',
  energia: 'Energía',
  nivel_funcionamiento: 'Nivel de funcionamiento',
  // Historia riesgo
  ideacion_suicida_previa: 'Ideación suicida previa',
  intentos_suicidio_previos: 'Intentos de suicidio previos',
  intentos_suicidio_detalle: 'Detalle de intentos de suicidio',
  autolesiones_no_suicidas: 'Autolesiones no suicidas',
  autolesiones_no_suicidas_detalle: 'Detalle de autolesiones',
  ideacion_homicida_previa: 'Ideación homicida previa',
  ideacion_homicida_detalle: 'Detalle de ideación homicida',
  conductas_violentas_previas: 'Conductas violentas previas',
  conductas_violentas_detalle: 'Detalle',
  acceso_armas: 'Acceso a armas',
  acceso_armas_detalle: 'Detalle',
  acceso_medicamentos_cantidad: 'Acceso a medicamentos en cantidad',
  acceso_medicamentos_cantidad_detalle: 'Detalle',
  acceso_medios_letales: 'Acceso a medios letales',
  acceso_medios_letales_detalle: 'Detalle',
  nivel_riesgo: 'Nivel de riesgo',
  plan_seguridad: 'Plan de seguridad',
  eventos_precipitantes: 'Eventos precipitantes',
  // Plan manejo
  farmacoterapia_indicada: 'Farmacoterapia indicada',
  efectos_secundarios_reportados: 'Efectos secundarios reportados',
  estresores_actuales: 'Estresores actuales',
  plan_manejo_tratamiento: 'Plan de manejo y tratamiento',
  tiempo_seguimiento_meses: 'Tiempo de seguimiento',
  psicoterapia_indicada: 'Psicoterapia indicada',
  numero_sesiones_previstas: 'Número de sesiones previstas',
  enfoque_terapeutico_propuesto: 'Enfoque terapéutico propuesto',
  objetivos_terapeuticos: 'Objetivos terapéuticos',
  tarea_proxima_sesion: 'Tarea para próxima sesión',
  frecuencia_sesiones: 'Frecuencia de sesiones',
  duracion_estimada: 'Duración estimada',
  necesidad_evaluacion_psiquiatrica: 'Evaluación psiquiátrica necesaria',
  necesidad_pruebas_neuropsicologicas: 'Pruebas neuropsicológicas necesarias',
  progreso: 'Progreso',
  proxima_cita: 'Próxima cita',
  cambios_plan_tratamiento: 'Cambios en el plan de tratamiento',
  // Análisis y conclusiones
  analisis_clinico: 'Análisis clínico',
  diagnostico_diferencial: 'Diagnóstico diferencial',
  formulacion_caso: 'Formulación de caso',
  notas_privadas: 'Notas privadas',
  observaciones_progreso: 'Observaciones de progreso',
  estado_emocional: 'Estado emocional',
  nivel_malestar_cierre: 'Nivel de malestar al cierre (0–10)',
  cambios_ultima_visita: 'Cambios desde última visita',
  adherencia_tratamiento: 'Adherencia al tratamiento',
  adherencia_detalle: 'Detalle de adherencia',
  pronostico: 'Pronóstico',
  pronostico_detalle: 'Detalle del pronóstico',
};

const MENTAL_EXAM_SECTION_LABELS: Record<string, string> = {
  apariencia: 'Apariencia',
  conducta: 'Conducta',
  actitud: 'Actitud',
  habla: 'Habla y Lenguaje',
  afecto: 'Afecto',
  animo: 'Estado de Ánimo',
  pensamiento_proceso: 'Proceso del Pensamiento',
  pensamiento_contenido: 'Contenido del Pensamiento',
  percepcion: 'Percepción',
  cognicion: 'Cognición',
  insight_juicio: 'Insight y Juicio',
  funcionalidad: 'Funcionalidad',
};

const getLabel = (key: string): string =>
  FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

// ─── Data cleaning ───────────────────────────────────────────────────────────

export const cleanStructuredData = (data: any): any => {
  if (data === null || data === undefined || data === '' || data === false || data === 'No') return null;

  if (Array.isArray(data)) {
    const cleaned = data.map(cleanStructuredData).filter(Boolean);
    return cleaned.length > 0 ? cleaned : null;
  }

  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      const val = cleanStructuredData(data[key]);
      if (val !== null) cleaned[key] = val;
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null;
  }

  return data;
};

// ─── Value renderer ──────────────────────────────────────────────────────────

const renderPrimitiveValue = (value: any): string => {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).filter(Boolean).join(' / ');
  }
  return String(value);
};

// ─── Field rows component ────────────────────────────────────────────────────

const FieldRows: React.FC<{ data: Record<string, any> }> = ({ data }) => {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return null;

  return (
    <div className="space-y-1.5 text-sm">
      {entries.map(([key, value]) => {
        const label = getLabel(key);

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const subEntries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== '');
          if (subEntries.length === 0) return null;
          return (
            <div key={key} className="mb-2">
              <div className="font-semibold text-gray-700 mb-1">{label}:</div>
              <div className="pl-4 space-y-1 border-l-2 border-gray-100">
                {subEntries.map(([sk, sv]) => (
                  <div key={sk} className="flex gap-2">
                    <span className="font-medium text-gray-500 min-w-[150px] shrink-0">{getLabel(sk)}:</span>
                    <span className="text-gray-800">{renderPrimitiveValue(sv)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="flex gap-2">
            <span className="font-medium text-gray-500 min-w-[180px] shrink-0">{label}:</span>
            <span className="text-gray-800">{renderPrimitiveValue(value)}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Mental exam subsection ──────────────────────────────────────────────────

const MentalExamSubSection: React.FC<{ title: string; data: any }> = ({ title, data }) => {
  const cleaned = cleanStructuredData(data);
  if (!cleaned || typeof cleaned !== 'object' || Array.isArray(cleaned)) return null;
  if (Object.keys(cleaned).length === 0) return null;

  return (
    <div className="mb-3">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded mb-2">
        {title}
      </h4>
      <FieldRows data={cleaned} />
    </div>
  );
};

// ─── Public: Mental exam narrative ───────────────────────────────────────────

export const MentalExamNarrative: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null;
  const cleaned = cleanStructuredData(data);
  if (!cleaned) return null;

  const hasSections = Object.keys(MENTAL_EXAM_SECTION_LABELS).some(k => cleaned[k]);
  if (!hasSections) return null;

  return (
    <div className="divide-y divide-gray-100">
      {Object.entries(MENTAL_EXAM_SECTION_LABELS).map(([key, title]) => {
        if (!cleaned[key]) return null;
        return (
          <div key={key} className="py-3 first:pt-0 last:pb-0">
            <MentalExamSubSection title={title} data={cleaned[key]} />
          </div>
        );
      })}
    </div>
  );
};

// ─── Public: Generic section narrative ───────────────────────────────────────

export const generateNarrativeReact = (data: any, _rootLabel: string = ''): React.ReactNode => {
  if (!data) return null;
  const cleaned = cleanStructuredData(data);
  if (!cleaned) return null;

  if (typeof cleaned === 'string' || typeof cleaned === 'number') {
    return <p className="text-sm text-gray-800 leading-relaxed">{cleaned}</p>;
  }

  if (Array.isArray(cleaned)) {
    return <p className="text-sm text-gray-800">{cleaned.join(', ')}</p>;
  }

  return <FieldRows data={cleaned} />;
};

// ─── Public: HTML for printing ───────────────────────────────────────────────

export const generateNarrativeHTML = (data: any, rootLabel: string = ''): string => {
  if (!data) return '';
  const cleaned = cleanStructuredData(data);
  if (!cleaned) return '';

  if (typeof cleaned === 'string' || typeof cleaned === 'number') {
    return rootLabel
      ? `<div style="margin-bottom:4px"><strong style="color:#444">${rootLabel}:</strong> ${cleaned}</div>`
      : `<span>${cleaned}</span>`;
  }

  if (Array.isArray(cleaned)) {
    const val = cleaned.join(', ');
    return rootLabel
      ? `<div style="margin-bottom:4px"><strong style="color:#444">${rootLabel}:</strong> ${val}</div>`
      : `<span>${val}</span>`;
  }

  const entries = Object.entries(cleaned);
  if (entries.length === 0) return '';

  const rows = entries.map(([key, value]) => {
    const label = getLabel(key);
    if (typeof value === 'object' && value !== null) {
      return `<div style="margin-bottom:6px">${generateNarrativeHTML(value, label)}</div>`;
    }
    return `<div style="display:flex;gap:8px;margin-bottom:2px"><span style="font-weight:600;color:#555;min-width:160px;flex-shrink:0">${label}:</span><span>${renderPrimitiveValue(value)}</span></div>`;
  }).join('');

  if (rootLabel) {
    return `<div style="margin-bottom:8px"><div style="font-weight:700;color:#333;margin-bottom:4px">${rootLabel}</div><div style="padding-left:12px;border-left:2px solid #e5e7eb">${rows}</div></div>`;
  }

  return `<div style="font-size:10pt">${rows}</div>`;
};
