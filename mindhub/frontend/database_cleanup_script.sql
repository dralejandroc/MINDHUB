-- SCRIPT DE LIMPIEZA PARA DATOS INCONSISTENTES
-- Problema: Usuarios con clinic_id Y individual_workspace_id al mismo tiempo
-- Esto viola la restricción check_consultations_dual_owner

-- ANÁLISIS DEL PROBLEMA IDENTIFICADO:
-- Usuario: dr_aleks_c@hotmail.com (ID: a1c193e9-643a-4ba9-9214-29536ea93913)
-- Tiene license_type = 'clinic' pero ambos workspace fields poblados

-- PASO 1: Verificar datos antes de la limpieza
SELECT 
    'ANTES DE LIMPIEZA' as estado,
    id, 
    license_type, 
    clinic_id, 
    individual_workspace_id,
    email
FROM profiles 
WHERE clinic_id IS NOT NULL AND individual_workspace_id IS NOT NULL;

-- PASO 2: LIMPIEZA DE DATOS INCONSISTENTES

-- Caso 1: Si license_type = 'clinic' → eliminar individual_workspace_id
UPDATE profiles 
SET individual_workspace_id = NULL 
WHERE clinic_id IS NOT NULL 
  AND individual_workspace_id IS NOT NULL 
  AND license_type = 'clinic';

-- Caso 2: Si license_type = 'individual' → eliminar clinic_id  
UPDATE profiles 
SET clinic_id = NULL 
WHERE clinic_id IS NOT NULL 
  AND individual_workspace_id IS NOT NULL 
  AND license_type = 'individual';

-- Caso 3: Si no hay license_type pero hay clinic_id → asumir clinic license
UPDATE profiles 
SET individual_workspace_id = NULL,
    license_type = 'clinic'
WHERE clinic_id IS NOT NULL 
  AND individual_workspace_id IS NOT NULL 
  AND license_type IS NULL;

-- PASO 3: Verificar datos después de la limpieza
SELECT 
    'DESPUÉS DE LIMPIEZA' as estado,
    id, 
    license_type, 
    clinic_id, 
    individual_workspace_id,
    email
FROM profiles 
WHERE clinic_id IS NOT NULL AND individual_workspace_id IS NOT NULL;

-- PASO 4: Verificar que todos los perfiles tengan exactamente un workspace
SELECT 
    'VERIFICACIÓN FINAL' as estado,
    COUNT(*) as total_profiles,
    SUM(CASE WHEN clinic_id IS NOT NULL AND individual_workspace_id IS NULL THEN 1 ELSE 0 END) as solo_clinic,
    SUM(CASE WHEN clinic_id IS NULL AND individual_workspace_id IS NOT NULL THEN 1 ELSE 0 END) as solo_individual,
    SUM(CASE WHEN clinic_id IS NOT NULL AND individual_workspace_id IS NOT NULL THEN 1 ELSE 0 END) as dual_populated_ERROR,
    SUM(CASE WHEN clinic_id IS NULL AND individual_workspace_id IS NULL THEN 1 ELSE 0 END) as sin_workspace_ERROR
FROM profiles;

-- RESULTADO ESPERADO:
-- - dual_populated_ERROR = 0 (no debería haber usuarios con ambos campos)
-- - sin_workspace_ERROR = 0 (todos deben tener al menos un workspace)
-- - La suma de solo_clinic + solo_individual debe ser igual a total_profiles