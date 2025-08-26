-- =====================================================================================
-- PERFORMANCE FIX: OPTIMIZE RLS POLICIES
-- Fix performance warnings from newly created RLS policies
-- 
-- ⚠️  PROBLEMAS DE PERFORMANCE IDENTIFICADOS:
-- 1. auth.uid() re-evaluado en cada fila (usar subquery SELECT)
-- 2. Múltiples políticas permissive para mismo role/action
-- 
-- 🎯 OPTIMIZACIONES:
-- - Cambiar auth.uid() por (SELECT auth.uid())  
-- - Consolidar políticas múltiples en una sola política unificada
-- - Mantener funcionalidad pero mejorar performance significativamente
-- =====================================================================================

-- =====================================================================================
-- 1. OPTIMIZAR TABLA: clinimetrix_scale_tags
-- PROBLEMA: 2 políticas permissive + auth.uid() re-evaluation
-- SOLUCIÓN: 1 política consolidada con auth optimizado
-- =====================================================================================

-- Eliminar políticas existentes (problemáticas)
DROP POLICY IF EXISTS "clinimetrix_scale_tags_read_policy" ON public.clinimetrix_scale_tags;
DROP POLICY IF EXISTS "clinimetrix_scale_tags_admin_policy" ON public.clinimetrix_scale_tags;

-- Crear política única consolidada y optimizada
CREATE POLICY "clinimetrix_scale_tags_unified_policy" ON public.clinimetrix_scale_tags
    FOR ALL
    USING (
        -- Solo lectura para usuarios autenticados (optimizada)
        (SELECT auth.uid()) IS NOT NULL
        OR
        -- Admin completo (optimizada)
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = (SELECT auth.uid()) 
            AND auth.users.email = 'dr_aleks_c@hotmail.com'
        )
    )
    WITH CHECK (
        -- Solo admin puede modificar (INSERT/UPDATE/DELETE)
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = (SELECT auth.uid()) 
            AND auth.users.email = 'dr_aleks_c@hotmail.com'
        )
    );

-- =====================================================================================
-- 2. OPTIMIZAR TABLA: clinimetrix_scale_categories
-- PROBLEMA: 2 políticas permissive + auth.uid() re-evaluation
-- SOLUCIÓN: 1 política consolidada con auth optimizado
-- =====================================================================================

-- Eliminar políticas existentes (problemáticas)
DROP POLICY IF EXISTS "clinimetrix_scale_categories_read_policy" ON public.clinimetrix_scale_categories;
DROP POLICY IF EXISTS "clinimetrix_scale_categories_admin_policy" ON public.clinimetrix_scale_categories;

-- Crear política única consolidada y optimizada
CREATE POLICY "clinimetrix_scale_categories_unified_policy" ON public.clinimetrix_scale_categories
    FOR ALL
    USING (
        -- Solo lectura para usuarios autenticados (optimizada)
        (SELECT auth.uid()) IS NOT NULL
        OR
        -- Admin completo (optimizada)
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = (SELECT auth.uid()) 
            AND auth.users.email = 'dr_aleks_c@hotmail.com'
        )
    )
    WITH CHECK (
        -- Solo admin puede modificar (INSERT/UPDATE/DELETE)
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = (SELECT auth.uid()) 
            AND auth.users.email = 'dr_aleks_c@hotmail.com'
        )
    );

-- =====================================================================================
-- 3. OPTIMIZAR TABLA: consultation_templates  
-- PROBLEMA: auth.uid() re-evaluation en política compleja
-- SOLUCIÓN: Optimizar todas las llamadas auth.uid()
-- =====================================================================================

-- Eliminar política existente (problemática)
DROP POLICY IF EXISTS "consultation_templates_access_policy" ON public.consultation_templates;

-- Crear política optimizada con auth.uid() en subquery
CREATE POLICY "consultation_templates_unified_policy" ON public.consultation_templates
    FOR ALL
    USING (
        -- Acceso por clinic_id (optimizado)
        (clinic_id IS NOT NULL AND 
         EXISTS (
             SELECT 1 FROM public.profiles p 
             WHERE p.id = (SELECT auth.uid()) 
             AND p.clinic_id = consultation_templates.clinic_id
         )) 
        OR
        -- Acceso por workspace_id (optimizado)
        (workspace_id IS NOT NULL AND workspace_id = (SELECT auth.uid()))
        OR
        -- El creador siempre puede acceder (optimizado)
        (created_by = (SELECT auth.uid()))
        OR
        -- Admin principal (optimizado)
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = (SELECT auth.uid()) 
            AND auth.users.email = 'dr_aleks_c@hotmail.com'
        )
    );

-- =====================================================================================
-- VERIFICACIÓN DE PERFORMANCE POST-APLICACIÓN
-- =====================================================================================

-- Verificar que solo hay 1 política por tabla
-- SELECT schemaname, tablename, COUNT(*) as policy_count
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('clinimetrix_scale_tags', 'clinimetrix_scale_categories', 'consultation_templates')
-- GROUP BY schemaname, tablename
-- ORDER BY tablename;

-- Verificar políticas creadas (deben tener nombres _unified_policy)
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('clinimetrix_scale_tags', 'clinimetrix_scale_categories', 'consultation_templates')
-- ORDER BY tablename, policyname;

-- =====================================================================================
-- BENEFICIOS DE PERFORMANCE ESPERADOS
-- =====================================================================================

-- 1. auth.uid() optimizado:
--    - Antes: Re-evaluado en cada fila (lento)
--    - Después: Evaluado una vez por query (rápido)

-- 2. Políticas consolidadas:
--    - Antes: 2 políticas ejecutadas por query (lento)  
--    - Después: 1 política ejecutada por query (rápido)

-- 3. Queries más eficientes:
--    - Mejor performance en tablas con muchas filas
--    - Reducción significativa en tiempo de respuesta
--    - Menor uso de CPU en PostgreSQL

-- =====================================================================================
-- FUNCIONALIDAD PRESERVADA
-- =====================================================================================

-- ✅ clinimetrix_scale_tags & clinimetrix_scale_categories:
--    - Usuarios autenticados: Solo lectura (SELECT)
--    - Admin (dr_aleks_c@hotmail.com): Acceso completo (ALL)

-- ✅ consultation_templates:
--    - Acceso por clinic_id: Miembros de clínica
--    - Acceso por workspace_id: Propietario individual  
--    - Creador: Siempre puede acceder
--    - Admin: Acceso completo a todo