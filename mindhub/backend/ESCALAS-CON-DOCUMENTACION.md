# 📚 Sistema de Escalas con Documentación Científica

Este sistema permite procesar escalas psicométricas desde archivos Markdown que incluyen tanto el JSON de la escala como documentación científica completa (fuentes bibliográficas, propiedades psicométricas, notas de implementación, etc.).

## 🎯 Características

- **Documentación científica integrada**: Referencias bibliográficas, propiedades psicométricas, consideraciones clínicas
- **Parser inteligente**: Extrae automáticamente JSON y documentación de archivos Markdown
- **Generación automática de SQL**: Crea seeds tanto para escalas como para documentación
- **Validación completa**: Verifica estructura y completitud de los datos
- **Sistema unificado**: Reemplaza múltiples scripts antiguos con una solución coherente

## 📁 Estructura de Archivos

```
backend/
├── database/
│   ├── templates/           # Archivos .json (Markdown) de escalas
│   │   ├── stai.json       # Ejemplo: STAI con documentación completa
│   │   ├── phq9.json       # Ejemplo: PHQ-9 con documentación
│   │   └── ...
│   ├── seeds/              # SQL generados automáticamente
│   │   └── documentation/  # SQL de documentación científica
│   └── migrations/         # Schema de tablas
├── scripts/
│   ├── scale-markdown-parser.js           # Parser de archivos Markdown
│   ├── process-scale-documentation.js     # Procesador principal
│   └── apply-scale-migrations.js          # Aplicador de migraciones
└── ESCALAS-CON-DOCUMENTACION.md          # Esta documentación
```

## 🚀 Uso Rápido

### 1. Procesar escalas desde templates

```bash
# Procesar todas las escalas en database/templates/
cd mindhub/backend
node scripts/process-scale-documentation.js

# Procesar escalas desde un directorio específico
node scripts/process-scale-documentation.js /ruta/a/tus/escalas
```

### 2. Aplicar migraciones a la base de datos

```bash
# Aplicar todas las migraciones automáticamente
node scripts/apply-scale-migrations.js

# Aplicar un script de migración específico
node scripts/apply-scale-migrations.js --complete complete_migration_20240115_143022.sql

# Configurar conexión personalizada
node scripts/apply-scale-migrations.js --host localhost --port 3306 --user admin --password secret --database mi_db
```

## 📝 Formato de Archivo de Escala

Tus archivos deben tener extensión `.json` pero contener Markdown con esta estructura:

```markdown
# Nombre de la Escala - Descripción Completa

## Fuentes Consultadas

- Autor, A. A. (2020). Título del artículo. Revista de Psicología, 15(3), 123-145.
- Autor, B. B., & Autor, C. C. (2019). Manual de la escala. Editorial Médica.

## JSON Validado

\```json
{
  "scale": {
    "id": "mi-escala",
    "name": "Mi Escala Psicométrica",
    "description": "Descripción detallada...",
    // ... resto del JSON
  },
  "responseOptions": [...],
  "items": [...],
  "interpretationRules": [...]
}
\```

## Notas de Implementación

- **Ítems Inversos**: Los ítems 1, 5, 8 requieren puntuación invertida
- **Propiedades Psicométricas**: α de Cronbach = 0.89
- **Población Objetivo**: Adultos de 18-65 años
```

## 📊 Base de Datos

### Tabla Principal: `scales`
Almacena información básica de la escala (nombre, ítems, opciones de respuesta, etc.)

### Tabla Nueva: `scale_documentation`
Almacena documentación científica:
- `bibliography`: Referencias bibliográficas completas
- `sources_consulted`: JSON con fuentes estructuradas  
- `implementation_notes`: Notas técnicas de implementación
- `psychometric_properties`: Propiedades psicométricas (α, validez, etc.)
- `clinical_considerations`: Consideraciones para uso clínico
- `special_items_notes`: Información sobre ítems inversos, alertas
- `version_notes`: Notas sobre adaptaciones y versiones
- `target_population_details`: Población objetivo detallada
- `clinical_interpretation`: Guías de interpretación adicionales

## 🔧 Scripts Disponibles

### `scale-markdown-parser.js`
Clase para parsear archivos Markdown de escalas.

```javascript
const ScaleMarkdownParser = require('./scripts/scale-markdown-parser');
const parser = new ScaleMarkdownParser();
const result = await parser.parseScaleFile('stai.json');
// result = { scaleData, documentation, metadata }
```

### `process-scale-documentation.js`
Procesador principal que:
1. Lee archivos Markdown de escalas
2. Extrae JSON y documentación
3. Genera archivos SQL
4. Valida datos

### `apply-scale-migrations.js`
Aplicador de migraciones que:
1. Crea tabla de documentación
2. Aplica seeds de escalas
3. Aplica seeds de documentación
4. Verifica que todo funcionó correctamente

## ✅ Ventajas del Nuevo Sistema

### Para Desarrolladores
- **Código limpio**: Un solo sistema unificado
- **Menos archivos**: Eliminados 8+ scripts antiguos
- **Validación automática**: Detecta errores antes de aplicar
- **Trazabilidad**: Logs detallados de todo el proceso

### Para Profesionales Clínicos
- **Documentación científica**: Acceso a referencias y propiedades psicométricas
- **Contexto clínico**: Consideraciones especiales para cada escala  
- **Información completa**: Todo lo necesario para usar correctamente la escala
- **Credibilidad**: Referencias académicas incluidas

### Para el Sistema
- **Base de conocimiento**: Biblioteca científica de escalas
- **Diferenciador competitivo**: Pocos sistemas incluyen esta información
- **Compliance**: Facilita auditorías y certificaciones
- **Escalabilidad**: Fácil agregar nuevas escalas con toda su documentación

## 🚨 Migración desde Sistema Anterior

Si tenías escalas en el sistema anterior:
1. Las escalas existentes seguirán funcionando
2. La nueva tabla `scale_documentation` es independiente
3. Puedes agregar documentación a escalas existentes manualmente
4. Los scripts antiguos fueron eliminados para evitar confusión

## 📈 Próximos Pasos

1. **UI Frontend**: Agregar interfaz para ver documentación científica
2. **API Endpoints**: Crear endpoints para acceder a la documentación
3. **Sistema de búsqueda**: Búsqueda por propiedades psicométricas
4. **Exportación**: Generar reportes con documentación completa
5. **Versionado**: Sistema de versiones para escalas actualizadas

## 🤝 Contribuir

Para agregar nuevas escalas:
1. Crear archivo `.json` (Markdown) en `database/templates/`
2. Seguir el formato documentado arriba
3. Ejecutar el procesador: `node scripts/process-scale-documentation.js`
4. Aplicar migraciones: `node scripts/apply-scale-migrations.js`

---

**Autor**: Claude Code Assistant  
**Fecha**: Enero 2024  
**Versión**: 1.0  

> 🎯 **Objetivo**: Crear el sistema más completo de escalas psicométricas con documentación científica integrada, proporcionando tanto funcionalidad técnica como credibilidad académica.