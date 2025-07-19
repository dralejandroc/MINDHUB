-- =====================================================================
-- ESQUEMA UNIVERSAL PARA ESCALAS CLINIMÉTRICAS - DATABASE-FIRST
-- Una sola base de datos para TODAS las escalas
-- =====================================================================

-- Tabla maestra para todas las escalas clínicas
CREATE TABLE IF NOT EXISTS clinical_scales (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    version VARCHAR(10) NOT NULL DEFAULT '1.0',
    category ENUM(
        'depression', 
        'anxiety', 
        'cognitive', 
        'personality', 
        'addiction', 
        'psychosis', 
        'trauma', 
        'bipolar',
        'eating_disorder',
        'sleep',
        'pain',
        'general'
    ) NOT NULL,
    subcategory VARCHAR(100),
    
    -- Definición completa de la escala en JSON
    definition JSON NOT NULL,
    
    -- Metadatos administrativos
    is_active BOOLEAN DEFAULT TRUE,
    requires_training BOOLEAN DEFAULT FALSE,
    target_population TEXT,
    estimated_duration_minutes INT DEFAULT 10,
    administration_mode ENUM('self_administered', 'clinician_administered', 'hybrid') DEFAULT 'self_administered',
    validation_level ENUM('experimental', 'validated', 'gold_standard') DEFAULT 'validated',
    language VARCHAR(5) DEFAULT 'es',
    
    -- Información clínica
    clinical_purpose TEXT,
    interpretation_guide TEXT,
    scientific_references TEXT,
    
    -- Auditoría
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para rendimiento
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_language (language),
    INDEX idx_validation (validation_level),
    FULLTEXT INDEX ft_search (name, abbreviation, clinical_purpose)
);

-- Tabla universal para pacientes
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    external_id VARCHAR(100) UNIQUE, -- ID del sistema hospitalario
    
    -- Datos demográficos básicos (encriptados)
    demographics JSON,
    
    -- Consentimientos y permisos
    consent_data JSON,
    privacy_level ENUM('minimal', 'standard', 'full') DEFAULT 'standard',
    
    -- Vinculación con aplicaciones
    app_token VARCHAR(100) UNIQUE,
    app_token_expires_at TIMESTAMP,
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_external (external_id),
    INDEX idx_token (app_token),
    INDEX idx_active (is_active)
);

-- Tabla universal para sesiones de evaluación
CREATE TABLE IF NOT EXISTS assessment_sessions (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    clinician_id VARCHAR(50),
    
    -- Información de la sesión
    session_type ENUM('screening', 'diagnostic', 'follow_up', 'research') DEFAULT 'screening',
    session_context JSON, -- Información del contexto clínico
    
    -- Estado de la sesión
    status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'expired') DEFAULT 'pending',
    
    -- Metadatos de administración
    administration_mode ENUM('in_person', 'remote', 'hybrid') DEFAULT 'in_person',
    device_info JSON,
    location_info JSON,
    
    -- Tiempos
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_patient (patient_id),
    INDEX idx_clinician (clinician_id),
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_at),
    INDEX idx_completed (completed_at)
);

-- Tabla universal para administraciones de escalas específicas
CREATE TABLE IF NOT EXISTS scale_administrations (
    id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,
    scale_id VARCHAR(50) NOT NULL,
    
    -- Estado de la administración
    status ENUM('pending', 'in_progress', 'completed', 'abandoned', 'invalidated') DEFAULT 'pending',
    
    -- Resultados calculados
    raw_responses JSON, -- Respuestas originales del paciente
    calculated_scores JSON, -- Puntuaciones calculadas y subescalas
    interpretation JSON, -- Interpretación clínica automatizada
    alerts JSON, -- Alertas generadas (críticas, advertencias)
    
    -- Metadatos de administración
    current_item_index INT DEFAULT 0,
    total_items INT,
    completion_percentage DECIMAL(5,2) DEFAULT 0.0,
    
    -- Tiempos de administración
    estimated_duration_minutes INT,
    actual_duration_seconds INT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    
    -- Validación y calidad
    validity_flags JSON, -- Flags de validez (tiempo muy rápido, patrones sospechosos)
    quality_score DECIMAL(3,2), -- Puntuación de calidad de 0-1
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (scale_id) REFERENCES clinical_scales(id),
    UNIQUE KEY unique_session_scale (session_id, scale_id),
    INDEX idx_session (session_id),
    INDEX idx_scale (scale_id),
    INDEX idx_status (status),
    INDEX idx_completed (completed_at)
);

