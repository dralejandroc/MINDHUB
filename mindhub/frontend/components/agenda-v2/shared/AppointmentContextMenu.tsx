'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  PaperAirplaneIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  VideoCameraIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { AppointmentData } from './AppointmentCard';

export interface AppointmentContextMenuProps {
  appointment: AppointmentData;
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  
  // Action handlers
  onStartConsultation?: (appointmentId: string) => void;
  onConfirm?: (appointmentId: string, withDeposit: boolean) => void;
  onCancel?: (appointmentId: string, reason?: string) => void;
  onReschedule?: (appointmentId: string) => void;
  onGoToRecord?: (patientId: string) => void;
  onViewTimeline?: (patientId: string) => void;
  onSendForm?: (patientId: string) => void;
  onSendResource?: (patientId: string) => void;
  onSendScale?: (patientId: string) => void;
  onAddComment?: (appointmentId: string) => void;
  
  // Context
  userRole?: 'admin' | 'doctor' | 'nurse' | 'receptionist';
  licenseType?: 'clinic' | 'individual';
}

interface MenuAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
  requiresConfirmation?: boolean;
  submenu?: MenuAction[];
  disabled?: boolean;
  separator?: boolean;
}

export const AppointmentContextMenu: React.FC<AppointmentContextMenuProps> = ({
  appointment,
  isVisible,
  position,
  onClose,
  onStartConsultation,
  onConfirm,
  onCancel,
  onReschedule,
  onGoToRecord,
  onViewTimeline,
  onSendForm,
  onSendResource,
  onSendScale,
  onAddComment,
  userRole = 'doctor',
  licenseType = 'individual'
}) => {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isVisible, onClose]);

  const getConsultationActions = (): MenuAction[] => {
    const canStart = ['scheduled', 'confirmed'].includes(appointment.status);
    const canConfirm = ['scheduled'].includes(appointment.status);
    const canCancel = !['completed', 'cancelled'].includes(appointment.status);
    
    return [
      {
        id: 'start',
        label: 'Iniciar Consulta',
        icon: PlayIcon,
        color: 'text-green-600 hover:bg-green-50',
        description: 'Comenzar la consulta con el paciente',
        disabled: !canStart
      },
      {
        id: 'confirm',
        label: 'Confirmar Cita',
        icon: CheckCircleIcon,
        color: 'text-blue-600 hover:bg-blue-50',
        description: 'Confirmar asistencia del paciente',
        disabled: !canConfirm,
        submenu: [
          {
            id: 'confirm-no-deposit',
            label: 'Sin Depósito',
            icon: CheckCircleIcon,
            color: 'text-blue-600 hover:bg-blue-50'
          },
          {
            id: 'confirm-with-deposit',
            label: 'Con Depósito',
            icon: CurrencyDollarIcon,
            color: 'text-green-600 hover:bg-green-50'
          }
        ]
      },
      {
        id: 'cancel',
        label: 'Cancelar Cita',
        icon: XCircleIcon,
        color: 'text-red-600 hover:bg-red-50',
        description: 'Cancelar la cita médica',
        requiresConfirmation: true,
        disabled: !canCancel
      },
      {
        id: 'reschedule',
        label: 'Cambiar Horario',
        icon: ClockIcon,
        color: 'text-orange-600 hover:bg-orange-50',
        description: 'Reprogramar la cita'
      }
    ];
  };

  const getPatientActions = (): MenuAction[] => [
    {
      id: 'separator-1',
      label: '',
      icon: DocumentTextIcon,
      color: '',
      separator: true
    },
    {
      id: 'go-to-record',
      label: 'Ir a Expediente',
      icon: DocumentTextIcon,
      color: 'text-primary-600 hover:bg-primary-50',
      description: 'Abrir el expediente médico completo'
    },
    {
      id: 'view-timeline',
      label: 'Timeline del Paciente',
      icon: UserIcon,
      color: 'text-purple-600 hover:bg-purple-50',
      description: 'Ver historial cronológico de consultas'
    }
  ];

  const getCommunicationActions = (): MenuAction[] => [
    {
      id: 'separator-2',
      label: '',
      icon: PaperAirplaneIcon,
      color: '',
      separator: true
    },
    {
      id: 'send-form',
      label: 'Enviar Formulario',
      icon: PaperAirplaneIcon,
      color: 'text-indigo-600 hover:bg-indigo-50',
      description: 'Enviar formulario personalizado al paciente'
    },
    {
      id: 'send-resource',
      label: 'Enviar Recurso',
      icon: BookOpenIcon,
      color: 'text-teal-600 hover:bg-teal-50',
      description: 'Compartir recursos médicos educativos'
    },
    {
      id: 'send-scale',
      label: 'Enviar Escala',
      icon: ChartBarIcon,
      color: 'text-pink-600 hover:bg-pink-50',
      description: 'Enviar evaluación psicométrica'
    },
    {
      id: 'add-comment',
      label: 'Agregar Comentario',
      icon: ChatBubbleLeftRightIcon,
      color: 'text-gray-600 hover:bg-gray-50',
      description: 'Añadir nota o comentario a la cita'
    }
  ];

  const getAllActions = (): MenuAction[] => [
    ...getConsultationActions(),
    ...getPatientActions(),
    ...getCommunicationActions()
  ];

  const handleActionClick = (action: MenuAction) => {
    if (action.disabled) return;
    
    if (action.submenu) {
      setSubmenuOpen(submenuOpen === action.id ? null : action.id);
      return;
    }

    if (action.requiresConfirmation) {
      setConfirmAction(action.id);
      return;
    }

    executeAction(action.id);
  };

  const executeAction = (actionId: string) => {
    switch (actionId) {
      case 'start':
        onStartConsultation?.(appointment.id);
        break;
      case 'confirm-no-deposit':
        onConfirm?.(appointment.id, false);
        break;
      case 'confirm-with-deposit':
        onConfirm?.(appointment.id, true);
        break;
      case 'cancel':
        onCancel?.(appointment.id);
        break;
      case 'reschedule':
        onReschedule?.(appointment.id);
        break;
      case 'go-to-record':
        onGoToRecord?.(appointment.patientId);
        break;
      case 'view-timeline':
        onViewTimeline?.(appointment.patientId);
        break;
      case 'send-form':
        onSendForm?.(appointment.patientId);
        break;
      case 'send-resource':
        onSendResource?.(appointment.patientId);
        break;
      case 'send-scale':
        onSendScale?.(appointment.patientId);
        break;
      case 'add-comment':
        onAddComment?.(appointment.id);
        break;
    }
    onClose();
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      executeAction(confirmAction);
      setConfirmAction(null);
    }
  };

  const getConsultationTypeIcon = () => {
    switch (appointment.consultationType) {
      case 'virtual':
        return <VideoCameraIcon className="w-4 h-4 text-blue-500" />;
      case 'telefonica':
        return <PhoneIcon className="w-4 h-4 text-green-500" />;
      default:
        return <CalendarDaysIcon className="w-4 h-4 text-primary-500" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 min-w-64 max-w-80 py-2 z-10"
        style={{
          left: Math.min(position.x, window.innerWidth - 320),
          top: Math.min(position.y, window.innerHeight - 400)
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            {getConsultationTypeIcon()}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {appointment.patientName}
              </h3>
              <p className="text-xs text-gray-600">
                {appointment.type} • {appointment.duration} min
              </p>
            </div>
            <div className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }
            `}>
              {appointment.status === 'confirmed' ? 'Confirmada' :
               appointment.status === 'scheduled' ? 'Agendada' :
               appointment.status === 'completed' ? 'Completada' :
               'Estado'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="py-1">
          {getAllActions().map((action, index) => {
            if (action.separator) {
              return <div key={`separator-${index}`} className="border-t border-gray-100 my-1" />;
            }

            const Icon = action.icon;
            const isSubmenuOpen = submenuOpen === action.id;

            return (
              <div key={action.id}>
                <button
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-2 text-sm text-left
                    transition-colors duration-200 relative
                    ${action.disabled 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : `${action.color} cursor-pointer`
                    }
                  `}
                  title={action.description}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{action.label}</span>
                  {action.submenu && (
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${isSubmenuOpen ? 'rotate-90' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>

                {/* Submenu */}
                {action.submenu && isSubmenuOpen && (
                  <div className="ml-8 border-l border-gray-200 pl-2">
                    {action.submenu.map((subAction) => {
                      const SubIcon = subAction.icon;
                      return (
                        <button
                          key={subAction.id}
                          onClick={() => executeAction(subAction.id)}
                          className={`
                            w-full flex items-center space-x-3 px-2 py-2 text-sm text-left
                            transition-colors duration-200 rounded-md my-1
                            ${subAction.color} cursor-pointer
                          `}
                        >
                          <SubIcon className="w-3 h-3 flex-shrink-0" />
                          <span>{subAction.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Acción</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Está seguro que desea {confirmAction === 'cancel' ? 'cancelar' : 'realizar'} esta acción?
              Esta operación no se puede deshacer.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};