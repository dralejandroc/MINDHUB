-- FormX Tables Migration
-- Create comprehensive tables for forms, assignments, and analytics

-- Main Forms Table
CREATE TABLE IF NOT EXISTS forms (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    structure JSON NOT NULL,
    settings JSON,
    category VARCHAR(100),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    INDEX idx_created_by (created_by),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at)
);

-- Form Assignments Table
CREATE TABLE IF NOT EXISTS form_assignments (
    id VARCHAR(100) PRIMARY KEY,
    form_id VARCHAR(100) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    token VARCHAR(128) NOT NULL UNIQUE,
    assigned_by VARCHAR(36) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'expired') DEFAULT 'pending',
    message TEXT,
    reminders_sent INT DEFAULT 0,
    max_reminders INT DEFAULT 3,
    completion_percentage INT DEFAULT 0,
    completed_at TIMESTAMP NULL,
    reminder_schedule JSON,
    INDEX idx_form_id (form_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_token (token),
    INDEX idx_status (status),
    INDEX idx_assigned_at (assigned_at),
    INDEX idx_expires_at (expires_at)
);

-- Form Submissions Table
CREATE TABLE IF NOT EXISTS form_submissions (
    id VARCHAR(100) PRIMARY KEY,
    assignment_id VARCHAR(100) NOT NULL,
    form_id VARCHAR(100) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    responses JSON NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submission_time_seconds INT,
    completion_percentage INT DEFAULT 100,
    ip_address VARCHAR(45),
    user_agent TEXT,
    signature_data TEXT,
    INDEX idx_assignment_id (assignment_id),
    INDEX idx_form_id (form_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_submitted_at (submitted_at)
);

-- Form Analytics Table
CREATE TABLE IF NOT EXISTS form_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    form_id VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_form_id (form_id),
    INDEX idx_metric_name (metric_name),
    INDEX idx_period (period_start, period_end)
);

-- Form Categories Table
CREATE TABLE IF NOT EXISTS form_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT IGNORE INTO form_categories (id, name, description, icon, color, sort_order) VALUES
('cat-medical-history', 'Historia Médica', 'Formularios de historial médico completo', 'document-text', '#3B82F6', 1),
('cat-symptoms', 'Síntomas', 'Registro de síntomas y molestias', 'heart', '#EF4444', 2),
('cat-pre-consultation', 'Pre-consulta', 'Formularios previos a la consulta', 'clock', '#10B981', 3),
('cat-follow-up', 'Seguimiento', 'Formularios de seguimiento post-tratamiento', 'arrow-path', '#F59E0B', 4),
('cat-evaluation', 'Evaluación', 'Formularios de evaluación y assessment', 'chart-bar', '#8B5CF6', 5),
('cat-consent', 'Consentimiento', 'Formularios de consentimiento informado', 'shield-check', '#6B7280', 6);

-- Create additional indexes for better performance (MySQL doesn't support IF NOT EXISTS for indexes)
-- These will be created only if they don't exist already

-- Insert sample analytics data (will be replaced with real data)
INSERT IGNORE INTO form_analytics (form_id, metric_name, metric_value, period_start, period_end) VALUES
('sample_form_1', 'completion_rate', 87.5, CURDATE() - INTERVAL 30 DAY, CURDATE()),
('sample_form_1', 'avg_completion_time', 12.3, CURDATE() - INTERVAL 30 DAY, CURDATE()),
('sample_form_1', 'total_assignments', 45, CURDATE() - INTERVAL 30 DAY, CURDATE()),
('sample_form_2', 'completion_rate', 92.1, CURDATE() - INTERVAL 30 DAY, CURDATE()),
('sample_form_2', 'avg_completion_time', 8.7, CURDATE() - INTERVAL 30 DAY, CURDATE()),
('sample_form_2', 'total_assignments', 38, CURDATE() - INTERVAL 30 DAY, CURDATE());