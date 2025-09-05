// Expedix diagnoses search API - Fallback implementation
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

// Comprehensive CIE-10 and DSM-5TR diagnoses database for mental health
const DIAGNOSES_DB = [
  // ===== CIE-10 DIAGNOSES =====
  
  // Trastornos del estado de ánimo (F30-F39)
  { code: 'F30.0', description: 'Hipomanía', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F30.1', description: 'Manía sin síntomas psicóticos', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F30.2', description: 'Manía con síntomas psicóticos', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F31.0', description: 'Trastorno bipolar, episodio actual hipomaníaco', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F31.1', description: 'Trastorno bipolar, episodio actual maníaco sin síntomas psicóticos', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F31.2', description: 'Trastorno bipolar, episodio actual maníaco con síntomas psicóticos', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F31.3', description: 'Trastorno bipolar, episodio actual depresivo leve o moderado', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F31.4', description: 'Trastorno bipolar, episodio actual depresivo grave sin síntomas psicóticos', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F31.5', description: 'Trastorno bipolar, episodio actual depresivo grave con síntomas psicóticos', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F31.6', description: 'Trastorno bipolar, episodio actual mixto', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F32.0', description: 'Episodio depresivo leve', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F32.1', description: 'Episodio depresivo moderado', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F32.2', description: 'Episodio depresivo grave sin síntomas psicóticos', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F32.3', description: 'Episodio depresivo grave con síntomas psicóticos', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F33.0', description: 'Trastorno depresivo recurrente, episodio actual leve', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F33.1', description: 'Trastorno depresivo recurrente, episodio actual moderado', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F33.2', description: 'Trastorno depresivo recurrente, episodio actual grave sin síntomas psicóticos', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F33.3', description: 'Trastorno depresivo recurrente, episodio actual grave con síntomas psicóticos', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F34.0', description: 'Ciclotimia', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },
  { code: 'F34.1', description: 'Distimia', category: 'CIE-10: Trastornos del estado de ánimo', system: 'CIE-10' },

  // Trastornos neuróticos, secundarios a situaciones estresantes y somatomorfos (F40-F48)
  { code: 'F40.0', description: 'Agorafobia', category: 'CIE-10: Trastornos neuróticos', system: 'CIE-10' },
  { code: 'F40.1', description: 'Fobias sociales', category: 'CIE-10: Trastornos neuróticos', system: 'CIE-10' },
  { code: 'F40.2', description: 'Fobias específicas (aisladas)', category: 'CIE-10: Trastornos neuróticos', system: 'CIE-10' },
  { code: 'F41.0', description: 'Trastorno de pánico [ansiedad paroxística episódica]', category: 'CIE-10: Trastornos neuróticos', system: 'CIE-10' },
  { code: 'F41.1', description: 'Trastorno de ansiedad generalizada', category: 'CIE-10: Trastornos neuróticos', system: 'CIE-10' },
  { code: 'F41.2', description: 'Trastorno mixto ansioso-depresivo', category: 'CIE-10: Trastornos neuróticos', system: 'CIE-10' },
  { code: 'F42.0', description: 'Trastorno obsesivo-compulsivo con predominio de pensamientos obsesivos', category: 'CIE-10: Trastornos neuróticos', system: 'CIE-10' },
  { code: 'F42.1', description: 'Trastorno obsesivo-compulsivo con predominio de actos compulsivos', category: 'CIE-10: Trastornos neuróticos', system: 'CIE-10' },
  { code: 'F42.2', description: 'Trastorno obsesivo-compulsivo mixto', category: 'CIE-10: Trastornos neuróticos', system: 'CIE-10' },
  { code: 'F43.0', description: 'Reacción a estrés agudo', category: 'CIE-10: Reacciones a estrés grave', system: 'CIE-10' },
  { code: 'F43.1', description: 'Trastorno de estrés postraumático', category: 'CIE-10: Reacciones a estrés grave', system: 'CIE-10' },
  { code: 'F43.2', description: 'Trastornos de adaptación', category: 'CIE-10: Reacciones a estrés grave', system: 'CIE-10' },
  { code: 'F44.0', description: 'Amnesia disociativa', category: 'CIE-10: Trastornos disociativos', system: 'CIE-10' },
  { code: 'F44.1', description: 'Fuga disociativa', category: 'CIE-10: Trastornos disociativos', system: 'CIE-10' },
  { code: 'F44.2', description: 'Estupor disociativo', category: 'CIE-10: Trastornos disociativos', system: 'CIE-10' },
  { code: 'F45.0', description: 'Trastorno de somatización', category: 'CIE-10: Trastornos somatomorfos', system: 'CIE-10' },
  { code: 'F45.1', description: 'Trastorno somatomorfo indiferenciado', category: 'CIE-10: Trastornos somatomorfos', system: 'CIE-10' },
  { code: 'F45.2', description: 'Trastorno hipocondríaco', category: 'CIE-10: Trastornos somatomorfos', system: 'CIE-10' },

  // Trastornos de la conducta alimentaria (F50)
  { code: 'F50.0', description: 'Anorexia nerviosa', category: 'CIE-10: Trastornos de la conducta alimentaria', system: 'CIE-10' },
  { code: 'F50.1', description: 'Anorexia nerviosa atípica', category: 'CIE-10: Trastornos de la conducta alimentaria', system: 'CIE-10' },
  { code: 'F50.2', description: 'Bulimia nerviosa', category: 'CIE-10: Trastornos de la conducta alimentaria', system: 'CIE-10' },
  { code: 'F50.3', description: 'Bulimia nerviosa atípica', category: 'CIE-10: Trastornos de la conducta alimentaria', system: 'CIE-10' },
  { code: 'F50.4', description: 'Hiperfagia asociada a otras alteraciones psicológicas', category: 'CIE-10: Trastornos de la conducta alimentaria', system: 'CIE-10' },
  { code: 'F50.5', description: 'Vómitos asociados a otras alteraciones psicológicas', category: 'CIE-10: Trastornos de la conducta alimentaria', system: 'CIE-10' },

  // Trastornos de la personalidad (F60-F69)
  { code: 'F60.0', description: 'Trastorno paranoide de la personalidad', category: 'CIE-10: Trastornos de la personalidad', system: 'CIE-10' },
  { code: 'F60.1', description: 'Trastorno esquizoide de la personalidad', category: 'CIE-10: Trastornos de la personalidad', system: 'CIE-10' },
  { code: 'F60.2', description: 'Trastorno disocial de la personalidad', category: 'CIE-10: Trastornos de la personalidad', system: 'CIE-10' },
  { code: 'F60.3', description: 'Trastorno de inestabilidad emocional de la personalidad', category: 'CIE-10: Trastornos de la personalidad', system: 'CIE-10' },
  { code: 'F60.30', description: 'Trastorno de inestabilidad emocional - tipo impulsivo', category: 'CIE-10: Trastornos de la personalidad', system: 'CIE-10' },
  { code: 'F60.31', description: 'Trastorno de inestabilidad emocional - tipo límite', category: 'CIE-10: Trastornos de la personalidad', system: 'CIE-10' },
  { code: 'F60.4', description: 'Trastorno histriónico de la personalidad', category: 'CIE-10: Trastornos de la personalidad', system: 'CIE-10' },
  { code: 'F60.5', description: 'Trastorno anancástico de la personalidad', category: 'CIE-10: Trastornos de la personalidad', system: 'CIE-10' },
  { code: 'F60.6', description: 'Trastorno ansioso [evitativo] de la personalidad', category: 'CIE-10: Trastornos de la personalidad', system: 'CIE-10' },
  { code: 'F60.7', description: 'Trastorno dependiente de la personalidad', category: 'CIE-10: Trastornos de la personalidad', system: 'CIE-10' },

  // Trastornos del desarrollo psicológico (F80-F89)
  { code: 'F80.0', description: 'Trastorno específico de la articulación', category: 'CIE-10: Trastornos del desarrollo', system: 'CIE-10' },
  { code: 'F80.1', description: 'Trastorno de la expresión del lenguaje', category: 'CIE-10: Trastornos del desarrollo', system: 'CIE-10' },
  { code: 'F80.2', description: 'Trastorno de la comprensión del lenguaje', category: 'CIE-10: Trastornos del desarrollo', system: 'CIE-10' },
  { code: 'F81.0', description: 'Trastorno específico de la lectura', category: 'CIE-10: Trastornos del desarrollo', system: 'CIE-10' },
  { code: 'F81.1', description: 'Trastorno específico de la ortografía', category: 'CIE-10: Trastornos del desarrollo', system: 'CIE-10' },
  { code: 'F81.2', description: 'Trastorno específico del cálculo', category: 'CIE-10: Trastornos del desarrollo', system: 'CIE-10' },
  { code: 'F84.0', description: 'Autismo infantil', category: 'CIE-10: Trastornos generalizados del desarrollo', system: 'CIE-10' },
  { code: 'F84.1', description: 'Autismo atípico', category: 'CIE-10: Trastornos generalizados del desarrollo', system: 'CIE-10' },
  { code: 'F84.2', description: 'Síndrome de Rett', category: 'CIE-10: Trastornos generalizados del desarrollo', system: 'CIE-10' },
  { code: 'F84.3', description: 'Trastorno desintegrativo de la infancia', category: 'CIE-10: Trastornos generalizados del desarrollo', system: 'CIE-10' },
  { code: 'F84.5', description: 'Síndrome de Asperger', category: 'CIE-10: Trastornos generalizados del desarrollo', system: 'CIE-10' },

  // Trastornos hipercinéticos (F90)
  { code: 'F90.0', description: 'Trastorno de la actividad y de la atención', category: 'CIE-10: Trastornos hipercinéticos', system: 'CIE-10' },
  { code: 'F90.1', description: 'Trastorno hipercinético disocial', category: 'CIE-10: Trastornos hipercinéticos', system: 'CIE-10' },

  // Esquizofrenia (F20-F29)
  { code: 'F20.0', description: 'Esquizofrenia paranoide', category: 'CIE-10: Esquizofrenia', system: 'CIE-10' },
  { code: 'F20.1', description: 'Esquizofrenia hebefrénica', category: 'CIE-10: Esquizofrenia', system: 'CIE-10' },
  { code: 'F20.2', description: 'Esquizofrenia catatónica', category: 'CIE-10: Esquizofrenia', system: 'CIE-10' },
  { code: 'F20.3', description: 'Esquizofrenia indiferenciada', category: 'CIE-10: Esquizofrenia', system: 'CIE-10' },
  { code: 'F20.5', description: 'Esquizofrenia residual', category: 'CIE-10: Esquizofrenia', system: 'CIE-10' },
  { code: 'F25.0', description: 'Trastorno esquizoafectivo de tipo maníaco', category: 'CIE-10: Trastornos esquizofrénicos', system: 'CIE-10' },
  { code: 'F25.1', description: 'Trastorno esquizoafectivo de tipo depresivo', category: 'CIE-10: Trastornos esquizofrénicos', system: 'CIE-10' },
  { code: 'F25.2', description: 'Trastorno esquizoafectivo de tipo mixto', category: 'CIE-10: Trastornos esquizofrénicos', system: 'CIE-10' },

  // ===== DSM-5TR DIAGNOSES =====

  // Trastornos del neurodesarrollo
  { code: '299.00 (F84.0)', description: 'Trastorno del espectro autista', category: 'DSM-5TR: Trastornos del neurodesarrollo', system: 'DSM-5TR' },
  { code: '314.01 (F90.2)', description: 'TDAH, presentación combinada', category: 'DSM-5TR: Trastornos del neurodesarrollo', system: 'DSM-5TR' },
  { code: '314.00 (F90.0)', description: 'TDAH, presentación predominante con falta de atención', category: 'DSM-5TR: Trastornos del neurodesarrollo', system: 'DSM-5TR' },
  { code: '314.01 (F90.1)', description: 'TDAH, presentación predominante hiperactiva/impulsiva', category: 'DSM-5TR: Trastornos del neurodesarrollo', system: 'DSM-5TR' },
  { code: '315.00 (F81.0)', description: 'Trastorno específico del aprendizaje con dificultades en la lectura', category: 'DSM-5TR: Trastornos del neurodesarrollo', system: 'DSM-5TR' },
  { code: '315.1 (F81.81)', description: 'Trastorno específico del aprendizaje con dificultades en la expresión escrita', category: 'DSM-5TR: Trastornos del neurodesarrollo', system: 'DSM-5TR' },
  { code: '315.1 (F81.2)', description: 'Trastorno específico del aprendizaje con dificultades en las matemáticas', category: 'DSM-5TR: Trastornos del neurodesarrollo', system: 'DSM-5TR' },
  { code: '317 (F70)', description: 'Discapacidad intelectual leve', category: 'DSM-5TR: Trastornos del neurodesarrollo', system: 'DSM-5TR' },
  { code: '318.0 (F71)', description: 'Discapacidad intelectual moderada', category: 'DSM-5TR: Trastornos del neurodesarrollo', system: 'DSM-5TR' },
  { code: '318.1 (F72)', description: 'Discapacidad intelectual grave', category: 'DSM-5TR: Trastornos del neurodesarrollo', system: 'DSM-5TR' },

  // Espectro de la esquizofrenia y otros trastornos psicóticos
  { code: '295.90 (F20.9)', description: 'Esquizofrenia', category: 'DSM-5TR: Espectro de la esquizofrenia', system: 'DSM-5TR' },
  { code: '297.1 (F22)', description: 'Trastorno delirante', category: 'DSM-5TR: Espectro de la esquizofrenia', system: 'DSM-5TR' },
  { code: '298.8 (F23)', description: 'Trastorno psicótico breve', category: 'DSM-5TR: Espectro de la esquizofrenia', system: 'DSM-5TR' },
  { code: '295.70 (F25.0)', description: 'Trastorno esquizoafectivo, tipo bipolar', category: 'DSM-5TR: Espectro de la esquizofrenia', system: 'DSM-5TR' },
  { code: '295.70 (F25.1)', description: 'Trastorno esquizoafectivo, tipo depresivo', category: 'DSM-5TR: Espectro de la esquizofrenia', system: 'DSM-5TR' },

  // Trastorno bipolar y trastornos relacionados
  { code: '296.41 (F31.11)', description: 'Trastorno bipolar I, episodio maníaco actual, leve', category: 'DSM-5TR: Trastorno bipolar', system: 'DSM-5TR' },
  { code: '296.42 (F31.12)', description: 'Trastorno bipolar I, episodio maníaco actual, moderado', category: 'DSM-5TR: Trastorno bipolar', system: 'DSM-5TR' },
  { code: '296.43 (F31.13)', description: 'Trastorno bipolar I, episodio maníaco actual, grave', category: 'DSM-5TR: Trastorno bipolar', system: 'DSM-5TR' },
  { code: '296.44 (F31.2)', description: 'Trastorno bipolar I, episodio maníaco actual, grave con características psicóticas', category: 'DSM-5TR: Trastorno bipolar', system: 'DSM-5TR' },
  { code: '296.51 (F31.31)', description: 'Trastorno bipolar I, episodio depresivo actual, leve', category: 'DSM-5TR: Trastorno bipolar', system: 'DSM-5TR' },
  { code: '296.52 (F31.32)', description: 'Trastorno bipolar I, episodio depresivo actual, moderado', category: 'DSM-5TR: Trastorno bipolar', system: 'DSM-5TR' },
  { code: '296.53 (F31.4)', description: 'Trastorno bipolar I, episodio depresivo actual, grave', category: 'DSM-5TR: Trastorno bipolar', system: 'DSM-5TR' },
  { code: '296.89 (F31.81)', description: 'Trastorno bipolar II', category: 'DSM-5TR: Trastorno bipolar', system: 'DSM-5TR' },
  { code: '301.13 (F34.0)', description: 'Trastorno ciclotímico', category: 'DSM-5TR: Trastorno bipolar', system: 'DSM-5TR' },

  // Trastornos depresivos
  { code: '296.21 (F32.0)', description: 'Trastorno de depresión mayor, episodio único, leve', category: 'DSM-5TR: Trastornos depresivos', system: 'DSM-5TR' },
  { code: '296.22 (F32.1)', description: 'Trastorno de depresión mayor, episodio único, moderado', category: 'DSM-5TR: Trastornos depresivos', system: 'DSM-5TR' },
  { code: '296.23 (F32.2)', description: 'Trastorno de depresión mayor, episodio único, grave', category: 'DSM-5TR: Trastornos depresivos', system: 'DSM-5TR' },
  { code: '296.31 (F33.0)', description: 'Trastorno de depresión mayor, recurrente, leve', category: 'DSM-5TR: Trastornos depresivos', system: 'DSM-5TR' },
  { code: '296.32 (F33.1)', description: 'Trastorno de depresión mayor, recurrente, moderado', category: 'DSM-5TR: Trastornos depresivos', system: 'DSM-5TR' },
  { code: '296.33 (F33.2)', description: 'Trastorno de depresión mayor, recurrente, grave', category: 'DSM-5TR: Trastornos depresivos', system: 'DSM-5TR' },
  { code: '300.4 (F34.1)', description: 'Trastorno depresivo persistente (distimia)', category: 'DSM-5TR: Trastornos depresivos', system: 'DSM-5TR' },
  { code: '625.4 (N94.3)', description: 'Trastorno disfórico premenstrual', category: 'DSM-5TR: Trastornos depresivos', system: 'DSM-5TR' },

  // Trastornos de ansiedad
  { code: '309.21 (F93.0)', description: 'Trastorno de ansiedad por separación', category: 'DSM-5TR: Trastornos de ansiedad', system: 'DSM-5TR' },
  { code: '300.29 (F40.10)', description: 'Fobia específica', category: 'DSM-5TR: Trastornos de ansiedad', system: 'DSM-5TR' },
  { code: '300.23 (F40.11)', description: 'Trastorno de ansiedad social (fobia social)', category: 'DSM-5TR: Trastornos de ansiedad', system: 'DSM-5TR' },
  { code: '300.01 (F41.0)', description: 'Trastorno de pánico', category: 'DSM-5TR: Trastornos de ansiedad', system: 'DSM-5TR' },
  { code: '300.22 (F40.00)', description: 'Agorafobia', category: 'DSM-5TR: Trastornos de ansiedad', system: 'DSM-5TR' },
  { code: '300.02 (F41.1)', description: 'Trastorno de ansiedad generalizada', category: 'DSM-5TR: Trastornos de ansiedad', system: 'DSM-5TR' },

  // Trastorno obsesivo-compulsivo y trastornos relacionados
  { code: '300.3 (F42)', description: 'Trastorno obsesivo-compulsivo', category: 'DSM-5TR: TOC y relacionados', system: 'DSM-5TR' },
  { code: '300.7 (F45.22)', description: 'Trastorno dismórfico corporal', category: 'DSM-5TR: TOC y relacionados', system: 'DSM-5TR' },
  { code: '300.3 (F63.2)', description: 'Trastorno de acumulación', category: 'DSM-5TR: TOC y relacionados', system: 'DSM-5TR' },
  { code: '312.39 (F63.3)', description: 'Tricotilomanía (trastorno de arrancarse el pelo)', category: 'DSM-5TR: TOC y relacionados', system: 'DSM-5TR' },
  { code: '698.4 (L98.1)', description: 'Trastorno de excoriación (rascarse la piel)', category: 'DSM-5TR: TOC y relacionados', system: 'DSM-5TR' },

  // Trastornos relacionados con traumas y factores de estrés
  { code: '308.3 (F43.0)', description: 'Trastorno de estrés agudo', category: 'DSM-5TR: Trauma y estrés', system: 'DSM-5TR' },
  { code: '309.81 (F43.10)', description: 'Trastorno de estrés postraumático', category: 'DSM-5TR: Trauma y estrés', system: 'DSM-5TR' },
  { code: '309.9 (F43.20)', description: 'Trastorno de adaptación con estado de ánimo deprimido', category: 'DSM-5TR: Trauma y estrés', system: 'DSM-5TR' },
  { code: '309.24 (F43.22)', description: 'Trastorno de adaptación con ansiedad', category: 'DSM-5TR: Trauma y estrés', system: 'DSM-5TR' },
  { code: '309.28 (F43.23)', description: 'Trastorno de adaptación con ansiedad y estado de ánimo deprimido mixtos', category: 'DSM-5TR: Trauma y estrés', system: 'DSM-5TR' },

  // Trastornos de la alimentación y de la ingesta de alimentos
  { code: '307.52 (F98.21)', description: 'Pica', category: 'DSM-5TR: Trastornos alimentarios', system: 'DSM-5TR' },
  { code: '307.53 (F98.3)', description: 'Trastorno de rumiación', category: 'DSM-5TR: Trastornos alimentarios', system: 'DSM-5TR' },
  { code: '307.1 (F50.00)', description: 'Anorexia nerviosa, tipo restrictivo', category: 'DSM-5TR: Trastornos alimentarios', system: 'DSM-5TR' },
  { code: '307.1 (F50.02)', description: 'Anorexia nerviosa, tipo con atracones/purgas', category: 'DSM-5TR: Trastornos alimentarios', system: 'DSM-5TR' },
  { code: '307.51 (F50.2)', description: 'Bulimia nerviosa', category: 'DSM-5TR: Trastornos alimentarios', system: 'DSM-5TR' },
  { code: '307.51 (F50.81)', description: 'Trastorno de atracones', category: 'DSM-5TR: Trastornos alimentarios', system: 'DSM-5TR' },

  // Trastornos de la personalidad
  { code: '301.0 (F60.0)', description: 'Trastorno de la personalidad paranoide', category: 'DSM-5TR: Trastornos de la personalidad', system: 'DSM-5TR' },
  { code: '301.20 (F60.1)', description: 'Trastorno de la personalidad esquizoide', category: 'DSM-5TR: Trastornos de la personalidad', system: 'DSM-5TR' },
  { code: '301.22 (F21)', description: 'Trastorno de la personalidad esquizotípica', category: 'DSM-5TR: Trastornos de la personalidad', system: 'DSM-5TR' },
  { code: '301.7 (F60.2)', description: 'Trastorno de la personalidad antisocial', category: 'DSM-5TR: Trastornos de la personalidad', system: 'DSM-5TR' },
  { code: '301.83 (F60.3)', description: 'Trastorno de la personalidad límite', category: 'DSM-5TR: Trastornos de la personalidad', system: 'DSM-5TR' },
  { code: '301.50 (F60.4)', description: 'Trastorno de la personalidad histriónica', category: 'DSM-5TR: Trastornos de la personalidad', system: 'DSM-5TR' },
  { code: '301.81 (F60.81)', description: 'Trastorno de la personalidad narcisista', category: 'DSM-5TR: Trastornos de la personalidad', system: 'DSM-5TR' },
  { code: '301.82 (F60.6)', description: 'Trastorno de la personalidad evitativa', category: 'DSM-5TR: Trastornos de la personalidad', system: 'DSM-5TR' },
  { code: '301.6 (F60.7)', description: 'Trastorno de la personalidad dependiente', category: 'DSM-5TR: Trastornos de la personalidad', system: 'DSM-5TR' },
  { code: '301.4 (F60.5)', description: 'Trastorno de la personalidad obsesivo-compulsiva', category: 'DSM-5TR: Trastornos de la personalidad', system: 'DSM-5TR' },

  // ===== EXPANSIÓN COMPLETA CIE-10 =====
  
  // Trastornos mentales orgánicos (F00-F09)
  { code: 'F00.0', description: 'Demencia en la enfermedad de Alzheimer de inicio temprano', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F00.1', description: 'Demencia en la enfermedad de Alzheimer de inicio tardío', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F00.2', description: 'Demencia en la enfermedad de Alzheimer atípica o de tipo mixto', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F01.0', description: 'Demencia vascular de inicio agudo', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F01.1', description: 'Demencia multi-infarto', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F01.2', description: 'Demencia vascular subcortical', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F01.3', description: 'Demencia vascular mixta cortical y subcortical', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F02.0', description: 'Demencia en la enfermedad de Pick', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F02.1', description: 'Demencia en la enfermedad de Creutzfeldt-Jakob', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F02.2', description: 'Demencia en la enfermedad de Huntington', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F02.3', description: 'Demencia en la enfermedad de Parkinson', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F02.4', description: 'Demencia en la infección por VIH', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F03', description: 'Demencia sin especificación', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F04', description: 'Síndrome amnésico orgánico no inducido por alcohol u otras sustancias psicoactivas', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F05.0', description: 'Delirium no superpuesto a demencia', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F05.1', description: 'Delirium superpuesto a demencia', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F06.0', description: 'Alucinosis orgánica', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F06.1', description: 'Trastorno catatónico orgánico', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F06.2', description: 'Trastorno delirante orgánico', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F06.3', description: 'Trastornos del humor [afectivos] orgánicos', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F06.4', description: 'Trastorno de ansiedad orgánico', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F06.5', description: 'Trastorno disociativo orgánico', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F06.6', description: 'Trastorno de labilidad emocional [asténico] orgánico', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },
  { code: 'F06.7', description: 'Trastorno cognoscitivo leve', category: 'CIE-10: Trastornos orgánicos', system: 'CIE-10' },

  // Trastornos mentales por uso de sustancias (F10-F19)
  { code: 'F10.0', description: 'Intoxicación aguda por alcohol', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F10.1', description: 'Uso nocivo de alcohol', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F10.2', description: 'Síndrome de dependencia al alcohol', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F10.3', description: 'Síndrome de abstinencia al alcohol', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F10.4', description: 'Síndrome de abstinencia al alcohol con delirium', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F10.5', description: 'Trastorno psicótico inducido por alcohol', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F10.6', description: 'Síndrome amnésico inducido por alcohol', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F11.0', description: 'Intoxicación aguda por opioides', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F11.1', description: 'Uso nocivo de opioides', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F11.2', description: 'Síndrome de dependencia a opioides', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F12.0', description: 'Intoxicación aguda por cannabinoides', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F12.1', description: 'Uso nocivo de cannabinoides', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F12.2', description: 'Síndrome de dependencia a cannabinoides', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F13.0', description: 'Intoxicación aguda por sedantes o hipnóticos', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F13.1', description: 'Uso nocivo de sedantes o hipnóticos', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F13.2', description: 'Síndrome de dependencia a sedantes o hipnóticos', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F14.0', description: 'Intoxicación aguda por cocaína', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F14.1', description: 'Uso nocivo de cocaína', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F14.2', description: 'Síndrome de dependencia a cocaína', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F15.0', description: 'Intoxicación aguda por estimulantes', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F15.1', description: 'Uso nocivo de estimulantes', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F15.2', description: 'Síndrome de dependencia a estimulantes', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F16.0', description: 'Intoxicación aguda por alucinógenos', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F16.1', description: 'Uso nocivo de alucinógenos', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F17.0', description: 'Intoxicación aguda por tabaco', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F17.1', description: 'Uso nocivo de tabaco', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F17.2', description: 'Síndrome de dependencia a nicotina', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F18.0', description: 'Intoxicación aguda por disolventes volátiles', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },
  { code: 'F18.1', description: 'Uso nocivo de disolventes volátiles', category: 'CIE-10: Trastornos por sustancias', system: 'CIE-10' },

  // Más esquizofrenia y trastornos psicóticos (F20-F29) - Completar
  { code: 'F21', description: 'Trastorno esquizotípico', category: 'CIE-10: Esquizofrenia', system: 'CIE-10' },
  { code: 'F22.0', description: 'Trastorno delirante', category: 'CIE-10: Trastornos delirantes', system: 'CIE-10' },
  { code: 'F22.8', description: 'Otros trastornos delirantes persistentes', category: 'CIE-10: Trastornos delirantes', system: 'CIE-10' },
  { code: 'F23.0', description: 'Trastorno psicótico agudo polimorfo sin síntomas de esquizofrenia', category: 'CIE-10: Trastornos psicóticos agudos', system: 'CIE-10' },
  { code: 'F23.1', description: 'Trastorno psicótico agudo polimorfo con síntomas de esquizofrenia', category: 'CIE-10: Trastornos psicóticos agudos', system: 'CIE-10' },
  { code: 'F23.2', description: 'Trastorno psicótico agudo de tipo esquizofrénico', category: 'CIE-10: Trastornos psicóticos agudos', system: 'CIE-10' },
  { code: 'F23.3', description: 'Otros trastornos psicóticos agudos con predominio de ideas delirantes', category: 'CIE-10: Trastornos psicóticos agudos', system: 'CIE-10' },
  { code: 'F24', description: 'Trastorno delirante inducido', category: 'CIE-10: Trastornos delirantes', system: 'CIE-10' },
  { code: 'F28', description: 'Otros trastornos psicóticos no orgánicos', category: 'CIE-10: Otros trastornos psicóticos', system: 'CIE-10' },
  { code: 'F29', description: 'Psicosis no orgánica sin especificación', category: 'CIE-10: Otros trastornos psicóticos', system: 'CIE-10' },

  // Trastornos del comportamiento y emocionales que aparecen habitualmente en la infancia (F90-F98)
  { code: 'F91.0', description: 'Trastorno disocial limitado al contexto familiar', category: 'CIE-10: Trastornos de conducta infancia', system: 'CIE-10' },
  { code: 'F91.1', description: 'Trastorno disocial en niños no socializados', category: 'CIE-10: Trastornos de conducta infancia', system: 'CIE-10' },
  { code: 'F91.2', description: 'Trastorno disocial en niños socializados', category: 'CIE-10: Trastornos de conducta infancia', system: 'CIE-10' },
  { code: 'F91.3', description: 'Trastorno desafiante y oposicionista', category: 'CIE-10: Trastornos de conducta infancia', system: 'CIE-10' },
  { code: 'F92.0', description: 'Trastorno disocial depresivo', category: 'CIE-10: Trastornos de conducta infancia', system: 'CIE-10' },
  { code: 'F93.0', description: 'Trastorno de ansiedad de separación de la infancia', category: 'CIE-10: Trastornos emocionales infancia', system: 'CIE-10' },
  { code: 'F93.1', description: 'Trastorno de ansiedad fóbica de la infancia', category: 'CIE-10: Trastornos emocionales infancia', system: 'CIE-10' },
  { code: 'F93.2', description: 'Trastorno de hipersensibilidad social de la infancia', category: 'CIE-10: Trastornos emocionales infancia', system: 'CIE-10' },
  { code: 'F93.3', description: 'Trastorno de rivalidad entre hermanos', category: 'CIE-10: Trastornos emocionales infancia', system: 'CIE-10' },
  { code: 'F94.0', description: 'Mutismo selectivo', category: 'CIE-10: Trastornos funcionamiento social infancia', system: 'CIE-10' },
  { code: 'F94.1', description: 'Trastorno de vinculación de la infancia reactivo', category: 'CIE-10: Trastornos funcionamiento social infancia', system: 'CIE-10' },
  { code: 'F94.2', description: 'Trastorno de vinculación de la infancia desinhibido', category: 'CIE-10: Trastornos funcionamiento social infancia', system: 'CIE-10' },
  { code: 'F95.0', description: 'Trastorno de tics transitorios', category: 'CIE-10: Trastornos de tics', system: 'CIE-10' },
  { code: 'F95.1', description: 'Trastorno de tics motores o fonatorios crónicos', category: 'CIE-10: Trastornos de tics', system: 'CIE-10' },
  { code: 'F95.2', description: 'Síndrome de Gilles de la Tourette', category: 'CIE-10: Trastornos de tics', system: 'CIE-10' },
  { code: 'F98.0', description: 'Enuresis no orgánica', category: 'CIE-10: Otros trastornos infancia', system: 'CIE-10' },
  { code: 'F98.1', description: 'Encopresis no orgánica', category: 'CIE-10: Otros trastornos infancia', system: 'CIE-10' },
  { code: 'F98.2', description: 'Trastorno de la conducta alimentaria de la infancia', category: 'CIE-10: Otros trastornos infancia', system: 'CIE-10' },
  { code: 'F98.3', description: 'Pica de la infancia', category: 'CIE-10: Otros trastornos infancia', system: 'CIE-10' },
  { code: 'F98.4', description: 'Trastorno de movimientos estereotipados', category: 'CIE-10: Otros trastornos infancia', system: 'CIE-10' },
  { code: 'F98.5', description: 'Tartamudeo [espasmofemia]', category: 'CIE-10: Otros trastornos infancia', system: 'CIE-10' },
  { code: 'F98.6', description: 'Farfulleo', category: 'CIE-10: Otros trastornos infancia', system: 'CIE-10' },

  // ===== EXPANSIÓN DSM-5TR ADICIONAL =====
  
  // Trastornos disruptivos, del control de impulsos y de la conducta
  { code: '312.34 (F63.81)', description: 'Trastorno explosivo intermitente', category: 'DSM-5TR: Trastornos del control de impulsos', system: 'DSM-5TR' },
  { code: '312.32 (F91.3)', description: 'Trastorno negativista desafiante', category: 'DSM-5TR: Trastornos del control de impulsos', system: 'DSM-5TR' },
  { code: '312.81 (F91.1)', description: 'Trastorno de la conducta, tipo de inicio infantil', category: 'DSM-5TR: Trastornos del control de impulsos', system: 'DSM-5TR' },
  { code: '312.82 (F91.2)', description: 'Trastorno de la conducta, tipo de inicio adolescente', category: 'DSM-5TR: Trastornos del control de impulsos', system: 'DSM-5TR' },
  { code: '301.7 (F60.2)', description: 'Trastorno de la personalidad antisocial', category: 'DSM-5TR: Trastornos del control de impulsos', system: 'DSM-5TR' },
  { code: '312.33 (F63.1)', description: 'Trastorno de juego', category: 'DSM-5TR: Trastornos del control de impulros', system: 'DSM-5TR' },

  // Trastornos relacionados con sustancias y trastornos adictivos  
  { code: '303.90 (F10.20)', description: 'Trastorno por consumo de alcohol, moderado', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '303.90 (F10.20)', description: 'Trastorno por consumo de alcohol, grave', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '305.00 (F10.10)', description: 'Trastorno por consumo de alcohol, leve', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '292.0 (F10.129)', description: 'Intoxicación por alcohol', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '291.81 (F10.231)', description: 'Abstinencia de alcohol', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '304.00 (F11.20)', description: 'Trastorno por consumo de opioides, moderado', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '304.00 (F11.20)', description: 'Trastorno por consumo de opioides, grave', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '305.50 (F11.10)', description: 'Trastorno por consumo de opioides, leve', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '304.30 (F12.20)', description: 'Trastorno por consumo de cannabis, moderado', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '305.20 (F12.10)', description: 'Trastorno por consumo de cannabis, leve', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '304.20 (F14.20)', description: 'Trastorno por consumo de cocaína, moderado', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '305.60 (F14.10)', description: 'Trastorno por consumo de cocaína, leve', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '304.40 (F15.20)', description: 'Trastorno por consumo de estimulantes, moderado', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },
  { code: '305.70 (F15.10)', description: 'Trastorno por consumo de estimulantes, leve', category: 'DSM-5TR: Trastornos por sustancias', system: 'DSM-5TR' },

  // Trastornos disociativos
  { code: '300.14 (F44.81)', description: 'Trastorno de identidad disociativo', category: 'DSM-5TR: Trastornos disociativos', system: 'DSM-5TR' },
  { code: '300.12 (F44.0)', description: 'Amnesia disociativa', category: 'DSM-5TR: Trastornos disociativos', system: 'DSM-5TR' },
  { code: '300.6 (F48.1)', description: 'Trastorno de despersonalización/desrealización', category: 'DSM-5TR: Trastornos disociativos', system: 'DSM-5TR' },

  // Trastornos somáticos y relacionados
  { code: '300.82 (F45.1)', description: 'Trastorno de síntomas somáticos', category: 'DSM-5TR: Trastornos somáticos', system: 'DSM-5TR' },
  { code: '300.7 (F45.21)', description: 'Trastorno de ansiedad por enfermedad', category: 'DSM-5TR: Trastornos somáticos', system: 'DSM-5TR' },
  { code: '300.11 (F44.4)', description: 'Trastorno de conversión (trastorno de síntomas neurológicos funcionales)', category: 'DSM-5TR: Trastornos somáticos', system: 'DSM-5TR' },
  { code: '316 (F54)', description: 'Factores psicológicos que afectan a otras afecciones médicas', category: 'DSM-5TR: Trastornos somáticos', system: 'DSM-5TR' },

  // Trastornos del sueño-vigilia
  { code: '307.42 (G47.00)', description: 'Trastorno de insomnio', category: 'DSM-5TR: Trastornos del sueño', system: 'DSM-5TR' },
  { code: '307.44 (G47.10)', description: 'Trastorno de hipersomnia', category: 'DSM-5TR: Trastornos del sueño', system: 'DSM-5TR' },
  { code: '347.00 (G47.419)', description: 'Narcolepsia sin cataplejía', category: 'DSM-5TR: Trastornos del sueño', system: 'DSM-5TR' },
  { code: '347.01 (G47.411)', description: 'Narcolepsia con cataplejía', category: 'DSM-5TR: Trastornos del sueño', system: 'DSM-5TR' },
  { code: '327.23 (G47.31)', description: 'Apnea/hipopnea obstructiva del sueño', category: 'DSM-5TR: Trastornos del sueño', system: 'DSM-5TR' },
  { code: '307.45 (G47.52)', description: 'Trastorno de pesadillas', category: 'DSM-5TR: Trastornos del sueño', system: 'DSM-5TR' },
  { code: '307.46 (F51.4)', description: 'Trastorno de terrores nocturnos', category: 'DSM-5TR: Trastornos del sueño', system: 'DSM-5TR' },
  { code: '307.46 (F51.3)', description: 'Trastorno de sonambulismo', category: 'DSM-5TR: Trastornos del sueño', system: 'DSM-5TR' },

  // Disfunciones sexuales
  { code: '302.71 (F52.0)', description: 'Trastorno del deseo sexual hipoactivo en el varón', category: 'DSM-5TR: Disfunciones sexuales', system: 'DSM-5TR' },
  { code: '302.72 (F52.22)', description: 'Trastorno del interés/excitación sexual femenino', category: 'DSM-5TR: Disfunciones sexuales', system: 'DSM-5TR' },
  { code: '302.72 (F52.21)', description: 'Trastorno eréctil', category: 'DSM-5TR: Disfunciones sexuales', system: 'DSM-5TR' },
  { code: '302.73 (F52.31)', description: 'Trastorno orgásmico femenino', category: 'DSM-5TR: Disfunciones sexuales', system: 'DSM-5TR' },
  { code: '302.74 (F52.32)', description: 'Trastorno orgásmico masculino', category: 'DSM-5TR: Disfunciones sexuales', system: 'DSM-5TR' },
  { code: '302.75 (F52.4)', description: 'Eyaculación prematura (precoz)', category: 'DSM-5TR: Disfunciones sexuales', system: 'DSM-5TR' },
  { code: '302.76 (F52.6)', description: 'Trastorno de dolor genito-pélvico/penetración', category: 'DSM-5TR: Disfunciones sexuales', system: 'DSM-5TR' },

  // ===== CIE-11 DIAGNÓSTICOS SELECTOS =====
  
  // Trastornos mentales, del comportamiento o del neurodesarrollo
  { code: '6A00', description: 'Trastornos del espectro de la esquizofrenia y otros trastornos psicóticos primarios', category: 'CIE-11: Trastornos psicóticos primarios', system: 'CIE-11' },
  { code: '6A01', description: 'Esquizofrenia', category: 'CIE-11: Trastornos psicóticos primarios', system: 'CIE-11' },
  { code: '6A02', description: 'Trastorno esquizofreniforme', category: 'CIE-11: Trastornos psicóticos primarios', system: 'CIE-11' },
  { code: '6A03', description: 'Trastorno psicótico breve', category: 'CIE-11: Trastornos psicóticos primarios', system: 'CIE-11' },
  { code: '6A04', description: 'Trastorno esquizoafectivo', category: 'CIE-11: Trastornos psicóticos primarios', system: 'CIE-11' },
  { code: '6A05', description: 'Trastorno delirante', category: 'CIE-11: Trastornos psicóticos primarios', system: 'CIE-11' },
  
  // Trastornos del estado de ánimo
  { code: '6A60', description: 'Episodio único de trastorno depresivo', category: 'CIE-11: Trastornos del estado de ánimo', system: 'CIE-11' },
  { code: '6A70', description: 'Trastorno depresivo recurrente', category: 'CIE-11: Trastornos del estado de ánimo', system: 'CIE-11' },
  { code: '6A71', description: 'Trastorno distímico', category: 'CIE-11: Trastornos del estado de ánimo', system: 'CIE-11' },
  { code: '6A72', description: 'Trastorno mixto ansioso-depresivo', category: 'CIE-11: Trastornos del estado de ánimo', system: 'CIE-11' },
  { code: '6A80', description: 'Episodio maníaco', category: 'CIE-11: Trastornos del estado de ánimo', system: 'CIE-11' },
  { code: '6A81', description: 'Episodio hipomaníaco', category: 'CIE-11: Trastornos del estado de ánimo', system: 'CIE-11' },
  { code: '6A82', description: 'Episodio mixto', category: 'CIE-11: Trastornos del estado de ánimo', system: 'CIE-11' },
  { code: '6A83', description: 'Trastorno bipolar tipo I', category: 'CIE-11: Trastornos del estado de ánimo', system: 'CIE-11' },
  { code: '6A84', description: 'Trastorno bipolar tipo II', category: 'CIE-11: Trastornos del estado de ánimo', system: 'CIE-11' },
  { code: '6A85', description: 'Trastorno ciclotímico', category: 'CIE-11: Trastornos del estado de ánimo', system: 'CIE-11' },
  
  // Trastornos de ansiedad y relacionados con el miedo
  { code: '6B00', description: 'Trastorno de ansiedad generalizada', category: 'CIE-11: Trastornos de ansiedad', system: 'CIE-11' },
  { code: '6B01', description: 'Trastorno de pánico', category: 'CIE-11: Trastornos de ansiedad', system: 'CIE-11' },
  { code: '6B02', description: 'Agorafobia', category: 'CIE-11: Trastornos de ansiedad', system: 'CIE-11' },
  { code: '6B03', description: 'Fobia específica', category: 'CIE-11: Trastornos de ansiedad', system: 'CIE-11' },
  { code: '6B04', description: 'Trastorno de ansiedad social', category: 'CIE-11: Trastornos de ansiedad', system: 'CIE-11' },
  { code: '6B05', description: 'Trastorno de ansiedad por separación', category: 'CIE-11: Trastornos de ansiedad', system: 'CIE-11' },
  { code: '6B06', description: 'Mutismo selectivo', category: 'CIE-11: Trastornos de ansiedad', system: 'CIE-11' },
  
  // Trastornos obsesivo-compulsivos o relacionados
  { code: '6B20', description: 'Trastorno obsesivo-compulsivo', category: 'CIE-11: Trastornos obsesivo-compulsivos', system: 'CIE-11' },
  { code: '6B21', description: 'Trastorno dismórfico corporal', category: 'CIE-11: Trastornos obsesivo-compulsivos', system: 'CIE-11' },
  { code: '6B22', description: 'Olfactory reference disorder', category: 'CIE-11: Trastornos obsesivo-compulsivos', system: 'CIE-11' },
  { code: '6B23', description: 'Trastorno de acumulación', category: 'CIE-11: Trastornos obsesivo-compulsivos', system: 'CIE-11' },
  { code: '6B24', description: 'Tricotilomanía', category: 'CIE-11: Trastornos obsesivo-compulsivos', system: 'CIE-11' },
  { code: '6B25', description: 'Excoriación compulsiva', category: 'CIE-11: Trastornos obsesivo-compulsivos', system: 'CIE-11' },
  
  // Trastornos específicamente asociados con estrés
  { code: '6B40', description: 'Trastorno de estrés postraumático', category: 'CIE-11: Trastornos relacionados con estrés', system: 'CIE-11' },
  { code: '6B41', description: 'Trastorno de estrés postraumático complejo', category: 'CIE-11: Trastornos relacionados con estrés', system: 'CIE-11' },
  { code: '6B42', description: 'Trastorno de duelo prolongado', category: 'CIE-11: Trastornos relacionados con estrés', system: 'CIE-11' },
  { code: '6B43', description: 'Trastorno de adaptación', category: 'CIE-11: Trastornos relacionados con estrés', system: 'CIE-11' },
  { code: '6B44', description: 'Trastorno de estrés agudo', category: 'CIE-11: Trastornos relacionados con estrés', system: 'CIE-11' },
  
  // Trastornos de la alimentación
  { code: '6B80', description: 'Anorexia nerviosa', category: 'CIE-11: Trastornos de la alimentación', system: 'CIE-11' },
  { code: '6B81', description: 'Bulimia nerviosa', category: 'CIE-11: Trastornos de la alimentación', system: 'CIE-11' },
  { code: '6B82', description: 'Trastorno de atracones', category: 'CIE-11: Trastornos de la alimentación', system: 'CIE-11' },
  { code: '6B83', description: 'Trastorno evitativo/restrictivo de la ingesta de alimentos', category: 'CIE-11: Trastornos de la alimentación', system: 'CIE-11' },
  { code: '6B84', description: 'Pica', category: 'CIE-11: Trastornos de la alimentación', system: 'CIE-11' },
  { code: '6B85', description: 'Trastorno de rumiación', category: 'CIE-11: Trastornos de la alimentación', system: 'CIE-11' },
  
  // Trastornos del neurodesarrollo
  { code: '6A00.0', description: 'Trastorno del espectro autista sin discapacidad intelectual y con deterioro leve o ausente del lenguaje funcional', category: 'CIE-11: Trastornos del neurodesarrollo', system: 'CIE-11' },
  { code: '6A00.1', description: 'Trastorno del espectro autista con discapacidad intelectual y con deterioro leve o ausente del lenguaje funcional', category: 'CIE-11: Trastornos del neurodesarrollo', system: 'CIE-11' },
  { code: '6A05.0', description: 'Trastorno por déficit de atención con hiperactividad, presentación predominantemente inatenta', category: 'CIE-11: Trastornos del neurodesarrollo', system: 'CIE-11' },
  { code: '6A05.1', description: 'Trastorno por déficit de atención con hiperactividad, presentación predominantemente hiperactiva-impulsiva', category: 'CIE-11: Trastornos del neurodesarrollo', system: 'CIE-11' },
  { code: '6A05.2', description: 'Trastorno por déficit de atención con hiperactividad, presentación combinada', category: 'CIE-11: Trastornos del neurodesarrollo', system: 'CIE-11' },
  
  // Trastornos de la personalidad
  { code: '6D10', description: 'Trastorno de personalidad paranoide', category: 'CIE-11: Trastornos de la personalidad', system: 'CIE-11' },
  { code: '6D11', description: 'Trastorno de personalidad esquizoide', category: 'CIE-11: Trastornos de la personalidad', system: 'CIE-11' },
  { code: '6D12', description: 'Trastorno de personalidad esquizotípica', category: 'CIE-11: Trastornos de la personalidad', system: 'CIE-11' },
  { code: '6D10.0', description: 'Trastorno de personalidad antisocial', category: 'CIE-11: Trastornos de la personalidad', system: 'CIE-11' },
  { code: '6D10.1', description: 'Trastorno de personalidad borderline', category: 'CIE-11: Trastornos de la personalidad', system: 'CIE-11' },
  { code: '6D10.2', description: 'Trastorno de personalidad histriónica', category: 'CIE-11: Trastornos de la personalidad', system: 'CIE-11' },
  { code: '6D10.3', description: 'Trastorno de personalidad narcisista', category: 'CIE-11: Trastornos de la personalidad', system: 'CIE-11' },
  { code: '6D11.0', description: 'Trastorno de personalidad evitativa', category: 'CIE-11: Trastornos de la personalidad', system: 'CIE-11' },
  { code: '6D11.1', description: 'Trastorno de personalidad dependiente', category: 'CIE-11: Trastornos de la personalidad', system: 'CIE-11' },
  { code: '6D11.2', description: 'Trastorno de personalidad obsesivo-compulsiva', category: 'CIE-11: Trastornos de la personalidad', system: 'CIE-11' }
];

export async function GET(request: Request) {
  try {
    console.log('[DIAGNOSES SEARCH API] Processing search request');
    
    // Verify authentication - more permissive for diagnoses lookup
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.warn('[DIAGNOSES SEARCH API] Auth failed, allowing read-only access for diagnoses catalog');
      // Allow read-only access to diagnosis catalog even without auth
      // This is safe as it's just a static catalog, no patient data
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    const categoryFilter = url.searchParams.get('category');
    const systemFilter = url.searchParams.get('system');

    if (query.length < 2) {
      return createResponse({
        success: true,
        diagnoses: [],
        total: 0
      });
    }

    // Search and filter diagnoses
    let results = DIAGNOSES_DB.filter(diag =>
      diag.code.toLowerCase().includes(query) ||
      diag.description.toLowerCase().includes(query) ||
      diag.category.toLowerCase().includes(query)
    );

    // Apply category filter
    if (categoryFilter && categoryFilter !== 'all') {
      results = results.filter(diag => 
        diag.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Apply system filter
    if (systemFilter && systemFilter !== 'all') {
      results = results.filter(diag => diag.system === systemFilter);
    }

    // Sort results by relevance (exact code matches first, then description matches)
    results.sort((a, b) => {
      const aCodeMatch = a.code.toLowerCase() === query;
      const bCodeMatch = b.code.toLowerCase() === query;
      
      if (aCodeMatch && !bCodeMatch) return -1;
      if (!aCodeMatch && bCodeMatch) return 1;
      
      const aCodeStartsWith = a.code.toLowerCase().startsWith(query);
      const bCodeStartsWith = b.code.toLowerCase().startsWith(query);
      
      if (aCodeStartsWith && !bCodeStartsWith) return -1;
      if (!aCodeStartsWith && bCodeStartsWith) return 1;
      
      return a.description.localeCompare(b.description);
    });

    console.log(`[DIAGNOSES SEARCH API] Found ${results.length} diagnoses for query: ${query}`);

    return createResponse({
      success: true,
      diagnoses: results,
      total: results.length
    });

  } catch (error) {
    console.error('[DIAGNOSES SEARCH API] Error:', error);
    return createErrorResponse(
      'Failed to search diagnoses',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}