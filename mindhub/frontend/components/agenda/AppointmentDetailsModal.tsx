'use client';

import { useState } from 'react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  duration: number;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  phone?: string;
  email?: string;
  date?: string;
}

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointmentId: string) => void;
  onStatusChange?: (appointmentId: string, status: Appointment['status']) => void;
}

export default function AppointmentDetailsModal({ 
  appointment, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete,
  onStatusChange 
}: AppointmentDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return 'Programada';
    }
  };

  const handleStatusChange = (newStatus: Appointment['status']) => {
    if (onStatusChange) {
      onStatusChange(appointment.id, newStatus);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(appointment.id);
      onClose();
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(appointment);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--neutral-200)' }}
        >
          <h2 
            className="text-xl font-bold"
            style={{ 
              color: 'var(--dark-green)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Detalles de la Cita
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" style={{ color: 'var(--neutral-500)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Patient Info */}
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' }}
            >
              {appointment.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 
                className="text-lg font-semibold"
                style={{ color: 'var(--dark-green)' }}
              >
                {appointment.patientName}
              </h3>
              {appointment.phone && (
                <div className="flex items-center text-sm" style={{ color: 'var(--neutral-600)' }}>
                  <PhoneIcon className="h-4 w-4 mr-1" />
                  {appointment.phone}
                </div>
              )}
              {appointment.email && (
                <div className="flex items-center text-sm" style={{ color: 'var(--neutral-600)' }}>
                  <EnvelopeIcon className="h-4 w-4 mr-1" />
                  {appointment.email}
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                Fecha y Hora
              </label>
              <div className="flex items-center text-sm" style={{ color: 'var(--dark-green)' }}>
                <CalendarIcon className="h-4 w-4 mr-2" style={{ color: 'var(--primary-500)' }} />
                {appointment.date && new Date(appointment.date).toLocaleDateString('es-ES')}
              </div>
              <div className="flex items-center text-sm mt-1" style={{ color: 'var(--dark-green)' }}>
                <ClockIcon className="h-4 w-4 mr-2" style={{ color: 'var(--primary-500)' }} />
                {appointment.time} ({appointment.duration} min)
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                Estado
              </label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                {getStatusLabel(appointment.status)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
              Tipo de Consulta
            </label>
            <p className="text-sm" style={{ color: 'var(--dark-green)' }}>
              {appointment.type}
            </p>
          </div>

          {appointment.notes && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                Notas
              </label>
              <p 
                className="text-sm p-3 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--neutral-50)',
                  color: 'var(--neutral-700)'
                }}
              >
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Status Change Actions */}
          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                Cambiar Estado
              </label>
              <div className="flex space-x-2">
                {appointment.status !== 'confirmed' && (
                  <Button
                    onClick={() => handleStatusChange('confirmed')}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Confirmar
                  </Button>
                )}
                <Button
                  onClick={() => handleStatusChange('completed')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Completar
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div 
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ 
            borderColor: 'var(--neutral-200)',
            backgroundColor: 'var(--neutral-50)'
          }}
        >
          <div className="flex space-x-2">
            {onEdit && (
              <Button
                onClick={handleEdit}
                variant="outline"
                size="sm"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
          <Button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Cerrar
          </Button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">Confirmar Eliminación</h3>
              <p className="text-sm text-gray-600 mb-4">
                ¿Está seguro de que desea eliminar esta cita? Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-2 justify-end">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDelete}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}