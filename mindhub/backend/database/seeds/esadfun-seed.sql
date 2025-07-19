-- =====================================================
-- SEED SQL para escala EsADFUN
-- Escala de Autoevaluación para Depresión y Funcionalidad
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'esadfun',
    'Escala de Autoevaluación para Depresión y Funcionalidad',
    'EsADFUN',
    '1.0',
    'depression',
    'cognitive_symptoms',
    'Escala que evalúa síntomas cognitivos relacionados con depresión, incluyendo atención, concentración, planeación, organización, memoria retrospectiva y prospectiva, y velocidad de procesamiento',
    'No especificado en documentos',
    2020,
    5,
    'self_administered',
    'Adultos y adolescentes con síntomas depresivos',
    10,
    'sum',
    0,
    40,
    'Esta escala evalúa síntomas cognitivos en las últimas 7 días. con puntos de corte definidos para afectación cognitiva. Sensibilidad: 97%, Especificidad: 83%',
    'Las siguientes preguntas describen problemas que la gente puede tener con su memoria, atención o concentración. Por favor seleccione respuestas basadas en como se ha sentido durante los últimos 7 días.',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('esadfun-item-1', 'esadfun', 1, 'Durante los últimos 7 días, ¿qué tan seguido ha tenido dificultad para organizar sus pendientes?', 'ESADFUN1', NULL, 0, 1),
('esadfun-item-2', 'esadfun', 2, 'Durante los últimos 7 días, ¿qué tan seguido se distrae fácilmente de sus actividades cotidianas?', 'ESADFUN2', NULL, 0, 1),
('esadfun-item-3', 'esadfun', 3, 'Durante los últimos 7 días, ¿qué tan seguido tuvo problemas recordando los nombres de personas o cosas?', 'ESADFUN3', NULL, 0, 1),
('esadfun-item-4', 'esadfun', 4, 'Durante los últimos 7 días, ¿qué tan seguido olvidó para qué había entrado a una habitación?', 'ESADFUN4', NULL, 0, 1),
('esadfun-item-5', 'esadfun', 5, 'Durante los últimos 7 días, ¿qué tan seguido le toma más tiempo del habitual realizar sus actividades?', 'ESADFUN5', NULL, 0, 1),
('esadfun-item-6', 'esadfun', 6, 'Durante los últimos 7 días, ¿qué tan seguido tuvo problemas para tomar decisiones?', 'ESADFUN6', NULL, 0, 1),
('esadfun-item-7', 'esadfun', 7, 'Durante los últimos 7 días, ¿qué tan seguido tuvo problemas poniendo atención en lo que las personas le están diciendo durante una conversación?', 'ESADFUN7', NULL, 0, 1),
('esadfun-item-8', 'esadfun', 8, 'Durante los últimos 7 días, ¿qué tan seguido ha tenido dificultades para comunicar sus sentimientos a los demás?', 'ESADFUN8', NULL, 0, 1),
('esadfun-item-9', 'esadfun', 9, 'Durante los últimos 7 días, ¿qué tan seguido olvida con frecuencia donde dejó las llaves o la cartera?', 'ESADFUN9', NULL, 0, 1),
('esadfun-item-10', 'esadfun', 10, 'Durante los últimos 7 días, ¿qué tan seguido le toma más tiempo del habitual poner en palabras lo que está pensando?', 'ESADFUN10', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('esadfun-opt-0', 'esadfun', '0', 'Nunca en los últimos 7 días', 0, 1, 1),
('esadfun-opt-1', 'esadfun', '1', 'Raramente (una o dos veces)', 1, 2, 1),
('esadfun-opt-2', 'esadfun', '2', 'Algunas veces (3 a 5 veces)', 2, 3, 1),
('esadfun-opt-3', 'esadfun', '3', 'Frecuente (alrededor de una vez al día)', 3, 4, 1),
('esadfun-opt-4', 'esadfun', '4', 'Muy frecuente (más de una vez al día)', 4, 5, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('esadfun-int-normal', 'esadfun', 0, 4, 'normal', 'Sin afectación cognitiva significativa', '#48bb78', 'La puntuación se encuentra por debajo del punto de corte establecido, sugiriendo AUSCENCIA de afectación cognitiva significativa relacionada con síntomas depresivos', 'Continuar con monitoreo rutinario en caso de sintomatología depresiva activa. La función cognitiva reportada se encuentra dentro de parámetros esperados', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('esadfun-int-mild', 'esadfun', 5, 15, 'mild', 'Afectación cognitiva leve', '#f6ad55', 'Se detecta afectación cognitiva leve. Los síntomas reportados sugieren dificultades mínimas en atención, memoria y velocidad de procesamiento', 'Monitoreo estrecho de evolución cognitiva. Considerar evaluación neuropsicológica básica', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('esadfun-int-moderate', 'esadfun', 16, 25, 'moderate', 'Afectación cognitiva moderada', '#ed8936', 'Se detecta afectación cognitiva moderada con impacto en múltiples dominios cognitivos', 'Evaluación neuropsicológica comprehensiva recomendada. Considerar intervenciones cognitivas específicas como rehabilitación cognitiva o farmacoterapia dirigida a mejorar funciones cognitivas', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('esadfun-int-severe', 'esadfun', 26, 40, 'severe', 'Afectación cognitiva severa', '#f56565', 'Se detecta afectación cognitiva severa con impacto sustancial en el funcionamiento global', 'Evaluación neuropsicológica urgente. Revisión inmediata del plan terapéutico, evaluar la indicación de medicamentos para mejoria de función cognitiva', 1);

-- Insertar subescalas
INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES
('esadfun-sub-attention', 'esadfun', 'Atención/Concentración', 'attention', 0, 8, 'Evalúa problemas de atención y concentración en actividades diarias', 1),
('esadfun-sub-planning', 'esadfun', 'Planeación/Organización', 'planning', 0, 8, 'Evalúa dificultades en organización y toma de decisiones', 1),
('esadfun-sub-retrospective', 'esadfun', 'Memoria Retrospectiva', 'retrospective', 0, 8, 'Evalúa problemas para recordar información pasada', 1),
('esadfun-sub-prospective', 'esadfun', 'Memoria Prospectiva', 'prospective', 0, 4, 'Evalúa olvido de intenciones futuras', 1),
('esadfun-sub-processing', 'esadfun', 'Velocidad de Procesamiento', 'processing', 0, 8, 'Evalúa lentitud en el procesamiento cognitivo', 1),
('esadfun-sub-communication', 'esadfun', 'Comunicación', 'communication', 0, 4, 'Evalúa dificultades para expresar sentimientos', 1);
