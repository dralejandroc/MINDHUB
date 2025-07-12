# MindHub Database Configuration

## Overview

MindHub uses PostgreSQL as the primary database with separate schemas for each healthcare hub:

- **auth**: User management and authentication
- **expedix**: Patient management and medical records
- **clinimetrix**: Clinical assessments and psychometric tests
- **formx**: Form builder and custom questionnaires
- **resources**: Psychoeducational materials library
- **audit**: Compliance logging and audit trails

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 2GB of available RAM
- Port 5432 available (or modify docker-compose.yml)

### Setup Database

```bash
# Start database services and initialize schema
./scripts/setup-database.sh

# Or run specific commands
./scripts/setup-database.sh setup    # Full setup
./scripts/setup-database.sh start    # Start services only
./scripts/setup-database.sh status   # Check status
./scripts/setup-database.sh reset    # Reset database (destroys data!)
./scripts/setup-database.sh stop     # Stop services
```

### Access Database

**Direct Connection:**
```bash
# Using Docker
docker exec -it mindhub-postgres psql -U mindhub -d mindhub_dev

# Using local psql client
psql -h localhost -p 5432 -U mindhub -d mindhub_dev
```

**pgAdmin Web Interface:**
```bash
# Start pgAdmin
docker-compose --profile tools up -d pgadmin

# Access at: http://localhost:5050
# Email: admin@mindhub.local
# Password: mindhub_pgadmin_password
```

## Database Schema

### Auth Schema - User Management

```sql
-- Core tables
auth.users                 -- User profiles linked to Auth0
auth.roles                 -- System roles (psychiatrist, psychologist, admin)
auth.permissions           -- Granular permissions system
auth.role_permissions      -- Role-permission associations
auth.user_roles           -- User-role assignments
auth.user_sessions        -- Session tracking
```

### Expedix Schema - Patient Management

```sql
-- Patient management
expedix.patients           -- Patient demographics and information
expedix.medical_history    -- Medical background and history
expedix.consultations      -- Clinical consultations and notes
expedix.medications        -- Medication catalog
expedix.prescriptions      -- Prescription management
expedix.prescription_fills -- Dispensing tracking
```

### Clinimetrix Schema - Clinical Assessments

```sql
-- Assessment system
clinimetrix.assessment_scales     -- Catalog of 50+ psychological tests
clinimetrix.scale_items          -- Individual test questions/items
clinimetrix.assessment_sessions  -- Assessment administration sessions
clinimetrix.scale_administrations -- Individual scale completions
clinimetrix.item_responses       -- Detailed response data
clinimetrix.assessment_tokens    -- Secure remote assessment links
clinimetrix.assessment_reports   -- Generated assessment reports
```

### Formx Schema - Form Builder

```sql
-- Form system
formx.form_templates        -- Reusable form definitions
formx.field_types          -- Available field types catalog
formx.form_instances       -- Deployed form instances
formx.form_submissions     -- Form response data
formx.field_responses      -- Individual field responses
formx.form_access_tokens   -- Secure form sharing
formx.form_analytics       -- Usage statistics
formx.import_jobs          -- PDF/external form imports
formx.export_jobs          -- Form export processing
```

### Resources Schema - Educational Materials

```sql
-- Resource library
resources.categories           -- Hierarchical categorization
resources.tags                -- Flexible tagging system
resources.resources           -- Educational materials catalog
resources.resource_categories -- Resource-category associations
resources.resource_tags       -- Resource-tag associations
resources.collections         -- Curated resource collections
resources.collection_resources -- Collection contents
resources.resource_distributions -- Sharing and distribution tracking
resources.resource_reviews    -- User reviews and ratings
resources.resource_analytics  -- Usage analytics
resources.resource_versions   -- Version control
```

### Audit Schema - Compliance & Logging

```sql
-- Compliance system
audit.audit_log            -- All data changes (NOM-024 compliance)
audit.data_access_log      -- Healthcare data access tracking
audit.system_events        -- System events and errors
```

## Sample Data

The database includes sample data for development:

