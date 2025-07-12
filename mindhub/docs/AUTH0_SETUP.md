# Auth0 Configuration Guide for MindHub

## Overview
This guide provides step-by-step instructions to configure Auth0 for the MindHub platform with Single Sign-On (SSO) across all four Hubs: Clinimetrix, Expedix, Formx, and Resources.

## Prerequisites
- Auth0 account (free tier is sufficient for development)
- Domain name for production deployment
- Access to Google Cloud Console

## Auth0 Tenant Setup

### Step 1: Create Auth0 Tenant
1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Click "Create Tenant"
3. Choose tenant name: `mindhub-healthcare` (or your preferred name)
4. Select region closest to your users
5. Choose "Development" for initial setup

### Step 2: Configure Tenant Settings
1. Go to **Settings** → **General**
2. Set **Friendly Name**: "MindHub Healthcare Platform"
3. Set **Logo URL**: Your company logo URL
4. Set **Support Email**: Your support email address
5. Set **Support URL**: Your support website URL

## Application Configuration

### Step 3: Create Main Application
1. Go to **Applications** → **Create Application**
2. Name: "MindHub Main Application"
3. Type: "Single Page Application"
4. Technology: "React"

#### Application Settings:
```
Name: MindHub Main Application
Type: Single Page Application
Token Endpoint Authentication Method: None

Allowed Callback URLs:
- http://localhost:3000/callback (development)
- https://your-domain.com/callback (production)

Allowed Logout URLs:
- http://localhost:3000 (development)
- https://your-domain.com (production)

Allowed Web Origins:
- http://localhost:3000 (development)
- https://your-domain.com (production)

Allowed Origins (CORS):
- http://localhost:3000 (development)
- https://your-domain.com (production)
```

### Step 4: Create API Resource
1. Go to **APIs** → **Create API**
2. Name: "MindHub API"
3. Identifier: "https://api.mindhub.com"
4. Signing Algorithm: "RS256"

#### API Settings:
```
Name: MindHub API
Identifier: https://api.mindhub.com
Signing Algorithm: RS256
Allow Skipping User Consent: Yes
Token Expiration: 86400 seconds (24 hours)
Token Expiration For Browser Flows: 7200 seconds (2 hours)
```

### Step 5: Configure Scopes
Add the following scopes to your API:
- `read:profile` - Read user profile information
- `read:patients` - Read patient data (Expedix)
- `write:patients` - Write patient data (Expedix)
- `read:assessments` - Read clinical assessments (Clinimetrix)
- `write:assessments` - Write clinical assessments (Clinimetrix)
- `read:forms` - Read forms (Formx)
- `write:forms` - Write forms (Formx)
- `read:resources` - Read resources (Resources)
- `write:resources` - Write resources (Resources)
- `admin:manage` - Administrative access

## User Management

### Step 6: Create User Roles
1. Go to **User Management** → **Roles**
2. Create the following roles:

#### Psychiatrist Role
```
Name: Psychiatrist
Description: Licensed psychiatrist with full clinical access
Permissions:
- read:profile
- read:patients
- write:patients
- read:assessments
- write:assessments
- read:forms
- write:forms
- read:resources
```

#### Psychologist Role
```
Name: Psychologist
Description: Licensed psychologist with clinical access
Permissions:
- read:profile
- read:patients
- write:patients
- read:assessments
- write:assessments
- read:forms
- write:forms
- read:resources
```

#### Clinic Administrator Role
```
Name: Clinic Administrator
Description: Clinic administrator with management access
Permissions:
- read:profile
- read:patients
- read:assessments
- read:forms
- read:resources
- write:resources
- admin:manage
```

### Step 7: Configure User Registration
1. Go to **Authentication** → **Database**
2. Create connection named "Username-Password-Authentication"
3. Configure password policy:
   - Minimum length: 8 characters
   - Require uppercase letters
   - Require lowercase letters
   - Require numbers
   - Require special characters

#### Custom Database Scripts (if needed):
```javascript
// Login Script
function login(email, password, callback) {
  // Custom logic for user authentication
  // This is optional if using Auth0's built-in database
}

// Get User Script
function getByEmail(email, callback) {
  // Custom logic to retrieve user by email
  // This is optional if using Auth0's built-in database
}
```

## Security Configuration

