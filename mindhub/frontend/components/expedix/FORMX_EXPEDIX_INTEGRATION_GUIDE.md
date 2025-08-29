# 🔗 Integración FormX ↔ Expedix - Guía Completa

## ✅ Sistema Implementado

### 🎯 **Identificación Automática de Pacientes**
- **Matching inteligente** basado en nombre completo + fecha de nacimiento
- **Algoritmo de similaridad** con confianza 0-100%
- **Normalización automática** de nombres (acentos, espacios, etc.)
- **Validación cruzada** con email y teléfono si disponibles

### 📄 **Almacenamiento Automático de PDFs**
- **Generación automática** de PDF desde respuestas del formulario
- **Almacenamiento en Supabase Storage** bajo `/patients/{id}/forms/`
- **Registro en tabla `patient_documents`** con metadata completa
- **Acceso directo** desde pestaña "Documentos" del PatientDashboard

### 🧠 **Extracción Inteligente de Antecedentes**
- **Mapeo automático** de campos comunes (alergias, medicamentos, síntomas)
- **Reconocimiento multi-idioma** (español/inglés)
- **Estructuración de datos** en categorías médicas
- **Almacenamiento normalizado** en tabla `patient_medical_background`

### 📊 **Nueva Pestaña "Antecedentes"**
- **Vista estructurada** con categorías colapsables
- **Información crítica destacada** (alergias, medicamentos actuales)
- **Hábitos sociales** con indicadores visuales
- **Signos vitales** reportados por el paciente

### ✅ **Sistema de Confirmación Manual**
- **Dashboard de revisión** para casos dudosos (<85% confianza)
- **Comparación visual** de datos FormX vs Expedix
- **Creación de pacientes nuevos** si no hay coincidencias
- **Archivado** de formularios no procesables

### 🔗 **Generador de Enlaces Genéricos**
- **Enlaces únicos** con identificación automática
- **Códigos QR** para fácil acceso
- **Configuración flexible** (expiración, uso múltiple)
- **Múltiples tipos** de formulario (admisión, seguimiento, síntomas)

## 🏗️ Arquitectura del Sistema

```
FormX → Webhook → FormXExpedixIntegration → {
  ├── Identificación Automática (Algoritmo de Matching)
  ├── Extracción de Antecedentes (Mapeo Inteligente)  
  ├── Generación PDF (jsPDF + Supabase Storage)
  ├── Almacenamiento Estructurado (patient_medical_background)
  └── Timeline Entry (Registro en expediente)
}
```

## 📋 Tablas de Base de Datos Requeridas

