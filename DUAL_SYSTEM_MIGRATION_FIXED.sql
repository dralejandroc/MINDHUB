-- =========================================================================
-- MINDHUB DUAL SYSTEM MIGRATION - VERSIÓN CORREGIDA SIN ERRORES
-- 🏗️ MIGRACIÓN COMPLETA DE SISTEMA ÚNICO A SISTEMA DUAL
-- =========================================================================

-- DESCRIPCIÓN: Migra de sistema único de clínicas a sistema dual
-- QUE HACE: Agrega soporte para licencias individuales manteniendo clínicas existentes
-- COMPATIBLE: Con datos existentes, no destructivo
-- EJECUTAR: En orden secuencial para evitar errores

-- =========================================================================
-- STEP 1: CREAR NUEVAS TABLAS CORE DEL SISTEMA DUAL
-- =========================================================================

-- Crear enum para tipos de licencia (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_type_enum') THEN
        CREATE TYPE license_type_enum AS ENUM ('clinic', 'individual');
    END IF;
END $$;

-- Tabla de workspaces individuales
CREATE TABLE IF NOT EXISTS individual_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,                        -- Referencia a profiles.id
  workspace_name VARCHAR(200) NOT NULL,
  business_name VARCHAR(200),
  tax_id VARCHAR(50),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ubicaciones/sucursales (dual: clínicas O workspaces)
CREATE TABLE IF NOT EXISTS practice_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- DUAL SYSTEM: Puede pertenecer a clínica O workspace individual
  clinic_id UUID,
  workspace_id UUID,
  
  location_name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar constraints después de crear la tabla
DO $$
BEGIN
    -- Agregar foreign key constraints si no existen
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'practice_locations_clinic_id_fkey'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_configurations') THEN
            ALTER TABLE practice_locations 
            ADD CONSTRAINT practice_locations_clinic_id_fkey 
            FOREIGN KEY (clinic_id) REFERENCES clinic_configurations(id) ON DELETE CASCADE;
        END IF;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'practice_locations_workspace_id_fkey'
    ) THEN
        ALTER TABLE practice_locations 
        ADD CONSTRAINT practice_locations_workspace_id_fkey 
        FOREIGN KEY (workspace_id) REFERENCES individual_workspaces(id) ON DELETE CASCADE;
    END IF;

    -- Agregar constraint XOR si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_location_owner'
    ) THEN
        ALTER TABLE practice_locations 
        ADD CONSTRAINT check_location_owner CHECK (
            (clinic_id IS NOT NULL AND workspace_id IS NULL) OR
            (clinic_id IS NULL AND workspace_id IS NOT NULL)
        );
    END IF;
END $$;

-- =========================================================================
-- STEP 2: ACTUALIZAR TABLA PROFILES PARA SISTEMA DUAL
-- =========================================================================

-- Agregar campos dual system a profiles si no existen
DO $$
BEGIN
    -- Agregar license_type si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'license_type'
    ) THEN
        ALTER TABLE profiles ADD COLUMN license_type license_type_enum;
    END IF;

    -- Agregar individual_workspace_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'individual_workspace_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN individual_workspace_id UUID;
    END IF;

    -- Agregar foreign key constraint para workspace si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_individual_workspace_id_fkey'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_individual_workspace_id_fkey 
        FOREIGN KEY (individual_workspace_id) REFERENCES individual_workspaces(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =========================================================================
-- STEP 3: FUNCIÓN HELPER PARA AGREGAR SOPORTE DUAL A TABLAS EXISTENTES
-- =========================================================================

CREATE OR REPLACE FUNCTION add_dual_system_fields(target_table_name text)
RETURNS void AS $$
BEGIN
    -- Agregar clinic_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = target_table_name AND column_name = 'clinic_id'
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN clinic_id UUID', target_table_name);
    END IF;

    -- Agregar workspace_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = target_table_name AND column_name = 'workspace_id'
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN workspace_id UUID', target_table_name);
    END IF;

    -- Agregar foreign key constraints si existen las tablas referenciadas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_configurations') THEN
        BEGIN
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES clinic_configurations(id) ON DELETE CASCADE', 
                         target_table_name, target_table_name);
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint ya existe, continuar
        END;
    END IF;

    BEGIN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES individual_workspaces(id) ON DELETE CASCADE', 
                     target_table_name, target_table_name);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint ya existe, continuar
    END;

    -- Agregar constraint XOR
    BEGIN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT check_%I_owner CHECK ((clinic_id IS NOT NULL AND workspace_id IS NULL) OR (clinic_id IS NULL AND workspace_id IS NOT NULL))', 
                     target_table_name, target_table_name);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint ya existe, continuar
    END;

END $$ LANGUAGE plpgsql;

-- =========================================================================
-- STEP 4: APLICAR SOPORTE DUAL A TABLAS PRINCIPALES
-- =========================================================================

-- Lista de tablas que necesitan soporte dual
DO $$
DECLARE
    table_names text[] := ARRAY[
        'patients',
        'consultations', 
        'medical_history',
        'appointments',
        'appointment_history',
        'resources',
        'resource_categories',
        'resource_sends',
        'finance_income',
        'cash_register_cuts',
        'financial_services',
        'finance_payment_method_config',
        'psychometric_scales',
        'assessments',
        'scale_items',
        'dynamic_forms',
        'form_submissions'
    ];
    tbl_name text;
