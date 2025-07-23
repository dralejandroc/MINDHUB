/**
 * Firestore Schema for MindHub Resources Library System
 * 
 * This schema defines the structure for storing psychoeducational resources,
 * tracking usage by patients, and managing permissions with proper indexing
 * for efficient querying and search functionality.
 */

const FirestoreResourcesSchema = {
  
  // ==============================================================================
  // COLLECTION: resources
  // Main collection for all psychoeducational resources
  // ==============================================================================
  resources: {
    documentId: 'auto-generated', // Firestore auto-generated ID
    
    // Basic Information
    title: 'string', // "Técnicas de Respiración para la Ansiedad"
    description: 'string', // Detailed description
    category: 'string', // "terapia-individual"
    subcategory: 'string', // "ejercicios-respiracion"
    tags: ['string'], // ["ansiedad", "adultos", "tecnicas"]
    
    // Resource Type and Content
    type: 'string', // "text" | "pdf" | "image" | "template"
    content: {
      // For text resources
      rawText: 'string', // Original editable text
      formattedText: 'string', // HTML formatted text
      
      // For file resources
      filePath: 'string', // Storage path
      fileName: 'string', // Original filename
      fileSize: 'number', // Size in bytes
      mimeType: 'string', // MIME type
      thumbnailPath: 'string', // Preview image path
      
      // For personalization
      hasVariables: 'boolean', // Contains {variables}
      variables: ['string'], // ["nombrePaciente", "nombreClinica"]
      templateEngine: 'string' // "handlebars" | "mustache"
    },
    
    // Metadata
    metadata: {
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      createdBy: 'string', // User ID
      version: 'number', // Version control
      downloadCount: 'number',
      useCount: 'number', // Times sent to patients
      lastUsed: 'timestamp',
      fileHash: 'string' // For duplicate detection
    },
    
    // Permissions and Access Control
    permissions: {
      public: 'boolean', // Available to all users
      allowedRoles: ['string'], // ["psychiatrist", "psychologist"]
      allowedUsers: ['string'], // Specific user IDs
      restrictedClinics: ['string'], // Clinic-specific resources
      requiresApproval: 'boolean' // Admin approval needed
    },
    
    // Personalization Settings
    personalization: {
      enabled: 'boolean',
      brandingOptions: {
        allowLogo: 'boolean',
        logoPosition: 'string', // "header" | "footer" | "watermark"
        allowCustomColors: 'boolean',
        defaultColorScheme: 'string',
        allowFontCustomization: 'boolean',
        defaultFont: 'string'
      },
      variableDefinitions: {
        // Define custom variables beyond standard ones
        customVariables: [{
          name: 'string',
          description: 'string',
          type: 'string', // "text" | "number" | "date"
          required: 'boolean'
        }]
      }
    },
    
    // Search and Discovery
    searchMetadata: {
      searchKeywords: ['string'], // Extracted keywords for search
      popularity: 'number', // Usage-based ranking
      avgRating: 'number', // User ratings
      language: 'string', // "es-MX" | "en-US"
      ageGroups: ['string'], // ["adult", "adolescent"]
      difficulty: 'string' // "basic" | "intermediate" | "advanced"
    },
    
    // Status and Moderation
    status: 'string', // "active" | "draft" | "archived" | "pending_review"
    moderation: {
      reviewed: 'boolean',
      reviewedBy: 'string', // Admin user ID
      reviewedAt: 'timestamp',
      approved: 'boolean',
      reviewNotes: 'string'
    }
  },

  // ==============================================================================
  // COLLECTION: resource_usage
  // Tracks when resources are sent to patients
  // ==============================================================================
  resource_usage: {
    documentId: 'auto-generated',
    
    // Core tracking information
    resourceId: 'string', // Reference to resources collection
    patientId: 'string', // Patient identifier
    practitionerId: 'string', // Professional who sent it
    clinicId: 'string', // Clinic context
    sessionId: 'string', // Optional consultation ID
    
    // Timing information
    sentAt: 'timestamp',
    viewedAt: 'timestamp', // When patient first viewed
    downloadedAt: 'timestamp', // When patient downloaded
    completedAt: 'timestamp', // When marked as completed
    
    // Delivery information
    method: 'string', // "email" | "print" | "download" | "view_only"
    deliveryDetails: {
      emailAddress: 'string', // If sent by email
      emailSubject: 'string',
      emailMessage: 'string',
      attachmentName: 'string',
      printedCopies: 'number', // If printed
      downloadToken: 'string' // Secure download token
    },
    
    // Personalization used
    personalizedContent: {
      patientName: 'string',
      clinicName: 'string',
      practitionerName: 'string',
      customVariables: {}, // Key-value pairs of variables used
      brandingApplied: {
        logoUsed: 'boolean',
        colorScheme: 'string',
        fontFamily: 'string'
      }
    },
    
    // Status and notes
    status: 'string', // "sent" | "viewed" | "downloaded" | "completed" | "failed"
    practitionerNotes: 'string', // Notes from professional
    patientFeedback: 'string', // Optional patient feedback
    
    // Expedix timeline integration
    expedixTimelineId: 'string', // Reference to timeline entry
    
    // Tracking metadata
    metadata: {
      userAgent: 'string', // Browser/device info
      ipAddress: 'string', // For security logging
      deviceType: 'string', // "desktop" | "mobile" | "tablet"
      geolocation: {
        country: 'string',
        region: 'string'
      }
    }
  },

  // ==============================================================================
  // COLLECTION: resource_categories
  // Hierarchical category structure
  // ==============================================================================
  resource_categories: {
    documentId: 'category-slug', // "terapia-individual"
    
    // Category information
    name: 'string', // "Terapia Individual"
    slug: 'string', // "terapia-individual"
    description: 'string',
    icon: 'string', // Icon name or path
    color: 'string', // Hex color code
    
    // Hierarchy
    parentCategory: 'string', // Reference to parent category
    subcategories: ['string'], // Array of subcategory slugs
    level: 'number', // 0 = root, 1 = subcategory, etc.
    order: 'number', // Display order
    
    // Metadata
    resourceCount: 'number', // Number of resources in category
    popularTags: ['string'], // Most used tags in this category
    isActive: 'boolean',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  },

  // ==============================================================================
  // COLLECTION: user_preferences
  // User-specific settings and favorites
  // ==============================================================================
  user_preferences: {
    documentId: 'userId', // User ID as document ID
    
    // Favorite resources
    favoriteResources: ['string'], // Array of resource IDs
    recentlyUsed: [{
      resourceId: 'string',
      usedAt: 'timestamp',
      useCount: 'number'
    }],
    
    // Personal settings
    defaultPersonalization: {
      clinicBranding: {
        logoUrl: 'string',
        colorScheme: 'string',
        fontFamily: 'string'
      },
      emailTemplate: {
        subject: 'string',
        message: 'string',
        signature: 'string'
      }
    },
    
    // Category preferences
    preferredCategories: ['string'], // Categories user works with most
    hiddenCategories: ['string'], // Categories user wants to hide
    
    // Search preferences
    defaultSearchFilters: {
      categories: ['string'],
      tags: ['string'],
      type: 'string',
      language: 'string'
    },
    
    // Notification preferences
    notifications: {
      newResources: 'boolean',
      resourceUpdates: 'boolean',
      usageReports: 'boolean'
    }
  },

  // ==============================================================================
  // COLLECTION: access_logs
  // Security and audit logging
  // ==============================================================================
  access_logs: {
    documentId: 'auto-generated',
    
    // Event information
    eventType: 'string', // "resource_viewed" | "resource_downloaded" | "resource_uploaded"
    timestamp: 'timestamp',
    
    // User context
    userId: 'string',
    userRole: 'string',
    clinicId: 'string',
    
    // Resource context
    resourceId: 'string',
    resourceTitle: 'string',
    resourceCategory: 'string',
    
    // Patient context (if applicable)
    patientId: 'string',
    
    // Technical details
    ipAddress: 'string',
    userAgent: 'string',
    sessionId: 'string',
    
    // Additional context
    details: {
      method: 'string', // How was it accessed
      success: 'boolean',
      errorMessage: 'string', // If failed
      duration: 'number', // Time taken in ms
      fileSize: 'number' // If download
    }
  },

  // ==============================================================================
  // COLLECTION: resource_analytics
  // Aggregated analytics data
  // ==============================================================================
  resource_analytics: {
    documentId: 'YYYY-MM-DD', // Date-based document ID
    
    // Daily aggregates
    date: 'timestamp',
    
    // Resource usage stats
    totalViews: 'number',
    totalDownloads: 'number',
    totalShares: 'number',
    uniqueUsers: 'number',
    
    // Top resources
    topResources: [{
      resourceId: 'string',
      title: 'string',
      category: 'string',
      viewCount: 'number',
      downloadCount: 'number',
      shareCount: 'number'
    }],
    
    // Category breakdown
    categoryStats: [{
      category: 'string',
      resourceCount: 'number',
      usageCount: 'number',
      popularTags: ['string']
    }],
    
    // User engagement
    userEngagement: {
      activeUsers: 'number',
      newUsers: 'number',
      avgSessionDuration: 'number',
      avgResourcesPerSession: 'number'
    }
  },

  // ==============================================================================
  // COLLECTION: resource_versions
  // Version control for resources
  // ==============================================================================
  resource_versions: {
    documentId: 'auto-generated',
    
    // Version information
    resourceId: 'string', // Parent resource ID
    version: 'number',
    versionName: 'string', // "v2.1" or "Updated 2025"
    
    // Change information
    changes: {
      description: 'string', // What changed
      changeType: 'string', // "content" | "metadata" | "permissions"
      changedBy: 'string', // User ID
      changedAt: 'timestamp'
    },
    
    // Snapshot of resource at this version
    snapshot: {
      title: 'string',
      content: {}, // Full content snapshot
      metadata: {}, // Metadata snapshot
      permissions: {} // Permissions snapshot
    },
    
    // Version status
    isActive: 'boolean', // Is this the current version
    rollbackAvailable: 'boolean'
  }
};

