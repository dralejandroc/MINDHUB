-- =====================================================
-- 💰 SISTEMA FINANCE REDISEÑADO - CONTROL INTERNO
-- =====================================================
-- 
-- EJECUTAR EN SUPABASE SQL EDITOR
-- Sistema simplificado para control interno de ingresos
-- NO incluye facturación fiscal ni integración SAT
-- =====================================================

-- 1. TABLA DE SERVICIOS Y TARIFAS
CREATE TABLE IF NOT EXISTS medical_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Información del servicio
    service_name VARCHAR(255) NOT NULL,
    service_code VARCHAR(50),
    description TEXT,
    category VARCHAR(100) NOT NULL,
    
    -- Precios y duración
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MXN',
    estimated_duration INTEGER, -- en minutos
    
    -- Estado y disponibilidad
    is_active BOOLEAN DEFAULT TRUE,
    requires_appointment BOOLEAN DEFAULT TRUE,
    max_sessions INTEGER, -- para tratamientos con múltiples sesiones
    
    -- Tenant context
    clinic_id UUID REFERENCES clinics(id),
    workspace_id UUID REFERENCES individual_workspaces(id),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    
    -- Constraints
    CONSTRAINT service_tenant_xor CHECK (
        (clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
        (clinic_id IS NULL AND workspace_id IS NOT NULL)
    ),
    CONSTRAINT valid_price CHECK (base_price >= 0),
    CONSTRAINT valid_duration CHECK (estimated_duration IS NULL OR estimated_duration > 0)
);