-- Tabla universal para respuestas individuales a ítems
CREATE TABLE IF NOT EXISTS item_responses (
    id VARCHAR(50) PRIMARY KEY,
    administration_id VARCHAR(50) NOT NULL,
    
    -- Identificación del ítem
    item_id VARCHAR(50) NOT NULL,
    item_number INT NOT NULL,
    
    -- Respuesta del paciente
    response_value VARCHAR(500), -- Valor seleccionado por el paciente
    response_label TEXT, -- Etiqueta mostrada al paciente
    score_value DECIMAL(8,3), -- Puntuación numérica calculada
    
    -- Metadatos de la respuesta
    response_time_ms INT, -- Tiempo en milisegundos para responder
    was_skipped BOOLEAN DEFAULT FALSE,
    was_modified BOOLEAN DEFAULT FALSE, -- Si el paciente cambió su respuesta
    modification_count INT DEFAULT 0,
    
    -- Información contextual
    presentation_order INT, -- Orden en que se presentó el ítem
    randomization_seed VARCHAR(50), -- Semilla de aleatorización si aplica
    
    -- Validación
    is_valid BOOLEAN DEFAULT TRUE,
    validation_notes TEXT,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (administration_id) REFERENCES scale_administrations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_admin_item (administration_id, item_id),
    INDEX idx_administration (administration_id),
    INDEX idx_item (item_id),
    INDEX idx_item_number (item_number),
    INDEX idx_response_time (response_time_ms)
);

-- Tabla para asignaciones remotas de escalas
CREATE TABLE IF NOT EXISTS scale_assignments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    scale_id VARCHAR(50) NOT NULL,
    assigned_by VARCHAR(50) NOT NULL, -- clinician_id
    
    -- Programación
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    -- Estado
    status ENUM('pending', 'sent', 'started', 'completed', 'expired', 'cancelled') DEFAULT 'pending',
    
    -- Configuración de notificaciones
    notification_preferences JSON,
    reminder_schedule JSON, -- Cuándo enviar recordatorios
    
    -- Vinculación con sesión completada
    completed_session_id VARCHAR(50),
    completed_at TIMESTAMP,
    
    -- Instrucciones especiales
    custom_instructions TEXT,
    custom_context JSON,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (scale_id) REFERENCES clinical_scales(id),
    FOREIGN KEY (completed_session_id) REFERENCES assessment_sessions(id),
    INDEX idx_patient (patient_id),
    INDEX idx_scale (scale_id),
    INDEX idx_assigned_by (assigned_by),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
);

-- Tabla para notificaciones y recordatorios
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    assignment_id VARCHAR(50),
    patient_id VARCHAR(50) NOT NULL,
    
    -- Tipo y contenido
    notification_type ENUM('assignment', 'reminder', 'overdue', 'completed', 'alert') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Canales de entrega
    delivery_method ENUM('push', 'sms', 'email', 'in_app') NOT NULL,
    
    -- Programación
    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Estado
    status ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'cancelled') DEFAULT 'pending',
    failure_reason TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    
    -- Metadatos
    metadata JSON,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assignment_id) REFERENCES scale_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_assignment (assignment_id),
    INDEX idx_patient (patient_id),
    INDEX idx_scheduled (scheduled_for),
    INDEX idx_status (status),
    INDEX idx_type (notification_type)
);

