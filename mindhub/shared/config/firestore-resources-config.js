/**
 * Firestore Configuration for Resources Library System
 * 
 * This file contains configuration settings, initialization functions,
 * and utility methods for the Resources Library Firestore setup.
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

class FirestoreResourcesConfig {
  constructor(config = {}) {
    this.config = {
      projectId: config.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID,
      storageBucket: config.storageBucket || process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
      credentials: config.credentials || process.env.GOOGLE_APPLICATION_CREDENTIALS,
      databaseURL: config.databaseURL || process.env.FIRESTORE_DATABASE_URL,
      ...config
    };
    
    this.firestore = null;
    this.storage = null;
    this.collections = this.initializeCollectionReferences();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  async initialize() {
    try {
      // Initialize Firebase Admin
      const app = initializeApp({
        projectId: this.config.projectId,
        storageBucket: this.config.storageBucket,
        credential: this.config.credentials
      });

      // Initialize Firestore
      this.firestore = getFirestore(app);
      
      // Initialize Cloud Storage
      this.storage = getStorage(app);

      console.log('✅ Firestore Resources Library initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Firestore:', error);
      throw error;
    }
  }

  /**
   * Initialize collection references
   */
  initializeCollectionReferences() {
    return {
      resources: 'resources',
      resourceUsage: 'resource_usage',
      resourceCategories: 'resource_categories',
      userPreferences: 'user_preferences',
      accessLogs: 'access_logs',
      resourceAnalytics: 'resource_analytics',
      resourceVersions: 'resource_versions'
    };
  }

  /**
   * Get collection reference
   */
  getCollection(collectionName) {
    if (!this.firestore) {
      throw new Error('Firestore not initialized. Call initialize() first.');
    }

    const collectionPath = this.collections[collectionName];
    if (!collectionPath) {
      throw new Error(`Collection ${collectionName} not found`);
    }

    return this.firestore.collection(collectionPath);
  }

  /**
   * Get document reference
   */
  getDocument(collectionName, documentId) {
    return this.getCollection(collectionName).doc(documentId);
  }

  /**
   * Create initial data and indexes
   */
  async setupInitialData() {
    try {
      console.log('🔧 Setting up initial data for Resources Library...');

      // Create default categories
      await this.createDefaultCategories();
      
      // Create sample resources (optional)
      await this.createSampleResources();
      
      // Setup analytics document
      await this.initializeAnalytics();

      console.log('✅ Initial data setup completed');
    } catch (error) {
      console.error('❌ Failed to setup initial data:', error);
      throw error;
    }
  }

  /**
   * Create default resource categories
   */
  async createDefaultCategories() {
    const defaultCategories = [
      {
        id: 'terapia-individual',
        name: 'Terapia Individual',
        description: 'Recursos para sesiones de terapia individual',
        icon: 'person',
        color: '#2196F3',
        level: 0,
        order: 1,
        subcategories: [
          'ejercicios-respiracion',
          'tecnicas-relajacion',
          'autorregistros',
          'hojas-de-trabajo',
          'guias-autoayuda'
        ]
      },
      {
        id: 'psicoeducacion',
        name: 'Psicoeducación',
        description: 'Materiales educativos sobre salud mental',
        icon: 'school',
        color: '#4CAF50',
        level: 0,
        order: 2,
        subcategories: [
          'ansiedad',
          'depresion',
          'estres',
          'trastornos-alimentarios',
          'adicciones',
          'trastornos-sueno'
        ]
      },
      {
        id: 'evaluacion',
        name: 'Instrumentos de Evaluación',
        description: 'Herramientas de evaluación psicológica',
        icon: 'assessment',
        color: '#FF9800',
        level: 0,
        order: 3,
        subcategories: [
          'cuestionarios',
          'escalas',
          'registros-sintomas',
          'diarios-emocionales'
        ]
      },
      {
        id: 'terapia-familiar',
        name: 'Terapia Familiar',
        description: 'Recursos para trabajo con familias',
        icon: 'family_restroom',
        color: '#9C27B0',
        level: 0,
        order: 4,
        subcategories: [
          'comunicacion-familiar',
          'resolucion-conflictos',
          'limites-disciplina',
          'desarrollo-infantil'
        ]
      },
      {
        id: 'terapia-grupal',
        name: 'Terapia Grupal',
        description: 'Materiales para sesiones grupales',
        icon: 'groups',
        color: '#607D8B',
        level: 0,
        order: 5,
        subcategories: [
          'habilidades-sociales',
          'apoyo-grupal',
          'talleres',
          'actividades-grupo'
        ]
      },
      {
        id: 'administrativo',
        name: 'Documentos Administrativos',
        description: 'Formularios y documentos administrativos',
        icon: 'description',
        color: '#795548',
        level: 0,
        order: 6,
        subcategories: [
          'consentimientos',
          'politicas-privacidad',
          'informacion-clinica',
          'formatos-evaluacion'
        ]
      }
    ];

    const categoriesCollection = this.getCollection('resourceCategories');
    
    for (const category of defaultCategories) {
      await categoriesCollection.doc(category.id).set({
        name: category.name,
        slug: category.id,
        description: category.description,
        icon: category.icon,
        color: category.color,
        parentCategory: null,
        subcategories: category.subcategories,
        level: category.level,
        order: category.order,
        resourceCount: 0,
        popularTags: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('📁 Default categories created');
  }

  /**
   * Create sample resources for testing
   */
  async createSampleResources() {
    const sampleResources = [
      {
        title: 'Técnicas de Respiración para la Ansiedad',
        description: 'Guía completa de ejercicios de respiración para reducir la ansiedad',
        category: 'terapia-individual',
        subcategory: 'ejercicios-respiracion',
        tags: ['ansiedad', 'respiracion', 'adultos', 'tecnicas'],
        type: 'text',
        content: {
          rawText: `# Técnicas de Respiración para la Ansiedad

Estimado/a {nombrePaciente},

Te comparto estas técnicas de respiración que pueden ayudarte a manejar los momentos de ansiedad:

## 1. Respiración Diafragmática
- Coloca una mano en el pecho y otra en el abdomen
- Respira lentamente por la nariz
- Asegúrate de que solo se mueva la mano del abdomen

## 2. Técnica 4-7-8
- Inhala por la nariz durante 4 segundos
- Mantén la respiración durante 7 segundos
- Exhala por la boca durante 8 segundos

Practica estas técnicas diariamente.

Atentamente,
{nombreProfesional}
{nombreClinica}`,
          formattedText: '', // Will be generated
          hasVariables: true,
          variables: ['nombrePaciente', 'nombreProfesional', 'nombreClinica'],
          templateEngine: 'handlebars'
        },
        permissions: {
          public: true,
          allowedRoles: ['psychiatrist', 'psychologist'],
          allowedUsers: [],
          restrictedClinics: [],
          requiresApproval: false
        },
        personalization: {
          enabled: true,
          brandingOptions: {
            allowLogo: true,
            logoPosition: 'header',
            allowCustomColors: true,
            defaultColorScheme: 'blue',
            allowFontCustomization: true,
            defaultFont: 'Arial'
          }
        },
        searchMetadata: {
          searchKeywords: ['respiracion', 'ansiedad', 'tecnicas', 'ejercicios'],
          popularity: 0,
          avgRating: 0,
          language: 'es-MX',
          ageGroups: ['adult'],
          difficulty: 'basic'
        },
        status: 'active'
      },
      {
        title: 'Registro de Emociones Diario',
        description: 'Plantilla para el registro diario de emociones y pensamientos',
        category: 'evaluacion',
        subcategory: 'registros-sintomas',
        tags: ['emociones', 'autorregistro', 'seguimiento'],
        type: 'template',
        content: {
          rawText: `# Registro de Emociones Diario

**Paciente:** {nombrePaciente}
**Fecha:** {fechaHoy}

## Registro del día

### Emoción principal experimentada:
- [ ] Alegría
- [ ] Tristeza  
- [ ] Ansiedad
- [ ] Enojo
- [ ] Miedo
- [ ] Otra: ___________

### Intensidad (1-10): ____

### Situación que la provocó:
_________________________________

### Pensamientos asociados:
_________________________________

### Estrategias utilizadas:
_________________________________

---
**Terapeuta:** {nombreProfesional}
**Clínica:** {nombreClinica}`,
          hasVariables: true,
          variables: ['nombrePaciente', 'fechaHoy', 'nombreProfesional', 'nombreClinica'],
          templateEngine: 'handlebars'
        },
        permissions: {
          public: true,
          allowedRoles: ['psychiatrist', 'psychologist'],
          allowedUsers: [],
          restrictedClinics: [],
          requiresApproval: false
        },
        personalization: {
          enabled: true,
          brandingOptions: {
            allowLogo: true,
            logoPosition: 'footer',
            allowCustomColors: false,
            allowFontCustomization: false,
            defaultFont: 'Arial'
          }
        },
        searchMetadata: {
          searchKeywords: ['emociones', 'registro', 'diario', 'seguimiento'],
          popularity: 0,
          avgRating: 0,
          language: 'es-MX',
          ageGroups: ['adult', 'adolescent'],
          difficulty: 'basic'
        },
        status: 'active'
      }
    ];

    const resourcesCollection = this.getCollection('resources');
    
    for (const resource of sampleResources) {
      const docRef = await resourcesCollection.add({
        ...resource,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          version: 1,
          downloadCount: 0,
          useCount: 0,
          lastUsed: null,
          fileHash: null
        },
        moderation: {
          reviewed: true,
          reviewedBy: 'system',
          reviewedAt: new Date(),
          approved: true,
          reviewNotes: 'System generated sample resource'
        }
      });

      console.log(`📄 Sample resource created: ${resource.title} (${docRef.id})`);
    }
  }

  /**
   * Initialize analytics document
   */
  async initializeAnalytics() {
    const analyticsCollection = this.getCollection('resourceAnalytics');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    await analyticsCollection.doc(today).set({
      date: new Date(),
      totalViews: 0,
      totalDownloads: 0,
      totalShares: 0,
      uniqueUsers: 0,
      topResources: [],
      categoryStats: [],
      userEngagement: {
        activeUsers: 0,
        newUsers: 0,
        avgSessionDuration: 0,
        avgResourcesPerSession: 0
      }
    });

    console.log('📊 Analytics initialized');
  }

  /**
   * Create Firestore indexes programmatically (requires Firebase CLI)
   */
  generateIndexesConfig() {
    return {
      indexes: [
        {
          collectionGroup: 'resources',
          queryScope: 'COLLECTION',
          fields: [
            { fieldPath: 'category', order: 'ASCENDING' },
            { fieldPath: 'metadata.createdAt', order: 'DESCENDING' }
          ]
        },
        {
          collectionGroup: 'resources',
          queryScope: 'COLLECTION',
          fields: [
            { fieldPath: 'status', order: 'ASCENDING' },
            { fieldPath: 'searchMetadata.popularity', order: 'DESCENDING' }
          ]
        },
        {
          collectionGroup: 'resource_usage',
          queryScope: 'COLLECTION',
          fields: [
            { fieldPath: 'patientId', order: 'ASCENDING' },
            { fieldPath: 'sentAt', order: 'DESCENDING' }
          ]
        },
        {
          collectionGroup: 'resource_usage',
          queryScope: 'COLLECTION',
          fields: [
            { fieldPath: 'practitionerId', order: 'ASCENDING' },
            { fieldPath: 'sentAt', order: 'DESCENDING' }
          ]
        }
      ]
    };
  }

  /**
   * Utility method to backup Firestore data
   */
  async backupCollection(collectionName, outputPath) {
    try {
      const collection = this.getCollection(collectionName);
      const snapshot = await collection.get();
      
      const data = [];
      snapshot.forEach(doc => {
        data.push({
          id: doc.id,
          data: doc.data()
        });
      });

      const fs = require('fs');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      
      console.log(`💾 Collection ${collectionName} backed up to ${outputPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to backup collection ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Utility method to restore Firestore data
   */
  async restoreCollection(collectionName, inputPath) {
    try {
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      
      const collection = this.getCollection(collectionName);
      const batch = this.firestore.batch();
      
      data.forEach(item => {
        const docRef = collection.doc(item.id);
        batch.set(docRef, item.data);
      });
      
      await batch.commit();
      
      console.log(`📥 Collection ${collectionName} restored from ${inputPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to restore collection ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Health check for Firestore connection
   */
  async healthCheck() {
    try {
      // Simple read operation to test connection
      const testDoc = await this.getCollection('resources').limit(1).get();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        collections: Object.keys(this.collections),
        projectId: this.config.projectId
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

module.exports = FirestoreResourcesConfig;