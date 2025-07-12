-- =============================================================================
-- CLINIMETRIX SCHEMA - Clinical Assessment System
-- Standardized psychological and psychiatric assessments
-- =============================================================================

-- Set schema
SET search_path TO clinimetrix, expedix, auth, audit, public;

-- =============================================================================
-- ASSESSMENT SCALES AND INSTRUMENTS
-- =============================================================================

-- Catalog of available assessment scales
CREATE TABLE clinimetrix.assessment_scales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Scale identification
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(50) UNIQUE NOT NULL,
    version VARCHAR(20),
    
    -- Scale details
    description TEXT,
    purpose TEXT,
    target_population VARCHAR(100), -- 'adults', 'children', 'adolescents', 'elderly', 'all'
    
    -- Administration details
    administration_mode VARCHAR(50) NOT NULL, -- 'self_report', 'clinician_administered', 'both'
    estimated_duration_minutes INTEGER,
    requires_training BOOLEAN DEFAULT FALSE,
    training_level_required VARCHAR(50), -- 'basic', 'advanced', 'specialist'
    
    -- Scoring information
    scoring_method VARCHAR(50), -- 'sum', 'weighted', 'algorithm', 'manual'
    score_range_min INTEGER,
    score_range_max INTEGER,
    has_subscales BOOLEAN DEFAULT FALSE,
    
    -- Psychometric properties
    reliability_coefficient DECIMAL(3,2), -- Cronbach's alpha or similar
    validity_evidence TEXT,
    normative_data_available BOOLEAN DEFAULT FALSE,
    
    -- Categories and tags
    category VARCHAR(100), -- 'depression', 'anxiety', 'personality', 'cognitive', etc.
    subcategory VARCHAR(100),
    tags TEXT[], -- flexible tagging system
    
    -- Language and localization
    available_languages TEXT[] DEFAULT ARRAY['es', 'en'],
    culturally_adapted BOOLEAN DEFAULT FALSE,
    adaptation_population VARCHAR(100), -- 'mexican', 'latin_american', etc.
    
    -- Legal and ethical
    copyright_holder VARCHAR(255),
    license_type VARCHAR(50), -- 'public_domain', 'licensed', 'proprietary'
    requires_permission BOOLEAN DEFAULT FALSE,
    cost_per_use DECIMAL(10,2),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_validated BOOLEAN DEFAULT FALSE,
    
    -- References
    primary_reference TEXT,
    additional_references TEXT[],
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_administration_mode CHECK (administration_mode IN ('self_report', 'clinician_administered', 'both')),
    CONSTRAINT valid_target_population CHECK (target_population IN ('adults', 'children', 'adolescents', 'elderly', 'all', 'specific')),
    CONSTRAINT valid_scoring_method CHECK (scoring_method IN ('sum', 'weighted', 'algorithm', 'manual', 'lookup_table')),
    CONSTRAINT valid_license_type CHECK (license_type IN ('public_domain', 'licensed', 'proprietary', 'creative_commons'))
);

-- Scale items/questions
CREATE TABLE clinimetrix.scale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scale_id UUID REFERENCES clinimetrix.assessment_scales(id) ON DELETE CASCADE NOT NULL,
    
    -- Item identification
    item_number INTEGER NOT NULL,
    item_code VARCHAR(50), -- unique identifier within scale
    subscale VARCHAR(100), -- if scale has subscales
    
    -- Item content
    question_text TEXT NOT NULL,
    question_text_en TEXT, -- English version
    instruction_text TEXT,
    
    -- Response format
    response_type VARCHAR(50) NOT NULL, -- 'likert', 'yes_no', 'multiple_choice', 'text', 'numeric'
    response_options JSONB, -- JSON array of response options
    required BOOLEAN DEFAULT TRUE,
    
    -- Scoring
    scoring_weight DECIMAL(5,2) DEFAULT 1.0,
    reverse_scored BOOLEAN DEFAULT FALSE,
    scoring_rules JSONB, -- complex scoring rules in JSON format
    
    -- Display order and formatting
    display_order INTEGER,
    display_format VARCHAR(50) DEFAULT 'standard', -- 'standard', 'grid', 'slider', 'visual_analog'
    
    -- Validation rules
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    validation_pattern VARCHAR(255), -- regex pattern for text responses
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(scale_id, item_number),
    CONSTRAINT valid_response_type CHECK (response_type IN ('likert', 'yes_no', 'multiple_choice', 'text', 'numeric', 'visual_analog', 'checklist')),
    CONSTRAINT valid_display_format CHECK (display_format IN ('standard', 'grid', 'slider', 'visual_analog', 'card'))
);

-- =============================================================================
-- ASSESSMENT SESSIONS AND ADMINISTRATION
-- =============================================================================

