-- =====================================================
-- SEED SQL para escala BDI-21
-- Inventario de Depresión de Beck - 21 Ítems
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'bdi-21',
    'Inventario de Depresión de Beck - 21 Ítems',
    'BDI-21',
    '2.0',
    'depresion',
    'evaluacion_completa_adultos',
    'Inventario de autoinforme que evalúa la severidad de síntomas depresivos en adolescentes y adultos mediante 21 ítems que cubren síntomas cognitivos, afectivos, somáticos y vegetativos',
    'Aaron T. Beck',
    1961,
    10-15 minutos,
    'self_administered',
    'Adolescentes y adultos de 13 años en adelante',
    21,
    'sum',
    0,
    63,
    'Administre el cuestionario en un ambiente privado. Asegúrese de que el paciente comprenda las instrucciones y lea íntegro cada grupo de afirmaciones antes de seleccionar una opción.',
    'Este cuestionario contiene grupos de afirmaciones. Por favor, lea íntegro el grupo de afirmaciones de cada uno de los 21 apartados o tarjetas y escoja la afirmación de cada grupo que mejor describa el modo en que se siente en el tiempo más reciente.',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('bdi21-item-1', 'bdi-21', 1, 'Estado de ánimo', 'BDI-211', NULL, 0, 1),
('bdi21-item-2', 'bdi-21', 2, 'Pesimismo', 'BDI-212', NULL, 0, 1),
('bdi21-item-3', 'bdi-21', 3, 'Sentimiento de fracaso', 'BDI-213', NULL, 0, 1),
('bdi21-item-4', 'bdi-21', 4, 'Insatisfacción', 'BDI-214', NULL, 0, 1),
('bdi21-item-5', 'bdi-21', 5, 'Sentimientos de culpa', 'BDI-215', NULL, 0, 1),
('bdi21-item-6', 'bdi-21', 6, 'Sentimiento de castigo', 'BDI-216', NULL, 0, 1),
('bdi21-item-7', 'bdi-21', 7, 'Odio a sí mismo', 'BDI-217', NULL, 0, 1),
('bdi21-item-8', 'bdi-21', 8, 'Autoacusación', 'BDI-218', NULL, 0, 1),
('bdi21-item-9', 'bdi-21', 9, 'Impulsos suicidas', 'BDI-219', NULL, 0, 1),
('bdi21-item-10', 'bdi-21', 10, 'Períodos de llanto', 'BDI-2110', NULL, 0, 1),
('bdi21-item-11', 'bdi-21', 11, 'Irritabilidad', 'BDI-2111', NULL, 0, 1),
('bdi21-item-12', 'bdi-21', 12, 'Aislamiento social', 'BDI-2112', NULL, 0, 1),
('bdi21-item-13', 'bdi-21', 13, 'Indecisión', 'BDI-2113', NULL, 0, 1),
('bdi21-item-14', 'bdi-21', 14, 'Imagen corporal', 'BDI-2114', NULL, 0, 1),
('bdi21-item-15', 'bdi-21', 15, 'Capacidad laboral', 'BDI-2115', NULL, 0, 1),
('bdi21-item-16', 'bdi-21', 16, 'Trastornos del sueño', 'BDI-2116', NULL, 0, 1),
('bdi21-item-17', 'bdi-21', 17, 'Cansancio', 'BDI-2117', NULL, 0, 1),
('bdi21-item-18', 'bdi-21', 18, 'Pérdida de apetito', 'BDI-2118', NULL, 0, 1),
('bdi21-item-19', 'bdi-21', 19, 'Pérdida de peso', 'BDI-2119', NULL, 0, 1),
('bdi21-item-20', 'bdi-21', 20, 'Hipocondria', 'BDI-2120', NULL, 0, 1),
('bdi21-item-21', 'bdi-21', 21, 'Libido', 'BDI-2121', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('bdi21-opt-0', 'bdi-21', '0', 'Opción 0', 0, 1, 1),
('bdi21-opt-1', 'bdi-21', '1', 'Opción 1', 1, 2, 1),
('bdi21-opt-2', 'bdi-21', '2', 'Opción 2', 2, 3, 1),
('bdi21-opt-3', 'bdi-21', '3', 'Opción 3', 3, 4, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('bdi21-int-normal', 'bdi-21', 0, 9, 'minimal', 'Sin depresión', '#48bb78', 'La puntuación indica ausencia de sintomatología depresiva clínicamente significativa.', 'Mantener estrategias de bienestar actual. Continuar con actividades preventivas de salud mental.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('bdi21-int-mild', 'bdi-21', 10, 18, 'mild', 'Depresión leve', '#f6ad55', 'Se evidencia presencia de sintomatología depresiva de intensidad leve.', 'Evaluación de factores precipitantes. Considerar intervenciones psicoeducativas y estrategias de manejo del estrés.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('bdi21-int-moderate', 'bdi-21', 19, 29, 'moderate', 'Depresión moderada', '#ed8936', 'La puntuación indica sintomatología depresiva de intensidad moderada que requiere intervención clínica.', 'Intervención psicoterapéutica estructurada. Evaluación de tratamiento farmacológico y seguimiento clínico regular.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('bdi21-int-severe', 'bdi-21', 30, 63, 'severe', 'Depresión grave', '#f56565', 'La puntuación indica sintomatología depresiva severa que requiere intervención clínica inmediata.', 'Intervención clínica inmediata. Evaluación prioritaria de riesgo suicida. Tratamiento farmacológico combinado y seguimiento intensivo.', 1);

-- Insertar subescalas
INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES
('bdi21-sub-cognitive', 'bdi-21', 'Síntomas Cognitivos', 'cognitive', 0, 15, 'Evalúan la tríada cognitiva negativa de Beck, incluyendo pesimismo, sentimientos de fracaso, expectativas de castigo, autoacusación e indecisión.', 1),
('bdi21-sub-affective', 'bdi-21', 'Síntomas Afectivos', 'affective', 0, 24, 'Evalúan alteraciones del estado de ánimo y emocionales como tristeza, insatisfacción, culpa, odio hacia sí mismo, ideación suicida, llanto, irritabilidad y aislamiento social.', 1),
('bdi21-sub-somatic', 'bdi-21', 'Síntomas Somáticos', 'somatic', 0, 9, 'Evalúan manifestaciones físicas conscientes como preocupaciones por la imagen corporal, fatiga y preocupaciones hipocondríacas por la salud.', 1),
('bdi21-sub-vegetative', 'bdi-21', 'Síntomas Vegetativos', 'vegetative', 0, 15, 'Evalúan funciones neurovegetativas automáticas incluyendo capacidad laboral, trastornos del sueño, pérdida de apetito, pérdida de peso y disminución de la libido.', 1);
