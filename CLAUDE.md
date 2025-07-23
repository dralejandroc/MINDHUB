# MindHub - Healthcare Management Platform

## Project Overview

MindHub es una plataforma integral de gestión sanitaria que integra múltiples módulos especializados para clínicas y profesionales de la salud.

### Arquitectura del Sistema

```
MindHub/
├── frontend/          # Next.js 14.2.30 con App Router + React 18 + TypeScript + Tailwind CSS
├── backend/           # Node.js + Express + Prisma ORM
└── mindhub/           # Proyecto principal con todos los módulos
    ├── frontend/      # Aplicación web principal
    ├── backend/       # API central y microservicios
    └── MVP_SIMPLE.html # Prototipo inicial
```

## Módulos Principales

### 1. **Expedix** - Gestión de Pacientes y Expedientes Médicos
- **URL**: `/hubs/expedix`
- **Puerto API**: `http://localhost:8080`
- **Funcionalidades**:
  - Gestión completa de pacientes (CRUD)
  - Expedientes médicos digitales
  - Sistema de consultas médicas
  - Generación de recetas digitales
  - Historial médico completo
  - Portal de pacientes
  - Documentos médicos encriptados

### 2. **Clinimetrix** - Escalas y Evaluaciones Clínicas
- **URL**: `/hubs/clinimetrix`
- **Puerto API**: `http://localhost:8081`
- **Funcionalidades**:
  - Evaluaciones psicológicas y clínicas
  - Escalas estandarizadas (GDS-30, PHQ-9, GAD-7, etc.)
  - Sistema de preguntas adaptativo
  - Reportes automáticos de resultados
  - Integración con expedientes de pacientes

### 3. **FormX** - Generador de Formularios
- **URL**: `/hubs/formx`
- **Puerto API**: `http://localhost:8083`
- **Funcionalidades**:
  - Creación de formularios personalizados
  - Templates médicos preconfigurrados
  - Formularios de registro de pacientes
  - Validación automática de datos

### 4. **Agenda** - Sistema de Citas y Programación
- **URL**: `/hubs/agenda`
- **Funcionalidades**:
  - Programación de citas médicas
  - Gestión de horarios
  - Notificaciones automáticas
  - Lista de espera
  - Confirmación de citas

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 14.2.30 con App Router
- **UI Library**: React 18 con TypeScript
- **Styling**: Tailwind CSS + CSS Variables personalizadas
- **Componentes**: Sistema de componentes unificado
- **Estado**: Context API + useState/useEffect
- **Autenticación**: Auth0 (configurado pero opcional)

### Backend
- **Runtime**: Node.js con Express
- **Base de Datos**: Prisma ORM con SQLite/MySQL (MAMP)
- **API**: RESTful APIs por módulo
- **Archivos**: Sistema de archivos local + encriptación

### Infraestructura de Desarrollo
- **Desarrollo**: http://localhost:3000 (Frontend) + http://localhost:8080-8084 (APIs)
- **Base de Datos**: MAMP (MySQL/PHP/Apache)
- **Hot Reload**: Next.js development server
- **Build**: `npm run build`

## Configuración del Proyecto

### Variables de Entorno (.env.local)
```bash
# Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080

# APIs de Módulos
NEXT_PUBLIC_EXPEDIX_API=http://localhost:8080
NEXT_PUBLIC_CLINIMETRIX_API=http://localhost:8081
NEXT_PUBLIC_FORMX_API=http://localhost:8083
NEXT_PUBLIC_RESOURCES_API=http://localhost:8084

# Auth0 (Opcional)
AUTH0_SECRET='bd199bdccabaa8310c5ba2ddbbd916df9fe68fe8412d6ca8308d586c3f9aef88'
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://dev-ffj4w4zikq3uwmwv.us.auth0.com
```

### Comandos Principales
```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo en puerto 3000
npm run build        # Construye aplicación para producción
npm run start        # Inicia servidor de producción
npm run lint         # Ejecuta linting
npm run typecheck    # Verificación de tipos TypeScript

# Base de datos (desde /backend)
npm run dev          # Inicia APIs en puertos 8080-8084
npx prisma studio    # Interface visual de base de datos
npx prisma generate  # Regenera cliente Prisma
```

## Arquitectura de Componentes

### Sistema de Diseño Unificado

#### Layout Components
- `UnifiedSidebar` - Sidebar responsivo y colapsible para todos los hubs
- `PageHeader` - Header estandarizado con título, descripción e íconos
- `MainApp` - Componente principal con navegación

#### UI Components (/components/ui/)
- `Button` - Botones con variantes (primary, outline, ghost)
- `Card` - Contenedores con sombras y bordes
- `Input` - Inputs con validación y estados
- `LoadingSpinner` - Indicadores de carga
- `Modal` - Modales responsivos

#### Componentes Específicos por Hub
- `/expedix/` - PatientManagement, ConsultationForm, PatientDashboard
- `/clinimetrix/` - UniversalScaleAssessment, question types
- `/formx/` - FormBuilder, TemplateManager
- `/agenda/` - CalendarView, AppointmentModal

### Context API
- `UserMetricsContext` - Seguimiento de métricas de usuario y dashboard adaptativo
- `UniversalScalesContext` - Gestión de escalas clínicas

## Funcionalidades Implementadas

### ✅ Completadas Recientemente

1. **Sistema de Sidebar Unificado**
   - Sidebar colapsible por defecto
   - Navegación consistente entre hubs
   - Diseño responsivo

