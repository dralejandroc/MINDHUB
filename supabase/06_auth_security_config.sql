-- =====================================================
-- SUPABASE: CONFIGURACIÓN DE SEGURIDAD DE AUTENTICACIÓN
-- Configuraciones que deben aplicarse via Supabase Dashboard
-- =====================================================

/*
IMPORTANTE: Este archivo contiene instrucciones para configuraciones
que deben aplicarse manualmente en el Supabase Dashboard,
NO a través de SQL.

1. HABILITAR PROTECCIÓN CONTRA CONTRASEÑAS COMPROMETIDAS:
   - Ve a Authentication > Settings en Supabase Dashboard
   - Busca "Password Strength"
   - Habilita "Check against password breach database (HaveIBeenPwned)"
   - Esto protege contra contraseñas filtradas en brechas de seguridad

2. CONFIGURAR POLÍTICAS DE CONTRASEÑAS:
   - Mínimo 8 caracteres
   - Requerir al menos un número
   - Requerir al menos una letra mayúscula
   - Requerir al menos una letra minúscula
   - Requerir al menos un símbolo especial

3. CONFIGURAR RATE LIMITING:
   - Limitar intentos de login por IP
   - Limitar intentos de signup por IP
   - Configurar timeouts apropiados

4. CONFIGURAR EMAIL SETTINGS:
   - Confirmar que todos los emails de confirmación están habilitados
   - Configurar templates personalizados para emails
   - Verificar dominio de envío

5. CONFIGURAR REDIRECT URLs:
   - Site URL: https://mindhub.cloud
   - Redirect URLs: 
     - https://mindhub.cloud/auth/callback
     - https://mindhub.cloud/auth/sign-in
     - https://mindhub.cloud/auth/sign-up

6. HABILITAR MFA (OPCIONAL):
   - Considerar habilitar autenticación de dos factores
   - Para usuarios admin es altamente recomendado

PASOS A SEGUIR EN SUPABASE DASHBOARD:
1. Authentication > Settings
2. Buscar "Password Strength" 
3. Habilitar "Check against password breach database"
4. Configurar minimum password requirements
5. Verificar Rate Limiting settings
6. Confirmar Site URL y Redirect URLs
*/

-- Las siguientes funciones pueden ejecutarse via SQL para verificar configuración:

-- Función para verificar configuración de auth (solo lectura)
CREATE OR REPLACE FUNCTION public.get_auth_config_status()
RETURNS TABLE(
  setting_name TEXT,
  status TEXT,
  recommendation TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    'User Registration' as setting_name,
    CASE 
      WHEN EXISTS (SELECT 1 FROM auth.users LIMIT 1) 
      THEN 'Configured' 
      ELSE 'No users yet' 
    END as status,
    'Ensure admin user is created first' as recommendation
  
  UNION ALL
  
  SELECT 
    'RLS Policies' as setting_name,
    CASE 
      WHEN (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = 'public'
      ) > 0 
      THEN 'Configured' 
      ELSE 'Missing' 
    END as status,
    'All tables should have RLS policies' as recommendation
  
  UNION ALL
  
  SELECT 
    'Security Functions' as setting_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname IN ('is_admin', 'is_healthcare_professional', 'get_current_user_profile')
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ) 
      THEN 'Configured' 
      ELSE 'Missing' 
    END as status,
    'Security helper functions should be available' as recommendation;
$$;

-- Función para crear usuario admin inicial (usar con cuidado)
CREATE OR REPLACE FUNCTION public.setup_admin_user(
  admin_email TEXT,
  admin_name TEXT DEFAULT 'Administrator'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  -- Verificar si ya existe un admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE role = 'admin'
  ) INTO admin_exists;
  
  IF admin_exists THEN
    RETURN 'Admin user already exists';
  END IF;
  
  -- Nota: El usuario debe registrarse normalmente primero
  -- Esta función solo actualiza el rol a admin
  UPDATE public.profiles 
  SET 
    role = 'admin',
    full_name = admin_name,
    updated_at = NOW()
  WHERE email = admin_email;
  
  IF FOUND THEN
    RETURN 'User promoted to admin successfully';
  ELSE
    RETURN 'User not found - must register first through normal signup';
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_auth_config_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_admin_user(TEXT, TEXT) TO authenticated;

-- Success message
SELECT 'Configuración de seguridad de autenticación preparada' AS status;