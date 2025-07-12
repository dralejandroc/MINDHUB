# 🚀 MindHub MVP - Guía Completa de Despliegue Local con XAMPP

## 📋 Descripción General

Esta guía te permitirá ejecutar el **MVP completo de MindHub** que incluye:

- ✅ **Expedix** - Sistema de expedientes electrónicos con recetas digitales (Expedi+Recetix)
- ✅ **Clinimetrix** - Evaluaciones clínicas automatizadas (PHQ-9)
- ✅ **Resources** - Biblioteca de materiales psicoeducativos
- ✅ **Formx** - Constructor de formularios (próximamente)

## 🛠️ Prerrequisitos

### 1. Instalar XAMPP
- Descargar desde: https://www.apachefriends.org/download.html
- Versión recomendada: XAMPP 8.2.x (incluye PHP 8.2, MySQL 8.0, Apache 2.4)

### 2. Instalar Node.js
- Descargar desde: https://nodejs.org/
- Versión recomendada: Node.js 18.x o superior

### 3. Instalar Git (opcional)
- Para clonar el repositorio: https://git-scm.com/

## 📦 Estructura del Proyecto

```
mindhub/
├── frontend/              # Aplicación Next.js
│   ├── app/              # Páginas y rutas
│   │   ├── hubs/
│   │   │   ├── expedix/  # Expedi+Recetix
│   │   │   ├── clinimetrix/ # Evaluaciones PHQ-9
│   │   │   ├── resources/   # Biblioteca recursos
│   │   │   └── formx/       # Constructor formularios
│   │   └── layout.tsx
│   ├── components/       # Componentes React
│   └── package.json
├── backend/              # APIs Node.js
├── database/            # Esquemas MySQL
└── docs/               # Documentación
```

## 🔧 Configuración Paso a Paso

### Paso 1: Configurar XAMPP

1. **Iniciar XAMPP**
   ```bash
   # En Windows
   C:\xampp\xampp-control.exe
   
   # En macOS
   /Applications/XAMPP/xamppfiles/manager-osx
   
   # En Linux
   sudo /opt/lampp/lampp start
   ```

