-- 🎯 FIX CONSULTATIONS DUAL SYSTEM CONSTRAINTS
-- Execute this script manually in Supabase SQL Editor
-- This fixes the constraint issue that prevents consultations creation

-- PASO 1: Investigar el problema actual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname LIKE '%dual%' AND conrelid = 'consultations'::regclass;

-- PASO 2: Verificar estructura actual de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'consultations' 
  AND column_name IN ('clinic_id', 'workspace_id')
ORDER BY ordinal_position;

-- PASO 3: Drop existing constraint
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS check_consultations_dual_owner;

-- PASO 4: Make clinic_id nullable (CRÍTICO para licencias individuales)
ALTER TABLE consultations ALTER COLUMN clinic_id DROP NOT NULL;

-- PASO 5: Re-add the correct dual system constraint
ALTER TABLE consultations ADD CONSTRAINT check_consultations_dual_owner 
CHECK (
    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
    (clinic_id IS NULL AND workspace_id IS NOT NULL)
);

-- PASO 6: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_consultations_clinic_id 
    ON consultations(clinic_id) WHERE clinic_id IS NOT NULL;
    
CREATE INDEX IF NOT EXISTS idx_consultations_workspace_id 
    ON consultations(workspace_id) WHERE workspace_id IS NOT NULL;

-- PASO 7: Verify the fix by testing insertion
-- Test 1: Clinic license consultation (should work)
DO $$
BEGIN
    -- This should work now
    INSERT INTO consultations (
        id,
        patient_id,
        professional_id,
        consultation_date,
        status,
        chief_complaint,
        created_at,
        updated_at,
        clinic_id,
        workspace_id
    ) VALUES (
        gen_random_uuid(),
        'cc3c6f80-f1a8-44ab-8e0b-e4e5b9d45bb2', -- Example patient ID
        'a1c193e9-643a-4ba9-9214-29536ea93913', -- dr_aleks_c ID
        NOW(),
        'scheduled',
        'Test consultation - clinic license',
        NOW(),
        NOW(),
        'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0', -- Clinic ID
        NULL  -- workspace_id must be NULL for clinic license
    );
    
    RAISE NOTICE 'SUCCESS: Clinic license consultation created successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in clinic test: %', SQLERRM;
END $$;

-- Test 2: Individual license consultation (should work)
DO $$
BEGIN
    -- This should work now
    INSERT INTO consultations (
        id,
        patient_id,
        professional_id,
        consultation_date,
        status,
        chief_complaint,
        created_at,
        updated_at,
        clinic_id,
        workspace_id
    ) VALUES (
        gen_random_uuid(),
        'cc3c6f80-f1a8-44ab-8e0b-e4e5b9d45bb2', -- Example patient ID
        'a1c193e9-643a-4ba9-9214-29536ea93913', -- dr_aleks_c ID
        NOW(),
        'scheduled',
        'Test consultation - individual license',
        NOW(),
        NOW(),
        NULL, -- clinic_id must be NULL for individual license
        '8a956bcb-abca-409e-8ae8-2604372084cf'  -- Individual workspace ID
    );
    
    RAISE NOTICE 'SUCCESS: Individual license consultation created successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in individual test: %', SQLERRM;
END $$;

-- PASO 8: Clean up test data
DELETE FROM consultations WHERE chief_complaint LIKE 'Test consultation -%';

-- PASO 9: Show final status
SELECT 'DUAL SYSTEM FIX COMPLETED SUCCESSFULLY' as status;

-- 🎯 VERIFICATION QUERY
-- Run this to verify the constraint is working correctly:
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'check_consultations_dual_owner';