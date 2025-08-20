# Formato JSON Estándar para Escalas Clínicas

## Estructura Completa

```json
{
  "scale": {
    "id": "escala-id",
    "name": "Nombre Completo de la Escala",
    "abbreviation": "ABREV",
    "description": "Descripción detallada de la escala...",
    "version": "1.0",
    "category": "categoria",
    "subcategory": "subcategoria",
    "author": "Autor, A., & Coautor, B.",
    "publication_year": 2020,
    "total_items": 21,
    "estimated_duration_minutes": 10,
    "administration_mode": "self_administered", // "clinician_administered" | "both"
    "target_population": "Adultos de 18-65 años",
    "scoring_method": "sum", // "sum" | "average" | "subscales"
    "score_range_min": 0,
    "score_range_max": 63,
    "instructions_professional": "Instrucciones para el clínico...",
    "instructions_patient": "Instrucciones para el paciente..."
  },

  "items": [
    {
      "id": "escala-item-1",
      "number": 1,
      "text": "Texto del ítem",
      "code": "ESC1", // Opcional
      "question_type": "likert", // Ver tipos disponibles abajo
      "response_group": null, // null para opciones globales, "grupo-key" para específicas
      "reverse_scored": false,
      "alert_trigger": false, // true si es ítem de alerta clínica
      "alert_condition": null, // "score >= 2" | "any_response" | etc.
      "help_text": "Texto de ayuda opcional",
      "required": true,
      "metadata": {
        "clinical_significance": "high",
        "domain": "cognitive"
      },
      // SOLO si el ítem tiene opciones específicas diferentes a las globales
      "specific_options": [
        {
          "id": "escala-item-1-opt-0",
          "value": "0",
          "label": "Nunca",
          "score": 0,
          "order_index": 1
        }
      ]
    }
  ],

  // OPCIONES GLOBALES (para todos los ítems que no tengan específicas)
  "response_options": [
    {
      "id": "escala-opt-0",
      "value": "0",
      "label": "Nunca",
      "score": 0,
      "order_index": 1,
      "option_type": "standard",
      "metadata": {
        "color": "#f8f9fa",
        "description": "Ausencia total"
      }
    }
  ],

  // GRUPOS DE RESPUESTA (para escalas con diferentes conjuntos de opciones)
  "response_groups": [
    {
      "id": "escala-group-estado",
      "key": "estado",
      "name": "Ansiedad Estado",
      "description": "Cómo se siente en este momento",
      "display_order": 1,
      "options": [
        {
          "id": "escala-estado-opt-0",
          "value": "0",
          "label": "Nada",
          "score": 0,
          "order_index": 1
        }
      ]
    }
  ],

  // SUBESCALAS
  "subscales": [
    {
      "id": "escala-sub-cognitiva",
      "name": "Síntomas Cognitivos",
      "items": [1, 2, 3, 4, 5], // Números de ítems
      "min_score": 0,
      "max_score": 15,
      "description": "Evalúa síntomas cognitivos de depresión",
      "referencias_bibliograficas": "Beck et al., 1996",
      "indice_cronbach": 0.85
    }
  ],

  // REGLAS DE INTERPRETACIÓN
  "interpretation_rules": [
    {
      "id": "escala-int-minimal",
      "min_score": 0,
      "max_score": 13,
      "severity_level": "minimal",
      "label": "Mínima",
      "color": "#22c55e",
      "description": "Ausencia de síntomas clínicamente significativos",
      "recommendations": "No se requiere intervención específica. Mantener actividades de bienestar."
    }
  ],

  // DOCUMENTACIÓN CIENTÍFICA
  "documentation": {
    "bibliography": "Referencias bibliográficas completas...",
    "sources_consulted": [
      "Beck, A. T., et al. (1996). Manual BDI-II.",
      "American Psychiatric Association (2013). DSM-5."
    ],
    "implementation_notes": "Notas importantes de implementación...",
    "psychometric_properties": {
      "reliability": {
        "internal_consistency": 0.91,
        "test_retest": 0.84
      },
      "validity": {
        "construct": "Confirmada mediante AFC",
        "criterion": "Correlación r=0.78 con HAM-D"
      }
    },
    "clinical_considerations": "Consideraciones clínicas importantes...",
    "special_items_notes": {
      "reverse_items": [2, 5, 8, 11],
      "alert_items": [9, 14, 17],
      "clinical_cutoffs": {
        "mild": 14,
        "moderate": 20,
        "severe": 29
      }
    },
    "version_notes": "Notas específicas de esta versión...",
    "target_population_details": "Detalles sobre población objetivo...",
    "clinical_interpretation": "Guía de interpretación clínica..."
  }
}
```

  // REGLAS DE VALIDACIÓN Y LÓGICA (Opcional pero recomendado)
  "validation_rules": {
    "required_items": [1, 2, 3, 9],  // Ítems que no pueden saltarse
    "conditional_logic": [  // Mostrar/ocultar ítems según condiciones
      {
        "condition": "item_9 >= 2",  // Si ítem 9 es >= 2
        "action": "show_item",       // Mostrar ítem adicional
        "target": "item_9b"          // ID del ítem a mostrar
      }
    ],
    "skip_logic": [  // Saltar secciones según respuestas
      {
        "condition": "item_1 == 0",  // Si ítem 1 es 0
        "action": "skip_to",         // Saltar a otro ítem
        "target": "item_5"           // ID del ítem destino
      }
    ]
  },

  // METADATOS ADICIONALES (Opcional)
  "metadata": {
    "language": "es",
    "country": "MX",
    "last_updated": "2024-01-15",
    "administration": {
      "estimated_time_range": "5-15 minutos",
      "supported_modes": ["self_administered", "clinician_administered", "hybrid"],
      "device_compatibility": ["desktop", "tablet", "mobile"],
      "accessibility_features": ["screen_reader", "high_contrast", "font_resize"]
    },
    "psychometric_extended": {
      "cronbach_alpha": 0.92,
      "test_retest_reliability": 0.85,
      "concurrent_validity": 0.78,
      "sensitivity": 0.89,
      "specificity": 0.82,
      "ppv": 0.84,  // Valor predictivo positivo
      "npv": 0.88   // Valor predictivo negativo
    }
  }
}
```

## Tipos de Pregunta Disponibles

### 1. **likert** - Escala Likert
```json
{
  "question_type": "likert",
  "metadata": {
    "layout": "vertical",      // "vertical" | "horizontal"
    "show_numbers": true,
    "show_labels": true
  }
}
```

### 2. **dichotomous** - Dicotómica (Sí/No)
```json
{
  "question_type": "dichotomous",
  "metadata": {
    "layout": "horizontal",
    "style": "buttons"         // "buttons" | "radio"
  },
  "specific_options": [
    {"value": "0", "label": "No", "score": 0},
    {"value": "1", "label": "Sí", "score": 1}
  ]
}
```

### 3. **vas** - Escala Visual Analógica
```json
{
  "question_type": "vas",
  "metadata": {
    "min_value": 0,
    "max_value": 100,
    "step": 1,
    "left_label": "Nada de dolor",
    "right_label": "Dolor extremo",
    "show_value": true,
    "show_ticks": true
  }
}
```

### 4. **numeric** - Escala Numérica
```json
{
  "question_type": "numeric",
  "metadata": {
    "min_value": 0,
    "max_value": 10,
    "step": 1,
    "layout": "scale",         // "scale" | "input"
    "show_labels": true
  }
}
```

### 5. **multiple_choice** - Opción Múltiple
```json
{
  "question_type": "multiple_choice",
  "metadata": {
    "layout": "vertical",
    "randomize": false,
    "allow_other": false
  }
}
```

### 6. **text** - Respuesta Abierta
```json
{
  "question_type": "text",
  "metadata": {
    "max_length": 500,
    "min_length": 10,
    "rows": 3,
    "placeholder": "Describa sus síntomas...",
    "rich_text": false
  }
}
```

### 7. **checklist** - Lista de Verificación
```json
{
  "question_type": "checklist",
  "metadata": {
    "min_selections": 0,
    "max_selections": 5,
    "layout": "vertical",
    "exclusive_options": [0]   // Opciones que excluyen otras
  }
}
```

### 8. **ranking** - Ordenamiento/Priorización
```json
{
  "question_type": "ranking",
  "metadata": {
    "max_rank": 5,
    "allow_ties": false,
    "instruction": "Ordene del 1 al 5 según importancia"
  }
}
```

### 9. **semantic_diff** - Diferencial Semántico
```json
{
  "question_type": "semantic_diff",
  "metadata": {
    "left_concept": "Muy triste",
    "right_concept": "Muy feliz",
    "scale_points": 7,
    "show_numbers": true,
    "neutral_label": "Neutral"
  }
}
```

### 10. **frequency** - Frecuencia Temporal
```json
{
  "question_type": "frequency",
  "metadata": {
    "time_frame": "last_week",  // "last_week" | "last_month" | "last_year"
    "layout": "vertical"
  },
  "specific_options": [
    {"value": "0", "label": "Nunca", "score": 0},
    {"value": "1", "label": "Raramente", "score": 1},
    {"value": "2", "label": "A veces", "score": 2},
    {"value": "3", "label": "Frecuentemente", "score": 3},
    {"value": "4", "label": "Siempre", "score": 4}
  ]
}
```

### 11. **matrix** - Matriz de Preguntas
```json
{
  "question_type": "matrix",
  "metadata": {
    "rows": ["Síntoma A", "Síntoma B", "Síntoma C"],
    "columns": ["Nunca", "A veces", "Siempre"],
    "allow_na": true
  }
}
```

### 12. **slider** - Deslizador
```json
{
  "question_type": "slider",
  "metadata": {
    "min": 0,
    "max": 100,
    "step": 5,
    "default": 50,
    "show_value": true,
    "show_labels": true
  }
}
```

## Campos Requeridos vs Opcionales

### REQUERIDOS (obligatorios)
- `scale.id`, `scale.name`, `scale.abbreviation`, `scale.description`
- `items[]` con `id`, `number`, `text` para cada ítem
- `response_options[]` O `response_groups[]` (al menos uno)

### OPCIONALES (pero recomendados)
- `subscales[]` - Para escalas multidimensionales
- `interpretation_rules[]` - Para interpretación automática  
- `documentation` - Para trazabilidad científica

## Ejemplos de Casos Especiales

### 1. Escala con Opciones Globales (BDI-21)
- Algunos ítems usan `response_options` globales
- Algunos ítems tienen `specific_options` únicas

### 2. Escala con Grupos de Respuesta (STAI)
- `response_groups[]` define diferentes conjuntos
- Ítems especifican `response_group: "estado"` o `"rasgo"`

### 3. Escala Simple (Ejemplo: GAD-7)
- Solo `response_options[]` globales
- Todos los ítems usan las mismas opciones

## Validación Automática

El importador valida:
- ✅ Estructura JSON válida
- ✅ Campos requeridos presentes  
- ✅ Consistencia de IDs únicos
- ✅ Números de ítems secuenciales
- ✅ Referencias válidas entre objetos

## Flujo de Importación

1. **Validar JSON** → Estructura y campos requeridos
2. **Limpiar existente** → Eliminar datos previos de la escala
3. **Importar orden**:
   - Escala principal
   - Grupos de respuesta  
   - Opciones de respuesta
   - Ítems (con opciones específicas)
   - Subescalas
   - Reglas de interpretación
   - Documentación
4. **Validar importación** → Verificar completitud
5. **Reporte** → Estadísticas y errores

## Uso del Sistema

```bash
# Importar una escala
node scripts/universal-scale-importer.js scales/bdi-21.json

# Importar todas las escalas de un directorio  
node scripts/universal-scale-importer.js --batch scales/

# El sistema automáticamente:
# - Valida el JSON
# - Limpia datos existentes
# - Importa completamente
# - Valida la importación
# - Reporta estadísticas
```

Este formato garantiza que **CUALQUIER ESCALA** se importe completamente y funcione desde el primer intento en el sistema universal.