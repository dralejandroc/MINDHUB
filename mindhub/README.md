# MindHub - Healthcare Management Platform

> Complete healthcare management platform with patient records, clinical assessments, appointment scheduling, and medical resources. Built with React/Next.js frontend and Django REST API backend.

## 🚀 Current Architecture - Post Django Migration

### System Overview

```
┌─ Frontend React/Next.js ──── Vercel (https://mindhub.cloud)
├─ API Proxy Routes ────────── Next.js (/api/*/django/)
├─ Django Backend ──────────── Django REST API (/backend-django/)
├─ Auth Middleware ─────────── Supabase JWT validation
├─ Database ────────────────── Supabase PostgreSQL 
└─ Authentication ──────────── Supabase Auth
```

### Production URLs

- **Frontend**: https://mindhub.cloud (Vercel)
- **Django Backend**: https://mindhub-django-backend.vercel.app
- **API Proxy**: https://mindhub.cloud/api/*/django/ (Next.js → Django)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth

## 🏥 Healthcare Modules

### ✅ All Modules Migrated to Django

#### 🩺 Expedix - Patient Management System
- Complete patient records (CRUD)
- Digital medical files
- Prescription management with QR codes
- Medical consultation history
- Patient portal access

#### 🧠 ClinimetrixPro - Clinical Assessment System
- **29 psychometric scales** available
- Hybrid React + Django architecture
- Automated scoring and interpretation
- `focused_take.html` evaluation system
- Clinical progress tracking

#### 📅 Agenda - Appointment Scheduling
- Medical appointment management
- Provider schedule management
- Automatic notifications
- Waiting list system
- Appointment confirmation workflows

#### 📚 Resources - Medical Resources Library
- Medical resource library
- Category management system
- Document templates
- Watermarking system
- Patient resource distribution

#### 📋 FormX - Dynamic Form Builder
- Custom medical forms creation
- Pre-configured medical templates
- Patient registration forms
- Advanced validation with Django Forms

## 🔧 Quick Start

### Prerequisites

- **Python 3.11+** and pip
- **Node.js 18+** and npm
- **Git**

### 1. Django Backend Setup

```bash
cd mindhub/backend-django

# Install dependencies
pip install -r requirements.txt

# Environment variables (see VERCEL_ENV_VARIABLES.md)
export DATABASE_URL="postgresql://..."
export SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="..."

# Run migrations
python manage.py migrate

# Migrate ClinimetrixPro scales
python manage.py migrate_scales_json

# Start Django server
python manage.py runserver 8000
```

### 2. Frontend Setup

```bash
cd mindhub/frontend

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Update .env.local with Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Start frontend server
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3002
- **Django Backend**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/api/schema/swagger-ui/

## 🏗️ Project Structure

```
MindHub-Pro/
├── mindhub/
│   ├── frontend/              # Next.js 14.2.30 + React 18 + TypeScript
│   └── backend-django/        # Django REST API - Principal Backend
└── legacy-backend/            # Node.js backend (DEPRECATED - no usar)
```

## 🔐 Authentication System

### Supabase Auth (Single Provider)

- **Provider**: Supabase Auth (https://supabase.com)
- **Frontend**: `@supabase/auth-helpers-nextjs`
- **Backend**: Django middleware for JWT validation
- **Features**:
  - Automatic login/logout
  - JWT tokens for APIs
  - User and session management
  - Row Level Security (RLS)
  - Native Next.js integration

### Auth URLs

- **Sign In**: https://mindhub.cloud/auth/sign-in
- **Sign Up**: https://mindhub.cloud/auth/sign-up
- **Dashboard**: https://mindhub.cloud/dashboard (post-login)

## 📊 API Endpoints by Module

### Expedix (Patient Management)
- `GET /api/expedix/patients/` - Patient list
- `POST /api/expedix/patients/` - Create patient
- `GET /api/expedix/patients/{id}/` - Patient details

### ClinimetrixPro (Clinical Assessments)
- `GET /scales/api/catalog/` - Scale catalog
- `POST /assessments/api/create-from-react/` - React → Django bridge
- `GET /assessments/{id}/focused-take/` - Evaluation page

### Agenda (Appointments)
- `GET /api/agenda/appointments/` - Appointment list
- `POST /api/agenda/appointments/` - Create appointment

### Resources (Medical Resources)
- `GET /api/resources/documents/` - Resource list
- `POST /api/resources/documents/` - Upload resource

### FormX (Dynamic Forms)
- `GET /formx/api/templates/` - Form templates
- `POST /formx/api/forms/` - Create form

## 🗃️ Database System

### Supabase PostgreSQL (Primary)

- **Provider**: Supabase PostgreSQL
- **Connection**: Django ORM via DATABASE_URL
- **Features**:
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Built-in authentication
  - Automatic backups

## 🚀 ClinimetrixPro Hybrid System

### Architecture Overview

```
React Frontend (Scale Selector)
    ↓ (Bridge API)
Django Backend (Assessment Engine)
    ↓ (Results Return)
React Frontend (Results & Integration)
```

### Available Scales (29)

- **Depression**: BDI-13, GDS-5/15/30, HDRS-17, MADRS, PHQ-9, RADS-2
- **Anxiety**: GADI, HARS, STAI
- **Autism/ASD**: AQ-Adolescent, AQ-Child
- **Eating Disorders**: EAT-26
- **Cognition**: MOCA
- **OCD**: DY-BOCS, Y-BOCS
- **Psychosis**: PANSS
- **Sleep**: MOS Sleep Scale
- **Tics**: YGTSS
- **Personality**: IPDE-CIE10, IPDE-DSMIV
- **Trauma**: DTS
- **Suicidality**: SSS-V

## 🔄 Development Workflow

### Environment Setup

1. **Backend Development**:
   ```bash
   cd mindhub/backend-django
   python start_server.py  # Complete setup + server start
   ```

2. **Frontend Development**:
   ```bash
   cd mindhub/frontend
   npm run dev  # Start Next.js development server
   ```

3. **Integration Testing**:
   ```bash
   cd mindhub/backend-django
   python test_backend_integration.py  # Test all modules
   ```

## 🌐 Deployment

### Production Architecture

- **Frontend**: Vercel auto-deploy from `main` branch
- **Backend**: Django deployed to Vercel
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **CDN**: Vercel Edge Network

### Environment Configuration

See `backend-django/VERCEL_ENV_VARIABLES.md` for complete environment setup.

## 📋 Migration Status

### ✅ Completed Migrations

- **Backend**: Node.js → Django REST Framework
- **Database**: MAMP/SQLite → Supabase PostgreSQL
- **Auth**: Auth0 → Supabase Auth
- **All Modules**: Expedix, ClinimetrixPro, Agenda, Resources, FormX
- **Deployment**: Google App Engine → Vercel

### 🗂️ Legacy Systems

- **legacy-backend/**: Previous Node.js backend (deprecated)
- **XAMPP/MAMP**: Previous local database setup (deprecated)

## 🎯 Current Status

**✅ PRODUCTION READY - ALL MODULES MIGRATED**

- ✅ **5 modules migrated**: Expedix, ClinimetrixPro, Agenda, Resources, FormX
- ✅ **Django REST API**: Unified endpoints for all modules
- ✅ **Supabase Integration**: Auth and PostgreSQL connected
- ✅ **Frontend Integration**: Proxy routes React → Django
- ✅ **Production Deploy**: Vercel deployment configured
- ✅ **29 clinical scales**: ClinimetrixPro fully functional

---

**Migration completed**: 2025-08-21  
**Current version**: Django REST Framework unified backend  
**Production**: https://mindhub.cloud