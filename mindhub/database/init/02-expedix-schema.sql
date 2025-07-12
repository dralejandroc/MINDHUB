-- =============================================================================
-- EXPEDIX SCHEMA - Patient Management System
-- Compliant with NOM-024-SSA3-2010 for Healthcare Data Protection
-- =============================================================================

-- Set schema
SET search_path TO expedix, auth, audit, public;

-- =============================================================================
-- PATIENT MANAGEMENT
-- =============================================================================

-- Patient demographics and basic information
CREATE TABLE expedix.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic demographics
    medical_record_number VARCHAR(20) UNIQUE NOT NULL, -- Número de expediente
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    second_last_name VARCHAR(100), -- Mexican naming convention
    
    -- Identity information (encrypted)
    curp VARCHAR(18) UNIQUE, -- Clave Única de Registro de Población (Mexico)
    rfc VARCHAR(13), -- Registro Federal de Contribuyentes
    national_id TEXT, -- Encrypted storage for sensitive ID numbers
    passport_number TEXT, -- Encrypted
    
    -- Demographics
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    biological_sex VARCHAR(20),
    marital_status VARCHAR(30),
    
    -- Contact information (encrypted)
    phone_primary TEXT, -- Encrypted
    phone_secondary TEXT, -- Encrypted
    email TEXT, -- Encrypted
    
    -- Address information (encrypted)
    address_street TEXT, -- Encrypted
    address_number VARCHAR(20),
    address_interior VARCHAR(20),
    address_colony VARCHAR(100),
    address_municipality VARCHAR(100),
    address_state VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(3) DEFAULT 'MEX',
    
    -- Emergency contact (encrypted)
    emergency_contact_name TEXT, -- Encrypted
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone TEXT, -- Encrypted
    
    -- Healthcare information
    primary_language VARCHAR(50) DEFAULT 'es',
    religion VARCHAR(50),
    education_level VARCHAR(50),
    occupation VARCHAR(100),
    
    -- Insurance and payment
    insurance_provider VARCHAR(100),
    insurance_number TEXT, -- Encrypted
    payment_method VARCHAR(50) DEFAULT 'cash',
    
    -- Clinical categorization (for visual organization)
    patient_category VARCHAR(50) DEFAULT 'general', -- 'priority', 'chronic', 'acute', etc.
    category_color VARCHAR(7) DEFAULT '#6b7280', -- Hex color for visual categorization
    tags TEXT[], -- Array of tags for flexible categorization
    
    -- Status and flags
    is_active BOOLEAN DEFAULT TRUE,
    is_minor BOOLEAN GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(date_of_birth)) < 18) STORED,
    requires_interpreter BOOLEAN DEFAULT FALSE,
    has_disabilities BOOLEAN DEFAULT FALSE,
    
    -- Privacy and consent (NOM-024 compliance)
    consent_to_treatment BOOLEAN DEFAULT FALSE,
    consent_to_data_processing BOOLEAN DEFAULT FALSE,
    consent_to_research BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMPTZ,
    data_retention_expiry DATE,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'non_binary', 'other', 'prefer_not_to_say')),
    CONSTRAINT valid_biological_sex CHECK (biological_sex IN ('male', 'female', 'intersex', 'unknown')),
    CONSTRAINT valid_marital_status CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'separated', 'domestic_partnership', 'other')),
    CONSTRAINT valid_age CHECK (date_of_birth <= CURRENT_DATE AND date_of_birth >= '1900-01-01'),
    CONSTRAINT valid_country CHECK (address_country IN ('MEX', 'USA', 'CAN', 'GTM', 'BLZ', 'CRI', 'SLV', 'HND', 'NIC', 'PAN')),
    CONSTRAINT valid_category CHECK (patient_category IN ('general', 'priority', 'chronic', 'acute', 'pediatric', 'geriatric', 'vip')),
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'card', 'insurance', 'government', 'corporate', 'scholarship'))
);

-- Patient medical history
CREATE TABLE expedix.medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES expedix.patients(id) ON DELETE CASCADE NOT NULL,
    
    -- Medical background
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    past_medical_history TEXT,
    past_surgical_history TEXT,
    medications_current TEXT,
    allergies TEXT,
    family_history TEXT,
    social_history TEXT,
    
    -- Mental health specific
    psychiatric_history TEXT,
    previous_hospitalizations TEXT,
    substance_use_history TEXT,
    suicide_risk_assessment TEXT,
    
    -- Review of systems
    review_of_systems JSONB, -- Structured data for different body systems
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- =============================================================================
-- CONSULTATIONS AND APPOINTMENTS
-- =============================================================================

