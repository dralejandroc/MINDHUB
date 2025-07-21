'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface WaitingListData {
  patientId: string;
  appointmentType: string;
  preferredDates: string[];
  preferredTimes: string[];
  priority: 'alta' | 'media' | 'baja';
  notes?: string;
}

interface AddToWaitingListModalProps {
  onClose: () => void;
  onSave: (data: WaitingListData) => void;
}

export default function AddToWaitingListModal({ onClose, onSave }: AddToWaitingListModalProps) {
  const [formData, setFormData] = useState<WaitingListData>({
    patientId: '',
    appointmentType: '',
    preferredDates: [],
    preferredTimes: [],
    priority: 'media',
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
      { id: 'p11', name: 'Luis Fernando Castro', phone: '+52 55 4444-5555', email: 'luis@email.com' },
      { id: 'p12', name: 'Patricia Mendoza Ruiz', phone: '+52 55 6666-7777', email: 'patricia@email.com' }
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
    'Revisión de medicación',
    'Sesión de urgencia'
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00'
  ];

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patientId: patient.id }));
    setShowPatientSearch(false);
    setSearchTerm('');
  };

  const handleDateToggle = (date: string) => {
    setFormData(prev => ({
      ...prev,
      preferredDates: prev.preferredDates.includes(date)
        ? prev.preferredDates.filter(d => d !== date)
        : [...prev.preferredDates, date]
    }));
  };

  const handleTimeToggle = (time: string) => {
    setFormData(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.includes(time)
        ? prev.preferredTimes.filter(t => t !== time)
        : [...prev.preferredTimes, time]
    }));
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.appointmentType || formData.preferredDates.length === 0 || formData.preferredTimes.length === 0) {
      return;
    }
    onSave(formData);
  };

  const isFormValid = formData.patientId && 
                     formData.appointmentType && 
                     formData.preferredDates.length > 0 && 
                     formData.preferredTimes.length > 0;

  const dateOptions = generateDateOptions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
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
            Agregar a Lista de Espera
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
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tipo de cita y prioridad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--dark-green)' }}
              >
                Tipo de cita *
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData(prev => ({ ...prev, appointmentType: e.target.value }))}
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
                Prioridad *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-4 py-3 text-sm rounded-lg focus:outline-none appearance-none"
                style={{ 
                  border: '2px solid var(--neutral-200)',
                  fontFamily: 'var(--font-primary)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <option value="baja">Baja - Cita rutinaria</option>
                <option value="media">Media - Seguimiento importante</option>
                <option value="alta">Alta - Urgente o crítico</option>
              </select>
            </div>
          </div>

          {/* Prioridad Alta Warning */}
          {formData.priority === 'alta' && (
            <div 
              className="p-4 rounded-lg border flex items-start space-x-3"
              style={{ 
                backgroundColor: 'var(--accent-50)',
                border: '1px solid var(--accent-200)'
              }}
            >
              <ExclamationTriangleIcon 
                className="h-5 w-5 mt-0.5"
                style={{ color: 'var(--accent-600)' }}
              />
              <div>
                <div 
                  className="font-medium text-sm"
                  style={{ color: 'var(--accent-700)' }}
                >
                  Prioridad Alta Seleccionada
                </div>
                <div 
                  className="text-sm mt-1"
                  style={{ color: 'var(--accent-600)' }}
                >
                  Este paciente tendrá máxima prioridad para asignación automática cuando haya cancelaciones.
                </div>
              </div>
            </div>
          )}

          {/* Fechas preferidas */}
          <div>
            <label 
              className="block text-sm font-medium mb-3"
              style={{ color: 'var(--dark-green)' }}
            >
              Fechas preferidas * (selecciona al menos una)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {dateOptions.map((date) => {
                const isSelected = formData.preferredDates.includes(date);
                const dateObj = new Date(date);
                const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
                const dayNumber = dateObj.getDate();
                const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' });

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => handleDateToggle(date)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                      isSelected ? 'transform scale-105' : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--primary-100)' : 'white',
                      borderColor: isSelected ? 'var(--primary-500)' : 'var(--neutral-200)',
                      color: isSelected ? 'var(--primary-700)' : 'var(--neutral-700)'
                    }}
                  >
                    <div className="text-xs font-medium">{dayName}</div>
                    <div className="text-sm font-bold">{dayNumber}</div>
                    <div className="text-xs">{monthName}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horarios preferidos */}
          <div>
            <label 
              className="block text-sm font-medium mb-3"
              style={{ color: 'var(--dark-green)' }}
            >
              Horarios preferidos * (selecciona al menos uno)
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {timeSlots.map((time) => {
                const isSelected = formData.preferredTimes.includes(time);

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeToggle(time)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      isSelected ? 'transform scale-105' : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--secondary-100)' : 'white',
                      borderColor: isSelected ? 'var(--secondary-500)' : 'var(--neutral-200)',
                      color: isSelected ? 'var(--secondary-700)' : 'var(--neutral-700)'
                    }}
                  >
                    {time}
                  </button>
                );
              })}
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
              placeholder="Motivo de consulta, urgencia, observaciones especiales..."
              className="w-full px-4 py-3 text-sm rounded-lg focus:outline-none resize-none"
              style={{ 
                border: '2px solid var(--neutral-200)',
                fontFamily: 'var(--font-primary)',
                borderRadius: 'var(--radius-lg)'
              }}
            />
          </div>

          {/* Información del proceso */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--primary-50)',
              border: '1px solid var(--primary-200)'
            }}
          >
            <h4 
              className="font-medium text-sm mb-2"
              style={{ color: 'var(--primary-700)' }}
            >
              ¿Cómo funciona la lista de espera?
            </h4>
            <ul 
              className="text-sm space-y-1"
              style={{ color: 'var(--primary-600)' }}
            >
              <li>• El paciente será notificado cuando haya un espacio disponible</li>
              <li>• Tendrá 48 horas para confirmar y pagar el anticipo</li>
              <li>• Si no confirma en 24 horas, el espacio pasa al siguiente en lista</li>
              <li>• La asignación sigue orden de prioridad y fecha de registro</li>
            </ul>
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
              Agregar a Lista de Espera
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}