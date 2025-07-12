'use client';

import React from 'react';
import { UniversalScaleRenderer, UniversalScale } from '../UniversalScaleRenderer';

// PHQ-9 Scale Definition following the HTML structure you provided
export const PHQ9_SCALE_DEFINITION: UniversalScale = {
  id: 'phq-9',
  name: 'Cuestionario de Salud del Paciente - 9',
  abbreviation: 'PHQ-9',
  description: 'Instrumento de evaluación para síntomas depresivos',
  instructions: [
    'Durante las ÚLTIMAS DOS SEMANAS, ¿con qué frecuencia le ha afectado alguno de los siguientes problemas?',
    'Por favor, seleccione la opción que mejor describa su experiencia para cada pregunta.',
    'Esta evaluación consta de 9 preguntas principales más una pregunta adicional sobre el impacto funcional.'
  ],
  category: 'Trastornos del Estado de Ánimo',
  totalItems: 10, // 9 main questions + 1 functional question
  estimatedDurationMinutes: 5,
  items: [
    {
      id: 'phq9_1',
      itemNumber: 1,
      questionText: 'Poco interés o alegría para hacer las cosas',
      responseType: 'likert',
      responseOptions: [
        { value: '0', label: 'Nunca', score: 0 },
        { value: '1', label: 'Varios días', score: 1 },
        { value: '2', label: 'Más de la mitad de los días', score: 2 },
        { value: '3', label: 'Casi todos los días', score: 3 }
      ],
      required: true,
      scoringWeight: 1.0
    },
    {
      id: 'phq9_2',
      itemNumber: 2,
      questionText: 'Sensación de estar decaído, deprimido o desesperanzado',
      responseType: 'likert',
      responseOptions: [
        { value: '0', label: 'Nunca', score: 0 },
        { value: '1', label: 'Varios días', score: 1 },
        { value: '2', label: 'Más de la mitad de los días', score: 2 },
        { value: '3', label: 'Casi todos los días', score: 3 }
      ],
      required: true,
      scoringWeight: 1.0
    },
    {
      id: 'phq9_3',
      itemNumber: 3,
      questionText: 'Problemas para quedarse dormido, para seguir durmiendo o dormir demasiado',
      responseType: 'likert',
      responseOptions: [
        { value: '0', label: 'Nunca', score: 0 },
        { value: '1', label: 'Varios días', score: 1 },
        { value: '2', label: 'Más de la mitad de los días', score: 2 },
        { value: '3', label: 'Casi todos los días', score: 3 }
      ],
      required: true,
      scoringWeight: 1.0
    },
    {
      id: 'phq9_4',
      itemNumber: 4,
      questionText: 'Sensación de cansancio o de tener poca energía',
      responseType: 'likert',
      responseOptions: [
        { value: '0', label: 'Nunca', score: 0 },
        { value: '1', label: 'Varios días', score: 1 },
        { value: '2', label: 'Más de la mitad de los días', score: 2 },
        { value: '3', label: 'Casi todos los días', score: 3 }
      ],
      required: true,
      scoringWeight: 1.0
    },
    {
      id: 'phq9_5',
      itemNumber: 5,
      questionText: 'Poco apetito o comer demasiado',
      responseType: 'likert',
      responseOptions: [
        { value: '0', label: 'Nunca', score: 0 },
        { value: '1', label: 'Varios días', score: 1 },
        { value: '2', label: 'Más de la mitad de los días', score: 2 },
        { value: '3', label: 'Casi todos los días', score: 3 }
      ],
      required: true,
      scoringWeight: 1.0
    },
    {
      id: 'phq9_6',
      itemNumber: 6,
      questionText: 'Sentirse mal consigo mismo; sentir que es un fracasado o que ha decepcionado a su familia o a sí mismo',
      responseType: 'likert',
      responseOptions: [
        { value: '0', label: 'Nunca', score: 0 },
        { value: '1', label: 'Varios días', score: 1 },
        { value: '2', label: 'Más de la mitad de los días', score: 2 },
        { value: '3', label: 'Casi todos los días', score: 3 }
      ],
      required: true,
      scoringWeight: 1.0
    },
    {
      id: 'phq9_7',
      itemNumber: 7,
      questionText: 'Problemas para concentrarse en algo, como leer el periódico o ver la televisión',
      responseType: 'likert',
      responseOptions: [
        { value: '0', label: 'Nunca', score: 0 },
        { value: '1', label: 'Varios días', score: 1 },
        { value: '2', label: 'Más de la mitad de los días', score: 2 },
        { value: '3', label: 'Casi todos los días', score: 3 }
      ],
      required: true,
      scoringWeight: 1.0
    },
    {
      id: 'phq9_8',
      itemNumber: 8,
      questionText: 'Moverse o hablar tan despacio que los demás pueden haberlo notado. O lo contrario: estar tan inquieto o agitado que se ha estado moviendo de un lado a otro más de lo habitual',
      responseType: 'likert',
      responseOptions: [
        { value: '0', label: 'Nunca', score: 0 },
        { value: '1', label: 'Varios días', score: 1 },
        { value: '2', label: 'Más de la mitad de los días', score: 2 },
        { value: '3', label: 'Casi todos los días', score: 3 }
      ],
      required: true,
      scoringWeight: 1.0
    },
    {
      id: 'phq9_9',
      itemNumber: 9,
      questionText: 'Pensamientos de que estaría mejor muerto o de querer hacerse daño de algún modo',
      responseType: 'likert',
      responseOptions: [
        { value: '0', label: 'Nunca', score: 0 },
        { value: '1', label: 'Varios días', score: 1 },
        { value: '2', label: 'Más de la mitad de los días', score: 2 },
        { value: '3', label: 'Casi todos los días', score: 3 }
      ],
      required: true,
      scoringWeight: 1.0
    },
    {
      id: 'phq9_functional',
      itemNumber: 10,
      questionText: 'Si ha marcado alguno de los problemas de este cuestionario, ¿hasta qué punto estos problemas le han creado dificultades para hacer su trabajo, ocuparse de la casa o relacionarse con los demás?',
      responseType: 'likert',
      responseOptions: [
        { value: '0', label: 'Ninguna dificultad', score: 0 },
        { value: '1', label: 'Algunas dificultades', score: 1 },
        { value: '2', label: 'Muchas dificultades', score: 2 },
        { value: '3', label: 'Muchísimas dificultades', score: 3 }
      ],
      required: true,
      scoringWeight: 0 // This is not counted in the main score
    }
  ],
  scoringRules: {
    method: 'sum',
    maxScore: 27, // Only items 1-9 count for the main score
    interpretationRules: [
      {
        minScore: 0,
        maxScore: 4,
        interpretation: 'Sintomatología Depresiva Mínima. Los síntomas reportados son mínimos y no sugieren un episodio depresivo clínicamente significativo. Se recomienda monitoreo rutinario y promoción de hábitos saludables.',
        severity: 'minimal',
        recommendations: [
          'Mantenimiento de rutinas saludables',
          'Ejercicio regular',
          'Seguimiento preventivo'
        ]
      },
      {
        minScore: 5,
        maxScore: 9,
        interpretation: 'Sintomatología Depresiva Leve. Presencia de síntomas depresivos leves que pueden requerir vigilancia clínica. Se sugiere evaluación psicológica y consideración de intervenciones psicoterapéuticas.',
        severity: 'mild',
        recommendations: [
          'Evaluación psicológica',
          'Técnicas de manejo del estrés',
          'Seguimiento clínico en 2-4 semanas'
        ]
      },
      {
        minScore: 10,
        maxScore: 14,
        interpretation: 'Sintomatología Depresiva Moderada. Síntomas depresivos moderados que requieren intervención clínica activa. Se recomienda evaluación psiquiátrica y consideración de tratamiento psicoterapéutico y/o farmacológico.',
        severity: 'moderate',
        recommendations: [
          'Evaluación psiquiátrica prioritaria',
          'Inicio de psicoterapia estructurada',
          'Seguimiento clínico semanal'
        ]
      },
      {
        minScore: 15,
        maxScore: 19,
        interpretation: 'Sintomatología Depresiva Moderada-Severa. Síntomas depresivos moderados a severos que requieren intervención inmediata. Se recomienda evaluación psiquiátrica urgente y consideración de tratamiento combinado.',
        severity: 'severe',
        recommendations: [
          'Evaluación psiquiátrica urgente',
          'Tratamiento farmacológico y psicoterapéutico combinado',
          'Seguimiento estrecho'
        ]
      },
      {
        minScore: 20,
        maxScore: 27,
        interpretation: 'Sintomatología Depresiva Severa. Síntomas depresivos severos que requieren atención clínica inmediata y manejo especializado. Alto riesgo de deterioro funcional significativo.',
        severity: 'severe',
        recommendations: [
          'Evaluación psiquiátrica inmediata',
          'Hospitalización si es necesario',
          'Tratamiento intensivo combinado',
          'Seguimiento diario'
        ]
      }
    ]
  }
};

