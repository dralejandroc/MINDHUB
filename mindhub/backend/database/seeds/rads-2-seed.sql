-- =====================================================
-- SEED SQL para escala RADS-2
-- Escala de Depresión para Adolescentes - Segunda Edición
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'rads-2',
    'Escala de Depresión para Adolescentes - Segunda Edición',
    'RADS-2',
    '2.0',
    'depresion',
    'adolescentes',
    'Escala de autoinforme diseñada específicamente para evaluar síntomas depresivos en adolescentes de 11 a 20 años mediante 30 ítems que evalúan estado de ánimo disfórico, anhedonia, autoevaluación negativa y quejas somáticas',
    'William M. Reynolds',
    2002,
    10-15 minutos,
    'self_administered',
    'Adolescentes de 11 a 20 años',
    30,
    'sum',
    30,
    120,
    'Administre en un ambiente tranquilo y privado. Explique que no hay respuestas correctas o incorrectas y que es importante la honestidad. Asegúrese de que el adolescente comprenda las opciones de respuesta.',
    'A continuación encontrarás una serie de frases que describen cómo te puedes sentir. Lee cada frase cuidadosamente y selecciona la opción que mejor describe cómo te has sentido en las últimas dos semanas.',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('rads2-item-1', 'rads-2', 1, 'Me siento triste.', 'RADS-21', NULL, 0, 1),
