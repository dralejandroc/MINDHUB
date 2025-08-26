-- MINDHUB - Restore Test Data for Dr. Alejandro
-- This script creates test patients and fixes the tenant context

-- Step 1: Get user ID for dr_aleks_c@hotmail.com
DO $$
DECLARE
    user_id UUID;
    workspace_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO user_id 
    FROM profiles 
    WHERE email = 'dr_aleks_c@hotmail.com'
    LIMIT 1;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User dr_aleks_c@hotmail.com not found';
    END IF;
    
    RAISE NOTICE 'User ID found: %', user_id;
    
    -- Check or create workspace
    SELECT id INTO workspace_id
    FROM individual_workspaces
    WHERE owner_id = user_id
    LIMIT 1;
    
    IF workspace_id IS NULL THEN
        -- Create workspace
        INSERT INTO individual_workspaces (
            owner_id,
            workspace_name,
            business_name,
            is_active
        ) VALUES (
            user_id,
            'Consultorio Dr. Alejandro',
            'Consultorio Privado',
            true
        ) RETURNING id INTO workspace_id;
        
        RAISE NOTICE 'Workspace created: %', workspace_id;
    ELSE
        RAISE NOTICE 'Workspace found: %', workspace_id;
    END IF;
    
    -- Create test patients
    -- Patient 1
    INSERT INTO patients (
        first_name, last_name, paternal_last_name, maternal_last_name,
        email, phone, date_of_birth, gender, blood_type,
        address, city, state, zip_code, curp,
        workspace_id, created_by, is_active
    ) VALUES (
        'Juan', 'Pérez', 'Pérez', 'García',
        'juan.perez@example.com', '555-0101', '1985-03-15', 'male', 'O+',
        'Calle Principal 123, Col. Centro', 'Ciudad de México', 'CDMX', '01000', 'PEPJ850315HDFRNN01',
        workspace_id, user_id, true
    ) ON CONFLICT (email, workspace_id) DO NOTHING;
    
    -- Patient 2
    INSERT INTO patients (
        first_name, last_name, paternal_last_name, maternal_last_name,
        email, phone, date_of_birth, gender, blood_type,
        address, city, state, zip_code, curp,
        workspace_id, created_by, is_active
    ) VALUES (
        'María', 'González', 'González', 'López',
        'maria.gonzalez@example.com', '555-0102', '1990-07-22', 'female', 'A+',
        'Av. Reforma 456, Col. Juárez', 'Ciudad de México', 'CDMX', '06600', 'GOLM900722MDFNPR08',
        workspace_id, user_id, true
    ) ON CONFLICT (email, workspace_id) DO NOTHING;
    
    -- Patient 3
    INSERT INTO patients (
        first_name, last_name, paternal_last_name, maternal_last_name,
        email, phone, date_of_birth, gender, blood_type,
        address, city, state, zip_code, curp,
        workspace_id, created_by, is_active
    ) VALUES (
        'Carlos', 'Rodríguez', 'Rodríguez', 'Martínez',
        'carlos.rodriguez@example.com', '555-0103', '1978-11-30', 'male', 'B+',
        'Calle Madero 789, Col. Roma', 'Ciudad de México', 'CDMX', '06700', 'ROMC781130HDFDRR05',
        workspace_id, user_id, true
    ) ON CONFLICT (email, workspace_id) DO NOTHING;
    
    -- Patient 4
    INSERT INTO patients (
        first_name, last_name, paternal_last_name, maternal_last_name,
        email, phone, date_of_birth, gender, blood_type,
        address, city, state, zip_code, curp,
        workspace_id, created_by, is_active
    ) VALUES (
        'Ana', 'Martínez', 'Martínez', 'Hernández',
        'ana.martinez@example.com', '555-0104', '1995-05-18', 'female', 'AB+',
        'Av. Insurgentes 321, Col. Condesa', 'Ciudad de México', 'CDMX', '06140', 'MAHA950518MDFRRN09',
        workspace_id, user_id, true
    ) ON CONFLICT (email, workspace_id) DO NOTHING;
    
    -- Patient 5
    INSERT INTO patients (
        first_name, last_name, paternal_last_name, maternal_last_name,
        email, phone, date_of_birth, gender, blood_type,
        address, city, state, zip_code, curp,
        workspace_id, created_by, is_active
    ) VALUES (
        'Roberto', 'López', 'López', 'Sánchez',
        'roberto.lopez@example.com', '555-0105', '1982-09-10', 'male', 'O-',
        'Calle Hidalgo 654, Col. Del Valle', 'Ciudad de México', 'CDMX', '03100', 'LOSR820910HDFPNB02',
        workspace_id, user_id, true
    ) ON CONFLICT (email, workspace_id) DO NOTHING;
    
    -- Patient 6
    INSERT INTO patients (
        first_name, last_name, paternal_last_name, maternal_last_name,
        email, phone, date_of_birth, gender, blood_type,
        address, city, state, zip_code, curp,
        workspace_id, created_by, is_active
    ) VALUES (
        'Laura', 'Sánchez', 'Sánchez', 'Torres',
        'laura.sanchez@example.com', '555-0106', '1988-12-05', 'female', 'B-',
        'Calle Morelos 852, Col. Polanco', 'Ciudad de México', 'CDMX', '11560', 'SATL881205MDFNRR07',
        workspace_id, user_id, true
    ) ON CONFLICT (email, workspace_id) DO NOTHING;
    
    -- Patient 7
    INSERT INTO patients (
        first_name, last_name, paternal_last_name, maternal_last_name,
        email, phone, date_of_birth, gender, blood_type,
        address, city, state, zip_code, curp,
        workspace_id, created_by, is_active
    ) VALUES (
        'Pedro', 'Hernández', 'Hernández', 'Díaz',
        'pedro.hernandez@example.com', '555-0107', '1975-02-28', 'male', 'A-',
        'Av. Universidad 159, Col. Narvarte', 'Ciudad de México', 'CDMX', '03020', 'HEDP750228HDFRZD04',
        workspace_id, user_id, true
    ) ON CONFLICT (email, workspace_id) DO NOTHING;
    
    -- Patient 8
    INSERT INTO patients (
        first_name, last_name, paternal_last_name, maternal_last_name,
        email, phone, date_of_birth, gender, blood_type,
        address, city, state, zip_code, curp,
        workspace_id, created_by, is_active
    ) VALUES (
        'Patricia', 'Ramírez', 'Ramírez', 'Flores',
        'patricia.ramirez@example.com', '555-0108', '1993-08-17', 'female', 'O+',
        'Calle Zaragoza 753, Col. Centro', 'Ciudad de México', 'CDMX', '06050', 'RAFP930817MDFMLR01',
        workspace_id, user_id, true
    ) ON CONFLICT (email, workspace_id) DO NOTHING;
    
    -- Patient 9
    INSERT INTO patients (
        first_name, last_name, paternal_last_name, maternal_last_name,
        email, phone, date_of_birth, gender, blood_type,
        address, city, state, zip_code, curp,
        workspace_id, created_by, is_active
    ) VALUES (
        'Fernando', 'Torres', 'Torres', 'Mendoza',
        'fernando.torres@example.com', '555-0109', '1980-06-14', 'male', 'AB-',
        'Calle Benito Juárez 951, Col. Santa Fe', 'Ciudad de México', 'CDMX', '01210', 'TOMF800614HDFRRN03',
        workspace_id, user_id, true
    ) ON CONFLICT (email, workspace_id) DO NOTHING;
    
    -- Patient 10
    INSERT INTO patients (
        first_name, last_name, paternal_last_name, maternal_last_name,
        email, phone, date_of_birth, gender, blood_type,
        address, city, state, zip_code, curp,
        workspace_id, created_by, is_active
    ) VALUES (
        'Sofía', 'Mendoza', 'Mendoza', 'Vargas',
        'sofia.mendoza@example.com', '555-0110', '1992-04-03', 'female', 'A+',
        'Av. Patriotismo 357, Col. San Pedro', 'Ciudad de México', 'CDMX', '03800', 'MEVS920403MDFNDF06',
        workspace_id, user_id, true
    ) ON CONFLICT (email, workspace_id) DO NOTHING;
    
    RAISE NOTICE 'Test patients created successfully';
    
END $$;

-- Verify the data
SELECT 
    'Total patients for Dr. Alejandro:' as info,
    COUNT(*) as count
FROM patients p
JOIN individual_workspaces w ON p.workspace_id = w.id
JOIN profiles pr ON w.owner_id = pr.id
WHERE pr.email = 'dr_aleks_c@hotmail.com';

-- List first 5 patients
SELECT 
    p.id,
    p.first_name || ' ' || p.last_name as full_name,
    p.email,
    p.phone,
    p.created_at
FROM patients p
JOIN individual_workspaces w ON p.workspace_id = w.id
JOIN profiles pr ON w.owner_id = pr.id
WHERE pr.email = 'dr_aleks_c@hotmail.com'
ORDER BY p.created_at DESC
LIMIT 5;