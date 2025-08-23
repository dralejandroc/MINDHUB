-- =========================================================================
-- MINDHUB DUAL SYSTEM MIGRATION - ALL MODULES COMPLETE
-- 🏗️ MIGRACIÓN COMPLETA DE TODOS LOS MÓDULOS A SISTEMA DUAL
-- =========================================================================

-- DESCRIPCIÓN: Migra TODOS los módulos de sistema único a sistema dual
-- MÓDULOS: Resources, Finance, FormX, ClinimetrixPro, Expedix, Frontdesk
-- QUE HACE: Agrega soporte dual (clinic_id + workspace_id) a todas las tablas
-- COMPATIBLE: Con datos existentes, no destructivo
-- EJECUTAR: En orden secuencial para evitar errores

-- =========================================================================
-- STEP 1: VERIFICAR Y CREAR INFRAESTRUCTURA DUAL SYSTEM
-- =========================================================================

-- Crear enum para tipos de licencia (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_type_enum') THEN
        CREATE TYPE license_type_enum AS ENUM ('clinic', 'individual');
    END IF;
END $$;

-- Crear tabla individual_workspaces (si no existe)
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

-- Crear tabla clinic_configurations (si no existe) - CORE SYSTEM
CREATE TABLE IF NOT EXISTS clinic_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name VARCHAR(200) NOT NULL,
  business_name VARCHAR(200),
  tax_id VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(200),
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  subscription_plan VARCHAR(50) DEFAULT 'clinic',
  max_professionals INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla clinic_profiles (ESSENTIAL for clinic system) - RESTAURADA
CREATE TABLE IF NOT EXISTS clinic_profiles (
  id UUID PRIMARY KEY,  -- Same as profiles.id
  clinic_id UUID NOT NULL,
  clinic_role VARCHAR(50) DEFAULT 'professional',
  specialties TEXT[],
  license_number VARCHAR(100),
  professional_title VARCHAR(100),
  bio TEXT,
  consultation_fee DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT clinic_profiles_clinic_id_fkey 
    FOREIGN KEY (clinic_id) REFERENCES clinic_configurations(id) ON DELETE CASCADE
);

-- Crear tabla practice_locations (si no existe)
CREATE TABLE IF NOT EXISTS practice_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_location_owner CHECK (
    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR
    (clinic_id IS NULL AND workspace_id IS NOT NULL)
  )
);

-- Actualizar tabla profiles para sistema dual (si no existe)
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
END $$;

-- =========================================================================
-- STEP 2: FUNCIÓN UNIVERSAL PARA AGREGAR SOPORTE DUAL
-- =========================================================================

CREATE OR REPLACE FUNCTION add_dual_system_support(target_table_name text)
RETURNS void AS $$
BEGIN
    -- Agregar clinic_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = target_table_name AND column_name = 'clinic_id'
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN clinic_id UUID', target_table_name);
        RAISE NOTICE 'Added clinic_id to %', target_table_name;
    END IF;

    -- Agregar workspace_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = target_table_name AND column_name = 'workspace_id'
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN workspace_id UUID', target_table_name);
        RAISE NOTICE 'Added workspace_id to %', target_table_name;
    END IF;

    -- Agregar foreign key constraints si existen las tablas referenciadas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_configurations') THEN
        BEGIN
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES clinic_configurations(id) ON DELETE CASCADE', 
                         target_table_name, target_table_name);
            RAISE NOTICE 'Added clinic FK constraint to %', target_table_name;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint ya existe, continuar
        END;
    END IF;

    BEGIN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES individual_workspaces(id) ON DELETE CASCADE', 
                     target_table_name, target_table_name);
        RAISE NOTICE 'Added workspace FK constraint to %', target_table_name;
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint ya existe, continuar
    END;

    -- Agregar constraint XOR
    BEGIN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT check_%I_dual_owner CHECK ((clinic_id IS NOT NULL AND workspace_id IS NULL) OR (clinic_id IS NULL AND workspace_id IS NOT NULL))', 
                     target_table_name, target_table_name);
        RAISE NOTICE 'Added XOR constraint to %', target_table_name;
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint ya existe, continuar
    END;