-- Medical consultations
CREATE TABLE expedix.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES expedix.patients(id) ON DELETE CASCADE NOT NULL,
    
    -- Consultation details
    consultation_date TIMESTAMPTZ NOT NULL,
    consultation_type VARCHAR(50) NOT NULL, -- 'initial', 'follow_up', 'emergency', 'phone', 'video'
    duration_minutes INTEGER,
    
    -- Clinical notes
    subjective_notes TEXT, -- Patient's reported symptoms/concerns
    objective_notes TEXT, -- Observable findings
    assessment TEXT, -- Clinical assessment/diagnosis
    plan TEXT, -- Treatment plan
    
    -- Vital signs
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    temperature DECIMAL(4,1),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    bmi DECIMAL(4,1) GENERATED ALWAYS AS (
        CASE 
            WHEN height_cm > 0 THEN ROUND((weight_kg / POWER(height_cm/100, 2))::NUMERIC, 1)
            ELSE NULL 
        END
    ) STORED,
    
    -- Mental status exam
    mental_status_exam JSONB,
    
    -- Diagnosis codes (ICD-10/DSM-5)
    primary_diagnosis_code VARCHAR(20),
    primary_diagnosis_description TEXT,
    secondary_diagnoses JSONB, -- Array of {code, description} objects
    
    -- Treatment outcomes
    treatment_response VARCHAR(50), -- 'improved', 'stable', 'deteriorated', 'no_change'
    side_effects TEXT,
    
    -- Follow-up
    next_appointment_recommended BOOLEAN DEFAULT FALSE,
    follow_up_timeframe VARCHAR(50), -- 'days', 'weeks', 'months'
    follow_up_interval INTEGER,
    
    -- Consultation status
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_consultation_type CHECK (consultation_type IN ('initial', 'follow_up', 'emergency', 'phone', 'video', 'group')),
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    CONSTRAINT valid_treatment_response CHECK (treatment_response IN ('improved', 'stable', 'deteriorated', 'no_change', 'partial_response'))
);

-- =============================================================================
-- PRESCRIPTIONS MANAGEMENT
-- =============================================================================

-- Medication catalog
CREATE TABLE expedix.medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Medication identification
    generic_name VARCHAR(255) NOT NULL,
    brand_names TEXT[], -- Array of brand names
    active_ingredient VARCHAR(255),
    
    -- Classification
    therapeutic_class VARCHAR(100),
    pharmacological_class VARCHAR(100),
    controlled_substance_category VARCHAR(10), -- Mexican classification
    
    -- Dosage information
    available_strengths TEXT[], -- Array of available strengths
    available_forms TEXT[], -- tablet, capsule, liquid, injection, etc.
    
    -- Prescribing information
    typical_dosage_range VARCHAR(100),
    max_daily_dose VARCHAR(50),
    contraindications TEXT,
    warnings TEXT,
    interactions TEXT,
    
    -- Administrative
    requires_special_authorization BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Prescriptions
CREATE TABLE expedix.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES expedix.patients(id) ON DELETE CASCADE NOT NULL,
    consultation_id UUID REFERENCES expedix.consultations(id),
    medication_id UUID REFERENCES expedix.medications(id) NOT NULL,
    
    -- Prescription details
    prescription_number VARCHAR(50) UNIQUE NOT NULL, -- Sequential number for tracking
    
    -- Medication details
    medication_name VARCHAR(255) NOT NULL, -- Snapshot at time of prescription
    strength VARCHAR(50) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL,
    
    -- Dosing instructions
    dose VARCHAR(100) NOT NULL, -- "1 tablet", "5ml", etc.
    frequency VARCHAR(100) NOT NULL, -- "twice daily", "every 6 hours", etc.
    route VARCHAR(50) NOT NULL, -- "oral", "topical", "injection", etc.
    duration VARCHAR(100), -- "7 days", "until symptoms resolve", etc.
    
    -- Quantity and refills
    quantity_prescribed INTEGER,
    quantity_unit VARCHAR(20), -- "tablets", "ml", "doses"
    refills_authorized INTEGER DEFAULT 0,
    refills_remaining INTEGER,
    
    -- Instructions
    special_instructions TEXT,
    patient_instructions TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'discontinued', 'cancelled'
    date_prescribed TIMESTAMPTZ DEFAULT NOW(),
    date_started TIMESTAMPTZ,
    date_ended TIMESTAMPTZ,
    
    -- Digital signature and security (NOM-024)
    prescriber_signature_hash TEXT, -- Hash of digital signature
    qr_code_data TEXT, -- QR code for verification
    verification_code VARCHAR(20), -- Short code for verification
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'discontinued', 'cancelled')),
    CONSTRAINT valid_route CHECK (route IN ('oral', 'topical', 'injection', 'inhalation', 'sublingual', 'rectal', 'transdermal')),
    CONSTRAINT positive_quantity CHECK (quantity_prescribed > 0),
    CONSTRAINT valid_refills CHECK (refills_authorized >= 0 AND refills_remaining >= 0)
);

