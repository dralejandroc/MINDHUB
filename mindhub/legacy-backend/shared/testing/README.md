# MindHub Healthcare Platform - Integration Testing Suite

Este directorio contiene la suite completa de pruebas de integración y validación para la plataforma de salud MindHub, diseñada específicamente para cumplir con los estándares de atención médica y normativas de México.

## 📋 Descripción General

La suite de pruebas incluye:

- **Pruebas de Integración Completa**: Validación de flujos de trabajo de atención médica
- **Validación de Contratos API**: Verificación de consistencia de endpoints
- **Pruebas de Rendimiento y Carga**: Evaluación bajo condiciones realistas
- **Pruebas de Seguridad y Cumplimiento**: Validación de estándares de seguridad en salud
- **Reportes Comprehensivos**: Documentación detallada de resultados

## 🗂️ Estructura de Archivos

```
shared/testing/
├── README.md                          # Este archivo
├── comprehensive-test-runner.js        # Runner principal para todas las pruebas
├── api-test-suite.js                   # Suite base de pruebas de API
├── integration-tests.js                # Pruebas de integración de flujos de trabajo
├── integrix-integration-tests.js       # Pruebas específicas de Integrix (gateway)
├── api-contract-validation.js          # Validación de contratos de API
├── performance-load-tests.js           # Pruebas de rendimiento y carga
├── security-compliance-tests.js        # Pruebas de seguridad y cumplimiento
└── test-runner.js                      # Runner base heredado
```

## 🚀 Inicio Rápido

### Requisitos Previos

```bash
npm install supertest joi jsonwebtoken bcryptjs uuid
```

### Uso Básico

```javascript
const express = require('express');
const ComprehensiveTestRunner = require('./shared/testing/comprehensive-test-runner');

// Tu aplicación Express
const app = express();

// Configurar y ejecutar pruebas
const runner = new ComprehensiveTestRunner(app, {
  baseURL: '/api/v1',
  outputDir: './test-reports',
  verbose: true
});

async function runTests() {
  try {
    const results = await runner.runComprehensiveTests();
    console.log('Resultados:', results.summary);
  } catch (error) {
    console.error('Error en pruebas:', error);
  }
}

runTests();
```

## 🧪 Suites de Pruebas Disponibles

### 1. Comprehensive Test Runner (`comprehensive-test-runner.js`)
Runner maestro que ejecuta todas las suites de pruebas y genera reportes completos.

### 2. API Test Suite (`api-test-suite.js`)
Pruebas fundamentales de la API incluyendo autenticación, validación y cumplimiento normativo.

### 3. Integration Tests (`integration-tests.js`)
Pruebas de flujos de trabajo completos de atención médica y comunicación entre servicios.

### 4. Integrix Integration Tests (`integrix-integration-tests.js`)
Pruebas específicas del gateway interno Integrix para descubrimiento de servicios y enrutamiento.

### 5. API Contract Validation (`api-contract-validation.js`)
Validación de contratos usando esquemas Joi para garantizar consistencia de API.

### 6. Performance Load Tests (`performance-load-tests.js`)
Pruebas de rendimiento bajo diferentes condiciones de carga y estrés.

### 7. Security Compliance Tests (`security-compliance-tests.js`)
Pruebas de seguridad y cumplimiento con estándares de salud como HIPAA y NOM-024.

## ⚙️ Configuración

### Ejemplo de Configuración Completa

```javascript
const config = {
  baseURL: '/api/v1',
  outputDir: './test-reports',
  verbose: true,
  
  // Suites a ejecutar
  suites: {
    api: true,
    integration: true,
    integrix: true,
    contracts: true,
    performance: true,
    security: true
  },
  
  // Configuración de rendimiento
  performance: {
    loadTest: { users: 25, duration: 30000 },
    stressTest: { maxUsers: 100, stepSize: 20 }
  },
  
  // Configuración de seguridad
  security: {
    complianceStandards: ['hipaa', 'nom024', 'gdpr']
  }
};
```

## 📊 Reportes Generados

1. **Reporte JSON Completo**: Resultados detallados en formato JSON
2. **Reporte HTML Interactivo**: Dashboard visual con métricas
3. **Resumen Ejecutivo**: Documento markdown de alto nivel
4. **Reporte de Cumplimiento**: Estado de cumplimiento normativo

## 🏥 Cumplimiento de Estándares de Salud

### HIPAA (Estados Unidos)
- Controles de acceso a PHI (Protected Health Information)
- Auditoría de accesos y registros
- Cifrado de datos en tránsito y reposo

### NOM-024-SSA3-2010 (México)
- Autenticación de profesionales de salud
- Cifrado de datos de pacientes
- Integridad de registros médicos

### COFEPRIS (México)
- Certificación de software médico
- Validación de datos clínicos
- Sistema de gestión de calidad

## 🔧 Ejecución

### Ejecutar Suite Completa

```javascript
const runner = new ComprehensiveTestRunner(app);
const results = await runner.runComprehensiveTests();
```

### Ejecutar Suites Específicas

```javascript
// Solo pruebas de API
const apiSuite = new APITestSuite(app);
const apiResults = await apiSuite.runAllTests();

// Solo pruebas de seguridad
const securityTests = new SecurityComplianceTests(app);
const securityResults = await securityTests.runSecurityComplianceTestSuite();
```

## 📈 Métricas de Cumplimiento

### Estados Posibles
- **COMPLIANT**: Cumple todos los requisitos
- **NON_COMPLIANT**: Violaciones detectadas
- **UNKNOWN**: Estado indeterminado

### Criterios de Evaluación
- Tiempo de respuesta (P50, P95, P99)
- Tasa de error < 1%
- Disponibilidad > 99.9%
- Cumplimiento de seguridad > 95%

## 🚨 Resolución de Problemas

### Problemas Comunes

1. **Timeouts en pruebas de rendimiento**: Aumentar timeout o reducir carga
2. **Fallas de autenticación**: Verificar configuración JWT
3. **Problemas de memoria**: Usar flags de Node.js para memoria extendida

### Debugging

```javascript
const runner = new ComprehensiveTestRunner(app, {
  verbose: true,
  suites: { api: true } // Solo una suite para debugging
});
```

## 🤝 Uso en CI/CD

```yaml
# GitHub Actions example
- name: Run Integration Tests
  run: node shared/testing/comprehensive-test-runner.js

- name: Upload Reports
  uses: actions/upload-artifact@v2
  with:
    name: test-reports
    path: test-reports/
```

---

**Versión**: 1.0.0  
**Autor**: Equipo de Desarrollo MindHub  
**Fecha**: Julio 2025