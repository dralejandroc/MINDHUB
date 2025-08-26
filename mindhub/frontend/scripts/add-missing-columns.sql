-- Add missing columns to patients table
-- These are required by the frontend forms

-- Add education_level column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'education_level'
    ) THEN
        ALTER TABLE patients ADD COLUMN education_level VARCHAR(100);
        RAISE NOTICE 'Added education_level column';
    ELSE
        RAISE NOTICE 'education_level column already exists';
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('education_level', 'occupation', 'address', 'phone', 'emergency_contact_name', 'emergency_contact_phone')
ORDER BY column_name;

-- Show current count of patients
SELECT COUNT(*) as total_patients FROM patients WHERE is_active = true;