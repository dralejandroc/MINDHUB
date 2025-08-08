# 🔐 MINDHUB - DATOS SENSIBLES Y CREDENCIALES

**⚠️ ADVERTENCIA CRÍTICA: ESTE ARCHIVO NUNCA DEBE SUBIRSE A GITHUB**

Este archivo contiene todas las claves, tokens y datos sensibles del proyecto MindHub.

---

## 🌐 DOMINIOS Y URLs

### Producción
- **Frontend**: https://mindhub.cloud
- **Backend**: https://mindhub.cloud/api
- **Domain**: mindhub.cloud (Vercel)

---

## 🚂 RAILWAY (Backend Hosting)

### Proyecto Principal
- **Project ID**: 71f20b8c-d94c-4d10-9da0-f75eff30044a
- **Environment ID**: 7554a992-fa66-4444-939d-8ced9da199e7
- **Project URL**: https://railway.com/project/71f20b8c-d94c-4d10-9da0-f75eff30044a
- **Service Name**: mindhub-backend
- **Internal URL**: http://mindhub-backend:8080
- **Public URL**: https://mindhub-production.up.railway.app (NO USAR - caro)

### Variables de Entorno Railway
```env
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://mindhub.cloud
JWT_SECRET=MindHub2025SecureJWTKeyForProduction
DATABASE_URL=mysql://root:sZQBmwhyfBXzJfvoWOCCFXFPSKOnegXi@mysql.railway.internal:3306/railway
```

---

## 🗄️ BASE DE DATOS MYSQL (Railway)

### Conexión Interna (Usar esta - SIN costos)
- **Host**: mysql.railway.internal
- **Puerto**: 3306
- **Usuario**: root
- **Password**: sZQBmwhyfBXzJfvoWOCCFXFPSKOnegXi
- **Base de datos**: railway

### Conexión Externa (NO USAR - Caro por egress)
- **Host**: caboose.proxy.rlwy.net
- **Puerto**: 41591
- **Usuario**: root
- **Password**: levBZLcxUaSGcMdTKSnloHHzFIgSOEay

### URLs de Conexión
- **Interna**: mysql://root:sZQBmwhyfBXzJfvoWOCCFXFPSKOnegXi@mysql.railway.internal:3306/railway
- **Externa**: mysql://root:levBZLcxUaSGcMdTKSnloHHzFIgSOEay@caboose.proxy.rlwy.net:41591/railway

---

## ▲ VERCEL (Frontend Hosting)

### Proyecto
- **Project Name**: mindhub-frontend
- **Domain**: mindhub.cloud
- **Git Repository**: https://github.com/dralejandroc/MINDHUB.git

### Variables de Entorno Vercel
```env
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://mindhub-backend:8080
NEXT_PUBLIC_APP_URL=https://mindhub.cloud
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## 📧 ZOHO MAIL

### Correos Configurados
- hola@mindhub.cloud
- info@mindhub.cloud
- soporte@mindhub.cloud
- feedback@mindhub.cloud
- noreply@mindhub.cloud

### OAuth Credentials
- **Client ID**: 1000.7G88ZWPZKVWDWO3W4QPSTPGFI2OVOH
- **Client Secret**: 00f06318481924e117c7ad10e90197f26a8e42c942
- **Redirect URI**: https://mindhub.cloud/api/auth/zoho/callback

### OAuth Scopes Necesarios
```
ZohoMail.messages.CREATE
ZohoMail.accounts.READ
```

### SMTP Configuration (Alternativa)
```env
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=587
ZOHO_SMTP_USER=noreply@mindhub.cloud
ZOHO_SMTP_PASSWORD=[PENDIENTE - Generar App Password]
```

### Variables de Entorno Zoho (OAuth) - ✅ CONFIGURADO
```env
ZOHO_CLIENT_ID=1000.7G88ZWPZKVWDWO3W4QPSTPGFI2OVOH
ZOHO_CLIENT_SECRET=00f06318481924e117c7ad10e90197f26a8e42c942
ZOHO_REFRESH_TOKEN=1000.c8f6402c1e39c486d8b9912aa16c3057.d62666f01670597c5a6d74e84a9d6893
ZOHO_ACCOUNT_ID=https://www.zohoapis.com
```

### Tokens Obtenidos (2025-08-08)
- **Access Token**: 1000.b6c6f50f20e1a8220c7125b858480a03.75d2e42c5cc46fb4ac0a29347b87390d (expira en 1h)
- **Refresh Token**: 1000.c8f6402c1e39c486d8b9912aa16c3057.d62666f01670597c5a6d74e84a9d6893 (permanente)

---

## 🔐 JWT Y AUTENTICACIÓN

### Secrets
- **JWT Secret**: MindHub2025SecureJWTKeyForProduction
- **JWT Expires**: 1h
- **Refresh Token Expires**: 7d

---

## 🐙 GITHUB

### Repositorio
- **URL**: https://github.com/dralejandroc/MINDHUB.git
- **Branch Principal**: main
- **Owner**: dralejandroc

### Deploy
- **Auto-deploy**: Configurado en Vercel desde main branch

---

## ⚠️ TOKENS PENDIENTES DE CONFIGURAR

### Zoho Mail
- [ ] **Refresh Token**: Necesario para OAuth
- [ ] **App Password**: Para SMTP directo

### Servicios Opcionales Futuros
- [ ] **Stripe**: Para pagos (cuando sea necesario)
- [ ] **AWS S3**: Para archivos (si se necesita)
- [ ] **Cloudflare**: Para CDN/seguridad

---

## 🚨 SEGURIDAD

### Archivos a EXCLUIR de GitHub
```
.env
.env.production
.env.local
**/node_modules/
**/.env*
**/credentials.json
**/*KEYS*.md
**/*SENSITIVE*.md
```

### Gitignore DEBE incluir
```
# Environment variables
.env*
!.env.example

# Sensitive files  
*KEYS*.md
*SENSITIVE*.md
*CREDENTIALS*.md

# Database
*.db
*.sqlite

# Keys and certificates
*.key
*.pem
*.p12
```

---

## 📝 NOTAS IMPORTANTES

1. **Este archivo LOCAL ÚNICAMENTE** - Nunca hacer commit
2. **Rotar claves regularmente** - Cada 3-6 meses
3. **Variables de entorno separadas** - Producción vs Development
4. **Backup seguro** - Guardar copia encriptada localmente
5. **Acceso limitado** - Solo desarrolladores principales

---

## 🔄 ÚLTIMA ACTUALIZACIÓN

**Fecha**: 2025-08-08
**Por**: Claude Code Assistant
**Estado**: Configuración inicial completa
**Pendientes**: Refresh Token de Zoho

---

**🚨 RECORDATORIO**: NUNCA subir este archivo a GitHub. Si se sube accidentalmente, rotar TODAS las claves inmediatamente.