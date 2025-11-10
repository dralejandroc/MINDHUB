'use client';

import React, { useState } from 'react';
import { format, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { es, vi } from 'date-fns/locale';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  PlusIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  Squares2X2Icon,
  BuildingOfficeIcon,
  UserIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export type ViewType = 'week' | 'day' | 'month' | 'clinic-global' | 'reception';
export type LicenseType = 'clinic' | 'individual';

interface CalendarHeaderProps {
  // Date and Navigation
  currentDate: Date;
  viewType: ViewType;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onToday: () => void;
  
  // License and Context
  licenseType: LicenseType;
  canSwitchToClinicViews?: boolean;
  
  // Actions
  onNewAppointment?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  
  // Data and Stats
  todayStats?: {
    totalAppointments: number;
    confirmed: number;
    pending: number;
    completed: number;
  };
  
  // Filters
  showFilters?: boolean;
  activeFilters?: string[];
  onFilterToggle?: (filter: string) => void;
  
  // Loading States
  isLoading?: boolean;
  lastRefresh?: Date;
  
  className?: string;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewType,
  onDateChange,
  onViewChange,
  onToday,
  licenseType,
  canSwitchToClinicViews = false,
  onNewAppointment,
  onSettings,
  onRefresh,
  onSearch,
  todayStats,
  showFilters = false,
  activeFilters = [],
  onFilterToggle,
  isLoading = false,
  lastRefresh,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickStats, setShowQuickStats] = useState(false);

  // Navigation functions
  const navigatePrevious = () => {
    switch (viewType) {
      case 'week':
      case 'clinic-global':
        onDateChange(subWeeks(currentDate, 1));
        break;
      case 'day':
      case 'reception':
        onDateChange(subDays(currentDate, 1));
        break;
      case 'month':
        onDateChange(subMonths(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (viewType) {
      case 'week':
      case 'clinic-global':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'day':
      case 'reception':
        onDateChange(addDays(currentDate, 1));
        break;
      case 'month':
        onDateChange(addMonths(currentDate, 1));
        break;
    }
  };

  // Format date title based on view
  const getDateTitle = () => {
    switch (viewType) {
      case 'week':
      case 'clinic-global':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM yyyy', { locale: es })}`;
      case 'day':
      case 'reception':
        return format(currentDate, 'EEEE, d MMMM yyyy', { locale: es });
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: es });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: es });
    }
  };

  // View configuration
  const viewConfigs = [
    { 
      key: 'week' as ViewType, 
      label: 'Semana', 
      icon: ViewColumnsIcon, 
      available: true,
      description: 'Vista semanal con grid de horarios'
    },
    { 
      key: 'day' as ViewType, 
      label: 'Día', 
      icon: ListBulletIcon, 
      available: true,
      description: 'Vista diaria con lista detallada'
    },
    { 
      key: 'month' as ViewType, 
      label: 'Mes', 
      icon: Squares2X2Icon, 
      available: true,
      description: 'Vista mensual con resumen por día'
    },
    { 
      key: 'clinic-global' as ViewType, 
      label: 'Global', 
      icon: BuildingOfficeIcon, 
      available: licenseType === 'clinic' && canSwitchToClinicViews,
      description: 'Vista global de todos los profesionales'
    },
    { 
      key: 'reception' as ViewType, 
      label: 'Recepción', 
      icon: UserGroupIcon, 
      available: licenseType === 'clinic' && canSwitchToClinicViews,
      description: 'Dashboard para recepcionistas'
    }
  ].filter(config => config.available);

  // Quick filters
  const quickFilters = [
    { key: 'confirmed', label: 'Confirmadas', color: 'green' },
    { key: 'pending', label: 'Pendientes', color: 'yellow' },
    { key: 'today', label: 'Hoy', color: 'blue' },
    { key: 'urgent', label: 'Urgentes', color: 'red' }
  ];
  
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Navigation & Date */}
          <div className="flex items-center space-x-4">
            {/* Navigation Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={navigatePrevious}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={navigateNext}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={onToday}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isToday(currentDate) 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
                disabled={isLoading}
              >
                Hoy
              </button>
            </div>

            {/* Date Title */}
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {getDateTitle()}
              </h1>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Center Section: View Selector */}
          <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
            {viewConfigs.map((config) => {
              const Icon = config.icon;
              return (
                <button
                  key={config.key}
                  onClick={() => onViewChange(config.key)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${viewType === config.key 
                      ? 'bg-white text-primary-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                  title={config.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            { (viewType === 'day' || viewType === 'week') && <div className="hidden sm:block relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-48 pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>}

            {/* Refresh */}
            <button
              onClick={onRefresh}
              className={`
                p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors
                ${isLoading ? 'animate-spin' : ''}
              `}
              title="Actualizar"
              disabled={isLoading}
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>

            {/* Stats Toggle */}
            {todayStats && (
              <button
                onClick={() => setShowQuickStats(!showQuickStats)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>{todayStats.totalAppointments}</span>
              </button>
            )}

            {/* New Appointment */}
            <button
              onClick={onNewAppointment}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
              disabled={isLoading}
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Cita</span>
            </button>

            {/* Settings */}
            <button
              onClick={onSettings}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Configuración"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        {showQuickStats && todayStats && (
          <div className="pb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{todayStats.totalAppointments}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{todayStats.confirmed}</div>
                <div className="text-sm text-gray-500">Confirmadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{todayStats.pending}</div>
                <div className="text-sm text-gray-500">Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{todayStats.completed}</div>
                <div className="text-sm text-gray-500">Completadas</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Row */}
        {showFilters && (
          <div className="pb-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => onFilterToggle?.(filter.key)}
                    className={`
                      px-3 py-1 text-sm rounded-full transition-colors border
                      ${activeFilters.includes(filter.key)
                        ? `bg-${filter.color}-100 text-${filter.color}-700 border-${filter.color}-200`
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Last Refresh Info */}
        {lastRefresh && (
          <div className="pb-2">
            <div className="text-xs text-gray-400">
              Actualizado: {format(lastRefresh, 'HH:mm:ss', { locale: es })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};