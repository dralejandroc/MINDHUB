interface Diagnosis {
  id: string;
  code?: string;
  description: string;
  category?: string;
  system?: 'CIE-10' | 'DSM-5TR' | 'CIE-11' | 'custom';
  isPrimary?: boolean;
  notes?: string;
}

export interface ConsultationData {
  consultation_type: string;
  consultation_date: string;
  current_condition: string;
  diagnosis: string;
  diagnoses: Diagnosis[];
  evaluations: string[]; // Array of evaluation IDs
  vital_signs: {
    height: string;
    weight: string;
    blood_pressure: { systolic: string; diastolic: string };
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
    oxygenSaturation: string;
  };
  physical_examination: string;
  prescriptions: any[];
  treatment_plan: string;
  indications: any[];
  additional_instructions: string;
  next_appointment: { date: string; time: string };
  mental_exam: {
    descripcionInspeccion: string;
    apariencia: string;
    actitud: string;
    conciencia: string;
    orientacion: string;
    atencion: string;
    lenguaje: string;
    afecto: string;
    sensopercepcion: string;
    memoria: string;
    pensamientoPrincipal: string;
    pensamientoDetalles: string;
    // Campos adicionales compatibles
    appearance?: string;
    attitude?: string;
    consciousness?: string;
    customAppearance?: string;
    speechRate?: string;
    speechVolume?: string;
    speechFluency?: string;
    customSpeech?: string;
    affectIntensity?: string;
    affectQuality?: string;
    customAffect?: string;
    customPerceptions?: string;
    perceptions?: string;
    memory?: string;
    thoughtContent?: string;
    customThought?: string;
    thoughtProcess?: string;
    customInsightJudgment?: string;
    generalSummary?: string;
    moodState?: string;
    customCognition?: string;
    orientation?: string;
    attention?: string;
    insight?: string;
    judgment?: string;
  };
}

export interface Consultation {
  id: string;
  date: string;
  consultation_type: string;
  consultation_date: string;
  diagnosis: string;
  current_condition: string;
  next_appointment?: {
    date: string;
    time: string;
  };
  status: 'draft' | 'completed';
  created_at: string;
}