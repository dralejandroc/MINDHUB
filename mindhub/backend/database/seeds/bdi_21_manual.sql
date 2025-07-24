-- BDI-21 (Inventario de Depresión de Beck-21)
-- Escala con opciones de respuesta específicas por ítem y 4 subescalas

-- 1. Insertar la escala principal
INSERT INTO scales (
  id, name, abbreviation, description, version, category, subcategory, 
  author, publication_year, total_items, estimated_duration_minutes, 
  administration_mode, target_population, scoring_method, score_range_min, 
  score_range_max, instructions_professional, instructions_patient, 
  created_at, updated_at
) VALUES (
  'bdi-21',
  'Inventario de Depresión de Beck-21',
  'BDI-21',
  'El Inventario de Depresión de Beck-21 es un autoinforme de 21 ítems que evalúa la presencia y gravedad de síntomas depresivos en adultos y adolescentes de 13 años o más. Los ítems evalúan síntomas cognitivos, afectivos, somáticos y vegetativos de la depresión, incluyendo tristeza, pesimismo, sentimientos de culpa, ideación suicida, trastornos del sueño y pérdida de apetito.',
  '1.0',
  'depresion',
  'sintomatologia_depresiva',
  'Beck, A. T., Ward, C. H., Mendelson, M., Mock, J., & Erbaugh, J.',
  1961,
  21,
  12,
  'both',
  'Adultos y adolescentes de 13 años o más para evaluación de síntomas depresivos en población clínica y general',
  'sum',
  0,
  63,
  'Administre el inventario en un ambiente tranquilo y privado. El sistema presentará cada ítem individualmente para que el paciente seleccione la opción que mejor describa su estado durante las últimas dos semanas. Preste especial atención al ítem 9 (ideación suicida) y evalúe inmediatamente cualquier puntuación elevada.',
  'Este cuestionario evalúa cómo se ha sentido en las últimas dos semanas. Se le presentarán 21 preguntas, cada una con varias opciones de respuesta. Seleccione la opción que mejor describa su situación actual. Solo puede elegir una respuesta por pregunta.',
  NOW(),
  NOW()
);

-- 2. Insertar las 4 subescalas
INSERT INTO scale_subscales (
  id, scale_id, subscale_name, subscale_code, min_score, max_score, 
  description, items, referencias_bibliograficas, indice_cronbach, 
  created_at, updated_at
) VALUES 
('bdi-21-sub-cognitiva', 'bdi-21', 'Síntomas Cognitivos', 'cognitiva', 0, 15, 'Evalúa la tríada cognitiva negativa de Beck, incluyendo pesimismo, sentimientos de fracaso, expectativas de castigo, autoacusación e indecisión. Reflejan distorsiones en el procesamiento de información sobre sí mismo, el mundo y el futuro.', '[2, 3, 6, 8, 13]', 'Beck et al., 1988; α = 0.89', 0.89, NOW(), NOW()),
('bdi-21-sub-afectiva', 'bdi-21', 'Síntomas Afectivos', 'afectiva', 0, 24, 'Evalúa alteraciones del estado de ánimo y emocionales como tristeza, insatisfacción, culpa, odio hacia sí mismo, ideación suicida, llanto, irritabilidad y aislamiento social.', '[1, 4, 5, 7, 9, 10, 11, 12]', 'Beck et al., 1988; α = 0.91', 0.91, NOW(), NOW()),
('bdi-21-sub-somatica', 'bdi-21', 'Síntomas Somáticos', 'somatica', 0, 9, 'Evalúa manifestaciones físicas conscientes como preocupaciones por la imagen corporal, fatiga y preocupaciones hipocondríacas por la salud.', '[14, 17, 20]', 'Beck et al., 1988; α = 0.72', 0.72, NOW(), NOW()),
('bdi-21-sub-vegetativa', 'bdi-21', 'Síntomas Vegetativos', 'vegetativa', 0, 15, 'Evalúa funciones neurovegetativas automáticas incluyendo capacidad laboral, trastornos del sueño, pérdida de apetito, pérdida de peso y disminución de la libido.', '[15, 16, 18, 19, 21]', 'Beck et al., 1988; α = 0.85', 0.85, NOW(), NOW());

