# MindHub Backend Deployment Fix

## Problemas Identificados y Solucionados

### 1. URLs Incorrectas en Frontend
**Problema**: El frontend estaba apuntando a `https://mindhub-production.up.railway.app`
**Solución**: Actualizado a `https://mindhub.cloud/api`

### 2. Configuración de Base de Datos
**Problema**: Backend configurado para desarrollo local (MAMP)
**Solución**: Actualizado para usar Railway MySQL en producción

### 3. Variables de Entorno
**Problema**: Variables de entorno no configuradas correctamente
**Solución**: Creados archivos `.env.production` con configuración correcta

### 4. Manejo de Conexiones de Prisma
**Problema**: Conexiones de base de datos no se cerraban correctamente
**Solución**: Agregado manejo graceful shutdown

### 5. Script de Inicio Robusto
**Problema**: Railway no podía manejar los errores de conexión
**Solución**: Creado `start-production.js` con verificación de base de datos

## Configuración de Railway

### Variables de Entorno Requeridas:
```
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://mindhub.cloud
JWT_SECRET=mindhub_production_secret_key_secure_token_12345
DATABASE_URL=mysql://root:oWBGNnGWqgWxdZXWVSqzLklLEkLXYVDe@yamanote.proxy.rlwy.net:42951/railway
DB_HOST=yamanote.proxy.rlwy.net
DB_PORT=42951
DB_USER=root
DB_PASSWORD=oWBGNnGWqgWxdZXWVSqzLklLEkLXYVDe
DB_NAME=railway
```

### Comando de Inicio en Railway:
```
npm start
```

## URLs Correctas

### Frontend (Vercel):
- **Main URL**: https://mindhub.cloud
- **API calls**: https://mindhub.cloud/api

### Backend (Railway):
- **Internal URL**: Railway genera automáticamente
- **Public URL**: https://mindhub.cloud/api (a través de proxy/DNS)

## Endpoints Principales

### Autenticación:
- `POST /api/auth/beta-register` - Registro beta
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro normal
- `GET /api/auth/me` - Usuario actual

### Health Check:
- `GET /api/health` - Estado del servidor

## Pasos para Deployment

1. **Subir cambios a Railway**:
   - Los cambios en el backend se aplicarán automáticamente
   - Railway ejecutará `npm start` que usa `start-production.js`

2. **Verificar variables de entorno en Railway**:
   - Asegurar que `DATABASE_URL` esté configurada
   - Verificar `JWT_SECRET` y otras variables críticas

3. **Monitorear logs de Railway**:
   - Verificar que la conexión a la base de datos sea exitosa
   - Confirmar que el servidor inicie sin errores

4. **Probar endpoint de registro**:
   ```bash
   curl -X POST https://mindhub.cloud/api/auth/beta-register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","name":"Test User","professionalType":"psicologo","city":"Mexico","country":"mexico","howDidYouHear":"google","yearsOfPractice":"1_3","password":"testpass123","confirmPassword":"testpass123"}'
   ```

## Problemas Comunes y Soluciones

### Error 404 en /api/auth/beta-register
- Verificar que el servidor esté ejecutándose
- Confirmar que las rutas estén montadas correctamente
- Revisar logs de Railway

### Error de conexión a base de datos
- Verificar `DATABASE_URL` en Railway
- Confirmar que las credenciales de MySQL sean correctas
- Revisar que las tablas existan (el script ejecuta migraciones automáticamente)

### SIGTERM errors
- Solucionado con el manejo graceful shutdown
- El script ahora cierra conexiones correctamente

## Monitoreo

### Logs a revisar:
1. **Inicio del servidor**: "🧠 MindHub Healthcare Platform"
2. **Conexión DB**: "📦 Database connected successfully"  
3. **Endpoints**: "✅ Platform ready!"

### URLs para probar:
- https://mindhub.cloud/api/health
- https://mindhub.cloud/api/auth/beta-register (POST)