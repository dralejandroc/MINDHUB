/**
 * Firestore Collections Schema for Formx Hub
 * 
 * Comprehensive document structure and collection hierarchy for Formx forms,
 * submissions, templates, and analytics with healthcare compliance
 */

const { Firestore } = require('@google-cloud/firestore');

class FormxFirestoreSchema {
  constructor() {
    this.firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
  }

  /**
   * Initialize all Formx collections with proper structure and validation
   */
  async initializeCollections() {
    try {
      console.log('Initializing Formx Firestore collections...');

      // Create collections and set up validation rules
      await this.createFormTemplatesCollection();
      await this.createFormsCollection();
      await this.createSubmissionsCollection();
      await this.createFormAnalyticsCollection();
      await this.createFormLibraryCollection();
      await this.createUserResponsesCollection();
      await this.createFormVersionsCollection();
      await this.createFormDistributionCollection();

      console.log('✅ All Formx collections initialized successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error initializing Formx collections:', error);
      throw error;
    }
  }

  /**
   * Collection: form_templates
   * Purpose: Store reusable form templates for healthcare professionals
   */
  async createFormTemplatesCollection() {
    const collectionRef = this.firestore.collection('form_templates');

    // Template document structure
    const templateSchema = {
      // Metadata
      template_id: 'string',
      template_name: 'string',
      template_description: 'string',
      template_version: 'string',
      category: 'string', // 'clinical', 'intake', 'assessment', 'survey', 'consent'
      specialty: 'string', // 'psychiatry', 'psychology', 'general'
      
      // Template Configuration
      is_active: 'boolean',
      is_public: 'boolean',
      is_verified: 'boolean', // Verified by clinical team
      compliance_tags: 'array', // ['NOM-024-SSA3-2010', 'HIPAA', 'GDPR']
      language: 'string', // 'es', 'en'
      
      // Form Structure
      sections: [{
        section_id: 'string',
        section_title: 'string',
        section_description: 'string',
        section_order: 'number',
        is_required: 'boolean',
        fields: [{
          field_id: 'string',
          field_name: 'string',
          field_type: 'string', // 'text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'number', 'scale', 'file'
          field_label: 'string',
          field_placeholder: 'string',
          field_description: 'string',
          is_required: 'boolean',
          validation_rules: {
            min_length: 'number',
            max_length: 'number',
            pattern: 'string',
            min_value: 'number',
            max_value: 'number',
            allowed_formats: 'array'
          },
          options: 'array', // For select, radio, checkbox
          conditional_logic: {
            show_if: 'object',
            hide_if: 'object',
            required_if: 'object'
          },
          clinical_coding: {
            icd_10: 'string',
            dsm_5: 'string',
            snomed_ct: 'string'
          }
        }]
      }],
      
      // Styling and Layout
      styling: {
        theme: 'string',
        primary_color: 'string',
        font_family: 'string',
        layout_type: 'string' // 'single_page', 'multi_page', 'wizard'
      },
      
      // Clinical Settings
      clinical_settings: {
        scoring_method: 'string',
        interpretation_guide: 'string',
        reference_ranges: 'array',
        clinical_alerts: 'array',
        follow_up_triggers: 'array'
      },
      
      // Usage Statistics
      usage_stats: {
        total_uses: 'number',
        total_submissions: 'number',
        average_completion_time: 'number',
        completion_rate: 'number',
        last_used: 'timestamp'
      },
      
      // Audit Fields
      created_by: 'string',
      created_at: 'timestamp',
      updated_by: 'string',
      updated_at: 'timestamp',
      version_history: 'array'
    };

    // Create sample template document
    const sampleTemplate = {
      template_id: 'phq9_depression_scale',
      template_name: 'PHQ-9 Depression Scale',
      template_description: 'Patient Health Questionnaire-9 for depression screening',
      template_version: '1.0.0',
      category: 'clinical',
      specialty: 'psychiatry',
      is_active: true,
      is_public: true,
      is_verified: true,
      compliance_tags: ['NOM-024-SSA3-2010', 'clinical_validated'],
      language: 'es',
      sections: [{
        section_id: 'phq9_questions',
        section_title: 'Cuestionario PHQ-9',
        section_description: 'Durante las últimas 2 semanas, ¿qué tan seguido ha tenido molestias debido a los siguientes problemas?',
        section_order: 1,
        is_required: true,
        fields: [
          {
            field_id: 'q1_little_interest',
            field_name: 'little_interest',
            field_type: 'radio',
            field_label: 'Poco interés o placer en hacer cosas',
            is_required: true,
            options: [
              { value: 0, label: 'Para nada' },
              { value: 1, label: 'Varios días' },
              { value: 2, label: 'Más de la mitad de los días' },
              { value: 3, label: 'Casi todos los días' }
            ],
            clinical_coding: {
              dsm_5: 'criterion_a1'
            }
          }
          // Additional questions would follow the same pattern
        ]
      }],
      clinical_settings: {
        scoring_method: 'sum_total',
        interpretation_guide: 'PHQ-9 scoring: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe',
        reference_ranges: [
          { range: '0-4', interpretation: 'Depresión mínima', action: 'none' },
          { range: '5-9', interpretation: 'Depresión leve', action: 'monitoring' },
          { range: '10-14', interpretation: 'Depresión moderada', action: 'treatment_recommended' },
          { range: '15-19', interpretation: 'Depresión moderadamente severa', action: 'treatment_required' },
          { range: '20-27', interpretation: 'Depresión severa', action: 'immediate_attention' }
        ]
      },
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date()
    };

    await collectionRef.doc('phq9_depression_scale').set(sampleTemplate);
    console.log('✅ Form templates collection created');
  }

