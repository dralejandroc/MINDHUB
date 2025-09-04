// Types for Psychoeducational Documents System - Resources Module

export interface PsychoeducationalDocument {
  version: string;
  type: 'psychoeducational_document';
  document: DocumentStructure;
}

export interface DocumentStructure {
  id: string;
  metadata: DocumentMetadata;
  context: DocumentContext;
  tags: string[];
  uses: DocumentUses;
  content: DocumentContent;
  personalization: PersonalizationConfig;
  bibliography: Reference[];
  related_resources: string[];
  distribution: DistributionInfo;
  quality_metrics: QualityMetrics;
}

export interface DocumentMetadata {
  title: string;
  subtitle: string;
  category: DocumentCategory;
  subcategory: string;
  language: 'es' | 'en';
  reading_level: 'basic' | 'general' | 'advanced';
  estimated_reading_time: number;
  created_date: string;
  last_updated: string;
  version: string;
  author: {
    name: string;
    credentials: string;
    institution: string;
  };
}

export interface DocumentContext {
  description: string;
  target_audience: TargetAudience[];
  age_range: {
    min: number;
    max: number;
  };
  clinical_conditions: ClinicalCondition[];
  contraindications: string[];
  evidence_level: EvidenceLevel;
  therapeutic_approach: TherapeuticApproach[];
}

export interface DocumentUses {
  primary: string[];
  settings: UsageSetting[];
  delivery_methods: DeliveryMethod[];
}

export interface DocumentContent {
  introduction: {
    text: string;
    key_points: string[];
  };
  sections: DocumentSection[];
  exercises?: Exercise[];
  key_takeaways: string[];
  closing: {
    text: string;
    emergency_note?: string;
  };
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  steps?: TechniqueStep[];
  tips?: string[];
  practice_schedule?: PracticeSchedule;
  visual_aid?: {
    type: string;
    description: string;
    optional: boolean;
  };
}

export interface TechniqueStep {
  number: number;
  instruction: string;
  detail: string;
}

export interface PracticeSchedule {
  frequency: string;
  duration: string;
  best_times: string[];
}

export interface Exercise {
  name: string;
  type: 'self_monitoring' | 'worksheet' | 'reflection' | 'practice';
  instructions: string;
  tracking_table?: {
    headers: string[];
    rows_template: number;
  };
}

export interface PersonalizationConfig {
  fields: {
    patient_name: string;
    therapist_name: string;
    clinic_name: string;
    next_appointment: string;
    emergency_contact: string;
  };
  customizable_sections: string[];
  branding: {
    logo_position: 'header' | 'footer' | 'both';
    color_scheme: string;
    font_family: string;
  };
}

export interface Reference {
  type: 'article' | 'journal' | 'book' | 'website';
  authors: string[];
  year: number;
  title: string;
  source?: string;
  journal?: string;
  publisher?: string;
  volume?: number;
  pages?: string;
  doi?: string;
  url?: string;
  isbn?: string;
}

export interface DistributionInfo {
  license: string;
  can_modify: boolean;
  requires_attribution: boolean;
  internal_use_only: boolean;
}

export interface QualityMetrics {
  peer_reviewed: boolean;
  last_review_date: string;
  reviewer_ids: string[];
  patient_feedback_score?: number;
  usage_count: number;
  effectiveness_rating?: number;
}

// Enum types
export type DocumentCategory = 
  | 'anxiety_management'
  | 'depression_support'
  | 'trauma_recovery'
  | 'addiction_recovery'
  | 'eating_disorders'
  | 'psychosis_support'
  | 'relationship_skills'
  | 'emotional_regulation'
  | 'stress_management'
  | 'sleep_hygiene'
  | 'self_care'
  | 'crisis_management';

export type TargetAudience = 
  | 'patients'
  | 'caregivers'
  | 'adolescents'
  | 'adults'
  | 'elderly';

