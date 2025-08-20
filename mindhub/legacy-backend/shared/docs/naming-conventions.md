# ClinimetrixPro - Convenciones de Nomenclatura

## Convenciones para Plantillas Científicas

### Identificadores de Escalas (`metadata.id`)

**Formato**: `{abbreviation}-{version}`
**Patrón**: `^[a-z0-9-]+$` (kebab-case)

**Ejemplos:**
- `gadi-2.0` - Generalized Anxiety Disorder Inventory versión 2.0
- `bdi-21-1.0` - Beck Depression Inventory 21 ítems versión 1.0
- `stai-form-y-1.0` - State-Trait Anxiety Inventory Form Y
- `audit-1.0` - Alcohol Use Disorders Identification Test
- `panss-30-1.0` - Positive and Negative Syndrome Scale 30 ítems

**Reglas:**
- Usar siempre minúsculas
- Separar con guiones (-)
- Incluir versión al final
- No usar espacios ni caracteres especiales
- Máximo 50 caracteres

### Nombres de Archivos de Plantillas

**Formato**: `{scale-id}.json`

**Ejemplos:**
- `gadi-2.0.json`
- `bdi-21-1.0.json` 
- `stai-form-y-1.0.json`
- `moca-montreal-cognitive-assessment-1.0.json`

### Identificadores de Secciones (`structure.sections[].id`)

**Formato**: `{purpose}_{order}` o `{semantic_name}`

**Ejemplos Estándar:**
- `instructions` - Sección de instrucciones
- `demographics` - Datos demográficos
- `main_scale` - Escala principal
- `section_a`, `section_b` - Secciones múltiples
- `performance_items` - Ítems de rendimiento
- `cognitive_items` - Ítems cognitivos

**Ejemplos Específicos:**
- `contamination_obsessions` - Obsesiones de contaminación (DY-BOCS)
- `symmetry_compulsions` - Compulsiones de simetría (DY-BOCS)
- `state_anxiety` - Ansiedad estado (STAI)
- `trait_anxiety` - Ansiedad rasgo (STAI)
- `memory_tasks` - Tareas de memoria (MOCA)
- `drawing_tasks` - Tareas de dibujo (MOCA)

### Identificadores de Subescalas (`structure.subscales[].id`)

**Formato**: `{scale-abbreviation}-{subscale-name}`

**Ejemplos:**
- `gadi-cognitive` - Síntomas cognitivos de GADI
- `gadi-somatic` - Síntomas somáticos de GADI
- `stai-state` - Ansiedad estado de STAI
- `stai-trait` - Ansiedad rasgo de STAI
- `panss-positive` - Síntomas positivos de PANSS
- `panss-negative` - Síntomas negativos de PANSS
- `panss-general` - Psicopatología general de PANSS

### Códigos de Interpretación (`interpretation.rules[].severity`)

**Niveles Estándar:**
- `minimal` - Mínimo/Sin síntomas
- `leve` - Síntomas leves
- `moderado` - Síntomas moderados  
- `severo` - Síntomas severos
- `muy_severo` - Síntomas muy severos

**Excepciones por Dominio:**
- Cognitivo: `normal`, `leve`, `moderado`, `severo`
- Desarrollo: `adecuado`, `retraso_leve`, `retraso_moderado`, `retraso_severo`
- Personalidad: `ausente`, `presente`, `prominente`

### Grupos de Respuesta (`responseGroup`)

**Formato**: `{scale}-{context}`

**Ejemplos:**
- `stai-state` - Opciones para ansiedad estado
- `stai-trait` - Opciones para ansiedad rasgo
- `likert-4` - Escala Likert de 4 puntos estándar
- `likert-5` - Escala Likert de 5 puntos estándar
- `binary-yes-no` - Respuestas binarias sí/no
- `severity-0-3` - Severidad del 0 al 3
- `frequency-never-always` - Frecuencia de nunca a siempre

### Identificadores de Ítems Interactivos

**Formato**: `{task-type}_{specific-task}`

**Ejemplos MOCA:**
- `drawing_clock` - Dibujo del reloj
- `drawing_cube` - Copia del cubo
- `memory_words` - Memorización de palabras
- `memory_delayed` - Recuerdo diferido
- `attention_digits` - Atención a dígitos
- `language_fluency` - Fluidez verbal
- `visuospatial_trail` - Conexión de senderos
- `executive_abstraction` - Abstracción

### Convenciones de Versionado

**Formato Semver**: `MAJOR.MINOR.PATCH`

**Reglas:**
- **MAJOR**: Cambios incompatibles (estructura, ítems eliminados)
- **MINOR**: Nuevas funcionalidades (ítems agregados, mejoras)
- **PATCH**: Correcciones menores (typos, ajustes de puntuación)

