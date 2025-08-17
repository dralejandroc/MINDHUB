# 🚀 PLAN DE MIGRACIÓN: Railway → Vercel + Supabase

## 📋 OBJETIVO PRINCIPAL
Migrar de Railway + Clerk + MySQL a **Vercel + Supabase Auth + PostgreSQL** con backend híbrido (Next.js + Python para ClinimetrixPro + Django para FormX).

## 🔄 ESTADO ACTUAL DEL PROYECTO
- **Fecha de inicio**: 2025-08-16
- **Estado**: ✅ Cuenta Supabase creada
- **Problema actual**: Railway no tiene variables de entorno configuradas, comunicación Railway-Vercel problemática
- **Decisión**: Migrar completamente a Vercel + Supabase para simplificar arquitectura

---

## 🎯 FASE 1: ANÁLISIS Y PREPARACIÓN

### 1.1 Auditoría del Estado Actual
- [x] Backend Express en Railway (problemático - sin variables de entorno)
- [x] Frontend Next.js en Vercel (funciona pero apunta a Railway)
- [x] Auth con Clerk (complicado con Railway, JWT issues)
- [x] Base de datos MySQL en Railway
- [x] ClinimetrixPro en Node.js (funcionando pero limitado)
- [x] FormX básico (sin aprovechar potencial de Django)
- [x] Carpeta Python en `/Users/alekscon/MINDHUB-Pro/analysis` (por revisar)

### 1.2 Revisión de Assets Existentes
```bash
# Revisar carpeta Python existente
ls -la /Users/alekscon/MINDHUB-Pro/analysis
```

---

## 🏗️ FASE 2: ARQUITECTURA OBJETIVO

### 2.1 Nueva Arquitectura
```
┌─ Frontend (Next.js) ─ Vercel
├─ Backend API Routes ─ Vercel 
├─ ClinimetrixPro ─── Python/FastAPI ─ Vercel
├─ FormX ──────────── Django ─────── Vercel  
├─ Auth ──────────── Supabase Auth
└─ Database ─────── Supabase PostgreSQL
```

### 2.2 Servicios por Tecnología
- **Next.js API Routes**: Expedix, Finance, FrontDesk, Resources
- **Python/FastAPI**: ClinimetrixPro (análisis científico)
- **Django**: FormX (aprovecha Django Forms)
- **Supabase**: Auth + Database + Storage

---

## 📦 FASE 3: MIGRACIÓN DE DATOS

### 3.1 Mapeo MySQL → PostgreSQL
```sql
-- Tablas críticas a migrar:
users → supabase.auth.users + public.profiles
patients → public.patients  
consultations → public.consultations
clinimetrix_templates → public.clinimetrix_templates
clinimetrix_assessments → public.clinimetrix_assessments
clinimetrix_registry → public.clinimetrix_registry
clinimetrix_remote_assessments → public.clinimetrix_remote_assessments
```

### 3.2 Scripts de Migración
- Exportar datos de Railway MySQL
- Transformar esquemas a PostgreSQL
- Scripts de seed para Supabase

---

## 🔧 FASE 4: DESARROLLO PASO A PASO

### 4.1 Configuración de Supabase
```bash
# Tareas en Supabase Dashboard:
1. ✅ Crear proyecto nuevo
2. [ ] Configurar Auth providers
3. [ ] Crear tablas base
4. [ ] Configurar Row Level Security (RLS)
5. [ ] Obtener keys de API
```

### 4.2 Configuración de Vercel
```bash
# Variables de entorno en Vercel:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://mindhub.cloud
```

### 4.3 Migración de Backend Express → Next.js API Routes
```
backend/expedix/routes/patients.js → app/api/expedix/patients/route.ts
backend/finance/routes/ → app/api/finance/
backend/frontdesk/routes/ → app/api/frontdesk/
backend/resources/routes/ → app/api/resources/
```

### 4.4 ClinimetrixPro Python Setup
```bash
# Estructura nueva:
/python-services/
├── clinimetrix-pro/
│   ├── main.py (FastAPI)
│   ├── models/
│   ├── services/
│   ├── analysis/
│   └── requirements.txt
└── vercel.json (config para Python)
```

### 4.5 FormX Django Setup  
```bash
# Nueva estructura:
/django-services/
├── formx/
│   ├── manage.py
│   ├── formx/
│   ├── forms/
│   ├── templates/
│   └── requirements.txt
└── vercel.json (config para Django)
```

---

## 🔐 FASE 5: MIGRACIÓN DE AUTH (Clerk → Supabase)

### 5.1 Cambios en Frontend
```typescript
// De:
import { useUser } from '@clerk/nextjs'

// A:
import { useUser } from '@supabase/auth-helpers-react'
```

### 5.2 Middleware de Auth
```typescript
// Nuevo middleware Supabase
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
```

### 5.3 Migración de Usuarios
- [ ] Exportar usuarios de Clerk
- [ ] Crear perfiles en Supabase
- [ ] Mapear roles y permisos
- [ ] Usuario principal: dr_aleks_c@hotmail.com

---

## 🧹 FASE 6: LIMPIEZA DE CÓDIGO LEGACY

