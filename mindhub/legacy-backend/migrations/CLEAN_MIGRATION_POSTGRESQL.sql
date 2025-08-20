-- =====================================================================
-- MINDHUB CLEAN MIGRATION TO POSTGRESQL
-- ELIMINA TODO EL SISTEMA LEGACY Y CREA ESQUEMA ÚNICO CONSISTENTE
-- =====================================================================

-- =====================================================================
-- 1. ELIMINAR TODAS LAS TABLAS LEGACY DE ESCALAS CLÍNICAS
-- =====================================================================

-- Deshabilitar restricciones de claves foráneas temporalmente
SET foreign_key_checks = 0;

-- Eliminar sistema legacy de escalas (COMPLETO)
DROP TABLE IF EXISTS user_favorite_scales;
DROP TABLE IF EXISTS scale_subscale_scores;
DROP TABLE IF EXISTS scale_subscales;
DROP TABLE IF EXISTS scale_response_options;
DROP TABLE IF EXISTS scale_response_groups;
DROP TABLE IF EXISTS scale_item_specific_options;
DROP TABLE IF EXISTS scale_items;
DROP TABLE IF EXISTS scale_interpretation_rules;
DROP TABLE IF EXISTS scale_documentation;
DROP TABLE IF EXISTS scale_administrations;
DROP TABLE IF EXISTS item_responses;
DROP TABLE IF EXISTS scales;

-- =====================================================================
-- 2. ELIMINAR TABLAS DUPLICADAS DE FORMULARIOS
-- =====================================================================

-- Eliminar tablas de formularios duplicadas/confusas
DROP TABLE IF EXISTS form_submissions;
DROP TABLE IF EXISTS form_instances;
DROP TABLE IF EXISTS form_assignments;
DROP TABLE IF EXISTS form_analytics;
DROP TABLE IF EXISTS form_categories;
DROP TABLE IF EXISTS forms; -- Tabla confusa/duplicada

-- =====================================================================
-- 3. ESQUEMA POSTGRESQL ÚNICO - EXPEDIX (PACIENTES)
-- =====================================================================

-- Tabla principal de pacientes (ÚNICA)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100),
    paternalLastName VARCHAR(100),
    maternalLastName VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    dateOfBirth DATE,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zipCode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'México',
    emergencyContactName VARCHAR(200),
    emergencyContactPhone VARCHAR(20),
    emergencyContactRelationship VARCHAR(100),
    insuranceProvider VARCHAR(200),
    insuranceNumber VARCHAR(100),
    allergies TEXT,
    currentMedications TEXT,
    chronicConditions TEXT,
    notes TEXT,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdBy UUID REFERENCES users(id)
);

