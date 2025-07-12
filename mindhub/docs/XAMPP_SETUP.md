# MindHub con XAMPP - Guía de Configuración

Esta guía te ayudará a configurar MindHub usando XAMPP como servidor de base de datos.

## 📋 Requisitos Previos

- **XAMPP** instalado y funcionando
- **Node.js 18+** y npm
- **Git**

## 🚀 Configuración Paso a Paso

### 1. Iniciar XAMPP

1. Abre el panel de control de XAMPP
2. Inicia el servicio **Apache** (para phpMyAdmin)
3. Inicia el servicio **MySQL** 
4. Verifica que MySQL esté ejecutándose en el puerto 3306

### 2. Configuración Automática

Ejecuta nuestro script de configuración automática:

```bash
# Configurar XAMPP para MindHub
npm run xampp:setup

# O manualmente:
node scripts/setup-xampp.js
```

Este script:
- ✅ Verifica que XAMPP esté ejecutándose
- ✅ Crea la base de datos `mindhub_dev` 
- ✅ Configura el schema de MySQL
- ✅ Instala dependencias necesarias

### 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar las credenciales de la base de datos
nano .env
```

**Configuración típica de XAMPP:**
```env
# Database Configuration para XAMPP
DATABASE_URL="mysql://root:@localhost:3306/mindhub_dev"

# Si tienes contraseña configurada en XAMPP:
# DATABASE_URL="mysql://root:tu_password@localhost:3306/mindhub_dev"
```

### 4. Configurar Base de Datos

```bash
# Instalar dependencias (incluye mysql2)
npm install

# Generar cliente Prisma para MySQL
npm run db:generate

# Aplicar schema a la base de datos
npm run db:push

# Poblar con datos de ejemplo
npm run db:seed
```

### 5. Verificar Configuración

```bash
# Probar conexión
npm run xampp:test

# O ejecutar test completo
node scripts/test-prisma.js
```

## 🎯 Configuración Completa Automática

Para configurar todo de una vez:

```bash
# Configuración completa automática
npm run xampp:init
```

Este comando ejecuta:
1. `xampp:setup` - Configura XAMPP
2. `db:generate` - Genera cliente Prisma
3. `db:push` - Aplica schema
4. `db:seed` - Puebla datos

## 🔧 Configuración Manual de Base de Datos

Si prefieres configurar la base de datos manualmente:

### Via phpMyAdmin

1. Abre http://localhost/phpmyadmin
2. Crea nueva base de datos: `mindhub_dev`
3. Charset: `utf8mb4_unicode_ci`

### Via MySQL CLI

```sql
CREATE DATABASE mindhub_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 📊 Acceso a Datos

### phpMyAdmin
- **URL**: http://localhost/phpmyadmin
- **Usuario**: root
- **Contraseña**: (vacía por defecto)

### Prisma Studio
```bash
npm run db:studio
```
- **URL**: http://localhost:5555

## 🏥 Datos de Ejemplo

Después del seeding, tendrás acceso a:

### Usuarios de Prueba
- **Psiquiatra**: doctor.psiquiatra@mindhub.cloud
- **Psicólogo**: doctor.psicologo@mindhub.cloud  
- **Admin**: admin@mindhub.cloud

### Datos de Muestra
- 3 usuarios con diferentes roles
- 3 medicamentos en catálogo
- 3 escalas de evaluación (BDI-II, BAI, HDRS)
- 6 tipos de campos para formularios
- 4 categorías de recursos educativos
- 3 recursos educativos

## 🔍 Solución de Problemas

### Error: "Can't connect to MySQL server"

```bash
# 1. Verificar que XAMPP esté ejecutándose
npm run xampp:test

# 2. Verificar puerto (debería ser 3306)
netstat -an | grep 3306

# 3. Reiniciar servicios XAMPP
```

### Error: "Access denied for user 'root'"

Si has configurado contraseña en XAMPP:

```env
# En .env
DATABASE_URL="mysql://root:tu_password@localhost:3306/mindhub_dev"
```

### Error: "Database 'mindhub_dev' doesn't exist"

```bash
# Ejecutar setup nuevamente
npm run xampp:setup
```

### Prisma Client no se genera

```bash
# Limpiar y regenerar
rm -rf generated/
npm run db:generate
```

## 🚀 Iniciar Aplicación

Una vez configurado todo:

```bash
# Backend
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

### URLs de Desarrollo

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080  
- **phpMyAdmin**: http://localhost/phpmyadmin
- **Prisma Studio**: http://localhost:5555

## 📝 Diferencias con PostgreSQL

### Cambios Principales

1. **Schema Unificado**: MySQL usa un solo schema con prefijos de tabla
   - `auth_users` en lugar de `auth.users`
   - `expedix_patients` en lugar de `expedix.patients`

2. **Tipos de Datos**:
   - `@db.Char(36)` para UUIDs
   - `@db.Text` para campos largos
   - JSON almacenado como texto

3. **Arrays**: Convertidos a campos de texto con JSON

### Funcionalidad Completa

Todas las funciones de MindHub funcionan igual:
- ✅ Autenticación Auth0
- ✅ Gestión de pacientes  
- ✅ Evaluaciones clínicas
- ✅ Constructor de formularios
- ✅ Biblioteca de recursos
- ✅ Auditoría NOM-024

## 📚 Comandos Útiles

```bash
# Configuración
npm run xampp:setup      # Configurar XAMPP
npm run xampp:test       # Probar conexión
npm run xampp:init       # Configuración completa

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:push          # Aplicar schema
npm run db:seed          # Poblar datos
npm run db:studio        # Interfaz visual
npm run db:reset         # Reiniciar todo

# Desarrollo
npm run dev              # Servidor backend
npm run auth0:setup      # Configurar Auth0
```

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs de XAMPP
2. Verifica que el puerto 3306 esté libre
3. Confirma que MySQL esté ejecutándose
4. Revisa la configuración en `.env`

¡MindHub está listo para usar con XAMPP! 🎉