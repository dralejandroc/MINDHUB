# 🎯 CLINIMETRIX PRO - SEPARACIÓN DE PROYECTO MVP

## 📋 RESUMEN EJECUTIVO

**Objetivo**: Extraer ClinimetrixPro del repositorio principal MindHub y crear un MVP independiente en `clinimetrix.mindhub.cloud`

**Motivo**: Problemas de complejidad con el sistema completo MindHub (middleware Clerk, rutas API, múltiples módulos) están bloqueando el desarrollo ágil de ClinimetrixPro.

**Estrategia**: MVP independiente, simple, enfocado solo en evaluaciones clínicas.

---

## 🗂️ ARCHIVOS A EXTRAER DEL REPO PRINCIPAL

### **Frontend Components (Completos - Ya funcionando)**
```
mindhub/frontend/components/ClinimetrixPro/
├── ClinimetrixScaleSelector.tsx      ✅ Selector de escalas con favoritas
├── ClinimetrixProAssessmentModal.tsx ✅ Modal principal con CardBase
├── CardBase.tsx                      ✅ Sistema de navegación por tarjetas
├── ClinimetrixRenderer.tsx           ✅ Motor de renderizado universal
├── ResponseTypes/                    ✅ Componentes de respuesta (likert, etc.)
├── Interactive/                      ✅ Componentes especializados
└── ScoringEngine.js                  ✅ Motor de cálculo de puntuaciones
```

### **Backend Services (Completos)**
```
mindhub/backend/clinimetrix-pro/
├── routes/
│   ├── templates.js                  ✅ API de plantillas
│   ├── assessments.js                ✅ API de evaluaciones
│   └── catalog.js                    ✅ API de catálogo
├── services/
│   ├── ScoringEngine.js              ✅ Motor de scoring
│   ├── ValidationService.js          ✅ Validación de respuestas
│   └── ReportGenerator.js            ✅ Generación de reportes
└── middleware/
    └── templateValidator.js          ✅ Validación de plantillas
```

### **Templates y Data**
```
mindhub/backend/templates/scales/
├── phq9-1.0.json                     ✅ PHQ-9 completo y funcional
├── gad7-1.0.json                     ⏳ GAD-7 (si existe)
├── mmse-1.0.json                     ⏳ MMSE (si existe)
└── [otras escalas]                   ⏳ Por agregar posteriormente
```

### **Database Schema**
```
mindhub/backend/database/migrations/
└── 001_create_clinimetrix_pro_tables.sql ✅ Esquema completo PostgreSQL
```

### **Utilidades Reutilizables**
```
mindhub/frontend/lib/
├── clinimetrix-api.js                ✅ Cliente API para ClinimetrixPro
├── scoring-utils.js                  ✅ Utilidades de scoring
└── validation-utils.js               ✅ Validaciones frontend
```

---

## 🏗️ NUEVA ESTRUCTURA DEL PROYECTO

```
CLINIMETRIX-PRO-MVP/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── prisma/
│   ├── schema.prisma                 # PostgreSQL schema
│   └── migrations/
├── components/
│   └── ClinimetrixPro/               # Todos los componentes migrados
├── app/
│   ├── page.tsx                      # Landing page
│   ├── dashboard/
│   │   └── page.tsx                  # Dashboard principal
│   ├── assessment/
│   │   └── [templateId]/
│   │       └── page.tsx              # Página de evaluación
│   ├── results/
│   │   └── [assessmentId]/
│   │       └── page.tsx              # Resultados
│   ├── patients/
│   │   └── page.tsx                  # Lista simple de pacientes
│   └── api/
│       ├── templates/                # APIs de plantillas
│       ├── assessments/              # APIs de evaluaciones
│       └── patients/                 # APIs de pacientes simples
├── lib/
│   ├── prisma.js                     # Cliente PostgreSQL
│   ├── auth.js                       # Clerk config simple
│   └── utils/                        # Utilidades migradas
├── templates/
│   └── scales/                       # Plantillas JSON migradas
└── server/                           # Backend opcional (si necesario)
    ├── index.js
    ├── routes/
    └── services/
```

---

## 🔧 STACK TECNOLÓGICO SIMPLIFICADO

### **Frontend**
- **Framework**: Next.js 14.2.30 (App Router)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Auth**: `@clerk/nextjs` (configuración básica)
- **State**: Context API + useState (sin Redux)

