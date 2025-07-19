-- =====================================================
-- SEED SQL para escala GAD-7
-- Escala de Ansiedad Generalizada
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'gad-7',
    'Escala de Ansiedad Generalizada',
    'GAD-7',
    '1.0',
    'ansiedad',
    'ansiedad_generalizada',
    'Escala breve de autoreporte de 7 ítems desarrollada para detectar casos probables de trastorno de ansiedad generalizada. Evalúa la frecuencia de síntomas ansiosos durante las últimas dos semanas. Es una herramienta eficiente para screening y seguimiento.',
    'Spitzer, R.L., Kroenke, K., Williams, J.B.W., y Löwe, B.',
    2006,
    5,
    'self_administered',
    'Adultos en atención primaria y especializada, poblaciones clínicas y no clínicas',
    7,
    'sum',
    0,
    21,
    'Herramienta de screening eficaz. Optimiza sensibilidad sin comprometer especificidad. Para diagnóstico definitivo se requiere evaluación clínica adicional.',
    'Durante las últimas 2 semanas, ¿qué tan seguido ha sido molestado por los siguientes problemas? Marque una respuesta para cada problema. Recuerde que no hay respuestas correctas ni incorrectas.',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('gad-7-item-1', 'gad-7', 1, 'Sentirse nervioso, ansioso o muy alterado', 'GAD-71', NULL, 0, 1),
('gad-7-item-2', 'gad-7', 2, 'No ser capaz de parar o controlar las preocupaciones', 'GAD-72', NULL, 0, 1),
('gad-7-item-3', 'gad-7', 3, 'Preocuparse demasiado por diferentes cosas', 'GAD-73', NULL, 0, 1),
('gad-7-item-4', 'gad-7', 4, 'Dificultad para relajarse', 'GAD-74', NULL, 0, 1),
('gad-7-item-5', 'gad-7', 5, 'Estar tan inquieto que es difícil quedarse sin moverse', 'GAD-75', NULL, 0, 1),
('gad-7-item-6', 'gad-7', 6, 'Irritarse o enojarse con facilidad', 'GAD-76', NULL, 0, 1),
('gad-7-item-7', 'gad-7', 7, 'Sentir miedo como si algo terrible fuera a pasar', 'GAD-77', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('gad-7-opt-0', 'gad-7', '0', 'Para nada', 0, 1, 1),
('gad-7-opt-1', 'gad-7', '1', 'Varios días', 1, 2, 1),
('gad-7-opt-2', 'gad-7', '2', 'Más de la mitad de los días', 2, 3, 1),
('gad-7-opt-3', 'gad-7', '3', 'Casi todos los días', 3, 4, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gad-7-int-minima', 'gad-7', 0, 4, 'minimal', 'Ansiedad Mínima', '#27AE60', 'Síntomas mínimos de ansiedad. No se sugiere la presencia de un trastorno de ansiedad generalizada.', 'No se requiere intervención específica. Mantener estrategias actuales de bienestar.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gad-7-int-leve', 'gad-7', 5, 9, 'mild', 'Ansiedad Leve', '#F39C12', 'Síntomas leves de ansiedad. Monitorear evolución y considerar estrategias de autocuidado.', 'Técnicas de manejo del estrés, ejercicio regular, técnicas de relajación. Seguimiento en 4-6 semanas.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gad-7-int-moderada', 'gad-7', 10, 14, 'moderate', 'Ansiedad Moderada', '#E67E22', 'Síntomas moderados de ansiedad. Se recomienda evaluación clínica adicional para determinar diagnóstico.', 'Evaluación clínica integral. Considerar psicoterapia (TCC) y técnicas de manejo de ansiedad.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gad-7-int-severa', 'gad-7', 15, 21, 'severe', 'Ansiedad Severa', '#E74C3C', 'Síntomas severos de ansiedad. Probable trastorno de ansiedad generalizada. Se requiere evaluación y tratamiento inmediato.', 'Comparar con la clínica. Considerar tratamiento farmacológico y psicoterapéutico combinado.', 1);

-- Insertar subescalas
INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES
('gad-7-sub-unidimensional', 'gad-7', 'Ansiedad Generalizada', 'unidimensional', 0, 21, 'Factor único que evalúa síntomas centrales del trastorno de ansiedad generalizada', 1);
