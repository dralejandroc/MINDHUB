'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  UserIcon, 
  PhoneIcon, 
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Appointment {
  id: string;
  patient: Patient;
  date: string;
  time: string;
  duration: number;
  type: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  createdAt: string;
}

interface AppointmentListProps {
  selectedDate: Date;
  onNewAppointment: (date?: Date, time?: string) => void;
}

export default function AppointmentList({ selectedDate, onNewAppointment }: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  // Cargar citas reales de la base de datos
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        console.log('🔄 Loading appointments for list view...');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/agenda/appointments`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Appointments loaded:', data);
          
          if (data.success && data.data) {
            // Transform appointments to match our interface
            const transformedAppointments: Appointment[] = data.data.map((apt: any) => ({
              id: apt.id,
              patient: {
                id: apt.patientId,
                name: apt.patient?.name || 'Paciente desconocido',
                phone: apt.patient?.phone || 'Sin teléfono',
                email: apt.patient?.email || 'Sin email'
              },
              date: apt.date,
              time: apt.time,
              duration: apt.duration || 60,
              type: apt.type,
              notes: apt.notes || '',
              status: apt.status as any,
              createdAt: apt.createdAt || new Date().toISOString()
            }));
            
            setAppointments(transformedAppointments);
          }
        } else {
          console.error('❌ Error fetching appointments:', response.status);
          // Fallback to empty array
          setAppointments([]);
        }
      } catch (error) {
        console.error('❌ Network error fetching appointments:', error);
        setAppointments([]);
      }
    };

    loadAppointments();
  }, []);

  // Backup mock data for development (commented out)
  /*
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        patient: {
          id: 'p1',
          name: 'María González Pérez',
          phone: '+52 55 1234-5678',
          email: 'maria@email.com'
        },
        date: '2025-07-20',
        time: '09:00',
        duration: 60,
        type: 'Consulta inicial',
        notes: 'Primera consulta por ansiedad',
        status: 'confirmed',
        createdAt: '2025-07-15T10:00:00Z'
      },
      {
        id: '2',
        patient: {
          id: 'p2',
          name: 'Carlos Rodríguez Silva',
          phone: '+52 55 9876-5432',
          email: 'carlos@email.com'
        },
        date: '2025-07-20',
        time: '10:30',
        duration: 45,
        type: 'Seguimiento',
        notes: 'Control de medicación',
        status: 'scheduled',
        createdAt: '2025-07-18T14:30:00Z'
      },
      {
        id: '3',
        patient: {
          id: 'p3',
          name: 'Ana Martínez López',
          phone: '+52 55 5555-0123',
          email: 'ana@email.com'
        },
        date: '2025-07-20',
        time: '15:00',
        duration: 60,
        type: 'Evaluación psicológica',
        status: 'confirmed',
        createdAt: '2025-07-17T09:15:00Z'
      },
      {
        id: '4',
        patient: {
          id: 'p4',
          name: 'Pedro López García',
          phone: '+52 55 7777-8888',
          email: 'pedro@email.com'
        },
        date: '2025-07-21',
        time: '11:00',
        duration: 30,
        type: 'Control',
        status: 'scheduled',
        createdAt: '2025-07-19T16:45:00Z'
      },
      {
        id: '5',
        patient: {
          id: 'p5',
          name: 'Sofía García Morales',
          phone: '+52 55 3333-4444',
          email: 'sofia@email.com'
        },
        date: '2025-07-19',
        time: '14:00',
        duration: 90,
        type: 'Terapia de pareja',
        status: 'completed',
        createdAt: '2025-07-10T11:20:00Z'
      },
      {
        id: '6',
        patient: {
          id: 'p6',
          name: 'Roberto Fernández Ruiz',
          phone: '+52 55 2222-1111',
          email: 'roberto@email.com'
        },
        date: '2025-07-18',
        time: '16:30',
        duration: 45,
        type: 'Consulta',
        status: 'no-show',
        createdAt: '2025-07-15T13:10:00Z'
      }
    ];
    setAppointments(mockAppointments);
  }, []);
  */

  // Filtrar citas
  useEffect(() => {
    let filtered = appointments;

    // Filtro por rango de fechas
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    switch (dateRange) {
      case 'today':
        filtered = filtered.filter(app => app.date === today.toISOString().split('T')[0]);
        break;
      case 'week':
        filtered = filtered.filter(app => {
          const appDate = new Date(app.date);
          return appDate >= today && appDate <= weekFromNow;
        });
        break;
      case 'month':
        filtered = filtered.filter(app => {
          const appDate = new Date(app.date);
          return appDate >= today && appDate <= monthFromNow;
        });
        break;
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.patient.phone.includes(searchTerm)
      );
    }

    // Ordenar por fecha y hora
    filtered.sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`);
      const dateTimeB = new Date(`${b.date} ${b.time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter, dateRange]);

  const updateAppointmentStatus = (appointmentId: string, newStatus: Appointment['status']) => {
    setAppointments(prev =>
      prev.map(app =>
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
    );
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'var(--secondary-100)',
          text: 'var(--secondary-700)',
          label: 'Confirmada'
        };
      case 'scheduled':
        return {
          bg: 'var(--primary-100)',
          text: 'var(--primary-700)',
          label: 'Programada'
        };
      case 'completed':
        return {
          bg: '#dcfce7',
          text: '#166534',
          label: 'Completada'
        };
      case 'cancelled':
        return {
          bg: 'var(--accent-100)',
          text: 'var(--accent-700)',
          label: 'Cancelada'
        };
      case 'no-show':
        return {
          bg: '#fef3c7',
          text: '#d97706',
          label: 'No asistió'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles y filtros */}
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
                placeholder="Buscar por paciente, tipo de cita o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm rounded-lg transition-all duration-200 focus:outline-none"
                style={{ 
                  border: '2px solid var(--neutral-200)',
                  fontFamily: 'var(--font-primary)',
                  borderRadius: 'var(--radius-lg)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-500)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(8, 145, 178, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--neutral-200)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4" style={{ color: 'var(--neutral-600)' }} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="text-sm rounded-lg border-2 px-3 py-2 focus:outline-none"
                style={{ 
                  border: '2px solid var(--neutral-200)',
                  fontFamily: 'var(--font-primary)'
                }}
              >
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="all">Todas</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm rounded-lg border-2 px-3 py-2 focus:outline-none"
              style={{ 
                border: '2px solid var(--neutral-200)',
                fontFamily: 'var(--font-primary)'
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="scheduled">Programadas</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="no-show">No asistió</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      <div 
        className="bg-white rounded-xl border overflow-hidden"
        style={{ 
          border: '1px solid rgba(8, 145, 178, 0.1)',
          boxShadow: 'var(--shadow)'
        }}
      >
        {filteredAppointments.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--neutral-200)' }}>
            {filteredAppointments.map((appointment) => {
              const statusInfo = getStatusColor(appointment.status);
              return (
                <div key={appointment.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between gap-4">
                    {/* Información compacta de la cita */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Tiempo y estado */}
                      <div className="flex flex-col items-center min-w-0">
                        <div className="text-lg font-bold text-gray-900">
                          {appointment.time}
                        </div>
                        <div className="text-xs text-gray-500">
                          {appointment.duration}min
                        </div>
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full font-medium mt-1"
                          style={{
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.text
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Información del paciente */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {appointment.patient.name}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {appointment.type}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {appointment.patient.phone}
                        </div>
                        {appointment.notes && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            📝 {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción más evidentes */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {appointment.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200"
                          >
                            ✓ Confirmar
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors duration-200"
                          >
                            ✕ Cancelar
                          </button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors duration-200"
                        >
                          ✓ Completar
                        </button>
                      )}
                      <button
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                        title="Cambiar horario"
                      >
                        🕒 Cambiar
                      </button>
                      <button
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                        title="Agregar nota"
                      >
                        📝 Nota
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarIcon 
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: 'var(--neutral-300)' }}
            />
            <h3 
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--neutral-600)' }}
            >
              No se encontraron citas
            </h3>
            <p 
              className="text-sm mb-4"
              style={{ color: 'var(--neutral-500)' }}
            >
              {searchTerm || statusFilter !== 'all' 
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'No hay citas programadas para el período seleccionado'
              }
            </p>
            <button
              onClick={() => onNewAppointment(selectedDate)}
              className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:-translate-y-1"
              style={{ 
                background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))',
                boxShadow: '0 8px 20px -5px rgba(41, 169, 140, 0.3)'
              }}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Nueva Cita
            </button>
          </div>
        )}
      </div>

      {/* Resumen de citas */}
      {filteredAppointments.length > 0 && (
        <div 
          className="bg-white rounded-xl p-4 border"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--neutral-600)' }}>
              Mostrando {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--neutral-600)' }}>
              Total de horas: {filteredAppointments.reduce((total, app) => total + app.duration, 0)} min
            </span>
          </div>
        </div>
      )}
    </div>
  );
}