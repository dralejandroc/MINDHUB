-- EJECUTAR MANUALMENTE EN SUPABASE DASHBOARD
-- Script para resolver definitivamente el error de constraint en consultations
-- PROBLEMA IDENTIFICADO: Las RLS policies solo permiten clinic_id, no workspace_id

-- 1. Verificar la estructura actual de la tabla consultations
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'consultations' 
AND column_name IN ('clinic_id', 'workspace_id')
ORDER BY column_name;

-- 2. Verificar si existen constraints de CHECK
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'consultations' 
AND tc.constraint_type = 'CHECK';

-- 3. Buscar cualquier constraint con nombre similar
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.consultations'::regclass
AND contype = 'c';

-- 4. ELIMINAR el constraint existente si causa problemas
ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS check_consultations_dual_owner;

-- 5. Asegurar que ambas columnas sean nullable
ALTER TABLE public.consultations ALTER COLUMN clinic_id DROP NOT NULL;
ALTER TABLE public.consultations ALTER COLUMN workspace_id DROP NOT NULL;

-- 6. Crear el constraint correcto (después de eliminarlo)
ALTER TABLE public.consultations ADD CONSTRAINT check_consultations_dual_owner 
CHECK (
    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
    (clinic_id IS NULL AND workspace_id IS NOT NULL)
);

-- 7. Verificar que el constraint se creó correctamente
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'consultations' 
AND tc.constraint_name = 'check_consultations_dual_owner';

-- 8. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_consultations_clinic_id ON public.consultations(clinic_id) WHERE clinic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultations_workspace_id ON public.consultations(workspace_id) WHERE workspace_id IS NOT NULL;

-- 9. Verificación final: intentar insertar un registro de prueba
-- (Sustituye los UUIDs por valores reales de tu sistema)
/*
INSERT INTO public.consultations (
    patient_id, 
    workspace_id, 
    clinic_id,
    consultation_date,
    status,
    reason
) VALUES (
    'patient-uuid-here',  -- Usar un UUID real de patient
    'workspace-uuid-here', -- Usar tu workspace_id
    NULL,  -- clinic_id debe ser NULL para individual license
    NOW(),
    'pending',
    'Test consultation'
);
*/

-- Si el INSERT funciona, DELETE el registro de prueba:
-- DELETE FROM public.consultations WHERE reason = 'Test consultation';

-- =============================================================================
-- SECCIÓN CRÍTICA: ARREGLAR RLS POLICIES PARA DUAL SYSTEM
-- =============================================================================

-- 10. Verificar las RLS policies actuales
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'consultations';

-- 11. ELIMINAR las policies existentes que solo funcionan con clinic_id
DROP POLICY IF EXISTS consultations_insert_by_clinic ON public.consultations;
DROP POLICY IF EXISTS consultations_select_by_clinic ON public.consultations;
DROP POLICY IF EXISTS consultations_update_by_clinic ON public.consultations;
DROP POLICY IF EXISTS consultations_delete_by_clinic ON public.consultations;

-- 12. CREAR nuevas RLS policies que soporten DUAL SYSTEM (clinic_id OR workspace_id)

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
        SELECT workspaces.id
        FROM workspaces
        WHERE workspaces.owner_id = auth.uid()
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
        SELECT workspaces.id
        FROM workspaces
        WHERE workspaces.owner_id = auth.uid()
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
        SELECT workspaces.id
        FROM workspaces
        WHERE workspaces.owner_id = auth.uid()
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
        SELECT workspaces.id
        FROM workspaces
        WHERE workspaces.owner_id = auth.uid()
    ))
);

-- 13. Verificar que las nuevas policies se crearon correctamente
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'consultations'
ORDER BY cmd, policyname;

-- =============================================================================
-- PRUEBA FINAL
-- =============================================================================

-- 14. Verificar que existe la tabla workspaces y el usuario actual tiene una workspace
SELECT 
    w.id as workspace_id,
    w.name,
    w.owner_id,
    auth.uid() as current_user_id
FROM workspaces w
WHERE w.owner_id = auth.uid();

-- Si no hay resultados en la consulta anterior, entonces necesitas crear una workspace
-- o verificar la estructura de datos del usuario actual.