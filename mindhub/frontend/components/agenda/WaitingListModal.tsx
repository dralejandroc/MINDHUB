'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  UserIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface WaitingPatient {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  email: string;
  requestedService: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  dateAdded: string;
  preferredDays: string[];
  preferredTimes: string[];
  notes: string;
  position: number;
}

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  cell_phone?: string;
  phone?: string;
  email?: string;
}

interface WaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignPatient: (patient: WaitingPatient) => void;
}

export default function WaitingListModal({ isOpen, onClose, onAssignPatient }: WaitingListModalProps) {
  const [waitingList, setWaitingList] = useState<WaitingPatient[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Formulario para agregar paciente a lista
  const [newPatient, setNewPatient] = useState({
    patientId: '',
    requestedService: 'Consulta inicial',
    priority: 'normal' as const,
    preferredDays: [] as string[],
    preferredTimes: [] as string[],
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadWaitingList();
      loadPatients();
    }
  }, [isOpen]);

  const loadPatients = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_EXPEDIX_API}/api/v1/expedix/patients`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.log('Patients API not available');
    }
  };

  const loadWaitingList = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/agenda/waiting-list`);
      if (response.ok) {
        const data = await response.json();
        setWaitingList(data.patients || []);
      } else {
        // Si el endpoint no existe, usar datos temporales
        console.warn('Waiting list API not available, using temporary data');
        throw new Error('API not available');
      }
    } catch (error) {
      console.log('Loading temporary waiting list data...');
      // Datos temporales para desarrollo
      // Usar una lista vacía por defecto cuando no hay API
      setWaitingList([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'normal': return 'Normal';
      case 'low': return 'Baja';
      default: return 'Normal';
    }
  };

  const getDaysWaiting = (dateAdded: string) => {
    const added = new Date(dateAdded);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - added.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMovePriority = async (patientId: string, direction: 'up' | 'down') => {
    const index = waitingList.findIndex(p => p.id === patientId);
    if (index === -1) return;

    const newList = [...waitingList];
    if (direction === 'up' && index > 0) {
      [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
    } else if (direction === 'down' && index < newList.length - 1) {
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    }

    // Actualizar posiciones
    newList.forEach((patient, idx) => {
      patient.position = idx + 1;
    });

    setWaitingList(newList);
    
    // Guardar en API
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/agenda/waiting-list/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients: newList })
      });
      if (!response.ok) {
        console.log('Order updated locally (API not available)');
      }
    } catch (error) {
      console.log('Order updated locally (API not available)');
    }
  };

  const handleRemoveFromList = async (patientId: string) => {
    if (!confirm('¿Está seguro de eliminar este paciente de la lista de espera?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/agenda/waiting-list/${patientId}`, {
        method: 'DELETE'
      });
      setWaitingList(waitingList.filter(p => p.id !== patientId));
      if (!response.ok) {
        console.log('Patient removed locally (API not available)');
      }
    } catch (error) {
      setWaitingList(waitingList.filter(p => p.id !== patientId));
      console.log('Patient removed locally (API not available)');
    }
  };

  const handleAddToList = async () => {
    if (!selectedPatient) {
      alert('Por favor seleccione un paciente');
      return;
    }

    try {
      const waitingPatientData = {
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.first_name} ${selectedPatient.paternal_last_name} ${selectedPatient.maternal_last_name}`,
        phone: selectedPatient.cell_phone || selectedPatient.phone || '',
        email: selectedPatient.email || '',
        ...newPatient,
        dateAdded: new Date().toISOString(),
        position: waitingList.length + 1
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/agenda/waiting-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waitingPatientData)
      });

      if (response.ok) {
        loadWaitingList();
      } else {
        console.log('Patient added locally (API not available)');
        // Agregar localmente
        const localPatient = {
          id: Date.now().toString(),
          ...waitingPatientData
        };
        setWaitingList([...waitingList, localPatient]);
      }
      
      // Reset form
      setShowAddForm(false);
      setSelectedPatient(null);
      setPatientSearchTerm('');
      setNewPatient({
        patientId: '',
        requestedService: 'Consulta inicial',
        priority: 'normal',
        preferredDays: [],
        preferredTimes: [],
        notes: ''
      });
    } catch (error) {
      console.log('Patient added locally (API not available)');
      // Agregar localmente
      const waitingPatientData = {
        id: Date.now().toString(),
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.first_name} ${selectedPatient.paternal_last_name} ${selectedPatient.maternal_last_name}`,
        phone: selectedPatient.cell_phone || selectedPatient.phone || '',
        email: selectedPatient.email || '',
        ...newPatient,
        dateAdded: new Date().toISOString(),
        position: waitingList.length + 1
      };
      setWaitingList([...waitingList, waitingPatientData]);
      
      // Reset form
      setShowAddForm(false);
      setSelectedPatient(null);
      setPatientSearchTerm('');
      setNewPatient({
        patientId: '',
        requestedService: 'Consulta inicial',
        priority: 'normal',
        preferredDays: [],
        preferredTimes: [],
        notes: ''
      });
    }
  };

  if (!isOpen) return null;

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const timeSlots = ['09:00-12:00', '12:00-14:00', '14:00-17:00', '17:00-20:00'];
  const services = ['Consulta inicial', 'Seguimiento', 'Evaluación psicológica', 'Terapia individual', 'Terapia de pareja', 'Terapia familiar'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lista de Espera</h2>
            <p className="text-sm text-gray-600 mt-1">
              {waitingList.length} pacientes en espera • Ordenados por prioridad
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {!showAddForm && (
            <div className="mb-4">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Agregar a Lista de Espera
              </Button>
            </div>
          )}

          {showAddForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Agregar Paciente a Lista de Espera</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Paciente
                </label>
                {selectedPatient ? (
                  <div className="p-3 border rounded-lg bg-blue-50 border-blue-200 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-900">
                        {selectedPatient.first_name} {selectedPatient.paternal_last_name} {selectedPatient.maternal_last_name}
                      </div>
                      <div className="text-sm text-blue-600">
                        {selectedPatient.cell_phone || selectedPatient.phone || 'Sin teléfono'} • {selectedPatient.email || 'Sin email'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setNewPatient({ ...newPatient, patientId: '' });
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Buscar por nombre..."
                    />
                    {patientSearchTerm && (
                      <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                        {patients
                          .filter(p => 
                            `${p.first_name} ${p.paternal_last_name} ${p.maternal_last_name}`
                              .toLowerCase()
                              .includes(patientSearchTerm.toLowerCase())
                          )
                          .slice(0, 5)
                          .map((patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setNewPatient({ ...newPatient, patientId: patient.id });
                                setPatientSearchTerm('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-b-0"
                            >
                              <div className="font-medium">
                                {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {patient.cell_phone || patient.phone || 'Sin teléfono'} • {patient.email || 'Sin email'}
                              </div>
                            </button>
                          ))}
                        {patients.filter(p => 
                          `${p.first_name} ${p.paternal_last_name} ${p.maternal_last_name}`
                            .toLowerCase()
                            .includes(patientSearchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No se encontraron pacientes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio solicitado
                  </label>
                  <select
                    value={newPatient.requestedService}
                    onChange={(e) => setNewPatient({ ...newPatient, requestedService: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {services.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newPatient.priority}
                    onChange={(e) => setNewPatient({ ...newPatient, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="urgent">Urgente</option>
                    <option value="high">Alta</option>
                    <option value="normal">Normal</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Días preferidos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPatient.preferredDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPatient({ ...newPatient, preferredDays: [...newPatient.preferredDays, day] });
                            } else {
                              setNewPatient({ ...newPatient, preferredDays: newPatient.preferredDays.filter(d => d !== day) });
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horarios preferidos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map(slot => (
                      <label key={slot} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPatient.preferredTimes.includes(slot)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPatient({ ...newPatient, preferredTimes: [...newPatient.preferredTimes, slot] });
                            } else {
                              setNewPatient({ ...newPatient, preferredTimes: newPatient.preferredTimes.filter(t => t !== slot) });
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="text-sm">{slot}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={newPatient.notes}
                    onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Información adicional..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddToList}
                  disabled={!selectedPatient}
                  className={`${selectedPatient 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Agregar
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : waitingList.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay pacientes en lista de espera</p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitingList.map((patient, index) => (
                <div
                  key={patient.id}
                  className={`border rounded-lg p-4 ${
                    selectedPatientId === patient.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg font-bold text-gray-400">#{patient.position}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{patient.patientName}</h4>
                          <p className="text-sm text-gray-600">{patient.phone}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(patient.priority)}`}>
                          {getPriorityLabel(patient.priority)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Servicio:</span>
                          <p className="font-medium">{patient.requestedService}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Días preferidos:</span>
                          <p className="font-medium">{patient.preferredDays.join(', ') || 'Cualquier día'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Horarios preferidos:</span>
                          <p className="font-medium">{patient.preferredTimes.join(', ') || 'Cualquier horario'}</p>
                        </div>
                      </div>
                      
                      {patient.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <ExclamationCircleIcon className="h-4 w-4 inline mr-1 text-amber-500" />
                          {patient.notes}
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-500">
                        <CalendarIcon className="h-3 w-3 inline mr-1" />
                        {getDaysWaiting(patient.dateAdded)} días en espera
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleMovePriority(patient.id, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded ${
                          index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMovePriority(patient.id, 'down')}
                        disabled={index === waitingList.length - 1}
                        className={`p-1 rounded ${
                          index === waitingList.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      <Button
                        onClick={() => onAssignPatient(patient)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Asignar
                      </Button>
                      <button
                        onClick={() => handleRemoveFromList(patient.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}