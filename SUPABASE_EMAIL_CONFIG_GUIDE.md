# Configuración de Emails de Supabase para MindHub

## 📧 Estado Actual y Problemas Identificados

### ⚠️ Limitaciones del Servicio Built-in:
- **Rate limits muy restrictivos** (no apto para producción)
- **Templates básicos** sin branding personalizado
- **Sin garantías de entrega**
- **Puede ser marcado como spam**

## 🚀 Configuración Recomendada para Producción

### 1. SMTP Personalizado (Recomendado)

#### Opciones de Proveedores SMTP:
```
✅ SendGrid (Recomendado)
- 100 emails gratis/día
- Excelente deliverability
- APIs robustas

✅ Postmark 
- 100 emails gratis/mes
- Especializado en transaccionales
- Muy buena reputación

✅ Amazon SES
- $0.10 por 1000 emails
- Alta escalabilidad
- Integración AWS

✅ Mailgun
- 5000 emails gratis/3 meses
- APIs potentes
- Buenos analytics
```

### 2. Configuración SMTP en Supabase

#### Para SendGrid (Recomendado):
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [Tu API Key de SendGrid]
Sender Name: MindHub
Sender Email: noreply@mindhub.cloud
```

#### Para Postmark:
```
SMTP Host: smtp.postmarkapp.com
SMTP Port: 587
SMTP User: [Server API Token]
SMTP Pass: [Server API Token]
Sender Name: MindHub
Sender Email: noreply@mindhub.cloud
```

### 3. Templates de Email Mejorados

#### Template: Confirm Signup
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Confirma tu cuenta - MindHub</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { padding: 20px; background: #f1f5f9; border-radius: 0 0 8px 8px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 MindHub</h1>
            <h2>¡Bienvenido a la plataforma!</h2>
        </div>
        <div class="content">
            <h3>Confirma tu cuenta</h3>
            <p>Hola,</p>
            <p>Gracias por unirte a MindHub. Para comenzar a utilizar la plataforma de gestión sanitaria, necesitamos confirmar tu dirección de email.</p>
            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">✅ Confirmar Email</a>
            </p>
            <p><strong>¿Qué puedes hacer en MindHub?</strong></p>
            <ul>
                <li>🏥 Gestionar pacientes con Expedix</li>
                <li>📅 Programar citas con Agenda</li>
                <li>📊 Evaluar con Clinimetrix</li>
                <li>💰 Manejar finanzas</li>
                <li>📝 Crear formularios con FormX</li>
            </ul>
            <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
            <p>¡Esperamos verte pronto en MindHub!</p>
        </div>
        <div class="footer">
            <p>MindHub - Plataforma Integral de Gestión Sanitaria</p>
            <p>{{ .Email }} | <a href="{{ .SiteURL }}">mindhub.cloud</a></p>
        </div>
    </div>
</body>
</html>
```

