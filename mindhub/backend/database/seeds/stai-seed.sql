-- =====================================================
-- SEED SQL para escala STAI
-- Inventario de Ansiedad Estado-Rasgo
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'stai',
    'Inventario de Ansiedad Estado-Rasgo',
    'STAI',
    '1.0',
    'ansiedad',
    'ansiedad_estado_rasgo',
    'Cuestionario de 40 ítems que mide dos dimensiones distintas de ansiedad: Estado (ansiedad situacional actual) y Rasgo (propensión general a experimentar ansiedad). Es una de las escalas más utilizadas en investigación de ansiedad.',
    'Spielberger, C.D., Gorsuch, R.L., y Lushene, R.E.',
    1970,
    15,
    'self_administered',
    'Adultos, adolescentes y niños (a partir de 14 años)',
    40,
    'subscales',
    20,
    80,
    'Aplicar las dos partes consecutivamente. Asegurar que el paciente comprenda la diferencia entre ''cómo se siente ahora'' vs ''cómo se siente generalmente''. Considerar ítems inversos en la puntuación.',
    'Este cuestionario consta de dos partes. Parte 1: indique cómo se siente AHORA MISMO (Estado), en este momento. Parte 2: indique cómo se siente EN GENERAL (Rasgo), en la mayoría de las ocasiones. No hay respuestas correctas o incorrectas.',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('stai-item-1', 'stai', 1, 'Me siento calmado', 'STAI1', 'estado', 1, 1),
