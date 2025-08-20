# Variables de Entorno para Vercel - Django Backend

## 🔧 **Variables Requeridas en Vercel Dashboard**

### **Django Configuration**
```env
SECRET_KEY=django-clinimetrix-pro-secret-key-change-in-production
DEBUG=False
ALLOWED_HOSTS=mindhub-django-backend.vercel.app,localhost,127.0.0.1
```

### **Database Configuration**
```env
DATABASE_URL=postgresql://postgres.jvbcpldzoyicefdtnwkd:Aa123456!@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### **Supabase Integration**
```env
SUPABASE_URL=https://jvbcpldzoyicefdtnwkd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDE0NzAsImV4cCI6MjA3MDk3NzQ3MH0.st42ODkomKcaTcT88Xqc3LT_Zo9oVWhkCVwCP07n4NY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ
```

### **Frontend Integration**
```env
REACT_FRONTEND_URL=https://mindhub.cloud
DJANGO_BASE_URL=https://mindhub-django-backend.vercel.app
```

### **Email Configuration**
```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### **Logging**
```env
LOG_LEVEL=INFO
```

## 🚀 **Pasos para Configurar en Vercel**

### 1. **Deploy Django Backend**
```bash
cd mindhub/backend-django
vercel --prod
```

### 2. **Configurar Variables en Vercel Dashboard**
- Ir a https://vercel.com/dashboard
- Seleccionar proyecto Django backend
- Settings → Environment Variables
- Agregar todas las variables listadas arriba

### 3. **Configurar Build Settings**
- Build Command: `python manage.py collectstatic --noinput`
- Output Directory: `./`
- Install Command: `pip install -r requirements.txt`

## ✅ **Verificación de Deploy**

### **URLs de Producción**
- Django Admin: `https://mindhub-django-backend.vercel.app/admin/`
- API Health: `https://mindhub-django-backend.vercel.app/api/assessments/`
- API Expedix: `https://mindhub-django-backend.vercel.app/api/expedix/`
- API Agenda: `https://mindhub-django-backend.vercel.app/api/agenda/`
- API Resources: `https://mindhub-django-backend.vercel.app/api/resources/`

### **Frontend Integration**
El frontend en `https://mindhub.cloud` debe usar estas URLs:
- Proxy routes: `/api/*/django/` → Django backend
- Direct calls: `NEXT_PUBLIC_DJANGO_API_URL` environment variable

## 🔐 **Notas de Seguridad**

- ✅ `SECRET_KEY` debe ser único en producción
- ✅ `DEBUG=False` en producción
- ✅ `ALLOWED_HOSTS` debe incluir solo dominios autorizados
- ✅ Supabase keys son válidas y están protegidas
- ✅ No commitear estas variables al repositorio