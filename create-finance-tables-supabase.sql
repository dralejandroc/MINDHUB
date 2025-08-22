-- =====================================================
-- SUPABASE FINANCE TABLES CREATION SCRIPT
-- Execute this SQL in Supabase SQL Editor
-- =====================================================

-- 1. CREATE FINANCE_INCOME TABLE
CREATE TABLE IF NOT EXISTS finance_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships with existing tables
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  consultation_id UUID, -- Optional reference to consultations
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  
  -- Financial details
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'MXN',
  
  -- Categorization
  source VARCHAR(20) DEFAULT 'consultation' CHECK (
    source IN ('consultation', 'advance', 'therapy', 'evaluation', 'procedure', 'medication', 'other')
  ),
  
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (
    payment_method IN ('cash', 'credit_card', 'debit_card', 'transfer', 'payment_gateway', 'check', 'insurance')
  ),
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'refunded')
  ),
  
  -- Description fields
  description VARCHAR(255),
  concept TEXT,
  notes TEXT,
  reference VARCHAR(100), -- Invoice/reference number
  
  -- Dates
  received_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cached names for faster queries (denormalized)
  patient_name VARCHAR(200),
  professional_name VARCHAR(200)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS finance_income_patient_id_idx ON finance_income(patient_id);
CREATE INDEX IF NOT EXISTS finance_income_professional_id_idx ON finance_income(professional_id);
CREATE INDEX IF NOT EXISTS finance_income_clinic_id_idx ON finance_income(clinic_id);
CREATE INDEX IF NOT EXISTS finance_income_received_date_idx ON finance_income(received_date);
CREATE INDEX IF NOT EXISTS finance_income_status_idx ON finance_income(status);
CREATE INDEX IF NOT EXISTS finance_income_source_idx ON finance_income(source);
CREATE INDEX IF NOT EXISTS finance_income_payment_method_idx ON finance_income(payment_method);

-- 2. CREATE CASH REGISTER CUTS TABLE
CREATE TABLE IF NOT EXISTS finance_cash_register_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  responsible_professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  
  -- Cut details
  cut_date DATE DEFAULT CURRENT_DATE NOT NULL,
  cut_number VARCHAR(50) NOT NULL,
  
  -- Cash amounts
  expected_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  difference DECIMAL(10,2) GENERATED ALWAYS AS (actual_cash - expected_cash) STORED,
  
  -- Summary by payment method
  total_cash_income DECIMAL(10,2) DEFAULT 0,
  total_card_income DECIMAL(10,2) DEFAULT 0,
  total_transfer_income DECIMAL(10,2) DEFAULT 0,
  total_other_income DECIMAL(10,2) DEFAULT 0,
  
  -- Notes and timestamps
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cached professional name
  responsible_professional_name VARCHAR(200),
  
  -- Unique constraint per clinic per date per cut number
  CONSTRAINT unique_cut_per_clinic_date UNIQUE (clinic_id, cut_date, cut_number)
);

-- Create indexes for cash register cuts
CREATE INDEX IF NOT EXISTS finance_cuts_clinic_id_idx ON finance_cash_register_cuts(clinic_id);
CREATE INDEX IF NOT EXISTS finance_cuts_cut_date_idx ON finance_cash_register_cuts(cut_date);
CREATE INDEX IF NOT EXISTS finance_cuts_professional_id_idx ON finance_cash_register_cuts(responsible_professional_id);

-- 3. CREATE FINANCIAL SERVICES TABLE
CREATE TABLE IF NOT EXISTS finance_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  
  -- Service details
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50), -- Internal service code
  description TEXT,
  category VARCHAR(100),
  
  -- Pricing
  standard_price DECIMAL(10,2) NOT NULL CHECK (standard_price >= 0),
  currency VARCHAR(3) DEFAULT 'MXN',
  
  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  allows_discount BOOLEAN DEFAULT TRUE,
  max_discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (
    max_discount_percentage >= 0 AND max_discount_percentage <= 100
  ),
  
  -- Duration and scheduling
  estimated_duration_minutes INTEGER CHECK (estimated_duration_minutes > 0),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for financial services
CREATE INDEX IF NOT EXISTS finance_services_clinic_id_idx ON finance_services(clinic_id);
CREATE INDEX IF NOT EXISTS finance_services_active_idx ON finance_services(is_active);
CREATE INDEX IF NOT EXISTS finance_services_category_idx ON finance_services(category);

-- 4. CREATE PAYMENT METHOD CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS finance_payment_method_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment method configuration
  payment_method VARCHAR(20) NOT NULL CHECK (
    payment_method IN ('cash', 'credit_card', 'debit_card', 'transfer', 'payment_gateway', 'check', 'insurance')
  ),
  
  is_enabled BOOLEAN DEFAULT TRUE,
  display_name VARCHAR(100) NOT NULL,
  
  -- Configuration for processing fees
  processing_fee_percentage DECIMAL(5,3) DEFAULT 0 CHECK (processing_fee_percentage >= 0),
  
  -- Flexible configuration (JSON)
  configuration JSONB DEFAULT '{}',
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint per clinic per payment method
  CONSTRAINT unique_payment_method_per_clinic UNIQUE (clinic_id, payment_method)
);

