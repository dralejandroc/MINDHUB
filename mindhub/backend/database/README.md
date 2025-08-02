# Base de Datos - Sistema Universal de Escalas Clínicas

## 📁 Estructura de Directorios

```
database/
├── templates/              # 📝 Templates JSON (fuente única de verdad)
│   ├── universal-scale-template.json  # Template genérico de ejemplo
│   └── [scale-name].json             # Un archivo JSON por escala
├── seeds/                  # 🌱 Archivos SQL generados automáticamente
│   └── [scale-name]_seed.sql         # Generado desde [scale-name].json
├── migrations/             # 🔄 Migraciones de esquema
└── scripts/               # 🛠️ Scripts de sincronización
```

## 🔄 Workflow: Templates → Seeds → Base de Datos

### 1. **Templates JSON (Fuente Única)**
Los archivos en `/templates` son la **fuente única de verdad** para todas las escalas:
- Un archivo JSON por escala
- Contiene toda la información: ítems, opciones, documentación científica, etc.
- Formato: markdown + JSON o JSON puro

### 2. **Sincronización Automática**
Script que convierte templates JSON a seeds SQL:

```bash
# Sincronizar todas las escalas
npm run sync-scales

# Sincronizar una escala específica
npm run sync-scale [scale-name]
```

### 3. **Seeds SQL Generados**
- Un archivo SQL por escala (`{escala_id}_seed.sql`)
- Se sobrescriben automáticamente al sincronizar
- Listos para importar a MySQL

## 📋 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run sync-scales` | Sincroniza todos los templates JSON a seeds SQL |
| `npm run sync-scale <escala>` | Sincroniza una escala específica |

## 📚 Información Científica en el Catálogo

El sistema lee la **información científica** (referencias, validación, propiedades psicométricas) para mostrar en el catálogo de Clinimetrix desde:

**Templates JSON → Base de Datos → Frontend**

```json
// En cada template JSON:
"documentation": {
  "content_md": "# Documentación científica completa en Markdown",
  "references": ["Referencia 1", "Referencia 2"],
  "validation_studies": [...],
  "psychometric_properties": {...}
}
```

Esta documentación se sincroniza automáticamente a la tabla `scale_documentation` y se muestra en el catálogo de escalas.

## 🎯 Agregar Nueva Escala

1. **Crear template JSON**: Agregar archivo en `/templates/nueva-escala.json`
2. **Incluir documentación**: Agregar sección `documentation` con información científica
3. **Sincronizar**: Ejecutar `npm run sync-scale nueva-escala`
4. **Importar a BD**: Ejecutar el SQL generado en MySQL

## 📊 Escalas Disponibles

Las escalas se agregan dinámicamente al sistema. Cada escala clínica incluye:

- Template JSON con toda la información
- Seed SQL generado automáticamente
- Documentación científica completa
- Validación psicométrica

## 🔧 Script de Sincronización

**Ubicación**: `/scripts/sync-templates.js`

**Características**:
- ✅ Maneja formatos markdown+JSON y JSON puro
- ✅ Validación de campos requeridos
- ✅ Valores por defecto para campos opcionales
- ✅ Soporte para estructuras anidadas (`{scale: {...}}`)
- ✅ Generación de SQL completo (escalas, ítems, opciones, subescalas, documentación)

## 🗃️ Estructura de Base de Datos

El sistema universal utiliza las siguientes tablas principales:

- **`scales`** - Información básica de las escalas
- **`scale_items`** - Ítems/preguntas de cada escala
- **`scale_response_options`** - Opciones de respuesta globales
- **`scale_item_specific_options`** - Opciones específicas por ítem (como BDI-21)
- **`item_response_options`** - Relación ítems ↔ opciones (como STAI estado/rasgo)
- **`scale_subscales`** - Subescalas y factores
- **`scale_interpretation_rules`** - Reglas de interpretación de puntajes
- **`scale_documentation`** - Documentación científica en formato Markdown

## 🚨 Importante

- **No editar** archivos en `/seeds` manualmente
- **Siempre modificar** los templates JSON en `/templates`
- **Ejecutar sincronización** después de cambios en templates
- **Los seeds se sobrescriben** automáticamente al sincronizar

## 📝 Ejemplo de Uso

```bash
# 1. Modificar template
vim database/templates/[scale-name].json

# 2. Sincronizar cambios
npm run sync-scale [scale-name]

# 3. El archivo database/seeds/[scale-name]_seed.sql se actualiza automáticamente
```

---

*Este workflow garantiza que los templates JSON sean la única fuente de verdad para el Sistema Universal de Escalas Clínicas.*