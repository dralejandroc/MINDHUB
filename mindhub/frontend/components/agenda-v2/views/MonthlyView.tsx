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
  addMonths,
  subMonths,
  getDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarDaysIcon,
  ClockIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  PlusIcon
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
  onViewChange?: (view: 'week' | 'day' | 'month' | 'clinic-global' | 'reception') => void;
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
  onViewChange,
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
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);

  // Consultation types for filtering
  const consultationTypes = [
    { id: 'all', label: 'Todas las citas', color: 'bg-gray-100' },
    { id: 'presencial', label: 'Presencial', color: 'bg-blue-100' },
    { id: 'virtual', label: 'Virtual', color: 'bg-green-100' },
    { id: 'urgencia', label: 'Urgencia', color: 'bg-red-100' },
    { id: 'seguimiento', label: 'Seguimiento', color: 'bg-yellow-100' },
    { id: 'primera_vez', label: 'Primera vez', color: 'bg-purple-100' }
  ];

  // Handle view changes
  const handleViewChange = (view: 'week' | 'day' | 'month' | 'clinic-global' | 'reception') => {
    onViewChange?.(view);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Handle filter changes
  const handleFilterToggle = (filterId: string) => {
    if (filterId === 'all') {
      setActiveFilters(['all']);
    } else {
      setActiveFilters(prev => {
        const withoutAll = prev.filter(f => f !== 'all');
        if (withoutAll.includes(filterId)) {
          const newFilters = withoutAll.filter(f => f !== filterId);
          return newFilters.length === 0 ? ['all'] : newFilters;
        } else {
          return [...withoutAll, filterId];
        }
      });
    }
  };

  // Calculate month calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Week days for header
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Filter appointments based on active filters
  const filteredAppointments = useMemo(() => {
    if (activeFilters.includes('all')) {
      return appointments;
    }
    
    return appointments.filter(apt => {
      const consultationType = apt.consultationType || 'presencial';
      return activeFilters.includes(consultationType);
    });
  }, [appointments, activeFilters]);

  // Calculate day statistics
  const dayStats = useMemo(() => {
    const stats = new Map<string, DayStats>();
    
    calendarDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayAppointments = filteredAppointments.filter(apt => 
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
  }, [calendarDays, filteredAppointments, scheduleConfig, dayNotes, blockedDays]);

  // Handle day click
  const handleDayClick = (day: Date) => {
    onDayClick?.(day);
  };

  // Simplified day cell content
  const getDayCellContent = (dayStats: DayStats) => {
    const { date, totalAppointments, isWorkingDay } = dayStats;
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isCurrentDay = isToday(date);
    const dayNumber = format(date, 'd');

    return (
      <div
        className={`
          h-16 p-2 border-r border-b border-gray-100 cursor-pointer transition-all duration-150
          ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-25 text-gray-400'}
          ${isCurrentDay ? 'bg-blue-50 border-blue-200 text-blue-900' : ''}
        `}
        onClick={() => handleDayClick(date)}
      >
        {/* Day Number */}
        <div className="flex items-center justify-between">
          <span className={`
            text-sm font-medium
            ${isCurrentDay ? 'font-bold' : ''}
          `}>
            {dayNumber}
          </span>
          
          {/* Simple appointment count */}
          {totalAppointments > 0 && (
            <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
              {totalAppointments}
            </span>
          )}
        </div>

        {/* Simple appointment dots */}
        {totalAppointments > 0 && (
          <div className="flex gap-1 mt-1">
            {dayStats.appointments.slice(0, 4).map((apt, index) => (
              <div
                key={apt.id}
                className={`
                  w-1.5 h-1.5 rounded-full
                  ${apt.status === 'confirmed' ? 'bg-green-400' :
                    apt.status === 'scheduled' ? 'bg-yellow-400' :
                    apt.status === 'completed' ? 'bg-blue-400' :
                    'bg-gray-300'
                  }
                `}
              />
            ))}
            {totalAppointments > 4 && (
              <span className="text-xs text-gray-500">+{totalAppointments - 4}</span>
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

      {/* Main Content - Sidebar Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Month Navigation */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onDateChange(subMonths(currentDate, 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDateChange(addMonths(currentDate, 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-bold text-blue-600">{monthStats.totalAppointments}</div>
                <div className="text-blue-700">Citas</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-bold text-green-600">{monthStats.confirmedAppointments}</div>
                <div className="text-green-700">Confirmadas</div>
              </div>
            </div>
          </div>

          {/* Consultation Type Filters */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Tipos de Consulta</h4>
            <div className="space-y-2">
              {consultationTypes.map((type) => (
                <label key={type.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeFilters.includes(type.id)}
                    onChange={() => handleFilterToggle(type.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="p-4 flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Navegación</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              {/* Mini calendar grid */}
              <div className="grid grid-cols-7 gap-1 text-xs">
                {weekDays.map((day) => (
                  <div key={day} className="text-center p-1 text-gray-500 font-medium">
                    {day.slice(0, 1)}
                  </div>
                ))}
                {calendarDays.map((day) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const stats = dayStats.get(dayKey);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);
                  const hasAppointments = (stats?.totalAppointments || 0) > 0;
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`
                        p-1 text-xs rounded hover:bg-white transition-colors
                        ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${isCurrentDay ? 'bg-blue-600 text-white' : ''}
                        ${hasAppointments && !isCurrentDay ? 'bg-blue-100 text-blue-800' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r border-gray-100">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 grid grid-cols-7">
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
      </div>
    </div>
  );
};