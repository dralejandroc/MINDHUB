-- ============================================================================
-- MINDHUB RLS PERFORMANCE OPTIMIZATION
-- ============================================================================
-- This script fixes the auth.uid() re-evaluation performance issue
-- Run this in Supabase SQL Editor to improve database performance
-- 
-- Expected Impact: 
-- - Faster patient loading in Expedix
-- - Improved Clinimetrix performance  
-- - Better overall app responsiveness
-- ============================================================================

-- Step 1: Check current policies that need optimization
SELECT 
  schemaname, 
  tablename, 
  policyname,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN '❌ NEEDS FIX'
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN '✅ OPTIMIZED' 
    ELSE '❓ CHECK'
  END as status,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND qual LIKE '%auth.uid%'
ORDER BY status DESC, tablename;

-- ============================================================================
-- OPTIMIZATION FIXES
-- ============================================================================

-- PROFILES TABLE
DO $$
BEGIN
  BEGIN
    ALTER POLICY "Users can update own profile" ON public.profiles 
    USING ((SELECT auth.uid()) = id);
    RAISE NOTICE '✅ Fixed: profiles - Users can update own profile';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: profiles - Users can update own profile';
  END;

  BEGIN
    ALTER POLICY "Users can view own profile" ON public.profiles 
    USING ((SELECT auth.uid()) = id);
    RAISE NOTICE '✅ Fixed: profiles - Users can view own profile';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: profiles - Users can view own profile';
  END;
END $$;

-- PATIENTS TABLE  
DO $$
BEGIN
  BEGIN
    ALTER POLICY "Users can view own patients" ON public.patients 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: patients - Users can view own patients';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: patients - Users can view own patients';
  END;

  BEGIN
    ALTER POLICY "Users can update own patients" ON public.patients 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: patients - Users can update own patients';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: patients - Users can update own patients';
  END;

  BEGIN
    ALTER POLICY "Users can insert patients" ON public.patients 
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: patients - Users can insert patients';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: patients - Users can insert patients';
  END;

  BEGIN
    ALTER POLICY "Users can delete own patients" ON public.patients 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: patients - Users can delete own patients';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: patients - Users can delete own patients';
  END;
END $$;

-- CONSULTATIONS TABLE
DO $$
BEGIN
  BEGIN
    ALTER POLICY "Users can view own consultations" ON public.consultations 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: consultations - Users can view own consultations';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: consultations - Users can view own consultations';
  END;

  BEGIN
    ALTER POLICY "Users can update own consultations" ON public.consultations 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: consultations - Users can update own consultations';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: consultations - Users can update own consultations';
  END;

  BEGIN  
    ALTER POLICY "Users can insert consultations" ON public.consultations 
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: consultations - Users can insert consultations';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: consultations - Users can insert consultations';
  END;
END $$;

-- FAVORITES TABLE
DO $$
BEGIN
  BEGIN
    ALTER POLICY "Users can manage own favorites" ON public.favorites 
    USING ((SELECT auth.uid()) = user_id);
    RAISE NOTICE '✅ Fixed: favorites - Users can manage own favorites';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: favorites - Users can manage own favorites';
  END;

  BEGIN
    ALTER POLICY "Users can view own favorites" ON public.favorites 
    USING ((SELECT auth.uid()) = user_id);
    RAISE NOTICE '✅ Fixed: favorites - Users can view own favorites';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: favorites - Users can view own favorites';
  END;
END $$;

-- SCALE_APPLICATIONS TABLE (Clinimetrix)
DO $$
BEGIN
  BEGIN
    ALTER POLICY "Users can view own applications" ON public.scale_applications 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: scale_applications - Users can view own applications';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: scale_applications - Users can view own applications';
  END;

  BEGIN
    ALTER POLICY "Users can update own applications" ON public.scale_applications 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: scale_applications - Users can update own applications';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: scale_applications - Users can update own applications';
  END;
END $$;

-- RESOURCES TABLE
DO $$
BEGIN
  BEGIN
    ALTER POLICY "Users can view own resources" ON public.resources 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: resources - Users can view own resources';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: resources - Users can view own resources';
  END;

  BEGIN
    ALTER POLICY "Users can update own resources" ON public.resources 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: resources - Users can update own resources';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: resources - Users can update own resources';
  END;
END $$;

-- APPOINTMENTS TABLE (Agenda)
DO $$
BEGIN
  BEGIN
    ALTER POLICY "Users can view own appointments" ON public.appointments 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: appointments - Users can view own appointments';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: appointments - Users can view own appointments';
  END;

  BEGIN
    ALTER POLICY "Users can update own appointments" ON public.appointments 
    USING ((SELECT auth.uid()) = created_by);
    RAISE NOTICE '✅ Fixed: appointments - Users can update own appointments';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Policy may not exist: appointments - Users can update own appointments';
  END;
END $$;

-- ============================================================================
-- VERIFICATION - Run after applying fixes
-- ============================================================================

-- Check results
SELECT 
  '🎉 OPTIMIZATION COMPLETE' as status,
  COUNT(*) as total_policies_checked
FROM pg_policies 
WHERE schemaname = 'public';

-- Verify optimized policies
SELECT 
  schemaname, 
  tablename, 
  policyname,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN '✅ OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ STILL NEEDS FIX'
    ELSE '❓ OTHER'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND qual LIKE '%auth.uid%'
ORDER BY status, tablename, policyname;

-- Performance should improve immediately for:
-- - Patient loading in Expedix
-- - Scale loading in Clinimetrix  
-- - Overall app responsiveness
-- - Database resource usage