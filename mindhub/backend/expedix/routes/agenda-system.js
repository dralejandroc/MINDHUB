const express = require('express');
const router = express.Router();
const { getDeadlineMonitor } = require('../services/deadlineMonitor');
const { getPaymentProcessor } = require('../services/paymentProcessor');
const { PrismaClient } = require('../../generated/prisma');
const AppointmentLogService = require('../services/AppointmentLogService');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

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
router.get('/appointments', async (req, res) => {
  try {
    const { date, status, patientId } = req.query;
    
    console.log('🔄 Loading appointments from database with filters:', { date, status, patientId });
    
    // Construir filtros para la consulta
    let whereClause = {};
    
    if (patientId) {
      whereClause.patientId = patientId;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    // Si se especifica fecha, filtrar por día específico
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.consultationDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    // Cargar citas reales desde la base de datos
    const consultations = await prisma.consultation.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            paternalLastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        consultationDate: 'asc'
      }
    });

    // Cargar configuración del usuario para obtener colores y duraciones
    let userConfig = null;
    try {
      const scheduleConfig = await prisma.scheduleConfiguration.findUnique({
        where: { userId: 'user-dr-alejandro' } // Por ahora usar usuario por defecto
      });
      if (scheduleConfig) {
        userConfig = scheduleConfig;
      }
    } catch (configError) {
      console.log('Could not load user config for colors:', configError.message);
    }

    // Transformar datos al formato esperado por el frontend
    const result = consultations.map(consultation => {
      // Crear fecha en zona horaria local
      const consultationDate = new Date(consultation.consultationDate);
      
      // Buscar el tipo de consulta en la configuración del usuario
      let typeColor = '#6B7280'; // Color por defecto (gris)
      let typeDuration = 60; // Duración por defecto
      
      const consultationReason = consultation.reason || '';
      
      // Buscar en la configuración real del usuario
      if (userConfig && userConfig.consultationTypes) {
        const consultationType = userConfig.consultationTypes.find(type => 
          type.name === consultationReason
        );
        if (consultationType) {
          // Convertir color de Tailwind a hex si es necesario
          const colorMapping = {
            'bg-blue-500': '#3B82F6',
            'bg-green-500': '#10B981',
            'bg-purple-500': '#8B5CF6',
            'bg-orange-500': '#F97316',
            'bg-red-500': '#EF4444',
            'bg-yellow-500': '#EAB308',
            'bg-pink-500': '#EC4899',
            'bg-indigo-500': '#6366F1',
            'bg-teal-500': '#14B8A6',
            'bg-cyan-500': '#06B6D4',
            'bg-gray-500': '#6B7280'
          };
          
          typeColor = colorMapping[consultationType.color] || consultationType.color || typeColor;
          typeDuration = consultationType.duration || typeDuration;
          
          console.log(`🎨 Found color for "${consultationReason}": ${typeColor} (${consultationType.color})`);
        } else {
          console.log(`⚠️ No color config found for consultation type: "${consultationReason}"`);
        }
      } else {
        console.log('⚠️ No user configuration loaded for consultation types');
      }
      
      return {
        id: consultation.id,
        patientId: consultation.patientId,
        date: consultationDate.toISOString().split('T')[0],
        time: consultationDate.toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        }),
        duration: typeDuration, // Usar duración real del tipo de consulta
        type: consultation.reason,
        status: consultation.status,
        notes: consultation.notes || '',
        typeColor: typeColor, // Agregar color del tipo de consulta
        createdAt: consultation.createdAt.toISOString(),
        patient: consultation.patient ? {
          id: consultation.patient.id,
          name: `${consultation.patient.firstName || ''} ${consultation.patient.lastName || consultation.patient.paternalLastName || ''}`.trim(),
          email: consultation.patient.email || '',
          phone: consultation.patient.phone || ''
        } : null
      };
    });

    console.log(`📊 Found ${result.length} appointments in database`);

    res.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (error) {
    console.error('❌ Error loading appointments from database:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo citas desde la base de datos',
      error: error.message
    });
  }
});

