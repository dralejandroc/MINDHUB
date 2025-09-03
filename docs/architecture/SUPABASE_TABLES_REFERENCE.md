# MindHub - Supabase Database Tables Reference

**CRITICAL**: This document contains the REAL table structures from the production Supabase database. All Django models, API endpoints, and frontend clients MUST match these structures exactly.

## 📋 Table of Contents

1. [ClinimetrixPro Tables](#clinimetrixpro-tables)
2. [Expedix Tables](#expedix-tables) 
3. [Agenda Tables](#agenda-tables)
4. [Core Auth Tables](#core-auth-tables)
5. [Usage Guidelines](#usage-guidelines)

---

## 🧠 ClinimetrixPro Tables

### `clinimetrix_assessments`
```sql
-- Primary assessment records in ClinimetrixPro system
CREATE TABLE clinimetrix_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id TEXT NOT NULL,                    -- Scale code like "PHQ-9", NOT FK!
    patient_id UUID NOT NULL,                     -- Direct UUID to patients table
    administrator_id UUID NOT NULL,               -- Direct UUID to profiles table
    consultation_id UUID,                         -- Optional link to consultations
    mode TEXT,                                    -- "self" | "assisted"
    status TEXT,                                  -- "pending" | "completed" | "cancelled"
    responses JSONB,                              -- Raw response data
    scores JSONB,                                 -- Calculated scores
    interpretations JSONB,                        -- Clinical interpretations
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- 🎯 DUAL SYSTEM: Exactly one must be set
    clinic_id UUID,                               -- For clinic-based system
    workspace_id UUID                             -- For workspace-based system
);
```

### `clinimetrix_responses` 
```sql
-- Individual question responses within assessments
CREATE TABLE clinimetrix_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL,                 -- Direct UUID to clinimetrix_assessments
    question_id TEXT NOT NULL,                   -- Question identifier within scale
    response_value REAL,                         -- Numeric response value
    response_text TEXT,                          -- Text response (if applicable)
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `clinimetrix_remote_assessments`
```sql
-- Remote assessment links for patients
CREATE TABLE clinimetrix_remote_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL,                 -- Direct UUID to clinimetrix_assessments
    patient_id UUID NOT NULL,                    -- Direct UUID to patients table
    access_token TEXT NOT NULL,                  -- Unique access token for patient
    expires_at TIMESTAMPTZ NOT NULL,             -- When the link expires
    status TEXT NOT NULL,                        -- Status of remote assessment
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `psychometric_scales`
```sql
-- Catalog of available psychometric scales
CREATE TABLE psychometric_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID,                              -- Optional clinic association
    scale_name VARCHAR(255) NOT NULL,            -- Full scale name (NOT name!)
    abbreviation VARCHAR(255) NOT NULL,          -- Scale code like "PHQ-9" (NOT scale_code!)
    version VARCHAR(255),                        -- Scale version
    category VARCHAR(255),                       -- Category like "Depression"
    description TEXT,                            -- Scale description
    total_items INTEGER,                         -- Number of questions
    estimated_duration_minutes INTEGER,          -- Estimated completion time
    interpretation_notes TEXT,                   -- Clinical interpretation notes
    is_active BOOLEAN                            -- Whether scale is available
);
```

---

## 👥 Expedix Tables

### `patients`
```sql
-- Main patient records
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    paternal_last_name VARCHAR(100),
    maternal_last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- 🎯 DUAL SYSTEM: Exactly one must be set
    clinic_id UUID,                              -- For clinic-based system
    workspace_id UUID                            -- For workspace-based system
);
```

### `consultations`
```sql
-- Medical consultation records
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,                   -- Direct UUID to patients table
    professional_id UUID NOT NULL,              -- Direct UUID to profiles table
    consultation_date DATE NOT NULL,
    consultation_time TIME NOT NULL,
    chief_complaint TEXT,
    history_present_illness TEXT,
    physical_examination TEXT,
    assessment_plan TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- 🎯 DUAL SYSTEM: Exactly one must be set
    clinic_id UUID,                              -- For clinic-based system
    workspace_id UUID                            -- For workspace-based system
);
```

---

## 📅 Agenda Tables

### `appointments`
```sql
-- Appointment scheduling
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,                   -- Direct UUID to patients table
    professional_id UUID NOT NULL,              -- Direct UUID to profiles (NOT provider_id!)
    appointment_date DATE NOT NULL,              -- DATE field (NOT DATETIME!)
    start_time TIME NOT NULL,                    -- Separate TIME field
    end_time TIME NOT NULL,                      -- Separate TIME field
    appointment_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- 🎯 DUAL SYSTEM: Exactly one must be set
    clinic_id UUID,                              -- For clinic-based system
    workspace_id UUID                            -- For workspace-based system
);
```

---

## 🔐 Core Auth Tables

### `profiles`
```sql
-- User profile information (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50),                            -- "professional" | "admin" | "patient"
    specialization VARCHAR(100),
    license_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ⚡ Usage Guidelines

### Django Model Requirements

1. **Use `managed = False`** for all Supabase tables:
```python
class Meta:
    db_table = 'table_name'
    managed = False  # Don't let Django manage the table
```

2. **Use direct UUID fields instead of ForeignKeys**:
```python
# ✅ CORRECT
patient_id = models.UUIDField()

# ❌ WRONG (doesn't work with managed=False)
patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
```

3. **Use exact field names from Supabase**:
```python
# ✅ CORRECT
scale_name = models.CharField(max_length=255)        # Real field name
abbreviation = models.CharField(max_length=255)      # Real field name

# ❌ WRONG
name = models.CharField(max_length=255)              # Doesn't exist
scale_code = models.CharField(max_length=255)        # Doesn't exist
```

### API Development Rules

1. **Always validate UUIDs before database operations**
2. **Use direct UUID lookups instead of joins**
3. **Respect the dual system (clinic_id vs workspace_id)**
4. **Handle authentication at the Django middleware level**

### Frontend Integration

1. **Use the corrected field names in API responses**
2. **Pass real patient IDs from the patients table**
3. **Handle authentication tokens properly**

---

## 🚨 Critical Notes

- **NEVER assume field names** - always reference this document
- **NEVER use Django ForeignKeys** with managed=False tables
- **ALWAYS use exact UUID field names** as documented here
- **ALWAYS validate the dual system** (clinic_id/workspace_id)
- **This document is the SINGLE SOURCE OF TRUTH** for database structure

---

*Last Updated: August 25, 2025*
*Based on: Production Supabase Database Structure*