# Prompt Simplificado - Generador Visual de Escalas Clínicas

Necesito una herramienta web para crear escalas clínicas sin editar JSON manualmente.

## Estructura JSON Requerida
```json
{
  "scale": {
    "id": "nombre-escala",
    "name": "Nombre Completo",
    "abbreviation": "SIGLAS",
    "category": "depression|anxiety|cognitive|etc",
    "totalItems": 10,
    "scoringMethod": "sum",
    "scoreMin": 0,
    "scoreMax": 40
  },
  "responseOptions": [
    {"id": "nombre-escala-opt-0", "value": "0", "label": "Nunca", "score": 0}
  ],
  "items": [
    {"id": "nombre-escala-item-1", "number": 1, "text": "Pregunta"}
  ],
  "interpretationRules": [
    {"minScore": 0, "maxScore": 10, "severityLevel": "minimal", "label": "Leve"}
  ]
}
```

## Crear una aplicación web (1 archivo HTML) que tenga:

1. **Formulario Visual** con 4 secciones:
   - Datos básicos de la escala
   - Opciones de respuesta (ej: Likert, Si/No)
   - Lista de preguntas
   - Rangos de interpretación

2. **Funciones Principales**:
   - Botón "+" para agregar preguntas
   - Templates de respuestas comunes
   - Auto-generar IDs únicos
   - Vista previa del JSON
   - Botón descargar JSON

3. **Validaciones**:
   - Campos requeridos
   - IDs únicos
   - Rangos sin solapamiento

4. **UX Simple**:
   - Diseño limpio con CSS
   - Tooltips de ayuda
   - Responsive

Generar todo en un solo archivo HTML autosuficiente con JavaScript inline.