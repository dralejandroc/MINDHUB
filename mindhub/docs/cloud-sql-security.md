# Cloud SQL Security Configuration for MindHub

## Overview

This document outlines the comprehensive security configuration for MindHub's Cloud SQL instance, ensuring compliance with NOM-024-SSA3-2010 healthcare regulations and industry best practices.

## Security Features Implemented

### 1. Network Security

#### Private IP Configuration
- **Private IP Only**: Instance uses private IP addresses only (no public IP)
- **VPC Network**: Dedicated VPC network `mindhub-vpc` for isolation
- **Authorized Networks**: Restricted to specific IP ranges
  - Healthcare office networks: `192.168.1.0/24`
  - Google App Engine instances (production-restricted)

#### SSL/TLS Encryption
- **Mandatory SSL**: All connections require SSL certificates
- **Certificate Types**:
  - Server CA certificate for server validation
  - Client certificates for application authentication
- **Storage**: Certificates stored securely (Secret Manager in production)

### 2. Access Control

#### Database Users
- **mindhub_app**: Primary application user with limited permissions
- **mindhub_readonly**: Read-only user for reporting and analytics
- **mindhub_backup**: Dedicated user for backup operations
- **Root Access**: Restricted and logged

#### IAM Integration
- Service accounts for application authentication
- Role-based permissions aligned with healthcare professional roles
- Least privilege principle enforcement

### 3. Data Protection

#### Encryption
- **At Rest**: Customer-Managed Encryption Keys (CMEK) via Cloud KMS
- **In Transit**: TLS 1.2+ for all connections
- **Application Level**: Additional encryption for PII fields

#### Backup Security
- **Automated Backups**: Daily backups with 30-day retention
- **Point-in-Time Recovery**: 7-day transaction log retention
- **Encrypted Backups**: All backups encrypted with CMEK
- **Cross-Region**: Backups replicated to different region

### 4. High Availability

#### Regional Configuration
- **Primary Region**: us-central1
- **Secondary Region**: us-west1 (disaster recovery)
- **Availability Type**: Regional with automatic failover

#### Read Replica
- **Purpose**: Disaster recovery and read scaling
- **Configuration**: Asynchronous replication
- **Security**: Same security settings as primary instance

### 5. Monitoring and Auditing

#### Database Flags
- **Slow Query Log**: Enabled for performance monitoring
- **General Log**: Disabled (performance), enabled for debugging only
- **Query Logging**: Enabled for queries not using indexes

#### Compliance Logging
- **Connection Logs**: All connection attempts logged
- **Query Audit**: Sensitive operations logged
- **Access Logs**: User access patterns tracked

## Configuration Details

### Instance Specifications

```yaml
Instance Type: db-custom-2-7680 (2 vCPU, 7.5 GB RAM)
Storage: 100 GB SSD with auto-resize (max 1TB)
Version: MySQL 8.0
Availability: Regional (High Availability)
Deletion Protection: Enabled
```

### Security Flags

```sql
-- Performance and Security Flags
slow_query_log = ON
long_query_time = 2
log_queries_not_using_indexes = ON
general_log = OFF
innodb_buffer_pool_size = 75%
max_connections = 100
wait_timeout = 28800
sql_mode = STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
```

### Backup Configuration

```yaml
Backup Schedule: Daily at 2:00 AM UTC
Point-in-Time Recovery: Enabled (7 days)
Backup Retention: 30 backups
Binary Logs: Enabled
Cross-Region Backup: us-west1
Backup Verification: Automated daily testing
```

## NOM-024-SSA3-2010 Compliance

### Data Classification
- **Nivel I**: Public information (no encryption required)
- **Nivel II**: Internal data (encryption recommended)
- **Nivel III**: Confidential patient data (encryption required)
- **Nivel IV**: Restricted clinical data (highest encryption + access controls)

