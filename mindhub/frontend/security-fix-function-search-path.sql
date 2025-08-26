-- =====================================================================================
-- SECURITY FIX: FUNCTION SEARCH PATH MUTABLE
-- Fix security warnings about functions with mutable search_path
-- 
-- ⚠️  PROBLEMA DE SEGURIDAD:
-- Funciones sin search_path fijo son vulnerables a ataques de injection
-- Un atacante podría modificar search_path y ejecutar funciones maliciosas
-- 
-- 🔒 FUNCIONES SIN SEARCH_PATH FIJO:
-- 1. add_dual_system_fields
-- 2. create_dual_system_indexes  
-- 3. verify_dual_system_migration
-- 4. add_dual_system_support
-- 5. create_dual_indexes_for_table
-- 6. verify_dual_system_migration_complete
-- 7. update_updated_at_column
-- 
-- 🎯 SOLUCIÓN:
-- Recrear todas las funciones con SECURITY DEFINER y search_path fijo
-- =====================================================================================

-- =====================================================================================
-- 1. FUNCIÓN: add_dual_system_fields
-- =====================================================================================

-- Drop existing function to avoid parameter name conflicts
DROP FUNCTION IF EXISTS public.add_dual_system_fields(text);

CREATE OR REPLACE FUNCTION public.add_dual_system_fields(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Add clinic_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = add_dual_system_fields.table_name 
        AND column_name = 'clinic_id'
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN clinic_id UUID', table_name);
    END IF;
    
    -- Add workspace_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = add_dual_system_fields.table_name 
        AND column_name = 'workspace_id'
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN workspace_id UUID', table_name);
    END IF;
    
    -- Add constraint to ensure only one of clinic_id or workspace_id is set
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I_dual_system_constraint', 
                   table_name, table_name);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I_dual_system_constraint 
                    CHECK ((clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
                           (clinic_id IS NULL AND workspace_id IS NOT NULL))', 
                   table_name, table_name);
END;
$$;

-- =====================================================================================
-- 2. FUNCIÓN: create_dual_system_indexes
-- =====================================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_dual_system_indexes(text);

CREATE OR REPLACE FUNCTION public.create_dual_system_indexes(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Create index for clinic_id
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clinic_id ON public.%I (clinic_id)', 
                   table_name, table_name);
    
    -- Create index for workspace_id
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_workspace_id ON public.%I (workspace_id)', 
                   table_name, table_name);
END;
$$;

-- =====================================================================================
-- 3. FUNCIÓN: verify_dual_system_migration
-- =====================================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.verify_dual_system_migration(text);

CREATE OR REPLACE FUNCTION public.verify_dual_system_migration(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    has_clinic_id boolean := false;
    has_workspace_id boolean := false;
    has_constraint boolean := false;
BEGIN
    -- Check if clinic_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = verify_dual_system_migration.table_name 
        AND column_name = 'clinic_id'
    ) INTO has_clinic_id;
    
    -- Check if workspace_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = verify_dual_system_migration.table_name 
        AND column_name = 'workspace_id'
    ) INTO has_workspace_id;
    
    -- Check if constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = verify_dual_system_migration.table_name 
        AND constraint_name = table_name || '_dual_system_constraint'
    ) INTO has_constraint;
    
    RETURN has_clinic_id AND has_workspace_id AND has_constraint;
END;
$$;

-- =====================================================================================
-- 4. FUNCIÓN: add_dual_system_support
-- =====================================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.add_dual_system_support(text);

CREATE OR REPLACE FUNCTION public.add_dual_system_support(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Add dual system fields
    PERFORM public.add_dual_system_fields(table_name);
    
    -- Create indexes
    PERFORM public.create_dual_system_indexes(table_name);
    
    -- Log completion
    RAISE NOTICE 'Dual system support added to table: %', table_name;
END;
$$;

-- =====================================================================================
-- 5. FUNCIÓN: create_dual_indexes_for_table
-- =====================================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_dual_indexes_for_table(text);

CREATE OR REPLACE FUNCTION public.create_dual_indexes_for_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Create clinic_id index
    EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%I_clinic_id ON public.%I (clinic_id)', 
                   table_name, table_name);
    
    -- Create workspace_id index
    EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%I_workspace_id ON public.%I (workspace_id)', 
                   table_name, table_name);
    
    -- Create composite index for better performance
    EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%I_dual_system ON public.%I (clinic_id, workspace_id)', 
                   table_name, table_name);
END;
$$;

-- =====================================================================================
-- 6. FUNCIÓN: verify_dual_system_migration_complete
-- =====================================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.verify_dual_system_migration_complete();

CREATE OR REPLACE FUNCTION public.verify_dual_system_migration_complete()
RETURNS TABLE(table_name text, migration_complete boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    r RECORD;
BEGIN
    -- Check all tables that should have dual system support
    FOR r IN 
        SELECT t.table_name::text as tname
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN ('patients', 'appointments', 'consultations', 'assessments', 'consultation_templates')
    LOOP
        table_name := r.tname;
        migration_complete := public.verify_dual_system_migration(r.tname);
        RETURN NEXT;
    END LOOP;
END;
$$;

-- =====================================================================================
-- 7. FUNCIÓN: update_updated_at_column
-- NOTA: No se puede eliminar porque tiene triggers dependientes
-- =====================================================================================

-- Update function without dropping (preserves existing triggers)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =====================================================================================
-- VERIFICACIÓN POST-APLICACIÓN
-- =====================================================================================

-- Verificar que todas las funciones tienen search_path fijo
-- SELECT 
--     proname as function_name,
--     prosecdef as security_definer,
--     proconfig as search_path_config
-- FROM pg_proc 
-- WHERE proname IN (
--     'add_dual_system_fields',
--     'create_dual_system_indexes', 
--     'verify_dual_system_migration',
--     'add_dual_system_support',
--     'create_dual_indexes_for_table',
--     'verify_dual_system_migration_complete',
--     'update_updated_at_column'
-- )
-- AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- =====================================================================================
-- NOTAS IMPORTANTES
-- =====================================================================================

-- 1. SECURITY DEFINER: Las funciones se ejecutan con privilegios del creador
-- 2. SET search_path = public, pg_temp: Fija el search_path para prevenir injection
-- 3. pg_temp: Permite usar tablas temporales si es necesario
-- 4. %I: Placeholder seguro para identificadores (previene SQL injection)
-- 5. Todas las funciones ahora son inmunes a ataques de search_path manipulation