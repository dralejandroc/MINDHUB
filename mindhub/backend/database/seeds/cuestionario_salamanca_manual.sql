-- Cuestionario Salamanca de Trastornos de la Personalidad
-- Generado manualmente para asegurar compatibilidad con tablas existentes

-- 1. Insertar la escala principal
INSERT INTO scales (
  id, name, abbreviation, description, version, category, subcategory, 
  author, publication_year, total_items, estimated_duration_minutes, 
  administration_mode, target_population, scoring_method, score_range_min, 
  score_range_max, instructions_professional, instructions_patient, 
  created_at, updated_at
) VALUES (
  'cuestionario-salamanca',
  'Cuestionario Salamanca de Trastornos de la Personalidad',
  'CS-TP',
  'Instrumento de screening autoaplicado diseñado para la detección temprana de 11 trastornos de personalidad según criterios DSM-IV-TR y CIE-10. Permite una primera aproximación diagnóstica rápida y eficaz para determinar la necesidad de evaluación más exhaustiva. Especialmente útil en la práctica clínica diaria por su brevedad y propiedades psicométricas validadas.',
  '2007',
  'personalidad',
  'trastornos_personalidad_screening',
  'Pérez Urdániz, A., Rubio Larrosa, V., Gómez Gazol, M.E.',
  2007,
  22,
  10,
  'self_administered',
  'Adolescentes y adultos alfabetos de ambos sexos en condiciones de entender y entenderse con los demás',
  'sum',
  0,
  6,
  'Instrumento de screening que no debe utilizarse para realizar diagnósticos definitivos sino para identificar sujetos con alta probabilidad de presentar trastornos de personalidad. Punto de corte de 2 o más puntos por trastorno indica necesidad de evaluación más profunda. Validado con entrevista IPDE mostrando sensibilidad del 100% y especificidad del 94.34%. Cada trastorno se evalúa mediante 2 ítems específicos derivados de los criterios de mayor peso estadístico.',
  'Este es un cuestionario para la valoración de algunos de sus rasgos de personalidad. Conteste según sea su manera de ser habitual y no según se encuentre en un momento dado. Ponga una cruz en su respuesta: V para verdadero y F para falso. En el caso de contestar V (verdadero) no olvide señalar el grado de intensidad de su respuesta.',
  NOW(),
  NOW()
);

-- 2. Insertar opciones de respuesta
INSERT INTO scale_response_options (
  id, scale_id, option_value, option_label, score_value, display_order, 
  option_type, metadata, created_at, updated_at
) VALUES 
('salamanca-opt-0', 'cuestionario-salamanca', '0', 'Falso', 0, 1, 'standard', '{"color": "#f8f9fa", "description": "La afirmación no se aplica a usted"}', NOW(), NOW()),
('salamanca-opt-1', 'cuestionario-salamanca', '1', 'Verdadero a veces', 1, 2, 'standard', '{"color": "#fff3cd", "description": "La afirmación se aplica ocasionalmente"}', NOW(), NOW()),
('salamanca-opt-2', 'cuestionario-salamanca', '2', 'Verdadero con frecuencia', 2, 3, 'standard', '{"color": "#f8d7da", "description": "La afirmación se aplica frecuentemente"}', NOW(), NOW()),
('salamanca-opt-3', 'cuestionario-salamanca', '3', 'Verdadero siempre', 3, 4, 'standard', '{"color": "#d4edda", "description": "La afirmación se aplica constantemente"}', NOW(), NOW());