('rads2-item-2', 'rads-2', 2, 'Me preocupo por las cosas que van mal.', 'RADS-22', NULL, 0, 1),
('rads2-item-3', 'rads-2', 3, 'Siento que quiero llorar.', 'RADS-23', NULL, 0, 1),
('rads2-item-4', 'rads-2', 4, 'Tengo problemas para dormir por la noche.', 'RADS-24', NULL, 0, 1),
('rads2-item-5', 'rads-2', 5, 'Siento que no vale la pena vivir.', 'RADS-25', NULL, 0, 1),
('rads2-item-6', 'rads-2', 6, 'Siento que soy una mala persona.', 'RADS-26', NULL, 0, 1),
('rads2-item-7', 'rads-2', 7, 'Me siento solo/a.', 'RADS-27', NULL, 0, 1),
('rads2-item-8', 'rads-2', 8, 'Me gusta salir con mis amigos.', 'RADS-28', NULL, 1, 1),
('rads2-item-9', 'rads-2', 9, 'Quiero hacerme daño a mí mismo/a.', 'RADS-29', NULL, 0, 1),
('rads2-item-10', 'rads-2', 10, 'Tengo problemas para concentrarme.', 'RADS-210', NULL, 0, 1),
('rads2-item-11', 'rads-2', 11, 'Me siento cansado/a.', 'RADS-211', NULL, 0, 1),
('rads2-item-12', 'rads-2', 12, 'Creo que nadie me quiere.', 'RADS-212', NULL, 0, 1),
('rads2-item-13', 'rads-2', 13, 'NO me gusta estar con otras personas.', 'RADS-213', NULL, 0, 1),
('rads2-item-14', 'rads-2', 14, 'Tengo ganas de huir.', 'RADS-214', NULL, 0, 1),
('rads2-item-15', 'rads-2', 15, 'Tengo dolores y malestares.', 'RADS-215', NULL, 0, 1),
('rads2-item-16', 'rads-2', 16, 'Me siento aburrido/a.', 'RADS-216', NULL, 0, 1),
('rads2-item-17', 'rads-2', 17, 'Me gusta comer.', 'RADS-217', NULL, 1, 1),
('rads2-item-18', 'rads-2', 18, 'Me preocupa cómo me veo.', 'RADS-218', NULL, 0, 1),
('rads2-item-19', 'rads-2', 19, 'Tengo que esforzarme para hacer las cosas.', 'RADS-219', NULL, 0, 1),
('rads2-item-20', 'rads-2', 20, 'Siento que no soy tan bueno/a como otros jovenes.', 'RADS-220', NULL, 0, 1),
('rads2-item-21', 'rads-2', 21, 'Siento que todo es mi culpa.', 'RADS-221', NULL, 0, 1),
('rads2-item-22', 'rads-2', 22, 'No tengo apetito.', 'RADS-222', NULL, 0, 1),
('rads2-item-23', 'rads-2', 23, 'Duermo bien por la noche.', 'RADS-223', NULL, 1, 1),
('rads2-item-24', 'rads-2', 24, 'Disfruto de las cosas que hago.', 'RADS-224', NULL, 1, 1),
('rads2-item-25', 'rads-2', 25, 'Tengo dolores de cabeza.', 'RADS-225', NULL, 0, 1),
('rads2-item-26', 'rads-2', 26, 'Me siento BIEN conmigo mismo/a.', 'RADS-226', NULL, 1, 1),
('rads2-item-27', 'rads-2', 27, 'Creo que mi vida va mal.', 'RADS-227', NULL, 0, 1),
('rads2-item-28', 'rads-2', 28, 'Tengo problemas de estómago.', 'RADS-228', NULL, 0, 1),
('rads2-item-29', 'rads-2', 29, 'Tengo tan poca energía que no puedo hacer las cosas.', 'RADS-229', NULL, 0, 1),
('rads2-item-30', 'rads-2', 30, 'Creo que soy feo/a.', 'RADS-230', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('rads2-opt-1', 'rads-2', '1', 'Casi nunca', 1, 1, 1),
('rads2-opt-2', 'rads-2', '2', 'Pocas veces', 2, 2, 1),
('rads2-opt-3', 'rads-2', '3', 'A veces', 3, 3, 1),
('rads2-opt-4', 'rads-2', '4', 'La mayoría del tiempo', 4, 4, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('rads2-int-normal', 'rads-2', 30, 45, 'minimal', 'Normal', '#48bb78', 'Puntuación dentro del rango normal. No se observan síntomas depresivos significativos.', 'Mantener hábitos saludables. Continuar actividades sociales. Técnicas de prevención de depresión.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('rads2-int-mild', 'rads-2', 46, 60, 'mild', 'Leve', '#f6ad55', 'Síntomas depresivos leves, Se sugiere monitoreo y consideración de apoyo profesional.', 'Monitoreo periódico. Técnicas de manejo del estrés. Actividades de autocuidado. Fortalecimiento de red de apoyo.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('rads2-int-moderate', 'rads-2', 61, 75, 'moderate', 'Moderado', '#ed8936', 'Síntomas depresivos moderados que requieren atención.', 'Comparar resultados con la clínica. Evaluar la necesidad de tratamiento farmacológicogico. Psicoterapia cognitivo-conductual. Monitoreo regular de síntomas. Evaluación de factores de riesgo.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('rads2-int-severe', 'rads-2', 76, 120, 'severe', 'Severo', '#f56565', 'Síntomas depresivos clínicamente significativos. Se recomienda evaluación y tratamiento inmediato.', 'Evaluar inicio de tratamiento farmacológico, si está indicado clínicamente. Evaluación de riesgo suicida. Psicoterapia especializada. Seguimiento estrecho de evolución.', 1);

-- Insertar subescalas
INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES
('rads2-sub-dysphoric', 'rads-2', 'Estado de Ánimo Disfórico', 'dysphoric', 7, 28, 'Evalúa tristeza, melancolía, soledad, aislamiento, aburrimiento, culpabilización y desesperanza.', 1),
('rads2-sub-anhedonia', 'rads-2', 'Anhedonia/Afecto Negativo', 'anhedonia', 4, 16, 'Evalúa pérdida de interés en actividades placenteras, pérdida de apetito, disfrute reducido y baja autoestima (ítems inversos).', 1),
('rads2-sub-negative', 'rads-2', 'Autoevaluación Negativa', 'negative', 8, 32, 'Evalúa sentimientos de inutilidad, autolesión, ideas suicidas, rechazo, impulsos de escape, preocupaciones corporales e inferioridad.', 1),
('rads2-sub-somatic', 'rads-2', 'Quejas Somáticas', 'somatic', 11, 44, 'Evalúa síntomas físicos como problemas de sueño, concentración, fatiga, dolores, esfuerzo para actividades, pérdida de apetito y preocupaciones.', 1);