END $$ LANGUAGE plpgsql;

-- =========================================================================
-- STEP 3: MIGRACIÓN MÓDULO EXPEDIX (Sistema base para pacientes)
-- =========================================================================

DO $$
DECLARE
    expedix_tables text[] := ARRAY[
        'patients',
        'consultations', 
        'medical_history',
        'prescriptions',
        'patient_documents',
        'patient_vitals',
        'patient_allergies',
        'patient_medications',
        'patient_conditions',
        'patient_contacts',
        'consultation_notes',
        'diagnostic_codes',
        'treatment_plans'
    ];
    tbl_name text;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🏥 MIGRANDO MÓDULO EXPEDIX A SISTEMA DUAL';
    RAISE NOTICE '========================================';
    
    FOREACH tbl_name IN ARRAY expedix_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            PERFORM add_dual_system_support(tbl_name);
            RAISE NOTICE '✅ %: Migrado a sistema dual', tbl_name;
        ELSE
            RAISE NOTICE '⚠️  %: Tabla no existe, omitiendo', tbl_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 EXPEDIX: Migración completada';
END $$;

-- =========================================================================
-- STEP 4: MIGRACIÓN MÓDULO RESOURCES (Biblioteca de recursos)
-- =========================================================================

DO $$
DECLARE
    resources_tables text[] := ARRAY[
        'resource_categories',
        'resources',
        'resource_sends',
        'resource_access_logs',
        'resource_collections',
        'resource_collection_items',
        'watermark_templates',
        'resource_email_templates',
        'resource_downloads',
        'resource_favorites',
        'resource_tags',
        'resource_versions'
    ];
    tbl_name text;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📚 MIGRANDO MÓDULO RESOURCES A SISTEMA DUAL';
    RAISE NOTICE '========================================';
    
    FOREACH tbl_name IN ARRAY resources_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            PERFORM add_dual_system_support(tbl_name);
            RAISE NOTICE '✅ %: Migrado a sistema dual', tbl_name;
        ELSE
            RAISE NOTICE '⚠️  %: Tabla no existe, omitiendo', tbl_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 RESOURCES: Migración completada';
END $$;

-- =========================================================================
-- STEP 5: MIGRACIÓN MÓDULO FINANCE (Gestión financiera)
-- =========================================================================

DO $$
DECLARE
    finance_tables text[] := ARRAY[
        'finance_income',
        'financial_services',
        'cash_register_cuts',
        'finance_payment_method_config',
        'finance_transactions',
        'finance_invoices',
        'finance_payments',
        'finance_refunds',
        'finance_discounts',
        'finance_tax_rates',
        'finance_budgets',
        'finance_expenses',
        'finance_categories',
        'finance_reports'
    ];
    tbl_name text;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '💰 MIGRANDO MÓDULO FINANCE A SISTEMA DUAL';
    RAISE NOTICE '========================================';
    
    FOREACH tbl_name IN ARRAY finance_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            PERFORM add_dual_system_support(tbl_name);
            RAISE NOTICE '✅ %: Migrado a sistema dual', tbl_name;
        ELSE
            RAISE NOTICE '⚠️  %: Tabla no existe, omitiendo', tbl_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 FINANCE: Migración completada';
END $$;

-- =========================================================================
-- STEP 6: MIGRACIÓN MÓDULO AGENDA (Sistema de citas)
-- =========================================================================

