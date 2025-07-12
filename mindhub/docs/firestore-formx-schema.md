# Firestore Schema Documentation for Formx Hub

## Overview

This document outlines the comprehensive Firestore collections schema for the Formx Hub, MindHub's form builder and management system. The schema is designed to support clinical form creation, distribution, submission handling, and analytics while ensuring compliance with healthcare regulations.

## Collection Architecture

### 1. form_templates

**Purpose**: Store reusable form templates for healthcare professionals

```javascript
{
  // Identity & Metadata
  template_id: "phq9_depression_scale",
  template_name: "PHQ-9 Depression Scale",
  template_description: "Patient Health Questionnaire-9 for depression screening",
  template_version: "1.0.0",
  category: "clinical", // 'clinical', 'intake', 'assessment', 'survey', 'consent'
  specialty: "psychiatry", // 'psychiatry', 'psychology', 'general'
  
  // Configuration
  is_active: true,
  is_public: true,
  is_verified: true, // Verified by clinical team
  compliance_tags: ["NOM-024-SSA3-2010", "clinical_validated"],
  language: "es",
  
  // Form Structure
  sections: [{
    section_id: "phq9_questions",
    section_title: "Cuestionario PHQ-9",
    section_description: "Durante las últimas 2 semanas...",
    section_order: 1,
    is_required: true,
    fields: [{
      field_id: "q1_little_interest",
      field_name: "little_interest",
      field_type: "radio", // 'text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'number', 'scale', 'file'
      field_label: "Poco interés o placer en hacer cosas",
      is_required: true,
      validation_rules: {
        min_length: 1,
        max_length: 100,
        pattern: "^[a-zA-Z0-9\\s]+$"
      },
      options: [
        { value: 0, label: "Para nada" },
        { value: 1, label: "Varios días" },
        { value: 2, label: "Más de la mitad de los días" },
        { value: 3, label: "Casi todos los días" }
      ],
      conditional_logic: {
        show_if: { field: "screening_type", value: "depression" },
        required_if: { field: "complete_assessment", value: true }
      },
      clinical_coding: {
        icd_10: "Z13.31",
        dsm_5: "criterion_a1",
        snomed_ct: "225336008"
      }
    }]
  }],
  
  // Styling & Layout
  styling: {
    theme: "healthcare",
    primary_color: "#0ea5e9",
    font_family: "Inter",
    layout_type: "single_page" // 'single_page', 'multi_page', 'wizard'
  },
  
  // Clinical Settings
  clinical_settings: {
    scoring_method: "sum_total",
    interpretation_guide: "PHQ-9 scoring: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe",
    reference_ranges: [
      { range: "0-4", interpretation: "Depresión mínima", action: "none" },
      { range: "5-9", interpretation: "Depresión leve", action: "monitoring" },
      { range: "10-14", interpretation: "Depresión moderada", action: "treatment_recommended" },
      { range: "15-19", interpretation: "Depresión moderadamente severa", action: "treatment_required" },
      { range: "20-27", interpretation: "Depresión severa", action: "immediate_attention" }
    ],
    clinical_alerts: [
      { condition: "score >= 15", message: "Severe depression detected", priority: "high" }
    ],
    follow_up_triggers: [
      { condition: "suicidal_ideation == true", action: "immediate_intervention" }
    ]
  },
  
  // Usage Statistics
  usage_stats: {
    total_uses: 1245,
    total_submissions: 987,
    average_completion_time: 420, // seconds
    completion_rate: 0.89,
    last_used: "2025-07-12T10:30:00Z"
  },
  
  // Audit
  created_by: "dr_martinez_123",
  created_at: "2025-07-01T09:00:00Z",
  updated_by: "clinical_admin",
  updated_at: "2025-07-10T14:30:00Z",
  version_history: ["1.0.0"]
}
```

### 2. forms

**Purpose**: Active form instances created from templates

