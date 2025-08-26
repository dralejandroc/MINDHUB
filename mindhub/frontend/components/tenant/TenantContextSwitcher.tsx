'use client';

import { useState } from 'react';
import { useTenantContext } from '@/hooks/useTenantContext';
import { 
  ChevronDownIcon,
  BuildingOfficeIcon,
  UserIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface TenantContextSwitcherProps {
  className?: string;
  showFullNames?: boolean;
}

export default function TenantContextSwitcher({ 
  className = '',
  showFullNames = false 
}: TenantContextSwitcherProps) {
  const {
    currentContext,
    availableContexts,
    loading,
    error,
    switchContext,
    refreshContext,
    isClinicContext,
    isWorkspaceContext
  } = useTenantContext();

  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSwitchContext = async (tenantId: string, tenantType: 'clinic' | 'workspace') => {
    setSwitching(true);
    const success = await switchContext(tenantId, tenantType);
    if (success) {
      setIsOpen(false);
      // Reload page to refresh data with new context
      window.location.reload();
    }
    setSwitching(false);
  };

  const handleRefresh = async () => {
    await refreshContext();
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Cargando...</span>
      </div>
    );
  }

  if (error || !currentContext) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-1 px-2 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Error - Reintentar</span>
        </button>
      </div>
    );
  }

  const totalContexts = 1 + availableContexts.clinics.length; // workspace + clinics
  const showSwitcher = totalContexts > 1;

  return (
    <div className={`relative ${className}`}>
      {showSwitcher ? (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={switching}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[200px]"
          >
            <div className="flex items-center space-x-2 flex-1">
              {isClinicContext ? (
                <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
              ) : (
                <UserIcon className="h-4 w-4 text-green-600" />
              )}
              
              <div className="text-left flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {showFullNames ? currentContext.tenant_name : (
                    currentContext.tenant_name && currentContext.tenant_name.length > 20
                      ? `${currentContext.tenant_name.substring(0, 20)}...`
                      : currentContext.tenant_name
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {isClinicContext ? 'Clínica' : 'Consultorio Individual'}
                </div>
              </div>
            </div>
            
            <ChevronDownIcon 
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsOpen(false)} 
              />
              
              {/* Dropdown */}
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                {/* Individual Workspace */}
                {availableContexts.workspace && (
                  <button
                    onClick={() => handleSwitchContext(availableContexts.workspace!.id, 'workspace')}
                    disabled={switching}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 ${
                      isWorkspaceContext && currentContext.tenant_id === availableContexts.workspace.id
                        ? 'bg-primary-50 border-l-4 border-primary-500'
                        : ''
                    }`}
                  >
                    <UserIcon className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {availableContexts.workspace.name}
                      </div>
                      <div className="text-xs text-gray-500">Consultorio Individual</div>
                    </div>
                    {isWorkspaceContext && currentContext.tenant_id === availableContexts.workspace.id && (
                      <CheckIcon className="h-4 w-4 text-primary-600" />
                    )}
                  </button>
                )}

                {/* Clinics */}
                {availableContexts.clinics.map((clinic) => (
                  <button
                    key={clinic.id}
                    onClick={() => handleSwitchContext(clinic.id, 'clinic')}
                    disabled={switching}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 ${
                      isClinicContext && currentContext.tenant_id === clinic.id
                        ? 'bg-primary-50 border-l-4 border-primary-500'
                        : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {clinic.logo_url ? (
                        <img 
                          src={clinic.logo_url} 
                          alt={clinic.name}
                          className="h-6 w-6 rounded object-cover"
                        />
                      ) : (
                        <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {clinic.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {clinic.membership?.role === 'admin' ? 'Administrador' : 
                         clinic.membership?.role === 'owner' ? 'Propietario' : 'Miembro'}
                        {clinic.business_name && ` • ${clinic.business_name}`}
                      </div>
                    </div>
                    {isClinicContext && currentContext.tenant_id === clinic.id && (
                      <CheckIcon className="h-4 w-4 text-primary-600" />
                    )}
                  </button>
                ))}

                {/* No clinics message */}
                {availableContexts.clinics.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500 border-t">
                    <div className="text-center">
                      <p>No perteneces a ninguna clínica</p>
                      <p className="mt-1">
                        <button className="text-primary-600 hover:text-primary-700 underline">
                          Crear clínica
                        </button>
                        {' o solicita una invitación'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        // Single context - just show current
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          {isClinicContext ? (
            <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
          ) : (
            <UserIcon className="h-4 w-4 text-green-600" />
          )}
          
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">
              {currentContext.tenant_name}
            </div>
            <div className="text-xs text-gray-500">
              {isClinicContext ? 'Clínica' : 'Consultorio Individual'}
            </div>
          </div>
        </div>
      )}

      {switching && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <ArrowPathIcon className="h-4 w-4 animate-spin text-primary-600" />
        </div>
      )}
    </div>
  );
}