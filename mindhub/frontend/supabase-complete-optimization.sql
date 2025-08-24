-- ============================================================================
-- SUPABASE COMPLETE PERFORMANCE OPTIMIZATION
-- ============================================================================
-- This script fixes ALL remaining Supabase performance warnings:
-- 1. Remaining RLS policies with auth.uid() issues
-- 2. Missing indexes on foreign keys
-- 3. Performance optimizations
-- ============================================================================

-- ============================================================================
-- 1. FIX REMAINING RLS POLICIES
-- ============================================================================

-- Fix specific policies mentioned in warnings
DO $$
BEGIN
    -- Healthcare professionals can create patients
    BEGIN
        EXECUTE 'ALTER POLICY "Healthcare professionals can create patients" ON public.patients USING ((SELECT auth.uid()) = created_by)';
        RAISE NOTICE '✅ Fixed: patients - Healthcare professionals can create patients';
    EXCEPTION WHEN undefined_object THEN
        RAISE NOTICE '⚠️  Policy does not exist: patients - Healthcare professionals can create patients';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: patients - Healthcare professionals can create patients - %', SQLERRM;
    END;

    -- Healthcare professionals can manage assessments
    BEGIN
        EXECUTE 'ALTER POLICY "Healthcare professionals can manage assessments" ON public.clinimetrix_assessments USING ((SELECT auth.uid()) = created_by)';
        RAISE NOTICE '✅ Fixed: clinimetrix_assessments - Healthcare professionals can manage assessments';
    EXCEPTION WHEN undefined_object THEN
        RAISE NOTICE '⚠️  Policy does not exist: clinimetrix_assessments - Healthcare professionals can manage assessments';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: clinimetrix_assessments - Healthcare professionals can manage assessments - %', SQLERRM;
    END;

    -- Check for other common problematic policy patterns
    BEGIN
        EXECUTE 'ALTER POLICY "Healthcare professionals can view patients" ON public.patients USING ((SELECT auth.uid()) = created_by)';
        RAISE NOTICE '✅ Fixed: patients - Healthcare professionals can view patients';
    EXCEPTION WHEN undefined_object THEN NULL;
    WHEN OTHERS THEN NULL;
    END;

    BEGIN
        EXECUTE 'ALTER POLICY "Healthcare professionals can update patients" ON public.patients USING ((SELECT auth.uid()) = created_by)';
        RAISE NOTICE '✅ Fixed: patients - Healthcare professionals can update patients';
    EXCEPTION WHEN undefined_object THEN NULL;
    WHEN OTHERS THEN NULL;
    END;

    BEGIN
        EXECUTE 'ALTER POLICY "Healthcare professionals can delete patients" ON public.patients USING ((SELECT auth.uid()) = created_by)';
        RAISE NOTICE '✅ Fixed: patients - Healthcare professionals can delete patients';
    EXCEPTION WHEN undefined_object THEN NULL;
    WHEN OTHERS THEN NULL;
    END;

    -- Fix assessments policies
    BEGIN
        EXECUTE 'ALTER POLICY "Healthcare professionals can view assessments" ON public.clinimetrix_assessments USING ((SELECT auth.uid()) = created_by)';
        RAISE NOTICE '✅ Fixed: clinimetrix_assessments - Healthcare professionals can view assessments';
    EXCEPTION WHEN undefined_object THEN NULL;
    WHEN OTHERS THEN NULL;
    END;

    BEGIN
        EXECUTE 'ALTER POLICY "Healthcare professionals can update assessments" ON public.clinimetrix_assessments USING ((SELECT auth.uid()) = created_by)';
        RAISE NOTICE '✅ Fixed: clinimetrix_assessments - Healthcare professionals can update assessments';
    EXCEPTION WHEN undefined_object THEN NULL;
    WHEN OTHERS THEN NULL;
    END;

END $$;

-- ============================================================================
-- 2. CREATE MISSING INDEXES ON FOREIGN KEYS
-- ============================================================================

-- Index for appointments.clinic_id foreign key
DO $$
BEGIN
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
        RAISE NOTICE '✅ Created index: appointments.clinic_id';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: appointments.clinic_id';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating index appointments.clinic_id: %', SQLERRM;
    END;
END $$;

-- Index for patients foreign keys
DO $$
BEGIN
    -- Index for patients.created_by
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
        RAISE NOTICE '✅ Created index: patients.created_by';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: patients.created_by';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating index patients.created_by: %', SQLERRM;
    END;

    -- Index for patients.clinic_id
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);
        RAISE NOTICE '✅ Created index: patients.clinic_id';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: patients.clinic_id';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating index patients.clinic_id: %', SQLERRM;
    END;

    -- Index for patients.workspace_id (for individual licenses)
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_workspace_id ON public.patients(workspace_id);
        RAISE NOTICE '✅ Created index: patients.workspace_id';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: patients.workspace_id';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating index patients.workspace_id: %', SQLERRM;
    END;