  /**
   * Collection: forms
   * Purpose: Active form instances created from templates
   */
  async createFormsCollection() {
    const collectionRef = this.firestore.collection('forms');

    const formSchema = {
      // Form Identity
      form_id: 'string',
      template_id: 'string',
      form_title: 'string',
      form_description: 'string',
      
      // Ownership and Access
      created_by: 'string', // Professional ID
      organization_id: 'string',
      patient_id: 'string', // Optional - if assigned to specific patient
      
      // Form Configuration
      is_active: 'boolean',
      is_published: 'boolean',
      requires_authentication: 'boolean',
      is_anonymous: 'boolean',
      
      // Distribution Settings
      distribution_method: 'string', // 'link', 'email', 'qr_code', 'embedded'
      access_url: 'string',
      qr_code_url: 'string',
      expiration_date: 'timestamp',
      max_submissions: 'number',
      current_submissions: 'number',
      
      // Form Data (inherited from template but can be customized)
      sections: 'array', // Same structure as template
      styling: 'object',
      clinical_settings: 'object',
      
      // Submission Settings
      submission_settings: {
        allow_multiple: 'boolean',
        allow_edit: 'boolean',
        save_progress: 'boolean',
        send_confirmation: 'boolean',
        notification_emails: 'array'
      },
      
      // Privacy and Security
      privacy_settings: {
        collect_ip: 'boolean',
        collect_user_agent: 'boolean',
        require_consent: 'boolean',
        data_retention_days: 'number',
        anonymize_after_days: 'number'
      },
      
      // Integration Settings
      integrations: {
        webhook_url: 'string',
        email_notifications: 'array',
        export_destinations: 'array'
      },
      
      // Statistics
      stats: {
        views: 'number',
        starts: 'number',
        completions: 'number',
        completion_rate: 'number',
        average_time: 'number'
      },
      
      // Audit
      created_at: 'timestamp',
      updated_at: 'timestamp',
      published_at: 'timestamp',
      last_submission: 'timestamp'
    };

    console.log('✅ Forms collection schema defined');
  }

  /**
   * Collection: submissions
   * Purpose: Store form submission data with encryption for PII
   */
  async createSubmissionsCollection() {
    const collectionRef = this.firestore.collection('submissions');

    const submissionSchema = {
      // Submission Identity
      submission_id: 'string',
      form_id: 'string',
      template_id: 'string',
      
      // Submitter Information
      submitter_type: 'string', // 'patient', 'professional', 'anonymous'
      submitter_id: 'string', // Encrypted if patient
      patient_id: 'string', // If submitted on behalf of patient
      professional_id: 'string',
      
      // Submission Data
      form_data: 'object', // Encrypted sensitive data
      raw_scores: 'object', // Clinical scoring results
      calculated_scores: 'object',
      interpretation: 'string',
      clinical_flags: 'array', // Automatic alerts based on responses
      
      // Form State
      status: 'string', // 'draft', 'in_progress', 'completed', 'reviewed', 'archived'
      completion_percentage: 'number',
      is_complete: 'boolean',
      
      // Technical Metadata
      submission_metadata: {
        ip_address: 'string', // Hashed for privacy
        user_agent: 'string',
        session_id: 'string',
        browser_fingerprint: 'string',
        device_type: 'string',
        geolocation: 'geopoint' // Optional, with consent
      },
      
      // Timing Information
      started_at: 'timestamp',
      completed_at: 'timestamp',
      last_updated: 'timestamp',
      time_spent: 'number', // seconds
      
      // Quality Assurance
      validation_status: 'string', // 'valid', 'invalid', 'needs_review'
      validation_errors: 'array',
      duplicate_check: 'boolean',
      fraud_score: 'number',
      
      // Clinical Review
      clinical_review: {
        reviewed_by: 'string',
        reviewed_at: 'timestamp',
        review_status: 'string', // 'pending', 'approved', 'flagged', 'rejected'
        review_notes: 'string',
        follow_up_required: 'boolean',
        follow_up_date: 'timestamp'
      },
      
      // Privacy and Compliance
      consent_given: 'boolean',
      consent_timestamp: 'timestamp',
      data_retention_until: 'timestamp',
      anonymization_status: 'string', // 'identified', 'pseudonymized', 'anonymized'
      
      // Integration and Export
      export_status: 'object', // Track which systems this was exported to
      webhook_status: 'object',
      
      // Audit Trail
      created_at: 'timestamp',
      updated_at: 'timestamp',
      version: 'number'
    };

    console.log('✅ Submissions collection schema defined');
  }

