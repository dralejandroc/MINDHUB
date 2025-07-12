-- =============================================================================
-- SEED DATA for MindHub Development Environment
-- Sample data for testing and development
-- =============================================================================

-- Set schema search path
SET search_path TO auth, expedix, clinimetrix, formx, resources, audit, public;

-- =============================================================================
-- AUTH SCHEMA - Users, Roles, and Permissions
-- =============================================================================

-- Insert default roles
INSERT INTO auth.roles (id, name, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'psychiatrist', 'Licensed psychiatrist with full clinical access'),
    ('22222222-2222-2222-2222-222222222222', 'psychologist', 'Licensed psychologist with assessment and therapy access'),
    ('33333333-3333-3333-3333-333333333333', 'healthcare_admin', 'Healthcare administrator with system management access'),
    ('44444444-4444-4444-4444-444444444444', 'support_staff', 'Support staff with limited access')
ON CONFLICT (id) DO NOTHING;

-- Insert permissions
INSERT INTO auth.permissions (id, name, description, resource, action) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'read:profile', 'Read user profile data', 'profile', 'read'),
    ('a2222222-2222-2222-2222-222222222222', 'write:profile', 'Update user profile data', 'profile', 'write'),
    ('a3333333-3333-3333-3333-333333333333', 'read:patients', 'Read patient information', 'patients', 'read'),
    ('a4444444-4444-4444-4444-444444444444', 'write:patients', 'Create/update patient records', 'patients', 'write'),
    ('a5555555-5555-5555-5555-555555555555', 'read:assessments', 'Access clinical assessments', 'assessments', 'read'),
    ('a6666666-6666-6666-6666-666666666666', 'write:assessments', 'Create/modify assessments', 'assessments', 'write'),
    ('a7777777-7777-7777-7777-777777777777', 'read:prescriptions', 'View prescriptions', 'prescriptions', 'read'),
    ('a8888888-8888-8888-8888-888888888888', 'write:prescriptions', 'Create/update prescriptions', 'prescriptions', 'write'),
    ('a9999999-9999-9999-9999-999999999999', 'read:forms', 'Access forms and questionnaires', 'forms', 'read'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'write:forms', 'Create/modify forms', 'forms', 'write'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'read:resources', 'Access educational resources', 'resources', 'read'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'write:resources', 'Manage educational content', 'resources', 'write'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin:all', 'Administrative access to all resources', 'all', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Assign permissions to roles
INSERT INTO auth.role_permissions (role_id, permission_id) VALUES
    -- Psychiatrist permissions
    ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
    ('11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222'),
    ('11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333'),
    ('11111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444'),
    ('11111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555'),
    ('11111111-1111-1111-1111-111111111111', 'a6666666-6666-6666-6666-666666666666'),
    ('11111111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777'),
    ('11111111-1111-1111-1111-111111111111', 'a8888888-8888-8888-8888-888888888888'),
    ('11111111-1111-1111-1111-111111111111', 'a9999999-9999-9999-9999-999999999999'),
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    
    -- Psychologist permissions (no prescription access)
    ('22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222'),
    ('22222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333'),
    ('22222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444'),
    ('22222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555'),
    ('22222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666'),
    ('22222222-2222-2222-2222-222222222222', 'a7777777-7777-7777-7777-777777777777'),
    ('22222222-2222-2222-2222-222222222222', 'a9999999-9999-9999-9999-999999999999'),
    ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    
    -- Healthcare admin permissions
    ('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
    
    -- Support staff permissions
    ('44444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111'),
    ('44444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333'),
    ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create sample users (these will typically come from Auth0)
INSERT INTO auth.users (id, auth0_id, email, name, license_number, license_type, specialty, is_active) VALUES
    ('u1111111-1111-1111-1111-111111111111', 'auth0|dev_psychiatrist', 'doctor.psiquiatra@mindhub.cloud', 'Dr. María González Pérez', 'PSQ-2024-001', 'psychiatrist', 'Psiquiatría General', true),
    ('u2222222-2222-2222-2222-222222222222', 'auth0|dev_psychologist', 'doctor.psicologo@mindhub.cloud', 'Dr. Carlos Rodríguez López', 'PSY-2024-001', 'psychologist', 'Psicología Clínica', true),
    ('u3333333-3333-3333-3333-333333333333', 'auth0|dev_admin', 'admin@mindhub.cloud', 'Admin Sistema', 'ADM-2024-001', 'admin', 'Administración', true)
ON CONFLICT (id) DO NOTHING;

-- Assign roles to users
INSERT INTO auth.user_roles (user_id, role_id) VALUES
    ('u1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
    ('u2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
    ('u3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- =============================================================================
-- EXPEDIX SCHEMA - Sample Patients and Medical Data
-- =============================================================================

-- Insert sample medications
INSERT INTO expedix.medications (id, generic_name, brand_names, therapeutic_class, available_strengths, available_forms, created_by) VALUES
    ('m1111111-1111-1111-1111-111111111111', 'Sertralina', ARRAY['Zoloft', 'Altruline'], 'Antidepresivo ISRS', ARRAY['25mg', '50mg', '100mg'], ARRAY['tablet'], 'u1111111-1111-1111-1111-111111111111'),
    ('m2222222-2222-2222-2222-222222222222', 'Lorazepam', ARRAY['Ativan'], 'Benzodiacepina', ARRAY['0.5mg', '1mg', '2mg'], ARRAY['tablet'], 'u1111111-1111-1111-1111-111111111111'),
    ('m3333333-3333-3333-3333-333333333333', 'Risperidona', ARRAY['Risperdal'], 'Antipsicótico atípico', ARRAY['1mg', '2mg', '3mg', '4mg'], ARRAY['tablet'], 'u1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Insert sample patients
INSERT INTO expedix.patients (
    id, medical_record_number, first_name, middle_name, last_name, second_last_name,
    date_of_birth, gender, marital_status, primary_language, patient_category,
    consent_to_treatment, consent_to_data_processing, created_by
) VALUES
    ('p1111111-1111-1111-1111-111111111111', 'EXP-2024-001', 'Ana', 'Isabel', 'Martínez', 'García', '1985-03-15', 'female', 'married', 'es', 'general', true, true, 'u1111111-1111-1111-1111-111111111111'),
    ('p2222222-2222-2222-2222-222222222222', 'EXP-2024-002', 'Juan', 'Carlos', 'López', 'Hernández', '1992-07-22', 'male', 'single', 'es', 'priority', true, true, 'u1111111-1111-1111-1111-111111111111'),
    ('p3333333-3333-3333-3333-333333333333', 'EXP-2024-003', 'María', 'Elena', 'Torres', 'Sánchez', '1978-11-08', 'female', 'divorced', 'es', 'chronic', true, true, 'u2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Insert sample medical history
INSERT INTO expedix.medical_history (
    id, patient_id, chief_complaint, history_of_present_illness, psychiatric_history, created_by
) VALUES
    ('h1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Síntomas depresivos', 'Paciente refiere tristeza persistente, pérdida de interés en actividades, insomnio y fatiga durante las últimas 8 semanas.', 'Sin antecedentes psiquiátricos previos. Negativa para intentos suicidas.', 'u1111111-1111-1111-1111-111111111111'),
    ('h2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'Crisis de ansiedad', 'Episodios de ansiedad intensa con palpitaciones, sudoración y sensación de muerte inminente.', 'Trastorno de ansiedad generalizada diagnosticado hace 2 años. En tratamiento previo con psicoterapia.', 'u1111111-1111-1111-1111-111111111111'),
    ('h3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'Cambios de estado de ánimo', 'Alternancia entre periodos de euforia y depresión severa.', 'Episodio maníaco previo hace 3 años. Hospitalización psiquiátrica en 2021.', 'u2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Insert sample consultations
INSERT INTO expedix.consultations (
    id, patient_id, consultation_date, consultation_type, subjective_notes, objective_notes, 
    assessment, plan, primary_diagnosis_code, primary_diagnosis_description, created_by
) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', '2024-07-10 10:00:00', 'initial', 
     'Paciente refiere sentirse triste, sin energía, con dificultades para dormir.', 
     'Paciente alerta, orientada, colaboradora. Afecto deprimido, discurso enlentecido.',
     'Episodio depresivo mayor moderado', 
     'Iniciar tratamiento con sertralina 50mg/día. Psicoterapia cognitivo-conductual. Control en 2 semanas.',
     'F32.1', 'Episodio depresivo mayor moderado', 'u1111111-1111-1111-1111-111111111111'),
    
    ('c2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', '2024-07-10 11:30:00', 'follow_up',
     'Paciente refiere mejoría parcial de síntomas ansiosos con medicación actual.',
     'Paciente más tranquilo, menos inquieto que en consulta previa.',
     'Trastorno de ansiedad generalizada en tratamiento',
     'Continuar tratamiento actual. Aumentar sesiones de relajación.',
     'F41.1', 'Trastorno de ansiedad generalizada', 'u1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CLINIMETRIX SCHEMA - Assessment Scales and Sample Data
-- =============================================================================

-- Insert sample assessment scales
INSERT INTO clinimetrix.assessment_scales (
    id, name, abbreviation, description, target_population, administration_mode,
    estimated_duration_minutes, category, subcategory, available_languages, created_by
) VALUES
    ('s1111111-1111-1111-1111-111111111111', 'Inventario de Depresión de Beck II', 'BDI-II', 
     'Cuestionario de autoevaluación para medir la severidad de síntomas depresivos', 
     'adults', 'self_report', 10, 'depression', 'screening', 
     ARRAY['es', 'en'], 'u1111111-1111-1111-1111-111111111111'),
     
    ('s2222222-2222-2222-2222-222222222222', 'Inventario de Ansiedad de Beck', 'BAI',
     'Escala de autoevaluación para síntomas de ansiedad',
     'adults', 'self_report', 8, 'anxiety', 'screening',
     ARRAY['es', 'en'], 'u1111111-1111-1111-1111-111111111111'),
     
    ('s3333333-3333-3333-3333-333333333333', 'Escala de Evaluación de la Depresión de Hamilton', 'HDRS',
     'Escala administrada por el clínico para evaluar severidad de depresión',
     'adults', 'clinician_administered', 20, 'depression', 'severity',
     ARRAY['es', 'en'], 'u1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Insert sample scale items (simplified for BDI-II)
INSERT INTO clinimetrix.scale_items (
    id, scale_id, item_number, question_text, response_type, response_options, display_order
) VALUES
    ('i1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 1, 
     'En las últimas dos semanas, incluyendo hoy, ¿cómo se ha sentido?', 'likert',
     '["0: No me siento triste", "1: Me siento triste gran parte del tiempo", "2: Estoy triste todo el tiempo", "3: Estoy tan triste o infeliz que no puedo soportarlo"]'::jsonb, 1),
     
    ('i2222222-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111', 2,
     '¿Cómo ve el futuro?', 'likert',
     '["0: No me siento desalentado sobre el futuro", "1: Me siento más desalentado sobre el futuro que antes", "2: No espero que las cosas mejoren", "3: Siento que el futuro es desesperanzador"]'::jsonb, 2)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- FORMX SCHEMA - Form Templates and Field Types
-- =============================================================================

-- Insert standard field types
INSERT INTO formx.field_types (
    id, type_name, display_name, description, category, data_type, 
    supports_validation, is_interactive, created_by
) VALUES
    ('ft111111-1111-1111-1111-111111111111', 'text_input', 'Texto', 'Campo de texto simple', 'input', 'text', true, true, 'u3333333-3333-3333-3333-333333333333'),
    ('ft222222-2222-2222-2222-222222222222', 'textarea', 'Área de texto', 'Campo de texto multilínea', 'input', 'text', true, true, 'u3333333-3333-3333-3333-333333333333'),
    ('ft333333-3333-3333-3333-333333333333', 'radio_group', 'Opción múltiple', 'Selección de una opción', 'selection', 'text', true, true, 'u3333333-3333-3333-3333-333333333333'),
    ('ft444444-4444-4444-4444-444444444444', 'checkbox_group', 'Casillas de verificación', 'Selección múltiple', 'selection', 'array', true, true, 'u3333333-3333-3333-3333-333333333333'),
    ('ft555555-5555-5555-5555-555555555555', 'likert_scale', 'Escala Likert', 'Escala de calificación', 'selection', 'number', true, true, 'u3333333-3333-3333-3333-333333333333'),
    ('ft666666-6666-6666-6666-666666666666', 'date_picker', 'Fecha', 'Selector de fecha', 'input', 'date', true, true, 'u3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Insert sample form template
INSERT INTO formx.form_templates (
    id, name, slug, description, category, display_title, instructions,
    form_schema, estimated_completion_minutes, status, created_by
) VALUES
    ('tmpl1111-1111-1111-1111-111111111111', 'Formulario de Ingreso General', 'ingreso-general',
     'Formulario estándar para el ingreso de nuevos pacientes',
     'intake', 'Formulario de Ingreso - MindHub', 
     'Por favor complete toda la información solicitada. Sus datos están protegidos y son confidenciales.',
     '{"fields": [{"id": "nombre", "type": "text_input", "label": "Nombre completo", "required": true}, {"id": "fecha_nacimiento", "type": "date_picker", "label": "Fecha de nacimiento", "required": true}, {"id": "motivo_consulta", "type": "textarea", "label": "Motivo de consulta", "required": true}]}'::jsonb,
     15, 'published', 'u3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- RESOURCES SCHEMA - Sample Educational Materials
-- =============================================================================

-- Insert resource categories
INSERT INTO resources.categories (
    id, name, slug, description, display_order, level, path, created_by
) VALUES
    ('cat11111-1111-1111-1111-111111111111', 'Trastornos del Estado de Ánimo', 'trastornos-animo', 'Recursos sobre depresión, bipolaridad y trastornos relacionados', 1, 0, 'trastornos-animo', 'u3333333-3333-3333-3333-333333333333'),
    ('cat22222-2222-2222-2222-222222222222', 'Trastornos de Ansiedad', 'trastornos-ansiedad', 'Información y recursos sobre ansiedad y fobias', 2, 0, 'trastornos-ansiedad', 'u3333333-3333-3333-3333-333333333333'),
    ('cat33333-3333-3333-3333-333333333333', 'Técnicas de Relajación', 'tecnicas-relajacion', 'Ejercicios y técnicas para el manejo del estrés', 3, 0, 'tecnicas-relajacion', 'u3333333-3333-3333-3333-333333333333'),
    ('cat44444-4444-4444-4444-444444444444', 'Información para Familias', 'info-familias', 'Recursos educativos para familiares y cuidadores', 4, 0, 'info-familias', 'u3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tags
INSERT INTO resources.tags (id, name, slug, description, tag_type, created_by) VALUES
    ('tag11111-1111-1111-1111-111111111111', 'Depresión', 'depresion', 'Recursos relacionados con trastornos depresivos', 'condition', 'u3333333-3333-3333-3333-333333333333'),
    ('tag22222-2222-2222-2222-222222222222', 'Ansiedad', 'ansiedad', 'Recursos sobre trastornos de ansiedad', 'condition', 'u3333333-3333-3333-3333-333333333333'),
    ('tag33333-3333-3333-3333-333333333333', 'Adultos', 'adultos', 'Contenido dirigido a población adulta', 'age_group', 'u3333333-3333-3333-3333-333333333333'),
    ('tag44444-4444-4444-4444-444444444444', 'Familias', 'familias', 'Recursos para familiares', 'audience', 'u3333333-3333-3333-3333-333333333333'),
    ('tag55555-5555-5555-5555-555555555555', 'Técnicas CBT', 'tecnicas-cbt', 'Técnicas de terapia cognitivo-conductual', 'therapy_type', 'u3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Insert sample resources
INSERT INTO resources.resources (
    id, title, slug, description, summary, resource_type, format, target_audience,
    age_group, clinical_conditions, therapeutic_approaches, status, created_by
) VALUES
    ('res11111-1111-1111-1111-111111111111', 
     'Entendiendo la Depresión: Guía para Pacientes', 
     'entendiendo-depresion-guia-pacientes',
     'Guía completa que explica qué es la depresión, sus síntomas, causas y opciones de tratamiento disponibles. Incluye estrategias de autoayuda y cuándo buscar ayuda profesional.',
     'Guía educativa sobre depresión para pacientes y familias',
     'document', 'pdf', 'patients', 'adults',
     ARRAY['depression', 'mood_disorders'], ARRAY['psychoeducation', 'cognitive_behavioral'],
     'published', 'u1111111-1111-1111-1111-111111111111'),
     
    ('res22222-2222-2222-2222-222222222222',
     'Técnicas de Respiración para la Ansiedad',
     'tecnicas-respiracion-ansiedad', 
     'Video instructivo que enseña diferentes técnicas de respiración para manejar crisis de ansiedad y reducir el estrés diario.',
     'Video con ejercicios de respiración para ansiedad',
     'video', 'mp4', 'all', 'all',
     ARRAY['anxiety', 'panic_disorder'], ARRAY['relaxation', 'mindfulness'],
     'published', 'u2222222-2222-2222-2222-222222222222'),
     
    ('res33333-3333-3333-3333-333333333333',
     'Registro de Pensamientos Automáticos',
     'registro-pensamientos-automaticos',
     'Hoja de trabajo interactiva para identificar y modificar pensamientos automáticos negativos. Herramienta fundamental en terapia cognitivo-conductual.',
     'Herramienta CBT para el trabajo con pensamientos automáticos',
     'interactive', 'html', 'patients', 'adults',
     ARRAY['depression', 'anxiety'], ARRAY['cognitive_behavioral'],
     'published', 'u2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Associate resources with categories
INSERT INTO resources.resource_categories (resource_id, category_id, is_primary) VALUES
    ('res11111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', true),
    ('res22222-2222-2222-2222-222222222222', 'cat22222-2222-2222-2222-222222222222', true),
    ('res22222-2222-2222-2222-222222222222', 'cat33333-3333-3333-3333-333333333333', false),
    ('res33333-3333-3333-3333-333333333333', 'cat11111-1111-1111-1111-111111111111', false),
    ('res33333-3333-3333-3333-333333333333', 'cat22222-2222-2222-2222-222222222222', true)
ON CONFLICT (resource_id, category_id) DO NOTHING;

-- Associate resources with tags
INSERT INTO resources.resource_tags (resource_id, tag_id) VALUES
    ('res11111-1111-1111-1111-111111111111', 'tag11111-1111-1111-1111-111111111111'),
    ('res11111-1111-1111-1111-111111111111', 'tag33333-3333-3333-3333-333333333333'),
    ('res22222-2222-2222-2222-222222222222', 'tag22222-2222-2222-2222-222222222222'),
    ('res22222-2222-2222-2222-222222222222', 'tag33333-3333-3333-3333-333333333333'),
    ('res33333-3333-3333-3333-333333333333', 'tag11111-1111-1111-1111-111111111111'),
    ('res33333-3333-3333-3333-333333333333', 'tag22222-2222-2222-2222-222222222222'),
    ('res33333-3333-3333-3333-333333333333', 'tag55555-5555-5555-5555-555555555555')
ON CONFLICT (resource_id, tag_id) DO NOTHING;

-- Create a sample resource collection
INSERT INTO resources.collections (
    id, name, slug, description, created_by
) VALUES
    ('coll1111-1111-1111-1111-111111111111', 
     'Kit de Inicio para Terapia CBT', 
     'kit-inicio-cbt',
     'Colección de recursos esenciales para iniciar terapia cognitivo-conductual',
     'u2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Add resources to collection
INSERT INTO resources.collection_resources (collection_id, resource_id, display_order, is_required) VALUES
    ('coll1111-1111-1111-1111-111111111111', 'res11111-1111-1111-1111-111111111111', 1, true),
    ('coll1111-1111-1111-1111-111111111111', 'res33333-3333-3333-3333-333333333333', 2, true),
    ('coll1111-1111-1111-1111-111111111111', 'res22222-2222-2222-2222-222222222222', 3, false)
ON CONFLICT (collection_id, resource_id) DO NOTHING;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Sample data inserted successfully';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- 3 sample users with different roles';
    RAISE NOTICE '- 3 sample patients with medical history';
    RAISE NOTICE '- 3 medications and 2 consultations';
    RAISE NOTICE '- 3 assessment scales with items';
    RAISE NOTICE '- 6 form field types and 1 template';
    RAISE NOTICE '- 4 resource categories, 5 tags, and 3 educational resources';
    RAISE NOTICE '- 1 resource collection';
    RAISE NOTICE 'Database is ready for development and testing';
END $$;