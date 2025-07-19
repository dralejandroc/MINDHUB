/**
 * Clinimetrix Universal Type Definitions
 * Database-First Architecture for Clinical Scales
 * 
 * Este archivo define todos los tipos TypeScript necesarios para el sistema
 * universal de escalas clínicas que funciona con arquitectura database-first.
 */

// =============================================================================
// ENUMS PRINCIPALES
// =============================================================================

export enum ResponseType {
  LIKERT = 'likert',
  YES_NO = 'yes_no',
  TRUE_FALSE = 'true_false',
  MULTIPLE_CHOICE = 'multiple_choice',
  NUMERIC = 'numeric',
  TEXT = 'text',
  VISUAL_ANALOG = 'visual_analog',
  SCALE = 'scale',
  RATING = 'rating',
  CHECKBOX = 'checkbox',
  DROPDOWN = 'dropdown',
  SLIDER = 'slider',
  CHECKLIST = 'checklist',
  CUSTOM = 'custom'
}

export enum ScoringMethod {
  SUM = 'sum',
  WEIGHTED_SUM = 'weighted_sum',
  AVERAGE = 'average',
  MEDIAN = 'median',
  MAX = 'max',
  MIN = 'min',
  ALGORITHM = 'algorithm',
  LOOKUP_TABLE = 'lookup_table',
  SUBSCALES = 'subscales',
  COMPLEX = 'complex',
  PERCENTAGE = 'percentage',
  STANDARDIZED = 'standardized',
  MANUAL = 'manual'
}

export enum AdministrationMode {
  SELF_ADMINISTERED = 'self_administered',
  CLINICIAN_ADMINISTERED = 'clinician_administered',
  COMPUTER_ADMINISTERED = 'computer_administered',
  BOTH = 'both',
  IN_PERSON = 'in_person',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  MIXED = 'mixed'
}

export enum ScaleCategory {
  DEPRESSION = 'depression',
  ANXIETY = 'anxiety',
  COGNITIVE = 'cognitive',
  PERSONALITY = 'personality',
  PSYCHOSIS = 'psychosis',
  SUBSTANCE_USE = 'substance_use',
  EATING_DISORDERS = 'eating_disorders',
  TRAUMA = 'trauma',
  BIPOLAR = 'bipolar',
  ADHD = 'adhd',
  AUTISM = 'autism',
  MANIA = 'mania',
  SUBSTANCE = 'substance',
  GENERAL = 'general'
}

export enum SeverityLevel {
  MINIMAL = 'minimal',
  MILD = 'mild',
  MODERATE = 'moderate',
  MODERATELY_SEVERE = 'moderately_severe',
  SEVERE = 'severe',
  EXTREME = 'extreme'
}

export enum ClinicalSignificance {
  NOT_SIGNIFICANT = 'not_significant',
  MILD = 'mild',
  SIGNIFICANT = 'significant',
  HIGHLY_SIGNIFICANT = 'highly_significant',
  SEVERE = 'severe',
  UNKNOWN = 'unknown'
}

export enum TargetPopulation {
  ADULTS = 'adults',
  CHILDREN = 'children',
  ADOLESCENTS = 'adolescents',
  ELDERLY = 'elderly',
  OLDER_ADULTS = 'older_adults',
  ALL = 'all',
  SPECIFIC = 'specific'
}

export enum LicenseType {
  PUBLIC_DOMAIN = 'public_domain',
  FREE = 'free',
  LICENSED = 'licensed',
  PROPRIETARY = 'proprietary',
  CREATIVE_COMMONS = 'creative_commons'
}

export enum DisplayFormat {
  STANDARD = 'standard',
  RADIO_BUTTON = 'radio_button',
  GRID = 'grid',
  SLIDER = 'slider',
  VISUAL_ANALOG = 'visual_analog',
  CARD = 'card'
}

export enum TrainingLevel {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  SPECIALIST = 'specialist'
}