### Retention Policies
- **Patient Records**: 5 years minimum (as per regulation)
- **Audit Logs**: 7 years for compliance
- **Backup Data**: 30 days operational, 1 year archived

### Access Controls
- **Professional Licensing**: Validated through Auth0 integration
- **Role-Based Access**: Aligned with healthcare hierarchy
- **Session Management**: Maximum 8-hour sessions
- **Failed Login Protection**: Account lockout after 5 attempts

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)
- **Database Failure**: < 2 minutes (automatic failover)
- **Regional Outage**: < 15 minutes (manual failover to replica)
- **Complete Disaster**: < 4 hours (full restoration from backup)

### Recovery Point Objectives (RPO)
- **Transaction Loss**: < 10 seconds (synchronous replication)
- **Backup Recovery**: < 1 hour (point-in-time recovery)

### Failover Procedures
1. **Automatic Failover**: Regional configuration handles zone failures
2. **Manual Failover**: Promote read replica in different region
3. **Backup Restoration**: Restore from encrypted backup with verification

## Security Monitoring

### Alerts Configuration
- **Failed Login Attempts**: > 5 failures per user per hour
- **Unusual Access Patterns**: Outside business hours or locations
- **Schema Changes**: All DDL operations
- **Performance Issues**: Slow queries > 5 seconds
- **Backup Failures**: Any backup operation failure

### Incident Response
1. **Detection**: Automated monitoring triggers alert
2. **Assessment**: Security team evaluates threat level
3. **Response**: Implement containment measures
4. **Recovery**: Restore normal operations
5. **Review**: Post-incident analysis and improvements

## Maintenance and Updates

### Maintenance Windows
- **Schedule**: Sundays at 3:00 AM UTC
- **Duration**: Maximum 2 hours
- **Notifications**: 72-hour advance notice
- **Rollback Plan**: Available for all updates

### Update Track
- **Stable Track**: Production instances
- **Preview Track**: Development/testing only
- **Security Patches**: Applied within 48 hours

## Troubleshooting

### Common Issues

#### SSL Connection Problems
```bash
# Verify SSL certificates
openssl x509 -in server-ca.pem -text -noout
openssl x509 -in client-cert.pem -text -noout

# Test SSL connection
mysql --ssl-ca=server-ca.pem --ssl-cert=client-cert.pem --ssl-key=client-key.pem -h [HOST] -u [USER] -p
```

#### Network Connectivity
```bash
# Check VPC peering
gcloud compute networks peerings list --network=mindhub-vpc

# Verify authorized networks
gcloud sql instances describe mindhub-production --format="value(settings.ipConfiguration.authorizedNetworks[].value)"
```

#### Backup Verification
```bash
# List recent backups
gcloud sql backups list --instance=mindhub-production

# Describe backup details
gcloud sql backups describe [BACKUP_ID] --instance=mindhub-production
```

## Security Checklist

### Pre-Production
- [ ] SSL certificates generated and validated
- [ ] Authorized networks configured
- [ ] Database users created with minimal privileges
- [ ] Backup schedule configured and tested
- [ ] Read replica created and synchronized
- [ ] Monitoring and alerting configured
- [ ] Disaster recovery procedures documented and tested

### Post-Production
- [ ] Regular security assessments (quarterly)
- [ ] Backup restoration testing (monthly)
- [ ] Access control reviews (monthly)
- [ ] Performance monitoring analysis (weekly)
- [ ] Security patch reviews (weekly)
- [ ] Incident response plan updates (annually)

## Contact Information

### Security Team
- **Primary Contact**: security@mindhub.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX
- **Escalation**: CTO and CISO

### Support Team
- **Database Team**: dba@mindhub.com
- **Infrastructure**: infra@mindhub.com
- **Development**: dev@mindhub.com

---

*Document Version: 1.0*  
*Last Updated: 2025-07-12*  
*Next Review: 2025-10-12*  
*Classification: Internal - Healthcare Compliance*