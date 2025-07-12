-- =============================================================================
-- RESOURCES SCHEMA - Psychoeducational Library
-- Curated materials for patient education and therapeutic resources
-- =============================================================================

-- Set schema
SET search_path TO resources, expedix, auth, audit, public;

-- =============================================================================
-- RESOURCE CATEGORIES AND CLASSIFICATION
-- =============================================================================

-- Resource categories for organization
CREATE TABLE resources.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Category identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES resources.categories(id),
    
    -- Category details
    description TEXT,
    icon VARCHAR(50), -- icon identifier for UI
    color VARCHAR(7) DEFAULT '#6b7280', -- hex color for visual organization
    
    -- Display order and hierarchy
    display_order INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0, -- hierarchy level (0 = root, 1 = subcategory, etc.)
    path VARCHAR(500), -- materialized path for efficient queries
    
    -- Category metadata
    is_active BOOLEAN DEFAULT TRUE,
    requires_professional_access BOOLEAN DEFAULT FALSE, -- restricted categories
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Tags for flexible resource classification
CREATE TABLE resources.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Tag identification
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Tag details
    description TEXT,
    color VARCHAR(7) DEFAULT '#6b7280',
    
    -- Tag metadata
    tag_type VARCHAR(50) DEFAULT 'general', -- 'general', 'condition', 'age_group', 'therapy_type', 'format'
    usage_count INTEGER DEFAULT 0,
    is_suggested BOOLEAN DEFAULT FALSE, -- appears in suggestion list
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    
    CONSTRAINT valid_tag_type CHECK (tag_type IN ('general', 'condition', 'age_group', 'therapy_type', 'format', 'audience', 'complexity'))
);

-- =============================================================================
-- RESOURCE MANAGEMENT
-- =============================================================================

-- Main resources table
CREATE TABLE resources.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Resource identification
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    subtitle VARCHAR(500),
    
    -- Content details
    description TEXT,
    summary TEXT, -- brief summary for listings
    content TEXT, -- main content (for text-based resources)
    
    -- Resource metadata
    resource_type VARCHAR(50) NOT NULL, -- 'document', 'video', 'audio', 'interactive', 'link', 'toolkit'
    format VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'mp4', 'mp3', 'html', 'url', 'image'
    language VARCHAR(10) DEFAULT 'es',
    
    -- Target audience
    target_audience VARCHAR(100), -- 'patients', 'families', 'caregivers', 'professionals', 'all'
    age_group VARCHAR(50), -- 'children', 'adolescents', 'adults', 'elderly', 'all'
    education_level VARCHAR(50), -- 'basic', 'intermediate', 'advanced', 'professional'
    
    -- Clinical information
    clinical_conditions TEXT[], -- conditions this resource addresses
    therapeutic_approaches TEXT[], -- therapy types this supports
    intervention_stage VARCHAR(50), -- 'prevention', 'early_intervention', 'treatment', 'maintenance', 'relapse_prevention'
    
    -- Content details
    estimated_reading_time INTEGER, -- in minutes
    estimated_completion_time INTEGER, -- for interactive resources
    difficulty_level VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
    
    -- File information
    file_url TEXT, -- storage URL for file-based resources
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    file_mime_type VARCHAR(100),
    thumbnail_url TEXT,
    
    -- External resource information
    external_url TEXT, -- for link-type resources
    external_source VARCHAR(255), -- source organization/website
    
    -- Versioning
    version VARCHAR(20) DEFAULT '1.0',
    version_notes TEXT,
    is_latest_version BOOLEAN DEFAULT TRUE,
    superseded_by UUID REFERENCES resources.resources(id),
    
    -- Access control
    access_level VARCHAR(50) DEFAULT 'public', -- 'public', 'restricted', 'professional_only', 'internal'
    requires_consent BOOLEAN DEFAULT FALSE, -- patient consent required
    age_restriction INTEGER, -- minimum age requirement
    
    -- Quality and validation
    is_evidence_based BOOLEAN DEFAULT FALSE,
    evidence_level VARCHAR(50), -- 'high', 'moderate', 'low', 'expert_opinion'
    review_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_revision'
    
    -- Publishing information
    author VARCHAR(255),
    contributor VARCHAR(255),
    publisher VARCHAR(255),
    publication_date DATE,
    last_reviewed_date DATE,
    next_review_date DATE,
    
    -- Usage tracking
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived', 'deprecated'
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMPTZ,
    
    -- SEO and discovery
    keywords TEXT[], -- for search optimization
    meta_description TEXT,
    
    -- Copyright and licensing
    copyright_holder VARCHAR(255),
    license_type VARCHAR(100), -- 'creative_commons', 'proprietary', 'public_domain', 'fair_use'
    license_details TEXT,
    attribution_required BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_resource_type CHECK (resource_type IN ('document', 'video', 'audio', 'interactive', 'link', 'toolkit', 'image', 'infographic')),
    CONSTRAINT valid_format CHECK (format IN ('pdf', 'docx', 'txt', 'mp4', 'mp3', 'wav', 'html', 'url', 'jpg', 'png', 'svg', 'zip')),
    CONSTRAINT valid_target_audience CHECK (target_audience IN ('patients', 'families', 'caregivers', 'professionals', 'all', 'children', 'adolescents')),
    CONSTRAINT valid_age_group CHECK (age_group IN ('children', 'adolescents', 'adults', 'elderly', 'all')),
    CONSTRAINT valid_education_level CHECK (education_level IN ('basic', 'intermediate', 'advanced', 'professional')),
    CONSTRAINT valid_difficulty_level CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    CONSTRAINT valid_access_level CHECK (access_level IN ('public', 'restricted', 'professional_only', 'internal')),
    CONSTRAINT valid_evidence_level CHECK (evidence_level IN ('high', 'moderate', 'low', 'expert_opinion', 'not_applicable')),
    CONSTRAINT valid_review_status CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived', 'deprecated')),
    CONSTRAINT valid_license_type CHECK (license_type IN ('creative_commons', 'proprietary', 'public_domain', 'fair_use', 'custom'))
);

