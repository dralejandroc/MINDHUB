-- =====================================================
-- SEED SQL para escala GDS-15
-- Escala de Depresión Geriátrica
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'gds15',
    'Escala de Depresión Geriátrica',
    'GDS-15',
    'Forma abreviada',
    'depression',
    'geriatric_screening',
    'Instrumento de tamizaje diseñado específicamente para detectar síntomas depresivos en adultos mayores',
    'Yesavage, Sheikh y colaboradores',
    1986,
    7,
    'self_administered',
    'Adultos mayores de 65 años',
    15,
    'sum',
    0,
    15,
    'Diseñado específicamente para adultos mayores. Formato simple sí/no. Sensibilidad: 92%, Especificidad: 89%',
    'Elija la mejor respuesta sobre cómo se ha sentido durante la semana pasada. Responda SÍ o NO a cada pregunta, no sobrepiense sus respuestas, no hay respuestas correctas e incorrectas',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('gds-item-1', 'gds15', 1, '¿Está usted satisfecho/a con su vida?', 'GDS-151', NULL, 1, 1),
('gds-item-2', 'gds15', 2, '¿Ha dejado muchas de sus actividades e intereses?', 'GDS-152', NULL, 0, 1),
('gds-item-3', 'gds15', 3, '¿Siente que su vida está vacía?', 'GDS-153', NULL, 0, 1),
('gds-item-4', 'gds15', 4, '¿Se aburre con frecuencia?', 'GDS-154', NULL, 0, 1),
('gds-item-5', 'gds15', 5, '¿Está usted de buen ánimo la mayor parte del tiempo?', 'GDS-155', NULL, 1, 1),
('gds-item-6', 'gds15', 6, '¿Tiene miedo de que le vaya a pasar algo malo?', 'GDS-156', NULL, 0, 1),
('gds-item-7', 'gds15', 7, '¿Se siente feliz la mayor parte del tiempo?', 'GDS-157', NULL, 1, 1),
('gds-item-8', 'gds15', 8, '¿Se siente con frecuencia desamparado/a o desvalido/a?', 'GDS-158', NULL, 0, 1),
('gds-item-9', 'gds15', 9, '¿Prefiere quedarse en casa en ves que salir y hacer cosas nuevas?', 'GDS-159', NULL, 0, 1),
('gds-item-10', 'gds15', 10, '¿Siente usted que tiene más problemas de memoria que la mayoría de la gente?', 'GDS-1510', NULL, 0, 1),
('gds-item-11', 'gds15', 11, '¿Piensa que es maravilloso estar vivo/a?', 'GDS-1511', NULL, 1, 1),
('gds-item-12', 'gds15', 12, '¿Se siente inútil tal como está ahora?', 'GDS-1512', NULL, 0, 1),
('gds-item-13', 'gds15', 13, '¿Se siente lleno/a de energía?', 'GDS-1513', NULL, 1, 1),
('gds-item-14', 'gds15', 14, '¿Siente que su situación es desesperanzada?', 'GDS-1514', NULL, 0, 1),
('gds-item-15', 'gds15', 15, '¿Piensa que la mayoría de la gente está mejor que usted?', 'GDS-1515', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('gds-opt-yes', 'gds15', '1', 'SÍ', 1, 1, 1),
('gds-opt-no', 'gds15', '0', 'NO', 0, 2, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gds-int-normal', 'gds15', 0, 4, 'normal', 'Normal', '#48bb78', 'Sin evidencia significativa de síntomas depresivos. Resultado normal para la edad', 'Mantener actividades actuales y estilo de vida saludable', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gds-int-mild', 'gds15', 5, 8, 'mild', 'Depresión Leve', '#f6ad55', 'Síntomas depresivos leves que requieren evaluación e intervención temprana', 'Comparar con la clínica, diagnostico diferencial con deterioro cognitivo, actividades sociales, apoyo familiar, seguimiento en 2-4 semanas', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gds-int-moderate', 'gds15', 9, 11, 'moderate', 'Depresión Moderada', '#ed8936', 'Síntomas depresivos moderados que requieren evaluación y tratamiento profesional', 'Diagnostico diferencial necesario con Deterioro cognitivo, si esta indicado considerar psicoterapia y/o farmacoterapia', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gds-int-severe', 'gds15', 12, 15, 'severe', 'Depresión Severa', '#f56565', 'Síntomas depresivos severos que requieren intervención inmediata y tratamiento intensivo', 'Considerar realizar estudios de gabinete como RM, revisar antecedentes y factores de riesgo, tratamiento farmacológico necesario si esta indicado por clínica, psicoterapia, evaluación de riesgo suicida indispensable', 1);

-- Insertar subescalas
INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES
('gds-sub-positive', 'gds15', 'Estado de Ánimo Positivo (ausencia)', 'positive', 0, 5, 'Evalúa la ausencia de experiencias emocionales positivas y satisfacción vital', 1),
('gds-sub-depressed', 'gds15', 'Estado de Ánimo Deprimido', 'depressed', 0, 10, 'Evalúa experiencias emocionales negativas y síntomas depresivos', 1);
