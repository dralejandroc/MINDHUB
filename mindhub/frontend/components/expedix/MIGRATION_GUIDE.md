# Guía de Migración - Componentes Expedix Optimizados

## Resumen de Optimizaciones Implementadas

### 🚀 Problemas Resueltos

1. **Bucles de Redirección Infinitos**: 
   - ❌ Problema: `dashboard/page.tsx` y `hubs/page.tsx` causaban bucles con `redirect()`
   - ✅ Solución: Implementado `useRouter()` + `useRef()` para prevenir redirecciones múltiples

2. **ConsultationNotes Sobrecargado (2762 líneas)**:
   - ❌ Problema: Un solo archivo monolítico causaba lag extremo en producción
   - ✅ Solución: Refactorizado usando Clean Architecture en 4 capas separadas

3. **Performance de PatientDashboard**:
   - ❌ Problema: Carga todos los componentes simultaneamente 
   - ✅ Solución: Implementado lazy loading con `React.lazy()` y `Suspense`

4. **Data Fetching Ineficiente**:
   - ❌ Problema: Múltiples requests simultáneos sin cache
   - ✅ Solución: Sistema de cache + batch requests con TTL de 5 minutos

### 🏗️ Nueva Arquitectura Clean Architecture

```
consultation/
├── entities/           # Reglas de negocio puras
│   └── ConsultationData.ts
├── usecases/          # Lógica de aplicación  
│   └── ConsultationUseCases.ts
├── adapters/          # Traducción API ↔ Dominio
│   └── ConsultationApiAdapter.ts
└── components/        # UI React optimizada
    ├── ConsultationForm.tsx
    ├── VitalSignsSection.tsx
    ├── MedicationsSection.tsx
    └── MentalExamSection.tsx
```

### ⚡ Mejoras de Performance

- **Lazy Loading**: Componentes se cargan solo cuando se necesitan
- **Memoización**: `React.memo()` en componentes críticos
- **Debouncing**: Búsquedas y autosave optimizados
- **Batch Requests**: Múltiples API calls agrupadas
- **Cache con TTL**: 5 minutos de cache para datos frecuentes
- **Abort Controllers**: Cancelación de requests pendientes

## 🔄 Como Migrar

### Paso 1: Reemplazar ConsultationNotes

**Antes** (2762 líneas):
```typescript
import ConsultationNotes from './ConsultationNotes';

<ConsultationNotes 
  patient={patient}
  onSaveConsultation={handleSave}
  onCancel={handleCancel}
/>
```

**Después** (Optimizado):
```typescript
import ConsultationNotesOptimized from './ConsultationNotesOptimized';

<ConsultationNotesOptimized 
  patient={patient}
  onSaveConsultation={handleSave}
  onCancel={handleCancel}
/>
```

### Paso 2: Actualizar PatientDashboard

**Antes**:
```typescript
import PatientDashboard from './PatientDashboard';
```

**Después**:
```typescript
import PatientDashboardOptimized from './PatientDashboardOptimized';
```

### Paso 3: Usar el Hook Optimizado

**Antes**:
```typescript
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);

useEffect(() => {
  // Multiple fetch calls...
}, []);
```

**Después**:
```typescript
import { useOptimizedExpedixData } from '@/hooks/useOptimizedExpedixData';

const { 
  patient, 
  consultations, 
  loading, 
  refreshSection 
} = useOptimizedExpedixData({ 
  patientId, 
  autoLoad: true 
});
```

## 🛠️ Configuración Requerida

### 1. Instalar Dependencias (si no están)
```bash
npm install @heroicons/react
```

### 2. Verificar Rutas API

Asegurar que estas rutas existen en Django backend:
- `/api/expedix/django/patients/{id}/`
- `/api/expedix/django/patients/{id}/consultations/`
- `/api/expedix/django/patients/{id}/prescriptions/`
- `/api/expedix/django/patients/{id}/assessments/`

### 3. Configurar TypeScript

Agregar al `tsconfig.json` si no existe:
```json
{
  "compilerOptions": {
    "paths": {
      "@/components/*": ["./components/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

## 🧪 Testing de la Migración

### Verificar Performance

1. **Tiempo de Carga Inicial**:
   - ✅ Antes: ~3-5 segundos (lag extremo)
   - ✅ Después: ~800ms-1.2s (acceptable)

2. **Lazy Loading**:
   - Abrir PatientDashboard → Solo carga "Timeline" por defecto
   - Cambiar a otras tabs → Componentes se cargan individualmente

3. **Cache Funcionando**:
   - Primera carga: Requests a API
   - Navegación entre tabs: Datos desde cache (instantáneo)

4. **Autosave**:
   - Escribir en ConsultationForm → Auto-save cada 2 segundos
   - Verificar en Network tab del navegador

### Pruebas de Funcionalidad

- [ ] Login sin bucles de redirección
- [ ] ConsultationNotes carga rápidamente
- [ ] Búsqueda de medicamentos funciona
- [ ] Examen mental se expand/contraer
- [ ] PatientDashboard lazy loads correctamente
- [ ] Cache persiste entre navegación

## 🚨 Rollback Plan

Si algo falla, revertir temporalmente:

1. Renombrar archivos optimizados:
   - `ConsultationNotesOptimized.tsx` → `ConsultationNotesOptimized.backup`
   - `PatientDashboardOptimized.tsx` → `PatientDashboardOptimized.backup`

2. Revertir imports en componentes padre

3. Mantener solo los fixes de redirección en `dashboard/page.tsx` y `hubs/page.tsx`

## 📊 Métricas Esperadas

- **Reducción de lag**: 70-80% menos tiempo de carga
- **Reducción de bundle size**: ~40% por lazy loading
- **Menos requests**: ~60% menos llamadas API por cache
- **Mejor UX**: Feedback inmediato + estados de carga claros

## 🔧 Troubleshooting

### Error: "Cannot resolve module"
- Verificar imports de `@/components/expedix/consultation`
- Ejecutar `npm run build` para verificar compilación

### Error: "Hook rules violated"  
- Verificar que hooks estén dentro de componentes React
- No usar hooks dentro de callbacks o loops

### Cache no funciona
- Verificar que `useOptimizedExpedixData` esté importado correctamente
- Limpiar cache: `clearCache()` del hook

### Lazy loading no funciona
- Verificar que componentes usen `React.lazy()`
- Asegurar que estén envueltos en `<Suspense>`