```javascript
{
  // Identity
  form_id: "form_phq9_20250712_001",
  template_id: "phq9_depression_scale",
  form_title: "PHQ-9 para Juan Pérez",
  form_description: "Evaluación de depresión - Seguimiento mensual",
  
  // Ownership
  created_by: "dr_martinez_123",
  organization_id: "clinica_bienestar_mx",
  patient_id: "patient_encrypted_id_456", // Encrypted
  
  // Configuration
  is_active: true,
  is_published: true,
  requires_authentication: true,
  is_anonymous: false,
  
  // Distribution
  distribution_method: "email", // 'link', 'email', 'qr_code', 'embedded'
  access_url: "https://forms.mindhub.com/f/abc123xyz",
  qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?data=...",
  expiration_date: "2025-07-19T23:59:59Z",
  max_submissions: 1,
  current_submissions: 0,
  
  // Submission Settings
  submission_settings: {
    allow_multiple: false,
    allow_edit: true,
    save_progress: true,
    send_confirmation: true,
    notification_emails: ["dr.martinez@clinica.com"]
  },
  
  // Privacy & Security
  privacy_settings: {
    collect_ip: false,
    collect_user_agent: true,
    require_consent: true,
    data_retention_days: 1825, // 5 years
    anonymize_after_days: 2555 // 7 years
  },
  
  // Integration
  integrations: {
    webhook_url: "https://api.clinica.com/webhooks/form-submission",
    email_notifications: ["admin@clinica.com"],
    export_destinations: ["expedix_patient_record"]
  },
  
  // Statistics
  stats: {
    views: 15,
    starts: 12,
    completions: 8,
    completion_rate: 0.67,
    average_time: 380 // seconds
  },
  
  // Audit
  created_at: "2025-07-12T08:00:00Z",
  updated_at: "2025-07-12T09:15:00Z",
  published_at: "2025-07-12T08:30:00Z",
  last_submission: "2025-07-12T10:45:00Z"
}
```

### 3. submissions

**Purpose**: Store form submission data with encryption for PII

```javascript
{
  // Identity
  submission_id: "sub_20250712_phq9_001",
  form_id: "form_phq9_20250712_001",
  template_id: "phq9_depression_scale",
  
  // Submitter
  submitter_type: "patient", // 'patient', 'professional', 'anonymous'
  submitter_id: "encrypted_patient_id_789",
  patient_id: "encrypted_patient_id_789",
  professional_id: "dr_martinez_123",
  
  // Submission Data (encrypted for sensitive fields)
  form_data: {
    // Encrypted object containing all form responses
    encrypted_responses: "eyJhbGciOiJBMjU2R0NNIiwiZW5jIjoiQTI1NkdDTSJ9...",
    encryption_key_id: "projects/mindhub/locations/global/keyRings/patient-data/cryptoKeys/form-responses"
  },
  
  // Clinical Results
  raw_scores: {
    q1_little_interest: 2,
    q2_feeling_down: 2,
    q3_sleep_problems: 1,
    // ... other responses
  },
  calculated_scores: {
    total_score: 12,
    severity_level: "moderate",
    percentile: 65
  },
  interpretation: "Moderate depression symptoms detected. Treatment recommended.",
  clinical_flags: [
    {
      flag_type: "treatment_needed",
      priority: "medium",
      message: "Score indicates moderate depression - recommend clinical follow-up"
    }
  ],
  
  // Form State
  status: "completed", // 'draft', 'in_progress', 'completed', 'reviewed', 'archived'
  completion_percentage: 100,
  is_complete: true,
  
  // Technical Metadata (anonymized)
  submission_metadata: {
    ip_address: "hash_of_ip_address",
    user_agent: "Mozilla/5.0...",
    session_id: "sess_abc123xyz",
    browser_fingerprint: "fp_hash_456def",
    device_type: "mobile",
    geolocation: null // Only with explicit consent
  },
  
  // Timing
  started_at: "2025-07-12T10:30:00Z",
  completed_at: "2025-07-12T10:37:30Z",
  last_updated: "2025-07-12T10:37:30Z",
  time_spent: 450, // seconds
  
  // Quality Assurance
  validation_status: "valid", // 'valid', 'invalid', 'needs_review'
  validation_errors: [],
  duplicate_check: false,
  fraud_score: 0.05, // Low risk
  
  // Clinical Review
  clinical_review: {
    reviewed_by: "dr_martinez_123",
    reviewed_at: "2025-07-12T11:15:00Z",
    review_status: "approved", // 'pending', 'approved', 'flagged', 'rejected'
    review_notes: "Consistent with previous assessments. Recommend continued therapy.",
    follow_up_required: true,
    follow_up_date: "2025-08-12T10:00:00Z"
  },
  
  // Privacy & Compliance
  consent_given: true,
  consent_timestamp: "2025-07-12T10:30:15Z",
  data_retention_until: "2030-07-12T23:59:59Z",
  anonymization_status: "identified", // 'identified', 'pseudonymized', 'anonymized'
  
  // Integration Status
  export_status: {
    expedix_exported: true,
    expedix_export_date: "2025-07-12T10:40:00Z",
    webhook_delivered: true,
    email_sent: true
  },
  
  // Audit
  created_at: "2025-07-12T10:30:00Z",
  updated_at: "2025-07-12T11:15:00Z",
  version: 1
}
```

