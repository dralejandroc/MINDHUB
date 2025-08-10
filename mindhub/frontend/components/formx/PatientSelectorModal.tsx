'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  cell_phone?: string;
  birth_date?: string;
  gender?: string;
}

interface PatientSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: Patient) => void;
  formId: string;
  formTitle: string;
}

export const PatientSelectorModal: React.FC<PatientSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
  formId,
  formTitle
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Load patients
  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expedix/patients?limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        setPatients(data.data || []);
        setFilteredPatients(data.data || []);
      } else {
        throw new Error('Error al cargar pacientes');
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Error al cargar la lista de pacientes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter patients based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      return (
        fullName.includes(searchLower) ||
        (patient.email && patient.email.toLowerCase().includes(searchLower)) ||
        (patient.cell_phone && patient.cell_phone.includes(searchTerm))
      );
    });

    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  // Load patients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPatients();
      setSearchTerm('');
      setSelectedPatient(null);
    }
  }, [isOpen, loadPatients]);

  // Handle patient assignment
  const handleAssignForm = async () => {
    if (!selectedPatient) return;

    setAssigning(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/formx/forms/${formId}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: selectedPatient.id,
            expiresInHours: 72,
            message: `Por favor complete el formulario "${formTitle}" antes de su próxima consulta.`
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success('Formulario asignado exitosamente');
        
        // Copy URL to clipboard
        if (navigator.clipboard && result.data.formUrl) {
          try {
            await navigator.clipboard.writeText(result.data.formUrl);
            toast.success('URL del formulario copiada al portapapeles');
          } catch (clipboardError) {
            console.log('Clipboard access not available');
          }
        }

        onSelectPatient(selectedPatient);
        onClose();
      } else {
        throw new Error('Error al asignar formulario');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Error al asignar el formulario');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Asignar Formulario a Paciente
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Formulario: <span className="font-medium">{formTitle}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar paciente por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
          {loading ? (
            <div className="p-8 text-center">
              <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-gray-600">Cargando pacientes...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center">
              <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedPatient?.id === patient.id ? 'bg-primary-50 border-r-4 border-primary-500' : ''
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {patient.first_name} {patient.last_name}
                          </p>
                          {patient.gender && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {patient.gender === 'M' ? 'Masculino' : 'Femenino'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1">
                          {patient.email && (
                            <div className="flex items-center text-xs text-gray-500">
                              <EnvelopeIcon className="h-3 w-3 mr-1" />
                              {patient.email}
                            </div>
                          )}
                          {patient.cell_phone && (
                            <div className="flex items-center text-xs text-gray-500">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {patient.cell_phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedPatient?.id === patient.id && (
                      <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          {selectedPatient && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-primary-900">
                    Paciente seleccionado: {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                  <p className="text-xs text-primary-700">
                    Se enviará un enlace seguro para completar el formulario
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleAssignForm}
              disabled={!selectedPatient || assigning}
              variant="primary"
            >
              {assigning ? (
                <>
                  <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Asignar Formulario
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};