#### Template: Reset Password
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Restablecer contraseña - MindHub</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; border-radius: 4px; }
        .footer { padding: 20px; background: #f1f5f9; border-radius: 0 0 8px 8px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 MindHub</h1>
            <h2>Restablecimiento de Contraseña</h2>
        </div>
        <div class="content">
            <h3>Solicitud de nueva contraseña</h3>
            <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de MindHub.</p>
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expira en 1 hora por seguridad.
            </div>
            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">🔑 Restablecer Contraseña</a>
            </p>
            <p><strong>¿No solicitaste este cambio?</strong></p>
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este email. Tu contraseña actual permanecerá sin cambios.</p>
            <p>Por seguridad, te recomendamos:</p>
            <ul>
                <li>Usar una contraseña de al menos 12 caracteres</li>
                <li>Incluir mayúsculas, minúsculas, números y símbolos</li>
                <li>No reutilizar contraseñas de otros servicios</li>
            </ul>
        </div>
        <div class="footer">
            <p>MindHub - Plataforma Integral de Gestión Sanitaria</p>
            <p>{{ .Email }} | <a href="{{ .SiteURL }}">mindhub.cloud</a></p>
        </div>
    </div>
</body>
</html>
```

#### Template: Change Email Address
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cambio de email - MindHub</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .info { background: #dbeafe; border-left: 4px solid #2563eb; padding: 12px; margin: 16px 0; border-radius: 4px; }
        .footer { padding: 20px; background: #f1f5f9; border-radius: 0 0 8px 8px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 MindHub</h1>
            <h2>Confirmación de nuevo email</h2>
        </div>
        <div class="content">
            <h3>Confirma tu nuevo email</h3>
            <p>Hola,</p>
            <p>Recibimos una solicitud para cambiar el email de tu cuenta de MindHub.</p>
            <div class="info">
                <strong>ℹ️ Nuevo email:</strong> {{ .Email }}
            </div>
            <p>Para completar el cambio, confirma tu nueva dirección de email:</p>
            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">✅ Confirmar Nuevo Email</a>
            </p>
            <p><strong>¿Qué sucede después?</strong></p>
            <ul>
                <li>Tu email anterior dejará de funcionar para iniciar sesión</li>
                <li>Todas las notificaciones se enviarán a esta nueva dirección</li>
                <li>Podrás usar este email para recuperar tu contraseña</li>
            </ul>
            <p>Si no solicitaste este cambio, contacta inmediatamente a soporte.</p>
        </div>
        <div class="footer">
            <p>MindHub - Plataforma Integral de Gestión Sanitaria</p>
            <p><a href="{{ .SiteURL }}">mindhub.cloud</a></p>
        </div>
    </div>
</body>
</html>
```

## 🛠️ Script de Configuración

### Setup SendGrid (Recomendado):
```bash
#!/bin/bash
# setup-sendgrid.sh

echo "🚀 Configurando SendGrid para MindHub..."

# 1. Crear cuenta en SendGrid
echo "1. Ve a https://sendgrid.com/free/ y crea una cuenta gratuita"
echo "2. Verifica tu dominio mindhub.cloud"
echo "3. Crea un API Key con permisos de Mail Send"

# 2. Verificar dominio
echo "
📧 Configuración DNS necesaria para mindhub.cloud:
- CNAME: em7890.mindhub.cloud -> u7890.wl056.sendgrid.net
- CNAME: s1._domainkey.mindhub.cloud -> s1.domainkey.u7890.wl056.sendgrid.net  
- CNAME: s2._domainkey.mindhub.cloud -> s2.domainkey.u7890.wl056.sendgrid.net
"

# 3. Configurar en Supabase
echo "
⚙️ Configurar en Supabase Dashboard:
Settings → Authentication → SMTP Settings:
- SMTP Host: smtp.sendgrid.net
- SMTP Port: 587  
- SMTP User: apikey
- SMTP Password: [Tu SendGrid API Key]
- Sender Name: MindHub
- Sender Email: noreply@mindhub.cloud
"

echo "✅ Configuración completada!"
```

## 📊 Rate Limits Recomendados

### Configuración en Supabase:
```
Email Rate Limits:
- Signup: 30 emails/hour/IP
- Password Reset: 6 emails/hour/IP  
- Email Change: 6 emails/hour/IP
- Magic Link: 20 emails/hour/IP

Configuración Adicional:
- Enable email confirmations: ✅ ON
- Enable secure email change: ✅ ON  
- Double confirm email changes: ✅ ON
- Redirect URLs: https://mindhub.cloud/auth/callback
```

## 🔍 Testing y Validación

### Script de Test:
```javascript
// test-emails.js - Ejecutar en browser console después de configurar

// Test signup email
const testSignup = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test+' + Date.now() + '@mindhub.cloud',
    password: 'TestPass123!'
  })
  console.log('Signup test:', { data, error })
}

// Test password reset  
const testReset = async () => {
  const { error } = await supabase.auth.resetPasswordForEmail('test@mindhub.cloud')
  console.log('Reset test:', { error })
}

// Ejecutar tests
testSignup()
// testReset() // Descomenta para probar
```

## 📈 Monitoreo y Analytics

### Métricas a Seguir:
- **Delivery Rate**: >95%
- **Open Rate**: >20%
- **Click Rate**: >5%  
- **Bounce Rate**: <2%
- **Spam Rate**: <0.1%

### Dashboard de SendGrid:
- Analytics → Email Activity
- Suppressions → Bounces/Spam
- Settings → Mail Settings → Event Webhook

## 🚨 Próximos Pasos

1. **Configurar SendGrid** (o proveedor SMTP elegido)
2. **Actualizar templates** con diseño personalizado
3. **Verificar dominio** mindhub.cloud en SendGrid
4. **Configurar webhooks** para tracking de eventos
5. **Implementar analytics** de email engagement
6. **Probar thoroughly** antes de producción

¿Te ayudo a configurar algún proveedor específico?