### **Backend**  
- **Database**: Railway PostgreSQL (ÚNICO)
- **ORM**: Prisma (adaptado de MySQL a PostgreSQL)
- **API**: Next.js API Routes (sin Express separado)
- **Auth**: Clerk JWT validation

### **Deploy**
- **Frontend**: Vercel con subdomain `clinimetrix.mindhub.cloud`
- **Database**: Railway PostgreSQL
- **DNS**: CNAME record en Cloudflare/Vercel

---

## 📊 DATABASE SCHEMA (PostgreSQL)

### **Tablas Principales**
```sql
-- Pacientes simplificados (sin información sensible)
CREATE TABLE simple_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),                    -- Solo nombre corto
    age INTEGER,
    sex CHAR(1) CHECK (sex IN ('M', 'F', 'O')),
    user_id VARCHAR(255),                 -- Clerk user ID
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Mantener tablas ClinimetrixPro existentes
CREATE TABLE clinimetrix_templates (
    id VARCHAR(255) PRIMARY KEY,
    template_data JSONB NOT NULL,
    version VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clinimetrix_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(255) REFERENCES clinimetrix_templates(id),
    patient_id UUID REFERENCES simple_patients(id),
    user_id VARCHAR(255),                 -- Clerk user ID
    responses JSONB,
    results JSONB,
    status VARCHAR(50) DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Registro/catálogo simplificado
CREATE TABLE clinimetrix_registry (
    id VARCHAR(255) PRIMARY KEY,
    template_id VARCHAR(255) REFERENCES clinimetrix_templates(id),
    name VARCHAR(255),
    abbreviation VARCHAR(50),
    category VARCHAR(100),
    description TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 PLAN DE MIGRACIÓN

### **FASE 1: Setup del Nuevo Repo (10 min)**
1. Crear repo: `CLINIMETRIX-PRO-MVP`
2. Inicializar Next.js 14 limpio
3. Configurar PostgreSQL en Railway
4. Setup Prisma con PostgreSQL

### **FASE 2: Migración de Archivos (15 min)**
1. Copiar componentes ClinimetrixPro → `components/`
2. Copiar templates JSON → `templates/`
3. Migrar utilidades → `lib/`
4. Adaptar schema SQL a PostgreSQL

### **FASE 3: Configuración Clerk (5 min)**
1. Nueva app Clerk para MVP
2. Configuración básica auth
3. Variables de entorno

### **FASE 4: Testing y Deploy (15 min)**
1. Test local con PHQ-9
2. Deploy a Vercel
3. Configurar subdomain
4. Verificación final

---

## ✅ PRESERVACIÓN DEL TRABAJO

### **Componentes 100% Funcionales que se Mantienen:**
- ✅ Sistema CardBase completo (navegación por tarjetas)
- ✅ Motor de renderizado universal (soporta todos los tipos de respuesta)
- ✅ ScoringEngine (cálculo automático + interpretación)
- ✅ Sistema de favoritas con localStorage
- ✅ Auto-save de respuestas
- ✅ Validación inteligente
- ✅ Generación de reportes

### **Simplificaciones:**
- ❌ Sin integración Expedix (por ahora)
- ❌ Sin información sensible de pacientes
- ❌ Sin roles/permisos complejos
- ❌ Sin middleware complejo de rutas

---

## 🎯 MVP SCOPE

### **Funcionalidades Core:**
1. **Login/Register** con Clerk
2. **Dashboard** con escalas disponibles + favoritas
3. **Crear paciente simple** (nombre, edad, sexo)
4. **Sistema de evaluación completo** (CardBase + ScoringEngine)
5. **Ver resultados** + interpretación
6. **Generar PDF** básico
7. **Historial de evaluaciones**

### **Escalas Iniciales:**
- PHQ-9 (ya migrado y funcional)
- [Escalas adicionales se subirán posteriormente]

---

## 🔗 CONEXIÓN FUTURA CON MINDHUB

**Ventajas de la separación:**
- Desarrollo ágil sin conflictos
- Testing independiente  
- Deploy separado
- Fácil integración posterior vía APIs

**Plan de reconexión:**
- Una vez MVP estable, se puede integrar como módulo en MindHub
- APIs compatibles para comunicación entre sistemas
- Misma base de datos PostgreSQL (fácil merge)

*Documento creado: $(date +"%Y-%m-%d %H:%M:%S")*
*Objetivo: MVP ClinimetrixPro independiente en clinimetrix.mindhub.cloud*