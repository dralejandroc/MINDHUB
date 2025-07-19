# Prompt Simplificado: Extractor AI de Escalas Clínicas

## Objetivo
Extrae información completa de escalas clínicas desde internet y genera JSONs listos para usar en nuestro sistema.

## Lo que necesito

### Escalas a extraer (50+ escalas):
**Depresión:** BDI-II, HDRS, MADRS, CES-D, GDS, PHQ-8
**Ansiedad:** BAI, STAI, HAM-A, GAD-7, SPIN, PSWQ
**Cognitivas:** MMSE, MoCA, SLUMS, ACE-III, Trail Making Test
**Personalidad:** MMPI-2, MCMI-IV, PAI, NEO-PI-3
**Trauma:** CAPS-5, PCL-5, CTQ, IES-R
**Específicos:** Y-BOCS, ADHD Rating Scale, ADOS-2, YMRS, CAGE

### Formato JSON requerido:
```json
{
  "scale": {
    "id": "bdi-ii",
    "name": "Beck Depression Inventory-II",
    "abbreviation": "BDI-II",
    "category": "depression",
    "total_items": 21,
    "score_range_min": 0,
    "score_range_max": 63
  },
  "items": [
    {
      "id": "bdi-ii-item-1",
      "number": 1,
      "text": "Texto exacto de la pregunta"
    }
  ],
  "responseOptions": [
    {
      "value": "0",
      "label": "Opción de respuesta",
      "score": 0
    }
  ],
  "interpretationRules": [
    {
      "minScore": 0,
      "maxScore": 13,
      "severityLevel": "minimal",
      "label": "Depresión mínima"
    }
  ]
}
```

## Proceso:
1. **Buscar** cada escala en PubMed, sitios oficiales, manuales
2. **Extraer** TODOS los items, opciones de respuesta, puntuaciones
3. **Generar** JSON completo y sintácticamente válido
4. **Documentar** fuentes consultadas

## Entrega:
Un documento markdown con todas las escalas en formato JSON, organizadas por categoría, listas para copiar/pegar y usar directamente.

**Prioridades:** Precisión de los datos, completitud de items, JSONs válidos.