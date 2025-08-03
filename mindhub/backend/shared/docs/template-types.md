# ClinimetrixPro - Tipos de Respuesta y Plantillas

## Documentación Técnica de Tipos de Respuesta

### Tipos de Respuesta Soportados

#### 1. Likert (`likert`)
Escalas de respuesta gradual, típicamente de 3 a 7 puntos.

**Casos de uso:**
- STAI: 4 puntos (1=Nunca, 2=A veces, 3=A menudo, 4=Casi siempre)
- GADI: 4 puntos (0=Nunca, 1=Varios días, 2=Más de la mitad, 3=Casi todos los días)

**Estructura JSON:**
```json
{
  "responseType": "likert",
  "responseOptions": [
    {"value": "0", "label": "Nunca", "score": 0},
    {"value": "1", "label": "Varios días", "score": 1},
    {"value": "2", "label": "Más de la mitad de los días", "score": 2},
    {"value": "3", "label": "Casi todos los días", "score": 3}
  ]
}
```

#### 2. Binario (`binary`)
Respuestas de sí/no, verdadero/falso, presente/ausente.

**Casos de uso:**
- GDS: Sí/No para cada síntoma
- Algunos ítems de screening

**Estructura JSON:**
```json
{
  "responseType": "binary",
  "responseOptions": [
    {"value": "no", "label": "No", "score": 0},
    {"value": "si", "label": "Sí", "score": 1}
  ]
}
```

#### 3. Opción Múltiple (`multiple_choice`)
Respuestas con opciones específicas, no ordinales.

**Casos de uso:**
- BDI-21: Cada ítem tiene 4 opciones específicas diferentes
- Escalas con opciones únicas por ítem

**Estructura JSON:**
```json
{
  "responseType": "multiple_choice",
  "responseOptions": [
    {"value": "a", "label": "No me siento triste", "score": 0},
    {"value": "b", "label": "Me siento triste", "score": 1},
    {"value": "c", "label": "Estoy triste todo el tiempo", "score": 2},
    {"value": "d", "label": "Estoy tan triste que no puedo soportarlo", "score": 3}
  ]
}
```

#### 4. Texto Abierto (`open_text`)
Respuestas de texto libre.

**Casos de uso:**
- Observaciones clínicas
- Comentarios adicionales
- Descripciones de síntomas

**Estructura JSON:**
```json
{
  "responseType": "open_text",
  "validation": {
    "maxLength": 500,
    "required": false
  }
}
```

#### 5. Numérico (`numeric`)
Respuestas numéricas específicas.

**Casos de uso:**
- Edad
- Frecuencia de síntomas
- Intensidad en escala 0-10

**Estructura JSON:**
```json
{
  "responseType": "numeric",
  "validation": {
    "minValue": 0,
    "maxValue": 10,
    "integerOnly": true
  }
}
```

#### 6. Interactivo (`interactive`)
Tareas complejas que requieren interacción especial.

**Casos de uso:**
- MOCA: Dibujos, memoria, cálculos
- Tareas neuropsicológicas

**Subtipos disponibles:**

##### Canvas Drawing
```json
{
  "responseType": "interactive",
  "interactive": {
    "componentType": "canvas",
    "config": {
      "width": 400,
      "height": 300,
      "allowDrawing": true,
      "showReference": true,
      "referenceImage": "clock-template.svg",
      "scoringCriteria": [
        "Círculo completo (1 punto)",
        "Números en posición correcta (2 puntos)",
        "Manecillas en posición correcta (2 puntos)"
      ]
    }
  }
}
```

##### Memory Task
```json
{
  "responseType": "interactive",
  "interactive": {
    "componentType": "memory_task",
    "config": {
      "wordCount": 5,
      "presentationTime": 2000,
      "delayTime": 5000,
      "allowedAttempts": 3,
      "scoringMethod": "immediate_delayed"
    }
  }
}
```

##### Figure Recognition
```json
{
  "responseType": "interactive",
  "interactive": {
    "componentType": "figure_recognition",
    "config": {
      "figures": [
        {"name": "lion", "image": "lion.jpg"},
        {"name": "rhinoceros", "image": "rhino.jpg"},
        {"name": "camel", "image": "camel.jpg"}
      ],
      "timeLimit": 30000
    }
  }
}
```

#### 7. Multi-Factor (`multifactor`)
Ítems que requieren múltiples respuestas por factor.

**Casos de uso:**
- DTS: Frecuencia + Severidad para cada síntoma
- Escalas que evalúan múltiples dimensiones por ítem

**Estructura JSON:**
```json
{
  "responseType": "multifactor",
  "multifactor": {
    "factors": [
      {
        "id": "frequency",
        "label": "¿Con qué frecuencia?",
        "responseOptions": [
          {"value": "0", "label": "Nunca", "score": 0},
          {"value": "1", "label": "Una vez por semana", "score": 1},
          {"value": "2", "label": "2-4 veces por semana", "score": 2},
          {"value": "3", "label": "5 o más veces por semana", "score": 3}
        ]
      },
      {
        "id": "severity",
        "label": "¿Qué tan severo?",
        "responseOptions": [
          {"value": "0", "label": "Sin molestia", "score": 0},
          {"value": "1", "label": "Molestia leve", "score": 1},
          {"value": "2", "label": "Molestia moderada", "score": 2},
          {"value": "3", "label": "Molestia severa", "score": 3}
        ]
      }
    ]
  }
}
```

### Tipos de Escalas Especiales

