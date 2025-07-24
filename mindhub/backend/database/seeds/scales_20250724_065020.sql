-- Escalas generadas automáticamente desde archivos markdown
-- Generado: 2025-07-24T06:50:20.618Z
-- Escalas incluidas: stai, stai

SET FOREIGN_KEY_CHECKS = 0;

-- Escala: Inventario de Ansiedad Estado-Rasgo
INSERT INTO scales (id, name, abbreviation, description, version, category, total_items, estimated_duration_minutes, administration_mode, target_population, scoring_method, created_at, updated_at) VALUES (
  'stai',
  'Inventario de Ansiedad Estado-Rasgo',
  'STAI',
  'El STAI es un instrumento de autoevaluación que mide dos conceptos independientes de la ansiedad: la ansiedad como estado (condición emocional transitoria caracterizada por sentimientos subjetivos de tensión y aprensión, así como hiperactividad del sistema nervioso autónomo) y la ansiedad como rasgo (propensión ansiosa relativamente estable que predispone al individuo a percibir situaciones como amenazantes). Es ampliamente utilizado en investigación y práctica clínica para evaluar niveles de ansiedad en adolescentes y adultos.',
  '1.0',
  'ansiedad',
  40,
  15,
  'self_administered',
  'Adolescentes y adultos con un nivel cultural mínimo para comprender las instrucciones y enunciados del cuestionario',
  'subscales',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-estado-0',
  'stai',
  '0',
  'Nada',
  0,
  1,
  'standard',
  '{"color":"#f8f9fa","description":"Ausencia total de la característica evaluada"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-estado-1',
  'stai',
  '1',
  'Algo',
  1,
  2,
  'standard',
  '{"color":"#fff3cd","description":"Presencia leve de la característica evaluada"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-estado-2',
  'stai',
  '2',
  'Bastante',
  2,
  3,
  'standard',
  '{"color":"#f8d7da","description":"Presencia moderada de la característica evaluada"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-estado-3',
  'stai',
  '3',
  'Mucho',
  3,
  4,
  'standard',
  '{"color":"#f5c6cb","description":"Presencia intensa de la característica evaluada"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-rasgo-0',
  'stai',
  '0',
  'Casi nunca',
  0,
  1,
  'standard',
  '{"color":"#f8f9fa","description":"Frecuencia mínima de presentación"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-rasgo-1',
  'stai',
  '1',
  'A veces',
  1,
  2,
  'standard',
  '{"color":"#fff3cd","description":"Frecuencia ocasional de presentación"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-rasgo-2',
  'stai',
  '2',
  'A menudo',
  2,
  3,
  'standard',
  '{"color":"#f8d7da","description":"Frecuencia habitual de presentación"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-rasgo-3',
  'stai',
  '3',
  'Casi siempre',
  3,
  4,
  'standard',
  '{"color":"#f5c6cb","description":"Frecuencia muy alta de presentación"}',
  NOW(),
  NOW()
);

INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-1',
  'stai',
  1,
  'Me siento calmado',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan tranquilo y en paz se siente en este momento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-1', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-1', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-1', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-1', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-2',
  'stai',
  2,
  'Me siento seguro',
  'likert',
  1,
  0,
  '',
  'Considere qué tan protegido y sin temores se siente ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-2', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-2', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-2', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-2', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-3',
  'stai',
  3,
  'Estoy tenso',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe el nivel de tensión corporal y mental que experimenta ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-3', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-3', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-3', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-3', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-4',
  'stai',
  4,
  'Estoy contrariado',
  'likert',
  0,
  1,
  '≥2',
  'Considere si se siente molesto, disgustado o perturbado en este momento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-4', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-4', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-4', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-4', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-5',
  'stai',
  5,
  'Me siento cómodo (estoy a gusto)',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan relajado y sin molestias se siente ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-5', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-5', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-5', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-5', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-6',
  'stai',
  6,
  'Me siento alterado',
  'likert',
  0,
  1,
  '≥2',
  'Considere si se siente agitado, inquieto o perturbado ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-6', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-6', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-6', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-6', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-7',
  'stai',
  7,
  'Estoy preocupado ahora por posibles desgracias futuras',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si tiene pensamientos de preocupación sobre cosas que podrían salir mal',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-7', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-7', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-7', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-7', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-8',
  'stai',
  8,
  'Me siento descansado',
  'likert',
  1,
  0,
  '',
  'Considere qué tan reparado y sin fatiga se siente en este momento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-8', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-8', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-8', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-8', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-9',
  'stai',
  9,
  'Me siento angustiado',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si experimenta una sensación de malestar profundo o sufrimiento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-9', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-9', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-9', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-9', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-10',
  'stai',
  10,
  'Me siento confortable',
  'likert',
  1,
  0,
  '',
  'Considere qué tan bien y sin molestias se siente ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-10', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-10', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-10', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-10', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-11',
  'stai',
  11,
  'Tengo confianza en mí mismo',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan seguro se siente de sus propias capacidades en este momento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-11', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-11', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-11', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-11', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-12',
  'stai',
  12,
  'Me siento nervioso',
  'likert',
  0,
  1,
  '≥2',
  'Considere si experimenta inquietud, agitación o nerviosismo ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-12', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-12', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-12', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-12', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-13',
  'stai',
  13,
  'Estoy inquieto',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si se siente intranquilo, sin poder estar quieto',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-13', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-13', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-13', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-13', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-14',
  'stai',
  14,
  'Me siento muy atado (como oprimido)',
  'likert',
  0,
  1,
  '≥2',
  'Considere si experimenta una sensación de estar restringido o presionado',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-14', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-14', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-14', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-14', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-15',
  'stai',
  15,
  'Estoy relajado',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan libre de tensión y tranquilo se siente',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-15', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-15', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-15', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-15', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-16',
  'stai',
  16,
  'Me siento satisfecho',
  'likert',
  1,
  0,
  '',
  'Considere qué tan contento y complacido se siente en este momento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-16', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-16', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-16', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-16', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-17',
  'stai',
  17,
  'Estoy preocupado',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si tiene pensamientos inquietantes o preocupaciones ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-17', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-17', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-17', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-17', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-18',
  'stai',
  18,
  'Me siento aturdido y sobreexcitado',
  'likert',
  0,
  1,
  '≥2',
  'Considere si se siente confuso y con exceso de activación mental',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-18', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-18', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-18', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-18', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-19',
  'stai',
  19,
  'Me siento alegre',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan contento y con buen ánimo se siente ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-19', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-19', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-19', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-19', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-20',
  'stai',
  20,
  'En este momento me siento bien',
  'likert',
  1,
  0,
  '',
  'Considere su estado general de bienestar en este momento preciso',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-20', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-20', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-20', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-20', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-21',
  'stai',
  21,
  'Me siento bien',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan bien se siente habitualmente en su vida diaria',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-21', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-21', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-21', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-21', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-22',
  'stai',
  22,
  'Me canso rápidamente',
  'likert',
  0,
  1,
  '≥2',
  'Considere con qué frecuencia experimenta fatiga o cansancio fácilmente',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-22', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-22', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-22', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-22', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-23',
  'stai',
  23,
  'Siento ganas de llorar',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe con qué frecuencia experimenta tristeza o ganas de llorar',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-23', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-23', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-23', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-23', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-24',
  'stai',
  24,
  'Me gustaría ser tan feliz como otros',
  'likert',
  0,
  1,
  '≥2',
  'Considere si frecuentemente desea tener el nivel de felicidad de otras personas',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-24', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-24', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-24', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-24', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-25',
  'stai',
  25,
  'Pierdo oportunidades por no decidirme pronto',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si frecuentemente la indecisión le hace perder oportunidades',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-25', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-25', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-25', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-25', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-26',
  'stai',
  26,
  'Me siento descansado',
  'likert',
  1,
  0,
  '',
  'Considere con qué frecuencia se siente reparado y sin fatiga',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-26', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-26', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-26', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-26', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-27',
  'stai',
  27,
  'Soy una persona tranquila, serena y sosegada',
  'likert',
  1,
  0,
  '',
  'Evalúe si generalmente se considera una persona calmada y apacible',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-27', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-27', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-27', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-27', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-28',
  'stai',
  28,
  'Veo que las dificultades se amontonan y no puedo con ellas',
  'likert',
  0,
  1,
  '≥2',
  'Considere si frecuentemente se siente abrumado por los problemas',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-28', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-28', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-28', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-28', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-29',
  'stai',
  29,
  'Me preocupo demasiado por cosas sin importancia',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si tiende a preocuparse por asuntos menores o triviales',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-29', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-29', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-29', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-29', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-30',
  'stai',
  30,
  'Soy feliz',
  'likert',
  1,
  0,
  '',
  'Considere si generalmente se siente contento y satisfecho con la vida',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-30', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-30', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-30', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-30', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-31',
  'stai',
  31,
  'Suelo tomar las cosas demasiado seriamente',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si tiende a darle más importancia de la necesaria a las situaciones',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-31', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-31', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-31', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-31', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-32',
  'stai',
  32,
  'Me falta confianza en mí mismo',
  'likert',
  0,
  1,
  '≥2',
  'Considere si frecuentemente duda de sus propias capacidades',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-32', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-32', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-32', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-32', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-33',
  'stai',
  33,
  'Me siento seguro',
  'likert',
  1,
  0,
  '',
  'Evalúe si generalmente se siente protegido y sin temores',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-33', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-33', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-33', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-33', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-34',
  'stai',
  34,
  'No suelo afrontar las crisis o dificultades',
  'likert',
  0,
  1,
  '≥2',
  'Considere si tiende a evitar o no enfrentar los problemas difíciles',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-34', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-34', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-34', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-34', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-35',
  'stai',
  35,
  'Me siento triste (melancólico)',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe con qué frecuencia experimenta sentimientos de tristeza o melancolía',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-35', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-35', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-35', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-35', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-36',
  'stai',
  36,
  'Estoy satisfecho',
  'likert',
  1,
  0,
  '',
  'Considere si generalmente se siente contento y complacido con su vida',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-36', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-36', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-36', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-36', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-37',
  'stai',
  37,
  'Me rondan y molestan pensamientos sin importancia',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si frecuentemente tiene pensamientos intrusivos o preocupaciones menores',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-37', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-37', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-37', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-37', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-38',
  'stai',
  38,
  'Me afectan tanto los desengaños que no puedo olvidarlos',
  'likert',
  0,
  1,
  '≥2',
  'Considere si las decepciones le afectan profundamente y de forma duradera',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-38', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-38', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-38', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-38', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-39',
  'stai',
  39,
  'Soy una persona estable',
  'likert',
  1,
  0,
  '',
  'Evalúe si generalmente se considera emocionalmente equilibrado y constante',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-39', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-39', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-39', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-39', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-40',
  'stai',
  40,
  'Cuando pienso sobre asuntos y preocupaciones actuales me pongo tenso y agitado',
  'likert',
  0,
  1,
  '≥2',
  'Considere si pensar en problemas actuales le genera tensión y nerviosismo',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-40', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-40', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-40', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-40', 'stai-opt-rasgo-3');
INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-estado-bajo',
  'stai',
  0,
  19,
  'minimal',
  'Ansiedad Estado Baja',
  '#27AE60',
  'Nivel bajo de ansiedad estado. El paciente reporta sentirse calmado, relajado y sin tensión en el momento actual. Indica un estado emocional de tranquilidad y bienestar presente.',
  'Estado óptimo de funcionamiento emocional. Mantener estrategias actuales de autocuidado y manejo del estrés. Reforzar recursos de afrontamiento positivos.',
  NOW(),
  NOW()
);

INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-estado-moderado',
  'stai',
  20,
  39,
  'mild',
  'Ansiedad Estado Moderada',
  '#F39C12',
  'Nivel moderado de ansiedad estado. El paciente experimenta cierta tensión y aprensión en el momento presente, pero dentro de rangos manejables. Puede reflejar respuesta adaptativa a estresores situacionales.',
  'Evaluar factores estresantes actuales. Implementar técnicas de relajación inmediata como respiración diafragmática o mindfulness. Monitorear evolución y proporcionar estrategias de afrontamiento.',
  NOW(),
  NOW()
);

INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-estado-alto',
  'stai',
  40,
  60,
  'severe',
  'Ansiedad Estado Alta',
  '#E74C3C',
  'Nivel alto de ansiedad estado. El paciente experimenta malestar significativo, tensión intensa, nerviosismo y posible activación autonómica en el momento presente. Requiere intervención inmediata.',
  'Intervención inmediata recomendada. Aplicar técnicas de relajación y respiración. Evaluar necesidad de apoyo farmacológico a corto plazo. Identificar y abordar estresores desencadenantes. Considerar derivación urgente si hay síntomas somáticos intensos.',
  NOW(),
  NOW()
);

INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-rasgo-bajo',
  'stai',
  0,
  19,
  'minimal',
  'Ansiedad Rasgo Baja',
  '#27AE60',
  'Nivel bajo de ansiedad rasgo. El paciente presenta una predisposición mínima a experimentar ansiedad. Tiende a percibir las situaciones como no amenazantes y mantiene estabilidad emocional general.',
  'Perfil de personalidad resiliente. Mantener estrategias actuales de afrontamiento. Considerar como fortaleza personal en procesos terapéuticos. Reforzar recursos de autorregulación existentes.',
  NOW(),
  NOW()
);

INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-rasgo-moderado',
  'stai',
  20,
  39,
  'mild',
  'Ansiedad Rasgo Moderada',
  '#F39C12',
  'Nivel moderado de ansiedad rasgo. El paciente presenta una predisposición moderada a experimentar ansiedad ante diversas situaciones. Puede mostrar cierta tendencia a percibir situaciones como amenazantes.',
  'Desarrollar estrategias de reestructuración cognitiva. Entrenar en técnicas de manejo de ansiedad preventivas. Trabajar identificación y modificación de pensamientos ansiógenos. Fortalecer autoestima y confianza personal.',
  NOW(),
  NOW()
);

INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-rasgo-alto',
  'stai',
  40,
  60,
  'severe',
  'Ansiedad Rasgo Alta',
  '#E74C3C',
  'Nivel alto de ansiedad rasgo. El paciente presenta una marcada predisposición a experimentar ansiedad como característica estable de personalidad. Tendencia a percibir múltiples situaciones como amenazantes y reaccionar con ansiedad elevada.',
  'Intervención psicoterapéutica estructurada recomendada. Terapia cognitivo-conductual enfocada en reestructuración cognitiva y manejo de ansiedad. Evaluar necesidad de tratamiento farmacológico de mantenimiento. Desarrollar plan integral de manejo de ansiedad a largo plazo.',
  NOW(),
  NOW()
);



