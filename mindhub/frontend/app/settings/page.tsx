'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  HeartIcon, 
  CogIcon, 
  UserIcon,
  ChartBarIcon,
  ComputerDesktopIcon,
  CalendarIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { DashboardSettings } from '@/components/settings/DashboardSettings';
import { UserMetricsProvider } from '@/contexts/UserMetricsContext';
import { AgendaConfigurationSettings } from '@/components/settings/AgendaConfigurationSettings';
import { ClinicManagement } from '@/components/settings/ClinicManagement';
import AnalyticsSettings from '@/components/settings/AnalyticsSettings';
import ConsultationTemplateManager from '@/components/expedix/ConsultationTemplateManager';
import { ExpandableTabs } from '@/components/ui/ExpandableTabs';
import { UserSecuritySettings } from '@/components/settings/UserSecuritySettings';
import type { ClinicConfiguration } from '@/lib/settings-graphql-service';

export default function GeneralSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<ClinicConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in');
      return;
    }

    if (user) {
      loadConfiguration();
    }
  }, [user]);

  const loadConfiguration = async () => {
    try {
      setConnectionError(false);
      console.log('🚀 [Settings GraphQL] Loading configuration via GraphQL...');
      
      const { settingsGraphQLService } = await import('@/lib/settings-graphql-service');
      const clinicName = user?.user_metadata?.clinic_name || 'Default Clinic';
      const configuration = await settingsGraphQLService.getClinicConfiguration(clinicName);
      
      if (configuration) {
        setConfig(configuration);
        console.log('✅ [Settings GraphQL] Configuration loaded successfully via GraphQL');
      } else {
        throw new Error('No configuration returned from GraphQL service');
      }
    } catch (error) {
      console.error('❌ [Settings GraphQL] Error loading configuration:', error);
      setConnectionError(true);
      console.warn('🔄 [Settings GraphQL] Using fallback configuration due to GraphQL error');
      
      // Use default configuration from service instead of incomplete fallback
      try {
        const { settingsGraphQLService: fallbackService } = await import('@/lib/settings-graphql-service');
        const fallbackConfig = await fallbackService.getDefaultConfiguration();
        setConfig(fallbackConfig);
      } catch (fallbackError) {
        console.error('❌ [Settings GraphQL] Even fallback failed:', fallbackError);
        // Last resort - create minimal but complete config
        setConfig(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (section: keyof ClinicConfiguration, field: string, value: any) => {
    if (!config) return;
    
    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setSaving(true);
    try {
      console.log('💾 [Settings GraphQL] Saving configuration...');
      const { settingsGraphQLService } = await import('@/lib/settings-graphql-service');
      
      const success = await settingsGraphQLService.saveClinicConfiguration(config);
      
      if (success) {
        toast.success('Configuración guardada exitosamente');
        console.log('✅ [Settings GraphQL] Configuration saved successfully');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('❌ [Settings GraphQL] Error saving configuration:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const settingsTabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: ComputerDesktopIcon,
      content: (
        <UserMetricsProvider>
          <DashboardSettings />
        </UserMetricsProvider>
      )
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: ChartBarIcon,
      content: <AnalyticsSettings />
    },
    {
      id: 'clinic',
      label: 'Gestión de Clínica',
      icon: BuildingOfficeIcon,
      content: <ClinicManagement />
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: CalendarIcon,
      content: <AgendaConfigurationSettings />
    },
    {
      id: 'expedix',
      label: 'Expedix',
      icon: HeartIcon,
      content: (
        <div className="space-y-6">
          <ConsultationTemplateManager />
        </div>
      )
    },
    {
      id: 'general',
      label: 'General',
      icon: CogIcon,
      content: config ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <CogIcon className="h-5 w-5 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold">Configuración General</h2>
          </div>
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Información de la Clínica</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Clínica
                  </label>
                  <input
                    type="text"
                    value={config.clinicInfo.name || ''}
                    onChange={(e) => updateConfig('clinicInfo', 'name', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={config.clinicInfo.address || ''}
                    onChange={(e) => updateConfig('clinicInfo', 'address', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={config.clinicInfo.city || ''}
                    onChange={(e) => updateConfig('clinicInfo', 'city', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={config.clinicInfo.email || ''}
                    onChange={(e) => updateConfig('clinicInfo', 'email', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="pt-4">
              <Button
                onClick={saveConfiguration}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      ) : null
    },
    {
      id: 'clinimetrix',
      label: 'Clinimetrix',
      icon: ChartBarIcon,
      content: (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="h-5 w-5 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold">Configuración de Clinimetrix</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-gray-600">
              Configuraciones específicas para el módulo de evaluaciones psicométricas Clinimetrix.
            </p>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <p className="text-sm sm:text-base text-blue-800">
                <strong>Estado:</strong> Módulo activo con escalas psicométricas disponibles.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'formx',
      label: 'FormX',
      icon: DocumentTextIcon,
      content: (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold">Configuración de FormX</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-gray-600">
              Configuraciones para el generador de formularios médicos FormX.
            </p>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <p className="text-sm sm:text-base text-blue-800">
                <strong>Estado:</strong> Módulo en desarrollo.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'preferences',
      label: 'Preferencias',
      icon: UserIcon,
      content: config ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="h-5 w-5 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold">Preferencias de Usuario</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                  Idioma
                </label>
                <select
                  id="language"
                  value={config.userPreferences.language || 'es'}
                  onChange={(e) => updateConfig('userPreferences', 'language', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                  Tema
                </label>
                <select
                  id="theme"
                  value={config.userPreferences.theme || 'system'}
                  onChange={(e) => updateConfig('userPreferences', 'theme', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                  <option value="system">Sistema</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : null
    },
    {
      id: 'security',
      label: 'Seguridad',
      icon: ShieldCheckIcon,
      content: <UserSecuritySettings />
    }
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <UnifiedSidebar>
      <div className="min-h-screen w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Configuración del Sistema
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Gestiona la configuración de tu clínica, módulos y preferencias personales.
          </p>
          {connectionError && (
            <div className="mt-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm sm:text-base text-yellow-800">
                ⚠️ Usando configuración de respaldo debido a problemas de conexión con GraphQL
              </p>
            </div>
          )}
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button
              onClick={loadConfiguration}
              disabled={loading}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {loading ? 'Cargando...' : 'Recargar Configuración'}
            </Button>
          </div>
        </div>

        {/* ExpandableTabs Implementation */}
        <div className="w-full">
          <ExpandableTabs
            tabs={settingsTabs}
            allowMultiple={true}
            defaultExpanded={['dashboard']}
            className="space-y-3 sm:space-y-4"
          />
        </div>
      </div>
    </UnifiedSidebar>
  );
}