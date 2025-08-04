/**
 * ClinimetrixPro Components Export Index
 * 
 * Centralized exports for all ClinimetrixPro components
 */

// Main renderer component
export { default as ClinimetrixRenderer } from './ClinimetrixRenderer';

// Response type components
export { default as LikertScaleRenderer } from './response-types/LikertScaleRenderer';
export { default as BinaryResponseRenderer } from './response-types/BinaryResponseRenderer';
export { default as MultipleChoiceRenderer } from './response-types/MultipleChoiceRenderer';
export { default as NumericInputRenderer } from './response-types/NumericInputRenderer';
export { default as TextInputRenderer } from './response-types/TextInputRenderer';
export { default as InteractiveComponentRenderer } from './response-types/InteractiveComponentRenderer';
export { default as MultiFactorRenderer } from './response-types/MultiFactorRenderer';

// Navigation components
export { default as ClinimetrixProgressIndicator } from './navigation/ClinimetrixProgressIndicator';
export { default as ClinimetrixNavigationControls } from './navigation/ClinimetrixNavigationControls';
export { default as ClinimetrixSectionHeader } from './navigation/ClinimetrixSectionHeader';

// Re-export types from API client
export type {
  ClinimetrixTemplate,
  TemplateData,
  TemplateSection,
  TemplateItem,
  ResponseOption,
  Subscale,
  InterpretationRule,
  ClinimetrixRegistry,
  ClinimetrixAssessment,
  ScoringResults,
  SubscaleScore,
  ValidityIndicators,
  CreateAssessmentRequest,
  UpdateResponsesRequest,
  CompleteAssessmentRequest,
  CalculateScoresRequest
} from '@/lib/api/clinimetrix-pro-client';

// Re-export API client and utilities
export { 
  clinimetrixProClient,
  ClinimetrixProClient,
  getSeverityColor,
  formatScore,
  calculateCompletionPercentage,
  validateResponses
} from '@/lib/api/clinimetrix-pro-client';