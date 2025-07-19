# Clinimetrix - Funcionamiento del Sistema

## Concepto General

**Clinimetrix** es el hub de evaluación clínica dentro del universo **MindHub**. Es un sistema automatizado de evaluación que permite administrar, puntuar e interpretar escalas clínicas estandarizadas de manera uniforme y profesional.

## Arquitectura del Sistema

### 1. Sistema Universal de Escalas

**Enfoque Database-First** con esquema unificado para todas las escalas:

#### Estructura de Base de Datos:
- **`scales`** - Metadatos de cada escala (nombre, autor, año, categoría, etc.)
- **`scale_items`** - Items individuales de cada escala
- **`scale_response_options`** - Opciones de respuesta uniformes por escala
- **`scale_interpretation_rules`** - Reglas de interpretación por rangos de puntaje
- **`scale_subscales`** - Subescalas opcionales
- **`assessments`** - Evaluaciones completadas
- **`assessment_responses`** - Respuestas individuales registradas
- **`assessment_subscale_results`** - Resultados de subescalas

### 2. Implementación de Escalas

**Cada escala se implementa mediante un archivo seed SQL** que contiene:
- Definición completa de la escala
- Todos los items con su texto y códigos
- Opciones de respuesta con valores de puntaje
- Reglas de interpretación por rangos
- Subescalas (si aplica)

**Escalas Implementadas:**
- **PHQ-9** - Depresión (9 items, 4 opciones, 5 niveles interpretación)
- **GADI** - Ansiedad Generalizada (22 items, 4 opciones, 4 niveles, 3 subescalas)
- **AQ-Adolescent** - Autismo adolescente
- **PAS** - Otra escala clínica

### 3. Modos de Administración

**Dos modos principales:**

#### Modo Auto-administrado
- El paciente responde directamente
- Interfaz amigable y clara
- Links tokenizados para acceso seguro
- Respuestas almacenadas temporalmente

#### Modo Hetero-administrado
- El profesional administra la escala
- Interfaz para registro de respuestas
- Observaciones clínicas adicionales
- Control total del proceso

### 4. Flujo de Evaluación

```
1. Selección de Escala → 2. Administración → 3. Puntaje Automático → 4. Interpretación → 5. Reporte
```

#### Proceso Detallado:
1. **Selección**: Profesional elige escala apropiada
2. **Configuración**: Modo de administración (auto/hetero)
3. **Administración**: Presentación de items según escala
4. **Recolección**: Almacenamiento seguro de respuestas
5. **Puntaje**: Cálculo automático según algoritmo de la escala
6. **Interpretación**: Aplicación de reglas de interpretación
7. **Reporte**: Generación de resultados visuales y clínicos

### 5. Características Técnicas

#### Seguridad:
- Links tokenizados para evaluaciones remotas
- Almacenamiento seguro de respuestas
- Acceso controlado por profesional
- Encriptación de datos sensibles

#### Validación:
- Algoritmos de puntaje validados
- Reglas de interpretación estandarizadas
- Verificación de completitud de respuestas
- Control de calidad automático

#### Escalabilidad:
- Agregar nuevas escalas = crear nuevo archivo seed
- Estructura uniforme para todas las escalas
- Soporte para diferentes tipos de puntaje
- Flexibilidad para subescalas

### 6. Interfaz de Usuario

#### Para Profesionales:
- Dashboard de escalas disponibles
- Gestión de evaluaciones pendientes
- Visualización de resultados
- Exportación de reportes

#### Para Pacientes (auto-administrado):
- Interfaz simple y clara
- Progreso visual
- Instrucciones paso a paso
- Diseño responsive

### 7. Integración con MindHub

**Clinimetrix se integra con otros hubs:**
- **Expedix**: Datos de pacientes para evaluaciones
- **Formx**: Formularios personalizados complementarios
- **Resources**: Biblioteca de recursos clínicos
- **Sistema Central**: Autenticación y permisos

### 8. Futuras Expansiones

**Escalas Pendientes de Implementación:**
- Escalas cognitivas (MMSE, MoCA, etc.)
- Escalas de personalidad
- Escalas de adicción
- Escalas de calidad de vida
- Escalas pediátricas

**Funcionalidades Avanzadas:**
- Análisis longitudinal
- Comparaciones normativas
- Alertas automáticas
- Integración con historiales clínicos
- Reportes estadísticos

## Ventajas del Sistema

✅ **Uniformidad**: Todas las escalas siguen la misma estructura
✅ **Profesionalidad**: Implementación clínicamente validada
✅ **Flexibilidad**: Soporta diferentes tipos de escalas y puntajes
✅ **Escalabilidad**: Fácil agregar nuevas escalas
✅ **Seguridad**: Datos protegidos y acceso controlado
✅ **Automatización**: Puntaje e interpretación automáticos
✅ **Integración**: Parte del ecosistema MindHub completo

---

**Nota:** Este documento sirve como memoria técnica para entender el funcionamiento completo del sistema Clinimetrix dentro del universo MindHub.