-- Resource category associations
CREATE TABLE resources.resource_categories (
    resource_id UUID REFERENCES resources.resources(id) ON DELETE CASCADE,
    category_id UUID REFERENCES resources.categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE, -- one category can be marked as primary
    
    PRIMARY KEY (resource_id, category_id)
);

-- Resource tag associations
CREATE TABLE resources.resource_tags (
    resource_id UUID REFERENCES resources.resources(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES resources.tags(id) ON DELETE CASCADE,
    
    PRIMARY KEY (resource_id, tag_id)
);

-- =============================================================================
-- RESOURCE COLLECTIONS AND PLAYLISTS
-- =============================================================================

-- Collections of related resources
CREATE TABLE resources.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Collection identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    
    -- Collection metadata
    collection_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'auto_generated', 'curated'
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Display settings
    cover_image_url TEXT,
    display_order INTEGER DEFAULT 0,
    
    -- Access control
    requires_professional_access BOOLEAN DEFAULT FALSE,
    
    -- Auto-generation rules (for auto_generated collections)
    auto_rules JSONB, -- rules for automatically including resources
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_collection_type CHECK (collection_type IN ('manual', 'auto_generated', 'curated', 'smart'))
);

-- Resources within collections
CREATE TABLE resources.collection_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES resources.collections(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES resources.resources(id) ON DELETE CASCADE,
    
    -- Ordering and organization
    display_order INTEGER DEFAULT 0,
    section_name VARCHAR(255), -- optional section within collection
    
    -- Additional metadata for this resource in this collection
    collection_notes TEXT,
    is_required BOOLEAN DEFAULT FALSE, -- for educational sequences
    prerequisite_resource_id UUID REFERENCES resources.resources(id),
    
    -- Audit fields
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id) NOT NULL,
    
    UNIQUE(collection_id, resource_id)
);

-- =============================================================================
-- RESOURCE DISTRIBUTION AND SHARING
-- =============================================================================

