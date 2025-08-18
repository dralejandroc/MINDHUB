'use client';

import React, { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
// import { PatientSelectorModal } from '../formx/PatientSelectorModal';
import toast from 'react-hot-toast';

interface SendResourceModalProps {
  resource: any;
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
}

export const SendResourceModal: React.FC<SendResourceModalProps> = ({
  resource,
  isOpen,
  onClose,
  onSent
}) => {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [sendOptions, setSendOptions] = useState({
    method: 'download',
    applyWatermark: true,
    notes: ''
  });
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!selectedPatient) {
      toast.error('Debe seleccionar un paciente');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resources/${resource.id}/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: selectedPatient.id,
            ...sendOptions
          })
        }
      );

      if (response.ok) {
        toast.success('Recurso enviado exitosamente');
        onSent();
      } else {
        throw new Error('Error al enviar recurso');
      }
    } catch (error) {
      toast.error('Error al enviar el recurso');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Enviar Recurso: {resource?.title}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paciente
              </label>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{selectedPatient.first_name} {selectedPatient.last_name}</span>
                  </div>
                  <Button
                    onClick={() => setShowPatientSelector(true)}
                    variant="outline"
                    size="sm"
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowPatientSelector(true)}
                  variant="outline"
                  className="w-full"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Seleccionar Paciente
                </Button>
              )}
            </div>

            {/* Send Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Envío
              </label>
              <select
                value={sendOptions.method}
                onChange={(e) => setSendOptions(prev => ({ ...prev, method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="download">Enlace de Descarga</option>
                <option value="email">Email</option>
                <option value="patient-portal">Portal del Paciente</option>
              </select>
            </div>

            {/* Watermark Option */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendOptions.applyWatermark}
                  onChange={(e) => setSendOptions(prev => ({ ...prev, applyWatermark: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Aplicar marca de agua</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={sendOptions.notes}
                onChange={(e) => setSendOptions(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Notas para el paciente..."
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between">
            <Button onClick={onClose} variant="outline">Cancelar</Button>
            <Button 
              onClick={handleSend} 
              variant="primary"
              disabled={!selectedPatient || sending}
            >
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              {sending ? 'Enviando...' : 'Enviar Recurso'}
            </Button>
          </div>
        </div>
      </div>

      {/* Patient Selector Modal */}
      {showPatientSelector && (
//         <PatientSelectorModal
          isOpen={showPatientSelector}
          onClose={() => setShowPatientSelector(false)}
          onSelectPatient={(patient) => {
            setSelectedPatient(patient);
            setShowPatientSelector(false);
          }}
          formId={resource?.id}
          formTitle={`Recurso: ${resource?.title}`}
        />
      )}
    </>
  );
};