/**
 * Notification Service for MindHub Resources Library
 * 
 * Handles sending notifications to patients about new resources,
 * reminders for resource completion, and follow-up communications.
 */

const nodemailer = require('nodemailer');
const twilio = require('twilio');

class NotificationService {
  constructor(config = {}) {
    this.config = {
      emailEnabled: config.emailEnabled !== false,
      smsEnabled: config.smsEnabled !== false,
      ...config
    };

    // Initialize email transporter
    if (this.config.emailEnabled) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }

    // Initialize SMS client
    if (this.config.smsEnabled && process.env.TWILIO_ACCOUNT_SID) {
      this.smsClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  /**
   * Send resource notification via email
   */
  async sendResourceEmail(options) {
    if (!this.config.emailEnabled || !this.emailTransporter) {
      throw new Error('Email notifications are not enabled');
    }

    const {
      to,
      patientName,
      resourceTitle,
      resourceContent,
      practitionerName,
      clinicName,
      customMessage,
      downloadUrl,
      attachments = []
    } = options;

    try {
      // Generate email content
      const emailSubject = `Nuevo recurso psicoeducativo: ${resourceTitle}`;
      const emailHtml = this.generateResourceEmailTemplate({
        patientName,
        resourceTitle,
        resourceContent,
        practitionerName,
        clinicName,
        customMessage,
        downloadUrl
      });

      const mailOptions = {
        from: `${clinicName || 'Clínica'} <${process.env.SMTP_FROM}>`,
        to: to,
        subject: emailSubject,
        html: emailHtml,
        attachments: attachments
      };

      const info = await this.emailTransporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        method: 'email',
        sentAt: new Date(),
        recipient: to
      };

    } catch (error) {
      console.error('Error sending resource email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send resource notification via SMS
   */
  async sendResourceSMS(options) {
    if (!this.config.smsEnabled || !this.smsClient) {
      throw new Error('SMS notifications are not enabled');
    }

    const {
      to,
      patientName,
      resourceTitle,
      practitionerName,
      clinicName,
      downloadUrl,
      customMessage
    } = options;

    try {
      // Generate SMS content
      const smsBody = this.generateResourceSMSTemplate({
        patientName,
        resourceTitle,
        practitionerName,
        clinicName,
        downloadUrl,
        customMessage
      });

      const message = await this.smsClient.messages.create({
        body: smsBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      return {
        success: true,
        messageId: message.sid,
        method: 'sms',
        sentAt: new Date(),
        recipient: to
      };

    } catch (error) {
      console.error('Error sending resource SMS:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send follow-up reminder
   */
  async sendFollowUpReminder(options) {
    const {
      patient,
      resource,
      practitioner,
      clinic,
      daysSinceSent,
      method = 'email'
    } = options;

    const reminderOptions = {
      to: method === 'email' ? patient.email : patient.phone,
      patientName: patient.name,
      resourceTitle: resource.title,
      practitionerName: practitioner.name,
      clinicName: clinic.name,
      daysSinceSent,
      isReminder: true
    };

    if (method === 'email') {
      return await this.sendFollowUpEmail(reminderOptions);
    } else if (method === 'sms') {
      return await this.sendFollowUpSMS(reminderOptions);
    } else {
      throw new Error('Unsupported reminder method');
    }
  }

  /**
   * Send follow-up email reminder
   */
  async sendFollowUpEmail(options) {
    const {
      to,
      patientName,
      resourceTitle,
      practitionerName,
      clinicName,
      daysSinceSent
    } = options;

    try {
      const emailSubject = `Recordatorio: ${resourceTitle}`;
      const emailHtml = this.generateFollowUpEmailTemplate({
        patientName,
        resourceTitle,
        practitionerName,
        clinicName,
        daysSinceSent
      });

      const mailOptions = {
        from: `${clinicName} <${process.env.SMTP_FROM}>`,
        to: to,
        subject: emailSubject,
        html: emailHtml
      };

      const info = await this.emailTransporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        method: 'email',
        type: 'follow_up',
        sentAt: new Date(),
        recipient: to
      };

    } catch (error) {
      console.error('Error sending follow-up email:', error);
      throw new Error(`Failed to send follow-up email: ${error.message}`);
    }
  }

  /**
   * Generate resource email template
   */
  generateResourceEmailTemplate(options) {
    const {
      patientName,
      resourceTitle,
      resourceContent,
      practitionerName,
      clinicName,
      customMessage,
      downloadUrl
    } = options;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${resourceTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0891b2, #0c4a6e); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .resource-content { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2; }
        .download-button { display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">📚 ${clinicName || 'MindHub'}</div>
        <h1 style="margin: 0;">Nuevo Recurso Psicoeducativo</h1>
      </div>
      
      <div class="content">
        <h2>Hola ${patientName},</h2>
        
        ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
        
        <p>Tu ${practitionerName ? `especialista ${practitionerName}` : 'especialista'} ha compartido contigo el siguiente recurso que puede ser útil para tu tratamiento:</p>
        
        <div class="resource-content">
          <h3>${resourceTitle}</h3>
          ${resourceContent ? `<div>${resourceContent.substring(0, 500)}...</div>` : ''}
        </div>
        
        ${downloadUrl ? `
          <a href="${downloadUrl}" class="download-button">
            📥 Descargar Recurso
          </a>
        ` : ''}
        
        <p>Este recurso ha sido personalizado especialmente para ti. Te recomendamos leerlo con atención y aplicar las técnicas o información que contiene.</p>
        
        <p>Si tienes dudas sobre el contenido o necesitas aclarar algo, no dudes en contactar a tu especialista en tu próxima consulta.</p>
        
        <p>¡Esperamos que este recurso sea útil para tu bienestar!</p>
        
        <p>Saludos cordiales,<br>
        <strong>${practitionerName || 'Tu equipo de especialistas'}</strong><br>
        ${clinicName || 'Clínica'}</p>
      </div>
      
      <div class="footer">
        <p>Este mensaje fue enviado desde ${clinicName || 'tu clínica'}.</p>
        <p>Para tu privacidad, este enlace de descarga expirará en 24 horas.</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate resource SMS template
   */
  generateResourceSMSTemplate(options) {
    const {
      patientName,
      resourceTitle,
      practitionerName,
      clinicName,
      downloadUrl,
      customMessage
    } = options;

    let message = `Hola ${patientName}, `;
    
    if (customMessage) {
      message += `${customMessage} `;
    } else {
      message += `tu ${practitionerName ? `especialista ${practitionerName}` : 'especialista'} ha compartido contigo un nuevo recurso: "${resourceTitle}". `;
    }

    if (downloadUrl) {
      message += `Descárgalo aquí: ${downloadUrl}`;
    }

    message += ` - ${clinicName || 'Tu clínica'}`;

    // Ensure SMS doesn't exceed 160 characters for single SMS
    if (message.length > 160) {
      message = message.substring(0, 157) + '...';
    }

    return message;
  }

  /**
   * Generate follow-up email template
   */
  generateFollowUpEmailTemplate(options) {
    const {
      patientName,
      resourceTitle,
      practitionerName,
      clinicName,
      daysSinceSent
    } = options;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recordatorio: ${resourceTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
        .reminder-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">🔔 Recordatorio Amigable</h1>
      </div>
      
      <div class="content">
        <h2>Hola ${patientName},</h2>
        
        <p>Espero que te encuentres bien. Te escribo para recordarte sobre el recurso psicoeducativo que compartí contigo hace ${daysSinceSent} días:</p>
        
        <div class="reminder-box">
          <h3>📖 ${resourceTitle}</h3>
          <p>Este recurso contiene información valiosa que puede ayudarte en tu proceso de bienestar.</p>
        </div>
        
        <p>Si aún no has tenido la oportunidad de revisarlo, te animo a que lo hagas cuando tengas un momento tranquilo. No hay presión, pero la información puede ser muy útil para complementar nuestro trabajo en consulta.</p>
        
        <p>Si ya lo revisaste, ¡excelente! En nuestra próxima sesión podemos comentar cualquier duda o reflexión que haya surgido.</p>
        
        <p>Si tienes alguna pregunta sobre el contenido, no dudes en escribirme o comentarlo en tu próxima consulta.</p>
        
        <p>Cuídate mucho,<br>
        <strong>${practitionerName}</strong><br>
        ${clinicName}</p>
      </div>
      
      <div class="footer">
        <p>Este es un recordatorio amigable de ${clinicName}.</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Schedule follow-up reminder
   */
  async scheduleFollowUpReminder(options) {
    const {
      usageRecordId,
      patientId,
      resourceId,
      reminderDays = 3,
      method = 'email'
    } = options;

    // In a production environment, you would use a job queue like Bull or agenda
    // For now, we'll create a simple reminder record
    const reminderData = {
      usageRecordId,
      patientId,
      resourceId,
      scheduledFor: new Date(Date.now() + (reminderDays * 24 * 60 * 60 * 1000)),
      method,
      status: 'scheduled',
      createdAt: new Date()
    };

    // Store reminder in database
    await this.storeReminderSchedule(reminderData);

    return {
      success: true,
      reminderId: `reminder_${Date.now()}`,
      scheduledFor: reminderData.scheduledFor
    };
  }

  /**
   * Store reminder schedule in database
   */
  async storeReminderSchedule(reminderData) {
    const FirestoreConfig = require('../../shared/config/firestore-resources-config');
    const firestoreConfig = new FirestoreConfig();
    await firestoreConfig.initialize();
    
    const remindersCollection = firestoreConfig.getCollection('reminders');
    await remindersCollection.add(reminderData);
    
    return true;
  }

  /**
   * Test notification configuration
   */
  async testConfiguration() {
    const results = {
      email: false,
      sms: false,
      errors: []
    };

    // Test email configuration
    if (this.config.emailEnabled && this.emailTransporter) {
      try {
        await this.emailTransporter.verify();
        results.email = true;
      } catch (error) {
        results.errors.push(`Email: ${error.message}`);
      }
    }

    // Test SMS configuration
    if (this.config.smsEnabled && this.smsClient) {
      try {
        // Test with a simple account lookup
        await this.smsClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        results.sms = true;
      } catch (error) {
        results.errors.push(`SMS: ${error.message}`);
      }
    }

    return results;
  }
}

module.exports = NotificationService;