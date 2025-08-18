# 🔒 APLICAR CORRECCIONES DE SEGURIDAD - SUPABASE

## 📋 PASOS PARA CORREGIR TODOS LOS WARNINGS

### 1. **Ejecutar Scripts SQL en Supabase**

Ve al **SQL Editor** en tu Supabase Dashboard y ejecuta estos scripts EN ORDEN:

```sql
-- 1. Correcciones de seguridad generales (CORREGIDO)
-- Ejecuta: /supabase/05_security_fixes.sql
-- ✅ Corrige referencias de columnas incorrectas
-- ✅ Agrega políticas RLS faltantes
-- ✅ Fija search_path en todas las funciones
```

```sql
-- 2. Configuración de autenticación
-- Ejecuta: /supabase/06_auth_security_config.sql
-- ✅ Habilita verificaciones adicionales
```

### 2. **Configuraciones en Supabase Dashboard**

#### A. Habilitar Protección de Contraseñas
1. Ve a **Authentication** → **Settings**
2. Busca **"Password Strength"**
3. ✅ Habilita **"Check against password breach database (HaveIBeenPwned)"**
4. Configura requisitos mínimos:
   - Mínimo 8 caracteres
   - Al menos un número
   - Al menos una mayúscula
   - Al menos una minúscula

#### B. Configurar URLs de Redirect
1. En **Authentication** → **Settings**
2. Configurar:
   - **Site URL**: `https://mindhub.cloud`
   - **Redirect URLs**: 
     ```
     https://mindhub.cloud/auth/callback
     https://mindhub.cloud/auth/sign-in
     https://mindhub.cloud/auth/sign-up
     ```

#### C. Configurar Rate Limiting
1. Verificar que Rate Limiting esté habilitado
2. Configurar límites apropiados para healthcare

### 3. **Verificar Correcciones**

Ejecuta esta query para verificar que todo está configurado:

```sql
SELECT * FROM public.get_auth_config_status();
```

### 4. **Crear Usuario Admin Inicial**

Después de configurar todo:

1. **Registro manual**: Ve a `/auth/sign-up` y regístrate con `dr_aleks_c@hotmail.com`
2. **Promover a admin**: Ejecuta en SQL Editor:
   ```sql
   SELECT public.setup_admin_user('dr_aleks_c@hotmail.com', 'Dr. Alejandro');
   ```

## ✅ **RESULTADOS ESPERADOS**

Después de aplicar todas las correcciones, los warnings de Supabase Advisor deberían desaparecer:

- ✅ **Function Search Path Mutable**: Corregido - todas las funciones tienen `SET search_path`
- ✅ **Security Definer View**: Corregido - vista reemplazada por función segura
- ✅ **RLS Enabled No Policy**: Corregido - políticas agregadas a todas las tablas
- ✅ **Leaked Password Protection**: Corregido - habilitado en Dashboard

## 🔍 **VERIFICACIÓN FINAL**

Después de aplicar todo, verifica en **Supabase Dashboard** → **Advisors** que no hay más warnings de seguridad.

## 🚀 **PRÓXIMO PASO**

Una vez corregidos los warnings de seguridad, proceder con:
1. Probar el sistema de autenticación
2. Migrar datos de Railway a Supabase
3. Convertir API routes de Express a Next.js

---

**IMPORTANTE**: Estas correcciones son críticas para un sistema healthcare que maneja datos sensibles.