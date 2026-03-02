'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

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
}

interface ConsultationTemplateManagerProps {
  onTemplateSelect?: (template: ConsultationTemplate) => void;
  showActions?: boolean;
}

const TEMPLATE_TYPES = [
  { value: 'psychiatry_initial', label: 'Psiquiatría — Primera Consulta' },
  { value: 'psychiatry_followup', label: 'Psiquiatría — Seguimiento' },
  { value: 'psychology_initial', label: 'Psicología — Primera Consulta' },
  { value: 'psychotherapy_followup', label: 'Psicoterapia — Sesión' },
  { value: 'soap', label: 'Nota SOAP' },
  { value: 'emergency', label: 'Urgencia / Crisis' },
  { value: 'custom', label: 'Plantilla Personalizada' },
];

type SectionOption = { value: string; label: string };
type FieldCategory = {
  key: string;         // identificador de la categoría (= sectionKey en ConsultationData)
  label: string;
  color: string;
  allOrNothing?: boolean;
  sections: SectionOption[]; // campos individuales del modelo
};

// Una categoría por sección de ConsultationData, con sus campos como opciones
const FIELD_CATEGORIES: FieldCategory[] = [
  {
    key: 'currentCondition',
    label: '🩺 Padecimiento Actual',
    color: 'border-blue-400',
    sections: [
      { value: 'currentCondition', label: 'Padecimiento Actual (texto libre)' },
    ],
  },
  {
    key: 'vitalSigns',
    label: '❤️ Signos Vitales',
    color: 'border-red-400',
    sections: [
      { value: 'vitalSigns.height', label: 'Talla' },
      { value: 'vitalSigns.weight', label: 'Peso' },
      { value: 'vitalSigns.blood_pressure', label: 'Tensión Arterial' },
      { value: 'vitalSigns.temperature', label: 'Temperatura' },
      { value: 'vitalSigns.heartRate', label: 'Frecuencia Cardíaca' },
      { value: 'vitalSigns.respiratoryRate', label: 'Frecuencia Respiratoria' },
      { value: 'vitalSigns.oxygenSaturation', label: 'Saturación de O₂' },
    ],
  },
  {
    key: 'physicalExamination',
    label: '🔬 Exploración Física',
    color: 'border-cyan-500',
    sections: [
      { value: 'physicalExamination', label: 'Exploración Física' },
    ],
  },
  {
    key: 'mentalExam',
    label: '🧠 Examen Mental',
    color: 'border-purple-500',
    allOrNothing: true,
    sections: [
      { value: 'mentalExam.apariencia', label: 'Apariencia General' },
      { value: 'mentalExam.conducta', label: 'Conducta Psicomotora' },
      { value: 'mentalExam.actitud', label: 'Actitud / Rapport' },
      { value: 'mentalExam.habla', label: 'Habla' },
      { value: 'mentalExam.afecto', label: 'Afecto' },
      { value: 'mentalExam.animo', label: 'Estado de Ánimo' },
      { value: 'mentalExam.pensamiento_proceso', label: 'Proceso del Pensamiento' },
      { value: 'mentalExam.pensamiento_contenido', label: 'Contenido del Pensamiento' },
      { value: 'mentalExam.percepcion', label: 'Percepción' },
      { value: 'mentalExam.cognicion', label: 'Cognición' },
      { value: 'mentalExam.insight_juicio', label: 'Insight y Juicio' },
      { value: 'mentalExam.funcionalidad', label: 'Funcionalidad Global' },
    ],
  },
  {
    key: 'sintomatologiaActual',
    label: '📋 Sintomatología Actual',
    color: 'border-teal-500',
    sections: [
      { value: 'sintomatologiaActual.motivo_consulta', label: 'Motivo de Consulta' },
      { value: 'sintomatologiaActual.queja_principal', label: 'Queja Principal' },
      { value: 'sintomatologiaActual.sintoma_principal', label: 'Síntoma Principal' },
      { value: 'sintomatologiaActual.historia_sintomas_actuales', label: 'Historia de Síntomas Actuales' },
      { value: 'sintomatologiaActual.duracion_sintomas', label: 'Duración de Síntomas' },
      { value: 'sintomatologiaActual.factores_precipitantes', label: 'Factores Precipitantes' },
      { value: 'sintomatologiaActual.referido_por', label: 'Referido Por' },
      { value: 'sintomatologiaActual.padecimiento_actual', label: 'Padecimiento Actual (narrativo)' },
      { value: 'sintomatologiaActual.curso_enfermedad', label: 'Curso de la Enfermedad' },
      { value: 'sintomatologiaActual.sintomas_cardinales', label: 'Síntomas Cardinales' },
      { value: 'sintomatologiaActual.impacto_fucional', label: 'Impacto Funcional' },
      { value: 'sintomatologiaActual.sueno', label: 'Sueño' },
      { value: 'sintomatologiaActual.apetito', label: 'Apetito' },
      { value: 'sintomatologiaActual.energia', label: 'Energía' },
      { value: 'sintomatologiaActual.descripcion_problema', label: 'Descripción del Problema' },
      { value: 'sintomatologiaActual.pensamientos_asociados', label: 'Pensamientos Asociados' },
      { value: 'sintomatologiaActual.emociones_asociadas', label: 'Emociones Asociadas' },
      { value: 'sintomatologiaActual.conductas_asociadas', label: 'Conductas Asociadas' },
      { value: 'sintomatologiaActual.terapia_antes', label: 'Terapia Previa' },
      { value: 'sintomatologiaActual.espera_terapia', label: 'Expectativas de Terapia' },
    ],
  },
  {
    key: 'antecedentesPsiquiatricos',
    label: '🏥 Antecedentes Psiquiátricos',
    color: 'border-indigo-500',
    sections: [
      { value: 'antecedentesPsiquiatricos.diagnosticos_previos', label: 'Diagnósticos Previos' },
      { value: 'antecedentesPsiquiatricos.hospitalizaciones_previas', label: 'Hospitalizaciones Previas' },
      { value: 'antecedentesPsiquiatricos.tratamientos_previos', label: 'Tratamientos Previos (medicamentos)' },
      { value: 'antecedentesPsiquiatricos.psicoterapias_previas', label: 'Psicoterapias Previas' },
      { value: 'antecedentesPsiquiatricos.tec', label: 'TEC (Terapia Electroconvulsiva)' },
      { value: 'antecedentesPsiquiatricos.emt', label: 'EMT (Estimulación Magnética Transcraneal)' },
      { value: 'antecedentesPsiquiatricos.otros_tratamientos_somaticos', label: 'Otros Tratamientos Somáticos' },
    ],
  },
  {
    key: 'historiaRiesgo',
    label: '⚠️ Historia de Riesgo',
    color: 'border-red-600',
    sections: [
      { value: 'historiaRiesgo.ideacion_suicida_previa', label: 'Ideación Suicida Previa' },
      { value: 'historiaRiesgo.intentos_suicidio_previos', label: 'Intentos de Suicidio Previos' },
      { value: 'historiaRiesgo.autolesiones_no_suicidas', label: 'Autolesiones No Suicidas' },
      { value: 'historiaRiesgo.ideacion_homicida_previa', label: 'Ideación Homicida Previa' },
      { value: 'historiaRiesgo.conductas_violentas_previas', label: 'Conductas Violentas Previas' },
      { value: 'historiaRiesgo.acceso_armas', label: 'Acceso a Armas' },
      { value: 'historiaRiesgo.acceso_medicamentos_cantidad', label: 'Acceso a Medicamentos en Cantidad' },
      { value: 'historiaRiesgo.acceso_medios_letales', label: 'Acceso a Medios Letales' },
      { value: 'historiaRiesgo.conducta_agresiva', label: 'Conducta Agresiva' },
      { value: 'historiaRiesgo.nivel_riesgo', label: 'Nivel de Riesgo Actual' },
      { value: 'historiaRiesgo.plan_seguridad', label: 'Plan de Seguridad' },
      { value: 'historiaRiesgo.eventos_precipitantes', label: 'Eventos Precipitantes' },
      { value: 'historiaRiesgo.uso_sustancias_recienta', label: 'Uso de Sustancias Reciente' },
      { value: 'historiaRiesgo.suspension_medicamentos', label: 'Suspensión de Medicamentos' },
      { value: 'historiaRiesgo.estresores_identificados', label: 'Estresores Identificados' },
      { value: 'historiaRiesgo.perdidas_recientes', label: 'Pérdidas Recientes' },
    ],
  },
  {
    key: 'usoSustancias',
    label: '🍺 Uso de Sustancias',
    color: 'border-orange-500',
    sections: [
      { value: 'usoSustancias.tabaco', label: 'Tabaco' },
      { value: 'usoSustancias.alcohol', label: 'Alcohol' },
      { value: 'usoSustancias.cannabis', label: 'Cannabis' },
      { value: 'usoSustancias.cocaina', label: 'Cocaína' },
      { value: 'usoSustancias.opioides', label: 'Opioides' },
      { value: 'usoSustancias.benzodiacepinas', label: 'Benzodiacepinas (no prescritas)' },
      { value: 'usoSustancias.otras_sustancias', label: 'Otras Sustancias' },
      { value: 'usoSustancias.tratamientos_previos_accidente', label: 'Tratamientos Previos por Adicciones' },
      { value: 'usoSustancias.internamientos_previos_sustancias', label: 'Internamientos Previos' },
      { value: 'usoSustancias.ultima_intoxicacion', label: 'Última Intoxicación' },
      { value: 'usoSustancias.inicio_abstinencia', label: 'Inicio de Abstinencia' },
    ],
  },
  {
    key: 'antecedentesMedicos',
    label: '🩺 Antecedentes Médicos',
    color: 'border-blue-600',
    sections: [
      { value: 'antecedentesMedicos.enfermedades_cronicas', label: 'Enfermedades Crónicas' },
      { value: 'antecedentesMedicos.cirugias_previas', label: 'Cirugías Previas' },
      { value: 'antecedentesMedicos.hospitalizaciones_medicas', label: 'Hospitalizaciones Médicas' },
      { value: 'antecedentesMedicos.alergias_medicamentos', label: 'Alergias a Medicamentos' },
      { value: 'antecedentesMedicos.medicamentos_actuales', label: 'Medicamentos Actuales' },
      { value: 'antecedentesMedicos.condiciones_neurologicas', label: 'Condiciones Neurológicas' },
      { value: 'antecedentesMedicos.enfermedades_endocrinas', label: 'Enfermedades Endocrinas' },
      { value: 'antecedentesMedicos.embarazo_actual', label: 'Embarazo Actual' },
      { value: 'antecedentesMedicos.lactancia', label: 'Lactancia' },
      { value: 'antecedentesMedicos.ultima_menstruacion', label: 'Última Menstruación' },
      { value: 'antecedentesMedicos.metodo_anticonceptivo', label: 'Método Anticonceptivo' },
    ],
  },
  {
    key: 'antecedentesHeredofamiliares',
    label: '👨‍👩‍👧 Antecedentes Heredofamiliares',
    color: 'border-green-600',
    sections: [
      { value: 'antecedentesHeredofamiliares.derpesion', label: 'Depresión Familiar' },
      { value: 'antecedentesHeredofamiliares.trastorno_bipolar', label: 'Trastorno Bipolar Familiar' },
      { value: 'antecedentesHeredofamiliares.esquizofrenia', label: 'Esquizofrenia / Psicosis Familiar' },
      { value: 'antecedentesHeredofamiliares.ansiedad', label: 'Ansiedad Familiar' },
      { value: 'antecedentesHeredofamiliares.tdah', label: 'TDAH Familiar' },
      { value: 'antecedentesHeredofamiliares.demencia', label: 'Demencia Familiar' },
      { value: 'antecedentesHeredofamiliares.uso_sustancias', label: 'Uso de Sustancias Familiar' },
      { value: 'antecedentesHeredofamiliares.suicidio', label: 'Suicidio Familiar' },
      { value: 'antecedentesHeredofamiliares.enfermedades_relevantes', label: 'Otras Enfermedades Relevantes' },
    ],
  },
  {
    key: 'historiaPersonalSocial',
    label: '👤 Historia Personal y Social',
    color: 'border-emerald-500',
    sections: [
      { value: 'historiaPersonalSocial.embarazo_parto', label: 'Embarazo y Parto' },
      { value: 'historiaPersonalSocial.desarrollo_psicomotor', label: 'Desarrollo Psicomotor' },
      { value: 'historiaPersonalSocial.historia_escolar', label: 'Historia Escolar' },
      { value: 'historiaPersonalSocial.problemas_aprendizaje', label: 'Problemas de Aprendizaje' },
      { value: 'historiaPersonalSocial.historia_laboral', label: 'Historia Laboral' },
      { value: 'historiaPersonalSocial.situacion_laboral_actual', label: 'Situación Laboral Actual' },
      { value: 'historiaPersonalSocial.historia_relaciones', label: 'Historia de Relaciones' },
      { value: 'historiaPersonalSocial.convivencia_actual', label: 'Convivencia Actual' },
      { value: 'historiaPersonalSocial.apoyo_social', label: 'Apoyo Social' },
      { value: 'historiaPersonalSocial.situacion_economica', label: 'Situación Económica' },
      { value: 'historiaPersonalSocial.situacion_legal', label: 'Situación Legal' },
      { value: 'historiaPersonalSocial.trauma_infantil', label: 'Trauma Infantil (ACEs)' },
      { value: 'historiaPersonalSocial.abuso_fisico', label: 'Abuso Físico' },
      { value: 'historiaPersonalSocial.abuso_sexual', label: 'Abuso Sexual' },
      { value: 'historiaPersonalSocial.negligencia', label: 'Negligencia' },
      { value: 'historiaPersonalSocial.voilencia_domestica', label: 'Violencia Doméstica' },
      { value: 'historiaPersonalSocial.intereses_pasatiempos', label: 'Intereses y Pasatiempos' },
      { value: 'historiaPersonalSocial.fortalezas_paciente', label: 'Fortalezas del Paciente' },
    ],
  },
  {
    key: 'estadoInicio',
    label: '🎯 Estado al Inicio de Sesión',
    color: 'border-violet-400',
    sections: [
      { value: 'estadoInicio.estado_emocional', label: 'Estado Emocional' },
      { value: 'estadoInicio.nivel_malestar', label: 'Nivel de Malestar (0–10)' },
      { value: 'estadoInicio.eventos_ultima_sesion', label: 'Eventos desde Última Sesión' },
      { value: 'estadoInicio.trae_hoy', label: '¿Qué Trae Hoy?' },
    ],
  },
  {
    key: 'contenidoSesion',
    label: '💬 Contenido de Sesión',
    color: 'border-violet-600',
    sections: [
      { value: 'contenidoSesion.temas_principales', label: 'Temas Principales Abordados' },
      { value: 'contenidoSesion.tecnicas_utilizadas', label: 'Técnicas / Intervenciones' },
      { value: 'contenidoSesion.momentos_significativos', label: 'Momentos Significativos' },
      { value: 'contenidoSesion.insights_paciente', label: 'Insights del Paciente' },
      { value: 'contenidoSesion.emociones_trabajadas', label: 'Emociones Trabajadas' },
      { value: 'contenidoSesion.resistencias_observadas', label: 'Resistencias Observadas' },
    ],
  },
  {
    key: 'diagnosis',
    label: '🔍 Diagnóstico (CIE-10 / DSM-5TR)',
    color: 'border-emerald-600',
    sections: [
      { value: 'diagnosis', label: 'Diagnóstico Principal' },
      { value: 'diagnosis.diferencial', label: 'Diagnóstico Diferencial' },
    ],
  },
  {
    key: 'planManejo',
    label: '📝 Plan de Manejo',
    color: 'border-sky-500',
    sections: [
      { value: 'planManejo.farmacoterapia_indicada', label: 'Farmacoterapia Indicada' },
      { value: 'planManejo.plan_manejo_tratamiento', label: 'Plan de Manejo / Tratamiento' },
      { value: 'planManejo.psicoterapia_indicada', label: 'Psicoterapia Indicada' },
      { value: 'planManejo.enfoque_terapeutico_propuesto', label: 'Enfoque Terapéutico' },
      { value: 'planManejo.objetivos_terapeuticos', label: 'Objetivos Terapéuticos' },
      { value: 'planManejo.tarea_proxima_sesion', label: 'Tarea Próxima Sesión' },
      { value: 'planManejo.tareas_asignadas_previamente', label: 'Tareas Asignadas Previamente' },
      { value: 'planManejo.frecuencia_sesiones', label: 'Frecuencia de Sesiones' },
      { value: 'planManejo.referencias_interconsultas', label: 'Referencias / Interconsultas' },
      { value: 'planManejo.psicoeducacion_proporcionada', label: 'Psicoeducación Proporcionada' },
      { value: 'planManejo.temas_a_continuar', label: 'Temas a Continuar' },
      { value: 'planManejo.progreso', label: 'Progreso' },
      { value: 'planManejo.necesidad_evaluacion_psiquiatrica', label: 'Necesidad Evaluación Psiquiátrica' },
      { value: 'planManejo.necesidad_pruebas_neuropsicologicas', label: 'Necesidad Pruebas Neuropsicológicas' },
      { value: 'planManejo.cambios_plan_tratamiento', label: 'Cambios en Plan de Tratamiento' },
    ],
  },
  {
    key: 'analisisConclusiones',
    label: '🧩 Análisis y Conclusiones',
    color: 'border-amber-500',
    sections: [
      { value: 'analisisConclusiones.analisis_clinico', label: 'Análisis Clínico' },
      { value: 'analisisConclusiones.diagnostico_diferencial', label: 'Diagnóstico Diferencial' },
      { value: 'analisisConclusiones.observaciones_progreso', label: 'Observaciones de Progreso' },
      { value: 'analisisConclusiones.estado_emocional', label: 'Estado Emocional al Cierre' },
      { value: 'analisisConclusiones.nivel_malestar_cierre', label: 'Nivel de Malestar al Cierre' },
      { value: 'analisisConclusiones.cambios_ultima_visita', label: 'Cambios desde Última Visita' },
      { value: 'analisisConclusiones.adherencia_tratamiento', label: 'Adherencia al Tratamiento' },
      { value: 'analisisConclusiones.pronostico', label: 'Pronóstico' },
    ],
  },
  {
    key: 'formulacionCaso',
    label: '🗂️ Formulación del Caso',
    color: 'border-rose-400',
    sections: [
      { value: 'formulacionCaso.hipotesis_trabajo', label: 'Hipótesis de Trabajo' },
      { value: 'formulacionCaso.factores_predisponentes', label: 'Factores Predisponentes' },
      { value: 'formulacionCaso.factores_precipitantes', label: 'Factores Precipitantes' },
      { value: 'formulacionCaso.factores_mantenimiento', label: 'Factores de Mantenimiento' },
      { value: 'formulacionCaso.factores_protectores', label: 'Factores Protectores' },
      { value: 'formulacionCaso.diagnostico_presuntivo', label: 'Diagnóstico Presuntivo' },
    ],
  },
  {
    key: 'redApoyo',
    label: '🤝 Red de Apoyo',
    color: 'border-pink-400',
    sections: [
      { value: 'redApoyo.redes_disponibles', label: 'Redes Disponibles' },
      { value: 'redApoyo.contencion', label: 'Contención' },
      { value: 'redApoyo.contacto_emergencia', label: 'Contacto de Emergencia' },
    ],
  },
  {
    key: 'intervencionCrisis',
    label: '🆘 Intervención en Crisis',
    color: 'border-red-700',
    sections: [
      { value: 'intervencionCrisis.intervencion_crisis', label: 'Intervención en Crisis' },
      { value: 'intervencionCrisis.contencion_verbal', label: 'Contención Verbal' },
      { value: 'intervencionCrisis.medicacion_urgencia', label: 'Medicación de Urgencia' },
      { value: 'intervencionCrisis.restriccion_medios', label: 'Restricción de Medios' },
      { value: 'intervencionCrisis.llamada_familia', label: 'Llamada a Familiar' },
      { value: 'intervencionCrisis.psicoeducacion', label: 'Psicoeducación' },
      { value: 'intervencionCrisis.destino', label: 'Destino del Paciente' },
      { value: 'intervencionCrisis.criterios_hospitalizacion', label: 'Criterios de Hospitalización' },
      { value: 'intervencionCrisis.plan_egreso', label: 'Plan de Egreso' },
      { value: 'intervencionCrisis.instrucciones', label: 'Instrucciones al Paciente' },
      { value: 'intervencionCrisis.consentimiento_paciente', label: 'Consentimiento del Paciente' },
      { value: 'intervencionCrisis.consentimiento_familiar', label: 'Consentimiento Familiar' },
    ],
  },
  {
    key: 'medications',
    label: '💊 Recetas / Medicamentos',
    color: 'border-teal-500',
    sections: [
      { value: 'medications', label: 'Receta de Medicamentos' },
    ],
  },
  {
    key: 'evaluations',
    label: '📊 Evaluaciones Psicométricas (Clinimetrix)',
    color: 'border-blue-400',
    sections: [
      { value: 'evaluations', label: 'Escalas Psicométricas' },
    ],
  },
  {
    key: 'labOrders',
    label: '🔬 Solicitud de Estudios de Gabinete',
    color: 'border-yellow-500',
    sections: [
      { value: 'labOrders.tac', label: 'TAC' },
      { value: 'labOrders.rm', label: 'Resonancia Magnética' },
      { value: 'labOrders.ultrasonido', label: 'Ultrasonido' },
      { value: 'labOrders.poligrafia', label: 'Poligrafía' },
      { value: 'labOrders.polisomnografia', label: 'Polisomnografía' },
      { value: 'labOrders.otro', label: 'Otro Estudio de Gabinete' },
    ],
  },
  {
    key: 'labResults',
    label: '🧪 Resultados de Laboratorio',
    color: 'border-lime-500',
    sections: [
      { value: 'labResults', label: 'Resultados de Estudios' },
    ],
  },
  {
    key: 'additionalInstructions',
    label: '📋 Indicaciones al Paciente',
    color: 'border-gray-400',
    sections: [
      { value: 'additionalInstructions', label: 'Indicaciones al Paciente' },
    ],
  },
  {
    key: 'nextAppointment',
    label: '📅 Próxima Cita',
    color: 'border-gray-500',
    sections: [
      { value: 'nextAppointment.date', label: 'Fecha' },
      { value: 'nextAppointment.time', label: 'Hora' },
    ],
  },
];

