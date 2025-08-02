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
- **Puerto API**: `http://localhost:3002` (actualizado)
- **Funcionalidades**:
  - Sistema universal de aplicación de escalas clínicas
  - Escalas científicamente validadas con documentación completa
  - Soporte para escalas con características diferentes
  - Evaluaciones psicológicas y clínicas
  - Reportes automáticos de resultados
  - Integración con expedientes de pacientes
  
**ESTADO ACTUAL - SISTEMA UNIVERSAL DE ESCALAS IMPLEMENTADO:**
- ✅ Base de datos unificada para todas las escalas
- ✅ 3 escalas diferentes completamente funcionales:
  - **STAI**: 40 ítems, 2 subescalas, opciones globales estándar
  - **Cuestionario Salamanca**: 22 ítems, 11 subescalas (trastornos personalidad)
  - **BDI-21**: 21 ítems, 4 subescalas, 99 opciones específicas por ítem
- ✅ Frontend sin datos mock/hardcodeados
- ✅ API client completo para conexión con backend
- ✅ Documentación científica completa por escala
- ✅ Sistema preparado para escalas con cualquier característica

**ARQUITECTURA DE BASE DE DATOS:**
- `scales` - Registro de todas las escalas
- `scale_items` - Todos los ítems de todas las escalas  
- `scale_response_options` - Opciones globales compartidas
- `scale_item_specific_options` - Opciones únicas por ítem (nueva tabla)
- `scale_subscales` - Subescalas de todas las escalas
- `scale_interpretation_rules` - Reglas de interpretación
- `scale_documentation` - Documentación científica completa

### 3. **FormX** - Generador de Formularios
- **URL**: `/hubs/formx`
- **Puerto API**: `http://localhost:8083`
- **Funcionalidades**:
  - Creación de formularios personalizados
  - Templates médicos preconfigurrradors
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
- **Base de Datos**: Prisma ORM con MySQL (MAMP puerto 8889) - ÚNICO para todo el proyecto
- **API**: RESTful APIs por módulo
- **Archivos**: Sistema de archivos local + encriptación

### Infraestructura de Desarrollo
- **Desarrollo**: http://localhost:3000 (Frontend) + http://localhost:8080-8084 (APIs)
- **Base de Datos**: MAMP (MySQL/PHP/Apache)
- **Hot Reload**: Next.js development server
- **Build**: `npm run build`

### Principios de Desarrollo

## Principios de Desarrollo Específicos

### Gestión de Datos y Backend
- **Base de Datos Única MySQL**: 
  - Todo el proyecto usa ÚNICAMENTE MySQL a través de MAMP (puerto 8889)
  - Todas las operaciones de base de datos deben usar Prisma ORM
  - NO usar SQLite ni conexiones directas a bases de datos
  - Todos los datos deben estar en el backend y en MySQL
  - Ajustar tablas según sea necesario para cada cambio
  - Cambios solicitados deben implementarse tanto en frontend como backend

## Principios de Implementación de Cambios
- Cuando se pida implementar un cambio, este debe ser completo, agregando todo lo necesario para que la función funcione:
  - No solo visualmente, sino funcionalmente
  - Conectar todos los endpoints
  - Dirigir a donde debe ir
  - Guardar en el backend en asociación con el usuario
  - Registrar todo completamente
  - En fase avanzada de desarrollo, todo debe quedar funcionando de manera integral

## Sistema Universal de Escalas Clínicas

### Principios del Sistema Universal
- **Una sola base de datos** para todas las escalas, sin importar sus diferencias
- **Flexibilidad total** para manejar escalas con características completamente diferentes
- **Lógica simple** para el sistema universal de aplicación en cards
- **Escalas públicas** accesibles a todos los usuarios de MindHub
- **Registro de aplicaciones** por usuario (no acceso a escalas)
- **Documentación científica** completa y validada por escala

### Flujo de Trabajo para Nuevas Escalas
1. **Recibir escala** en formato markdown con JSON validado
2. **Analizar estructura** y identificar características únicas
3. **Adaptar tablas** si es necesario para nuevas características
4. **Generar SQL manual** para importación segura
5. **Validar importación** verificando integridad de datos
6. **Documentar cambios** y continuar con siguiente escala

### Próximos Pasos
- Continuar agregando escalas una por una
- Ir refinando el sistema según nuevas características encontradas
- Mantener compatibilidad con sistema universal de aplicación
- Escalar hasta 100+ escalas manteniendo rendimiento y simplicidad

## Recordatorios de Desarrollo
- No hagas commit ni push en github hasta que yo te lo pida. me puedes preguntar, pero no lo hagas sin que me autorice