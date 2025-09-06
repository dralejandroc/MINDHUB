-- Fix consultations dual owner constraint - FINAL VERSION
-- This script fixes the database constraint that prevents consultation creation

-- First, check if the constraint exists and what it looks like
DO $$ 
DECLARE
    constraint_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'consultations' 
        AND constraint_name = 'check_consultations_dual_owner'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Constraint check_consultations_dual_owner exists, dropping it...';
        ALTER TABLE consultations DROP CONSTRAINT check_consultations_dual_owner;
    ELSE
        RAISE NOTICE 'Constraint check_consultations_dual_owner does not exist';
    END IF;
END $$;

-- Make clinic_id nullable for individual licenses
ALTER TABLE consultations ALTER COLUMN clinic_id DROP NOT NULL;

-- Recreate the constraint with proper logic
ALTER TABLE consultations ADD CONSTRAINT check_consultations_dual_owner 
CHECK (
    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
    (clinic_id IS NULL AND workspace_id IS NOT NULL)
);

-- Create index for performance (without CONCURRENTLY since it can't run in transaction)
CREATE INDEX IF NOT EXISTS idx_consultations_clinic_id ON consultations(clinic_id) WHERE clinic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultations_workspace_id ON consultations(workspace_id) WHERE workspace_id IS NOT NULL;

-- Verify the constraint
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'consultations' 
AND tc.constraint_type = 'CHECK'
AND tc.constraint_name = 'check_consultations_dual_owner';

COMMIT;