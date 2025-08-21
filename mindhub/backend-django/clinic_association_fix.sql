-- MindHub Clinic Association Fix Script
-- Date: 2025-08-21T20:17:33.587420+00:00
-- User: Dr. Alejandro (dr_aleks_c@hotmail.com)
-- User ID: a1c193e9-643a-4ba9-9214-29536ea93913
-- Clinic ID: bf005c17-508f-4d3e-aee0-cb2d87f1a5d0

-- Step 1: Check current user profile
SELECT 
    id,
    email,
    clinic_id,
    clinic_role,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE id = 'a1c193e9-643a-4ba9-9214-29536ea93913';

-- Step 2: Verify clinic exists
SELECT 
    id,
    name,
    created_by,
    is_active,
    created_at
FROM clinics 
WHERE id = 'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0';

-- Step 3: Update user profile to associate with clinic
UPDATE profiles 
SET 
    clinic_id = 'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0',
    clinic_role = 'clinic_owner',
    role = 'admin',
    updated_at = NOW()
WHERE id = 'a1c193e9-643a-4ba9-9214-29536ea93913';

-- Step 4: Update patients without clinic association
UPDATE patients 
SET 
    clinic_id = 'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0',
    updated_at = NOW()
WHERE clinic_id IS NULL;

-- Step 5: Verify the fix
SELECT 
    p.id as user_id,
    p.email,
    p.clinic_id,
    p.clinic_role,
    p.role,
    c.name as clinic_name,
    c.is_active as clinic_active
FROM profiles p
LEFT JOIN clinics c ON p.clinic_id = c.id
WHERE p.id = 'a1c193e9-643a-4ba9-9214-29536ea93913';

-- Step 6: Check patient associations
SELECT 
    COUNT(*) as patient_count,
    clinic_id
FROM patients 
WHERE clinic_id = 'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0'
GROUP BY clinic_id;

-- Expected Results:
-- - User should have clinic_id = 'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0'
-- - User should have clinic_role = 'clinic_owner'
-- - User should have role = 'admin'
-- - Patients should be associated with the clinic
