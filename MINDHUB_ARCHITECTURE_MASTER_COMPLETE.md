# 🏗️ MINDHUB ARCHITECTURE MASTER - COMPLETE REFERENCE
**Última actualización**: 2025-08-31  
**Versión**: v11.0-hybrid-graphql-django  
**Estado**: ✅ SISTEMA HÍBRIDO COMPLETAMENTE FUNCIONAL

> ⚡ **REFERENCIA CRÍTICA**: Este documento es la fuente de verdad para TODA la arquitectura de MindHub.  
> SIEMPRE consultar antes de hacer cambios. Sistema híbrido GraphQL + Django implementado.

---

## 📊 **ARQUITECTURA ACTUAL - HÍBRIDO GRAPHQL + DJANGO**

```
┌─ Frontend React/Next.js ──────── Vercel (https://mindhub.cloud)
│  ├─ Hybrid Services ─────────── GraphQL PRIMARY + Django fallback
│  ├─ Resources Hybrid ───────── Django primary, GraphQL fallback
│  ├─ Agenda Settings Hybrid ──── Django primary, GraphQL fallback
│  ├─ FormX Hybrid ──────────── Django ONLY (complex business logic)
│  ├─ ClinimetrixPro Hybrid ───── Django ONLY (psychometric logic)
│  └─ Apollo GraphQL Client ────── Direct Supabase GraphQL endpoint
│
├─ Django Backend ─────────────── Django REST API (ALL modules)
│  ├─ Complex Business Logic ──── FormX tokens, ClinimetrixPro scoring
│  ├─ Workflow Management ──────── Expedix consultations, Agenda scheduling
│  ├─ Authentication ──────────── Supabase JWT validation
│  └─ File Operations ─────────── Resources upload, FormX documents
│
├─ GraphQL Layer ──────────────── Supabase GraphQL API
│  ├─ Apollo Client ───────────── Frontend GraphQL operations
│  ├─ Real-time Subscriptions ──── Live dashboard updates
│  ├─ Simple CRUD Operations ───── Basic data retrieval/updates
│  └─ Fallback Mechanism ──────── When Django APIs unavailable
│
├─ Database ───────────────────── Supabase PostgreSQL
│  ├─ All Module Tables ────────── patients, appointments, consultations, resources
│  ├─ Hybrid Data Access ──────── Django ORM + GraphQL queries
│  └─ RLS Security ────────────── Row Level Security policies
│
└─ Authentication ─────────────── Supabase Auth + JWT validation
   ├─ Frontend Auth ───────────── @supabase/auth-helpers-nextjs
   └─ Backend Middleware ──────── Django Supabase JWT validation
```

---

## 🛣️ **HYBRID API ARCHITECTURE - COMPLETE MAPPING**

### **🔄 HYBRID SERVICE LAYER (Frontend Services)**

#### **1. Resources Hybrid Service** `lib/resources-hybrid-service.ts`
- **Strategy**: Django PRIMARY + GraphQL fallback
- **Complex Logic**: File uploads, storage management, categories
- **GraphQL Fallback**: Simple resource listing when Django unavailable

#### **2. Agenda Settings Hybrid Service** `lib/agenda-settings-hybrid-service.ts`
- **Strategy**: Django PRIMARY + GraphQL fallback  
- **Complex Logic**: Schedule configuration, working hours, consultation types
- **GraphQL Fallback**: Basic settings retrieval

#### **3. FormX Hybrid Service** `lib/formx-hybrid-service.ts`
- **Strategy**: Django ONLY (NO GraphQL fallback for complex operations)
- **Complex Logic**: Form tokens, expiration, mobile rendering, submission workflows
- **Reasoning**: Form business logic too complex for GraphQL

