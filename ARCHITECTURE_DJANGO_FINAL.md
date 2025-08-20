# 🏗️ MindHub - Arquitectura Django Full-Stack Final

## 📊 **ESTADO ACTUAL - 20 AGOSTO 2025**

### ✅ **MIGRACIÓN COMPLETADA**
- **Backend Node.js**: ❌ Deprecado → Movido a `/legacy-backend/`
- **Backend Django**: ✅ Activo → Principal en `/mindhub/backend-django/`
- **Frontend React**: ✅ Activo → Mantenido en `/mindhub/frontend/`
- **Database**: ✅ Supabase PostgreSQL unificada
- **Auth**: ✅ Supabase Auth con Django middleware

---

## 🎯 **ARQUITECTURA FINAL**

```mermaid
graph TD
    A[Usuario] --> B[Frontend React/Next.js]
    B --> C[Supabase Auth]
    B --> D[API Proxy Routes]
    D --> E[Django REST API]
    E --> F[Supabase PostgreSQL]
    C --> G[JWT Token]
    G --> H[Django Auth Middleware]
    H --> E
```

### **Stack Completo**

| Componente | Tecnología | URL/Path | Estado |
|-----------|------------|----------|--------|
| **Frontend** | React/Next.js 14.2.30 | `https://mindhub.cloud` | ✅ Activo |
| **Backend** | Django 5.0.2 + DRF | `https://mindhub-django-backend.vercel.app` | ✅ Activo |
| **Database** | Supabase PostgreSQL | `jvbcpldzoyicefdtnwkd.supabase.co` | ✅ Activo |
| **Auth** | Supabase Auth | Integrado | ✅ Activo |
| **Deployment** | Vercel | Auto-deploy | ✅ Activo |

---

## 🔗 **ENDPOINTS Y APIs**

### **Frontend (React/Next.js)**
```
https://mindhub.cloud/
├── /hubs/expedix          # Gestión de pacientes
├── /hubs/clinimetrix      # Evaluaciones psicométricas  
├── /hubs/agenda          # Sistema de citas
├── /hubs/resources       # Recursos médicos
└── /hubs/formx           # Generador de formularios
```

### **API Proxy Routes (Next.js → Django)**
```
https://mindhub.cloud/api/
├── /expedix/django/      # Proxy → Django Expedix
├── /agenda/django/       # Proxy → Django Agenda
├── /resources/django/    # Proxy → Django Resources
└── /clinimetrix-pro/     # Direct ClinimetrixPro integration
```

### **Django REST API (Backend Principal)**
```
https://mindhub-django-backend.vercel.app/api/
├── /expedix/            # Pacientes, consultas, historiales
├── /agenda/             # Citas, horarios, disponibilidad
├── /resources/          # Recursos, categorías, plantillas
├── /assessments/        # ClinimetrixPro evaluaciones
└── /scales/            # Escalas psicométricas
```

---

## 🗃️ **MODELOS DE DATOS DJANGO**

### **Expedix Models**
```python
- User (Custom user model)
- Patient (Información del paciente)
- Consultation (Consultas médicas)
- MedicalHistory (Historia clínica)
```

### **Agenda Models**
```python
- Appointment (Citas médicas)
- ProviderSchedule (Horarios de profesionales)
- ScheduleBlock (Bloqueos de agenda)
- WaitingList (Lista de espera)
- AppointmentHistory (Historial de cambios)
```

### **Resources Models**
```python
- Resource (Recursos médicos)
- ResourceCategory (Categorías)
- ResourceCollection (Colecciones)
- ResourceSend (Envíos a pacientes)
- WatermarkTemplate (Plantillas de marca de agua)
```

### **ClinimetrixPro Models (Existentes)**
```python
- Scale (Escalas psicométricas - 29 migradas)
- Assessment (Evaluaciones)
- ScoreInterpretation (Interpretaciones)
- Patient Integration (Vía Expedix)
```

---

## 🔐 **SISTEMA DE AUTENTICACIÓN**

### **Flujo de Autenticación**
1. **Usuario** → Login en Supabase Auth
2. **Supabase** → Genera JWT token
3. **Frontend** → Almacena token + user session
4. **API Calls** → Include `Authorization: Bearer {token}`
5. **Django Middleware** → Valida JWT con Supabase
6. **Django Views** → Acceso autorizado a recursos

### **Configuración Django Auth**
```python
# settings.py
MIDDLEWARE = [
    'middleware.supabase_auth.SupabaseAuthMiddleware',  # JWT validation
]

# Rutas protegidas
PROTECTED_PATHS = [
    '/api/expedix/',
    '/api/agenda/', 
    '/api/resources/',
    '/assessments/api/create-from-react/',
]
```

---

## 📦 **DEPLOYMENT Y VARIABLES DE ENTORNO**

### **Frontend Vercel Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=https://jvbcpldzoyicefdtnwkd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_DJANGO_API_URL=https://mindhub-django-backend.vercel.app
```

### **Django Vercel Variables**
```env
SECRET_KEY=django-clinimetrix-pro-secret-key-change-in-production
DEBUG=False
ALLOWED_HOSTS=mindhub-django-backend.vercel.app,localhost,127.0.0.1
DATABASE_URL=postgresql://postgres.jvbcpldzoyicefdtnwkd:Aa123456!@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://jvbcpldzoyicefdtnwkd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_FRONTEND_URL=https://mindhub.cloud
```

---

## 🚀 **COMANDOS DE DEPLOY**

### **Deploy Frontend**
```bash
cd mindhub/frontend
vercel --prod
```

### **Deploy Django Backend**
```bash
cd mindhub/backend-django  
vercel --prod
```

### **Development Local**
```bash
# Django Backend
cd mindhub/backend-django
python manage.py runserver 8000

# Frontend
cd mindhub/frontend  
npm run dev  # Runs on port 3002
```

---

## ✅ **VERIFICACIÓN DE FUNCIONAMIENTO**

### **URLs de Testing**
- **Frontend**: https://mindhub.cloud/health
- **Django Health**: https://mindhub-django-backend.vercel.app/admin/
- **API Test**: https://mindhub.cloud/api/agenda/django (requires auth)
- **Supabase**: Dashboard de proyecto activo

### **Tests de Integración**
```bash
# Test Django endpoints
curl https://mindhub-django-backend.vercel.app/api/expedix/

# Test frontend proxy
curl https://mindhub.cloud/api/expedix/django/

# Test with auth token
curl -H "Authorization: Bearer {token}" https://mindhub.cloud/api/agenda/django/
```

---

## 📋 **ROADMAP TÉCNICO**

### **Completado ✅**
- [x] Migración completa Node.js → Django
- [x] Todos los módulos en Django REST Framework
- [x] Autenticación Supabase integrada
- [x] API proxy routes configuradas
- [x] Deploy configuration ready
- [x] CORS y middleware configurados

### **Próximos Pasos Opcionales 📋**
- [ ] Optimización de performance (cache, indexing)
- [ ] Testing automatizado end-to-end
- [ ] Monitoring y logging en producción
- [ ] Backup y disaster recovery
- [ ] Scaling y load balancing

---

**🎉 ARQUITECTURA DJANGO FULL-STACK COMPLETAMENTE IMPLEMENTADA Y FUNCIONAL**