export enum ValidationLevel {
  NONE = 'none',
  BASIC = 'basic',
  VALIDATED = 'validated',
  GOLD_STANDARD = 'gold_standard'
}

// =============================================================================
// INTERFACES PRINCIPALES DEL SISTEMA UNIVERSAL
// =============================================================================

/**
 * Escala clínica universal - Refleja el esquema de la tabla 'scales'
 */
export interface ClinicalScale {
  // Campos de la tabla 'scales'
  id: string;
  name: string;
  abbreviation: string;
  version?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  author?: string;
  publication_year?: number;
  estimated_duration_minutes?: number;
  administration_mode?: string;
  target_population?: string;
  total_items: number;
  scoring_method?: string;
  score_range_min?: number;
  score_range_max?: number;
  instructions_professional?: string;
  instructions_patient?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Campos adicionales para compatibilidad
  purpose?: string;
  targetPopulation?: TargetPopulation;
  administrationMode?: AdministrationMode;
  estimatedDurationMinutes?: number;
  requiresTraining?: boolean;
  trainingLevelRequired?: TrainingLevel;
  scoringMethod?: ScoringMethod;
  scoreRangeMin?: number;
  scoreRangeMax?: number;
  hasSubscales?: boolean;
  reliabilityCoefficient?: number;
  validityEvidence?: string;
  normativeDataAvailable?: boolean;
  tags?: string[];
  availableLanguages?: string[];
  culturallyAdapted?: boolean;
  adaptationPopulation?: string;
  copyrightHolder?: string;
  licenseType?: LicenseType;
  requiresPermission?: boolean;
  costPerUse?: number;
  isActive?: boolean;
  isValidated?: boolean;
  primaryReference?: string;
  additionalReferences?: string[];
  createdBy?: string;
  updatedBy?: string;
  
  // Relaciones con otras tablas
  items?: ScaleItem[];
  responseOptions?: ResponseOption[];
  interpretationRules?: InterpretationRule[];
  subscales?: Subscale[];
  administrationCount?: number;
}

/**
 * Item de escala - Refleja el esquema de la tabla 'scale_items'
 */
export interface ScaleItem {
  // Campos de la tabla 'scale_items'
  id: string;
  scale_id: string;
  item_number: number;
  item_text: string;
  item_code?: string;
  subscale?: string;
  reverse_scored?: boolean;
  is_active?: boolean;
  created_at?: string;
  
  // Campos adicionales para compatibilidad
  scaleId?: string;
  itemNumber?: number;
  itemCode?: string;
  questionText?: string;
  questionTextEn?: string;
  instructionText?: string;
  responseType?: ResponseType;
  responseOptions?: ResponseOption[];
  required?: boolean;
  scoringWeight?: number;
  reverseScored?: boolean;
  scoringRules?: Record<string, any>;
  displayOrder?: number;
  displayFormat?: DisplayFormat;
  minValue?: number;
  maxValue?: number;
  validationPattern?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  
  // Validación
  validation?: ItemValidation;
  conditionalDisplay?: ConditionalRule;
  helpText?: string;
  clinicalNotes?: string;
}

/**
 * Opción de respuesta - Refleja el esquema de la tabla 'scale_response_options'
 */
export interface ResponseOption {
  // Campos de la tabla 'scale_response_options'
  id: string;
  scale_id: string;
  option_value: string;
  option_label: string;
  score_value: number;
  display_order?: number;
  is_active?: boolean;
  created_at?: string;
  
  // Campos adicionales para compatibilidad
  value?: string | number;
  label?: string;
  labelEn?: string;
  score?: number;
  isDefault?: boolean;
  description?: string;
  followUpQuestion?: string;
  triggersAlert?: boolean;
  color?: string;
  icon?: string;
}

/**
 * Regla de interpretación - Refleja el esquema de la tabla 'scale_interpretation_rules'
 */
export interface InterpretationRule {
  // Campos de la tabla 'scale_interpretation_rules'
  id: string;
  scale_id: string;
  min_score: number;
  max_score: number;
  severity_level: string;
  interpretation_label: string;
  color_code?: string;
  description?: string;
  recommendations?: string;
  is_active?: boolean;
  created_at?: string;
  
