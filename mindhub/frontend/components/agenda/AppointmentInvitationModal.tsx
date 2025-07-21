'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  CurrencyDollarIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon
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
  notes?: string;
  addedDate: string;
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
}

interface AppointmentInvitationModalProps {
  entries: WaitingListEntry[];
  availableSlot: AvailableSlot;
  onClose: () => void;
  onSendInvitations: (invitations: AppointmentInvitation[]) => void;
}

export default function AppointmentInvitationModal({ 
  entries, 
  availableSlot, 
  onClose, 
  onSendInvitations 
}: AppointmentInvitationModalProps) {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState(500);
  const [confirmationHours, setConfirmationHours] = useState(48);
  const [notificationMethods, setNotificationMethods] = useState({
    sms: true,
    email: true,
    whatsapp: true
  });

  // Auto-seleccionar entradas que coincidan con el slot
  useEffect(() => {
    const matchingEntries = entries.filter(entry => {
      // Verificar si el paciente tiene preferencias que coincidan
      return entry.priority === 'alta' || entry.priority === 'media';
    });
    
    // Seleccionar automáticamente hasta 3 entradas por prioridad
    const autoSelected = matchingEntries
      .sort((a, b) => {
        const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
      })
      .slice(0, 3)
      .map(entry => entry.id);

    setSelectedEntries(autoSelected);
  }, [entries]);

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const generateInvitations = (): AppointmentInvitation[] => {
    const now = new Date();
    const expirationDate = new Date(now.getTime() + confirmationHours * 60 * 60 * 1000);
    const confirmationDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas para confirmar

    return selectedEntries.map(entryId => {
      const entry = entries.find(e => e.id === entryId)!;
      return {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        waitingListEntry: entry,
        availableSlot,
        invitationSentDate: now.toISOString(),
        expirationDate: expirationDate.toISOString(),
        status: 'sent',
        paymentRequired: paymentAmount,
        confirmationDeadline: confirmationDeadline.toISOString()
      };
    });
  };

  const handleSendInvitations = () => {
    if (selectedEntries.length === 0) return;
    
    const invitations = generateInvitations();
    onSendInvitations(invitations);
  };

  const getPriorityColor = (priority: WaitingListEntry['priority']) => {
    switch (priority) {
      case 'alta':
        return {
          bg: 'var(--accent-100)',
          text: 'var(--accent-700)',
          border: 'var(--accent-500)'
        };
      case 'media':
        return {
          bg: '#fef3c7',
          text: '#d97706',
          border: '#f59e0b'
        };
      case 'baja':
        return {
          bg: 'var(--secondary-100)',
          text: 'var(--secondary-700)',
          border: 'var(--secondary-500)'
        };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--neutral-200)' }}
        >
          <div>
            <h2 
              className="text-xl font-bold"
              style={{ 
                color: 'var(--dark-green)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Enviar Invitaciones de Cita
            </h2>
            <p 
              className="text-sm mt-1"
              style={{ color: 'var(--neutral-600)' }}
            >
              Espacio disponible: {new Date(availableSlot.date).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })} a las {availableSlot.time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" style={{ color: 'var(--neutral-500)' }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Configuración de invitación */}
          <div 
            className="bg-gray-50 rounded-lg p-4 border"
            style={{ borderColor: 'var(--neutral-200)' }}
          >
            <h3 
              className="font-medium text-sm mb-4"
              style={{ color: 'var(--dark-green)' }}
            >
              Configuración de Invitación
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  Anticipo requerido
                </label>
                <div className="relative">
                  <CurrencyDollarIcon 
                    className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: 'var(--neutral-500)' }}
                  />
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none"
                    style={{ 
                      border: '1px solid var(--neutral-300)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    min="0"
                    step="50"
                  />
                </div>
              </div>

              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  Tiempo para responder
                </label>
                <select
                  value={confirmationHours}
                  onChange={(e) => setConfirmationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                  style={{ 
                    border: '1px solid var(--neutral-300)',
                    fontFamily: 'var(--font-primary)'
                  }}
                >
                  <option value={24}>24 horas</option>
                  <option value={48}>48 horas</option>
                  <option value={72}>72 horas</option>
                </select>
              </div>

              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  Métodos de notificación
                </label>
                <div className="space-y-1">
                  {[
                    { key: 'sms', label: 'SMS', icon: PhoneIcon },
                    { key: 'email', label: 'Email', icon: EnvelopeIcon },
                    { key: 'whatsapp', label: 'WhatsApp', icon: BellIcon }
                  ].map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={notificationMethods[key as keyof typeof notificationMethods]}
                        onChange={(e) => setNotificationMethods(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <Icon className="h-3 w-3" style={{ color: 'var(--neutral-500)' }} />
                      <span 
                        className="text-xs"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Advertencia sobre el proceso */}
          <div 
            className="p-4 rounded-lg border flex items-start space-x-3"
            style={{ 
              backgroundColor: 'var(--primary-50)',
              border: '1px solid var(--primary-200)'
            }}
          >
            <ExclamationTriangleIcon 
              className="h-5 w-5 mt-0.5"
              style={{ color: 'var(--primary-600)' }}
            />
            <div>
              <div 
                className="font-medium text-sm"
                style={{ color: 'var(--primary-700)' }}
              >
                Proceso de Confirmación con Anticipo
              </div>
              <div 
                className="text-sm mt-1"
                style={{ color: 'var(--primary-600)' }}
              >
                • Los pacientes tendrán {confirmationHours} horas para ver la invitación<br/>
                • Deben confirmar y pagar anticipo de ${paymentAmount} en 24 horas<br/>
                • Si no confirman en 24h, la cita se cancela automáticamente<br/>
                • El siguiente paciente en lista será notificado inmediatamente
              </div>
            </div>
          </div>

          {/* Lista de pacientes */}
          <div>
            <h3 
              className="font-medium text-sm mb-4"
              style={{ color: 'var(--dark-green)' }}
            >
              Seleccionar Pacientes para Invitar ({selectedEntries.length} seleccionados)
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {entries.map((entry) => {
                const isSelected = selectedEntries.includes(entry.id);
                const priorityInfo = getPriorityColor(entry.priority);
                const daysSinceAdded = Math.ceil(
                  (new Date().getTime() - new Date(entry.addedDate).getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={entry.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 transform scale-[1.02]' : 'hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--primary-50)' : 'white',
                      borderColor: isSelected ? 'var(--primary-500)' : 'var(--neutral-200)',
                      ringColor: isSelected ? 'var(--primary-500)' : undefined
                    }}
                    onClick={() => toggleEntrySelection(entry.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleEntrySelection(entry.id)}
                              className="rounded"
                              style={{ accentColor: 'var(--primary-500)' }}
                            />
                            <span 
                              className="font-medium"
                              style={{ color: 'var(--dark-green)' }}
                            >
                              {entry.patient.name}
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
                            {entry.priority.toUpperCase()}
                          </span>

                          {entry.priority === 'alta' && (
                            <span 
                              className="text-xs px-2 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: 'var(--accent-100)',
                                color: 'var(--accent-700)'
                              }}
                            >
                              URGENTE
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span 
                              className="font-medium"
                              style={{ color: 'var(--neutral-700)' }}
                            >
                              {entry.appointmentType}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <PhoneIcon className="h-3 w-3" style={{ color: 'var(--neutral-500)' }} />
                            <span 
                              style={{ color: 'var(--neutral-600)' }}
                            >
                              {entry.patient.phone}
                            </span>
                          </div>
                        </div>

                        {entry.notes && (
                          <div 
                            className="text-sm mt-2 p-2 rounded"
                            style={{ 
                              backgroundColor: 'var(--neutral-100)',
                              color: 'var(--neutral-700)'
                            }}
                          >
                            {entry.notes}
                          </div>
                        )}

                        <div 
                          className="text-xs mt-2"
                          style={{ color: 'var(--neutral-500)' }}
                        >
                          En lista desde hace {daysSinceAdded} día{daysSinceAdded !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircleIcon 
                          className="h-5 w-5 mt-1"
                          style={{ color: 'var(--primary-600)' }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen de envío */}
          {selectedEntries.length > 0 && (
            <div 
              className="p-4 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--secondary-50)',
                border: '1px solid var(--secondary-200)'
              }}
            >
              <h4 
                className="font-medium text-sm mb-2"
                style={{ color: 'var(--secondary-700)' }}
              >
                Resumen del Envío
              </h4>
              <div 
                className="text-sm"
                style={{ color: 'var(--secondary-600)' }}
              >
                • Se enviarán {selectedEntries.length} invitación{selectedEntries.length !== 1 ? 'es' : ''}<br/>
                • Anticipo requerido: ${paymentAmount} pesos<br/>
                • Tiempo límite para responder: {confirmationHours} horas<br/>
                • Solo el primer paciente que confirme y pague obtendrá la cita<br/>
                • Los demás recibirán notificación de que el espacio ya fue ocupado
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--neutral-200)',
                color: 'var(--neutral-700)'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSendInvitations}
              disabled={selectedEntries.length === 0}
              className={`px-6 py-3 text-white text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedEntries.length > 0 ? 'hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'
              }`}
              style={{ 
                background: selectedEntries.length > 0
                  ? 'linear-gradient(135deg, var(--accent-500), var(--accent-600))'
                  : 'var(--neutral-400)',
                boxShadow: selectedEntries.length > 0 ? '0 8px 20px -5px rgba(236, 115, 103, 0.3)' : 'none'
              }}
            >
              <BellIcon className="h-4 w-4 mr-2 inline" />
              Enviar Invitaciones ({selectedEntries.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}