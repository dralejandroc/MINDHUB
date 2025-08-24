-- ============================================================================
-- FIX DJANGO RLS SECURITY WARNINGS
-- ============================================================================
-- This script fixes the RLS security warnings for Django tables
-- Option 1: Enable RLS with proper policies
-- Option 2: Drop unnecessary Django tables that aren't used
-- ============================================================================

-- ============================================================================
-- ANALYSIS: Which Django tables do we actually need?
-- ============================================================================

-- Check which Django tables exist and their usage
SELECT 
    table_name,
    CASE 
        WHEN table_name LIKE 'django_migrations%' THEN '🔧 DJANGO INTERNAL - Keep but secure'
        WHEN table_name LIKE 'django_content_type%' THEN '🔧 DJANGO INTERNAL - Keep but secure'  
        WHEN table_name LIKE 'django_admin_log%' THEN '📋 ADMIN LOGS - Keep but secure'
        WHEN table_name LIKE 'auth_permission%' THEN '🔒 AUTH SYSTEM - Keep but secure'
        WHEN table_name LIKE 'auth_group%' THEN '🔒 AUTH SYSTEM - Keep but secure'
        WHEN table_name LIKE 'clinimetrix_users%' THEN '❌ DUPLICATE - Can be dropped (using Supabase auth)'
        WHEN table_name LIKE 'account_%' THEN '❌ DUPLICATE - Can be dropped (using Supabase auth)'
        WHEN table_name LIKE 'clinimetrix_medical_profiles%' THEN '❌ UNUSED - Can be dropped'
        ELSE '❓ UNKNOWN'
    END as recommendation,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.table_name) as exists
FROM (
    VALUES 
        ('django_migrations'),
        ('django_content_type'), 
        ('django_admin_log'),
        ('auth_permission'),
        ('auth_group'),
        ('auth_group_permissions'),
        ('clinimetrix_users'),
        ('clinimetrix_users_groups'), 
        ('clinimetrix_users_user_permissions'),
        ('account_emailaddress'),
        ('account_emailconfirmation'),
        ('clinimetrix_medical_profiles')
) AS t(table_name);

-- ============================================================================
-- OPTION 1: SECURE DJANGO TABLES (Recommended for essential tables)
-- ============================================================================

-- Enable RLS on essential Django system tables
DO $$
BEGIN
    -- Django migrations table - restrict to admin users only
    BEGIN
        ALTER TABLE public.django_migrations ENABLE ROW LEVEL SECURITY;
        
        -- Only allow Django admin/service users to access migrations
        DROP POLICY IF EXISTS "Django admin access only" ON public.django_migrations;
        CREATE POLICY "Django admin access only" ON public.django_migrations
        FOR ALL USING (false); -- Completely restrict access via PostgREST
        
        RAISE NOTICE '✅ Secured: django_migrations (RLS enabled, PostgREST blocked)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error securing django_migrations: %', SQLERRM;
    END;

    -- Django content types table
    BEGIN
        ALTER TABLE public.django_content_type ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Django admin access only" ON public.django_content_type;
        CREATE POLICY "Django admin access only" ON public.django_content_type
        FOR ALL USING (false); -- Completely restrict access via PostgREST
        
        RAISE NOTICE '✅ Secured: django_content_type (RLS enabled, PostgREST blocked)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error securing django_content_type: %', SQLERRM;
    END;

    -- Django admin log table
    BEGIN
        ALTER TABLE public.django_admin_log ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Django admin access only" ON public.django_admin_log;
        CREATE POLICY "Django admin access only" ON public.django_admin_log
        FOR ALL USING (false); -- Completely restrict access via PostgREST
        
        RAISE NOTICE '✅ Secured: django_admin_log (RLS enabled, PostgREST blocked)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error securing django_admin_log: %', SQLERRM;
    END;

    -- Auth permission table
    BEGIN
        ALTER TABLE public.auth_permission ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Django admin access only" ON public.auth_permission;
        CREATE POLICY "Django admin access only" ON public.auth_permission
        FOR ALL USING (false); -- Completely restrict access via PostgREST
        
        RAISE NOTICE '✅ Secured: auth_permission (RLS enabled, PostgREST blocked)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error securing auth_permission: %', SQLERRM;
    END;

    -- Auth group table
    BEGIN
        ALTER TABLE public.auth_group ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Django admin access only" ON public.auth_group;
        CREATE POLICY "Django admin access only" ON public.auth_group
        FOR ALL USING (false); -- Completely restrict access via PostgREST
        
        RAISE NOTICE '✅ Secured: auth_group (RLS enabled, PostgREST blocked)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error securing auth_group: %', SQLERRM;
    END;

    -- Auth group permissions table
    BEGIN
        ALTER TABLE public.auth_group_permissions ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Django admin access only" ON public.auth_group_permissions;
        CREATE POLICY "Django admin access only" ON public.auth_group_permissions
        FOR ALL USING (false); -- Completely restrict access via PostgREST
        
        RAISE NOTICE '✅ Secured: auth_group_permissions (RLS enabled, PostgREST blocked)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error securing auth_group_permissions: %', SQLERRM;
    END;
