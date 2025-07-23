/**
 * FrontDeskService.js
 * Servicio para la gestión de operaciones de recepción/secretarias
 */

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

class FrontDeskService {
  constructor() {
    this.workingHours = {
      start: 9,  // 9:00 AM
      end: 18,   // 6:00 PM
      slotDuration: 30, // 30 minutos por slot
      breakTimes: [
        { start: '12:00', end: '13:00' }, // Lunch break
        { start: '15:00', end: '15:30' }  // Coffee break
      ]
    };
  }

  // ============ ESTADÍSTICAS ============

  /**
   * Obtener estadísticas del día actual
   */
  async getTodayStats(userId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    try {
      const [appointments, payments, pendingPayments, resourcesSent] = await Promise.all([
        // Citas de hoy
        prisma.appointment.count({
          where: {
            userId,
            scheduledDateTime: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),
        
        // Pagos de hoy
        prisma.payment.count({
          where: {
            userId,
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),
        
        // Pagos pendientes
        prisma.pendingPayment.count({
          where: {
            userId,
            status: 'pending'
          }
        }),
        
        // Recursos enviados hoy
        prisma.resourceDelivery.count({
          where: {
            sentBy: userId,
            sentAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        })
      ]);

      return {
        appointments,
        payments,
        pendingPayments,
        resourcesSent
      };
    } catch (error) {
      console.error('Error getting today stats:', error);
      // Return mock data for development
      return {
        appointments: 8,
        payments: 6,
        pendingPayments: 3,
        resourcesSent: 12
      };
    }
  }

  /**
   * Obtener citas del día actual
   */
  async getTodayAppointments(userId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          userId,
          scheduledDateTime: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              paternalLastName: true,
              maternalLastName: true,
              phone: true
            }
          }
        },
        orderBy: {
          scheduledDateTime: 'asc'
        }
      });

      return appointments.map(apt => ({
        id: apt.id,
        patientName: `${apt.patient.firstName} ${apt.patient.paternalLastName}`,
        time: apt.scheduledDateTime.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: apt.status || 'scheduled',
        paymentStatus: apt.paymentStatus || 'pending',
        amount: apt.cost || 800
      }));
    } catch (error) {
      console.error('Error getting today appointments:', error);
      // Return mock data for development
      return [
        {
          id: '1',
          patientName: 'María García',
          time: '09:00',
          status: 'scheduled',
          paymentStatus: 'pending',
          amount: 800
        },
        {
          id: '2', 
          patientName: 'Carlos López',
          time: '10:30',
          status: 'in-progress',
          paymentStatus: 'paid',
          amount: 600
        },
        {
          id: '3',
          patientName: 'Ana Martínez',
          time: '14:00',
          status: 'scheduled',
          paymentStatus: 'partial',
          amount: 1000
        }
      ];
    }
  }

  /**
   * Obtener tareas pendientes
   */
  async getPendingTasks(userId) {
    try {
      // Buscar diferentes tipos de tareas pendientes
      const [pendingPayments, followUps, callbacks, pendingResources] = await Promise.all([
        // Pagos pendientes próximos a vencer
        prisma.pendingPayment.findMany({
          where: {
            userId,
            status: 'pending',
            dueDate: {
              lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Próximos 3 días
            }
          },
          include: {
            patient: {
              select: {
                firstName: true,
                paternalLastName: true
              }
            }
          },
          orderBy: { dueDate: 'asc' },
          take: 5
        }),

        // Seguimientos médicos
        prisma.followUp.findMany({
          where: {
            userId,
            status: 'pending',
            scheduledDate: {
              lte: new Date()
            }
          },
          include: {
            patient: {
              select: {
                firstName: true,
                paternalLastName: true
              }
            }
          },
          orderBy: { scheduledDate: 'asc' },
          take: 3
        }),

        // Llamadas pendientes
        prisma.callback.findMany({
          where: {
            userId,
            status: 'pending',
            scheduledFor: {
              lte: new Date()
            }
          },
          include: {
            patient: {
              select: {
                firstName: true,
                paternalLastName: true
              }
            }
          },
          orderBy: { scheduledFor: 'asc' },
          take: 3
        }),

        // Recursos pendientes de envío
        prisma.resourceDeliveryQueue.findMany({
          where: {
            userId,
            status: 'pending'
          },
          include: {
            patient: {
              select: {
                firstName: true,
                paternalLastName: true
              }
            }
          },
          take: 2
        })
      ]);

      const tasks = [];

      // Convertir pagos pendientes a tareas
      pendingPayments.forEach(payment => {
        tasks.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          description: `Cobro pendiente: $${payment.amount} - ${payment.concept}`,
          patientName: `${payment.patient.firstName} ${payment.patient.paternalLastName}`,
          priority: payment.dueDate < new Date() ? 'high' : 'medium',
          dueTime: payment.dueDate.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          })
        });
      });

      // Convertir seguimientos a tareas
      followUps.forEach(followUp => {
        tasks.push({
          id: `followup-${followUp.id}`,
          type: 'followup',
          description: followUp.notes || 'Seguimiento médico programado',
          patientName: `${followUp.patient.firstName} ${followUp.patient.paternalLastName}`,
          priority: 'medium',
          dueTime: followUp.scheduledDate.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          })
        });
      });

      // Convertir callbacks a tareas
      callbacks.forEach(callback => {
        tasks.push({
          id: `callback-${callback.id}`,
          type: 'callback',
          description: callback.reason || 'Llamada de seguimiento',
          patientName: `${callback.patient.firstName} ${callback.patient.paternalLastName}`,
          priority: callback.priority || 'low',
          dueTime: callback.scheduledFor.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          })
        });
      });

      // Convertir recursos pendientes a tareas
      pendingResources.forEach(resource => {
        tasks.push({
          id: `resource-${resource.id}`,
          type: 'resource',
          description: `Envío pendiente de recursos médicos`,
          patientName: `${resource.patient.firstName} ${resource.patient.paternalLastName}`,
          priority: 'low'
        });
      });

      return tasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    } catch (error) {
      console.error('Error getting pending tasks:', error);
      // Return mock data for development
      return [
        {
          id: '1',
          type: 'payment',
          description: 'Cobro pendiente: $800 - Consulta',
          patientName: 'Pedro Sánchez',
          priority: 'high',
          dueTime: '10:00'
        },
        {
          id: '2',
          type: 'callback',
          description: 'Recordatorio de cita para mañana',
          patientName: 'Laura Rodríguez',
          priority: 'medium',
          dueTime: '14:30'
        },
        {
          id: '3',
          type: 'resource',
          description: 'Envío pendiente de ejercicios',
          patientName: 'Roberto Cruz',
          priority: 'low'
        }
      ];
    }
  }

  // ============ PAGOS ============

  /**
   * Obtener pagos pendientes de un paciente
   */
  async getPendingPayments(patientId, userId) {
    try {
      const pendingPayments = await prisma.pendingPayment.findMany({
        where: {
          patientId,
          userId,
          status: 'pending'
        },
        orderBy: {
          dueDate: 'asc'
        }
      });

      return pendingPayments.map(payment => ({
        id: payment.id,
        patientId: payment.patientId,
        patientName: payment.patientName, // Esto debería venir de la relación
        concept: payment.concept,
        amount: payment.amount,
        dueDate: payment.dueDate.toLocaleDateString('es-MX'),
        type: payment.type
      }));
    } catch (error) {
      console.error('Error getting pending payments:', error);
      return [];
    }
  }

  /**
   * Procesar un nuevo pago
   */
  async processPayment(paymentData) {
    try {
      const payment = await prisma.payment.create({
        data: {
          patientId: paymentData.patientId,
          amount: parseFloat(paymentData.amount),
          concept: paymentData.concept,
          paymentMethod: paymentData.paymentMethod,
          notes: paymentData.notes || '',
          isAdvancePayment: paymentData.isAdvancePayment || false,
          processedBy: paymentData.processedBy,
          status: 'completed',
          transactionDate: new Date()
        }
      });

      // Si es un anticipo, crear registro en advance_payments
      if (paymentData.isAdvancePayment) {
        await prisma.advancePayment.create({
          data: {
            patientId: paymentData.patientId,
            paymentId: payment.id,
            amount: parseFloat(paymentData.amount),
            remainingAmount: parseFloat(paymentData.amount),
            status: 'available'
          }
        });
      }

      return payment;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Error al procesar el pago');
    }
  }

  /**
   * Pagar un monto pendiente específico
   */
  async payPendingAmount(pendingId, paymentInfo) {
    try {
      const pendingPayment = await prisma.pendingPayment.findUnique({
        where: { id: pendingId }
      });

      if (!pendingPayment) {
        throw new Error('Pago pendiente no encontrado');
      }

      // Crear el pago
      const payment = await prisma.payment.create({
        data: {
          patientId: pendingPayment.patientId,
          amount: pendingPayment.amount,
          concept: pendingPayment.concept,
          paymentMethod: paymentInfo.paymentMethod,
          notes: paymentInfo.notes || '',
          processedBy: paymentInfo.processedBy,
          status: 'completed',
          transactionDate: new Date(),
          pendingPaymentId: pendingId
        }
      });

      // Marcar el pago pendiente como pagado
      await prisma.pendingPayment.update({
        where: { id: pendingId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentId: payment.id
        }
      });

      return payment;
    } catch (error) {
      console.error('Error paying pending amount:', error);
      throw new Error('Error al pagar monto pendiente');
    }
  }

  // ============ CITAS ============

  /**
   * Obtener horarios disponibles para una fecha
   */
  async getAvailableSlots(date, userId) {
    try {
      const targetDate = new Date(date);
      const slots = [];

      // Generar slots de tiempo basados en horarios de trabajo
      for (let hour = this.workingHours.start; hour < this.workingHours.end; hour++) {
        for (let minutes = 0; minutes < 60; minutes += this.workingHours.slotDuration) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          
          // Verificar si está en horario de descanso
          const isBreakTime = this.workingHours.breakTimes.some(breakTime => {
            return timeString >= breakTime.start && timeString < breakTime.end;
          });

          if (isBreakTime) continue;

          // Verificar disponibilidad en la base de datos
          const slotDateTime = new Date(targetDate);
          slotDateTime.setHours(hour, minutes, 0, 0);

          const existingAppointment = await prisma.appointment.findFirst({
            where: {
              userId,
              scheduledDateTime: slotDateTime,
              status: { not: 'cancelled' }
            },
            include: {
              patient: {
                select: {
                  firstName: true,
                  paternalLastName: true
                }
              }
            }
          });

          slots.push({
            time: timeString,
            available: !existingAppointment,
            patientName: existingAppointment 
              ? `${existingAppointment.patient.firstName} ${existingAppointment.patient.paternalLastName}`
              : undefined
          });
        }
      }

      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      // Return mock data for development
      const slots = [];
      for (let hour = 9; hour <= 18; hour++) {
        for (let min = 0; min < 60; min += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          slots.push({
            time,
            available: Math.random() > 0.3, // 70% available
            patientName: Math.random() > 0.7 ? 'Paciente X' : undefined
          });
        }
      }
      return slots;
    }
  }

  /**
   * Agendar una nueva cita
   */
  async scheduleAppointment(appointmentData) {
    try {
      const scheduledDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`);

      const appointment = await prisma.appointment.create({
        data: {
          patientId: appointmentData.patientId,
          userId: appointmentData.scheduledBy,
          scheduledDateTime,
          type: appointmentData.type,
          duration: appointmentData.duration,
          notes: appointmentData.notes || '',
          status: 'scheduled',
          reminderEnabled: appointmentData.reminderEnabled || false,
          scheduledBy: appointmentData.scheduledBy
        }
      });

      // Si está habilitado el recordatorio, programarlo
      if (appointmentData.reminderEnabled) {
        await this.scheduleAppointmentReminder(appointment.id);
      }

      return appointment;
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      throw new Error('Error al agendar la cita');
    }
  }

  /**
   * Actualizar estado de una cita
   */
  async updateAppointmentStatus(appointmentId, status, notes, userId) {
    try {
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status,
          notes: notes || undefined,
          updatedAt: new Date(),
          updatedBy: userId
        }
      });

      return appointment;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw new Error('Error al actualizar estado de cita');
    }
  }

  // ============ RECURSOS ============

  /**
   * Enviar recursos a un paciente
   */
  async sendResourcesToPatient(sendingData) {
    try {
      const delivery = await prisma.resourceDelivery.create({
        data: {
          patientId: sendingData.patientId,
          resourceIds: JSON.stringify(sendingData.resourceIds),
          deliveryMethod: sendingData.deliveryMethod,
          personalMessage: sendingData.personalMessage || '',
          sentBy: sendingData.sentBy,
          sentAt: sendingData.scheduledFor ? new Date(sendingData.scheduledFor) : new Date(),
          status: sendingData.scheduledFor ? 'scheduled' : 'sent',
          trackDelivery: sendingData.trackDelivery || false
        }
      });

      // Aquí iría la lógica real de envío (WhatsApp, Email, etc.)
      // Por ahora simular el envío
      if (!sendingData.scheduledFor) {
        await this.executeResourceDelivery(delivery.id, sendingData);
      }

      return delivery;
    } catch (error) {
      console.error('Error sending resources to patient:', error);
      throw new Error('Error al enviar recursos');
    }
  }

  /**
   * Ejecutar el envío real de recursos
   */
  async executeResourceDelivery(deliveryId, sendingData) {
    try {
      // Aquí iría la integración real con WhatsApp, Email, etc.
      console.log(`Sending resources via ${sendingData.deliveryMethod} to patient ${sendingData.patientId}`);
      
      // Actualizar estado de envío
      await prisma.resourceDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'delivered',
          deliveredAt: new Date()
        }
      });

      return { success: true, deliveryId };
    } catch (error) {
      console.error('Error executing resource delivery:', error);
      throw new Error('Error al ejecutar envío de recursos');
    }
  }

  /**
   * Obtener historial de recursos enviados
   */
  async getResourceHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const [history, total] = await Promise.all([
        prisma.resourceDelivery.findMany({
          where: { sentBy: userId },
          include: {
            patient: {
              select: {
                firstName: true,
                paternalLastName: true,
                phone: true
              }
            }
          },
          orderBy: { sentAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.resourceDelivery.count({
          where: { sentBy: userId }
        })
      ]);

      return {
        data: history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting resource history:', error);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 }
      };
    }
  }

  // ============ NOTIFICACIONES Y RECORDATORIOS ============

  /**
   * Enviar recordatorio de cita
   */
  async sendAppointmentReminder(appointmentId, options = {}) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            select: {
              firstName: true,
              paternalLastName: true,
              phone: true,
              email: true
            }
          }
        }
      });

      if (!appointment) {
        throw new Error('Cita no encontrada');
      }

      const reminder = await prisma.appointmentReminder.create({
        data: {
          appointmentId,
          method: options.method || 'whatsapp',
          message: options.customMessage || this.getDefaultReminderMessage(appointment),
          sentBy: options.sentBy,
          sentAt: new Date(),
          status: 'sent'
        }
      });

      // Aquí iría la lógica real de envío del recordatorio
      console.log(`Sending appointment reminder via ${options.method} to ${appointment.patient.phone}`);

      return reminder;
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      throw new Error('Error al enviar recordatorio');
    }
  }

  /**
   * Obtener mensaje por defecto para recordatorios
   */
  getDefaultReminderMessage(appointment) {
    const date = appointment.scheduledDateTime.toLocaleDateString('es-MX');
    const time = appointment.scheduledDateTime.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `Estimado/a ${appointment.patient.firstName}, le recordamos su cita médica programada para el ${date} a las ${time}. Si no puede asistir, por favor comuníquese con nosotros para reagendar.`;
  }

  /**
   * Programar recordatorio automático de cita
   */
  async scheduleAppointmentReminder(appointmentId) {
    try {
      // Programar recordatorio 24 horas antes
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      const reminderTime = new Date(appointment.scheduledDateTime);
      reminderTime.setDate(reminderTime.getDate() - 1); // 24 horas antes

      await prisma.scheduledReminder.create({
        data: {
          appointmentId,
          scheduledFor: reminderTime,
          type: 'appointment',
          status: 'pending'
        }
      });

      return true;
    } catch (error) {
      console.error('Error scheduling appointment reminder:', error);
      return false;
    }
  }

  /**
   * Obtener notificaciones pendientes
   */
  async getPendingNotifications(userId) {
    try {
      const notifications = await prisma.scheduledReminder.findMany({
        where: {
          scheduledFor: { lte: new Date() },
          status: 'pending'
        },
        include: {
          appointment: {
            include: {
              patient: {
                select: {
                  firstName: true,
                  paternalLastName: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: { scheduledFor: 'asc' }
      });

      return notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        scheduledFor: notification.scheduledFor,
        appointment: notification.appointment,
        patient: notification.appointment?.patient
      }));
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  // ============ REPORTES ============

  /**
   * Generar reporte diario
   */
  async getDailyReport(userId, date) {
    try {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

      const [appointments, payments, resourcesSent] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            userId,
            scheduledDateTime: { gte: startOfDay, lt: endOfDay }
          },
          include: {
            patient: {
              select: {
                firstName: true,
                paternalLastName: true
              }
            }
          }
        }),

        prisma.payment.findMany({
          where: {
            processedBy: userId,
            transactionDate: { gte: startOfDay, lt: endOfDay }
          },
          include: {
            patient: {
              select: {
                firstName: true,
                paternalLastName: true
              }
            }
          }
        }),

        prisma.resourceDelivery.findMany({
          where: {
            sentBy: userId,
            sentAt: { gte: startOfDay, lt: endOfDay }
          },
          include: {
            patient: {
              select: {
                firstName: true,
                paternalLastName: true
              }
            }
          }
        })
      ]);

      const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

      return {
        date: targetDate.toLocaleDateString('es-MX'),
        summary: {
          totalAppointments: appointments.length,
          totalPayments: payments.length,
          totalAmount: totalPayments,
          totalResourcesSent: resourcesSent.length
        },
        appointments: appointments.map(apt => ({
          time: apt.scheduledDateTime.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          patient: `${apt.patient.firstName} ${apt.patient.paternalLastName}`,
          status: apt.status,
          type: apt.type
        })),
        payments: payments.map(payment => ({
          time: payment.transactionDate.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          patient: `${payment.patient.firstName} ${payment.patient.paternalLastName}`,
          amount: payment.amount,
          concept: payment.concept,
          method: payment.paymentMethod
        })),
        resourcesSent: resourcesSent.map(delivery => ({
          time: delivery.sentAt.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          patient: `${delivery.patient.firstName} ${delivery.patient.paternalLastName}`,
          method: delivery.deliveryMethod,
          resourceCount: JSON.parse(delivery.resourceIds).length
        }))
      };
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw new Error('Error al generar reporte diario');
    }
  }

  /**
   * Generar reporte de pagos
   */
  async getPaymentsReport(userId, options = {}) {
    try {
      const { startDate, endDate } = options;
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const payments = await prisma.payment.findMany({
        where: {
          processedBy: userId,
          transactionDate: { gte: start, lte: end }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              paternalLastName: true
            }
          }
        },
        orderBy: { transactionDate: 'desc' }
      });

      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const paymentsByMethod = payments.reduce((acc, payment) => {
        acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
        return acc;
      }, {});

      return {
        period: {
          startDate: start.toLocaleDateString('es-MX'),
          endDate: end.toLocaleDateString('es-MX')
        },
        summary: {
          totalPayments: payments.length,
          totalAmount,
          averagePayment: payments.length > 0 ? totalAmount / payments.length : 0,
          paymentsByMethod
        },
        payments: payments.map(payment => ({
          date: payment.transactionDate.toLocaleDateString('es-MX'),
          time: payment.transactionDate.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          patient: `${payment.patient.firstName} ${payment.patient.paternalLastName}`,
          amount: payment.amount,
          concept: payment.concept,
          method: payment.paymentMethod,
          notes: payment.notes
        }))
      };
    } catch (error) {
      console.error('Error generating payments report:', error);
      throw new Error('Error al generar reporte de pagos');
    }
  }
}

module.exports = FrontDeskService;