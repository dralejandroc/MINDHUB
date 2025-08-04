# MindHub Beta Deployment Guide

## 🚀 Quick Start para Beta

### Prerrequisitos
- Node.js 18+
- MySQL (MAMP para desarrollo, Railway para producción)
- Git

### 1. Configuración Local

```bash
# Clonar el repositorio
git clone <your-repo>
cd mindhub

# Instalar dependencias
cd frontend && npm install
cd ../backend && npm install

# Configurar variables de entorno
cp .env.development.example .env

# Aplicar migración de base de datos
cd backend
node scripts/apply-simple-auth-migration.js

# Iniciar servicios
npm run dev  # Frontend en puerto 3000
cd backend && npm start  # Backend en puerto 3002
```

### 2. Deployment a Producción

#### Frontend (Vercel)
```bash
# En Vercel Dashboard:
1. Conectar repositorio GitHub
2. Set Framework: Next.js
3. Root Directory: mindhub/frontend
4. Variables de entorno:
   - NEXT_PUBLIC_API_URL=https://api.mindhub.cloud
   - NEXT_PUBLIC_BETA_MODE=true
   - NEXT_PUBLIC_ENABLE_AUTH0=false
   - NEXT_PUBLIC_ENABLE_PAYMENTS=false
```

#### Backend (Railway)
```bash
# En Railway Dashboard:
1. Create New Project
2. Add MySQL Database
3. Add Service from GitHub
4. Root Directory: mindhub/backend
5. Variables de entorno (ver .env.production.example)
```

## 🏗️ Arquitectura Beta

### Stack Tecnológico
- **Frontend**: Next.js 14.2.30 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Prisma ORM
- **Base de Datos**: MySQL
- **Autenticación**: JWT simple (sin Auth0)
- **Deployment**: Vercel + Railway

### Módulos Incluidos en Beta
✅ **Expedix** - Gestión de pacientes y expedientes  
✅ **ClinimetrixPro** - Escalas clínicas avanzadas  
✅ **Resources** - Biblioteca de recursos  
✅ **Agenda** - Sistema de citas  
✅ **Finance** - Gestión financiera básica  
✅ **FrontDesk** - Recepción digital  
❌ **FormX** - Postponed para versión final  

### URLs de Producción
- **App**: https://app.mindhub.cloud
- **API**: https://api.mindhub.cloud
- **Landing**: https://mindhub.cloud

## 🔐 Sistema de Autenticación

### Características Beta
- Login simple con email/password
- JWT tokens con 24h de duración  
- Registro abierto durante beta
- 3 tipos de cuenta: Individual, Clínica, Psiquiatra
- Sin limitaciones durante beta

### Endpoints de Auth
```bash
POST /api/auth/register     # Registro de usuarios
POST /api/auth/login        # Iniciar sesión
POST /api/auth/logout       # Cerrar sesión
POST /api/auth/refresh      # Renovar token
GET  /api/auth/me          # Usuario actual
POST /api/auth/beta-register # Registro beta (landing)
```

## 📊 Monitoreo Beta

### Métricas Importantes
- Total de usuarios registrados
- Tipos de cuenta más populares
- Módulos más utilizados
- Errores y performance

### Logs
```bash
# Producción (Railway)
railway logs

# Desarrollo local
tail -f backend/logs/development.log
```

## 🐛 Troubleshooting

### Problemas Comunes

**1. Error de CORS**
```bash
# Verificar CORS_ORIGIN en .env
CORS_ORIGIN="https://app.mindhub.cloud"
```

**2. Database Connection Failed**
```bash
# Verificar DATABASE_URL
# Para Railway: usar la connection string provista
# Para MAMP: mysql://root:root@localhost:8889/mindhub
```

**3. Auth Token Invalid**
```bash
# Verificar JWT_SECRET en ambos environments
# Debe ser el mismo en frontend y backend
```

**4. 404 en Rutas**
```bash
# Verificar que el backend esté corriendo en puerto correcto
# NEXT_PUBLIC_API_URL debe apuntar al backend
```

## 🔄 Actualizaciones de Código

### Flujo de Desarrollo
```bash
# 1. Desarrollo local
git checkout -b feature/nueva-funcionalidad
# hacer cambios
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# 2. Pull Request
# Crear PR en GitHub
# Vercel creará preview automáticamente

# 3. Deploy a producción
git checkout main
git merge feature/nueva-funcionalidad
git push origin main
# Deploy automático a Vercel + Railway
```

### Variables de Entorno por Environment

| Variable | Desarrollo | Producción |
|----------|------------|------------|
| NODE_ENV | development | production |
| DATABASE_URL | mysql://localhost:8889/mindhub | Railway connection string |
| CORS_ORIGIN | http://localhost:3000 | https://app.mindhub.cloud |
| JWT_SECRET | dev-secret | secure-production-secret |
| BETA_MODE | true | true |

## 📈 Escalabilidad

### Límites Actuales (Beta)
- **Railway**: $5/mes por servicio
- **Vercel**: Gratis hasta 100GB bandwidth
- **Usuarios**: Sin límite durante beta
- **Storage**: MySQL incluye suficiente para beta

### Plan de Escalamiento
1. **Fase Beta** (0-50 usuarios): Railway + Vercel
2. **Fase Crecimiento** (50-500 usuarios): Upgrade Railway plans
3. **Fase Scale** (500+ usuarios): Considerar migrar a AWS/GCP

## 🎯 Próximos Pasos Post-Beta

1. **Implementar sistema de pagos** (Stripe)
2. **Definir planes y precios** finales
3. **Agregar módulo FormX**
4. **Sistema de facturación CFDI**
5. **Migrar a Auth0** (opcional)
6. **Implementar límites por plan**

## 📞 Soporte

Durante la beta, cualquier issue reportar a:
- Email: beta@mindhub.cloud
- GitHub Issues: [Repository Issues]
- Debug logs: Incluir en reportes

---

_Última actualización: 2025-08-03_  
_Versión Beta: 1.0.0_