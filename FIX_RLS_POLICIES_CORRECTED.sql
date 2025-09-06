-- SCRIPT CORREGIDO PARA RLS POLICIES - USAR ESTE
-- La tabla correcta es "individual_workspaces", no "workspaces"

-- 1. Verificar las RLS policies actuales
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'consultations';

-- 2. ELIMINAR las policies existentes que solo funcionan con clinic_id
DROP POLICY IF EXISTS consultations_insert_by_clinic ON public.consultations;
DROP POLICY IF EXISTS consultations_select_by_clinic ON public.consultations;
DROP POLICY IF EXISTS consultations_update_by_clinic ON public.consultations;
DROP POLICY IF EXISTS consultations_delete_by_clinic ON public.consultations;

-- 3. CREAR nuevas RLS policies que soporten DUAL SYSTEM (clinic_id OR workspace_id)

-- Policy for INSERT: Permitir si clinic_id está en memberships O si workspace_id pertenece al usuario
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

-- Policy for SELECT: Permitir ver consultations del clinic_id O workspace_id del usuario
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

-- Policy for UPDATE: Permitir actualizar consultations del clinic_id O workspace_id del usuario
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

-- Policy for DELETE: Permitir eliminar consultations del clinic_id O workspace_id del usuario
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

-- 4. Verificar que las nuevas policies se crearon correctamente
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'consultations'
ORDER BY cmd, policyname;

-- 5. Verificar que el usuario actual tiene una individual_workspace
SELECT 
    iw.id as workspace_id,
    iw.workspace_name,
    iw.owner_id,
    auth.uid() as current_user_id
FROM individual_workspaces iw
WHERE iw.owner_id = auth.uid();