# MindHub Subdomain Architecture

## Domain Structure for mindhub.cloud

### Production Subdomains

```
Main Platform:
└── app.mindhub.cloud              # Main dashboard & authentication

Healthcare Hubs:
├── clinimetrix.mindhub.cloud      # Clinical Assessment System
├── expedix.mindhub.cloud          # Patient Management System  
├── formx.mindhub.cloud            # Form Builder System
└── resources.mindhub.cloud        # Psychoeducational Library

API Services:
├── api.mindhub.cloud              # Main API Gateway
├── clinimetrix.api.mindhub.cloud  # Clinimetrix API
├── expedix.api.mindhub.cloud      # Expedix API
├── formx.api.mindhub.cloud        # Formx API
└── resources.api.mindhub.cloud    # Resources API

Authentication:
├── auth.mindhub.cloud             # Auth0 Custom Domain (optional)
└── accounts.mindhub.cloud         # User Account Management

Admin & Support:
├── admin.mindhub.cloud            # Admin Dashboard
├── docs.mindhub.cloud             # Documentation
└── status.mindhub.cloud           # Status Page
```

### Development Structure

```
Local Development:
├── localhost:3000                 # Main App
├── localhost:3001                 # Clinimetrix  
├── localhost:3002                 # Expedix
├── localhost:3003                 # Formx
├── localhost:3004                 # Resources
├── localhost:8080                 # Main API
├── localhost:8081                 # Clinimetrix API
├── localhost:8082                 # Expedix API
├── localhost:8083                 # Formx API
└── localhost:8084                 # Resources API
```

## Benefits of This Architecture

### 🏥 Healthcare Compliance
- **Data Isolation**: Each hub handles specific healthcare data types
- **Audit Trails**: Clear separation for NOM-024 compliance
- **Access Control**: Granular permissions per subdomain

### 🔐 Security
- **Cookie Isolation**: Prevents cross-hub session leakage
- **CSP per Hub**: Tailored Content Security Policies
- **Rate Limiting**: Independent protection per service

### ⚡ Performance & Scalability
- **CDN Optimization**: Different caching strategies per hub
- **Load Balancing**: Independent scaling based on usage
- **Geographic Distribution**: Hub-specific edge servers

### 👨‍⚕️ User Experience
- **Intuitive URLs**: `expedix.mindhub.cloud` clearly indicates function
- **Bookmarking**: Healthcare professionals can bookmark specific tools
- **Branding**: Each hub can have distinct visual identity

## DNS Configuration

### Required DNS Records

```dns
# Main Platform
app.mindhub.cloud.       CNAME   app-mindhub.appspot.com.
*.mindhub.cloud.         CNAME   mindhub-wildcard.appspot.com.

# API Services  
api.mindhub.cloud.       CNAME   api-mindhub.appspot.com.
*.api.mindhub.cloud.     CNAME   api-mindhub-wildcard.appspot.com.

# Auth0 Custom Domain (optional)
auth.mindhub.cloud.      CNAME   custom-domain.auth0.com.

# Root domain
mindhub.cloud.           A       216.239.32.21
mindhub.cloud.           A       216.239.34.21
mindhub.cloud.           A       216.239.36.21
mindhub.cloud.           A       216.239.38.21
```

### SSL/TLS Configuration

```yaml
# App Engine SSL Certificates
ssl_certificates:
  - name: mindhub-wildcard-ssl
    domains:
      - "*.mindhub.cloud"
      - "mindhub.cloud"
  - name: mindhub-api-ssl  
    domains:
      - "*.api.mindhub.cloud"
      - "api.mindhub.cloud"
```

## Google Cloud Configuration

### App Engine Services

```yaml
# app.yaml for main app
service: app
env: standard
runtime: nodejs18

automatic_scaling:
  min_instances: 1
  max_instances: 10

handlers:
  - url: /.*
    script: auto

# Separate services for each hub
---
service: clinimetrix
runtime: nodejs18
# ... configuration
```

### Load Balancer Configuration

```yaml
# Global Load Balancer for subdomains
backend_services:
  - name: app-backend
    backends:
      - group: app-instance-group
  - name: clinimetrix-backend  
    backends:
      - group: clinimetrix-instance-group
  # ... other backends

url_maps:
  - name: mindhub-url-map
    host_rules:
      - hosts: ["app.mindhub.cloud"]
        path_matcher: app-paths
      - hosts: ["clinimetrix.mindhub.cloud"]
        path_matcher: clinimetrix-paths
      # ... other rules
```

## Auth0 Configuration

### Application URLs

```javascript
// Auth0 Application Settings
const auth0Config = {
  domain: 'mindhub.auth0.com',
  clientId: 'your-client-id',
  audience: 'https://api.mindhub.cloud',
  
  // Callback URLs
  redirectUri: [
    'https://app.mindhub.cloud/api/auth/callback',
    'https://clinimetrix.mindhub.cloud/api/auth/callback',
    'https://expedix.mindhub.cloud/api/auth/callback',
    'https://formx.mindhub.cloud/api/auth/callback',
    'https://resources.mindhub.cloud/api/auth/callback'
  ],
  
  // Logout URLs
  logoutUrls: [
    'https://app.mindhub.cloud',
    'https://clinimetrix.mindhub.cloud',
    'https://expedix.mindhub.cloud', 
    'https://formx.mindhub.cloud',
    'https://resources.mindhub.cloud'
  ]
};
```

## Implementation Phases

### Phase 1: Development Setup
- ✅ Configure localhost development
- ✅ Set up Auth0 with localhost URLs
- ✅ Create basic subdomain structure

### Phase 2: Staging Environment  
- [ ] Deploy to App Engine with staging subdomains
- [ ] Test subdomain routing
- [ ] Validate Auth0 integration

### Phase 3: Production Deployment
- [ ] Configure DNS records
- [ ] Set up SSL certificates
- [ ] Deploy all services
- [ ] Configure Auth0 custom domain

### Phase 4: Optimization
- [ ] Set up CDN
- [ ] Configure monitoring
- [ ] Implement health checks
- [ ] Performance optimization

## Security Considerations

### Cross-Origin Resource Sharing (CORS)

```javascript
// CORS configuration for API
const corsConfig = {
  origin: [
    'https://app.mindhub.cloud',
    'https://clinimetrix.mindhub.cloud',
    'https://expedix.mindhub.cloud',
    'https://formx.mindhub.cloud', 
    'https://resources.mindhub.cloud'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### Content Security Policy

```javascript
// CSP per subdomain
const cspConfig = {
  'app.mindhub.cloud': {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.auth0.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    connectSrc: ["'self'", "https://api.mindhub.cloud", "https://mindhub.auth0.com"]
  },
  'clinimetrix.mindhub.cloud': {
    // Clinimetrix-specific CSP
  }
  // ... other subdomains
};
```

This architecture provides a solid foundation for MindHub's growth while maintaining healthcare compliance and security standards.