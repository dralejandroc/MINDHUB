-- Fix STAI response options
-- Current: PHQ-9 options (Nunca, Varios días, etc.)
-- Correct: STAI options (Nada, Algo, Bastante, Mucho)

UPDATE scale_response_options 
SET option_label = CASE 
  WHEN option_value = '0' THEN 'Nada'
  WHEN option_value = '1' THEN 'Algo' 
  WHEN option_value = '2' THEN 'Bastante'
  WHEN option_value = '3' THEN 'Mucho'
END
WHERE scale_id = 'stai';

-- Verify the changes
SELECT scale_id, option_value, option_label, score_value 
FROM scale_response_options 
WHERE scale_id = 'stai' 
ORDER BY display_order;