#### **4. ClinimetrixPro Hybrid Service** `lib/clinimetrix-pro-hybrid-service.ts`
- **Strategy**: Django ONLY (NO GraphQL fallback for psychometric operations)
- **Complex Logic**: 29+ scales, scoring algorithms, clinical interpretations
- **Reasoning**: Psychometric calculations require Django backend logic

#### **5. Dashboard GraphQL Service** `lib/dashboard-graphql-service.ts`
- **Strategy**: GraphQL PRIMARY + error fallback
- **Simple Logic**: Statistics aggregation, real-time dashboard updates
- **Error Handling**: -999 values for connection errors vs 0 for empty data

### **📡 DJANGO REST API ENDPOINTS (Complex Business Logic ONLY)**

```bash
# 🚨 CRITICAL BUSINESS LOGIC - Django backend mantiene TODA la lógica compleja

# FORMX - Token & Form Management (Django ONLY)
GET    /api/formx/forms/token/[token]            # ✅ Get form by token (expiration logic)
POST   /api/formx/forms/token/[token]/submit     # ✅ Submit form (workflow logic)
POST   /api/formx/forms/token/[token]/draft      # ✅ Save form draft (session mgmt)
GET    /api/formx/forms                          # ✅ List dynamic forms (admin)
POST   /api/formx/forms                          # ✅ Create dynamic form

# CLINIMETRIX PRO - Psychometric Assessment (Django ONLY) 
GET    /api/clinimetrix-pro/templates/[scaleId]  # ✅ Scale template (29+ scales)
POST   /api/clinimetrix-pro/assessments/start    # ✅ Start assessment (state mgmt)
POST   /api/clinimetrix-pro/assessments/[id]/submit # ✅ Submit & score (algorithms)
GET    /api/clinimetrix-pro/scales               # ✅ Available scales (metadata)

# RESOURCES - File Management (Django PRIMARY)
POST   /api/resources/upload                     # ✅ File upload (storage logic)
GET    /api/resources/categories                 # ✅ Categories (hybrid: Django→GraphQL)
GET    /api/resources                            # ✅ List resources (hybrid: Django→GraphQL)

# AGENDA SETTINGS - Schedule Configuration (Django PRIMARY)
GET    /api/expedix/schedule-config              # ✅ Get settings (hybrid: Django→GraphQL)
PUT    /api/expedix/schedule-config              # ✅ Save settings (Django ONLY)

# EXPEDIX CONSULTATION SYSTEM (Django backend)
GET    /api/expedix/consultations                # ✅ List consultations - Django backend
POST   /api/expedix/consultations                # ✅ Create consultation - Django backend
GET    /api/expedix/consultation-templates       # ✅ Consultation templates
GET    /api/expedix/prescriptions                # ✅ Prescription system
GET    /api/expedix/agenda/appointments          # ✅ Appointment management
```

#### 🔀 **DJANGO PROXY ROUTES**
```bash
# EXPEDIX DJANGO INTEGRATION
GET    /api/expedix/django                       # Django health check
GET    /api/expedix/django/configuration         # Django configuration
GET    /api/expedix/django/consultation-templates # Django consultation templates  
GET    /api/expedix/django/consultation-templates/[id] # Specific template
GET    /api/expedix/django/diagnoses/search      # Search diagnoses
GET    /api/expedix/django/medications/search    # Search medications
GET    /api/expedix/django/medications/prescriptions # Medication prescriptions
GET    /api/expedix/django/prescriptions/[id]/pdf # PDF prescription generation
```

#### 🏥 **TENANT & CLINIC MANAGEMENT**
```bash
GET    /api/tenant/context                       # ✅ Current tenant context
POST   /api/tenant/context                       # ✅ Switch tenant context
GET    /api/tenant/memberships                   # User memberships

GET    /api/clinics/django/clinics               # List clinics
GET    /api/clinics/django/invitations           # Clinic invitations
POST   /api/clinics/django/invitations/accept    # Accept clinic invitation
```

