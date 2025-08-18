# 🧹 GUÍA DE MIGRACIÓN LIMPIA - MINDHUB

## ✅ MIGRACIÓN COMPLETADA

Este documento explica los cambios realizados en la migración limpia del sistema MindHub.

## 🗑️ ELEMENTOS ELIMINADOS

### Tablas Legacy de Escalas (ELIMINADAS)
- ❌ `scales`
- ❌ `scale_items`
- ❌ `scale_administrations`
- ❌ `scale_interpretation_rules`
- ❌ `scale_subscales`
- ❌ `scale_response_options`
- ❌ `scale_response_groups`
- ❌ `scale_item_specific_options`
- ❌ `scale_subscale_scores`
- ❌ `scale_documentation`
- ❌ `user_favorite_scales`
- ❌ `item_responses`

### Tablas Legacy de Formularios (ELIMINADAS)
- ❌ `forms` (duplicada/confusa)
- ❌ `form_submissions` (reemplazada)
- ❌ `form_instances` (reemplazada)
- ❌ `form_assignments` (reemplazada)
- ❌ `form_analytics` (simplificada)
- ❌ `form_categories` (simplificada)

## ✅ NUEVO SISTEMA ÚNICO

### Base de Datos: PostgreSQL Única
- 🐘 **PostgreSQL** como única base de datos
- 🔗 **UUID** como claves primarias
- 📊 **JSONB** para datos estructurados
- ⚡ **Índices optimizados**

### Tablas Principales (ÚNICAS)
- ✅ `users` - Usuarios con Clerk integration
- ✅ `patients` - Pacientes únicos
- ✅ `medical_history` - Historial médico
- ✅ `consultations` - Consultas médicas
- ✅ `clinimetrix_registry` - Catálogo de escalas
- ✅ `clinimetrix_templates` - Templates de escalas
- ✅ `clinimetrix_assessments` - Evaluaciones aplicadas
- ✅ `clinimetrix_remote_assessments` - Evaluaciones remotas
- ✅ `form_templates` - Templates de formularios
- ✅ `patient_form_assignments` - Asignaciones a pacientes
- ✅ `clinic_configurations` - Configuraciones

### APIs Únicas y Consolidadas
- ✅ `/api/expedix/*` - Gestión de pacientes
- ✅ `/api/clinimetrix-pro/*` - Evaluaciones clínicas
- ✅ `/api/formx/*` - Formularios dinámicos

## 🚀 PASOS PARA ACTIVAR EL SISTEMA LIMPIO

### OPCIÓN A: USAR SUPABASE (RECOMENDADO)

#### 1. Crear proyecto en Supabase
```bash
# 1. Ve a https://supabase.com y crea una cuenta
# 2. Crea un nuevo proyecto
# 3. Copia las credenciales del dashboard
```

#### 2. Configurar con el script automático
```bash
# Ejecutar script de configuración
./scripts/setup-database.sh

# Selecciona opción 1 (Supabase)
# Ingresa las credenciales cuando se soliciten
```

### OPCIÓN B: USAR POSTGRESQL LOCAL

#### 1. Instalar PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Linux
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 2. Configurar con el script automático
```bash
# Ejecutar script de configuración
./scripts/setup-database.sh

# Selecciona opción 2 (PostgreSQL local)
# Sigue las instrucciones
```

### 3. Ejecutar Migración
```bash
# Instalar dependencias PostgreSQL
npm install pg @types/pg

# Generar cliente Prisma
npm run generate:clean

# Aplicar esquema a base de datos
npm run db:push:clean

# Iniciar servidor limpio
npm run start:clean
```

### 4. Verificar Sistema
```bash
# Health check
curl http://localhost:3002/health

# API endpoints
curl http://localhost:3002/api

# Expedix patients
curl http://localhost:3002/api/expedix/patients

# ClinimetrixPro templates
curl http://localhost:3002/api/clinimetrix-pro/templates/catalog

# FormX templates
curl http://localhost:3002/api/formx/templates
```

## 🔧 ARCHIVOS MODIFICADOS

### Backend
- ✅ `prisma/schema.prisma` → Esquema PostgreSQL único
- ✅ `server.js` → Server limpio sin legacy
- ✅ `routes/API_ENDPOINTS_UNIFIED.js` → APIs consolidadas
- ✅ `migrations/CLEAN_MIGRATION_POSTGRESQL.sql` → Migración SQL

### Frontend
- ✅ `lib/api/formx-unified-client.ts` → Cliente FormX único
- ✅ `components/formx/FormXPatientAssignment.tsx` → Actualizado

### Respaldos Creados
- 📦 `prisma/schema-backup-legacy.prisma`
- 📦 `server-backup-legacy.js`

## ⚠️ NOTAS IMPORTANTES

1. **Todas las tablas legacy fueron eliminadas** - No hay vuelta atrás sin respaldo
2. **PostgreSQL es obligatorio** - MySQL ya no es compatible
3. **Clerk es el único sistema de auth** - No hay auth custom
4. **APIs consolidadas** - Solo un endpoint por funcionalidad
5. **UUIDs en todas las claves primarias** - Mejor escalabilidad

## 🎉 BENEFICIOS DEL SISTEMA LIMPIO

- ❌ **Sin duplicados** - Una sola fuente de verdad
- ⚡ **Mayor performance** - PostgreSQL optimizado
- 🔧 **Fácil mantenimiento** - Código consolidado
- 🚀 **Deploy más rápido** - Sin dependencias legacy
- 🔒 **Mejor seguridad** - Clerk authentication
- 📊 **Mejor escalabilidad** - UUIDs y JSONB

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Tabla no existe"
```bash
npm run db:push:clean
```

### Error: "Prisma client not generated"
```bash
npm run generate:clean
```

### Error: "PostgreSQL connection failed"
1. Verificar que PostgreSQL esté corriendo
2. Verificar DATABASE_URL en .env
3. Verificar que la base de datos existe

### Error: "Clerk authentication failed"
1. Verificar CLERK_SECRET_KEY en .env
2. Verificar configuración en https://clerk.com
3. Verificar que el frontend tiene CLERK_PUBLISHABLE_KEY

---

## 📧 SOPORTE

Si encuentras problemas con la migración limpia:
1. Verificar que todos los pasos se siguieron
2. Revisar logs del servidor
3. Consultar esta documentación
4. Restaurar desde backup si es necesario

**¡Sistema MindHub limpio y optimizado activado! 🎉**
