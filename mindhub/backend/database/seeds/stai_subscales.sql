-- Subescalas para STAI
-- Estado (ítems 1-20) y Rasgo (ítems 21-40)

-- STAI Estado - Ítems 1-20
INSERT INTO scale_subscales (
  id, scale_id, subscale_name, items, min_score, max_score, 
  description, created_at, updated_at
) VALUES (
  'stai-estado',
  'stai',
  'STAI Estado',
  '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]',
  20,
  80,
  'Ansiedad Estado: Mide la ansiedad como estado emocional transitorio, caracterizada por sentimientos subjetivos de tensión, aprensión, nerviosismo y preocupación.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- STAI Rasgo - Ítems 21-40  
INSERT INTO scale_subscales (
  id, scale_id, subscale_name, items, min_score, max_score,
  description, created_at, updated_at
) VALUES (
  'stai-rasgo',
  'stai', 
  'STAI Rasgo',
  '[21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40]',
  20,
  80,
  'Ansiedad Rasgo: Mide la ansiedad como rasgo de personalidad relativamente estable, tendencia a percibir las situaciones como amenazantes.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);