# MindHub - Healthcare Management Platform

## Project Overview

MindHub es una plataforma integral de gestión sanitaria que integra múltiples módulos especializados para clínicas y profesionales de la salud.

## 🚀 ARQUITECTURA ACTUAL - POST MIGRACIÓN VERCEL + SUPABASE

### 🏗️ **NUEVA ARQUITECTURA HÍBRIDA**
```
┌─ Frontend Next.js ────────── Vercel (https://mindhub.cloud)
├─ API Routes ─────────────── Vercel (/api/*)
├─ Django ClinimetrixPro ──── Híbrido (/mindhub/backend-django/)
├─ Auth ───────────────────── Supabase Auth
└─ Database ───────────────── Supabase PostgreSQL
```

### URLs de Producción (ACTUALES)
- **Frontend**: https://mindhub.cloud (Vercel)
- **API Routes**: https://mindhub.cloud/api/* (Vercel Next.js)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth

### Estado del Deployment
- ✅ Frontend desplegado en Vercel
- ✅ API Routes convertidas a Next.js (Vercel)
- ✅ Base de datos migrada a Supabase PostgreSQL
- ✅ **Sistema de autenticación: 100% Supabase Auth**
- ✅ Django ClinimetrixPro integrado vía sistema híbrido
- ✅ Migración completa de Railway+Clerk finalizada

