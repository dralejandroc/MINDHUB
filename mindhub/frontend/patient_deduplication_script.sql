-- ================================================================================================
-- MINDHUB PATIENT DEDUPLICATION SCRIPT
-- ================================================================================================
-- Purpose: Identify and safely remove duplicate patient records based on:
--          - Exact match of first_name + paternal_last_name + maternal_last_name + date_of_birth
--          - Same user_id (patients belonging to the same healthcare provider)
-- 
-- Safety Features:
--          - DRY RUN mode to preview changes before execution
--          - Keeps the oldest record (earliest created_at)
--          - Comprehensive logging of all actions
--          - Backup identification before deletion
-- 
-- Usage:
--          1. First run in DRY_RUN mode: \set DRY_RUN true
--          2. Review the output carefully
--          3. Run in execution mode: \set DRY_RUN false
-- 
-- Target Case: Ana Martínez Silva has 3 duplicate records with different medical record numbers
-- ================================================================================================

-- Set DRY_RUN mode (change to false when ready to execute)
\set DRY_RUN true

-- Create temporary logging table for this session
DROP TABLE IF EXISTS temp_deduplication_log;
CREATE TEMP TABLE temp_deduplication_log (
    log_timestamp TIMESTAMP DEFAULT NOW(),
    action_type VARCHAR(50),
    patient_id UUID,
    medical_record_number TEXT,
    full_name TEXT,
    date_of_birth DATE,
    user_id UUID,
    created_at TIMESTAMP,
    message TEXT
);

-- ================================================================================================
-- STEP 1: IDENTIFY ALL DUPLICATE GROUPS
-- ================================================================================================

DO $$
DECLARE
    dry_run BOOLEAN := :'DRY_RUN'::BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================================================================';
    RAISE NOTICE 'MINDHUB PATIENT DEDUPLICATION SCRIPT';
    RAISE NOTICE '================================================================================================';
    RAISE NOTICE 'Mode: %', CASE WHEN dry_run THEN 'DRY RUN (Preview Only)' ELSE 'EXECUTION MODE' END;
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '';
END $$;

-- Identify duplicate groups and log them
INSERT INTO temp_deduplication_log (action_type, patient_id, medical_record_number, full_name, date_of_birth, user_id, created_at, message)
SELECT 
    'DUPLICATE_GROUP_MEMBER',
    p.id,
    p.medical_record_number,
    TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.paternal_last_name, '') || ' ' || COALESCE(p.maternal_last_name, '')),
    p.date_of_birth,
    p.user_id,
    p.created_at,
    'Found in duplicate group of ' || dup_counts.duplicate_count || ' patients'
FROM patients p
INNER JOIN (
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
) dup_counts ON (
    LOWER(TRIM(COALESCE(p.first_name, ''))) = dup_counts.norm_first_name
    AND LOWER(TRIM(COALESCE(p.paternal_last_name, ''))) = dup_counts.norm_paternal
    AND LOWER(TRIM(COALESCE(p.maternal_last_name, ''))) = dup_counts.norm_maternal
    AND p.date_of_birth = dup_counts.date_of_birth
    AND p.user_id = dup_counts.user_id
)
ORDER BY 
    dup_counts.norm_first_name,
    dup_counts.norm_paternal,
    dup_counts.norm_maternal,
    p.created_at;

-- ================================================================================================
-- STEP 2: DISPLAY DUPLICATE GROUPS SUMMARY
-- ================================================================================================

DO $$
DECLARE
    duplicate_groups_count INTEGER;
    total_duplicates INTEGER;
    rec RECORD;
