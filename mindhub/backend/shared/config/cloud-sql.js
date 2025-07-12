/**
 * Cloud SQL Configuration with Security Settings
 * 
 * Comprehensive Cloud SQL setup with security configurations,
 * backup policies, and high availability for MindHub healthcare platform
 */

const { CloudSqlAdmin } = require('@google-cloud/sql');
const fs = require('fs');
const path = require('path');

class CloudSQLManager {
  constructor() {
    this.sqlAdmin = new CloudSqlAdmin();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'mindhub-healthcare';
    this.region = process.env.CLOUD_SQL_REGION || 'us-central1';
    this.instanceId = process.env.CLOUD_SQL_INSTANCE || 'mindhub-production';
  }

  /**
   * Create Cloud SQL instance with comprehensive security settings
   * @returns {Promise<Object>} Instance creation result
   */
  async createSecureInstance() {
    const instanceConfig = {
      name: `projects/${this.projectId}/instances/${this.instanceId}`,
      project: this.projectId,
      region: this.region,
      databaseVersion: 'MYSQL_8_0',
      
      // Backend configuration
      backendType: 'SECOND_GEN',
      
      // Settings configuration
      settings: {
        tier: 'db-custom-2-7680', // 2 vCPU, 7.5 GB RAM for healthcare workload
        
        // Availability configuration
        availabilityType: 'REGIONAL', // High availability with automatic failover
        
        // Backup configuration
        backupConfiguration: {
          enabled: true,
          startTime: '02:00', // 2 AM backup window
          pointInTimeRecoveryEnabled: true,
          transactionLogRetentionDays: 7,
          backupRetentionSettings: {
            retainedBackups: 30, // Keep 30 backups for compliance
            retentionUnit: 'COUNT'
          },
          // Binary log configuration for point-in-time recovery
          binaryLogEnabled: true,
          location: this.region
        },
        
        // IP configuration with security
        ipConfiguration: {
          // Private IP only for enhanced security
          ipv4Enabled: false,
          privateNetwork: `projects/${this.projectId}/global/networks/mindhub-vpc`,
          requireSsl: true, // Force SSL connections
          
          // Authorized networks (only allow specific IP ranges)
          authorizedNetworks: [
            {
              name: 'healthcare-office-network',
              value: process.env.OFFICE_IP_RANGE || '192.168.1.0/24',
              expirationTime: null
            },
            {
              name: 'gae-instances',
              value: process.env.GAE_IP_RANGE || '0.0.0.0/0', // Will be restricted in production
              expirationTime: null
            }
          ]
        },
        
        // Database flags for security and performance
        databaseFlags: [
          // Security flags
          { name: 'slow_query_log', value: 'on' },
          { name: 'long_query_time', value: '2' },
          { name: 'log_queries_not_using_indexes', value: 'on' },
          { name: 'general_log', value: 'off' }, // Disabled for performance, enabled only for debugging
          
          // Performance flags
          { name: 'innodb_buffer_pool_size', value: '75%' },
          { name: 'max_connections', value: '100' },
          { name: 'wait_timeout', value: '28800' },
          
          // Compliance flags
          { name: 'sql_mode', value: 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' }
        ],
        
        // Storage configuration
        storageAutoResize: true,
        storageAutoResizeLimit: 1000, // 1TB max
        dataDiskSizeGb: 100,
        dataDiskType: 'PD_SSD',
        
        // Maintenance window
        maintenanceWindow: {
          hour: 3, // 3 AM
          day: 7,  // Sunday
          updateTrack: 'stable'
        },
        
        // Deletion protection
        deletionProtectionEnabled: true,
        
        // User labels for organization
        userLabels: {
          environment: process.env.NODE_ENV || 'development',
          application: 'mindhub',
          compliance: 'nom-024-ssa3-2010',
          team: 'healthcare-platform'
        }
      }
    };

    try {
      console.log('Creating Cloud SQL instance with security settings...');
      const [operation] = await this.sqlAdmin.insert({
        project: this.projectId,
        requestBody: instanceConfig
      });

      console.log(`Instance creation operation: ${operation.name}`);
      
      // Wait for operation to complete
      await this.waitForOperation(operation.name);
      
      console.log(`Cloud SQL instance ${this.instanceId} created successfully`);
      return { success: true, instanceId: this.instanceId };
      
    } catch (error) {
      console.error('Error creating Cloud SQL instance:', error);
      throw error;
    }
  }

  /**
   * Configure SSL certificates for secure connections
   * @returns {Promise<Object>} SSL configuration result
   */
  async configureSSLCertificates() {
    try {
      // Create server CA certificate
      const [serverCaOperation] = await this.sqlAdmin.addServerCa({
        project: this.projectId,
        instance: this.instanceId
      });

      await this.waitForOperation(serverCaOperation.name);
      console.log('Server CA certificate created');

      // Create client certificate for application connections
      const clientCertConfig = {
        commonName: 'mindhub-app-client'
      };

      const [clientCertOperation] = await this.sqlAdmin.insert({
        project: this.projectId,
        instance: this.instanceId,
        requestBody: clientCertConfig
      });

      const clientCertResult = await this.waitForOperation(clientCertOperation.name);
      
      // Save certificates to secure location
      await this.saveCertificates(clientCertResult);
      
      console.log('SSL certificates configured successfully');
      return { success: true, certificates: 'configured' };
      
    } catch (error) {
      console.error('Error configuring SSL certificates:', error);
      throw error;
    }
  }

  /**
   * Create database users with proper permissions
   * @returns {Promise<Object>} User creation result
   */
  async createDatabaseUsers() {
    const users = [
      {
        name: 'mindhub_app',
        password: this.generateSecurePassword(),
        host: '%',
        type: 'BUILT_IN'
      },
      {
        name: 'mindhub_readonly',
        password: this.generateSecurePassword(),
        host: '%',
        type: 'BUILT_IN'
      },
      {
        name: 'mindhub_backup',
        password: this.generateSecurePassword(),
        host: '%',
        type: 'BUILT_IN'
      }
    ];

    try {
      for (const user of users) {
        const [operation] = await this.sqlAdmin.insert({
          project: this.projectId,
          instance: this.instanceId,
          requestBody: user
        });

        await this.waitForOperation(operation.name);
        console.log(`Database user ${user.name} created`);
      }

      return { success: true, users: users.map(u => u.name) };
      
    } catch (error) {
      console.error('Error creating database users:', error);
      throw error;
    }
  }

  /**
   * Configure read replica for disaster recovery
   * @returns {Promise<Object>} Replica configuration result
   */
  async configureReadReplica() {
    const replicaConfig = {
      name: `${this.instanceId}-replica`,
      region: process.env.CLOUD_SQL_REPLICA_REGION || 'us-west1', // Different region for DR
      masterInstanceName: `projects/${this.projectId}/instances/${this.instanceId}`,
      
      settings: {
        tier: 'db-custom-1-3840', // Smaller tier for read replica
        availabilityType: 'ZONAL',
        
        // Replica-specific settings
        replicationType: 'ASYNCHRONOUS',
        
        // Same security settings as master
        ipConfiguration: {
          ipv4Enabled: false,
          privateNetwork: `projects/${this.projectId}/global/networks/mindhub-vpc`,
          requireSsl: true
        },
        
        userLabels: {
          environment: process.env.NODE_ENV || 'development',
          application: 'mindhub',
          type: 'read-replica',
          compliance: 'nom-024-ssa3-2010'
        }
      }
    };

    try {
      console.log('Creating read replica for disaster recovery...');
      const [operation] = await this.sqlAdmin.insert({
        project: this.projectId,
        requestBody: replicaConfig
      });

      await this.waitForOperation(operation.name);
      
      console.log(`Read replica ${replicaConfig.name} created successfully`);
      return { success: true, replicaId: replicaConfig.name };
      
    } catch (error) {
      console.error('Error creating read replica:', error);
      throw error;
    }
  }

  /**
   * Set up automated backup verification
   * @returns {Promise<Object>} Backup verification setup result
   */
  async setupBackupVerification() {
    // This would typically be implemented with Cloud Functions
    // For now, we'll create the configuration
    
    const backupVerificationConfig = {
      schedule: '0 4 * * *', // Daily at 4 AM
      verificationDatabase: 'mindhub_backup_test',
      retentionDays: 30,
      alertingEnabled: true,
      
      verificationSteps: [
        'restore_latest_backup',
        'verify_data_integrity',
        'check_table_counts',
        'validate_constraints',
        'cleanup_test_instance'
      ]
    };

    // Save configuration for Cloud Function implementation
    const configPath = path.join(__dirname, '../../../config/backup-verification.json');
    fs.writeFileSync(configPath, JSON.stringify(backupVerificationConfig, null, 2));
    
    console.log('Backup verification configuration created');
    return { success: true, config: 'saved' };
  }

  /**
   * Wait for Cloud SQL operation to complete
   * @param {string} operationName - Operation name to wait for
   * @returns {Promise<Object>} Operation result
   */
  async waitForOperation(operationName) {
    let operation;
    do {
      [operation] = await this.sqlAdmin.get({
        project: this.projectId,
        operation: operationName
      });
      
      if (operation.status !== 'DONE') {
        console.log(`Waiting for operation ${operationName}... Status: ${operation.status}`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }
    } while (operation.status !== 'DONE');

    if (operation.error) {
      throw new Error(`Operation failed: ${JSON.stringify(operation.error)}`);
    }

    return operation;
  }

  /**
   * Save SSL certificates to secure location
   * @param {Object} certResult - Certificate operation result
   */
  async saveCertificates(certResult) {
    const certDir = path.join(__dirname, '../../../ssl-certs');
    
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true, mode: 0o700 });
    }

