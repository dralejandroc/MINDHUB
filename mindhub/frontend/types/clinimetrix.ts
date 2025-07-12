/**
 * Clinimetrix Type Definitions
 * Universal Clinical Scale Interface Architecture
 */

// =============================================================================
// CORE CLINICAL SCALE TYPES
// =============================================================================

export interface ClinicalScale {
  id: string;
  name: string;
  abbreviation: string;
  version?: string;
  description?: string;
  purpose?: string;
  targetPopulation: TargetPopulation;
  
  // Administration details
  administrationMode: AdministrationMode;
  estimatedDurationMinutes?: number;
  requiresTraining: boolean;
  trainingLevelRequired?: TrainingLevel;
  
  // Scoring information
  scoringMethod: ScoringMethod;
  scoreRangeMin?: number;
  scoreRangeMax?: number;
  hasSubscales: boolean;
  
  // Psychometric properties
  reliabilityCoefficient?: number;
  validityEvidence?: string;
  normativeDataAvailable: boolean;
  
  // Categories and tags
  category: ScaleCategory;
  subcategory?: string;
  tags?: string[];
  
  // Language and localization
  availableLanguages: string[];
  culturallyAdapted: boolean;
  adaptationPopulation?: string;
  
  // Legal and ethical
  copyrightHolder?: string;
  licenseType: LicenseType;
  requiresPermission: boolean;
  costPerUse?: number;
  
  // Status
  isActive: boolean;
  isValidated: boolean;
  
  // References
  primaryReference?: string;
  additionalReferences?: string[];
  
  // Audit fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  
  // Related data
  items?: ScaleItem[];
  scoringRules?: ScoringRule[];
  interpretationRules?: InterpretationRule[];
  administrationCount?: number;
}

export interface ScaleItem {
  id: string;
  scaleId: string;
  itemNumber: number;
  itemCode?: string;
  subscale?: string;
  
  // Item content
  questionText: string;
  questionTextEn?: string;
  instructionText?: string;
  
  // Response format
  responseType: ResponseType;
  responseOptions?: ResponseOption[];
  required: boolean;
  
  // Scoring
  scoringWeight: number;
  reverseScored: boolean;
  scoringRules?: Record<string, any>;
  
  // Display
  displayOrder: number;
  displayFormat: DisplayFormat;
  
  // Validation
  minValue?: number;
  maxValue?: number;
  validationPattern?: string;
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseOption {
  value: string | number;
  label: string;
  labelEn?: string;
  score?: number;
  isDefault?: boolean;
}

export interface ScoringRule {
  id: string;
  scaleId: string;
  ruleType: ScoringRuleType;
  conditions: Record<string, any>;
  formula?: string;
  lookupTable?: Record<string, number>;
  weightings?: Record<string, number>;
}

export interface InterpretationRule {
  id: string;
  scaleId: string;
  minScore: number;
  maxScore: number;
  interpretation: string;
  severity: SeverityLevel;
  clinicalSignificance: ClinicalSignificance;
  recommendations?: string;
  colorCode?: string;
  actionRequired?: boolean;
}

// =============================================================================
// ASSESSMENT SESSION TYPES
// =============================================================================

export interface AssessmentSession {
  id: string;
  patientId: string;
  sessionName?: string;
  sessionDate: string;
  sessionType: SessionType;
  
  // Administration context
  administeredBy: string;
  administrationMode: AdministrationMode;
  location?: string;
  
  // Session status
  status: SessionStatus;
  
  // Timing
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  
  // Session notes
  preSessionNotes?: string;
  postSessionNotes?: string;
  environmentalFactors?: string;
  
  // Quality indicators
  completionRate?: number;
  responseQuality?: ResponseQuality;
  validityConcerns?: string;
  
  // Follow-up
  recommendations?: string;
  nextAssessmentRecommended: boolean;
  nextAssessmentTimeframe?: string;
  