BEGIN
    -- Count duplicate groups
    SELECT COUNT(DISTINCT (full_name || '|' || date_of_birth::TEXT || '|' || user_id::TEXT))
    INTO duplicate_groups_count
    FROM temp_deduplication_log 
    WHERE action_type = 'DUPLICATE_GROUP_MEMBER';
    
    -- Count total duplicate records
    SELECT COUNT(*)
    INTO total_duplicates
    FROM temp_deduplication_log 
    WHERE action_type = 'DUPLICATE_GROUP_MEMBER';
    
    RAISE NOTICE 'DUPLICATE ANALYSIS SUMMARY:';
    RAISE NOTICE '- Duplicate Groups Found: %', duplicate_groups_count;
    RAISE NOTICE '- Total Duplicate Records: %', total_duplicates;
    RAISE NOTICE '- Records to be Removed: %', total_duplicates - duplicate_groups_count;
    RAISE NOTICE '';
    
    -- Display each duplicate group
    RAISE NOTICE 'DETAILED DUPLICATE GROUPS:';
    RAISE NOTICE '';
    
    FOR rec IN (
        SELECT 
            full_name,
            date_of_birth,
            user_id,
            COUNT(*) as duplicate_count,
            MIN(created_at) as oldest_record,
            MAX(created_at) as newest_record
        FROM temp_deduplication_log 
        WHERE action_type = 'DUPLICATE_GROUP_MEMBER'
        GROUP BY full_name, date_of_birth, user_id
        ORDER BY full_name
    ) LOOP
        RAISE NOTICE 'Patient: % (DOB: %)', rec.full_name, rec.date_of_birth;
        RAISE NOTICE '  User ID: %', rec.user_id;
        RAISE NOTICE '  Duplicates: % records', rec.duplicate_count;
        RAISE NOTICE '  Date Range: % to %', rec.oldest_record, rec.newest_record;
        
        -- Show individual records in this group
        FOR rec IN (
            SELECT 
                patient_id,
                medical_record_number,
                created_at,
                CASE 
                    WHEN created_at = (
                        SELECT MIN(created_at) 
                        FROM temp_deduplication_log sub 
                        WHERE sub.full_name = temp_deduplication_log.full_name 
                          AND sub.date_of_birth = temp_deduplication_log.date_of_birth 
                          AND sub.user_id = temp_deduplication_log.user_id
                    ) THEN 'KEEP (Oldest)'
                    ELSE 'DELETE'
                END as action
            FROM temp_deduplication_log 
            WHERE action_type = 'DUPLICATE_GROUP_MEMBER'
              AND full_name = rec.full_name
              AND date_of_birth = rec.date_of_birth
              AND user_id = rec.user_id
            ORDER BY created_at
        ) LOOP
            RAISE NOTICE '    ID: % | MRN: % | Created: % | Action: %', 
                rec.patient_id, rec.medical_record_number, rec.created_at, rec.action;
        END LOOP;
        
        RAISE NOTICE '';
    END LOOP;
END $$;

-- ================================================================================================
-- STEP 3: CHECK FOR RELATED RECORDS (SAFETY CHECK)
-- ================================================================================================

DO $$
DECLARE
    rec RECORD;
    related_count INTEGER;
BEGIN
    RAISE NOTICE 'SAFETY CHECK: Checking for related records...';
    RAISE NOTICE '';
    
    -- Check for appointments
    FOR rec IN (
        SELECT 
            l.patient_id,
            l.full_name,
            COUNT(a.id) as appointment_count
        FROM temp_deduplication_log l
        LEFT JOIN appointments a ON l.patient_id = a.patient_id
        WHERE l.action_type = 'DUPLICATE_GROUP_MEMBER'
          AND l.created_at != (
              SELECT MIN(sub.created_at) 
              FROM temp_deduplication_log sub 
              WHERE sub.full_name = l.full_name 
                AND sub.date_of_birth = l.date_of_birth 
                AND sub.user_id = l.user_id
          )
        GROUP BY l.patient_id, l.full_name
        HAVING COUNT(a.id) > 0
    ) LOOP
        RAISE NOTICE 'WARNING: Patient % (ID: %) has % appointments and would be deleted!', 
            rec.full_name, rec.patient_id, rec.appointment_count;
    END LOOP;
    
    -- Check for consultations
    FOR rec IN (
        SELECT 
            l.patient_id,
            l.full_name,
            COUNT(c.id) as consultation_count
        FROM temp_deduplication_log l
        LEFT JOIN consultations c ON l.patient_id = c.patient_id
        WHERE l.action_type = 'DUPLICATE_GROUP_MEMBER'
          AND l.created_at != (
              SELECT MIN(sub.created_at) 
              FROM temp_deduplication_log sub 
              WHERE sub.full_name = l.full_name 
                AND sub.date_of_birth = l.date_of_birth 
                AND sub.user_id = l.user_id
          )
        GROUP BY l.patient_id, l.full_name
        HAVING COUNT(c.id) > 0
    ) LOOP
        RAISE NOTICE 'WARNING: Patient % (ID: %) has % consultations and would be deleted!', 
            rec.full_name, rec.patient_id, rec.consultation_count;
    END LOOP;
    
    RAISE NOTICE 'Safety check completed.';
    RAISE NOTICE '';
END $$;

-- ================================================================================================
-- STEP 4: EXECUTE DEDUPLICATION (Only if not in DRY_RUN mode)
-- ================================================================================================