    // Note: In production, certificates should be stored in Secret Manager
    const certPaths = {
      serverCa: path.join(certDir, 'server-ca.pem'),
      clientCert: path.join(certDir, 'client-cert.pem'),
      clientKey: path.join(certDir, 'client-key.pem')
    };

    // Write certificates (this would be replaced with Secret Manager in production)
    if (certResult.serverCaCert) {
      fs.writeFileSync(certPaths.serverCa, certResult.serverCaCert, { mode: 0o600 });
    }
    if (certResult.clientCert) {
      fs.writeFileSync(certPaths.clientCert, certResult.clientCert, { mode: 0o600 });
    }
    if (certResult.clientKey) {
      fs.writeFileSync(certPaths.clientKey, certResult.clientKey, { mode: 0o600 });
    }

    console.log('SSL certificates saved to secure location');
  }

  /**
   * Generate secure password for database users
   * @returns {string} Secure password
   */
  generateSecurePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Get instance connection info
   * @returns {Promise<Object>} Connection information
   */
  async getConnectionInfo() {
    try {
      const [instance] = await this.sqlAdmin.get({
        project: this.projectId,
        instance: this.instanceId
      });

      return {
        connectionName: instance.connectionName,
        ipAddresses: instance.ipAddresses,
        serverCaCert: instance.serverCaCert,
        region: instance.region,
        backendType: instance.backendType
      };
      
    } catch (error) {
      console.error('Error getting connection info:', error);
      throw error;
    }
  }

  /**
   * Test database connectivity with SSL
   * @returns {Promise<Object>} Connection test result
   */
  async testSecureConnection() {
    const mysql = require('mysql2/promise');
    
    const connectionConfig = {
      host: `/cloudsql/${this.projectId}:${this.region}:${this.instanceId}`,
      user: 'mindhub_app',
      password: process.env.DB_PASSWORD,
      database: 'mindhub_mvp',
      ssl: {
        ca: fs.readFileSync(path.join(__dirname, '../../../ssl-certs/server-ca.pem')),
        cert: fs.readFileSync(path.join(__dirname, '../../../ssl-certs/client-cert.pem')),
        key: fs.readFileSync(path.join(__dirname, '../../../ssl-certs/client-key.pem'))
      }
    };

    try {
      const connection = await mysql.createConnection(connectionConfig);
      const [rows] = await connection.execute('SELECT 1 as test');
      await connection.end();
      
      console.log('Secure database connection test successful');
      return { success: true, ssl: true };
      
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  }
}

module.exports = CloudSQLManager;