# PROMPT UNIVERSAL PARA EXTRACCIÓN DE ESCALAS CLINIMÉTRICAS v2.0

## OBJETIVO
Extraer y estructurar escalas clínicas en formato JSON universal, compatible con cualquier tipo de escala y lógica de respuestas.

## FORMATO DE SALIDA REQUERIDO
Generar JSON válido siguiendo EXACTAMENTE esta estructura:

### ESCALAS CON RESPUESTAS SIMPLES (Una sola lógica)
```json
{
  "responseOptions": [...],  // Opciones globales
  "items": [...],           // Items usan responseOptions globales
  "responseGroups": null    // No necesario
}
```

### ESCALAS CON RESPUESTAS MÚLTIPLES (Diferentes lógicas por grupo)
```json
{
  "responseGroups": {
    "grupo1": {
      "name": "Nombre del Grupo",
      "description": "Descripción",
      "items": [1, 2, 3, 4, 5],
      "options": [...]
    },
    "grupo2": {
      "name": "Otro Grupo", 
      "description": "Descripción",
      "items": [6, 7, 8, 9, 10],
      "options": [...]
    }
  },
  "responseOptions": [...], // Fallback para compatibilidad
  "items": [...] // Con campo "responseGroup": "grupo1|grupo2"
}
```

## INSTRUCCIONES DE EXTRACCIÓN

### 1. IDENTIFICAR TIPO DE ESCALA
**PREGUNTA CLAVE:** ¿Los ítems tienen diferentes opciones de respuesta?

**SI:** Usar `responseGroups`
- Escalas con diferentes tipos de preguntas que requieren distintas opciones de respuesta
- Escalas con secciones que evalúan diferentes dimensiones

**NO:** Usar `responseOptions` globales  
- Escalas donde todos los ítems usan las mismas opciones de respuesta
- Escalas con una sola lógica de respuesta uniforme

### 2. EXTRAER INFORMACIÓN DE LA ESCALA
```json
{
  "scale": {
    "id": "[nombre-corto-sin-espacios]",
    "name": "[Nombre Oficial Completo]",
    "abbreviation": "[SIGLAS]",
    "category": "depression|anxiety|bipolar|personality|cognitive|functional|other",
    "subcategory": "[especificar si aplica]",
    "description": "[Descripción técnica completa]",
    "author": "[Apellido, N., et al.]",
    "publication_year": [YYYY],
    "total_items": [número],
    "scoring_method": "sum|sum_by_subscale|weighted|custom",
    "score_range_min": [min],
    "score_range_max": [max]
  }
}
```

### 3. EXTRAER GRUPOS DE RESPUESTAS (Si aplica)
Para cada grupo distinto de opciones:
```json
{
  "responseGroups": {
    "[grupo_id]": {
      "name": "[Nombre descriptivo]",
      "description": "[Qué mide este grupo]",
      "items": [1, 2, 3, ...], // Números de ítems que usan estas opciones
      "options": [
        {
          "id": "[escala-grupo-opt-N]",
          "value": "[valor]",
          "label": "[Texto exacto de la opción]", 
          "score": [puntuación_numérica],
          "orderIndex": [orden]
        }
      ]
    }
  }
}
```

### 4. EXTRAER ÍTEMS
Para cada ítem:
```json
{
  "items": [
    {
      "id": "[escala-item-N]",
      "number": N,
      "text": "[Texto EXACTO de la pregunta]",
      "questionType": "likert|dichotomous|multiple_choice|numeric|text|checklist",
      "reverseScored": true|false,
      "responseGroup": "[grupo_id]", // Solo si usa responseGroups
      "helpText": "[Texto de ayuda o null]",
      "alertTrigger": true|false,
      "alertCondition": "[condición como ≥3]",
      "required": true|false,
      "responseOptions": [] // Para opciones específicas del ítem
    }
  ]
}
```

### 5. CASOS ESPECIALES

**OPCIONES ESPECÍFICAS POR ÍTEM (BDI-21 style):**
```json
{
  "items": [
    {
      "id": "bdi-item-1",
      "responseOptions": [
        {"label": "No me siento triste", "score": 0},
        {"label": "Me siento algo triste", "score": 1}
      ]
    }
  ]
}
```

**SUBESCALAS:**
```json
{
  "subscales": [
    {
      "id": "[escala-sub-nombre]",
      "name": "[Nombre de la subescala]", 
      "items": [1, 2, 3, ...],
      "min_score": N,
      "max_score": N,
      "description": "[Qué evalúa]"
    }
  ]
}
```

## REGLAS CRÍTICAS

1. **COMPATIBILIDAD:** Siempre incluir `responseOptions` como fallback
2. **PRECISION:** Usar texto EXACTO de opciones y preguntas
3. **FLEXIBILIDAD:** El sistema debe leer cualquier lógica de respuesta
4. **CONSISTENCIA:** IDs únicos y descriptivos
5. **VALIDACIÓN:** JSON válido y completo

## EJEMPLOS DE SALIDA

### Escala Simple:
```json
{
  "responseOptions": [
    {"value": "0", "label": "Opción 1", "score": 0},
    {"value": "1", "label": "Opción 2", "score": 1}
  ],
  "responseGroups": null,
  "items": [
    {"number": 1, "text": "Texto de pregunta...", "responseGroup": null}
  ]
}
```

### Escala Compleja:
```json
{
  "responseGroups": {
    "grupo1": {
      "items": [1, 2, 3, ...],
      "options": [{"label": "Respuesta A", "score": 0}, ...]
    },
    "grupo2": {
      "items": [21, 22, 23, ...], 
      "options": [{"label": "Respuesta X", "score": 0}, ...]
    }
  },
  "items": [
    {"number": 1, "responseGroup": "grupo1"},
    {"number": 21, "responseGroup": "grupo2"}
  ]
}
```

El sistema parseará automáticamente cualquier estructura y la importará correctamente a la base de datos universal.