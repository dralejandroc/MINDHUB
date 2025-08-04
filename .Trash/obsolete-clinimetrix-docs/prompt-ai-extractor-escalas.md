# Prompt AI: Extractor Automático de Escalas Clínicas

## Contexto del Sistema

Necesito que extraigas información completa de escalas clínicas desde fuentes académicas y bases de datos especializadas para generar archivos JSON compatibles con nuestro sistema database-first de escalas clinimétricas.

## Estructura JSON Objetivo

El sistema requiere este formato exacto:

```json
{
  "scale": {
    "id": "nombre-escala-sin-espacios",
    "name": "Nombre Completo de la Escala",
    "abbreviation": "SIGLAS",
    "version": "1.0",
    "category": "categoria_apropiada",
    "subcategory": "subcategoria_especifica",
    "description": "Descripción detallada de qué mide la escala",
    "author": "Autor(es) principal(es)",
    "publication_year": 1990,
    "estimated_duration_minutes": 15,
    "administration_mode": "self_administered|clinician_administered|hybrid",
    "target_population": "descripción_población_objetivo",
    "total_items": 21,
    "scoring_method": "sum|weighted_sum|average|subscales|algorithm",
    "score_range_min": 0,
    "score_range_max": 63,
    "instructions_professional": "Instrucciones para el clínico",
    "instructions_patient": "Instrucciones para el paciente"
  },
  "responseOptions": [
    {
      "id": "escala-opt-0",
      "value": "0",
      "label": "Etiqueta de la opción",
      "score": 0,
      "orderIndex": 1
    }
  ],
  "items": [
    {
      "id": "escala-item-1",
      "number": 1,
      "text": "Texto completo de la pregunta",
      "reverseScored": false,
      "alertTrigger": false,
      "alertCondition": "",
      "responseOptions": []
    }
  ],
  "interpretationRules": [
    {
      "id": "escala-int-minimal",
      "minScore": 0,
      "maxScore": 13,
      "severityLevel": "minimal|mild|moderate|severe|extreme",
      "label": "Etiqueta del rango",
      "color": "#27AE60",
      "description": "Descripción clínica",
      "recommendations": "Recomendaciones clínicas"
    }
  ],
  "subscales": [
    {
      "id": "escala-sub-1",
      "name": "Nombre de la subescala",
      "items": [1, 2, 3],
      "min_score": 0,
      "max_score": 12,
      "description": "Qué mide esta subescala"
    }
  ]
}
```

## Tareas Específicas

### 1. **Buscar y Extraer Información**

Para cada escala, busca en:
- PubMed y bases de datos académicas
- Manuales oficiales de las escalas
- Sitios web de organizaciones profesionales (APA, WHO, etc.)
- Artículos de validación y desarrollo
- Documentación técnica disponible

### 2. **Información Requerida por Escala**

**Metadatos:**
- Nombre completo y abreviatura oficial
- Autor(es) y año de publicación
- Versión más actual
- Población objetivo específica
- Tiempo estimado de administración
- Modo de administración recomendado

**Contenido de la Escala:**
- **TODOS los items/preguntas** exactos tal como aparecen
- **TODAS las opciones de respuesta** con sus valores y puntuaciones
- Instrucciones precisas (profesional y paciente)
- Items con puntuación inversa (reverse scoring)
- Items con alertas especiales (ej: ideación suicida)

**Interpretación:**
- Rangos de puntuación completos con sus interpretaciones
- Puntos de corte establecidos
- Clasificaciones de severidad
- Recomendaciones clínicas por rango
- Subescalas si las hay

### 3. **Escalas Prioritarias para Extraer**

**Depresión:**
- Beck Depression Inventory-II (BDI-II)
- Hamilton Depression Rating Scale (HDRS/HAM-D)
- Montgomery-Åsberg Depression Rating Scale (MADRS)
- Center for Epidemiologic Studies Depression Scale (CES-D)
- Geriatric Depression Scale (GDS)

**Ansiedad:**
- Beck Anxiety Inventory (BAI)
- State-Trait Anxiety Inventory (STAI)
- Hamilton Anxiety Rating Scale (HAM-A)
- Generalized Anxiety Disorder 7-item (GAD-7)
- Social Phobia Inventory (SPIN)

**Cognitivas:**
- Mini-Mental State Examination (MMSE)
- Montreal Cognitive Assessment (MoCA)
- Saint Louis University Mental Status (SLUMS)
- Addenbrooke's Cognitive Examination (ACE-III)
- Trail Making Test A & B

**Personalidad:**
- Minnesota Multiphasic Personality Inventory-2 (MMPI-2)
- Millon Clinical Multiaxial Inventory-IV (MCMI-IV)
- Personality Assessment Inventory (PAI)
- NEO Personality Inventory-3 (NEO-PI-3)