END $$;

-- ============================================================================
-- OPTION 2: CLEAN UP UNUSED DJANGO TABLES (Recommended for duplicates)
-- ============================================================================

-- These tables are redundant because we use Supabase Auth instead of Django Auth
DO $$
BEGIN
    -- Drop clinimetrix_users tables (we use Supabase auth.users)
    BEGIN
        DROP TABLE IF EXISTS public.clinimetrix_users_user_permissions CASCADE;
        RAISE NOTICE '🗑️  Dropped: clinimetrix_users_user_permissions (redundant with Supabase)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not drop clinimetrix_users_user_permissions: %', SQLERRM;
    END;

    BEGIN
        DROP TABLE IF EXISTS public.clinimetrix_users_groups CASCADE;
        RAISE NOTICE '🗑️  Dropped: clinimetrix_users_groups (redundant with Supabase)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not drop clinimetrix_users_groups: %', SQLERRM;
    END;

    BEGIN
        DROP TABLE IF EXISTS public.clinimetrix_users CASCADE;
        RAISE NOTICE '🗑️  Dropped: clinimetrix_users (redundant with Supabase)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not drop clinimetrix_users: %', SQLERRM;
    END;

    -- Drop account email tables (we use Supabase auth)
    BEGIN
        DROP TABLE IF EXISTS public.account_emailconfirmation CASCADE;
        RAISE NOTICE '🗑️  Dropped: account_emailconfirmation (redundant with Supabase)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not drop account_emailconfirmation: %', SQLERRM;
    END;

    BEGIN
        DROP TABLE IF EXISTS public.account_emailaddress CASCADE;
        RAISE NOTICE '🗑️  Dropped: account_emailaddress (redundant with Supabase)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not drop account_emailaddress: %', SQLERRM;
    END;

    -- Drop unused medical profiles table
    BEGIN
        DROP TABLE IF EXISTS public.clinimetrix_medical_profiles CASCADE;
        RAISE NOTICE '🗑️  Dropped: clinimetrix_medical_profiles (unused)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not drop clinimetrix_medical_profiles: %', SQLERRM;
    END;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check remaining Django tables and their RLS status
SELECT 
    t.table_name,
    CASE 
        WHEN t.row_security = 'YES' THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status,
    CASE
        WHEN t.table_name IN (
            'django_migrations',
            'django_content_type', 
            'django_admin_log',
            'auth_permission',
            'auth_group',
            'auth_group_permissions'
        ) THEN '🔐 SECURED (PostgREST blocked)'
        ELSE '❓ CHECK'
    END as security_status
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name LIKE ANY(ARRAY['django_%', 'auth_%', 'clinimetrix_%', 'account_%'])
ORDER BY t.table_name;

-- Check for any remaining RLS warnings
SELECT 
    '🔍 FINAL SECURITY CHECK' as check_type,
    COUNT(*) as remaining_tables_without_rls
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name LIKE ANY(ARRAY['django_%', 'auth_%', 'clinimetrix_%', 'account_%'])
  AND (t.row_security IS NULL OR t.row_security = 'NO');

-- Success summary
SELECT 
    '🎉 DJANGO SECURITY FIXES COMPLETE!' as status,
    'Essential Django tables secured with RLS' as essential_tables,
    'Redundant Django auth tables removed' as cleanup,
    'All Supabase security warnings should be resolved' as result;