-- 3. Insertar ítems de la escala
INSERT INTO scale_items (
  id, scale_id, item_number, item_text, question_type, reverse_scored, 
  alert_trigger, alert_condition, help_text, required, metadata,
  subscale, created_at, updated_at
) VALUES 
('bdi-21-item-1', 'bdi-21', 1, 'Estado de ánimo', 'likert', FALSE, TRUE, '≥2', 'Seleccione la opción que mejor describa cómo se ha sentido emocionalmente en las últimas dos semanas', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'afectiva', NOW(), NOW()),
('bdi-21-item-2', 'bdi-21', 2, 'Pesimismo', 'likert', FALSE, TRUE, '≥2', 'Evalúe sus expectativas y perspectivas sobre el futuro', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'cognitiva', NOW(), NOW()),
('bdi-21-item-3', 'bdi-21', 3, 'Sentimiento de fracaso', 'likert', FALSE, TRUE, '≥2', 'Evalúe cómo se percibe a sí mismo en términos de logros y éxitos personales', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'cognitiva', NOW(), NOW()),
('bdi-21-item-4', 'bdi-21', 4, 'Insatisfacción', 'likert', FALSE, TRUE, '≥2', 'Considere su nivel de satisfacción con actividades y experiencias de la vida', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'afectiva', NOW(), NOW()),
('bdi-21-item-5', 'bdi-21', 5, 'Sentimientos de culpa', 'likert', FALSE, TRUE, '≥2', 'Evalúe la presencia de sentimientos de culpabilidad o autorreproche', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'afectiva', NOW(), NOW()),
('bdi-21-item-6', 'bdi-21', 6, 'Sentimiento de castigo', 'likert', FALSE, TRUE, '≥2', 'Considere si siente que está siendo castigado o merece castigo', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'cognitiva', NOW(), NOW()),
('bdi-21-item-7', 'bdi-21', 7, 'Odio a sí mismo', 'likert', FALSE, TRUE, '≥2', 'Evalúe sus sentimientos hacia usted mismo', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'afectiva', NOW(), NOW()),
('bdi-21-item-8', 'bdi-21', 8, 'Autoacusación', 'likert', FALSE, TRUE, '≥2', 'Considere si tiende a culparse a sí mismo por los problemas o eventos negativos', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'cognitiva', NOW(), NOW()),
('bdi-21-item-9', 'bdi-21', 9, 'Impulsos suicidas', 'likert', FALSE, TRUE, '≥1', 'IMPORTANTE: Cualquier puntuación diferente de 0 requiere evaluación inmediata del riesgo suicida', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false, "critical_item": true}', 'afectiva', NOW(), NOW()),
('bdi-21-item-10', 'bdi-21', 10, 'Períodos de llanto', 'likert', FALSE, TRUE, '≥2', 'Evalúe los cambios en su patrón de llanto comparado con lo habitual', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'afectiva', NOW(), NOW()),
('bdi-21-item-11', 'bdi-21', 11, 'Irritabilidad', 'likert', FALSE, TRUE, '≥2', 'Compare su nivel actual de irritabilidad con su estado habitual', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'afectiva', NOW(), NOW()),
('bdi-21-item-12', 'bdi-21', 12, 'Aislamiento social', 'likert', FALSE, TRUE, '≥2', 'Evalúe los cambios en su interés por otras personas y relaciones sociales', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'afectiva', NOW(), NOW()),
('bdi-21-item-13', 'bdi-21', 13, 'Indecisión', 'likert', FALSE, TRUE, '≥2', 'Considere los cambios en su capacidad para tomar decisiones', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'cognitiva', NOW(), NOW()),
('bdi-21-item-14', 'bdi-21', 14, 'Imagen corporal', 'likert', FALSE, TRUE, '≥2', 'Evalúe cómo percibe su aspecto físico actualmente', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'somatica', NOW(), NOW()),
('bdi-21-item-15', 'bdi-21', 15, 'Capacidad laboral', 'likert', FALSE, TRUE, '≥2', 'Compare su capacidad actual de trabajo con su funcionamiento habitual', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'vegetativa', NOW(), NOW()),
('bdi-21-item-16', 'bdi-21', 16, 'Trastornos del sueño', 'likert', FALSE, TRUE, '≥2', 'Evalúe los cambios en su patrón de sueño comparado con lo habitual', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'vegetativa', NOW(), NOW()),
('bdi-21-item-17', 'bdi-21', 17, 'Cansancio', 'likert', FALSE, TRUE, '≥2', 'Compare su nivel actual de energía y fatiga con lo habitual', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'somatica', NOW(), NOW()),
('bdi-21-item-18', 'bdi-21', 18, 'Pérdida de apetito', 'likert', FALSE, TRUE, '≥2', 'Evalúe los cambios en su apetito comparado con lo habitual', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'vegetativa', NOW(), NOW()),
('bdi-21-item-19', 'bdi-21', 19, 'Pérdida de peso', 'likert', FALSE, TRUE, '≥2', 'Considere si ha experimentado pérdida de peso significativa recientemente', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'vegetativa', NOW(), NOW()),
('bdi-21-item-20', 'bdi-21', 20, 'Hipocondria', 'likert', FALSE, TRUE, '≥2', 'Evalúe su nivel de preocupación por su salud física', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'somatica', NOW(), NOW()),
('bdi-21-item-21', 'bdi-21', 21, 'Libido', 'likert', FALSE, TRUE, '≥2', 'Evalúe los cambios en su interés sexual comparado con lo habitual', TRUE, '{"layout": "vertical", "show_numbers": false, "show_labels": true, "randomize_options": false}', 'vegetativa', NOW(), NOW());

