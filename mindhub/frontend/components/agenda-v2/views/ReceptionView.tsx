'use client';

import React, { useState, useMemo } from 'react';
import { format, isSameDay, isToday, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PhoneIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CreditCardIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  PrinterIcon,
  DocumentTextIcon,
  MapPinIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { CalendarHeader } from '../shared/CalendarHeader';
import { AppointmentData } from '../shared/AppointmentCard';
import { ScheduleConfig } from '../shared/TimeSlotGrid';

export interface ReceptionViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  appointments: AppointmentData[];
  scheduleConfig: ScheduleConfig;
  licenseType: 'clinic'; // Only available for clinic licenses
  
  // Header props
  onNewAppointment?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  todayStats?: {
    totalAppointments: number;
    confirmed: number;
    pending: number;
    completed: number;
  };
  
  // Loading states
  isLoading?: boolean;
  lastRefresh?: Date;
  
  // Reception-specific handlers
  onCallPatient?: (phone: string, patientName: string) => void;
  onEmailPatient?: (email: string, patientName: string) => void;
  onProcessPayment?: (appointmentId: string, amount: number) => void;
  onPrintReceipt?: (appointmentId: string) => void;
  onSendReminder?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string) => void;
  onConfirmAppointment?: (appointmentId: string, withDeposit: boolean) => void;
  onCancelAppointment?: (appointmentId: string, reason: string) => void;
  
  className?: string;
}

// Extended appointment data with payment and schedule change info
interface ReceptionAppointmentData extends AppointmentData {
  patientPhone?: string;
  patientEmail?: string;
  depositAmount?: number;
  remainingBalance?: number;
  lastPaymentDate?: Date;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'pending';
  hasScheduleChanges?: boolean;
  scheduleChangeHistory?: {
    originalDate: Date;
    newDate: Date;
    reason: string;
    changedBy: string;
    changedAt: Date;
  }[];
  remindersSent?: number;
  lastReminderDate?: Date;
  professionalName?: string;
}