#### 📊 **CLINIMETRIX PRO SYSTEM**
```bash
GET    /api/clinimetrix-pro                      # ClinimetrixPro main
GET    /api/clinimetrix-pro/assessments          # List assessments
GET    /api/clinimetrix-pro/templates            # Assessment templates
GET    /api/clinimetrix-pro/templates/[templateId] # Specific template
GET    /api/clinimetrix-pro/templates/catalog    # Template catalog
```

#### 📚 **RESOURCES MANAGEMENT**
```bash
GET    /api/resources                            # List resources
POST   /api/resources                            # Create resource
GET    /api/resources/categories                 # Resource categories
POST   /api/resources/upload                     # Upload resource
GET    /api/resources/tracking/patient/[patientId] # Patient resource tracking
GET    /api/resources/django                     # Django resources integration
```

#### 💰 **FINANCE SYSTEM**
```bash
GET    /api/finance/services                     # Financial services
GET    /api/finance/income                       # Income management
GET    /api/finance/cash-register               # Cash register operations
GET    /api/finance/stats                       # Financial statistics
GET    /api/finance/django                      # Django finance integration
```

#### 🏥 **FRONTDESK MODULE**
```bash
GET    /api/frontdesk/appointments/today         # Today's appointments
GET    /api/frontdesk/stats/today               # Today's statistics
GET    /api/frontdesk/tasks/pending             # Pending tasks
GET    /api/frontdesk/emergency/appointments     # Emergency appointments
GET    /api/frontdesk/emergency/stats           # Emergency statistics
GET    /api/frontdesk/patients/[id]/behavioral-history # Patient behavioral history
```

#### 🔧 **SYSTEM & UTILITIES**
```bash
GET    /api/health                              # System health check
GET    /api/health/backend                      # Backend health check
GET    /api/version                             # API version
GET    /api/debug/tables                        # Debug table information
POST   /api/feedback                            # User feedback
POST   /api/admin/run-migration                 # Run database migrations
GET    /api/agenda/django                       # Agenda Django integration
```

### **🚀 SUPABASE GRAPHQL API ENDPOINTS (Simple Operations & Fallbacks)**

```graphql
# Apollo Client queries via lib/apollo/queries/

# DASHBOARD STATISTICS (GraphQL PRIMARY)
query GetPatients($filter: patientsFilter, $first: Int)
query GetAppointments($filter: appointmentsFilter, $first: Int) 
query GetConsultations($filter: consultationsFilter, $first: Int)
query GetAssessments($filter: assessmentsFilter, $first: Int)

# RESOURCES (GraphQL FALLBACK cuando Django falla)
query GetMedicalResources($filter: medical_resourcesFilter, $first: Int)
mutation CreateMedicalResource($objects: [medical_resourcesInsertInput!]!)

# AGENDA SETTINGS (GraphQL FALLBACK)
query GetSettings($filter: settingsFilter)
mutation CreateSetting($objects: [settingsInsertInput!]!)
mutation UpdateSetting($id: BigInt!, $set: settingsUpdateInput!)

# FORMX ADMIN (GraphQL FALLBACK para admin)
query GetDynamicForms($filter: dynamic_formsFilter, $first: Int)
query GetFormResponses($filter: form_responsesFilter, $first: Int)

# CLINIMETRIX ASSESSMENTS (GraphQL FALLBACK para historial)
query GetClinimetrixAssessments($filter: clinimetrix_assessmentsFilter, $first: Int)
query GetClinimetrixScales($filter: clinimetrix_scalesFilter, $first: Int)

# FINANCE STATISTICS (GraphQL PRIMARY)
query GetFinanceServices($filter: finance_servicesFilter, $first: Int)
query GetFinanceIncome($filter: finance_incomeFilter, $first: Int)
query GetCashRegisterCuts($filter: cash_register_cutsFilter, $first: Int)
```

---

## 🔧 **DJANGO BACKEND ENDPOINTS**

