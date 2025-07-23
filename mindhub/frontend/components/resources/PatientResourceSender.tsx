'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  UserIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Patient {
  id: number;
  name: string;
  email: string;
}

interface Resource {
  id: number;
  title: string;
  type: string;
  fileSize: number;
  formattedSize: string;
}

interface PatientResourceSenderProps {
  patientId?: string;
  resource?: Resource;
  resourceId?: number;
  onBack: () => void;
  onSent?: (result: any) => void;
}

type SendMethod = 'expedix' | 'email' | 'portal';

export const PatientResourceSender: React.FC<PatientResourceSenderProps> = ({
  patientId,
  resource,
  resourceId,
  onBack,
  onSent
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendMethod, setSendMethod] = useState<SendMethod>('expedix');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    searchPatients('');
    
    // If patientId is provided, pre-select that patient
    if (patientId) {
      fetchPatientById(patientId);
    }
  }, [patientId]);
  
  const fetchPatientById = async (id: string) => {
    try {
      const response = await fetch(`/api/expedix/patients/${id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const patient = {
          id: parseInt(id),
          name: `${data.data.firstName} ${data.data.lastName}`,
          email: data.data.email || ''
        };
        setSelectedPatient(patient);
      }
    } catch (err) {
      console.error('Error fetching patient:', err);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPatients(searchQuery);
      } else {
        searchPatients('');
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const searchPatients = async (query: string) => {
    try {
      setSearchLoading(true);
      const url = query 
        ? `/api/resources/documents/patients?search=${encodeURIComponent(query)}`
        : '/api/resources/documents/patients';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.data);
      } else {
        setError('Error cargando pacientes');
      }
    } catch (err) {
      console.error('Error searching patients:', err);
      setError('Error de conexión');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedPatient) {
      setError('Por favor selecciona un paciente');
      return;
    }

    if (!resource && !resourceId) {
      setError('No hay recurso especificado para enviar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/resources/documents/send-to-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId: resource?.id || resourceId,
          patientId: selectedPatient.id,
          sendMethod: sendMethod,
          message: message.trim() || null
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        if (onSent) {
          onSent(data.data);
        }
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(data.error || 'Error enviando el recurso');
      }
    } catch (err) {
      console.error('Error sending resource:', err);
      setError('Error de conexión al enviar el recurso');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setMessage('');
    setSendMethod('expedix');
    setError('');
    setSuccess(false);
    onBack();
  };

  const sendMethodOptions = [
    {
      id: 'expedix',
      name: 'Expedix',
      description: 'Agregar al expediente del paciente',
      icon: DocumentIcon,
      available: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <Button
          onClick={onBack}
          variant="outline"
          className="mr-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Volver a Biblioteca
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Enviar Recurso a Paciente</h2>
          <p className="text-sm text-gray-600">Selecciona recursos y envíalos directamente al expediente del paciente</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Resource Info Header */}
        {resource && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">
              Recurso seleccionado: {resource.title} • {resource.formattedSize}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Recurso Enviado Exitosamente!
              </h3>
              <p className="text-gray-600">
                El recurso ha sido enviado a {selectedPatient?.name} via {sendMethod}
              </p>
            </div>
          ) : (
            <>
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Patient Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seleccionar Paciente
                </label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar paciente por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {searchLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>

                {/* Patient List */}
                <div className="mt-3 border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                  {patients.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchQuery ? 'No se encontraron pacientes' : 'Cargando pacientes...'}
                    </div>
                  ) : (
                    patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`w-full text-left p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors ${
                          selectedPatient?.id === patient.id ? 'bg-orange-50 border-orange-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedPatient?.id === patient.id ? 'bg-orange-100' : 'bg-gray-100'
                          }`}>
                            <UserIcon className={`h-5 w-5 ${
                              selectedPatient?.id === patient.id ? 'text-orange-600' : 'text-gray-500'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-600">{patient.email}</div>
                          </div>
                          {selectedPatient?.id === patient.id && (
                            <CheckCircleIcon className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Send Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Método de Envío
                </label>
                
                <div className="grid grid-cols-1 gap-3">
                  {sendMethodOptions.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <label key={method.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="sendMethod"
                          value={method.id}
                          checked={sendMethod === method.id}
                          onChange={(e) => setSendMethod(e.target.value as SendMethod)}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-lg border-2 transition-all ${
                          sendMethod === method.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <IconComponent className={`h-6 w-6 ${
                              sendMethod === method.id ? 'text-orange-600' : 'text-gray-400'
                            }`} />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {method.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {method.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Optional Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mensaje Opcional
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Agregar una nota o instrucciones para el paciente..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleSend}
              disabled={!selectedPatient || loading}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>Enviar Recurso</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};