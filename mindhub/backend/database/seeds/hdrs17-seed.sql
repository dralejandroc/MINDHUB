-- =====================================================
-- SEED SQL para escala HDRS-17
-- Escala de Depresión de Hamilton
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'hdrs17',
    'Escala de Depresión de Hamilton',
    'HDRS-17',
    '17 ítems',
    'depression',
    'clinician_rated',
    'Escala de evaluación clínica para medir la gravedad de los síntomas depresivos en pacientes con diagnóstico previo de depresión',
    'Max Hamilton',
    1960,
    20,
    'clinician_administered',
    'Adultos con diagnóstico de depresión',
    17,
    'sum',
    0,
    52,
    'Entrevista clínica estructurada. Evaluar síntomas de la última semana. Puntos de corte: 0-7 normal/remisión, 8-16 leve, 17-23 moderada, ≥24 severa',
    'El clínico evaluará sus síntomas mediante entrevista clínica',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('hdrs-item-1', 'hdrs17', 1, 'Estado de ánimo deprimido (tristeza, desesperanza, desamparo, inutilidad)', 'HDRS-171', NULL, 0, 1),
('hdrs-item-2', 'hdrs17', 2, 'Sentimientos de culpa', 'HDRS-172', NULL, 0, 1),
('hdrs-item-3', 'hdrs17', 3, 'Suicidio', 'HDRS-173', NULL, 0, 1),
('hdrs-item-4', 'hdrs17', 4, 'Insomnio temprano (dificultad para conciliar el sueño)', 'HDRS-174', NULL, 0, 1),
('hdrs-item-5', 'hdrs17', 5, 'Insomnio medio (despertares nocturnos)', 'HDRS-175', NULL, 0, 1),
('hdrs-item-6', 'hdrs17', 6, 'Insomnio tardío (despertar precoz)', 'HDRS-176', NULL, 0, 1),
('hdrs-item-7', 'hdrs17', 7, 'Trabajo y actividades', 'HDRS-177', NULL, 0, 1),
('hdrs-item-8', 'hdrs17', 8, 'Retardo psicomotor (lentitud de pensamiento y habla, concentración disminuida, actividad motora disminuida)', 'HDRS-178', NULL, 0, 1),
('hdrs-item-9', 'hdrs17', 9, 'Agitación', 'HDRS-179', NULL, 0, 1),
('hdrs-item-10', 'hdrs17', 10, 'Ansiedad psíquica', 'HDRS-1710', NULL, 0, 1),
('hdrs-item-11', 'hdrs17', 11, 'Ansiedad somática (manifestaciones fisiológicas de ansiedad)', 'HDRS-1711', NULL, 0, 1),
('hdrs-item-12', 'hdrs17', 12, 'Síntomas somáticos gastrointestinales', 'HDRS-1712', NULL, 0, 1),
('hdrs-item-13', 'hdrs17', 13, 'Síntomas somáticos generales', 'HDRS-1713', NULL, 0, 1),
('hdrs-item-14', 'hdrs17', 14, 'Síntomas genitales (pérdida de la libido, trastornos menstruales)', 'HDRS-1714', NULL, 0, 1),
('hdrs-item-15', 'hdrs17', 15, 'Hipocondría', 'HDRS-1715', NULL, 0, 1),
('hdrs-item-16', 'hdrs17', 16, 'Pérdida de peso', 'HDRS-1716', NULL, 0, 1),
('hdrs-item-17', 'hdrs17', 17, 'Insight (conciencia de enfermedad)', 'HDRS-1717', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('hdrs-3point-0', 'hdrs17', '0', 'Ausente', 0, 1, 1),
('hdrs-3point-1', 'hdrs17', '1', 'Leve', 1, 2, 1),
('hdrs-3point-2', 'hdrs17', '2', 'Moderado/Severo', 2, 3, 1),
('hdrs-5point-0', 'hdrs17', '0', 'Ausente', 0, 1, 1),
('hdrs-5point-1', 'hdrs17', '1', 'Leve', 1, 2, 1),
('hdrs-5point-2', 'hdrs17', '2', 'Moderado', 2, 3, 1),
('hdrs-5point-3', 'hdrs17', '3', 'Severo', 3, 4, 1),
('hdrs-5point-4', 'hdrs17', '4', 'Muy severo/Incapacitante', 4, 5, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('hdrs-int-normal', 'hdrs17', 0, 7, 'normal', 'Normal/Remisión', '#48bb78', 'Ausencia de sintomatología depresiva o remisión clínica', 'Mantener seguimiento rutinario y estrategias preventivas', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('hdrs-int-mild', 'hdrs17', 8, 16, 'mild', 'Depresión Leve', '#f6ad55', 'Síntomas depresivos leves que pueden beneficiarse de intervenciones psicoterapéuticas', 'Psicoterapia, técnicas de autoayuda, seguimiento regular', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('hdrs-int-moderate', 'hdrs17', 17, 23, 'moderate', 'Depresión Moderada', '#ed8936', 'Síntomas depresivos moderados que requieren tratamiento activo', 'Psicoterapia estructurada, considerar tratamiento farmacológico', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('hdrs-int-severe', 'hdrs17', 24, 52, 'severe', 'Depresión Severa', '#f56565', 'Síntomas depresivos severos que requieren tratamiento intensivo inmediato', 'Tratamiento farmacológico y psicoterapia combinados, seguimiento intensivo', 1);

