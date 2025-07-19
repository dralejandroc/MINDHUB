-- =====================================================
-- SEED SQL para escala HAM-A
-- Escala de Ansiedad de Hamilton
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'ham-a',
    'Escala de Ansiedad de Hamilton',
    'HAM-A',
    '1.0',
    'ansiedad',
    'ansiedad_generalizada',
    'Escala heteroaplicada de 14 ítems que evalúa la severidad de síntomas ansiosos tanto psicológicos como somáticos. Es una de las primeras escalas de ansiedad desarrolladas y sigue siendo ampliamente utilizada en settings clínicos.',
    'Hamilton, Max',
    1959,
    20,
    'clinician_administered',
    'Adultos con síntomas de ansiedad, especialmente aquellos ya diagnosticados con ansiedad',
    14,
    'sum',
    0,
    56,
    'Administrar mediante entrevista clínica. Cada ítem debe ser calificado basándose en la observación clínica y reporte del paciente. Considerar síntomas experimentados durante la última semana.',
    'clinician_administered',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('ham-a-item-1', 'ham-a', 1, 'Estado de ánimo ansioso (preocupaciones, expectativa de catástrofes, aprensión, irritabilidad)', 'HAM-A1', NULL, 0, 1),
('ham-a-item-2', 'ham-a', 2, 'Tensión (sensaciones de tensión, fatigabilidad, sobresalto, llanto fácil, temblores, inquietud)', 'HAM-A2', NULL, 0, 1),
('ham-a-item-3', 'ham-a', 3, 'Miedos (a la oscuridad, a desconocidos, a quedarse solo, a animales, al tráfico, a las multitudes)', 'HAM-A3', NULL, 0, 1),
('ham-a-item-4', 'ham-a', 4, 'Insomnio (dificultad para conciliar el sueño, sueño interrumpido, sueño insatisfactorio, fatiga al despertar)', 'HAM-A4', NULL, 0, 1),
('ham-a-item-5', 'ham-a', 5, 'Intelectual/cognitivo (dificultad de concentración, mala memoria)', 'HAM-A5', NULL, 0, 1),
('ham-a-item-6', 'ham-a', 6, 'Estado de ánimo deprimido (pérdida de interés, falta de placer en las aficiones, depresión, despertar precoz, cambios de humor)', 'HAM-A6', NULL, 0, 1),
('ham-a-item-7', 'ham-a', 7, 'Síntomas somáticos generales/musculares (dolores, rigidez, sacudidas mioclónicas, rechinar de dientes, voz quebrada, aumento del tono muscular)', 'HAM-A7', NULL, 0, 1),
('ham-a-item-8', 'ham-a', 8, 'Síntomas somáticos sensoriales (zumbidos de oídos, visión borrosa, sofocos y escalofríos, sensaciones de debilidad, sensaciones de hormigueo)', 'HAM-A8', NULL, 0, 1),
('ham-a-item-9', 'ham-a', 9, 'Síntomas cardiovasculares (taquicardia, palpitaciones, dolor en el pecho, latidos vasculares, sensación de desmayo, extrasístoles)', 'HAM-A9', NULL, 0, 1),
('ham-a-item-10', 'ham-a', 10, 'Síntomas respiratorios (presión o constricción en el pecho, sensaciones asfícticas, suspiros, disnea)', 'HAM-A10', NULL, 0, 1),
('ham-a-item-11', 'ham-a', 11, 'Síntomas gastrointestinales (dificultad para tragar, gases, dolor abdominal, pirosis, sensación de plenitud, náuseas, vómitos, ruidos intestinales, diarrea, pérdida de peso, estreñimiento)', 'HAM-A11', NULL, 0, 1),
('ham-a-item-12', 'ham-a', 12, 'Síntomas genitourinarios (micción frecuente, micción urgente, amenorrea, menorragia, desarrollo de frigidez, eyaculación precoz, erección deficiente, impotencia)', 'HAM-A12', NULL, 0, 1),
('ham-a-item-13', 'ham-a', 13, 'Síntomas autonómicos (boca seca, rubor, palidez, tendencia a la sudoración, vértigos, cefaleas de tensión, horripilación)', 'HAM-A13', NULL, 0, 1),
('ham-a-item-14', 'ham-a', 14, 'Comportamiento en la entrevista general y corporal observado durante evaluacion', 'HAM-A14', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('ham-a-opt-0', 'ham-a', '0', 'No presente', 0, 1, 1),
('ham-a-opt-1', 'ham-a', '1', 'Leve', 1, 2, 1),
('ham-a-opt-2', 'ham-a', '2', 'Moderado', 2, 3, 1),
('ham-a-opt-3', 'ham-a', '3', 'Severo', 3, 4, 1),
('ham-a-opt-4', 'ham-a', '4', 'Muy severo', 4, 5, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('ham-a-int-no-ansiedad', 'ham-a', 0, 7, 'minimal', 'Sin Ansiedad', '#27AE60', 'No se observan síntomas significativos de ansiedad. Funcionamiento normal.', 'Mantener el nivel actual de funcionamiento. No se requiere intervención específica.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('ham-a-int-leve', 'ham-a', 8, 17, 'mild', 'Ansiedad Leve', '#F39C12', 'Síntomas leves de ansiedad que pueden causar molestias mínimas.', 'Considerar técnicas de manejo del estrés, psicoeducación y seguimiento.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('ham-a-int-moderada', 'ham-a', 18, 24, 'moderate', 'Ansiedad Leve a Moderada', '#E67E22', 'Síntomas de ansiedad de leve a moderada intensidad que interfieren con el funcionamiento diario.', 'Considerar intervención psicoterapéutica. Técnicas cognitivo-conductuales recomendadas.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('ham-a-int-severa', 'ham-a', 25, 30, 'severe', 'Ansiedad Moderada a Severa', '#E74C3C', 'Síntomas de ansiedad de moderada a severa intensidad con interferencia significativa en el funcionamiento.', 'Intervención inmediata recomendada. Considerar terapia combinada y evaluación de indicacion farmacológica.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('ham-a-int-muy-severa', 'ham-a', 31, 56, 'extreme', 'Ansiedad Severa', '#8E44AD', 'Síntomas severos de ansiedad con deterioro significativo del funcionamiento social, laboral y personal.', 'Tratamiento inmediato e intensivo. Considerar hospitalización si esta indicado por clínica. Tratamiento farmacológico NO opcional.', 1);

-- Insertar subescalas
INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES
('ham-a-sub-psiquicos', 'ham-a', 'Síntomas Psíquicos', 'psiquicos', 0, 28, 'Evalúa aspectos psicológicos y cognitivos de la ansiedad incluyendo estado de ánimo, tensión, miedos y síntomas cognitivos', 1),
('ham-a-sub-somaticos', 'ham-a', 'Síntomas Somáticos', 'somaticos', 0, 28, 'Evalúa manifestaciones físicas de la ansiedad incluyendo síntomas musculares, sensoriales, cardiovasculares, respiratorios y autonómicos', 1);