-- Create indexes for payment method configuration
CREATE INDEX IF NOT EXISTS finance_payment_config_clinic_id_idx ON finance_payment_method_config(clinic_id);
CREATE INDEX IF NOT EXISTS finance_payment_config_enabled_idx ON finance_payment_method_config(is_enabled);
CREATE INDEX IF NOT EXISTS finance_payment_config_order_idx ON finance_payment_method_config(display_order);

-- 5. CREATE UPDATE TIMESTAMP TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all finance tables
CREATE TRIGGER update_finance_income_updated_at
    BEFORE UPDATE ON finance_income
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_cuts_updated_at
    BEFORE UPDATE ON finance_cash_register_cuts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_services_updated_at
    BEFORE UPDATE ON finance_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_payment_config_updated_at
    BEFORE UPDATE ON finance_payment_method_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. INSERT SAMPLE DATA FOR TESTING
-- Get sample patient and clinic data
DO $$
DECLARE
    sample_patient_id UUID;
    sample_clinic_id UUID;
    sample_professional_id UUID;
BEGIN
    -- Get sample patient
    SELECT id INTO sample_patient_id FROM patients LIMIT 1;
    
    -- Get sample clinic
    SELECT id INTO sample_clinic_id FROM clinics LIMIT 1;
    
    -- Get or create sample professional
    INSERT INTO professionals (id, name, email, specialization, created_at)
    VALUES (gen_random_uuid(), 'Dr. Finance Test', 'finance.test@mindhub.com', 'psychology', NOW())
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO sample_professional_id;
    
    -- Insert sample income record if we have patient and clinic
    IF sample_patient_id IS NOT NULL AND sample_clinic_id IS NOT NULL THEN
        INSERT INTO finance_income (
            patient_id, professional_id, clinic_id, amount, currency, source, 
            payment_method, status, description, patient_name, professional_name, received_date
        ) VALUES (
            sample_patient_id, sample_professional_id, sample_clinic_id, 
            1500.00, 'MXN', 'consultation', 'cash', 'confirmed', 
            'Consulta psicológica inicial - Finance Test', 
            'Paciente Prueba Finance', 'Dr. Finance Test', CURRENT_DATE
        ) ON CONFLICT DO NOTHING;
        
        -- Insert sample financial service
        INSERT INTO finance_services (
            clinic_id, name, code, description, category, 
            standard_price, currency, is_active, allows_discount
        ) VALUES (
            sample_clinic_id, 'Consulta Psicológica', 'PSY-001', 
            'Consulta psicológica estándar de 50 minutos', 'Psicología',
            1500.00, 'MXN', TRUE, TRUE
        ) ON CONFLICT DO NOTHING;
        
        -- Insert payment method configuration
        INSERT INTO finance_payment_method_config (
            clinic_id, payment_method, is_enabled, display_name, 
            processing_fee_percentage, display_order
        ) VALUES 
            (sample_clinic_id, 'cash', TRUE, 'Efectivo', 0.0, 1),
            (sample_clinic_id, 'credit_card', TRUE, 'Tarjeta de Crédito', 2.9, 2),
            (sample_clinic_id, 'transfer', TRUE, 'Transferencia', 0.0, 3)
        ON CONFLICT (clinic_id, payment_method) DO NOTHING;
    END IF;
END $$;

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE finance_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_cash_register_cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_payment_method_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
-- Income policies
CREATE POLICY "Users can view income for their clinic" ON finance_income
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert income for their clinic" ON finance_income
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update income for their clinic" ON finance_income
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Cash register cut policies
CREATE POLICY "Users can view cash cuts for their clinic" ON finance_cash_register_cuts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert cash cuts for their clinic" ON finance_cash_register_cuts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update cash cuts for their clinic" ON finance_cash_register_cuts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Service policies
CREATE POLICY "Users can view services for their clinic" ON finance_services
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage services for their clinic" ON finance_services
    FOR ALL USING (auth.role() = 'authenticated');

-- Payment method config policies
CREATE POLICY "Users can view payment methods for their clinic" ON finance_payment_method_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage payment methods for their clinic" ON finance_payment_method_config
    FOR ALL USING (auth.role() = 'authenticated');

-- SUCCESS MESSAGE
SELECT 
    'Finance tables created successfully!' as message,
    'Tables: finance_income, finance_cash_register_cuts, finance_services, finance_payment_method_config' as tables_created,
    'Ready for Django Finance API integration' as status;