-- Resource sharing/distribution records
CREATE TABLE resources.resource_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources.resources(id) ON DELETE CASCADE NOT NULL,
    
    -- Distribution details
    patient_id UUID REFERENCES expedix.patients(id),
    distributed_by UUID REFERENCES auth.users(id) NOT NULL,
    distribution_method VARCHAR(50) NOT NULL, -- 'email', 'print', 'portal', 'direct_link', 'qr_code'
    
    -- Distribution context
    clinical_context VARCHAR(100), -- 'intake', 'session', 'homework', 'follow_up'
    consultation_id UUID, -- reference to consultation if applicable
    purpose TEXT, -- reason for sharing this resource
    
    -- Distribution metadata
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    delivery_status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'downloaded', 'failed'
    
    -- Access tracking
    access_token VARCHAR(255) UNIQUE, -- for tracking access
    expires_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    first_accessed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    
    -- Patient engagement
    time_spent_seconds INTEGER,
    completion_status VARCHAR(20), -- 'not_started', 'in_progress', 'completed'
    patient_feedback TEXT,
    patient_rating INTEGER, -- 1-5 rating
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_distribution_method CHECK (distribution_method IN ('email', 'print', 'portal', 'direct_link', 'qr_code', 'sms')),
    CONSTRAINT valid_delivery_status CHECK (delivery_status IN ('sent', 'delivered', 'opened', 'downloaded', 'failed', 'bounced')),
    CONSTRAINT valid_completion_status CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
    CONSTRAINT valid_patient_rating CHECK (patient_rating BETWEEN 1 AND 5)
);

-- =============================================================================
-- RESOURCE REVIEWS AND RATINGS
-- =============================================================================

-- Resource reviews and ratings
CREATE TABLE resources.resource_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources.resources(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Review content
    rating INTEGER NOT NULL, -- 1-5 stars
    title VARCHAR(255),
    review_text TEXT,
    
    -- Review metadata
    reviewer_type VARCHAR(50), -- 'professional', 'patient', 'caregiver', 'peer'
    is_verified_reviewer BOOLEAN DEFAULT FALSE,
    is_expert_review BOOLEAN DEFAULT FALSE,
    
    -- Review status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'flagged'
    moderated_by UUID REFERENCES auth.users(id),
    moderated_at TIMESTAMPTZ,
    moderation_notes TEXT,
    
    -- Helpfulness tracking
    helpful_count INTEGER DEFAULT 0,
    unhelpful_count INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(resource_id, reviewer_id), -- one review per user per resource
    CONSTRAINT valid_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT valid_reviewer_type CHECK (reviewer_type IN ('professional', 'patient', 'caregiver', 'peer', 'expert')),
    CONSTRAINT valid_review_status CHECK (status IN ('pending', 'approved', 'rejected', 'flagged', 'hidden'))
);

-- =============================================================================
-- RESOURCE ANALYTICS AND USAGE TRACKING
-- =============================================================================

-- Detailed resource usage analytics
CREATE TABLE resources.resource_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources.resources(id) ON DELETE CASCADE NOT NULL,
    
    -- Time period
    analysis_date DATE DEFAULT CURRENT_DATE,
    period_type VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
    
    -- Usage metrics
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- Engagement metrics
    average_view_duration INTEGER, -- seconds
    completion_rate DECIMAL(5,2), -- for trackable resources
    bounce_rate DECIMAL(5,2), -- immediate exits
    
    -- User behavior
    unique_users INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,
    device_breakdown JSONB, -- mobile vs desktop
    referrer_breakdown JSONB, -- how users found the resource
    
    -- Distribution analytics
    distribution_method_breakdown JSONB,
    geographic_breakdown JSONB,
    
    -- Quality metrics
    average_rating DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    
    -- Audit fields
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(resource_id, analysis_date, period_type),
    CONSTRAINT valid_period_type CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly'))
);

-- =============================================================================
-- RESOURCE VERSIONING AND HISTORY
-- =============================================================================

