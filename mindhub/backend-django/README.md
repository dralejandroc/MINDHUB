# ClinimetrixPro Django Backend

## 🎯 Propósito

Este es el backend Django especializado para **ClinimetrixPro**, el sistema de evaluaciones clínicas de MindHub. 

## 🏗️ Arquitectura Híbrida

```
MindHub/
├── frontend/              # React/Next.js frontend
├── backend/              # Node.js backend principal (Expedix, FormX, etc.)
└── backend-django/       # Django backend ClinimetrixPro (este directorio)
```

## 🔄 Integración

- **React Frontend** se comunica con **Django Backend** para ClinimetrixPro
- **Django Backend** maneja todo el sistema de evaluaciones clínicas
- **Node.js Backend** mantiene Expedix, FormX, Agenda y otros módulos

## 🚀 Características

### ✅ Sistema Completamente Funcional:
- **40 escalas psicológicas** migradas y operativas
- **Motor de renderizado** con Alpine.js (`focused_take.html`)
- **APIs React-compatible** para integración con frontend
- **Bridge endpoints** para redirección híbrida
- **Base de datos SQLite** con migración a MySQL lista

### 🔗 Endpoints Principales:

**React-Compatible APIs:**
- `GET /assessments/react-api/catalog/` - Catálogo de escalas
- `GET /assessments/react-api/template/{id}/` - Plantilla específica
- `POST /assessments/react-api/assessment/create/` - Crear evaluación
- `PUT /assessments/react-api/assessment/{id}/responses/` - Guardar respuestas
- `POST /assessments/react-api/assessment/{id}/complete/` - Completar evaluación

**Bridge Endpoints:**
- `POST /assessments/api/create-from-react/` - Bridge React → Django

## 🗃️ Base de Datos

- **Desarrollo**: SQLite (`db.sqlite3`)
- **Producción**: MySQL en Railway
- **Migradas**: 40 escalas con metadata completa
- **Management Commands**: Migración automática de JSON templates

## 🧪 Testing Completado

- ✅ Health check endpoints
- ✅ Catalog API (40 escalas disponibles)
- ✅ Template loading (PHQ-9 verificado)
- ✅ Assessment creation and completion
- ✅ Scoring engine con interpretación
- ✅ Bridge endpoint para integración híbrida

## 🔧 Setup y Deploy

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
python manage.py migrate

# Migrar escalas desde JSON
python manage.py migrate_scales_json

# Servidor desarrollo
python manage.py runserver 8000

# Verificar health
curl http://localhost:8000/assessments/react-api/health/
```

## 🎯 Estado del Proyecto

**✅ COMPLETAMENTE FUNCIONAL** - Sistema listo para producción
- Integración React ↔ Django verificada
- Todas las APIs funcionando
- 40 escalas migradas y operativas
- Alpine.js assessment engine funcionando
- Bridge híbrido implementado

---

**Fecha de migración**: 2025-08-17  
**Sistema origen**: `/analysis/ClinimetrixProV2Phyton/`  
**Ubicación final**: `/mindhub/backend-django/`