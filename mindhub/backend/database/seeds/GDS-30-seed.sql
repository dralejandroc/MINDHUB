-- =====================================================
-- SEED SQL para escala GDS-30
-- Escala de Depresión Geriátrica - Versión Completa
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'gds-30',
    'Escala de Depresión Geriátrica - Versión Completa',
    'GDS-30',
    '1.0',
    'depresion',
    'geriatria',
    'Escala de tamizaje específicamente diseñada para detectar síntomas depresivos en adultos mayores, utiliza formato de respuesta sí/no para facilitar su administración en población geriátrica',
    'Jerome A. Yesavage, Terence L. Brink',
    1983,
    5-10 minutos,
    'self_administered',
    'Adultos mayores de 60 años',
    30,
    'sum',
    0,
    30,
    'La escala puede ser auto-administrada o aplicada por el clínico. Asegúrese de que el paciente comprenda que debe responder sí o no basándose en cómo se ha sentido durante la semana pasada.',
    'Por favor responda sí o no a las siguientes preguntas en relación a cómo se ha sentido durante la semana pasada. Las respuestas posibles son solo SI o NO, no hay puntos intermedios, lo primero que se le venga a la cabeza generalmente es correcto. No sobrepiense sus respuestas.',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('gds30-item-1', 'gds-30', 1, '¿Está usted satisfecho con su vida?', 'GDS-301', NULL, 1, 1),
('gds30-item-2', 'gds-30', 2, '¿Ha abandonado muchas de sus actividades e intereses?', 'GDS-302', NULL, 0, 1),
('gds30-item-3', 'gds-30', 3, '¿Siente que su vida está vacía?', 'GDS-303', NULL, 0, 1),
('gds30-item-4', 'gds-30', 4, '¿Se encuentra a menudo aburrido/a?', 'GDS-304', NULL, 0, 1),
('gds30-item-5', 'gds-30', 5, '¿Tiene esperanza en el futuro la mayor parte del tiempo?', 'GDS-305', NULL, 1, 1),
('gds30-item-6', 'gds-30', 6, '¿Se siente molesto/a por pensamientos que no puede sacarse de la cabeza?', 'GDS-306', NULL, 0, 1),
('gds30-item-7', 'gds-30', 7, '¿Tiene buen ánimo la mayor parte del tiempo?', 'GDS-307', NULL, 1, 1),
('gds30-item-8', 'gds-30', 8, '¿Tiene MIEDO de que le pase algo malo?', 'GDS-308', NULL, 0, 1),
('gds30-item-9', 'gds-30', 9, '¿Se siente FELIZ la mayor parte del tiempo?', 'GDS-309', NULL, 1, 1),
('gds30-item-10', 'gds-30', 10, '¿Se siente a menudo SIN esperanza?', 'GDS-3010', NULL, 0, 1),
('gds30-item-11', 'gds-30', 11, '¿Se siente inquieto e intranquilo?', 'GDS-3011', NULL, 0, 1),
('gds30-item-12', 'gds-30', 12, '¿Prefiere quedarse en casa en lugar de salir y hacer cosas nuevas?', 'GDS-3012', NULL, 0, 1),
('gds30-item-13', 'gds-30', 13, '¿Se preocupa mucho por el futuro?', 'GDS-3013', NULL, 0, 1),
('gds30-item-14', 'gds-30', 14, '¿Siente que tiene MÁS problemas de memoria que los demás?', 'GDS-3014', NULL, 0, 1),
('gds30-item-15', 'gds-30', 15, '¿Piensa que es maravilloso estar vivo ahora?', 'GDS-3015', NULL, 1, 1),
('gds30-item-16', 'gds-30', 16, '¿Se siente a menudo desanimado/a y melancólico/a?', 'GDS-3016', NULL, 0, 1),
('gds30-item-17', 'gds-30', 17, '¿Se siente bastante inútil tal como está ahora?', 'GDS-3017', NULL, 0, 1),
('gds30-item-18', 'gds-30', 18, '¿Se preocupa mucho por el pasado?', 'GDS-3018', NULL, 0, 1),
('gds30-item-19', 'gds-30', 19, '¿Encuentra la vida muy emocionante?', 'GDS-3019', NULL, 1, 1),
('gds30-item-20', 'gds-30', 20, '¿Es difícil para usted empezar nuevos proyectos?', 'GDS-3020', NULL, 0, 1),
('gds30-item-21', 'gds-30', 21, '¿Se siente lleno de energía?', 'GDS-3021', NULL, 1, 1),
('gds30-item-22', 'gds-30', 22, '¿Siente que su situación es desesperanzadora?', 'GDS-3022', NULL, 0, 1),
('gds30-item-23', 'gds-30', 23, '¿Piensa que la mayoría de la gente está mejor que usted?', 'GDS-3023', NULL, 0, 1),
('gds30-item-24', 'gds-30', 24, '¿Se molesta frecuentemente por pequeñas cosas?', 'GDS-3024', NULL, 0, 1),
('gds30-item-25', 'gds-30', 25, '¿Siente frecuentemente ganas de llorar?', 'GDS-3025', NULL, 0, 1),
('gds30-item-26', 'gds-30', 26, '¿Tiene problemas para concentrarse?', 'GDS-3026', NULL, 0, 1),
('gds30-item-27', 'gds-30', 27, '¿Disfruta levantándose por las mañanas?', 'GDS-3027', NULL, 1, 1),
('gds30-item-28', 'gds-30', 28, '¿Prefiere evitar las reuniones sociales?', 'GDS-3028', NULL, 0, 1),
('gds30-item-29', 'gds-30', 29, '¿Es fácil para usted tomar decisiones?', 'GDS-3029', NULL, 1, 1),
('gds30-item-30', 'gds-30', 30, '¿Su mente está tan clara como solía estar?', 'GDS-3030', NULL, 1, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('gds30-opt-no', 'gds-30', 'no', 'No', 0, 1, 1),
('gds30-opt-yes', 'gds-30', 'yes', 'Sí', 1, 2, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gds30-int-normal', 'gds-30', 0, 9, 'minimal', 'Normal', '#48bb78', 'Puntuación normal. No se observan síntomas depresivos significativos.', 'Continuar con rutinas normales de bienestar. Mantener actividades sociales y físicas.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gds30-int-mild', 'gds-30', 10, 19, 'mild', 'Depresión Leve', '#f6ad55', 'Presencia de síntomas depresivos leves. Sugiere evaluación clínica profunda.', 'Evaluar sintomas cognitivos, activación conductual, apoyo social y monitoreo de síntomas.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gds30-int-severe', 'gds-30', 20, 30, 'severe', 'Depresión Severa', '#f56565', 'Síntomas depresivos severos que requieren intervención clínica inmediata.', 'Tratamiento farmacológico indispensable si está indicado por clínica, De estár indicado psicoterapia especializada (Evaluar capacidad del adulto mayor para llevar psicoterapia). Hacer diagnóstico diferencial con Trastorno cognitivo.', 1);