  // Campos adicionales para compatibilidad
  scaleId?: string;
  minScore?: number;
  maxScore?: number;
  interpretation?: string;
  severity?: SeverityLevel;
  clinicalSignificance?: ClinicalSignificance;
  colorCode?: string;
  actionRequired?: boolean;
  subscaleSpecific?: boolean;
  subscaleId?: string;
  populationSpecific?: boolean;
  ageRange?: {
    min: number;
    max: number;
  };
  gender?: 'male' | 'female' | 'other';
  alertLevel?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Subescala - Refleja el esquema de la tabla 'scale_subscales'
 */
export interface Subscale {
  // Campos de la tabla 'scale_subscales'
  id: string;
  scale_id: string;
  subscale_name: string;
  subscale_code?: string;
  min_score?: number;
  max_score?: number;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  
  // Campos adicionales para compatibilidad
  name?: string;
  items?: string[];
  scoringMethod?: ScoringMethod;
  interpretationRules?: InterpretationRule[];
  weight?: number;
}

// =============================================================================
// TIPOS PARA EVALUACIONES Y SESIONES
// =============================================================================

/**
 * Evaluación completa - Refleja el esquema de la tabla 'assessments'
 */
export interface Assessment {
  // Campos de la tabla 'assessments'
  id: string;
  scale_id: string;
  patient_id?: string;
  patient_name?: string;
  total_score?: number;
  completion_percentage?: number;
  administration_mode?: string;
  completed_at?: string;
  created_by?: string;
  
  // Campos adicionales para compatibilidad
  sessionId?: string;
  scaleId?: string;
  patientId?: string;
  patientName?: string;
  totalScore?: number;
  completionPercentage?: number;
  administrationMode?: AdministrationMode;
  completedAt?: string;
  createdBy?: string;
  
  // Relaciones
  scale?: ClinicalScale;
  patient?: Patient;
  responses?: ItemResponse[];
  subscaleResults?: SubscaleResult[];
}

/**
 * Respuesta a item - Refleja el esquema de la tabla 'assessment_responses'
 */
export interface ItemResponse {
  // Campos de la tabla 'assessment_responses'
  id: string;
  assessment_id: string;
  scale_id: string;
  item_number: number;
  response_value: string;
  response_label: string;
  score_value: number;
  created_at?: string;
  
  // Campos adicionales para compatibilidad
  administrationId?: string;
  itemId?: string;
  assessmentId?: string;
  scaleId?: string;
  itemNumber?: number;
  responseValue?: string;
  responseLabel?: string;
  responseNumeric?: number;
  scoreValue?: number;
  responseTimeSeconds?: number;
  responseDate?: string;
  wasSkipped?: boolean;
  skipReason?: SkipReason;
  responseConfidence?: ResponseConfidence;
  clarificationNeeded?: boolean;
  clarificationNotes?: string;
  createdAt?: string;
  respondedAt?: string;
  
  // Relaciones
  item?: ScaleItem;
}

/**
 * Resultado de subescala - Refleja el esquema de la tabla 'assessment_subscale_results'
 */
export interface SubscaleResult {
  // Campos de la tabla 'assessment_subscale_results'
  id: string;
  assessment_id: string;
  subscale_code: string;
  subscale_name: string;
  score: number;
  created_at?: string;
  