-- Escala: Inventario de Ansiedad Estado-Rasgo
INSERT INTO scales (id, name, abbreviation, description, version, category, total_items, estimated_duration_minutes, administration_mode, target_population, scoring_method, created_at, updated_at) VALUES (
  'stai',
  'Inventario de Ansiedad Estado-Rasgo',
  'STAI',
  'El STAI es un instrumento de autoevaluación que mide dos conceptos independientes de la ansiedad: la ansiedad como estado (condición emocional transitoria caracterizada por sentimientos subjetivos de tensión y aprensión, así como hiperactividad del sistema nervioso autónomo) y la ansiedad como rasgo (propensión ansiosa relativamente estable que predispone al individuo a percibir situaciones como amenazantes). Es ampliamente utilizado en investigación y práctica clínica para evaluar niveles de ansiedad en adolescentes y adultos.',
  '1.0',
  'ansiedad',
  40,
  15,
  'self_administered',
  'Adolescentes y adultos con un nivel cultural mínimo para comprender las instrucciones y enunciados del cuestionario',
  'subscales',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-estado-0',
  'stai',
  '0',
  'Nada',
  0,
  1,
  'standard',
  '{"color":"#f8f9fa","description":"Ausencia total de la característica evaluada"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-estado-1',
  'stai',
  '1',
  'Algo',
  1,
  2,
  'standard',
  '{"color":"#fff3cd","description":"Presencia leve de la característica evaluada"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-estado-2',
  'stai',
  '2',
  'Bastante',
  2,
  3,
  'standard',
  '{"color":"#f8d7da","description":"Presencia moderada de la característica evaluada"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-estado-3',
  'stai',
  '3',
  'Mucho',
  3,
  4,
  'standard',
  '{"color":"#f5c6cb","description":"Presencia intensa de la característica evaluada"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-rasgo-0',
  'stai',
  '0',
  'Casi nunca',
  0,
  1,
  'standard',
  '{"color":"#f8f9fa","description":"Frecuencia mínima de presentación"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-rasgo-1',
  'stai',
  '1',
  'A veces',
  1,
  2,
  'standard',
  '{"color":"#fff3cd","description":"Frecuencia ocasional de presentación"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-rasgo-2',
  'stai',
  '2',
  'A menudo',
  2,
  3,
  'standard',
  '{"color":"#f8d7da","description":"Frecuencia habitual de presentación"}',
  NOW(),
  NOW()
);

INSERT INTO response_options (id, scale_id, value, label, score, order_index, option_type, metadata, created_at, updated_at) VALUES (
  'stai-opt-rasgo-3',
  'stai',
  '3',
  'Casi siempre',
  3,
  4,
  'standard',
  '{"color":"#f5c6cb","description":"Frecuencia muy alta de presentación"}',
  NOW(),
  NOW()
);

INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-1',
  'stai',
  1,
  'Me siento calmado',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan tranquilo y en paz se siente en este momento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-1', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-1', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-1', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-1', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-2',
  'stai',
  2,
  'Me siento seguro',
  'likert',
  1,
  0,
  '',
  'Considere qué tan protegido y sin temores se siente ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-2', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-2', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-2', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-2', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-3',
  'stai',
  3,
  'Estoy tenso',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe el nivel de tensión corporal y mental que experimenta ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-3', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-3', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-3', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-3', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-4',
  'stai',
  4,
  'Estoy contrariado',
  'likert',
  0,
  1,
  '≥2',
  'Considere si se siente molesto, disgustado o perturbado en este momento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-4', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-4', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-4', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-4', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-5',
  'stai',
  5,
  'Me siento cómodo (estoy a gusto)',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan relajado y sin molestias se siente ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-5', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-5', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-5', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-5', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-6',
  'stai',
  6,
  'Me siento alterado',
  'likert',
  0,
  1,
  '≥2',
  'Considere si se siente agitado, inquieto o perturbado ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-6', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-6', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-6', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-6', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-7',
  'stai',
  7,
  'Estoy preocupado ahora por posibles desgracias futuras',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si tiene pensamientos de preocupación sobre cosas que podrían salir mal',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-7', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-7', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-7', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-7', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-8',
  'stai',
  8,
  'Me siento descansado',
  'likert',
  1,
  0,
  '',
  'Considere qué tan reparado y sin fatiga se siente en este momento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-8', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-8', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-8', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-8', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-9',
  'stai',
  9,
  'Me siento angustiado',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si experimenta una sensación de malestar profundo o sufrimiento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-9', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-9', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-9', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-9', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-10',
  'stai',
  10,
  'Me siento confortable',
  'likert',
  1,
  0,
  '',
  'Considere qué tan bien y sin molestias se siente ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-10', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-10', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-10', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-10', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-11',
  'stai',
  11,
  'Tengo confianza en mí mismo',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan seguro se siente de sus propias capacidades en este momento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-11', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-11', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-11', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-11', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-12',
  'stai',
  12,
  'Me siento nervioso',
  'likert',
  0,
  1,
  '≥2',
  'Considere si experimenta inquietud, agitación o nerviosismo ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-12', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-12', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-12', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-12', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-13',
  'stai',
  13,
  'Estoy inquieto',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si se siente intranquilo, sin poder estar quieto',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-13', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-13', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-13', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-13', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-14',
  'stai',
  14,
  'Me siento muy atado (como oprimido)',
  'likert',
  0,
  1,
  '≥2',
  'Considere si experimenta una sensación de estar restringido o presionado',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-14', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-14', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-14', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-14', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-15',
  'stai',
  15,
  'Estoy relajado',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan libre de tensión y tranquilo se siente',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-15', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-15', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-15', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-15', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-16',
  'stai',
  16,
  'Me siento satisfecho',
  'likert',
  1,
  0,
  '',
  'Considere qué tan contento y complacido se siente en este momento',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-16', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-16', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-16', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-16', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-17',
  'stai',
  17,
  'Estoy preocupado',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si tiene pensamientos inquietantes o preocupaciones ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-17', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-17', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-17', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-17', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-18',
  'stai',
  18,
  'Me siento aturdido y sobreexcitado',
  'likert',
  0,
  1,
  '≥2',
  'Considere si se siente confuso y con exceso de activación mental',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-18', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-18', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-18', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-18', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-19',
  'stai',
  19,
  'Me siento alegre',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan contento y con buen ánimo se siente ahora',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-19', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-19', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-19', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-19', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-20',
  'stai',
  20,
  'En este momento me siento bien',
  'likert',
  1,
  0,
  '',
  'Considere su estado general de bienestar en este momento preciso',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-20', 'stai-opt-estado-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-20', 'stai-opt-estado-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-20', 'stai-opt-estado-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-20', 'stai-opt-estado-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-21',
  'stai',
  21,
  'Me siento bien',
  'likert',
  1,
  0,
  '',
  'Evalúe qué tan bien se siente habitualmente en su vida diaria',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-21', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-21', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-21', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-21', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-22',
  'stai',
  22,
  'Me canso rápidamente',
  'likert',
  0,
  1,
  '≥2',
  'Considere con qué frecuencia experimenta fatiga o cansancio fácilmente',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-22', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-22', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-22', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-22', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-23',
  'stai',
  23,
  'Siento ganas de llorar',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe con qué frecuencia experimenta tristeza o ganas de llorar',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-23', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-23', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-23', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-23', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-24',
  'stai',
  24,
  'Me gustaría ser tan feliz como otros',
  'likert',
  0,
  1,
  '≥2',
  'Considere si frecuentemente desea tener el nivel de felicidad de otras personas',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-24', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-24', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-24', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-24', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-25',
  'stai',
  25,
  'Pierdo oportunidades por no decidirme pronto',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si frecuentemente la indecisión le hace perder oportunidades',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-25', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-25', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-25', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-25', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-26',
  'stai',
  26,
  'Me siento descansado',
  'likert',
  1,
  0,
  '',
  'Considere con qué frecuencia se siente reparado y sin fatiga',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-26', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-26', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-26', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-26', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-27',
  'stai',
  27,
  'Soy una persona tranquila, serena y sosegada',
  'likert',
  1,
  0,
  '',
  'Evalúe si generalmente se considera una persona calmada y apacible',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-27', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-27', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-27', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-27', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-28',
  'stai',
  28,
  'Veo que las dificultades se amontonan y no puedo con ellas',
  'likert',
  0,
  1,
  '≥2',
  'Considere si frecuentemente se siente abrumado por los problemas',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-28', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-28', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-28', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-28', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-29',
  'stai',
  29,
  'Me preocupo demasiado por cosas sin importancia',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si tiende a preocuparse por asuntos menores o triviales',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-29', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-29', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-29', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-29', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-30',
  'stai',
  30,
  'Soy feliz',
  'likert',
  1,
  0,
  '',
  'Considere si generalmente se siente contento y satisfecho con la vida',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-30', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-30', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-30', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-30', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-31',
  'stai',
  31,
  'Suelo tomar las cosas demasiado seriamente',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si tiende a darle más importancia de la necesaria a las situaciones',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-31', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-31', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-31', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-31', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-32',
  'stai',
  32,
  'Me falta confianza en mí mismo',
  'likert',
  0,
  1,
  '≥2',
  'Considere si frecuentemente duda de sus propias capacidades',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-32', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-32', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-32', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-32', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-33',
  'stai',
  33,
  'Me siento seguro',
  'likert',
  1,
  0,
  '',
  'Evalúe si generalmente se siente protegido y sin temores',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-33', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-33', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-33', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-33', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-34',
  'stai',
  34,
  'No suelo afrontar las crisis o dificultades',
  'likert',
  0,
  1,
  '≥2',
  'Considere si tiende a evitar o no enfrentar los problemas difíciles',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-34', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-34', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-34', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-34', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-35',
  'stai',
  35,
  'Me siento triste (melancólico)',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe con qué frecuencia experimenta sentimientos de tristeza o melancolía',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-35', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-35', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-35', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-35', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-36',
  'stai',
  36,
  'Estoy satisfecho',
  'likert',
  1,
  0,
  '',
  'Considere si generalmente se siente contento y complacido con su vida',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-36', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-36', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-36', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-36', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-37',
  'stai',
  37,
  'Me rondan y molestan pensamientos sin importancia',
  'likert',
  0,
  1,
  '≥2',
  'Evalúe si frecuentemente tiene pensamientos intrusivos o preocupaciones menores',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-37', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-37', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-37', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-37', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-38',
  'stai',
  38,
  'Me afectan tanto los desengaños que no puedo olvidarlos',
  'likert',
  0,
  1,
  '≥2',
  'Considere si las decepciones le afectan profundamente y de forma duradera',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-38', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-38', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-38', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-38', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-39',
  'stai',
  39,
  'Soy una persona estable',
  'likert',
  1,
  0,
  '',
  'Evalúe si generalmente se considera emocionalmente equilibrado y constante',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-39', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-39', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-39', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-39', 'stai-opt-rasgo-3');
