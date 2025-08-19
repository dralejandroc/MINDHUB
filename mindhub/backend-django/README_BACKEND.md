# MindHub Django Backend

Backend híbrido Django para **FormX** y **ClinimetrixPro** integrado con Supabase PostgreSQL y React frontend.

## 🏗️ Arquitectura

```
┌─ React Frontend ──────── Vercel (https://mindhub.cloud)
├─ Django Backend ────────── FormX + ClinimetrixPro
├─ Database ─────────────── Supabase PostgreSQL
└─ Auth ─────────────────── Supabase Auth
```

## 🚀 Configuración Rápida

### 1. Configurar Entorno

```bash
# Copiar configuración de ejemplo
cp .env.example .env

# Editar variables de entorno
nano .env
```

**Variables requeridas en `.env`:**
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
REACT_FRONTEND_URL=https://mindhub.cloud
```

### 2. Instalar Dependencias

```bash
# Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar Base de Datos

```bash
# Aplicar migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser
```

### 4. Configurar Escalas (ClinimetrixPro)

```bash
# Cargar escalas desde archivos JSON
python manage.py setup_scales

# O cargar desde directorio específico
python manage.py setup_scales --scales-dir /path/to/scales --force
```

### 5. Iniciar Servidor

```bash
# Script automatizado (recomendado)
python start_server.py

# O manualmente
python manage.py runserver 0.0.0.0:8000
```

## 📋 Módulos Principales

### FormX - Generador de Formularios Dinámicos

**Características:**
- ✅ Django Forms nativo para máxima compatibilidad
- ✅ Formularios móvil-friendly con CSS optimizado
- ✅ Auto-sincronización con Expedix vía Supabase
- ✅ Sistema de tokens para acceso sin autenticación
- ✅ Generación de documentos con placeholders auto-llenables
- ✅ Mapeo automático de campos Expedix

**Endpoints principales:**
```
GET  /formx/api/templates/         # Lista de plantillas
POST /formx/api/form-builder/      # Crear formulario desde React
POST /formx/api/send-form/         # Enviar formulario a paciente
GET  /formx/fill/<token>/          # Formulario para pacientes
POST /formx/submit/<token>/        # Envío de respuesta
```

### ClinimetrixPro - Evaluaciones Psicométricas

**Características:**
- ✅ 29 escalas psicométricas migradas y validadas
- ✅ Sistema híbrido React ↔ Django seamless
- ✅ Alpine.js CardBase para navegación nativa
- ✅ Scoring inteligente y interpretaciones clínicas
- ✅ Bridge de autenticación Supabase funcionando

**Endpoints principales:**
```
GET  /scales/api/catalog/          # Catálogo de escalas
POST /assessments/api/create-from-react/  # Crear desde React
GET  /assessments/<id>/focused-take/      # Evaluación focused_take.html
GET  /assessments/<id>/results/           # Resultados y scoring
```

## 🔧 Servicios Principales

### FormGeneratorService
Genera formularios Django dinámicos desde configuración JSON.

```python
from formx.services import FormGeneratorService

generator = FormGeneratorService()
form_class = generator.create_dynamic_form(template_id)
form = form_class(request.POST)
if form.is_valid():
    # Procesar datos validados
    clean_data = form.cleaned_data
```

### ExpedixSyncService
Sincroniza respuestas de formularios con Expedix vía Supabase.

```python
from formx.services import ExpedixSyncService

sync_service = ExpedixSyncService()
success = sync_service.sync_form_submission(submission)
```

### DocumentGeneratorService
Genera documentos con datos auto-llenados del paciente.

```python
from formx.services import DocumentGeneratorService

doc_service = DocumentGeneratorService()
content = doc_service.generate_document(template_id, patient_id)
```

## 🌐 Integración con React Frontend

### 1. Envío de Formularios desde React

```javascript
// Crear formulario dinámico
const response = await fetch('/formx/api/form-builder/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Registro de Paciente',
    form_type: 'intake',
    fields: [
      {
        field_name: 'first_name',
        field_type: 'text',
        label: 'Nombre',
        required: true
      }
    ]
  })
});

// Enviar formulario a paciente
const sendResponse = await fetch('/formx/api/send-form/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    template_id: templateId,
    patient_id: patientId,
    patient_email: 'patient@example.com'
  })
});
```

### 2. Bridge ClinimetrixPro

```javascript
// Iniciar evaluación desde React
const assessmentResponse = await fetch('/assessments/api/create-from-react/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    scale_id: 'phq9-1.0',
    patient_id: patientId
  })
});

// Django devuelve URL para focused_take.html
const { assessment_url } = await assessmentResponse.json();
window.location.href = assessment_url;
```

## 🗄️ Modelos de Datos

### FormX Models