-- Vista para resultados de evaluación completos
CREATE OR REPLACE VIEW assessment_results AS
SELECT 
    s.id as session_id,
    s.patient_id,
    s.clinician_id,
    s.session_type,
    s.status as session_status,
    s.started_at as session_started,
    s.completed_at as session_completed,
    
    sa.id as administration_id,
    sa.scale_id,
    cs.name as scale_name,
    cs.abbreviation as scale_abbreviation,
    cs.category as scale_category,
    sa.status as administration_status,
    sa.calculated_scores,
    sa.interpretation,
    sa.alerts,
    sa.completion_percentage,
    sa.actual_duration_seconds,
    
    COUNT(ir.id) as total_responses,
    COUNT(CASE WHEN ir.was_skipped = FALSE THEN 1 END) as completed_responses,
    AVG(ir.response_time_ms) as avg_response_time_ms
    
FROM assessment_sessions s
JOIN scale_administrations sa ON s.id = sa.session_id
JOIN clinical_scales cs ON sa.scale_id = cs.id
LEFT JOIN item_responses ir ON sa.id = ir.administration_id
GROUP BY s.id, sa.id;

-- Vista para seguimiento temporal de pacientes
CREATE OR REPLACE VIEW patient_timeline AS
SELECT 
    p.id as patient_id,
    p.external_id,
    sa.scale_id,
    cs.name as scale_name,
    cs.category,
    JSON_EXTRACT(sa.calculated_scores, '$.totalScore') as total_score,
    JSON_EXTRACT(sa.interpretation, '$.severity') as severity_level,
    sa.completed_at,
    ROW_NUMBER() OVER (PARTITION BY p.id, sa.scale_id ORDER BY sa.completed_at) as assessment_number,
    LAG(JSON_EXTRACT(sa.calculated_scores, '$.totalScore')) 
        OVER (PARTITION BY p.id, sa.scale_id ORDER BY sa.completed_at) as previous_score
FROM patients p
JOIN assessment_sessions s ON p.id = s.patient_id
JOIN scale_administrations sa ON s.id = sa.session_id
JOIN clinical_scales cs ON sa.scale_id = cs.id
WHERE sa.status = 'completed'
ORDER BY p.id, sa.scale_id, sa.completed_at;

-- =====================================================================
-- INSERTAR ESCALAS EXISTENTES EN FORMATO JSON
-- =====================================================================