-- Historial médico
CREATE TABLE IF NOT EXISTS medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    condition VARCHAR(200) NOT NULL,
    diagnosisDate DATE,
    severity VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    diagnosedBy VARCHAR(200),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultas médicas
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultationDate TIMESTAMP NOT NULL,
    consultationType VARCHAR(100),
    chiefComplaint TEXT,
    currentIllnessHistory TEXT,
    physicalExamination TEXT,
    assessment TEXT,
    plan TEXT,
    followUpInstructions TEXT,
    nextAppointment TIMESTAMP,
    status VARCHAR(50) DEFAULT 'completed',
    consultedBy UUID REFERENCES users(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 4. ESQUEMA POSTGRESQL ÚNICO - CLINIMETRIX PRO (ESCALAS)
-- =====================================================================

-- Registry de escalas disponibles (ÚNICO)
CREATE TABLE IF NOT EXISTS clinimetrix_registry (
    id VARCHAR(100) PRIMARY KEY,
    templateId VARCHAR(100) NOT NULL UNIQUE,
    abbreviation VARCHAR(20) NOT NULL,
    name VARCHAR(300) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,
    version VARCHAR(20) NOT NULL,
    language VARCHAR(10) DEFAULT 'es',
    authors JSONB,
    year INTEGER,
    administrationMode VARCHAR(50),
    estimatedDurationMinutes INTEGER,
    targetPopulation JSONB,
    totalItems INTEGER,
    scoreRangeMin INTEGER,
    scoreRangeMax INTEGER,
    psychometricProperties JSONB,
    clinicalValidation JSONB,
    isPublic BOOLEAN DEFAULT true,
    isFeatured BOOLEAN DEFAULT false,
    tags JSONB,
    lastValidated TIMESTAMP,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates de escalas (ÚNICO)
CREATE TABLE IF NOT EXISTS clinimetrix_templates (
    id VARCHAR(100) PRIMARY KEY,
    templateData JSONB NOT NULL,
    version VARCHAR(20) NOT NULL,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evaluaciones aplicadas (ÚNICO)
CREATE TABLE IF NOT EXISTS clinimetrix_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    templateId VARCHAR(100) NOT NULL REFERENCES clinimetrix_templates(id),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultationId UUID REFERENCES consultations(id),
    administratorId UUID REFERENCES users(id),
    responses JSONB,
    scores JSONB,
    interpretation JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    startedAt TIMESTAMP,
    completedAt TIMESTAMP,
    validityFlags JSONB,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evaluaciones remotas (ÚNICO)
CREATE TABLE IF NOT EXISTS clinimetrix_remote_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    templateId VARCHAR(100) NOT NULL REFERENCES clinimetrix_templates(id),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    sentBy UUID REFERENCES users(id),
    accessToken VARCHAR(255) UNIQUE NOT NULL,
    patientEmail VARCHAR(255) NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    responses JSONB,
    scores JSONB,
    interpretation JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    accessedAt TIMESTAMP,
    completedAt TIMESTAMP,
    ipAddress INET,
    userAgent TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 5. ESQUEMA POSTGRESQL ÚNICO - FORMX (FORMULARIOS)
-- =====================================================================

-- Templates de formularios únicos
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(300) NOT NULL,
    description TEXT,
    formType VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    structure JSONB NOT NULL,
    settings JSONB,
    expedixMapping JSONB,
    autoSyncExpedix BOOLEAN DEFAULT false,
    requiresAuth BOOLEAN DEFAULT false,
    isActive BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0',
    createdBy UUID REFERENCES users(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asignaciones de formularios a pacientes
CREATE TABLE IF NOT EXISTS patient_form_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    templateId UUID NOT NULL REFERENCES form_templates(id),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assignedBy UUID REFERENCES users(id),
    accessToken VARCHAR(255) UNIQUE NOT NULL,
    patientEmail VARCHAR(255) NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    formData JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    submittedAt TIMESTAMP,
    syncedToExpedix BOOLEAN DEFAULT false,
    syncedAt TIMESTAMP,
    ipAddress INET,
    userAgent TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 6. ESQUEMA POSTGRESQL ÚNICO - USUARIOS Y AUTH
-- =====================================================================

-- Usuarios únicos (Clerk integration)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerkUserId VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    role VARCHAR(50) DEFAULT 'professional',
    organization VARCHAR(200),
    licenseNumber VARCHAR(100),
    specialization VARCHAR(200),
    isActive BOOLEAN DEFAULT true,
    emailVerified BOOLEAN DEFAULT false,
    lastLoginAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 7. CONFIGURACIONES DE CLÍNICA
-- =====================================================================

-- Configuraciones generales
CREATE TABLE IF NOT EXISTS clinic_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizationName VARCHAR(300) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
    language VARCHAR(10) DEFAULT 'es',
    currency VARCHAR(10) DEFAULT 'MXN',
    settings JSONB,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 8. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================================

-- Índices para pacientes
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(isActive);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(createdAt);

-- Índices para evaluaciones
CREATE INDEX IF NOT EXISTS idx_clinimetrix_assessments_patient ON clinimetrix_assessments(patientId);
CREATE INDEX IF NOT EXISTS idx_clinimetrix_assessments_template ON clinimetrix_assessments(templateId);
CREATE INDEX IF NOT EXISTS idx_clinimetrix_assessments_status ON clinimetrix_assessments(status);

-- Índices para formularios
CREATE INDEX IF NOT EXISTS idx_form_assignments_patient ON patient_form_assignments(patientId);
CREATE INDEX IF NOT EXISTS idx_form_assignments_token ON patient_form_assignments(accessToken);
CREATE INDEX IF NOT EXISTS idx_form_assignments_status ON patient_form_assignments(status);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerkUserId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(isActive);

-- Reactivar restricciones de claves foráneas
SET foreign_key_checks = 1;

-- =====================================================================
-- 9. DATOS INICIALES MÍNIMOS
-- =====================================================================

-- Configuración inicial de clínica
INSERT INTO clinic_configurations (organizationName, settings) 
VALUES ('MindHub Healthcare', '{"initialized": true, "version": "2.0.0"}')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- FIN DE MIGRACIÓN LIMPIA
-- =====================================================================