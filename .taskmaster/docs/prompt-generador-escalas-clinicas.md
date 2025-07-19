# Prompt para Crear Generador Visual de Escalas Clínicas

## Contexto del Sistema

Estoy trabajando con un sistema de escalas clínicas que usa arquitectura database-first. Las escalas se definen mediante archivos JSON que luego se convierten a SQL. El proceso actual requiere crear manualmente un JSON con esta estructura:

```json
{
  "scale": {
    "id": "scale-id",
    "name": "Nombre de la Escala",
    "abbreviation": "SIGLAS",
    "category": "categoria",
    "description": "Descripción",
    "totalItems": 10,
    "estimatedDurationMinutes": 15,
    "administrationMode": "self_administered",
    "targetPopulation": "adults",
    "scoringMethod": "sum",
    "scoreMin": 0,
    "scoreMax": 40
  },
  "responseOptions": [
    {
      "id": "scale-id-opt-0",
      "value": "0",
      "label": "Nunca",
      "score": 0,
      "orderIndex": 1
    }
  ],
  "items": [
    {
      "id": "scale-id-item-1",
      "number": 1,
      "text": "Pregunta del item",
      "alertTrigger": false
    }
  ],
  "interpretationRules": [
    {
      "id": "scale-id-int-minimal",
      "minScore": 0,
      "maxScore": 10,
      "severityLevel": "minimal",
      "label": "Mínimo",
      "color": "#27AE60"
    }
  ]
}
```

## Lo que Necesito

Crea una aplicación web interactiva (HTML + JavaScript vanilla) que:

### 1. **Interfaz Visual Intuitiva**
- Formulario dividido en secciones claras:
  - Información General de la Escala
  - Opciones de Respuesta
  - Items/Preguntas
  - Reglas de Interpretación
- Diseño moderno con Tailwind CSS o similar
- Validación en tiempo real
- Preview del JSON generado

### 2. **Funcionalidades Clave**
- **Agregar/Eliminar Items**: Botones para añadir preguntas dinámicamente
- **Gestión de Opciones de Respuesta**: 
  - Templates predefinidos (Likert 5 puntos, Si/No, etc.)
  - **Opciones Variables por Item**: Cada pregunta puede tener diferentes opciones
  - **Puntuación Irregular**: Opciones con scores no consecutivos (ej: 0, 2, 5, 10)
  - **Opciones Personalizadas**: Crear opciones específicas para cada item
- **Escalas Atípicas**:
  - **Items con 3-5 opciones diferentes**: Flexibilidad total por pregunta
  - **Puntuación Inversa**: Checkbox para reverse scoring por item
  - **Alertas Condicionales**: Items que disparan alertas según respuesta
- **Calculadora de Puntajes**: Auto-calcular scoreMax basado en items y opciones
- **Reglas de Interpretación**: 
  - Interfaz para definir rangos de severidad
  - Selector de colores visual
  - Validación de rangos (no overlap)

### 3. **Características Avanzadas**
- **Importar/Exportar**: 
  - Cargar JSON existente para editar
  - Descargar JSON generado
  - Copiar al portapapeles
- **Templates de Escalas Comunes**: PHQ-9, GAD-7, etc.
- **Validación Inteligente**:
  - IDs únicos auto-generados
  - Verificar coherencia de datos
  - Alertar sobre errores comunes

### 4. **Experiencia de Usuario**
- Tooltips explicativos para cada campo
- Ejemplos en placeholders
- Vista previa en tiempo real del JSON
- Modo oscuro/claro
- Responsive para móviles

### 5. **Categorías y Opciones Disponibles**

**Categorías (campo libre VARCHAR(50) - puedes crear nuevas):**
- depression, anxiety, cognitive, personality, psychosis, substance_use, autism, general
- family_assessment, autism_screening, trauma, bipolar, eating_disorder, sleep, pain
- addiction, neuropsychology, memory, attention, executive_function, social_skills
- behavior, mood, stress, ptsd, ocd, adhd, learning_disabilities, dementia
- **O cualquier categoría personalizada que necesites**

**Modos de administración:**
- self_administered, clinician_administered, hybrid, computer_administered, both

**Población objetivo:**
- adults, children, adolescents, elderly, all, specific (campo libre)

**Métodos de puntuación:**
- sum, weighted_sum, average, subscales, algorithm, lookup_table, complex

**Niveles de severidad:**
- minimal, mild, moderate, moderately_severe, severe, extreme, clinical, subclinical

### 6. **Código de Ejemplo**

La aplicación debe generar automáticamente:
- IDs consistentes (ej: "phq9" → "phq9-opt-0", "phq9-item-1")
- orderIndex para opciones de respuesta
- Colores apropiados para niveles de severidad
- Validación de rangos de interpretación

### 7. **Extras Útiles**
- Modo "Wizard" paso a paso
- Guardar borradores en localStorage
- Historial de cambios (undo/redo)
- Exportar documentación de la escala en Markdown
- Vista previa de cómo se vería la escala en la aplicación

## Resultado Esperado

Una aplicación web completa en un solo archivo HTML que pueda:
1. Abrir en cualquier navegador
2. Crear escalas clínicas visualmente
3. Generar el JSON correcto para el sistema
4. Validar todos los datos
5. Facilitar el proceso sin necesidad de editar JSON manualmente

## Ejemplo de Escalas Atípicas Soportadas

### **Escala con Opciones Variables por Item**
```json
"items": [
  {
    "id": "escala-item-1",
    "number": 1,
    "text": "¿Con qué frecuencia experimenta esto?",
    "responseOptions": [
      {"value": "0", "label": "Nunca", "score": 0},
      {"value": "1", "label": "Rara vez", "score": 1},
      {"value": "2", "label": "A menudo", "score": 3},
      {"value": "3", "label": "Siempre", "score": 5}
    ]
  },
  {
    "id": "escala-item-2", 
    "number": 2,
    "text": "¿Esto le causa problemas?",
    "alertTrigger": true,
    "reverseScored": true,
    "responseOptions": [
      {"value": "0", "label": "Muchos problemas", "score": 0},
      {"value": "1", "label": "Algunos problemas", "score": 2},
      {"value": "2", "label": "Sin problemas", "score": 4}
    ]
  }
]
```

## Ejemplo de Uso

1. Abro el archivo HTML
2. Lleno un formulario visual con la información de mi escala
3. **Para escalas atípicas**: Marco "Opciones variables por item"
4. Agrego las preguntas una por una con sus opciones específicas
5. **Configuro puntuación irregular** (ej: 0, 2, 5, 10)
6. **Activo alertas condicionales** donde sea necesario
7. Defino los rangos de interpretación con sliders
8. Descargo el JSON generado
9. Lo uso directamente en mi sistema con `npm run universal:add-scale`

---

Por favor, crea esta herramienta completa, priorizando la facilidad de uso y la generación correcta del formato JSON requerido.