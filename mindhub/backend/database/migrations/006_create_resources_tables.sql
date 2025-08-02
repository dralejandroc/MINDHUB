-- Migration: Create Resources Management Tables
-- Description: Tables for document management, libraries, watermarks, and tracking

-- Resource Categories (hierarchical)
CREATE TABLE IF NOT EXISTS resource_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id VARCHAR(36),
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES resource_categories(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_sort (sort_order)
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
    owner_id VARCHAR(36), -- NULL for public library
    tags JSON,
    thumbnail_path VARCHAR(500),
    content_hash VARCHAR(64) UNIQUE, -- SHA-256 for duplicate detection
    full_text_content LONGTEXT, -- For search
    metadata_json JSON,
    is_active BOOLEAN DEFAULT TRUE,
    upload_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES resource_categories(id) ON DELETE SET NULL,
    -- FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    -- FOREIGN KEY (upload_by) REFERENCES users(id),
    FULLTEXT INDEX ft_search (title, description, full_text_content),
    INDEX idx_library_type (library_type),
    INDEX idx_owner (owner_id),
    INDEX idx_category (category_id),
    INDEX idx_created (created_at)
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_default (user_id, is_default)
);

-- Email Templates for Resource Sending
CREATE TABLE IF NOT EXISTS resource_email_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- Resource Send History
CREATE TABLE IF NOT EXISTS resource_sends (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    resource_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    sent_by VARCHAR(36) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    send_method ENUM('email', 'download', 'patient-portal') NOT NULL,
    email_template_id VARCHAR(36),
    watermark_applied BOOLEAN DEFAULT FALSE,
    watermark_template_id VARCHAR(36),
    customizations_json JSON, -- Any custom modifications
    delivery_status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'sent',
    delivered_at TIMESTAMP NULL,
    viewed_at TIMESTAMP NULL,
    download_count INT DEFAULT 0,
    notes TEXT,
    -- FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    -- FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    -- FOREIGN KEY (sent_by) REFERENCES users(id),
    FOREIGN KEY (email_template_id) REFERENCES resource_email_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (watermark_template_id) REFERENCES watermark_templates(id) ON DELETE SET NULL,
    INDEX idx_patient (patient_id),
    INDEX idx_resource (resource_id),
    INDEX idx_sent_date (sent_at),
    INDEX idx_status (delivery_status)
);

-- Resource Access Logs
CREATE TABLE IF NOT EXISTS resource_access_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    resource_send_id VARCHAR(36) NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    action ENUM('view', 'download', 'print') NOT NULL,
    -- FOREIGN KEY (resource_send_id) REFERENCES resource_sends(id) ON DELETE CASCADE,
    INDEX idx_send (resource_send_id),
    INDEX idx_accessed (accessed_at)
);

-- Resource Collections (for grouping resources)
CREATE TABLE IF NOT EXISTS resource_collections (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- Many-to-many relationship for collections
CREATE TABLE IF NOT EXISTS resource_collection_items (
    collection_id VARCHAR(36) NOT NULL,
    resource_id VARCHAR(36) NOT NULL,
    sort_order INT DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, resource_id),
    -- FOREIGN KEY (collection_id) REFERENCES resource_collections(id) ON DELETE CASCADE,
    -- FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

-- Insert default categories
INSERT INTO resource_categories (name, description, icon, sort_order) VALUES
('Psicoeducación', 'Material educativo para pacientes', 'academic-cap', 1),
('Tareas Terapéuticas', 'Ejercicios y actividades para terapia', 'clipboard-list', 2),
('Consentimientos', 'Formularios de consentimiento informado', 'shield-check', 3),
('Evaluaciones', 'Instrumentos de evaluación y escalas', 'chart-bar', 4),
('Guías de Tratamiento', 'Protocolos y guías clínicas', 'book-open', 5),
('Material de Apoyo', 'Recursos complementarios', 'support', 6);

-- Insert some example public library watermark
INSERT INTO watermark_templates (user_id, name, type, text_content, position, opacity, is_default) 
VALUES ('system', 'MindHub Public Library', 'text', 'Hecho y distribuido por MindHub. Derechos reservados', 'bottom-center', 0.3, TRUE);