-- PHQ-9: Patient Health Questionnaire
INSERT INTO clinical_scales (
    id, name, abbreviation, version, category, subcategory,
    estimated_duration_minutes, administration_mode, validation_level,
    clinical_purpose, target_population,
    definition
) VALUES (
    'phq9',
    'Patient Health Questionnaire-9',
    'PHQ-9',
    '2.0',
    'depression',
    'Major Depression',
    10,
    'self_administered',
    'gold_standard',
    'Evaluación de síntomas depresivos durante las últimas 2 semanas',
    'Adolescentes y adultos (13+ años)',
    JSON_OBJECT(
        'totalItems', 9,
        'responseType', 'likert',
        'scoringMethod', 'sum',
        'scoreRange', JSON_OBJECT('min', 0, 'max', 27),
        'items', JSON_ARRAY(
            JSON_OBJECT(
                'id', 'phq9_1',
                'number', 1,
                'text', 'Poco interés o placer en hacer cosas',
                'responseOptions', JSON_ARRAY(
                    JSON_OBJECT('value', '0', 'label', 'Para nada', 'score', 0),
                    JSON_OBJECT('value', '1', 'label', 'Varios días', 'score', 1),
                    JSON_OBJECT('value', '2', 'label', 'Más de la mitad de los días', 'score', 2),
                    JSON_OBJECT('value', '3', 'label', 'Casi todos los días', 'score', 3)
                )
            ),
            JSON_OBJECT(
                'id', 'phq9_2',
                'number', 2,
                'text', 'Se ha sentido decaído(a), deprimido(a) o sin esperanzas',
                'responseOptions', JSON_ARRAY(
                    JSON_OBJECT('value', '0', 'label', 'Para nada', 'score', 0),
                    JSON_OBJECT('value', '1', 'label', 'Varios días', 'score', 1),
                    JSON_OBJECT('value', '2', 'label', 'Más de la mitad de los días', 'score', 2),
                    JSON_OBJECT('value', '3', 'label', 'Casi todos los días', 'score', 3)
                )
            ),
            JSON_OBJECT(
                'id', 'phq9_3',
                'number', 3,
                'text', 'Dificultades para quedarse o permanecer dormido(a), o dormir demasiado',
                'responseOptions', JSON_ARRAY(
                    JSON_OBJECT('value', '0', 'label', 'Para nada', 'score', 0),
                    JSON_OBJECT('value', '1', 'label', 'Varios días', 'score', 1),
                    JSON_OBJECT('value', '2', 'label', 'Más de la mitad de los días', 'score', 2),
                    JSON_OBJECT('value', '3', 'label', 'Casi todos los días', 'score', 3)
                )
            ),
            JSON_OBJECT(
                'id', 'phq9_4',
                'number', 4,
                'text', 'Se ha sentido cansado(a) o con poca energía',
                'responseOptions', JSON_ARRAY(
                    JSON_OBJECT('value', '0', 'label', 'Para nada', 'score', 0),
                    JSON_OBJECT('value', '1', 'label', 'Varios días', 'score', 1),
                    JSON_OBJECT('value', '2', 'label', 'Más de la mitad de los días', 'score', 2),
                    JSON_OBJECT('value', '3', 'label', 'Casi todos los días', 'score', 3)
                )
            ),
            JSON_OBJECT(
                'id', 'phq9_5',
                'number', 5,
                'text', 'Falta de apetito o comer en exceso',
                'responseOptions', JSON_ARRAY(
                    JSON_OBJECT('value', '0', 'label', 'Para nada', 'score', 0),
                    JSON_OBJECT('value', '1', 'label', 'Varios días', 'score', 1),
                    JSON_OBJECT('value', '2', 'label', 'Más de la mitad de los días', 'score', 2),
                    JSON_OBJECT('value', '3', 'label', 'Casi todos los días', 'score', 3)
                )
            ),
            JSON_OBJECT(
                'id', 'phq9_6',
                'number', 6,
                'text', 'Se ha sentido mal con usted mismo(a) o que es un fracaso o que ha quedado mal con usted mismo(a) o con su familia',
                'responseOptions', JSON_ARRAY(
                    JSON_OBJECT('value', '0', 'label', 'Para nada', 'score', 0),
                    JSON_OBJECT('value', '1', 'label', 'Varios días', 'score', 1),
                    JSON_OBJECT('value', '2', 'label', 'Más de la mitad de los días', 'score', 2),
                    JSON_OBJECT('value', '3', 'label', 'Casi todos los días', 'score', 3)
                )
            ),
            JSON_OBJECT(
                'id', 'phq9_7',
                'number', 7,
                'text', 'Dificultades para concentrarse en cosas, tales como leer el periódico o ver la televisión',
                'responseOptions', JSON_ARRAY(
                    JSON_OBJECT('value', '0', 'label', 'Para nada', 'score', 0),
                    JSON_OBJECT('value', '1', 'label', 'Varios días', 'score', 1),
                    JSON_OBJECT('value', '2', 'label', 'Más de la mitad de los días', 'score', 2),
                    JSON_OBJECT('value', '3', 'label', 'Casi todos los días', 'score', 3)
                )
            ),
            JSON_OBJECT(
                'id', 'phq9_8',
                'number', 8,
                'text', '¿Se ha movido o hablado tan lento que otras personas podrían haberlo notado? o lo contrario; muy inquieto(a) o agitado(a), que ha estado moviéndose mucho más de lo normal',
                'responseOptions', JSON_ARRAY(
                    JSON_OBJECT('value', '0', 'label', 'Para nada', 'score', 0),
                    JSON_OBJECT('value', '1', 'label', 'Varios días', 'score', 1),
                    JSON_OBJECT('value', '2', 'label', 'Más de la mitad de los días', 'score', 2),
                    JSON_OBJECT('value', '3', 'label', 'Casi todos los días', 'score', 3)
                )
            ),
            JSON_OBJECT(
                'id', 'phq9_9',
                'number', 9,
                'text', 'Pensamientos de que estaría mejor muerto(a) o de lastimarse de alguna manera',
                'responseOptions', JSON_ARRAY(
                    JSON_OBJECT('value', '0', 'label', 'Para nada', 'score', 0),
                    JSON_OBJECT('value', '1', 'label', 'Varios días', 'score', 1),
                    JSON_OBJECT('value', '2', 'label', 'Más de la mitad de los días', 'score', 2),
                    JSON_OBJECT('value', '3', 'label', 'Casi todos los días', 'score', 3)
                ),
                'alertTrigger', true,
                'alertCondition', 'score > 0'
            )
        ),
        'interpretationRules', JSON_ARRAY(
            JSON_OBJECT('minScore', 0, 'maxScore', 4, 'severity', 'minimal', 'label', 'Depresión mínima', 'color', '#48bb78'),
            JSON_OBJECT('minScore', 5, 'maxScore', 9, 'severity', 'mild', 'label', 'Depresión leve', 'color', '#f6ad55'),
            JSON_OBJECT('minScore', 10, 'maxScore', 14, 'severity', 'moderate', 'label', 'Depresión moderada', 'color', '#ed8936'),
            JSON_OBJECT('minScore', 15, 'maxScore', 19, 'severity', 'moderate_severe', 'label', 'Depresión moderada-severa', 'color', '#e53e3e'),
            JSON_OBJECT('minScore', 20, 'maxScore', 27, 'severity', 'severe', 'label', 'Depresión severa', 'color', '#c53030')
        )
    )
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- GADI: Generalized Anxiety Disorder Inventory  
INSERT INTO clinical_scales (
    id, name, abbreviation, version, category, subcategory,
    estimated_duration_minutes, administration_mode, validation_level,
    clinical_purpose, target_population,
    definition
) VALUES (
    'gadi',
    'Generalized Anxiety Disorder Inventory',
    'GADI',
    '1.0',
    'anxiety',
    'Generalized Anxiety',
    10,
    'self_administered',
    'validated',
    'Evaluación de síntomas de ansiedad generalizada en las últimas dos semanas',
    'Adolescentes y adultos (16+ años)',
    JSON_OBJECT(
        'totalItems', 22,
        'responseType', 'likert',
        'scoringMethod', 'subscales',
        'scoreRange', JSON_OBJECT('min', 0, 'max', 88),
        'subscales', JSON_ARRAY(
            JSON_OBJECT('id', 'cognitive', 'name', 'Síntomas Cognitivos', 'items', JSON_ARRAY(1,3,8,10,11,17,18,19,21)),
            JSON_OBJECT('id', 'somatic', 'name', 'Síntomas Somáticos', 'items', JSON_ARRAY(2,4,5,7,9,12,13,15,16,20,22)),
            JSON_OBJECT('id', 'sleep', 'name', 'Alteraciones del Sueño', 'items', JSON_ARRAY(6,14))
        ),
        'items', JSON_ARRAY(
            JSON_OBJECT('id', 'gadi_1', 'number', 1, 'text', 'Estoy ansioso/a la mayoría de los días', 'subscale', 'cognitive'),
            JSON_OBJECT('id', 'gadi_2', 'number', 2, 'text', 'Me canso fácilmente', 'subscale', 'somatic'),
            JSON_OBJECT('id', 'gadi_3', 'number', 3, 'text', 'Me preocupo por los acontecimientos cotidianos', 'subscale', 'cognitive'),
            JSON_OBJECT('id', 'gadi_4', 'number', 4, 'text', 'Encuentro dificultad para relajarme', 'subscale', 'somatic'),
            JSON_OBJECT('id', 'gadi_5', 'number', 5, 'text', 'Me siento «al límite»', 'subscale', 'somatic'),
            JSON_OBJECT('id', 'gadi_6', 'number', 6, 'text', 'Me despierto por la noche', 'subscale', 'sleep'),
            JSON_OBJECT('id', 'gadi_7', 'number', 7, 'text', 'Experimento sofocos o escalofríos', 'subscale', 'somatic'),
            JSON_OBJECT('id', 'gadi_8', 'number', 8, 'text', 'Tengo malestar por mi ansiedad', 'subscale', 'cognitive'),
            JSON_OBJECT('id', 'gadi_9', 'number', 9, 'text', 'Tengo la boca seca', 'subscale', 'somatic'),
            JSON_OBJECT('id', 'gadi_10', 'number', 10, 'text', 'Temo perder el control, desmayarme o volverme loco/a', 'subscale', 'cognitive'),
            JSON_OBJECT('id', 'gadi_11', 'number', 11, 'text', 'Estoy molesto/a por la inquietud', 'subscale', 'cognitive'),
            JSON_OBJECT('id', 'gadi_12', 'number', 12, 'text', 'Sufro mareos', 'subscale', 'somatic'),
            JSON_OBJECT('id', 'gadi_13', 'number', 13, 'text', 'Estoy molesto/a por tener temblores y sacudidas', 'subscale', 'somatic'),
            JSON_OBJECT('id', 'gadi_14', 'number', 14, 'text', 'Tengo dificultad para coger el sueño', 'subscale', 'sleep'),
            JSON_OBJECT('id', 'gadi_15', 'number', 15, 'text', 'Sufro por la tensión o dolor de los músculos', 'subscale', 'somatic'),
            JSON_OBJECT('id', 'gadi_16', 'number', 16, 'text', 'Estoy molesto/a por la dificultad con la respiración', 'subscale', 'somatic'),
            JSON_OBJECT('id', 'gadi_17', 'number', 17, 'text', 'Me asusto fácilmente', 'subscale', 'cognitive'),
            JSON_OBJECT('id', 'gadi_18', 'number', 18, 'text', 'Tengo dificultad para concentrarme', 'subscale', 'cognitive'),
            JSON_OBJECT('id', 'gadi_19', 'number', 19, 'text', 'Tengo dificultad para controlar mi ansiedad', 'subscale', 'cognitive'),
            JSON_OBJECT('id', 'gadi_20', 'number', 20, 'text', 'Estoy molesto/a por hormigueos o insensibilidad en las manos', 'subscale', 'somatic'),
            JSON_OBJECT('id', 'gadi_21', 'number', 21, 'text', 'Me preocupo excesivamente', 'subscale', 'cognitive'),
            JSON_OBJECT('id', 'gadi_22', 'number', 22, 'text', 'Estoy irritable', 'subscale', 'somatic')
        ),
        'responseOptions', JSON_ARRAY(
            JSON_OBJECT('value', '0', 'label', 'En absoluto o no ha ocurrido', 'score', 0),
            JSON_OBJECT('value', '1', 'label', 'Un poco', 'score', 1),
            JSON_OBJECT('value', '2', 'label', 'Algo', 'score', 2),
            JSON_OBJECT('value', '3', 'label', 'Mucho', 'score', 3),
            JSON_OBJECT('value', '4', 'label', 'Extremadamente', 'score', 4)
        ),
        'interpretationRules', JSON_ARRAY(
            JSON_OBJECT('minScore', 0, 'maxScore', 12, 'severity', 'minimal', 'label', 'Ansiedad mínima', 'color', '#48bb78'),
            JSON_OBJECT('minScore', 13, 'maxScore', 22, 'severity', 'mild', 'label', 'Ansiedad leve', 'color', '#f6ad55'),
            JSON_OBJECT('minScore', 23, 'maxScore', 34, 'severity', 'moderate', 'label', 'Ansiedad moderada', 'color', '#ed8936'),
            JSON_OBJECT('minScore', 35, 'maxScore', 88, 'severity', 'severe', 'label', 'Ansiedad severa', 'color', '#f56565')
        )
    )
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;