// Crear nueva cita
router.post('/appointments', async (req, res) => {
  try {
    const { patientId, date, time, duration, type, notes, createdBy, createdByName } = req.body;

    console.log('Received appointment data:', req.body);

    // Validar datos requeridos
    if (!patientId || !date || !time || !type) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: patientId, date, time, type'
      });
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Combinar fecha y hora para crear appointmentDate (horario local México)
    const appointmentDateTime = new Date(`${date}T${time}:00.000`);

    // Verificar disponibilidad (opcional)
    const existingAppointment = await prisma.consultation.findFirst({
      where: {
        consultationDate: appointmentDateTime,
        NOT: {
          status: 'cancelled'
        }
      }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cita en esa fecha y hora'
      });
    }

    // Crear la cita en la base de datos
    const appointmentId = uuidv4();
    const newAppointment = await prisma.consultation.create({
      data: {
        id: appointmentId,
        patientId: patientId,
        consultantId: createdBy || 'user-dr-alejandro',
        consultationDate: appointmentDateTime,
        reason: type,
        status: 'scheduled',
        notes: notes || ''
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            paternalLastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Log the appointment creation
    try {
      await AppointmentLogService.logAppointmentAction({
        appointmentId: appointmentId,
        patientId: patientId,
        userId: createdBy || 'user-dr-alejandro',
        userName: createdByName || 'Dr. Alejandro Contreras',
        action: 'created',
        previousData: null,
        newData: {
          date: date,
          time: time,
          type: type,
          status: 'scheduled',
          duration: duration || 60
        },
        reason: `Cita creada: ${type}`
      });
    } catch (logError) {
      console.error('Error logging appointment:', logError);
      // Don't fail the request if logging fails
    }

    // Return the created appointment with patient data
    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: {
        id: appointmentId,
        patientId: newAppointment.patientId,
        date: date,
        time: time,
        duration: duration || 60,
        type: type,
        status: 'scheduled',
        notes: notes || '',
        createdAt: new Date().toISOString(),
        patient: newAppointment.patient ? {
          id: newAppointment.patient.id,
          name: `${newAppointment.patient.firstName || ''} ${newAppointment.patient.lastName || newAppointment.patient.paternalLastName || ''}`.trim(),
          email: newAppointment.patient.email || '',
          phone: newAppointment.patient.phone || ''
        } : null
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
router.delete('/appointments/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Buscar la cita en la base de datos
    const appointment = await prisma.consultation.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            paternalLastName: true
          }
        }
      }
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Eliminar físicamente la cita para liberar el espacio
    const deletedAppointment = await prisma.consultation.delete({
      where: { id: appointmentId }
    });

    // Log the cancellation
    try {
      await AppointmentLogService.logAppointmentAction({
        appointmentId: appointmentId,
        patientId: appointment.patientId,
        userId: req.user?.id || 'user-dr-alejandro',
        userName: req.user?.name || 'Dr. Alejandro Contreras',
        action: 'cancelled',
        previousData: appointment,
        newData: { status: 'cancelled' },
        changes: { status: { from: appointment.status, to: 'cancelled' } }
      });
    } catch (logError) {
      console.error('Error logging appointment cancellation:', logError);
    }

    // Create available slot for waiting list processing
    const availableSlot = {
      date: appointment.consultationDate.toISOString().split('T')[0],
      time: appointment.consultationDate.toTimeString().slice(0, 5),
      duration: 60, // Default duration, could be calculated from consultation type
      reason: 'cancellation'
    };

    // Process waiting list automatically and get suggestions
    const waitingListSuggestions = await processWaitingListForSlot(availableSlot);

    res.json({
      success: true,
      message: 'Cita cancelada y espacio liberado exitosamente',
      data: { 
        id: appointmentId,
        status: 'cancelled',
        deletedAt: new Date(),
        originalData: appointment
      },
      waitingListSuggestions: waitingListSuggestions || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelando cita',
      error: error.message
    });
  }
});

