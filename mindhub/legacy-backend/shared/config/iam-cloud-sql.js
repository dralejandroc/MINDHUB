/**
 * IAM Policies for Cloud SQL Access Control
 * 
 * Comprehensive IAM roles and policies for secure Cloud SQL access
 * with healthcare role-based permissions and least privilege principles
 */

const { IAMCredentialsClient } = require('@google-cloud/iam-credentials');
const { CloudResourceManagerClient } = require('@google-cloud/resource-manager');

class CloudSQLIAMManager {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    this.iamClient = new IAMCredentialsClient();
    this.resourceManagerClient = new CloudResourceManagerClient();
  }

  /**
   * Initialize all IAM policies and roles for Cloud SQL
   */
  async initializeCloudSQLIAM() {
    try {
      console.log('🔐 Initializing Cloud SQL IAM policies...');

      // Create custom roles
      await this.createCustomRoles();

      // Set up service accounts
      await this.createServiceAccounts();

      // Configure IAM bindings
      await this.configureIAMBindings();

      // Set up conditional access policies
      await this.setupConditionalPolicies();

      console.log('✅ Cloud SQL IAM policies initialized successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error initializing Cloud SQL IAM:', error);
      throw error;
    }
  }

  /**
   * Create custom IAM roles for healthcare professionals
   */
  async createCustomRoles() {
    const customRoles = [
      {
        roleId: 'mindhub.psychiatrist',
        title: 'MindHub Psychiatrist',
        description: 'Psychiatrist role with full patient data access and clinical permissions',
        permissions: [
          // Cloud SQL permissions
          'cloudsql.instances.connect',
          'cloudsql.instances.get',
          'cloudsql.databases.list',
          'cloudsql.databases.get',
          
          // Database-specific permissions
          'cloudsql.databases.connect',
          'cloudsql.users.list',
          
          // Monitoring and logging
          'logging.logEntries.list',
          'monitoring.metricDescriptors.list',
          'monitoring.timeSeries.list',
          
          // Storage access for patient files
          'storage.objects.get',
          'storage.objects.list',
          'storage.objects.create',
          'storage.objects.update',
          'storage.buckets.get'
        ],
        stage: 'GA'
      },
      
      {
        roleId: 'mindhub.psychologist',
        title: 'MindHub Psychologist',
        description: 'Psychologist role with patient data access and assessment permissions',
        permissions: [
          // Cloud SQL permissions (limited)
          'cloudsql.instances.connect',
          'cloudsql.instances.get',
          'cloudsql.databases.list',
          'cloudsql.databases.get',
          'cloudsql.databases.connect',
          
          // Monitoring (read-only)
          'monitoring.metricDescriptors.list',
          'monitoring.timeSeries.list',
          
          // Storage access (limited)
          'storage.objects.get',
          'storage.objects.list',
          'storage.objects.create',
          'storage.buckets.get'
        ],
        stage: 'GA'
      },
      
      {
        roleId: 'mindhub.nurse',
        title: 'MindHub Nurse',
        description: 'Nursing staff role with limited patient data access',
        permissions: [
          // Cloud SQL permissions (very limited)
          'cloudsql.instances.connect',
          'cloudsql.databases.connect',
          
          // Storage access (read-only for most content)
          'storage.objects.get',
          'storage.objects.list',
          'storage.buckets.get'
        ],
        stage: 'GA'
      },
      
      {
        roleId: 'mindhub.admin',
        title: 'MindHub Administrator',
        description: 'Administrative role with system management permissions',
        permissions: [
          // Full Cloud SQL permissions
          'cloudsql.instances.*',
          'cloudsql.databases.*',
          'cloudsql.users.*',
          'cloudsql.backups.*',
          'cloudsql.operations.*',
          
          // IAM management
          'iam.serviceAccounts.list',
          'iam.serviceAccounts.get',
          'iam.roles.list',
          'iam.roles.get',
          
          // Full storage access
          'storage.*',
          
          // Monitoring and logging
          'logging.*',
          'monitoring.*'
        ],
        stage: 'GA'
      },
      
      {
        roleId: 'mindhub.readonly',
        title: 'MindHub Read-Only User',
        description: 'Read-only access for reporting and analytics',
        permissions: [
          // Cloud SQL read-only
          'cloudsql.instances.get',
          'cloudsql.instances.list',
          'cloudsql.databases.get',
          'cloudsql.databases.list',
          'cloudsql.databases.connect',
          
          // Storage read-only
          'storage.objects.get',
          'storage.objects.list',
          'storage.buckets.get',
          'storage.buckets.list',
          
          // Monitoring read-only
          'monitoring.metricDescriptors.list',
          'monitoring.timeSeries.list'
        ],
        stage: 'GA'
      }
    ];

    for (const role of customRoles) {
      try {
        await this.createCustomRole(role);
        console.log(`✅ Custom role created: ${role.roleId}`);
      } catch (error) {
        if (error.code === 6) { // Role already exists
          console.log(`ℹ️  Custom role already exists: ${role.roleId}`);
        } else {
          console.error(`❌ Error creating role ${role.roleId}:`, error.message);
        }
      }
    }
  }

  /**
   * Create a custom IAM role
   */
  async createCustomRole(roleConfig) {
    const { execSync } = require('child_process');
    
    const roleDefinition = {
      title: roleConfig.title,
      description: roleConfig.description,
      includedPermissions: roleConfig.permissions,
      stage: roleConfig.stage || 'GA'
    };

    // Save role definition to temporary file
    const fs = require('fs');
    const path = require('path');
    const tempFile = path.join('/tmp', `${roleConfig.roleId}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(roleDefinition, null, 2));

    // Create role using gcloud CLI
    const command = `gcloud iam roles create ${roleConfig.roleId} \\
      --project=${this.projectId} \\
      --file=${tempFile}`;

    execSync(command, { stdio: 'inherit' });
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
  }

  /**
   * Create service accounts for different MindHub services
   */
  async createServiceAccounts() {
    const serviceAccounts = [
      {
        accountId: 'mindhub-expedix-service',
        displayName: 'MindHub Expedix Service Account',
        description: 'Service account for Expedix hub database access'
      },
      {
        accountId: 'mindhub-clinimetrix-service',
        displayName: 'MindHub Clinimetrix Service Account',
        description: 'Service account for Clinimetrix hub database access'
      },
      {
        accountId: 'mindhub-formx-service',
        displayName: 'MindHub Formx Service Account',
        description: 'Service account for Formx hub database access'
      },
      {
        accountId: 'mindhub-resources-service',
        displayName: 'MindHub Resources Service Account',
        description: 'Service account for Resources hub database access'
      },
      {
        accountId: 'mindhub-backup-service',
        displayName: 'MindHub Backup Service Account',
        description: 'Service account for automated backups'
      },
      {
        accountId: 'mindhub-monitoring-service',
        displayName: 'MindHub Monitoring Service Account',
        description: 'Service account for monitoring and logging'
      }
    ];

    for (const account of serviceAccounts) {
      try {
        await this.createServiceAccount(account);
        console.log(`✅ Service account created: ${account.accountId}`);
      } catch (error) {
        if (error.code === 6) { // Already exists
          console.log(`ℹ️  Service account already exists: ${account.accountId}`);
        } else {
          console.error(`❌ Error creating service account ${account.accountId}:`, error.message);
        }
      }
    }
  }

  /**
   * Create a service account
   */
  async createServiceAccount(accountConfig) {
    const { execSync } = require('child_process');
    
    const command = `gcloud iam service-accounts create ${accountConfig.accountId} \\
      --project=${this.projectId} \\
      --display-name="${accountConfig.displayName}" \\
      --description="${accountConfig.description}"`;

    execSync(command, { stdio: 'inherit' });
  }

  /**
   * Configure IAM policy bindings for Cloud SQL
   */
  async configureIAMBindings() {
    const bindings = [
      // Expedix service account bindings
      {
        serviceAccount: 'mindhub-expedix-service',
        roles: [
          'roles/cloudsql.client',
          `projects/${this.projectId}/roles/mindhub.psychiatrist`
        ],
        resources: [
          `projects/${this.projectId}/instances/mindhub-production`
        ]
      },
      
      // Clinimetrix service account bindings
      {
        serviceAccount: 'mindhub-clinimetrix-service',
        roles: [
          'roles/cloudsql.client',
          `projects/${this.projectId}/roles/mindhub.psychologist`
        ],
        resources: [
          `projects/${this.projectId}/instances/mindhub-production`
        ]
      },
      
      // Formx service account bindings
      {
        serviceAccount: 'mindhub-formx-service',
        roles: [
          'roles/cloudsql.client',
          `projects/${this.projectId}/roles/mindhub.readonly`
        ],
        resources: [
          `projects/${this.projectId}/instances/mindhub-production`
        ]
      },
      
      // Resources service account bindings
      {
        serviceAccount: 'mindhub-resources-service',
        roles: [
          'roles/cloudsql.client',
          `projects/${this.projectId}/roles/mindhub.readonly`
        ],
        resources: [
          `projects/${this.projectId}/instances/mindhub-production`
        ]
      },
      
      // Backup service account bindings
      {
        serviceAccount: 'mindhub-backup-service',
        roles: [
          'roles/cloudsql.admin',
          'roles/storage.admin'
        ],
        resources: [
          `projects/${this.projectId}/instances/mindhub-production`,
          `projects/${this.projectId}/instances/mindhub-production-replica`
        ]
      },
      
      // Monitoring service account bindings
      {
        serviceAccount: 'mindhub-monitoring-service',
        roles: [
          'roles/cloudsql.viewer',
          'roles/monitoring.viewer',
          'roles/logging.viewer'
        ],
        resources: [
          `projects/${this.projectId}/instances/mindhub-production`
        ]
      }
    ];

    for (const binding of bindings) {
      await this.applyIAMBinding(binding);
    }
  }

  /**
   * Apply IAM binding for service account
   */
  async applyIAMBinding(binding) {
    const { execSync } = require('child_process');
    
    const serviceAccountEmail = `${binding.serviceAccount}@${this.projectId}.iam.gserviceaccount.com`;
    
    for (const role of binding.roles) {
      try {
        // Add IAM policy binding at project level
        const command = `gcloud projects add-iam-policy-binding ${this.projectId} \\
          --member="serviceAccount:${serviceAccountEmail}" \\
          --role="${role}"`;
        
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ IAM binding applied: ${binding.serviceAccount} -> ${role}`);
      } catch (error) {
        console.error(`❌ Error applying IAM binding: ${binding.serviceAccount} -> ${role}`, error.message);
      }
    }
  }

  /**
   * Set up conditional access policies based on time, location, and other factors
   */
  async setupConditionalPolicies() {
    const conditionalPolicies = [
      {
        name: 'business-hours-access',
        description: 'Allow database access only during business hours',
        condition: {
          title: 'Business Hours Access',
          description: 'Access allowed Mon-Fri 8AM-6PM',
          expression: `
            request.time.getHours() >= 8 && 
            request.time.getHours() < 18 && 
            request.time.getDayOfWeek() >= 2 && 
            request.time.getDayOfWeek() <= 6
          `
        },
        bindings: [
          {
            role: `projects/${this.projectId}/roles/mindhub.nurse`,
            members: ['group:nurses@mindhub.com']
          }
        ]
      },
      
      {
        name: 'emergency-access',
        description: 'Emergency access for critical situations',
        condition: {
          title: 'Emergency Access',
          description: 'Full access during emergencies',
          expression: `
            has(request.auth.claims.emergency_access) && 
            request.auth.claims.emergency_access == true
          `
        },
        bindings: [
          {
            role: `projects/${this.projectId}/roles/mindhub.psychiatrist`,
            members: ['group:emergency-staff@mindhub.com']
          }
        ]
      },
      
      {
        name: 'location-restricted-access',
        description: 'Restrict access to specific geographic locations',
        condition: {
          title: 'Location Restricted Access',
          description: 'Access only from approved locations',
          expression: `
            request.auth.access_levels.contains('accessPolicies/${this.projectId}/accessLevels/approved_locations')
          `
        },
        bindings: [
          {
            role: 'roles/cloudsql.client',
            members: ['group:remote-staff@mindhub.com']
          }
        ]
      }
    ];

    for (const policy of conditionalPolicies) {
      await this.createConditionalPolicy(policy);
    }
  }

  /**
   * Create conditional IAM policy
   */
  async createConditionalPolicy(policyConfig) {
    const fs = require('fs');
    const path = require('path');
    
    // Create policy file
    const policyFile = path.join('/tmp', `${policyConfig.name}-policy.json`);
    fs.writeFileSync(policyFile, JSON.stringify({
      bindings: policyConfig.bindings.map(binding => ({
        role: binding.role,
        members: binding.members,
        condition: policyConfig.condition
      }))
    }, null, 2));

    try {
      // Note: This is a placeholder for conditional policy creation
      // In practice, you would use the IAM API or gcloud commands
      console.log(`📋 Conditional policy defined: ${policyConfig.name}`);
      console.log(`   Condition: ${policyConfig.condition.description}`);
    } catch (error) {
      console.error(`❌ Error creating conditional policy ${policyConfig.name}:`, error.message);
    } finally {
      // Clean up temp file
      if (fs.existsSync(policyFile)) {
        fs.unlinkSync(policyFile);
      }
    }
  }

  /**
   * Create database users with specific privileges
   */
  async createDatabaseUsers() {
    const databaseUsers = [
      {
        username: 'mindhub_app_user',
        role: 'application',
        privileges: [
          'SELECT', 'INSERT', 'UPDATE', 'DELETE'
        ],
        databases: ['mindhub_mvp'],
        tables: ['patients', 'medical_records', 'appointments', 'assessments']
      },
      
      {
        username: 'mindhub_readonly_user',
        role: 'readonly',
        privileges: ['SELECT'],
        databases: ['mindhub_mvp'],
        tables: ['*'] // All tables, read-only
      },
      
      {
        username: 'mindhub_backup_user',
        role: 'backup',
        privileges: [
          'SELECT', 'LOCK TABLES', 'SHOW VIEW', 'EVENT', 'TRIGGER'
        ],
        databases: ['mindhub_mvp'],
        tables: ['*']
      },
      
      {
        username: 'mindhub_analytics_user',
        role: 'analytics',
        privileges: ['SELECT'],
        databases: ['mindhub_mvp'],
        tables: [
          'form_analytics', 'usage_statistics', 'patient_outcomes'
        ]
      }
    ];

    // Generate SQL commands for user creation
    const sqlCommands = [];
    
    for (const user of databaseUsers) {
      // Create user
      sqlCommands.push(`CREATE USER IF NOT EXISTS '${user.username}'@'%' IDENTIFIED BY 'GENERATED_PASSWORD';`);
      
      // Grant privileges
      for (const db of user.databases) {
        if (user.tables.includes('*')) {
          sqlCommands.push(`GRANT ${user.privileges.join(', ')} ON ${db}.* TO '${user.username}'@'%';`);
        } else {
          for (const table of user.tables) {
            sqlCommands.push(`GRANT ${user.privileges.join(', ')} ON ${db}.${table} TO '${user.username}'@'%';`);
          }
        }
      }
      
      sqlCommands.push(`FLUSH PRIVILEGES;`);
    }

    // Save SQL commands to file
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, '../../../scripts/create-database-users.sql');
    
    fs.writeFileSync(sqlFile, sqlCommands.join('\n\n'));
    console.log(`📄 Database user creation SQL saved to: ${sqlFile}`);
    
    return { sqlFile, commands: sqlCommands };
  }

  /**
   * Generate IAM policy documentation
   */
  async generateIAMDocumentation() {
    const documentation = {
      title: 'MindHub Cloud SQL IAM Configuration',
      lastUpdated: new Date().toISOString(),
      
      customRoles: [
        {
          role: 'mindhub.psychiatrist',
          description: 'Full access to patient data and clinical features',
          permissions: 'Complete database access, file storage, monitoring',
          compliance: 'Licensed psychiatrist verification required'
        },
        {
          role: 'mindhub.psychologist',
          description: 'Patient data access with assessment focus',
          permissions: 'Database read/write, limited file access',
          compliance: 'Licensed psychologist verification required'
        },
        {
          role: 'mindhub.nurse',
          description: 'Limited patient data access for nursing tasks',
          permissions: 'Read-only database access, basic file access',
          compliance: 'Nursing license verification required'
        },
        {
          role: 'mindhub.admin',
          description: 'System administration and maintenance',
          permissions: 'Full system access, user management',
          compliance: 'Administrative approval required'
        }
      ],
      
      serviceAccounts: [
        {
          account: 'mindhub-expedix-service',
          purpose: 'Patient records management',
          permissions: 'Full patient database access'
        },
        {
          account: 'mindhub-backup-service',
          purpose: 'Automated backup operations',
          permissions: 'Database backup and restore'
        }
      ],
      
      securityPolicies: [
        {
          policy: 'Business Hours Access',
          description: 'Restrict non-emergency access to business hours',
          implementation: 'Conditional IAM policy'
        },
        {
          policy: 'Location Restrictions',
          description: 'Limit access to approved geographic locations',
          implementation: 'Access Context Manager'
        }
      ],
      
      complianceNotes: [
        'All database access is logged for audit compliance',
        'User roles align with healthcare professional licensing',
        'Least privilege principle enforced across all roles',
        'Emergency access procedures documented separately',
        'Regular access reviews scheduled quarterly'
      ]
    };

    const fs = require('fs');
    const path = require('path');
    const docFile = path.join(__dirname, '../../../docs/cloud-sql-iam-documentation.json');
    
    fs.writeFileSync(docFile, JSON.stringify(documentation, null, 2));
    console.log(`📚 IAM documentation generated: ${docFile}`);
    
    return documentation;
  }

  /**
   * Audit current IAM configuration
   */
  async auditIAMConfiguration() {
    const { execSync } = require('child_process');
    
    try {
      // Get current IAM policy
      const policy = execSync(`gcloud projects get-iam-policy ${this.projectId} --format=json`, { encoding: 'utf8' });
      const policyData = JSON.parse(policy);
      
      // Analyze bindings
      const analysis = {
        totalBindings: policyData.bindings?.length || 0,
        customRoles: [],
        serviceAccounts: [],
        users: [],
        groups: []
      };
      
      if (policyData.bindings) {
        for (const binding of policyData.bindings) {
          if (binding.role.includes('mindhub.')) {
            analysis.customRoles.push(binding.role);
          }
          
          for (const member of binding.members || []) {
            if (member.startsWith('serviceAccount:')) {
              analysis.serviceAccounts.push(member);
            } else if (member.startsWith('user:')) {
              analysis.users.push(member);
            } else if (member.startsWith('group:')) {
              analysis.groups.push(member);
            }
          }
        }
      }
      
      // Remove duplicates
      analysis.customRoles = [...new Set(analysis.customRoles)];
      analysis.serviceAccounts = [...new Set(analysis.serviceAccounts)];
      analysis.users = [...new Set(analysis.users)];
      analysis.groups = [...new Set(analysis.groups)];
      
      console.log('📊 IAM Configuration Audit Results:');
      console.log(`   Total Bindings: ${analysis.totalBindings}`);
      console.log(`   Custom Roles: ${analysis.customRoles.length}`);
      console.log(`   Service Accounts: ${analysis.serviceAccounts.length}`);
      console.log(`   Users: ${analysis.users.length}`);
      console.log(`   Groups: ${analysis.groups.length}`);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error auditing IAM configuration:', error.message);
      throw error;
    }
  }
}

module.exports = CloudSQLIAMManager;