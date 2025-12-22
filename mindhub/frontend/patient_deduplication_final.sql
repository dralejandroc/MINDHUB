-- ================================================================================================
-- MINDHUB PATIENT DEDUPLICATION - PRODUCTION READY SCRIPT
-- ================================================================================================
-- VALIDATED RESULTS: 3 duplicate groups found (9 total records, 6 will be deleted)
--
-- 1. Ana Martínez Silva (3 records) - KEEP: MRN-003-2025, DELETE: 2 others
-- 2. Carlos Rodríguez Hernández (3 records) - KEEP: MRN-002-2025, DELETE: 2 others  
-- 3. María González López (3 records) - KEEP: MRN-001-2025, DELETE: 2 others
--
-- SAFETY: All duplicate records have NO related appointments or consultations
-- ================================================================================================

-- STEP 1: PREVIEW MODE - Show exactly what will be deleted
-- ================================================================================================

SELECT 
    '🔍 DUPLICATE ANALYSIS PREVIEW' as status,
    COUNT(DISTINCT CASE WHEN action = 'DELETE' THEN patient_id END) as records_to_delete,
    COUNT(DISTINCT CASE WHEN action = 'KEEP (Oldest)' THEN patient_id END) as records_to_keep,
    COUNT(DISTINCT (full_name || '|' || date_of_birth::text)) as duplicate_groups
FROM (
    WITH duplicate_groups AS (
        SELECT 
            LOWER(TRIM(COALESCE(first_name, ''))) as norm_first_name,
            LOWER(TRIM(COALESCE(paternal_last_name, ''))) as norm_paternal,
            LOWER(TRIM(COALESCE(maternal_last_name, ''))) as norm_maternal,
            date_of_birth,
            user_id,
            COUNT(*) as duplicate_count
        FROM patients 
        WHERE first_name IS NOT NULL 
          AND date_of_birth IS NOT NULL 
          AND user_id IS NOT NULL
        GROUP BY 
            LOWER(TRIM(COALESCE(first_name, ''))),
            LOWER(TRIM(COALESCE(paternal_last_name, ''))),
            LOWER(TRIM(COALESCE(maternal_last_name, ''))),
            date_of_birth,
            user_id
        HAVING COUNT(*) > 1
    )
    SELECT 
        dg.norm_first_name || ' ' || dg.norm_paternal || ' ' || dg.norm_maternal as full_name,
        dg.date_of_birth,
        p.id as patient_id,
        p.medical_record_number,
        p.email,
        p.created_at,
        CASE 
            WHEN p.created_at = MIN(p.created_at) OVER (
                PARTITION BY dg.norm_first_name, dg.norm_paternal, dg.norm_maternal, dg.date_of_birth, dg.user_id
            ) THEN 'KEEP (Oldest)'
            ELSE 'DELETE'
        END as action
    FROM duplicate_groups dg
    INNER JOIN patients p ON (
        LOWER(TRIM(COALESCE(p.first_name, ''))) = dg.norm_first_name
        AND LOWER(TRIM(COALESCE(p.paternal_last_name, ''))) = dg.norm_paternal
        AND LOWER(TRIM(COALESCE(p.maternal_last_name, ''))) = dg.norm_maternal
        AND p.date_of_birth = dg.date_of_birth
        AND p.user_id = dg.user_id
    )
) preview_data;

-- STEP 2: DETAILED VIEW - Show all records and actions
-- ================================================================================================

WITH duplicate_groups AS (
    SELECT 
        LOWER(TRIM(COALESCE(first_name, ''))) as norm_first_name,
        LOWER(TRIM(COALESCE(paternal_last_name, ''))) as norm_paternal,
        LOWER(TRIM(COALESCE(maternal_last_name, ''))) as norm_maternal,
        date_of_birth,
        user_id,
        COUNT(*) as duplicate_count
    FROM patients 
    WHERE first_name IS NOT NULL 
      AND date_of_birth IS NOT NULL 
      AND user_id IS NOT NULL
    GROUP BY 
        LOWER(TRIM(COALESCE(first_name, ''))),
        LOWER(TRIM(COALESCE(paternal_last_name, ''))),
        LOWER(TRIM(COALESCE(maternal_last_name, ''))),
        date_of_birth,
        user_id
    HAVING COUNT(*) > 1
)
SELECT 
    '📋 DETAILED PREVIEW' as section,
    dg.norm_first_name || ' ' || dg.norm_paternal || ' ' || dg.norm_maternal as full_name,
    dg.date_of_birth,
    dg.duplicate_count as total_duplicates,
    p.id as patient_id,
    p.medical_record_number,
    p.email,
    p.created_at,
    CASE 
        WHEN p.created_at = MIN(p.created_at) OVER (
            PARTITION BY dg.norm_first_name, dg.norm_paternal, dg.norm_maternal, dg.date_of_birth, dg.user_id
        ) THEN '✅ KEEP (Oldest)'
        ELSE '❌ DELETE'
    END as action
FROM duplicate_groups dg
INNER JOIN patients p ON (
    LOWER(TRIM(COALESCE(p.first_name, ''))) = dg.norm_first_name
    AND LOWER(TRIM(COALESCE(p.paternal_last_name, ''))) = dg.norm_paternal
    AND LOWER(TRIM(COALESCE(p.maternal_last_name, ''))) = dg.norm_maternal
    AND p.date_of_birth = dg.date_of_birth
    AND p.user_id = dg.user_id
)
ORDER BY 
    dg.norm_first_name,
    dg.norm_paternal,
    dg.norm_maternal,
    p.created_at;

