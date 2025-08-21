# MindHub Django Backend

## 🎯 Arquitectura Actual - Sistema Completo Migrado

Este es el **backend Django principal** de MindHub que maneja **TODOS los módulos** del sistema.

## 🏗️ Arquitectura Post-Migración Completa

```
MindHub/
├── frontend/              # React/Next.js frontend (Vercel)
├── backend-django/        # Django REST API - Backend PRINCIPAL
└── legacy-backend/        # Node.js backend (DEPRECATED - no usar)
```

## 📦 Módulos Django Implementados

### ✅ **Todos los Hubs Migrados a Django:**

1. **ClinimetrixPro** - Sistema híbrido de evaluaciones psicométricas
   - 29 escalas psicométricas migradas
   - Sistema de evaluación `focused_take.html`
   - Bridge React ↔ Django funcionando

2. **Expedix** - Gestión de pacientes y expedientes médicos
   - CRUD completo de pacientes
   - Sistema de expedientes digitales
   - Integración con ClinimetrixPro

3. **Agenda** - Sistema de citas y programación
   - Gestión de citas médicas
   - Programación de horarios
   - Notificaciones automáticas

4. **Resources** - Gestión de recursos médicos
   - Biblioteca de recursos
   - Sistema de categorías
   - Envío de documentos a pacientes

5. **FormX** - Generador de formularios (base implementada)
   - Django Forms dinámicos
   - Templates médicos preconfigurrados

## 🔗 URLs de Producción

- **Frontend**: https://mindhub.cloud (Vercel)
- **Django Backend**: https://mindhub-django-backend.vercel.app
- **API Proxy**: https://mindhub.cloud/api/*/django/
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth

## 🗃️ Base de Datos

- **Principal**: **Supabase PostgreSQL** (todo el proyecto)
- **Desarrollo**: Conectado a Supabase via DATABASE_URL
- **ORM**: Django ORM conectado a PostgreSQL
- **Auth**: Middleware Supabase JWT validation

## 🔐 Sistema de Autenticación

- **Proveedor**: Supabase Auth ÚNICAMENTE
- **Middleware**: `middleware/supabase_auth.py`
- **JWT Validation**: Tokens Supabase validados en Django
- **Integration**: Bridge seamless React ↔ Django

## 🚀 Endpoints API Principales

### Expedix (Pacientes)
- `GET /api/expedix/patients/` - Lista de pacientes
- `POST /api/expedix/patients/` - Crear paciente
- `GET /api/expedix/patients/{id}/` - Detalle paciente

### ClinimetrixPro (Evaluaciones)
- `GET /scales/api/catalog/` - Catálogo de escalas
- `POST /assessments/api/create-from-react/` - Bridge React → Django
- `GET /assessments/{id}/focused-take/` - Página de evaluación

### Agenda (Citas)
- `GET /api/agenda/appointments/` - Lista de citas
- `POST /api/agenda/appointments/` - Crear cita

### Resources (Recursos)
- `GET /api/resources/documents/` - Lista de recursos
- `POST /api/resources/documents/` - Subir recurso

## 🔧 Setup y Deploy

```bash
# Instalar dependencias
pip install -r requirements.txt

# Variables de entorno (ver VERCEL_ENV_VARIABLES.md)
export DATABASE_URL="postgresql://..."
export SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="..."

# Ejecutar migraciones
python manage.py migrate

# Migrar escalas ClinimetrixPro
python manage.py migrate_scales_json

# Servidor desarrollo
python manage.py runserver 8000
```

## 🎯 Estado Actual

**✅ SISTEMA COMPLETAMENTE MIGRADO Y FUNCIONAL**

- ✅ **5 módulos migrados**: Expedix, ClinimetrixPro, Agenda, Resources, FormX
- ✅ **Django REST API**: Endpoints unificados para todos los módulos  
- ✅ **Supabase Integration**: Auth y PostgreSQL conectados
- ✅ **Frontend Integration**: Proxy routes React → Django
- ✅ **Production Ready**: Deploy en Vercel configurado
- ✅ **Node.js deprecado**: Backend anterior movido a legacy-backend

---

**Migración completada**: 2025-08-21  
**Sistema origen**: Múltiples backends Node.js  
**Sistema actual**: Django REST Framework unificado