# 📚 Documentos Psicoeducativos - MindHub Resources

Esta carpeta contiene documentos psicoeducativos en formato JSON que se renderizan dinámicamente en el módulo Resources de MindHub.

## 📁 Estructura de Carpetas

```
/data/psychoeducational-documents/
├── README.md (este archivo)
├── anxiety_management/          # Manejo de ansiedad
├── depression_support/          # Apoyo en depresión
├── trauma_recovery/            # Recuperación de trauma
├── stress_management/          # Manejo del estrés
├── emotional_regulation/       # Regulación emocional
├── relationship_skills/        # Habilidades sociales
├── addiction_recovery/         # Recuperación de adicciones
├── eating_disorders/           # Trastornos alimentarios
├── psychosis_support/          # Apoyo en psicosis
├── sleep_hygiene/              # Higiene del sueño
├── self_care/                  # Autocuidado
└── crisis_management/          # Manejo de crisis
```

## 🎯 Cómo Agregar Nuevos Documentos

### 1. Usa el Prompt Master para AI
Utiliza las instrucciones específicas para AI documentadas en el archivo de instrucciones para generar documentos con la estructura correcta.

### 2. Nomenclatura de Archivos
- Formato: `PSY-EDU-XXX-titulo-descriptivo.json`
- Ejemplo: `PSY-EDU-002-mindfulness-techniques.json`
- Usa números secuenciales para el ID
- Usa guiones para separar palabras en el título

### 3. Ubicación por Categoría
Coloca cada documento en la carpeta correspondiente a su categoría principal:

```bash
# Ejemplo para técnicas de mindfulness (categoría: anxiety_management)
/anxiety_management/PSY-EDU-002-mindfulness-techniques.json
```

### 4. Validación del JSON
Antes de agregar un documento, asegúrate de que:
- [x] El JSON sea válido (usa un validador JSON)
- [x] Todos los campos obligatorios estén completos
- [x] Las categorías coincidan con las definidas en los tipos TypeScript
- [x] Las referencias bibliográficas sean reales y verificables
- [x] El contenido use un tono empático y profesional

## 🔧 Estructura del JSON

Cada documento debe seguir exactamente esta estructura:

```json
{
  "version": "1.0",
  "type": "psychoeducational_document",
  "document": {
    "id": "PSY-EDU-XXX",
    "metadata": {
      "title": "Título del Documento",
      "subtitle": "Subtítulo descriptivo",
      "category": "categoria_valida",
      "subcategory": "subcategoria",
      "language": "es",
      "reading_level": "general",
      "estimated_reading_time": 5,
      "created_date": "YYYY-MM-DD",
      "last_updated": "YYYY-MM-DD",
      "version": "X.Y",
      "author": {
        "name": "Dr. Nombre Apellido",
        "credentials": "Especialidad",
        "institution": "Institución"
      }
    },
    // ... resto de la estructura
  }
}
```

## 📋 Categorías Válidas

### Categorías Principales (`category`)
- `anxiety_management` - Manejo de la ansiedad
- `depression_support` - Apoyo en depresión  
- `trauma_recovery` - Recuperación de trauma
- `addiction_recovery` - Recuperación de adicciones
- `eating_disorders` - Trastornos alimentarios
- `psychosis_support` - Apoyo en psicosis
- `relationship_skills` - Habilidades relacionales
- `emotional_regulation` - Regulación emocional
- `stress_management` - Manejo del estrés
- `sleep_hygiene` - Higiene del sueño
- `self_care` - Autocuidado
- `crisis_management` - Manejo de crisis

### Niveles de Evidencia (`evidence_level`)
- `high` - Técnicas con fuerte respaldo científico
- `moderate` - Enfoques con evidencia moderada  
- `low` - Técnicas emergentes o con evidencia limitada
- `expert` - Consenso de expertos sin estudios controlados

### Público Objetivo (`target_audience`)
- `patients` - Pacientes directos
- `caregivers` - Cuidadores/familiares
- `adolescents` - Adolescentes (12-17 años)
- `adults` - Adultos (18-64 años)
- `elderly` - Adultos mayores (65+ años)

## ✅ Lista de Verificación

Antes de agregar un nuevo documento, verifica:

- [ ] **Estructura JSON válida**: El archivo pasa validación JSON
- [ ] **ID único**: No existe otro documento con el mismo ID
- [ ] **Categorización correcta**: Category y subcategory son válidas
- [ ] **Metadatos completos**: Todos los campos requeridos están llenos
- [ ] **Contenido de calidad**: 
  - [ ] Lenguaje empático y no patologizante
  - [ ] Instrucciones claras y específicas
  - [ ] 2-5 secciones principales
  - [ ] Puntos clave relevantes
  - [ ] Mensaje de cierre apropiado
- [ ] **Referencias válidas**: Bibliografía real y verificable (mínimo 3)
- [ ] **Campos de personalización**: Incluye todos los campos requeridos
- [ ] **Información de autor**: Datos completos y precisos

## 🔄 Actualizaciones

### Para actualizar un documento existente:
1. Incrementa el número de `version` en metadata
2. Actualiza `last_updated` con la fecha actual
3. Documenta los cambios en un comentario de commit
4. Mantén el mismo `id` del documento

### Para crear una nueva versión:
1. Crea un nuevo archivo con ID secuencial
2. Referencia el documento original en `related_resources`
3. Actualiza metadatos apropiadamente

## 📊 Métricas de Calidad

Cada documento debe incluir:
- `peer_reviewed`: true/false según revisión por pares
- `last_review_date`: Fecha de última revisión
- `reviewer_ids`: IDs de revisores (si aplica)
- Métricas de uso se actualizan automáticamente

## 🚀 Deployment

Los documentos se cargan automáticamente cuando:
1. Se agrega un archivo JSON válido a cualquier carpeta de categoría
2. La aplicación React detecta y carga el documento
3. El catálogo se actualiza automáticamente

## 📞 Soporte

Para preguntas sobre:
- **Estructura JSON**: Consulta `/types/psychoeducational-documents.ts`
- **Prompt para AI**: Usa las instrucciones documentadas
- **Validación**: Usa herramientas online de validación JSON
- **Contenido clínico**: Consulta con el equipo médico

---

**Última actualización**: 2024-03-20  
**Versión del sistema**: 1.0