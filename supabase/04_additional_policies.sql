-- =====================================================
-- SUPABASE: POLÍTICAS ADICIONALES Y CONFIGURACIONES
-- =====================================================

-- Enable RLS on clinic_configurations
ALTER TABLE public.clinic_configurations ENABLE ROW LEVEL SECURITY;

-- Admins can manage clinic configurations
CREATE POLICY "Admins can manage clinic configurations" ON public.clinic_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Healthcare professionals can view clinic configurations
CREATE POLICY "Healthcare professionals can view clinic configurations" ON public.clinic_configurations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'doctor', 'nurse', 'psychologist')
    )
  );

-- Create default clinic configuration if none exists
INSERT INTO public.clinic_configurations (clinic_name, settings) 
SELECT 'MindHub Clinic', '{
  "default_language": "es",
  "timezone": "America/Mexico_City",
  "currency": "MXN",
  "date_format": "DD/MM/YYYY",
  "enable_reminders": true,
  "enable_analytics": true
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_configurations);

-- Create helper functions in public schema (not auth schema)
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- Function to check if user is healthcare professional
CREATE OR REPLACE FUNCTION public.is_healthcare_professional()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'doctor', 'nurse', 'psychologist')
  );
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Create default roles enum for consistency
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'nurse', 'psychologist', 'patient', 'member');
  END IF;
END $$;

-- Update profiles table to use enum (optional, for better type safety)
-- ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
-- Note: auth schema functions are managed by Supabase

-- Create indexes for better performance on auth functions
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email_role ON public.profiles(email, role);

-- Note: Admin user profile will be created automatically when they sign up
-- The trigger handle_new_user() will create the profile entry

-- Success message
SELECT 'Políticas RLS y configuraciones adicionales creadas exitosamente' AS status;