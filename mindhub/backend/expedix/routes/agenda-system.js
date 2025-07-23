const express = require('express');
const router = express.Router();
const { getDeadlineMonitor } = require('../services/deadlineMonitor');
const { getPaymentProcessor } = require('../services/paymentProcessor');

// Simulación de base de datos en memoria (reemplazar con DB real)
let appointments = new Map();
let waitingList = new Map();
let invitations = new Map();
let patients = new Map();

// Datos de ejemplo
const initSampleData = () => {
  // Pacientes de ejemplo
  const samplePatients = [
    { id: 'p1', name: 'María González Pérez', phone: '+52 55 1234-5678', email: 'maria@email.com' },
    { id: 'p2', name: 'Carlos Rodríguez Silva', phone: '+52 55 9876-5432', email: 'carlos@email.com' },
    { id: 'p3', name: 'Ana Martínez López', phone: '+52 55 5555-0123', email: 'ana@email.com' },
    { id: 'p4', name: 'Pedro López García', phone: '+52 55 7777-8888', email: 'pedro@email.com' },
    { id: 'p5', name: 'Sofía García Morales', phone: '+52 55 3333-4444', email: 'sofia@email.com' }
  ];

  samplePatients.forEach(patient => patients.set(patient.id, patient));

  // Citas de ejemplo
  const sampleAppointments = [
    {
      id: 'apt_1',
      patientId: 'p1',
      date: '2025-07-21',
      time: '09:00',
      duration: 60,
      type: 'Consulta inicial',
      status: 'confirmed',
      notes: 'Primera consulta',
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt_2',
      patientId: 'p2',
      date: '2025-07-21',
      time: '11:00',
      duration: 45,
      type: 'Seguimiento',
      status: 'confirmed',
      notes: '',
      createdAt: new Date().toISOString()
    }
  ];

  sampleAppointments.forEach(apt => appointments.set(apt.id, apt));

  // Lista de espera de ejemplo
  const sampleWaitingList = [
    {
      id: 'w1',
      patientId: 'p3',
      appointmentType: 'Consulta inicial',
      preferredDates: ['2025-07-21', '2025-07-22', '2025-07-23'],
      preferredTimes: ['09:00', '10:00', '11:00'],
      priority: 'alta',
      notes: 'Paciente con síntomas de ansiedad severa',
      addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'waiting'
    },
    {
      id: 'w2',
      patientId: 'p4',
      appointmentType: 'Seguimiento',
      preferredDates: ['2025-07-21', '2025-07-24'],
      preferredTimes: ['14:00', '15:00', '16:00'],
      priority: 'media',
      notes: 'Control post-terapia',
      addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'waiting'
    }
  ];

  sampleWaitingList.forEach(entry => waitingList.set(entry.id, entry));
};

initSampleData();

// ==================== APPOINTMENTS ====================

// Obtener todas las citas
router.get('/appointments', (req, res) => {
  try {
    const { date, status, patientId } = req.query;
    let result = Array.from(appointments.values());

    // Agregar información del paciente
    result = result.map(appointment => ({
      ...appointment,
      patient: patients.get(appointment.patientId)
    }));

    // Filtros
    if (date) {
      result = result.filter(apt => apt.date === date);
    }
    if (status) {
      result = result.filter(apt => apt.status === status);
    }
    if (patientId) {
      result = result.filter(apt => apt.patientId === patientId);
    }

    // Ordenar por fecha y hora
    result.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });

    res.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo citas',
      error: error.message
    });
  }
});

// Crear nueva cita
router.post('/appointments', (req, res) => {
  try {
    const { patientId, date, time, duration, type, notes } = req.body;

    // Validar paciente existe
    if (!patients.has(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Verificar disponibilidad
    const conflictingAppointment = Array.from(appointments.values()).find(apt => 
      apt.date === date && apt.time === time && apt.status !== 'cancelled'
    );

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cita en esa fecha y hora'
      });
    }

    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAppointment = {
      id: appointmentId,
      patientId,
      date,
      time,
      duration: duration || 60,
      type,
      status: 'confirmed',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    appointments.set(appointmentId, newAppointment);

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: {
        ...newAppointment,
        patient: patients.get(patientId)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando cita',
      error: error.message
    });
  }
});

