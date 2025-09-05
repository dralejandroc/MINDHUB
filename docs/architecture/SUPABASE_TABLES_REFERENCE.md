# SUPABASE TABLES REFERENCE - ESTRUCTURA REAL
**Actualizado: 26/08/2025**  
**Versión: v9.0-multitenant-system**  
**Fuente**: `/Users/alekscon/MINDHUB-Pro/SUPABASE_TABLES.txt` (VERIFICADO)

> ⚠️ **CRÍTICO**: Este documento contiene la estructura EXACTA de las tablas en Supabase. 
> SIEMPRE consultar esta referencia antes de crear modelos Django, endpoints o APIs.
> NUNCA asumir campos o relaciones - VERIFICAR SIEMPRE con este documento.

## 📋 ÍNDICE DE TABLAS

### 🩺 **CORE HEALTHCARE TABLES**
- [`patients`](#patients) - Tabla principal de pacientes
- [`appointments`](#appointments) - Sistema de citas médicas  
- [`consultations`](#consultations) - Consultas médicas
- [`prescriptions`](#prescriptions) - Recetas médicas

### 🏥 **ORGANIZATIONAL TABLES**
- [`clinics`](#clinics) - Clínicas y organizaciones
- [`individual_workspaces`](#individual_workspaces) - Espacios individuales
- [`tenant_memberships`](#tenant_memberships) - ✅ NUEVO: Membresías multitenant
- [`profiles`](#profiles) - Perfiles de usuario

### 📊 **CLINIMETRIX SYSTEM**
- [`clinimetrix_assessments`](#clinimetrix_assessments) - Evaluaciones psicométricas
- [`clinimetrix_remote_assessments`](#clinimetrix_remote_assessments) - Evaluaciones remotas
- [`clinimetrix_responses`](#clinimetrix_responses) - Respuestas de evaluaciones
- [`psychometric_scales`](#psychometric_scales) - Escalas psicométricas

### 💰 **FINANCE SYSTEM**
- [`finance_services`](#finance_services) - Servicios financieros
- [`finance_income`](#finance_income) - Ingresos
- [`finance_cash_register_cuts`](#finance_cash_register_cuts) - Cortes de caja

### 🏗️ **SYSTEM TABLES**
- [`consultation_templates`](#consultation_templates) - Plantillas de consulta
- [`practice_locations`](#practice_locations) - Ubicaciones de práctica
- [`schedule_config`](#schedule_config) - Configuración de horarios

---

## 🩺 CORE HEALTHCARE TABLES

### `patients`
**Tabla principal de pacientes - ESTRUCTURA COMPLETA**

```sql
id: uuid (PK)
medical_record_number: text
first_name: text (NOT NULL)
last_name: text
paternal_last_name: text
maternal_last_name: text
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
blood_type: text
allergies: text[] (ARRAY)
chronic_conditions: text[] (ARRAY)
current_medications: text[] (ARRAY)
emergency_contact_name: text
emergency_contact_phone: text
emergency_contact_relationship: text
consent_to_treatment: boolean
consent_to_data_processing: boolean
patient_category: text
is_active: boolean
created_by: uuid (FK to users/profiles)
clinic_id: uuid (FK to clinics)
created_at: timestamp with time zone
updated_at: timestamp with time zone
emergency_contact: varchar (DUPLICADO?)
emergency_phone: varchar (DUPLICADO?)
marital_status: varchar
occupation: varchar
insurance_provider: varchar
insurance_number: varchar
assigned_professional_id: uuid (FK)
notes: text
tags: text[] (ARRAY)
workspace_id: uuid (FK to individual_workspaces)
```

**🎯 DUAL SYSTEM**: Un paciente pertenece a `clinic_id` OR `workspace_id` (nunca ambos)

### `appointments`
**Sistema de citas médicas - ESTRUCTURA REAL**

```sql
id: uuid (PK)
created_at: timestamp with time zone
updated_at: timestamp with time zone
patient_id: uuid (FK to patients) NOT NULL
professional_id: uuid (FK) NOT NULL  -- ⚠️ NO es provider_id!
appointment_date: date  -- ⚠️ NO es datetime!
start_time: time without time zone  -- ⚠️ SEPARADO!
end_time: time without time zone    -- ⚠️ SEPARADO!
appointment_type: varchar
status: varchar
confirmation_sent: boolean
confirmation_date: timestamp with time zone
reason: text
notes: text
internal_notes: text
is_recurring: boolean
recurring_pattern: jsonb
reminder_sent: boolean
reminder_date: timestamp with time zone
clinic_id: uuid (FK to clinics)
workspace_id: uuid (FK to individual_workspaces)
```

**🚨 CAMPOS QUE NO EXISTEN**:
- ❌ `provider_id` (es `professional_id`)
- ❌ `appointment_time` (está separado en `start_time`/`end_time`)
- ❌ `duration` (se calcula desde tiempos)
- ❌ `branch`, `resource`, `professional`, `balance`, `is_paid`
- ❌ `cancelled_at`, `confirmed_by_id`, `scheduled_by_id`

### `consultations`
**Consultas médicas realizadas**

```sql
id: uuid (PK)
patient_id: uuid (FK to patients)
professional_id: uuid (FK)
consultation_date: timestamp with time zone
consultation_type: text
chief_complaint: text
history_present_illness: text
physical_examination: text
assessment: text
plan: text
notes: text
diagnosis_codes: text[] (ARRAY)
follow_up_date: date
status: text
created_at: timestamp with time zone
updated_at: timestamp with time zone
duration_minutes: integer
present_illness: text
physical_exam: text
treatment_plan: text
diagnosis: text
prescriptions: jsonb
vital_signs: jsonb
clinic_id: uuid
workspace_id: uuid
```

### `prescriptions`
**Recetas médicas**

```sql
id: uuid (PK)
patient_id: uuid (FK to patients)
professional_id: uuid (FK)
consultation_id: uuid (FK to consultations)
prescription_date: timestamp with time zone
medications: jsonb
instructions: text
status: text
valid_until: date
created_at: timestamp with time zone
updated_at: timestamp with time zone
clinic_id: uuid
workspace_id: uuid
```

---

## 🏥 ORGANIZATIONAL TABLES

### `clinics`
**Clínicas y organizaciones**

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
created_at: timestamp with time zone
updated_at: timestamp with time zone
owner_id: uuid
```

### `individual_workspaces` 
**Espacios de trabajo individuales**

```sql
id: uuid (PK)
owner_id: uuid (FK)
workspace_name: varchar
business_name: varchar
tax_id: varchar
settings: jsonb
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

### `tenant_memberships` ✅ NUEVO
**Membresías multitenant - Sistema de clínicas multi-profesionales**

```sql
id: uuid (PK)
user_id: uuid (FK to auth.users) NOT NULL
clinic_id: uuid (FK to clinics) NOT NULL
role: varchar (member|admin|owner) DEFAULT 'member'
permissions: jsonb DEFAULT '{}'
is_active: boolean DEFAULT TRUE
invited_by: uuid (FK to auth.users)
joined_at: timestamp with time zone DEFAULT NOW()
created_at: timestamp with time zone DEFAULT NOW()
updated_at: timestamp with time zone DEFAULT NOW()

-- UNIQUE constraint: Un usuario no puede estar duplicado en la misma clínica
UNIQUE(user_id, clinic_id)
```

**🔑 ROLES DISPONIBLES:**
- `member`: Acceso básico a datos compartidos de la clínica
- `admin`: Puede invitar usuarios y gestionar membresías
- `owner`: Control completo de la clínica

**🔐 PERMISSIONS JSONB:**
```json
{
  "can_invite_users": true,
  "can_manage_patients": true,
  "can_view_finance": false,
  "can_manage_schedules": true
}
```

### `profiles`
**Perfiles de usuario (Supabase Auth)**

```sql
id: uuid (PK) -- Mismo ID que auth.users
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

---

## 📊 CLINIMETRIX SYSTEM

### `clinimetrix_assessments`
**Evaluaciones psicométricas aplicadas**

```sql
id: uuid (PK)
template_id: text (Scale code like "PHQ-9")
patient_id: uuid (FK to patients)
administrator_id: uuid (FK)
consultation_id: uuid (FK to consultations)
mode: text ("self" | "assisted")
status: text ("pending" | "completed" | "cancelled")
responses: jsonb
scores: jsonb
interpretations: jsonb
started_at: timestamp
completed_at: timestamp
created_at: timestamp
updated_at: timestamp
clinic_id: uuid
workspace_id: uuid
```

### `clinimetrix_remote_assessments`
**Evaluaciones remotas (para pacientes)**

```sql
id: uuid (PK)
assessment_id: uuid (FK to clinimetrix_assessments)
patient_id: uuid (FK to patients)
access_token: text
expires_at: timestamp
status: text
created_at: timestamp
updated_at: timestamp
```

### `clinimetrix_responses`
**Respuestas individuales de evaluaciones**

```sql
id: uuid (PK)
assessment_id: uuid (FK to clinimetrix_assessments)
question_id: text
response_value: numeric
response_text: text
created_at: timestamp
```

### `psychometric_scales`
**Escalas psicométricas disponibles**

```sql
id: uuid (PK)
scale_code: text UNIQUE (e.g., "PHQ-9")
name: text
description: text
category: text
version: text
language: text
items_count: integer
scoring_method: jsonb
interpretation_rules: jsonb
is_active: boolean
created_at: timestamp
updated_at: timestamp
```

---

## 💰 FINANCE SYSTEM

### `finance_services`
**Servicios financieros ofrecidos**

```sql
id: uuid (PK)
name: text
description: text
price: numeric
currency: text
category: text
is_active: boolean
clinic_id: uuid
workspace_id: uuid
created_at: timestamp
updated_at: timestamp
```

### `finance_income`
**Registro de ingresos**

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
clinic_id: uuid
workspace_id: uuid
created_at: timestamp
updated_at: timestamp
```

### `finance_cash_register_cuts`
**Cortes de caja**

```sql
id: uuid (PK)
cut_date: date
opening_balance: numeric
closing_balance: numeric
total_income: numeric
total_expenses: numeric
notes: text
performed_by: uuid (FK)
clinic_id: uuid
workspace_id: uuid
created_at: timestamp
```

---

## 🏗️ SYSTEM TABLES

### `consultation_templates`
**Plantillas de consulta médica**

```sql
id: uuid (PK)
name: text
description: text
template_type: text
fields_config: jsonb
is_default: boolean
is_active: boolean
clinic_id: uuid
workspace_id: uuid
created_by: uuid (FK)
created_at: timestamp
updated_at: timestamp
```

### `practice_locations`
**Ubicaciones de práctica médica**

```sql
id: uuid (PK)
name: text
address: text
city: text
state: text
postal_code: text
phone: text
clinic_id: uuid
workspace_id: uuid
is_active: boolean
created_at: timestamp
updated_at: timestamp
```

### `schedule_config`
**Configuración de horarios**

```sql
id: uuid (PK)
professional_id: uuid (FK)
weekday: integer (0-6)
start_time: time
end_time: time
break_start: time
break_end: time
location_id: uuid (FK to practice_locations)
is_active: boolean
clinic_id: uuid
workspace_id: uuid
created_at: timestamp
updated_at: timestamp
```

---

## 🚨 REGLAS CRÍTICAS PARA DESARROLLO

### 1. **DUAL SYSTEM PATTERN**
Todas las tablas principales siguen el patrón:
```sql
clinic_id: uuid (Para clínicas)
workspace_id: uuid (Para individuales)
-- XOR constraint: NUNCA ambos al mismo tiempo
```

### 2. **FOREIGN KEYS REALES**
- ✅ `patient_id` → `patients.id`
- ✅ `professional_id` → `profiles.id` (NO provider_id!)
- ✅ `clinic_id` → `clinics.id`
- ✅ `workspace_id` → `individual_workspaces.id`
- ✅ `consultation_id` → `consultations.id`

### 3. **CAMPOS QUE NO EXISTEN - NO INVENTAR**
- ❌ `provider_id` (es `professional_id`)
- ❌ `appointment_time` (está en `start_time`/`end_time`)
- ❌ `duration` (se calcula)
- ❌ Muchos campos "custom" que no están en DB real

### 4. **ARRAY FIELDS**
Usar `text[]` para:
- `allergies`
- `chronic_conditions` 
- `current_medications`
- `tags`
- `diagnosis_codes`

### 5. **JSONB FIELDS**
Usar `jsonb` para:
- `settings`
- `responses`
- `scores` 
- `interpretations`
- `recurring_pattern`
- `medications`
- `vital_signs`

---

## 💡 NOTAS DE DESARROLLO

1. **SIEMPRE verificar este documento antes de crear modelos Django**
2. **NUNCA asumir que existe un campo - consultar aquí primero**
3. **Usar `managed = False` en modelos Django para tablas existentes**
4. **Respetar el sistema dual clinic_id/workspace_id**
5. **Usar UUIDs directos en lugar de ForeignKeys cuando sea necesario**

---

**📅 Última actualización**: 2025-08-25  
**🔄 Próxima revisión**: Cuando se agreguen nuevas tablas a Supabase