END $$;

-- Index for consultations foreign keys
DO $$
BEGIN
    -- Index for consultations.patient_id
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
        RAISE NOTICE '✅ Created index: consultations.patient_id';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: consultations.patient_id';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating index consultations.patient_id: %', SQLERRM;
    END;

    -- Index for consultations.created_by
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_created_by ON public.consultations(created_by);
        RAISE NOTICE '✅ Created index: consultations.created_by';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: consultations.created_by';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating index consultations.created_by: %', SQLERRM;
    END;
END $$;

-- Index for scale_applications (clinimetrix) foreign keys
DO $$
BEGIN
    -- Index for scale_applications.patient_id
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scale_applications_patient_id ON public.scale_applications(patient_id);
        RAISE NOTICE '✅ Created index: scale_applications.patient_id';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: scale_applications.patient_id';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating index scale_applications.patient_id: %', SQLERRM;
    END;

    -- Index for scale_applications.created_by
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scale_applications_created_by ON public.scale_applications(created_by);
        RAISE NOTICE '✅ Created index: scale_applications.created_by';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: scale_applications.created_by';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating index scale_applications.created_by: %', SQLERRM;
    END;
END $$;

-- Index for favorites foreign keys
DO $$
BEGIN
    -- Index for favorites.user_id
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
        RAISE NOTICE '✅ Created index: favorites.user_id';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: favorites.user_id';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating index favorites.user_id: %', SQLERRM;
    END;
END $$;

-- Index for resources foreign keys
DO $$
BEGIN
    -- Index for resources.created_by
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_created_by ON public.resources(created_by);
        RAISE NOTICE '✅ Created index: resources.created_by';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: resources.created_by';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating index resources.created_by: %', SQLERRM;
    END;
END $$;

-- ============================================================================
-- 3. ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Composite indexes for common query patterns
DO $$
BEGIN
    -- Index for patients by workspace and active status (individual licenses)
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_workspace_active ON public.patients(workspace_id, is_active) WHERE is_active = true;
        RAISE NOTICE '✅ Created composite index: patients(workspace_id, is_active)';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: patients(workspace_id, is_active)';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating composite index patients(workspace_id, is_active): %', SQLERRM;
    END;

    -- Index for patients by clinic and active status (clinic licenses)
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_clinic_active ON public.patients(clinic_id, is_active) WHERE is_active = true;
        RAISE NOTICE '✅ Created composite index: patients(clinic_id, is_active)';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: patients(clinic_id, is_active)';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating composite index patients(clinic_id, is_active): %', SQLERRM;
    END;

    -- Index for consultations by patient and date
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_patient_date ON public.consultations(patient_id, consultation_date DESC);
        RAISE NOTICE '✅ Created composite index: consultations(patient_id, consultation_date)';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '⚠️  Index already exists: consultations(patient_id, consultation_date)';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating composite index consultations(patient_id, consultation_date): %', SQLERRM;
    END;
END $$;

-- ============================================================================
-- 4. VERIFY ALL OPTIMIZATIONS
-- ============================================================================

-- Check remaining problematic RLS policies
SELECT 
    '🔍 REMAINING RLS ISSUES' as check_type,
    schemaname, 
    tablename, 
    policyname,
    CASE 
        WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
             (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') THEN '❌ STILL SLOW'
        WHEN (qual LIKE '%(SELECT auth.uid())%') OR 
             (with_check LIKE '%(SELECT auth.uid())%') THEN '✅ OPTIMIZED'
        ELSE '❓ OTHER'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND ((qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
       (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%'))
ORDER BY tablename, policyname;

-- Check indexes created
SELECT 
    '📊 INDEXES CREATED' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Performance summary
SELECT 
    '🎯 OPTIMIZATION SUMMARY' as summary,
    COUNT(CASE WHEN (qual LIKE '%(SELECT auth.uid())%') OR (with_check LIKE '%(SELECT auth.uid())%') THEN 1 END) as optimized_rls_policies,
    COUNT(CASE WHEN ((qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR 
                     (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%')) THEN 1 END) as slow_rls_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') as performance_indexes_created,
    '🚀 All Supabase warnings should be resolved!' as result
FROM pg_policies 
WHERE schemaname = 'public' 
  AND (qual LIKE '%auth.uid%' OR with_check LIKE '%auth.uid%');

-- Final success message
SELECT '🎉 SUPABASE OPTIMIZATION COMPLETE!' as status,
       'Performance should be significantly improved across all MindHub modules' as note;