### 4. form_analytics

**Purpose**: Aggregated analytics and reporting data

```javascript
{
  // Identity
  analytics_id: "analytics_phq9_202507_weekly",
  form_id: "form_phq9_20250712_001",
  template_id: "phq9_depression_scale",
  period: "weekly", // 'daily', 'weekly', 'monthly', 'yearly'
  date_range: {
    start_date: "2025-07-06T00:00:00Z",
    end_date: "2025-07-12T23:59:59Z"
  },
  
  // Usage Analytics
  usage_metrics: {
    total_views: 127,
    unique_visitors: 89,
    total_starts: 98,
    total_completions: 76,
    completion_rate: 0.776,
    abandonment_rate: 0.224,
    average_completion_time: 425, // seconds
    bounce_rate: 0.15
  },
  
  // Response Analytics
  response_metrics: {
    total_responses: 76,
    valid_responses: 74,
    invalid_responses: 2,
    duplicate_responses: 0,
    response_quality_score: 0.97
  },
  
  // Clinical Analytics (anonymized)
  clinical_metrics: {
    score_distribution: {
      "0-4": 12,   // minimal
      "5-9": 23,   // mild
      "10-14": 28, // moderate
      "15-19": 11, // moderately severe
      "20-27": 2   // severe
    },
    severity_distribution: {
      minimal: 12,
      mild: 23,
      moderate: 28,
      moderately_severe: 11,
      severe: 2
    },
    clinical_flags_summary: {
      treatment_needed: 41,
      immediate_attention: 2,
      follow_up_required: 65
    },
    interpretation_summary: {
      "no_treatment": 12,
      "monitoring_recommended": 23,
      "treatment_recommended": 39,
      "immediate_intervention": 2
    },
    follow_up_required_count: 65
  },
  
  // Demographic Analytics (anonymized & aggregated)
  demographic_metrics: {
    age_distribution: {
      "18-25": 15,
      "26-35": 28,
      "36-45": 18,
      "46-55": 12,
      "56+": 3
    },
    gender_distribution: {
      masculine: 32,
      feminine: 41,
      other: 2,
      not_specified: 1
    },
    location_distribution: {
      "Ciudad de México": 45,
      "Guadalajara": 18,
      "Monterrey": 13
    }
  },
  
  // Performance Analytics
  performance_metrics: {
    average_load_time: 2.3, // seconds
    error_rate: 0.02,
    mobile_usage_percentage: 0.68,
    browser_distribution: {
      chrome: 56,
      safari: 18,
      firefox: 12,
      edge: 8,
      other: 6
    },
    device_distribution: {
      mobile: 68,
      desktop: 28,
      tablet: 4
    }
  },
  
  // Trend Analysis
  trends: {
    usage_trend: "increasing", // 'increasing', 'decreasing', 'stable'
    completion_trend: "stable",
    quality_trend: "improving",
    performance_trend: "stable"
  },
  
  // Generated Reports
  generated_reports: [
    {
      report_id: "weekly_summary_20250712",
      report_type: "clinical_summary",
      generated_at: "2025-07-13T08:00:00Z",
      file_url: "gs://mindhub-reports/formx/weekly_summary_20250712.pdf"
    }
  ],
  
  // Audit
  generated_at: "2025-07-13T08:00:00Z",
  generated_by: "analytics_service",
  version: 1
}
```

### 5. form_library

**Purpose**: Curated library of validated clinical forms