export const ReceptionView: React.FC<ReceptionViewProps> = ({
  currentDate,
  onDateChange,
  appointments,
  scheduleConfig,
  licenseType,
  onNewAppointment,
  onSettings,
  onRefresh,
  onSearch,
  todayStats,
  isLoading = false,
  lastRefresh,
  onCallPatient,
  onEmailPatient,
  onProcessPayment,
  onPrintReceipt,
  onSendReminder,
  onReschedule,
  onConfirmAppointment,
  onCancelAppointment,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'payments' | 'changes' | 'reminders'>('today');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);

  // Handle view changes
  const handleViewChange = (view: 'week' | 'day' | 'month' | 'clinic-global' | 'reception') => {
    console.log('View change requested:', view);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Cast appointments to reception data (in real app, this would come from API)
  const receptionAppointments = appointments.map(apt => ({
    ...apt,
    patientPhone: apt.patientInfo?.phone || '(555) 0000-000',
    patientEmail: apt.patientInfo?.email || 'paciente@email.com',
    depositAmount: apt.paymentStatus === 'deposit' ? 500 : 0,
    remainingBalance: apt.paymentStatus === 'debt' ? 1200 : apt.paymentStatus === 'deposit' ? 700 : 0,
    lastPaymentDate: apt.paymentStatus === 'paid' ? subDays(new Date(), 2) : undefined,
    paymentMethod: apt.paymentStatus === 'paid' ? 'card' : 'pending',
    hasScheduleChanges: Math.random() > 0.7, // Mock data
    scheduleChangeHistory: Math.random() > 0.7 ? [{
      originalDate: subDays(apt.startTime, 2),
      newDate: apt.startTime,
      reason: 'Solicitud del paciente',
      changedBy: 'Recepción',
      changedAt: subDays(new Date(), 1)
    }] : [],
    remindersSent: Math.floor(Math.random() * 3),
    lastReminderDate: apt.status === 'confirmed' ? subDays(new Date(), 1) : undefined,
    professionalName: `Dr. ${Math.random() > 0.5 ? 'García' : 'López'}`
  })) as ReceptionAppointmentData[];

  // Filter appointments by current date
  const todayAppointments = receptionAppointments.filter(apt => 
    isSameDay(apt.startTime, currentDate)
  );

  // Group appointments by different criteria
  const appointmentsByCategory = useMemo(() => {
    return {
      today: todayAppointments,
      payments: receptionAppointments.filter(apt => 
        apt.paymentStatus === 'debt' || apt.paymentStatus === 'deposit' || (apt.remainingBalance && apt.remainingBalance > 0)
      ),
      changes: receptionAppointments.filter(apt => apt.hasScheduleChanges),
      reminders: receptionAppointments.filter(apt => 
        apt.status === 'scheduled' && (!apt.lastReminderDate || apt.remindersSent === 0)
      )
    };
  }, [receptionAppointments, todayAppointments]);

  // Calculate reception statistics
  const receptionStats = useMemo(() => {
    const todayTotal = todayAppointments.length;
    const pendingPayments = appointmentsByCategory.payments.reduce((sum, apt) => sum + (apt.remainingBalance || 0), 0);
    const confirmedToday = todayAppointments.filter(apt => apt.status === 'confirmed').length;
    const needingReminders = appointmentsByCategory.reminders.length;

    return {
      todayTotal,
      confirmedToday,
      pendingPayments,
      needingReminders,
      scheduleChanges: appointmentsByCategory.changes.length
    };
  }, [todayAppointments, appointmentsByCategory]);

  // Get payment status styling
  const getPaymentStatusStyle = (appointment: ReceptionAppointmentData) => {
    if (appointment.paymentStatus === 'paid') {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (appointment.paymentStatus === 'deposit') {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    if (appointment.paymentStatus === 'debt' || (appointment.remainingBalance && appointment.remainingBalance > 0)) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  // Get consultation type icon
  const getConsultationIcon = (type?: string) => {
    switch (type) {
      case 'virtual':
        return <VideoCameraIcon className="w-4 h-4 text-blue-500" />;
      case 'telefonica':
        return <PhoneIcon className="w-4 h-4 text-green-500" />;
      default:
        return <MapPinIcon className="w-4 h-4 text-primary-500" />;
    }
  };

  // Render appointment card for reception
  const renderReceptionCard = (appointment: ReceptionAppointmentData) => (
    <div
      key={appointment.id}
      className={`
        bg-white border rounded-lg p-4 hover:shadow-md transition-shadow
        ${selectedAppointment === appointment.id ? 'ring-2 ring-primary-500 border-primary-300' : 'border-gray-200'}
      `}
      onClick={() => setSelectedAppointment(selectedAppointment === appointment.id ? null : appointment.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
            {appointment.hasScheduleChanges && (
              <ArrowPathIcon className="w-4 h-4 text-orange-500" title="Horario modificado" />
            )}
          </div>
          <p className="text-sm text-gray-600">{appointment.type} • {appointment.professionalName}</p>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
            {getConsultationIcon(appointment.consultationType)}
            <span>{format(appointment.startTime, 'HH:mm')} - {format(appointment.endTime, 'HH:mm')}</span>
            <span>({appointment.duration} min)</span>
          </div>
        </div>
        
        <div className={`
          px-2 py-1 rounded-full text-xs font-medium border
          ${getPaymentStatusStyle(appointment)}
        `}>
          {appointment.paymentStatus === 'paid' && 'Pagado'}
          {appointment.paymentStatus === 'deposit' && `Depósito: $${appointment.depositAmount}`}
          {appointment.paymentStatus === 'debt' && `Debe: $${appointment.remainingBalance}`}
          {appointment.paymentStatus === 'pending' && 'Pendiente'}
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center space-x-2">
          <PhoneIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{appointment.patientPhone}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCallPatient?.(appointment.patientPhone!, appointment.patientName);
            }}
            className="text-green-600 hover:text-green-700 p-1"
            title="Llamar"
          >
            <PhoneIcon className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <EnvelopeIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 truncate">{appointment.patientEmail}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEmailPatient?.(appointment.patientEmail!, appointment.patientName);
            }}
            className="text-blue-600 hover:text-blue-700 p-1"
            title="Email"
          >
            <EnvelopeIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Payment Information */}
      {((appointment.remainingBalance && appointment.remainingBalance > 0) || (appointment.depositAmount && appointment.depositAmount > 0)) && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
            Estado de Pago
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {appointment.depositAmount && appointment.depositAmount > 0 && (
              <div className="text-blue-700">
                Depósito: ${appointment.depositAmount.toFixed(2)}
              </div>
            )}
            {appointment.remainingBalance && appointment.remainingBalance > 0 && (
              <div className="text-red-700">
                Pendiente: ${appointment.remainingBalance.toFixed(2)}
              </div>
            )}
          </div>
          {appointment.lastPaymentDate && (
            <p className="text-xs text-gray-500 mt-1">
              Último pago: {format(appointment.lastPaymentDate, 'dd/MM/yyyy')}
            </p>
          )}
        </div>
      )}

      {/* Schedule Changes */}
      {appointment.hasScheduleChanges && appointment.scheduleChangeHistory && appointment.scheduleChangeHistory.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-3 mb-3">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <ArrowPathIcon className="w-4 h-4 mr-1 text-orange-600" />
            Cambios de Horario
          </h4>
          {appointment.scheduleChangeHistory.map((change, index) => (
            <div key={index} className="text-sm text-gray-700 mb-1">
              <div className="flex items-center space-x-2">
                <span className="line-through text-gray-500">
                  {format(change.originalDate, 'dd/MM HH:mm')}
                </span>
                <ArrowPathIcon className="w-3 h-3 text-orange-500" />
                <span className="font-medium">
                  {format(change.newDate, 'dd/MM HH:mm')}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {change.reason} • {change.changedBy} • {format(change.changedAt, 'dd/MM/yyyy')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {appointment.status === 'scheduled' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfirmAppointment?.(appointment.id, false);
            }}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
          >
            Confirmar
          </button>
        )}
        
        {appointment.remainingBalance && appointment.remainingBalance > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProcessPayment?.(appointment.id, appointment.remainingBalance || 0);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Procesar Pago
          </button>
        )}
        
        {appointment.remindersSent === 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendReminder?.(appointment.id);
            }}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
          >
            Enviar Recordatorio
          </button>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReschedule?.(appointment.id);
          }}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
        >
          Cambiar Horario
        </button>
        
        {appointment.paymentStatus === 'paid' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrintReceipt?.(appointment.id);
            }}
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
          >
            Imprimir Recibo
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewType="reception"
        onDateChange={onDateChange}
        onViewChange={handleViewChange}
        onToday={handleToday}
        licenseType={licenseType}
        canSwitchToClinicViews={true}
        onNewAppointment={onNewAppointment}
        onSettings={onSettings}
        onRefresh={onRefresh}
        onSearch={onSearch}
        todayStats={todayStats}
        isLoading={isLoading}
        lastRefresh={lastRefresh}
      />

      {/* Reception Statistics */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <UserIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Dashboard de Recepción
              </h2>
              <p className="text-sm text-gray-600 capitalize">
                {format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{receptionStats.todayTotal}</div>
            <div className="text-xs text-gray-500">Citas Hoy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{receptionStats.confirmedToday}</div>
            <div className="text-xs text-gray-500">Confirmadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">${receptionStats.pendingPayments.toFixed(0)}</div>
            <div className="text-xs text-gray-500">Pagos Pendientes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{receptionStats.needingReminders}</div>
            <div className="text-xs text-gray-500">Recordatorios</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{receptionStats.scheduleChanges}</div>
            <div className="text-xs text-gray-500">Cambios Recientes</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { key: 'today', label: 'Citas de Hoy', count: appointmentsByCategory.today.length },
              { key: 'payments', label: 'Pagos Pendientes', count: appointmentsByCategory.payments.length },
              { key: 'changes', label: 'Cambios de Horario', count: appointmentsByCategory.changes.length },
              { key: 'reminders', label: 'Recordatorios', count: appointmentsByCategory.reminders.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`
                  flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`
                    px-2 py-1 rounded-full text-xs
                    ${activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-4">
            {appointmentsByCategory[activeTab].map(renderReceptionCard)}
            
            {appointmentsByCategory[activeTab].length === 0 && (
              <div className="text-center py-12">
                <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay elementos en esta categoría
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'today' && 'No hay citas programadas para hoy.'}
                  {activeTab === 'payments' && 'No hay pagos pendientes.'}
                  {activeTab === 'changes' && 'No hay cambios de horario recientes.'}
                  {activeTab === 'reminders' && 'No hay recordatorios pendientes de enviar.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};