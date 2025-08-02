'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  lastVisit?: string;
}

interface BulkFormAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
  onAssignmentComplete?: (assignments: any[]) => void;
}

export const BulkFormAssignmentModal: React.FC<BulkFormAssignmentModalProps> = ({
  isOpen,
  onClose,
  formId,
  formTitle,
  onAssignmentComplete
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [customMessage, setCustomMessage] = useState('');
  const [sendReminder, setSendReminder] = useState(true);
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'confirm'>('select');
  
  useEffect(() => {
    if (isOpen) {
      loadPatients();
    }
  }, [isOpen]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/patients`);
      
      if (response.ok) {
        const data = await response.json();
        setPatients(data.data || []);
      } else {
        throw new Error('Error al cargar pacientes');
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Error al cargar la lista de pacientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const email = patient.email?.toLowerCase() || '';
    const phone = patient.phone || '';
    
    return fullName.includes(searchTerm.toLowerCase()) ||
           email.includes(searchTerm.toLowerCase()) ||
           phone.includes(searchTerm);
  });

  const handlePatientToggle = (patientId: string) => {
    const newSelected = new Set(selectedPatients);
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId);
    } else {
      newSelected.add(patientId);
    }
    setSelectedPatients(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPatients.size === filteredPatients.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(filteredPatients.map(p => p.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedPatients.size === 0) {
      toast.error('Seleccione al menos un paciente');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/assignments/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formId,
          patientIds: Array.from(selectedPatients),
          expiresInHours,
          message: customMessage || `Por favor complete el formulario "${formTitle}" antes de su próxima consulta.`,
          sendReminder
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Formulario asignado exitosamente a ${selectedPatients.size} pacientes`);
        
        if (onAssignmentComplete) {
          onAssignmentComplete(data.data);
        }
        
        onClose();
      } else {
        throw new Error('Error en la asignación');
      }
    } catch (error) {
      console.error('Error assigning forms:', error);
      toast.error('Error al asignar el formulario');
    } finally {
      setIsAssigning(false);
    }
  };

  const renderPatientCard = (patient: Patient) => {
    const isSelected = selectedPatients.has(patient.id);
    
    return (
      <div
        key={patient.id}
        onClick={() => handlePatientToggle(patient.id)}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}} // Handled by parent onClick
                className="mr-3 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <h3 className="font-medium text-gray-900">
                {patient.firstName} {patient.lastName}
              </h3>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              {patient.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {patient.email}
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  {patient.phone}
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {new Date(patient.dateOfBirth).toLocaleDateString('es-ES')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSelectStep = () => (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="space-y-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pacientes por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={handleSelectAll}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {selectedPatients.size === filteredPatients.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
          <span className="text-sm text-gray-500">
            {selectedPatients.size} de {filteredPatients.length} pacientes seleccionados
          </span>
        </div>
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="max-h-96 overflow-y-auto space-y-3">
          {filteredPatients.map(renderPatientCard)}
        </div>
      ) : (
        <div className="text-center py-8">
          <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No se encontraron pacientes con ese criterio' : 'No hay pacientes disponibles'}
          </p>
        </div>
      )}
    </div>
  );

  const renderConfigureStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <UserGroupIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              {selectedPatients.size} pacientes seleccionados
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Se asignará el formulario "{formTitle}" a todos los pacientes seleccionados
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiempo de expiración
          </label>
          <select
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={24}>24 horas</option>
            <option value={48}>48 horas</option>
            <option value={72}>72 horas (3 días)</option>
            <option value={120}>5 días</option>
            <option value={168}>1 semana</option>
            <option value={336}>2 semanas</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensaje personalizado (opcional)
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={`Por favor complete el formulario "${formTitle}" antes de su próxima consulta.`}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Si no proporciona un mensaje, se usará el mensaje predeterminado
          </p>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={sendReminder}
              onChange={(e) => setSendReminder(e.target.checked)}
              className="mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Enviar recordatorios automáticos por email
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Se enviará un recordatorio 24 horas antes del vencimiento
          </p>
        </div>
      </div>
    </div>
  );

  const renderConfirmStep = () => {
    const selectedPatientsList = patients.filter(p => selectedPatients.has(p.id));
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Confirmar asignación masiva
          </h3>
          <p className="text-gray-600">
            Se asignará el formulario a {selectedPatients.size} pacientes
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Formulario:</span>
            <span className="font-medium">{formTitle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pacientes:</span>
            <span className="font-medium">{selectedPatients.size}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Expira en:</span>
            <span className="font-medium">
              {expiresInHours < 24 ? `${expiresInHours} horas` : 
               expiresInHours < 168 ? `${expiresInHours / 24} días` : 
               `${expiresInHours / 168} semanas`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Recordatorios:</span>
            <span className="font-medium">{sendReminder ? 'Activados' : 'Desactivados'}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Pacientes seleccionados:
          </h4>
          <div className="max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-lg p-3">
            <div className="space-y-1 text-sm">
              {selectedPatientsList.map(patient => (
                <div key={patient.id} className="flex justify-between">
                  <span>{patient.firstName} {patient.lastName}</span>
                  <span className="text-gray-500">{patient.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {customMessage && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Mensaje personalizado:
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">{customMessage}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Asignación Masiva de Formularios
              </h2>
              <p className="text-sm text-gray-500">
                Formulario: {formTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {[
              { key: 'select', label: 'Seleccionar pacientes', icon: UserGroupIcon },
              { key: 'configure', label: 'Configurar', icon: ClockIcon },
              { key: 'confirm', label: 'Confirmar', icon: CheckCircleIcon }
            ].map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.key;
              const isCompleted = ['select', 'configure', 'confirm'].indexOf(currentStep) > index;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isActive ? 'bg-primary-600 text-white' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-primary-600' :
                    isCompleted ? 'text-green-600' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < 2 && (
                    <div className={`w-8 h-px mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === 'select' && renderSelectStep()}
          {currentStep === 'configure' && renderConfigureStep()}
          {currentStep === 'confirm' && renderConfirmStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div>
            {currentStep !== 'select' && (
              <Button
                onClick={() => {
                  if (currentStep === 'configure') setCurrentStep('select');
                  if (currentStep === 'confirm') setCurrentStep('configure');
                }}
                variant="outline"
              >
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isAssigning}
            >
              Cancelar
            </Button>
            
            {currentStep === 'select' && (
              <Button
                onClick={() => setCurrentStep('configure')}
                disabled={selectedPatients.size === 0}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Siguiente ({selectedPatients.size})
              </Button>
            )}
            
            {currentStep === 'configure' && (
              <Button
                onClick={() => setCurrentStep('confirm')}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Revisar asignación
              </Button>
            )}
            
            {currentStep === 'confirm' && (
              <Button
                onClick={handleBulkAssign}
                disabled={isAssigning}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isAssigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Asignando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Confirmar asignación
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};