-- Resource version history
CREATE TABLE resources.resource_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources.resources(id) ON DELETE CASCADE NOT NULL,
    
    -- Version information
    version_number VARCHAR(20) NOT NULL,
    version_notes TEXT,
    
    -- Snapshot of resource at this version
    resource_data JSONB NOT NULL, -- complete resource state at this version
    
    -- Version metadata
    is_current BOOLEAN DEFAULT FALSE,
    superseded_at TIMESTAMPTZ,
    superseded_by UUID REFERENCES auth.users(id),
    
    -- Change tracking
    changes_summary TEXT,
    change_type VARCHAR(50), -- 'content', 'metadata', 'formatting', 'correction', 'update'
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    
    UNIQUE(resource_id, version_number),
    CONSTRAINT valid_change_type CHECK (change_type IN ('content', 'metadata', 'formatting', 'correction', 'update', 'translation'))
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Categories indexes
CREATE INDEX idx_categories_parent_id ON resources.categories(parent_id);
CREATE INDEX idx_categories_level ON resources.categories(level);
CREATE INDEX idx_categories_active ON resources.categories(is_active);

-- Resources indexes
CREATE INDEX idx_resources_type ON resources.resources(resource_type);
CREATE INDEX idx_resources_status ON resources.resources(status);
CREATE INDEX idx_resources_language ON resources.resources(language);
CREATE INDEX idx_resources_target_audience ON resources.resources(target_audience);
CREATE INDEX idx_resources_created_by ON resources.resources(created_by);
CREATE INDEX idx_resources_access_level ON resources.resources(access_level);
CREATE INDEX idx_resources_featured ON resources.resources(is_featured);

-- Resource distributions indexes
CREATE INDEX idx_resource_distributions_patient_id ON resources.resource_distributions(patient_id);
CREATE INDEX idx_resource_distributions_distributed_by ON resources.resource_distributions(distributed_by);
CREATE INDEX idx_resource_distributions_method ON resources.resource_distributions(distribution_method);
CREATE INDEX idx_resource_distributions_created_at ON resources.resource_distributions(created_at);

-- Collections indexes
CREATE INDEX idx_collections_type ON resources.collections(collection_type);
CREATE INDEX idx_collections_public ON resources.collections(is_public);
CREATE INDEX idx_collections_created_by ON resources.collections(created_by);

-- Full-text search indexes
CREATE INDEX idx_resources_fulltext ON resources.resources USING gin(
    to_tsvector('spanish', 
        coalesce(title, '') || ' ' || 
        coalesce(subtitle, '') || ' ' || 
        coalesce(description, '') || ' ' ||
        coalesce(summary, '') || ' ' ||
        array_to_string(coalesce(keywords, ARRAY[]::TEXT[]), ' ')
    )
);

CREATE INDEX idx_tags_fulltext ON resources.tags USING gin(
    to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- =============================================================================
-- AUDIT TRIGGERS
-- =============================================================================

CREATE TRIGGER audit_resources_trigger
    AFTER INSERT OR UPDATE OR DELETE ON resources.resources
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

CREATE TRIGGER audit_resource_distributions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON resources.resource_distributions
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Auto-update timestamps
CREATE TRIGGER update_resources_updated_at 
    BEFORE UPDATE ON resources.resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON resources.categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at 
    BEFORE UPDATE ON resources.collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update usage counts
CREATE OR REPLACE FUNCTION resources.update_resource_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update download/view counts
        IF NEW.distribution_method IN ('email', 'print', 'portal') THEN
            UPDATE resources.resources 
            SET download_count = download_count + 1
            WHERE id = NEW.resource_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resource_stats_trigger
    AFTER INSERT OR UPDATE ON resources.resource_distributions
    FOR EACH ROW EXECUTE FUNCTION resources.update_resource_stats();

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Resources schema initialized successfully';
    RAISE NOTICE 'Tables created: categories, tags, resources, collections, resource_distributions, resource_reviews, resource_analytics, resource_versions';
    RAISE NOTICE 'Support for psychoeducational materials, secure distribution, and usage tracking enabled';
END $$;