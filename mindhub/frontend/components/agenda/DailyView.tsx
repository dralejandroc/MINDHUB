'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ClockIcon, 
  UserIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  cost: number;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'partial';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

interface DailyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onNewAppointment: () => void;
  onEditAppointment?: (appointment: Appointment) => void;
}

export default function DailyView({ 
  selectedDate, 
  onDateSelect, 
  onNewAppointment,
  onEditAppointment 
}: DailyViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // Mock data - en producción vendría de la API
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        patientName: 'María González',
        patientId: '001',
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        type: 'Consulta inicial',
        cost: 800,
        paymentMethod: 'efectivo',
        paymentStatus: 'paid',
        status: 'confirmed',
        notes: 'Primera consulta, evaluar ansiedad'
      },
      {
        id: '2',
        patientName: 'Carlos Rodríguez',
        patientId: '002',
        startTime: '10:30',
        endTime: '11:15',
        duration: 45,
        type: 'Seguimiento',
        cost: 600,
        paymentStatus: 'pending',
        status: 'scheduled',
        notes: 'Seguimiento de tratamiento para depresión'
      },
      {
        id: '3',
        patientName: 'Ana Martínez',
        patientId: '003',
        startTime: '15:00',
        endTime: '16:30',
        duration: 90,
        type: 'Evaluación psicológica',
        cost: 1200,
        paymentMethod: 'tarjeta',
        paymentStatus: 'paid',
        status: 'confirmed',
        notes: 'Evaluación completa con pruebas'
      }
    ];
    setAppointments(mockAppointments);
  }, [selectedDate]);

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    onDateSelect(newDate);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const getAppointmentAtTime = (time: string) => {
    return appointments.find(apt => apt.startTime === time);
  };

  const handleAppointmentAction = (appointment: Appointment, action: string) => {
    setShowMenu(null);
    
    switch (action) {
      case 'edit':
        if (onEditAppointment) {
          onEditAppointment(appointment);
        }
        break;
      case 'complete':
        // Marcar como completada
        setAppointments(prev => prev.map(apt => 
          apt.id === appointment.id 
            ? { ...apt, status: 'completed' as const }
            : apt
        ));
        break;
      case 'cancel':
        // Cancelar cita
        setAppointments(prev => prev.map(apt => 
          apt.id === appointment.id 
            ? { ...apt, status: 'cancelled' as const }
            : apt
        ));
        break;
      case 'payment':
        // Marcar pago como recibido
        setAppointments(prev => prev.map(apt => 
          apt.id === appointment.id 
            ? { ...apt, paymentStatus: 'paid' as const, paymentMethod: 'efectivo' }
            : apt
        ));
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-red-600';
      case 'partial': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const timeSlots = generateTimeSlots();
  const todayTotal = appointments
    .filter(apt => apt.status !== 'cancelled')
    .reduce((sum, apt) => sum + apt.cost, 0);
  const paidToday = appointments
    .filter(apt => apt.paymentStatus === 'paid')
    .reduce((sum, apt) => sum + apt.cost, 0);

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDay('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-blue-600" />
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedDate.toLocaleDateString('es-MX', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
              <p className="text-sm text-gray-600">
                {appointments.length} citas programadas
              </p>
            </div>
            
            <button
              onClick={() => navigateDay('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-blue-600" />
            </button>
          </div>
          
          <Button onClick={onNewAppointment} className="flex items-center space-x-2">
            <PlusIcon className="h-4 w-4" />
            <span>Nueva Cita</span>
          </Button>
        </div>
        
        {/* Resumen financiero del día */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <BanknotesIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">Total Esperado</p>
                <p className="text-2xl font-bold text-blue-700">${todayTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600">Cobrado</p>
                <p className="text-2xl font-bold text-green-700">${paidToday.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-yellow-600">Pendiente</p>
                <p className="text-2xl font-bold text-yellow-700">${(todayTotal - paidToday).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Vista diaria con horarios */}
      <Card className="p-6">
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {timeSlots.map((timeSlot) => {
            const appointment = getAppointmentAtTime(timeSlot);
            
            return (
              <div key={timeSlot} className="flex items-start">
                {/* Hora */}
                <div className="w-16 flex-shrink-0 text-sm text-gray-500 py-3">
                  {timeSlot}
                </div>
                
                {/* Contenido */}
                <div className="flex-1 border-l-2 border-gray-100 pl-4">
                  {appointment ? (
                    <div className="relative">
                      <div className={`p-4 rounded-lg border-2 ${getStatusColor(appointment.status)} mb-2`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <UserIcon className="h-4 w-4" />
                              <span className="font-semibold">
                                {appointment.patientName}
                              </span>
                              <span className="text-xs bg-white px-2 py-1 rounded">
                                {appointment.type}
                              </span>
                            </div>
                            
                            <div className="text-sm space-y-1">
                              <p>
                                <ClockIcon className="h-3 w-3 inline mr-1" />
                                {appointment.startTime} - {appointment.endTime} ({appointment.duration} min)
                              </p>
                              <p>
                                <BanknotesIcon className="h-3 w-3 inline mr-1" />
                                <span className={getPaymentStatusColor(appointment.paymentStatus)}>
                                  ${appointment.cost} - {appointment.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                                  {appointment.paymentMethod && ` (${appointment.paymentMethod})`}
                                </span>
                              </p>
                              {appointment.notes && (
                                <p className="text-gray-600 text-xs mt-2">
                                  {appointment.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Menú de acciones */}
                          <div className="relative">
                            <button
                              onClick={() => setShowMenu(showMenu === appointment.id ? null : appointment.id)}
                              className="p-1 rounded hover:bg-white/50 transition-colors"
                            >
                              <EllipsisVerticalIcon className="h-4 w-4" />
                            </button>
                            
                            {showMenu === appointment.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleAppointmentAction(appointment, 'edit')}
                                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50"
                                  >
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                    Editar
                                  </button>
                                  
                                  {appointment.status !== 'completed' && (
                                    <button
                                      onClick={() => handleAppointmentAction(appointment, 'complete')}
                                      className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50"
                                    >
                                      <CheckIcon className="h-4 w-4 mr-2" />
                                      Marcar Completada
                                    </button>
                                  )}
                                  
                                  {appointment.paymentStatus === 'pending' && (
                                    <button
                                      onClick={() => handleAppointmentAction(appointment, 'payment')}
                                      className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50"
                                    >
                                      <BanknotesIcon className="h-4 w-4 mr-2" />
                                      Marcar Pagado
                                    </button>
                                  )}
                                  
                                  {appointment.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleAppointmentAction(appointment, 'cancel')}
                                      className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                                    >
                                      <TrashIcon className="h-4 w-4 mr-2" />
                                      Cancelar
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={onNewAppointment}
                      className="w-full p-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 text-sm"
                    >
                      + Agregar cita
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}