  // Audit fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  
  // Related data
  patient?: Patient;
  administrations?: ScaleAdministration[];
  assessmentToken?: AssessmentToken;
  reports?: AssessmentReport[];
}

export interface ScaleAdministration {
  id: string;
  sessionId: string;
  scaleId: string;
  
  // Administration details
  orderInSession: number;
  startedAt?: string;
  completedAt?: string;
  
  // Completion status
  status: AdministrationStatus;
  itemsCompleted: number;
  totalItems: number;
  completionPercentage: number;
  
  // Scoring results
  rawScore?: number;
  scaledScore?: number;
  percentileRank?: number;
  tScore?: number;
  zScore?: number;
  clinicalRange?: ClinicalRange;
  
  // Subscale scores
  subscaleScores?: Record<string, number>;
  
  // Interpretation
  interpretation?: string;
  clinicalSignificance?: ClinicalSignificance;
  reliabilityEstimate?: number;
  
  // Administration notes
  administrationNotes?: string;
  scoringNotes?: string;
  
  // Audit fields
  createdAt: string;
  updatedAt: string;
  
  // Related data
  scale?: ClinicalScale;
  session?: AssessmentSession;
  responses?: ItemResponse[];
}

export interface ItemResponse {
  id: string;
  administrationId: string;
  itemId: string;
  
  // Response data
  responseValue: string;
  responseNumeric?: number;
  responseTimeSeconds?: number;
  
  // Response metadata
  responseDate: string;
  wasSkipped: boolean;
  skipReason?: SkipReason;
  
  // Quality indicators
  responseConfidence?: ResponseConfidence;
  clarificationNeeded: boolean;
  clarificationNotes?: string;
  
  // Related data
  item?: ScaleItem;
}

export interface AssessmentToken {
  id: string;
  sessionId: string;
  token: string;
  
  // Access control
  expiresAt: string;
  maxUses: number;
  usesCount: number;
  
  // Access restrictions
  allowedIpAddresses?: string[];
  allowedUserAgents?: string[];
  
  // Security settings
  requiresAuthentication: boolean;
  patientVerificationRequired: boolean;
  
  // Status
  isActive: boolean;
  firstAccessedAt?: string;
  lastAccessedAt?: string;
  
  // Audit fields
  createdAt: string;
  createdBy: string;
}

export interface AssessmentReport {
  id: string;
  sessionId: string;
  reportType: ReportType;
  reportTitle?: string;
  
  // Content
  executiveSummary?: string;
  detailedFindings?: string;
  recommendations?: string;
  clinicalImpressions?: string;
  
  // Report metadata
  generatedBy: string;
  generatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  
  // Format and distribution
  reportFormat: ReportFormat;
  confidentialityLevel: ConfidentialityLevel;
  
  // Status
  status: ReportStatus;
  isFinalized: boolean;
  finalizedAt?: string;
  
  // Distribution tracking
  sentToPatient: boolean;
  sentToReferringProvider: boolean;
  distributionLog?: Record<string, any>;
  
