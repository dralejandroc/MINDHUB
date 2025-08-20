-- Migración para crear tablas de evaluaciones remotas
-- Fecha: 2025-01-31
-- Propósito: Permitir envío de escalas clínicas a pacientes vía link tokenizado

-- Tabla principal para evaluaciones remotas
CREATE TABLE IF NOT EXISTS remote_assessments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    token VARCHAR(64) UNIQUE NOT NULL,
    scale_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    administrator_id VARCHAR(36) NOT NULL,
    
    -- Tiempos y expiración
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL, -- Configurado por el profesional
    accessed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Estado de la evaluación
    status ENUM('pending', 'accessed', 'in_progress', 'completed', 'expired') DEFAULT 'pending',
    
    -- Información de contacto del paciente
    patient_email VARCHAR(255),
    patient_phone VARCHAR(50),
    
    -- Mensajes personalizados
    custom_message TEXT, -- Mensaje del profesional explicando el motivo
    privacy_notice_id VARCHAR(36), -- Referencia al aviso de privacidad de FormX
    
    -- Configuración de envío
    expiration_days INT NOT NULL DEFAULT 7, -- Días hasta expiración
    reminder_enabled BOOLEAN DEFAULT TRUE,
    reminder_sent_at TIMESTAMP NULL,
    reminder_count INT DEFAULT 0,
    
    -- Método de envío
    delivery_method ENUM('email', 'sms', 'whatsapp', 'copy_link') DEFAULT 'copy_link',
    
    -- Auditoría
    created_by VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (scale_id) REFERENCES scales(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (administrator_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    -- Índices para búsquedas rápidas
    INDEX idx_token (token),
    INDEX idx_patient_id (patient_id),
    INDEX idx_administrator_id (administrator_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
);

-- Tabla de registro de accesos para auditoría
CREATE TABLE IF NOT EXISTS remote_assessment_access_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    remote_assessment_id VARCHAR(36) NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Información del dispositivo/navegador
    ip_address VARCHAR(45), -- Soporta IPv6
    user_agent TEXT,
    device_type ENUM('mobile', 'tablet', 'desktop', 'unknown') DEFAULT 'unknown',
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    
    -- Información geográfica (opcional)
    country_code VARCHAR(2),
    city VARCHAR(100),
    
    -- Acción realizada
    action ENUM('view', 'start', 'save_progress', 'complete', 'expire') DEFAULT 'view',
    
    -- Datos adicionales
    metadata JSON,
    
    -- Foreign key
    FOREIGN KEY (remote_assessment_id) REFERENCES remote_assessments(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_remote_assessment_id (remote_assessment_id),
    INDEX idx_accessed_at (accessed_at)
);

-- Tabla para guardar progreso parcial de evaluaciones remotas
CREATE TABLE IF NOT EXISTS remote_assessment_progress (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    remote_assessment_id VARCHAR(36) NOT NULL,
    
    -- Datos del progreso
    responses JSON NOT NULL, -- Respuestas guardadas temporalmente
    current_item_index INT DEFAULT 0,
    total_items INT NOT NULL,
    percentage_complete DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (remote_assessment_id) REFERENCES remote_assessments(id) ON DELETE CASCADE,
    
    -- Índice único para evitar duplicados
    UNIQUE KEY unique_assessment_progress (remote_assessment_id)
);

-- Tabla para plantillas de mensajes predefinidos
CREATE TABLE IF NOT EXISTS remote_assessment_message_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    category ENUM('followup', 'initial', 'pre_appointment', 'post_appointment', 'custom') DEFAULT 'custom',
    message_template TEXT NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    -- Índices
    INDEX idx_category (category),
    INDEX idx_created_by (created_by)
);

-- Insertar algunas plantillas de mensaje predefinidas
INSERT INTO remote_assessment_message_templates (name, category, message_template, created_by) VALUES
('Seguimiento regular', 'followup', 'Como parte del seguimiento acordado en su última consulta, le solicito complete esta evaluación que nos ayudará a monitorear su progreso.', (SELECT id FROM users WHERE email = 'system@mindhub.com' LIMIT 1)),
('Pre-cita', 'pre_appointment', 'Para tener mayor información disponible para su próxima cita del día [FECHA], le agradecería completar esta evaluación.', (SELECT id FROM users WHERE email = 'system@mindhub.com' LIMIT 1)),
('Evaluación inicial', 'initial', 'Como parte de su proceso de evaluación inicial, es importante que complete este cuestionario que nos proporcionará información valiosa para su tratamiento.', (SELECT id FROM users WHERE email = 'system@mindhub.com' LIMIT 1)),
('Post-consulta', 'post_appointment', 'Siguiendo lo acordado en nuestra sesión de hoy, le envío esta evaluación para completar el proceso diagnóstico.', (SELECT id FROM users WHERE email = 'system@mindhub.com' LIMIT 1));