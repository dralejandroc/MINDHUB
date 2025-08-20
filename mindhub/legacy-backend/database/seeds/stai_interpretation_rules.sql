-- Interpretation rules for STAI (Estado y Rasgo)
-- Basado en baremos españoles validados

-- STAI Estado/Rasgo - Sin ansiedad
INSERT INTO scale_interpretation_rules (
  id, scale_id, min_score, max_score, severity_level, interpretation_label,
  color_code, description, recommendations, is_active, created_at, updated_at
) VALUES (
  'stai-int-minimal',
  'stai',
  0,
  30,
  'minimal',
  'Sin ansiedad',
  '#22c55e',
  'La puntuación indica niveles de ansiedad dentro del rango normal. No se observan síntomas clínicamente significativos de ansiedad estado o rasgo.',
  'Mantener estrategias actuales de manejo del estrés. Continuar con actividades de bienestar y autocuidado. No se requiere intervención clínica específica.',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- STAI Estado/Rasgo - Ansiedad leve
INSERT INTO scale_interpretation_rules (
  id, scale_id, min_score, max_score, severity_level, interpretation_label,
  color_code, description, recommendations, is_active, created_at, updated_at
) VALUES (
  'stai-int-mild',
  'stai',
  31,
  45,
  'mild',
  'Ansiedad leve',
  '#fbbf24',
  'Se observan niveles leves de ansiedad que pueden estar relacionados con situaciones específicas o características de personalidad. Los síntomas pueden incluir preocupación ocasional, tensión leve o inquietud.',
  'Implementar técnicas de relajación y respiración. Identificar factores desencadenantes. Considerar mindfulness o meditación. Monitorear evolución de síntomas. Evaluación en 4-6 semanas.',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- STAI Estado/Rasgo - Ansiedad moderada
INSERT INTO scale_interpretation_rules (
  id, scale_id, min_score, max_score, severity_level, interpretation_label,
  color_code, description, recommendations, is_active, created_at, updated_at
) VALUES (
  'stai-int-moderate',
  'stai',
  46,
  60,
  'moderate',
  'Ansiedad moderada',
  '#f97316',
  'Niveles moderados de ansiedad que pueden interferir con el funcionamiento diario. Posible presencia de síntomas físicos como tensión muscular, dificultades de concentración, irritabilidad o alteraciones del sueño.',
  'Se recomienda intervención psicoterapéutica estructurada (TCC para ansiedad). Técnicas de manejo del estrés. Evaluación de estilo de vida. Considerar derivación a salud mental. Seguimiento en 2-3 semanas.',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- STAI Estado/Rasgo - Ansiedad severa
INSERT INTO scale_interpretation_rules (
  id, scale_id, min_score, max_score, severity_level, interpretation_label,
  color_code, description, recommendations, is_active, created_at, updated_at
) VALUES (
  'stai-int-severe',
  'stai',
  61,
  80,
  'severe',
  'Ansiedad severa',
  '#ef4444',
  'Niveles severos de ansiedad que requieren atención clínica inmediata. Alta probabilidad de interferencia significativa en el funcionamiento personal, social y laboral. Posibles síntomas de pánico o ansiedad generalizada.',
  'Derivación urgente a profesional de salud mental. Evaluación integral de trastornos de ansiedad. Considerar evaluación médica para descartar causas orgánicas. Posible necesidad de intervención farmacológica. Psicoterapia intensiva recomendada.',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);