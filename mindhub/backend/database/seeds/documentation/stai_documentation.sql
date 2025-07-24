-- Documentación científica para STAI (Inventario de Ansiedad Estado-Rasgo)
-- Generado manualmente para primera escala del sistema

INSERT INTO scale_documentation (
  id, 
  scale_id, 
  bibliography, 
  sources_consulted, 
  implementation_notes, 
  psychometric_properties, 
  clinical_considerations, 
  special_items_notes, 
  version_notes, 
  target_population_details, 
  clinical_interpretation, 
  created_at, 
  updated_at
) VALUES (
  'stai-doc-001',
  'stai',
  'Spielberger, C. D., Gorsuch, R. L., & Lushene, R. E. (1970). Manual for the State-Trait Anxiety Inventory. Palo Alto: Consulting Psychologists Press.

TEA Ediciones (1982, 2008). STAI. Cuestionario de ansiedad estado-rasgo (7ª ed. rev.). Madrid: TEA.

Guillén-Riquelme, A., & Buela-Casal, G. (2011). Actualización psicométrica y funcionamiento diferencial de los ítems en el State Trait Anxiety Inventory (STAI). Psicothema, 23, 510-515.

Guillen-Riquelme, A., & Buela-Casal, G. (2015). Meta-analysis of group comparison and meta-analysis of reliability generalization of the State-Trait Anxiety Inventory (STAI). Revista de Psicodidáctica, 20(1), 79-96.',
  
  '[
    {
      "authors": "Spielberger, C. D., Gorsuch, R. L., Lushene, R. E.",
      "year": "1970",
      "title": "Manual for the State-Trait Anxiety Inventory",
      "fullReference": "Spielberger, C. D., Gorsuch, R. L., & Lushene, R. E. (1970). Manual for the State-Trait Anxiety Inventory. Palo Alto: Consulting Psychologists Press."
    },
    {
      "authors": "TEA Ediciones",
      "year": "1982, 2008",
      "title": "STAI. Cuestionario de ansiedad estado-rasgo (7ª ed. rev.)",
      "fullReference": "TEA Ediciones (1982, 2008). STAI. Cuestionario de ansiedad estado-rasgo (7ª ed. rev.). Madrid: TEA."
    }
  ]',
  
  'Ítems Inversos: Los ítems 1, 2, 5, 8, 10, 11, 15, 16, 19, 20 (Estado) y 21, 26, 27, 30, 33, 36, 39 (Rasgo) requieren puntuación invertida (3-puntuación original).

Estructura Factorial: El STAI presenta una estructura de dos factores bien definidos (ansiedad presente vs. bienestar) tanto para Estado como para Rasgo.

Aplicación Clínica: Especialmente útil para distinguir entre ansiedad situacional transitoria (Estado) y predisposición ansiosa estable (Rasgo).

El STAI debe administrarse en un ambiente tranquilo y privado. Es importante explicar al paciente que no existen respuestas correctas o incorrectas y que debe responder con sinceridad.',
  
  '{
    "cronbach_alpha": 0.92,
    "test_retest_reliability": 0.84,
    "concurrent_validity": 0.73,
    "sensitivity": 0.86,
    "specificity": 0.79,
    "estado_subscale_alpha": 0.92,
    "rasgo_subscale_alpha": 0.86
  }',
  
  'La diferenciación entre ansiedad estado y rasgo es fundamental para la interpretación clínica. Evite utilizar el término ansiedad durante la administración y refiérase al instrumento como cuestionario de autoevaluación.

Asegúrese de que el paciente comprenda la diferencia temporal entre las dos escalas: estado (ahora mismo) versus rasgo (en general).

No existen puntos de corte universales, se recomienda usar percentiles basados en población normativa según sexo y edad.',
  
  '{
    "reverseScored": [
      {"itemNumber": 1, "itemId": "stai-item-1", "subscale": "estado"},
      {"itemNumber": 2, "itemId": "stai-item-2", "subscale": "estado"},
      {"itemNumber": 5, "itemId": "stai-item-5", "subscale": "estado"},
      {"itemNumber": 21, "itemId": "stai-item-21", "subscale": "rasgo"}
    ],
    "alertTriggers": [
      {"itemNumber": 3, "itemId": "stai-item-3", "condition": "≥2"},
      {"itemNumber": 4, "itemId": "stai-item-4", "condition": "≥2"}
    ],
    "reverseItemsNote": "Ítems 1, 2, 5, 8, 10, 11, 15, 16, 19, 20 (Estado) y 21, 26, 27, 30, 33, 36, 39 (Rasgo) requieren puntuación invertida"
  }',
  
  'Versión 1.0 - Traducción y adaptación española validada. Propiedades psicométricas: Consistencia interna excelente (α = 0.87-0.93) y estabilidad temporal adecuada, especialmente para Ansiedad Rasgo.',
  
  'Adolescentes y adultos con un nivel cultural mínimo para comprender las instrucciones y enunciados del cuestionario. Especialmente útil en población clínica y de investigación.',
  
  'Interpretación: No existen puntos de corte universales, se recomienda usar percentiles basados en población normativa según sexo y edad.

Estado: Evalúa ansiedad como estado emocional transitorio que puede variar en intensidad y fluctuar en el tiempo.
Rasgo: Evalúa ansiedad como rasgo de personalidad relativamente estable y la predisposición a experimentar ansiedad.

A mayor seguimiento en el tiempo y mayor número de aplicaciones, el análisis de los patrones de ansiedad estado vs rasgo es más confiable.',
  
  NOW(),
  NOW()
);