// ==============================================================================
// FIRESTORE INDEXES
// Define composite indexes for efficient querying
// ==============================================================================
const FirestoreIndexes = [
  // Resources collection indexes
  {
    collection: 'resources',
    fields: [
      { field: 'category', order: 'ascending' },
      { field: 'metadata.createdAt', order: 'descending' }
    ]
  },
  {
    collection: 'resources',
    fields: [
      { field: 'status', order: 'ascending' },
      { field: 'searchMetadata.popularity', order: 'descending' }
    ]
  },
  {
    collection: 'resources',
    fields: [
      { field: 'permissions.public', order: 'ascending' },
      { field: 'type', order: 'ascending' },
      { field: 'metadata.useCount', order: 'descending' }
    ]
  },
  {
    collection: 'resources',
    fields: [
      { field: 'tags', order: 'ascending' },
      { field: 'metadata.lastUsed', order: 'descending' }
    ]
  },

  // Resource usage indexes
  {
    collection: 'resource_usage',
    fields: [
      { field: 'patientId', order: 'ascending' },
      { field: 'sentAt', order: 'descending' }
    ]
  },
  {
    collection: 'resource_usage',
    fields: [
      { field: 'practitionerId', order: 'ascending' },
      { field: 'sentAt', order: 'descending' }
    ]
  },
  {
    collection: 'resource_usage',
    fields: [
      { field: 'resourceId', order: 'ascending' },
      { field: 'sentAt', order: 'descending' }
    ]
  },
  {
    collection: 'resource_usage',
    fields: [
      { field: 'status', order: 'ascending' },
      { field: 'sentAt', order: 'descending' }
    ]
  },

  // Access logs indexes
  {
    collection: 'access_logs',
    fields: [
      { field: 'userId', order: 'ascending' },
      { field: 'timestamp', order: 'descending' }
    ]
  },
  {
    collection: 'access_logs',
    fields: [
      { field: 'eventType', order: 'ascending' },
      { field: 'timestamp', order: 'descending' }
    ]
  },
  {
    collection: 'access_logs',
    fields: [
      { field: 'resourceId', order: 'ascending' },
      { field: 'timestamp', order: 'descending' }
    ]
  }
];