// Todos los valores de campo (flat) para "seleccionar todo"
const ALL_SECTION_VALUES = FIELD_CATEGORIES.flatMap(c => c.sections.map(s => s.value));

// Helper: obtiene todos los campos de las categorías indicadas
const getDefaults = (...categoryKeys: string[]) =>
  FIELD_CATEGORIES
    .filter(c => categoryKeys.includes(c.key))
    .flatMap(c => c.sections.map(s => s.value));

// Defaults por tipo de plantilla (basado en Glian_Expedix_Plantillas.numbers)
const DEFAULT_FIELDS_BY_TYPE: Record<string, string[]> = {
  psychiatry_initial: getDefaults(
    'currentCondition', 'vitalSigns', 'physicalExamination',
    'sintomatologiaActual', 'antecedentesPsiquiatricos', 'historiaRiesgo',
    'usoSustancias', 'antecedentesMedicos', 'antecedentesHeredofamiliares',
    'historiaPersonalSocial', 'mentalExam',
    'diagnosis', 'planManejo', 'analisisConclusiones', 'formulacionCaso',
    'medications', 'labOrders', 'nextAppointment',
  ),
  psychiatry_followup: getDefaults(
    'currentCondition', 'sintomatologiaActual', 'mentalExam', 'historiaRiesgo',
    'diagnosis', 'planManejo', 'medications', 'evaluations', 'nextAppointment',
  ),
  psychology_initial: getDefaults(
    'currentCondition', 'sintomatologiaActual',
    'historiaPersonalSocial', 'antecedentesPsiquiatricos', 'historiaRiesgo',
    'formulacionCaso', 'planManejo', 'nextAppointment',
  ),
  psychotherapy_followup: getDefaults(
    'estadoInicio', 'contenidoSesion', 'planManejo', 'evaluations', 'nextAppointment',
  ),
  soap: getDefaults(
    'currentCondition', 'vitalSigns', 'mentalExam',
    'analisisConclusiones', 'diagnosis', 'planManejo', 'medications', 'nextAppointment',
  ),
  emergency: getDefaults(
    'currentCondition', 'historiaRiesgo', 'mentalExam',
    'redApoyo', 'intervencionCrisis', 'planManejo', 'medications',
  ),
  custom: getDefaults('currentCondition', 'mentalExam', 'vitalSigns', 'diagnosis'),
};