-- Prescription fills/dispensing log
CREATE TABLE expedix.prescription_fills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES expedix.prescriptions(id) ON DELETE CASCADE NOT NULL,
    
    -- Fill details
    fill_date TIMESTAMPTZ DEFAULT NOW(),
    quantity_dispensed INTEGER NOT NULL,
    pharmacy_name VARCHAR(255),
    pharmacist_name VARCHAR(255),
    
    -- Verification
    verification_code_used VARCHAR(20),
    qr_code_verified BOOLEAN DEFAULT FALSE,
    
    -- Remaining quantities
    refills_used INTEGER DEFAULT 1,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT positive_quantity_dispensed CHECK (quantity_dispensed > 0)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Patient indexes
CREATE INDEX idx_patients_medical_record_number ON expedix.patients(medical_record_number);
CREATE INDEX idx_patients_last_name ON expedix.patients(last_name);
CREATE INDEX idx_patients_date_of_birth ON expedix.patients(date_of_birth);
CREATE INDEX idx_patients_created_by ON expedix.patients(created_by);
CREATE INDEX idx_patients_category ON expedix.patients(patient_category);
CREATE INDEX idx_patients_active ON expedix.patients(is_active);

-- Consultation indexes
CREATE INDEX idx_consultations_patient_id ON expedix.consultations(patient_id);
CREATE INDEX idx_consultations_date ON expedix.consultations(consultation_date);
CREATE INDEX idx_consultations_type ON expedix.consultations(consultation_type);
CREATE INDEX idx_consultations_status ON expedix.consultations(status);
CREATE INDEX idx_consultations_created_by ON expedix.consultations(created_by);

-- Prescription indexes
CREATE INDEX idx_prescriptions_patient_id ON expedix.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_number ON expedix.prescriptions(prescription_number);
CREATE INDEX idx_prescriptions_status ON expedix.prescriptions(status);
CREATE INDEX idx_prescriptions_date ON expedix.prescriptions(date_prescribed);
CREATE INDEX idx_prescriptions_medication ON expedix.prescriptions(medication_id);

-- Full-text search indexes
CREATE INDEX idx_patients_fulltext ON expedix.patients USING gin(
    to_tsvector('spanish', 
        coalesce(first_name, '') || ' ' || 
        coalesce(middle_name, '') || ' ' || 
        coalesce(last_name, '') || ' ' || 
        coalesce(second_last_name, '') || ' ' ||
        coalesce(medical_record_number, '')
    )
);

-- =============================================================================
-- AUDIT TRIGGERS (NOM-024 Compliance)
-- =============================================================================

-- Add audit triggers to all main tables
CREATE TRIGGER audit_patients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expedix.patients
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

CREATE TRIGGER audit_medical_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expedix.medical_history
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

CREATE TRIGGER audit_consultations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expedix.consultations
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

CREATE TRIGGER audit_prescriptions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expedix.prescriptions
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON expedix.patients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_history_updated_at 
    BEFORE UPDATE ON expedix.medical_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at 
    BEFORE UPDATE ON expedix.consultations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at 
    BEFORE UPDATE ON expedix.prescriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Expedix schema initialized successfully';
    RAISE NOTICE 'Tables created: patients, medical_history, consultations, medications, prescriptions, prescription_fills';
    RAISE NOTICE 'Audit triggers enabled for NOM-024 compliance';
END $$;