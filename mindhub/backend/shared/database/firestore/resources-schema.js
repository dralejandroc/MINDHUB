/**
 * Firestore Collections Schema for Resources Hub
 * 
 * Comprehensive document structure for psychoeducational resources,
 * content management, and access controls with healthcare compliance
 */

const { Firestore } = require('@google-cloud/firestore');

class ResourcesFirestoreSchema {
  constructor() {
    this.firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
  }

  /**
   * Initialize all Resources collections with proper structure
   */
  async initializeCollections() {
    try {
      console.log('Initializing Resources Firestore collections...');

      await this.createResourcesCollection();
      await this.createResourceCategoriesCollection();
      await this.createAccessPermissionsCollection();
      await this.createUsageAnalyticsCollection();
      await this.createContentLibraryCollection();
      await this.createDistributionTrackingCollection();
      await this.createResourceReviewsCollection();

      console.log('✅ All Resources collections initialized successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error initializing Resources collections:', error);
      throw error;
    }
  }

  /**
   * Collection: resources
   * Purpose: Store psychoeducational resources and therapeutic materials
   */
  async createResourcesCollection() {
    const collectionRef = this.firestore.collection('resources');

    const resourceSchema = {
      // Resource Identity
      resource_id: 'string',
      title: 'string',
      subtitle: 'string',
      description: 'string',
      content_type: 'string', // 'document', 'video', 'audio', 'interactive', 'assessment', 'worksheet'
      
      // Content Information
      content_data: {
        file_url: 'string', // Cloud Storage URL
        file_name: 'string',
        file_size: 'number', // bytes
        file_format: 'string', // 'pdf', 'docx', 'mp4', 'mp3', 'html', 'interactive'
        thumbnail_url: 'string',
        preview_url: 'string',
        download_url: 'string'
      },
      
      // Categorization
      primary_category: 'string', // 'educational', 'therapeutic', 'administrative', 'assessment'
      secondary_categories: 'array',
      clinical_domains: 'array', // ['depression', 'anxiety', 'adhd', 'ptsd', 'bipolar']
      target_audience: 'string', // 'patients', 'families', 'professionals', 'general'
      age_groups: 'array', // ['children', 'adolescents', 'adults', 'elderly']
      
      // Clinical Information
      clinical_metadata: {
        therapeutic_approach: 'string', // 'CBT', 'DBT', 'psychodynamic', 'humanistic'
        evidence_level: 'string', // 'evidence_based', 'best_practice', 'expert_consensus'
        clinical_applications: 'array',
        contraindications: 'array',
        prerequisites: 'array'
      },
      
      // Content Quality
      quality_metrics: {
        clinical_validation: 'boolean',
        peer_reviewed: 'boolean',
        evidence_based: 'boolean',
        cultural_adaptation: 'boolean',
        accessibility_compliant: 'boolean',
        quality_score: 'number' // 0-100
      },
      
      // Accessibility
      accessibility: {
        language: 'string',
        alternative_languages: 'array',
        reading_level: 'string', // 'elementary', 'middle', 'high', 'college', 'graduate'
        audio_description: 'boolean',
        closed_captions: 'boolean',
        high_contrast: 'boolean',
        large_text: 'boolean'
      },
      
      // Usage and Distribution
      distribution_settings: {
        is_public: 'boolean',
        requires_authentication: 'boolean',
        professional_only: 'boolean',
        organization_restricted: 'boolean',
        allowed_organizations: 'array',
        usage_restrictions: 'array'
      },
      
      // Licensing and Copyright
      licensing: {
        license_type: 'string', // 'public_domain', 'creative_commons', 'proprietary', 'institutional'
        copyright_holder: 'string',
        attribution_required: 'boolean',
        commercial_use_allowed: 'boolean',
        modification_allowed: 'boolean',
        redistribution_allowed: 'boolean'
      },
      
      // Metadata
      tags: 'array',
      keywords: 'array',
      estimated_duration: 'number', // minutes
      difficulty_level: 'string', // 'beginner', 'intermediate', 'advanced'
      
      // Usage Statistics
      usage_stats: {
        total_views: 'number',
        total_downloads: 'number',
        total_shares: 'number',
        average_rating: 'number',
        total_ratings: 'number',
        completion_rate: 'number', // for interactive content
        last_accessed: 'timestamp'
      },
      
      // Versioning
      version: 'string',
      version_history: 'array',
      is_current_version: 'boolean',
      
      // Audit and Compliance
      created_by: 'string',
      created_at: 'timestamp',
      updated_by: 'string',
      updated_at: 'timestamp',
      reviewed_by: 'string',
      reviewed_at: 'timestamp',
      next_review_due: 'timestamp',
      
      // Compliance
      compliance_tags: 'array', // ['NOM-024-SSA3-2010', 'HIPAA', 'GDPR']
      retention_policy: 'string',
      data_classification: 'string' // 'public', 'internal', 'confidential', 'restricted'
    };

    // Create sample resource
    const sampleResource = {
      resource_id: 'depression_psychoeducation_guide',
      title: 'Guía de Psicoeducación sobre la Depresión',
      subtitle: 'Comprenda los síntomas, causas y tratamientos de la depresión',
      description: 'Material educativo completo sobre la depresión para pacientes y familias, incluyendo estrategias de afrontamiento y recursos de apoyo.',
      content_type: 'document',
      content_data: {
        file_url: 'gs://mindhub-resources/documents/depression-guide-es.pdf',
        file_name: 'guia-depresion-psicoeducacion.pdf',
        file_size: 2457600, // 2.4 MB
        file_format: 'pdf',
        thumbnail_url: 'gs://mindhub-resources/thumbnails/depression-guide-thumb.jpg',
        preview_url: 'gs://mindhub-resources/previews/depression-guide-preview.html'
      },
      primary_category: 'educational',
      secondary_categories: ['therapeutic', 'patient_support'],
      clinical_domains: ['depression', 'mood_disorders'],
      target_audience: 'patients',
      age_groups: ['adults', 'elderly'],
      clinical_metadata: {
        therapeutic_approach: 'CBT',
        evidence_level: 'evidence_based',
        clinical_applications: ['psychoeducation', 'treatment_preparation', 'family_support'],
        contraindications: [],
        prerequisites: ['basic_literacy']
      },
      quality_metrics: {
        clinical_validation: true,
        peer_reviewed: true,
        evidence_based: true,
        cultural_adaptation: true,
        accessibility_compliant: true,
        quality_score: 92
      },
      accessibility: {
        language: 'es',
        alternative_languages: ['en'],
        reading_level: 'middle',
        audio_description: false,
        closed_captions: false,
        high_contrast: true,
        large_text: true
      },
      distribution_settings: {
        is_public: false,
        requires_authentication: true,
        professional_only: false,
        organization_restricted: false,
        allowed_organizations: [],
        usage_restrictions: ['attribution_required']
      },
      licensing: {
        license_type: 'institutional',
        copyright_holder: 'MindHub Clinical Team',
        attribution_required: true,
        commercial_use_allowed: false,
        modification_allowed: true,
        redistribution_allowed: false
      },
      tags: ['depression', 'psychoeducation', 'spanish', 'patient_guide'],
      keywords: ['depresión', 'síntomas', 'tratamiento', 'apoyo', 'familia'],
      estimated_duration: 30,
      difficulty_level: 'beginner',
      version: '1.2.0',
      is_current_version: true,
      created_by: 'clinical_team',
      created_at: new Date(),
      updated_at: new Date(),
      compliance_tags: ['NOM-024-SSA3-2010'],
      data_classification: 'internal'
    };

    await collectionRef.doc('depression_psychoeducation_guide').set(sampleResource);
    console.log('✅ Resources collection created');
  }

