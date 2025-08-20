# MindHub Test Data Creation Guide

Este documento explica cómo crear datos de prueba para la plataforma MindHub, incluyendo el usuario **Dr. Alejandro Contreras** y pacientes de prueba.

## 📁 Archivos Creados

### 1. **check-database-status.js**
Script para verificar el estado actual de la base de datos y qué datos ya existen.

### 2. **create-minimal-test-data.js**
Script básico que crea:
- Dr. Alejandro Contreras como usuario
- 3 pacientes básicos
- 1 consulta de ejemplo

### 3. **create-test-data.js**
Script completo que crea:
- Dr. Alejandro Contreras con rol de psiquiatra
- 6 pacientes detallados con información completa
- 3 consultas de ejemplo
- Historial médico inicial para cada paciente

## 🚀 Instrucciones de Uso

### Paso 1: Verificar Estado Actual
```bash
cd /Users/alekscon/taskmaster-ai/mindhub/backend
npm run data:check
```

### Paso 2: Crear Datos de Prueba

#### Opción A: Datos Mínimos (Recomendado para empezar)
```bash
npm run data:create-minimal
```

#### Opción B: Datos Completos
```bash
npm run data:create-full
```

### Paso 3: Verificar Datos Creados
```bash
npm run data:check
```

## 👨‍⚕️ Usuario Principal Creado

**Dr. Alejandro Contreras**
- **Email**: `dr_aleks_c@hotmail.com`
- **Nombre**: Dr. Alejandro Contreras
- **Rol**: Psiquiatra (en script completo)
- **Auth0 ID**: Generado automáticamente

## 👥 Pacientes de Prueba

### Script Mínimo (3 pacientes):
1. **María González** - EXP-2025-0001
2. **Carlos Rodríguez** - EXP-2025-0002  
3. **Ana Martínez** - EXP-2025-0003

### Script Completo (6 pacientes):
1. **María Elena García López** - Con CURP, dirección completa
2. **Carlos Rodríguez Martínez** - Guadalajara, Jalisco
3. **Ana Sofía Hernández Vázquez** - Con alergias múltiples
4. **Luis Miguel Torres Jiménez** - Cancún, Quintana Roo
5. **Patricia Morales Ruiz** - Puebla, Puebla
6. **Roberto Sánchez Flores** - CDMX, con alergias a polen

## 🗄️ Estructura de Base de Datos

### Modelos Principales:
- **User**: Usuarios del sistema (médicos, administradores)
- **Patient**: Pacientes con expedientes médicos
- **Consultation**: Consultas médicas
- **MedicalHistory**: Historial médico
- **Scale**: Escalas clínicas (PHQ-9, GAD-7, etc.)
- **ScaleAdministration**: Aplicaciones de escalas

### Campos Requeridos:

#### User:
- `auth0Id` (único)
- `email` (único)
- `name`

#### Patient:
- `medicalRecordNumber` (único, formato: EXP-YYYY-NNNN)
- `firstName`, `lastName`
- `dateOfBirth`
- `gender` (male, female, other, prefer_not_to_say)
- `createdBy` (referencia a User)

## 🔧 Configuración Técnica

### Base de Datos:
- **Motor**: MySQL via MAMP
- **Puerto**: 8889
- **Base de datos**: `mindhub`
- **Usuario**: `root`
- **Contraseña**: `root`

### Prisma:
- **Cliente**: `./generated/prisma`
- **Schema**: `./prisma/schema.prisma`

## 🎯 Casos de Uso

### 1. **Desarrollo Inicial**
```bash
npm run data:create-minimal
```
Perfecto para empezar a desarrollar y probar funcionalidades básicas.

### 2. **Testing Completo**
```bash
npm run data:create-full
```
Ideal para probar todas las funcionalidades del sistema con datos realistas.

### 3. **Verificación**
```bash
npm run data:check
```
Para ver qué datos ya existen antes de crear nuevos.

## 🚨 Notas Importantes

### Prevención de Duplicados:
- Los scripts usan `upsert` para evitar duplicar el doctor
- Los números de expediente se generan automáticamente
- Se verifica la existencia de datos antes de crear

### Datos Sensibles:
- Los CURPs son ficticios pero siguen el formato correcto
- Los teléfonos usan prefijo +52-555 (ficticios)
- Las direcciones son ejemplos realistas

### Logs y Debugging:
- Los scripts muestran progreso detallado
- Errores comunes tienen mensajes específicos
- Se desconecta automáticamente de Prisma

## 🔍 Troubleshooting

### Error P2002 (Constraint violation):
```
❌ Error de duplicado. Verifica que no existan registros duplicados.
```
**Solución**: Ejecuta `npm run data:check` para ver datos existentes.

### Error P1001 (Cannot connect):
```
🔌 No se puede conectar a la base de datos
💡 Verifica que MAMP esté ejecutándose en puerto 8889
```
**Solución**: 
1. Inicia MAMP
2. Verifica que MySQL esté en puerto 8889
3. Confirma que la base de datos `mindhub` existe

### Error P2021 (Table not found):
```
🗄️ La tabla no existe
💡 Ejecuta: npx prisma migrate dev
```
**Solución**:
```bash
npx prisma migrate dev
npx prisma generate
```

## 📊 Verificación Post-Creación

Después de ejecutar los scripts, verifica en el frontend:

1. **Módulo Expedix**: `/hubs/expedix`
   - Debe mostrar los pacientes creados
   - Números de expediente deben ser únicos

2. **Módulo Clinimetrix**: `/hubs/clinimetrix`
   - Puedes crear evaluaciones para los pacientes
   - Escalas disponibles (PHQ-9, GAD-7, etc.)

3. **Dashboard Principal**: `/hubs`
   - Métricas actualizadas con nuevos datos

## 🎉 ¡Listo para Usar!

Una vez ejecutados los scripts, puedes:
- Iniciar sesión como Dr. Alejandro Contreras
- Ver y gestionar los pacientes creados
- Crear nuevas consultas y evaluaciones
- Probar todas las funcionalidades del sistema

---

**Contacto**: Para dudas sobre la estructura de datos o scripts, consulta la documentación del proyecto o el equipo de desarrollo.