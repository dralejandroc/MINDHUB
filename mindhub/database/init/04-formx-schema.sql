-- =============================================================================
-- FORMX SCHEMA - Form Builder System
-- Drag-and-drop form construction for custom questionnaires and intake forms
-- =============================================================================

-- Set schema
SET search_path TO formx, expedix, auth, audit, public;

-- =============================================================================
-- FORM TEMPLATES AND DEFINITIONS
-- =============================================================================

-- Form templates (reusable form definitions)
CREATE TABLE formx.form_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Template details
    description TEXT,
    category VARCHAR(100), -- 'intake', 'assessment', 'survey', 'feedback', 'consent'
    subcategory VARCHAR(100),
    tags TEXT[], -- flexible tagging
    
    -- Form structure (stored as JSON)
    form_schema JSONB NOT NULL, -- Complete form definition
    form_metadata JSONB, -- Additional metadata (styling, validation rules, etc.)
    
    -- Display and behavior settings
    display_title VARCHAR(255),
    display_subtitle TEXT,
    instructions TEXT,
    thank_you_message TEXT,
    
    -- Form settings
    allow_multiple_submissions BOOLEAN DEFAULT FALSE,
    require_authentication BOOLEAN DEFAULT TRUE,
    save_progress_enabled BOOLEAN DEFAULT TRUE,
    randomize_questions BOOLEAN DEFAULT FALSE,
    show_progress_bar BOOLEAN DEFAULT TRUE,
    
    -- Timing settings
    estimated_completion_minutes INTEGER,
    time_limit_minutes INTEGER,
    auto_save_interval_seconds INTEGER DEFAULT 30,
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    requires_invitation BOOLEAN DEFAULT FALSE,
    allowed_roles TEXT[], -- which user roles can access this form
    
    -- Language and localization
    primary_language VARCHAR(10) DEFAULT 'es',
    available_languages TEXT[] DEFAULT ARRAY['es'],
    is_multilingual BOOLEAN DEFAULT FALSE,
    
    -- Status and lifecycle
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived', 'deprecated'
    published_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    
    -- Usage tracking
    total_submissions INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    average_completion_time INTEGER, -- in seconds
    
    -- Template source
    source_type VARCHAR(50) DEFAULT 'custom', -- 'custom', 'imported_pdf', 'imported_jotform', 'cloned'
    source_reference VARCHAR(255), -- reference to original source
    import_data JSONB, -- metadata from import process
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived', 'deprecated')),
    CONSTRAINT valid_category CHECK (category IN ('intake', 'assessment', 'survey', 'feedback', 'consent', 'screening', 'follow_up')),
    CONSTRAINT valid_source_type CHECK (source_type IN ('custom', 'imported_pdf', 'imported_jotform', 'cloned', 'template'))
);

-- Form field types catalog
CREATE TABLE formx.field_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Field type identification
    type_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    
    -- Field characteristics
    description TEXT,
    icon VARCHAR(50), -- icon identifier for UI
    category VARCHAR(50), -- 'input', 'selection', 'content', 'layout'
    
    -- Configuration schema
    config_schema JSONB, -- JSON schema defining valid configuration options
    default_config JSONB, -- default configuration for this field type
    
    -- Validation capabilities
    supports_validation BOOLEAN DEFAULT TRUE,
    validation_rules JSONB, -- available validation rules for this field type
    
    -- Data handling
    data_type VARCHAR(50), -- 'text', 'number', 'boolean', 'date', 'array', 'object'
    supports_multiple_values BOOLEAN DEFAULT FALSE,
    
    -- UI properties
    is_interactive BOOLEAN DEFAULT TRUE,
    requires_options BOOLEAN DEFAULT FALSE, -- like radio buttons, dropdowns
    supports_placeholder BOOLEAN DEFAULT TRUE,
    supports_help_text BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN DEFAULT FALSE, -- user-defined vs system field types
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_category CHECK (category IN ('input', 'selection', 'content', 'layout', 'special')),
    CONSTRAINT valid_data_type CHECK (data_type IN ('text', 'number', 'boolean', 'date', 'datetime', 'array', 'object', 'file'))
);