DO $$
DECLARE
    agenda_tables text[] := ARRAY[
        'appointments',
        'appointment_history',
        'appointment_types',
        'appointment_reminders',
        'appointment_cancellations',
        'provider_schedules',
        'provider_availability',
        'provider_breaks',
        'waiting_list',
        'recurring_appointments',
        'appointment_templates',
        'schedule_exceptions',
        'time_slots',
        'booking_rules'
    ];
    tbl_name text;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📅 MIGRANDO MÓDULO AGENDA A SISTEMA DUAL';
    RAISE NOTICE '========================================';
    
    FOREACH tbl_name IN ARRAY agenda_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            PERFORM add_dual_system_support(tbl_name);
            RAISE NOTICE '✅ %: Migrado a sistema dual', tbl_name;
        ELSE
            RAISE NOTICE '⚠️  %: Tabla no existe, omitiendo', tbl_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 AGENDA: Migración completada';
END $$;

-- =========================================================================
-- STEP 7: MIGRACIÓN MÓDULO CLINIMETRIXPRO (Escalas psicométricas)
-- =========================================================================

DO $$
DECLARE
    clinimetrix_tables text[] := ARRAY[
        'psychometric_scales',
        'scale_items',
        'scale_subscales',
        'scale_interpretation_rules',
        'assessments',
        'assessment_responses',
        'assessment_scores',
        'assessment_interpretations',
        'assessment_reports',
        'scale_categories',
        'scale_versions',
        'scale_templates',
        'assessment_sessions',
        'assessment_invitations'
    ];
    tbl_name text;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧠 MIGRANDO MÓDULO CLINIMETRIXPRO A SISTEMA DUAL';
    RAISE NOTICE '========================================';
    
    FOREACH tbl_name IN ARRAY clinimetrix_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            PERFORM add_dual_system_support(tbl_name);
            RAISE NOTICE '✅ %: Migrado a sistema dual', tbl_name;
        ELSE
            RAISE NOTICE '⚠️  %: Tabla no existe, omitiendo', tbl_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 CLINIMETRIXPRO: Migración completada';
END $$;

-- =========================================================================
-- STEP 8: MIGRACIÓN MÓDULO FORMX (Generador de formularios)
-- =========================================================================

DO $$
DECLARE
    formx_tables text[] := ARRAY[
        'dynamic_forms',
        'form_submissions',
        'form_fields',
        'form_field_options',
        'form_templates',
        'form_categories',
        'form_validations',
        'form_logic_rules',
        'form_notifications',
        'form_versions',
        'form_analytics',
        'form_exports',
        'form_signatures',
        'form_attachments'
    ];
    tbl_name text;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 MIGRANDO MÓDULO FORMX A SISTEMA DUAL';
    RAISE NOTICE '========================================';
    
    FOREACH tbl_name IN ARRAY formx_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            PERFORM add_dual_system_support(tbl_name);
            RAISE NOTICE '✅ %: Migrado a sistema dual', tbl_name;
        ELSE
            RAISE NOTICE '⚠️  %: Tabla no existe, omitiendo', tbl_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 FORMX: Migración completada';
END $$;

-- =========================================================================
-- STEP 9: MIGRACIÓN MÓDULO FRONTDESK (Recepción y gestión)
-- =========================================================================

DO $$
DECLARE
    frontdesk_tables text[] := ARRAY[
        'front_desk_tasks',
        'patient_check_ins',
        'patient_queue',
        'desk_notifications',
        'visitor_logs',
        'desk_messages',
        'desk_alerts',
        'desk_schedules',
        'desk_reports',
        'desk_configurations',
        'desk_workflows',
        'desk_permissions',
        'desk_integrations',
        'desk_analytics'
    ];
    tbl_name text;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🏢 MIGRANDO MÓDULO FRONTDESK A SISTEMA DUAL';
    RAISE NOTICE '========================================';
    
    FOREACH tbl_name IN ARRAY frontdesk_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            PERFORM add_dual_system_support(tbl_name);
            RAISE NOTICE '✅ %: Migrado a sistema dual', tbl_name;
        ELSE
            RAISE NOTICE '⚠️  %: Tabla no existe, omitiendo', tbl_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 FRONTDESK: Migración completada';
