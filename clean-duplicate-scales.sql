-- Script para limpiar escalas duplicadas en ClinimetrixPro
-- Ejecutar manualmente en el Dashboard de Supabase

-- 1. PHQ-9: Eliminar el registro sin descripción
DELETE FROM clinimetrix_registry 
WHERE id = 'registry-phq9-1.0' 
  AND abbreviation = 'PHQ-9' 
  AND description IS NULL;

-- 2. IPDE DSM-IV: Eliminar el registro menos completo (ipde_dsmiv)
-- Mantener el registro 'ipde_dsm_iv' que tiene mejor descripción
DELETE FROM clinimetrix_registry 
WHERE id = 'ipde_dsmiv' 
  AND abbreviation = 'IPDE DSM-IV';

-- Verificar que no queden duplicados
SELECT abbreviation, COUNT(*) as count, array_agg(id) as remaining_ids
FROM clinimetrix_registry 
GROUP BY abbreviation 
HAVING COUNT(*) > 1 
ORDER BY abbreviation;

-- Verificar los registros que quedaron
SELECT id, abbreviation, name, description
FROM clinimetrix_registry 
WHERE abbreviation IN ('PHQ-9', 'IPDE DSM-IV')
ORDER BY abbreviation;