#!/usr/bin/env node

/**
 * Cloud SQL Setup Script
 * 
 * Automated script to set up Cloud SQL instance with all security settings,
 * backup policies, and high availability configuration for MindHub
 */

const CloudSQLManager = require('../backend/shared/config/cloud-sql');
const fs = require('fs');
const path = require('path');

class CloudSQLSetup {
  constructor() {
    this.sqlManager = new CloudSQLManager();
    this.setupLog = [];
  }

  /**
   * Main setup orchestration
   */
  async runCompleteSetup() {
    console.log('🏥 Starting MindHub Cloud SQL Setup...\n');
    
    try {
      // Step 1: Validate prerequisites
      await this.validatePrerequisites();
      this.log('✅ Prerequisites validated');

      // Step 2: Create VPC network if needed
      await this.ensureVPCNetwork();
      this.log('✅ VPC network configured');

      // Step 3: Create main Cloud SQL instance
      await this.sqlManager.createSecureInstance();
      this.log('✅ Cloud SQL instance created with security settings');

      // Step 4: Configure SSL certificates
      await this.sqlManager.configureSSLCertificates();
      this.log('✅ SSL certificates configured');

      // Step 5: Create database users
      await this.sqlManager.createDatabaseUsers();
      this.log('✅ Database users created');

      // Step 6: Set up read replica
      await this.sqlManager.configureReadReplica();
      this.log('✅ Read replica configured for disaster recovery');

      // Step 7: Initialize database schema
      await this.initializeDatabaseSchema();
      this.log('✅ Database schema initialized');

      // Step 8: Set up backup verification
      await this.sqlManager.setupBackupVerification();
      this.log('✅ Backup verification configured');

      // Step 9: Test connections
      await this.sqlManager.testSecureConnection();
      this.log('✅ Secure connection tested successfully');

      // Step 10: Generate configuration files
      await this.generateConfigurationFiles();
      this.log('✅ Configuration files generated');

      console.log('\n🎉 Cloud SQL setup completed successfully!');
      await this.generateSetupReport();
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      await this.generateErrorReport(error);
      process.exit(1);
    }
  }

  /**
   * Validate prerequisites for Cloud SQL setup
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
      'sqladmin.googleapis.com',
      'compute.googleapis.com',
      'cloudkms.googleapis.com'
    ];

    for (const api of requiredAPIs) {
      try {
        execSync(`gcloud services list --enabled --filter="name:${api}" --format="value(name)"`, { stdio: 'pipe' });
      } catch (error) {
        console.log(`Enabling API: ${api}`);
        execSync(`gcloud services enable ${api}`);
      }
    }
  }

  /**
   * Ensure VPC network exists for private IP
   */
  async ensureVPCNetwork() {
    const { execSync } = require('child_process');
    const networkName = 'mindhub-vpc';
    
    try {
      // Check if network exists
      execSync(`gcloud compute networks describe ${networkName}`, { stdio: 'pipe' });
      console.log(`VPC network ${networkName} already exists`);
    } catch (error) {
      // Create VPC network
      console.log(`Creating VPC network: ${networkName}`);
      execSync(`gcloud compute networks create ${networkName} --subnet-mode=auto`);
      
      // Create firewall rules for healthcare compliance
      execSync(`gcloud compute firewall-rules create ${networkName}-allow-internal \\
        --network ${networkName} \\
        --allow tcp,udp,icmp \\
        --source-ranges 10.0.0.0/8`);
      
      execSync(`gcloud compute firewall-rules create ${networkName}-allow-https \\
        --network ${networkName} \\
        --allow tcp:443 \\
        --source-ranges 0.0.0.0/0`);
    }
  }

  /**
   * Initialize database schema using existing schema files
   */
  async initializeDatabaseSchema() {
    const mysql = require('mysql2/promise');
    
    // Connection configuration for initialization
    const connectionConfig = {
      host: `/cloudsql/${process.env.GOOGLE_CLOUD_PROJECT}:${process.env.CLOUD_SQL_REGION}:${process.env.CLOUD_SQL_INSTANCE}`,
      user: 'root',
      password: process.env.CLOUD_SQL_ROOT_PASSWORD,
      ssl: {
        ca: fs.readFileSync(path.join(__dirname, '../ssl-certs/server-ca.pem'))
      }
    };

    try {
      const connection = await mysql.createConnection(connectionConfig);
      
      // Create main database
      await connection.execute('CREATE DATABASE IF NOT EXISTS mindhub_mvp');
      await connection.execute('USE mindhub_mvp');
      
      // Read and execute schema files
      const schemaFiles = [
        '../backend/shared/database/schema/01-auth-schema.sql',
        '../backend/shared/database/schema/02-expedix-schema.sql',
        '../backend/shared/database/schema/03-clinimetrix-schema.sql',
        '../backend/shared/database/schema/04-formx-schema.sql',
        '../backend/shared/database/schema/05-resources-schema.sql',
        '../backend/shared/database/schema/06-audit-schema.sql'
      ];

      for (const schemaFile of schemaFiles) {
        const schemaPath = path.join(__dirname, schemaFile);
        if (fs.existsSync(schemaPath)) {
          const schema = fs.readFileSync(schemaPath, 'utf8');
          await connection.execute(schema);
          console.log(`✅ Executed schema: ${path.basename(schemaFile)}`);
        }
      }

      await connection.end();
      console.log('Database schema initialized successfully');
      
    } catch (error) {
      console.error('Error initializing database schema:', error);
      throw error;
    }
  }

