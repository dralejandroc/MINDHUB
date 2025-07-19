# Sistema de Migración Automática - MindHub Universal Scales

Este directorio contiene scripts para gestionar la base de datos del sistema universal de escalas clinimétricas.

## Scripts Disponibles

### 🔧 `run-migrations.js`
Ejecuta migraciones de base de datos y seeds automáticamente.

```bash
node scripts/run-migrations.js
# o
npm run universal:migrate
```

**Funcionalidades:**
- Crea tabla de control de migraciones
- Ejecuta archivos SQL en orden secuencial
- Omite migraciones ya ejecutadas
- Aplica seeds de escalas
- Verifica estructura de BD
- Muestra estadísticas finales

### 🔄 `reset-database.js`
Elimina la base de datos actual y la recrea desde cero.

```bash
node scripts/reset-database.js
# o
npm run universal:reset
```

**⚠️ CUIDADO:** Esta operación es destructiva y eliminará todos los datos.

### ➕ `add-scale.js`
Herramienta para agregar nuevas escalas al sistema.

```bash
# Crear template JSON
node scripts/add-scale.js gad7 --template

# Generar SQL seed desde template
node scripts/add-scale.js gad7 --generate

# o usar NPM
npm run universal:add-scale gad7 --template
```

**Workflow:**
1. Crear template: `node add-scale.js nueva-escala --template`
2. Editar archivo JSON en `database/templates/nueva-escala.json`
3. Generar SQL: `node add-scale.js nueva-escala --generate`
4. Aplicar: `npm run universal:migrate`

### 🛠️ `dev-tools.js`
Herramienta unificada para operaciones de desarrollo.

```bash
node scripts/dev-tools.js
# o
npm run universal:dev
```

**Comandos disponibles:**
- `migrate` - Ejecutar migraciones
- `reset-db` - Resetear base de datos
- `db-stats` - Mostrar estadísticas
- `add-scale` - Crear nueva escala
- `list-scales` - Listar escalas existentes
- `start-dev` - Iniciar servidor de desarrollo
- `test-api` - Probar endpoints API
- `backup-db` - Crear backup
- `clean` - Limpiar archivos temporales

## Estructura de Directorios

```
backend/
├── scripts/
│   ├── run-migrations.js      # Ejecutor de migraciones
│   ├── reset-database.js      # Reset de BD
│   ├── add-scale.js           # Agregar escalas
│   ├── dev-tools.js           # Herramientas unificadas
│   └── README.md              # Este archivo
├── database/
│   ├── migrations/            # Archivos de migración SQL
│   ├── seeds/                 # Seeds de escalas
│   └── templates/             # Templates JSON para escalas
├── backups/                   # Backups automáticos
└── mindhub.db                 # Base de datos SQLite
```

## Flujo de Trabajo Típico

### 1. Configuración Inicial
```bash
# Crear base de datos y aplicar migraciones
npm run universal:migrate

# Verificar que todo está correcto
npm run universal:stats
```

### 2. Agregar Nueva Escala
```bash
# Crear template
npm run universal:add-scale beck-depression --template

# Editar database/templates/beck-depression.json
# ... configurar escala ...

# Generar seed SQL
npm run universal:add-scale beck-depression --generate

# Aplicar a la base de datos
npm run universal:migrate
```

### 3. Desarrollo Diario
```bash
# Ver escalas disponibles
npm run universal:list-scales

# Estadísticas de BD
npm run universal:stats

# Backup antes de cambios importantes
npm run universal:backup

# Limpiar archivos temporales
npm run universal:clean
```

### 4. Reset Completo (si es necesario)
```bash
# ⚠️ CUIDADO: Elimina todos los datos
npm run universal:reset
```

## Formato de Template JSON

```json
{
  "scale": {
    "id": "mi-escala",
    "name": "Mi Escala de Ejemplo",
    "abbreviation": "MEE",
    "category": "categoria",
    "description": "Descripción de la escala",
    "totalItems": 5,
    "estimatedDurationMinutes": 10,
    "administrationMode": "self_administered",
    "targetPopulation": "adultos",
    "scoringMethod": "sum",
    "scoreMin": 0,
    "scoreMax": 20
  },
  "responseOptions": [
    {
      "id": "mi-escala-opt-0",
      "value": "0",
      "label": "Nunca",
      "score": 0,
      "orderIndex": 1
    }
  ],
  "items": [
    {
      "id": "mi-escala-item-1",
      "number": 1,
      "text": "Pregunta 1",
      "alertTrigger": false
    }
  ],
  "interpretationRules": [
    {
      "id": "mi-escala-int-minimal",
      "minScore": 0,
      "maxScore": 4,
      "severityLevel": "minimal",
      "label": "Mínimo",
      "color": "#27AE60"
    }
  ]
}
```

## Comandos NPM Disponibles

```bash
# Migraciones
npm run universal:migrate      # Ejecutar migraciones
npm run universal:reset        # Reset completo de BD

# Gestión de escalas
npm run universal:add-scale    # Agregar nueva escala
npm run universal:list-scales  # Listar escalas

# Desarrollo
npm run universal:dev          # Herramientas de desarrollo
npm run universal:stats        # Estadísticas de BD
npm run universal:backup       # Crear backup
npm run universal:clean        # Limpiar archivos temporales
```

## Resolución de Problemas

### Base de datos no encontrada
```bash
npm run universal:migrate
```

### Migración fallida
```bash
npm run universal:reset
```

### Error en seed de escala
1. Verificar formato JSON del template
2. Revisar IDs únicos
3. Validar rangos de puntuación
4. Comprobar sintaxis SQL generada

### Problemas de permisos
```bash
chmod +x scripts/*.js
```

## Seguridad

- **Backups automáticos**: Siempre se crean backups antes de operaciones destructivas
- **Validación**: Todos los datos son validados antes de inserción
- **Transacciones**: Las migraciones usan transacciones para consistencia
- **Logging**: Todas las operaciones se registran con timestamps

## Logs y Monitoreo

Los scripts generan logs coloridos que incluyen:
- ✅ **SUCCESS**: Operaciones exitosas
- ℹ️ **INFO**: Información general
- ⚠️ **WARNING**: Advertencias no críticas
- ❌ **ERROR**: Errores que requieren atención
- 📋 **STEP**: Pasos del proceso

## Contacto

Para soporte técnico o preguntas sobre el sistema de migración, contactar al equipo de desarrollo de MindHub.