  // Campos adicionales para compatibilidad
  assessmentId?: string;
  subscaleCode?: string;
  subscaleName?: string;
  createdAt?: string;
}

// =============================================================================
// TIPOS PARA SESIONES Y ADMINISTRACIÓN
// =============================================================================

export interface AssessmentSession {
  id: string;
  patientId: string;
  sessionName?: string;
  sessionDate: string;
  sessionType: SessionType;
  administeredBy: string;
  administrationMode: AdministrationMode;
  location?: string;
  status: SessionStatus;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  preSessionNotes?: string;
  postSessionNotes?: string;
  environmentalFactors?: string;
  completionRate?: number;
  responseQuality?: ResponseQuality;
  validityConcerns?: string;
  recommendations?: string;
  nextAssessmentRecommended: boolean;
  nextAssessmentTimeframe?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  
  // Relaciones
  patient?: Patient;
  administrations?: ScaleAdministration[];
  assessmentToken?: AssessmentToken;
  reports?: AssessmentReport[];
}

export interface ScaleAdministration {
  id: string;
  sessionId: string;
  scaleId: string;
  orderInSession: number;
  startedAt?: string;
  completedAt?: string;
  status: AdministrationStatus;
  itemsCompleted: number;
  totalItems: number;
  completionPercentage: number;
  rawScore?: number;
  scaledScore?: number;
  percentileRank?: number;
  tScore?: number;
  zScore?: number;
  clinicalRange?: ClinicalRange;
  subscaleScores?: Record<string, number>;
  interpretation?: string;
  clinicalSignificance?: ClinicalSignificance;
  reliabilityEstimate?: number;
  administrationNotes?: string;
  scoringNotes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  scale?: ClinicalScale;
  session?: AssessmentSession;
  responses?: ItemResponse[];
}

// =============================================================================
// TIPOS AUXILIARES
// =============================================================================

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  email?: string;
  phone?: string;
}

export interface AssessmentToken {
  id: string;
  sessionId: string;
  token: string;
  expiresAt: string;
  maxUses: number;
  usesCount: number;
  allowedIpAddresses?: string[];
  allowedUserAgents?: string[];
  requiresAuthentication: boolean;
  patientVerificationRequired: boolean;
  isActive: boolean;
  firstAccessedAt?: string;
  lastAccessedAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface AssessmentReport {
  id: string;
  sessionId: string;
  reportType: ReportType;
  reportTitle?: string;
  executiveSummary?: string;
  detailedFindings?: string;
  recommendations?: string;
  clinicalImpressions?: string;
  generatedBy: string;
  generatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reportFormat: ReportFormat;
  confidentialityLevel: ConfidentialityLevel;
  status: ReportStatus;
  isFinalized: boolean;
  finalizedAt?: string;
  sentToPatient: boolean;
  sentToReferringProvider: boolean;
  distributionLog?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ConditionalRule {
  dependsOn: string;
  condition: 'equals' | 'not_equals' | 'greater' | 'less' | 'greater_equal' | 'less_equal' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  operator?: 'and' | 'or';
  additionalRules?: ConditionalRule[];
}

export interface ItemValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidator?: (value: any) => boolean | string;
}

export interface ScoringResult {
  scaleId: string;
  rawScore: number;
  scaledScore?: number;
  percentileRank?: number;
  tScore?: number;
  zScore?: number;
  clinicalRange: ClinicalRange;
  subscaleScores?: Record<string, number>;
  interpretation?: string;
  clinicalSignificance: ClinicalSignificance;
  reliabilityEstimate?: number;
  recommendations?: string[];
  warnings?: string[];
}

export interface InterpretationResult {
  score: number;
  interpretation: string;
  severity: SeverityLevel;
  clinicalSignificance: ClinicalSignificance;
  recommendations?: string[];
  scale: {
    name: string;
    abbreviation: string;
  };
}

// =============================================================================
// ENUMS ADICIONALES
// =============================================================================

export enum SessionType {
  INITIAL = 'initial',
  ROUTINE = 'routine',
  FOLLOW_UP = 'follow_up',
  RESEARCH = 'research',
  SCREENING = 'screening'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  INCOMPLETE = 'incomplete'
}

export enum ResponseQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  QUESTIONABLE = 'questionable'
}

export enum AdministrationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

export enum ClinicalRange {
  NORMAL = 'normal',
  BORDERLINE = 'borderline',
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CLINICAL = 'clinical',
  SUBCLINICAL = 'subclinical'
}

