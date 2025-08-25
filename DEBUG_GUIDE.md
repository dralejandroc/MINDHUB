# 🔍 **MINDHUB - GUÍA COMPLETA DE DEBUGGING**
## Configuración avanzada para VS Code Debug

**Fecha:** 24 Agosto 2025  
**Estado:** ✅ **CONFIGURACIÓN COMPLETA DE DEBUGGING**

---

## 🚀 **CÓMO USAR EL DEBUGGER**

### **1. DEBUGGING BÁSICO - CONFIGURACIONES INDIVIDUALES**

#### **🚀 Next.js Frontend Debug**
- **Configuración**: `🚀 MindHub - Full Stack Debug`
- **Puerto**: localhost:3002
- **Uso**: Debuggear componentes React, API routes, hooks
- **Breakpoints**: Funciona en archivos `.tsx`, `.ts`, `.js`

#### **🐍 Django Backend Debug**
- **Configuración**: `🐍 Django Backend Debug`
- **Puerto**: localhost:8000
- **Uso**: Debuggear views, models, serializers Django
- **Breakpoints**: Funciona en archivos `.py`

#### **🌐 Chrome Browser Debug**
- **Configuración**: `🌐 Chrome - MindHub Local`
- **URL**: http://localhost:3002
- **Uso**: Debuggear JavaScript en el navegador con DevTools integrado

### **2. DEBUGGING AVANZADO - CONFIGURACIONES COMPUESTAS**

#### **🚀🐍 Full Stack Debug (RECOMENDADO)**
- **Configuración**: `🚀🐍 Full Stack - Next.js + Django`
- **Qué hace**: Inicia Next.js + Django simultáneamente
- **Uso**: Debugging completo frontend ↔ backend
- **Ideal para**: Depurar integración Expedix ↔ ClinimetrixPro

#### **🌐🚀🐍 Complete Debug (TODO INTEGRADO)**
- **Configuración**: `🌐🚀🐍 Complete Debug - Frontend + Backend + Browser`
- **Qué hace**: Next.js + Django + Chrome browser
- **Uso**: Debugging completo de la aplicación
- **Ideal para**: Debugging de flujos completos de usuario

### **3. DEBUGGING MODULAR - POR HUB**

#### **🧩 Expedix Module Debug**
- **URL**: http://localhost:3002/hubs/expedix
- **Uso**: Debugging específico de gestión de pacientes
- **Breakpoints**: PatientManagement, ExpedientsGrid, etc.

#### **🧠 ClinimetrixPro Module Debug**
- **URL**: http://localhost:3002/hubs/clinimetrix-pro
- **Uso**: Debugging de escalas psicométricas
- **Breakpoints**: ClinimetrixScaleSelector, UnifiedClient

#### **📋 Resources Module Debug**
- **URL**: http://localhost:3002/hubs/resources
- **Uso**: Debugging de gestión de recursos médicos

---

## 🎯 **FLUJO DE DEBUGGING RECOMENDADO**

### **PASO 1: Configurar Breakpoints**
```typescript
// En components/expedix/PatientDashboard.tsx
const handlePatientSelect = (patient: Patient) => {
  debugger; // ← Breakpoint automático
  console.log('Patient selected:', patient);
  // Tu código aquí
};
```

### **PASO 2: Iniciar Debug Session**
1. **Abrir VS Code** en `/Users/alekscon/MINDHUB-Pro`
2. **Ir a Run and Debug** (Ctrl/Cmd + Shift + D)
3. **Seleccionar configuración**:
   - Para debugging completo: `🌐🚀🐍 Complete Debug`
   - Para backend solo: `🐍 Django Backend Debug`
   - Para frontend solo: `🚀 MindHub - Full Stack Debug`
4. **Presionar F5** o click en "▶️ Start Debugging"

### **PASO 3: Verificar Debugging Activo**
- ✅ **Frontend**: http://localhost:3002 accessible
- ✅ **Backend**: http://localhost:8000 accessible  
- ✅ **Chrome**: DevTools abierto con source maps
- ✅ **Consola**: Logs en VS Code Debug Console

---

## 🔧 **HERRAMIENTAS DE DEBUGGING**

### **CONFIGURACIONES ESPECIALIZADAS**

#### **🧪 Next.js API Routes Debug**
- **Uso**: Debugging específico de `/app/api/*` routes
- **Ideal para**: Debuggear proxy routes a Django
- **Ejemplo**: `/api/expedix/patients/route.ts`

#### **🔧 Django Shell Debug**
- **Uso**: Interactive Django shell con debugging
- **Comando equivalente**: `python3 manage.py shell`
- **Ideal para**: Testing modelos, queries, etc.

#### **🗄️ Django Database Debug**
- **Uso**: Acceso directo a Supabase PostgreSQL
- **Comando equivalente**: `python3 manage.py dbshell`
- **Ideal para**: Debugging queries SQL

---

## 📋 **TASKS DISPONIBLES**

Accesible desde **Terminal → Run Task** (Ctrl/Cmd + Shift + P → Tasks: Run Task):