-- 2. TABLA DE INGRESOS (CONTROL INTERNO)
CREATE TABLE IF NOT EXISTS income_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referencia a la fuente del ingreso
    source_type VARCHAR(50) NOT NULL, -- 'consultation', 'appointment', 'service', 'other'
    source_id UUID, -- ID de la consulta, cita, servicio, etc.
    
    -- Información del ingreso
    service_id UUID REFERENCES medical_services(id),
    patient_id UUID REFERENCES patients(id),
    professional_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Detalles financieros
    description TEXT NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MXN',
    
    -- Método de pago y estado
    payment_method VARCHAR(50), -- 'cash', 'card', 'transfer', 'check', 'other'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'overdue', 'cancelled'
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Información de facturación (solo para solicitudes)
    requires_invoice BOOLEAN DEFAULT FALSE,
    invoice_requested_at TIMESTAMP WITH TIME ZONE,
    invoice_notes TEXT,
    tax_id_for_invoice VARCHAR(50), -- RFC del cliente
    
    -- Sesiones y tratamientos
    session_number INTEGER DEFAULT 1,
    total_sessions INTEGER DEFAULT 1,
    
    -- Tenant context
    clinic_id UUID REFERENCES clinics(id),
    workspace_id UUID REFERENCES individual_workspaces(id),
    
    -- Metadatos
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT income_tenant_xor CHECK (
        (clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
        (clinic_id IS NULL AND workspace_id IS NOT NULL)
    ),
    CONSTRAINT valid_source_type CHECK (source_type IN ('consultation', 'appointment', 'service', 'evaluation', 'other')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
    CONSTRAINT valid_amounts CHECK (
        base_amount >= 0 AND 
        discount_amount >= 0 AND 
        total_amount >= 0 AND
        total_amount = (base_amount - discount_amount)
    ),
    CONSTRAINT valid_sessions CHECK (
        session_number > 0 AND 
        total_sessions > 0 AND 
        session_number <= total_sessions
    )
);

-- 3. TABLA DE REPORTES DE INGRESOS MENSUALES (CACHE)
CREATE TABLE IF NOT EXISTS monthly_income_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Período del reporte
    year INTEGER NOT NULL,
    month INTEGER NOT NULL, -- 1-12
    
    -- Totales calculados
    total_gross_income DECIMAL(12,2) DEFAULT 0,
    total_discounts DECIMAL(12,2) DEFAULT 0,
    total_net_income DECIMAL(12,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    
    -- Desglose por método de pago
    cash_total DECIMAL(12,2) DEFAULT 0,
    card_total DECIMAL(12,2) DEFAULT 0,
    transfer_total DECIMAL(12,2) DEFAULT 0,
    other_total DECIMAL(12,2) DEFAULT 0,
    
    -- Desglose por servicio
    services_breakdown JSONB, -- {'consulta_general': 15000, 'evaluacion_psicologica': 8500}
    
    -- Estados de pago
    paid_total DECIMAL(12,2) DEFAULT 0,
    pending_total DECIMAL(12,2) DEFAULT 0,
    overdue_total DECIMAL(12,2) DEFAULT 0,
    
    -- Tenant context
    clinic_id UUID REFERENCES clinics(id),
    workspace_id UUID REFERENCES individual_workspaces(id),
    
    -- Metadatos
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT monthly_tenant_xor CHECK (
        (clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
        (clinic_id IS NULL AND workspace_id IS NOT NULL)
    ),
    CONSTRAINT valid_month CHECK (month >= 1 AND month <= 12),
    CONSTRAINT valid_year CHECK (year >= 2020 AND year <= 2050),
    -- Un reporte por mes por tenant
    CONSTRAINT unique_monthly_report UNIQUE (year, month, clinic_id, workspace_id)
);

-- 4. TABLA DE SOLICITUDES DE FACTURA
CREATE TABLE IF NOT EXISTS invoice_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referencia al ingreso
    income_record_id UUID NOT NULL REFERENCES income_records(id),
    
    -- Datos fiscales del cliente
    tax_id VARCHAR(50) NOT NULL, -- RFC
    legal_name VARCHAR(255) NOT NULL,
    tax_address TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Detalles de la solicitud
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_by UUID REFERENCES profiles(id), -- quien hizo la solicitud
    notes TEXT,
    
    -- Estado de la facturación
    status VARCHAR(20) DEFAULT 'requested', -- 'requested', 'in_process', 'completed', 'rejected'
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    
    -- Información de la factura (externa)
    external_invoice_number VARCHAR(100),
    external_invoice_url TEXT,
    external_system VARCHAR(50), -- 'manual', 'contpaqi', 'aspel', etc.
    
    -- Tenant context (heredado del income_record)
    clinic_id UUID REFERENCES clinics(id),
    workspace_id UUID REFERENCES individual_workspaces(id),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT invoice_tenant_xor CHECK (
        (clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
        (clinic_id IS NULL AND workspace_id IS NOT NULL)
    ),
    CONSTRAINT valid_status CHECK (status IN ('requested', 'in_process', 'completed', 'rejected'))
);

-- =====================================================
-- SERVICIOS MÉDICOS PREDETERMINADOS
-- =====================================================

-- Solo insertar si la tabla está vacía
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM medical_services LIMIT 1) THEN
        INSERT INTO medical_services (
            service_name, service_code, description, category,
            base_price, estimated_duration, is_active, requires_appointment
        ) VALUES
        -- Consultas Generales
        ('Consulta General', 'CONS_GEN', 'Consulta médica general', 'Consultas', 800.00, 30, TRUE, TRUE),
        ('Consulta de Primera Vez', 'CONS_1VEZ', 'Consulta médica inicial con historial completo', 'Consultas', 1200.00, 60, TRUE, TRUE),
        ('Consulta de Seguimiento', 'CONS_SEG', 'Consulta de seguimiento de tratamiento', 'Consultas', 600.00, 25, TRUE, TRUE),
        ('Consulta Urgente', 'CONS_URG', 'Consulta médica de urgencia', 'Consultas', 1500.00, 45, TRUE, FALSE),
        
        -- Evaluaciones Psicológicas
        ('Evaluación Psicológica Completa', 'EVAL_PSI', 'Evaluación psicológica integral con baterías de pruebas', 'Evaluaciones', 2500.00, 120, TRUE, TRUE),
        ('Evaluación Neuropsicológica', 'EVAL_NEU', 'Evaluación de funciones cognitivas y neuropsicológicas', 'Evaluaciones', 3000.00, 180, TRUE, TRUE),
        ('Evaluación de Depresión/Ansiedad', 'EVAL_DEP', 'Evaluación especializada en trastornos del estado de ánimo', 'Evaluaciones', 1800.00, 90, TRUE, TRUE),
        ('Evaluación Infantil', 'EVAL_INF', 'Evaluación psicológica especializada en niños', 'Evaluaciones', 2200.00, 120, TRUE, TRUE),
        
        -- Terapias
        ('Sesión de Psicoterapia Individual', 'TER_IND', 'Sesión de terapia psicológica individual', 'Terapias', 1000.00, 50, TRUE, TRUE),
        ('Sesión de Terapia de Pareja', 'TER_PAR', 'Sesión de terapia psicológica para parejas', 'Terapias', 1400.00, 60, TRUE, TRUE),
        ('Sesión de Terapia Familiar', 'TER_FAM', 'Sesión de terapia psicológica familiar', 'Terapias', 1600.00, 60, TRUE, TRUE),
        ('Sesión de Terapia Grupal', 'TER_GRU', 'Sesión de terapia psicológica en grupo', 'Terapias', 600.00, 90, TRUE, TRUE),
        
        -- Servicios Especializados
        ('Aplicación de Escalas ClinimetrixPro', 'CLIN_SCALE', 'Aplicación y análisis de escalas psicométricas', 'Evaluaciones', 500.00, 45, TRUE, TRUE),
        ('Elaboración de Informe Psicológico', 'INF_PSI', 'Redacción de informe psicológico detallado', 'Informes', 800.00, NULL, TRUE, FALSE),
        ('Interconsulta Médica', 'INTER_MED', 'Interconsulta con especialista médico', 'Consultas', 1000.00, 30, TRUE, TRUE),
        
        -- Servicios de Bienestar
        ('Sesión de Mindfulness', 'MIND_SES', 'Sesión de mindfulness y técnicas de relajación', 'Bienestar', 400.00, 45, TRUE, TRUE),
        ('Taller Grupal de Manejo de Estrés', 'TALL_EST', 'Taller grupal para manejo de estrés', 'Talleres', 300.00, 120, TRUE, TRUE),
        ('Orientación Vocacional', 'ORIENT_VOC', 'Evaluación y orientación vocacional', 'Evaluaciones', 1500.00, 90, TRUE, TRUE);
        
        RAISE NOTICE '✅ Servicios médicos predeterminados insertados';
    ELSE
        RAISE NOTICE '⚠️ La tabla medical_services ya contiene datos - saltando inserción';
    END IF;
END $$;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para medical_services
CREATE INDEX IF NOT EXISTS idx_medical_services_category ON medical_services(category);
CREATE INDEX IF NOT EXISTS idx_medical_services_active ON medical_services(is_active);
CREATE INDEX IF NOT EXISTS idx_medical_services_clinic_id ON medical_services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_services_workspace_id ON medical_services(workspace_id);

-- Índices para income_records
CREATE INDEX IF NOT EXISTS idx_income_records_patient_id ON income_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_income_records_professional_id ON income_records(professional_id);
CREATE INDEX IF NOT EXISTS idx_income_records_service_id ON income_records(service_id);
CREATE INDEX IF NOT EXISTS idx_income_records_payment_status ON income_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_income_records_recorded_at ON income_records(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_income_records_source ON income_records(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_income_records_clinic_id ON income_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_income_records_workspace_id ON income_records(workspace_id);

-- Índices para reportes mensuales
CREATE INDEX IF NOT EXISTS idx_monthly_reports_period ON monthly_income_reports(year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_clinic_id ON monthly_income_reports(clinic_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_workspace_id ON monthly_income_reports(workspace_id);

-- Índices para solicitudes de factura
CREATE INDEX IF NOT EXISTS idx_invoice_requests_income_record ON invoice_requests(income_record_id);
CREATE INDEX IF NOT EXISTS idx_invoice_requests_status ON invoice_requests(status);
CREATE INDEX IF NOT EXISTS idx_invoice_requests_requested_at ON invoice_requests(requested_at DESC);

-- =====================================================
-- FUNCIONES DE CÁLCULO AUTOMÁTICO
-- =====================================================

-- Función para actualizar reportes mensuales
CREATE OR REPLACE FUNCTION update_monthly_income_report(
    target_year INTEGER,
    target_month INTEGER,
    tenant_clinic_id UUID DEFAULT NULL,
    tenant_workspace_id UUID DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    report_data RECORD;
    services_data JSONB;
BEGIN
    -- Obtener datos agregados del mes
    SELECT 
        COALESCE(SUM(base_amount), 0) as gross_income,
        COALESCE(SUM(discount_amount), 0) as total_discounts,
        COALESCE(SUM(total_amount), 0) as net_income,
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_total,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END), 0) as card_total,
        COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END), 0) as transfer_total,
        COALESCE(SUM(CASE WHEN payment_method NOT IN ('cash', 'card', 'transfer') THEN total_amount ELSE 0 END), 0) as other_total,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as paid_total,
        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_total,
        COALESCE(SUM(CASE WHEN payment_status = 'overdue' THEN total_amount ELSE 0 END), 0) as overdue_total
    INTO report_data
    FROM income_records
    WHERE EXTRACT(YEAR FROM recorded_at) = target_year
      AND EXTRACT(MONTH FROM recorded_at) = target_month
      AND (
          (tenant_clinic_id IS NOT NULL AND clinic_id = tenant_clinic_id) OR
          (tenant_workspace_id IS NOT NULL AND workspace_id = tenant_workspace_id)
      );

    -- Obtener desglose por servicios
    SELECT jsonb_object_agg(
        COALESCE(ms.service_name, ir.description),
        SUM(ir.total_amount)
    )
    INTO services_data
    FROM income_records ir
    LEFT JOIN medical_services ms ON ir.service_id = ms.id
    WHERE EXTRACT(YEAR FROM ir.recorded_at) = target_year
      AND EXTRACT(MONTH FROM ir.recorded_at) = target_month
      AND (
          (tenant_clinic_id IS NOT NULL AND ir.clinic_id = tenant_clinic_id) OR
          (tenant_workspace_id IS NOT NULL AND ir.workspace_id = tenant_workspace_id)
      )
    GROUP BY COALESCE(ms.service_name, ir.description);

    -- Insertar o actualizar el reporte
    INSERT INTO monthly_income_reports (
        year, month, clinic_id, workspace_id,
        total_gross_income, total_discounts, total_net_income, total_transactions,
        cash_total, card_total, transfer_total, other_total,
        paid_total, pending_total, overdue_total, services_breakdown,
        generated_at, last_updated
    ) VALUES (
        target_year, target_month, tenant_clinic_id, tenant_workspace_id,
        report_data.gross_income, report_data.total_discounts, report_data.net_income, report_data.total_transactions,
        report_data.cash_total, report_data.card_total, report_data.transfer_total, report_data.other_total,
        report_data.paid_total, report_data.pending_total, report_data.overdue_total, services_data,
        NOW(), NOW()
    )
    ON CONFLICT (year, month, clinic_id, workspace_id)
    DO UPDATE SET
        total_gross_income = EXCLUDED.total_gross_income,
        total_discounts = EXCLUDED.total_discounts,
        total_net_income = EXCLUDED.total_net_income,
        total_transactions = EXCLUDED.total_transactions,
        cash_total = EXCLUDED.cash_total,
        card_total = EXCLUDED.card_total,
        transfer_total = EXCLUDED.transfer_total,
        other_total = EXCLUDED.other_total,
        paid_total = EXCLUDED.paid_total,
        pending_total = EXCLUDED.pending_total,
        overdue_total = EXCLUDED.overdue_total,
        services_breakdown = EXCLUDED.services_breakdown,
        last_updated = NOW();
        
    RAISE NOTICE 'Reporte mensual actualizado para %/% - Ingresos: $%', target_month, target_year, report_data.net_income;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar reportes cuando se modifican ingresos
CREATE OR REPLACE FUNCTION trigger_update_monthly_report()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Actualizar reporte del mes actual (NEW)
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        PERFORM update_monthly_income_report(
            EXTRACT(YEAR FROM NEW.recorded_at)::INTEGER,
            EXTRACT(MONTH FROM NEW.recorded_at)::INTEGER,
            NEW.clinic_id,
            NEW.workspace_id
        );
    END IF;
    
    -- Si es UPDATE y cambió el mes, actualizar también el mes anterior (OLD)
    IF TG_OP = 'UPDATE' AND 
       (EXTRACT(YEAR FROM OLD.recorded_at) != EXTRACT(YEAR FROM NEW.recorded_at) OR
        EXTRACT(MONTH FROM OLD.recorded_at) != EXTRACT(MONTH FROM NEW.recorded_at)) THEN
        PERFORM update_monthly_income_report(
            EXTRACT(YEAR FROM OLD.recorded_at)::INTEGER,
            EXTRACT(MONTH FROM OLD.recorded_at)::INTEGER,
            OLD.clinic_id,
            OLD.workspace_id
        );
    END IF;
    
    -- Si es DELETE, actualizar el mes del registro eliminado (OLD)
    IF TG_OP = 'DELETE' THEN
        PERFORM update_monthly_income_report(
            EXTRACT(YEAR FROM OLD.recorded_at)::INTEGER,
            EXTRACT(MONTH FROM OLD.recorded_at)::INTEGER,
            OLD.clinic_id,
            OLD.workspace_id
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para reportes automáticos
DROP TRIGGER IF EXISTS trigger_monthly_report_update ON income_records;
CREATE TRIGGER trigger_monthly_report_update
    AFTER INSERT OR UPDATE OR DELETE ON income_records
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_monthly_report();

-- =====================================================
-- HABILITAR RLS Y POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE medical_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_income_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para medical_services
CREATE POLICY "Users can view services in their tenant" ON medical_services
    FOR SELECT USING (
        (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())) OR
        (workspace_id IN (SELECT id FROM individual_workspaces WHERE owner_id = auth.uid()))
    );

CREATE POLICY "Users can manage services in their tenant" ON medical_services
    FOR ALL USING (
        (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())) OR
        (workspace_id IN (SELECT id FROM individual_workspaces WHERE owner_id = auth.uid()))
    );

-- Políticas para income_records
CREATE POLICY "Users can view income records in their tenant" ON income_records
    FOR SELECT USING (
        (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())) OR
        (workspace_id IN (SELECT id FROM individual_workspaces WHERE owner_id = auth.uid()))
    );

