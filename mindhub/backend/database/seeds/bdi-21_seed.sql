-- Inventario de Depresión de Beck-21 (BDI-21)
-- Generado automáticamente desde bdi-21.json
-- Fecha: 2025-07-29T19:32:53.956Z

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Escala principal
INSERT INTO scales (
  id, name, abbreviation, description, version, category, subcategory,
  author, publication_year, total_items, estimated_duration_minutes,
  administration_mode, target_population, scoring_method,
  score_range_min, score_range_max, instructions_professional, instructions_patient,
  created_at, updated_at
) VALUES (
  'bdi-21',
  'Inventario de Depresión de Beck-21',
  'BDI-21',
  'El Inventario de Depresión de Beck-21 es un autoinforme de 21 ítems que evalúa la presencia y gravedad de síntomas depresivos en adultos y adolescentes de 13 años o más. Los ítems evalúan síntomas cognitivos, afectivos, somáticos y vegetativos de la depresión, incluyendo tristeza, pesimismo, sentimientos de culpa, ideación suicida, trastornos del sueño y pérdida de apetito. Es ampliamente utilizado en contextos clínicos y de investigación para la detección y seguimiento de la sintomatología depresiva.',
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
  'Administre el inventario en un ambiente tranquilo y privado. El sistema presentará cada ítem individualmente para que el paciente seleccione la opción que mejor describa su estado durante las últimas dos semanas. El sistema registrará automáticamente una sola respuesta por ítem y calculará la puntuación total. Preste especial atención al ítem 9 (ideación suicida) y evalúe inmediatamente cualquier puntuación elevada. La interpretación debe considerar el contexto clínico completo y nunca basarse únicamente en la puntuación total.',
  'Este cuestionario evalúa cómo se ha sentido en las últimas dos semanas. Se le presentarán 21 preguntas, cada una con varias opciones de respuesta. Seleccione la opción que mejor describa su situación actual. Solo puede elegir una respuesta por pregunta. No hay respuestas correctas o incorrectas. Es importante que sea honesto en sus respuestas.',
  NOW(),
  NOW()
);

-- 4. Subescalas
INSERT INTO scale_subscales (
  id, scale_id, name, description, items, min_score, max_score,
  references, cronbach_alpha, created_at, updated_at
) VALUES (
  'bdi-21-sub-cognitiva',
  'bdi-21',
  'Síntomas Cognitivos',
  'Evalúa la tríada cognitiva negativa de Beck, incluyendo pesimismo, sentimientos de fracaso, expectativas de castigo, autoacusación e indecisión. Reflejan distorsiones en el procesamiento de información sobre sí mismo, el mundo y el futuro.',
  '[2,3,6,8,13]',
  0,
  15,
  'Beck et al., 1988; α = 0.89',
  0.89,
  NOW(),
  NOW()
);

INSERT INTO scale_subscales (
  id, scale_id, name, description, items, min_score, max_score,
  references, cronbach_alpha, created_at, updated_at
) VALUES (
  'bdi-21-sub-afectiva',
  'bdi-21',
  'Síntomas Afectivos',
  'Evalúa alteraciones del estado de ánimo y emocionales como tristeza, insatisfacción, culpa, odio hacia sí mismo, ideación suicida, llanto, irritabilidad y aislamiento social.',
  '[1,4,5,7,9,10,11,12]',
  0,
  24,
  'Beck et al., 1988; α = 0.91',
  0.91,
  NOW(),
  NOW()
);

INSERT INTO scale_subscales (
  id, scale_id, name, description, items, min_score, max_score,
  references, cronbach_alpha, created_at, updated_at
) VALUES (
  'bdi-21-sub-somatica',
  'bdi-21',
  'Síntomas Somáticos',
  'Evalúa manifestaciones físicas conscientes como preocupaciones por la imagen corporal, fatiga y preocupaciones hipocondríacas por la salud.',
  '[14,17,20]',
  0,
  9,
  'Beck et al., 1988; α = 0.72',
  0.72,
  NOW(),
  NOW()
);

INSERT INTO scale_subscales (
  id, scale_id, name, description, items, min_score, max_score,
  references, cronbach_alpha, created_at, updated_at
) VALUES (
  'bdi-21-sub-vegetativa',
  'bdi-21',
  'Síntomas Vegetativos',
  'Evalúa funciones neurovegetativas automáticas incluyendo capacidad laboral, trastornos del sueño, pérdida de apetito, pérdida de peso y disminución de la libido.',
  '[15,16,18,19,21]',
  0,
  15,
  'Beck et al., 1988; α = 0.85',
  0.85,
  NOW(),
  NOW()
);

SET FOREIGN_KEY_CHECKS = 1;