```javascript
{
  // Identity
  library_id: "phq9_library_entry",
  form_name: "PHQ-9 Patient Health Questionnaire",
  form_category: "depression_screening",
  clinical_domain: "depression", // 'depression', 'anxiety', 'adhd', 'ptsd', etc.
  
  // Clinical Validation
  validation_status: "validated", // 'validated', 'pending', 'deprecated'
  clinical_evidence: {
    validation_studies: [
      "Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9",
      "Manea, L., Gilbody, S., & McMillan, D. (2012). Optimal cut-off score"
    ],
    reliability_coefficients: {
      cronbach_alpha: 0.89,
      test_retest: 0.84,
      inter_rater: 0.91
    },
    validity_measures: {
      sensitivity: 0.88,
      specificity: 0.88,
      positive_predictive_value: 0.73,
      negative_predictive_value: 0.96
    },
    normative_data: {
      sample_size: 6000,
      population: "adult_primary_care",
      demographics: "mixed_age_gender_ethnicity"
    },
    clinical_cutoffs: {
      minimal: "0-4",
      mild: "5-9",
      moderate: "10-14",
      moderately_severe: "15-19",
      severe: "20-27"
    }
  },
  
  // Regulatory Compliance
  regulatory_approvals: ["FDA_cleared", "COFEPRIS_approved"],
  compliance_certifications: ["NOM-024-SSA3-2010", "clinical_validation"],
  
  // Usage Guidelines
  administration_guidelines: "Self-administered questionnaire. Can be completed in clinical or home setting. Average completion time: 2-3 minutes.",
  interpretation_guidelines: "Scores should be interpreted in clinical context. Consider cultural factors and comorbidities.",
  contraindications: ["severe_cognitive_impairment", "active_psychosis", "language_barrier"],
  age_restrictions: {
    minimum_age: 18,
    maximum_age: null,
    pediatric_version_available: true
  },
  
  // Licensing & Copyright
  copyright_info: {
    copyright_holder: "Pfizer Inc.",
    license_type: "public_domain",
    usage_restrictions: [],
    attribution_required: true
  },
  licensing_terms: "Available for use in clinical practice and research without fee",
  usage_restrictions: [],
  
  // Multilingual Support
  available_languages: ["en", "es", "fr", "pt", "de"],
  translation_quality: {
    es: "professionally_validated",
    fr: "community_translated",
    pt: "professionally_validated"
  },
  cultural_adaptations: [
    {
      culture: "mexican_spanish",
      adaptations: ["terminology_adjustments", "cultural_context"],
      validator: "Instituto Nacional de Psiquiatría"
    }
  ],
  
  // Integration
  template_ids: ["phq9_depression_scale", "phq9_spanish", "phq9_short"],
  versions: [
    {
      version: "1.0.0",
      template_id: "phq9_depression_scale",
      language: "es",
      status: "current"
    }
  ],
  
  // Curation
  curated_by: "clinical_committee",
  curated_at: "2025-01-15T10:00:00Z",
  last_reviewed: "2025-07-01T14:00:00Z",
  next_review_due: "2026-07-01T14:00:00Z"
}
```

### 6. user_responses

**Purpose**: Individual field responses for analysis and research (anonymized)

```javascript
{
  // Identity
  response_id: "resp_phq9_q1_20250712_001",
  submission_id: "sub_20250712_phq9_001",
  form_id: "form_phq9_20250712_001",
  field_id: "q1_little_interest",
  
  // Response Data
  field_value: "2", // Original response
  normalized_value: "2", // Standardized format
  response_time: 8.5, // seconds to answer this field
  
  // Anonymized Metadata
  respondent_segment: "adult_urban_high_education", // Demographic cluster
  response_pattern: "quick_decisive", // Response behavior pattern
  
  // Quality Metrics
  confidence_score: 0.95, // AI-assessed response confidence
  validity_flags: [], // Any validation issues
  
  // Research Consent
  research_consent: true,
  research_participant_id: "research_anon_id_456", // Anonymized for research
  
  // Timestamps
  created_at: "2025-07-12T10:32:15Z",
  anonymized_at: "2025-07-12T11:00:00Z"
}
```

### 7. form_versions

**Purpose**: Version control for forms and templates

```javascript
{
  // Version Identity
  version_id: "version_phq9_1_1_0",
  parent_id: "phq9_depression_scale",
  parent_type: "template", // 'form' or 'template'
  version_number: "1.1.0",
  
  // Version Data
  version_data: {
    // Complete snapshot of form/template at this version
    // ... (same structure as parent object)
  },
  changes_summary: "Added cultural adaptation for Mexican Spanish, updated scoring algorithm",
  migration_notes: "Existing submissions remain compatible. New submissions use updated scoring.",
  
  // Version Control
  created_by: "dr_clinical_lead",
  created_at: "2025-07-10T15:30:00Z",
  is_current: true,
  is_deprecated: false,
  
  // Compatibility
  backward_compatible: true,
  migration_required: false,
  affected_submissions: 0 // Number of existing submissions affected
}
```

