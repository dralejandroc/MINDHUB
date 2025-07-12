# MindHub Storage System - Documentación

Sistema de almacenamiento seguro para archivos de salud mental con cumplimiento NOM-024 y preparado para producción en Google Cloud.

## 🏗️ Arquitectura del Sistema

### Estructura de Directorios

```
uploads/
├── patients/           # Archivos de pacientes (CIFRADOS)
│   ├── documents/      # Documentos médicos, consentimientos
│   ├── images/         # Imágenes médicas, fotos de perfil
│   └── reports/        # Reportes clínicos, resultados
├── assessments/        # Evaluaciones clínicas
│   ├── reports/        # Reportes de evaluaciones generados
│   └── data/           # Datos de respuestas y resultados
├── resources/          # Recursos educativos
│   ├── documents/      # PDFs, documentos educativos
│   ├── videos/         # Videos educativos
│   ├── images/         # Imágenes para recursos
│   └── audio/          # Archivos de audio
├── forms/              # Sistema de formularios
│   ├── templates/      # Plantillas de formularios
│   └── submissions/    # Respuestas de formularios
└── system/             # Archivos del sistema
    ├── backups/        # Respaldos
    ├── logs/           # Logs del sistema
    └── temp/           # Archivos temporales
```

## 🔐 Características de Seguridad

### Validación de Archivos
- **Tipos MIME permitidos**: PDF, DOC, imágenes, audio, video
- **Tamaño máximo**: 50MB por archivo
- **Validación por categoría**: Restricciones específicas por tipo de contenido

### Nomenclatura Segura
```javascript
// Formato: [prefijo-paciente-]timestamp-uuid.ext
// Ejemplo: pat-12345678-2024-07-11T13-15-30-abcd1234.pdf
```

### Cifrado y Metadatos
- **Archivos de pacientes**: Marcados para cifrado automático
- **Metadatos seguros**: Información de auditoría en `.meta.json`
- **Protección contra traversal**: Validación de rutas

## 🏥 Cumplimiento Normativo

### NOM-024-SSA3-2010
- ✅ **Auditoría completa**: Logs de acceso y modificación
- ✅ **Cifrado en reposo**: Archivos de pacientes cifrados
- ✅ **Control de acceso**: Validación de permisos por categoría
- ✅ **Retención de datos**: Políticas de conservación

### HIPAA-Ready
- ✅ **Logs de acceso a PHI**: Registro completo de accesos
- ✅ **Autenticación requerida**: Control de acceso obligatorio
- ✅ **Minimización de datos**: Acceso basado en necesidad

## 🚀 Configuración y Uso

### Configuración Local

```bash
# Inicializar directorios de almacenamiento
npm run storage:init

# Probar el sistema
npm run storage:test

# Ver estadísticas
npm run storage:stats
```

### Variables de Entorno

```env
# Desarrollo local
NODE_ENV=development
BASE_URL=http://localhost:8080

# Producción con Google Cloud
NODE_ENV=production
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=mindhub-storage
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json
```

## 📡 API Endpoints

### Subida de Archivos

#### Archivos de Pacientes
```bash
POST /api/storage/patients/upload
Content-Type: multipart/form-data

# Parámetros
files: [archivo1, archivo2, ...]
patientId: "patient-uuid"
subcategory: "documents|images|reports"
userId: "user-uuid"
```

#### Recursos Educativos
```bash
POST /api/storage/resources/upload
Content-Type: multipart/form-data

# Parámetros
files: [archivo1, archivo2, ...]
resourceId: "resource-uuid"
subcategory: "documents|videos|images|audio"
isPublic: true/false
```

#### Evaluaciones Clínicas
```bash
POST /api/storage/assessments/upload
Content-Type: multipart/form-data

# Parámetros
files: [archivo1, archivo2, ...]
assessmentId: "assessment-uuid"
subcategory: "reports|data"
```

### Descarga de Archivos

```bash
# Obtener URL de descarga
GET /api/storage/download/:category/:subcategory/:fileName?expires=3600

# Descargar directamente (solo desarrollo)
GET /uploads/:category/:subcategory/:fileName
```

### Gestión de Archivos

```bash
# Eliminar archivo
DELETE /api/storage/:category/:subcategory/:fileName
Body: { "reason": "Motivo de eliminación" }

# Estadísticas de almacenamiento
GET /api/storage/stats

# Validar archivo antes de subir
POST /api/storage/validate
Content-Type: multipart/form-data
```

## 🔧 Configuración por Categoría

### Archivos de Pacientes

```javascript
{
  maxFileSize: 50MB,
  allowedTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
  encryption: true,
  auditRequired: true,
  accessControl: 'strict'
}
```

### Recursos Educativos

