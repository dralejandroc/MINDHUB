# Plan de Integración: Backend Django Especializado + Frontend React

## 🎯 Estrategia de Integración Selectiva

**Mantener:** Frontend React existente (CardBase, componentes, integración con Expedix)
**Integrar:** Backend Django como microservicio especializado para funcionalidades avanzadas
**Aprovechar:** Escalas adicionales de Django (16 escalas nuevas + mejoras a las existentes)

## 📊 Análisis de Escalas Disponibles

### Escalas Actuales en Node.js (11 escalas)
```
/mindhub/backend/templates/scales/
├── bdi-13-1.0.json
├── bdi-21-1.0.json  
├── gadi-1.0.json
├── gds-15-1.0.json
├── gds-30-1.0.json
├── gds-5-1.0.json
├── hdrs-17-1.0.json
├── madrs-1.0.json
├── mos-sleep-1.0.json
├── panss-1.0.json
└── phq9-1.0.json
```

### Escalas Adicionales en Django (16 escalas nuevas + formato mejorado)
```
Django scales/ (27 total):
✅ Existentes mejoradas: phq9, bdi-13, bdi-21, gadi, gds-15/30/5, hdrs-17, madrs, mos-sleep, panss
🆕 NUEVAS escalas (16):
├── aq-adolescent-json.json (Autism Quotient - Adolescentes)
├── aq-child-json.json (Autism Quotient - Niños)
├── cuestionario-salamanca-v2007.json (Evaluación clínica española)
├── dts-json-completo.json (Davidson Trauma Scale)
├── dy-bocs-json.json (Dimensional Y-BOCS)
├── eat26-json.json (Eating Attitudes Test)
├── emun-ar-scale.json (Escala de regulación emocional)
├── esadfun-json.json (Evaluación funcional)
├── hars_complete_json.json (Hamilton Anxiety Rating Scale)
├── ipde-cie10-completo.json (Trastornos de personalidad CIE-10)
├── ipde-dsmiv-json.json (Trastornos de personalidad DSM-IV)
├── moca-json.json (Montreal Cognitive Assessment)
├── rads2-json.json (Reynolds Adolescent Depression Scale)
├── sss-v-scale-json.json (Severity of Symptoms Scale)
├── stai-json-completo.json (State-Trait Anxiety Inventory)
└── ybocs-json.json (Yale-Brown Obsessive Compulsive Scale)
```

## 🏗️ Arquitectura de Integración

### Configuración del Sistema Híbrido

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Next.js)               │
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │   CardBase      │    │     Expedix Integration         │ │
│  │   Navigator     │    │     (Patient Management)        │ │
│  └─────────────────┘    └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    │ API Calls
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                API GATEWAY / ROUTER                         │
│              (Node.js Express Middleware)                   │
└─────────────────────────────────────────────────────────────┘
              │                                │
              ▼                                ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│    EXISTING NODE.JS     │    │    DJANGO MICROSERVICE      │
│       BACKEND           │    │     (ClinimetrixPro)        │
│                         │    │                             │
│ • Expedix APIs          │    │ • Advanced Assessments     │
│ • Authentication        │    │ • Remote Links              │
│ • Patient Management    │    │ • Longitudinal Tracking    │
│ • Basic Clinimetrix     │    │ • Clinical Reports          │
│                         │    │ • Risk Assessment           │
└─────────────────────────┘    └─────────────────────────────┘
              │                                │
              ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    SHARED DATABASE                          │
│                    (Railway MySQL)                          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Plan de Implementación por Fases

### FASE 1: Infraestructura Base (Semana 1-2)

#### 1.1 Configuración del Microservicio Django
```bash
# Estructura del proyecto
/mindhub/
├── backend/               # Node.js existente
├── frontend/             # React existente  
└── clinimetrix-django/   # NUEVO: Microservicio Django
    ├── Dockerfile
    ├── requirements.txt
    ├── manage.py
    └── clinimetrix_service/
        ├── settings/
        │   ├── base.py
        │   ├── development.py
        │   └── production.py
        ├── urls.py
        └── apps/
            ├── assessments/
            ├── psychometric_scales/
            └── clinical_reports/
```