  /**
   * Collection: resource_categories
   * Purpose: Hierarchical categorization system for resources
   */
  async createResourceCategoriesCollection() {
    const collectionRef = this.firestore.collection('resource_categories');

    const categorySchema = {
      // Category Identity
      category_id: 'string',
      category_name: 'string',
      category_description: 'string',
      category_type: 'string', // 'primary', 'secondary', 'tag'
      
      // Hierarchy
      parent_category: 'string',
      child_categories: 'array',
      category_level: 'number', // 0 = root, 1 = primary, 2 = secondary, etc.
      category_path: 'string', // e.g., 'educational/depression/psychoeducation'
      
      // Clinical Information
      clinical_domain: 'string',
      therapeutic_context: 'array',
      target_populations: 'array',
      
      // Display Information
      display_order: 'number',
      icon_url: 'string',
      color_code: 'string',
      is_featured: 'boolean',
      
      // Content Management
      resource_count: 'number',
      is_active: 'boolean',
      requires_approval: 'boolean',
      
      // Metadata
      created_by: 'string',
      created_at: 'timestamp',
      updated_at: 'timestamp'
    };

    // Create sample categories
    const sampleCategories = [
      {
        category_id: 'educational',
        category_name: 'Materiales Educativos',
        category_description: 'Recursos de psicoeducación para pacientes y familias',
        category_type: 'primary',
        parent_category: null,
        child_categories: ['depression_education', 'anxiety_education'],
        category_level: 0,
        category_path: 'educational',
        clinical_domain: 'general',
        display_order: 1,
        color_code: '#3b82f6',
        is_featured: true,
        is_active: true,
        created_by: 'system',
        created_at: new Date()
      },
      {
        category_id: 'therapeutic',
        category_name: 'Materiales Terapéuticos',
        category_description: 'Herramientas y recursos para intervenciones terapéuticas',
        category_type: 'primary',
        parent_category: null,
        child_categories: ['cbt_tools', 'mindfulness_resources'],
        category_level: 0,
        category_path: 'therapeutic',
        clinical_domain: 'intervention',
        display_order: 2,
        color_code: '#10b981',
        is_featured: true,
        is_active: true,
        created_by: 'system',
        created_at: new Date()
      }
    ];

    for (const category of sampleCategories) {
      await collectionRef.doc(category.category_id).set(category);
    }

    console.log('✅ Resource categories collection created');
  }