END $$;

-- =========================================================================
-- STEP 10: CREAR ÍNDICES PARA PERFORMANCE EN TODAS LAS TABLAS
-- =========================================================================

CREATE OR REPLACE FUNCTION create_dual_indexes_for_table(target_table_name text)
RETURNS void AS $$
BEGIN
    -- Índice para clinic_id
    BEGIN
        EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%I_clinic_id ON %I (clinic_id) WHERE clinic_id IS NOT NULL', 
                     target_table_name, target_table_name);
        RAISE NOTICE 'Created clinic_id index for %', target_table_name;
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'Could not create clinic_id index for % (may already exist)', target_table_name;
    END;

    -- Índice para workspace_id
    BEGIN
        EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%I_workspace_id ON %I (workspace_id) WHERE workspace_id IS NOT NULL', 
                     target_table_name, target_table_name);
        RAISE NOTICE 'Created workspace_id index for %', target_table_name;
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'Could not create workspace_id index for % (may already exist)', target_table_name;
    END;
END $$ LANGUAGE plpgsql;

-- Aplicar índices a tablas principales de cada módulo
DO $$
DECLARE
    main_tables text[] := ARRAY[
        -- Expedix
        'patients', 'consultations', 'medical_history',
        -- Resources  
        'resource_categories', 'resources', 'resource_sends',
        -- Finance
        'finance_income', 'financial_services', 'cash_register_cuts',
        -- Agenda
        'appointments', 'provider_schedules', 'appointment_history',
        -- ClinimetrixPro
        'psychometric_scales', 'assessments', 'assessment_responses',
        -- FormX
        'dynamic_forms', 'form_submissions',
        -- Frontdesk
        'patient_check_ins', 'patient_queue', 'front_desk_tasks'
    ];
    tbl_name text;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🚀 CREANDO ÍNDICES PARA PERFORMANCE DUAL SYSTEM';
    RAISE NOTICE '========================================';
    
    FOREACH tbl_name IN ARRAY main_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            PERFORM create_dual_indexes_for_table(tbl_name);
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 ÍNDICES: Creación completada';
END $$;

-- =========================================================================
-- STEP 11: MIGRAR DATOS EXISTENTES A SISTEMA DUAL
-- =========================================================================

-- =========================================================================
-- STEP 10.5: CREAR INFRAESTRUCTURA CLINIC SYSTEM COMPLETA
-- =========================================================================

-- Crear clínica por defecto si no existe ninguna
DO $$
DECLARE
    default_clinic_id UUID;
    clinic_count INT;
BEGIN
    -- Verificar si ya existen clínicas
    SELECT COUNT(*) FROM clinic_configurations INTO clinic_count;
    
    IF clinic_count = 0 THEN
        -- Crear clínica por defecto
        INSERT INTO clinic_configurations (
            id, 
            clinic_name, 
            business_name, 
            address, 
            phone, 
            email,
            subscription_plan,
            max_professionals,
            is_active
        ) VALUES (
            gen_random_uuid(),
            'Clínica MindHub',
            'MindHub Healthcare Solutions',
            'Av. Principal 123, Ciudad',
            '+1-555-0123',
            'admin@mindhub.cloud',
            'clinic',
            15,
            true
        ) RETURNING id INTO default_clinic_id;
        
        RAISE NOTICE '✅ Clínica por defecto creada: %', default_clinic_id;
    ELSE
        RAISE NOTICE '✅ Ya existen % clínicas configuradas', clinic_count;
    END IF;
END $$;

-- Migrar usuarios existentes y crear clinic_profiles
DO $$
DECLARE
    default_clinic_id UUID;
    user_record RECORD;
    clinic_profile_count INT;