CREATE POLICY "Users can manage income records in their tenant" ON income_records
    FOR ALL USING (
        (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())) OR
        (workspace_id IN (SELECT id FROM individual_workspaces WHERE owner_id = auth.uid()))
    );

-- Políticas para monthly_income_reports
CREATE POLICY "Users can view reports in their tenant" ON monthly_income_reports
    FOR SELECT USING (
        (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())) OR
        (workspace_id IN (SELECT id FROM individual_workspaces WHERE owner_id = auth.uid()))
    );

-- Políticas para invoice_requests
CREATE POLICY "Users can view invoice requests in their tenant" ON invoice_requests
    FOR SELECT USING (
        (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())) OR
        (workspace_id IN (SELECT id FROM individual_workspaces WHERE owner_id = auth.uid()))
    );

CREATE POLICY "Users can manage invoice requests in their tenant" ON invoice_requests
    FOR ALL USING (
        (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())) OR
        (workspace_id IN (SELECT id FROM individual_workspaces WHERE owner_id = auth.uid()))
    );

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '💰 Sistema Finance rediseñado implementado exitosamente';
    RAISE NOTICE '📊 4 tablas creadas: medical_services, income_records, monthly_income_reports, invoice_requests';
    RAISE NOTICE '🏥 18 servicios médicos predeterminados agregados';
    RAISE NOTICE '🔄 Reportes mensuales automáticos configurados';
    RAISE NOTICE '📋 Sistema de solicitud de facturas implementado';
    RAISE NOTICE '🔒 RLS y políticas de seguridad habilitadas';
    RAISE NOTICE '✅ Sistema listo para control interno de ingresos';
END $$;