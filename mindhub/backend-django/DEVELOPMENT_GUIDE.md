# MindHub Development Guide

## 🚨 IMPORTANTE: Diferencia entre Desarrollo y Producción

### 🌍 **PRODUCCIÓN (LO QUE EL USUARIO VE)**
- **Frontend React**: https://mindhub.cloud
- **Django Backend API**: https://mindhub-django-backend.vercel.app
- **Base de Datos**: Supabase PostgreSQL (producción)

### 💻 **DESARROLLO LOCAL (PARA DEVELOPMENT)**
- **Frontend React**: `npm run dev` en `/frontend/` → `http://localhost:3000`
- **Django Backend API**: `python3 manage.py runserver 8000` → `http://localhost:8000`
- **Base de Datos**: Supabase PostgreSQL (misma BD de producción)

## ⚠️ **REGLAS CRÍTICAS**

### **1. Django Backend = SOLO API**
- ❌ **NUNCA** servir páginas HTML desde Django
- ✅ **SOLO** endpoints JSON API
- ✅ `http://localhost:8000/` muestra información de API, NO páginas web

### **2. Frontend React = SOLO en mindhub.cloud (producción) o localhost:3000 (dev)**
- ✅ **TODO el frontend** está en React/Next.js
- ✅ **EXCEPCIÓN**: Solo `focused_take.html` y FormX tienen frontend Django

### **3. URLs Correctas por Ambiente**

#### **Desarrollo Local:**
```bash
# Django API (backend)
http://localhost:8000/                     # Info de API
http://localhost:8000/api/expedix/         # Expedix API
http://localhost:8000/api/clinics/         # Clinics API
http://localhost:8000/assessments/        # ClinimetrixPro API

# React Frontend
http://localhost:3000/                     # Homepage React
http://localhost:3000/hubs/expedix        # Expedix React UI
http://localhost:3000/clinic/team         # Clinic Management UI
```

#### **Producción:**
```bash
# Django API (backend)
https://mindhub-django-backend.vercel.app/
https://mindhub-django-backend.vercel.app/api/expedix/

# React Frontend (acceso de usuarios)
https://mindhub.cloud/                     # Homepage
https://mindhub.cloud/hubs/expedix        # Expedix UI
https://mindhub.cloud/clinic/team         # Clinic Management
```

## 🔧 **Testing Workflow Correcto**

### **Para probar cambios:**
1. **Backend**: Modificar código Django → Verificar en `http://localhost:8000/api/*`
2. **Frontend**: Modificar código React → Verificar en `http://localhost:3000/`
3. **Producción**: Deploy automático → Verificar en `https://mindhub.cloud/`

### **Para debugging:**
- **Backend logs**: Server Django local
- **Frontend logs**: Browser console + Vercel logs
- **Producción logs**: Vercel dashboard

## 📝 **Recordatorios**

- 🚫 **NO** revisar `http://localhost:8000/` esperando ver el frontend
- 🚫 **NO** agregar rutas HTML a Django (excepto focused_take y FormX)
- ✅ **SÍ** usar `https://mindhub.cloud/` para probar UX/UI
- ✅ **SÍ** usar `http://localhost:8000/api/*` para probar APIs