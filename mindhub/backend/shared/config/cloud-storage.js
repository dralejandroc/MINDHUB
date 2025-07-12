/**
 * Cloud Storage Configuration and Lifecycle Management
 * 
 * Comprehensive Cloud Storage setup with bucket organization,
 * versioning, lifecycle policies, and healthcare compliance
 */

const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');
const path = require('path');

class CloudStorageManager {
  constructor() {
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    this.region = process.env.CLOUD_STORAGE_REGION || 'us-central1';
  }

  /**
   * Create and configure all Cloud Storage buckets for MindHub
   */
  async initializeAllBuckets() {
    try {
      console.log('🗄️ Initializing Cloud Storage infrastructure...');

      // Create main buckets
      await this.createPatientDataBucket();
      await this.createClinicalFormsBucket();
      await this.createResourcesLibraryBucket();
      await this.createBackupsBucket();
      await this.createTempFilesBucket();
      await this.createStaticAssetsBucket();
      await this.createAuditLogsBucket();

      // Set up lifecycle policies
      await this.setupLifecyclePolicies();

      // Configure CORS and security
      await this.configureBucketSecurity();

      console.log('✅ All Cloud Storage buckets initialized successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error initializing Cloud Storage:', error);
      throw error;
    }
  }

  /**
   * Bucket: Patient Data Storage (Expedix)
   * Purpose: Encrypted storage for patient files and medical records
   */
  async createPatientDataBucket() {
    const bucketName = `${this.projectId}-patient-data`;
    
    const bucketConfig = {
      location: this.region,
      storageClass: 'STANDARD',
      
      // Encryption configuration
      encryption: {
        defaultKmsKeyName: `projects/${this.projectId}/locations/global/keyRings/patient-data/cryptoKeys/patient-files`
      },
      
      // Versioning for data integrity
      versioning: {
        enabled: true
      },
      
      // Uniform bucket-level access
      uniformBucketLevelAccess: {
        enabled: true,
        lockedTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      },
      
      // Retention policy for compliance
      retentionPolicy: {
        retentionPeriod: 5 * 365 * 24 * 60 * 60, // 5 years in seconds (NOM-024-SSA3-2010)
        effectiveTime: new Date()
      },
      
      // Labels for organization
      labels: {
        environment: process.env.NODE_ENV || 'development',
        application: 'mindhub',
        data_type: 'patient_data',
        compliance: 'nom-024-ssa3-2010',
        encryption: 'cmek'
      }
    };

    const [bucket] = await this.storage.createBucket(bucketName, bucketConfig);
    
    // Set up folder structure
    const folders = [
      'expedientes/', // Patient records
      'images/', // Medical images, scans
      'documents/', // Clinical documents
      'audio/', // Audio recordings
      'attachments/', // General attachments
      'temp/', // Temporary files
      'archived/' // Archived patient data
    ];

    for (const folder of folders) {
      await bucket.file(folder + '.keep').save('');
    }

    console.log(`✅ Patient data bucket created: ${bucketName}`);
    return bucket;
  }