-- =============================================================================
-- FORM INSTANCES AND SUBMISSIONS
-- =============================================================================

-- Form instances (specific deployments of templates)
CREATE TABLE formx.form_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES formx.form_templates(id) NOT NULL,
    
    -- Instance identification
    instance_name VARCHAR(255),
    instance_description TEXT,
    
    -- Deployment settings
    deployment_url VARCHAR(255) UNIQUE, -- if deployed as standalone form
    embed_code TEXT, -- for embedding in other applications
    
    -- Instance-specific overrides
    custom_settings JSONB, -- override template settings for this instance
    custom_styling JSONB, -- instance-specific styling
    
    -- Access control for this instance
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    max_submissions INTEGER,
    current_submissions INTEGER DEFAULT 0,
    
    -- Integration settings
    webhook_url TEXT, -- for real-time notifications
    email_notifications BOOLEAN DEFAULT FALSE,
    notification_emails TEXT[],
    
    -- Patient/context association
    associated_patient_id UUID REFERENCES expedix.patients(id),
    clinical_context VARCHAR(100), -- 'intake', 'follow_up', 'assessment', etc.
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Form submissions
CREATE TABLE formx.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID REFERENCES formx.form_instances(id) NOT NULL,
    
    -- Submission identification
    submission_token VARCHAR(255) UNIQUE NOT NULL, -- public identifier
    
    -- Respondent information
    respondent_type VARCHAR(50) DEFAULT 'patient', -- 'patient', 'caregiver', 'provider', 'anonymous'
    patient_id UUID REFERENCES expedix.patients(id),
    respondent_name VARCHAR(255),
    respondent_email VARCHAR(255),
    
    -- Submission data
    form_data JSONB NOT NULL, -- complete form responses
    raw_data JSONB, -- unprocessed submission data
    
    -- Submission metadata
    ip_address INET,
    user_agent TEXT,
    browser_info JSONB,
    device_info JSONB,
    
    -- Timing information
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    last_saved_at TIMESTAMPTZ,
    time_spent_seconds INTEGER,
    
    -- Status and quality
    status VARCHAR(20) DEFAULT 'completed', -- 'draft', 'in_progress', 'completed', 'abandoned', 'invalid'
    completion_percentage DECIMAL(5,2),
    is_complete BOOLEAN DEFAULT FALSE,
    
    -- Validation results
    validation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'valid', 'invalid', 'needs_review'
    validation_errors JSONB, -- field-level validation errors
    data_quality_score DECIMAL(3,2), -- overall data quality score (0-1)
    
    -- Review and processing
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Integration status
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    processing_errors JSONB,
    external_references JSONB, -- references to external systems
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_respondent_type CHECK (respondent_type IN ('patient', 'caregiver', 'provider', 'guardian', 'anonymous', 'other')),
    CONSTRAINT valid_submission_status CHECK (status IN ('draft', 'in_progress', 'completed', 'abandoned', 'invalid')),
    CONSTRAINT valid_validation_status CHECK (validation_status IN ('pending', 'valid', 'invalid', 'needs_review'))
);

-- Individual field responses within submissions
CREATE TABLE formx.field_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES formx.form_submissions(id) ON DELETE CASCADE NOT NULL,
    
    -- Field identification
    field_id VARCHAR(100) NOT NULL, -- field identifier from form schema
    field_type VARCHAR(50) NOT NULL,
    field_label VARCHAR(255),
    
    -- Response data
    response_value TEXT, -- primary response value
    response_data JSONB, -- complex responses (arrays, objects)
    response_numeric DECIMAL(15,4), -- numeric interpretation of response
    
    -- Response metadata
    response_order INTEGER, -- order in which fields were completed
    response_time_seconds INTEGER, -- time spent on this field
    was_skipped BOOLEAN DEFAULT FALSE,
    skip_reason VARCHAR(100),
    
    -- Validation for this field
    is_valid BOOLEAN DEFAULT TRUE,
    validation_errors TEXT[],
    
    -- Field-specific settings
    field_config JSONB, -- snapshot of field configuration at time of response
    
    UNIQUE(submission_id, field_id)
);