#### 1.2 Configuración Docker
```dockerfile
# /mindhub/clinimetrix-django/Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8001

CMD ["gunicorn", "--bind", "0.0.0.0:8001", "clinimetrix_service.wsgi:application"]
```

#### 1.3 Docker Compose Integration
```yaml
# /mindhub/docker-compose.yml (añadir servicio)
services:
  # ... servicios existentes ...
  
  clinimetrix-django:
    build: ./clinimetrix-django
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=mysql://user:pass@mysql:3306/mindhub
      - DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    depends_on:
      - mysql
    networks:
      - mindhub-network
```

### FASE 2: API Gateway y Routing (Semana 3-4)

#### 2.1 Middleware de Routing Inteligente
```javascript
// /mindhub/backend/middleware/clinimetrix-router.js
class ClinimetrixRouter {
  constructor() {
    this.djangoBaseUrl = process.env.DJANGO_SERVICE_URL || 'http://clinimetrix-django:8001';
    this.nodeFeatures = [
      '/api/clinimetrix-pro/templates/catalog',
      '/api/clinimetrix-pro/templates/:id'
    ];
    this.djangoFeatures = [
      '/api/clinimetrix-pro/assessments/remote',
      '/api/clinimetrix-pro/assessments/scheduled',
      '/api/clinimetrix-pro/reports',
      '/api/clinimetrix-pro/assessments/*/longitudinal'
    ];
  }

  route(req, res, next) {
    const path = req.path;
    
    // Verificar si debe ir a Django
    if (this.shouldUseDjango(path)) {
      return this.proxyToDjango(req, res);
    }
    
    // Continuar con Node.js
    next();
  }

  shouldUseDjango(path) {
    return this.djangoFeatures.some(pattern => 
      this.matchPattern(path, pattern)
    );
  }

  async proxyToDjango(req, res) {
    try {
      const djangoUrl = `${this.djangoBaseUrl}${req.path}`;
      const response = await fetch(djangoUrl, {
        method: req.method,
        headers: {
          ...req.headers,
          'X-Forwarded-For': req.ip,
          'X-Original-Host': req.get('host')
        },
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(503).json({ 
        error: 'Django service unavailable',
        fallback: 'Using basic functionality' 
      });
    }
  }
}

module.exports = ClinimetrixRouter;
```

#### 2.2 Integración en Express
```javascript
// /mindhub/backend/server.js
const ClinimetrixRouter = require('./middleware/clinimetrix-router');

const app = express();
const clinimetrixRouter = new ClinimetrixRouter();

// Middleware para routing inteligente
app.use('/api/clinimetrix-pro', clinimetrixRouter.route.bind(clinimetrixRouter));

// Rutas existentes de Node.js
app.use('/api/clinimetrix-pro', require('./clinimetrix-pro/routes'));
```

### FASE 3: Autenticación Compartida (Semana 5-6)

#### 3.1 Bridge de Autenticación Clerk ↔ Django
```python
# /clinimetrix-django/clinimetrix_service/middleware/clerk_auth.py
import jwt
import requests
from django.contrib.auth import get_user_model
from django.http import JsonResponse

User = get_user_model()

class ClerkAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.clerk_secret = settings.CLERK_SECRET_KEY

    def __call__(self, request):
        # Verificar token de Clerk
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user_data = self.verify_clerk_token(token)
            
            if user_data:
                # Crear o recuperar usuario Django
                django_user = self.get_or_create_django_user(user_data)
                request.user = django_user
                request.clerk_user_data = user_data

        return self.get_response(request)

    def verify_clerk_token(self, token):
        try:
            # Verificar token con Clerk
            decoded = jwt.decode(
                token, 
                self.clerk_secret, 
                algorithms=['HS256'],
                options={"verify_signature": True}
            )
            return decoded
        except jwt.InvalidTokenError:
            return None

    def get_or_create_django_user(self, clerk_data):
        clerk_user_id = clerk_data.get('sub')
        email = clerk_data.get('email')
        
        user, created = User.objects.get_or_create(
            clerk_user_id=clerk_user_id,
            defaults={
                'email': email,
                'first_name': clerk_data.get('first_name', ''),
                'last_name': clerk_data.get('last_name', ''),
                'is_active': True
            }
        )
        return user
```

