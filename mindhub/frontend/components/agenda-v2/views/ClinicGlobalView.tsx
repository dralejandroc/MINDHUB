'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfDay, eachHourOfInterval, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  UserIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  VideoCameraIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { CalendarHeader } from '../shared/CalendarHeader';
import { AppointmentCard, AppointmentData } from '../shared/AppointmentCard';
import { PatientTooltip, PatientTooltipData } from '../shared/PatientTooltip';
import { AppointmentContextMenu } from '../shared/AppointmentContextMenu';
import { ScheduleConfig } from '../shared/TimeSlotGrid';

// Professional data interface
export interface ProfessionalData {
  id: string;
  name: string;
  specialization: string;
  avatar?: string;
  color: string; // Unique color for this professional
  isActive: boolean;
  scheduleConfig: ScheduleConfig;
}

export interface ClinicGlobalViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  appointments: AppointmentData[];
  professionals: ProfessionalData[];
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
  
  // Event handlers
  onAppointmentClick?: (appointment: AppointmentData) => void;
  onTimeSlotClick?: (professionalId: string, date: Date, hour: number, minute: number) => void;
  
  // Context menu handlers
  onStartConsultation?: (appointmentId: string) => void;
  onConfirm?: (appointmentId: string, withDeposit: boolean) => void;
  onCancel?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string) => void;
  onGoToRecord?: (patientId: string) => void;
  onViewTimeline?: (patientId: string) => void;
  onSendForm?: (patientId: string) => void;
  onSendResource?: (patientId: string) => void;
  onSendScale?: (patientId: string) => void;
  onAddComment?: (appointmentId: string) => void;
  
  className?: string;
}

interface ProfessionalStats {
  professional: ProfessionalData;
  appointments: AppointmentData[];
  totalAppointments: number;
  confirmedAppointments: number;
  availableSlots: number;
  occupancyRate: number;
}