### **Django Base URL**: `https://mindhub-django-backend.vercel.app`

```bash
# EXPEDIX MODULE - Django REST Framework
GET    /api/expedix/patients/                   # ✅ List patients
POST   /api/expedix/patients/                   # ✅ Create patient
GET    /api/expedix/patients/[id]/              # ✅ Get patient
PUT    /api/expedix/patients/[id]/              # ✅ Update patient
GET    /api/expedix/patients/search/            # ✅ Search patients
GET    /api/expedix/patients/stats/             # ✅ Patient statistics

# CONSULTATION SYSTEM - Complete Implementation
GET    /api/expedix/consultations/              # ✅ List consultations with ALL fields
POST   /api/expedix/consultations/              # ✅ Create consultation with ALL fields
PUT    /api/expedix/consultations/[id]/         # ✅ Update consultation with ALL fields
GET    /api/expedix/consultations/upcoming/     # ✅ Upcoming consultations
GET    /api/expedix/consultations/by-patient/   # ✅ Consultations by patient
PATCH  /api/expedix/consultations/[id]/update_mental_exam/    # ✅ Update mental exam only
PATCH  /api/expedix/consultations/[id]/finalize_consultation/ # ✅ Finalize consultation
GET    /api/expedix/consultations/drafts/       # ✅ Draft consultations

# PRESCRIPTION SYSTEM
GET    /api/expedix/prescriptions/              # ✅ List prescriptions
POST   /api/expedix/prescriptions/              # ✅ Create prescription  
GET    /api/expedix/prescriptions/by-patient/   # ✅ Prescriptions by patient
GET    /api/expedix/prescriptions/by-professional/ # ✅ Prescriptions by professional

# MEDICATION & DIAGNOSIS SEARCH
GET    /api/expedix/medications/                # ✅ List medications
GET    /api/expedix/medications/search/         # ✅ Search medications
GET    /api/expedix/diagnoses/                  # ✅ List diagnoses
GET    /api/expedix/diagnoses/search/           # ✅ Search diagnoses

# CONFIGURATION & TEMPLATES
GET    /api/expedix/consultation-templates/     # ✅ Consultation templates
POST   /api/expedix/consultation-templates/     # ✅ Create template
GET    /api/expedix/configuration/              # ✅ Expedix configuration
GET    /api/expedix/schedule-config/            # ✅ Schedule configuration

# USER MANAGEMENT
GET    /api/expedix/users/                      # ✅ List users
GET    /api/expedix/users/me/                   # ✅ Current user profile

# MEDICAL HISTORY
GET    /api/expedix/medical-history/            # ✅ Medical history
GET    /api/expedix/medical-history/by-patient/ # ✅ History by patient

# DEBUG & TESTING
GET    /api/expedix/debug-auth/                 # ✅ Debug authentication
GET    /api/expedix/dual-system-test/           # ✅ Test dual system
```

---

## 🗄️ **DATABASE SCHEMA - SUPABASE POSTGRESQL**

### **🩺 CORE HEALTHCARE TABLES**