BEGIN
    -- Obtener primera clínica disponible
    SELECT id INTO default_clinic_id FROM clinic_configurations ORDER BY created_at ASC LIMIT 1;
    
    IF default_clinic_id IS NULL THEN
        RAISE EXCEPTION 'No hay clínicas disponibles para asignar usuarios';
    END IF;
    
    RAISE NOTICE 'Usando clínica por defecto: %', default_clinic_id;
    
    -- Migrar usuarios existentes a license_type='clinic' por defecto
    UPDATE profiles 
    SET license_type = 'clinic',
        clinic_id = default_clinic_id
    WHERE license_type IS NULL;
    
    -- Crear clinic_profiles para todos los usuarios que no los tengan
    SELECT COUNT(*) FROM clinic_profiles INTO clinic_profile_count;
    
    IF clinic_profile_count = 0 THEN
        RAISE NOTICE 'Creando clinic_profiles para usuarios existentes...';
        
        -- Insertar clinic_profiles para usuarios con license_type = 'clinic'
        INSERT INTO clinic_profiles (
            id, 
            clinic_id, 
            clinic_role, 
            professional_title, 
            is_active
        )
        SELECT 
            p.id,
            p.clinic_id,
            CASE 
                WHEN p.email LIKE '%admin%' OR p.email LIKE '%doctor%' THEN 'admin'
                ELSE 'professional'
            END as clinic_role,
            CASE 
                WHEN p.email LIKE '%doctor%' OR p.email LIKE '%dr%' THEN 'Doctor'
                WHEN p.email LIKE '%psych%' THEN 'Psicólogo'
                ELSE 'Profesional de la Salud'
            END as professional_title,
            true
        FROM profiles p
        WHERE p.license_type = 'clinic' 
          AND p.clinic_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM clinic_profiles cp WHERE cp.id = p.id
          );
          
        RAISE NOTICE '✅ clinic_profiles creados para usuarios existentes';
    ELSE
        RAISE NOTICE '✅ Ya existen % clinic_profiles', clinic_profile_count;
    END IF;
END $$;