export const ClinicGlobalView: React.FC<ClinicGlobalViewProps> = ({
  currentDate,
  onDateChange,
  appointments,
  professionals,
  licenseType,
  onNewAppointment,
  onSettings,
  onRefresh,
  onSearch,
  todayStats,
  isLoading = false,
  lastRefresh,
  onAppointmentClick,
  onTimeSlotClick,
  onStartConsultation,
  onConfirm,
  onCancel,
  onReschedule,
  onGoToRecord,
  onViewTimeline,
  onSendForm,
  onSendResource,
  onSendScale,
  onAddComment,
  className = ''
}) => {
  const [contextMenu, setContextMenu] = useState<{
    appointment: AppointmentData;
    position: { x: number; y: number };
  } | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);

  // Handle view changes
  const handleViewChange = (view: 'week' | 'day' | 'month' | 'clinic-global' | 'reception') => {
    console.log('View change requested:', view);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Calculate statistics for each professional
  const professionalStats = useMemo(() => {
    return professionals.map(professional => {
      const professionalAppointments = appointments.filter(apt => 
        // Assuming appointments have a professionalId field
        (apt as any).professionalId === professional.id &&
        format(apt.startTime, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
      );

      const totalSlots = professional.scheduleConfig ? 
        ((professional.scheduleConfig.endHour - professional.scheduleConfig.startHour) * 60) / professional.scheduleConfig.slotDuration 
        : 0;
      
      const availableSlots = Math.max(0, totalSlots - professionalAppointments.length);
      const occupancyRate = totalSlots > 0 ? Math.round((professionalAppointments.length / totalSlots) * 100) : 0;

      return {
        professional,
        appointments: professionalAppointments,
        totalAppointments: professionalAppointments.length,
        confirmedAppointments: professionalAppointments.filter(apt => apt.status === 'confirmed').length,
        availableSlots,
        occupancyRate
      } as ProfessionalStats;
    });
  }, [professionals, appointments, currentDate]);

  // Generate time slots for the day
  const timeSlots = useMemo(() => {
    // Find the earliest and latest hours across all professionals
    let earliestHour = 24;
    let latestHour = 0;
    
    professionals.forEach(professional => {
      if (professional.scheduleConfig) {
        earliestHour = Math.min(earliestHour, professional.scheduleConfig.startHour);
        latestHour = Math.max(latestHour, professional.scheduleConfig.endHour);
      }
    });

    if (earliestHour === 24) {
      earliestHour = 8;
      latestHour = 18;
    }

    const dayStart = startOfDay(currentDate);
    dayStart.setHours(earliestHour);
    const dayEnd = startOfDay(currentDate);
    dayEnd.setHours(latestHour);

    return eachHourOfInterval({ start: dayStart, end: dayEnd });
  }, [professionals, currentDate]);

  // Handle appointment context menu
  const handleAppointmentRightClick = (e: React.MouseEvent, appointment: AppointmentData) => {
    e.preventDefault();
    setContextMenu({
      appointment,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  // Create patient tooltip data
  const createPatientTooltipData = (appointment: AppointmentData): PatientTooltipData => ({
    patientId: appointment.patientId,
    name: appointment.patientName,
    dateOfBirth: appointment.patientInfo?.dateOfBirth,
    appointmentTime: format(appointment.startTime, 'HH:mm'),
    duration: appointment.duration,
    consultationType: appointment.consultationType || 'presencial',
    location: appointment.location,
    followUpTimeMonths: appointment.patientInfo?.followUpMonths,
    lastVisitDate: appointment.patientInfo?.lastVisit ? format(appointment.patientInfo.lastVisit, 'yyyy-MM-dd') : undefined,
    phone: appointment.patientInfo?.phone,
    paymentStatus: appointment.paymentStatus,
    licenseType,
    canViewContactInfo: true,
    canViewClinicalHistory: true,
    encryptionStatus: 'encrypted'
  });

  // Get consultation type icon
  const getConsultationTypeIcon = (type?: string) => {
    switch (type) {
      case 'virtual':
        return <VideoCameraIcon className="w-3 h-3 text-blue-500" />;
      case 'telefonica':
        return <PhoneIcon className="w-3 h-3 text-green-500" />;
      default:
        return <MapPinIcon className="w-3 h-3 text-primary-500" />;
    }
  };

  // Calculate overall clinic stats for the day
  const clinicStats = useMemo(() => {
    return {
      totalProfessionals: professionals.filter(p => p.isActive).length,
      totalAppointments: professionalStats.reduce((sum, stats) => sum + stats.totalAppointments, 0),
      totalConfirmed: professionalStats.reduce((sum, stats) => sum + stats.confirmedAppointments, 0),
      totalAvailable: professionalStats.reduce((sum, stats) => sum + stats.availableSlots, 0),
      avgOccupancy: Math.round(
        professionalStats.reduce((sum, stats) => sum + stats.occupancyRate, 0) / 
        (professionalStats.length || 1)
      )
    };
  }, [professionalStats, professionals]);

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewType="clinic-global"
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

      {/* Clinic Statistics */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BuildingOfficeIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Vista Global de Clínica
              </h2>
              <p className="text-sm text-gray-600 capitalize">
                {format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-bold text-primary-600">{clinicStats.totalProfessionals}</div>
              <div className="text-xs text-gray-500">Profesionales</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{clinicStats.totalAppointments}</div>
              <div className="text-xs text-gray-500">Total Citas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{clinicStats.totalConfirmed}</div>
              <div className="text-xs text-gray-500">Confirmadas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{clinicStats.avgOccupancy}%</div>
              <div className="text-xs text-gray-500">Ocupación Promedio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Time Column */}
          <div className="w-20 bg-gray-50 border-r border-gray-200 flex-shrink-0">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-3 text-center text-sm font-medium text-gray-500">
              Hora
            </div>
            <div className="space-y-0">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot.toISOString()} className="h-16 flex items-center justify-center border-b border-gray-200 text-sm text-gray-700">
                  {format(timeSlot, 'HH:mm')}
                </div>
              ))}
            </div>
          </div>

          {/* Professionals Columns */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex min-w-max">
              {professionalStats.map((stats) => (
                <div key={stats.professional.id} className="w-64 flex-shrink-0 border-r border-gray-200">
                  {/* Professional Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-3 z-10">
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: stats.professional.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {stats.professional.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {stats.professional.specialization}
                        </p>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{stats.totalAppointments}</div>
                        <div className="text-gray-500">Citas</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">{stats.confirmedAppointments}</div>
                        <div className="text-gray-500">Conf.</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-600">{stats.occupancyRate}%</div>
                        <div className="text-gray-500">Ocup.</div>
                      </div>
                    </div>
                  </div>

                  {/* Appointments Timeline */}
                  <div className="relative">
                    {timeSlots.map((timeSlot) => {
                      const hour = timeSlot.getHours();
                      const slotAppointments = stats.appointments.filter(apt => 
                        apt.startTime.getHours() === hour
                      );

                      return (
                        <div key={timeSlot.toISOString()} className="h-16 border-b border-gray-200 relative">
                          {slotAppointments.length > 0 ? (
                            <div className="h-full p-1 space-y-1">
                              {slotAppointments.map((appointment) => (
                                <PatientTooltip
                                  key={appointment.id}
                                  patientData={createPatientTooltipData(appointment)}
                                  position="auto"
                                  delay={300}
                                >
                                  <div
                                    onContextMenu={(e) => handleAppointmentRightClick(e, appointment)}
                                    onClick={() => onAppointmentClick?.(appointment)}
                                    className="h-full"
                                  >
                                    <div className={`
                                      h-full rounded px-2 py-1 cursor-pointer transition-all duration-200
                                      text-white text-xs overflow-hidden
                                      hover:shadow-md transform hover:scale-[1.02]
                                      ${appointment.status === 'confirmed' ? 'bg-green-500 hover:bg-green-600' :
                                        appointment.status === 'scheduled' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                        appointment.status === 'completed' ? 'bg-blue-500 hover:bg-blue-600' :
                                        'bg-gray-500 hover:bg-gray-600'
                                      }
                                    `}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-xs truncate">
                                          {appointment.patientName}
                                        </span>
                                        {getConsultationTypeIcon(appointment.consultationType)}
                                      </div>
                                      <div className="text-xs text-white/90">
                                        {format(appointment.startTime, 'HH:mm')} • {appointment.duration}min
                                      </div>
                                      <div className="text-xs text-white/80 truncate">
                                        {appointment.type}
                                      </div>
                                    </div>
                                  </div>
                                </PatientTooltip>
                              ))}
                            </div>
                          ) : (
                            // Available slot
                            <button
                              onClick={() => onTimeSlotClick?.(stats.professional.id, currentDate, hour, 0)}
                              className="w-full h-full text-gray-400 hover:bg-gray-50 hover:text-primary-600 transition-colors group"
                            >
                              <div className="opacity-0 group-hover:opacity-100 text-xs flex items-center justify-center h-full">
                                + Agendar
                              </div>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Empty State - No Professionals */}
              {professionalStats.length === 0 && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay profesionales configurados</h3>
                    <p className="text-gray-600 mb-4">
                      Agregue profesionales a su clínica para ver sus horarios.
                    </p>
                    <button
                      onClick={onSettings}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Configurar Profesionales
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <AppointmentContextMenu
          appointment={contextMenu.appointment}
          isVisible={true}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onStartConsultation={onStartConsultation}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onReschedule={onReschedule}
          onGoToRecord={onGoToRecord}
          onViewTimeline={onViewTimeline}
          onSendForm={onSendForm}
          onSendResource={onSendResource}
          onSendScale={onSendScale}
          onAddComment={onAddComment}
          licenseType={licenseType}
          userRole="admin" // Clinic global view is typically for admins
        />
      )}
    </div>
  );
};