# MindHub - Healthcare Platform

> Comprehensive SaaS platform for mental health professionals with clinical assessments, patient management, form builder, and psychoeducational resources.

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Docker** and Docker Compose
- **Git**

### 1. Database Setup

#### Opción A: Docker + PostgreSQL (Recomendado para desarrollo)

```bash
# Start PostgreSQL and Redis
./scripts/setup-database.sh

# Or manually with Docker Compose
docker-compose up -d postgres redis

# Access pgAdmin (optional)
docker-compose --profile tools up -d pgadmin
# Visit: http://localhost:5050
```

#### Opción B: XAMPP + MySQL (Alternativa fácil)

```bash
# 1. Inicia XAMPP (Apache + MySQL)
# 2. Configura automáticamente:
npm run xampp:init

# O paso a paso:
npm run xampp:setup      # Configurar XAMPP
npm run db:generate      # Generar cliente Prisma  
npm run db:push          # Aplicar schema
npm run db:seed          # Poblar datos
```

📖 **Ver guía completa**: [XAMPP_SETUP.md](docs/XAMPP_SETUP.md)

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Update .env.local with your Auth0 credentials:
# AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
# AUTH0_CLIENT_ID=your-client-id
# AUTH0_CLIENT_SECRET=your-client-secret
# AUTH0_SECRET=$(openssl rand -hex 32)

# Start development server
npm run dev
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Update .env with database and Auth0 configuration

# Start backend server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **pgAdmin**: http://localhost:5050 (if enabled)
- **Database**: localhost:5432

## 🏥 Platform Overview

### Four Healthcare Hubs

#### 🔬 Clinimetrix
- **Clinical Assessment System**
- 50+ standardized psychological scales
- Remote and in-person administration
- Automated scoring and reporting
- Progress tracking over time

#### 👥 Expedix  
- **Patient Management System**
- Digital clinical records
- Prescription management with QR codes
- Consultation history tracking
- Patient categorization system

#### 📝 Formx
- **Form Builder System**
- Drag-and-drop form constructor
- PDF and JotForm import
- Custom field types
- Automated distribution

#### 📚 Resources
- **Psychoeducational Library**
- Categorized resource library
- Secure digital distribution
- Version control system
- Usage tracking and analytics

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Hub APIs
- `GET /api/clinimetrix` - Clinical Assessment Hub
- `GET /api/expedix` - Patient Management Hub  
- `GET /api/formx` - Form Builder Hub
- `GET /api/resources` - Resources Library Hub

## Development

### Project Structure
```
mindhub/
├── frontend/          # React/Next.js frontend
├── backend/           # Node.js backend services
├── config/            # Configuration files
├── docs/              # Documentation
├── app.yaml          # Google App Engine config
├── server.js         # Main server file
└── package.json      # Dependencies
```

### Authentication Flow
1. User accesses any Hub
2. Redirected to Auth0 login
3. Auth0 validates credentials
4. JWT token issued for API access
5. SSO enabled across all Hubs

### Security Features
- Rate limiting (100 requests/15min)
- Helmet.js security headers
- CORS protection
- Input validation
- Audit logging
- Data encryption at rest and in transit

## Deployment

### Google App Engine
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production  
npm run deploy
```

### Environment Variables
Ensure all required environment variables are set in Google Cloud Console for production deployment.

## Compliance

### NOM-024-SSA3-2010
- Patient data encryption
- Audit trail logging
- Access control implementation
- Data retention policies
- Backup and recovery procedures

## Support
For technical support and documentation, contact the MindHub development team.

## License
This project is licensed under the MIT License - see the LICENSE file for details.