  /**
   * Bucket: Clinical Forms Storage (Formx)
   * Purpose: Storage for form templates, submissions, and related files
   */
  async createClinicalFormsBucket() {
    const bucketName = `${this.projectId}-clinical-forms`;
    
    const bucketConfig = {
      location: this.region,
      storageClass: 'STANDARD',
      
      encryption: {
        defaultKmsKeyName: `projects/${this.projectId}/locations/global/keyRings/clinical-data/cryptoKeys/form-data`
      },
      
      versioning: { enabled: true },
      uniformBucketLevelAccess: { enabled: true },
      
      // Lifecycle management for forms
      lifecycle: {
        rule: [
          {
            condition: {
              age: 90, // 90 days
              matchesStorageClass: ['STANDARD']
            },
            action: {
              type: 'SetStorageClass',
              storageClass: 'NEARLINE'
            }
          },
          {
            condition: {
              age: 365, // 1 year
              matchesStorageClass: ['NEARLINE']
            },
            action: {
              type: 'SetStorageClass',
              storageClass: 'COLDLINE'
            }
          }
        ]
      },
      
      labels: {
        environment: process.env.NODE_ENV || 'development',
        application: 'mindhub',
        data_type: 'clinical_forms',
        hub: 'formx'
      }
    };

    const [bucket] = await this.storage.createBucket(bucketName, bucketConfig);
    
    // Set up folder structure
    const folders = [
      'templates/', // Form templates
      'submissions/', // Form submissions
      'attachments/', // File uploads from forms
      'exports/', // Exported form data
      'reports/', // Generated reports
      'temp_uploads/', // Temporary file uploads
      'archived_forms/' // Archived forms
    ];

    for (const folder of folders) {
      await bucket.file(folder + '.keep').save('');
    }

    console.log(`✅ Clinical forms bucket created: ${bucketName}`);
    return bucket;
  }

  /**
   * Bucket: Resources Library (Resources Hub)
   * Purpose: Storage for psychoeducational materials and therapeutic resources
   */
  async createResourcesLibraryBucket() {
    const bucketName = `${this.projectId}-resources-library`;
    
    const bucketConfig = {
      location: 'multi-region', // Global access for educational content
      storageClass: 'STANDARD',
      
      // Public access for educational materials (with proper IAM)
      iamConfiguration: {
        uniformBucketLevelAccess: {
          enabled: false // Allow object-level permissions for granular access
        }
      },
      
      versioning: { enabled: true },
      
      // Lifecycle for cost optimization
      lifecycle: {
        rule: [
          {
            condition: {
              age: 30,
              matchesStorageClass: ['STANDARD']
            },
            action: {
              type: 'SetStorageClass',
              storageClass: 'NEARLINE'
            }
          },
          {
            condition: {
              age: 365,
              isLive: false // Non-current versions
            },
            action: {
              type: 'Delete'
            }
          }
        ]
      },
      
      labels: {
        environment: process.env.NODE_ENV || 'development',
        application: 'mindhub',
        data_type: 'educational_resources',
        hub: 'resources',
        access_type: 'public_restricted'
      }
    };

    const [bucket] = await this.storage.createBucket(bucketName, bucketConfig);
    
    // Set up folder structure
    const folders = [
      'documents/', // PDF guides, worksheets
      'videos/', // Educational videos
      'audio/', // Audio resources, meditations
      'images/', // Infographics, diagrams
      'interactive/', // Interactive content
      'templates/', // Document templates
      'courses/', // Structured courses
      'assessments/', // Self-assessment tools
      'thumbnails/', // Preview images
      'transcripts/' // Video/audio transcripts
    ];

    for (const folder of folders) {
      await bucket.file(folder + '.keep').save('');
    }

    console.log(`✅ Resources library bucket created: ${bucketName}`);
    return bucket;
  }