  /**
   * Collection: form_analytics
   * Purpose: Aggregated analytics and reporting data
   */
  async createFormAnalyticsCollection() {
    const collectionRef = this.firestore.collection('form_analytics');

    const analyticsSchema = {
      // Analytics Identity
      analytics_id: 'string',
      form_id: 'string',
      template_id: 'string',
      period: 'string', // 'daily', 'weekly', 'monthly', 'yearly'
      date_range: {
        start_date: 'timestamp',
        end_date: 'timestamp'
      },
      
      // Usage Analytics
      usage_metrics: {
        total_views: 'number',
        unique_visitors: 'number',
        total_starts: 'number',
        total_completions: 'number',
        completion_rate: 'number',
        abandonment_rate: 'number',
        average_completion_time: 'number',
        bounce_rate: 'number'
      },
      
      // Response Analytics
      response_metrics: {
        total_responses: 'number',
        valid_responses: 'number',
        invalid_responses: 'number',
        duplicate_responses: 'number',
        response_quality_score: 'number'
      },
      
      // Clinical Analytics
      clinical_metrics: {
        score_distribution: 'object', // Histogram of scores
        severity_distribution: 'object',
        clinical_flags_summary: 'object',
        interpretation_summary: 'object',
        follow_up_required_count: 'number'
      },
      
      // Demographic Analytics (anonymized)
      demographic_metrics: {
        age_distribution: 'object',
        gender_distribution: 'object',
        location_distribution: 'object' // Aggregated by region/state
      },
      
      // Performance Analytics
      performance_metrics: {
        average_load_time: 'number',
        error_rate: 'number',
        mobile_usage_percentage: 'number',
        browser_distribution: 'object',
        device_distribution: 'object'
      },
      
      // Trend Analysis
      trends: {
        usage_trend: 'string', // 'increasing', 'decreasing', 'stable'
        completion_trend: 'string',
        quality_trend: 'string',
        performance_trend: 'string'
      },
      
      // Generated Reports
      generated_reports: 'array',
      
      // Audit
      generated_at: 'timestamp',
      generated_by: 'string',
      version: 'number'
    };

    console.log('✅ Form analytics collection schema defined');
  }

  /**
   * Collection: form_library
   * Purpose: Curated library of validated clinical forms
   */
  async createFormLibraryCollection() {
    const collectionRef = this.firestore.collection('form_library');

    const librarySchema = {
      // Library Entry Identity
      library_id: 'string',
      form_name: 'string',
      form_category: 'string',
      clinical_domain: 'string', // 'depression', 'anxiety', 'adhd', 'ptsd', etc.
      
      // Clinical Validation
      validation_status: 'string', // 'validated', 'pending', 'deprecated'
      clinical_evidence: {
        validation_studies: 'array',
        reliability_coefficients: 'object',
        validity_measures: 'object',
        normative_data: 'object',
        clinical_cutoffs: 'object'
      },
      
      // Regulatory Compliance
      regulatory_approvals: 'array', // FDA, EMA, COFEPRIS, etc.
      compliance_certifications: 'array',
      
      // Usage Guidelines
      administration_guidelines: 'string',
      interpretation_guidelines: 'string',
      contraindications: 'array',
      age_restrictions: 'object',
      
      // Licensing and Copyright
      copyright_info: 'object',
      licensing_terms: 'string',
      usage_restrictions: 'array',
      
      // Multilingual Support
      available_languages: 'array',
      translation_quality: 'object',
      cultural_adaptations: 'array',
      
      // Integration Information
      template_ids: 'array', // Links to actual templates
      versions: 'array',
      
      // Curation
      curated_by: 'string',
      curated_at: 'timestamp',
      last_reviewed: 'timestamp',
      next_review_due: 'timestamp'
    };

    console.log('✅ Form library collection schema defined');
  }