  /**
   * Collection: access_permissions
   * Purpose: Granular access control for resources
   */
  async createAccessPermissionsCollection() {
    const collectionRef = this.firestore.collection('access_permissions');

    const permissionSchema = {
      // Permission Identity
      permission_id: 'string',
      resource_id: 'string',
      
      // Access Control
      permission_type: 'string', // 'view', 'download', 'share', 'edit', 'admin'
      access_level: 'string', // 'public', 'authenticated', 'professional', 'organization', 'restricted'
      
      // Subject (who has access)
      subject_type: 'string', // 'user', 'role', 'organization', 'group'
      subject_id: 'string',
      subject_details: 'object',
      
      // Conditions
      conditions: {
        start_date: 'timestamp',
        end_date: 'timestamp',
        time_restrictions: 'object',
        location_restrictions: 'array',
        device_restrictions: 'array',
        usage_quota: 'number'
      },
      
      // Inheritance
      inherited_from: 'string', // parent permission ID
      inheritance_rules: 'object',
      
      // Approval Workflow
      approval_status: 'string', // 'pending', 'approved', 'denied', 'revoked'
      approved_by: 'string',
      approved_at: 'timestamp',
      approval_notes: 'string',
      
      // Audit
      created_by: 'string',
      created_at: 'timestamp',
      last_modified: 'timestamp',
      last_accessed: 'timestamp'
    };

    console.log('✅ Access permissions collection schema defined');
  }

  /**
   * Collection: usage_analytics
   * Purpose: Track resource usage and engagement metrics
   */
  async createUsageAnalyticsCollection() {
    const collectionRef = this.firestore.collection('usage_analytics');

    const analyticsSchema = {
      // Analytics Identity
      analytics_id: 'string',
      resource_id: 'string',
      period: 'string', // 'daily', 'weekly', 'monthly', 'yearly'
      date_range: {
        start_date: 'timestamp',
        end_date: 'timestamp'
      },
      
      // Usage Metrics
      usage_metrics: {
        total_views: 'number',
        unique_users: 'number',
        total_downloads: 'number',
        total_shares: 'number',
        total_ratings: 'number',
        average_rating: 'number',
        bounce_rate: 'number',
        engagement_rate: 'number'
      },
      
      // User Engagement
      engagement_metrics: {
        time_spent: {
          average: 'number',
          median: 'number',
          total: 'number'
        },
        completion_rates: 'object', // for interactive content
        interaction_points: 'array',
        return_visits: 'number',
        referral_sources: 'object'
      },
      
      // Demographics (anonymized)
      demographic_data: {
        age_distribution: 'object',
        gender_distribution: 'object',
        location_distribution: 'object',
        professional_type_distribution: 'object',
        organization_distribution: 'object'
      },
      
      // Performance Metrics
      performance_metrics: {
        load_time: 'number',
        error_rate: 'number',
        success_rate: 'number',
        mobile_usage_rate: 'number'
      },
      
      // Clinical Impact (when available)
      clinical_impact: {
        treatment_adherence_correlation: 'number',
        outcome_improvement_correlation: 'number',
        satisfaction_scores: 'object',
        clinical_feedback: 'array'
      },
      
      // Generated Reports
      generated_reports: 'array',
      
      // Audit
      generated_at: 'timestamp',
      generated_by: 'string'
    };

    console.log('✅ Usage analytics collection schema defined');
  }

