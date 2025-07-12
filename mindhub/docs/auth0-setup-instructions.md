# Auth0 Setup Instructions for MindHub

## Quick Setup for mindhub.cloud

### 1. Create or Update Auth0 Application

En tu Auth0 Dashboard:

#### **Crear Nueva Aplicación (si no existe)**
1. Ve a **Applications** → **Create Application**
2. Nombre: `MindHub Healthcare Platform`
3. Tipo: **Single Page Application**
4. Tecnología: **React**

#### **Configurar URLs para Desarrollo y Producción**

**Allowed Callback URLs:**
```
http://localhost:3000/api/auth/callback,
https://app.mindhub.cloud/api/auth/callback,
https://clinimetrix.mindhub.cloud/api/auth/callback,
https://expedix.mindhub.cloud/api/auth/callback,
https://formx.mindhub.cloud/api/auth/callback,
https://resources.mindhub.cloud/api/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:3000,
https://app.mindhub.cloud,
https://clinimetrix.mindhub.cloud,
https://expedix.mindhub.cloud,
https://formx.mindhub.cloud,
https://resources.mindhub.cloud
```

**Allowed Web Origins:**
```
http://localhost:3000,
https://app.mindhub.cloud,
https://clinimetrix.mindhub.cloud,
https://expedix.mindhub.cloud,
https://formx.mindhub.cloud,
https://resources.mindhub.cloud
```

### 2. Crear API en Auth0

1. Ve a **APIs** → **Create API**
2. Nombre: `MindHub API`
3. Identifier: `https://api.mindhub.cloud`
4. Signing Algorithm: `RS256`

#### **Scopes a crear:**
```
read:profile         - Read user profile data
write:profile        - Update user profile data
read:patients        - Read patient information
write:patients       - Create/update patient records
read:assessments     - Access clinical assessments
write:assessments    - Create/modify assessments
read:prescriptions   - View prescriptions
write:prescriptions  - Create/update prescriptions
read:forms           - Access forms and questionnaires
write:forms          - Create/modify forms
read:resources       - Access educational resources
write:resources      - Manage educational content
admin:all           - Administrative access to all resources
```

### 3. Configurar Roles

Ve a **User Management** → **Roles** y crea:

#### **Psychiatrist**
- Descripción: "Licensed psychiatrist with full clinical access"
- Permisos: `read:profile`, `write:profile`, `read:patients`, `write:patients`, `read:assessments`, `write:assessments`, `read:prescriptions`, `write:prescriptions`, `read:forms`, `write:forms`, `read:resources`

#### **Psychologist**  
- Descripción: "Licensed psychologist with assessment and therapy access"
- Permisos: `read:profile`, `write:profile`, `read:patients`, `write:patients`, `read:assessments`, `write:assessments`, `read:forms`, `write:forms`, `read:resources`

#### **Healthcare Admin**
- Descripción: "Healthcare administrator with system management access"
- Permisos: `admin:all`

#### **Support Staff**
- Descripción: "Support staff with limited access"
- Permisos: `read:profile`, `read:patients`, `read:resources`

### 4. Configurar Environment Variables

Crea o actualiza `.env.local` en el directorio `frontend/`:

```env
# Auth0 Configuration
AUTH0_SECRET='[ejecuta: openssl rand -hex 32]'
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://TU-TENANT.auth0.com
AUTH0_CLIENT_ID=[tu-client-id-de-auth0]
AUTH0_CLIENT_SECRET=[tu-client-secret-de-auth0]
AUTH0_AUDIENCE=https://api.mindhub.cloud
AUTH0_SCOPE=openid profile email read:profile write:profile

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_DOMAIN=mindhub.cloud

# Microservices URLs (Development)
NEXT_PUBLIC_CLINIMETRIX_API=http://localhost:8081
NEXT_PUBLIC_EXPEDIX_API=http://localhost:8082
NEXT_PUBLIC_FORMX_API=http://localhost:8083
NEXT_PUBLIC_RESOURCES_API=http://localhost:8084

# Environment
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development

# Healthcare Compliance
NEXT_PUBLIC_HIPAA_MODE=true
NEXT_PUBLIC_AUDIT_LOGGING=true
NEXT_PUBLIC_ENCRYPTION_ENABLED=true
```

