# ⚠️ BACKEND NODE.JS - DEPRECATED

## Estado: DESUSO COMPLETO

Este directorio contiene el backend Node.js **DEPRECATED** que fue reemplazado completamente por el backend Django.

### ❌ **NO USAR ESTE BACKEND**

- **Fecha de depreciación**: 20 de Agosto 2025
- **Razón**: Migración completa a Django REST Framework
- **Reemplazo**: `/backend-django/` - Backend Django principal

### 🚫 **Funcionalidades Deprecadas**

- ❌ API Routes Node.js/Express
- ❌ Prisma ORM 
- ❌ MySQL/MAMP database
- ❌ Clerk authentication
- ❌ Railway deployment

### ✅ **Nuevas Funcionalidades (Django)**

- ✅ Django REST Framework APIs
- ✅ Django ORM con PostgreSQL
- ✅ Supabase PostgreSQL database
- ✅ Supabase authentication
- ✅ Vercel deployment

### 📁 **Estructura Actual**

```
MindHub-Pro/
├── mindhub/
│   ├── frontend/              # ✅ React/Next.js (ACTIVO)
│   └── backend-django/        # ✅ Django REST API (ACTIVO)
└── legacy-backend/            # ❌ Node.js backend (DEPRECATED)
```

### 🔧 **Para Desarrolladores**

**NO usar este código para:**
- Nuevas funcionalidades
- Referencia de APIs
- Deployment a producción
- Desarrollo actual

**En su lugar usar:**
- `/backend-django/` para backend development
- `/mindhub/frontend/` para frontend development

### 📚 **Documentación Actualizada**

Ver `/CLAUDE.md` para la arquitectura actual del proyecto.

---

**⚠️ Este directorio se mantendrá solo como referencia histórica y será eliminado en una futura limpieza del proyecto.**