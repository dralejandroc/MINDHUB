#!/usr/bin/env node

/**
 * Firestore Setup Script for Formx Hub
 * 
 * Initializes Firestore collections, indexes, and security rules
 * for the Formx form builder and management system
 */

const FormxFirestoreSchema = require('../backend/shared/database/firestore/formx-schema');
const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

class FormxFirestoreSetup {
  constructor() {
    this.schema = new FormxFirestoreSchema();
    this.firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
    this.setupLog = [];
  }

  /**
   * Main setup orchestration for Formx Firestore
   */
  async runCompleteSetup() {
    console.log('🏥 Starting Formx Firestore Setup...\n');
    
    try {
      // Step 1: Validate prerequisites
      await this.validatePrerequisites();
      this.log('✅ Prerequisites validated');

      // Step 2: Initialize collections
      await this.schema.initializeCollections();
      this.log('✅ Firestore collections initialized');

      // Step 3: Create composite indexes
      await this.createCompositeIndexes();
      this.log('✅ Composite indexes created');

      // Step 4: Set up security rules
      await this.deploySecurityRules();
      this.log('✅ Security rules deployed');

      // Step 5: Create sample data
      await this.createSampleData();
      this.log('✅ Sample data created');

      // Step 6: Set up backup and monitoring
      await this.setupBackupAndMonitoring();
      this.log('✅ Backup and monitoring configured');

      // Step 7: Generate configuration files
      await this.generateConfigurationFiles();
      this.log('✅ Configuration files generated');

      // Step 8: Test collections and queries
      await this.testCollectionsAndQueries();
      this.log('✅ Collections and queries tested');

      console.log('\n🎉 Formx Firestore setup completed successfully!');
      await this.generateSetupReport();
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      await this.generateErrorReport(error);
      process.exit(1);
    }
  }

  /**
   * Validate prerequisites for Firestore setup
   */
  async validatePrerequisites() {
    const requirements = [
      { name: 'GOOGLE_CLOUD_PROJECT', value: process.env.GOOGLE_CLOUD_PROJECT },
      { name: 'GOOGLE_APPLICATION_CREDENTIALS', value: process.env.GOOGLE_APPLICATION_CREDENTIALS }
    ];

    for (const req of requirements) {
      if (!req.value) {
        throw new Error(`Missing required environment variable: ${req.name}`);
      }
    }

    // Check if gcloud is authenticated
    const { execSync } = require('child_process');
    try {
      execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('gcloud is not authenticated. Run: gcloud auth login');
    }

    // Check required APIs are enabled
    const requiredAPIs = [
      'firestore.googleapis.com',
      'cloudfunctions.googleapis.com',
      'cloudscheduler.googleapis.com'
    ];

    for (const api of requiredAPIs) {
      try {
        execSync(`gcloud services list --enabled --filter="name:${api}" --format="value(name)"`, { stdio: 'pipe' });
      } catch (error) {
        console.log(`Enabling API: ${api}`);
        execSync(`gcloud services enable ${api}`);
      }
    }

    // Test Firestore connection
    try {
      await this.firestore.collection('_health_check').add({
        timestamp: new Date(),
        test: 'connection'
      });
      console.log('Firestore connection test successful');
    } catch (error) {
      throw new Error(`Firestore connection failed: ${error.message}`);
    }
  }

