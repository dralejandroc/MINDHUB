-- Create Medical Audit Tables for Compliance
-- Inspired by OpenEMR audit system for healthcare compliance
-- Date: 2025-08-26

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Medical Audit Log Table
CREATE TABLE IF NOT EXISTS medical_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User context
    user_id UUID, -- References profiles(id)
    
    -- Action details
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    
    -- Medical context
    patient_id UUID, -- Always track patient context for medical compliance
    
    -- Change tracking
    changes JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Request context for security
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Dual system support
    clinic_id UUID REFERENCES clinics(id),
    workspace_id UUID REFERENCES individual_workspaces(id),
    
    -- Dual system constraint
    CONSTRAINT audit_dual_system_constraint 
    CHECK ((clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
           (clinic_id IS NULL AND workspace_id IS NOT NULL) OR
           (clinic_id IS NULL AND workspace_id IS NULL))
);

-- Indexes for medical audit log (optimized for compliance queries)
CREATE INDEX IF NOT EXISTS idx_medical_audit_user_timestamp ON medical_audit_log (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_medical_audit_patient_timestamp ON medical_audit_log (patient_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_medical_audit_action_timestamp ON medical_audit_log (action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_medical_audit_resource ON medical_audit_log (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_medical_audit_clinic ON medical_audit_log (clinic_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_medical_audit_workspace ON medical_audit_log (workspace_id, timestamp DESC);

-- 2. Medical Access Log Table (HIPAA/GDPR compliance)
CREATE TABLE IF NOT EXISTS medical_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Access details
    user_id UUID NOT NULL, -- Who accessed
    patient_id UUID NOT NULL, -- Which patient's data
    access_type VARCHAR(20) NOT NULL, -- view, create, update, delete, export, print
    
    -- What was accessed
    data_type VARCHAR(100) NOT NULL, -- medical_history, assessment_results, etc.
    resource_id UUID, -- Specific resource accessed
    
    -- Access context
    purpose VARCHAR(200), -- Why was it accessed
    session_id VARCHAR(100), -- User session for tracking
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Dual system support
    clinic_id UUID REFERENCES clinics(id),
    workspace_id UUID REFERENCES individual_workspaces(id),
    
    -- Dual system constraint
    CONSTRAINT access_log_dual_system_constraint 
    CHECK ((clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
           (clinic_id IS NULL AND workspace_id IS NOT NULL) OR
           (clinic_id IS NULL AND workspace_id IS NULL))
);

-- Indexes for access log (HIPAA compliance queries)
CREATE INDEX IF NOT EXISTS idx_access_log_patient_time ON medical_access_log (patient_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_user_time ON medical_access_log (user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_type_time ON medical_access_log (access_type, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_data_type ON medical_access_log (data_type, accessed_at DESC);

-- 3. Medical Compliance Reports Table
CREATE TABLE IF NOT EXISTS medical_compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Report details
    report_type VARCHAR(50) NOT NULL, -- hipaa_audit, gdpr_audit, access_log, etc.
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Time range
    date_from TIMESTAMPTZ NOT NULL,
    date_to TIMESTAMPTZ NOT NULL,
    
    -- Report data
    report_data JSONB DEFAULT '{}',
    summary JSONB DEFAULT '{}',
    
    -- Generation info
    generated_by UUID NOT NULL, -- User who requested
    status VARCHAR(20) DEFAULT 'generating', -- generating, completed, failed
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- Dual system support
    clinic_id UUID REFERENCES clinics(id),
    workspace_id UUID REFERENCES individual_workspaces(id),
    
    -- Dual system constraint
    CONSTRAINT reports_dual_system_constraint 
    CHECK ((clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
           (clinic_id IS NULL AND workspace_id IS NOT NULL) OR
           (clinic_id IS NULL AND workspace_id IS NULL))
);

-- Indexes for compliance reports
CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON medical_compliance_reports (report_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_user ON medical_compliance_reports (generated_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_clinic ON medical_compliance_reports (clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_workspace ON medical_compliance_reports (workspace_id, created_at DESC);

-- 4. Row Level Security (RLS) Policies

-- Enable RLS on audit tables
ALTER TABLE medical_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_compliance_reports ENABLE ROW LEVEL SECURITY;

-- Medical Audit Log RLS Policies
CREATE POLICY "medical_audit_log_access" ON medical_audit_log
  FOR ALL USING (
    -- Users can see audit logs from their clinic/workspace
    clinic_id IN (
      SELECT clinic_id FROM tenant_memberships 
      WHERE user_id = (select auth.uid()) AND is_active = TRUE
    ) OR
    workspace_id IN (
      SELECT id FROM individual_workspaces 
      WHERE owner_id = (select auth.uid())
    ) OR
    -- Users can see their own audit logs
    user_id = (select auth.uid())
  );

-- Medical Access Log RLS Policies
CREATE POLICY "medical_access_log_access" ON medical_access_log
  FOR ALL USING (
    -- Users can see access logs from their clinic/workspace
    clinic_id IN (
      SELECT clinic_id FROM tenant_memberships 
      WHERE user_id = (select auth.uid()) AND is_active = TRUE
    ) OR
    workspace_id IN (
      SELECT id FROM individual_workspaces 
      WHERE owner_id = (select auth.uid())
    ) OR
    -- Users can see their own access logs
    user_id = (select auth.uid())
  );

-- Medical Compliance Reports RLS Policies
CREATE POLICY "medical_compliance_reports_access" ON medical_compliance_reports
  FOR ALL USING (
    -- Users can see reports from their clinic/workspace
    clinic_id IN (
      SELECT clinic_id FROM tenant_memberships 
      WHERE user_id = (select auth.uid()) AND is_active = TRUE
    ) OR
    workspace_id IN (
      SELECT id FROM individual_workspaces 
      WHERE owner_id = (select auth.uid())
    ) OR
    -- Users can see reports they generated
    generated_by = (select auth.uid())
  );

-- 5. Comments and Documentation
COMMENT ON TABLE medical_audit_log IS 'Medical audit log for healthcare compliance - tracks all medical actions';
COMMENT ON TABLE medical_access_log IS 'Detailed patient data access log for HIPAA/GDPR compliance';
COMMENT ON TABLE medical_compliance_reports IS 'Generated compliance reports for regulatory audits';

COMMENT ON COLUMN medical_audit_log.action IS 'Medical action performed (patient_created, appointment_scheduled, etc.)';
COMMENT ON COLUMN medical_audit_log.changes IS 'Before/after values for updates, structured as {"before": {...}, "after": {...}}';
COMMENT ON COLUMN medical_audit_log.patient_id IS 'Patient context - always populated for medical actions involving patient data';

COMMENT ON COLUMN medical_access_log.access_type IS 'Type of access: view, create, update, delete, export, print';
COMMENT ON COLUMN medical_access_log.data_type IS 'Type of data accessed: medical_history, assessment_results, prescriptions, etc.';
COMMENT ON COLUMN medical_access_log.purpose IS 'Business purpose for accessing the data (for HIPAA compliance)';

-- 6. Functions for audit automation

-- Function to automatically log patient data access
CREATE OR REPLACE FUNCTION log_patient_access(
  p_patient_id UUID,
  p_access_type VARCHAR,
  p_data_type VARCHAR,
  p_resource_id UUID DEFAULT NULL,
  p_purpose VARCHAR DEFAULT ''
) RETURNS UUID AS $$
DECLARE
  access_log_id UUID;
BEGIN
  INSERT INTO medical_access_log (
    user_id,
    patient_id,
    access_type,
    data_type,
    resource_id,
    purpose,
    clinic_id,
    workspace_id
  ) 
  SELECT 
    (select auth.uid()),
    p_patient_id,
    p_access_type,
    p_data_type,
    p_resource_id,
    p_purpose,
    p.clinic_id,
    p.workspace_id
  FROM patients p 
  WHERE p.id = p_patient_id
  RETURNING id INTO access_log_id;
  
  RETURN access_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get patient access summary (for compliance)
CREATE OR REPLACE FUNCTION get_patient_access_summary(
  p_patient_id UUID,
  p_days_back INTEGER DEFAULT 30
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'patient_id', p_patient_id,
    'period_days', p_days_back,
    'total_accesses', COUNT(*),
    'unique_users', COUNT(DISTINCT user_id),
    'access_types', json_agg(DISTINCT access_type),
    'data_types', json_agg(DISTINCT data_type),
    'last_access', MAX(accessed_at)
  ) INTO result
  FROM medical_access_log
  WHERE patient_id = p_patient_id
    AND accessed_at >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (
      clinic_id IN (
        SELECT clinic_id FROM tenant_memberships 
        WHERE user_id = (select auth.uid()) AND is_active = TRUE
      ) OR
      workspace_id IN (
        SELECT id FROM individual_workspaces 
        WHERE owner_id = (select auth.uid())
      )
    );
  
  RETURN COALESCE(result, '{"error": "No access found or insufficient permissions"}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Sample audit data for testing (remove in production)
-- This is commented out - uncomment only for development testing

/*
-- Sample audit log entries
INSERT INTO medical_audit_log (user_id, action, resource_type, resource_id, patient_id, changes, metadata) VALUES
  ((select auth.uid()), 'patient_created', 'patient', gen_random_uuid(), gen_random_uuid(), '{"before": {}, "after": {"name": "Test Patient"}}', '{"ip": "127.0.0.1"}'),
  ((select auth.uid()), 'appointment_scheduled', 'appointment', gen_random_uuid(), gen_random_uuid(), '{}', '{"appointment_type": "consultation"}');

-- Sample access log entries  
INSERT INTO medical_access_log (user_id, patient_id, access_type, data_type, purpose) VALUES
  ((select auth.uid()), gen_random_uuid(), 'view', 'medical_history', 'Routine consultation'),
  ((select auth.uid()), gen_random_uuid(), 'create', 'assessment_results', 'PHQ-9 depression screening');
*/

-- Verify tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('medical_audit_log', 'medical_access_log', 'medical_compliance_reports')
ORDER BY table_name;