  /**
   * Collection: content_library
   * Purpose: Curated library of clinical and educational content
   */
  async createContentLibraryCollection() {
    const collectionRef = this.firestore.collection('content_library');

    const librarySchema = {
      // Library Entry Identity
      library_id: 'string',
      collection_name: 'string',
      collection_description: 'string',
      collection_type: 'string', // 'curated', 'generated', 'imported', 'collaborative'
      
      // Curation Information
      curator_info: {
        curator_id: 'string',
        curator_type: 'string', // 'clinical_team', 'ai_system', 'community', 'expert'
        curation_criteria: 'array',
        quality_standards: 'object',
        review_process: 'string'
      },
      
      // Content Organization
      included_resources: 'array', // resource IDs
      resource_count: 'number',
      content_hierarchy: 'object',
      learning_path: 'array', // ordered sequence for educational content
      
      // Clinical Validation
      clinical_validation: {
        validation_status: 'string', // 'validated', 'under_review', 'pending'
        validation_date: 'timestamp',
        validated_by: 'string',
        validation_notes: 'string',
        evidence_level: 'string'
      },
      
      // Target Information
      target_audience: 'array',
      clinical_specialties: 'array',
      therapeutic_contexts: 'array',
      learning_objectives: 'array',
      
      // Usage and Distribution
      distribution_settings: 'object',
      access_requirements: 'object',
      certification_available: 'boolean',
      continuing_education_credits: 'number',
      
      // Quality Metrics
      quality_metrics: {
        completeness_score: 'number',
        relevance_score: 'number',
        currency_score: 'number',
        user_satisfaction: 'number',
        clinical_effectiveness: 'number'
      },
      
      // Versioning and Updates
      version: 'string',
      last_updated: 'timestamp',
      update_frequency: 'string',
      auto_update_enabled: 'boolean',
      
      // Audit
      created_by: 'string',
      created_at: 'timestamp',
      last_reviewed: 'timestamp',
      next_review_due: 'timestamp'
    };

    console.log('✅ Content library collection schema defined');
  }

  /**
   * Collection: distribution_tracking
   * Purpose: Track how resources are distributed and accessed
   */
  async createDistributionTrackingCollection() {
    const collectionRef = this.firestore.collection('distribution_tracking');

    const distributionSchema = {
      // Distribution Identity
      distribution_id: 'string',
      resource_id: 'string',
      distribution_type: 'string', // 'direct_access', 'email', 'shared_link', 'embedded', 'bulk_download'
      
      // Distribution Details
      distribution_details: {
        distributor_id: 'string',
        distributor_type: 'string', // 'professional', 'system', 'patient', 'organization'
        distribution_method: 'string',
        distribution_channel: 'string',
        target_recipients: 'array',
        custom_message: 'string'
      },
      
      // Access Tracking (anonymized)
      access_events: 'array', // Anonymized access logs
      
      // Success Metrics
      distribution_metrics: {
        delivery_status: 'string', // 'sent', 'delivered', 'opened', 'accessed', 'failed'
        delivery_timestamp: 'timestamp',
        first_access_timestamp: 'timestamp',
        total_accesses: 'number',
        unique_accessors: 'number',
        completion_rate: 'number'
      },
      
      // Privacy and Compliance
      privacy_settings: {
        anonymized: 'boolean',
        retention_period: 'number', // days
        data_purge_date: 'timestamp',
        consent_given: 'boolean'
      },
      
      // Audit
      created_at: 'timestamp',
      last_accessed: 'timestamp',
      expires_at: 'timestamp'
    };

    console.log('✅ Distribution tracking collection schema defined');
  }