### 1. `formx_submissions`
```sql
CREATE TABLE formx_submissions (
  id UUID PRIMARY KEY,
  form_id VARCHAR(255) NOT NULL,
  form_title VARCHAR(255),
  submission_date TIMESTAMPTZ,
  patient_name VARCHAR(255),
  birth_date DATE,
  email VARCHAR(255),
  phone VARCHAR(20),
  responses JSONB,
  raw_data JSONB,
  status VARCHAR(20) DEFAULT 'pending_match',
  confidence INTEGER DEFAULT 0,
  matched_patient_id UUID,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `patient_medical_background`
```sql
CREATE TABLE patient_medical_background (
  patient_id UUID PRIMARY KEY,
  allergies TEXT[],
  medications TEXT[],
  medical_history TEXT[],
  family_history TEXT[],
  symptoms TEXT[],
  surgeries TEXT[],
  immunizations TEXT[],
  social_history JSONB,
  vital_signs JSONB,
  source_form_id VARCHAR(255),
  source_submission_id UUID,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. `formx_generic_links`
```sql
CREATE TABLE formx_generic_links (
  id VARCHAR(255) PRIMARY KEY,
  form_id VARCHAR(255) NOT NULL,
  form_title VARCHAR(255),
  expires_at TIMESTAMPTZ,
  allow_multiple_use BOOLEAN DEFAULT FALSE,
  require_verification BOOLEAN DEFAULT TRUE,
  custom_message TEXT,
  status VARCHAR(20) DEFAULT 'active',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. `patient_documents` (si no existe)
```sql
CREATE TABLE patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  url TEXT,
  upload_date TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚀 Integración en PatientDashboard

### Agregar Pestaña "Antecedentes"

```typescript
// En PatientDashboardOptimized.tsx
const tabs: Tab[] = [
  // ... tabs existentes
  { id: 'background', name: 'Antecedentes', icon: HeartIcon, lazy: true }
];

// En renderTabContent():
case 'background':
  return (
    <Suspense fallback={<LoadingFallback message="Cargando antecedentes..." />}>
      <PatientMedicalBackground 
        patientId={patientData.id}
        onEdit={handleEditBackground}
      />
    </Suspense>
  );
```

### Agregar Administración de FormX

```typescript
// Nueva pestaña administrativa
{ id: 'formx', name: 'FormX Admin', icon: DocumentTextIcon }

// Contenido:
case 'formx':
  return (
    <div className="space-y-6">
      <FormXLinkGenerator />
      <FormXSubmissionReview 
        onSubmissionProcessed={handleSubmissionProcessed}
      />
    </div>
  );
```

## 🔧 Configuración de Webhooks FormX

### Endpoint de Recepción
```typescript
// /api/formx/webhook/route.ts
import { formXIntegration } from '@/lib/services/FormXExpedixIntegration';

export async function POST(request: Request) {
  try {
    const submissionData = await request.json();
    
    // Validar firma del webhook (seguridad)
    const isValid = validateFormXSignature(submissionData, request.headers);
    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Procesar submission
    const result = await formXIntegration.processFormSubmission(submissionData);
    
    return Response.json({ 
      success: true, 
      submissionId: result.id,
      status: result.status,
      confidence: result.confidence
    });

  } catch (error) {
    console.error('FormX webhook error:', error);
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

## 📝 Flujo de Trabajo Completo

### 1. **Envío de Formulario**
```typescript
// Generar link genérico
const link = await FormXLinkGenerator.generateLink({
  formId: 'intake-general',
  expiresInHours: 72
});

// Enviar por email/SMS al paciente
sendFormLink(patient.email, link.url);
```

### 2. **Recepción y Procesamiento**
```typescript
// FormX envía webhook cuando paciente completa formulario
// Sistema automáticamente:
// ✅ Identifica paciente (nombre + fecha nacimiento)
// ✅ Extrae antecedentes médicos
// ✅ Genera y almacena PDF
// ✅ Actualiza expediente
```

### 3. **Revisión Manual (si necesario)**
```typescript
// Si confianza < 85%, aparece en FormXSubmissionReview
// Doctor puede:
// ✅ Confirmar match sugerido
// ✅ Crear nuevo paciente  
// ✅ Archivar formulario
```

### 4. **Consulta de Información**
```typescript
// En consulta médica:
// ✅ Antecedentes estructurados en pestaña "Antecedentes"
// ✅ PDF completo en pestaña "Documentos"
// ✅ Entrada en Timeline del paciente
```

## ⚙️ Configuración de Producción

### 1. Variables de Entorno
```env
FORMX_WEBHOOK_SECRET=your-webhook-secret
SUPABASE_STORAGE_URL=your-storage-url
PATIENT_FORMS_BUCKET=patient-documents
```

### 2. Configurar Supabase Storage
```sql
-- Crear bucket para documentos de pacientes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-documents', 'patient-documents', false);

-- RLS policy para acceso a documentos
CREATE POLICY "Doctors can access patient documents" ON storage.objects
  FOR ALL USING (auth.role() = 'doctor' OR auth.uid()::text = metadata->>'uploaded_by');
```

### 3. Configurar FormX Webhook
- URL: `https://mindhub.cloud/api/formx/webhook`
- Método: POST
- Headers: `Content-Type: application/json`
- Secret: `FORMX_WEBHOOK_SECRET`

## 🎯 Casos de Uso Principales

### **Admisión de Pacientes Nuevos**
1. Enviar formulario de admisión antes de la cita
2. Sistema identifica o crea paciente automáticamente
3. Antecedentes estructurados disponibles al inicio de consulta

### **Seguimiento Post-Consulta** 
1. Enviar formulario de seguimiento después de tratamiento
2. Paciente reporta evolución de síntomas
3. Información se integra automáticamente al expediente

### **Evaluaciones Periódicas**
1. Enlaces recurrentes para evaluación de síntomas
2. Tracking automático de progreso del paciente
3. Datos históricos consultables en antecedentes

### **Formularios Especializados**
1. Cuestionarios específicos por especialidad
2. Extracción automática de datos relevantes
3. Integración con flujo de consulta existente

## 🔍 Métricas y Monitoreo

### KPIs del Sistema
- **% de matching automático exitoso** (objetivo: >90%)
- **Tiempo promedio de procesamiento** (objetivo: <5 segundos)
- **% de formularios que requieren revisión manual** (objetivo: <10%)
- **Satisfacción del usuario** con la información estructurada

### Logging y Debugging
```typescript
// Logs importantes a monitorear:
console.log(`FormX submission processed: ${submissionId}, confidence: ${confidence}%`);
console.log(`Patient matched: ${patientId} with ${matchReasons.join(', ')}`);
console.log(`Medical background updated for patient: ${patientId}`);
console.error(`FormX processing failed: ${error.message}`);
```

## 🚀 Beneficios Implementados

### ✅ **Para el Personal Médico**
- **Cero trabajo manual** para procesar formularios
- **Información estructurada** y fácil de consultar  
- **Antecedentes completos** disponibles antes de consulta
- **PDFs organizados** automáticamente por paciente

### ✅ **Para los Pacientes**
- **Enlaces genéricos** fáciles de usar
- **Códigos QR** para acceso móvil
- **Identificación automática** sin registro previo
- **Experiencia fluida** sin complicaciones técnicas

### ✅ **Para el Sistema**
- **Integración total** FormX ↔ Expedix
- **Datos confiables** con algoritmos inteligentes
- **Escalabilidad** para múltiples tipos de formularios
- **Trazabilidad completa** de la información

Este sistema transforma completamente la captura de información de pacientes, eliminando el trabajo manual y garantizando que toda la información esté disponible de manera estructurada y consultable directamente en el expediente.