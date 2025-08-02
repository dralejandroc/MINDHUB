-- Cuestionario Salamanca de Trastornos de la Personalidad (CS-TP)
-- Generado automáticamente desde cuestionario-salamanca.json
-- Fecha: 2025-07-29T19:32:53.957Z

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Escala principal
INSERT INTO scales (
  id, name, abbreviation, description, version, category, subcategory,
  author, publication_year, total_items, estimated_duration_minutes,
  administration_mode, target_population, scoring_method,
  score_range_min, score_range_max, instructions_professional, instructions_patient,
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
  'Este es un cuestionario para la valoración de algunos de sus rasgos de personalidad. Conteste según sea su manera de ser habitual y no según se encuentre en un momento dado. Seleccione su respuesta: V para verdadero y F para falso. En el caso de que el grado de intensidad de su respuesta.',
  NOW(),
  NOW()
);

SET FOREIGN_KEY_CHECKS = 1;