-- ================================================================================================
-- STEP 3: SAFETY CHECK - Verify no related records exist
-- ================================================================================================

WITH duplicates_to_delete AS (
    WITH duplicate_groups AS (
        SELECT 
            LOWER(TRIM(COALESCE(first_name, ''))) as norm_first_name,
            LOWER(TRIM(COALESCE(paternal_last_name, ''))) as norm_paternal,
            LOWER(TRIM(COALESCE(maternal_last_name, ''))) as norm_maternal,
            date_of_birth,
            user_id,
            COUNT(*) as duplicate_count
        FROM patients 
        WHERE first_name IS NOT NULL 
          AND date_of_birth IS NOT NULL 
          AND user_id IS NOT NULL
        GROUP BY 
            LOWER(TRIM(COALESCE(first_name, ''))),
            LOWER(TRIM(COALESCE(paternal_last_name, ''))),
            LOWER(TRIM(COALESCE(maternal_last_name, ''))),
            date_of_birth,
            user_id
        HAVING COUNT(*) > 1
    )
    SELECT p.id as patient_id
    FROM duplicate_groups dg
    INNER JOIN patients p ON (
        LOWER(TRIM(COALESCE(p.first_name, ''))) = dg.norm_first_name
        AND LOWER(TRIM(COALESCE(p.paternal_last_name, ''))) = dg.norm_paternal
        AND LOWER(TRIM(COALESCE(p.maternal_last_name, ''))) = dg.norm_maternal
        AND p.date_of_birth = dg.date_of_birth
        AND p.user_id = dg.user_id
    )
    WHERE p.created_at != (
        SELECT MIN(sub_p.created_at)
        FROM patients sub_p
        WHERE LOWER(TRIM(COALESCE(sub_p.first_name, ''))) = dg.norm_first_name
          AND LOWER(TRIM(COALESCE(sub_p.paternal_last_name, ''))) = dg.norm_paternal
          AND LOWER(TRIM(COALESCE(sub_p.maternal_last_name, ''))) = dg.norm_maternal
          AND sub_p.date_of_birth = dg.date_of_birth
          AND sub_p.user_id = dg.user_id
    )
)
SELECT 
    '🛡️ SAFETY CHECK' as section,
    'appointments' as table_name,
    COUNT(*) as related_records_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SAFE TO PROCEED'
        ELSE '⚠️ WARNING: Related records exist!'
    END as safety_status
FROM duplicates_to_delete dtd
LEFT JOIN appointments a ON dtd.patient_id = a.patient_id

UNION ALL

SELECT 
    '🛡️ SAFETY CHECK' as section,
    'consultations' as table_name,
    COUNT(*) as related_records_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SAFE TO PROCEED'
        ELSE '⚠️ WARNING: Related records exist!'
    END as safety_status
FROM duplicates_to_delete dtd
LEFT JOIN consultations c ON dtd.patient_id = c.patient_id;

-- ================================================================================================
-- STEP 4: EXECUTION COMMANDS (Run these manually after review)
-- ================================================================================================

/*
-- 🚨 IMPORTANT: Only run these DELETE commands after reviewing the above results!
-- 
-- These are the specific DELETE commands for the identified duplicates:

-- Delete Ana Martínez Silva duplicates (keep MRN-003-2025)
DELETE FROM patients WHERE id = '7dbe6cf1-9ede-433b-b487-4f4a55033afa'; -- MRN-003-1755871376211
DELETE FROM patients WHERE id = 'ccbf7c92-9f23-456b-997a-302ee5bf6ed0'; -- MRN-003-1755871397386

-- Delete Carlos Rodríguez Hernández duplicates (keep MRN-002-2025)  
DELETE FROM patients WHERE id = 'a8be9cc8-3202-40fe-b9d2-d3c9400ba691'; -- MRN-002-1755871376211
DELETE FROM patients WHERE id = '16f37379-db47-4d0d-89f9-12d6ce14c49b'; -- MRN-002-1755871397386

-- Delete María González López duplicates (keep MRN-001-2025)
DELETE FROM patients WHERE id = 'a16585ff-cc69-4229-bdd0-0ac659f21e65'; -- MRN-001-1755871376211  
DELETE FROM patients WHERE id = '666c23b5-3a87-4f84-ad60-9b9f10ab6fb9'; -- MRN-001-1755871397386

-- Verification query (run after deletions to confirm success):
SELECT 
    'POST-DELETION VERIFICATION' as status,
    first_name,
    paternal_last_name,
    maternal_last_name, 
    date_of_birth,
    COUNT(*) as remaining_count
FROM patients 
WHERE (first_name = 'Ana' AND paternal_last_name = 'Martínez' AND maternal_last_name = 'Silva')
   OR (first_name = 'Carlos' AND paternal_last_name = 'Rodríguez' AND maternal_last_name = 'Hernández')  
   OR (first_name = 'María' AND paternal_last_name = 'González' AND maternal_last_name = 'López')
GROUP BY first_name, paternal_last_name, maternal_last_name, date_of_birth
ORDER BY first_name;

*/

-- ================================================================================================
-- FINAL NOTE: 
-- After running the DELETE commands above, each patient should have only 1 record remaining.
-- This will resolve the duplicate medical record number issue reported in Expedix.
-- ================================================================================================