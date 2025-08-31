-- ULTIMATE FOREIGN KEY FIX - Add ALL missing indexes
-- Este script agrega TODOS los foreign key indexes faltantes (~60)

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);

-- ============================================================================
-- ASSESSMENTS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_assessments_clinic_id ON assessments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_assessments_consultation_id ON assessments(consultation_id);
CREATE INDEX IF NOT EXISTS idx_assessments_professional_id ON assessments(professional_id);
CREATE INDEX IF NOT EXISTS idx_assessments_workspace_id ON assessments(workspace_id);

-- ============================================================================
-- DJANGO ADMIN
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_auth_group_permissions_permission_id ON auth_group_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_django_admin_log_content_type_id ON django_admin_log(content_type_id);

-- ============================================================================
-- CLINIC MANAGEMENT
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_clinic_id ON clinic_invitations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_profiles_clinic_id ON clinic_profiles(clinic_id);

-- ============================================================================
-- CLINIMETRIX PRO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clinimetrix_assessments_administrator_id ON clinimetrix_assessments(administrator_id);
CREATE INDEX IF NOT EXISTS idx_clinimetrix_assessments_consultation_id ON clinimetrix_assessments(consultation_id);
CREATE INDEX IF NOT EXISTS idx_clinimetrix_registry_template_id ON clinimetrix_registry(template_id);
CREATE INDEX IF NOT EXISTS idx_clinimetrix_registry_category_id ON clinimetrix_registry(category_id);
CREATE INDEX IF NOT EXISTS idx_clinimetrix_remote_assessments_assessment_id ON clinimetrix_remote_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_clinimetrix_remote_assessments_patient_id ON clinimetrix_remote_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinimetrix_remote_assessments_sent_by ON clinimetrix_remote_assessments(sent_by);
CREATE INDEX IF NOT EXISTS idx_clinimetrix_remote_assessments_template_id ON clinimetrix_remote_assessments(template_id);

-- ============================================================================
-- CONSULTATIONS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_consultations_clinic_id ON consultations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_consultations_professional_id ON consultations(professional_id);
CREATE INDEX IF NOT EXISTS idx_consultations_workspace_id ON consultations(workspace_id);

-- ============================================================================
-- FORMX (Dynamic Forms)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_created_by ON dynamic_forms(created_by);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_workspace_id ON dynamic_forms(workspace_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_clinic_id ON form_submissions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_reviewed_by ON form_submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_workspace_id ON form_submissions(workspace_id);

-- ============================================================================
-- FINANCE MODULE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_finance_cash_register_cuts_professional_id ON finance_cash_register_cuts(responsible_professional_id);
CREATE INDEX IF NOT EXISTS idx_finance_income_consultation_id ON finance_income(consultation_id);
CREATE INDEX IF NOT EXISTS idx_finance_income_professional_id ON finance_income(professional_id);
CREATE INDEX IF NOT EXISTS idx_finance_income_workspace_id ON finance_income(workspace_id);
CREATE INDEX IF NOT EXISTS idx_finance_payment_method_config_workspace_id ON finance_payment_method_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_finance_services_clinic_id ON finance_services(clinic_id);

-- ============================================================================
-- MEDICAL RECORDS & AUDIT
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_medical_access_log_clinic_id ON medical_access_log(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_access_log_workspace_id ON medical_access_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_medical_audit_log_clinic_id ON medical_audit_log(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_audit_log_workspace_id ON medical_audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_medical_compliance_reports_clinic_id ON medical_compliance_reports(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_compliance_reports_workspace_id ON medical_compliance_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_clinic_id ON medical_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_recorded_by ON medical_history(recorded_by);
CREATE INDEX IF NOT EXISTS idx_medical_history_workspace_id ON medical_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_medical_resources_clinic_id ON medical_resources(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_resources_created_by ON medical_resources(created_by);

-- ============================================================================
-- PRACTICE LOCATIONS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_practice_locations_clinic_id ON practice_locations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_practice_locations_workspace_id ON practice_locations(workspace_id);

-- ============================================================================
-- PRESCRIPTIONS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_by ON prescriptions(prescribed_by);
CREATE INDEX IF NOT EXISTS idx_prescriptions_workspace_id ON prescriptions(workspace_id);

-- ============================================================================
-- PROFILES & USERS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_individual_workspace_id ON profiles(individual_workspace_id);

-- ============================================================================
-- PSYCHOMETRIC SCALES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_psychometric_scales_created_by ON psychometric_scales(created_by);
CREATE INDEX IF NOT EXISTS idx_psychometric_scales_workspace_id ON psychometric_scales(workspace_id);

-- ============================================================================
-- RESOURCES & CATEGORIES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_resource_categories_parent_category_id ON resource_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_resource_categories_workspace_id ON resource_categories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scale_items_clinic_id ON scale_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_scale_items_workspace_id ON scale_items(workspace_id);

-- ============================================================================
-- TENANT MEMBERSHIPS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_clinic_id ON tenant_memberships(clinic_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_invited_by ON tenant_memberships(invited_by);

-- ============================================================================
-- USER FAVORITES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_favorite_scales_template_id ON user_favorite_scales(template_id);

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
SELECT 'All foreign key indexes created successfully' as status;