-- 3. Insertar ítems (22 ítems del cuestionario)
INSERT INTO scale_items (
  id, scale_id, item_number, item_text, question_type, reverse_scored, 
  alert_trigger, alert_condition, help_text, required, metadata, 
  subscale, created_at, updated_at
) VALUES 
('salamanca-item-1', 'cuestionario-salamanca', 1, 'Pienso que más vale no confiar en los demás', 'likert', FALSE, TRUE, '≥2', 'Refiere a la tendencia persistente a desconfiar de las intenciones de otros', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "paranoide"}', 'paranoide', NOW(), NOW()),
('salamanca-item-2', 'cuestionario-salamanca', 2, 'Me gustaría dar a la gente su merecido', 'likert', FALSE, TRUE, '≥2', 'Evalúa tendencias vengativas o de retaliación hacia otros', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "paranoide"}', 'paranoide', NOW(), NOW()),
('salamanca-item-3', 'cuestionario-salamanca', 3, 'Prefiero realizar actividades que pueda hacer yo solo', 'likert', FALSE, TRUE, '≥2', 'Evalúa preferencia marcada por actividades solitarias', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "esquizoide"}', 'esquizoide', NOW(), NOW()),
('salamanca-item-4', 'cuestionario-salamanca', 4, 'Prefiero estar conmigo mismo', 'likert', FALSE, TRUE, '≥2', 'Evalúa preferencia por la soledad sobre la compañía', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "esquizoide"}', 'esquizoide', NOW(), NOW()),
('salamanca-item-5', 'cuestionario-salamanca', 5, 'Me dicen que soy muy raro', 'likert', FALSE, TRUE, '≥2', 'Evalúa comportamiento o pensamiento excéntrico percibido por otros', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "esquizotipico"}', 'esquizotipico', NOW(), NOW()),
('salamanca-item-6', 'cuestionario-salamanca', 6, 'Soy supersticioso', 'likert', FALSE, TRUE, '≥2', 'Evalúa creencias supersticiosas o pensamiento mágico', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "esquizotipico"}', 'esquizotipico', NOW(), NOW()),
('salamanca-item-7', 'cuestionario-salamanca', 7, 'Me impulsan emociones muy intensas', 'likert', FALSE, TRUE, '≥2', 'Evalúa labilidad emocional e intensidad afectiva', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "histrionico"}', 'histrionico', NOW(), NOW()),
('salamanca-item-8', 'cuestionario-salamanca', 8, 'Necesito ser el centro de atención', 'likert', FALSE, TRUE, '≥2', 'Evalúa necesidad de atención y protagonismo', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "histrionico"}', 'histrionico', NOW(), NOW()),
('salamanca-item-9', 'cuestionario-salamanca', 9, 'Creo que soy una persona muy especial', 'likert', FALSE, TRUE, '≥2', 'Evalúa grandiosidad y sentimientos de superioridad', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "narcisista"}', 'narcisista', NOW(), NOW()),
('salamanca-item-10', 'cuestionario-salamanca', 10, 'Creo que los demás me tienen envidia', 'likert', FALSE, TRUE, '≥2', 'Evalúa creencias sobre envidia de otros hacia uno mismo', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "narcisista"}', 'narcisista', NOW(), NOW()),
('salamanca-item-11', 'cuestionario-salamanca', 11, 'No me importa herir los sentimientos de los demás', 'likert', FALSE, TRUE, '≥2', 'Evalúa falta de empatía y consideración hacia otros', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "antisocial"}', 'antisocial', NOW(), NOW()),
('salamanca-item-12', 'cuestionario-salamanca', 12, 'A menudo actúo de forma impulsiva', 'likert', FALSE, TRUE, '≥2', 'Evalúa tendencia a actuar sin reflexión previa', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "antisocial"}', 'antisocial', NOW(), NOW()),
('salamanca-item-13', 'cuestionario-salamanca', 13, 'Soy una persona muy inestable', 'likert', FALSE, TRUE, '≥2', 'Evalúa inestabilidad emocional general', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "limite"}', 'limite', NOW(), NOW()),
('salamanca-item-14', 'cuestionario-salamanca', 14, 'Tengo relaciones muy intensas', 'likert', FALSE, TRUE, '≥2', 'Evalúa intensidad desproporcionada en relaciones interpersonales', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "limite"}', 'limite', NOW(), NOW()),
('salamanca-item-15', 'cuestionario-salamanca', 15, 'Mis cambios de humor son muy bruscos', 'likert', FALSE, TRUE, '≥2', 'Evalúa cambios rápidos e intensos del estado anímico', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "borderline"}', 'borderline', NOW(), NOW()),
('salamanca-item-16', 'cuestionario-salamanca', 16, 'Hago esfuerzos desesperados para que no me abandonen', 'likert', FALSE, TRUE, '≥2', 'Evalúa miedo al abandono y esfuerzos por evitarlo', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "borderline"}', 'borderline', NOW(), NOW()),
('salamanca-item-17', 'cuestionario-salamanca', 17, 'Soy muy perfeccionista', 'likert', FALSE, TRUE, '≥2', 'Evalúa tendencia al perfeccionismo excesivo', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "anancastico"}', 'anancastico', NOW(), NOW()),
('salamanca-item-18', 'cuestionario-salamanca', 18, 'Me preocupo excesivamente por los detalles', 'likert', FALSE, TRUE, '≥2', 'Evalúa preocupación desproporcionada por minucias', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "anancastico"}', 'anancastico', NOW(), NOW()),
('salamanca-item-19', 'cuestionario-salamanca', 19, 'Necesito que otros tomen las decisiones importantes de mi vida', 'likert', FALSE, TRUE, '≥2', 'Evalúa dependencia excesiva en toma de decisiones', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "dependiente"}', 'dependiente', NOW(), NOW()),
('salamanca-item-20', 'cuestionario-salamanca', 20, 'Tengo dificultades para estar solo', 'likert', FALSE, TRUE, '≥2', 'Evalúa malestar o incapacidad para la soledad', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "dependiente"}', 'dependiente', NOW(), NOW()),
('salamanca-item-21', 'cuestionario-salamanca', 21, 'Tengo miedo al rechazo', 'likert', FALSE, TRUE, '≥2', 'Evalúa miedo intenso al rechazo social', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "ansioso"}', 'ansioso', NOW(), NOW()),
('salamanca-item-22', 'cuestionario-salamanca', 22, 'Me siento inferior a los demás', 'likert', FALSE, TRUE, '≥2', 'Evalúa sentimientos persistentes de inferioridad', TRUE, '{"layout": "horizontal", "show_numbers": true, "show_labels": true, "randomize_options": false, "disorder": "ansioso"}', 'ansioso', NOW(), NOW());

