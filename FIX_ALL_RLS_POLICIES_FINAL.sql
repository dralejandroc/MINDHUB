-- SCRIPT FINAL PARA ARREGLAR TODAS LAS RLS POLICIES
-- Arregla tanto appointments como consultations para el sistema dual

-- =============================================================================
-- TABLA: APPOINTMENTS
-- =============================================================================

-- 1. Verificar RLS policies actuales en appointments
SELECT 'APPOINTMENTS - POLICIES ACTUALES:' as info;
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'appointments';

-- 2. ELIMINAR policies existentes de appointments
DROP POLICY IF EXISTS appointments_insert_by_clinic ON public.appointments;
DROP POLICY IF EXISTS appointments_select_by_clinic ON public.appointments;
DROP POLICY IF EXISTS appointments_update_by_clinic ON public.appointments;
DROP POLICY IF EXISTS appointments_delete_by_clinic ON public.appointments;

-- 3. CREAR nuevas RLS policies DUALES para appointments

CREATE POLICY appointments_insert_dual_system ON public.appointments
FOR INSERT 
TO public
WITH CHECK (
    -- Clinic license: verificar que clinic_id esté en memberships del usuario
    (clinic_id IS NOT NULL AND clinic_id IN (
        SELECT tenant_memberships.clinic_id
        FROM tenant_memberships
        WHERE tenant_memberships.user_id = auth.uid() 
        AND tenant_memberships.is_active = true
    ))
    OR
    -- Individual license: verificar que workspace_id pertenece al usuario autenticado
    (workspace_id IS NOT NULL AND workspace_id IN (
        SELECT individual_workspaces.id
        FROM individual_workspaces
        WHERE individual_workspaces.owner_id = auth.uid()
    ))
);

CREATE POLICY appointments_select_dual_system ON public.appointments
FOR SELECT 
TO public
USING (
    -- Clinic license: verificar que clinic_id esté en memberships del usuario
    (clinic_id IS NOT NULL AND clinic_id IN (
        SELECT tenant_memberships.clinic_id
        FROM tenant_memberships
        WHERE tenant_memberships.user_id = auth.uid() 
        AND tenant_memberships.is_active = true
    ))
    OR
    -- Individual license: verificar que workspace_id pertenece al usuario autenticado
    (workspace_id IS NOT NULL AND workspace_id IN (
        SELECT individual_workspaces.id
        FROM individual_workspaces
        WHERE individual_workspaces.owner_id = auth.uid()
    ))
);

CREATE POLICY appointments_update_dual_system ON public.appointments
FOR UPDATE 
TO public
USING (
    -- Clinic license: verificar que clinic_id esté en memberships del usuario
    (clinic_id IS NOT NULL AND clinic_id IN (
        SELECT tenant_memberships.clinic_id
        FROM tenant_memberships
        WHERE tenant_memberships.user_id = auth.uid() 
        AND tenant_memberships.is_active = true
    ))
    OR
    -- Individual license: verificar que workspace_id pertenece al usuario autenticado
    (workspace_id IS NOT NULL AND workspace_id IN (
        SELECT individual_workspaces.id
        FROM individual_workspaces
        WHERE individual_workspaces.owner_id = auth.uid()
    ))
);

CREATE POLICY appointments_delete_dual_system ON public.appointments
FOR DELETE 
TO public
USING (
    -- Clinic license: verificar que clinic_id esté en memberships del usuario
    (clinic_id IS NOT NULL AND clinic_id IN (
        SELECT tenant_memberships.clinic_id
        FROM tenant_memberships
        WHERE tenant_memberships.user_id = auth.uid() 
        AND tenant_memberships.is_active = true
    ))
    OR
    -- Individual license: verificar que workspace_id pertenece al usuario autenticado
    (workspace_id IS NOT NULL AND workspace_id IN (
        SELECT individual_workspaces.id
        FROM individual_workspaces
        WHERE individual_workspaces.owner_id = auth.uid()
    ))
);

-- =============================================================================
-- TABLA: CONSULTATIONS
-- =============================================================================

-- 4. Verificar RLS policies actuales en consultations
SELECT 'CONSULTATIONS - POLICIES ACTUALES:' as info;
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'consultations';