export enum SkipReason {
  NOT_APPLICABLE = 'not_applicable',
  REFUSED = 'refused',
  UNCLEAR = 'unclear',
  TECHNICAL_ISSUE = 'technical_issue',
  TIME_LIMIT = 'time_limit'
}

export enum ResponseConfidence {
  VERY_CONFIDENT = 'very_confident',
  CONFIDENT = 'confident',
  SOMEWHAT_CONFIDENT = 'somewhat_confident',
  NOT_CONFIDENT = 'not_confident'
}

export enum ReportType {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
  COMPARISON = 'comparison',
  PROGRESS = 'progress',
  RESEARCH = 'research'
}

export enum ReportFormat {
  PDF = 'pdf',
  HTML = 'html',
  DOCX = 'docx',
  TXT = 'txt'
}

export enum ConfidentialityLevel {
  PUBLIC = 'public',
  STANDARD = 'standard',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

export enum ReportStatus {
  DRAFT = 'draft',
  FINAL = 'final',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled'
}

export enum ScoringRuleType {
  SIMPLE_SUM = 'simple_sum',
  WEIGHTED_SUM = 'weighted_sum',
  CONDITIONAL = 'conditional',
  LOOKUP = 'lookup',
  ALGORITHM = 'algorithm'
}

// =============================================================================
// TIPOS PARA FORMULARIOS Y UI
// =============================================================================

export interface ScaleFilters {
  category?: ScaleCategory;
  administrationType?: AdministrationMode;
  targetPopulation?: TargetPopulation;
  isActive?: boolean;
  requiresTraining?: boolean;
  search?: string;
}

export interface SessionFilters {
  patientId?: string;
  status?: SessionStatus;
  sessionType?: SessionType;
  startDate?: string;
  endDate?: string;
  administeredBy?: string;
}

export interface AssessmentFormData {
  patientId: string;
  sessionName?: string;
  sessionType: SessionType;
  scaleIds: string[];
  administrationMode: AdministrationMode;
  location?: string;
  preSessionNotes?: string;
}

export interface ItemResponseFormData {
  itemId: string;
  responseValue: string;
  responseConfidence?: ResponseConfidence;
  clarificationNeeded?: boolean;
  clarificationNotes?: string;
}

// =============================================================================
// TIPOS PARA API
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ScaleUsageStats {
  totalAdministrations: number;
  topScales: Array<{
    scaleId: string;
    _count: { scaleId: number };
    scale: {
      name: string;
      abbreviation: string;
      category: string;
    };
  }>;
  categoryBreakdown: Array<{
    category: string;
    _count: { scaleId: number };
  }>;
}

// =============================================================================
// CONSTANTES
// =============================================================================

export const DEFAULT_RESPONSE_OPTIONS = {
  [ResponseType.YES_NO]: [
    { value: 'yes', label: 'Sí', score: 1 },
    { value: 'no', label: 'No', score: 0 }
  ],
  [ResponseType.TRUE_FALSE]: [
    { value: 'true', label: 'Verdadero', score: 1 },
    { value: 'false', label: 'Falso', score: 0 }
  ],
  [ResponseType.LIKERT]: [
    { value: '0', label: 'Nunca', score: 0 },
    { value: '1', label: 'Rara vez', score: 1 },
    { value: '2', label: 'A veces', score: 2 },
    { value: '3', label: 'Frecuentemente', score: 3 },
    { value: '4', label: 'Siempre', score: 4 }
  ]
};

export const SEVERITY_COLORS = {
  minimal: '#4CAF50',
  mild: '#FFC107',
  moderate: '#FF9800',
  moderately_severe: '#F44336',
  severe: '#9C27B0',
  extreme: '#c53030'
};

export default {
  ResponseType,
  ScoringMethod,
  AdministrationMode,
  ScaleCategory,
  ValidationLevel,
  SeverityLevel,
  ClinicalSignificance,
  TargetPopulation,
  LicenseType,
  DisplayFormat,
  TrainingLevel,
  DEFAULT_RESPONSE_OPTIONS,
  SEVERITY_COLORS
};