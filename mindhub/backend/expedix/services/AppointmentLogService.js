const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

class AppointmentLogService {
  /**
   * Log appointment actions
   * @param {Object} params
   * @param {string} params.appointmentId - ID of the appointment
   * @param {string} params.patientId - ID of the patient
   * @param {string} params.userId - ID of the user making the change
   * @param {string} params.userName - Name of the user making the change
   * @param {string} params.action - Action performed (created, updated, cancelled, rescheduled, etc.)
   * @param {Object} params.previousData - Previous state of the appointment
   * @param {Object} params.newData - New state of the appointment
   * @param {string} params.reason - Reason for the change (optional)
   * @returns {Promise<Object>} Created log entry
   */
  static async logAppointmentAction(params) {
    const {
      appointmentId,
      patientId,
      userId,
      userName,
      action,
      previousData,
      newData,
      reason
    } = params;

    try {
      // Create the log entry
      const logEntry = await prisma.appointmentLogs.create({
        data: {
          appointmentId,
          patientId,
          userId,
          userName,
          action,
          previousData: previousData ? JSON.stringify(previousData) : null,
          newData: newData ? JSON.stringify(newData) : null,
          changes: this.generateChangesSummary(previousData, newData),
          reason,
          createdAt: new Date()
        }
      });

      // Check if patient has frequent changes pattern
      await this.checkFrequentChangesPattern(patientId);

      return logEntry;
    } catch (error) {
      console.error('Error logging appointment action:', error);
      throw error;
    }
  }

  /**
   * Generate a human-readable summary of changes
   * @param {Object} previousData 
   * @param {Object} newData 
   * @returns {string} Changes summary
   */
  static generateChangesSummary(previousData, newData) {
    if (!previousData || !newData) return '';

    const changes = [];

    if (previousData.date !== newData.date) {
      changes.push(`Fecha cambió de ${previousData.date} a ${newData.date}`);
    }
    if (previousData.time !== newData.time) {
      changes.push(`Hora cambió de ${previousData.time} a ${newData.time}`);
    }
    if (previousData.type !== newData.type) {
      changes.push(`Tipo cambió de ${previousData.type} a ${newData.type}`);
    }
    if (previousData.status !== newData.status) {
      changes.push(`Estado cambió de ${previousData.status} a ${newData.status}`);
    }

    return changes.join(', ');
  }

  /**
   * Check if patient has frequent appointment changes pattern
   * @param {string} patientId 
   * @returns {Promise<Object|null>} Alert if pattern detected
   */
  static async checkFrequentChangesPattern(patientId) {
    try {
      // Get logs from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentLogs = await prisma.appointmentLogs.findMany({
        where: {
          patientId,
          action: {
            in: ['rescheduled', 'cancelled', 'time_changed', 'date_changed']
          },
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      // If more than 3 changes in 30 days, create alert
      if (recentLogs.length > 3) {
        const alert = await prisma.patientAlerts.create({
          data: {
            patientId,
            type: 'frequent_appointment_changes',
            severity: 'medium',
            message: `Este paciente ha cambiado citas ${recentLogs.length} veces en los últimos 30 días`,
            metadata: JSON.stringify({
              changeCount: recentLogs.length,
              lastChange: recentLogs[0]?.createdAt
            }),
            isActive: true,
            createdAt: new Date()
          }
        });

        return alert;
      }

      return null;
    } catch (error) {
      console.error('Error checking frequent changes pattern:', error);
      return null;
    }
  }

  /**
   * Get appointment logs for a patient
   * @param {string} patientId 
   * @param {number} limit 
   * @returns {Promise<Array>} Appointment logs
   */
  static async getPatientAppointmentLogs(patientId, limit = 50) {
    try {
      const logs = await prisma.appointmentLogs.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return logs.map(log => ({
        ...log,
        previousData: log.previousData ? JSON.parse(log.previousData) : null,
        newData: log.newData ? JSON.parse(log.newData) : null
      }));
    } catch (error) {
      console.error('Error getting patient appointment logs:', error);
      throw error;
    }
  }

  /**
   * Get appointment change statistics for a patient
   * @param {string} patientId 
   * @returns {Promise<Object>} Statistics
   */
  static async getPatientAppointmentStats(patientId) {
    try {
      const logs = await prisma.appointmentLogs.findMany({
        where: { patientId }
      });

      const stats = {
        totalAppointments: logs.filter(log => log.action === 'created').length,
        totalChanges: logs.filter(log => ['rescheduled', 'time_changed', 'date_changed'].includes(log.action)).length,
        totalCancellations: logs.filter(log => log.action === 'cancelled').length,
        totalNoShows: logs.filter(log => log.action === 'no_show').length,
        averageChangesPerAppointment: 0
      };

      if (stats.totalAppointments > 0) {
        stats.averageChangesPerAppointment = stats.totalChanges / stats.totalAppointments;
      }

      return stats;
    } catch (error) {
      console.error('Error getting patient appointment stats:', error);
      throw error;
    }
  }
}

module.exports = AppointmentLogService;