  /**
   * Bucket: Backups Storage
   * Purpose: Automated backups of databases and critical data
   */
  async createBackupsBucket() {
    const bucketName = `${this.projectId}-backups`;
    
    const bucketConfig = {
      location: process.env.BACKUP_REGION || 'us-west1', // Different region for DR
      storageClass: 'COLDLINE', // Cost-effective for backups
      
      encryption: {
        defaultKmsKeyName: `projects/${this.projectId}/locations/global/keyRings/backup-data/cryptoKeys/backup-encryption`
      },
      
      versioning: { enabled: true },
      uniformBucketLevelAccess: { enabled: true },
      
      // Long-term retention for compliance
      retentionPolicy: {
        retentionPeriod: 7 * 365 * 24 * 60 * 60, // 7 years
        effectiveTime: new Date()
      },
      
      // Lifecycle for backup management
      lifecycle: {
        rule: [
          {
            condition: {
              age: 30,
              matchesStorageClass: ['COLDLINE']
            },
            action: {
              type: 'SetStorageClass',
              storageClass: 'ARCHIVE'
            }
          },
          {
            condition: {
              age: 2555, // 7 years
              matchesStorageClass: ['ARCHIVE']
            },
            action: {
              type: 'Delete'
            }
          }
        ]
      },
      
      labels: {
        environment: process.env.NODE_ENV || 'development',
        application: 'mindhub',
        data_type: 'backups',
        compliance: 'long_term_retention'
      }
    };

    const [bucket] = await this.storage.createBucket(bucketName, bucketConfig);
    
    // Set up folder structure
    const folders = [
      'database/', // Database backups
      'firestore/', // Firestore exports
      'files/', // File system backups
      'configurations/', // Configuration backups
      'logs/', // Log backups
      'daily/', // Daily backups
      'weekly/', // Weekly backups
      'monthly/', // Monthly backups
      'yearly/' // Yearly archives
    ];

    for (const folder of folders) {
      await bucket.file(folder + '.keep').save('');
    }

    console.log(`✅ Backups bucket created: ${bucketName}`);
    return bucket;
  }

  /**
   * Bucket: Temporary Files
   * Purpose: Short-term storage for uploads, processing, and temporary data
   */
  async createTempFilesBucket() {
    const bucketName = `${this.projectId}-temp-files`;
    
    const bucketConfig = {
      location: this.region,
      storageClass: 'STANDARD',
      
      uniformBucketLevelAccess: { enabled: true },
      
      // Aggressive cleanup for temp files
      lifecycle: {
        rule: [
          {
            condition: {
              age: 1 // 1 day
            },
            action: {
              type: 'Delete'
            }
          },
          {
            condition: {
              createdBefore: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            },
            action: {
              type: 'Delete'
            }
          }
        ]
      },
      
      labels: {
        environment: process.env.NODE_ENV || 'development',
        application: 'mindhub',
        data_type: 'temporary',
        auto_cleanup: 'enabled'
      }
    };

    const [bucket] = await this.storage.createBucket(bucketName, bucketConfig);
    
    // Set up folder structure
    const folders = [
      'uploads/', // File uploads in progress
      'processing/', // Files being processed
      'previews/', // Preview generations
      'exports/', // Temporary exports
      'cache/', // Cached files
      'sessions/' // Session data
    ];

    for (const folder of folders) {
      await bucket.file(folder + '.keep').save('');
    }

    console.log(`✅ Temporary files bucket created: ${bucketName}`);
    return bucket;
  }

  /**
   * Bucket: Static Assets
   * Purpose: Public static assets for web application
   */
  async createStaticAssetsBucket() {
    const bucketName = `${this.projectId}-static-assets`;
    
    const bucketConfig = {
      location: 'multi-region',
      storageClass: 'STANDARD',
      
      // Public access for static assets
      iamConfiguration: {
        uniformBucketLevelAccess: {
          enabled: false
        }
      },
      
      // CORS for web access
      cors: [
        {
          origin: [
            'https://mindhub.com',
            'https://www.mindhub.com',
            'https://app.mindhub.com',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002'
          ],
          method: ['GET', 'HEAD'],
          responseHeader: ['Content-Type', 'Access-Control-Allow-Origin'],
          maxAgeSeconds: 3600
        }
      ],
      
      // Website configuration for static hosting
      website: {
        mainPageSuffix: 'index.html',
        notFoundPage: '404.html'
      },
      
      labels: {
        environment: process.env.NODE_ENV || 'development',
        application: 'mindhub',
        data_type: 'static_assets',
        access_type: 'public'
      }
    };

    const [bucket] = await this.storage.createBucket(bucketName, bucketConfig);
    
    // Set up folder structure
    const folders = [
      'css/', // Stylesheets
      'js/', // JavaScript files
      'images/', // Public images
      'fonts/', // Web fonts
      'icons/', // Icons and logos
      'videos/', // Public videos
      'documents/', // Public documents
      'templates/' // Email templates, etc.
    ];

    for (const folder of folders) {
      await bucket.file(folder + '.keep').save('');
    }

    // Make bucket publicly readable for static assets
    await bucket.iam.setPolicy({
      bindings: [
        {
          role: 'roles/storage.objectViewer',
          members: ['allUsers']
        }
      ]
    });

    console.log(`✅ Static assets bucket created: ${bucketName}`);
    return bucket;
  }