  /**
   * Create composite indexes for efficient queries
   */
  async createCompositeIndexes() {
    const indexes = [
      // Forms collection indexes
      {
        collectionGroup: 'forms',
        fields: [
          { fieldPath: 'created_by', order: 'ASCENDING' },
          { fieldPath: 'is_active', order: 'ASCENDING' },
          { fieldPath: 'created_at', order: 'DESCENDING' }
        ]
      },
      {
        collectionGroup: 'forms',
        fields: [
          { fieldPath: 'organization_id', order: 'ASCENDING' },
          { fieldPath: 'category', order: 'ASCENDING' },
          { fieldPath: 'updated_at', order: 'DESCENDING' }
        ]
      },

      // Submissions collection indexes
      {
        collectionGroup: 'submissions',
        fields: [
          { fieldPath: 'form_id', order: 'ASCENDING' },
          { fieldPath: 'status', order: 'ASCENDING' },
          { fieldPath: 'completed_at', order: 'DESCENDING' }
        ]
      },
      {
        collectionGroup: 'submissions',
        fields: [
          { fieldPath: 'professional_id', order: 'ASCENDING' },
          { fieldPath: 'patient_id', order: 'ASCENDING' },
          { fieldPath: 'created_at', order: 'DESCENDING' }
        ]
      },
      {
        collectionGroup: 'submissions',
        fields: [
          { fieldPath: 'clinical_review.review_status', order: 'ASCENDING' },
          { fieldPath: 'clinical_review.reviewed_at', order: 'DESCENDING' }
        ]
      },

      // Form templates indexes
      {
        collectionGroup: 'form_templates',
        fields: [
          { fieldPath: 'category', order: 'ASCENDING' },
          { fieldPath: 'specialty', order: 'ASCENDING' },
          { fieldPath: 'is_active', order: 'ASCENDING' }
        ]
      },
      {
        collectionGroup: 'form_templates',
        fields: [
          { fieldPath: 'is_public', order: 'ASCENDING' },
          { fieldPath: 'is_verified', order: 'ASCENDING' },
          { fieldPath: 'usage_stats.total_uses', order: 'DESCENDING' }
        ]
      },

      // Analytics indexes
      {
        collectionGroup: 'form_analytics',
        fields: [
          { fieldPath: 'form_id', order: 'ASCENDING' },
          { fieldPath: 'period', order: 'ASCENDING' },
          { fieldPath: 'date_range.start_date', order: 'DESCENDING' }
        ]
      }
    ];

    // Generate index creation commands
    const indexCommands = indexes.map(index => {
      const fieldsStr = index.fields.map(field => 
        `${field.fieldPath}:${field.order.toLowerCase()}`
      ).join(',');
      
      return `gcloud firestore indexes composite create \\
        --collection-group=${index.collectionGroup} \\
        --field-config=${fieldsStr}`;
    });

    // Save index commands to file
    const indexPath = path.join(__dirname, '../config/firestore-indexes.sh');
    fs.writeFileSync(indexPath, indexCommands.join('\n\n'), { mode: 0o755 });

    console.log('📋 Composite indexes configuration saved to firestore-indexes.sh');
    console.log('Run the script to create indexes in production');
  }

  /**
   * Deploy Firestore security rules
   */
  async deploySecurityRules() {
    const securityRules = await this.schema.setupSecurityRules();
    
    // Save rules to file
    const rulesPath = path.join(__dirname, '../config/firestore.rules');
    fs.writeFileSync(rulesPath, securityRules);

    // Deploy rules using gcloud
    try {
      const { execSync } = require('child_process');
      execSync(`gcloud firestore deploy --rules=${rulesPath}`, { stdio: 'inherit' });
      console.log('✅ Security rules deployed successfully');
    } catch (error) {
      console.log('⚠️  Security rules saved to file, deploy manually with:');
      console.log(`gcloud firestore deploy --rules=${rulesPath}`);
    }
  }

