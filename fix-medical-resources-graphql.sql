-- Fix GraphQL error: Unknown field 'file_path' on type 'medical_resources'
-- Execute manually in Supabase Dashboard SQL Editor

-- Option 1: Add the missing file_path column
ALTER TABLE medical_resources 
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Option 2: If you prefer to rename an existing column to file_path
-- (Check which column should actually be file_path)
-- ALTER TABLE medical_resources 
-- RENAME COLUMN old_column_name TO file_path;

-- Option 3: Update GraphQL schema to reflect actual column names
-- Check what columns actually exist in medical_resources
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'medical_resources' 
ORDER BY ordinal_position;

-- Verify the change worked
SELECT file_path FROM medical_resources LIMIT 1;