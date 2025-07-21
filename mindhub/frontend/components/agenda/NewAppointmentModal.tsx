'use client';

import { useState, useEffect } from 'react';
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
  onClose: () => void;
  onSave: (appointment: AppointmentData) => void;
}

export default function NewAppointmentModal({ selectedDate, onClose, onSave }: NewAppointmentModalProps) {
  const [formData, setFormData] = useState<AppointmentData>({
    patientId: '',
    date: selectedDate.toISOString().split('T')[0],
    time: '',
    duration: 60,
    type: '',
    notes: ''
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Datos de ejemplo de pacientes
  useEffect(() => {
    const mockPatients: Patient[] = [
      { id: 'p1', name: 'María González Pérez', phone: '+52 55 1234-5678', email: 'maria@email.com' },
      { id: 'p2', name: 'Carlos Rodríguez Silva', phone: '+52 55 9876-5432', email: 'carlos@email.com' },
      { id: 'p3', name: 'Ana Martínez López', phone: '+52 55 5555-0123', email: 'ana@email.com' },
      { id: 'p4', name: 'Pedro López García', phone: '+52 55 7777-8888', email: 'pedro@email.com' },
      { id: 'p5', name: 'Sofía García Morales', phone: '+52 55 3333-4444', email: 'sofia@email.com' },
      { id: 'p6', name: 'Roberto Fernández Ruiz', phone: '+52 55 2222-1111', email: 'roberto@email.com' }
    ];
    setPatients(mockPatients);
    setFilteredPatients(mockPatients);
  }, []);

  // Filtrar pacientes
  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  const appointmentTypes = [
    'Consulta inicial',
    'Seguimiento',
    'Evaluación psicológica',
    'Terapia individual',
    'Terapia de pareja',
    'Terapia familiar',
    'Control',
    'Revisión de medicación'
  ];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.date || !formData.time || !formData.type) {
      return;
    }
    onSave(formData);
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
            Nueva Cita
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
                <button
                  type="button"
                  onClick={() => setShowPatientSearch(!showPatientSearch)}
                  className="w-full p-4 border-2 border-dashed rounded-lg text-left transition-all duration-200 hover:bg-gray-50"
                  style={{ 
                    borderColor: 'var(--neutral-300)',
                    color: 'var(--neutral-600)'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5" />
                    <span>Seleccionar paciente</span>
                  </div>
                </button>

                {showPatientSearch && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-10"
                    style={{ 
                      border: '1px solid var(--neutral-200)',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    <div className="p-4 border-b" style={{ borderColor: 'var(--neutral-200)' }}>
                      <div className="relative">
                        <MagnifyingGlassIcon 
                          className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2"
                          style={{ color: 'var(--neutral-400)' }}
                        />
                        <input
                          type="text"
                          placeholder="Buscar paciente..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none"
                          style={{ 
                            border: '1px solid var(--neutral-300)',
                            fontFamily: 'var(--font-primary)'
                          }}
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
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
                      {filteredPatients.length === 0 && (
                        <div className="p-4 text-center">
                          <p 
                            className="text-sm"
                            style={{ color: 'var(--neutral-500)' }}
                          >
                            No se encontraron pacientes
                          </p>
                          <button
                            type="button"
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
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 text-sm rounded-lg focus:outline-none appearance-none"
                style={{ 
                  border: '2px solid var(--neutral-200)',
                  fontFamily: 'var(--font-primary)',
                  borderRadius: 'var(--radius-lg)'
                }}
                required
              >
                <option value="">Seleccionar tipo</option>
                {appointmentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
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