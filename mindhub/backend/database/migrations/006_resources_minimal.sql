-- Minimal Resources Tables Migration

-- Resource Categories
CREATE TABLE IF NOT EXISTS resource_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    library_type ENUM('public', 'private') NOT NULL DEFAULT 'private',
    category_id VARCHAR(36),
    upload_by VARCHAR(36) NOT NULL,
    send_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Resource Send History
CREATE TABLE IF NOT EXISTS resource_sends (
    id VARCHAR(36) PRIMARY KEY,
    resource_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    sent_by VARCHAR(36) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    send_method ENUM('email', 'download', 'patient-portal') NOT NULL,
    notes TEXT
);

-- Insert basic categories
INSERT IGNORE INTO resource_categories (id, name, description) VALUES
('cat-psico', 'Psicoeducación', 'Material educativo para pacientes'),
('cat-tareas', 'Tareas Terapéuticas', 'Ejercicios y actividades para terapia'),
('cat-consent', 'Consentimientos', 'Formularios de consentimiento informado'),
('cat-eval', 'Evaluaciones', 'Instrumentos de evaluación y escalas'),
('cat-guides', 'Guías de Tratamiento', 'Protocolos y guías clínicas'),
('cat-support', 'Material de Apoyo', 'Recursos complementarios');