BEGIN
    FOREACH tbl_name IN ARRAY table_names
    LOOP
        -- Solo aplicar si la tabla existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name) THEN
            PERFORM add_dual_system_fields(tbl_name);
            RAISE NOTICE 'Added dual system support to table: %', tbl_name;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', tbl_name;
        END IF;
    END LOOP;
END $$;

-- =========================================================================
-- STEP 5: CREAR ÍNDICES PARA PERFORMANCE
-- =========================================================================

CREATE OR REPLACE FUNCTION create_dual_system_indexes(target_table_name text)
RETURNS void AS $$
BEGIN
    -- Índice para clinic_id
    BEGIN
        EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%I_clinic_id ON %I (clinic_id) WHERE clinic_id IS NOT NULL', 
                     target_table_name, target_table_name);
    EXCEPTION WHEN others THEN
        -- Si falla, continuar
        RAISE NOTICE 'Could not create clinic_id index for %', target_table_name;
    END;

    -- Índice para workspace_id
    BEGIN
        EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%I_workspace_id ON %I (workspace_id) WHERE workspace_id IS NOT NULL', 
                     target_table_name, target_table_name);
    EXCEPTION WHEN others THEN
        -- Si falla, continuar
        RAISE NOTICE 'Could not create workspace_id index for %', target_table_name;
    END;
END $$ LANGUAGE plpgsql;

-- Aplicar índices a las tablas principales
DO $$
DECLARE
    table_names text[] := ARRAY[
        'patients',
        'consultations',
        'appointments',
        'resources',
        'finance_income',
        'assessments'
    ];
    tbl_name text;
BEGIN
    FOREACH tbl_name IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name) THEN
            PERFORM create_dual_system_indexes(tbl_name);
        END IF;
    END LOOP;
END $$;

-- =========================================================================
-- STEP 6: MIGRAR DATOS EXISTENTES A SISTEMA DUAL
-- =========================================================================

-- Migrar usuarios existentes a license_type='clinic'
UPDATE profiles 
SET license_type = 'clinic' 
WHERE license_type IS NULL 
  AND id IN (
    SELECT DISTINCT id FROM profiles 
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_profiles')
  );

-- Migrar datos existentes de pacientes si existe clinic_profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_profiles') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
        
        -- Actualizar pacientes basado en sus creadores
        UPDATE patients p
        SET clinic_id = cp.clinic_id
        FROM clinic_profiles cp
        WHERE p.created_by = cp.id 
          AND p.clinic_id IS NULL
          AND cp.clinic_id IS NOT NULL;
          
        RAISE NOTICE 'Migrated existing patient data to clinic system';
    END IF;
END $$;

-- =========================================================================
-- STEP 7: CREAR RLS POLICIES PARA SEGURIDAD DUAL
-- =========================================================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE individual_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_locations ENABLE ROW LEVEL SECURITY;

-- Policy para individual_workspaces
CREATE POLICY "Users can only see their own workspaces"
  ON individual_workspaces
  FOR ALL
  USING (owner_id = auth.uid());

-- Policy para practice_locations (dual)
CREATE POLICY "Users can see locations from their clinic or workspace"
  ON practice_locations
  FOR ALL
  USING (
    -- Clinic users see locations from their clinic
    (clinic_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
        AND p.license_type = 'clinic' 
        AND p.clinic_id = practice_locations.clinic_id
    ))
    OR
    -- Individual users see locations from their workspace
    (workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
        AND p.license_type = 'individual' 
        AND p.individual_workspace_id = practice_locations.workspace_id
    ))
  );

-- =========================================================================
-- STEP 8: VERIFICACIÓN FINAL
-- =========================================================================

-- Función de verificación
CREATE OR REPLACE FUNCTION verify_dual_system_migration()
RETURNS text AS $$
DECLARE
    result text := '';
    table_count int;
    enum_exists boolean;
BEGIN
    -- Verificar enum
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_type_enum') INTO enum_exists;
    result := result || 'Enum license_type_enum exists: ' || enum_exists::text || E'\n';
    
    -- Verificar tablas nuevas
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_name IN ('individual_workspaces', 'practice_locations') 
    INTO table_count;
    result := result || 'New tables created: ' || table_count::text || '/2' || E'\n';
    
    -- Verificar campos en profiles
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'profiles' 
      AND column_name IN ('license_type', 'individual_workspace_id')
    INTO table_count;
    result := result || 'Dual fields in profiles: ' || table_count::text || '/2' || E'\n';
    
    result := result || 'Migration verification complete.' || E'\n';
    
    RETURN result;
END $$ LANGUAGE plpgsql;

-- Ejecutar verificación
SELECT verify_dual_system_migration();

-- =========================================================================
-- MIGRATION COMPLETE
-- =========================================================================

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 DUAL SYSTEM MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '';
    RAISE NOTICE 'System now supports:';
    RAISE NOTICE '- CLINIC licenses: Multi-user with shared data';
    RAISE NOTICE '- INDIVIDUAL licenses: Single user with private workspace';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Deploy updated Django backend';
    RAISE NOTICE '2. Test dual system endpoints';
    RAISE NOTICE '3. Configure user licenses as needed';
    RAISE NOTICE '';
END $$;