-- Assessment sessions (a patient completing one or more scales)
CREATE TABLE clinimetrix.assessment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES expedix.patients(id) ON DELETE CASCADE NOT NULL,
    
    -- Session details
    session_name VARCHAR(255),
    session_date TIMESTAMPTZ DEFAULT NOW(),
    session_type VARCHAR(50) DEFAULT 'routine', -- 'initial', 'routine', 'follow_up', 'research'
    
    -- Administration context
    administered_by UUID REFERENCES auth.users(id) NOT NULL,
    administration_mode VARCHAR(50) NOT NULL, -- 'in_person', 'remote', 'self_administered'
    location VARCHAR(100), -- 'clinic', 'home', 'hospital', 'online'
    
    -- Session status
    status VARCHAR(20) DEFAULT 'in_progress', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'incomplete'
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN started_at IS NOT NULL AND completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (completed_at - started_at))/60
            ELSE NULL 
        END
    ) STORED,
    
    -- Session notes
    pre_session_notes TEXT,
    post_session_notes TEXT,
    environmental_factors TEXT, -- factors that might affect results
    
    -- Quality indicators
    completion_rate DECIMAL(5,2), -- percentage of items completed
    response_quality VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
    validity_concerns TEXT,
    
    -- Follow-up
    recommendations TEXT,
    next_assessment_recommended BOOLEAN DEFAULT FALSE,
    next_assessment_timeframe VARCHAR(50),
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_session_type CHECK (session_type IN ('initial', 'routine', 'follow_up', 'research', 'screening')),
    CONSTRAINT valid_administration_mode CHECK (administration_mode IN ('in_person', 'remote', 'self_administered', 'hybrid')),
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'incomplete')),
    CONSTRAINT valid_response_quality CHECK (response_quality IN ('excellent', 'good', 'fair', 'poor', 'questionable'))
);

-- Individual scale administrations within a session
CREATE TABLE clinimetrix.scale_administrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES clinimetrix.assessment_sessions(id) ON DELETE CASCADE NOT NULL,
    scale_id UUID REFERENCES clinimetrix.assessment_scales(id) NOT NULL,
    
    -- Administration details
    order_in_session INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Completion status
    status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'abandoned'
    items_completed INTEGER DEFAULT 0,
    total_items INTEGER,
    completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_items > 0 THEN (items_completed::DECIMAL / total_items) * 100
            ELSE 0 
        END
    ) STORED,
    
    -- Scoring results
    raw_score DECIMAL(10,2),
    scaled_score DECIMAL(10,2),
    percentile_rank INTEGER,
    t_score DECIMAL(5,2),
    z_score DECIMAL(5,2),
    clinical_range VARCHAR(50), -- 'normal', 'mild', 'moderate', 'severe', 'clinical'
    
    -- Subscale scores (if applicable)
    subscale_scores JSONB, -- {subscale_name: score, ...}
    
    -- Interpretation
    interpretation TEXT,
    clinical_significance VARCHAR(50), -- 'not_significant', 'significant', 'highly_significant'
    reliability_estimate DECIMAL(3,2),
    
    -- Administration notes
    administration_notes TEXT,
    scoring_notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_admin_status CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
    CONSTRAINT valid_clinical_range CHECK (clinical_range IN ('normal', 'borderline', 'mild', 'moderate', 'severe', 'clinical', 'subclinical')),
    CONSTRAINT valid_clinical_significance CHECK (clinical_significance IN ('not_significant', 'significant', 'highly_significant', 'unknown'))
);

-- Individual item responses
CREATE TABLE clinimetrix.item_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    administration_id UUID REFERENCES clinimetrix.scale_administrations(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES clinimetrix.scale_items(id) NOT NULL,
    
    -- Response data
    response_value TEXT, -- stored as text to handle all response types
    response_numeric DECIMAL(10,2), -- numeric conversion for scoring
    response_time_seconds INTEGER, -- time to respond (for digital administration)
    
    -- Response metadata
    response_date TIMESTAMPTZ DEFAULT NOW(),
    was_skipped BOOLEAN DEFAULT FALSE,
    skip_reason VARCHAR(100), -- 'not_applicable', 'refused', 'unclear', etc.
    
    -- Quality indicators
    response_confidence VARCHAR(20), -- for self-report measures
    clarification_needed BOOLEAN DEFAULT FALSE,
    clarification_notes TEXT,
    
    UNIQUE(administration_id, item_id),
    CONSTRAINT valid_skip_reason CHECK (skip_reason IN ('not_applicable', 'refused', 'unclear', 'technical_issue', 'time_limit'))
);

-- =============================================================================
-- ASSESSMENT TOKENS FOR REMOTE ADMINISTRATION
-- =============================================================================

-- Secure tokens for remote/self-administered assessments
CREATE TABLE clinimetrix.assessment_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES clinimetrix.assessment_sessions(id) ON DELETE CASCADE NOT NULL,
    
    -- Token details
    token VARCHAR(255) UNIQUE NOT NULL,
    token_hash VARCHAR(255) NOT NULL, -- hashed version for security
    
    -- Access control
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER DEFAULT 1,
    uses_count INTEGER DEFAULT 0,
    
    -- Access restrictions
    allowed_ip_addresses INET[],
    allowed_user_agents TEXT[],
    
    -- Security settings
    requires_authentication BOOLEAN DEFAULT FALSE,
    patient_verification_required BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    first_accessed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    
    CONSTRAINT positive_max_uses CHECK (max_uses > 0),
    CONSTRAINT valid_uses_count CHECK (uses_count >= 0 AND uses_count <= max_uses)
);

