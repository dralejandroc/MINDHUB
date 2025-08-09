'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface QuickSchedulingProps {
  onAppointmentScheduled: () => void;
}

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name?: string;
  cell_phone: string;
  email?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  patientName?: string;
}

interface AppointmentData {
  patientId: string;
  date: string;
  time: string;
  type: string;
  duration: number;
  notes: string;
  reminderEnabled: boolean;
}

export default function QuickScheduling({ onAppointmentScheduled }: QuickSchedulingProps) {
  const [currentStep, setCurrentStep] = useState<'patient' | 'datetime' | 'details'>('patient');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  // New patient form state
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    paternalLastName: '',
    maternalLastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: 'masculine'
  });

  // Appointment form state
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    patientId: '',
    date: '',
    time: '',
    type: 'consultation',
    duration: 60,
    notes: '',
    reminderEnabled: true
  });

  const appointmentTypes = [
    { id: 'consultation', name: 'Consulta General', duration: 60, cost: 800 },
    { id: 'followup', name: 'Seguimiento', duration: 30, cost: 600 },
    { id: 'therapy', name: 'Terapia', duration: 90, cost: 1000 },
    { id: 'evaluation', name: 'Evaluación Inicial', duration: 120, cost: 1200 },
    { id: 'emergency', name: 'Urgencia', duration: 30, cost: 1000 }
  ];

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  // Generate date options (next 30 days)
  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip Sundays
      if (date.getDay() !== 0) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      }
    }
    
    return dates;
  };

  const searchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expedix/patients?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.patients) {
        setPatients(data.patients.slice(0, 8));
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (date: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/frontdesk/appointments/slots/${date}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.data);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      // Generate mock slots for now
      const mockSlots = [];
      for (let hour = 9; hour <= 18; hour++) {
        for (let min = 0; min < 60; min += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          mockSlots.push({
            time,
            available: Math.random() > 0.3, // 70% available
            patientName: Math.random() > 0.7 ? 'Paciente X' : undefined
          });
        }
      }
      setAvailableSlots(mockSlots);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setAppointmentData(prev => ({ ...prev, patientId: patient.id }));
    setCurrentStep('datetime');
  };

  const handleTimeSelect = (time: string) => {
    setAppointmentData(prev => ({ ...prev, time, date: selectedDate }));
    setCurrentStep('details');
  };

  const handleTypeChange = (typeId: string) => {
    const type = appointmentTypes.find(t => t.id === typeId);
    setAppointmentData(prev => ({
      ...prev,
      type: typeId,
      duration: type?.duration || 60
    }));
  };

  const createNewPatient = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch(`/api/expedix/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPatient),
      });

      const data = await response.json();
      
      if (data.success) {
        const createdPatient = data.data;
        setSelectedPatient(createdPatient);
        setAppointmentData(prev => ({ ...prev, patientId: createdPatient.id }));
        setShowNewPatientForm(false);
        setCurrentStep('datetime');
        alert('Paciente registrado exitosamente');
      } else {
        alert('Error al registrar paciente: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Error al registrar paciente');
    } finally {
      setProcessing(false);
    }
  };

  const scheduleAppointment = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch(`/api/frontdesk/appointments/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Cita agendada exitosamente');
        resetForm();
        onAppointmentScheduled();
      } else {
        alert('Error al agendar cita: ' + data.message);
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      alert('Error al agendar cita');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('patient');
    setSelectedPatient(null);
    setSearchTerm('');
    setSelectedDate('');
    setAvailableSlots([]);
    setAppointmentData({
      patientId: '',
      date: '',
      time: '',
      type: 'consultation',
      duration: 60,
      notes: '',
      reminderEnabled: true
    });
    setShowNewPatientForm(false);
  };

  const renderPatientStep = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Paciente</h4>
        
        <div className="flex space-x-2 mb-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Buscar paciente por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <Button
            onClick={() => setShowNewPatientForm(true)}
            variant="outline"
            className="whitespace-nowrap"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Paciente
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-gray-600">Buscando...</span>
          </div>
        )}

        {patients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                className="p-4 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name || ''}
                    </div>
                    <div className="text-sm text-gray-600">{patient.cell_phone}</div>
                    {patient.email && (
                      <div className="text-sm text-gray-500">{patient.email}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Patient Form Modal */}
      {showNewPatientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-lg font-semibold">Nuevo Paciente</h5>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewPatientForm(false)}
              >
                Cancelar
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <Input
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido Paterno *
                  </label>
                  <Input
                    value={newPatient.paternalLastName}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, paternalLastName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Materno
                </label>
                <Input
                  value={newPatient.maternalLastName}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, maternalLastName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <Input
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <Input
                    type="date"
                    value={newPatient.dateOfBirth}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Género *
                  </label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="masculine">Masculino</option>
                    <option value="feminine">Femenino</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={createNewPatient}
                disabled={processing || !newPatient.firstName || !newPatient.paternalLastName || !newPatient.phone}
                className="w-full"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Paciente'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const renderDateTimeStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">Fecha y Hora</h4>
        <Button variant="outline" size="sm" onClick={() => setCurrentStep('patient')}>
          Cambiar Paciente
        </Button>
      </div>

      {selectedPatient && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <div className="font-medium text-blue-900">
                {selectedPatient.first_name} {selectedPatient.paternal_last_name}
              </div>
              <div className="text-sm text-blue-700">{selectedPatient.cell_phone}</div>
            </div>
          </div>
        </Card>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Fecha
        </label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecciona una fecha</option>
          {getDateOptions().map((date) => (
            <option key={date.value} value={date.value}>
              {date.label}
            </option>
          ))}
        </select>
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horarios Disponibles
          </label>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-gray-600">Cargando horarios...</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    slot.available
                      ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                      : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium">{slot.time}</div>
                  {!slot.available && slot.patientName && (
                    <div className="text-xs mt-1">Ocupado</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">Detalles de la Cita</h4>
        <Button variant="outline" size="sm" onClick={() => setCurrentStep('datetime')}>
          Cambiar Fecha/Hora
        </Button>
      </div>

      {/* Summary */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="space-y-2">
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 text-green-600 mr-2" />
            <span className="font-medium text-green-900">
              {selectedPatient?.first_name} {selectedPatient?.paternal_last_name}
            </span>
          </div>
          <div className="flex items-center">
            <CalendarDaysIcon className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-green-800">
              {new Date(appointmentData.date).toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-green-800">{appointmentData.time}</span>
          </div>
        </div>
      </Card>

      {/* Appointment Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Cita
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {appointmentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              className={`p-4 text-left rounded-lg border ${
                appointmentData.type === type.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{type.name}</div>
              <div className="text-sm text-gray-600">{type.duration} min • ${type.cost}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas (opcional)
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Motivo de la cita, síntomas, etc..."
          value={appointmentData.notes}
          onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      {/* Reminder */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="reminder"
          checked={appointmentData.reminderEnabled}
          onChange={(e) => setAppointmentData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="reminder" className="ml-2 text-sm text-gray-700">
          Enviar recordatorio por WhatsApp
        </label>
      </div>

      <div className="flex space-x-3">
        <Button variant="outline" onClick={() => setCurrentStep('datetime')}>
          Atrás
        </Button>
        <Button
          onClick={scheduleAppointment}
          disabled={processing}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {processing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Agendando...
            </>
          ) : (
            <>
              <CalendarDaysIcon className="h-4 w-4 mr-2" />
              Confirmar Cita
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <CalendarDaysIcon className="h-6 w-6 mr-2 text-purple-600" />
          Agendar Cita Rápida
        </h3>
        <p className="text-gray-600 mt-1">
          Programa citas de manera rápida y eficiente
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { key: 'patient', name: 'Paciente', icon: UserIcon },
          { key: 'datetime', name: 'Fecha y Hora', icon: CalendarDaysIcon },
          { key: 'details', name: 'Detalles', icon: CheckCircleIcon }
        ].map((step, index) => {
          const IconComponent = step.icon;
          const isActive = currentStep === step.key;
          const isCompleted = 
            (step.key === 'patient' && selectedPatient) ||
            (step.key === 'datetime' && appointmentData.time) ||
            (step.key === 'details' && currentStep === 'details');

          return (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                isActive ? 'bg-purple-600 text-white' :
                isCompleted ? 'bg-green-600 text-white' :
                'bg-gray-300 text-gray-600'
              }`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                isActive ? 'text-purple-600' :
                isCompleted ? 'text-green-600' :
                'text-gray-500'
              }`}>
                {step.name}
              </span>
              {index < 2 && (
                <div className={`w-20 h-px mx-4 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {currentStep === 'patient' && renderPatientStep()}
      {currentStep === 'datetime' && renderDateTimeStep()}
      {currentStep === 'details' && renderDetailsStep()}
    </div>
  );
}