  /**
   * Collection: resource_reviews
   * Purpose: Peer reviews and quality assessments of resources
   */
  async createResourceReviewsCollection() {
    const collectionRef = this.firestore.collection('resource_reviews');

    const reviewSchema = {
      // Review Identity
      review_id: 'string',
      resource_id: 'string',
      review_type: 'string', // 'clinical', 'technical', 'user_feedback', 'compliance'
      
      // Reviewer Information
      reviewer_info: {
        reviewer_id: 'string',
        reviewer_type: 'string', // 'clinical_expert', 'technical_expert', 'user', 'peer'
        reviewer_qualifications: 'array',
        reviewer_organization: 'string',
        anonymized: 'boolean'
      },
      
      // Review Content
      review_content: {
        overall_rating: 'number', // 1-5
        clinical_accuracy: 'number',
        content_quality: 'number',
        user_experience: 'number',
        accessibility: 'number',
        
        detailed_feedback: {
          strengths: 'array',
          areas_for_improvement: 'array',
          specific_comments: 'string',
          recommendations: 'array'
        },
        
        compliance_assessment: {
          regulatory_compliance: 'boolean',
          ethical_considerations: 'string',
          cultural_sensitivity: 'boolean',
          accessibility_compliance: 'boolean'
        }
      },
      
      // Review Process
      review_process: {
        review_stage: 'string', // 'initial', 'peer_review', 'expert_review', 'final'
        review_status: 'string', // 'in_progress', 'completed', 'requires_revision'
        review_priority: 'string', // 'low', 'medium', 'high', 'urgent'
        estimated_completion: 'timestamp',
        actual_completion: 'timestamp'
      },
      
      // Impact and Actions
      review_impact: {
        recommended_actions: 'array',
        approval_recommendation: 'string', // 'approve', 'approve_with_changes', 'reject'
        content_modifications_needed: 'array',
        follow_up_required: 'boolean'
      },
      
      // Workflow
      workflow_status: {
        current_stage: 'string',
        assigned_to: 'string',
        due_date: 'timestamp',
        escalation_required: 'boolean'
      },
      
      // Audit
      created_at: 'timestamp',
      updated_at: 'timestamp',
      completed_at: 'timestamp',
      version: 'number'
    };

    console.log('✅ Resource reviews collection schema defined');
  }

  /**
   * Set up Firestore security rules for Resources collections
   */
  async setupSecurityRules() {
    const securityRules = `
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Resources - Access based on distribution settings and role
        match /resources/{resourceId} {
          allow read: if (resource.data.distribution_settings.is_public == true) ||
            (request.auth != null && 
             (resource.data.distribution_settings.requires_authentication == true));
          allow write: if request.auth != null && 
            (request.auth.token.role in ['admin', 'clinical_admin', 'content_manager']);
        }
        
        // Resource Categories - Public read, admin write
        match /resource_categories/{categoryId} {
          allow read: if true;
          allow write: if request.auth != null &&
            request.auth.token.role in ['admin', 'content_manager'];
        }
        
        // Access Permissions - Strict access control
        match /access_permissions/{permissionId} {
          allow read, write: if request.auth != null &&
            (resource.data.subject_id == request.auth.uid ||
             request.auth.token.role == 'admin');
        }
        
        // Usage Analytics - Read for professionals, write for system
        match /usage_analytics/{analyticsId} {
          allow read: if request.auth != null &&
            request.auth.token.role in ['professional', 'admin', 'analyst'];
          allow write: if request.auth != null &&
            request.auth.token.role in ['admin', 'system'];
        }
        
        // Content Library - Public read, curated write
        match /content_library/{libraryId} {
          allow read: if true;
          allow write: if request.auth != null &&
            request.auth.token.role in ['admin', 'content_curator', 'clinical_admin'];
        }
        
        // Distribution Tracking - Creator and admin access
        match /distribution_tracking/{distributionId} {
          allow read, write: if request.auth != null &&
            (resource.data.distribution_details.distributor_id == request.auth.uid ||
             request.auth.token.role == 'admin');
        }
        
        // Resource Reviews - Reviewer and admin access
        match /resource_reviews/{reviewId} {
          allow read: if request.auth != null &&
            (resource.data.reviewer_info.reviewer_id == request.auth.uid ||
             request.auth.token.role in ['admin', 'clinical_admin']);
          allow write: if request.auth != null &&
            (resource.data.reviewer_info.reviewer_id == request.auth.uid ||
             request.auth.token.role in ['admin', 'clinical_admin']);
        }
      }
    }`;

    console.log('📋 Resources Firestore security rules generated');
    return securityRules;
  }
}

module.exports = ResourcesFirestoreSchema;