'use client';

import { useState, useEffect } from 'react';
import { agendaApi, WaitingListEntry, Patient, AvailableSlot } from '../../lib/api/agenda';
import { 
  ClockIcon, 
  UserIcon, 
  PhoneIcon, 
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  BellIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';


interface WaitingListProps {
  onScheduleAppointment: (entry: WaitingListEntry, slot: AvailableSlot) => void;
}

export default function WaitingList({ onScheduleAppointment }: WaitingListProps) {
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [filteredList, setFilteredList] = useState<WaitingListEntry[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'notifications'>('priority');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showAvailableSlots, setShowAvailableSlots] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar datos del API
  useEffect(() => {
    loadWaitingList();
    loadAvailableSlots();
  }, []);

  const loadWaitingList = async () => {
    try {
      setLoading(true);
      const response = await agendaApi.getWaitingList();
      if (response.success && response.data) {
        setWaitingList(response.data);
      }
    } catch (error) {
      console.error('Error cargando lista de espera:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const response = await agendaApi.getAvailableSlots();
      if (response.success && response.data) {
        setAvailableSlots(response.data);
      }
    } catch (error) {
      console.error('Error cargando espacios disponibles:', error);
    }
  };

  // Filtrar y ordenar lista de espera
  useEffect(() => {
    let filtered = waitingList;

    // Filtro por prioridad
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(entry => entry.priority === priorityFilter);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.appointmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.patient?.phone.includes(searchTerm)
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          // Si tienen la misma prioridad, ordenar por fecha de adición
          return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        
        case 'date':
          return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        
        case 'notifications':
          return 0; // Sin campo notificationsSent en la API actual
        
        default:
          return 0;
      }
    });

    setFilteredList(filtered);
  }, [waitingList, searchTerm, priorityFilter, sortBy]);

  const getPriorityColor = (priority: WaitingListEntry['priority']) => {
    switch (priority) {
      case 'alta':
        return {
          bg: 'var(--accent-100)',
          text: 'var(--accent-700)',
          border: 'var(--accent-500)',
          label: 'Alta'
        };
      case 'media':
        return {
          bg: '#fef3c7',
          text: '#d97706',
          border: '#f59e0b',
          label: 'Media'
        };
      case 'baja':
        return {
          bg: 'var(--secondary-100)',
          text: 'var(--secondary-700)',
          border: 'var(--secondary-500)',
          label: 'Baja'
        };
    }
  };

  const getStatusColor = (status: WaitingListEntry['status']) => {
    switch (status) {
      case 'waiting':
        return {
          bg: 'var(--primary-100)',
          text: 'var(--primary-700)',
          label: 'En espera'
        };
      case 'contacted':
        return {
          bg: '#fef3c7',
          text: '#d97706',
          label: 'Contactado'
        };
      case 'scheduled':
        return {
          bg: 'var(--secondary-100)',
          text: 'var(--secondary-700)',
          label: 'Agendado'
        };
      case 'expired':
        return {
          bg: 'var(--neutral-100)',
          text: 'var(--neutral-600)',
          label: 'Expirado'
        };
    }
  };

  const updateEntryStatus = async (entryId: string, newStatus: WaitingListEntry['status']) => {
    try {
      const response = await agendaApi.updateWaitingListEntry(entryId, { status: newStatus });
      if (response.success) {
        setWaitingList(prev =>
          prev.map(entry =>
            entry.id === entryId ? { ...entry, status: newStatus } : entry
          )
        );
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const sendNotification = async (entryId: string) => {
    try {
      // En este caso, solo actualizamos el estado localmente
      // En el futuro se puede implementar un endpoint específico para notificaciones
      await updateEntryStatus(entryId, 'contacted');
      alert('Notificación enviada al paciente');
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  };

  const getMatchingSlots = (entry: WaitingListEntry): AvailableSlot[] => {
    return availableSlots.filter(slot => {
      const matchesDate = entry.preferredDates.includes(slot.date);
      const matchesTime = entry.preferredTimes.includes(slot.time);
      return matchesDate && matchesTime;
    });
  };

  const autoAssignSlots = () => {
    // Algoritmo de asignación automática por prioridad
    const sortedEntries = [...filteredList].sort((a, b) => {
      const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
    });

    const assignments: { entry: WaitingListEntry; slot: AvailableSlot }[] = [];
    const usedSlots = new Set<string>();

    sortedEntries.forEach(entry => {
      if (entry.status !== 'waiting') return;
      
      const matchingSlots = getMatchingSlots(entry).filter(slot => 
        !usedSlots.has(`${slot.date}-${slot.time}`)
      );

      if (matchingSlots.length > 0) {
        const slot = matchingSlots[0]; // Tomar el primer slot disponible
        assignments.push({ entry, slot });
        usedSlots.add(`${slot.date}-${slot.time}`);
      }
    });

    return assignments;
  };

  const daysSinceAdded = (dateString: string) => {
    const addedDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - addedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div 
        className="bg-white rounded-xl p-6 border"
        style={{ 
          border: '1px solid rgba(8, 145, 178, 0.1)',
          boxShadow: 'var(--shadow)'
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 
              className="text-xl font-bold mb-2"
              style={{ 
                color: 'var(--dark-green)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Lista de Espera
            </h2>
            <p 
              className="text-sm"
              style={{ color: 'var(--neutral-600)' }}
            >
              Gestión de pacientes en lista de espera con sistema de prioridades
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAvailableSlots(true)}
              className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:-translate-y-1"
              style={{ 
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                boxShadow: '0 8px 20px -5px rgba(8, 145, 178, 0.3)'
              }}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Espacios Disponibles ({availableSlots.length})
            </button>
            <button
              onClick={() => setShowNewEntry(true)}
              className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:-translate-y-1"
              style={{ 
                background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))',
                boxShadow: '0 8px 20px -5px rgba(41, 169, 140, 0.3)'
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar a Lista
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y controles */}
      <div 
        className="bg-white rounded-xl p-6 border"
        style={{ 
          border: '1px solid rgba(8, 145, 178, 0.1)',
          boxShadow: 'var(--shadow)'
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Búsqueda */}
          <div className="flex-1 lg:max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon 
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: 'var(--primary-500)' }}
              />
              <input
                type="text"
                placeholder="Buscar por paciente o tipo de cita..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm rounded-lg transition-all duration-200 focus:outline-none"
                style={{ 
                  border: '2px solid var(--neutral-200)',
                  fontFamily: 'var(--font-primary)',
                  borderRadius: 'var(--radius-lg)'
                }}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4" style={{ color: 'var(--neutral-600)' }} />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-sm rounded-lg border-2 px-3 py-2 focus:outline-none"
                style={{ 
                  border: '2px solid var(--neutral-200)',
                  fontFamily: 'var(--font-primary)'
                }}
              >
                <option value="all">Todas las prioridades</option>
                <option value="alta">Prioridad Alta</option>
                <option value="media">Prioridad Media</option>
                <option value="baja">Prioridad Baja</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm rounded-lg border-2 px-3 py-2 focus:outline-none"
              style={{ 
                border: '2px solid var(--neutral-200)',
                fontFamily: 'var(--font-primary)'
              }}
            >
              <option value="priority">Ordenar por prioridad</option>
              <option value="date">Ordenar por fecha</option>
              <option value="notifications">Ordenar por notificaciones</option>
            </select>

            <button
              onClick={() => {
                const assignments = autoAssignSlots();
                assignments.forEach(({ entry, slot }) => {
                  onScheduleAppointment(entry, slot);
                  updateEntryStatus(entry.id, 'scheduled');
                });
                alert(`Se asignaron automáticamente ${assignments.length} citas`);
              }}
              className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:-translate-y-1"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                boxShadow: '0 8px 20px -5px rgba(236, 115, 103, 0.3)'
              }}
            >
              <BellIcon className="h-4 w-4 mr-2" />
              Asignar Automático
            </button>
          </div>
        </div>
      </div>

      {/* Lista de espera */}
      <div 
        className="bg-white rounded-xl border overflow-hidden"
        style={{ 
          border: '1px solid rgba(8, 145, 178, 0.1)',
          boxShadow: 'var(--shadow)'
        }}
      >
        {filteredList.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--neutral-200)' }}>
            {filteredList.map((entry) => {
              const priorityInfo = getPriorityColor(entry.priority);
              const statusInfo = getStatusColor(entry.status);
              const matchingSlots = getMatchingSlots(entry);
              const daysWaiting = daysSinceAdded(entry.addedDate);

              return (
                <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4" style={{ color: 'var(--primary-500)' }} />
                          <span 
                            className="font-medium"
                            style={{ color: 'var(--dark-green)' }}
                          >
                            {entry.patient?.name || 'N/A'}
                          </span>
                        </div>
                        
                        <span 
                          className="text-xs px-2 py-1 rounded-full font-medium border"
                          style={{
                            backgroundColor: priorityInfo.bg,
                            color: priorityInfo.text,
                            borderColor: priorityInfo.border
                          }}
                        >
                          Prioridad {priorityInfo.label}
                        </span>

                        <span 
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.text
                          }}
                        >
                          {statusInfo.label}
                        </span>

                        {daysWaiting > 7 && (
                          <div className="flex items-center space-x-1">
                            <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
                            <span className="text-xs text-orange-600 font-medium">
                              {daysWaiting} días esperando
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Información del paciente */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <PhoneIcon className="h-4 w-4" style={{ color: 'var(--neutral-500)' }} />
                            <span 
                              className="text-sm"
                              style={{ color: 'var(--neutral-600)' }}
                            >
                              {entry.patient?.phone || 'N/A'}
                            </span>
                          </div>
                          <div 
                            className="text-sm font-medium"
                            style={{ color: 'var(--dark-green)' }}
                          >
                            {entry.appointmentType}
                          </div>
                        </div>

                        <div>
                          <div 
                            className="text-xs font-medium mb-1"
                            style={{ color: 'var(--neutral-600)' }}
                          >
                            Fechas preferidas:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {entry.preferredDates.slice(0, 3).map((date) => (
                              <span 
                                key={date}
                                className="text-xs px-2 py-1 rounded"
                                style={{ 
                                  backgroundColor: 'var(--primary-100)',
                                  color: 'var(--primary-700)'
                                }}
                              >
                                {new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </span>
                            ))}
                            {entry.preferredDates.length > 3 && (
                              <span 
                                className="text-xs px-2 py-1 rounded"
                                style={{ 
                                  backgroundColor: 'var(--neutral-100)',
                                  color: 'var(--neutral-600)'
                                }}
                              >
                                +{entry.preferredDates.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div 
                            className="text-xs font-medium mb-1"
                            style={{ color: 'var(--neutral-600)' }}
                          >
                            Horarios preferidos:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {entry.preferredTimes.slice(0, 3).map((time) => (
                              <span 
                                key={time}
                                className="text-xs px-2 py-1 rounded"
                                style={{ 
                                  backgroundColor: 'var(--secondary-100)',
                                  color: 'var(--secondary-700)'
                                }}
                              >
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notas y estadísticas */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {entry.notes && (
                          <div>
                            <div 
                              className="text-xs font-medium mb-1"
                              style={{ color: 'var(--neutral-600)' }}
                            >
                              Notas:
                            </div>
                            <p 
                              className="text-sm"
                              style={{ color: 'var(--neutral-700)' }}
                            >
                              {entry.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-xs" style={{ color: 'var(--neutral-500)' }}>
                          <span>Agregado: {new Date(entry.addedDate).toLocaleDateString('es-ES')}</span>
                          <span>Notificaciones: {entry.notificationsSent}</span>
                          {matchingSlots.length > 0 && (
                            <span 
                              className="px-2 py-1 rounded font-medium"
                              style={{ 
                                backgroundColor: 'var(--secondary-100)',
                                color: 'var(--secondary-700)'
                              }}
                            >
                              {matchingSlots.length} slot{matchingSlots.length !== 1 ? 's' : ''} disponible{matchingSlots.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      {matchingSlots.length > 0 && (
                        <div className="space-y-1">
                          {matchingSlots.slice(0, 2).map((slot) => (
                            <button
                              key={`${slot.date}-${slot.time}`}
                              onClick={() => {
                                onScheduleAppointment(entry, slot);
                                updateEntryStatus(entry.id, 'scheduled');
                              }}
                              className="text-xs px-3 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                              style={{ 
                                background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))',
                                color: 'white',
                                boxShadow: '0 4px 8px -2px rgba(41, 169, 140, 0.3)'
                              }}
                            >
                              Agendar {new Date(slot.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} {slot.time}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => sendNotification(entry.id)}
                          className="p-2 rounded-lg transition-all duration-200 hover:bg-blue-100"
                          title="Enviar notificación"
                        >
                          <BellIcon className="h-4 w-4 text-blue-600" />
                        </button>
                        
                        {entry.status === 'waiting' && (
                          <>
                            <button
                              onClick={() => updateEntryStatus(entry.id, 'contacted')}
                              className="p-2 rounded-lg transition-all duration-200 hover:bg-green-100"
                              title="Marcar como contactado"
                            >
                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            </button>
                            <button
                              onClick={() => updateEntryStatus(entry.id, 'expired')}
                              className="p-2 rounded-lg transition-all duration-200 hover:bg-red-100"
                              title="Marcar como expirado"
                            >
                              <XCircleIcon className="h-4 w-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ClockIcon 
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: 'var(--neutral-300)' }}
            />
            <h3 
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--neutral-600)' }}
            >
              No hay pacientes en lista de espera
            </h3>
            <p 
              className="text-sm mb-4"
              style={{ color: 'var(--neutral-500)' }}
            >
              {searchTerm || priorityFilter !== 'all' 
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Los pacientes aparecerán aquí cuando se agreguen a la lista de espera'
              }
            </p>
          </div>
        )}
      </div>

      {/* Resumen */}
      {filteredList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            className="bg-white rounded-xl p-4 border text-center"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: 'var(--accent-600)' }}
            >
              {filteredList.filter(e => e.priority === 'alta').length}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--neutral-600)' }}
            >
              Prioridad Alta
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 border text-center"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: '#d97706' }}
            >
              {filteredList.filter(e => e.priority === 'media').length}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--neutral-600)' }}
            >
              Prioridad Media
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 border text-center"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: 'var(--secondary-600)' }}
            >
              {filteredList.filter(e => e.priority === 'baja').length}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--neutral-600)' }}
            >
              Prioridad Baja
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 border text-center"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: 'var(--primary-600)' }}
            >
              {availableSlots.length}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--neutral-600)' }}
            >
              Espacios Disponibles
            </div>
          </div>
        </div>
      )}
    </div>
  );
}