DO $$
DECLARE
    dry_run BOOLEAN := :'DRY_RUN'::BOOLEAN;
    rec RECORD;
    deleted_count INTEGER := 0;
BEGIN
    IF dry_run THEN
        RAISE NOTICE 'DRY RUN MODE: No changes will be made to the database.';
        RAISE NOTICE 'To execute the deduplication, set DRY_RUN to false and run again.';
        RAISE NOTICE '';
        RETURN;
    END IF;
    
    RAISE NOTICE 'EXECUTING DEDUPLICATION...';
    RAISE NOTICE '';
    
    -- Delete duplicate records (keeping the oldest)
    FOR rec IN (
        SELECT 
            patient_id,
            full_name,
            medical_record_number
        FROM temp_deduplication_log 
        WHERE action_type = 'DUPLICATE_GROUP_MEMBER'
          AND created_at != (
              SELECT MIN(sub.created_at) 
              FROM temp_deduplication_log sub 
              WHERE sub.full_name = temp_deduplication_log.full_name 
                AND sub.date_of_birth = temp_deduplication_log.date_of_birth 
                AND sub.user_id = temp_deduplication_log.user_id
          )
    ) LOOP
        DELETE FROM patients WHERE id = rec.patient_id;
        deleted_count := deleted_count + 1;
        
        RAISE NOTICE 'DELETED: % (ID: %, MRN: %)', 
            rec.full_name, rec.patient_id, rec.medical_record_number;
        
        -- Log the deletion
        INSERT INTO temp_deduplication_log (action_type, patient_id, message)
        VALUES ('DELETED', rec.patient_id, 'Successfully deleted duplicate record');
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'DEDUPLICATION COMPLETED!';
    RAISE NOTICE 'Total records deleted: %', deleted_count;
    RAISE NOTICE '';
END $$;

-- ================================================================================================
-- STEP 5: FINAL VERIFICATION
-- ================================================================================================

DO $$
DECLARE
    remaining_duplicates INTEGER;
BEGIN
    RAISE NOTICE 'FINAL VERIFICATION:';
    
    -- Check if any duplicates remain
    SELECT COUNT(*)
    INTO remaining_duplicates
    FROM (
        SELECT 
            LOWER(TRIM(COALESCE(first_name, ''))),
            LOWER(TRIM(COALESCE(paternal_last_name, ''))),
            LOWER(TRIM(COALESCE(maternal_last_name, ''))),
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
    ) remaining;
    
    RAISE NOTICE 'Remaining duplicate groups: %', remaining_duplicates;
    
    IF remaining_duplicates = 0 THEN
        RAISE NOTICE 'SUCCESS: No duplicate patients remain in the database!';
    ELSE
        RAISE NOTICE 'WARNING: % duplicate groups still exist. Manual review may be needed.', remaining_duplicates;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Script execution completed at: %', NOW();
    RAISE NOTICE '================================================================================================';
END $$;

-- ================================================================================================
-- BONUS: SPECIFIC ANA MARTÍNEZ SILVA CHECK
-- ================================================================================================

DO $$
DECLARE
    ana_count INTEGER;
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'SPECIFIC CHECK: Ana Martínez Silva records';
    RAISE NOTICE '';
    
    SELECT COUNT(*)
    INTO ana_count
    FROM patients 
    WHERE LOWER(first_name) = 'ana' 
      AND LOWER(paternal_last_name) = 'martínez' 
      AND LOWER(maternal_last_name) = 'silva'
      AND date_of_birth = '1992-11-08';
    
    RAISE NOTICE 'Ana Martínez Silva records found: %', ana_count;
    
    IF ana_count > 0 THEN
        FOR rec IN (
            SELECT 
                id,
                medical_record_number,
                email,
                created_at
            FROM patients 
            WHERE LOWER(first_name) = 'ana' 
              AND LOWER(paternal_last_name) = 'martínez' 
              AND LOWER(maternal_last_name) = 'silva'
              AND date_of_birth = '1992-11-08'
            ORDER BY created_at
        ) LOOP
            RAISE NOTICE '  ID: % | MRN: % | Email: % | Created: %', 
                rec.id, rec.medical_record_number, rec.email, rec.created_at;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
END $$;

-- Display final summary from log
SELECT 
    action_type,
    COUNT(*) as count
FROM temp_deduplication_log 
GROUP BY action_type
ORDER BY action_type;

-- Show all log entries
SELECT 
    log_timestamp,
    action_type,
    patient_id,
    medical_record_number,
    full_name,
    message
FROM temp_deduplication_log 
ORDER BY log_timestamp;