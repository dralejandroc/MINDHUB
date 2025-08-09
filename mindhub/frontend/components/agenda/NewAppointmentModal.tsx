'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  XMarkIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface AppointmentData {
  patientId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  notes?: string;
}

interface NewAppointmentModalProps {
  selectedDate: Date;
  selectedTime?: string;
  editingAppointment?: any;
  onClose: () => void;
  onSave: (appointment: AppointmentData) => void;
}

export default function NewAppointmentModal({ selectedDate, selectedTime, editingAppointment, onClose, onSave }: NewAppointmentModalProps) {
  // Safe date conversion
  const getDateString = (date: any): string => {
    if (!date) return new Date().toISOString().split('T')[0];
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<AppointmentData>({
    patientId: editingAppointment?.patientId || '',
    date: editingAppointment?.date || getDateString(selectedDate),
    time: editingAppointment?.time || selectedTime || '',
    duration: editingAppointment?.duration || 60,
    type: editingAppointment?.type || '',
    notes: editingAppointment?.notes || ''
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultationTypes, setConsultationTypes] = useState<Array<{id: string, name: string, duration: number, price: number, color: string}>>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Function to handle new patient creation with callback
  const handleNewPatientCreation = () => {
    const event = new CustomEvent('openNewPatientModal', { 
      detail: { 
        fromAgenda: true,
        callback: (newPatient: any) => {
          console.log('🎯 Callback received with new patient:', newPatient);
          // Transform new patient data to match expected format
          const patientForSelection = {
            id: newPatient.id,
            name: `${newPatient.first_name || ''} ${newPatient.last_name || newPatient.paternal_last_name || ''}`.trim(),
            phone: newPatient.cell_phone || 'Sin teléfono',
            email: newPatient.email || 'Sin email'
          };
          
          // Add to patients list
          setPatients(prev => [patientForSelection, ...prev]);
          setFilteredPatients(prev => [patientForSelection, ...prev]);
          
          // Auto-select the new patient
          setSelectedPatient(patientForSelection);
          setFormData(prev => ({ ...prev, patientId: patientForSelection.id }));
          
          console.log('✅ New patient auto-selected:', patientForSelection);
        }
      }
    });
    window.dispatchEvent(event);
  };

  // Cargar pacientes y configuración desde API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user to filter patients
        const savedUser = localStorage.getItem('currentUser');
        let userId = '';
        if (savedUser) {
          const user = JSON.parse(savedUser);
          userId = user.id || '';
        }

        // Load patients
        const patientsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/patients`);
        if (patientsResponse.ok) {
          const data = await patientsResponse.json();
          const patientsData = data.data?.map((p: any) => ({
            id: p.id,
            name: `${p.first_name || ''} ${p.last_name || p.paternal_last_name || ''}`.trim(),
            phone: p.cell_phone || 'Sin teléfono',
            email: p.email || 'Sin email'
          })) || [];
          setPatients(patientsData);
          setFilteredPatients(patientsData);

          // If editing, find and set the selected patient
          if (editingAppointment?.patientId) {
            const patient = patientsData.find((p: any) => p.id === editingAppointment.patientId);
            if (patient) {
              setSelectedPatient(patient);
              console.log('🔄 Loaded patient for editing:', patient);
            }
          }
        }

        // Load consultation types from schedule config
        const configResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/schedule-config`);
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData.success && configData.data?.consultationTypes) {
            setConsultationTypes(configData.data.consultationTypes);
            console.log('🔄 Loaded consultation types:', configData.data.consultationTypes);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [editingAppointment]);

  // Filtrar pacientes con debounce
  useEffect(() => {
    const searchPatients = async () => {
      setSearchLoading(true);
      try {
        if (debouncedSearchTerm) {
          const filtered = patients.filter(patient =>
            patient.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            patient.phone.includes(debouncedSearchTerm) ||
            patient.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
          setFilteredPatients(filtered);
        } else {
          setFilteredPatients(patients);
        }
      } finally {
        setSearchLoading(false);
      }
    };

    searchPatients();
  }, [debouncedSearchTerm, patients]);

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00'
  ];

  const durations = [
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1 hora 30 min' },
    { value: 120, label: '2 horas' }
  ];

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patientId: patient.id }));
    setShowPatientSearch(false);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.date || !formData.time || !formData.type) {
      return;
    }

    try {
      // Get current user for logging
      const savedUser = localStorage.getItem('currentUser');
      const currentUser = savedUser ? JSON.parse(savedUser) : null;

      // Create appointment with logging
      const appointmentData = {
        ...formData,
        createdBy: currentUser?.id || 'unknown',
        createdByName: currentUser?.name || 'Usuario desconocido'
      };

      // Save appointment and create log
      await onSave(appointmentData);

    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Error al crear la cita. Por favor intenta de nuevo.');
    }
  };

  const isFormValid = formData.patientId && formData.date && formData.time && formData.type;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
{editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" style={{ color: 'var(--neutral-500)' }} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selección de paciente */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--dark-green)' }}
            >
              Paciente *
            </label>
            {selectedPatient ? (
              <div 
                className="p-4 border rounded-lg flex items-center justify-between"
                style={{ 
                  border: '2px solid var(--primary-200)',
                  backgroundColor: 'var(--primary-50)'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' }}
                  >
                    {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div 
                      className="font-medium"
                      style={{ color: 'var(--dark-green)' }}
                    >
                      {selectedPatient.name}
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: 'var(--neutral-600)' }}
                    >
                      {selectedPatient.phone}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null);
                    setFormData(prev => ({ ...prev, patientId: '' }));
                  }}
                  className="text-sm px-3 py-1 rounded-lg transition-colors duration-200"
                  style={{ 
                    backgroundColor: 'var(--neutral-200)',
                    color: 'var(--neutral-700)'
                  }}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <MagnifyingGlassIcon 
                    className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: 'var(--neutral-400)' }}
                  />
                  <input
                    type="text"
                    placeholder="Buscar paciente por nombre, teléfono o email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowPatientSearch(true);
                    }}
                    onFocus={() => setShowPatientSearch(true)}
                    className="w-full pl-9 pr-4 py-3 text-sm border rounded-lg focus:outline-none"
                    style={{ 
                      border: '2px solid var(--neutral-300)',
                      fontFamily: 'var(--font-primary)'
                    }}
                  />
                </div>

                {showPatientSearch && (searchTerm || filteredPatients.length > 0) && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-10"
                    style={{ 
                      border: '1px solid var(--neutral-200)',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {searchLoading ? (
                        <div className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                            <span className="text-sm text-neutral-500">Buscando...</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {filteredPatients.map((patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => handleSelectPatient(patient)}
                              className="w-full p-3 text-left hover:bg-gray-50 transition-colors duration-200 border-b last:border-b-0"
                              style={{ borderColor: 'var(--neutral-100)' }}
                            >
                              <div 
                                className="font-medium"
                                style={{ color: 'var(--dark-green)' }}
                              >
                                {patient.name}
                              </div>
                              <div 
                                className="text-sm"
                                style={{ color: 'var(--neutral-600)' }}
                              >
                                {patient.phone} • {patient.email}
                              </div>
                            </button>
                          ))}
                          {filteredPatients.length === 0 && !searchLoading && (
                            <div className="p-4 text-center">
                              <p 
                                className="text-sm"
                                style={{ color: 'var(--neutral-500)' }}
                              >
                                No se encontraron pacientes
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPatientSearch(false);
                                  handleNewPatientCreation();
                                }}
                                className="mt-2 text-sm px-3 py-1 rounded-lg transition-colors duration-200"
                                style={{ 
                                  backgroundColor: 'var(--primary-100)',
                                  color: 'var(--primary-700)'
                                }}
                              >
                                <PlusIcon className="h-3 w-3 inline mr-1" />
                                Crear nuevo paciente
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="p-3 border-t" style={{ borderColor: 'var(--neutral-200)' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPatientSearch(false);
                          handleNewPatientCreation();
                        }}
                        className="w-full text-sm px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
                        style={{ 
                          backgroundColor: 'var(--primary-500)',
                          color: 'white'
                        }}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Nuevo Paciente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--dark-green)' }}
              >
                Fecha *
              </label>
              <div className="relative">
                <CalendarIcon 
                  className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--primary-500)' }}
                />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-lg focus:outline-none"
                  style={{ 
                    border: '2px solid var(--neutral-200)',
                    fontFamily: 'var(--font-primary)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--dark-green)' }}
              >
                Hora *
              </label>
              <div className="relative">
                <ClockIcon 
                  className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--primary-500)' }}
                />
                <select
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-lg focus:outline-none appearance-none"
                  style={{ 
                    border: '2px solid var(--neutral-200)',
                    fontFamily: 'var(--font-primary)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                  required
                >
                  <option value="">Seleccionar hora</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tipo de cita y duración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--dark-green)' }}
              >
                Tipo de cita *
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const selectedType = consultationTypes.find(t => t.name === e.target.value);
                  setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value,
                    duration: selectedType ? selectedType.duration : prev.duration
                  }));
                }}
                className="w-full px-4 py-3 text-sm rounded-lg focus:outline-none appearance-none"
                style={{ 
                  border: '2px solid var(--neutral-200)',
                  fontFamily: 'var(--font-primary)',
                  borderRadius: 'var(--radius-lg)'
                }}
                required
              >
                <option value="">Seleccionar tipo</option>
                {consultationTypes.map((type) => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--dark-green)' }}
              >
                Duración
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 text-sm rounded-lg focus:outline-none appearance-none"
                style={{ 
                  border: '2px solid var(--neutral-200)',
                  fontFamily: 'var(--font-primary)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                {durations.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--dark-green)' }}
            >
              Notas adicionales
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Motivo de consulta, observaciones..."
              className="w-full px-4 py-3 text-sm rounded-lg focus:outline-none resize-none"
              style={{ 
                border: '2px solid var(--neutral-200)',
                fontFamily: 'var(--font-primary)',
                borderRadius: 'var(--radius-lg)'
              }}
            />
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
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
              type="submit"
              disabled={!isFormValid}
              className={`px-6 py-3 text-white text-sm font-medium rounded-lg transition-all duration-200 ${
                isFormValid ? 'hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'
              }`}
              style={{ 
                background: isFormValid 
                  ? 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))'
                  : 'var(--neutral-400)',
                boxShadow: isFormValid ? '0 8px 20px -5px rgba(41, 169, 140, 0.3)' : 'none'
              }}
            >
              Agendar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}