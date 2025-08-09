# MindHub - Healthcare Management Platform

## Project Overview

MindHub es una plataforma integral de gestión sanitaria que integra múltiples módulos especializados para clínicas y profesionales de la salud.

## 🚀 DEPLOYMENT STATUS - PRODUCCIÓN ACTIVA

### URLs de Producción (Railway)
- **Frontend**: https://mindhub.cloud
- **Backend API**: https://mindhub-production.up.railway.app
- **Database**: Railway MySQL (mysql.railway.internal:3306) - INTERNAL ENDPOINT ONLY
- **Railway Project**: https://railway.com/project/cb592087-84b0-4214-bbc2-2dfc7a78dbee?environmentId=63e89941-0786-4a34-af22-f0788a981fa2

### Estado del Deployment
- ✅ Frontend desplegado en Vercel
- ✅ Backend desplegado en Railway (Project ID: cb592087-84b0-4214-bbc2-2dfc7a78dbee)
- ✅ Base de datos MySQL en Railway (ENDPOINT INTERNO)
- ✅ **Sistema de autenticación: 100% Clerk** (Clerk App ID: `app_2qkqyqQGUgMkE6Ke3mSWWxjAbBx`)
- ✅ APIs conectadas a backend real (NO localhost)
- ✅ Environment ID: 63e89941-0786-4a34-af22-f0788a981fa2

