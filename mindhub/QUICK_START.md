# 🚀 MindHub MVP - Guía de Inicio Rápido

## ⚡ Inicio Rápido (5 minutos)

### 1. **Instalar XAMPP**
```bash
# Descargar desde: https://www.apachefriends.org/
# Iniciar Apache y MySQL
```

### 2. **Instalar Dependencias**
```bash
cd /Users/alekscon/taskmaster-ai/mindhub/frontend
npm install --force
```

### 3. **Configurar Variables de Entorno**
```bash
cd /Users/alekscon/taskmaster-ai
cp .env.example .env
# Editar .env si es necesario
```

### 4. **Ejecutar MVP**
```bash
cd /Users/alekscon/taskmaster-ai/mindhub/frontend
npm run dev
```

### 5. **Acceder al Sistema**
- **Dashboard**: http://localhost:3000
- **Expedi+Recetix**: http://localhost:3000/hubs/expedix
- **Evaluaciones PHQ-9**: http://localhost:3000/hubs/clinimetrix
- **Recursos**: http://localhost:3000/hubs/resources

## 🎯 Funcionalidades Principales

### ✅ **Expedi+Recetix** - Sistema Completo
- Gestión de pacientes con datos de ejemplo
- Consultas médicas con signos vitales
- Sistema de recetas digitales con medicamentos
- Diagnósticos CIE-10 integrados
- Impresión de recetas

### ✅ **Clinimetrix** - Evaluaciones PHQ-9
- Cuestionario PHQ-9 de 9 preguntas
- Cálculo automático de severidad
- Recomendaciones clínicas automáticas
- Detección de riesgo suicida

### ✅ **Resources** - Biblioteca Digital
- Catálogo de recursos psicoeducativos
- Búsqueda y filtros avanzados
- Sistema de subida de archivos
- Categorización automática

## 🔧 Solución Rápida de Problemas

### ❌ Error: "Module not found"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### ❌ Error: Puerto ocupado
```bash
# Cambiar puerto
npm run dev -- -p 3001
```

### ❌ Error: XAMPP no inicia
1. Verificar puertos 80 y 3306 libres
2. Ejecutar como administrador
3. Revisar logs en XAMPP

## 📱 Flujo de Prueba Recomendado

### 1. **Probar Gestión de Pacientes**
- Ir a Expedi+Recetix
- Ver lista de pacientes de ejemplo
- Buscar por nombre o teléfono

### 2. **Crear Nueva Consulta**
- Seleccionar paciente
- Completar consulta con receta
- Agregar medicamentos
- Imprimir receta

### 3. **Realizar Evaluación PHQ-9**
- Ir a Clinimetrix
- Completar cuestionario
- Ver resultados y recomendaciones

### 4. **Explorar Resources**
- Ver catálogo de recursos
- Filtrar por categoría
- Probar subida de archivos

## 🎉 ¡MVP Completo Funcionando!

Con estos pasos tendrás el **sistema completo MindHub MVP** ejecutándose localmente con:

- ✅ **Sistema de expedientes + recetas digitales**
- ✅ **Evaluaciones clínicas automatizadas**
- ✅ **Biblioteca de recursos psicoeducativos**
- ✅ **Interfaz moderna y responsiva**

**Para más detalles**: Ver `/docs/XAMPP_DEPLOYMENT.md`