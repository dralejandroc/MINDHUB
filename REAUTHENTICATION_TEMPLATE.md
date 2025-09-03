# 🔐 Template de Reauthentication para MindHub

## Template: Confirm Reauthentication

### Subject: `Código de verificación MindHub 🔐`

### Body HTML:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Código de verificación - MindHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🔐 MindHub</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Verificación de Identidad</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Código de verificación</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px;">
                Para confirmar tu identidad y completar esta acción sensible, ingresa el siguiente código de verificación en MindHub:
            </p>
            
            <!-- Verification Code -->
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 20px 30px; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 4px; font-family: 'Courier New', monospace; box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);">
                    {{ .Token }}
                </div>
            </div>
            
            <!-- Instructions -->
            <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
                <h3 style="color: #d97706; margin: 0 0 15px; font-size: 18px;">Instrucciones</h3>
                <ol style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>Copia el código de 6 dígitos mostrado arriba</li>
                    <li>Regresa a la ventana de MindHub donde se solicita el código</li>
                    <li>Pégalo en el campo "Código de verificación"</li>
                    <li>Haz clic en "Verificar" para continuar</li>
                </ol>
            </div>
            
            <!-- Security Warning -->
            <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
                <p style="margin: 0; color: #7f1d1d; font-weight: 600;">
                    ⚠️ <strong>Importante:</strong> Este código expira en 10 minutos y solo se puede usar una vez.
                </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 20px 0 0;">
                <strong>¿No solicitaste este código?</strong> Si no iniciaste esta acción, ignora este email. Tu cuenta permanece segura.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 10px 0 0;">
                <strong>¿Problemas?</strong> Contacta a <a href="{{ .SiteURL }}/support" style="color: #f59e0b;">soporte técnico</a> si no puedes acceder a tu cuenta.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                <strong>MindHub</strong> - Plataforma Integral de Gestión Sanitaria
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Email enviado a: {{ .Email }} | <a href="{{ .SiteURL }}" style="color: #f59e0b;">mindhub.cloud</a>
            </p>
            <p style="margin: 10px 0 0; color: #9ca3af; font-size: 11px;">
                Código generado: {{ .TokenHash }} | Válido por 10 minutos
            </p>
        </div>
    </div>
</body>
</html>
```

## 🎨 Características del Template

### Design Elements:
- **Color scheme**: Naranja/Amarillo (warning colors) para indicar verificación de seguridad
- **Código destacado**: En una caja prominente con fuente monospace
- **Instrucciones claras**: Paso a paso para el usuario
- **Security warnings**: Información sobre expiración y uso único
- **Responsive**: Se ve bien en desktop y móvil

### Variables utilizadas:
- `{{ .Token }}`: El código de verificación de 6 dígitos
- `{{ .TokenHash }}`: Hash del token para debugging (opcional)
- `{{ .Email }}`: Email del usuario
- `{{ .SiteURL }}`: URL base de MindHub

### UX Improvements:
1. **Visual hierarchy**: El código es lo más prominente
2. **Clear instructions**: Pasos numerados para facilitar el proceso  
3. **Security messaging**: Explica por qué es necesario y cuándo expira
4. **Branding consistency**: Mantiene el estilo MindHub
5. **Mobile friendly**: Texto y botones legibles en móvil

## 📱 Cómo se ve en diferentes casos:

### En desktop:
- Código grande y centrado
- Instrucciones fáciles de seguir
- Warning boxes visibles

### En móvil:
- Código sigue siendo legible
- Layout se adapta automáticamente
- Touch-friendly para copiar/pegar

### Para usuarios:
1. **Reciben email** con código prominente
2. **Copian fácilmente** el código de 6 dígitos
3. **Entienden el proceso** con instrucciones claras
4. **Sienten seguridad** con las advertencias apropiadas

¿Te parece bien este template? ¿Necesitas algún ajuste en el diseño o funcionalidad?