```python
# Plantilla de formulario
FormTemplate:
  - name, form_type, description
  - integration_type (expedix/clinimetrix/standalone)
  - auto_sync_expedix, expedix_mapping
  - mobile_optimized, requires_auth

# Campo de formulario
FormField:
  - field_name, field_type, label
  - required, validation rules
  - choices (para select/radio/checkbox)
  - expedix_field (mapeo automático)

# Respuesta enviada
FormSubmission:
  - patient_id, patient_email
  - form_data (JSON), access_token
  - status, synced_to_expedix
  - device_type, ip_address

# Plantilla de documento
DocumentTemplate:
  - name, document_type, template_content
  - auto_fill_fields, requires_signature
  - email_subject, email_body
```

### ClinimetrixPro Models

```python
# Escala psicométrica
PsychometricScale:
  - name, abbreviation, version
  - category, subcategory
  - scale_data (JSON completo)
  - target_population, administration_mode

# Evaluación
Assessment:
  - scale, patient_id, status
  - responses (JSON), scores
  - started_at, completed_at
  - interpretation_results
```

## 🧪 Testing

### Test Automatizado

```bash
# Ejecutar tests de integración
python test_backend_integration.py

# Tests específicos
python manage.py test formx
python manage.py test psychometric_scales
python manage.py test assessments
```

### Test Manual de Endpoints

```bash
# Health check
curl http://localhost:8000/formx/api/health/

# Catálogo de formularios
curl http://localhost:8000/formx/api/templates/catalog/

# Estadísticas dashboard
curl http://localhost:8000/formx/api/dashboard/stats/

# Catálogo ClinimetrixPro
curl http://localhost:8000/scales/api/catalog/
```

## 🔐 Autenticación Supabase

El middleware `SupabaseAuthMiddleware` valida automáticamente tokens JWT de Supabase:

```python
# En views.py
class FormTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]  # Usa Supabase auth
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
```

## 📊 Monitoreo y Logs

```python
# Configuración de logging en settings.py
LOGGING = {
    'loggers': {
        'formx': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
        },
        'clinimetrix': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
        }
    }
}
```

**Archivos de log:**
- `logs/clinimetrix.log` - Logs generales del sistema
- `logs/formx.log` - Logs específicos de FormX
- Console output durante desarrollo

## 🚀 Deployment

### Desarrollo Local

```bash
# Usar script automatizado
python start_server.py

# O configuración manual
python manage.py runserver 0.0.0.0:8000
```

### Producción

```bash
# Configurar variables de entorno de producción
export DEBUG=False
export ALLOWED_HOSTS=your-domain.com
export DATABASE_URL=your-production-db-url

# Recopilar archivos estáticos
python manage.py collectstatic --noinput

# Iniciar con Gunicorn
gunicorn clinimetrix_django.wsgi:application --bind 0.0.0.0:8000
```

## 📚 Documentación API

Una vez iniciado el servidor, accede a:

- **Swagger UI**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc**: http://localhost:8000/api/schema/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## 🔗 URLs Importantes

### Desarrollo
- Django Admin: http://localhost:8000/admin/
- FormX API: http://localhost:8000/formx/api/
- ClinimetrixPro: http://localhost:8000/assessments/
- Health Check: http://localhost:8000/formx/api/health/

### Producción
- Frontend: https://mindhub.cloud
- Backend: https://your-django-backend.com
- Admin: https://your-django-backend.com/admin/

## 🐛 Troubleshooting

### Error: ModuleNotFoundError

```bash
# Instalar dependencias
pip install -r requirements.txt

# Verificar PYTHONPATH
export PYTHONPATH=/path/to/backend-django:$PYTHONPATH
```

### Error: Database connection

```bash
# Verificar .env
cat .env | grep DATABASE_URL

# Test conexión
python manage.py check --database default
```

### Error: Supabase auth

```bash
# Verificar configuración Supabase
python -c "from django.conf import settings; print(settings.SUPABASE_URL)"

# Test con curl
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/formx/api/health/
```

### FormX no carga formularios

```bash
# Verificar templates
python manage.py check

# Recopilar archivos estáticos
python manage.py collectstatic

# Verificar permisos
python manage.py shell -c "from formx.models import FormTemplate; print(FormTemplate.objects.count())"
```

## 📝 Notas de Desarrollo

1. **FormX usa Django Forms nativo** - Máxima compatibilidad y validación
2. **ClinimetrixPro mantiene Alpine.js** - Para CardBase y navegación
3. **Bridge seamless React ↔ Django** - Sin fricción en la experiencia
4. **Auto-sync con Expedix** - Vía Supabase PostgreSQL
5. **Mobile-first** - Todos los formularios optimizados para móvil

## 🤝 Contribución

1. Fork el proyecto
2. Crea feature branch (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abre Pull Request

---

**🎉 Backend Django configurado y listo para integración con MindHub React Frontend!**