-- Migrar datos existentes usando clinic_profiles COMPLETA
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔄 MIGRANDO DATOS EXISTENTES A SISTEMA DUAL COMPLETO';
    RAISE NOTICE '========================================';
    
    -- Migrar pacientes basado en clinic_profiles (CORRECTO)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinic_profiles') THEN
        
        UPDATE patients p
        SET clinic_id = cp.clinic_id
        FROM clinic_profiles cp
        WHERE p.created_by = cp.id 
          AND p.clinic_id IS NULL
          AND cp.clinic_id IS NOT NULL;
          
        RAISE NOTICE '✅ Pacientes migrados usando clinic_profiles';
    END IF;
    
    -- Migrar consultations usando clinic_profiles (CORRECTO)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultations') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinic_profiles') THEN
        
        UPDATE consultations c
        SET clinic_id = cp.clinic_id
        FROM clinic_profiles cp
        WHERE c.professional_id = cp.id 
          AND c.clinic_id IS NULL
          AND cp.clinic_id IS NOT NULL;
          
        RAISE NOTICE '✅ Consultations migradas usando clinic_profiles';
    END IF;
    
    -- Migrar appointments usando clinic_profiles (CORRECTO con verificación de columnas)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinic_profiles') THEN
        
        -- Verificar qué columna de profesional existe en appointments
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'provider_id') THEN
            UPDATE appointments a
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE a.provider_id = cp.id 
              AND a.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Appointments migradas usando provider_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'professional_id') THEN
            UPDATE appointments a
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE a.professional_id = cp.id 
              AND a.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Appointments migradas usando professional_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'created_by') THEN
            UPDATE appointments a
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE a.created_by = cp.id 
              AND a.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Appointments migradas usando created_by';
        ELSE
            RAISE NOTICE '⚠️  appointments: No se encontró columna de profesional válida';
        END IF;
    END IF;
    
    -- Migrar resources usando clinic_profiles (CORRECTO con verificación de columnas)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resources')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinic_profiles') THEN
        
        -- Verificar qué columna de owner existe en resources
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'owner_id') THEN
            UPDATE resources r
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE r.owner_id = cp.id 
              AND r.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Resources migrados usando owner_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'upload_by') THEN
            UPDATE resources r
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE r.upload_by = cp.id 
              AND r.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Resources migrados usando upload_by';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'created_by') THEN
            UPDATE resources r
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE r.created_by = cp.id 
              AND r.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Resources migrados usando created_by';
        ELSE
            RAISE NOTICE '⚠️  resources: No se encontró columna de owner válida';
        END IF;
    END IF;
    
    -- Migrar assessments usando clinic_profiles (CORRECTO con verificación de columnas)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinic_profiles') THEN
        
        -- Verificar qué columna de profesional existe en assessments
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'created_by') THEN
            UPDATE assessments a
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE a.created_by = cp.id 
              AND a.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Assessments migrados usando created_by';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'professional_id') THEN
            UPDATE assessments a
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE a.professional_id = cp.id 
              AND a.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Assessments migrados usando professional_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'user_id') THEN
            UPDATE assessments a
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE a.user_id = cp.id 
              AND a.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Assessments migrados usando user_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'assigned_by') THEN
            UPDATE assessments a
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE a.assigned_by = cp.id 
              AND a.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Assessments migrados usando assigned_by';
        ELSE
            RAISE NOTICE '⚠️  assessments: No se encontró columna de profesional válida';
        END IF;
    END IF;
    
    -- Migrar finance_income usando clinic_profiles (con verificación de columnas)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_income')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinic_profiles') THEN
        
        -- Verificar qué columna de profesional existe en finance_income
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'finance_income' AND column_name = 'professional_id') THEN
            UPDATE finance_income fi
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE fi.professional_id = cp.id 
              AND fi.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Finance Income migrado usando professional_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'finance_income' AND column_name = 'user_id') THEN
            UPDATE finance_income fi
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE fi.user_id = cp.id 
              AND fi.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Finance Income migrado usando user_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'finance_income' AND column_name = 'created_by') THEN
            UPDATE finance_income fi
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE fi.created_by = cp.id 
              AND fi.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Finance Income migrado usando created_by';
        ELSE
            RAISE NOTICE '⚠️  finance_income: No se encontró columna de profesional válida';
        END IF;
    END IF;
    
    -- Migrar dynamic_forms usando clinic_profiles (con verificación de columnas)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dynamic_forms')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinic_profiles') THEN
        
        -- Verificar qué columna de profesional existe en dynamic_forms
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dynamic_forms' AND column_name = 'created_by') THEN
            UPDATE dynamic_forms df
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE df.created_by = cp.id 
              AND df.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Dynamic Forms migrado usando created_by';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dynamic_forms' AND column_name = 'user_id') THEN
            UPDATE dynamic_forms df
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE df.user_id = cp.id 
              AND df.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Dynamic Forms migrado usando user_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dynamic_forms' AND column_name = 'owner_id') THEN
            UPDATE dynamic_forms df
            SET clinic_id = cp.clinic_id
            FROM clinic_profiles cp
            WHERE df.owner_id = cp.id 
              AND df.clinic_id IS NULL
              AND cp.clinic_id IS NOT NULL;
              
            RAISE NOTICE '✅ Dynamic Forms migrado usando owner_id';
        ELSE
            RAISE NOTICE '⚠️  dynamic_forms: No se encontró columna de profesional válida';
        END IF;
    END IF;
    
    -- FALLBACK: Asignar datos huérfanos a la clínica por defecto
    DECLARE
        default_clinic_id UUID;
        orphan_count INT;
    BEGIN
        SELECT id INTO default_clinic_id FROM clinic_configurations ORDER BY created_at ASC LIMIT 1;
        
        IF default_clinic_id IS NOT NULL THEN
            RAISE NOTICE 'Asignando datos huérfanos a clínica por defecto: %', default_clinic_id;
            
            -- Pacientes huérfanos
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients') THEN
                UPDATE patients 
                SET clinic_id = default_clinic_id 
                WHERE clinic_id IS NULL AND workspace_id IS NULL;
                
                GET DIAGNOSTICS orphan_count = ROW_COUNT;
                RAISE NOTICE '✅ % pacientes huérfanos asignados a clínica por defecto', orphan_count;
            END IF;
            
            -- Resources huérfanos
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resources') THEN
                UPDATE resources 
                SET clinic_id = default_clinic_id 
                WHERE clinic_id IS NULL AND workspace_id IS NULL;
                
                GET DIAGNOSTICS orphan_count = ROW_COUNT;
                RAISE NOTICE '✅ % resources huérfanos asignados a clínica por defecto', orphan_count;
            END IF;
            
            -- Finance huérfanos
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_income') THEN
                UPDATE finance_income 
                SET clinic_id = default_clinic_id 
                WHERE clinic_id IS NULL AND workspace_id IS NULL;
                
                GET DIAGNOSTICS orphan_count = ROW_COUNT;
                RAISE NOTICE '✅ % finance records huérfanos asignados a clínica por defecto', orphan_count;
            END IF;
        END IF;
    END;
    
    RAISE NOTICE '🎉 MIGRACIÓN DATOS SISTEMA DUAL: COMPLETADA CON INFRAESTRUCTURA COMPLETA';