### 8. form_distribution

**Purpose**: Track form distribution and access

```javascript
{
  // Distribution Identity
  distribution_id: "dist_phq9_email_20250712_001",
  form_id: "form_phq9_20250712_001",
  distribution_type: "email", // 'email', 'sms', 'qr_code', 'link', 'embedded'
  
  // Distribution Details
  recipient_info: {
    // Encrypted contact information
    encrypted_email: "encrypted_email_hash",
    recipient_type: "patient",
    patient_id: "encrypted_patient_id_789"
  },
  distribution_channel: "automated_reminder",
  access_method: "secure_link",
  
  // Access Tracking (anonymized)
  access_logs: [
    {
      timestamp: "2025-07-12T10:30:00Z",
      action: "email_opened",
      ip_hash: "hashed_ip_address",
      user_agent: "mobile_safari"
    },
    {
      timestamp: "2025-07-12T10:31:00Z",
      action: "form_accessed",
      ip_hash: "hashed_ip_address",
      user_agent: "mobile_safari"
    }
  ],
  completion_status: "completed",
  
  // Privacy
  anonymized: false,
  retention_until: "2030-07-12T23:59:59Z",
  
  // Audit
  distributed_at: "2025-07-12T08:00:00Z",
  distributed_by: "dr_martinez_123",
  last_access: "2025-07-12T10:37:30Z"
}
```

## Security Rules

### Authentication Requirements
- All collections require authentication except `form_library` (public read)
- User roles: `admin`, `clinical_admin`, `professional`, `patient`, `researcher`, `analyst`

### Access Control Patterns

```javascript
// Form Templates - Read for authenticated, write for admins
match /form_templates/{templateId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    (request.auth.token.role == 'admin' || 
     request.auth.token.role == 'clinical_admin');
}

// Forms - Ownership-based access
match /forms/{formId} {
  allow read, write: if request.auth != null && 
    (resource.data.created_by == request.auth.uid ||
     request.auth.token.role == 'admin' ||
     request.auth.token.organization_id == resource.data.organization_id);
}

// Submissions - Strict patient data protection
match /submissions/{submissionId} {
  allow read, write: if request.auth != null && 
    (resource.data.submitter_id == request.auth.uid ||
     resource.data.professional_id == request.auth.uid ||
     request.auth.token.role == 'admin');
}
```

## Indexes

### Composite Indexes
1. **Forms Query**: `created_by ASC, is_active ASC, created_at DESC`
2. **Submissions Query**: `form_id ASC, status ASC, completed_at DESC`
3. **Templates Query**: `category ASC, specialty ASC, is_active ASC`
4. **Analytics Query**: `form_id ASC, period ASC, date_range.start_date DESC`

### Single Field Indexes
- Auto-generated for all query fields
- Custom indexes for encrypted fields

## Data Flow

```
1. Template Creation → form_templates
2. Form Creation → forms (from template)
3. Form Distribution → form_distribution
4. Form Submission → submissions
5. Response Processing → user_responses
6. Analytics Generation → form_analytics
7. Version Control → form_versions
```

## Compliance Features

### NOM-024-SSA3-2010 Compliance
- **Data Classification**: All PII encrypted at field level
- **Retention Policies**: Configurable retention periods
- **Audit Trails**: Complete audit logging
- **Access Controls**: Role-based access with healthcare hierarchy
- **Data Anonymization**: Automatic anonymization after retention period

### Privacy Protection
- **Encryption**: Field-level encryption for sensitive data
- **Anonymization**: Automatic de-identification
- **Consent Management**: Granular consent tracking
- **Data Minimization**: Collect only necessary data

### Security Measures
- **Access Logging**: All data access logged
- **Fraud Detection**: Response quality scoring
- **Duplicate Prevention**: Submission deduplication
- **Integrity Checks**: Data validation and verification

---

*Document Version: 1.0*  
*Last Updated: 2025-07-12*  
*Next Review: 2025-10-12*  
*Classification: Internal - Technical Documentation*