-- 4. Insertar subescalas (11 trastornos de personalidad)
INSERT INTO scale_subscales (
  id, scale_id, subscale_name, subscale_code, min_score, max_score, 
  description, items, referencias_bibliograficas, indice_cronbach, 
  created_at, updated_at
) VALUES 
('salamanca-sub-paranoide', 'cuestionario-salamanca', 'Trastorno Paranoide de la Personalidad', 'paranoide', 0, 6, 'Evalúa desconfianza y suspicacia generalizadas hacia otros', '[1, 2]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.78, NOW(), NOW()),
('salamanca-sub-esquizoide', 'cuestionario-salamanca', 'Trastorno Esquizoide de la Personalidad', 'esquizoide', 0, 6, 'Evalúa desapego de relaciones sociales y restricción expresión emocional', '[3, 4]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.81, NOW(), NOW()),
('salamanca-sub-esquizotipico', 'cuestionario-salamanca', 'Trastorno Esquizotípico de la Personalidad', 'esquizotipico', 0, 6, 'Evalúa malestar social, distorsiones cognitivas/perceptuales y excentricidades', '[5, 6]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.75, NOW(), NOW()),
('salamanca-sub-histrionico', 'cuestionario-salamanca', 'Trastorno Histriónico de la Personalidad', 'histrionico', 0, 6, 'Evalúa emotividad excesiva y búsqueda de atención', '[7, 8]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.83, NOW(), NOW()),
('salamanca-sub-narcisista', 'cuestionario-salamanca', 'Trastorno Narcisista de la Personalidad', 'narcisista', 0, 6, 'Evalúa grandiosidad, necesidad de admiración y falta de empatía', '[9, 10]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.79, NOW(), NOW()),
('salamanca-sub-antisocial', 'cuestionario-salamanca', 'Trastorno Antisocial de la Personalidad', 'antisocial', 0, 6, 'Evalúa despreocupación y violación de derechos de otros', '[11, 12]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.77, NOW(), NOW()),
('salamanca-sub-limite', 'cuestionario-salamanca', 'Trastorno Límite de la Personalidad', 'limite', 0, 6, 'Evalúa inestabilidad en relaciones interpersonales, autoimagen y afectividad', '[13, 14]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.86, NOW(), NOW()),
('salamanca-sub-borderline', 'cuestionario-salamanca', 'Trastorno Borderline de la Personalidad', 'borderline', 0, 6, 'Evalúa inestabilidad en relaciones interpersonales, autoimagen y afectividad con notable impulsividad', '[15, 16]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.85, NOW(), NOW()),
('salamanca-sub-anancastico', 'cuestionario-salamanca', 'Trastorno Anancástico de la Personalidad', 'anancastico', 0, 6, 'Evalúa preocupación por orden, perfeccionismo y control mental e interpersonal', '[17, 18]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.77, NOW(), NOW()),
('salamanca-sub-dependiente', 'cuestionario-salamanca', 'Trastorno Dependiente de la Personalidad', 'dependiente', 0, 6, 'Evalúa necesidad general y excesiva de que se ocupen de uno con comportamiento de sumisión', '[19, 20]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.82, NOW(), NOW()),
('salamanca-sub-ansioso', 'cuestionario-salamanca', 'Trastorno Ansioso de la Personalidad', 'ansioso', 0, 6, 'Evalúa inhibición social, sentimientos de inferioridad e hipersensibilidad a evaluación negativa', '[21, 22]', 'Pérez Urdániz et al., 2007; validado con IPDE', 0.80, NOW(), NOW());

-- 5. Insertar reglas de interpretación (por trastorno)
INSERT INTO scale_interpretation_rules (
  id, scale_id, min_score, max_score, severity_level, interpretation_label, 
  color_code, description, recommendations, created_at, updated_at
) VALUES 
('salamanca-int-normal', 'cuestionario-salamanca', 0, 1, 'normal', 'Sin indicadores significativos', '#22c55e', 'Puntuación por debajo del punto de corte. No se identifican indicadores significativos del trastorno evaluado', 'No requiere evaluación adicional para este trastorno específico', NOW(), NOW()),
('salamanca-int-screening', 'cuestionario-salamanca', 2, 6, 'screening_positive', 'Indicadores presentes - Requiere evaluación', '#ef4444', 'Puntuación igual o superior al punto de corte (≥2). Presencia de indicadores significativos que sugieren la necesidad de evaluación más profunda', 'Se recomienda evaluación clínica especializada con instrumentos más específicos (IPDE, SCID-II) para confirmar presencia del trastorno', NOW(), NOW());

-- 6. Insertar documentación científica
INSERT INTO scale_documentation (
  id, scale_id, bibliography, sources_consulted, implementation_notes, 
  psychometric_properties, clinical_considerations, special_items_notes, 
  version_notes, target_population_details, clinical_interpretation, 
  created_at, updated_at
) VALUES (
  'salamanca-doc-001',
  'cuestionario-salamanca',
  'Caldero Alonso, A. (2014). Estudio de los rasgos de la personalidad en población normal con el Cuestionario Salamanca. Tesis doctoral. Universidad de Salamanca.

Pérez Urdániz, A., Rubio Larrosa, V., & Gómez Gazol, M.E. (2007). Cuestionario Salamanca para el screening de trastornos de la personalidad (versión 2007). Universidad de Salamanca.',
  
  '[
    {
      "authors": "Caldero Alonso, A.",
      "year": "2014",
      "title": "Estudio de los rasgos de la personalidad en población normal con el Cuestionario Salamanca",
      "fullReference": "Caldero Alonso, A. (2014). Estudio de los rasgos de la personalidad en población normal con el Cuestionario Salamanca. Tesis doctoral. Universidad de Salamanca."
    },
    {
      "authors": "Pérez Urdániz, A., Rubio Larrosa, V., Gómez Gazol, M.E.",
      "year": "2007",
      "title": "Cuestionario Salamanca para el screening de trastornos de la personalidad (versión 2007)",
      "fullReference": "Pérez Urdániz, A., Rubio Larrosa, V., & Gómez Gazol, M.E. (2007). Cuestionario Salamanca para el screening de trastornos de la personalidad (versión 2007). Universidad de Salamanca."
    }
  ]',
  
  'Validación externa: El cuestionario mostró sensibilidad del 100% y especificidad del 94.34% cuando se validó contra la entrevista IPDE en su versión completa.

Punto de corte: Establecido en 2 o más puntos por trastorno basado en estudios de validación en población normal.

Uso clínico: Diseñado específicamente para screening en la práctica clínica diaria, no para diagnóstico definitivo.

Cada trastorno se evalúa mediante 2 ítems específicos derivados de los criterios de mayor peso estadístico según DSM-IV-TR y CIE-10.',
  
  '{
    "cronbach_alpha": 0.841,
    "test_retest_reliability": 0.85,
    "concurrent_validity": 0.94,
    "sensitivity": 1.00,
    "specificity": 0.94,
    "validation_instrument": "IPDE"
  }',
  
  'Instrumento de screening que no debe utilizarse para realizar diagnósticos definitivos sino para identificar sujetos con alta probabilidad de presentar trastornos de personalidad.

El punto de corte de 2 o más puntos por trastorno indica necesidad de evaluación más profunda.

Cada trastorno se evalúa independientemente a través de 2 ítems específicos.

Validado en población española normal y clínica.',
  
  '{
    "cutoff_point": "≥2 puntos por trastorno",
    "disorders_evaluated": 11,
    "items_per_disorder": 2,
    "response_format": "0=Falso, 1=A veces, 2=Con frecuencia, 3=Siempre",
    "administration_time": "5-10 minutos"
  }',
  
  'Versión 2007 - Validada con entrevista IPDE. Fiabilidad: Alpha de Cronbach de 0.841 considerado como alta fiabilidad.',
  
  'Adolescentes y adultos alfabetos de ambos sexos en condiciones de entender y entenderse con los demás. Validado en población española normal y en diversos estudios internacionales.',
  
  'Interpretación por trastorno individual:
- Puntuación 0-1: No indicadores significativos
- Puntuación ≥2: Presencia de indicadores que requieren evaluación especializada

No realizar interpretación global, sino evaluar cada uno de los 11 trastornos de personalidad de forma independiente.

La sensibilidad del 100% minimiza falsos negativos, mientras que la especificidad del 94.34% mantiene un nivel aceptable de falsos positivos para un instrumento de screening.',
  
  NOW(),
  NOW()
);