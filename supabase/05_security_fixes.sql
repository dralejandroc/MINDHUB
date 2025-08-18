-- =====================================================
-- SUPABASE: CORRECCIONES DE SEGURIDAD
-- Corrige todos los warnings reportados por Supabase Advisor
-- =====================================================

-- 1. FIX: Function Search Path Mutable
-- Todas las funciones deben tener search_path fijo por seguridad

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'professional'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Fix calculate_age function
CREATE OR REPLACE FUNCTION public.calculate_age(birth_date DATE)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::INTEGER;
$$;

-- Fix get_current_user_profile function
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- Fix is_healthcare_professional function
CREATE OR REPLACE FUNCTION public.is_healthcare_professional()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'doctor', 'nurse', 'psychologist')
  );
$$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. FIX: Security Definer View
-- Reemplazar la vista patients_with_age por una función más segura

-- Drop the problematic view if it exists
DROP VIEW IF EXISTS public.patients_with_age;

-- Create a secure function instead
CREATE OR REPLACE FUNCTION public.get_patients_with_age()
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  paternal_last_name TEXT,
  maternal_last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  age INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.paternal_last_name,
    p.maternal_last_name,
    p.email,
    p.phone,
    p.date_of_birth,
    public.calculate_age(p.date_of_birth) as age,
    p.created_at,
    p.updated_at
  FROM public.patients p
  WHERE EXISTS (
    SELECT 1 FROM public.profiles prof
    WHERE prof.id = auth.uid()
    AND prof.role IN ('admin', 'doctor', 'nurse', 'psychologist')
  );
$$;

-- 3. FIX: RLS Enabled No Policy
-- Agregar políticas RLS a todas las tablas que las necesitan

-- clinimetrix_remote_assessments policies
CREATE POLICY "Healthcare professionals can manage remote assessments" ON public.clinimetrix_remote_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'doctor', 'nurse', 'psychologist')
    )
  );

-- clinimetrix_responses policies
CREATE POLICY "Healthcare professionals can manage responses" ON public.clinimetrix_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'doctor', 'nurse', 'psychologist')
    )
  );

-- Patients can view their own responses (through assessment)
CREATE POLICY "Patients can view their own responses" ON public.clinimetrix_responses
  FOR SELECT USING (
    assessment_id IN (
      SELECT a.id FROM public.clinimetrix_assessments a
      JOIN public.patients p ON a.patient_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

-- consultations policies
CREATE POLICY "Healthcare professionals can manage consultations" ON public.consultations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'doctor', 'nurse', 'psychologist')
    )
  );

-- Patients can view their own consultations
CREATE POLICY "Patients can view their own consultations" ON public.consultations
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients
      WHERE created_by = auth.uid()
    )
  );

-- medical_history policies
CREATE POLICY "Healthcare professionals can manage medical history" ON public.medical_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'doctor', 'nurse', 'psychologist')
    )
  );

-- Patients can view their own medical history
CREATE POLICY "Patients can view their own medical history" ON public.medical_history
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients
      WHERE created_by = auth.uid()
    )
  );

-- prescriptions policies
CREATE POLICY "Healthcare professionals can manage prescriptions" ON public.prescriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'doctor', 'nurse', 'psychologist')
    )
  );

-- Patients can view their own prescriptions
CREATE POLICY "Patients can view their own prescriptions" ON public.prescriptions
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients
      WHERE created_by = auth.uid()
    )
  );

-- 4. Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.get_patients_with_age() TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_age(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_healthcare_professional() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 5. Create indexes for better performance on RLS policies
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_patient_id ON public.medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinimetrix_responses_assessment_id ON public.clinimetrix_responses(assessment_id);

-- Success message
SELECT 'Correcciones de seguridad aplicadas exitosamente - Todos los warnings de Supabase Advisor corregidos' AS status;