INSERT INTO items (id, scale_id, number, text, question_type, reverse_scored, alert_trigger, alert_condition, help_text, required, metadata, created_at, updated_at) VALUES (
  'stai-item-40',
  'stai',
  40,
  'Cuando pienso sobre asuntos y preocupaciones actuales me pongo tenso y agitado',
  'likert',
  0,
  1,
  '≥2',
  'Considere si pensar en problemas actuales le genera tensión y nerviosismo',
  1,
  '{"layout":"vertical","show_numbers":true,"show_labels":true,"randomize_options":false}',
  NOW(),
  NOW()
);

INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-40', 'stai-opt-rasgo-0');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-40', 'stai-opt-rasgo-1');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-40', 'stai-opt-rasgo-2');
INSERT INTO item_response_options (item_id, response_option_id) VALUES ('stai-item-40', 'stai-opt-rasgo-3');
INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-estado-bajo',
  'stai',
  0,
  19,
  'minimal',
  'Ansiedad Estado Baja',
  '#27AE60',
  'Nivel bajo de ansiedad estado. El paciente reporta sentirse calmado, relajado y sin tensión en el momento actual. Indica un estado emocional de tranquilidad y bienestar presente.',
  'Estado óptimo de funcionamiento emocional. Mantener estrategias actuales de autocuidado y manejo del estrés. Reforzar recursos de afrontamiento positivos.',
  NOW(),
  NOW()
);

INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-estado-moderado',
  'stai',
  20,
  39,
  'mild',
  'Ansiedad Estado Moderada',
  '#F39C12',
  'Nivel moderado de ansiedad estado. El paciente experimenta cierta tensión y aprensión en el momento presente, pero dentro de rangos manejables. Puede reflejar respuesta adaptativa a estresores situacionales.',
  'Evaluar factores estresantes actuales. Implementar técnicas de relajación inmediata como respiración diafragmática o mindfulness. Monitorear evolución y proporcionar estrategias de afrontamiento.',
  NOW(),
  NOW()
);

INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-estado-alto',
  'stai',
  40,
  60,
  'severe',
  'Ansiedad Estado Alta',
  '#E74C3C',
  'Nivel alto de ansiedad estado. El paciente experimenta malestar significativo, tensión intensa, nerviosismo y posible activación autonómica en el momento presente. Requiere intervención inmediata.',
  'Intervención inmediata recomendada. Aplicar técnicas de relajación y respiración. Evaluar necesidad de apoyo farmacológico a corto plazo. Identificar y abordar estresores desencadenantes. Considerar derivación urgente si hay síntomas somáticos intensos.',
  NOW(),
  NOW()
);

INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-rasgo-bajo',
  'stai',
  0,
  19,
  'minimal',
  'Ansiedad Rasgo Baja',
  '#27AE60',
  'Nivel bajo de ansiedad rasgo. El paciente presenta una predisposición mínima a experimentar ansiedad. Tiende a percibir las situaciones como no amenazantes y mantiene estabilidad emocional general.',
  'Perfil de personalidad resiliente. Mantener estrategias actuales de afrontamiento. Considerar como fortaleza personal en procesos terapéuticos. Reforzar recursos de autorregulación existentes.',
  NOW(),
  NOW()
);

INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-rasgo-moderado',
  'stai',
  20,
  39,
  'mild',
  'Ansiedad Rasgo Moderada',
  '#F39C12',
  'Nivel moderado de ansiedad rasgo. El paciente presenta una predisposición moderada a experimentar ansiedad ante diversas situaciones. Puede mostrar cierta tendencia a percibir situaciones como amenazantes.',
  'Desarrollar estrategias de reestructuración cognitiva. Entrenar en técnicas de manejo de ansiedad preventivas. Trabajar identificación y modificación de pensamientos ansiógenos. Fortalecer autoestima y confianza personal.',
  NOW(),
  NOW()
);

INSERT INTO interpretation_rules (id, scale_id, min_score, max_score, severity_level, label, color, description, recommendations, created_at, updated_at) VALUES (
  'stai-int-rasgo-alto',
  'stai',
  40,
  60,
  'severe',
  'Ansiedad Rasgo Alta',
  '#E74C3C',
  'Nivel alto de ansiedad rasgo. El paciente presenta una marcada predisposición a experimentar ansiedad como característica estable de personalidad. Tendencia a percibir múltiples situaciones como amenazantes y reaccionar con ansiedad elevada.',
  'Intervención psicoterapéutica estructurada recomendada. Terapia cognitivo-conductual enfocada en reestructuración cognitiva y manejo de ansiedad. Evaluar necesidad de tratamiento farmacológico de mantenimiento. Desarrollar plan integral de manejo de ansiedad a largo plazo.',
  NOW(),
  NOW()
);



SET FOREIGN_KEY_CHECKS = 1;
