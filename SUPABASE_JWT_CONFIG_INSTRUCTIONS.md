# Configuración de Seguridad de Supabase JWT

## Configurar expiración de JWT a 48 horas

### Opción 1: Dashboard de Supabase (Recomendado)
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: `mindhub-production`
3. Ve a Settings → Authentication
4. En la sección **JWT Settings**, configura:
   - **JWT expiry**: `172800` (48 horas en segundos)
   - **JWT refresh expiry**: `604800` (7 días para refresh token)

### Opción 2: SQL Query (En SQL Editor de Supabase)
```sql
-- Configurar expiración de JWT a 48 horas (172800 segundos)
ALTER DATABASE postgres SET app.settings.jwt_exp TO '172800';

-- Configurar refresh token a 7 días (604800 segundos)  
ALTER DATABASE postgres SET app.settings.refresh_token_rotation_enabled TO 'true';
ALTER DATABASE postgres SET app.settings.security_refresh_token_rotation_enabled TO 'true';
```

### Opción 3: API Configuration (Si tienes acceso)
```bash
# Usar API de management de Supabase
curl -X PATCH 'https://api.supabase.com/v1/projects/{ref}/config/auth' \
  -H "Authorization: Bearer {management-api-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "JWT_EXPIRY": 172800,
    "REFRESH_TOKEN_ROTATION_ENABLED": true,
    "SECURITY_REFRESH_TOKEN_ROTATION_ENABLED": true,
    "PASSWORD_MIN_LENGTH": 8,
    "ENABLE_SIGNUP": true,
    "ENABLE_EMAIL_CONFIRMATIONS": true
  }'
```

## Configuraciones de Seguridad Adicionales Recomendadas

### En Authentication Settings:
- ✅ **Enable email confirmations**: ON
- ✅ **Enable phone confirmations**: OFF (si no usas SMS)
- ✅ **Enable email change confirmations**: ON
- ✅ **Password minimum length**: 8
- ✅ **Password requirements**: Enable special characters y numbers
- ✅ **Enable signup**: ON
- ✅ **Email rate limiting**: 60 requests per hour
- ✅ **SMS rate limiting**: 60 requests per hour (si usas SMS)

### URL Configuration:
- **Site URL**: `https://mindhub.cloud`
- **Redirect URLs**: 
  - `https://mindhub.cloud/auth/callback`
  - `https://mindhub.cloud/auth/reset-password`
  - `http://localhost:3000/auth/callback` (para desarrollo)

### Security Settings:
- ✅ **Enable RLS (Row Level Security)**: ON para todas las tablas sensibles
- ✅ **Enable replication**: OFF (a menos que lo necesites)
- ✅ **Enable realtime**: Solo para tablas específicas que lo requieran

## Verificar la Configuración

Después de aplicar los cambios, puedes verificar que funcionan correctamente:

### Test JWT Expiration:
```javascript
// En browser console después de login
const token = localStorage.getItem('sb-jvbcpldzoyicefdtnwkd-auth-token')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  console.log('Token expires at:', new Date(payload.exp * 1000))
  console.log('Hours until expiration:', (payload.exp * 1000 - Date.now()) / (1000 * 60 * 60))
}
```

## Script de Verificación de Seguridad

```bash
# Ejecutar este script para verificar configuraciones
# (Ejecutar en terminal con proyecto activo)

echo "🔐 Verificando configuración de seguridad de Supabase..."

# Verificar variables de entorno
echo "✅ Variables de entorno:"
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-'No configurada'}"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}... (truncada)"

# Verificar conexión
curl -s "https://jvbcpldzoyicefdtnwkd.supabase.co/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTM2MTcwOTEsImV4cCI6MjAwOTE5MzA5MX0.st42ODkomKcaTcT88Xqc3LT_Zo9oVWhkCVwCP07n4NY" \
  && echo "✅ Conexión a Supabase exitosa" \
  || echo "❌ Error de conexión a Supabase"

echo "🔐 Configuración de seguridad completada"
```

## Notas Importantes

1. **JWT de 48 horas** es un balance entre seguridad y usabilidad
2. **Refresh tokens de 7 días** permiten renovar sin re-login frecuente  
3. **Siempre usar HTTPS** en producción
4. **Habilitar confirmación por email** para nuevas cuentas
5. **RLS policies** deben estar configuradas para todas las tablas

## Aplicar los Cambios

⚠️ **IMPORTANTE**: Estos cambios requieren acceso al dashboard de Supabase o permisos de management API. 

Después de aplicar los cambios:
1. Los usuarios existentes necesitarán hacer login nuevamente
2. Los nuevos tokens tendrán la nueva expiración
3. Verificar que las funciones de auth siguen trabajando correctamente