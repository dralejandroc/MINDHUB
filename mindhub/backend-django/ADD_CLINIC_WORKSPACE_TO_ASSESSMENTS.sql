-- =========================================================================
-- MIGRACIÓN: Agregar clinic_id y workspace_id a clinimetrix_assessments
-- DESCRIPCIÓN: Soporte para sistema dual en ClinimetrixPro
-- FECHA: 2025-09-01
-- =========================================================================

-- 1. Agregar las nuevas columnas UUID
ALTER TABLE clinimetrix_assessments 
ADD COLUMN clinic_id UUID,
ADD COLUMN workspace_id UUID;

-- 2. Agregar comentarios descriptivos para documentación
COMMENT ON COLUMN clinimetrix_assessments.clinic_id IS 'UUID de clínica para usuarios con licencia clínica. Nullable - usado cuando la evaluación pertenece al contexto de una clínica.';
COMMENT ON COLUMN clinimetrix_assessments.workspace_id IS 'UUID de workspace para usuarios con licencia individual. Nullable - usado cuando la evaluación pertenece a un workspace individual.';

-- 3. Crear índices de rendimiento (índices parciales solo para valores no-null)
CREATE INDEX idx_clinimetrix_assessments_clinic_id 
ON clinimetrix_assessments(clinic_id) 
WHERE clinic_id IS NOT NULL;

CREATE INDEX idx_clinimetrix_assessments_workspace_id 
ON clinimetrix_assessments(workspace_id) 
WHERE workspace_id IS NOT NULL;

-- 4. Agregar constraint para asegurar el patrón del sistema dual
-- (solo un ID puede estar establecido a la vez)
ALTER TABLE clinimetrix_assessments 
ADD CONSTRAINT chk_clinimetrix_assessments_single_context 
CHECK (
    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
    (clinic_id IS NULL AND workspace_id IS NOT NULL) OR 
    (clinic_id IS NULL AND workspace_id IS NULL)
);

-- 5. Comentario en la tabla para documentar el enfoque del sistema dual
COMMENT ON TABLE clinimetrix_assessments IS 'Evaluaciones ClinimetrixPro con soporte de sistema dual: clinic_id para licencias clínica, workspace_id para licencias individuales. Solo uno debe estar establecido por registro.';

-- 6. Verificar la estructura actualizada (OPCIONAL - para validación)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'clinimetrix_assessments' 
-- AND column_name IN ('clinic_id', 'workspace_id');

-- =========================================================================
-- INSTRUCCIONES DE EJECUCIÓN:
-- 1. Copia todo este script
-- 2. Ve al Supabase Dashboard > SQL Editor
-- 3. Pega el script y ejecuta
-- 4. Verifica que se agregaron las columnas correctamente
-- =========================================================================