  /**
   * Generate configuration files for application
   */
  async generateConfigurationFiles() {
    const connectionInfo = await this.sqlManager.getConnectionInfo();
    
    // Generate production environment file
    const prodEnvConfig = `# MindHub Production Environment Configuration
# Generated automatically by Cloud SQL setup script

# =============================================================================
# CLOUD SQL CONFIGURATION
# =============================================================================
DB_HOST=/cloudsql/${connectionInfo.connectionName}
DB_PORT=3306
DB_USER=mindhub_app
DB_PASS=\${CLOUD_SQL_PASSWORD}
DB_NAME=mindhub_mvp
DB_SSL=true
DB_CONNECTION_LIMIT=20

# Cloud SQL specific
CLOUD_SQL_CONNECTION_NAME=${connectionInfo.connectionName}
CLOUD_SQL_INSTANCE=${process.env.CLOUD_SQL_INSTANCE}

# =============================================================================
# SSL CERTIFICATE PATHS
# =============================================================================
DB_SSL_CA=/app/ssl-certs/server-ca.pem
DB_SSL_CERT=/app/ssl-certs/client-cert.pem
DB_SSL_KEY=/app/ssl-certs/client-key.pem

# =============================================================================
# BACKUP CONFIGURATION
# =============================================================================
BACKUP_VERIFICATION_ENABLED=true
BACKUP_RETENTION_DAYS=30
BACKUP_ENCRYPTION_ENABLED=true

# =============================================================================
# COMPLIANCE SETTINGS
# =============================================================================
COMPLIANCE_MODE=NOM-024-SSA3-2010
AUDIT_LOGGING_ENABLED=true
DATA_ENCRYPTION_REQUIRED=true
`;

    const configPath = path.join(__dirname, '../config/.env.production');
    fs.writeFileSync(configPath, prodEnvConfig);

    // Generate Docker configuration for Cloud Run
    const dockerConfig = `# Cloud SQL Proxy configuration for Docker
version: '3.8'
services:
  app:
    build: .
    environment:
      - DB_HOST=/cloudsql/${connectionInfo.connectionName}
      - INSTANCE_CONNECTION_NAME=${connectionInfo.connectionName}
    volumes:
      - ./ssl-certs:/app/ssl-certs:ro
    depends_on:
      - cloud-sql-proxy
      
  cloud-sql-proxy:
    image: gcr.io/cloudsql-docker/gce-proxy:1.35.0
    command: ["/cloud_sql_proxy", "-instances=${connectionInfo.connectionName}=tcp:0.0.0.0:3306"]
    volumes:
      - \${GOOGLE_APPLICATION_CREDENTIALS}:/config/credentials.json:ro
    environment:
      - GOOGLE_APPLICATION_CREDENTIALS=/config/credentials.json
`;

    const dockerPath = path.join(__dirname, '../docker-compose.cloudsql.yml');
    fs.writeFileSync(dockerPath, dockerConfig);

    console.log('Configuration files generated successfully');
  }

  /**
   * Generate setup completion report
   */
  async generateSetupReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'completed',
      instance: {
        id: process.env.CLOUD_SQL_INSTANCE,
        region: process.env.CLOUD_SQL_REGION,
        project: process.env.GOOGLE_CLOUD_PROJECT
      },
      features: {
        ssl_enabled: true,
        backup_enabled: true,
        high_availability: true,
        read_replica: true,
        encryption: true,
        compliance: 'NOM-024-SSA3-2010'
      },
      setup_steps: this.setupLog,
      next_steps: [
        'Update application configuration with generated environment variables',
        'Deploy application to Google App Engine or Cloud Run',
        'Verify backup verification Cloud Function',
        'Set up monitoring and alerting',
        'Conduct security audit and penetration testing'
      ]
    };

    const reportPath = path.join(__dirname, '../reports/cloud-sql-setup-report.json');
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
        'Verify project permissions and enabled APIs',
        'Check network connectivity and firewall rules',
        'Review Cloud SQL quotas and limits',
        'Validate environment variables and configuration'
      ]
    };

    const reportPath = path.join(__dirname, '../reports/cloud-sql-error-report.json');
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
  const setup = new CloudSQLSetup();
  setup.runCompleteSetup();
}

module.exports = CloudSQLSetup;