-- 4. Insertar opciones específicas por ítem usando la nueva tabla
-- Ítem 1: Estado de ánimo (5 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-1-opt-0', 'bdi-21-item-1', '0', 'NO me encuentro triste', 0, 1, NOW(), NOW()),
('bdi-21-item-1-opt-1', 'bdi-21-item-1', '1', 'Me siento algo triste y deprimido', 1, 2, NOW(), NOW()),
('bdi-21-item-1-opt-2', 'bdi-21-item-1', '2', 'Esta tristeza me produce verdaderos sufrimientos', 2, 3, NOW(), NOW()),
('bdi-21-item-1-opt-3', 'bdi-21-item-1', '3', 'Tengo SIEMPRE como una pena encima que no me la puedo quitar', 2, 4, NOW(), NOW()),
('bdi-21-item-1-opt-4', 'bdi-21-item-1', '4', 'Ya no puedo soportar esta pena', 3, 5, NOW(), NOW());

-- Ítem 2: Pesimismo (5 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-2-opt-0', 'bdi-21-item-2', '0', 'NO soy especialmente pesimista, ni creo que las cosas me vayan a ir mal', 0, 1, NOW(), NOW()),
('bdi-21-item-2-opt-1', 'bdi-21-item-2', '1', 'Me siento desanimado cuando pienso en el futuro', 1, 2, NOW(), NOW()),
('bdi-21-item-2-opt-2', 'bdi-21-item-2', '2', 'Creo que nunca me recuperaré de mis penas', 2, 3, NOW(), NOW()),
('bdi-21-item-2-opt-3', 'bdi-21-item-2', '3', 'NO espero nada bueno de la vida', 2, 4, NOW(), NOW()),
('bdi-21-item-2-opt-4', 'bdi-21-item-2', '4', 'No espero nada. Esto NO tiene remedio', 3, 5, NOW(), NOW());

-- Ítem 3: Sentimiento de fracaso (5 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-3-opt-0', 'bdi-21-item-3', '0', 'NO me considero fracasado', 0, 1, NOW(), NOW()),
('bdi-21-item-3-opt-1', 'bdi-21-item-3', '1', 'He tenido MÁS fracasos que la mayoría de la gente', 1, 2, NOW(), NOW()),
('bdi-21-item-3-opt-2', 'bdi-21-item-3', '2', 'Siento que he hecho pocas cosas que valgan la pena', 2, 3, NOW(), NOW()),
('bdi-21-item-3-opt-3', 'bdi-21-item-3', '3', 'Veo mi vida LLENA de fracasos', 2, 4, NOW(), NOW()),
('bdi-21-item-3-opt-4', 'bdi-21-item-3', '4', 'He fracasado TOTALMENTE como persona (padre, madre, marido, hijo, profesional, etc.)', 3, 5, NOW(), NOW());

-- Ítem 4: Insatisfacción (5 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-4-opt-0', 'bdi-21-item-4', '0', 'NO estoy especialmente insatisfecho', 0, 1, NOW(), NOW()),
('bdi-21-item-4-opt-1', 'bdi-21-item-4', '1', 'Me encuentro insatisfecho conmigo mismo', 1, 2, NOW(), NOW()),
('bdi-21-item-4-opt-2', 'bdi-21-item-4', '2', 'Ya NO me divierte lo que antes me divertía', 1, 3, NOW(), NOW()),
('bdi-21-item-4-opt-3', 'bdi-21-item-4', '3', 'Ya nada me llena', 2, 4, NOW(), NOW()),
('bdi-21-item-4-opt-4', 'bdi-21-item-4', '4', 'Estoy HARTO de todo', 3, 5, NOW(), NOW());

-- Ítem 5: Sentimientos de culpa (5 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-5-opt-0', 'bdi-21-item-5', '0', 'NO me siento culpable', 0, 1, NOW(), NOW()),
('bdi-21-item-5-opt-1', 'bdi-21-item-5', '1', 'A VECES me siento despreciable y mala persona', 1, 2, NOW(), NOW()),
('bdi-21-item-5-opt-2', 'bdi-21-item-5', '2', 'Me siento bastante culpable', 2, 3, NOW(), NOW()),
('bdi-21-item-5-opt-3', 'bdi-21-item-5', '3', 'Me siento prácticamente todo el tiempo MALA PERSONA y despreciable', 2, 4, NOW(), NOW()),
('bdi-21-item-5-opt-4', 'bdi-21-item-5', '4', 'Me siento muy infame (perverso, canalla) y despreciable', 3, 5, NOW(), NOW());

-- Ítem 6: Sentimiento de castigo (5 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-6-opt-0', 'bdi-21-item-6', '0', 'NO pienso que esté siendo castigado', 0, 1, NOW(), NOW()),
('bdi-21-item-6-opt-1', 'bdi-21-item-6', '1', 'Presiento que algo malo me puede suceder', 1, 2, NOW(), NOW()),
('bdi-21-item-6-opt-2', 'bdi-21-item-6', '2', 'Siento que me están castigando o me castigarán', 2, 3, NOW(), NOW()),
('bdi-21-item-6-opt-3', 'bdi-21-item-6', '3', 'Siento que MEREZCO ser castigado', 3, 4, NOW(), NOW()),
('bdi-21-item-6-opt-4', 'bdi-21-item-6', '4', 'QUIERO que me castiguen', 3, 5, NOW(), NOW());

-- Ítem 7: Odio a sí mismo (5 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-7-opt-0', 'bdi-21-item-7', '0', 'Estoy satisfecho de mí mismo', 0, 1, NOW(), NOW()),
('bdi-21-item-7-opt-1', 'bdi-21-item-7', '1', 'Estoy descontento conmigo mismo', 1, 2, NOW(), NOW()),
('bdi-21-item-7-opt-2', 'bdi-21-item-7', '2', 'NO me aprecio', 1, 3, NOW(), NOW()),
('bdi-21-item-7-opt-3', 'bdi-21-item-7', '3', 'Me odio (me desprecio)', 2, 4, NOW(), NOW()),
('bdi-21-item-7-opt-4', 'bdi-21-item-7', '4', 'Estoy asqueado de mí', 2, 5, NOW(), NOW());

-- Ítem 8: Autoacusación (5 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-8-opt-0', 'bdi-21-item-8', '0', 'NO creo ser peor que otros', 0, 1, NOW(), NOW()),
('bdi-21-item-8-opt-1', 'bdi-21-item-8', '1', 'Me critico mucho a causa de mis debilidades y errores', 1, 2, NOW(), NOW()),
('bdi-21-item-8-opt-2', 'bdi-21-item-8', '2', 'Me acuso a mí mismo de todo lo que va mal', 2, 3, NOW(), NOW()),
('bdi-21-item-8-opt-3', 'bdi-21-item-8', '3', 'Siento que tengo MUCHOS y muy graves defectos', 2, 4, NOW(), NOW()),
('bdi-21-item-8-opt-4', 'bdi-21-item-8', '4', 'Me siento culpable de TODO lo malo que ocurre', 3, 5, NOW(), NOW());

-- Ítem 9: Impulsos suicidas (6 opciones) - CRÍTICO
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, metadata, created_at, updated_at) VALUES
('bdi-21-item-9-opt-0', 'bdi-21-item-9', '0', 'NO tengo pensamientos de hacerme daño', 0, 1, '{"risk_level": "none"}', NOW(), NOW()),
('bdi-21-item-9-opt-1', 'bdi-21-item-9', '1', 'Tengo pensamientos de hacerme daño, pero NO llegaría a hacerlo', 1, 2, '{"risk_level": "low"}', NOW(), NOW()),
('bdi-21-item-9-opt-2', 'bdi-21-item-9', '2', 'Siento que estaría mejor muerto', 2, 3, '{"risk_level": "moderate"}', NOW(), NOW()),
('bdi-21-item-9-opt-3', 'bdi-21-item-9', '3', 'Siento que mi familia estaría mejor si yo muriera', 2, 4, '{"risk_level": "moderate"}', NOW(), NOW()),
('bdi-21-item-9-opt-4', 'bdi-21-item-9', '4', 'Me mataría si pudiera', 2, 5, '{"risk_level": "high"}', NOW(), NOW()),
('bdi-21-item-9-opt-5', 'bdi-21-item-9', '5', 'Tengo planes decididos de SUICIDARME', 3, 6, '{"risk_level": "critical"}', NOW(), NOW());

-- Ítem 10: Períodos de llanto (4 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-10-opt-0', 'bdi-21-item-10', '0', 'NO lloro más de lo habitual', 0, 1, NOW(), NOW()),
('bdi-21-item-10-opt-1', 'bdi-21-item-10', '1', 'Ahora lloro MÁS de lo normal', 1, 2, NOW(), NOW()),
('bdi-21-item-10-opt-2', 'bdi-21-item-10', '2', 'Ahora lloro CONTINUAMENTE. No puedo evitarlo', 2, 3, NOW(), NOW()),
('bdi-21-item-10-opt-3', 'bdi-21-item-10', '3', 'Antes podía llorar; ahora no lloro aunque me sienta MUY mal', 3, 4, NOW(), NOW());

-- Ítem 11: Irritabilidad (4 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-11-opt-0', 'bdi-21-item-11', '0', 'NO estoy más irritable que normalmente', 0, 1, NOW(), NOW()),
('bdi-21-item-11-opt-1', 'bdi-21-item-11', '1', 'Me irrito con más facilidad que antes', 1, 2, NOW(), NOW()),
('bdi-21-item-11-opt-2', 'bdi-21-item-11', '2', 'Ya no me irrita lo que antes me irritaba', 1, 3, NOW(), NOW()),
('bdi-21-item-11-opt-3', 'bdi-21-item-11', '3', 'Me siento irritado todo el tiempo', 3, 4, NOW(), NOW());

-- Ítem 12: Aislamiento social (4 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-12-opt-0', 'bdi-21-item-12', '0', 'NO he perdido mi interés por los demás', 0, 1, NOW(), NOW()),
('bdi-21-item-12-opt-1', 'bdi-21-item-12', '1', 'Me intereso por la gente MENOS que antes', 1, 2, NOW(), NOW()),
('bdi-21-item-12-opt-2', 'bdi-21-item-12', '2', 'He perdido casi todo mi interés por los demás y apenas tengo sentimientos hacia ellos', 2, 3, NOW(), NOW()),
('bdi-21-item-12-opt-3', 'bdi-21-item-12', '3', 'He perdido TODO mi interés por los demás y no me importan en absoluto', 3, 4, NOW(), NOW());

-- Ítem 13: Indecisión (4 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-13-opt-0', 'bdi-21-item-13', '0', 'Tomo mis decisiones igual como siempre', 0, 1, NOW(), NOW()),
('bdi-21-item-13-opt-1', 'bdi-21-item-13', '1', 'Ahora estoy inseguro de mí mismo y procuro evitar tomar decisiones', 1, 2, NOW(), NOW()),
('bdi-21-item-13-opt-2', 'bdi-21-item-13', '2', 'NO puedo tomar decisiones SIN ayuda', 2, 3, NOW(), NOW()),
('bdi-21-item-13-opt-3', 'bdi-21-item-13', '3', 'Ya NO puedo tomar decisiones en absoluto', 3, 4, NOW(), NOW());

-- Ítem 14: Imagen corporal (4 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-14-opt-0', 'bdi-21-item-14', '0', 'NO me siento con peor aspecto que antes', 0, 1, NOW(), NOW()),
('bdi-21-item-14-opt-1', 'bdi-21-item-14', '1', 'Estoy preocupado porque me veo viejo y desmejorado', 1, 2, NOW(), NOW()),
('bdi-21-item-14-opt-2', 'bdi-21-item-14', '2', 'Siento que hay cambios en mi aspecto físico que me hacen parecer DESAGRADABLE (o menos atractivo)', 2, 3, NOW(), NOW()),
('bdi-21-item-14-opt-3', 'bdi-21-item-14', '3', 'Me siento feo y repulsivo', 3, 4, NOW(), NOW());

-- Ítem 15: Capacidad laboral (5 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-15-opt-0', 'bdi-21-item-15', '0', 'Puedo trabajar tan bien como antes', 0, 1, NOW(), NOW()),
('bdi-21-item-15-opt-1', 'bdi-21-item-15', '1', 'Tengo que esforzarme mucho MAS para hacer cualquier cosa', 1, 2, NOW(), NOW()),
('bdi-21-item-15-opt-2', 'bdi-21-item-15', '2', 'NO trabajo tan bien como lo hacía antes', 1, 3, NOW(), NOW()),
('bdi-21-item-15-opt-3', 'bdi-21-item-15', '3', 'Necesito un esfuerzo extra para empezar a hacer algo', 2, 4, NOW(), NOW()),
('bdi-21-item-15-opt-4', 'bdi-21-item-15', '4', 'NO puedo trabajar en nada', 3, 5, NOW(), NOW());

-- Ítem 16: Trastornos del sueño (8 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-16-opt-0', 'bdi-21-item-16', '0', 'Duermo tan bien como antes', 0, 1, NOW(), NOW()),
('bdi-21-item-16-opt-1', 'bdi-21-item-16', '1', 'Me despierto MÁS cansado por la mañana', 1, 2, NOW(), NOW()),
('bdi-21-item-16-opt-2', 'bdi-21-item-16', '2', 'Me despierto unas 2 horas antes de lo normal y me resulta difícil volver a dormir', 2, 3, NOW(), NOW()),
('bdi-21-item-16-opt-3', 'bdi-21-item-16', '3', 'Tardo 1 o 2 horas en dormirme por la noche', 2, 4, NOW(), NOW()),
('bdi-21-item-16-opt-4', 'bdi-21-item-16', '4', 'Me despierto sin motivo en mitad de la noche y tardo en volver a dormirme', 2, 5, NOW(), NOW()),
('bdi-21-item-16-opt-5', 'bdi-21-item-16', '5', 'Me despierto temprano todos los días y NO duermo más de 5 horas', 3, 6, NOW(), NOW()),
('bdi-21-item-16-opt-6', 'bdi-21-item-16', '6', 'Tardo más de 2 horas en dormirme y NO duermo más de 5 horas', 3, 7, NOW(), NOW()),
('bdi-21-item-16-opt-7', 'bdi-21-item-16', '7', 'NO logro dormir MÁS de 3 o 4 horas seguidas', 3, 8, NOW(), NOW());

-- Ítem 17: Cansancio (4 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-17-opt-0', 'bdi-21-item-17', '0', 'NO me canso más de lo normal', 0, 1, NOW(), NOW()),
('bdi-21-item-17-opt-1', 'bdi-21-item-17', '1', 'Me canso MÁS fácilmente que antes', 1, 2, NOW(), NOW()),
('bdi-21-item-17-opt-2', 'bdi-21-item-17', '2', 'Cualquier cosa que hago me fatiga', 2, 3, NOW(), NOW()),
('bdi-21-item-17-opt-3', 'bdi-21-item-17', '3', 'Me canso tanto que NO PUEDO hacer nada', 3, 4, NOW(), NOW());

-- Ítem 18: Pérdida de apetito (4 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-18-opt-0', 'bdi-21-item-18', '0', 'Tengo el mismo apetito de siempre', 0, 1, NOW(), NOW()),
('bdi-21-item-18-opt-1', 'bdi-21-item-18', '1', 'Mi apetito NO es tan bueno como antes', 1, 2, NOW(), NOW()),
('bdi-21-item-18-opt-2', 'bdi-21-item-18', '2', 'Mi apetito es ahora MUCHO menor', 2, 3, NOW(), NOW()),
('bdi-21-item-18-opt-3', 'bdi-21-item-18', '3', 'He perdido TOTALMENTE el apetito', 3, 4, NOW(), NOW());

-- Ítem 19: Pérdida de peso (4 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-19-opt-0', 'bdi-21-item-19', '0', 'NO he perdido peso últimamente', 0, 1, NOW(), NOW()),
('bdi-21-item-19-opt-1', 'bdi-21-item-19', '1', 'He perdido MÁS de 2,5 kg', 1, 2, NOW(), NOW()),
('bdi-21-item-19-opt-2', 'bdi-21-item-19', '2', 'He perdido MÁS de 5 kg', 2, 3, NOW(), NOW()),
('bdi-21-item-19-opt-3', 'bdi-21-item-19', '3', 'He perdido MÁS de 7,5 kg', 3, 4, NOW(), NOW());

-- Ítem 20: Hipocondria (4 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-20-opt-0', 'bdi-21-item-20', '0', 'NO me preocupa mi salud más de lo normal', 0, 1, NOW(), NOW()),
('bdi-21-item-20-opt-1', 'bdi-21-item-20', '1', 'Estoy preocupado por dolores y trastornos', 1, 2, NOW(), NOW()),
('bdi-21-item-20-opt-2', 'bdi-21-item-20', '2', 'Estoy TAN preocupado por mi salud que me es difícil pensar en otras cosas', 2, 3, NOW(), NOW()),
('bdi-21-item-20-opt-3', 'bdi-21-item-20', '3', 'Estoy CONSTANTEMENTE pendiente de lo que me sucede y de cómo me encuentro', 3, 4, NOW(), NOW());

-- Ítem 21: Libido (4 opciones)
INSERT INTO scale_item_specific_options (id, item_id, option_value, option_label, score_value, display_order, created_at, updated_at) VALUES
('bdi-21-item-21-opt-0', 'bdi-21-item-21', '0', 'NO he notado ningún cambio en mi atracción por el sexo', 0, 1, NOW(), NOW()),
('bdi-21-item-21-opt-1', 'bdi-21-item-21', '1', 'Estoy MENOS interesado por el sexo que antes', 1, 2, NOW(), NOW()),
('bdi-21-item-21-opt-2', 'bdi-21-item-21', '2', 'Apenas me siento atraído sexualmente', 2, 3, NOW(), NOW()),
('bdi-21-item-21-opt-3', 'bdi-21-item-21', '3', 'He perdido TODO mi interés por el sexo', 3, 4, NOW(), NOW());

-- 5. Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (
  id, scale_id, min_score, max_score, severity_level, interpretation_label, 
  color_code, description, recommendations, created_at, updated_at
) VALUES 
('bdi-21-int-minimal', 'bdi-21', 0, 9, 'minimal', 'Sin depresión', '#27AE60', 'La puntuación indica ausencia de sintomatología depresiva clínicamente significativa. Los síntomas presentes son mínimos y no interfieren con el funcionamiento diario.', 'Mantener estrategias de bienestar actual. Continuar con actividades preventivas de salud mental. Monitoreo rutinario en seguimientos regulares.', NOW(), NOW()),
('bdi-21-int-leve', 'bdi-21', 10, 18, 'mild', 'Depresión leve', '#F39C12', 'Se evidencia presencia de sintomatología depresiva de intensidad leve que puede comenzar a interferir con el funcionamiento cotidiano.', 'Evaluación de factores precipitantes y mantenedores. Considerar intervenciones psicoeducativas sobre depresión. Implementar estrategias de manejo del estrés y activación conductual.', NOW(), NOW()),
('bdi-21-int-moderada', 'bdi-21', 19, 29, 'moderate', 'Depresión moderada', '#E67E22', 'La puntuación indica sintomatología depresiva de intensidad moderada que requiere intervención clínica estructurada y seguimiento regular.', 'Intervención psicoterapéutica estructurada (terapia cognitivo-conductual). Evaluación de necesidad de tratamiento farmacológico. Evaluación específica de riesgo suicida.', NOW(), NOW()),
('bdi-21-int-grave', 'bdi-21', 30, 63, 'severe', 'Depresión grave', '#E74C3C', 'La puntuación indica sintomatología depresiva severa que requiere intervención clínica inmediata y seguimiento intensivo debido al alto riesgo asociado.', 'Intervención clínica inmediata y prioritaria. Evaluación urgente de riesgo suicida y medidas de seguridad. Tratamiento farmacológico combinado con psicoterapia.', NOW(), NOW());

-- 6. Insertar documentación científica
INSERT INTO scale_documentation (
  id, scale_id, bibliography, sources_consulted, implementation_notes, 
  psychometric_properties, clinical_considerations, special_items_notes, 
  version_notes, target_population_details, clinical_interpretation, 
  created_at, updated_at
) VALUES (
  'bdi-21-doc-001',
  'bdi-21',
  'Beck, A. T., Ward, C. H., Mendelson, M., Mock, J., & Erbaugh, J. (1961). An inventory for measuring depression. Archives of General Psychiatry, 4(6), 561-571.

Beck, A. T., Steer, R. A., & Brown, G. K. (1996). Manual for the Beck Depression Inventory-II. San Antonio, TX: Psychological Corporation.

Consejo General de Colegios Oficiales de Psicólogos (2013). Evaluación del Inventario BDI-II. Madrid: COP.

Sanz, J., García-Vera, M. P., Espinosa, R., Fortún, M., & Vázquez, C. (2005). Rendimiento diagnóstico y estructura factorial del Inventario de Depresión de Beck-II (BDI-II). Psicothema, 25(1), 66-73.',
  
  '[
    {
      "authors": "Beck, A. T., Ward, C. H., Mendelson, M., Mock, J., Erbaugh, J.",
      "year": "1961",
      "title": "An inventory for measuring depression",
      "fullReference": "Beck, A. T., Ward, C. H., Mendelson, M., Mock, J., & Erbaugh, J. (1961). An inventory for measuring depression. Archives of General Psychiatry, 4(6), 561-571."
    },
    {
      "authors": "Beck, A. T., Steer, R. A., Brown, G. K.",
      "year": "1996", 
      "title": "Manual for the Beck Depression Inventory-II",
      "fullReference": "Beck, A. T., Steer, R. A., & Brown, G. K. (1996). Manual for the Beck Depression Inventory-II. San Antonio, TX: Psychological Corporation."
    }
  ]',
  
  'Alerta Crítica: El ítem 9 (Impulsos suicidas) requiere evaluación inmediata de riesgo suicida para cualquier puntuación ≥1.

Subescalas Validadas: La estructura de cuatro subescalas (Cognitiva, Afectiva, Somática, Vegetativa) está respaldada por análisis factoriales confirmatorios.

Cada ítem tiene opciones de respuesta específicas y únicas - no compartidas entre ítems. El sistema debe presentar las opciones correspondientes a cada pregunta individual.',
  
  '{
    "cronbach_alpha": 0.92,
    "test_retest_reliability": 0.93,
    "concurrent_validity": 0.76,
    "sensitivity": 0.89,
    "specificity": 0.82,
    "cognitiva_subscale_alpha": 0.89,
    "afectiva_subscale_alpha": 0.91,
    "somatica_subscale_alpha": 0.72,
    "vegetativa_subscale_alpha": 0.85
  }',
  
  'Instrumento de evaluación de sintomatología depresiva, NO herramienta diagnóstica definitiva.

Los puntos de corte están basados en múltiples estudios de validación y deben considerarse como orientativos.

Especial atención al ítem 9 (suicidio) - cualquier puntuación >0 requiere evaluación inmediata de riesgo.

La evaluación del ítem 16 (Trastornos del sueño) proporciona información específica sobre patrones alterados característicos de la depresión.',
  
  '{
    "item_9_critical": {
      "name": "Impulsos suicidas",
      "alert_threshold": "≥1",
      "immediate_evaluation": true,
      "risk_levels": {
        "0": "none",
        "1": "low", 
        "2-4": "moderate",
        "5": "critical"
      }
    },
    "variable_options_per_item": true,
    "total_unique_options": 104,
    "subscale_interpretation": "independiente_por_subescala"
  }',
  
  'Versión 1.0 del BDI-21 - Basada en el BDI-II con adaptación española. Excelente consistencia interna (α = 0.92) y buena validez convergente con otras medidas de depresión.',
  
  'Adultos y adolescentes de 13 años o más para evaluación de síntomas depresivos en población clínica y general. Especialmente útil en contextos de atención primaria y salud mental.',
  
  'Interpretación por niveles de severidad:
- 0-9: Sin depresión (monitoreo de rutina)
- 10-18: Depresión leve (intervenciones psicoeducativas)
- 19-29: Depresión moderada (terapia estructurada + evaluación farmacológica)
- 30-63: Depresión grave (intervención inmediata + evaluación de riesgo)

Interpretación por subescalas:
- Cognitiva (ítems 2,3,6,8,13): Distorsiones del pensamiento
- Afectiva (ítems 1,4,5,7,9,10,11,12): Alteraciones emocionales
- Somática (ítems 14,17,20): Manifestaciones físicas conscientes  
- Vegetativa (ítems 15,16,18,19,21): Funciones neurovegetativas',
  
  NOW(),
  NOW()
);