- **🚀 Start Next.js Dev Server**: Solo frontend
- **🐍 Start Django Dev Server**: Solo backend
- **🚀🐍 Start Full Stack**: Ambos servidores
- **🧪 Run Frontend Tests**: Tests de React/Next.js
- **🐍 Run Django Tests**: Tests de Django
- **🔧 Django Make Migrations**: Crear migraciones
- **🗄️ Django Migrate**: Aplicar migraciones
- **🧹 Clean Build Cache**: Limpiar caché de Next.js

---

## 🚨 **DEBUGGING DE PROBLEMAS ESPECÍFICOS**

### **ERROR: Endpoint 404/401 (Como el que arreglamos)**

#### **Debugging Setup:**
1. **Configuración**: `🧪 Next.js API Routes Debug`
2. **Breakpoint**: En `/app/api/expedix/patients/[id]/route.ts` línea 15
3. **Reproducir error**: GET request al endpoint
4. **Observar**: Variables de auth, request headers, database queries

#### **Variables clave a observar:**
```javascript
// En breakpoint, evaluar en Debug Console:
user.id                    // ← Usuario autenticado
patientId                  // ← ID del paciente
authError                  // ← Errores de autenticación
djangoResponse.status      // ← Response del backend Django
```

### **ERROR: Django 500 (Schema mismatch como resolvimos)**

#### **Debugging Setup:**
1. **Configuración**: `🐍 Django Backend Debug` 
2. **Breakpoint**: En `expedix/views.py` línea 45
3. **Variables a observar**:
```python
# En breakpoint, evaluar en Debug Console:
queryset                   # ← Django QuerySet
request.user.id           # ← Usuario autenticado
filtered_patients         # ← Pacientes filtrados
```

### **ERROR: Integración Expedix ↔ ClinimetrixPro**

#### **Debugging Setup:**
1. **Configuración**: `🌐🚀🐍 Complete Debug`
2. **Breakpoints múltiples**:
   - `ClinimetrixScaleSelector.tsx` línea 60
   - `unified-clinimetrix-client.ts` línea 65
   - `django-clinimetrix-client.ts` línea 85

#### **Flujo de debugging:**
1. **Usuario click en "Evaluación"** → Breakpoint en ClinimetrixScaleSelector
2. **Selection de escala** → Breakpoint en unified-clinimetrix-client  
3. **Bridge a Django** → Breakpoint en django-clinimetrix-client
4. **Response handling** → Observar en Network tab

---

## 📊 **DEBUG CONSOLE COMMANDS**

### **Durante debugging session, puedes ejecutar:**

```javascript
// Frontend debugging
patient.id                           // Ver ID de paciente
$0                                   // Elemento DOM seleccionado
window.location                      // URL actual
fetch('/api/expedix/patients')       // Test API call

// React state
this.state                           // State del componente
props                                // Props del componente
```

```python
# Backend debugging
Patient.objects.all().count()        # Contar pacientes
request.user.id                      # Usuario actual
settings.DEBUG                       # Estado debug
```

---

## ⚡ **ATAJOS DE TECLADO DEBUGGING**

- **F5**: Start debugging / Continue
- **F10**: Step over (siguiente línea)
- **F11**: Step into (entrar en función)
- **Shift + F11**: Step out (salir de función)
- **Shift + F5**: Stop debugging
- **F9**: Toggle breakpoint
- **Ctrl/Cmd + F5**: Restart debugging session

---

## 🎯 **CONFIGURACIÓN PARA ERRORES ESPECÍFICOS**

### **Para debugging de performance (N+1 queries):**
```json
"🐍 Django Performance Debug": {
  "type": "debugpy",
  "django": true,
  "env": {
    "DEBUG": "True",
    "LOG_LEVEL": "DEBUG",
    "DJANGO_LOG_LEVEL": "DEBUG"
  }
}
```

### **Para debugging de autenticación:**
```json
"🔐 Auth Debug": {
  "type": "chrome",
  "url": "http://localhost:3002/auth/sign-in",
  "trace": "verbose"
}
```

### **Para debugging de integración Supabase:**
```json
"🗄️ Supabase Debug": {
  "env": {
    "SUPABASE_DEBUG": "1",
    "NEXT_PUBLIC_SUPABASE_DEBUG": "1"
  }
}
```

---

## 🚀 **PRÓXIMOS PASOS PARA DEBUGGING AVANZADO**

1. **Instalar extensiones recomendadas**:
   - Python Debugger (ms-python.debugpy)
   - ES6 Mocha Snippets
   - Django Template Support

2. **Configurar debugging remoto** para Vercel production:
   - Source maps para producción
   - Remote debugging setup
   - Error tracking integration

3. **Automated debugging**:
   - Pre-commit hooks con debugging
   - Automated breakpoint placement
   - CI/CD debugging integration

---

**📅 Documentado:** 24 Agosto 2025  
**👨‍💻 DevOps:** Claude Code  
**🔍 Estado:** DEBUGGING SYSTEM COMPLETO - READY FOR ADVANCED TROUBLESHOOTING