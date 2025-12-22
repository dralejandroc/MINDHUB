-- ================================================
-- SCRIPT DE LIMPIEZA DE DUPLICADOS DE PACIENTES - MINDHUB
-- Resuelve duplicación de pacientes y corrige sistema de expedientes únicos
-- ================================================

-- PROBLEMA IDENTIFICADO:
-- - 3 pacientes triplicados (Ana Martínez Silva, Carlos Rodríguez, María González)
-- - Sistema de numeración de expedientes genera números aleatorios en lugar de únicos
-- - Total: 9 registros duplicados de 20 pacientes (45% de duplicación)

-- PASO 1: BACKUP DE SEGURIDAD
-- Crear tabla de backup antes de eliminar duplicados
CREATE TABLE IF NOT EXISTS patients_backup_duplicates AS 
SELECT * FROM patients WHERE is_active = true;

-- PASO 2: IDENTIFICAR DUPLICADOS DETALLADAMENTE
-- Mostrar todos los duplicados identificados
WITH duplicates_analysis AS (
    SELECT 
        first_name, 
        last_name, 
        paternal_last_name, 
        maternal_last_name, 
        date_of_birth,
        COUNT(*) as duplicate_count,
        STRING_AGG(id::text, ', ' ORDER BY created_at) as all_ids,
        STRING_AGG(medical_record_number, ', ' ORDER BY created_at) as all_mrns,
        MIN(created_at) as oldest_record,
        MAX(created_at) as newest_record
    FROM patients 
    WHERE is_active = true
    GROUP BY first_name, last_name, paternal_last_name, maternal_last_name, date_of_birth 
    HAVING COUNT(*) > 1
)
SELECT 
    'DUPLICATE ANALYSIS' as status,
    first_name || ' ' || COALESCE(paternal_last_name, '') || ' ' || COALESCE(maternal_last_name, '') as full_name,
    duplicate_count,
    all_ids,
    all_mrns,
    oldest_record,
    newest_record
FROM duplicates_analysis
ORDER BY duplicate_count DESC, first_name;

-- PASO 3: ELIMINAR DUPLICADOS (MANTENER EL REGISTRO MÁS ANTIGUO)
-- Para Ana Martínez Silva - mantener el primero (87c85937-2d31-4ff3-99a5-9e6c1e1ab45d)
DELETE FROM patients 
WHERE id IN (
    '7dbe6cf1-9ede-433b-b487-4f4a55033afa',
    'ccbf7c92-9f23-456b-997a-302ee5bf6ed0'
);

-- Para Carlos Rodríguez - mantener el primero (89134263-8c98-4f15-9de4-7c680a03e8f9)
DELETE FROM patients 
WHERE id IN (
    'a8be9cc8-3202-40fe-b9d2-d3c9400ba691',
    '16f37379-db47-4d0d-89f9-12d6ce14c49b'
);

-- Para María González - mantener el primero (9bb33fa9-821f-4d2d-a7ff-0025529f194d)
DELETE FROM patients 
WHERE id IN (
    'a16585ff-cc69-4229-bdd0-0ac659f21e65',
    '666c23b5-3a87-4f84-ad60-9b9f10ab6fb9'
);

-- PASO 4: CORREGIR NÚMEROS DE EXPEDIENTE CON SISTEMA ÚNICO
-- Actualizar números de expediente usando sistema basado en nombres + fecha de nacimiento
UPDATE patients 
SET medical_record_number = 
    'MRN-' || 
    EXTRACT(YEAR FROM date_of_birth)::text || 
    LPAD(EXTRACT(MONTH FROM date_of_birth)::text, 2, '0') || 
    LPAD(EXTRACT(DAY FROM date_of_birth)::text, 2, '0') || '-' ||
    UPPER(SUBSTRING(
        MD5(
            UPPER(COALESCE(first_name, '')) || 
            UPPER(COALESCE(paternal_last_name, '')) || 
            UPPER(COALESCE(maternal_last_name, ''))
        ), 1, 6
    ))
WHERE is_active = true;

-- PASO 5: CREAR CONSTRAINT ÚNICO PARA PREVENIR FUTUROS DUPLICADOS
-- Eliminar constraint si existe (para re-ejecutar script)
ALTER TABLE patients DROP CONSTRAINT IF EXISTS unique_patient_identity;

-- Crear constraint único basado en nombres completos + fecha de nacimiento
ALTER TABLE patients 
ADD CONSTRAINT unique_patient_identity 
UNIQUE (first_name, paternal_last_name, maternal_last_name, date_of_birth);

-- Constraint único para números de expediente
ALTER TABLE patients DROP CONSTRAINT IF EXISTS unique_medical_record_number;
ALTER TABLE patients 
ADD CONSTRAINT unique_medical_record_number 
UNIQUE (medical_record_number);

-- PASO 6: VERIFICAR RESULTADOS
-- Contar pacientes después de limpieza
SELECT 'CLEANUP RESULTS' as status, COUNT(*) as total_patients_after_cleanup 
FROM patients WHERE is_active = true;

-- Verificar que no hay duplicados
WITH remaining_duplicates AS (
    SELECT first_name, paternal_last_name, maternal_last_name, date_of_birth, COUNT(*) as count
    FROM patients 
    WHERE is_active = true
    GROUP BY first_name, paternal_last_name, maternal_last_name, date_of_birth 
    HAVING COUNT(*) > 1
)
SELECT 'DUPLICATE CHECK' as status, 
       CASE 
           WHEN COUNT(*) = 0 THEN 'SUCCESS - No duplicates found'
           ELSE 'ERROR - ' || COUNT(*) || ' duplicates still exist'
       END as result
FROM remaining_duplicates;

-- Mostrar nuevos números de expediente únicos
SELECT 
    'NEW MEDICAL RECORD NUMBERS' as status,
    first_name || ' ' || COALESCE(paternal_last_name, '') || ' ' || COALESCE(maternal_last_name, '') as full_name,
    medical_record_number,
    date_of_birth
FROM patients 
WHERE is_active = true 
ORDER BY medical_record_number;

-- PASO 7: VERIFICAR ACCESO DEL BUSCADOR
-- Test de búsqueda que debe funcionar después del cleanup
SELECT 
    'SEARCH TEST' as status,
    COUNT(*) as total_searchable_patients
FROM patients 
WHERE is_active = true 
  AND (first_name IS NOT NULL OR paternal_last_name IS NOT NULL OR email IS NOT NULL);

-- ================================================
-- RESULTADO ESPERADO:
-- ✅ 20 pacientes → 14 pacientes únicos (6 duplicados eliminados)
-- ✅ Números de expediente únicos basados en nombres + fecha nacimiento
-- ✅ Constraints para prevenir futuras duplicaciones
-- ✅ Sistema de buscador funcionará correctamente
-- ✅ Formato: MRN-YYYYMMDD-HASH6
-- ================================================