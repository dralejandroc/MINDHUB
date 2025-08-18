-- =====================================================
-- SUPABASE SCHEMA: CLINIMETRIX PRO
-- =====================================================

-- Templates table (stores scale definitions)
CREATE TABLE IF NOT EXISTS public.clinimetrix_templates (
  id TEXT PRIMARY KEY,
  template_data JSONB NOT NULL,
  version TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registry table (catalog of available scales)
CREATE TABLE IF NOT EXISTS public.clinimetrix_registry (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES public.clinimetrix_templates(id),
  abbreviation TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  description TEXT,
  version TEXT DEFAULT '1.0',
  language TEXT DEFAULT 'es',
  authors JSONB,
  year INTEGER,
  administration_mode TEXT,
  estimated_duration_minutes INTEGER,
  target_population JSONB,
  total_items INTEGER,
  score_range_min INTEGER,
  score_range_max INTEGER,
  psychometric_properties JSONB,
  clinical_validation JSONB,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[],
  last_validated TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments table (individual scale applications)
CREATE TABLE IF NOT EXISTS public.clinimetrix_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id TEXT REFERENCES public.clinimetrix_templates(id),
  patient_id UUID REFERENCES public.patients(id),
  administrator_id UUID REFERENCES auth.users(id),
  consultation_id UUID REFERENCES public.consultations(id),
  
  -- Assessment details
  mode TEXT DEFAULT 'professional',
  status TEXT DEFAULT 'in_progress',
  responses JSONB DEFAULT '{}',
  
  -- Scoring results
  scores JSONB,
  total_score NUMERIC,
  severity_level TEXT,
  interpretation JSONB,
  subscale_scores JSONB,
  validity_indicators JSONB,
  
  -- Progress tracking
  current_step INTEGER DEFAULT 0,
  completion_time_seconds INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remote Assessments table (for sending scales via link)
CREATE TABLE IF NOT EXISTS public.clinimetrix_remote_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES public.clinimetrix_assessments(id),
  patient_id UUID REFERENCES public.patients(id),
  template_id TEXT REFERENCES public.clinimetrix_templates(id),
  
  -- Access control
  access_token TEXT UNIQUE NOT NULL,
  access_pin TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'pending',
  accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  sent_by UUID REFERENCES auth.users(id),
  sent_to_email TEXT,
  sent_to_phone TEXT,
  instructions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Responses table (for detailed response tracking)
CREATE TABLE IF NOT EXISTS public.clinimetrix_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES public.clinimetrix_assessments(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  item_id TEXT,
  response_value JSONB,
  response_text TEXT,
  response_score NUMERIC,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, item_number)
);

-- Scale Favorites (user preferences)
CREATE TABLE IF NOT EXISTS public.user_favorite_scales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES public.clinimetrix_templates(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- Indexes for performance
CREATE INDEX idx_registry_category ON public.clinimetrix_registry(category);
CREATE INDEX idx_registry_active ON public.clinimetrix_registry(is_active);
CREATE INDEX idx_assessments_patient ON public.clinimetrix_assessments(patient_id);
CREATE INDEX idx_assessments_template ON public.clinimetrix_assessments(template_id);
CREATE INDEX idx_assessments_status ON public.clinimetrix_assessments(status);
CREATE INDEX idx_assessments_administrator ON public.clinimetrix_assessments(administrator_id);
CREATE INDEX idx_remote_token ON public.clinimetrix_remote_assessments(access_token);
CREATE INDEX idx_remote_status ON public.clinimetrix_remote_assessments(status);
CREATE INDEX idx_responses_assessment ON public.clinimetrix_responses(assessment_id);

-- RLS Policies
ALTER TABLE public.clinimetrix_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinimetrix_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinimetrix_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinimetrix_remote_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinimetrix_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_scales ENABLE ROW LEVEL SECURITY;

-- Public can view active templates
CREATE POLICY "Public can view active templates" ON public.clinimetrix_templates
  FOR SELECT USING (is_active = true);

-- Public can view registry
CREATE POLICY "Public can view registry" ON public.clinimetrix_registry
  FOR SELECT USING (is_active = true AND is_public = true);

-- Healthcare professionals can manage assessments
CREATE POLICY "Healthcare professionals can manage assessments" ON public.clinimetrix_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'doctor', 'nurse', 'psychologist')
    )
  );

-- Users can manage their favorites
CREATE POLICY "Users can manage own favorites" ON public.user_favorite_scales
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_clinimetrix_templates_updated_at
  BEFORE UPDATE ON public.clinimetrix_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinimetrix_registry_updated_at
  BEFORE UPDATE ON public.clinimetrix_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinimetrix_assessments_updated_at
  BEFORE UPDATE ON public.clinimetrix_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinimetrix_remote_updated_at
  BEFORE UPDATE ON public.clinimetrix_remote_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();