```javascript
{
  maxFileSize: 100MB, // Videos permitidos
  allowedTypes: ['pdf', 'doc', 'mp4', 'mp3', 'jpg', 'png'],
  encryption: false,
  publicAccess: 'conditional'
}
```

### Evaluaciones Clínicas

```javascript
{
  maxFileSize: 10MB,
  allowedTypes: ['pdf', 'json', 'txt'],
  encryption: true,
  clinicalData: true
}
```

## 🛠️ Desarrollo

### Probar el Sistema

```bash
# Ejecutar todas las pruebas
npm run storage:test

# Probar subida de archivo específico
curl -X POST http://localhost:8080/api/storage/patients/upload \
  -F "files=@test-document.pdf" \
  -F "patientId=test-patient-123" \
  -F "subcategory=documents"
```

### Middleware de Autenticación

```javascript
// Verificar permisos antes de subir
app.use('/api/storage/patients', checkUploadPermissions('patients'));

// Validar acceso a archivos de pacientes
app.use('/uploads/patients', requirePatientAccess);
```

### Configuración de Multer

```javascript
const upload = createMulterConfig('patients');
app.post('/upload', upload.array('files', 10), handleUpload);
```

## 🌐 Producción con Google Cloud

### Configuración GCS

```javascript
// Automáticamente detecta modo de producción
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
});
```

### Buckets Recomendados

```
mindhub-prod-patients      # Archivos de pacientes (privado)
mindhub-prod-assessments   # Evaluaciones clínicas (privado)  
mindhub-prod-resources     # Recursos educativos (público)
mindhub-prod-forms         # Formularios (privado)
mindhub-prod-system        # Sistema y backups (privado)
```

### URLs Firmadas

```javascript
// URLs temporales para acceso seguro
const [signedUrl] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 3600 * 1000 // 1 hora
});
```

## 📊 Monitoreo y Estadísticas

### Métricas de Almacenamiento

```javascript
// Obtener estadísticas completas
const stats = await getStorageStats();
console.log(stats);
// {
//   totalSize: 1024000,
//   fileCount: 150,
//   categories: {
//     patients: { size: 500000, count: 75 },
//     resources: { size: 300000, count: 50 }
//   }
// }
```

### Logs de Auditoría

```javascript
// Automáticamente registra:
logger.info('File uploaded', {
  filePath: 'patients/documents/file.pdf',
  uploadedBy: 'user-123',
  patientId: 'patient-456',
  ipAddress: '192.168.1.1',
  timestamp: '2024-07-11T13:15:30Z'
});
```

## 🚨 Solución de Problemas

### Errores Comunes

**Error: "Upload directory not writable"**
```bash
# Verificar permisos
chmod 755 uploads/
chown -R www-data:www-data uploads/
```

**Error: "File type not allowed"**
```javascript
// Verificar tipos MIME permitidos
const validation = validateFile(file, category);
console.log(validation.errors);
```

**Error: "Patient access denied"**
```javascript
// Verificar roles y permisos del usuario
const hasAccess = hasPatientAccess(user, patientId);
```

### Limpieza de Archivos

```bash
# Limpiar archivos temporales
find uploads/system/temp -type f -mtime +7 -delete

# Limpiar archivos huérfanos (sin metadata)
find uploads -name "*.pdf" ! -name "*.meta.json" -type f
```

## 🔄 Migración a Producción

### Checklist de Deployment

- [ ] Configurar buckets de Google Cloud Storage
- [ ] Configurar service account y permisos
- [ ] Migrar archivos existentes
- [ ] Configurar CDN y caching
- [ ] Habilitar cifrado en tránsito
- [ ] Configurar respaldos automáticos
- [ ] Probar URLs firmadas
- [ ] Configurar monitoreo de costos

### Script de Migración

```bash
# Migrar archivos locales a GCS
gsutil -m cp -r uploads/* gs://mindhub-storage/

# Verificar integridad
gsutil ls -la gs://mindhub-storage/
```

## 📈 Optimización

### Rendimiento
- **Compresión**: Automática en GCS
- **Caching**: Headers apropiados por categoría
- **CDN**: Integración con Google Cloud CDN

### Costos
- **Lifecycle policies**: Archivado automático de archivos antiguos
- **Compresión**: Reducción de tamaño de almacenamiento
- **Cleanup**: Eliminación automática de archivos temporales

## 🆘 Soporte

Para problemas con el sistema de almacenamiento:

1. **Revisar logs**: `logs/storage.log`
2. **Ejecutar tests**: `npm run storage:test`
3. **Verificar permisos**: Archivos y directorios
4. **Comprobar configuración**: Variables de entorno

¡El sistema de almacenamiento de MindHub está listo para desarrollo y producción! 🎉