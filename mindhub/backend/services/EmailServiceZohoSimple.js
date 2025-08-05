const nodemailer = require('nodemailer');

class EmailServiceZohoSimple {
  constructor() {
    // Configuración para Zoho Mail (versión simple)
    this.transporter = nodemailer.createTransporter({
      service: 'Zoho', // Usa el preset de Zoho
      auth: {
        user: process.env.ZOHO_EMAIL, // drcontreras@mindhub.cloud
        pass: process.env.ZOHO_PASSWORD // Tu contraseña normal (menos seguro)
      }
    });

    // O configuración manual:
    // this.transporter = nodemailer.createTransporter({
    //   host: 'smtppro.zoho.com', // Algunas cuentas usan smtppro
    //   port: 587,
    //   secure: false, // STARTTLS
    //   auth: {
    //     user: process.env.ZOHO_EMAIL,
    //     pass: process.env.ZOHO_PASSWORD
    //   }
    // });

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

  // Los mismos métodos que el otro servicio...
  async sendVerificationEmail(to, name, verificationToken) {
    const verificationUrl = `https://www.mindhub.cloud/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: this.aliases.noreply,
      to: to,
      subject: 'Verifica tu cuenta de MindHub',
      html: `
        <h2>¡Bienvenido a MindHub!</h2>
        <p>Hola ${name},</p>
        <p>Para completar tu registro, verifica tu email:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background: #29A98C; color: white; text-decoration: none; border-radius: 5px;">Verificar Email</a>
        <p>O copia este enlace: ${verificationUrl}</p>
        <p>Este enlace expira en 24 horas.</p>
      `
    };

    return await this.sendMail(mailOptions);
  }

  async sendFeedbackNotification(userEmail, subject, message) {
    const mailOptions = {
      from: this.aliases.feedback,
      to: process.env.ZOHO_EMAIL, // Tu email principal
      replyTo: userEmail,
      subject: `[Feedback MindHub] ${subject}`,
      html: `
        <h2>Nuevo Feedback</h2>
        <p><strong>De:</strong> ${userEmail}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <hr>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    const result = await this.sendMail(mailOptions);
    
    // Auto-respuesta
    if (result.success) {
      await this.sendMail({
        from: this.aliases.support,
        to: userEmail,
        subject: 'Hemos recibido tu feedback - MindHub',
        html: `
          <h2>¡Gracias por tu feedback!</h2>
          <p>Lo hemos recibido y lo revisaremos pronto.</p>
          <p>Te responderemos en máximo 48 horas.</p>
        `
      });
    }

    return result;
  }
}

module.exports = new EmailServiceZohoSimple();