### 5. Setup Automático (Opcional)

Si tienes credenciales de Management API, puedes usar nuestro script:

```bash
cd mindhub
npm install auth0

# Configura variables para el script
export AUTH0_DOMAIN=tu-tenant.auth0.com
export AUTH0_M2M_CLIENT_ID=tu-m2m-client-id
export AUTH0_M2M_CLIENT_SECRET=tu-m2m-client-secret

# Ejecuta el script
node scripts/setup-auth0.js
```

### 6. Crear Usuario de Prueba

1. Ve a **User Management** → **Users** → **Create User**
2. Email: `doctor.test@mindhub.cloud`
3. Password: `[contraseña-segura]`
4. Asigna el rol **Psychiatrist**

### 7. Configurar Actions (Opcional pero Recomendado)

Para agregar roles y permisos automáticamente al token:

#### **Login Action**
```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://mindhub.cloud/';
  
  if (event.authorization) {
    // Add user roles
    const roles = event.authorization.roles || [];
    api.idToken.setCustomClaim(`${namespace}roles`, roles);
    api.accessToken.setCustomClaim(`${namespace}roles`, roles);
    
    // Add permissions
    const permissions = event.authorization.permissions || [];
    api.idToken.setCustomClaim(`${namespace}permissions`, permissions);
    api.accessToken.setCustomClaim(`${namespace}permissions`, permissions);
    
    // Add user metadata
    if (event.user.user_metadata) {
      api.idToken.setCustomClaim(`${namespace}user_metadata`, event.user.user_metadata);
    }
  }
};
```

### 8. Configuración de Producción

Para despliegue en Google Cloud:

#### **DNS Records Necesarios**
```dns
app.mindhub.cloud        CNAME   ghs.googlehosted.com.
clinimetrix.mindhub.cloud CNAME   ghs.googlehosted.com.
expedix.mindhub.cloud    CNAME   ghs.googlehosted.com.
formx.mindhub.cloud      CNAME   ghs.googlehosted.com.
resources.mindhub.cloud  CNAME   ghs.googlehosted.com.
api.mindhub.cloud        CNAME   ghs.googlehosted.com.
```

#### **Variables de Producción**
```env
AUTH0_BASE_URL=https://app.mindhub.cloud
NEXT_PUBLIC_APP_URL=https://app.mindhub.cloud
NEXT_PUBLIC_API_URL=https://api.mindhub.cloud
NEXT_PUBLIC_ENVIRONMENT=production
NODE_ENV=production
```

### 9. Verificación

#### **Test Checklist:**
- [ ] Login funciona en localhost:3000
- [ ] Usuario recibe tokens con roles y permisos
- [ ] Logout redirige correctamente
- [ ] Protección de rutas funciona
- [ ] Variables de entorno están configuradas
- [ ] API audience coincide en Auth0 y código

#### **Comandos de Verificación:**
```bash
# Verificar configuración
npm run build

# Iniciar desarrollo
npm run dev

# Abrir http://localhost:3000 y probar login
```

### 10. Solución de Problemas Comunes

#### **Error: "Invalid audience"**
- Verifica que `AUTH0_AUDIENCE` coincida con el API Identifier
- Asegúrate de que el API esté habilitado en Auth0

#### **Error: "Callback URL not allowed"**
- Verifica las URLs en Auth0 Application settings
- Asegúrate de que no hay espacios extra

#### **Error: "Access denied"**
- Verifica que el usuario tenga roles asignados
- Confirma que los permisos estén correctos en el Action

#### **Error de CORS**
- Verifica las Web Origins en Auth0
- Asegúrate de que las URLs coincidan exactamente

### Siguientes Pasos

Una vez configurado Auth0, podrás:
1. ✅ Implementar base de datos local
2. ✅ Desarrollar funcionalidades específicas de cada hub
3. ✅ Configurar microservicios backend
4. ✅ Preparar despliegue en Google Cloud

¿Necesitas ayuda con algún paso específico?