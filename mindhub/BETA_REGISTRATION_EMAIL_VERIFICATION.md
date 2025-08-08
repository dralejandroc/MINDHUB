# Sistema de Registro Beta con Verificación por Email - MindHub

## Resumen de Implementación

Se ha implementado un sistema completo de registro beta con verificación por email siguiendo los requisitos específicos del proyecto. El sistema maneja dos flujos diferenciados: usuarios individuales y clínicas.

## Características Implementadas

### 🏥 Flujo para Profesionales Individuales

1. **Registro Completo**: Al completar el registro beta, se crea automáticamente:
   - Registro en `beta_registrations`
   - Usuario en tabla `users` con estado inactivo
   - Token de verificación único
   - Envío automático de email de verificación

2. **Email de Bienvenida**: 
   - Enviado desde `noreply@mindhub.cloud`
   - Incluye mensaje específico sobre acceso Beta
   - Botón de confirmación con enlace único
   - Información sobre feedback y soporte

3. **Verificación y Activación**:
   - Link único: `https://www.mindhub.cloud/verify-email?token=XXX`
   - Al confirmar: usuario activado, email verificado, beta_registration marcado como `hasJoined`
   - Redirección automática a login

### 🏢 Flujo para Clínicas

1. **Detección Automática**: Al seleccionar "Clínica" en el formulario
2. **Mensaje Inmediato**: Modal con explicación sobre limitaciones Beta
3. **Solo Registro**: Guarda email en `beta_registrations`, NO crea usuario
4. **Auto-reset**: Cambia automáticamente el select a "Usuario Individual"

## Arquitectura Técnica

### Backend (/backend/)

#### Rutas API (`/backend/shared/routes/simple-auth.js`)
- `POST /auth/beta-register` - Registro beta mejorado
- `POST /auth/verify-email` - Verificación de email

#### Servicio de Email (`/backend/services/EmailServiceZoho.js`)
- Configuración SMTP Zoho
- Templates HTML profesionales
- Método `sendVerificationEmail()`

#### Base de Datos
- **Nuevos campos en `users`**:
  - `emailVerified` (boolean, default false)
  - `emailVerificationToken` (string, unique)
  - `emailVerifiedAt` (datetime)

### Frontend (/frontend/)

#### Componentes Actualizados
- `BetaRegistrationModal.tsx` - Manejo de flujo de clínicas y mensajes
- `/app/verify-email/page.tsx` - Página de verificación actualizada

#### API Client (`/lib/api/auth-client.ts`)
- Interface `BetaRegistrationResponse` actualizada
- Soporte para nuevos campos `isClinica` y `requiresVerification`

## Configuración Requerida

### Variables de Entorno
```env
# Email Zoho
ZOHO_EMAIL=alejandro.contreras@mindhub.cloud
ZOHO_APP_PASSWORD=your-zoho-app-password
FEEDBACK_EMAIL=feedback@mindhub.cloud
```

### Base de Datos
Ejecutar migración:
```bash
node backend/scripts/apply-email-verification-migration.js
```

## Flujo de Usuario Completo

### Registro Individual
1. Usuario completa formulario con contraseña
2. Sistema valida y crea usuario inactivo
3. Envía email de verificación automáticamente
4. Modal muestra mensaje: "revisa tu correo para confirmarlo"
5. Usuario recibe email con botón "Confirmar mi cuenta"
6. Al hacer click, usuario es activado
7. Redirección a login con cuenta activa

### Registro de Clínica
1. Usuario selecciona "Clínica"
2. Modal muestra mensaje explicativo automáticamente
3. Sistema guarda email para futuro contacto
4. Select cambia automáticamente a "Usuario Individual"
5. Usuario puede continuar como individual

## Archivos Modificados/Creados

### Backend
- ✅ `backend/prisma/schema.prisma` - Nuevos campos users
- ✅ `backend/shared/routes/simple-auth.js` - Endpoints actualizados
- ✅ `backend/services/EmailServiceZoho.js` - Template actualizado
- ✅ `backend/shared/services/auth-service.js` - Validación email verificado
- ✅ `backend/database/migrations/008_add_email_verification_fields.sql` - Nueva migración
- ✅ `backend/scripts/apply-email-verification-migration.js` - Script de migración
- ✅ `backend/test-email-system.js` - Herramienta de prueba

### Frontend
- ✅ `frontend/components/landing/BetaRegistrationModal.tsx` - Flujo clínicas
- ✅ `frontend/app/verify-email/page.tsx` - Página verificación
- ✅ `frontend/lib/api/auth-client.ts` - Interfaces actualizadas

### Configuración
- ✅ `backend/.env.example` - Variables Zoho
- ✅ `BETA_REGISTRATION_EMAIL_VERIFICATION.md` - Documentación

## Mensajes Específicos

### Mensaje Post-Registro (Individual)
```
"Muchas gracias por suscribirte a MindHub, estás a unos clics de poder disfrutar de la plataforma y ayudarte a tener más tiempo para ti y liberarte del papel para realizar tus escalas clinimétricas. Por favor revisa el buzón o bandeja de entrada de tu correo para confirmarlo, y estarás listo para empezar"
```

### Mensaje para Clínicas
```
"Muchas gracias por tu interés en MindHub. Durante nuestro periodo Beta, que esperamos dure un par de meses, por el momento no se soportan los Usuarios de Clínicas. Cuando nuestro Beta termine, tendremos planes que incluirán soporte para clínicas, desde 4 usuarios con una misma base de datos. Por el momento para empezar a probar MindHub y ayudarnos a mejorar, puedes inscribirte como Usuario individual"
```

## Testing

### Probar Sistema de Email
```bash
node backend/test-email-system.js your-email@example.com
```

### Probar Flujo Completo
1. Ir a homepage de MindHub
2. Hacer click en "Únete al Beta"
3. Completar formulario como profesional individual
4. Verificar email recibido
5. Hacer click en "Confirmar mi cuenta"
6. Verificar redirección a login
7. Login con credenciales creadas

## Seguridad

- ✅ Tokens UUID únicos
- ✅ Validación de email obligatoria para login
- ✅ Tokens se eliminan después del uso
- ✅ Enlaces de verificación expiran en 24 horas
- ✅ Encriptación de contraseñas con bcrypt

## Soporte

Para soporte técnico durante la implementación:
- Email: soporte@mindhub.cloud
- Feedback: feedback@mindhub.cloud

---

**Estado**: ✅ **IMPLEMENTACIÓN COMPLETA**
**Fecha**: 7 de agosto 2025
**Versión**: 1.0