#### 3.2 Modelo de Usuario Extendido
```python
# /clinimetrix-django/accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    clerk_user_id = models.CharField(max_length=100, unique=True, null=True)
    professional_license = models.CharField(max_length=50, blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    clinic_affiliation = models.CharField(max_length=200, blank=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
```

### FASE 4: Funcionalidades Avanzadas (Semana 7-8)

#### 4.1 Sistema de Evaluaciones Remotas
```python
# API para crear enlaces remotos
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_remote_assessment_link(request):
    """Crear enlace tokenizado para evaluación remota"""
    data = request.data
    
    # Crear enlace seguro
    remote_link = RemoteAssessmentLink.objects.create(
        patient_id=data['patient_id'],
        scale_id=data['scale_id'],
        created_by=request.user,
        expires_at=data['expires_at'],
        clinical_context=data.get('clinical_context', ''),
        instructions=data.get('instructions', '')
    )
    
    # Generar URL completa
    assessment_url = request.build_absolute_uri(
        f'/remote/assessment/{remote_link.token}/'
    )
    
    return Response({
        'success': True,
        'assessment_url': assessment_url,
        'expires_at': remote_link.expires_at,
        'link_id': str(remote_link.id)
    })
```

#### 4.2 Seguimiento Longitudinal
```python
@api_view(['POST'])
def create_longitudinal_tracking(request):
    """Configurar seguimiento longitudinal de paciente"""
    data = request.data
    
    scheduled_assessment = ScheduledAssessment.objects.create(
        patient_id=data['patient_id'],
        scale_id=data['scale_id'],
        frequency=data['frequency'],  # 'weekly', 'monthly', etc.
        start_date=data['start_date'],
        end_date=data.get('end_date'),
        created_by=request.user,
        send_reminders=data.get('send_reminders', True)
    )
    
    return Response({
        'success': True,
        'tracking_id': str(scheduled_assessment.id),
        'next_assessment_date': scheduled_assessment.next_due_date
    })
```

#### 4.3 Generación de Reportes Clínicos
```python
@api_view(['POST'])
def generate_clinical_report(request, assessment_id):
    """Generar reporte clínico profesional"""
    assessment = get_object_or_404(Assessment, id=assessment_id)
    
    # Crear reporte
    report = ClinicalReportGenerator.create_comprehensive_report(
        assessment=assessment,
        include_interpretation=True,
        include_recommendations=True,
        include_longitudinal_data=request.data.get('include_history', False)
    )
    
    return Response({
        'success': True,
        'report_id': str(report.id),
        'pdf_url': report.pdf_file.url if report.pdf_file else None,
        'html_content': report.content_html
    })
```

### FASE 5: Integración Frontend (Semana 9-10)

#### 5.1 Servicios Frontend para Django APIs
```typescript
// /mindhub/frontend/lib/services/clinimetrix-advanced.ts
class ClinimetrixAdvancedService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL;

  async createRemoteAssessmentLink(data: {
    patientId: string;
    scaleId: string;
    expiresAt: string;
    clinicalContext?: string;
  }) {
    const response = await this.authenticatedFetch('/clinimetrix-pro/assessments/remote', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async setupLongitudinalTracking(data: {
    patientId: string;
    scaleId: string;
    frequency: 'weekly' | 'monthly' | 'quarterly';
    startDate: string;
  }) {
    const response = await this.authenticatedFetch('/clinimetrix-pro/assessments/scheduled', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async generateClinicalReport(assessmentId: string, options: {
    includeHistory?: boolean;
    reportType?: 'summary' | 'comprehensive';
  }) {
    const response = await this.authenticatedFetch(
      `/clinimetrix-pro/reports/generate/${assessmentId}`, {
      method: 'POST',
      body: JSON.stringify(options)
    });
    return response.json();
  }

  private async authenticatedFetch(endpoint: string, options: RequestInit) {
    const token = await this.getClerkToken();
    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }
}
```

