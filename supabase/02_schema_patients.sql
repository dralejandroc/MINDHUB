-- =====================================================
-- SUPABASE SCHEMA: PATIENTS & MEDICAL RECORDS
-- =====================================================

-- Patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medical_record_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  paternal_last_name TEXT,
  maternal_last_name TEXT,
  date_of_birth DATE,
  -- Age will be calculated dynamically in queries or views
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'México',
  
  -- Mexican specific fields
  curp TEXT,
  rfc TEXT,
  
  -- Medical information
  blood_type TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  current_medications TEXT[],
  
  -- Emergency contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Consent
  consent_to_treatment BOOLEAN DEFAULT false,
  consent_to_data_processing BOOLEAN DEFAULT false,
  
  -- Metadata
  patient_category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  clinic_id UUID REFERENCES public.clinic_configurations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultations table
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES auth.users(id),
  consultation_date TIMESTAMPTZ DEFAULT NOW(),
  consultation_type TEXT,
  chief_complaint TEXT,
  history_present_illness TEXT,
  physical_examination TEXT,
  assessment TEXT,
  plan TEXT,
  notes TEXT,
  diagnosis_codes TEXT[],
  follow_up_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical History
CREATE TABLE IF NOT EXISTS public.medical_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  entry_type TEXT,
  description TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.consultations(id),
  prescribed_by UUID REFERENCES auth.users(id),
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_patients_email ON public.patients(email);
CREATE INDEX idx_patients_curp ON public.patients(curp);
CREATE INDEX idx_patients_created_by ON public.patients(created_by);
CREATE INDEX idx_consultations_patient ON public.consultations(patient_id);
CREATE INDEX idx_consultations_professional ON public.consultations(professional_id);
CREATE INDEX idx_consultations_date ON public.consultations(consultation_date);
CREATE INDEX idx_medical_history_patient ON public.medical_history(patient_id);
CREATE INDEX idx_prescriptions_patient ON public.prescriptions(patient_id);

-- RLS Policies
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Healthcare professionals can view all patients
CREATE POLICY "Healthcare professionals can view patients" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'doctor', 'nurse', 'psychologist')
    )
  );

-- Healthcare professionals can create patients
CREATE POLICY "Healthcare professionals can create patients" ON public.patients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'doctor', 'nurse', 'psychologist')
    )
  );

-- Healthcare professionals can update patients
CREATE POLICY "Healthcare professionals can update patients" ON public.patients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'doctor', 'nurse', 'psychologist')
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for patients with calculated age
CREATE OR REPLACE VIEW public.patients_with_age AS
SELECT 
  *,
  CASE 
    WHEN date_of_birth IS NOT NULL THEN 
      EXTRACT(YEAR FROM AGE(date_of_birth))::INTEGER
    ELSE NULL
  END AS age
FROM public.patients;

-- Function to calculate age (helper)
CREATE OR REPLACE FUNCTION public.calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(YEAR FROM AGE(birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant permissions on the view
GRANT SELECT ON public.patients_with_age TO authenticated;
GRANT SELECT ON public.patients_with_age TO anon;