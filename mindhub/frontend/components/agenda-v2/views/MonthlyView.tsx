'use client';

import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  isSameDay,
  getDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { CalendarHeader } from '../shared/CalendarHeader';
import { AppointmentData } from '../shared/AppointmentCard';
import { ScheduleConfig } from '../shared/TimeSlotGrid';

export interface MonthlyViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  appointments: AppointmentData[];
  scheduleConfig: ScheduleConfig;
  licenseType: 'clinic' | 'individual';
  canSwitchToClinicViews?: boolean;
  
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
  onDayClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: AppointmentData) => void;
  
  // Day notes and blocks (would come from backend)
  dayNotes?: Record<string, string[]>; // ISO date string -> notes
  blockedDays?: Record<string, { reason: string; type: 'full' | 'partial' }>;
  
  className?: string;
}

interface DayStats {
  date: Date;
  appointments: AppointmentData[];
  totalAppointments: number;
  confirmedAppointments: number;
  availableSlots: number;
  notes: string[];
  isBlocked: boolean;
  blockReason?: string;
  blockType?: 'full' | 'partial';
  isWorkingDay: boolean;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  currentDate,
  onDateChange,
  appointments,
  scheduleConfig,
  licenseType,
  canSwitchToClinicViews = false,
  onNewAppointment,
  onSettings,
  onRefresh,
  onSearch,
  todayStats,
  isLoading = false,
  lastRefresh,
  onDayClick,
  onAppointmentClick,
  dayNotes = {},
  blockedDays = {},
  className = ''
}) => {
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  // Handle view changes
  const handleViewChange = (view: 'week' | 'day' | 'month' | 'clinic-global' | 'reception') => {
    console.log('View change requested:', view);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Calculate month calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Week days for header
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calculate day statistics
  const dayStats = useMemo(() => {
    const stats = new Map<string, DayStats>();
    
    calendarDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayAppointments = appointments.filter(apt => 
        isSameDay(apt.startTime, day)
      );
      
      // Check if it's a working day
      const dayOfWeek = getDay(day);
      const isWorkingDay = scheduleConfig.workingDays.includes(dayOfWeek === 0 ? 7 : dayOfWeek);
      
      // Calculate available slots for working days
      let availableSlots = 0;
      if (isWorkingDay) {
        const totalPossibleSlots = ((scheduleConfig.endHour - scheduleConfig.startHour) * 60) / scheduleConfig.slotDuration;
        availableSlots = totalPossibleSlots - dayAppointments.length;
      }
      
      // Get blocked info
      const blocked = blockedDays[dayKey];
      
      stats.set(dayKey, {
        date: day,
        appointments: dayAppointments,
        totalAppointments: dayAppointments.length,
        confirmedAppointments: dayAppointments.filter(apt => apt.status === 'confirmed').length,
        availableSlots: Math.max(0, availableSlots),
        notes: dayNotes[dayKey] || [],
        isBlocked: !!blocked,
        blockReason: blocked?.reason,
        blockType: blocked?.type,
        isWorkingDay
      });
    });
    
    return stats;
  }, [calendarDays, appointments, scheduleConfig, dayNotes, blockedDays]);

  // Handle day click
  const handleDayClick = (day: Date) => {
    onDayClick?.(day);
  };

  // Get day cell content
  const getDayCellContent = (dayStats: DayStats) => {
    const { date, totalAppointments, confirmedAppointments, availableSlots, notes, isBlocked, isWorkingDay } = dayStats;
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isCurrentDay = isToday(date);
    const dayNumber = format(date, 'd');

    return (
      <div
        className={`
          h-24 p-1 border border-gray-200 cursor-pointer transition-all duration-200
          ${isCurrentMonth 
            ? 'bg-white hover:bg-gray-50' 
            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
          }
          ${isCurrentDay ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-300' : ''}
          ${isBlocked ? 'bg-red-50 border-red-200' : ''}
          ${hoveredDay && isSameDay(hoveredDay, date) ? 'ring-2 ring-primary-400 bg-primary-25' : ''}
        `}
        onClick={() => handleDayClick(date)}
        onMouseEnter={() => setHoveredDay(date)}
        onMouseLeave={() => setHoveredDay(null)}
      >
        {/* Day Number */}
        <div className="flex items-center justify-between mb-1">
          <span className={`
            text-sm font-medium
            ${isCurrentDay ? 'text-primary-700 font-bold' : ''}
          `}>
            {dayNumber}
          </span>
          
          {/* Day Status Indicators */}
          <div className="flex items-center space-x-1">
            {isBlocked && (
              <ExclamationTriangleIcon className="w-3 h-3 text-red-500" title={`Bloqueado: ${dayStats.blockReason}`} />
            )}
            {notes.length > 0 && (
              <ChatBubbleLeftIcon className="w-3 h-3 text-blue-500" title={`${notes.length} notas`} />
            )}
          </div>
        </div>

        {/* Appointments and Availability */}
        {isWorkingDay && !isBlocked && (
          <div className="space-y-1 text-xs">
            {/* Appointments */}
            {totalAppointments > 0 && (
              <div className="flex items-center space-x-1">
                <CalendarDaysIcon className="w-3 h-3 text-primary-600" />
                <span className="text-primary-700 font-medium">
                  {totalAppointments} citas
                </span>
                {confirmedAppointments > 0 && (
                  <CheckCircleIcon className="w-3 h-3 text-green-500" />
                )}
              </div>
            )}
            
            {/* Available Slots */}
            {availableSlots > 0 && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">
                  {availableSlots} disponibles
                </span>
              </div>
            )}

            {/* No appointments, show add button */}
            {totalAppointments === 0 && availableSlots > 0 && (
              <div className="flex items-center justify-center h-4 text-gray-400 hover:text-primary-600">
                <PlusIcon className="w-3 h-3" />
              </div>
            )}
          </div>
        )}

        {/* Non-working day indicator */}
        {!isWorkingDay && !isBlocked && (
          <div className="text-xs text-gray-400 flex items-center justify-center h-4">
            <span>No laboral</span>
          </div>
        )}

        {/* Blocked day indicator */}
        {isBlocked && (
          <div className="text-xs text-red-600 flex items-center space-x-1">
            <XCircleIcon className="w-3 h-3" />
            <span className="truncate">
              {dayStats.blockType === 'full' ? 'Bloqueado' : 'Parcialmente bloqueado'}
            </span>
          </div>
        )}

        {/* Quick appointment indicators */}
        {totalAppointments > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-1">
            {dayStats.appointments.slice(0, 3).map((apt, index) => (
              <div
                key={apt.id}
                className={`
                  w-2 h-2 rounded-full
                  ${apt.status === 'confirmed' ? 'bg-green-500' :
                    apt.status === 'scheduled' ? 'bg-yellow-500' :
                    apt.status === 'completed' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }
                `}
                title={`${apt.patientName} - ${format(apt.startTime, 'HH:mm')}`}
              />
            ))}
            {totalAppointments > 3 && (
              <div className="text-xs text-gray-500 ml-1">
                +{totalAppointments - 3}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Calculate month statistics
  const monthStats = useMemo(() => {
    const currentMonthStats = Array.from(dayStats.values()).filter(stats => 
      isSameMonth(stats.date, currentDate)
    );
    
    return {
      totalDays: currentMonthStats.length,
      workingDays: currentMonthStats.filter(stats => stats.isWorkingDay).length,
      totalAppointments: currentMonthStats.reduce((sum, stats) => sum + stats.totalAppointments, 0),
      confirmedAppointments: currentMonthStats.reduce((sum, stats) => sum + stats.confirmedAppointments, 0),
      blockedDays: currentMonthStats.filter(stats => stats.isBlocked).length,
      availableSlots: currentMonthStats.reduce((sum, stats) => sum + stats.availableSlots, 0)
    };
  }, [dayStats, currentDate]);

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewType="month"
        onDateChange={onDateChange}
        onViewChange={handleViewChange}
        onToday={handleToday}
        licenseType={licenseType}
        canSwitchToClinicViews={canSwitchToClinicViews}
        onNewAppointment={onNewAppointment}
        onSettings={onSettings}
        onRefresh={onRefresh}
        onSearch={onSearch}
        todayStats={todayStats}
        isLoading={isLoading}
        lastRefresh={lastRefresh}
      />

      {/* Month Statistics */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <p className="text-sm text-gray-600">
              {monthStats.totalAppointments} citas este mes • {monthStats.availableSlots} espacios disponibles
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-bold text-primary-600">{monthStats.totalAppointments}</div>
              <div className="text-xs text-gray-500">Total Citas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{monthStats.confirmedAppointments}</div>
              <div className="text-xs text-gray-500">Confirmadas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{monthStats.availableSlots}</div>
              <div className="text-xs text-gray-500">Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{monthStats.workingDays}</div>
              <div className="text-xs text-gray-500">Días Laborales</div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 divide-x divide-gray-200 bg-gray-50">
            {weekDays.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
            {calendarDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const stats = dayStats.get(dayKey)!;
              return (
                <div key={day.toISOString()}>
                  {getDayCellContent(stats)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Leyenda</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Confirmadas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Programadas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Completadas</span>
            </div>
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
              <span>Días bloqueados</span>
            </div>
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftIcon className="w-4 h-4 text-blue-500" />
              <span>Con notas</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span>Espacios disponibles</span>
            </div>
            <div className="flex items-center space-x-2">
              <PlusIcon className="w-4 h-4 text-gray-400" />
              <span>Click para agendar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-50 border border-primary-300 rounded"></div>
              <span>Hoy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};