#### 5.2 Componentes React Mejorados
```tsx
// Componente para evaluaciones remotas
const RemoteAssessmentCreator = ({ patient, scale, onSuccess }) => {
  const [expiresAt, setExpiresAt] = useState('');
  const [clinicalContext, setClinicalContext] = useState('');
  const clinimetrixService = new ClinimetrixAdvancedService();

  const handleCreateRemoteLink = async () => {
    try {
      const result = await clinimetrixService.createRemoteAssessmentLink({
        patientId: patient.id,
        scaleId: scale.id,
        expiresAt,
        clinicalContext
      });

      onSuccess({
        assessmentUrl: result.assessment_url,
        linkId: result.link_id
      });
    } catch (error) {
      console.error('Error creating remote link:', error);
    }
  };

  return (
    <div className="remote-assessment-creator">
      <h3>Crear Evaluación Remota</h3>
      <div className="form-group">
        <label>Vence el:</label>
        <input 
          type="datetime-local" 
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Contexto Clínico:</label>
        <textarea 
          value={clinicalContext}
          onChange={(e) => setClinicalContext(e.target.value)}
          placeholder="Motivo de la evaluación, contexto clínico..."
        />
      </div>
      <button onClick={handleCreateRemoteLink}>
        Generar Enlace Remoto
      </button>
    </div>
  );
};
```

## 📊 Beneficios de la Integración

### Funcionalidades Nuevas Inmediatas
1. **16 Escalas Adicionales** - Acceso inmediato a escalas especializadas
2. **Evaluaciones Remotas** - Enlaces tokenizados para pacientes externos
3. **Seguimiento Longitudinal** - Programación automática de re-evaluaciones
4. **Reportes Clínicos** - Generación automática de reportes profesionales
5. **Análisis de Riesgo** - Detección automática de alertas clínicas

### Ventajas Arquitectónicas
1. **Escalabilidad** - Microservicio independiente y escalable
2. **Mantenibilidad** - Separación clara de responsabilidades
3. **Flexibilidad** - Fácil desactivación o reemplazo del microservicio
4. **Performance** - Distribución de carga entre servicios

## ⚠️ Consideraciones de Implementación

### Desafíos Técnicos
1. **Latencia entre servicios** - Optimización de comunicación
2. **Sincronización de datos** - Coherencia entre Node.js y Django
3. **Gestión de errores** - Fallback cuando Django no está disponible
4. **Monitoreo** - Observabilidad de múltiples servicios

### Mitigaciones
1. **Circuit Breaker Pattern** - Fallos graceful del microservicio
2. **Caching inteligente** - Redis compartido entre servicios
3. **Health Checks** - Monitoreo continuo de Django
4. **Fallback a Node.js** - Funcionalidad básica cuando Django falla

## 🎯 Timeline y Recursos

**Timeline Total: 10 semanas**
- Semanas 1-2: Infraestructura base
- Semanas 3-4: API Gateway y routing
- Semanas 5-6: Autenticación compartida
- Semanas 7-8: Funcionalidades avanzadas
- Semanas 9-10: Integración frontend

**Recursos Necesarios:**
- 1 desarrollador backend (0.7 FTE)
- 1 desarrollador frontend (0.3 FTE)
- Infrastructure: Servidor adicional para Django

Esta estrategia te permite mantener todo tu excelente trabajo en React/CardBase mientras añades las capacidades avanzadas de Django de forma incremental y controlada.