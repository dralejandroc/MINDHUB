-- EXECUTE THIS SQL MANUALLY IN SUPABASE DASHBOARD
-- Go to: https://supabase.com/dashboard/project/jvbcpldzoyicefdtnwkd/sql
-- Paste and run this SQL:

-- Add missing columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS education_level VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_history TEXT;

-- Verify the columns were created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('education_level', 'medical_history', 'occupation', 'address', 'phone')
ORDER BY column_name;

-- Show current count to verify table is working
SELECT COUNT(*) as total_patients FROM patients WHERE is_active = true;