// Component for administering PHQ-9
interface PHQ9ScaleProps {
  patientId: string;
  administrationType: 'self_administered' | 'clinician_administered' | 'remote';
  onComplete: (results: any) => void;
  onSave?: (responses: Record<string, any>) => void;
}

export const PHQ9Scale: React.FC<PHQ9ScaleProps> = ({
  patientId,
  administrationType,
  onComplete,
  onSave
}) => {
  
  const handleComplete = (results: any) => {
    // Check for suicide risk (item 9)
    const suicidalIdeation = results.responses['phq9_9'];
    const hasSuicidalThoughts = suicidalIdeation && parseInt(suicidalIdeation.value) >= 1;
    
    // Check for high-scoring items (≥2 points)
    const highScoreItems: string[] = [];
    const itemTexts = {
      'phq9_1': 'Anhedonia (pérdida de interés/placer)',
      'phq9_2': 'Estado de ánimo deprimido',
      'phq9_3': 'Alteraciones del sueño',
      'phq9_4': 'Fatiga/pérdida de energía',
      'phq9_5': 'Alteraciones del apetito',
      'phq9_6': 'Sentimientos de culpa/inutilidad',
      'phq9_7': 'Problemas de concentración',
      'phq9_8': 'Alteraciones psicomotoras'
    };

    Object.entries(results.responses).forEach(([itemId, response]) => {
      const resp = response as any;
      if (itemId !== 'phq9_functional' && parseInt(resp.value) >= 2) {
        highScoreItems.push(itemTexts[itemId as keyof typeof itemTexts]);
      }
    });

    // Check functional impairment
    const functionalImpairment = results.responses['phq9_functional'];
    const hasSignificantImpairment = functionalImpairment && parseInt(functionalImpairment.value) >= 2;

    // Add clinical alerts to results
    const alerts = [];
    
    if (hasSuicidalThoughts) {
      alerts.push({
        type: 'critical',
        title: '⚠️ ALERTA CRÍTICA: Ideación Suicida',
        message: 'El paciente reporta pensamientos de muerte o autolesión. Requiere evaluación inmediata de riesgo suicida y manejo de seguridad.'
      });
    }

    if (highScoreItems.length > 0) {
      alerts.push({
        type: 'warning',
        title: '⚠️ Síntomas Significativos',
        message: `Los siguientes síntomas requieren atención clínica: ${highScoreItems.join(', ')}.`
      });
    }

    if (hasSignificantImpairment) {
      alerts.push({
        type: 'functional',
        title: '📋 Deterioro Funcional Significativo',
        message: 'El paciente reporta dificultades importantes en el funcionamiento laboral, doméstico o social.'
      });
    }

    // Enhanced results with PHQ-9 specific data
    const enhancedResults = {
      ...results,
      alerts,
      clinicalData: {
        suicidalIdeation: hasSuicidalThoughts,
        suicidalIdeationScore: suicidalIdeation ? parseInt(suicidalIdeation.value) : 0,
        functionalImpairment: functionalImpairment ? parseInt(functionalImpairment.value) : 0,
        highScoreItems,
        requires_immediate_attention: hasSuicidalThoughts || results.scores.totalScore >= 15,
        dsm5_criteria: analyzeDSM5Criteria(results.responses)
      }
    };

    onComplete(enhancedResults);
  };

  // Analyze DSM-5 Major Depressive Episode criteria
  const analyzeDSM5Criteria = (responses: Record<string, any>) => {
    // Core symptoms (at least one required)
    const coreSymptoms = {
      depressed_mood: responses['phq9_2'] && parseInt(responses['phq9_2'].value) >= 2,
      anhedonia: responses['phq9_1'] && parseInt(responses['phq9_1'].value) >= 2
    };

    // Additional symptoms
    const additionalSymptoms = {
      sleep_disturbance: responses['phq9_3'] && parseInt(responses['phq9_3'].value) >= 2,
      fatigue: responses['phq9_4'] && parseInt(responses['phq9_4'].value) >= 2,
      appetite_changes: responses['phq9_5'] && parseInt(responses['phq9_5'].value) >= 2,
      guilt_worthlessness: responses['phq9_6'] && parseInt(responses['phq9_6'].value) >= 2,
      concentration_problems: responses['phq9_7'] && parseInt(responses['phq9_7'].value) >= 2,
      psychomotor_changes: responses['phq9_8'] && parseInt(responses['phq9_8'].value) >= 2,
      suicidal_ideation: responses['phq9_9'] && parseInt(responses['phq9_9'].value) >= 1
    };

    const coreSymptomCount = Object.values(coreSymptoms).filter(Boolean).length;
    const additionalSymptomCount = Object.values(additionalSymptoms).filter(Boolean).length;
    const totalSymptoms = coreSymptomCount + additionalSymptomCount;

    return {
      has_core_symptom: coreSymptomCount >= 1,
      core_symptom_count: coreSymptomCount,
      additional_symptom_count: additionalSymptomCount,
      total_symptom_count: totalSymptoms,
      meets_symptom_threshold: totalSymptoms >= 5,
      probable_major_depression: coreSymptomCount >= 1 && totalSymptoms >= 5,
      symptoms_detail: {
        core: coreSymptoms,
        additional: additionalSymptoms
      }
    };
  };

  return (
    <UniversalScaleRenderer
      scale={PHQ9_SCALE_DEFINITION}
      patientId={patientId}
      administrationType={administrationType}
      onComplete={handleComplete}
      onSave={onSave}
      autoSave={true}
      showProgress={true}
      enableBackNavigation={administrationType === 'clinician_administered'}
    />
  );
};

export default PHQ9Scale;