// Cambiar estado de cita
router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;

    // Validar estado
    const validStatuses = ['scheduled', 'confirmed', 'confirmed-no-deposit', 'completed', 'cancelled', 'no-show', 'modified'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido',
        validStatuses
      });
    }

    // Buscar la cita en la base de datos
    const appointment = await prisma.consultation.findUnique({
      where: { id: appointmentId }
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Actualizar el estado
    const updatedAppointment = await prisma.consultation.update({
      where: { id: appointmentId },
      data: {
        status: status,
        updatedAt: new Date()
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            paternalLastName: true
          }
        }
      }
    });

    // Log the status change
    try {
      await AppointmentLogService.logAppointmentAction({
        appointmentId: appointmentId,
        patientId: appointment.patientId,
        userId: req.user?.id || 'user-dr-alejandro',
        userName: req.user?.name || 'Dr. Alejandro Contreras',
        action: 'status_changed',
        previousData: { status: appointment.status },
        newData: { status: status },
        changes: { status: { from: appointment.status, to: status } }
      });
    } catch (logError) {
      console.error('Error logging status change:', logError);
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error actualizando estado',
      error: error.message
    });
  }
});

// ==================== WAITING LIST ====================

// Obtener lista de espera
router.get('/waiting-list', async (req, res) => {
  try {
    const { priority, status } = req.query;
    
    // Construir filtros dinámicos
    const whereClause = {};
    
    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Obtener lista de espera con información del paciente
    const waitingListEntries = await prisma.waitingList.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            paternalLastName: true,
            phone: true,
            email: true,
            dateOfBirth: true
          }
        }
      },
      orderBy: [
        {
          // Ordenar por prioridad (alta > media > baja)
          priority: 'desc'
        },
        {
          // Luego por fecha de creación (más antiguos primero)
          createdAt: 'asc'
        }
      ]
    });

    // Procesar resultados para el frontend
    const result = waitingListEntries.map(entry => ({
      id: entry.id,
      patientId: entry.patientId,
      patientName: `${entry.patient.firstName} ${entry.patient.lastName} ${entry.patient.paternalLastName || ''}`.trim(),
      patientPhone: entry.patient.phone,
      patientEmail: entry.patient.email,
      patientAge: entry.patient.dateOfBirth ? Math.floor((new Date() - new Date(entry.patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
      appointmentType: entry.appointmentType,
      preferredDates: entry.preferredDates,
      preferredTimes: entry.preferredTimes,
      priority: entry.priority,
      notes: entry.notes,
      status: entry.status,
      contactAttempts: entry.contactAttempts,
      lastContactDate: entry.lastContactDate,
      waitingSince: Math.floor((new Date() - new Date(entry.createdAt)) / (1000 * 60 * 60 * 24)), // días esperando
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    }));

    res.json({
      success: true,
      data: result,
      total: result.length,
      filters: { priority, status }
    });
  } catch (error) {
    console.error('Error obteniendo lista de espera:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo lista de espera',
      error: error.message
    });
  }
});

