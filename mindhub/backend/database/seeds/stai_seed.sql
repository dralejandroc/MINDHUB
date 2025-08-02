-- Inventario de Ansiedad Estado-Rasgo (STAI)
-- Generado automáticamente desde stai.json
-- Fecha: 2025-07-29T19:32:53.958Z

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Escala principal
INSERT INTO scales (
  id, name, abbreviation, description, version, category, subcategory,
  author, publication_year, total_items, estimated_duration_minutes,
  administration_mode, target_population, scoring_method,
  score_range_min, score_range_max, instructions_professional, instructions_patient,
  created_at, updated_at
) VALUES (
  'stai',
  'Inventario de Ansiedad Estado-Rasgo',
  'STAI',
  'El STAI es un instrumento de autoevaluación que mide dos conceptos independientes de la ansiedad: la ansiedad como estado (condición emocional transitoria caracterizada por sentimientos subjetivos de tensión y aprensión, así como hiperactividad del sistema nervioso autónomo) y la ansiedad como rasgo (propensión ansiosa relativamente estable que predispone al individuo a percibir situaciones como amenazantes). Es ampliamente utilizado en investigación y práctica clínica para evaluar niveles de ansiedad en adolescentes y adultos.',
  '1.0',
  'ansiedad',
  'ansiedad_estado_rasgo',
  'Spielberger, C. D., Gorsuch, R. L., Lushene, R. E.',
  1970,
  40,
  15,
  'self_administered',
  'Adolescentes y adultos con un nivel cultural mínimo para comprender las instrucciones y enunciados del cuestionario',
  'subscales',
  0,
  60,
  'El STAI debe administrarse en un ambiente tranquilo y privado. Es importante explicar al paciente que no existen respuestas correctas o incorrectas y que debe responder con sinceridad. La diferenciación entre ansiedad estado y rasgo es fundamental para la interpretación clínica. Evite utilizar el término \'ansiedad\' durante la administración y refiérase al instrumento como \'cuestionario de autoevaluación\'. Asegúrese de que el paciente comprenda la diferencia temporal entre las dos escalas: estado (ahora mismo) versus rasgo (en general). Supervise que el paciente complete todos los ítems y esté disponible para aclarar dudas sin influir en las respuestas.',
  'Este cuestionario consta de dos partes que evalúan cómo se siente en diferentes situaciones. En la primera parte, indique cómo se siente AHORA MISMO, EN ESTE MOMENTO. En la segunda parte, describa cómo se siente EN GENERAL, EN LA MAYORÍA DE LAS OCASIONES. No hay respuestas correctas o incorrectas. Responda con sinceridad y no dedique demasiado tiempo a cada pregunta. Seleccione la opción que mejor describa su situación en cada caso.',
  NOW(),
  NOW()
);

-- 4. Subescalas
INSERT INTO scale_subscales (
  id, scale_id, name, description, items, min_score, max_score,
  references, cronbach_alpha, created_at, updated_at
) VALUES (
  'stai-sub-estado',
  'stai',
  'Ansiedad Estado',
  'Evalúa la ansiedad como estado emocional transitorio que puede variar en intensidad y fluctuar en el tiempo',
  '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]',
  0,
  60,
  'Spielberger et al., 1970; α = 0.90-0.93',
  0.92,
  NOW(),
  NOW()
);

INSERT INTO scale_subscales (
  id, scale_id, name, description, items, min_score, max_score,
  references, cronbach_alpha, created_at, updated_at
) VALUES (
  'stai-sub-rasgo',
  'stai',
  'Ansiedad Rasgo',
  'Evalúa la ansiedad como rasgo de personalidad relativamente estable y la predisposición a experimentar ansiedad',
  '[21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40]',
  0,
  60,
  'Spielberger et al., 1970; α = 0.84-0.87',
  0.86,
  NOW(),
  NOW()
);

SET FOREIGN_KEY_CHECKS = 1;