#### `patients` - **38 campos + DUAL SYSTEM**
```sql
-- IDENTIFICACIÓN
id: uuid (PK)
medical_record_number: text
first_name: text (NOT NULL)
last_name: text
paternal_last_name: text
maternal_last_name: text

-- DATOS PERSONALES
date_of_birth: date
gender: text
email: text
phone: text
address: text
city: text
state: text
postal_code: text
country: text
curp: text
rfc: text
marital_status: varchar
occupation: varchar

-- DATOS MÉDICOS
blood_type: text
allergies: text[] (ARRAY)
chronic_conditions: text[] (ARRAY)
current_medications: text[] (ARRAY)
insurance_provider: varchar
insurance_number: varchar

-- CONTACTO DE EMERGENCIA
emergency_contact_name: text
emergency_contact_phone: text
emergency_contact_relationship: text
emergency_contact: varchar (DUPLICADO?)
emergency_phone: varchar (DUPLICADO?)

-- CONSENTIMIENTOS Y PERMISOS
consent_to_treatment: boolean
consent_to_data_processing: boolean

-- CLASIFICACIÓN Y ASIGNACIÓN
patient_category: text
assigned_professional_id: uuid (FK)
notes: text
tags: text[] (ARRAY)
is_active: boolean

-- DUAL SYSTEM (XOR)
clinic_id: uuid (FK to clinics)
workspace_id: uuid (FK to individual_workspaces)

-- AUDIT
created_by: uuid (FK to profiles)
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

#### `consultations` - **EXPANDIDO CON MENTAL EXAM + 33 CAMPOS**
```sql
-- IDENTIFICACIÓN
id: uuid (PK)
patient_id: uuid (FK to patients) NOT NULL
professional_id: uuid (FK to profiles) NOT NULL
linked_appointment_id: uuid (FK to appointments)

-- DATOS BÁSICOS
consultation_date: timestamp with time zone
consultation_type: text
duration_minutes: integer

-- CONTENIDO CLÍNICO (Campos originales)
chief_complaint: text
history_present_illness: text
present_illness: text  -- Duplicado en Supabase
physical_examination: text
physical_exam: text    -- Duplicado en Supabase
assessment: text
plan: text
treatment_plan: text   -- Campo adicional de Supabase
diagnosis: text
diagnosis_codes: text[] (ARRAY)
notes: text

-- ✅ NUEVOS CAMPOS CRÍTICOS (Migración completada)
mental_exam: jsonb DEFAULT '{}'              -- ⭐ CAMPO MÁS IMPORTANTE
clinical_notes: text                         -- Notas para el equipo
private_notes: text                          -- Notas privadas del profesional
vital_signs: jsonb DEFAULT '{}'              -- Signos vitales
prescriptions: jsonb DEFAULT '{}'            -- Prescripciones integradas

-- WORKFLOW Y ESTADOS
status: text
is_draft: boolean DEFAULT true               -- ✅ NUEVO
is_finalized: boolean DEFAULT false          -- ✅ NUEVO

-- CONFIGURACIÓN Y PERSONALIZACIÓN
template_config: jsonb DEFAULT '{}'          -- ✅ NUEVO - Configuraciones de plantilla
form_customizations: jsonb DEFAULT '{}'      -- ✅ NUEVO - Personalizaciones por clínica/usuario
consultation_metadata: jsonb DEFAULT '{}'    -- ✅ NUEVO - Metadatos adicionales

-- SEGUIMIENTO Y EVALUACIONES
sections_completed: jsonb DEFAULT '{}'       -- ✅ NUEVO - Secciones completadas
linked_assessments: jsonb DEFAULT '[]'       -- ✅ NUEVO - ClinimetrixPro integration
follow_up_date: date
follow_up_instructions: text

-- CONTROL DE CALIDAD
quality_reviewed: boolean DEFAULT false      -- ✅ NUEVO
quality_reviewer_id: uuid                    -- ✅ NUEVO
quality_review_date: timestamp with time zone -- ✅ NUEVO
quality_notes: text                          -- ✅ NUEVO

-- DUAL SYSTEM
clinic_id: uuid (FK to clinics)
workspace_id: uuid (FK to individual_workspaces)

-- AUDIT TRAIL COMPLETO
created_at: timestamp with time zone
updated_at: timestamp with time zone
edited_by: uuid                              -- ✅ NUEVO - Último editor
edit_reason: text                            -- ✅ NUEVO - Razón del cambio
finalized_at: timestamp with time zone       -- ✅ NUEVO
finalized_by: uuid                           -- ✅ NUEVO
revision_number: integer DEFAULT 1           -- ✅ NUEVO - Control de versiones
```

#### `appointments` - **Sistema de citas con drag & drop**
```sql
id: uuid (PK)
patient_id: uuid (FK to patients) NOT NULL
professional_id: uuid (FK to profiles) NOT NULL  -- ⚠️ NO provider_id

