-- =====================================================
-- CREAR TABLAS PARA SISTEMA DE SEEDS
-- =====================================================

-- Tabla principal de escalas (compatible con seeds)
CREATE TABLE IF NOT EXISTS scales (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(50) NOT NULL UNIQUE,
    version VARCHAR(20) DEFAULT '1.0',
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,
    author VARCHAR(255),
    publication_year INT,
    estimated_duration_minutes INT,
    administration_mode VARCHAR(50),
    target_population VARCHAR(255),
    total_items INT NOT NULL,
    scoring_method VARCHAR(50) DEFAULT 'sum',
    score_range_min INT DEFAULT 0,
    score_range_max INT,
    instructions_professional TEXT,
    instructions_patient TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de items de escalas (compatible con seeds)
CREATE TABLE IF NOT EXISTS scale_items (
    id VARCHAR(100) PRIMARY KEY,
    scale_id VARCHAR(50) NOT NULL,
    item_number INT NOT NULL,
    item_text TEXT NOT NULL,
    item_code VARCHAR(50),
    subscale VARCHAR(100),
    reverse_scored BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scale_id) REFERENCES scales(id) ON DELETE CASCADE,
    UNIQUE KEY unique_scale_item (scale_id, item_number)
);

-- Tabla de opciones de respuesta (compatible con seeds)
CREATE TABLE IF NOT EXISTS scale_response_options (
    id VARCHAR(100) PRIMARY KEY,
    scale_id VARCHAR(50) NOT NULL,
    option_value VARCHAR(10) NOT NULL,
    option_label VARCHAR(255) NOT NULL,
    score_value INT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scale_id) REFERENCES scales(id) ON DELETE CASCADE
);

-- Tabla de reglas de interpretación (compatible con seeds)
CREATE TABLE IF NOT EXISTS scale_interpretation_rules (
    id VARCHAR(100) PRIMARY KEY,
    scale_id VARCHAR(50) NOT NULL,
    min_score INT NOT NULL,
    max_score INT NOT NULL,
    severity_level VARCHAR(50) NOT NULL,
    interpretation_label VARCHAR(255) NOT NULL,
    color_code VARCHAR(20),
    description TEXT,
    recommendations TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scale_id) REFERENCES scales(id) ON DELETE CASCADE
);

-- Tabla de subescalas (compatible con seeds)
CREATE TABLE IF NOT EXISTS scale_subscales (
    id VARCHAR(100) PRIMARY KEY,
    scale_id VARCHAR(50) NOT NULL,
    subscale_name VARCHAR(255) NOT NULL,
    subscale_code VARCHAR(50),
    min_score INT DEFAULT 0,
    max_score INT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scale_id) REFERENCES scales(id) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_scale_items_scale_id ON scale_items(scale_id);
CREATE INDEX idx_scale_items_active ON scale_items(is_active);
CREATE INDEX idx_scale_response_options_scale_id ON scale_response_options(scale_id);
CREATE INDEX idx_scale_interpretation_rules_scale_id ON scale_interpretation_rules(scale_id);
CREATE INDEX idx_scale_subscales_scale_id ON scale_subscales(scale_id);

-- Mostrar tablas creadas
SHOW TABLES LIKE 'scale%';