-- =============================================================================
-- FORM SHARING AND ACCESS TOKENS
-- =============================================================================

-- Secure access tokens for form sharing
CREATE TABLE formx.form_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID REFERENCES formx.form_instances(id) ON DELETE CASCADE NOT NULL,
    
    -- Token details
    token VARCHAR(255) UNIQUE NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    token_type VARCHAR(50) DEFAULT 'single_use', -- 'single_use', 'multiple_use', 'time_limited'
    
    -- Access control
    expires_at TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 1,
    uses_count INTEGER DEFAULT 0,
    
    -- Restrictions
    allowed_ip_addresses INET[],
    patient_verification_required BOOLEAN DEFAULT FALSE,
    
    -- Associated context
    intended_patient_id UUID REFERENCES expedix.patients(id),
    intended_respondent_email VARCHAR(255),
    distribution_method VARCHAR(50), -- 'email', 'sms', 'direct_link', 'qr_code'
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    first_used_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    
    CONSTRAINT valid_token_type CHECK (token_type IN ('single_use', 'multiple_use', 'time_limited', 'unlimited')),
    CONSTRAINT valid_distribution_method CHECK (distribution_method IN ('email', 'sms', 'direct_link', 'qr_code', 'embedded'))
);

-- =============================================================================
-- FORM ANALYTICS AND REPORTING
-- =============================================================================

-- Form analytics and usage statistics
CREATE TABLE formx.form_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID REFERENCES formx.form_instances(id) NOT NULL,
    
    -- Time period
    analysis_date DATE DEFAULT CURRENT_DATE,
    period_type VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
    
    -- Submission metrics
    total_views INTEGER DEFAULT 0,
    total_starts INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    
    -- Completion metrics
    completion_rate DECIMAL(5,2),
    abandonment_rate DECIMAL(5,2),
    average_time_to_complete INTEGER, -- in seconds
    
    -- Field-level analytics
    field_analytics JSONB, -- per-field completion rates, time spent, etc.
    
    -- Quality metrics
    validation_error_rate DECIMAL(5,2),
    common_errors JSONB, -- most frequent validation errors
    
    -- User behavior
    device_breakdown JSONB, -- mobile vs desktop usage
    browser_breakdown JSONB,
    peak_usage_hours INTEGER[], -- hours of day with most activity
    
    -- Geographic data (if available)
    geographic_breakdown JSONB,
    
    -- Audit fields
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(instance_id, analysis_date, period_type),
    CONSTRAINT valid_period_type CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly'))
);

-- =============================================================================
-- FORM IMPORT/EXPORT FUNCTIONALITY
-- =============================================================================

-- Import jobs for external forms (PDF, JotForm, etc.)
CREATE TABLE formx.import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Import details
    source_type VARCHAR(50) NOT NULL, -- 'pdf', 'jotform', 'typeform', 'google_forms'
    source_file_url TEXT,
    source_identifier VARCHAR(255), -- external form ID
    
    -- Import configuration
    import_settings JSONB, -- source-specific import settings
    mapping_rules JSONB, -- field mapping rules
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    progress_percentage INTEGER DEFAULT 0,
    
    -- Results
    created_template_id UUID REFERENCES formx.form_templates(id),
    import_log JSONB, -- detailed import process log
    errors JSONB, -- import errors and warnings
    
    -- Processing metadata
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_time_seconds INTEGER,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    
    CONSTRAINT valid_import_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    CONSTRAINT valid_source_type CHECK (source_type IN ('pdf', 'jotform', 'typeform', 'google_forms', 'survey_monkey', 'microsoft_forms'))
);