export default function ConsultationTemplateManager({
  onTemplateSelect,
  showActions = true
}: ConsultationTemplateManagerProps) {
  const [templates, setTemplates] = useState<ConsultationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ConsultationTemplate | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(FIELD_CATEGORIES.map(c => c.key)));
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'psychiatry_initial',
    fields_config: DEFAULT_FIELDS_BY_TYPE['psychiatry_initial'] as string[],
    is_default: false
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token || ''}`,
      'Content-Type': 'application/json'
    };
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/expedix/consultation-templates/', { method: 'GET', headers });
      if (response.ok) {
        const data = await response.json();
        const templatesData = data.data || data || [];
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const headers = await getAuthHeaders();
      if (editingTemplate) {
        const response = await fetch(`/api/expedix/consultation-templates/?id=${editingTemplate.id}`, {
          method: 'PUT', headers, body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } else {
        const response = await fetch('/api/expedix/consultation-templates/', {
          method: 'POST', headers, body: JSON.stringify(formData)
        });
        if (!response.ok) {
          const data = await response.json();
          const msg = data.errors?.template_type?.[0] || data.errors?.identifier?.[0] || data.errors?.detail || 'Error';
          toast.error(msg);
          throw new Error(`HTTP ${response.status}`);
        }
      }
      await loadTemplates();
      resetForm();
      toast.success(editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la plantilla de consulta.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const headers = await getAuthHeaders();
          const response = await fetch(`/api/expedix/consultation-templates/?id=${templateId}`, { method: 'DELETE', headers });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await loadTemplates();
          toast.success('La plantilla ha sido eliminada.');
        } catch {
          toast.error('Hubo un problema al eliminar la plantilla.');
        }
      }
    });
  };

  const handleEdit = (template: ConsultationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      template_type: template.template_type,
      fields_config: template.fields_config || [],
      is_default: template.is_default
    });
    setShowForm(true);
    // Expand all categories when editing
    setExpandedCategories(new Set(FIELD_CATEGORIES.map(c => c.key)));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_type: 'psychiatry_initial',
      fields_config: DEFAULT_FIELDS_BY_TYPE['psychiatry_initial'],
      is_default: false
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  // Toggle a single section field
  const toggleSection = (value: string) => {
    setFormData(prev => ({
      ...prev,
      fields_config: prev.fields_config.includes(value)
        ? prev.fields_config.filter(f => f !== value)
        : [...prev.fields_config, value]
    }));
  };

  // Toggle all sections in a category (master checkbox)
  const toggleCategory = (category: FieldCategory) => {
    const categoryValues = category.sections.map(s => s.value);
    const allSelected = categoryValues.every(v => formData.fields_config.includes(v));
    setFormData(prev => ({
      ...prev,
      fields_config: allSelected
        ? prev.fields_config.filter(f => !categoryValues.includes(f))
        : [...new Set([...prev.fields_config, ...categoryValues])]
    }));
  };

  // Check if all sections in a category are selected
  const isCategoryAllSelected = (category: FieldCategory) =>
    category.sections.every(s => formData.fields_config.includes(s.value));

  // Check if some (but not all) sections in a category are selected
  const isCategoryPartiallySelected = (category: FieldCategory) =>
    category.sections.some(s => formData.fields_config.includes(s.value)) && !isCategoryAllSelected(category);

  const toggleCategoryExpand = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const getLabelForValue = (value: string) =>
    FIELD_CATEGORIES.flatMap(c => c.sections).find(s => s.value === value)?.label || value;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Plantillas de Consulta</h3>
          <p className="text-sm text-gray-600">
            Configura qué secciones se muestran en cada tipo de consulta
          </p>
        </div>
        {showActions && (
          <Button onClick={() => { setShowForm(true); setExpandedCategories(new Set(FIELD_CATEGORIES.map(c => c.key))); }} className="bg-blue-600 hover:bg-blue-700">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
        )}
      </div>

      {/* Template Form */}
      {showForm && (
        <Card className="p-6">
          <h4 className="text-lg font-medium mb-4">
            {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </h4>

          {/* Name, type, description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de la plantilla"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Plantilla</label>
              <select
                value={formData.template_type}
                onChange={(e) => {
                  const type = e.target.value;
                  const defaults = DEFAULT_FIELDS_BY_TYPE[type] || DEFAULT_FIELDS_BY_TYPE['custom'];
                  setFormData(prev => ({ ...prev, template_type: type, fields_config: defaults }));
                }}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {TEMPLATE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Al cambiar el tipo se preconfiguran las secciones recomendadas para ese formato
              </p>
            </div>
          </div>

          {/* Always-visible fields note */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">
              Siempre visibles (Información General — no configurables):
            </p>
            <div className="flex flex-wrap gap-1">
              {['Fecha de consulta', 'Tipo de nota', 'Hora de inicio/fin', 'Modalidad de atención', 'Notas privadas'].map(f => (
                <span key={f} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs">{f}</span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Descripción de la plantilla"
            />
          </div>

          {/* Sections selector by category */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">Secciones a Incluir</label>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    fields_config: DEFAULT_FIELDS_BY_TYPE[prev.template_type] || DEFAULT_FIELDS_BY_TYPE['custom']
                  }))}
                  className="text-xs text-violet-600 hover:underline"
                >
                  Restaurar predeterminados
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, fields_config: [...ALL_SECTION_VALUES] }))}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Seleccionar todo
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, fields_config: [] }))}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Limpiar todo
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {FIELD_CATEGORIES.map((category) => {
                const isExpanded = expandedCategories.has(category.key);
                const allSelected = isCategoryAllSelected(category);
                const partialSelected = isCategoryPartiallySelected(category);
                const selectedCount = category.sections.filter(s => formData.fields_config.includes(s.value)).length;

                return (
                  <div key={category.key} className={`border-l-4 ${category.color} rounded-r-lg bg-white shadow-sm`}>
                    {/* Category header */}
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-r-lg"
                      onClick={() => toggleCategoryExpand(category.key)}
                    >
                      {/* Master checkbox */}
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded cursor-pointer"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = partialSelected; }}
                        onChange={(e) => { e.stopPropagation(); toggleCategory(category); }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={category.allOrNothing}
                      />
                      <span className="font-medium text-sm flex-1">{category.label}</span>
                      <span className="text-xs text-gray-400 mr-2">
                        {selectedCount}/{category.sections.length}
                      </span>
                      {isExpanded
                        ? <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        : <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                      }
                    </div>

                    {/* Section checkboxes */}
                    {isExpanded && (
                      <div className="px-6 pb-3 grid grid-cols-1 md:grid-cols-2 gap-1">
                        {category.allOrNothing && (
                          <p className="col-span-full text-xs text-purple-600 mb-1 italic">
                            ✦ Esta sección se activa completa o no se muestra
                          </p>
                        )}
                        {category.sections.map(section => (
                          <label key={section.value} className="flex items-center gap-2 py-1 cursor-pointer hover:text-blue-700">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded cursor-pointer"
                              checked={formData.fields_config.includes(section.value)}
                              onChange={() => toggleSection(section.value)}
                            />
                            <span className="text-sm">{section.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected summary */}
          {formData.fields_config.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-700 mb-1">
                {formData.fields_config.length} secciones seleccionadas:
              </p>
              <div className="flex flex-wrap gap-1">
                {formData.fields_config.map(v => (
                  <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {getLabelForValue(v)}
                    <button onClick={() => toggleSection(v)} className="hover:text-red-600 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Usar como plantilla por defecto</span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
            </Button>
            <Button onClick={resetForm} variant="outline">Cancelar</Button>
          </div>
        </Card>
      )}

      {/* Templates list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(templates) && templates.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">{template.name}</h4>
                {template.is_default && (
                  <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                    Por defecto
                  </span>
                )}
              </div>
              {showActions && (
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(template)} className="p-1 text-gray-400 hover:text-blue-600">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(template.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-2">{template.description}</p>

            <div className="text-xs text-gray-500 mb-2">
              <span className="font-medium">Tipo:</span>{' '}
              {TEMPLATE_TYPES.find(t => t.value === template.template_type)?.label || template.template_type}
            </div>

            {/* Show sections grouped by category */}
            <div className="space-y-1 mb-3">
              {FIELD_CATEGORIES.map(cat => {
                const active = cat.sections.filter(s => (template.fields_config || []).includes(s.value));
                if (active.length === 0) return null;
                return (
                  <div key={cat.key} className="text-xs">
                    <span className="font-medium text-gray-600">{cat.label}:</span>{' '}
                    <span className="text-gray-500">{active.map(s => s.label).join(', ')}</span>
                  </div>
                );
              })}
              {(template.fields_config?.length ?? 0) === 0 && (
                <p className="text-xs text-gray-400 italic">Sin secciones configuradas</p>
              )}
            </div>

            {onTemplateSelect && (
              <Button onClick={() => onTemplateSelect(template)} className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-2">
                Usar Plantilla
              </Button>
            )}
          </Card>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p>No hay plantillas configuradas</p>
            {showActions && (
              <Button onClick={() => setShowForm(true)} className="mt-3 bg-blue-600 hover:bg-blue-700">
                Crear Primera Plantilla
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