### 🔐 **SISTEMA DE AUTENTICACIÓN - CLERK ÚNICAMENTE**
- **Proveedor**: Clerk (https://clerk.com)
- **Clerk App ID**: `app_2qkqyqQGUgMkE6Ke3mSWWxjAbBx`
- **Frontend Auth**: `@clerk/nextjs` con componentes React
- **Backend Auth**: Middleware Clerk JWT validation en API routes
- **Usuario Principal**: Dr. Alejandro (dr_aleks_c@hotmail.com)
- **Funciones**:
  - ✅ Login/Logout automático
  - ✅ JWT tokens para APIs
  - ✅ Gestión de usuarios y sesiones
  - ✅ Integración con base de datos (tabla `users` con `clerk_user_id`)
  - ❌ **NO hay sistema custom de MindHub** - eliminado completamente
- **URLs de Clerk**:
  - Sign In: https://mindhub.cloud/sign-in
  - Dashboard: https://mindhub.cloud/dashboard (post-login)

### 💰 IMPORTANTE - ENDPOINTS INTERNOS PARA EVITAR COSTOS
- Backend en Railway usa **mysql.railway.internal:3306** (endpoint interno, GRATIS)
- NO usar endpoints públicos como yamanote.proxy.rlwy.net (genera costos de egress)
- Frontend apunta a **https://mindhub-production.up.railway.app**
- NO usar localhost en producción

### Arquitectura del Sistema

```
MindHub/
├── frontend/          # Next.js 14.2.30 con App Router + React 18 + TypeScript + Tailwind CSS
├── backend/           # Node.js + Express + Prisma ORM
└── mindhub/           # Proyecto principal con todos los módulos
    ├── frontend/      # Aplicación web principal
    ├── backend/       # API central y microservicios
    └── MVP_SIMPLE.html # Prototipo inicial
```

## Módulos Principales

### 1. **Expedix** - Gestión de Pacientes y Expedientes Médicos
- **URL**: `/hubs/expedix`
- **API URL**: `https://mindhub.cloud/api/v1/expedix`
- **Funcionalidades**:
  - Gestión completa de pacientes (CRUD)
  - Expedientes médicos digitales
  - Sistema de consultas médicas
  - Generación de recetas digitales
  - Historial médico completo
  - Portal de pacientes
  - Documentos médicos encriptados

### 2. **Clinimetrix** - Escalas y Evaluaciones Clínicas
- **URL**: `/hubs/clinimetrix`
- **API URL**: `https://mindhub.cloud/api/clinimetrix-pro`
- **Funcionalidades**:
  - ClinimetrixPro: Sistema de plantillas científicas ejecutables
  - Fidelidad absoluta a instrumentos psicométricos originales
  - Motor de renderizado dinámico universal
  - Validación inteligente de respuestas
  - Generación automática de reportes
  - Integración con expedientes de pacientes

**ESTADO ACTUAL - CLINIMETRIX PRO EN DESARROLLO:**
- ✅ Sistema legacy migrado a _TRASH_LEGACY_CLINIMETRIX/
- ✅ Arquitectura ClinimetrixPro definida y planificada
- ✅ Base de datos MySQL con Prisma ORM
- ✅ Sistema de plantillas JSON científicas
- 🚧 **EN PROGRESO**: Implementación por fases del nuevo sistema
- 🚧 **EN PROGRESO**: Migración de escalas a formato de plantillas

**ARQUITECTURA CLINIMETRIX PRO:**
- `clinimetrix_templates` - Plantillas científicas ejecutables en JSON
- `clinimetrix_assessments` - Respuestas y aplicaciones
- `clinimetrix_registry` - Catálogo de escalas disponibles
- **Backend**: `/backend/clinimetrix-pro/` con servicios especializados
- **Frontend**: `/frontend/components/ClinimetrixPro/` con renderizado dinámico
- **Templates**: `/backend/templates/scales/` con escalas en formato JSON

### 3. **FormX** - Generador de Formularios
- **URL**: `/hubs/formx`
- **API URL**: `https://mindhub.cloud/api/v1/formx`
- **Funcionalidades**:
  - Creación de formularios personalizados
  - Templates médicos preconfigurrradors
  - Formularios de registro de pacientes
  - Validación automática de datos

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
- **Autenticación**: Clerk (App ID: `app_2qkqyqQGUgMkE6Ke3mSWWxjAbBx`) - Sistema ÚNICO

### Backend
- **Runtime**: Node.js con Express
- **Base de Datos**: Prisma ORM con Railway MySQL - ÚNICO para todo el proyecto
- **API**: RESTful APIs por módulo
- **Archivos**: Sistema de archivos local + encriptación

### Infraestructura de Producción
- **Producción**: https://mindhub.cloud (Frontend) + https://mindhub.cloud/api (Backend)
- **Base de Datos**: Railway MySQL (mysql.railway.internal:3306)
- **Deployment**: Frontend en Vercel, Backend en Railway
- **Build**: Automático en deploy

### Principios de Desarrollo

## Principios de Desarrollo Específicos

### Gestión de Datos y Backend
- **Base de Datos Única MySQL en Railway**: 
  - Todo el proyecto usa ÚNICAMENTE MySQL alojado en Railway (mysql.railway.internal:3306)
  - Todas las operaciones de base de datos deben usar Prisma ORM
  - NO usar SQLite ni conexiones directas a bases de datos
  - NO usar MAMP - la base de datos está completamente en la nube en Railway
  - Todos los datos deben estar en el backend y en MySQL de Railway
  - Ajustar tablas según sea necesario para cada cambio
  - Cambios solicitados deben implementarse tanto en frontend como backend

## Principios de Implementación de Cambios
- Cuando se pida implementar un cambio, este debe ser completo, agregando todo lo necesario para que la función funcione:
  - No solo visualmente, sino funcionalmente
  - Conectar todos los endpoints
  - Dirigir a donde debe ir
  - Guardar en el backend en asociación con el usuario
  - Registrar todo completamente
  - En fase avanzada de desarrollo, todo debe quedar funcionando de manera integral

## ClinimetrixPro - Sistema de Plantillas Científicas

### Principios Fundamentales del Nuevo Sistema
- **Fidelidad Científica**: Las plantillas son copias exactas de la literatura
- **Flexibilidad Total**: Soporte para cualquier estructura de escala
- **Inteligencia Integrada**: Detección de patrones y validación automática
- **Escalabilidad**: Agregar escalas sin modificar código
- **Simplicidad**: Arquitectura minimalista y mantenible

### Arquitectura ClinimetrixPro
```
mindhub/backend/
├── clinimetrix-pro/
│   ├── routes/           # APIs RESTful
│   └── services/         # Motores de scoring, validación, reportes
├── templates/scales/     # Plantillas JSON científicas
└── database/migrations/  # Esquema de base de datos

mindhub/frontend/
└── components/ClinimetrixPro/
    ├── Renderer/         # Motor de renderizado dinámico
    ├── ResponseTypes/    # Componentes por tipo de respuesta
    └── Interactive/      # Componentes especializados (Canvas, etc.)
```

### Estado de Migración
- ✅ **Fase 0**: Sistema legacy movido a `_TRASH_LEGACY_CLINIMETRIX/`
- ✅ **Fase 1**: Diseño de plantillas y conversión de escalas piloto (PHQ-9 migrado)
- ✅ **Fase 2**: Motor de renderizado dinámico (CardBase System)
- ✅ **Fase 3**: Sistema de scoring y análisis (ScoringEngine)
- ✅ **Fase 4**: APIs y servicios completos (Routes funcionando)
- 🚧 **Fase 5**: Integración completa con Expedix y auto-guardado

---

## ⭐ **CLINIMETRIX PRO - SISTEMA CARDBASE COMPLETO** ⭐

### **🎯 FUNCIONAMIENTO GENERAL:**
ClinimetrixPro es un sistema de evaluaciones clínicas que usa **plantillas JSON científicas** para renderizar cualquier escala psicológica/médica. Cada plantilla contiene TODA la información necesaria para renderizar, validar, calcular puntuaciones e interpretar resultados.

### **📊 ARQUITECTURA DE DATOS:**
- **`clinimetrix_templates`**: Plantillas JSON completas con toda la escala
- **`clinimetrix_registry`**: Catálogo metadata de escalas disponibles 
- **`clinimetrix_assessments`**: Sesiones de evaluación con respuestas y resultados
- **Templates Path**: `/backend/templates/scales/*.json`

### **🔄 FLUJO COMPLETO DE EVALUACIÓN:**

#### **1. INICIO DESDE EXPEDIX (Patient-Centric)**
- Usuario va a Expedix → Selecciona paciente → Click "Evaluación"
- Abre `ClinimetrixScaleSelector` con paciente pre-seleccionado
- Lista escalas con **favoritas primero** (⭐), búsqueda inteligente
- Al seleccionar escala → `ClinimetrixProAssessmentModal`

#### **2. SISTEMA CARDBASE - NAVEGACIÓN POR TARJETAS**
El **CardBase** es el sistema de navegación por tarjetas que maneja todo el flujo:

**Tipos de Cards en orden:**
1. **InstructionsCard**: Instrucciones de la escala + "Comenzar Evaluación"
2. **ItemCards**: Una card por cada ítem/pregunta de la escala
3. **CompletionCard**: "Evaluación Completada" + botón "Ver Resultados"  
4. **ResultsCard**: Puntuaciones + interpretación + acciones (PDF/Imprimir)

**Navegación CardBase:**
- **Botones**: "< Anterior" | "Siguiente >" | "Salir"
- **Progress Bar**: Muestra progreso visual (ej: "Pregunta 3/9")
- **Auto-Save**: Guarda respuestas automáticamente en cada cambio
- **Validation**: No permite avanzar sin responder ítem actual

#### **3. MOTOR DE RENDERIZADO DINÁMICO**
- **Un solo componente universal** que lee plantilla JSON y renderiza cualquier escala
- **Tipos de respuesta soportados**: likert, multiple_choice, boolean, slider, text, number
- **Response Groups**: Conjuntos reutilizables de opciones (ej: "nunca/a veces/siempre")
- **Conditional Logic**: Ítems condicionales basados en respuestas previas
- **Help System**: Botón "?" en cada ítem con ayuda contextual

#### **4. SCORING ENGINE INTELIGENTE**
- **Cálculo automático**: Total, subscales, interpretación
- **Validación inteligente**: Detecta patrones anómalos, respuestas inconsistentes
- **Multi-scoring**: Soporta múltiples sistemas de puntuación por escala
- **Real-time scoring**: Cálculos en tiempo real mientras se responde

### **🎨 ESTRUCTURA DE PLANTILLA JSON:**
```json
{
  "metadata": {
    "id": "phq9-1.0",
    "name": "PHQ-9 - Cuestionario de Salud del Paciente",
    "abbreviation": "PHQ-9",
    "category": "Depresión",
    "version": "1.0",
    "authors": ["Kurt Kroenke", "Robert L. Spitzer"],
    "year": 2001
  },
  "structure": {
    "totalItems": 9,
    "sections": [{
      "sectionId": "main",
      "title": "Durante las últimas 2 semanas...",
      "items": [...]
    }]
  },
  "responseGroups": {
    "phq9_frequency": [
      {"label": "Para nada", "value": "not_at_all", "score": 0},
      {"label": "Varios días", "value": "several_days", "score": 1},
      {"label": "Más de la mitad de los días", "value": "more_than_half", "score": 2},
      {"label": "Casi todos los días", "value": "nearly_every_day", "score": 3}
    ]
  },
  "scoring": {
    "scoreRange": {"min": 0, "max": 27},
    "calculationMethod": "sum"
  },
  "interpretation": {
    "rules": [
      {"minScore": 0, "maxScore": 4, "severity": "minimal", "description": "Síntomas mínimos"},
      {"minScore": 5, "maxScore": 9, "severity": "mild", "description": "Depresión leve"},
      {"minScore": 10, "maxScore": 14, "severity": "moderate", "description": "Depresión moderada"},
      {"minScore": 15, "maxScore": 19, "severity": "moderately_severe", "description": "Depresión moderadamente severa"},
      {"minScore": 20, "maxScore": 27, "severity": "severe", "description": "Depresión severa"}
    ]
  }
}
```

### **⚡ CARACTERÍSTICAS ESPECIALES:**

#### **Sistema de Favoritas**
- Las escalas favoritas aparecen primero con ⭐
- Guardado en localStorage: `'clinimetrix-favorites'`
- Toggle fácil desde selector de escalas

#### **Integración con Expedix**  
- Llamada directa desde expediente del paciente
- Paciente pre-seleccionado automáticamente
- Resultados se guardan automáticamente en expediente
- Si hay consulta abierta, se vincula la evaluación

#### **Auto-Save System**
- Todas las respuestas se guardan automáticamente
- No se pierde progreso si se cierra accidentalmente
- Estado persistente entre sesiones

#### **Help System**
- Botón "?" en cada ítem
- Información contextual sobre cómo responder
- Tooltips explicativos

#### **Results & Actions**
- **PDF Export**: Genera reporte profesional en PDF
- **Print**: Impresión directa de resultados
- **Email**: Envío por correo electrónico
- **Auto-Archive**: Guardado automático en expediente

### **🔗 ENDPOINTS API:**
- `GET /api/clinimetrix-pro/templates/catalog` - Lista todas las escalas
- `GET /api/clinimetrix-pro/templates/:templateId` - Obtiene plantilla específica
- `POST /api/clinimetrix-pro/assessments/new` - Crea nueva evaluación
- `PUT /api/clinimetrix-pro/assessments/:id/responses` - Guarda respuestas
- `POST /api/clinimetrix-pro/assessments/:id/complete` - Completa y calcula resultados
- `GET /api/clinimetrix-pro/assessments/patient/:patientId` - Evaluaciones por paciente

### **🎮 COMPONENTES PRINCIPALES:**
- `ClinimetrixScaleSelector.tsx` - Selector de escalas desde Expedix
- `ClinimetrixProAssessmentModal.tsx` - Modal principal con CardBase
- `CardBase.tsx` - Navegador de tarjetas
- `ClinimetrixRenderer.tsx` - Motor de renderizado universal
- `ScoringEngine.js` - Motor de cálculo de puntuaciones

### **✅ ESTADO ACTUAL - COMPLETAMENTE FUNCIONAL:**
- ✅ PHQ-9 migrado y funcional
- ✅ Integración con Expedix completada
- ✅ CardBase system implementado
- ✅ Scoring Engine funcionando
- ✅ Auto-save básico implementado
- ✅ Sistema de favoritas funcionando
- ✅ Base de datos en producción (Railway)

### **🚀 PRÓXIMOS PASOS:**
- ⏳ Implementar guardado completo en expediente del paciente
- ⏳ Agregar más escalas (GAD-7, MMSE, etc.)
- ⏳ Sistema de envío tokenizado a distancia
- ⏳ Reportes PDF profesionales
- ⏳ Panel de administración de plantillas

---

## Recordatorios de Desarrollo
- No hagas commit ni push en github hasta que yo te lo pida. me puedes preguntar, pero no lo hagas sin que me autorice