2. **Iniciar Servicios**
   - ✅ **Apache** (Puerto 80)
   - ✅ **MySQL** (Puerto 3306)
   - ✅ **phpMyAdmin** (http://localhost/phpmyadmin)

3. **Verificar Instalación**
   - Navegar a: http://localhost
   - Debe mostrar la página de bienvenida de XAMPP

### Paso 2: Configurar Base de Datos

1. **Acceder a phpMyAdmin**
   ```
   URL: http://localhost/phpmyadmin
   Usuario: root
   Contraseña: (vacía por defecto)
   ```

2. **Crear Base de Datos**
   ```sql
   CREATE DATABASE mindhub_mvp;
   USE mindhub_mvp;
   ```

3. **Ejecutar Scripts de Inicialización**
   ```sql
   -- Copiar y ejecutar el contenido de:
   -- /mindhub/database/init/01-init-database.sql
   -- /mindhub/database/init/02-expedix-schema.sql
   -- /mindhub/database/init/03-clinimetrix-schema.sql
   -- /mindhub/database/init/04-formx-schema.sql
   -- /mindhub/database/init/05-resources-schema.sql
   -- /mindhub/database/init/06-seed-data.sql
   ```

### Paso 3: Configurar Variables de Entorno

1. **Crear archivo .env en la raíz del proyecto**
   ```bash
   cd /Users/alekscon/taskmaster-ai/mindhub
   cp .env.example .env
   ```

2. **Configurar .env**
   ```env
   # Database Configuration
   DATABASE_URL="mysql://root:@localhost:3306/mindhub_mvp"
   
   # XAMPP MySQL Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=mindhub_mvp
   DB_USER=root
   DB_PASS=
   
   # Next.js Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   
   # Upload Configuration
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=50MB
   
   # XAMPP Paths
   XAMPP_ROOT=/Applications/XAMPP  # macOS
   # XAMPP_ROOT=C:\xampp           # Windows
   # XAMPP_ROOT=/opt/lampp         # Linux
   ```

### Paso 4: Instalar Dependencias del Frontend

```bash
cd /Users/alekscon/taskmaster-ai/mindhub/frontend
npm install --force
```

**Si hay errores de dependencias:**
```bash
# Limpiar caché npm
npm cache clean --force

# Instalar con configuración específica
npm install --legacy-peer-deps
```

### Paso 5: Configurar el Backend (Opcional para MVP)

```bash
cd /Users/alekscon/taskmaster-ai/mindhub
npm install
```

### Paso 6: Configurar Uploads y Archivos Estáticos

1. **Crear directorios de uploads**
   ```bash
   mkdir -p uploads/resources
   mkdir -p uploads/patients
   mkdir -p uploads/assessments
   chmod 755 uploads -R
   ```

2. **Configurar servidor estático en XAMPP**
   ```apache
   # Agregar al final de httpd.conf
   Alias /uploads "/path/to/mindhub/uploads"
   <Directory "/path/to/mindhub/uploads">
       Options Indexes FollowSymLinks
       AllowOverride None
       Require all granted
   </Directory>
   ```

## 🚀 Ejecutar el MVP

### Opción 1: Solo Frontend (Recomendado para MVP)

```bash
cd /Users/alekscon/taskmaster-ai/mindhub/frontend
npm run dev
```

**Acceder a:**
- **Dashboard Principal**: http://localhost:3000
- **Expedi+Recetix**: http://localhost:3000/hubs/expedix
- **Clinimetrix PHQ-9**: http://localhost:3000/hubs/clinimetrix
- **Resources**: http://localhost:3000/hubs/resources
- **Formx**: http://localhost:3000/hubs/formx

### Opción 2: Frontend + Backend

**Terminal 1 - Backend:**
```bash
cd /Users/alekscon/taskmaster-ai/mindhub
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /Users/alekscon/taskmaster-ai/mindhub/frontend
npm run dev
```

## 🧪 Probar Funcionalidades

### 1. **Expedi+Recetix** (Sistema Completo)
- ✅ Gestión de pacientes
- ✅ Consultas médicas con signos vitales
- ✅ Sistema de recetas digitales
- ✅ Búsqueda de medicamentos
- ✅ Diagnósticos CIE-10
- ✅ Impresión de recetas

### 2. **Clinimetrix** (Evaluaciones PHQ-9)
- ✅ Cuestionario PHQ-9 interactivo
- ✅ Cálculo automático de puntuación
- ✅ Recomendaciones clínicas
- ✅ Detección de riesgo suicida

### 3. **Resources** (Biblioteca Digital)
- ✅ Catálogo de recursos
- ✅ Búsqueda y filtros
- ✅ Categorización por tipo
- ✅ Sistema de subida de archivos
- ✅ Vista previa y descarga

## 🔧 Solución de Problemas

### Error: "Module not found"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Error: "Permission denied" en uploads
```bash
chmod 755 uploads -R
```

### Error: MySQL Connection
1. Verificar que XAMPP MySQL esté ejecutándose
2. Comprobar credenciales en .env
3. Verificar puerto 3306 disponible

### Error: Puerto 3000 ocupado
```bash
# Cambiar puerto en package.json
"dev": "next dev -p 3001"
```

### Error: Caché de Next.js
```bash
cd frontend
rm -rf .next
npm run dev
```

## 📱 Uso del MVP

### Flujo Principal: Expedi+Recetix

1. **Gestión de Pacientes**
   - Lista de pacientes con datos de ejemplo
   - Búsqueda por nombre, teléfono o ID

2. **Nueva Consulta + Receta**
   - Formulario completo de consulta
   - Signos vitales integrados
   - Sistema de medicamentos con autocompletado
   - Generación de recetas digitales

3. **Evaluación PHQ-9**
   - Cuestionario de 9 preguntas
   - Análisis automático de resultados
   - Recomendaciones clínicas

### Datos de Prueba Incluidos

**Pacientes de ejemplo:**
- María Elena González López
- Carlos Alberto Rodríguez Hernández

**Medicamentos disponibles:**
- Sertralina 50mg
- Fluoxetina 20mg
- Lorazepam 1mg

**Recursos de ejemplo:**
- Guía de Manejo de Ansiedad
- Técnicas de Relajación
- Protocolo PHQ-9

## 🔐 Consideraciones de Seguridad

Para producción, implementar:
- ✅ Autenticación Auth0
- ✅ Encriptación de datos
- ✅ Validación de archivos
- ✅ Logs de auditoría
- ✅ Backup automático

## 📞 Soporte

Si encuentras problemas:

1. **Verificar logs de XAMPP**: `/xampp/logs/`
2. **Verificar logs de Next.js**: Terminal donde ejecutas `npm run dev`
3. **Comprobar estado de servicios**: Panel de control XAMPP
4. **Revisar documentación**: `/docs/` del proyecto

## 🎉 ¡MVP Completo Listo!

Con esta configuración tendrás funcionando:

- ✅ **Sistema completo Expedi+Recetix**
- ✅ **Evaluaciones clínicas PHQ-9**
- ✅ **Biblioteca de recursos**
- ✅ **Interfaz moderna y responsiva**
- ✅ **Base de datos MySQL**
- ✅ **Servidor local XAMPP**

¡El MVP está listo para ser probado por profesionales de la salud mental!