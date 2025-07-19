-- =====================================================
-- SEED SQL para escala MADRS
-- Escala de Depresión de Montgomery-Åsberg
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'madrs',
    'Escala de Depresión de Montgomery-Åsberg',
    'MADRS',
    '1.0',
    'depression',
    'clinician_rated',
    'Escala clínica diseñada para ser sensible a los cambios en la severidad de la depresión durante el tratamiento antidepresivo',
    'Stuart Montgomery y Marie Åsberg',
    1979,
    15,
    'clinician_administered',
    'Adultos con trastorno depresivo mayor',
    10,
    'sum',
    0,
    60,
    'Entrevista clínica basada en síntomas de la última semana. Puntos de corte: 0-6 sin depresión, 7-19 leve, 20-34 moderada, >34 severa',
    'El clínico evaluará sus síntomas mediante entrevista clínica estructurada',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('madrs-item-1', 'madrs', 1, 'Tristeza aparente (desaliento, melancolía y desesperación reflejados en el habla, expresión facial y postura)', 'MADRS1', NULL, 0, 1),
('madrs-item-2', 'madrs', 2, 'Tristeza reportada (sentimientos reportados de estado de ánimo deprimido, independientemente de si se refleja en la apariencia)', 'MADRS2', NULL, 0, 1),
('madrs-item-3', 'madrs', 3, 'Tensión interna (sentimientos de malestar indefinido, inquietud, tensión mental que puede llegar al pánico, temor o angustia)', 'MADRS3', NULL, 0, 1),
('madrs-item-4', 'madrs', 4, 'Sueño reducido (experiencia de duración o profundidad reducida del sueño comparado con el patrón normal del sujeto)', 'MADRS4', NULL, 0, 1),
('madrs-item-5', 'madrs', 5, 'Apetito reducido (sensación de pérdida de apetito comparado con el estado normal)', 'MADRS5', NULL, 0, 1),
('madrs-item-6', 'madrs', 6, 'Dificultades de concentración (dificultades para reunir los pensamientos llegando a una incapacitante falta de concentración)', 'MADRS6', NULL, 0, 1),
('madrs-item-7', 'madrs', 7, 'Lasitud (dificultad para empezar o lentitud para iniciar y realizar actividades cotidianas)', 'MADRS7', NULL, 0, 1),
('madrs-item-8', 'madrs', 8, 'Incapacidad para sentir (experiencia subjetiva de interés reducido en el entorno o actividades que normalmente dan placer)', 'MADRS8', NULL, 0, 1),
('madrs-item-9', 'madrs', 9, 'Pensamientos pesimistas (pensamientos de culpa, inferioridad, autorreproche, pecado, remordimiento y ruina)', 'MADRS9', NULL, 0, 1),
('madrs-item-10', 'madrs', 10, 'Pensamientos suicidas (sentimiento de que la vida no vale la pena, que una muerte natural sería bienvenida, pensamientos suicidas y preparativos para el suicidio)', 'MADRS10', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('madrs-opt-0', 'madrs', '0', 'Normal/Ausente', 0, 1, 1),
('madrs-opt-1', 'madrs', '1', 'Intermedio', 1, 2, 1),
('madrs-opt-2', 'madrs', '2', 'Leve', 2, 3, 1),
('madrs-opt-3', 'madrs', '3', 'Intermedio', 3, 4, 1),
('madrs-opt-4', 'madrs', '4', 'Moderado', 4, 5, 1),
('madrs-opt-5', 'madrs', '5', 'Intermedio', 5, 6, 1),
('madrs-opt-6', 'madrs', '6', 'Severo', 6, 7, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('madrs-int-normal', 'madrs', 0, 6, 'normal', 'Sin depresión', '#48bb78', 'No hay evidencia de síntomas depresivos significativos', 'Mantenimiento del estado actual y prevención', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('madrs-int-mild', 'madrs', 7, 19, 'mild', 'Depresión leve', '#f6ad55', 'Síntomas depresivos leves que pueden requerir intervención temprana', 'Psicoterapia, técnicas de autoayuda, seguimiento regular', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('madrs-int-moderate', 'madrs', 20, 34, 'moderate', 'Depresión moderada', '#ed8936', 'Síntomas depresivos moderados que requieren tratamiento activo', 'evaluar si está indicado tratamiento farmacológico y/o psicoterapia, seguimiento estrecho', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('madrs-int-severe', 'madrs', 35, 60, 'severe', 'Depresión severa', '#f56565', 'Síntomas depresivos severos que requieren tratamiento intensivo inmediato', 'Tratamiento farmacológico combinado necesario si está indicado por clínica, psicoterapia intensiva, valorar la posibilidad de hospitalización, si está indicado.', 1);

-- Insertar subescalas
INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES
('madrs-sub-sadness', 'madrs', 'Tristeza', 'sadness', 0, 12, 'Evalúa tristeza aparente y reportada', 1),
('madrs-sub-negative-thoughts', 'madrs', 'Pensamientos Negativos', 'thoughts', 0, 12, 'Evalúa pesimismo e ideación suicida', 1),
('madrs-sub-detachment', 'madrs', 'Desapego', 'detachment', 0, 6, 'Evalúa anhedonia e incapacidad para sentir', 1),
('madrs-sub-neurovegetative', 'madrs', 'Síntomas Neurovegetativos', 'neurovegetative', 0, 24, 'Evalúa síntomas somáticos y de funcionamiento', 1);