// Actualizar cita
router.put('/appointments/:id', (req, res) => {
  try {
    const appointmentId = req.params.id;
    const updates = req.body;

    if (!appointments.has(appointmentId)) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const appointment = appointments.get(appointmentId);
    const updatedAppointment = { ...appointment, ...updates, updatedAt: new Date().toISOString() };
    appointments.set(appointmentId, updatedAppointment);

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      data: {
        ...updatedAppointment,
        patient: patients.get(updatedAppointment.patientId)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error actualizando cita',
      error: error.message
    });
  }
});

// Cancelar cita
router.delete('/appointments/:id', (req, res) => {
  try {
    const appointmentId = req.params.id;

    if (!appointments.has(appointmentId)) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const appointment = appointments.get(appointmentId);
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date().toISOString();
    appointments.set(appointmentId, appointment);

    // Crear slot disponible para lista de espera
    const availableSlot = {
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      reason: 'cancellation'
    };

    // Procesar lista de espera automáticamente
    processWaitingListForSlot(availableSlot);

    res.json({
      success: true,
      message: 'Cita cancelada exitosamente',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelando cita',
      error: error.message
    });
  }
});

// ==================== WAITING LIST ====================

// Obtener lista de espera
router.get('/waiting-list', (req, res) => {
  try {
    const { priority, status } = req.query;
    let result = Array.from(waitingList.values());

    // Agregar información del paciente
    result = result.map(entry => ({
      ...entry,
      patient: patients.get(entry.patientId)
    }));

    // Filtros
    if (priority && priority !== 'all') {
      result = result.filter(entry => entry.priority === priority);
    }
    if (status && status !== 'all') {
      result = result.filter(entry => entry.status === status);
    }

    // Ordenar por prioridad y fecha
    result.sort((a, b) => {
      const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
    });

    res.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo lista de espera',
      error: error.message
    });
  }
});