-- 5. ELIMINAR policies existentes de consultations (si no se hizo antes)
DROP POLICY IF EXISTS consultations_insert_by_clinic ON public.consultations;
DROP POLICY IF EXISTS consultations_select_by_clinic ON public.consultations;
DROP POLICY IF EXISTS consultations_update_by_clinic ON public.consultations;
DROP POLICY IF EXISTS consultations_delete_by_clinic ON public.consultations;

-- También eliminar las que creamos antes por si existen
DROP POLICY IF EXISTS consultations_insert_dual_system ON public.consultations;
DROP POLICY IF EXISTS consultations_select_dual_system ON public.consultations;
DROP POLICY IF EXISTS consultations_update_dual_system ON public.consultations;
DROP POLICY IF EXISTS consultations_delete_dual_system ON public.consultations;

-- 6. CREAR nuevas RLS policies DUALES para consultations

CREATE POLICY consultations_insert_dual_system ON public.consultations
FOR INSERT 
TO public
WITH CHECK (
    -- Clinic license: verificar que clinic_id esté en memberships del usuario
    (clinic_id IS NOT NULL AND clinic_id IN (
        SELECT tenant_memberships.clinic_id
        FROM tenant_memberships
        WHERE tenant_memberships.user_id = auth.uid() 
        AND tenant_memberships.is_active = true
    ))
    OR
    -- Individual license: verificar que workspace_id pertenece al usuario autenticado
    (workspace_id IS NOT NULL AND workspace_id IN (
        SELECT individual_workspaces.id
        FROM individual_workspaces
        WHERE individual_workspaces.owner_id = auth.uid()
    ))
);

CREATE POLICY consultations_select_dual_system ON public.consultations
FOR SELECT 
TO public
USING (
    -- Clinic license: verificar que clinic_id esté en memberships del usuario
    (clinic_id IS NOT NULL AND clinic_id IN (
        SELECT tenant_memberships.clinic_id
        FROM tenant_memberships
        WHERE tenant_memberships.user_id = auth.uid() 
        AND tenant_memberships.is_active = true
    ))
    OR
    -- Individual license: verificar que workspace_id pertenece al usuario autenticado
    (workspace_id IS NOT NULL AND workspace_id IN (
        SELECT individual_workspaces.id
        FROM individual_workspaces
        WHERE individual_workspaces.owner_id = auth.uid()
    ))
);

CREATE POLICY consultations_update_dual_system ON public.consultations
FOR UPDATE 
TO public
USING (
    -- Clinic license: verificar que clinic_id esté en memberships del usuario
    (clinic_id IS NOT NULL AND clinic_id IN (
        SELECT tenant_memberships.clinic_id
        FROM tenant_memberships
        WHERE tenant_memberships.user_id = auth.uid() 
        AND tenant_memberships.is_active = true
    ))
    OR
    -- Individual license: verificar que workspace_id pertenece al usuario autenticado
    (workspace_id IS NOT NULL AND workspace_id IN (
        SELECT individual_workspaces.id
        FROM individual_workspaces
        WHERE individual_workspaces.owner_id = auth.uid()
    ))
);

CREATE POLICY consultations_delete_dual_system ON public.consultations
FOR DELETE 
TO public
USING (
    -- Clinic license: verificar que clinic_id esté en memberships del usuario
    (clinic_id IS NOT NULL AND clinic_id IN (
        SELECT tenant_memberships.clinic_id
        FROM tenant_memberships
        WHERE tenant_memberships.user_id = auth.uid() 
        AND tenant_memberships.is_active = true
    ))
    OR
    -- Individual license: verificar que workspace_id pertenece al usuario autenticado
    (workspace_id IS NOT NULL AND workspace_id IN (
        SELECT individual_workspaces.id
        FROM individual_workspaces
        WHERE individual_workspaces.owner_id = auth.uid()
    ))
);

-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================

-- 7. Verificar que todas las policies se crearon correctamente
SELECT 'APPOINTMENTS - POLICIES NUEVAS:' as info;
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'appointments'
ORDER BY cmd, policyname;

SELECT 'CONSULTATIONS - POLICIES NUEVAS:' as info;
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'consultations'
ORDER BY cmd, policyname;

-- 8. Verificar que el usuario actual tiene una individual_workspace
SELECT 'WORKSPACE DEL USUARIO:' as info;
SELECT 
    iw.id as workspace_id,
    iw.workspace_name,
    iw.owner_id,
    auth.uid() as current_user_id
FROM individual_workspaces iw
WHERE iw.owner_id = auth.uid();