// ==============================================================================
// FIRESTORE SECURITY RULES
// Define security rules for the collections
// ==============================================================================
const FirestoreSecurityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Resources collection rules
    match /resources/{resourceId} {
      // Read: Allow if user has permission or resource is public
      allow read: if isAuthenticated() && 
        (resource.data.permissions.public == true ||
         request.auth.uid in resource.data.permissions.allowedUsers ||
         hasRole(resource.data.permissions.allowedRoles));
      
      // Write: Allow resource owners and admins
      allow create, update: if isAuthenticated() && 
        (isAdmin() || isResourceOwner(resourceId));
      
      // Delete: Only admins
      allow delete: if isAuthenticated() && isAdmin();
    }
    
    // Resource usage collection rules
    match /resource_usage/{usageId} {
      // Read: Allow practitioners and patients involved
      allow read: if isAuthenticated() && 
        (request.auth.uid == resource.data.practitionerId ||
         request.auth.uid == resource.data.patientId ||
         isAdmin());
      
      // Create: Allow practitioners
      allow create: if isAuthenticated() && 
        (isPractitioner() || isAdmin());
      
      // Update: Allow practitioners to update their own records
      allow update: if isAuthenticated() && 
        (request.auth.uid == resource.data.practitionerId || isAdmin());
    }
    
    // Categories collection rules
    match /resource_categories/{categoryId} {
      // Read: Allow all authenticated users
      allow read: if isAuthenticated();
      
      // Write: Only admins
      allow write: if isAuthenticated() && isAdmin();
    }
    
    // User preferences rules
    match /user_preferences/{userId} {
      // Read/Write: Only the user themselves
      allow read, write: if isAuthenticated() && 
        request.auth.uid == userId;
    }
    
    // Access logs rules
    match /access_logs/{logId} {
      // Read: Only admins
      allow read: if isAuthenticated() && isAdmin();
      
      // Create: System only (no user writes)
      allow create: if false;
    }
    
    // Analytics rules
    match /resource_analytics/{date} {
      // Read: Admins and authorized users
      allow read: if isAuthenticated() && 
        (isAdmin() || hasRole(['clinic_admin']));
    }
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        request.auth.token.role == 'admin';
    }
    
    function isPractitioner() {
      return isAuthenticated() && 
        request.auth.token.role in ['psychiatrist', 'psychologist', 'nurse'];
    }
    
    function hasRole(roles) {
      return isAuthenticated() && 
        request.auth.token.role in roles;
    }
    
    function isResourceOwner(resourceId) {
      return isAuthenticated() && 
        request.auth.uid == get(/databases/$(database)/documents/resources/$(resourceId)).data.metadata.createdBy;
    }
  }
}
`;

// ==============================================================================
// EXPORT SCHEMA CONFIGURATION
// ==============================================================================
module.exports = {
  schema: FirestoreResourcesSchema,
  indexes: FirestoreIndexes,
  securityRules: FirestoreSecurityRules,
  
  // Helper function to validate document structure
  validateDocument: (collection, document) => {
    const schema = FirestoreResourcesSchema[collection];
    if (!schema) {
      throw new Error(`Collection ${collection} not found in schema`);
    }
    
    // Basic validation logic would go here
    return true;
  },
  
  // Helper function to get collection reference path
  getCollectionPath: (collection) => {
    return `/${collection}`;
  },
  
  // Helper function to get document reference path
  getDocumentPath: (collection, documentId) => {
    return `/${collection}/${documentId}`;
  }
};