### 🔐 **SISTEMA DE AUTENTICACIÓN - SUPABASE ÚNICAMENTE**
- **Proveedor**: Supabase Auth (https://supabase.com)
- **Frontend Auth**: `@supabase/auth-helpers-nextjs` con componentes React
- **Backend Auth**: Middleware Supabase en API routes
- **Usuario Principal**: Dr. Alejandro (dr_aleks_c@hotmail.com)
- **Funciones**:
  - ✅ Login/Logout automático
  - ✅ JWT tokens para APIs
  - ✅ Gestión de usuarios y sesiones
  - ✅ Row Level Security (RLS) en PostgreSQL
  - ✅ Integración nativa con Next.js
- **URLs de Auth**:
  - Sign In: https://mindhub.cloud/auth/sign-in
  - Sign Up: https://mindhub.cloud/auth/sign-up
  - Dashboard: https://mindhub.cloud/dashboard (post-login)

### Arquitectura del Sistema

```
MindHub/
├── mindhub/
│   ├── frontend/              # Next.js 14.2.30 con App Router + React 18 + TypeScript + Tailwind CSS
│   └── backend-django/        # Django ClinimetrixPro (Sistema híbrido)
└── (migraciones y docs)/      # Documentación de migración
```

## Módulos Principales

### 1. **Expedix** - Gestión de Pacientes y Expedientes Médicos
- **URL**: `/hubs/expedix`
- **API URL**: `https://mindhub.cloud/api/expedix`
- **Funcionalidades**:
  - Gestión completa de pacientes (CRUD)
  - Expedientes médicos digitales
  - Sistema de consultas médicas
  - Generación de recetas digitales
  - Historial médico completo
  - Portal de pacientes
  - Documentos médicos encriptados

### 2. **ClinimetrixPro** - Sistema Híbrido React + Django
- **URL**: `/hubs/clinimetrix`
- **API URL**: `https://mindhub.cloud/api/clinimetrix-pro` (React) + Django backend
- **Arquitectura**: **SISTEMA HÍBRIDO COMPLETAMENTE FUNCIONAL**

**FUNCIONALIDADES:**
- ✅ **Frontend React**: Selector de escalas, UI/UX, integración con Expedix
- ✅ **Backend Django**: Motor de evaluación, focused_take.html, scoring real
- ✅ **29 escalas migradas**: Desde PHQ-9 hasta escalas especializadas
- ✅ **CardBase nativo**: Sistema de navegación por tarjetas en Django
- ✅ **Scoring inteligente**: Cálculos precisos y interpretaciones clínicas
- ✅ **Bridge seamless**: React → Django → React sin fricción
- ✅ **Supabase Auth integration**: Autenticación unificada entre sistemas

**ESTADO ACTUAL - SISTEMA HÍBRIDO COMPLETAMENTE FUNCIONAL:**
- ✅ Integración React ↔ Django completada
- ✅ Django backend en `/mindhub/backend-django/`
- ✅ 29 escalas psicométricas migradas y funcionales
- ✅ Sistema de evaluación focused_take.html operativo
- ✅ Bridge de autenticación Supabase ↔ Django funcionando
- ✅ Flujo completo: React selector → Django assessment → React results
- ✅ Alpine.js CardBase system preservado y mejorado

**ARQUITECTURA CLINIMETRIX PRO HÍBRIDA:**
```
React Frontend (Selector + UI)
    ↓ (Bridge API)
Django Backend (Evaluación + Scoring)
    ↓ (Return URL)
React Frontend (Resultados + Integración)
```

### 3. **FormX** - Generador de Formularios (FUTURO DESARROLLO)
- **URL**: `/hubs/formx`
- **Tecnología planificada**: **Python/Django**
- **Estado**: 🚧 **Desarrollo futuro** con Django Forms nativo
- **Funcionalidades planificadas**:
  - Creación de formularios personalizados con Django Forms
  - Templates médicos preconfigurrados
  - Formularios de registro de pacientes
  - Validación automática avanzada con Django

### 4. **Agenda** - Sistema de Citas y Programación
- **URL**: `/hubs/agenda`
- **Funcionalidades**:
  - Programación de citas médicas
  - Gestión de horarios
  - Notificaciones automáticas
  - Lista de espera
  - Confirmación de citas

## Stack Tecnológico

### Frontend
- **Hosting**: Vercel - Auto deploy desde GitHub `main` branch
- **URL Producción**: https://mindhub.cloud
- **Framework**: Next.js 14.2.30 con App Router
- **UI Library**: React 18 con TypeScript
- **Styling**: Tailwind CSS + CSS Variables personalizadas
- **Componentes**: Sistema de componentes unificado
- **Estado**: Context API + useState/useEffect
- **Autenticación**: Supabase Auth - Sistema ÚNICO

### Backend Híbrido
- **API Routes**: Next.js en Vercel (Expedix, Resources, etc.)
- **ClinimetrixPro**: Django + **Supabase PostgreSQL** (sistema híbrido)
- **FormX**: Python/Django (desarrollo futuro)
- **Base de Datos**: Supabase PostgreSQL - ÚNICO para todo el proyecto
- **ORM**: Supabase client + Django ORM conectado a Supabase

### Infraestructura de Producción
- **Frontend + API Routes**: Vercel (https://mindhub.cloud)
- **Base de Datos**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Django Backend**: Local/Docker (integración híbrida)
- **Build**: Automático en deploy

### Principios de Desarrollo

## Principios de Desarrollo Específicos

### Gestión de Datos y Backend
- **Base de Datos Principal Supabase PostgreSQL**: 
  - Todo el proyecto usa PRINCIPALMENTE Supabase PostgreSQL
  - API Routes usan Supabase client para operaciones de base de datos
  - Django ClinimetrixPro usa **Supabase PostgreSQL** vía bridge de autenticación
  - NO usar MAMP - la base de datos principal está en Supabase
  - Cambios solicitados deben implementarse tanto en frontend como backend
  - Integración híbrida entre Supabase y Django cuando sea necesario

## Principios de Implementación de Cambios
- Cuando se pida implementar un cambio, este debe ser completo:
  - No solo visualmente, sino funcionalmente
  - Conectar todos los endpoints (Next.js API Routes o Django según corresponda)
  - Dirigir a donde debe ir
  - Guardar en la base de datos adecuada (Supabase o Django según el módulo)
  - Registrar todo completamente
  - En fase avanzada de desarrollo, todo debe quedar funcionando de manera integral

## ⭐ **CLINIMETRIX PRO - SISTEMA HÍBRIDO REACT + DJANGO** ⭐

### **🎯 FUNCIONAMIENTO GENERAL:**
ClinimetrixPro usa un **sistema híbrido** que combina React (frontend hermoso) con Django (backend robusto). El flujo es:

1. **React**: Selector de escalas, integración con Expedix, UI/UX
2. **Django**: Motor de evaluación, focused_take.html, scoring real
3. **React**: Resultados, integración con expediente

### **📊 ARQUITECTURA DE DATOS HÍBRIDA:**
- **Supabase PostgreSQL**: Base de datos ÚNICA para todo el proyecto
  - Pacientes, usuarios, expedientes (Expedix)
  - Escalas, evaluaciones, templates (ClinimetrixPro)
  - Autenticación y permisos (RLS)
- **Django Bridge**: Conexión a Supabase PostgreSQL vía bridge de autenticación
- **Templates Path**: `/mindhub/backend-django/scales/*.json` (29 escalas disponibles)

### **🔄 FLUJO COMPLETO DE EVALUACIÓN HÍBRIDA:**

#### **1. INICIO DESDE EXPEDIX (React)**
- Usuario va a Expedix → Selecciona paciente → Click "Evaluación ClinimetrixPro"
- Se abre selector React con escalas desde Django
- Sistema de favoritas y búsqueda inteligente
- Al seleccionar escala → bridge a Django

#### **2. EVALUACIÓN EN DJANGO (focused_take.html)**
- Django recibe paciente + escala desde React
- Renderiza focused_take.html con Alpine.js CardBase
- Usuario completa evaluación en sistema nativo Django
- Scoring y cálculos en tiempo real

#### **3. RETURN A REACT (Resultados)**
- Django calcula resultados finales
- **AUTO-GUARDADO OBLIGATORIO**: Resultados se guardan automáticamente en Supabase
- Redirige automáticamente de vuelta a React
- React muestra resultados y opciones de exportación
- **Integración automática**: Datos asociados al paciente permanentemente
- **Sin pérdida de información**: Independiente de si el usuario imprime o sale

### **🎨 ESCALAS DISPONIBLES (29 MIGRADAS):**
```
✅ AQ-Adolescent (Autismo Adolescentes)
✅ AQ-Child (Autismo Niños)  
✅ BDI-13 (Beck Depression Inventory)
✅ Cuestionario Salamanca v2007 (Screening)
✅ DTS (Davidson Trauma Scale)
✅ DY-BOCS (Yale-Brown TOC Dimensional)
✅ EAT-26 (Eating Attitudes Test)
✅ EMUN-AR (Evaluación Multidimensional)
✅ ESADFUN (Escala de Funcionamiento)
✅ GADI (Inventario de Ansiedad General)
✅ GDS-5 (Escala Depresión Geriátrica 5 ítems)
✅ GDS-15 (Escala Depresión Geriátrica 15 ítems)
✅ GDS-30 (Escala Depresión Geriátrica 30 ítems)
✅ HARS (Hamilton Anxiety Rating Scale)
✅ HDRS-17 (Hamilton Depression Rating Scale)
✅ IPDE-CIE10 (Trastornos de Personalidad CIE-10)
✅ IPDE-DSMIV (Trastornos de Personalidad DSM-IV)
✅ MADRS (Montgomery-Åsberg Depression Rating)
✅ MOCA (Montreal Cognitive Assessment)
✅ MOS Sleep Scale (Calidad del Sueño)
✅ PANSS (Positive and Negative Syndrome Scale)
✅ PHQ-9 (Patient Health Questionnaire)
✅ RADS-2 (Reynolds Adolescent Depression Scale)
✅ SSS-V (Suicide Scale for Suicidal Ideation)
✅ STAI (State-Trait Anxiety Inventory)
✅ Y-BOCS (Yale-Brown Obsessive Compulsive Scale)
✅ YGTSS (Yale Global Tic Severity Scale)
```

**CATEGORÍAS DISPONIBLES:**
- 🧠 **Depresión**: BDI-13, GDS-5/15/30, HDRS-17, MADRS, PHQ-9, RADS-2
- 😰 **Ansiedad**: GADI, HARS, STAI
- 🧩 **Autismo/TEA**: AQ-Adolescent, AQ-Child
- 🍽️ **Trastornos Alimentarios**: EAT-26
- 🧠 **Cognición**: MOCA
- 💭 **TOC**: DY-BOCS, Y-BOCS
- 🏥 **Psicosis**: PANSS
- 🌙 **Sueño**: MOS Sleep Scale
- ⚡ **Tics**: YGTSS
- 🧬 **Personalidad**: IPDE-CIE10, IPDE-DSMIV
- 💔 **Trauma**: DTS
- ⚠️ **Suicidalidad**: SSS-V

### **⚡ CARACTERÍSTICAS DEL SISTEMA HÍBRIDO:**

#### **React Frontend (Preservado)**
- ✅ UI/UX hermoso y familiar
- ✅ Integración perfecta con Expedix
- ✅ Sistema de favoritas funcionando
- ✅ Búsqueda inteligente de escalas
- ✅ Resultados integrados con expediente

#### **Django Backend (Funcional)**
- ✅ focused_take.html con Alpine.js CardBase
- ✅ Scoring real y preciso
- ✅ 29 escalas completamente migradas
- ✅ Sistema de evaluación robusto
- ✅ Base de datos de escalas científicas

#### **Bridge Integration (Seamless)**
- ✅ Autenticación Supabase validada en Django
- ✅ Redirecciones automáticas React ↔ Django
- ✅ Datos de paciente sincronizados
- ✅ URLs dinámicas para desarrollo/producción

### **🔗 ENDPOINTS API HÍBRIDOS:**
```
# React APIs (Next.js)
GET /api/clinimetrix-pro/catalog - Lista escalas desde Django
POST /api/clinimetrix-pro/bridge - Bridge a Django

# Django APIs 
POST /assessments/api/create-from-react/ - Crea evaluación desde React
GET /assessments/{id}/focused-take/ - Página de evaluación
GET /scales/api/catalog/ - Catálogo de escalas
```

### **🎮 COMPONENTES PRINCIPALES:**
```
# React Components
- ClinimetrixScaleSelector.tsx - Selector integrado con Django
- UnifiedClinimetrixClient.ts - Cliente híbrido Django+React

# Django Components  
- focused_take.html - Página principal de evaluación
- CardBase (Alpine.js) - Sistema de navegación
- ScoringEngine - Motor de cálculo Django
```

### **✅ ESTADO ACTUAL - SISTEMA HÍBRIDO COMPLETAMENTE FUNCIONAL:**
- ✅ **React ↔ Django integration**: Flujo completo funcionando
- ✅ **29 escalas migradas**: Desde PHQ-9 hasta escalas especializadas
- ✅ **Supabase Auth bridge**: Autenticación unificada
- ✅ **focused_take.html**: Sistema de evaluación nativo Django
- ✅ **Scoring engine**: Cálculos precisos y confiables
- ✅ **Repository limpio**: `/mindhub/backend-django/` organizado
- ✅ **Integration testing**: Flujo end-to-end probado

### **🚀 PRÓXIMOS PASOS OPCIONALES:**
- ⏳ Deploy Django a producción (Railway/Vercel)
- ⏳ Implementar FormX con Django Forms
- ⏳ Expandir sistema de reportes PDF
- ⏳ Agregar más escalas especializadas

---

## Recordatorios de Desarrollo
- No hagas commit ni push en github hasta que yo te lo pida. me puedes preguntar, pero no lo hagas sin que me autorice
- **Sistema migrado**: Ya NO usamos Railway, Clerk ni MySQL
- **Nueva arquitectura**: Vercel + Supabase + Django híbrido
- **Endpoints actuales**: `/api/*` para Next.js, Django local para ClinimetrixPro
- **Autenticación**: 100% Supabase Auth en toda la plataforma

## Notas de la Migración Completada
- ✅ **Migración exitosa**: Railway+Clerk+MySQL → Vercel+Supabase+PostgreSQL
- ✅ **Django integration**: ClinimetrixPro funcionando en sistema híbrido
- ✅ **Repository cleanup**: Archivos obsoletos eliminados
- ✅ **Architecture modernizada**: Stack unificado y eficiente
- ✅ **29 escalas migradas**: Sistema ClinimetrixPro completamente funcional