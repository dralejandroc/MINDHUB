# ClinimetrixPro Database Infrastructure

## 📁 Estructura de Directorios

```
database/
├── templates/scales/       # 📝 Templates JSON ClinimetrixPro (10 escalas piloto)
│   ├── stai-1.0.json      # STAI con ítems invertidos y 2 partes
│   ├── gds-1.0.json       # GDS con 3 versiones (30/15/5 ítems)
│   ├── panss-1.0.json     # PANSS compleja con entrenamiento requerido
│   ├── moca-1.0.json      # MOCA con componentes interactivos
│   ├── dy-bocs-1.0.json   # DY-BOCS con secciones condicionales
│   ├── dts-1.0.json       # DTS con multi-factor (frecuencia + severidad)
│   └── ... (10 templates totales)
├── migrations/             # 🔄 Migraciones ClinimetrixPro
│   ├── 001_create_clinimetrix_pro_tables.sql
│   ├── 002_create_clinimetrix_pro_indexes.sql
│   └── 003_create_clinimetrix_pro_backup_procedures.sql
├── scripts/                # 🛠️ Scripts de importación
│   └── import-clinimetrix-pro-templates.js
└── seeds/                 # 🌱 Sistema legacy (solo referencia)
```

## 🔄 Workflow ClinimetrixPro: Templates → Database

### 1. **Templates JSON (Fuente Única)**
Los templates en `/templates/scales/` son la **fuente única de verdad** para ClinimetrixPro:
- ✅ **10 Templates Piloto** completamente validados
- ✅ **Documentación científica** completa integrada
- ✅ **Casos de uso complejos** cubiertos (interactivos, multifactor, condicionales)

### 2. **Importación Directa**
Import directo a tablas ClinimetrixPro optimizadas:

```bash
# Importar todos los templates a la base de datos
DB_PASSWORD=Aa123456! node scripts/import-clinimetrix-pro-templates.js
```

### 3. **Base de Datos Optimizada**
- ✅ **7 Tablas especializadas** para máximo rendimiento
- ✅ **Indexes avanzados** para consultas complejas  
- ✅ **Procedures de backup** automáticos
- ✅ **Sistema de registry** para catálogo

## 📋 Templates Disponibles (Fase 1 Completada)

| Template | Descripción | Características Especiales |
|----------|-------------|----------------------------|
| **STAI** | Ansiedad Estado-Rasgo | ✅ Ítems invertidos, 2 partes |
| **GDS** | Depresión Geriátrica | ✅ 3 versiones (30/15/5 ítems) |
| **PANSS** | Síntomas Positivos/Negativos | ✅ Requiere entrenamiento |
| **MOCA** | Evaluación Cognitiva | ✅ Componentes interactivos |
| **DY-BOCS** | TOC Dimensional | ✅ Secciones condicionales |
| **DTS** | Trauma Davidson | ✅ Multi-factor (frecuencia + severidad) |
| **Vanderbilt** | TDAH Padres | ✅ Múltiples secciones |
| **GADI** | Ansiedad General | ✅ Subescalas complejas |
| **AUDIT** | Uso de Alcohol | ✅ Respuestas variables |
| **BDI-21** | Depresión Beck | ✅ 99 opciones específicas por ítem |

## 📚 Sistema de Registry Integrado

La información científica se almacena directamente en `clinimetrix_registry`:

```json
// Cada template incluye:
"documentation": {
  "bibliography": ["Referencias científicas"],
  "psychometricProperties": {"reliability": 0.94},
  "normativeData": {"cutoffPoints": [...]}
}
```

**Auto-poblado** en registry para catálogo inmediato.

## 🗃️ Estructura de Base de Datos ClinimetrixPro

### Tablas Principales

- **`clinimetrix_templates`** - Storage optimizado de templates JSON
- **`clinimetrix_assessments`** - Sesiones de evaluación completas  
- **`clinimetrix_registry`** - Catálogo con metadata psicométrica
- **`clinimetrix_assessment_responses`** - Tracking granular de respuestas
- **`clinimetrix_access_logs`** - Audit trail completo
- **`clinimetrix_template_versions`** - Control de versiones
- **`clinimetrix_user_preferences`** - Configuraciones de usuario

### Procedimientos de Backup
- `sp_clinimetrix_full_backup()` - Backup completo
- `sp_clinimetrix_incremental_backup()` - Backup incremental
- `sp_clinimetrix_emergency_template_backup()` - Backup de emergencia

## 🚀 Status: Fase 1 Completada

✅ **Database Infrastructure**: 7 tablas especializadas  
✅ **Templates Piloto**: 10 escalas complejas validadas  
✅ **Import Scripts**: Automatización completa  
✅ **Backup System**: Procedures de respaldo listos  
✅ **Registry System**: Catálogo auto-poblado  

**LISTO PARA FASE 2**: Motor de Renderizado Dinámico

---

*ClinimetrixPro Database Infrastructure - Ready for Frontend Integration*