-- Export jobs for sharing forms
CREATE TABLE formx.export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES formx.form_templates(id) NOT NULL,
    
    -- Export details
    export_format VARCHAR(50) NOT NULL, -- 'pdf', 'html', 'json', 'csv', 'docx'
    export_type VARCHAR(50) DEFAULT 'template', -- 'template', 'responses', 'analytics'
    
    -- Export configuration
    export_settings JSONB,
    include_responses BOOLEAN DEFAULT FALSE,
    date_range_start TIMESTAMPTZ,
    date_range_end TIMESTAMPTZ,
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'pending',
    progress_percentage INTEGER DEFAULT 0,
    
    -- Results
    output_file_url TEXT,
    file_size_bytes BIGINT,
    
    -- Processing metadata
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- when download link expires
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    
    CONSTRAINT valid_export_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    CONSTRAINT valid_export_format CHECK (export_format IN ('pdf', 'html', 'json', 'csv', 'docx', 'excel')),
    CONSTRAINT valid_export_type CHECK (export_type IN ('template', 'responses', 'analytics', 'summary'))
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Form templates indexes
CREATE INDEX idx_form_templates_category ON formx.form_templates(category);
CREATE INDEX idx_form_templates_status ON formx.form_templates(status);
CREATE INDEX idx_form_templates_created_by ON formx.form_templates(created_by);
CREATE INDEX idx_form_templates_slug ON formx.form_templates(slug);

-- Form instances indexes
CREATE INDEX idx_form_instances_template_id ON formx.form_instances(template_id);
CREATE INDEX idx_form_instances_active ON formx.form_instances(is_active);
CREATE INDEX idx_form_instances_patient ON formx.form_instances(associated_patient_id);

-- Form submissions indexes
CREATE INDEX idx_form_submissions_instance_id ON formx.form_submissions(instance_id);
CREATE INDEX idx_form_submissions_patient_id ON formx.form_submissions(patient_id);
CREATE INDEX idx_form_submissions_status ON formx.form_submissions(status);
CREATE INDEX idx_form_submissions_submitted_at ON formx.form_submissions(submitted_at);
CREATE INDEX idx_form_submissions_token ON formx.form_submissions(submission_token);

-- Field responses indexes
CREATE INDEX idx_field_responses_submission_id ON formx.field_responses(submission_id);
CREATE INDEX idx_field_responses_field_id ON formx.field_responses(submission_id, field_id);

-- Access tokens indexes
CREATE INDEX idx_form_access_tokens_token_hash ON formx.form_access_tokens(token_hash);
CREATE INDEX idx_form_access_tokens_expires_at ON formx.form_access_tokens(expires_at);
CREATE INDEX idx_form_access_tokens_active ON formx.form_access_tokens(is_active);

-- Full-text search indexes
CREATE INDEX idx_form_templates_fulltext ON formx.form_templates USING gin(
    to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(display_title, ''))
);

-- =============================================================================
-- AUDIT TRIGGERS
-- =============================================================================

CREATE TRIGGER audit_form_templates_trigger
    AFTER INSERT OR UPDATE OR DELETE ON formx.form_templates
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

CREATE TRIGGER audit_form_submissions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON formx.form_submissions
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Auto-update timestamps
CREATE TRIGGER update_form_templates_updated_at 
    BEFORE UPDATE ON formx.form_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_instances_updated_at 
    BEFORE UPDATE ON formx.form_instances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_submissions_updated_at 
    BEFORE UPDATE ON formx.form_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Formx schema initialized successfully';
    RAISE NOTICE 'Tables created: form_templates, field_types, form_instances, form_submissions, field_responses, form_access_tokens, form_analytics, import_jobs, export_jobs';
    RAISE NOTICE 'Support for PDF import, drag-and-drop form builder, and secure form distribution enabled';
END $$;