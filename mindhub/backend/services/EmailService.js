const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = 'MindHub <noreply@mindhub.cloud>';
  }

  async sendVerificationEmail(to, name, verificationToken) {
    try {
      const verificationUrl = `https://www.mindhub.cloud/verify-email?token=${verificationToken}`;
      
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Verifica tu cuenta de MindHub',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #29A98C 0%, #1E3A8A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 15px 30px; background: #29A98C; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>¡Bienvenido a MindHub!</h1>
              </div>
              <div class="content">
                <h2>Hola ${name},</h2>
                <p>Gracias por registrarte en MindHub. Para completar tu registro, por favor verifica tu dirección de email haciendo clic en el siguiente botón:</p>
                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verificar mi email</a>
                </div>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
                <p>Este enlace expirará en 24 horas.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p><strong>¿Por qué verificar tu email?</strong></p>
                <ul>
                  <li>Protege tu cuenta de accesos no autorizados</li>
                  <li>Permite recuperar tu contraseña si la olvidas</li>
                  <li>Te mantiene informado sobre actualizaciones importantes</li>
                </ul>
              </div>
              <div class="footer">
                <p>© 2025 MindHub - Plataforma de Gestión Sanitaria</p>
                <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(to, name) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
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
                  <p>Tu feedback es invaluable para nosotros. Comparte tus sugerencias y ayúdanos a mejorar.</p>
                </div>
                
                <div style="text-align: center;">
                  <a href="https://www.mindhub.cloud/dashboard" class="button">Ir a mi Dashboard</a>
                </div>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p><strong>¿Necesitas ayuda?</strong></p>
                <p>Estamos aquí para apoyarte. Responde a este email o visita nuestra sección de ayuda.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendFeedbackNotification(from, subject, message) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: ['feedback@mindhub.cloud'], // Tu email de feedback
        reply_to: from,
        subject: `Feedback MindHub: ${subject}`,
        html: `
          <h2>Nuevo Feedback Recibido</h2>
          <p><strong>De:</strong> ${from}</p>
          <p><strong>Asunto:</strong> ${subject}</p>
          <hr>
          <h3>Mensaje:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Este mensaje fue enviado desde el formulario de feedback de MindHub.</small></p>
        `,
      });

      if (error) {
        console.error('Error sending feedback:', error);
        return { success: false, error };
      }

      // Send auto-reply to user
      await this.sendFeedbackAutoReply(from);

      return { success: true, data };
    } catch (error) {
      console.error('Feedback service error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendFeedbackAutoReply(to) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Hemos recibido tu feedback - MindHub',
        html: `
          <h2>¡Gracias por tu feedback!</h2>
          <p>Hemos recibido tu mensaje y lo revisaremos lo antes posible.</p>
          <p>Tu opinión es muy importante para nosotros y nos ayuda a mejorar continuamente la plataforma.</p>
          <p>Te responderemos en un plazo máximo de 48 horas hábiles.</p>
          <br>
          <p>Saludos,<br>El equipo de MindHub</p>
        `,
      });
    } catch (error) {
      console.error('Error sending auto-reply:', error);
    }
  }

  async sendPasswordResetEmail(to, name, resetToken) {
    try {
      const resetUrl = `https://www.mindhub.cloud/reset-password?token=${resetToken}`;
      
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Restablecer contraseña - MindHub',
        html: `
          <h2>Hola ${name},</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #29A98C; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
        `,
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();