**Trauma y PTSD:**
- Clinician-Administered PTSD Scale (CAPS-5)
- PTSD Checklist for DSM-5 (PCL-5)
- Childhood Trauma Questionnaire (CTQ)
- Impact of Event Scale-Revised (IES-R)

**Trastornos Específicos:**
- Yale-Brown Obsessive Compulsive Scale (Y-BOCS)
- ADHD Rating Scale-IV
- Autism Diagnostic Observation Schedule (ADOS-2)
- Young Mania Rating Scale (YMRS)
- CAGE Questionnaire (alcohol screening)

### 4. **Categorización Automática**

Asigna categorías apropiadas:
- depression, anxiety, cognitive, personality, trauma, ptsd
- ocd, adhd, autism, bipolar, substance_use, eating_disorder
- neuropsychology, memory, attention, executive_function
- social_skills, behavior, mood, stress, sleep, pain

### 5. **Validación de Datos**

Para cada escala, verifica:
- **Completitud**: Todos los items y opciones incluidos
- **Precisión**: Puntuaciones y rangos correctos
- **Consistencia**: IDs únicos y estructura válida
- **Autenticidad**: Información de fuentes confiables
- **Actualidad**: Versión más reciente disponible

### 6. **Manejo de Escalas Atípicas**

**Para escalas con opciones variables por item:**
- Documenta las opciones específicas de cada pregunta
- Respeta puntuaciones no consecutivas
- Identifica items con reverse scoring
- Nota alertas especiales o condiciones

**Ejemplo de escala atípica:**
```json
"items": [
  {
    "id": "mmse-item-5",
    "number": 5,
    "text": "¿Qué año es?",
    "responseOptions": [
      {"value": "correcto", "label": "Respuesta correcta", "score": 1},
      {"value": "incorrecto", "label": "Respuesta incorrecta", "score": 0}
    ]
  }
]
```

### 7. **Formato de Entrega**

**Estructura del documento final:**

```markdown
# Escalas Clínicas Extraídas - [Fecha]

## Resumen Ejecutivo
- Total de escalas procesadas: X
- Categorías cubiertas: [lista]
- Fuentes consultadas: [lista]
- Estado de completitud por escala

## Escalas por Categoría

### Depresión
#### Beck Depression Inventory-II (BDI-II)
**Fuentes:** [URLs consultadas]
**Estado:** Completa/Parcial/Pendiente
**JSON:**
```json
[JSON completo aquí]
```
**Notas:** Observaciones importantes

### [Siguiente categoría...]

## Escalas Problemáticas o Incompletas
- Lista de escalas que necesitan revisión manual
- Razones por las que no se pudo completar
- Fuentes adicionales recomendadas

## Validación Requerida
- Items que necesitan verificación
- Puntuaciones que parecen inconsistentes
- Escalas con derechos de autor restrictivos
```

### 8. **Instrucciones Específicas**

1. **Prioriza la precisión** sobre la velocidad
2. **Cita todas las fuentes** utilizadas para cada escala
3. **Marca claramente** qué información necesita verificación
4. **Identifica escalas con copyright** que requieren permisos
5. **Documenta versiones específicas** encontradas
6. **Nota discrepancias** entre fuentes cuando las encuentres
7. **Incluye metadatos** de confiabilidad y validez cuando estén disponibles

### 9. **Control de Calidad**

Antes de entregar:
- ✅ Verificar que todos los JSONs son sintácticamente válidos
- ✅ Confirmar que los ranges de puntuación suman correctamente
- ✅ Validar que todos los IDs son únicos
- ✅ Revisar que las categorías son apropiadas
- ✅ Asegurar que las instrucciones son claras y completas

### 10. **Notas Importantes**

- **Respeta los derechos de autor**: Indica claramente escalas propietarias
- **Mantén la fidelidad**: No alteres el texto original de los items
- **Documenta limitaciones**: Si no encuentras información completa
- **Sugiere fuentes**: Recomienda dónde obtener acceso completo
- **Traduce si es necesario**: A español manteniendo validez clínica

## Resultado Esperado

Un documento markdown completo con 30-50 escalas clínicas en formato JSON, completamente funcionales y listas para implementar en el sistema. Cada escala debe incluir:

- ✅ Metadatos completos y precisos
- ✅ Todos los items con texto exacto
- ✅ Todas las opciones de respuesta con puntuaciones
- ✅ Rangos de interpretación clínica
- ✅ Instrucciones de administración
- ✅ Fuentes y referencias
- ✅ JSON sintácticamente válido

---

**Instrucción Final:** Procesa las escalas sistemáticamente, priorizando completitud y precisión. Entrega un documento que pueda ser revisado, editado fácilmente, y convertido directamente a archivos JSON funcionales para el sistema.