const nodemailer = require('nodemailer');

class EmailServiceZoho {
  constructor() {
    // Configuración para Zoho Mail
    this.transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.ZOHO_EMAIL, // alejandro.contreras@mindhub.cloud
        pass: process.env.ZOHO_APP_PASSWORD // App password de Zoho
      }
    });

    // Aliases para diferentes propósitos
    this.aliases = {
      noreply: 'MindHub <noreply@mindhub.cloud>',
      feedback: 'MindHub Feedback <feedback@mindhub.cloud>',
      support: 'MindHub Soporte <soporte@mindhub.cloud>',
      info: 'MindHub Info <info@mindhub.cloud>',
      hola: 'MindHub <hola@mindhub.cloud>'
    };
  }

  async sendMail(options) {
    try {
      const info = await this.transporter.sendMail(options);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendVerificationEmail(to, name, verificationToken) {
    const verificationUrl = `https://www.mindhub.cloud/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: this.aliases.noreply,
      to: to,
      subject: 'Bienvenido a MindHub - Confirma tu cuenta',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #29A98C 0%, #1E3A8A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #29A98C; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .highlight { background: #e6f3ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #29A98C; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a MindHub!</h1>
            </div>
            <div class="content">
              <h2>Hola ${name},</h2>
              <p><strong>Gracias por tu interés, Tu cuenta ha sido creada, solo tienes que verificar tu correo y estarás listo para probar MindHub.</strong></p>
              
              <div class="highlight">
                <p><strong>Recuerda que estamos en etapa Beta</strong> por lo que tienes acceso sin restricciones a la plataforma, es probable que este periodo dure un par de meses en lo que nos aseguramos que MindHub cumpla con todos los estándares de calidad que tú te mereces.</p>
              </div>
              
              <p>Agradecemos mucho tu retroalimentación, si tienes algún comentario, observación, si existen fallas en la plataforma, por favor no dudes en hacer un ticket de feedback en la plataforma, o enviarnos un correo a feedback@mindhub.cloud</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Confirmar mi cuenta</a>
              </div>
              
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px; font-size: 12px;">${verificationUrl}</p>
              <p><small>Este enlace expirará en 24 horas.</small></p>
            </div>
            <div class="footer">
              <p>© 2025 MindHub - Plataforma de Gestión Sanitaria</p>
              <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendMail(mailOptions);
  }

  async sendWelcomeEmail(to, name) {
    const mailOptions = {
      from: this.aliases.info,
      to: to,
      subject: '¡Bienvenido a MindHub! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #29A98C 0%, #1E3A8A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #29A98C; }
            .button { display: inline-block; padding: 15px 30px; background: #29A98C; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Tu cuenta está lista! 🚀</h1>
            </div>
            <div class="content">
              <h2>Hola ${name},</h2>
              <p><strong>¡Gracias por ser parte de este proyecto!</strong></p>
              <p>Juntos mejoraremos tu práctica clínica a un nivel de mayor automatización, con menos tareas repetitivas y mayor libertad de tiempo, en apoyo de tu salud mental.</p>
              
              <h3>🎯 Próximos pasos:</h3>
              <div class="feature">
                <strong>1. Explora el Dashboard</strong>
                <p>Familiarízate con la interfaz y descubre todas las herramientas disponibles.</p>
              </div>
              <div class="feature">
                <strong>2. Configura tu Perfil</strong>
                <p>Completa tu información profesional para personalizar tu experiencia.</p>
              </div>
              <div class="feature">
                <strong>3. Únete a la Comunidad Beta</strong>
                <p>Tu feedback es invaluable. Comparte tus sugerencias y ayúdanos a mejorar.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://www.mindhub.cloud/dashboard" class="button">Ir a mi Dashboard</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendMail(mailOptions);
  }

  async sendFeedbackNotification(userEmail, subject, message) {
    // Email interno para el equipo
    const internalMailOptions = {
      from: this.aliases.feedback,
      to: process.env.FEEDBACK_EMAIL || process.env.ZOHO_EMAIL, // Tu email principal
      replyTo: userEmail, // Para poder responder directamente al usuario
      subject: `[Feedback MindHub] ${subject}`,
      html: `
        <h2>Nuevo Feedback Recibido</h2>
        <hr>
        <p><strong>De:</strong> ${userEmail}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
        <hr>
        <h3>Mensaje:</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        <hr>
        <p><small>Puedes responder directamente a este email para contactar al usuario.</small></p>
      `
    };

    const internalResult = await this.sendMail(internalMailOptions);

    // Auto-respuesta al usuario
    if (internalResult.success) {
      const autoReplyOptions = {
        from: this.aliases.support,
        to: userEmail,
        subject: 'Hemos recibido tu feedback - MindHub',
        html: `
          <h2>¡Gracias por tu feedback!</h2>
          <p>Hemos recibido tu mensaje y lo revisaremos lo antes posible.</p>
          <p>Tu opinión es muy importante para nosotros y nos ayuda a mejorar continuamente la plataforma.</p>
          <p>Te responderemos en un plazo máximo de 48 horas hábiles.</p>
          <br>
          <p>Mientras tanto, si tienes alguna pregunta urgente, no dudes en responder a este email.</p>
          <br>
          <p>Saludos cordiales,<br>
          El equipo de MindHub</p>
          <hr>
          <p><small>Este es un mensaje automático, pero las respuestas son leídas por personas reales.</small></p>
        `
      };

      await this.sendMail(autoReplyOptions);
    }

    return internalResult;
  }

  async sendPasswordResetEmail(to, name, resetToken) {
    const resetUrl = `https://www.mindhub.cloud/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: this.aliases.noreply,
      to: to,
      subject: 'Restablecer contraseña - MindHub',
      html: `
        <h2>Hola ${name},</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #29A98C; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
        <br>
        <p>Por seguridad, nunca compartas este enlace con nadie.</p>
      `
    };

    return await this.sendMail(mailOptions);
  }

  // Test connection
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Zoho Mail connection verified successfully');
      return true;
    } catch (error) {
      console.error('Zoho Mail connection error:', error);
      return false;
    }
  }
}

module.exports = new EmailServiceZoho();