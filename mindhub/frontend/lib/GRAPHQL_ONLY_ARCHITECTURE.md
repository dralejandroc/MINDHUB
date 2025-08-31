# 🎯 GRAPHQL-ONLY ARCHITECTURE

## ✅ **ARQUITECTURA PURIFICADA - SOLO GRAPHQL**

Esta documentación establece que MindHub frontend usa **EXCLUSIVAMENTE GraphQL** y elimina cualquier dependencia REST API.

---

## 🚫 **DEPRECATED & FORBIDDEN**

### ❌ **NO USAR NUNCA:**
- REST API calls (`fetch('/api/...')`)
- Django REST endpoints (`/api/expedix/`, `/api/finance/`)
- Localhost references (`localhost:3000`, `localhost:3001`) 
- Mixed GraphQL/REST patterns
- `axios` or `fetch` for backend communication
- Hybrid clients or REST fallbacks

### 📁 **ARCHIVOS DEPRECATED:**
- `/lib/config/api-endpoints.ts` - **DEPRECATED** - Usar `/lib/config/graphql-endpoints.ts`
- `/lib/api/*-client.ts` - **DEPRECATED** - Usar GraphQL queries directamente
- Cualquier archivo con `rest`, `django-api`, o `hybrid` en el nombre

---

## ✅ **ARQUITECTURA GRAPHQL PURA**

### 🎯 **ÚNICA FUENTE DE DATOS:**
```typescript
// ✅ CORRECTO - Solo GraphQL
import { client } from '@/lib/apollo/client'
import { GET_PATIENTS } from '@/lib/apollo/queries/expedix/patients'

const { data } = await client.query({ query: GET_PATIENTS })
```

```typescript
// ❌ INCORRECTO - REST API
const response = await fetch('/api/expedix/patients/')
```

### 🔧 **CONFIGURACIÓN LIMPIA:**
- **Client**: `/lib/apollo/client.ts` - Apollo Client puro
- **Config**: `/lib/config/graphql-endpoints.ts` - Solo GraphQL
- **Queries**: `/lib/apollo/queries/` - Todas las operaciones
- **Hooks**: `/lib/hooks/useGraphQLServices.ts` - React hooks limpios

---

## 📊 **MÓDULOS COMPLETAMENTE MIGRADOS**

### ✅ **100% GraphQL - NO REST API**

1. **Expedix** - Gestión de pacientes
2. **Agenda** - Sistema de citas  
3. **ClinimetrixPro** - Evaluaciones psicométricas
4. **FormX** - Formularios dinámicos
5. **Finance** - Gestión financiera
6. **Resources** - Recursos médicos + Storage

### 🎣 **HOOK PRINCIPAL:**
```typescript
const { 
  dashboard, finance, storage, 
  patients, assessments, formSubmissions 
} = useMindHubComplete(userId, clinicId, workspaceId, 'individual')
```

---

## 🔒 **REGLAS DE DESARROLLO**

### ✅ **SIEMPRE:**
- Usar Apollo Client para todas las operaciones
- GraphQL queries y mutations exclusivamente
- Supabase como única base de datos
- Types generados de GraphQL schema
- Cache management con Apollo

### ❌ **NUNCA:**
- Llamadas REST API (`/api/...`)
- `fetch()` o `axios` para backend
- Referencias a Django REST framework
- Endpoints localhost hardcoded
- Mixed patterns (GraphQL + REST)

---

## 🧪 **TESTING GRAPHQL**

```typescript
// ✅ Testing puro GraphQL
import { graphqlIntegrationTester } from '@/lib/graphql-integration-test'

const testSuite = await graphqlIntegrationTester.runFullTestSuite()
```

---

## 🎯 **BENEFICIOS DE GRAPHQL PURO**

- **Sin errores 401** - Autenticación Supabase nativa
- **Performance optimizada** - Una sola request por operación
- **Type safety** - TypeScript generado automáticamente 
- **Cache inteligente** - Apollo Client cache management
- **Arquitectura limpia** - Sin confusión REST/GraphQL
- **Escalabilidad** - GraphQL subscriptions para tiempo real

---

## ⚠️ **MIGRACIÓN COMPLETA**

**ANTES (Problemático):**
```typescript
// ❌ Patrón problemático - REST + GraphQL mezclados
const patients = await fetch('/api/expedix/patients/')
const appointments = await client.query({ query: GET_APPOINTMENTS })
```

**DESPUÉS (Limpio):**
```typescript  
// ✅ Patrón limpio - Solo GraphQL
const { patients, appointments } = useMindHubComplete(userId)
```

---

## 🚀 **RESULTADO FINAL**

✅ **ARQUITECTURA 100% GRAPHQL**  
✅ **SIN DEPENDENCIAS REST API**  
✅ **CÓDIGO LIMPIO Y CONSISTENTE**  
✅ **PERFORMANCE OPTIMIZADA**  
✅ **TYPE SAFETY COMPLETO**  

**🎯 MindHub frontend es ahora una aplicación GraphQL pura sin confusiones ni dependencias REST.**