-- FECHA Y HORA (Campos separados - importante para drag & drop)
appointment_date: date                       -- YYYY-MM-DD
start_time: time without time zone          -- HH:MM
end_time: time without time zone            -- HH:MM

-- DETALLES
appointment_type: varchar
status: varchar ('scheduled', 'confirmed', 'completed', 'cancelled', 'modified')
reason: text
notes: text
internal_notes: text

-- CONFIRMACIONES Y RECORDATORIOS
confirmation_sent: boolean
confirmation_date: timestamp with time zone
reminder_sent: boolean
reminder_date: timestamp with time zone

-- CITAS RECURRENTES
is_recurring: boolean
recurring_pattern: jsonb

-- DUAL SYSTEM
clinic_id: uuid (FK to clinics)
workspace_id: uuid (FK to individual_workspaces)

-- AUDIT
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

#### `prescriptions` - **Recetas médicas**
```sql
id: uuid (PK)
patient_id: uuid (FK to patients)
professional_id: uuid (FK to profiles)
consultation_id: uuid (FK to consultations)
prescription_date: timestamp with time zone
medications: jsonb                           -- Lista de medicamentos
instructions: text
status: text
valid_until: date

-- DUAL SYSTEM
clinic_id: uuid (FK to clinics)
workspace_id: uuid (FK to individual_workspaces)

-- AUDIT
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

### **🏥 ORGANIZATIONAL TABLES**

#### `profiles` - **Perfiles de usuario Supabase**
```sql
id: uuid (PK) -- Mismo que auth.users
email: text
first_name: text
last_name: text
role: text
organization: text
license_number: text
specialization: text
is_active: boolean
email_verified: boolean
last_login_at: timestamp
created_at: timestamp
updated_at: timestamp
```

#### `tenant_memberships` - **Sistema multitenant**
```sql
id: uuid (PK)
user_id: uuid (FK to auth.users) NOT NULL
clinic_id: uuid (FK to clinics) NOT NULL
role: varchar ('member', 'admin', 'owner') DEFAULT 'member'
permissions: jsonb DEFAULT '{}'
is_active: boolean DEFAULT TRUE
invited_by: uuid (FK to auth.users)
joined_at: timestamp with time zone DEFAULT NOW()
created_at: timestamp with time zone DEFAULT NOW()
updated_at: timestamp with time zone DEFAULT NOW()

-- CONSTRAINT: Un usuario no puede estar duplicado en la misma clínica
UNIQUE(user_id, clinic_id)
```

#### `clinics` - **Clínicas y organizaciones**
```sql
id: uuid (PK)
name: text
business_name: text
tax_id: text
address: text
phone: text
email: text
website: text
logo_url: text
subscription_plan: varchar
max_users: integer
max_patients: integer
is_active: boolean
settings: jsonb
owner_id: uuid
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

#### `individual_workspaces` - **Espacios individuales**
```sql
id: uuid (PK)
owner_id: uuid (FK to profiles)
workspace_name: varchar
business_name: varchar
tax_id: varchar
settings: jsonb
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

### **📊 CLINIMETRIX TABLES**

#### `clinimetrix_assessments` - **Evaluaciones psicométricas**
```sql
id: uuid (PK)
template_id: text (Scale code like "PHQ-9")
patient_id: uuid (FK to patients)
administrator_id: uuid (FK to profiles)
consultation_id: uuid (FK to consultations)
mode: text ("self" | "assisted")
status: text ("pending" | "completed" | "cancelled")
responses: jsonb
scores: jsonb
interpretations: jsonb
started_at: timestamp
completed_at: timestamp

-- DUAL SYSTEM
clinic_id: uuid (FK to clinics)
workspace_id: uuid (FK to individual_workspaces)