2. **Standardización de Headers**
   - PageHeader componente unificado
   - Íconos y colores consistentes por hub

3. **Dashboard Adaptativo**
   - Dashboard de principiante vs avanzado
   - Cambio automático basado en métricas de uso
   - Controles de administrador

4. **Integración Real de Base de Datos**
   - Eliminación completa de datos mock
   - APIs conectadas a MAMP/MySQL
   - PatientManagement con datos reales

5. **Sistema de Escalas Clínicas**
   - Componentes de preguntas (Likert, Dichotomous, etc.)
   - Evaluaciones universales
   - Integración con expedientes

6. **Fixes de UI/UX**
   - Eliminación de opciones duplicadas en escalas
   - Corrección de nombres de pacientes
   - Consistencia visual en todas las páginas

### 🚧 En Desarrollo

1. **Módulo de Agenda**
   - Sistema de citas completo
   - Integración con Google Calendar
   - Notificaciones automáticas

2. **Sistema de Reportes**
   - Generación automática de PDFs
   - Reportes de evaluaciones clínicas
   - Dashboard de métricas

### 📋 Próximas Funcionalidades

1. **Portal de Pacientes**
   - Acceso autónomo para pacientes
   - Confirmación de citas online
   - Descarga de documentos

2. **Sistema de Recursos**
   - Biblioteca de recursos médicos
   - Envío automatizado a pacientes
   - Templates personalizables

## Principios de Desarrollo

### 🎨 Diseño
- **Colores Primarios**: `--primary-500` (azul), `--secondary-500` (verde)
- **Tipografía**: Inter font family
- **Espaciado**: Sistema de 8px base
- **Sombras**: `var(--shadow)` para consistencia

### 📱 Responsividad
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-optimized para tablets

### 🔒 Seguridad
- Encriptación de documentos médicos
- Validación de datos en frontend y backend
- HIPAA compliance preparedness

### 🧪 Testing
- Jest para unit tests
- Cypress para integration tests
- Storybook para componentes UI

## Estructura de Archivos Clave

```
mindhub/frontend/
├── app/
│   ├── hubs/
│   │   ├── expedix/page.tsx          # Hub principal de Expedix
│   │   ├── clinimetrix/page.tsx      # Hub principal de Clinimetrix
│   │   ├── agenda/page.tsx           # Hub principal de Agenda
│   │   └── layout.tsx                # Layout compartido de hubs
│   ├── layout.tsx                    # Layout raíz
│   └── page.tsx                      # Dashboard principal
├── components/
│   ├── layout/
│   │   ├── UnifiedSidebar.tsx        # Sidebar unificado
│   │   └── PageHeader.tsx            # Header estandarizado
│   ├── ui/                           # Componentes base
│   ├── expedix/                      # Componentes de Expedix
│   ├── clinimetrix/                  # Componentes de Clinimetrix
│   └── agenda/                       # Componentes de Agenda
├── lib/
│   ├── api/                          # Clientes API por módulo
│   ├── utils/                        # Utilidades compartidas
│   └── design-system.ts              # Sistema de diseño
├── contexts/                         # Context API providers
├── styles/
│   └── globals.css                   # Estilos globales y CSS variables
└── middleware.ts                     # Middleware de Next.js
```

## Debugging y Troubleshooting

### Problemas Comunes

1. **Error 500 en APIs**
   - Verificar que MAMP esté ejecutándose
   - Revisar conexión a base de datos
   - Comprobar sintaxis de queries Prisma

2. **Datos Mock Apareciendo**
   - Limpiar cache del navegador (Ctrl+Shift+R)
   - Verificar que se esté usando el componente correcto
   - Revisar console.log para debugging

3. **Problemas de Build**
   - Ejecutar `npm run typecheck`
   - Verificar imports/exports
   - Revisar variables de entorno

### Herramientas de Debug
```bash
# Logging detallado
console.log('🔄 Fetching...', data)
console.log('📊 Response:', response)
console.log('❌ Error:', error)

# Network debugging
curl -s http://localhost:8080/api/v1/expedix/patients | jq '.'

# Database debugging
npx prisma studio  # Visual database explorer
```

## Estado Actual del Desarrollo

### ✅ Módulos Funcionales
- **Expedix**: 95% completo - CRUD pacientes, consultas, recetas
- **Clinimetrix**: 90% completo - Evaluaciones, escalas, reportes
- **FormX**: 80% completo - Generador básico de formularios
- **Agenda**: 60% completo - Estructura básica, falta integración

### 🎯 Objetivos Inmediatos
1. Completar módulo de Agenda
2. Implementar sistema de reportes PDF
3. Desarrollar portal de pacientes
4. Optimizar rendimiento general

### 💡 Innovaciones Técnicas
- Dashboard adaptativo basado en métricas de uso
- Sistema de componentes completamente unificado
- Integración real sin datos mock
- Arquitectura modular escalable

---

## Task Master Integration (Opcional)

Si necesitas usar Task Master para gestión de tareas:

### Comandos Básicos
```bash
task-master list                    # Ver tareas
task-master next                    # Siguiente tarea
task-master set-status --id=X --status=done  # Marcar completada
```

### MCP Integration
Configurado en `.mcp.json` si se necesita integración con Claude Code.

---

*Este documento se actualiza continuamente para reflejar el estado actual del proyecto MindHub.*