### Step 8: Configure Security Settings
1. Go to **Security** → **Attack Protection**
2. Enable **Brute Force Protection**
3. Enable **Suspicious IP Throttling**
4. Set **Breached Password Detection** to "Block"

### Step 9: Set Up Multi-Factor Authentication
1. Go to **Security** → **Multi-factor Auth**
2. Enable **SMS**, **Voice**, and **Email** factors
3. Configure **Guardian** (Auth0's MFA app)
4. Set MFA policy to "Always" for administrative users

### Step 10: Configure Rules (Legacy) or Actions (New)
Create the following Action for custom claims:

```javascript
/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://mindhub.com/';
  
  // Add custom claims to the token
  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}roles`, event.authorization.roles);
    api.idToken.setCustomClaim(`${namespace}permissions`, event.authorization.permissions);
    api.idToken.setCustomClaim(`${namespace}user_metadata`, event.user.user_metadata);
  }
  
  // Add healthcare-specific claims
  if (event.user.user_metadata) {
    api.idToken.setCustomClaim(`${namespace}license_number`, event.user.user_metadata.license_number);
    api.idToken.setCustomClaim(`${namespace}specialty`, event.user.user_metadata.specialty);
    api.idToken.setCustomClaim(`${namespace}clinic_id`, event.user.user_metadata.clinic_id);
  }
};
```

## Environment Configuration

### Step 11: Environment Variables
Add these environment variables to your `.env` file:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://api.mindhub.com
AUTH0_SCOPE=openid profile email read:profile
AUTH0_CALLBACK_URL=http://localhost:3000/callback
AUTH0_LOGOUT_URL=http://localhost:3000
AUTH0_SESSION_COOKIE_SECRET=your-long-random-string
AUTH0_SESSION_COOKIE_LIFETIME=604800
```

## Testing Configuration

### Step 12: Create Test Users
1. Go to **User Management** → **Users**
2. Create test users for each role:

#### Test Psychiatrist
```
Email: test.psychiatrist@mindhub.com
Password: TempPassword123!
Role: Psychiatrist
User Metadata:
{
  "license_number": "PSY-12345",
  "specialty": "Adult Psychiatry",
  "clinic_id": "clinic-001"
}
```

#### Test Psychologist
```
Email: test.psychologist@mindhub.com
Password: TempPassword123!
Role: Psychologist
User Metadata:
{
  "license_number": "PSC-67890",
  "specialty": "Clinical Psychology",
  "clinic_id": "clinic-001"
}
```

### Step 13: Test Authentication Flow
1. Start your application
2. Navigate to login page
3. Test login with created users
4. Verify JWT tokens contain correct claims
5. Test logout functionality

## Production Configuration

### Step 14: Production Settings
For production deployment:

1. **Update URLs** in Auth0 application settings
2. **Enable Custom Domain** (optional but recommended)
3. **Configure Rate Limiting** for production load
4. **Set up Monitoring** and alerts
5. **Configure Log Streaming** to external services

### Step 15: Security Hardening
1. Enable **Advanced Attack Protection**
2. Configure **IP Allow/Block Lists**
3. Set up **Anomaly Detection**
4. Enable **Detailed Logging**
5. Configure **SAML/SSO** for enterprise customers

## Monitoring and Maintenance

### Step 16: Set Up Monitoring
1. Go to **Monitoring** → **Logs**
2. Configure log retention policies
3. Set up log streaming to external services
4. Configure alerts for failed logins

### Step 17: Regular Maintenance
- Review user access monthly
- Update security rules quarterly
- Monitor authentication logs weekly
- Test disaster recovery procedures

## Troubleshooting

### Common Issues:
1. **Invalid Callback URL**: Ensure URLs match exactly
2. **CORS Errors**: Check Allowed Origins settings
3. **Token Expiration**: Verify token lifetime settings
4. **Permission Errors**: Check user roles and API scopes

### Support Resources:
- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 Community](https://community.auth0.com)
- [Auth0 Support](https://support.auth0.com)

## Healthcare Compliance Notes

### HIPAA Compliance:
- Auth0 provides HIPAA-compliant infrastructure
- Sign Business Associate Agreement (BAA) with Auth0
- Enable audit logging for all authentication events
- Configure data retention policies per regulations

### NOM-024 Compliance:
- Ensure user authentication meets Mexican healthcare standards
- Configure appropriate session timeouts
- Implement proper access controls for patient data
- Maintain audit trails for all user actions