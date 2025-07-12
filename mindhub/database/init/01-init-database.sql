-- =============================================================================
-- MindHub Database Initialization Script
-- Compliant with NOM-024-SSA3-2010 (Mexican Healthcare Standards)
-- =============================================================================

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas for different hubs
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS clinimetrix;
CREATE SCHEMA IF NOT EXISTS expedix;
CREATE SCHEMA IF NOT EXISTS formx;
CREATE SCHEMA IF NOT EXISTS resources;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set search path
SET search_path TO auth, clinimetrix, expedix, formx, resources, audit, public;

-- =============================================================================
-- AUDIT & LOGGING FUNCTIONS (NOM-024 Compliance)
-- =============================================================================

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit.audit_log (
            table_name, 
            operation, 
            old_values, 
            user_id, 
            timestamp,
            ip_address
        ) VALUES (
            TG_TABLE_SCHEMA||'.'||TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD),
            current_setting('app.current_user_id', true)::uuid,
            NOW(),
            current_setting('app.current_ip', true)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            old_values,
            new_values,
            user_id,
            timestamp,
            ip_address
        ) VALUES (
            TG_TABLE_SCHEMA||'.'||TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD),
            row_to_json(NEW),
            current_setting('app.current_user_id', true)::uuid,
            NOW(),
            current_setting('app.current_ip', true)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            new_values,
            user_id,
            timestamp,
            ip_address
        ) VALUES (
            TG_TABLE_SCHEMA||'.'||TG_TABLE_NAME,
            TG_OP,
            row_to_json(NEW),
            current_setting('app.current_user_id', true)::uuid,
            NOW(),
            current_setting('app.current_ip', true)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Data encryption/decryption functions
CREATE OR REPLACE FUNCTION encrypt_sensitive(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(pgp_sym_encrypt(data, current_setting('app.encryption_key', true)), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_sensitive(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_data, 'hex'), current_setting('app.encryption_key', true));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- AUTH SCHEMA - User Management and Authentication
-- =============================================================================

-- Users table (linked to Auth0)
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    nickname VARCHAR(255),
    picture TEXT,
    locale VARCHAR(10) DEFAULT 'es-MX',
    
    -- Healthcare professional information
    license_number VARCHAR(50) UNIQUE,
    license_type VARCHAR(50), -- 'psychiatrist', 'psychologist', 'admin', 'support'
    license_expiry DATE,
    specialty VARCHAR(100),
    institution VARCHAR(255),
    
    -- Profile information
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(3) DEFAULT 'MEX',
    
    -- System fields
    is_active BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT valid_license_type CHECK (license_type IN ('psychiatrist', 'psychologist', 'admin', 'support')),
    CONSTRAINT valid_country CHECK (country IN ('MEX', 'USA', 'CAN')),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- User roles and permissions
CREATE TABLE auth.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.role_permissions (
    role_id UUID REFERENCES auth.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES auth.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE auth.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES auth.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, role_id)
);

-- Session management
CREATE TABLE auth.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    auth0_session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    hub VARCHAR(50), -- which hub they're accessing
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AUDIT SCHEMA - Compliance and Logging
-- =============================================================================

-- Main audit log table (NOM-024 compliance)
CREATE TABLE audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    
    CONSTRAINT valid_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Access log for healthcare data (NOM-024 requirement)
CREATE TABLE audit.data_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    patient_id UUID, -- when accessing patient data
    resource_type VARCHAR(50) NOT NULL, -- 'patient', 'assessment', 'prescription', etc.
    resource_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'view', 'create', 'update', 'delete', 'export'
    purpose TEXT, -- reason for access (required by NOM-024)
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Compliance fields
    legal_basis TEXT, -- legal basis for data processing
    consent_reference UUID, -- reference to patient consent
    retention_period INTERVAL, -- how long this access should be retained
    
    CONSTRAINT valid_action CHECK (action IN ('view', 'create', 'update', 'delete', 'export', 'print'))
);

-- System events and errors
CREATE TABLE audit.system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_severity CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'))
);

-- Print basic info
DO $$
BEGIN
    RAISE NOTICE 'MindHub database schemas initialized successfully';
    RAISE NOTICE 'Schemas created: auth, clinimetrix, expedix, formx, resources, audit';
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pgcrypto, pg_trgm';
    RAISE NOTICE 'NOM-024-SSA3-2010 compliance features enabled';
END $$;