-- =============================================================================
-- REPORTS AND INTERPRETATIONS
-- =============================================================================

-- Assessment reports
CREATE TABLE clinimetrix.assessment_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES clinimetrix.assessment_sessions(id) ON DELETE CASCADE NOT NULL,
    
    -- Report details
    report_type VARCHAR(50) NOT NULL, -- 'summary', 'detailed', 'comparison', 'progress'
    report_title VARCHAR(255),
    
    -- Content
    executive_summary TEXT,
    detailed_findings TEXT,
    recommendations TEXT,
    clinical_impressions TEXT,
    
    -- Report metadata
    generated_by UUID REFERENCES auth.users(id) NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Report format and distribution
    report_format VARCHAR(20) DEFAULT 'pdf', -- 'pdf', 'html', 'docx'
    confidentiality_level VARCHAR(20) DEFAULT 'standard', -- 'public', 'standard', 'confidential', 'restricted'
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'final', 'archived'
    is_finalized BOOLEAN DEFAULT FALSE,
    finalized_at TIMESTAMPTZ,
    
    -- Distribution tracking
    sent_to_patient BOOLEAN DEFAULT FALSE,
    sent_to_referring_provider BOOLEAN DEFAULT FALSE,
    distribution_log JSONB, -- tracking who received the report and when
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_report_type CHECK (report_type IN ('summary', 'detailed', 'comparison', 'progress', 'research')),
    CONSTRAINT valid_report_format CHECK (report_format IN ('pdf', 'html', 'docx', 'txt')),
    CONSTRAINT valid_confidentiality CHECK (confidentiality_level IN ('public', 'standard', 'confidential', 'restricted')),
    CONSTRAINT valid_report_status CHECK (status IN ('draft', 'final', 'archived', 'cancelled'))
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Assessment scales indexes
CREATE INDEX idx_assessment_scales_category ON clinimetrix.assessment_scales(category);
CREATE INDEX idx_assessment_scales_active ON clinimetrix.assessment_scales(is_active);
CREATE INDEX idx_assessment_scales_abbreviation ON clinimetrix.assessment_scales(abbreviation);

-- Scale items indexes
CREATE INDEX idx_scale_items_scale_id ON clinimetrix.scale_items(scale_id);
CREATE INDEX idx_scale_items_display_order ON clinimetrix.scale_items(scale_id, display_order);

-- Assessment sessions indexes
CREATE INDEX idx_assessment_sessions_patient_id ON clinimetrix.assessment_sessions(patient_id);
CREATE INDEX idx_assessment_sessions_date ON clinimetrix.assessment_sessions(session_date);
CREATE INDEX idx_assessment_sessions_status ON clinimetrix.assessment_sessions(status);
CREATE INDEX idx_assessment_sessions_administered_by ON clinimetrix.assessment_sessions(administered_by);

-- Scale administrations indexes
CREATE INDEX idx_scale_administrations_session_id ON clinimetrix.scale_administrations(session_id);
CREATE INDEX idx_scale_administrations_scale_id ON clinimetrix.scale_administrations(scale_id);
CREATE INDEX idx_scale_administrations_status ON clinimetrix.scale_administrations(status);

-- Item responses indexes
CREATE INDEX idx_item_responses_administration_id ON clinimetrix.item_responses(administration_id);
CREATE INDEX idx_item_responses_item_id ON clinimetrix.item_responses(item_id);

-- Assessment tokens indexes
CREATE INDEX idx_assessment_tokens_token_hash ON clinimetrix.assessment_tokens(token_hash);
CREATE INDEX idx_assessment_tokens_expires_at ON clinimetrix.assessment_tokens(expires_at);
CREATE INDEX idx_assessment_tokens_active ON clinimetrix.assessment_tokens(is_active);

-- =============================================================================
-- AUDIT TRIGGERS
-- =============================================================================

CREATE TRIGGER audit_assessment_sessions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clinimetrix.assessment_sessions
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

CREATE TRIGGER audit_scale_administrations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clinimetrix.scale_administrations
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

CREATE TRIGGER audit_item_responses_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clinimetrix.item_responses
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Auto-update timestamps
CREATE TRIGGER update_assessment_sessions_updated_at 
    BEFORE UPDATE ON clinimetrix.assessment_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_scales_updated_at 
    BEFORE UPDATE ON clinimetrix.assessment_scales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scale_administrations_updated_at 
    BEFORE UPDATE ON clinimetrix.scale_administrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Clinimetrix schema initialized successfully';
    RAISE NOTICE 'Tables created: assessment_scales, scale_items, assessment_sessions, scale_administrations, item_responses, assessment_tokens, assessment_reports';
    RAISE NOTICE 'Support for 50+ standardized psychological assessments enabled';
END $$;