### Users
- **Dr. María González** (Psychiatrist) - `doctor.psiquiatra@mindhub.cloud`
- **Dr. Carlos Rodríguez** (Psychologist) - `doctor.psicologo@mindhub.cloud`
- **Admin Sistema** (Administrator) - `admin@mindhub.cloud`

### Patients
- **Ana Isabel Martínez García** - Depression case
- **Juan Carlos López Hernández** - Anxiety case  
- **María Elena Torres Sánchez** - Bipolar case

### Assessment Scales
- **BDI-II** (Beck Depression Inventory)
- **BAI** (Beck Anxiety Inventory)
- **HDRS** (Hamilton Depression Rating Scale)

### Educational Resources
- Depression patient guide
- Anxiety breathing techniques video
- CBT automatic thoughts worksheet

## Environment Variables

Update your `.env.local` files with these database credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://mindhub:mindhub_dev_password@localhost:5432/mindhub_dev
DATABASE_SSL=false

# Redis Configuration  
REDIS_URL=redis://:mindhub_redis_password@localhost:6379
```

## Security Features

### Data Encryption
- Sensitive fields (PII, medical data) encrypted at rest
- Encryption functions: `encrypt_sensitive()`, `decrypt_sensitive()`
- Configurable encryption key via `app.encryption_key` setting

### Audit Logging
- All data changes automatically logged
- Healthcare data access tracking (NOM-024 compliance)
- User session and activity monitoring

### Access Control
- Role-based permissions system
- Healthcare professional licensing validation
- Patient consent tracking

## Compliance Features

### NOM-024-SSA3-2010 Compliance
- Complete audit trail for all medical data
- Data retention and expiry policies
- Access logging with purpose documentation
- Encryption at rest and in transit

### HIPAA-Ready Features
- Audit logs for all PHI access
- User authentication and authorization
- Data minimization and access controls

## Performance Optimizations

### Indexes
- Full-text search on patients, resources, forms
- Optimized queries for common access patterns
- Partitioning ready for large datasets

### Caching Strategy
- Redis for session storage
- Query result caching for read-heavy operations
- CDN-ready for static educational resources

## Backup and Recovery

### Automated Backups
```bash
# Database backup
docker exec mindhub-postgres pg_dump -U mindhub mindhub_dev > backup.sql

# Restore from backup
docker exec -i mindhub-postgres psql -U mindhub -d mindhub_dev < backup.sql
```

### Production Considerations
- Configure automated daily backups
- Set up point-in-time recovery
- Implement read replicas for scaling
- Monitor disk usage and performance

## Troubleshooting

### Common Issues

**Connection refused:**
```bash
# Check if container is running
docker ps | grep postgres

# Check logs
docker logs mindhub-postgres

# Restart services
./scripts/setup-database.sh start
```

**Permission denied:**
```bash
# Reset permissions
docker exec mindhub-postgres psql -U postgres -c "GRANT ALL ON DATABASE mindhub_dev TO mindhub;"
```

**Out of space:**
```bash
# Clean up Docker volumes
docker system prune -v

# Check disk usage
docker exec mindhub-postgres du -sh /var/lib/postgresql/data
```

### Performance Issues

**Slow queries:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 100;
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC;
```

**High CPU/Memory:**
```bash
# Monitor database activity
docker exec mindhub-postgres psql -U mindhub -d mindhub_dev -c "SELECT * FROM pg_stat_activity;"

# Check database size
docker exec mindhub-postgres psql -U mindhub -d mindhub_dev -c "SELECT pg_size_pretty(pg_database_size('mindhub_dev'));"
```

## Development Workflow

1. **Make schema changes** in `database/init/` files
2. **Reset database** with `./scripts/setup-database.sh reset`
3. **Test changes** with sample data
4. **Update migrations** for production deployment
5. **Document changes** in this README

## Production Deployment

For Google Cloud SQL deployment:

1. Create Cloud SQL instance with PostgreSQL
2. Configure SSL and encryption
3. Run migration scripts in order
4. Set up automated backups
5. Configure read replicas if needed
6. Monitor performance and security

## Support

For database-related issues:
- Check container logs: `docker logs mindhub-postgres`
- Review audit logs in `audit.system_events`
- Consult PostgreSQL documentation
- Contact system administrator