// Agregar a lista de espera
router.post('/waiting-list', async (req, res) => {
  try {
    const { patientId, appointmentType, preferredDates, preferredTimes, priority, notes } = req.body;
    const currentUser = req.user || { id: 'user-dr-alejandro' };

    // Validar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        paternalLastName: true,
        phone: true,
        email: true
      }
    });

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Verificar si ya está en lista de espera
    const existingEntry = await prisma.waitingList.findFirst({
      where: {
        patientId: patientId,
        status: 'waiting'
      }
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'El paciente ya está en lista de espera'
      });
    }

    // Validar datos requeridos
    if (!appointmentType) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de consulta es requerido'
      });
    }

    // Crear nueva entrada en lista de espera
    const newEntry = await prisma.waitingList.create({
      data: {
        patientId: patientId,
        appointmentType: appointmentType,
        preferredDates: preferredDates || [],
        preferredTimes: preferredTimes || [],
        priority: priority || 'media',
        notes: notes || '',
        status: 'waiting',
        createdBy: currentUser.id
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            paternalLastName: true,
            phone: true,
            email: true
          }
        }
      }
    });

    console.log(`✅ Patient added to waiting list: ${patient.firstName} ${patient.lastName} (Priority: ${newEntry.priority})`);

    res.status(201).json({
      success: true,
      message: 'Paciente agregado a lista de espera exitosamente',
      data: {
        id: newEntry.id,
        patientId: newEntry.patientId,
        patientName: `${newEntry.patient.firstName} ${newEntry.patient.lastName} ${newEntry.patient.paternalLastName || ''}`.trim(),
        patientPhone: newEntry.patient.phone,
        patientEmail: newEntry.patient.email,
        appointmentType: newEntry.appointmentType,
        preferredDates: newEntry.preferredDates,
        preferredTimes: newEntry.preferredTimes,
        priority: newEntry.priority,
        notes: newEntry.notes,
        status: newEntry.status,
        contactAttempts: newEntry.contactAttempts,
        createdAt: newEntry.createdAt
      }
    });
  } catch (error) {
    console.error('Error agregando a lista de espera:', error);
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

async function processWaitingListForSlot(availableSlot) {
  try {
    console.log(`🔍 Processing waiting list for slot: ${availableSlot.date} ${availableSlot.time}`);
    
    // Buscar candidatos en lista de espera que coincidan con el slot disponible
    const candidates = await prisma.waitingList.findMany({
      where: {
        status: 'waiting',
        OR: [
          {
            // Buscar por fechas preferidas que incluyan esta fecha (usando JSON_CONTAINS para MySQL)
            preferredDates: {
              path: '$',
              array_contains: availableSlot.date
            }
          },
          {
            // O buscar aquellos que no tienen restricciones específicas de fecha (lista vacía)
            preferredDates: {
              equals: []
            }
          }
        ]
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            paternalLastName: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: [
        {
          // Ordenar por prioridad usando CASE para custom order
          priority: 'desc'
        },
        {
          // Luego por fecha de creación (primero en entrar, primero en salir)
          createdAt: 'asc'
        }
      ],
      take: 5 // Top 5 candidatos
    });

    if (candidates.length === 0) {
      console.log(`📭 No waiting list candidates found for slot ${availableSlot.date} ${availableSlot.time}`);
      return [];
    }

    // Procesar los candidatos y crear sugerencias estructuradas
    const suggestions = candidates.map(candidate => ({
      waitingListId: candidate.id,
      patientId: candidate.patientId,
      patientName: `${candidate.patient.firstName} ${candidate.patient.lastName} ${candidate.patient.paternalLastName || ''}`.trim(),
      patientPhone: candidate.patient.phone,
      patientEmail: candidate.patient.email,
      appointmentType: candidate.appointmentType,
      priority: candidate.priority,
      notes: candidate.notes,
      preferredDates: candidate.preferredDates,
      preferredTimes: candidate.preferredTimes,
      createdAt: candidate.createdAt,
      waitingSince: Math.floor((new Date() - new Date(candidate.createdAt)) / (1000 * 60 * 60 * 24)), // días esperando
      matchReason: `Slot disponible por ${availableSlot.reason} - ${availableSlot.date} ${availableSlot.time}`,
      availableSlot: availableSlot,
      contactAttempts: candidate.contactAttempts,
      lastContactDate: candidate.lastContactDate
    }));

    // Crear invitación automática para el primer candidato si existe
    if (suggestions.length > 0) {
      const topCandidate = suggestions[0];
      
      // Actualizar contador de intentos de contacto
      await prisma.waitingList.update({
        where: { id: topCandidate.waitingListId },
        data: {
          status: 'contacted',
          contactAttempts: { increment: 1 },
          lastContactDate: new Date()
        }
      });

      console.log(`🎯 Auto-suggested waiting list patient: ${topCandidate.patientName} (Priority: ${topCandidate.priority}) for slot ${availableSlot.date} ${availableSlot.time}`);
    }

    console.log(`✅ Found ${suggestions.length} waiting list suggestions for slot ${availableSlot.date} ${availableSlot.time}`);
    return suggestions;
    
  } catch (error) {
    console.error('❌ Error processing waiting list for slot:', error);
    return [];
  }
}

module.exports = router;