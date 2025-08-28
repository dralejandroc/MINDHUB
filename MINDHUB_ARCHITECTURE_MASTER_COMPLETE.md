# 🏗️ MINDHUB ARCHITECTURE MASTER - COMPLETE REFERENCE
**Última actualización**: 2025-08-27  
**Versión**: v10.0-production-ready  
**Estado**: ✅ COMPLETAMENTE FUNCIONAL

> ⚡ **REFERENCIA CRÍTICA**: Este documento es la fuente de verdad para TODA la arquitectura de MindHub.  
> SIEMPRE consultar antes de hacer cambios. Actualizar cuando se modifique cualquier endpoint, tabla o conexión.

---

## 📊 **ARQUITECTURA ACTUAL - DJANGO + REACT HÍBRIDO**

```
┌─ Frontend React/Next.js ──────── Vercel (https://mindhub.cloud)
│  ├─ API Proxy Routes ─────────── Next.js (/api/*/django/) 
│  ├─ Direct Supabase APIs ────── Next.js (/api/*)
│  └─ Client Components ────────── React + TypeScript
│
├─ Django Backend ─────────────── Django REST API 
│  ├─ Expedix Module ─────────── Patient Management + Consultations
│  ├─ Authentication ──────────── Supabase JWT validation
│  └─ Views & Serializers ────── Complete consultation system
│
├─ Database ───────────────────── Supabase PostgreSQL
│  ├─ Core Tables ──────────────── patients, appointments, consultations
│  ├─ System Tables ───────────── tenant_memberships, profiles
│  └─ Extended Fields ─────────── mental_exam, template_config
│
└─ Authentication ─────────────── Supabase Auth + JWT validation
   ├─ Frontend Auth ───────────── @supabase/auth-helpers-nextjs
   └─ Backend Middleware ──────── Django Supabase JWT validation
```

---

## 🛣️ **API ENDPOINTS MATRIX - COMPLETE MAPPING**

### **1. FRONTEND API ROUTES (Next.js - 62 endpoints)**

#### 🩺 **EXPEDIX MODULE (Patient Management)**
```bash
# DIRECT SUPABASE ROUTES (Legacy)
GET    /api/expedix/patients                     # List patients with search/filter
POST   /api/expedix/patients                     # Create new patient
GET    /api/expedix/patients/[id]                # Get patient details
PUT    /api/expedix/patients/[id]                # Update patient
GET    /api/expedix/patients/[id]/administrative # Patient admin data
GET    /api/expedix/patients/[id]/assessments    # Patient assessments
GET    /api/expedix/patients/[id]/tags           # Patient tags
GET    /api/expedix/patients-simple              # Simplified patient list

# CONSULTATION SYSTEM (Fixed - Django Integration)
GET    /api/expedix/consultations                # ✅ List consultations - Django backend
POST   /api/expedix/consultations                # ✅ Create consultation - Django backend
GET    /api/expedix/consultations-simple         # Simplified consultation list
GET    /api/expedix/dynamic-consultations        # Dynamic consultation templates
GET    /api/expedix/consultation-templates       # Consultation templates

# PRESCRIPTIONS
GET    /api/expedix/prescriptions                # List prescriptions
POST   /api/expedix/prescriptions                # Create prescription
GET    /api/expedix/prescriptions/[id]           # Get prescription details

# APPOINTMENTS (Agenda System)
GET    /api/expedix/appointments                 # List appointments
GET    /api/expedix/agenda/appointments          # ✅ Full appointment management
POST   /api/expedix/agenda/appointments          # ✅ Create appointment
GET    /api/expedix/agenda/appointments/[id]     # ✅ Get appointment
PUT    /api/expedix/agenda/appointments/[id]     # ✅ Update appointment (drag & drop)
PUT    /api/expedix/agenda/appointments/[id]/status # ✅ Update appointment status
GET    /api/expedix/agenda/daily-stats           # Daily statistics
GET    /api/expedix/agenda/waiting-list          # Waiting list management

# CONFIGURATION
GET    /api/expedix/clinic-configuration         # Clinic configuration
GET    /api/expedix/clinic-configuration/default # Default configuration
GET    /api/expedix/schedule-config              # Schedule configuration
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

### v10.0 (2025-08-27) - Complete Architecture Documentation
- ✅ Documented all 62 frontend API endpoints
- ✅ Mapped complete Django backend REST API
- ✅ Listed all database tables with expanded consultations schema
- ✅ Added mental_exam and 33+ consultation fields
- ✅ Fixed drag & drop appointment system
- ✅ Resolved TypeScript compilation issues
- ✅ Implemented complete tenant context system

### Key Functionality Status:
- ✅ **Consultation System**: Complete with mental exam support
- ✅ **Appointment Management**: Full CRUD + drag & drop
- ✅ **Django Backend**: Production-ready with Supabase integration
- ✅ **Authentication**: Supabase Auth + Django middleware
- ✅ **Tenant System**: Multi-clinic and workspace support
- ✅ **TypeScript**: All compilation errors resolved

---

**🎯 REMEMBER**: This document is the source of truth. Update it whenever you modify endpoints, tables, or connections.