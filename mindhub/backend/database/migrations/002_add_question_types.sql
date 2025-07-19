-- =====================================================
-- EXTENSIÓN TIPOS DE PREGUNTAS - SISTEMA UNIVERSAL
-- Migration: 002_add_question_types.sql
-- Agregar soporte para múltiples tipos de preguntas
-- =====================================================

-- Tabla para definir tipos de preguntas disponibles
CREATE TABLE question_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    component_name VARCHAR(100) NOT NULL, -- Componente React para renderizar
    validation_rules TEXT, -- JSON con reglas de validación
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar tipos de preguntas básicos
INSERT INTO question_types (id, name, description, component_name, validation_rules) VALUES
('likert', 'Escala Likert', 'Escala de respuesta con múltiples opciones ordinales', 'LikertQuestion', '{"required": true, "min_options": 2, "max_options": 7}'),
('dichotomous', 'Dicotómica', 'Pregunta con dos opciones (Sí/No, Verdadero/Falso)', 'DichotomousQuestion', '{"required": true, "options_count": 2}'),
('vas', 'Escala Visual Analógica', 'Línea continua donde el usuario marca su respuesta', 'VASQuestion', '{"required": true, "min_value": 0, "max_value": 100}'),
('numeric', 'Escala Numérica', 'Escala con valores numéricos específicos', 'NumericQuestion', '{"required": true, "min_value": 0, "max_value": 10}'),
('multiple_choice', 'Selección Múltiple', 'Pregunta con múltiples opciones, una respuesta', 'MultipleChoiceQuestion', '{"required": true, "min_options": 2, "max_options": 10}'),
('text', 'Texto Libre', 'Respuesta abierta de texto', 'TextQuestion', '{"required": false, "max_length": 500}'),
('ranking', 'Ordenamiento', 'Ordenar elementos por preferencia o importancia', 'RankingQuestion', '{"required": true, "min_items": 2, "max_items": 10}'),
('semantic_diff', 'Diferencial Semántico', 'Escala entre dos conceptos opuestos', 'SemanticDifferentialQuestion', '{"required": true, "scale_points": 7}'),
('checklist', 'Lista de Verificación', 'Múltiples opciones, múltiples respuestas', 'ChecklistQuestion', '{"required": false, "min_selections": 0}'),
('frequency', 'Frecuencia Temporal', 'Escala específica de frecuencia de eventos', 'FrequencyQuestion', '{"required": true, "time_frame": "weeks"}');

-- Agregar campos a scale_items para tipos de preguntas
ALTER TABLE scale_items ADD COLUMN question_type VARCHAR(50) DEFAULT 'likert';
ALTER TABLE scale_items ADD COLUMN question_metadata TEXT; -- JSON con configuración específica
ALTER TABLE scale_items ADD COLUMN alert_trigger INTEGER DEFAULT 0;
ALTER TABLE scale_items ADD COLUMN alert_condition VARCHAR(100);
ALTER TABLE scale_items ADD COLUMN help_text TEXT;
ALTER TABLE scale_items ADD COLUMN required_field INTEGER DEFAULT 1;

-- Agregar campos a scale_response_options para mayor flexibilidad
ALTER TABLE scale_response_options ADD COLUMN option_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE scale_response_options ADD COLUMN option_metadata TEXT; -- JSON con configuración específica
ALTER TABLE scale_response_options ADD COLUMN min_value REAL;
ALTER TABLE scale_response_options ADD COLUMN max_value REAL;
ALTER TABLE scale_response_options ADD COLUMN step_value REAL DEFAULT 1;

-- Tabla para respuestas de texto libre
CREATE TABLE item_text_responses (
    id VARCHAR(50) PRIMARY KEY,
    assessment_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    response_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para respuestas de ranking
CREATE TABLE item_ranking_responses (
    id VARCHAR(50) PRIMARY KEY,
    assessment_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    option_id VARCHAR(50) NOT NULL,
    rank_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para respuestas de checklist
CREATE TABLE item_checklist_responses (
    id VARCHAR(50) PRIMARY KEY,
    assessment_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    option_id VARCHAR(50) NOT NULL,
    is_selected INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX idx_scale_items_question_type ON scale_items(question_type);
CREATE INDEX idx_scale_items_required ON scale_items(required_field);
CREATE INDEX idx_item_text_responses_assessment ON item_text_responses(assessment_id);
CREATE INDEX idx_item_ranking_responses_assessment ON item_ranking_responses(assessment_id);
CREATE INDEX idx_item_checklist_responses_assessment ON item_checklist_responses(assessment_id);