  // Audit fields
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// SUPPORTING TYPES FROM EXPEDIX
// =============================================================================

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  email?: string;
  phone?: string;
  // Additional patient fields as needed
}

// =============================================================================
// ENUM TYPES
// =============================================================================

export enum TargetPopulation {
  ADULTS = 'adults',
  CHILDREN = 'children',
  ADOLESCENTS = 'adolescents',
  ELDERLY = 'elderly',
  ALL = 'all',
  SPECIFIC = 'specific'
}

export enum AdministrationMode {
  SELF_REPORT = 'self_report',
  CLINICIAN_ADMINISTERED = 'clinician_administered',
  BOTH = 'both',
  IN_PERSON = 'in_person',
  REMOTE = 'remote',
  SELF_ADMINISTERED = 'self_administered',
  HYBRID = 'hybrid'
}

export enum TrainingLevel {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  SPECIALIST = 'specialist'
}

export enum ScoringMethod {
  SUM = 'sum',
  WEIGHTED = 'weighted',
  ALGORITHM = 'algorithm',
  MANUAL = 'manual',
  LOOKUP_TABLE = 'lookup_table'
}

export enum ScaleCategory {
  DEPRESSION = 'depression',
  ANXIETY = 'anxiety',
  MANIA = 'mania',
  PSYCHOSIS = 'psychosis',
  COGNITIVE = 'cognitive',
  PERSONALITY = 'personality',
  SUBSTANCE = 'substance'
}

export enum LicenseType {
  PUBLIC_DOMAIN = 'public_domain',
  LICENSED = 'licensed',
  PROPRIETARY = 'proprietary',
  CREATIVE_COMMONS = 'creative_commons'
}

export enum ResponseType {
  LIKERT = 'likert',
  YES_NO = 'yes_no',
  MULTIPLE_CHOICE = 'multiple_choice',
  TEXT = 'text',
  NUMERIC = 'numeric',
  VISUAL_ANALOG = 'visual_analog',
  CHECKLIST = 'checklist'
}

export enum DisplayFormat {
  STANDARD = 'standard',
  GRID = 'grid',
  SLIDER = 'slider',
  VISUAL_ANALOG = 'visual_analog',
  CARD = 'card'
}

export enum ScoringRuleType {
  SIMPLE_SUM = 'simple_sum',
  WEIGHTED_SUM = 'weighted_sum',
  CONDITIONAL = 'conditional',
  LOOKUP = 'lookup',
  ALGORITHM = 'algorithm'
}

export enum SeverityLevel {
  MINIMAL = 'minimal',
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  EXTREME = 'extreme'
}

export enum ClinicalSignificance {
  NOT_SIGNIFICANT = 'not_significant',
  SIGNIFICANT = 'significant',
  HIGHLY_SIGNIFICANT = 'highly_significant',
  UNKNOWN = 'unknown'
}

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

// =============================================================================
// API RESPONSE TYPES
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
// FORM AND UI TYPES
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
// SCORING AND INTERPRETATION TYPES
// =============================================================================

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
// COMPONENT PROP TYPES
// =============================================================================

export interface ScaleListProps {
  filters?: ScaleFilters;
  onScaleSelect?: (scale: ClinicalScale) => void;
  multiSelect?: boolean;
  selectedScales?: string[];
  showStats?: boolean;
}

export interface AssessmentSessionProps {
  session: AssessmentSession;
  onSessionUpdate?: (session: AssessmentSession) => void;
  onAdministrationStart?: (scaleId: string) => void;
  onAdministrationComplete?: (administration: ScaleAdministration) => void;
  readOnly?: boolean;
}

export interface ScaleAdministrationProps {
  administration: ScaleAdministration;
  onResponseSubmit?: (response: ItemResponseFormData) => void;
  onAdministrationComplete?: (administration: ScaleAdministration) => void;
  autoSave?: boolean;
  showProgress?: boolean;
}

export interface ScoringDisplayProps {
  results: ScoringResult[];
  showInterpretation?: boolean;
  showRecommendations?: boolean;
  format?: 'card' | 'table' | 'chart';
  onExport?: (format: string) => void;
}

// =============================================================================
// HOOK TYPES
// =============================================================================

export interface UseScalesOptions {
  filters?: ScaleFilters;
  enabled?: boolean;
  onSuccess?: (scales: ClinicalScale[]) => void;
  onError?: (error: Error) => void;
}

export interface UseAssessmentSessionOptions {
  sessionId?: string;
  enabled?: boolean;
  onSuccess?: (session: AssessmentSession) => void;
  onError?: (error: Error) => void;
}

export interface UseScoreCalculationOptions {
  administrationId: string;
  scaleId: string;
  responses: ItemResponse[];
  enabled?: boolean;
  onSuccess?: (results: ScoringResult) => void;
  onError?: (error: Error) => void;
}