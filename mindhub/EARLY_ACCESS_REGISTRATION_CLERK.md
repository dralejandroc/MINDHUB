# Sistema de Registro Early Access con Clerk - MindHub

## Resumen de Implementación

MindHub utiliza **Clerk** como sistema de autenticación principal. Durante el período Early Access, controlamos el acceso mediante invitaciones y configuración específica de Clerk.

## Arquitectura Actual

### 🔐 Autenticación con Clerk

- **Proveedor**: Clerk (https://clerk.com)
- **Componentes**: Sign-in, Sign-up integrados
- **Gestión**: Dashboard de Clerk para administración de usuarios
- **Rutas protegidas**: Middleware de Clerk automático

### 📍 Páginas Principales

1. **Landing Page**: `/app/page.tsx` - Homepage con call-to-action Early Access
2. **Sign In**: `/app/sign-in/[[...sign-in]]/page.tsx` - Login con Clerk
3. **Sign Up**: `/app/sign-up/[[...sign-up]]/page.tsx` - Registro con Clerk
4. **Dashboard**: `/app/dashboard/page.tsx` - Panel principal post-login

### 🎯 Flujo Early Access Actual

1. **Landing Page**: Usuario ve botones "Únete al Early Access"
2. **Modal de Registro**: `BetaRegistrationModal.tsx` (renombrar a Early Access)
3. **Clerk Sign-up**: Redirección a registro de Clerk
4. **Verificación**: Clerk maneja verificación de email automáticamente
5. **Acceso**: Usuario accede directo al dashboard

## Componentes de Landing

### Archivos de Landing Page:
- `/components/landing/LandingNavbar.tsx`
- `/components/landing/HeroSection.tsx`
- `/components/landing/FeaturesSection.tsx`
- `/components/landing/PlansSection.tsx`
- `/components/landing/BetaExplanationSection.tsx` → **Renombrar a EarlyAccessSection**
- `/components/landing/BetaRegistrationModal.tsx` → **Renombrar a EarlyAccessModal**

## Terminología a Actualizar

### Cambios Requeridos:
- ❌ "Beta" → ✅ "Early Access" 
- ❌ "Usuario Beta" → ✅ "Early Access Member"
- ❌ "Período Beta" → ✅ "Early Access Period"
- ❌ "Registro Beta" → ✅ "Early Access Registration"

## Configuración Clerk

### Variables de Entorno Requeridas:
```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Middleware de Clerk:
- **Archivo**: `/middleware.ts`
- **Protección**: Rutas `/dashboard/*`, `/hubs/*`, `/app/*`
- **Públicas**: `/`, `/sign-in`, `/sign-up`, `/api/health`

## Gestión Early Access

### Control de Acceso:
1. **Invitaciones**: Usar Clerk dashboard para enviar invites
2. **Limitar registro**: Configurar Clerk en modo "invitation only" si es necesario
3. **Usuario Admin**: Gestión desde dashboard Clerk

### Base de Datos:
- **Clerk maneja**: usuarios, sesiones, verificación
- **MindHub maneja**: datos de pacientes, evaluaciones, configuración
- **Sincronización**: Clerk webhook → usuarios locales si necesario

## URLs y Navegación

### Landing Page:
- **Homepage**: `https://mindhub.cloud/`
- **Sign In**: `https://mindhub.cloud/sign-in`
- **Sign Up**: `https://mindhub.cloud/sign-up`
- **Dashboard**: `https://mindhub.cloud/dashboard`

### Features Early Access:
- ✅ **Expedix**: Gestión de pacientes
- ✅ **ClinimetrixPro**: Evaluaciones clínicas 
- ✅ **Agenda**: Sistema de citas
- 🚧 **FormX**: Formularios personalizados
- 🚧 **Recursos**: Contenido educativo

## Seguridad

### Clerk Maneja:
- ✅ Autenticación y autorización
- ✅ Verificación de email
- ✅ Gestión de sesiones
- ✅ Protección CSRF
- ✅ Rate limiting de auth

### MindHub Maneja:
- ✅ Autorización de datos específicos
- ✅ Validación de permisos por paciente
- ✅ Audit logging de acciones clínicas

## Soporte Early Access

- **Email general**: hello@mindhub.cloud
- **Soporte técnico**: soporte@mindhub.cloud  
- **Feedback**: feedback@mindhub.cloud
- **Documentación**: Este archivo

---

**Estado**: ✅ **SISTEMA ACTIVO CON CLERK**
**Fecha**: 9 de agosto 2025
**Versión**: Early Access 1.0