  /**
   * Bucket: Audit Logs
   * Purpose: Secure storage for audit trails and compliance logs
   */
  async createAuditLogsBucket() {
    const bucketName = `${this.projectId}-audit-logs`;
    
    const bucketConfig = {
      location: this.region,
      storageClass: 'COLDLINE',
      
      encryption: {
        defaultKmsKeyName: `projects/${this.projectId}/locations/global/keyRings/audit-data/cryptoKeys/audit-logs`
      },
      
      versioning: { enabled: true },
      uniformBucketLevelAccess: { enabled: true },
      
      // Compliance retention
      retentionPolicy: {
        retentionPeriod: 7 * 365 * 24 * 60 * 60, // 7 years
        effectiveTime: new Date()
      },
      
      // Write-once, read-many for audit integrity
      bucketPolicyOnly: {
        enabled: true,
        lockedTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      
      labels: {
        environment: process.env.NODE_ENV || 'development',
        application: 'mindhub',
        data_type: 'audit_logs',
        compliance: 'immutable_logs'
      }
    };

    const [bucket] = await this.storage.createBucket(bucketName, bucketConfig);
    
    // Set up folder structure
    const folders = [
      'access_logs/', // User access logs
      'data_changes/', // Data modification logs
      'security_events/', // Security-related events
      'system_logs/', // System operation logs
      'compliance_logs/', // Compliance-specific logs
      'daily/', // Daily log archives
      'monthly/', // Monthly log archives
      'yearly/' // Yearly log archives
    ];

    for (const folder of folders) {
      await bucket.file(folder + '.keep').save('');
    }

    console.log(`✅ Audit logs bucket created: ${bucketName}`);
    return bucket;
  }

  /**
   * Set up lifecycle policies for all buckets
   */
  async setupLifecyclePolicies() {
    const lifecyclePolicies = {
      // Patient data lifecycle
      [`${this.projectId}-patient-data`]: {
        rule: [
          {
            condition: {
              age: 1825, // 5 years - move to archive after required retention
              matchesStorageClass: ['STANDARD']
            },
            action: {
              type: 'SetStorageClass',
              storageClass: 'ARCHIVE'
            }
          },
          {
            condition: {
              age: 2555, // 7 years - delete after extended retention
              matchesStorageClass: ['ARCHIVE']
            },
            action: {
              type: 'Delete'
            }
          }
        ]
      },

      // Resources lifecycle
      [`${this.projectId}-resources-library`]: {
        rule: [
          {
            condition: {
              age: 90,
              matchesStorageClass: ['STANDARD']
            },
            action: {
              type: 'SetStorageClass',
              storageClass: 'NEARLINE'
            }
          },
          {
            condition: {
              age: 365,
              isLive: false // Old versions only
            },
            action: {
              type: 'Delete'
            }
          }
        ]
      },

      // Temp files aggressive cleanup
      [`${this.projectId}-temp-files`]: {
        rule: [
          {
            condition: {
              age: 1 // 1 day
            },
            action: {
              type: 'Delete'
            }
          }
        ]
      }
    };

    for (const [bucketName, lifecycle] of Object.entries(lifecyclePolicies)) {
      try {
        const bucket = this.storage.bucket(bucketName);
        await bucket.setMetadata({ lifecycle });
        console.log(`✅ Lifecycle policy set for ${bucketName}`);
      } catch (error) {
        console.error(`❌ Error setting lifecycle for ${bucketName}:`, error.message);
      }
    }
  }

  /**
   * Configure bucket security and CORS policies
   */
  async configureBucketSecurity() {
    // CORS configuration for web access
    const corsConfig = [
      {
        origin: [
          'https://mindhub.com',
          'https://www.mindhub.com',
          'https://app.mindhub.com',
          'https://expedix.mindhub.com',
          'https://clinimetrix.mindhub.com',
          'https://formx.mindhub.com',
          'https://resources.mindhub.com'
        ],
        method: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
        responseHeader: [
          'Content-Type',
          'Access-Control-Allow-Origin',
          'Authorization',
          'X-Requested-With'
        ],
        maxAgeSeconds: 3600
      }
    ];

    // Apply CORS to appropriate buckets
    const corsEnabledBuckets = [
      `${this.projectId}-static-assets`,
      `${this.projectId}-resources-library`,
      `${this.projectId}-temp-files`
    ];

    for (const bucketName of corsEnabledBuckets) {
      try {
        const bucket = this.storage.bucket(bucketName);
        await bucket.setCorsConfiguration(corsConfig);
        console.log(`✅ CORS configured for ${bucketName}`);
      } catch (error) {
        console.error(`❌ Error configuring CORS for ${bucketName}:`, error.message);
      }
    }
  }

  /**
   * Generate signed URLs for secure file access
   * @param {string} bucketName - Bucket name
   * @param {string} fileName - File name
   * @param {Object} options - Signing options
   * @returns {Promise<string>} Signed URL
   */
  async generateSignedUrl(bucketName, fileName, options = {}) {
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(fileName);

    const signedUrlConfig = {
      version: 'v4',
      action: options.action || 'read',
      expires: options.expires || Date.now() + 15 * 60 * 1000, // 15 minutes default
      extensionHeaders: options.headers || {}
    };

    const [url] = await file.getSignedUrl(signedUrlConfig);
    return url;
  }

  /**
   * Upload file with encryption and metadata
   * @param {string} bucketName - Target bucket
   * @param {string} fileName - File name
   * @param {Buffer} fileData - File data
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(bucketName, fileName, fileData, metadata = {}) {
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(fileName);

    const uploadOptions = {
      metadata: {
        contentType: metadata.contentType || 'application/octet-stream',
        metadata: {
          uploadedBy: metadata.uploadedBy || 'system',
          uploadedAt: new Date().toISOString(),
          originalName: metadata.originalName || fileName,
          checksum: crypto.createHash('md5').update(fileData).digest('hex'),
          ...metadata.customMetadata
        }
      },
      resumable: fileData.length > 5 * 1024 * 1024, // Use resumable for files > 5MB
      validation: 'md5' // Validate upload integrity
    };

    await file.save(fileData, uploadOptions);
    
    return {
      success: true,
      bucketName,
      fileName,
      size: fileData.length,
      url: `gs://${bucketName}/${fileName}`
    };
  }

  /**
   * Get bucket usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getBucketUsageStats() {
    const bucketNames = [
      `${this.projectId}-patient-data`,
      `${this.projectId}-clinical-forms`,
      `${this.projectId}-resources-library`,
      `${this.projectId}-backups`,
      `${this.projectId}-temp-files`,
      `${this.projectId}-static-assets`,
      `${this.projectId}-audit-logs`
    ];

    const stats = {};

    for (const bucketName of bucketNames) {
      try {
        const bucket = this.storage.bucket(bucketName);
        const [files] = await bucket.getFiles();
        
        let totalSize = 0;
        let fileCount = 0;
        
        for (const file of files) {
          const [metadata] = await file.getMetadata();
          totalSize += parseInt(metadata.size || 0);
          fileCount++;
        }

        stats[bucketName] = {
          fileCount,
          totalSize,
          totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
        };
      } catch (error) {
        stats[bucketName] = { error: error.message };
      }
    }

    return stats;
  }
}

module.exports = CloudStorageManager;