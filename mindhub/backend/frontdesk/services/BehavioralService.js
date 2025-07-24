/**
 * Behavioral Tracking Service for FrontDesk
 * Handles behavioral events, communications, and appointment changes
 */

const { getPrismaClient, executeQuery } = require('../../shared/config/prisma');
const { v4: uuidv4 } = require('uuid');

class BehavioralService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Record a behavioral event for a patient
   */
  async recordBehavioralEvent(eventData) {
    const { appointmentId, eventType, description, delayMinutes, recordedBy } = eventData;
    
    // Get patient ID from appointment if provided
    let patientId = null;
    if (appointmentId) {
      const appointment = await executeQuery(
        (prisma) => prisma.consultation.findUnique({
          where: { id: appointmentId },
          select: { patientId: true }
        }),
        `getBehavioralEventAppointment(${appointmentId})`
      );
      patientId = appointment?.patientId;
    }

    if (!patientId && eventData.patientId) {
      patientId = eventData.patientId;
    }

    if (!patientId) {
      throw new Error('Patient ID is required for behavioral event');
    }

    const behavioralEvent = {
      id: uuidv4(),
      appointment_id: appointmentId,
      patient_id: patientId,
      event_type: eventType,
      description,
      delay_minutes: delayMinutes,
      recorded_by: recordedBy,
      recorded_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO appointment_behavioral_logs 
      (id, appointment_id, patient_id, event_type, description, delay_minutes, recorded_by, recorded_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      behavioralEvent.id,
      behavioralEvent.appointment_id,
      behavioralEvent.patient_id,
      behavioralEvent.event_type,
      behavioralEvent.description,
      behavioralEvent.delay_minutes,
      behavioralEvent.recorded_by,
      behavioralEvent.recorded_at,
      behavioralEvent.created_at,
      behavioralEvent.updated_at
    );

    return behavioralEvent;
  }

  /**
   * Get behavioral history for a patient
   */
  async getPatientBehavioralHistory(patientId, options = {}) {
    const { limit = 50 } = options;

    const behavioralLogs = await this.prisma.$executeRawUnsafe(`
      SELECT 
        id,
        appointment_id,
        patient_id,
        event_type,
        description,
        delay_minutes,
        recorded_by,
        recorded_at,
        created_at
      FROM appointment_behavioral_logs
      WHERE patient_id = ?
      ORDER BY recorded_at DESC
      LIMIT ?
    `, patientId, limit);

    const communications = await this.prisma.$executeRawUnsafe(`
      SELECT 
        id,
        patient_id,
        communication_type,
        direction,
        content,
        duration,
        recorded_by,
        communication_date,
        created_at
      FROM patient_communications
      WHERE patient_id = ?
      ORDER BY communication_date DESC
      LIMIT ?
    `, patientId, limit);

    const appointmentChanges = await this.prisma.$executeRawUnsafe(`
      SELECT 
        id,
        original_appointment_id,
        patient_id,
        change_type,
        reason,
        advance_notice_hours,
        requested_new_date,
        recorded_by,
        change_date,
        created_at
      FROM appointment_changes
      WHERE patient_id = ?
      ORDER BY change_date DESC
      LIMIT ?
    `, patientId, limit);

    return {
      behavioralLogs: behavioralLogs || [],
      communications: communications || [],
      appointmentChanges: appointmentChanges || []
    };
  }

  /**
   * Log a communication event
   */
  async logCommunication(communicationData) {
    const { patientId, communicationType, direction, content, duration, recordedBy } = communicationData;

    const communication = {
      id: uuidv4(),
      patient_id: patientId,
      communication_type: communicationType,
      direction,
      content,
      duration,
      recorded_by: recordedBy,
      communication_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO patient_communications 
      (id, patient_id, communication_type, direction, content, duration, recorded_by, communication_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      communication.id,
      communication.patient_id,
      communication.communication_type,
      communication.direction,
      communication.content,
      communication.duration,
      communication.recorded_by,
      communication.communication_date,
      communication.created_at,
      communication.updated_at
    );

    return communication;
  }

  /**
   * Record appointment change (reschedule/cancellation)
   */
  async recordAppointmentChange(changeData) {
    const { originalAppointmentId, patientId, changeType, reason, advanceNoticeHours, requestedNewDate, recordedBy } = changeData;

    const appointmentChange = {
      id: uuidv4(),
      original_appointment_id: originalAppointmentId,
      patient_id: patientId,
      change_type: changeType,
      reason,
      advance_notice_hours: advanceNoticeHours,
      requested_new_date: requestedNewDate,
      recorded_by: recordedBy,
      change_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO appointment_changes 
      (id, original_appointment_id, patient_id, change_type, reason, advance_notice_hours, requested_new_date, recorded_by, change_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      appointmentChange.id,
      appointmentChange.original_appointment_id,
      appointmentChange.patient_id,
      appointmentChange.change_type,
      appointmentChange.reason,
      appointmentChange.advance_notice_hours,
      appointmentChange.requested_new_date,
      appointmentChange.recorded_by,
      appointmentChange.change_date,
      appointmentChange.created_at,
      appointmentChange.updated_at
    );

    return appointmentChange;
  }

  /**
   * Get behavioral summary for a patient
   */
  async getPatientBehavioralSummary(patientId) {
    const summary = await this.prisma.$executeRawUnsafe(`
      SELECT 
        -- Behavioral events
        COUNT(CASE WHEN abl.event_type = 'late_arrival' THEN 1 END) as total_late_arrivals,
        AVG(CASE WHEN abl.event_type = 'late_arrival' THEN abl.delay_minutes END) as avg_delay_minutes,
        COUNT(CASE WHEN abl.event_type = 'no_show' THEN 1 END) as total_no_shows,
        COUNT(CASE WHEN abl.event_type = 'early_arrival' THEN 1 END) as total_early_arrivals,
        
        -- Communications
        COUNT(pc.id) as total_communications,
        COUNT(CASE WHEN pc.direction = 'incoming' THEN 1 END) as incoming_communications,
        COUNT(CASE WHEN pc.direction = 'outgoing' THEN 1 END) as outgoing_communications,
        
        -- Appointment changes
        COUNT(ac.id) as total_appointment_changes,
        COUNT(CASE WHEN ac.change_type = 'reschedule' THEN 1 END) as total_reschedules,
        COUNT(CASE WHEN ac.change_type = 'cancellation' THEN 1 END) as total_cancellations,
        AVG(ac.advance_notice_hours) as avg_advance_notice_hours
        
      FROM patients p
      LEFT JOIN appointment_behavioral_logs abl ON p.id = abl.patient_id
      LEFT JOIN patient_communications pc ON p.id = pc.patient_id
      LEFT JOIN appointment_changes ac ON p.id = ac.patient_id
      WHERE p.id = ?
      GROUP BY p.id
    `, patientId);

    return summary[0] || {};
  }
}

module.exports = BehavioralService;