**Ejemplos:**
- `1.0.0` - Versión inicial
- `1.1.0` - Se agregaron subescalas
- `1.1.1` - Corrección de typos
- `2.0.0` - Reestructuración completa

### Identificadores de Factores Multi-Factor

**Formato**: `{dimension}_{aspect}`

**Ejemplos DTS:**
- `frequency` - Frecuencia del síntoma
- `severity` - Severidad del síntoma
- `distress` - Malestar causado
- `interference` - Interferencia funcional

**Ejemplos DASH-II:**
- `frequency` - Frecuencia del comportamiento
- `severity` - Severidad del comportamiento
- `intervention` - Necesidad de intervención

### Códigos de Color para Interpretaciones

**Formato**: Hexadecimal `#RRGGBB`

**Paleta Estándar por Severidad:**
- `minimal`: `#10B981` (verde)
- `leve`: `#F59E0B` (amarillo)
- `moderado`: `#F97316` (naranja)
- `severo`: `#EF4444` (rojo)
- `muy_severo`: `#7C2D12` (rojo oscuro)

**Paleta Alternativa por Dominio:**
- Cognitivo: Azules (`#3B82F6`, `#1E40AF`, `#1E3A8A`)
- Emocional: Púrpuras (`#8B5CF6`, `#7C3AED`, `#6D28D9`)
- Personalidad: Verdes (`#059669`, `#047857`, `#065F46`)

### Metadatos y Tags

**Formato de Tags**: `{category}:{value}`

**Ejemplos:**
- `domain:anxiety` - Dominio de ansiedad
- `population:adult` - Población adulta
- `duration:short` - Duración corta (<15 min)
- `administration:self` - Autoaplicada
- `complexity:basic` - Complejidad básica
- `language:spanish` - Idioma español
- `validation:mexico` - Validada en México

### Convenciones de Archivos de Documentación

**Formato**: `{scale-id}-{document-type}.{extension}`

**Ejemplos:**
- `gadi-2.0-manual.pdf` - Manual de administración
- `gadi-2.0-psychometric.json` - Propiedades psicométricas
- `gadi-2.0-norms.csv` - Datos normativos
- `gadi-2.0-bibliography.bib` - Referencias bibliográficas

### Identificadores de Validación

**Formatos de Error:**
- `E001_MISSING_REQUIRED` - Error crítico
- `W001_MISSING_RECOMMENDED` - Advertencia
- `I001_OPTIMIZATION_SUGGESTION` - Información

**Formatos de Validación:**
- `validation_passed` - Validación exitosa
- `validation_failed` - Validación fallida
- `validation_warning` - Validación con advertencias

### Convenciones de Base de Datos

**Tablas ClinimetrixPro:**
- `clinimetrix_templates` - Plantillas principales
- `clinimetrix_template_versions` - Versiones de plantillas
- `clinimetrix_assessments` - Evaluaciones aplicadas
- `clinimetrix_responses` - Respuestas de usuarios
- `clinimetrix_results` - Resultados calculados
- `clinimetrix_registry` - Catálogo público

**Campos Comunes:**
- `template_id` - ID de plantilla
- `version_id` - ID de versión
- `assessment_id` - ID de evaluación
- `user_id` - ID de usuario
- `created_at` - Timestamp de creación
- `updated_at` - Timestamp de actualización
- `is_active` - Estado activo
- `metadata` - JSON con metadatos

### Convenciones de API Endpoints

**Formato REST**: `/api/clinimetrix-pro/{resource}/{action}`

**Ejemplos:**
- `GET /api/clinimetrix-pro/templates` - Listar plantillas
- `GET /api/clinimetrix-pro/templates/{id}` - Obtener plantilla
- `POST /api/clinimetrix-pro/assessments` - Crear evaluación
- `PUT /api/clinimetrix-pro/assessments/{id}/responses` - Enviar respuestas
- `GET /api/clinimetrix-pro/assessments/{id}/results` - Obtener resultados

### Validación de Convenciones

**Script de Validación**: Verificar que todas las plantillas sigan estas convenciones

**Reglas Automáticas:**
1. ID debe seguir patrón kebab-case
2. Versión debe ser semver válido
3. Colores deben ser hexadecimales válidos
4. Tags deben seguir formato `category:value`
5. Archivos deben seguir convención de nomenclatura

### Migración de Nomenclatura

**Proceso:**
1. Identificar plantillas con nomenclatura antigua
2. Crear mapping de nombres antiguos → nuevos
3. Actualizar referencias en código
4. Migrar datos en base de datos
5. Actualizar documentación

**Retrocompatibilidad:**
- Mantener aliases para nombres antiguos
- Advertir sobre uso de nomenclatura obsoleta
- Planificar deprecación gradual

---

*Estas convenciones garantizan consistencia, escalabilidad y mantenibilidad del sistema ClinimetrixPro.*