export type ClinicalCondition = 
  | 'generalized_anxiety'
  | 'panic_disorder'
  | 'social_anxiety'
  | 'phobias'
  | 'major_depression'
  | 'dysthymia'
  | 'bipolar_disorder'
  | 'ptsd'
  | 'acute_stress'
  | 'complex_trauma'
  | 'substance_use'
  | 'behavioral_addictions'
  | 'anorexia'
  | 'bulimia'
  | 'binge_eating'
  | 'schizophrenia'
  | 'schizoaffective'
  | 'brief_psychotic'
  | 'anxiety_disorders';

export type EvidenceLevel = 'high' | 'moderate' | 'low' | 'expert';

export type TherapeuticApproach = 
  | 'cognitive_behavioral'
  | 'mindfulness'
  | 'psychodynamic'
  | 'humanistic'
  | 'acceptance_commitment'
  | 'dialectical_behavioral'
  | 'emdr'
  | 'narrative'
  | 'solution_focused';

export type UsageSetting = 
  | 'consultation_handout'
  | 'homework_assignment'
  | 'emergency_toolkit'
  | 'group_therapy_material'
  | 'family_education'
  | 'peer_support';

export type DeliveryMethod = 
  | 'print'
  | 'email'
  | 'patient_portal'
  | 'whatsapp'
  | 'download';

// UI Component Props Types
export interface DocumentRendererProps {
  document: PsychoeducationalDocument;
  patientId?: string;
  isPreview?: boolean;
  onDownload?: (format: 'pdf' | 'json' | 'html') => void;
  onSendToPatient?: (method: 'email' | 'whatsapp') => void;
  className?: string;
}

export interface DocumentCatalogProps {
  patientId?: string;
  onDocumentSelect?: (document: PsychoeducationalDocument) => void;
  showActions?: boolean;
  filterCategory?: DocumentCategory;
}

// Category Configuration
export interface CategoryConfig {
  id: DocumentCategory;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const DOCUMENT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'anxiety_management',
    name: 'Manejo de Ansiedad',
    icon: '😰',
    color: 'blue',
    description: 'Técnicas para controlar y reducir la ansiedad'
  },
  {
    id: 'depression_support',
    name: 'Apoyo en Depresión',
    icon: '💙',
    color: 'indigo',
    description: 'Estrategias para lidiar con síntomas depresivos'
  },
  {
    id: 'trauma_recovery',
    name: 'Recuperación de Trauma',
    icon: '🛡️',
    color: 'purple',
    description: 'Herramientas para procesar experiencias traumáticas'
  },
  {
    id: 'stress_management',
    name: 'Manejo del Estrés',
    icon: '🧘',
    color: 'green',
    description: 'Técnicas de relajación y manejo del estrés'
  },
  {
    id: 'emotional_regulation',
    name: 'Regulación Emocional',
    icon: '🎯',
    color: 'orange',
    description: 'Habilidades para gestionar emociones intensas'
  },
  {
    id: 'relationship_skills',
    name: 'Habilidades Sociales',
    icon: '👥',
    color: 'pink',
    description: 'Comunicación y relaciones interpersonales'
  },
  {
    id: 'addiction_recovery',
    name: 'Recuperación de Adicciones',
    icon: '🔄',
    color: 'teal',
    description: 'Apoyo en procesos de recuperación'
  },
  {
    id: 'eating_disorders',
    name: 'Trastornos Alimentarios',
    icon: '🍎',
    color: 'red',
    description: 'Apoyo en trastornos de la conducta alimentaria'
  },
  {
    id: 'psychosis_support',
    name: 'Apoyo en Psicosis',
    icon: '🧠',
    color: 'violet',
    description: 'Educación y apoyo para trastornos psicóticos'
  },
  {
    id: 'sleep_hygiene',
    name: 'Higiene del Sueño',
    icon: '😴',
    color: 'slate',
    description: 'Mejoramiento de patrones de sueño'
  },
  {
    id: 'self_care',
    name: 'Autocuidado',
    icon: '💚',
    color: 'emerald',
    description: 'Práticas de bienestar personal'
  },
  {
    id: 'crisis_management',
    name: 'Manejo de Crisis',
    icon: '🚨',
    color: 'rose',
    description: 'Estrategias para situaciones de crisis'
  }
];