'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  UserIcon, 
  CurrencyDollarIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CalendarIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface WaitingListEntry {
  id: string;
  patient: Patient;
  appointmentType: string;
  priority: 'alta' | 'media' | 'baja';
}

interface AvailableSlot {
  date: string;
  time: string;
  duration: number;
  reason: 'cancellation' | 'gap' | 'extension';
}

interface AppointmentInvitation {
  id: string;
  waitingListEntry: WaitingListEntry;
  availableSlot: AvailableSlot;
  invitationSentDate: string;
  expirationDate: string;
  status: 'sent' | 'viewed' | 'accepted' | 'payment_pending' | 'confirmed' | 'expired' | 'declined';
  paymentRequired: number;
  paymentMethod?: 'card' | 'transfer' | 'cash';
  confirmationDeadline: string;
  viewedDate?: string;
  acceptedDate?: string;
  paymentDate?: string;
  declinedReason?: string;
}

interface InvitationManagerProps {
  onInvitationUpdate: (invitation: AppointmentInvitation) => void;
  onSlotAssigned: (slotId: string, patientId: string) => void;
}

export default function InvitationManager({ onInvitationUpdate, onSlotAssigned }: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<AppointmentInvitation[]>([]);
  const [filteredInvitations, setFilteredInvitations] = useState<AppointmentInvitation[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  // Datos de ejemplo
  useEffect(() => {
    const mockInvitations: AppointmentInvitation[] = [
      {
        id: 'inv_1',
        waitingListEntry: {
          id: 'w1',
          patient: {
            id: 'p7',
            name: 'Elena Ruiz Martín',
            phone: '+52 55 1111-2222',
            email: 'elena@email.com'
          },
          appointmentType: 'Consulta inicial',
          priority: 'alta'
        },
        availableSlot: {
          date: '2025-07-21',
          time: '10:30',
          duration: 60,
          reason: 'cancellation'
        },
        invitationSentDate: '2025-07-20T09:00:00Z',
        expirationDate: '2025-07-22T09:00:00Z',
        status: 'payment_pending',
        paymentRequired: 500,
        confirmationDeadline: '2025-07-21T09:00:00Z',
        viewedDate: '2025-07-20T09:15:00Z',
        acceptedDate: '2025-07-20T09:30:00Z'
      },
      {
        id: 'inv_2',
        waitingListEntry: {
          id: 'w2',
          patient: {
            id: 'p8',
            name: 'Miguel Torres Vega',
            phone: '+52 55 3333-4444',
            email: 'miguel@email.com'
          },
          appointmentType: 'Seguimiento',
          priority: 'media'
        },
        availableSlot: {
          date: '2025-07-21',
          time: '10:30',
          duration: 60,
          reason: 'cancellation'
        },
        invitationSentDate: '2025-07-20T09:00:00Z',
        expirationDate: '2025-07-22T09:00:00Z',
        status: 'viewed',
        paymentRequired: 500,
        confirmationDeadline: '2025-07-21T09:00:00Z',
        viewedDate: '2025-07-20T10:00:00Z'
      },
      {
        id: 'inv_3',
        waitingListEntry: {
          id: 'w3',
          patient: {
            id: 'p9',
            name: 'Carmen Jiménez Soto',
            phone: '+52 55 5555-6666',
            email: 'carmen@email.com'
          },
          appointmentType: 'Evaluación psicológica',
          priority: 'baja'
        },
        availableSlot: {
          date: '2025-07-21',
          time: '10:30',
          duration: 60,
          reason: 'cancellation'
        },
        invitationSentDate: '2025-07-20T09:00:00Z',
        expirationDate: '2025-07-22T09:00:00Z',
        status: 'sent',
        paymentRequired: 500,
        confirmationDeadline: '2025-07-21T09:00:00Z'
      },
      {
        id: 'inv_4',
        waitingListEntry: {
          id: 'w4',
          patient: {
            id: 'p10',
            name: 'David Morales Cruz',
            phone: '+52 55 7777-8888',
            email: 'david@email.com'
          },
          appointmentType: 'Terapia individual',
          priority: 'alta'
        },
        availableSlot: {
          date: '2025-07-22',
          time: '14:00',
          duration: 45,
          reason: 'cancellation'
        },
        invitationSentDate: '2025-07-19T15:00:00Z',
        expirationDate: '2025-07-21T15:00:00Z',
        status: 'expired',
        paymentRequired: 500,
        confirmationDeadline: '2025-07-20T15:00:00Z'
      }
    ];
    setInvitations(mockInvitations);
  }, []);

  // Filtrar invitaciones
  useEffect(() => {
    let filtered = invitations;

    // Filtro por estado
    switch (statusFilter) {
      case 'active':
        filtered = filtered.filter(inv => 
          ['sent', 'viewed', 'accepted', 'payment_pending'].includes(inv.status)
        );
        break;
      case 'pending_payment':
        filtered = filtered.filter(inv => inv.status === 'payment_pending');
        break;
      case 'confirmed':
        filtered = filtered.filter(inv => inv.status === 'confirmed');
        break;
      case 'expired':
        filtered = filtered.filter(inv => ['expired', 'declined'].includes(inv.status));
        break;
    }

    // Filtro por tiempo
    const now = new Date();
    switch (timeFilter) {
      case 'urgent':
        filtered = filtered.filter(inv => {
          const deadline = new Date(inv.confirmationDeadline);
          const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
          return hoursLeft <= 6 && hoursLeft > 0;
        });
        break;
      case 'today':
        filtered = filtered.filter(inv => {
          const deadline = new Date(inv.confirmationDeadline);
          return deadline.toDateString() === now.toDateString();
        });
        break;
    }

    // Ordenar por prioridad y deadline
    filtered.sort((a, b) => {
      // Primero por estado (payment_pending primero)
      if (a.status === 'payment_pending' && b.status !== 'payment_pending') return -1;
      if (b.status === 'payment_pending' && a.status !== 'payment_pending') return 1;

      // Luego por prioridad
      const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
      const priorityDiff = priorityOrder[b.waitingListEntry.priority] - priorityOrder[a.waitingListEntry.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Finalmente por deadline
      return new Date(a.confirmationDeadline).getTime() - new Date(b.confirmationDeadline).getTime();
    });

    setFilteredInvitations(filtered);
  }, [invitations, statusFilter, timeFilter]);

  const updateInvitationStatus = (invitationId: string, newStatus: AppointmentInvitation['status'], additionalData?: Partial<AppointmentInvitation>) => {
    setInvitations(prev =>
      prev.map(inv =>
        inv.id === invitationId 
          ? { 
              ...inv, 
              status: newStatus,
              ...additionalData,
              ...(newStatus === 'confirmed' ? { paymentDate: new Date().toISOString() } : {}),
              ...(newStatus === 'viewed' && !inv.viewedDate ? { viewedDate: new Date().toISOString() } : {}),
              ...(newStatus === 'accepted' && !inv.acceptedDate ? { acceptedDate: new Date().toISOString() } : {})
            } 
          : inv
      )
    );

    // Notificar actualización
    const updatedInv = invitations.find(inv => inv.id === invitationId);
    if (updatedInv) {
      onInvitationUpdate({ ...updatedInv, status: newStatus, ...additionalData });
    }

    // Si se confirma, asignar el slot
    if (newStatus === 'confirmed' && updatedInv) {
      onSlotAssigned(
        `${updatedInv.availableSlot.date}-${updatedInv.availableSlot.time}`,
        updatedInv.waitingListEntry.patient.id
      );
    }
  };

  const getStatusInfo = (invitation: AppointmentInvitation) => {
    const now = new Date();
    const deadline = new Date(invitation.confirmationDeadline);
    const expiration = new Date(invitation.expirationDate);
    const hoursToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    const hoursToExpiration = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60);

    switch (invitation.status) {
      case 'sent':
        return {
          color: { bg: 'var(--primary-100)', text: 'var(--primary-700)' },
          label: 'Enviada',
          urgent: hoursToDeadline <= 6,
          timeLeft: hoursToDeadline > 0 ? `${Math.ceil(hoursToDeadline)}h para deadline` : 'Deadline vencido'
        };
      case 'viewed':
        return {
          color: { bg: '#fef3c7', text: '#d97706' },
          label: 'Vista',
          urgent: hoursToDeadline <= 6,
          timeLeft: hoursToDeadline > 0 ? `${Math.ceil(hoursToDeadline)}h para deadline` : 'Deadline vencido'
        };
      case 'accepted':
        return {
          color: { bg: 'var(--secondary-100)', text: 'var(--secondary-700)' },
          label: 'Aceptada',
          urgent: hoursToDeadline <= 2,
          timeLeft: hoursToDeadline > 0 ? `${Math.ceil(hoursToDeadline)}h para pagar` : 'Deadline vencido'
        };
      case 'payment_pending':
        return {
          color: { bg: '#fef3c7', text: '#d97706' },
          label: 'Pago Pendiente',
          urgent: hoursToDeadline <= 2,
          timeLeft: hoursToDeadline > 0 ? `${Math.ceil(hoursToDeadline)}h para pagar` : 'Deadline vencido'
        };
      case 'confirmed':
        return {
          color: { bg: '#dcfce7', text: '#166534' },
          label: 'Confirmada',
          urgent: false,
          timeLeft: 'Confirmada'
        };
      case 'expired':
        return {
          color: { bg: 'var(--neutral-100)', text: 'var(--neutral-600)' },
          label: 'Expirada',
          urgent: false,
          timeLeft: 'Expirada'
        };
      case 'declined':
        return {
          color: { bg: 'var(--accent-100)', text: 'var(--accent-700)' },
          label: 'Rechazada',
          urgent: false,
          timeLeft: 'Rechazada'
        };
    }
  };

  const getPriorityColor = (priority: 'alta' | 'media' | 'baja') => {
    switch (priority) {
      case 'alta':
        return { bg: 'var(--accent-100)', text: 'var(--accent-700)', border: 'var(--accent-500)' };
      case 'media':
        return { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' };
      case 'baja':
        return { bg: 'var(--secondary-100)', text: 'var(--secondary-700)', border: 'var(--secondary-500)' };
    }
  };

  const handleResendNotification = (invitationId: string) => {
    // Simular reenvío de notificación
    alert('Notificación reenviada al paciente');
  };

  const handleManualConfirmation = (invitationId: string, paymentMethod: 'card' | 'transfer' | 'cash') => {
    updateInvitationStatus(invitationId, 'confirmed', { paymentMethod });
  };

  return (
    <div className="space-y-6">
      {/* Header y filtros */}
      <div 
        className="bg-white rounded-xl p-6 border"
        style={{ 
          border: '1px solid rgba(8, 145, 178, 0.1)',
          boxShadow: 'var(--shadow)'
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 
              className="text-xl font-bold mb-2"
              style={{ 
                color: 'var(--dark-green)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Gestión de Invitaciones
            </h2>
            <p 
              className="text-sm"
              style={{ color: 'var(--neutral-600)' }}
            >
              Seguimiento de invitaciones enviadas y confirmaciones pendientes
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm rounded-lg border-2 px-3 py-2 focus:outline-none"
              style={{ 
                border: '2px solid var(--neutral-200)',
                fontFamily: 'var(--font-primary)'
              }}
            >
              <option value="active">Activas</option>
              <option value="pending_payment">Pago Pendiente</option>
              <option value="confirmed">Confirmadas</option>
              <option value="expired">Expiradas/Rechazadas</option>
            </select>

            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="text-sm rounded-lg border-2 px-3 py-2 focus:outline-none"
              style={{ 
                border: '2px solid var(--neutral-200)',
                fontFamily: 'var(--font-primary)'
              }}
            >
              <option value="all">Todas</option>
              <option value="urgent">Urgentes (< 6h)</option>
              <option value="today">Deadline hoy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de invitaciones */}
      <div 
        className="bg-white rounded-xl border overflow-hidden"
        style={{ 
          border: '1px solid rgba(8, 145, 178, 0.1)',
          boxShadow: 'var(--shadow)'
        }}
      >
        {filteredInvitations.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--neutral-200)' }}>
            {filteredInvitations.map((invitation) => {
              const statusInfo = getStatusInfo(invitation);
              const priorityInfo = getPriorityColor(invitation.waitingListEntry.priority);

              return (
                <div key={invitation.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4" style={{ color: 'var(--primary-500)' }} />
                          <span 
                            className="font-medium"
                            style={{ color: 'var(--dark-green)' }}
                          >
                            {invitation.waitingListEntry.patient.name}
                          </span>
                        </div>
                        
                        <span 
                          className="text-xs px-2 py-1 rounded-full font-medium border"
                          style={{
                            backgroundColor: priorityInfo.bg,
                            color: priorityInfo.text,
                            borderColor: priorityInfo.border
                          }}
                        >
                          {invitation.waitingListEntry.priority.toUpperCase()}
                        </span>

                        <span 
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: statusInfo.color.bg,
                            color: statusInfo.color.text
                          }}
                        >
                          {statusInfo.label}
                        </span>

                        {statusInfo.urgent && (
                          <div className="flex items-center space-x-1">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600 font-medium">
                              URGENTE
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Información de la cita */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <CalendarIcon className="h-4 w-4" style={{ color: 'var(--neutral-500)' }} />
                            <span 
                              className="text-sm font-medium"
                              style={{ color: 'var(--dark-green)' }}
                            >
                              {new Date(invitation.availableSlot.date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })} - {invitation.availableSlot.time}
                            </span>
                          </div>
                          <div 
                            className="text-sm"
                            style={{ color: 'var(--neutral-600)' }}
                          >
                            {invitation.waitingListEntry.appointmentType}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <CurrencyDollarIcon className="h-4 w-4" style={{ color: 'var(--neutral-500)' }} />
                            <span 
                              className="text-sm font-medium"
                              style={{ color: 'var(--dark-green)' }}
                            >
                              Anticipo: ${invitation.paymentRequired}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <PhoneIcon className="h-4 w-4" style={{ color: 'var(--neutral-500)' }} />
                            <span 
                              className="text-sm"
                              style={{ color: 'var(--neutral-600)' }}
                            >
                              {invitation.waitingListEntry.patient.phone}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div 
                            className="text-xs font-medium mb-1"
                            style={{ color: 'var(--neutral-600)' }}
                          >
                            Timeline:
                          </div>
                          <div className="space-y-1 text-xs" style={{ color: 'var(--neutral-500)' }}>
                            <div>Enviada: {new Date(invitation.invitationSentDate).toLocaleString('es-ES')}</div>
                            {invitation.viewedDate && (
                              <div>Vista: {new Date(invitation.viewedDate).toLocaleString('es-ES')}</div>
                            )}
                            {invitation.acceptedDate && (
                              <div>Aceptada: {new Date(invitation.acceptedDate).toLocaleString('es-ES')}</div>
                            )}
                            {invitation.paymentDate && (
                              <div>Pagada: {new Date(invitation.paymentDate).toLocaleString('es-ES')}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Deadline */}
                      <div 
                        className={`text-sm p-2 rounded ${statusInfo.urgent ? 'bg-red-50 text-red-700' : 'bg-gray-50'}`}
                        style={{ color: statusInfo.urgent ? 'red' : 'var(--neutral-600)' }}
                      >
                        <ClockIcon className="h-4 w-4 inline mr-1" />
                        {statusInfo.timeLeft}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      {invitation.status === 'sent' && (
                        <div className="space-y-1">
                          <button
                            onClick={() => updateInvitationStatus(invitation.id, 'viewed')}
                            className="text-xs px-3 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                            style={{ 
                              background: 'var(--primary-100)',
                              color: 'var(--primary-700)'
                            }}
                          >
                            <EyeIcon className="h-3 w-3 inline mr-1" />
                            Marcar Vista
                          </button>
                          <button
                            onClick={() => handleResendNotification(invitation.id)}
                            className="text-xs px-3 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5 block"
                            style={{ 
                              background: 'var(--secondary-100)',
                              color: 'var(--secondary-700)'
                            }}
                          >
                            <BellIcon className="h-3 w-3 inline mr-1" />
                            Reenviar
                          </button>
                        </div>
                      )}

                      {invitation.status === 'viewed' && (
                        <button
                          onClick={() => updateInvitationStatus(invitation.id, 'accepted')}
                          className="text-xs px-3 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                          style={{ 
                            background: 'var(--secondary-100)',
                            color: 'var(--secondary-700)'
                          }}
                        >
                          <CheckCircleIcon className="h-3 w-3 inline mr-1" />
                          Marcar Aceptada
                        </button>
                      )}

                      {invitation.status === 'accepted' && (
                        <button
                          onClick={() => updateInvitationStatus(invitation.id, 'payment_pending')}
                          className="text-xs px-3 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                          style={{ 
                            background: '#fef3c7',
                            color: '#d97706'
                          }}
                        >
                          <CurrencyDollarIcon className="h-3 w-3 inline mr-1" />
                          Iniciar Pago
                        </button>
                      )}

                      {invitation.status === 'payment_pending' && (
                        <div className="space-y-1">
                          <button
                            onClick={() => handleManualConfirmation(invitation.id, 'transfer')}
                            className="text-xs px-3 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5 block"
                            style={{ 
                              background: '#dcfce7',
                              color: '#166534'
                            }}
                          >
                            <CheckCircleIcon className="h-3 w-3 inline mr-1" />
                            Confirmar Pago
                          </button>
                          <button
                            onClick={() => updateInvitationStatus(invitation.id, 'expired')}
                            className="text-xs px-3 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5 block"
                            style={{ 
                              background: 'var(--accent-100)',
                              color: 'var(--accent-700)'
                            }}
                          >
                            <XCircleIcon className="h-3 w-3 inline mr-1" />
                            Cancelar
                          </button>
                        </div>
                      )}

                      {['expired', 'declined'].includes(invitation.status) && (
                        <span 
                          className="text-xs px-3 py-1 rounded-lg"
                          style={{ 
                            background: 'var(--neutral-100)',
                            color: 'var(--neutral-600)'
                          }}
                        >
                          Finalizada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BellIcon 
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: 'var(--neutral-300)' }}
            />
            <h3 
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--neutral-600)' }}
            >
              No hay invitaciones
            </h3>
            <p 
              className="text-sm"
              style={{ color: 'var(--neutral-500)' }}
            >
              Las invitaciones aparecerán aquí cuando se envíen a pacientes en lista de espera
            </p>
          </div>
        )}
      </div>

      {/* Resumen */}
      {filteredInvitations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            className="bg-white rounded-xl p-4 border text-center"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: '#d97706' }}
            >
              {invitations.filter(i => i.status === 'payment_pending').length}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--neutral-600)' }}
            >
              Pago Pendiente
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 border text-center"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: '#166534' }}
            >
              {invitations.filter(i => i.status === 'confirmed').length}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--neutral-600)' }}
            >
              Confirmadas
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 border text-center"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: 'var(--accent-600)' }}
            >
              {invitations.filter(i => {
                const now = new Date();
                const deadline = new Date(i.confirmationDeadline);
                const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
                return hoursLeft <= 6 && hoursLeft > 0 && ['sent', 'viewed', 'accepted', 'payment_pending'].includes(i.status);
              }).length}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--neutral-600)' }}
            >
              Urgentes
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 border text-center"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: 'var(--neutral-600)' }}
            >
              {invitations.filter(i => ['expired', 'declined'].includes(i.status)).length}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--neutral-600)' }}
            >
              Expiradas
            </div>
          </div>
        </div>
      )}
    </div>
  );
}