-- Simple Resources Tables Migration
-- Create basic tables without foreign key constraints

-- Resource Categories
CREATE TABLE IF NOT EXISTS resource_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id VARCHAR(36),
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Main Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    category_id VARCHAR(36),
    library_type ENUM('public', 'private', 'premium') NOT NULL DEFAULT 'private',
    owner_id VARCHAR(36),
    tags JSON,
    thumbnail_path VARCHAR(500),
    content_hash VARCHAR(64) UNIQUE,
    full_text_content LONGTEXT,
    metadata_json JSON,
    is_active BOOLEAN DEFAULT TRUE,
    upload_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT INDEX ft_search (title, description, full_text_content)
);

-- Watermark Templates
CREATE TABLE IF NOT EXISTS watermark_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('text', 'image', 'combined') NOT NULL,
    logo_path VARCHAR(500),
    text_content VARCHAR(500),
    position ENUM('top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right') DEFAULT 'bottom-right',
    opacity DECIMAL(3,2) DEFAULT 0.5,
    font_size INT DEFAULT 12,
    font_color VARCHAR(7) DEFAULT '#000000',
    settings_json JSON,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Resource Send History
CREATE TABLE IF NOT EXISTS resource_sends (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    resource_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    sent_by VARCHAR(36) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    send_method ENUM('email', 'download', 'patient-portal') NOT NULL,
    watermark_applied BOOLEAN DEFAULT FALSE,
    watermark_template_id VARCHAR(36),
    customizations_json JSON,
    delivery_status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'sent',
    delivered_at TIMESTAMP NULL,
    viewed_at TIMESTAMP NULL,
    download_count INT DEFAULT 0,
    notes TEXT
);

-- Insert default categories
INSERT INTO resource_categories (name, description) VALUES
('Psicoeducación', 'Material educativo para pacientes'),
('Tareas Terapéuticas', 'Ejercicios y actividades para terapia'),
('Consentimientos', 'Formularios de consentimiento informado'),
('Evaluaciones', 'Instrumentos de evaluación y escalas'),
('Guías de Tratamiento', 'Protocolos y guías clínicas'),
('Material de Apoyo', 'Recursos complementarios');

-- Insert default watermark template
INSERT INTO watermark_templates (user_id, name, type, text_content, position, opacity, is_default) 
VALUES ('system', 'MindHub Public Library', 'text', 'Hecho y distribuido por MindHub. Derechos reservados', 'bottom-center', 0.3, TRUE);