// Agregar a lista de espera
router.post('/waiting-list', (req, res) => {
  try {
    const { patientId, appointmentType, preferredDates, preferredTimes, priority, notes } = req.body;

    // Validar paciente existe
    if (!patients.has(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Verificar si ya está en lista de espera
    const existingEntry = Array.from(waitingList.values()).find(entry => 
      entry.patientId === patientId && entry.status === 'waiting'
    );

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'El paciente ya está en lista de espera'
      });
    }

    const entryId = `w_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newEntry = {
      id: entryId,
      patientId,
      appointmentType,
      preferredDates,
      preferredTimes,
      priority: priority || 'media',
      notes: notes || '',
      addedDate: new Date().toISOString(),
      status: 'waiting'
    };

    waitingList.set(entryId, newEntry);

    res.status(201).json({
      success: true,
      message: 'Paciente agregado a lista de espera',
      data: {
        ...newEntry,
        patient: patients.get(patientId)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error agregando a lista de espera',
      error: error.message
    });
  }
});

// Actualizar entrada en lista de espera
router.put('/waiting-list/:id', (req, res) => {
  try {
    const entryId = req.params.id;
    const updates = req.body;

    if (!waitingList.has(entryId)) {
      return res.status(404).json({
        success: false,
        message: 'Entrada en lista de espera no encontrada'
      });
    }

    const entry = waitingList.get(entryId);
    const updatedEntry = { ...entry, ...updates, updatedAt: new Date().toISOString() };
    waitingList.set(entryId, updatedEntry);

    res.json({
      success: true,
      message: 'Lista de espera actualizada',
      data: {
        ...updatedEntry,
        patient: patients.get(updatedEntry.patientId)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error actualizando lista de espera',
      error: error.message
    });
  }
});

// Remover de lista de espera
router.delete('/waiting-list/:id', (req, res) => {
  try {
    const entryId = req.params.id;

    if (!waitingList.has(entryId)) {
      return res.status(404).json({
        success: false,
        message: 'Entrada no encontrada'
      });
    }

    const entry = waitingList.get(entryId);
    waitingList.delete(entryId);

    res.json({
      success: true,
      message: 'Entrada removida de lista de espera',
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removiendo de lista de espera',
      error: error.message
    });
  }
});

// ==================== INVITATIONS ====================

// Enviar invitaciones
router.post('/invitations/send', (req, res) => {
  try {
    const { availableSlot, selectedEntries, paymentAmount, confirmationHours } = req.body;

    const newInvitations = [];
    const monitor = getDeadlineMonitor();

    selectedEntries.forEach(entryId => {
      const waitingEntry = waitingList.get(entryId);
      if (!waitingEntry) return;

      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const expirationDate = new Date(now.getTime() + confirmationHours * 60 * 60 * 1000);
      const confirmationDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const invitation = {
        id: invitationId,
        waitingListEntry: {
          ...waitingEntry,
          patient: patients.get(waitingEntry.patientId)
        },
        availableSlot,
        invitationSentDate: now.toISOString(),
        expirationDate: expirationDate.toISOString(),
        status: 'sent',
        paymentRequired: paymentAmount,
        confirmationDeadline: confirmationDeadline.toISOString()
      };

      invitations.set(invitationId, invitation);
      newInvitations.push(invitation);

      // Agregar al monitoreo de deadlines
      monitor.addInvitation(invitation);

      // Actualizar estado en lista de espera
      waitingEntry.status = 'contacted';
      waitingList.set(entryId, waitingEntry);
    });

    res.status(201).json({
      success: true,
      message: `${newInvitations.length} invitaciones enviadas exitosamente`,
      data: newInvitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error enviando invitaciones',
      error: error.message
    });
  }
});

// Obtener invitaciones
router.get('/invitations', (req, res) => {
  try {
    const { status, timeFilter } = req.query;
    let result = Array.from(invitations.values());

    // Filtros
    if (status && status !== 'all') {
      if (status === 'active') {
        result = result.filter(inv => ['sent', 'viewed', 'accepted', 'payment_pending'].includes(inv.status));
      } else if (status === 'expired') {
        result = result.filter(inv => ['expired', 'declined'].includes(inv.status));
      } else {
        result = result.filter(inv => inv.status === status);
      }
    }

    if (timeFilter && timeFilter !== 'all') {
      const now = new Date();
      if (timeFilter === 'urgent') {
        result = result.filter(inv => {
          const deadline = new Date(inv.confirmationDeadline);
          const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
          return hoursLeft <= 6 && hoursLeft > 0;
        });
      } else if (timeFilter === 'today') {
        result = result.filter(inv => {
          const deadline = new Date(inv.confirmationDeadline);
          return deadline.toDateString() === now.toDateString();
        });
      }
    }

    // Ordenar por prioridad y deadline
    result.sort((a, b) => {
      if (a.status === 'payment_pending' && b.status !== 'payment_pending') return -1;
      if (b.status === 'payment_pending' && a.status !== 'payment_pending') return 1;

      const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
      const priorityDiff = priorityOrder[b.waitingListEntry.priority] - priorityOrder[a.waitingListEntry.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return new Date(a.confirmationDeadline).getTime() - new Date(b.confirmationDeadline).getTime();
    });

    res.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo invitaciones',
      error: error.message
    });
  }
});

// Actualizar estado de invitación
router.put('/invitations/:id/status', (req, res) => {
  try {
    const invitationId = req.params.id;
    const { status, paymentMethod } = req.body;

    if (!invitations.has(invitationId)) {
      return res.status(404).json({
        success: false,
        message: 'Invitación no encontrada'
      });
    }

    const invitation = invitations.get(invitationId);
    invitation.status = status;

    // Agregar información adicional según el estado
    if (status === 'viewed' && !invitation.viewedDate) {
      invitation.viewedDate = new Date().toISOString();
    }
    if (status === 'accepted' && !invitation.acceptedDate) {
      invitation.acceptedDate = new Date().toISOString();
    }
    if (status === 'confirmed') {
      invitation.paymentDate = new Date().toISOString();
      if (paymentMethod) {
        invitation.paymentMethod = paymentMethod;
      }

      // Crear la cita confirmada
      const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newAppointment = {
        id: appointmentId,
        patientId: invitation.waitingListEntry.patientId,
        date: invitation.availableSlot.date,
        time: invitation.availableSlot.time,
        duration: invitation.availableSlot.duration,
        type: invitation.waitingListEntry.appointmentType,
        status: 'confirmed',
        notes: `Agendada desde lista de espera - Invitación ${invitationId}`,
        createdAt: new Date().toISOString(),
        fromWaitingList: true,
        paymentConfirmed: true,
        paymentAmount: invitation.paymentRequired
      };

      appointments.set(appointmentId, newAppointment);

      // Actualizar lista de espera
      const waitingEntry = waitingList.get(invitation.waitingListEntry.id);
      if (waitingEntry) {
        waitingEntry.status = 'scheduled';
        waitingList.set(invitation.waitingListEntry.id, waitingEntry);
      }
    }

    invitations.set(invitationId, invitation);

    // Actualizar en el monitor de deadlines
    const monitor = getDeadlineMonitor();
    monitor.updateInvitationStatus(invitationId, status);

    res.json({
      success: true,
      message: 'Estado de invitación actualizado',
      data: invitation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error actualizando invitación',
      error: error.message
    });
  }
});

// ==================== AVAILABLE SLOTS ====================

// Obtener espacios disponibles
router.get('/available-slots', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Generar slots disponibles basados en horarios de trabajo
    const availableSlots = generateAvailableSlots(start, end);

    res.json({
      success: true,
      data: availableSlots,
      total: availableSlots.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo espacios disponibles',
      error: error.message
    });
  }
});

// ==================== PATIENTS ====================

// Obtener pacientes
router.get('/patients', (req, res) => {
  try {
    const { search } = req.query;
    let result = Array.from(patients.values());

    if (search) {
      const searchTerm = search.toLowerCase();
      result = result.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm) ||
        patient.phone.includes(search) ||
        patient.email.toLowerCase().includes(searchTerm)
      );
    }

    result.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pacientes',
      error: error.message
    });
  }
});

// ==================== PAYMENTS ====================

// Crear intent de pago
router.post('/payments/create-intent', async (req, res) => {
  try {
    const { invitationId, amount, patientId, description } = req.body;
    const processor = getPaymentProcessor();
    
    const result = await processor.createPaymentIntent({
      invitationId,
      amount,
      patientId,
      description
    });
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando intent de pago',
      error: error.message
    });
  }
});

// Confirmar pago manual
router.post('/payments/:paymentId/confirm', async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const { method, reference, notes, confirmedBy } = req.body;
    const processor = getPaymentProcessor();
    
    const result = await processor.confirmManualPayment(paymentId, {
      method,
      reference,
      notes,
      confirmedBy
    });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error confirmando pago',
      error: error.message
    });
  }
});

// Procesar pago con tarjeta
router.post('/payments/:paymentId/process-card', async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const cardData = req.body;
    const processor = getPaymentProcessor();
    
    const result = await processor.processCardPayment(paymentId, cardData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error procesando pago con tarjeta',
      error: error.message
    });
  }
});

// Obtener estado de pago
router.get('/payments/:paymentId', async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const processor = getPaymentProcessor();
    
    const result = await processor.getPaymentStatus(paymentId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado de pago',
      error: error.message
    });
  }
});

// Cancelar pago
router.delete('/payments/:paymentId', async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const { reason } = req.body;
    const processor = getPaymentProcessor();
    
    const result = await processor.cancelPayment(paymentId, reason);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelando pago',
      error: error.message
    });
  }
});

// Historial de pagos por paciente
router.get('/payments/patient/:patientId/history', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const processor = getPaymentProcessor();
    
    const result = await processor.getPatientPaymentHistory(patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de pagos',
      error: error.message
    });
  }
});

// Estadísticas de pagos
router.get('/payments/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const processor = getPaymentProcessor();
    
    const result = await processor.getPaymentStats(startDate, endDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas de pagos',
      error: error.message
    });
  }
});

// Reembolsar pago
router.post('/payments/:paymentId/refund', async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const { amount, reason } = req.body;
    const processor = getPaymentProcessor();
    
    const result = await processor.refundPayment(paymentId, amount, reason);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error procesando reembolso',
      error: error.message
    });
  }
});

// ==================== DEADLINE MONITOR ====================

// Estado del monitor
router.get('/monitor/status', (req, res) => {
  try {
    const monitor = getDeadlineMonitor();
    const monitoredInvitations = monitor.getMonitoredInvitations();

    res.json({
      success: true,
      data: {
        isRunning: monitor.isRunning,
        monitoredInvitations: monitoredInvitations.length,
        invitations: monitoredInvitations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado del monitor',
      error: error.message
    });
  }
});

// Probar recordatorio
router.post('/monitor/test-reminder/:invitationId', async (req, res) => {
  try {
    const invitationId = req.params.invitationId;
    const monitor = getDeadlineMonitor();
    
    const result = await monitor.testReminder(invitationId);
    
    if (result) {
      res.json({
        success: true,
        message: 'Recordatorio de prueba enviado'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Invitación no encontrada en el monitor'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error enviando recordatorio de prueba',
      error: error.message
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

function generateAvailableSlots(startDate, endDate) {
  const slots = [];
  const workingHours = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Saltear fines de semana (opcional)
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    
    workingHours.forEach(time => {
      // Verificar si ya hay cita en este horario
      const hasAppointment = Array.from(appointments.values()).some(apt => 
        apt.date === dateStr && apt.time === time && apt.status !== 'cancelled'
      );
      
      if (!hasAppointment) {
        slots.push({
          date: dateStr,
          time,
          duration: 60,
          reason: 'available'
        });
      }
    });
  }
  
  return slots;
}

function processWaitingListForSlot(availableSlot) {
  // Buscar candidatos en lista de espera que coincidan con el slot
  const candidates = Array.from(waitingList.values())
    .filter(entry => 
      entry.status === 'waiting' &&
      entry.preferredDates.includes(availableSlot.date) &&
      entry.preferredTimes.includes(availableSlot.time)
    )
    .sort((a, b) => {
      const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
    });

  if (candidates.length > 0) {
    // Crear invitación automática para el primer candidato
    const topCandidate = candidates[0];
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expirationDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const confirmationDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const invitation = {
      id: invitationId,
      waitingListEntry: {
        ...topCandidate,
        patient: patients.get(topCandidate.patientId)
      },
      availableSlot,
      invitationSentDate: now.toISOString(),
      expirationDate: expirationDate.toISOString(),
      status: 'sent',
      paymentRequired: 500, // Monto por defecto
      confirmationDeadline: confirmationDeadline.toISOString()
    };

    invitations.set(invitationId, invitation);

    // Agregar al monitoreo
    const monitor = getDeadlineMonitor();
    monitor.addInvitation(invitation);

    // Actualizar estado en lista de espera
    topCandidate.status = 'contacted';
    waitingList.set(topCandidate.id, topCandidate);

    console.log(`🎯 Invitación automática creada para ${topCandidate.patientId} - Slot: ${availableSlot.date} ${availableSlot.time}`);
  }
}

module.exports = router;