### 6.1 Archivos a Eliminar
```bash
# Limpiar Railway artifacts:
- mindhub/backend/ (todo Express)
- Railway configuration files
- Clerk middleware files
- MySQL specific code
- .env files con Railway/Clerk keys

# Mover a _ARCHIVE_:
- _TRASH_LEGACY_CLINIMETRIX/
- Old middleware
- Railway deployment files
```

### 6.2 Archivos a Conservar y Migrar
```bash
# Conservar lógica de negocio:
- Database schemas (convertir a Supabase)
- Business logic functions
- API endpoints logic
- Frontend components
- Templates JSON (PHQ-9, etc.)
```

---

## 📝 FASE 7: PLAN DE EJECUCIÓN DETALLADO

### Paso 1: Preparación (1-2 horas)
- [x] Crear proyecto Supabase
- [ ] Revisar `/analysis` folder
- [ ] Backup completo del repositorio actual
- [ ] Documentar configuración actual

### Paso 2: Database Migration (2-3 horas)
- [ ] Exportar datos de Railway MySQL
- [ ] Crear esquemas en Supabase
- [ ] Migrar datos críticos
- [ ] Configurar RLS policies

### Paso 3: Auth Migration (2-3 horas)
- [ ] Configurar Supabase Auth
- [ ] Migrar usuarios de Clerk
- [ ] Actualizar frontend auth
- [ ] Probar login/logout

### Paso 4: API Routes Migration (3-4 horas)
- [ ] Migrar Expedix endpoints
- [ ] Migrar Finance endpoints  
- [ ] Migrar FrontDesk endpoints
- [ ] Migrar Resources endpoints

### Paso 5: Python ClinimetrixPro (2-3 horas)
- [ ] Setup FastAPI structure
- [ ] Migrar lógica de análisis
- [ ] Configurar en Vercel
- [ ] Integration testing

### Paso 6: Django FormX (3-4 horas)
- [ ] Setup Django project
- [ ] Crear forms models
- [ ] Templates y views
- [ ] Deploy en Vercel

### Paso 7: Integration & Testing (2-3 horas)
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security testing
- [ ] Clean up legacy code

---

## 🛠️ CONFIGURACIONES REQUERIDAS

### En Supabase Dashboard:
1. **Crear nuevo proyecto** ✅
2. **Authentication → Settings**:
   - Site URL: `https://mindhub.cloud`
   - Redirect URLs: `https://mindhub.cloud/auth/callback`
3. **Database → SQL Editor**: Ejecutar schemas
4. **Storage**: Configurar buckets si necesario

### En Vercel Dashboard:
1. **Environment Variables**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
```

2. **Functions Configuration**: Para Python y Django

### Variables de Entorno Completas:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=  
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Next.js
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://mindhub.cloud

# App
NODE_ENV=production
FRONTEND_URL=https://mindhub.cloud
```

---

## ✅ VENTAJAS DE ESTA MIGRACIÓN

1. **Simplificación**: Un stack unificado en Vercel
2. **Performance**: Edge functions y CDN global
3. **Escalabilidad**: Auto-scaling nativo
4. **Python Power**: Mejor análisis científico en ClinimetrixPro
5. **Django Forms**: Forms nativo y potente para FormX
6. **Supabase**: Auth + DB + Storage integrado
7. **Debugging**: Logs centralizados en Vercel
8. **Costo**: Más económico que Railway + Clerk

---

## 🚨 CONSIDERACIONES IMPORTANTES

1. **Backup**: Hacer backup completo antes de empezar
2. **Testing**: Cada fase debe ser probada
3. **Rollback Plan**: Plan de retorno si algo falla
4. **Data Migration**: Crítico migrar datos sin pérdida
5. **DNS**: No requiere cambios (ya apunta a Vercel)
6. **Downtime**: Planificar ventana de mantenimiento

---

## 📊 PROGRESO ACTUAL

### Completado:
- ✅ Decisión de migración tomada
- ✅ Plan detallado creado
- ✅ Cuenta Supabase creada

### En Proceso:
- 🔄 Revisión de carpeta `/analysis`

### Pendiente:
- ⏳ Configuración de Supabase
- ⏳ Migración de base de datos
- ⏳ Conversión de API routes
- ⏳ Setup Python/Django services

---

## 🔗 RECURSOS Y REFERENCIAS

- **Supabase Docs**: https://supabase.com/docs
- **Vercel API Routes**: https://vercel.com/docs/functions
- **FastAPI**: https://fastapi.tiangolo.com/
- **Django Forms**: https://docs.djangoproject.com/en/stable/topics/forms/
- **Railway Project (a descartar)**: https://railway.com/project/cb592087-84b0-4214-bbc2-2dfc7a78dbee

---

## 📝 NOTAS DE LA MIGRACIÓN

### Problemas que resolvemos:
1. Railway no tiene variables de entorno configuradas
2. Comunicación Railway-Vercel problemática  
3. Clerk JWT authentication complicada con Railway
4. Costos elevados de múltiples servicios
5. Debugging complejo entre servicios separados

### Lo que ganamos:
1. Stack unificado en Vercel
2. Auth integrado con Supabase
3. Python para análisis científico (ClinimetrixPro)
4. Django Forms nativo (FormX)
5. Mejor developer experience
6. Logs y debugging centralizados

---

**Última actualización**: 2025-08-16 21:15:00
**Estado**: Iniciando migración
**Siguiente paso**: Revisar carpeta `/analysis` y configurar Supabase