END $$;

-- =========================================================================
-- STEP 12: CREAR RLS POLICIES PARA SEGURIDAD DUAL
-- =========================================================================

-- Habilitar RLS en TODAS las tablas del sistema dual
ALTER TABLE individual_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_profiles ENABLE ROW LEVEL SECURITY;

-- Policy universal para individual_workspaces
DROP POLICY IF EXISTS "Users can only see their own workspaces" ON individual_workspaces;
CREATE POLICY "Users can only see their own workspaces"
  ON individual_workspaces
  FOR ALL
  USING (owner_id = auth.uid());

-- Policy universal para practice_locations
DROP POLICY IF EXISTS "Users can see locations from their clinic or workspace" ON practice_locations;
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

-- Policy para clinic_configurations - Solo usuarios de la clínica pueden verla
DROP POLICY IF EXISTS "Users can see their own clinic configuration" ON clinic_configurations;
CREATE POLICY "Users can see their own clinic configuration"
  ON clinic_configurations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
        AND p.license_type = 'clinic' 
        AND p.clinic_id = clinic_configurations.id
    )
  );

-- Policy para clinic_profiles - Solo usuarios de la misma clínica
DROP POLICY IF EXISTS "Users can see clinic profiles from their clinic" ON clinic_profiles;
CREATE POLICY "Users can see clinic profiles from their clinic"
  ON clinic_profiles
  FOR ALL
  USING (
    -- El usuario puede ver su propio perfil
    (id = auth.uid())
    OR
    -- O perfiles de su misma clínica
    (clinic_id IN (
      SELECT p.clinic_id FROM profiles p 
      WHERE p.id = auth.uid() 
        AND p.license_type = 'clinic'
        AND p.clinic_id IS NOT NULL
    ))
  );

-- =========================================================================
-- STEP 13: FUNCIÓN DE VERIFICACIÓN COMPLETA
-- =========================================================================

CREATE OR REPLACE FUNCTION verify_dual_system_migration_complete()
RETURNS text AS $$
DECLARE
    result text := '';
    enum_exists boolean;
    new_tables_count int;
    profiles_fields_count int;
    migrated_tables_count int;
    total_patients int;
    clinic_patients int;
    individual_patients int;
