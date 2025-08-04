# Plan de Deployment Beta MindHub (Sin Auth0 ni Pagos)

## Información General

- **Período Beta**: 3 meses
- **Usuarios Esperados**: 30-50 early adopters (registro automático)
- **Costo Mensual**: ~$12 USD (Railway + Vercel)
- **Sin Auth0**: Sistema de autenticación simple con JWT
- **Sin Pagos**: Acceso gratuito durante beta

## Modelo de Negocio (Futuro)

### 3 Planes Definidos:
1. **Clínicas**: Multi-usuario (hasta 15), base compartida, precio premium
2. **Psicólogos**: Individual, enfoque Resources/Formx, precio económico  
3. **Psiquiatras**: Individual, uso intensivo Expedix/Clinimetrix, precio alto

## Módulos MVP para Beta

✅ **Incluidos:**
- Expedix - Expedientes electrónicos
- ClinimetrixPro - Escalas clínicas  
- Resources - Biblioteca de recursos
- Agenda - Sistema de citas
- FrontDesk - Recepción
- Finance - Básico (sin cobros reales)

❌ **Postponed:**
- Formx - Para futuras versiones

## Infraestructura de Deployment

### Frontend (Vercel)
- **URL**: app.mindhub.cloud
- **Framework**: Next.js 14.2.30
- **Costo**: $0 (plan gratuito)

### Backend (Railway)
- **URL**: api.mindhub.cloud
- **Servicios**:
  - Node.js Express API ($5/mes)
  - MySQL Database ($5/mes)
- **Costo Total**: $10/mes

### Dominios
- `mindhub.cloud` - Landing page (futuro)
- `app.mindhub.cloud` - Aplicación principal
- `api.mindhub.cloud` - API Backend

## Variables de Entorno Necesarias

### Vercel (Frontend)
```env
NEXT_PUBLIC_API_URL=https://api.mindhub.cloud
NEXT_PUBLIC_BETA_MODE=true
NEXT_PUBLIC_ENABLE_AUTH0=false
NEXT_PUBLIC_ENABLE_PAYMENTS=false
```

### Railway (Backend)
```env
NODE_ENV=production
DATABASE_URL=mysql://[railway-connection-string]
JWT_SECRET=[generated-secret]
CORS_ORIGIN=https://app.mindhub.cloud
PORT=3002
BETA_MODE=true
ENABLE_PAYMENTS=false
ENABLE_AUTH0=false
```

## Sistema de Autenticación Simple

### Características:
- Login con email/password
- JWT tokens (24h duración)
- Roles: admin, clinica_admin, psicologo, psiquiatra
- Registro abierto durante beta
- Sin OAuth/SSO

### Tablas Necesarias:
```sql
- organizations (para clínicas futuras)
- users (con organization_id opcional)
- user_roles
- access_tokens
- beta_registrations
```

## Timeline de Implementación

### Fase 1: Preparación (Semana 1)
- [ ] Crear branch `deployment-prep`
- [ ] Remover código de Auth0
- [ ] Implementar auth simple
- [ ] Verificar módulos MVP
- [ ] Excluir Formx temporalmente

### Fase 2: Configuración (Semana 2)
- [ ] Setup Railway
- [ ] Migrar base de datos
- [ ] Configurar Vercel
- [ ] Setup dominios y SSL

### Fase 3: Testing y Launch (Semana 3)
- [ ] Testing completo
- [ ] Configurar monitoreo
- [ ] Deploy a producción
- [ ] Abrir registro beta

## Monitoreo y Analytics

- Vercel Analytics (incluido gratis)
- Railway Metrics (incluido)
- Logs de aplicación
- Tracking de uso beta

## Seguridad Mínima Requerida

- HTTPS obligatorio
- Rate limiting: 100 req/min
- CORS configurado correctamente
- Validación de inputs
- Backups diarios automáticos

## Próximos Pasos Post-Beta

1. Implementar sistema de pagos (Stripe recomendado)
2. Definir precios finales
3. Crear landing page completa
4. Implementar Auth0 (opcional)
5. Agregar módulo Formx
6. Sistema de facturación CFDI

## Notas Importantes

- Los usuarios beta tendrán acceso completo gratuito
- El registro estará abierto pero monitoreado
- Sin límites de uso durante beta
- Feedback activo de usuarios para mejoras

---

_Documento creado: 2025-08-03_
_Última actualización: 2025-08-03_