('stai-item-2', 'stai', 2, 'Me siento seguro', 'STAI2', 'estado', 1, 1),
('stai-item-3', 'stai', 3, 'Estoy tenso', 'STAI3', 'estado', 0, 1),
('stai-item-4', 'stai', 4, 'Estoy contrariado', 'STAI4', 'estado', 0, 1),
('stai-item-5', 'stai', 5, 'Me siento cómodo (estoy a gusto)', 'STAI5', 'estado', 1, 1),
('stai-item-6', 'stai', 6, 'Me siento alterado', 'STAI6', 'estado', 0, 1),
('stai-item-7', 'stai', 7, 'Estoy preocupado ahora por posibles desgracias futuras', 'STAI7', 'estado', 0, 1),
('stai-item-8', 'stai', 8, 'Me siento descansado', 'STAI8', 'estado', 1, 1),
('stai-item-9', 'stai', 9, 'Me siento angustiado', 'STAI9', 'estado', 0, 1),
('stai-item-10', 'stai', 10, 'Me siento confortable', 'STAI10', 'estado', 1, 1),
('stai-item-11', 'stai', 11, 'Tengo confianza en mí mismo', 'STAI11', 'estado', 1, 1),
('stai-item-12', 'stai', 12, 'Me siento nervioso', 'STAI12', 'estado', 0, 1),
('stai-item-13', 'stai', 13, 'Estoy inquieto/intranquilo/perturbado', 'STAI13', 'estado', 0, 1),
('stai-item-14', 'stai', 14, 'Me siento muy ''atado'' (como oprimido)', 'STAI14', 'estado', 0, 1),
('stai-item-15', 'stai', 15, 'Estoy relajado', 'STAI15', 'estado', 1, 1),
('stai-item-16', 'stai', 16, 'Me siento satisfecho', 'STAI16', 'estado', 1, 1),
('stai-item-17', 'stai', 17, 'Estoy preocupado', 'STAI17', 'estado', 0, 1),
('stai-item-18', 'stai', 18, 'Me siento aturdido y sobreexcitado', 'STAI18', 'estado', 0, 1),
('stai-item-19', 'stai', 19, 'Me siento alegre', 'STAI19', 'estado', 1, 1),
('stai-item-20', 'stai', 20, 'En este momento me siento bien', 'STAI20', 'estado', 1, 1),
('stai-item-21', 'stai', 21, 'Me siento bien', 'STAI21', 'rasgo', 1, 1),
('stai-item-22', 'stai', 22, 'Me canso rápidamente', 'STAI22', 'rasgo', 0, 1),
('stai-item-23', 'stai', 23, 'Siento ganas de llorar', 'STAI23', 'rasgo', 0, 1),
('stai-item-24', 'stai', 24, 'Me gustaría ser tan feliz como otros', 'STAI24', 'rasgo', 0, 1),
('stai-item-25', 'stai', 25, 'Pierdo oportunidades por no decidirme pronto', 'STAI25', 'rasgo', 0, 1),
('stai-item-26', 'stai', 26, 'Me siento descansado', 'STAI26', 'rasgo', 1, 1),
('stai-item-27', 'stai', 27, 'Soy una persona tranquila, serena y sosegada', 'STAI27', 'rasgo', 1, 1),
('stai-item-28', 'stai', 28, 'Veo que las dificultades se amontonan y no puedo con ellas', 'STAI28', 'rasgo', 0, 1),
('stai-item-29', 'stai', 29, 'Me preocupo demasiado por cosas sin importancia', 'STAI29', 'rasgo', 0, 1),
('stai-item-30', 'stai', 30, 'Soy feliz', 'STAI30', 'rasgo', 1, 1),
('stai-item-31', 'stai', 31, 'Suelo tomar las cosas demasiado seriamente', 'STAI31', 'rasgo', 0, 1),
('stai-item-32', 'stai', 32, 'Me falta confianza en mí mismo', 'STAI32', 'rasgo', 0, 1),
('stai-item-33', 'stai', 33, 'Me siento seguro', 'STAI33', 'rasgo', 1, 1),
('stai-item-34', 'stai', 34, 'No suelo afrontar las crisis o dificultades', 'STAI34', 'rasgo', 0, 1),
('stai-item-35', 'stai', 35, 'Me siento triste (melancólico)', 'STAI35', 'rasgo', 0, 1),
('stai-item-36', 'stai', 36, 'Estoy satisfecho', 'STAI36', 'rasgo', 1, 1),
('stai-item-37', 'stai', 37, 'Me rondan y molestan pensamientos sin importancia', 'STAI37', 'rasgo', 0, 1),
('stai-item-38', 'stai', 38, 'Me afectan tanto los desengaños que no puedo olvidarlos', 'STAI38', 'rasgo', 0, 1),
('stai-item-39', 'stai', 39, 'Soy una persona estable', 'STAI39', 'rasgo', 1, 1),
('stai-item-40', 'stai', 40, 'Cuando pienso sobre asuntos y preocupaciones actuales me pongo tenso y agitado', 'STAI40', 'rasgo', 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('stai-estado-opt-0', 'stai', '0', 'Nada', 0, 1, 1),
('stai-estado-opt-1', 'stai', '1', 'Algo', 1, 2, 1),
('stai-estado-opt-2', 'stai', '2', 'Bastante', 2, 3, 1),
('stai-estado-opt-3', 'stai', '3', 'Mucho', 3, 4, 1),
('stai-rasgo-opt-0', 'stai', '0', 'Casi nunca', 0, 1, 1),
('stai-rasgo-opt-1', 'stai', '1', 'A veces', 1, 2, 1),
('stai-rasgo-opt-2', 'stai', '2', 'A menudo', 2, 3, 1),
('stai-rasgo-opt-3', 'stai', '3', 'Casi siempre', 3, 4, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('stai-int-bajo', 'stai', 20, 25, 'minimal', 'Ansiedad Baja', '#27AE60', 'Nivel de ansiedad bajo. El paciente reporta sentirse calmado y con poca experiencia de ansiedad.', 'Nivel óptimo de funcionamiento. Mantener estrategias actuales de afrontamiento.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('stai-int-medio-bajo', 'stai', 26, 35, 'mild', 'Ansiedad Medio-Baja', '#F39C12', 'Nivel de ansiedad medio-bajo. Ligera tensión situacional dentro de parámetros normales.', 'Rango normal. Considerar técnicas preventivas de manejo del estrés.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('stai-int-medio', 'stai', 36, 45, 'moderate', 'Ansiedad Media', '#E67E22', 'Nivel de ansiedad moderado. Tensión y preocupación evidentes que requieren atención.', 'Explorar factores desencadenantes. Implementar técnicas de relajación y manejo de ansiedad.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('stai-int-alto', 'stai', 46, 55, 'severe', 'Ansiedad Alta', '#E74C3C', 'Nivel de ansiedad alto. Malestar significativo, nerviosismo y tensión pronunciados.', 'Intervención terapéutica recomendada. Técnicas cognitivo-conductuales y estrategias de afrontamiento.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('stai-int-muy-alto', 'stai', 56, 80, 'extreme', 'Ansiedad Muy Alta', '#8E44AD', 'Nivel de ansiedad muy alto. Propensión muy elevada a experimentar ansiedad como respuesta estable.', 'Intervención inmediata recomendada. Evaluar necesidad de tratamiento farmacológico y psicoterapéutico intensivo.', 1);

-- Insertar subescalas
INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES
('stai-sub-estado', 'stai', 'Ansiedad Estado', 'estado', 20, 80, 'Evalúa cómo se siente la persona en el momento actual, en este preciso instante', 1),
('stai-sub-rasgo', 'stai', 'Ansiedad Rasgo', 'rasgo', 20, 80, 'Evalúa cómo se siente la persona en general, en la mayoría de las ocasiones, una propensidad a la ansiedad', 1);