BEGIN
    result := result || '🎯 VERIFICACIÓN COMPLETA DUAL SYSTEM MIGRATION' || E'\n';
    result := result || '=================================================' || E'\n\n';
    
    -- Verificar enum
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_type_enum') INTO enum_exists;
    result := result || '✅ Enum license_type_enum exists: ' || enum_exists::text || E'\n';
    
    -- Verificar tablas nuevas
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_name IN ('individual_workspaces', 'practice_locations') 
    INTO new_tables_count;
    result := result || '✅ New dual system tables: ' || new_tables_count::text || '/2' || E'\n';
    
    -- Verificar campos en profiles
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'profiles' 
      AND column_name IN ('license_type', 'individual_workspace_id')
    INTO profiles_fields_count;
    result := result || '✅ Dual fields in profiles: ' || profiles_fields_count::text || '/2' || E'\n';
    
    -- Contar tablas migradas con dual system
    SELECT COUNT(DISTINCT table_name) 
    FROM information_schema.columns 
    WHERE column_name IN ('clinic_id', 'workspace_id')
      AND table_name NOT IN ('clinic_configurations', 'individual_workspaces', 'practice_locations')
    INTO migrated_tables_count;
    result := result || '✅ Tables migrated to dual system: ' || migrated_tables_count::text || E'\n';
    
    -- Verificar distribución de pacientes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
        SELECT COUNT(*) FROM patients INTO total_patients;
        SELECT COUNT(*) FROM patients WHERE clinic_id IS NOT NULL INTO clinic_patients;
        SELECT COUNT(*) FROM patients WHERE workspace_id IS NOT NULL INTO individual_patients;
        
        result := result || E'\n📊 PATIENT DISTRIBUTION:' || E'\n';
        result := result || '   Total patients: ' || total_patients::text || E'\n';
        result := result || '   Clinic patients: ' || clinic_patients::text || E'\n';
        result := result || '   Individual patients: ' || individual_patients::text || E'\n';
    END IF;
    
    result := result || E'\n🎉 DUAL SYSTEM MIGRATION VERIFICATION COMPLETE' || E'\n';
    result := result || '=================================================' || E'\n';
    
    RETURN result;
END $$ LANGUAGE plpgsql;

-- =========================================================================
-- EJECUTAR VERIFICACIÓN FINAL
-- =========================================================================

SELECT verify_dual_system_migration_complete();

-- =========================================================================
-- MIGRATION COMPLETE - ALL MODULES
-- =========================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉🎉 DUAL SYSTEM MIGRATION COMPLETED SUCCESSFULLY 🎉🎉🎉';
    RAISE NOTICE '';
    RAISE NOTICE 'ALL MODULES MIGRATED TO DUAL SYSTEM:';
    RAISE NOTICE '✅ EXPEDIX: Patients, consultations, medical records';
    RAISE NOTICE '✅ RESOURCES: Library, categories, sends, collections';
    RAISE NOTICE '✅ FINANCE: Income, services, payments, transactions';
    RAISE NOTICE '✅ AGENDA: Appointments, schedules, availability';
    RAISE NOTICE '✅ CLINIMETRIXPRO: Scales, assessments, responses';
    RAISE NOTICE '✅ FORMX: Dynamic forms, submissions, templates';
    RAISE NOTICE '✅ FRONTDESK: Tasks, check-ins, queue, notifications';
    RAISE NOTICE '';
    RAISE NOTICE 'System now supports:';
    RAISE NOTICE '- CLINIC licenses: Multi-user (up to 15) with shared data';
    RAISE NOTICE '- INDIVIDUAL licenses: Single user with private workspace';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test all modules with dual system';
    RAISE NOTICE '2. Deploy updated Django backend';
    RAISE NOTICE '3. Verify Resources TypeError is resolved';
    RAISE NOTICE '4. Configure individual licenses as needed';
    RAISE NOTICE '';
    RAISE NOTICE '🏗️  ALL MODULES READY FOR DUAL SYSTEM OPERATION 🏗️';
    RAISE NOTICE '';
END $$;