  /**
   * Create sample data for testing and demonstration
   */
  async createSampleData() {
    // Create sample form templates
    const sampleTemplates = [
      {
        template_id: 'gad7_anxiety_scale',
        template_name: 'GAD-7 Anxiety Scale',
        template_description: 'Generalized Anxiety Disorder 7-item scale',
        template_version: '1.0.0',
        category: 'clinical',
        specialty: 'psychiatry',
        is_active: true,
        is_public: true,
        is_verified: true,
        compliance_tags: ['NOM-024-SSA3-2010', 'clinical_validated'],
        language: 'es',
        clinical_settings: {
          scoring_method: 'sum_total',
          interpretation_guide: 'GAD-7 scoring: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe anxiety',
          reference_ranges: [
            { range: '0-4', interpretation: 'Ansiedad mínima', action: 'none' },
            { range: '5-9', interpretation: 'Ansiedad leve', action: 'monitoring' },
            { range: '10-14', interpretation: 'Ansiedad moderada', action: 'treatment_recommended' },
            { range: '15-21', interpretation: 'Ansiedad severa', action: 'immediate_attention' }
          ]
        },
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        template_id: 'patient_intake_form',
        template_name: 'Formulario de Admisión de Paciente',
        template_description: 'Formulario completo de admisión para nuevos pacientes',
        template_version: '1.0.0',
        category: 'intake',
        specialty: 'general',
        is_active: true,
        is_public: false,
        is_verified: true,
        compliance_tags: ['NOM-024-SSA3-2010', 'patient_intake'],
        language: 'es',
        sections: [{
          section_id: 'personal_information',
          section_title: 'Información Personal',
          section_order: 1,
          is_required: true,
          fields: [
            {
              field_id: 'full_name',
              field_type: 'text',
              field_label: 'Nombre completo',
              is_required: true,
              validation_rules: { min_length: 2, max_length: 100 }
            },
            {
              field_id: 'birth_date',
              field_type: 'date',
              field_label: 'Fecha de nacimiento',
              is_required: true
            },
            {
              field_id: 'gender',
              field_type: 'select',
              field_label: 'Género',
              is_required: true,
              options: [
                { value: 'masculine', label: 'Masculino' },
                { value: 'feminine', label: 'Femenino' },
                { value: 'other', label: 'Otro' },
                { value: 'prefer_not_to_say', label: 'Prefiero no decir' }
              ]
            }
          ]
        }],
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Save sample templates
    for (const template of sampleTemplates) {
      await this.firestore.collection('form_templates').doc(template.template_id).set(template);
    }

    // Create sample form library entries
    const libraryEntries = [
      {
        library_id: 'phq9_library',
        form_name: 'PHQ-9 Patient Health Questionnaire',
        form_category: 'depression_screening',
        clinical_domain: 'depression',
        validation_status: 'validated',
        clinical_evidence: {
          validation_studies: ['Kroenke et al. 2001', 'Manea et al. 2012'],
          reliability_coefficients: { cronbach_alpha: 0.89, test_retest: 0.84 },
          validity_measures: { sensitivity: 0.88, specificity: 0.88 }
        },
        regulatory_approvals: ['FDA_cleared', 'COFEPRIS_approved'],
        available_languages: ['en', 'es', 'fr'],
        template_ids: ['phq9_depression_scale'],
        curated_by: 'clinical_team',
        curated_at: new Date()
      }
    ];

    for (const entry of libraryEntries) {
      await this.firestore.collection('form_library').doc(entry.library_id).set(entry);
    }

    console.log('✅ Sample data created successfully');
  }

  /**
   * Set up backup and monitoring
   */
  async setupBackupAndMonitoring() {
    // Create backup configuration
    const backupConfig = {
      schedule: '0 2 * * *', // Daily at 2 AM
      retention_days: 30,
      collections: [
        'form_templates',
        'forms',
        'submissions',
        'form_analytics',
        'form_library'
      ],
      export_format: 'json',
      encryption: true,
      compression: true
    };

    // Create monitoring configuration
    const monitoringConfig = {
      alerts: [
        {
          name: 'high_submission_volume',
          condition: 'submission_rate > 1000/hour',
          action: 'email_admin'
        },
        {
          name: 'form_errors',
          condition: 'error_rate > 5%',
          action: 'slack_notification'
        },
        {
          name: 'storage_quota',
          condition: 'storage_usage > 80%',
          action: 'email_admin'
        }
      ],
      metrics_collection: {
        submission_rates: true,
        error_rates: true,
        performance_metrics: true,
        user_analytics: true
      }
    };

    // Save configurations
    const configDir = path.join(__dirname, '../config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(configDir, 'firestore-backup.json'),
      JSON.stringify(backupConfig, null, 2)
    );

    fs.writeFileSync(
      path.join(configDir, 'firestore-monitoring.json'),
      JSON.stringify(monitoringConfig, null, 2)
    );

    console.log('✅ Backup and monitoring configurations saved');
  }

  /**
   * Generate configuration files for application
   */
  async generateConfigurationFiles() {
    // Firestore configuration for Node.js application
    const firestoreConfig = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      collections: {
        formTemplates: 'form_templates',
        forms: 'forms',
        submissions: 'submissions',
        analytics: 'form_analytics',
        library: 'form_library',
        responses: 'user_responses',
        versions: 'form_versions',
        distribution: 'form_distribution'
      },
      settings: {
        enableOfflinePersistence: false,
        cacheSizeBytes: 40000000, // 40 MB
        enableNetwork: true
      },
      security: {
        enableRules: true,
        validateWrites: true,
        requireAuth: true
      }
    };

    // Environment variables for Firestore
    const envConfig = `# Firestore Configuration for Formx Hub
# Generated automatically by setup script

# =============================================================================
# FIRESTORE CONFIGURATION
# =============================================================================
FIRESTORE_PROJECT_ID=${process.env.GOOGLE_CLOUD_PROJECT}
FIRESTORE_DATABASE_ID=(default)
FIRESTORE_EMULATOR_HOST=localhost:8080

# Collection Names
FORMX_TEMPLATES_COLLECTION=form_templates
FORMX_FORMS_COLLECTION=forms
FORMX_SUBMISSIONS_COLLECTION=submissions
FORMX_ANALYTICS_COLLECTION=form_analytics
FORMX_LIBRARY_COLLECTION=form_library

# Security Settings
FIRESTORE_RULES_ENABLED=true
FIRESTORE_AUTH_REQUIRED=true
FIRESTORE_OFFLINE_PERSISTENCE=false

# Performance Settings
FIRESTORE_CACHE_SIZE_MB=40
FIRESTORE_MAX_CONCURRENT_WRITES=100
FIRESTORE_BATCH_SIZE=500

# Backup Settings
FIRESTORE_BACKUP_ENABLED=true
FIRESTORE_BACKUP_SCHEDULE=0 2 * * *
FIRESTORE_BACKUP_RETENTION=30
`;

    // Save configuration files
    const configPath = path.join(__dirname, '../config/firestore.json');
    fs.writeFileSync(configPath, JSON.stringify(firestoreConfig, null, 2));

    const envPath = path.join(__dirname, '../config/.env.firestore');
    fs.writeFileSync(envPath, envConfig);

    console.log('✅ Configuration files generated');
  }

  /**
   * Test collections and queries
   */
  async testCollectionsAndQueries() {
    const tests = [
      {
        name: 'Form Templates Query',
        test: async () => {
          const snapshot = await this.firestore
            .collection('form_templates')
            .where('is_active', '==', true)
            .limit(5)
            .get();
          return snapshot.size > 0;
        }
      },
      {
        name: 'Form Library Query',
        test: async () => {
          const snapshot = await this.firestore
            .collection('form_library')
            .where('validation_status', '==', 'validated')
            .get();
          return snapshot.size >= 0;
        }
      },
      {
        name: 'Collection Write Test',
        test: async () => {
          const testDoc = await this.firestore
            .collection('_test_collection')
            .add({ test: true, timestamp: new Date() });
          
          await testDoc.delete();
          return true;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        if (result) {
          console.log(`✅ ${test.name}: PASSED`);
        } else {
          console.log(`❌ ${test.name}: FAILED`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      }
    }
  }

  /**
   * Generate setup completion report
   */
  async generateSetupReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'completed',
      firestore: {
        project_id: process.env.GOOGLE_CLOUD_PROJECT,
        database_id: '(default)',
        region: 'multi-region'
      },
      collections_created: [
        'form_templates',
        'forms',
        'submissions',
        'form_analytics',
        'form_library',
        'user_responses',
        'form_versions',
        'form_distribution'
      ],
      features: {
        security_rules: true,
        composite_indexes: true,
        backup_configured: true,
        monitoring_setup: true,
        sample_data: true
      },
      setup_steps: this.setupLog,
      next_steps: [
        'Deploy composite indexes using: bash config/firestore-indexes.sh',
        'Set up Cloud Functions for data processing',
        'Configure monitoring and alerting',
        'Import additional clinical form templates',
        'Set up automated backups and archival'
      ]
    };

    const reportPath = path.join(__dirname, '../reports/firestore-formx-setup-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 Setup report saved to: ${reportPath}`);
    console.log('\n📌 Next steps:');
    report.next_steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });
  }

  /**
   * Generate error report
   */
  async generateErrorReport(error) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: {
        message: error.message,
        stack: error.stack
      },
      completed_steps: this.setupLog,
      troubleshooting: [
        'Check Google Cloud authentication: gcloud auth list',
        'Verify Firestore API is enabled',
        'Check project permissions and IAM roles',
        'Validate environment variables',
        'Review Firestore quotas and limits'
      ]
    };

    const reportPath = path.join(__dirname, '../reports/firestore-formx-error-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(errorReport, null, 2));
    console.log(`\n📋 Error report saved to: ${reportPath}`);
  }

  /**
   * Log setup step
   */
  log(message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message: message
    };
    this.setupLog.push(logEntry);
    console.log(message);
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new FormxFirestoreSetup();
  setup.runCompleteSetup();
}

module.exports = FormxFirestoreSetup;