-- AUDIT
created_at: timestamp
updated_at: timestamp
```

### **💰 FINANCE TABLES**

#### `finance_services` - **Servicios financieros**
```sql
id: uuid (PK)
name: text
description: text
price: numeric
currency: text
category: text
is_active: boolean

-- DUAL SYSTEM
clinic_id: uuid (FK to clinics)
workspace_id: uuid (FK to individual_workspaces)

-- AUDIT
created_at: timestamp
updated_at: timestamp
```

#### `finance_income` - **Registro de ingresos**
```sql
id: uuid (PK)
service_id: uuid (FK to finance_services)
patient_id: uuid (FK to patients)
amount: numeric
currency: text
payment_method: text
status: text
transaction_date: timestamp
notes: text

-- DUAL SYSTEM  
clinic_id: uuid (FK to clinics)
workspace_id: uuid (FK to individual_workspaces)

-- AUDIT
created_at: timestamp
updated_at: timestamp
```

### **🏗️ SYSTEM TABLES**

#### `consultation_templates` - **Plantillas de consulta**
```sql
id: uuid (PK)
name: text
description: text
template_type: text
fields_config: jsonb
is_default: boolean
is_active: boolean
created_by: uuid (FK to profiles)

-- DUAL SYSTEM
clinic_id: uuid (FK to clinics)
workspace_id: uuid (FK to individual_workspaces)

-- AUDIT
created_at: timestamp
updated_at: timestamp
```

---

## 🔐 **AUTHENTICATION & AUTHORIZATION FLOW**

### **Frontend Authentication**
```typescript
// Supabase Auth Integration
import { useAuth } from '@/hooks/useAuth';
import { useTenantContext } from '@/hooks/useTenantContext';

const { user } = useAuth();
const { getCurrentTenantId, getCurrentTenantType } = useTenantContext();
```

### **API Request Headers**
```typescript
// Required headers for API requests
headers: {
  'Authorization': `Bearer ${session.access_token}`,
  'X-Tenant-ID': getCurrentTenantId() || '',
  'X-Tenant-Type': getCurrentTenantType() || '',  // 'clinic' | 'workspace'
  'Content-Type': 'application/json'
}
```

### **Django Authentication Middleware**
```python
# Django backend validates Supabase JWT
class SupabaseProxyAuthentication:
    def authenticate(self, request):
        token = request.META.get('HTTP_AUTHORIZATION', '').replace('Bearer ', '')
        # Validates JWT with Supabase
        # Adds user_id, tenant context to request
```

---

## 🚀 **DEPLOYMENT ARCHITECTURE**

### **Production URLs**
- **Frontend**: `https://mindhub.cloud` (Vercel)
- **Django Backend**: `https://mindhub-django-backend.vercel.app` (Vercel)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth

### **Development Flow**
```bash
# Frontend Development
cd mindhub/frontend
npm run dev  # http://localhost:3000

# Django Backend Development  
cd mindhub/backend-django
python manage.py runserver 8001 --settings=clinimetrix_django.settings_vercel
# http://localhost:8001
```

---

## ⚡ **CRITICAL CONNECTION PATTERNS**

### **1. Frontend → Django Backend**
```typescript
// Pattern: Frontend API Route → Django Backend → Supabase DB
const response = await authFetch('/api/expedix/consultations', {
  method: 'POST',
  headers: {
    'X-Tenant-ID': getCurrentTenantId() || '',
    'X-Tenant-Type': getCurrentTenantType() || ''
  },
  body: JSON.stringify(consultationData)
});
```

### **2. Frontend → Direct Supabase**
```typescript
// Pattern: Frontend API Route → Direct Supabase → Return JSON
const { data, error } = await supabaseAdmin
  .from('patients')
  .select('*')
  .eq('clinic_id', tenantId);
```

