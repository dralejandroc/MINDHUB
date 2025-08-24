-- RLS Performance Optimization Script for MindHub Supabase Database
-- This fixes the auth.uid() re-evaluation issue across all tables

-- ==================================================
-- 1. PROFILES TABLE - Core user profiles
-- ==================================================

-- Fix "Users can update own profile" policy
ALTER POLICY "Users can update own profile" ON public.profiles 
USING ((SELECT auth.uid()) = id);

-- Fix "Users can view own profile" policy  
ALTER POLICY "Users can view own profile" ON public.profiles 
USING ((SELECT auth.uid()) = id);

-- If there are other profile policies, add them here
-- ALTER POLICY "Users can insert own profile" ON public.profiles 
-- FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- ==================================================
-- 2. PATIENTS TABLE - Patient management
-- ==================================================

-- Fix patient access policies
ALTER POLICY "Users can view own patients" ON public.patients 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can update own patients" ON public.patients 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can insert patients" ON public.patients 
FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can delete own patients" ON public.patients 
USING ((SELECT auth.uid()) = created_by);

-- ==================================================
-- 3. CONSULTATIONS TABLE - Medical consultations
-- ==================================================

-- Fix consultation access policies
ALTER POLICY "Users can view own consultations" ON public.consultations 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can update own consultations" ON public.consultations 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can insert consultations" ON public.consultations 
FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can delete own consultations" ON public.consultations 
USING ((SELECT auth.uid()) = created_by);

-- ==================================================
-- 4. FAVORITES TABLE - User favorites
-- ==================================================

-- Fix favorites policies
ALTER POLICY "Users can manage own favorites" ON public.favorites 
USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view own favorites" ON public.favorites 
USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert own favorites" ON public.favorites 
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete own favorites" ON public.favorites 
USING ((SELECT auth.uid()) = user_id);

-- ==================================================
-- 5. SCALE APPLICATIONS TABLE - Clinimetrix assessments
-- ==================================================

-- Fix scale applications policies
ALTER POLICY "Users can view own applications" ON public.scale_applications 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can update own applications" ON public.scale_applications 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can insert applications" ON public.scale_applications 
FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

-- ==================================================
-- 6. RESOURCES TABLE - Resource library
-- ==================================================

-- Fix resources policies
ALTER POLICY "Users can view own resources" ON public.resources 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can update own resources" ON public.resources 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can insert resources" ON public.resources 
FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can delete own resources" ON public.resources 
USING ((SELECT auth.uid()) = created_by);

-- ==================================================
-- 7. APPOINTMENTS TABLE - Agenda system
-- ==================================================

-- Fix appointment policies
ALTER POLICY "Users can view own appointments" ON public.appointments 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can update own appointments" ON public.appointments 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can insert appointments" ON public.appointments 
FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can delete own appointments" ON public.appointments 
USING ((SELECT auth.uid()) = created_by);

-- ==================================================
-- 8. FORM INSTANCES TABLE - FormX submissions
-- ==================================================

-- Fix form instances policies
ALTER POLICY "Users can view own forms" ON public.form_instances 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can update own forms" ON public.form_instances 
USING ((SELECT auth.uid()) = created_by);

ALTER POLICY "Users can insert forms" ON public.form_instances 
FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

-- ==================================================
-- 9. WORKSPACE FILTERING (For Individual Licenses)
-- ==================================================

-- If using workspace-based filtering for individual licenses
-- ALTER POLICY "Individual workspace access" ON public.patients 
-- USING (workspace_id IN (
--   SELECT individual_workspace_id 
--   FROM public.profiles 
--   WHERE id = (SELECT auth.uid())
-- ));

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Check which policies might still need fixing
-- Run this after applying the fixes to verify
/*
SELECT schemaname, tablename, policyname, 
       CASE 
         WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN 'NEEDS_FIX'
         WHEN qual LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.uid())%' THEN 'OPTIMIZED'
         ELSE 'CHECK_MANUAL'
       END as status,
       qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%auth.%' OR with_check LIKE '%auth.%')
ORDER BY status, tablename, policyname;
*/

-- Performance improvement should be visible immediately
-- Monitor query times for tables with high row counts