  /**
   * Collection: user_responses
   * Purpose: Individual field responses for analysis and research
   */
  async createUserResponsesCollection() {
    const collectionRef = this.firestore.collection('user_responses');

    const responseSchema = {
      // Response Identity
      response_id: 'string',
      submission_id: 'string',
      form_id: 'string',
      field_id: 'string',
      
      // Response Data
      field_value: 'string', // Encrypted if sensitive
      normalized_value: 'string', // Standardized for analysis
      response_time: 'number', // Time to answer this field
      
      // Anonymized Metadata
      respondent_segment: 'string', // Demographic segment (anonymized)
      response_pattern: 'string', // Response behavior pattern
      
      // Quality Metrics
      confidence_score: 'number',
      validity_flags: 'array',
      
      // Research Consent
      research_consent: 'boolean',
      research_participant_id: 'string', // Anonymized research ID
      
      // Timestamps
      created_at: 'timestamp',
      anonymized_at: 'timestamp'
    };

    console.log('✅ User responses collection schema defined');
  }

  /**
   * Collection: form_versions
   * Purpose: Version control for forms and templates
   */
  async createFormVersionsCollection() {
    const collectionRef = this.firestore.collection('form_versions');

    const versionSchema = {
      // Version Identity
      version_id: 'string',
      parent_id: 'string', // Form or template ID
      parent_type: 'string', // 'form' or 'template'
      version_number: 'string',
      
      // Version Data
      version_data: 'object', // Complete form/template data at this version
      changes_summary: 'string',
      migration_notes: 'string',
      
      // Version Control
      created_by: 'string',
      created_at: 'timestamp',
      is_current: 'boolean',
      is_deprecated: 'boolean',
      
      // Compatibility
      backward_compatible: 'boolean',
      migration_required: 'boolean',
      affected_submissions: 'number'
    };

    console.log('✅ Form versions collection schema defined');
  }

  /**
   * Collection: form_distribution
   * Purpose: Track form distribution and access
   */
  async createFormDistributionCollection() {
    const collectionRef = this.firestore.collection('form_distribution');

    const distributionSchema = {
      // Distribution Identity
      distribution_id: 'string',
      form_id: 'string',
      distribution_type: 'string', // 'email', 'sms', 'qr_code', 'link', 'embedded'
      
      // Distribution Details
      recipient_info: 'object', // Encrypted contact information
      distribution_channel: 'string',
      access_method: 'string',
      
      // Access Tracking
      access_logs: 'array', // Anonymized access attempts
      completion_status: 'string',
      
      // Privacy
      anonymized: 'boolean',
      retention_until: 'timestamp',
      
      // Audit
      distributed_at: 'timestamp',
      distributed_by: 'string',
      last_access: 'timestamp'
    };

    console.log('✅ Form distribution collection schema defined');
  }

  /**
   * Set up Firestore security rules for Formx collections
   */
  async setupSecurityRules() {
    const securityRules = `
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Form Templates - Read access for authenticated users, write for admins
        match /form_templates/{templateId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null && 
            (request.auth.token.role == 'admin' || 
             request.auth.token.role == 'clinical_admin');
        }
        
        // Forms - Access based on ownership and role
        match /forms/{formId} {
          allow read, write: if request.auth != null && 
            (resource.data.created_by == request.auth.uid ||
             request.auth.token.role == 'admin' ||
             request.auth.token.organization_id == resource.data.organization_id);
        }
        
        // Submissions - Strict access control for patient data
        match /submissions/{submissionId} {
          allow read, write: if request.auth != null && 
            (resource.data.submitter_id == request.auth.uid ||
             resource.data.professional_id == request.auth.uid ||
             request.auth.token.role == 'admin');
        }
        
        // Analytics - Read-only for professionals, full access for admins
        match /form_analytics/{analyticsId} {
          allow read: if request.auth != null &&
            (request.auth.token.role in ['professional', 'admin', 'analyst']);
          allow write: if request.auth != null &&
            request.auth.token.role in ['admin', 'system'];
        }
        
        // Form Library - Public read, admin write
        match /form_library/{libraryId} {
          allow read: if true; // Public access for clinical forms
          allow write: if request.auth != null &&
            request.auth.token.role == 'clinical_admin';
        }
        
        // User Responses - Research access only
        match /user_responses/{responseId} {
          allow read: if request.auth != null &&
            request.auth.token.role in ['researcher', 'admin'] &&
            resource.data.research_consent == true;
          allow write: if false; // Automated system only
        }
        
        // Form Versions - Read for all, write for system
        match /form_versions/{versionId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null &&
            request.auth.token.role in ['admin', 'system'];
        }
        
        // Form Distribution - Professional access only
        match /form_distribution/{distributionId} {
          allow read, write: if request.auth != null &&
            (resource.data.distributed_by == request.auth.uid ||
             request.auth.token.role == 'admin');
        }
      }
    }`;

    console.log('📋 Firestore security rules generated');
    return securityRules;
  }
}

module.exports = FormxFirestoreSchema;