### **3. Drag & Drop Flow**
```typescript
// Pattern: UI Event → API Update → Database → UI Refresh
handleAppointmentDrop → authFetch(PUT /api/expedix/agenda/appointments/[id]) 
→ Django backend → Supabase update → loadAppointments()
```

### **4. Consultation Creation from Agenda**
```typescript  
// Pattern: Appointment → Create Consultation → Redirect
handleStartConsultation → POST /api/expedix/consultations 
→ Django creates consultation → router.push('/hubs/expedix/consultations/[id]')
```

---

## 🎯 **IMPLEMENTATION RULES**

### **BEFORE ANY CHANGE:**
1. ✅ **Consultar este documento** para entender conexiones existentes
2. ✅ **Verificar estructura de tablas** en SUPABASE_TABLES_REFERENCE.md
3. ✅ **Revisar endpoints existentes** antes de crear nuevos
4. ✅ **Usar tenant context** en todas las APIs (`getCurrentTenantId()`, `getCurrentTenantType()`)
5. ✅ **Seguir patrones establecidos** (Django-first, Supabase fallback)

### **API CREATION PATTERN:**
```typescript
// 1. Check if Django backend supports this functionality
// 2. If yes: Use Django backend with Supabase fallback
// 3. If no: Direct Supabase with proper tenant filtering
// 4. Always include error handling and proper headers
```

### **DATABASE CHANGES:**
```sql
-- 1. Add fields to Supabase via SQL Editor
-- 2. Update SUPABASE_TABLES_REFERENCE.md
-- 3. Update Django views/serializers if needed
-- 4. Test complete flow: Frontend → Backend → Database
```

---

## 📝 **CHANGE LOG**

### v11.0 (2025-08-31) - Hybrid GraphQL + Django Architecture Complete
- ✅ **Sistema Híbrido Implementado**: GraphQL + Django specialized by operation type
- ✅ **Hybrid Services Creados**: 5 servicios híbridos implementados completamente
- ✅ **Resources Hybrid**: Django primary + GraphQL fallback para recursos médicos
- ✅ **Agenda Settings Hybrid**: Django primary + GraphQL fallback para configuración
- ✅ **FormX Hybrid**: Django ONLY para lógica compleja de tokens y formularios
- ✅ **ClinimetrixPro Hybrid**: Django ONLY para algoritmos psicométricos (29+ escalas)
- ✅ **Dashboard GraphQL**: GraphQL primary para estadísticas en tiempo real
- ✅ **Apollo Client Integration**: Cliente GraphQL integrado con error handling -999
- ✅ **Error Handling Mejorado**: Valores -999 para errores vs 0 para datos vacíos
- ✅ **TypeScript Compilation**: Todos los errores de compilación resueltos
- ✅ **Architecture Documentation**: Documentación completa actualizada para sistema híbrido

### Hybrid Strategy Implementation:
- ✅ **GraphQL PRIMARY**: Dashboard statistics, simple CRUD, real-time subscriptions
- ✅ **Django PRIMARY**: Complex business logic, file operations, workflow management  
- ✅ **Django ONLY**: Critical operations (FormX tokens, ClinimetrixPro scoring)
- ✅ **Fallback Mechanisms**: GraphQL backup when Django APIs unavailable
- ✅ **Single Authentication**: JWT token válido para ambos GraphQL y Django
- ✅ **Hybrid Services**: All modules now using specialized hybrid architecture

### v10.0 (2025-08-27) - Complete Architecture Documentation
- ✅ Documented all 62 frontend API endpoints
- ✅ Mapped complete Django backend REST API
- ✅ Listed all database tables with expanded consultations schema
- ✅ Added mental_exam and 33+ consultation fields
- ✅ Fixed drag & drop appointment system
- ✅ Resolved TypeScript compilation issues
- ✅ Implemented complete tenant context system

---

**🎯 REMEMBER**: This document is the source of truth. Update it whenever you modify endpoints, tables, or connections.