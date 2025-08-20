const cron = require('node-cron');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

class DeadlineMonitorService {
  constructor() {
    this.isRunning = false;
    this.invitations = new Map(); // En memoria, se reemplazará con DB
    this.setupEmailTransporter();
    this.setupTwilioClient();
    this.startMonitoring();
  }

  setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  setupTwilioClient() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  startMonitoring() {
    if (this.isRunning) return;

    // Ejecutar cada 5 minutos
    this.cronJob = cron.schedule('*/5 * * * *', () => {
      this.checkDeadlines();
    }, {
      scheduled: false
    });

    this.cronJob.start();
    this.isRunning = true;
    console.log('🕒 Servicio de monitoreo de deadlines iniciado');
  }

  stopMonitoring() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 Servicio de monitoreo de deadlines detenido');
    }
  }

  async checkDeadlines() {
    console.log('🔍 Verificando deadlines...');
    const now = new Date();

    for (const [invitationId, invitation] of this.invitations) {
      const deadline = new Date(invitation.confirmationDeadline);
      const hoursToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Enviar recordatorios
      if (hoursToDeadline <= 6 && hoursToDeadline > 5.5 && !invitation.reminder6hSent) {
        await this.sendReminder(invitation, '6 horas');
        invitation.reminder6hSent = true;
      }

      if (hoursToDeadline <= 2 && hoursToDeadline > 1.5 && !invitation.reminder2hSent) {
        await this.sendReminder(invitation, '2 horas');
        invitation.reminder2hSent = true;
      }

      if (hoursToDeadline <= 0.5 && hoursToDeadline > 0 && !invitation.reminder30mSent) {
        await this.sendReminder(invitation, '30 minutos');
        invitation.reminder30mSent = true;
      }

      // Cancelar citas vencidas
      if (hoursToDeadline <= 0 && invitation.status === 'payment_pending') {
        await this.cancelExpiredInvitation(invitation);
      }
    }
  }

  async sendReminder(invitation, timeLeft) {
    console.log(`⏰ Enviando recordatorio de ${timeLeft} para invitación ${invitation.id}`);
    
    const patient = invitation.waitingListEntry.patient;
    const slot = invitation.availableSlot;
    
    const message = `
Recordatorio urgente: Su cita del ${new Date(slot.date).toLocaleDateString('es-ES')} 
a las ${slot.time} vence en ${timeLeft}. 

Confirme y pague el anticipo de $${invitation.paymentRequired} para asegurar su cita.

Link de pago: ${process.env.FRONTEND_URL}/payment/${invitation.id}
    `.trim();

    // Enviar por email
    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: patient.email,
        subject: `Recordatorio: Confirme su cita (${timeLeft} restantes)`,
        text: message,
        html: this.generateReminderHTML(invitation, timeLeft)
      });
    } catch (error) {
      console.error('Error enviando email:', error);
    }

    // Enviar por SMS si Twilio está configurado
    if (this.twilioClient) {
      try {
        await this.twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: patient.phone
        });
      } catch (error) {
        console.error('Error enviando SMS:', error);
      }
    }
  }

  async cancelExpiredInvitation(invitation) {
    console.log(`❌ Cancelando invitación vencida: ${invitation.id}`);
    
    // Marcar como expirada
    invitation.status = 'expired';
    invitation.expiredDate = new Date().toISOString();

    // Notificar al paciente
    await this.notifyExpiration(invitation);

    // Liberar el slot y notificar al siguiente en lista
    await this.processNextInWaitingList(invitation.availableSlot);

    // Remover de monitoreo
    this.invitations.delete(invitation.id);
  }

  async notifyExpiration(invitation) {
    const patient = invitation.waitingListEntry.patient;
    const slot = invitation.availableSlot;
    
    const message = `
Su invitación para la cita del ${new Date(slot.date).toLocaleDateString('es-ES')} 
a las ${slot.time} ha expirado por falta de confirmación.

El espacio ha sido liberado para otros pacientes. 
Puede contactarnos para solicitar una nueva cita.
    `.trim();

    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: patient.email,
        subject: 'Invitación de cita expirada',
        text: message
      });
    } catch (error) {
      console.error('Error enviando notificación de expiración:', error);
    }
  }

  async processNextInWaitingList(availableSlot) {
    // Esta función debería consultar la base de datos para encontrar
    // el siguiente paciente en lista de espera que coincida con el slot
    console.log(`🔄 Procesando siguiente paciente para slot ${availableSlot.date} ${availableSlot.time}`);
    
    // TODO: Implementar lógica de base de datos
    // 1. Buscar pacientes en lista de espera ordenados por prioridad y fecha
    // 2. Filtrar por preferencias de fecha/hora que coincidan
    // 3. Crear nueva invitación para el primer candidato
    // 4. Enviar notificación inmediata
  }

  generateReminderHTML(invitation, timeLeft) {
    const patient = invitation.waitingListEntry.patient;
    const slot = invitation.availableSlot;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recordatorio de Cita - MindHub</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f0fdfa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0891b2, #0e7490); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .urgent-banner { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
    .appointment-details { background: #f0fdfa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #29A98C, #0891b2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🕒 Recordatorio Urgente</h1>
      <p>Su cita expira en ${timeLeft}</p>
    </div>
    
    <div class="content">
      <div class="urgent-banner">
        <strong>⚠️ ACCIÓN REQUERIDA</strong><br>
        Debe confirmar y pagar su anticipo antes de que expire el tiempo límite
      </div>
      
      <p>Estimado/a ${patient.name},</p>
      
      <p>Le recordamos que su invitación para la siguiente cita está por expirar:</p>
      
      <div class="appointment-details">
        <h3>📅 Detalles de la Cita</h3>
        <p><strong>Fecha:</strong> ${new Date(slot.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>Hora:</strong> ${slot.time}</p>
        <p><strong>Tipo:</strong> ${invitation.waitingListEntry.appointmentType}</p>
        <p><strong>Duración:</strong> ${slot.duration} minutos</p>
        <p><strong>Anticipo requerido:</strong> $${invitation.paymentRequired} MXN</p>
      </div>
      
      <p><strong>Tiempo restante: ${timeLeft}</strong></p>
      
      <p>Para confirmar su cita, haga clic en el siguiente botón y complete el pago del anticipo:</p>
      
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/payment/${invitation.id}" class="cta-button">
          💳 Confirmar y Pagar Anticipo
        </a>
      </div>
      
      <p><small><strong>Importante:</strong> Si no confirma dentro del tiempo límite, la cita será automáticamente cancelada y el espacio será ofrecido al siguiente paciente en lista de espera.</small></p>
    </div>
    
    <div class="footer">
      <p>MindHub - Sistema de Gestión Médica</p>
      <p>Este es un mensaje automático, no responda a este correo.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Métodos para gestionar invitaciones
  addInvitation(invitation) {
    invitation.reminder6hSent = false;
    invitation.reminder2hSent = false;
    invitation.reminder30mSent = false;
    this.invitations.set(invitation.id, invitation);
    console.log(`➕ Invitación agregada al monitoreo: ${invitation.id}`);
  }

  updateInvitationStatus(invitationId, newStatus) {
    const invitation = this.invitations.get(invitationId);
    if (invitation) {
      invitation.status = newStatus;
      
      // Si se confirma o expira, remover del monitoreo
      if (['confirmed', 'expired', 'declined'].includes(newStatus)) {
        this.invitations.delete(invitationId);
        console.log(`🗑️ Invitación removida del monitoreo: ${invitationId}`);
      }
    }
  }

  getMonitoredInvitations() {
    return Array.from(this.invitations.values());
  }

  // Método para pruebas
  async testReminder(invitationId) {
    const invitation = this.invitations.get(invitationId);
    if (invitation) {
      await this.sendReminder(invitation, 'PRUEBA');
      return true;
    }
    return false;
  }
}

// Singleton instance
let monitorInstance = null;

function getDeadlineMonitor() {
  if (!monitorInstance) {
    monitorInstance = new DeadlineMonitorService();
  }
  return monitorInstance;
}

module.exports = {
  DeadlineMonitorService,
  getDeadlineMonitor
};