#### Escalas Condicionales
Para escalas como DY-BOCS que requieren selección de patrones antes de evaluación.

```json
{
  "structure": {
    "sections": [
      {
        "id": "pattern_selection",
        "name": "Selección de Patrones",
        "conditional": null,
        "items": [
          {
            "number": 0,
            "text": "Seleccione los patrones obsesivos presentes:",
            "responseType": "multiple_choice",
            "responseOptions": [
              {"value": "contamination", "label": "Contaminación/Limpieza"},
              {"value": "symmetry", "label": "Simetría/Exactitud"},
              {"value": "forbidden", "label": "Pensamientos Prohibidos"},
              {"value": "hoarding", "label": "Acumulación"}
            ]
          }
        ]
      },
      {
        "id": "contamination_section",
        "name": "Obsesiones de Contaminación",
        "conditional": {
          "dependsOn": "0",
          "condition": "contains",
          "value": "contamination"
        },
        "items": [...]
      }
    ]
  }
}
```

#### Escalas Multi-Sección
Para escalas como DASH-II con múltiples preguntas por ítem.

```json
{
  "structure": {
    "sections": [
      {
        "id": "section_a",
        "name": "Frecuencia del Comportamiento",
        "items": [
          {
            "number": 1,
            "text": "¿Con qué frecuencia presenta este comportamiento?",
            "responseType": "likert",
            "responseOptions": [...]
          }
        ]
      },
      {
        "id": "section_b", 
        "name": "Severidad del Comportamiento",
        "items": [
          {
            "number": 1,
            "text": "¿Qué tan severo es este comportamiento?",
            "responseType": "likert",
            "responseOptions": [...]
          }
        ]
      },
      {
        "id": "section_c",
        "name": "Necesidad de Intervención",
        "items": [
          {
            "number": 1,
            "text": "¿Requiere intervención este comportamiento?",
            "responseType": "binary",
            "responseOptions": [...]
          }
        ]
      }
    ]
  }
}
```

#### Escalas Multi-Versión
Para escalas como GDS con versiones de diferente longitud.

```json
{
  "structure": {
    "hasMultipleVersions": true,
    "versions": [
      {
        "name": "GDS-30",
        "itemCount": 30,
        "itemNumbers": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]
      },
      {
        "name": "GDS-15", 
        "itemCount": 15,
        "itemNumbers": [1,2,3,4,7,8,9,10,12,14,15,17,21,22,23]
      },
      {
        "name": "GDS-5",
        "itemCount": 5, 
        "itemNumbers": [1,2,8,9,10]
      }
    ]
  }
}
```

### Grupos de Respuesta

Cuando múltiples ítems comparten las mismas opciones de respuesta, se puede usar `responseGroup`:

```json
{
  "responseGroups": {
    "stai_state": [
      {"value": "1", "label": "Nada", "score": 1},
      {"value": "2", "label": "Algo", "score": 2}, 
      {"value": "3", "label": "Moderadamente", "score": 3},
      {"value": "4", "label": "Mucho", "score": 4}
    ],
    "stai_trait": [
      {"value": "1", "label": "Casi nunca", "score": 1},
      {"value": "2", "label": "A veces", "score": 2},
      {"value": "3", "label": "A menudo", "score": 3}, 
      {"value": "4", "label": "Casi siempre", "score": 4}
    ]
  }
}
```

Luego en los ítems:
```json
{
  "number": 1,
  "text": "Me siento calmado",
  "responseType": "likert",
  "responseGroup": "stai_state"
}
```

### Consideraciones de Implementación

#### Validación de Respuestas
- **Obligatorias**: Todos los ítems marcados como `required: true` deben tener respuesta
- **Rangos**: Los valores numéricos deben estar dentro del rango permitido
- **Patrones**: Los textos deben cumplir con regex si se especifica
- **Consistencia**: Los ítems de consistencia deben ser validados

#### Manejo de Errores
- Respuestas fuera de rango
- Tipos de datos incorrectos
- Ítems obligatorios sin responder
- Inconsistencias en respuestas de validez

#### Performance
- Lazy loading de secciones grandes
- Caché de opciones de respuesta comunes
- Optimización de renderizado para escalas largas

### Escalas de Ejemplo por Complejidad

#### Nivel 1: Básico
- **AUDIT**: Likert simple, 10 ítems
- **GAD-7**: Likert estándar, interpretación directa

#### Nivel 2: Intermedio  
- **STAI**: Dos subescalas, ítems invertidos
- **BDI-21**: Opciones específicas por ítem

#### Nivel 3: Avanzado
- **Vanderbilt**: Múltiples secciones
- **Cuestionario Salamanca**: 11 subescalas

#### Nivel 4: Complejo
- **GDS**: Múltiples versiones
- **PANSS**: Requiere entrenamiento, validación compleja

#### Nivel 5: Muy Complejo
- **MOCA**: Tareas interactivas, canvas, memoria
- **DY-BOCS**: Patrones condicionales
- **DTS**: Multi-factor scoring
- **DASH-II**: Triple evaluación por ítem

### Próximos Pasos

1. **Validador de Esquemas**: Implementar validación automática de plantillas
2. **Generador de Templates**: Herramienta para convertir escalas existentes
3. **Motor de Renderizado**: Componentes React para cada tipo de respuesta
4. **Sistema de Scoring**: Algoritmos de puntuación por tipo de escala
5. **Validación de Respuestas**: Sistema inteligente de detección de patrones

---

*Esta documentación se actualiza conforme se agregan nuevos tipos de respuesta y escalas al sistema.*