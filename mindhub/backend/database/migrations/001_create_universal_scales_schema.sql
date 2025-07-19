-- =====================================================
-- SISTEMA UNIVERSAL DE ESCALAS - ARQUITECTURA DATABASE-FIRST
-- Migration: 001_create_universal_scales_schema_simple.sql
-- Versión simplificada sin claves foráneas para SQLite
-- =====================================================

-- Tabla principal de escalas
CREATE TABLE scales (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    category VARCHAR(50),
    subcategory VARCHAR(50),
    description TEXT,
    author VARCHAR(255),
    publication_year INTEGER,
    estimated_duration_minutes INTEGER,
    administration_mode VARCHAR(50) DEFAULT 'both',
    target_population VARCHAR(100),
    total_items INTEGER NOT NULL,
    scoring_method VARCHAR(50),
    score_range_min INTEGER,
    score_range_max INTEGER,
    instructions_professional TEXT,
    instructions_patient TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items de cada escala
CREATE TABLE scale_items (
    id VARCHAR(50) PRIMARY KEY,
    scale_id VARCHAR(50) NOT NULL,
    item_number INTEGER NOT NULL,
    item_text TEXT NOT NULL,
    item_code VARCHAR(20),
    subscale VARCHAR(50),
    reverse_scored INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opciones de respuesta por escala
CREATE TABLE scale_response_options (
    id VARCHAR(50) PRIMARY KEY,
    scale_id VARCHAR(50) NOT NULL,
    option_value VARCHAR(10) NOT NULL,
    option_label VARCHAR(255) NOT NULL,
    score_value INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reglas de interpretación
CREATE TABLE scale_interpretation_rules (
    id VARCHAR(50) PRIMARY KEY,
    scale_id VARCHAR(50) NOT NULL,
    min_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    severity_level VARCHAR(50) NOT NULL,
    interpretation_label VARCHAR(255) NOT NULL,
    color_code VARCHAR(20),
    description TEXT,
    recommendations TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subescalas (opcional)
CREATE TABLE scale_subscales (
    id VARCHAR(50) PRIMARY KEY,
    scale_id VARCHAR(50) NOT NULL,
    subscale_name VARCHAR(100) NOT NULL,
    subscale_code VARCHAR(20),
    min_score INTEGER,
    max_score INTEGER,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar evaluaciones completadas
CREATE TABLE assessments (
    id VARCHAR(50) PRIMARY KEY,
    scale_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50),
    patient_name VARCHAR(255),
    total_score INTEGER,
    completion_percentage DECIMAL(5,2) DEFAULT 100.00,
    administration_mode VARCHAR(50) DEFAULT 'presencial-mismo',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50)
);

-- Tabla para almacenar respuestas individuales
CREATE TABLE assessment_responses (
    id VARCHAR(50) PRIMARY KEY,
    assessment_id VARCHAR(50) NOT NULL,
    scale_id VARCHAR(50) NOT NULL,
    item_number INTEGER NOT NULL,
    response_value VARCHAR(10) NOT NULL,
    response_label VARCHAR(255) NOT NULL,
    score_value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar resultados de subescalas
CREATE TABLE assessment_subscale_results (
    id VARCHAR(50) PRIMARY KEY,
    assessment_id VARCHAR(50) NOT NULL,
    subscale_code VARCHAR(20) NOT NULL,
    subscale_name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX idx_scales_category ON scales(category);
CREATE INDEX idx_scales_active ON scales(is_active);
CREATE INDEX idx_scales_abbreviation ON scales(abbreviation);

CREATE INDEX idx_scale_items_scale_id ON scale_items(scale_id);
CREATE INDEX idx_scale_items_subscale ON scale_items(subscale);

CREATE INDEX idx_scale_response_options_scale_id ON scale_response_options(scale_id);
CREATE INDEX idx_scale_response_options_display_order ON scale_response_options(display_order);

CREATE INDEX idx_scale_interpretation_scale_id ON scale_interpretation_rules(scale_id);
CREATE INDEX idx_scale_interpretation_severity ON scale_interpretation_rules(severity_level);

CREATE INDEX idx_scale_subscales_scale_id ON scale_subscales(scale_id);
CREATE INDEX idx_scale_subscales_code ON scale_subscales(subscale_code);

CREATE INDEX idx_assessments_scale_id ON assessments(scale_id);
CREATE INDEX idx_assessments_patient_id ON assessments(patient_id);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at);

CREATE INDEX idx_assessment_responses_assessment_id ON assessment_responses(assessment_id);
CREATE INDEX idx_assessment_responses_scale_id ON assessment_responses(scale_id);
CREATE INDEX idx_assessment_responses_item ON assessment_responses(item_number);

CREATE INDEX idx_assessment_subscale_results_assessment_id ON assessment_subscale_results(assessment_id);
CREATE INDEX idx_assessment_subscale_results_subscale_code ON assessment_subscale_results(subscale_code);