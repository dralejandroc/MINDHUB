'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
// Using simple div wrappers to avoid conflicts with Clinimetrix Card usage
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  PencilSquareIcon, 
  HeartIcon, 
  CogIcon, 
  UserIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  ComputerDesktopIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { DashboardSettings } from '@/components/settings/DashboardSettings';
import { AgendaConfigurationSettings } from '@/components/settings/AgendaConfigurationSettings';
import { ClinicManagement } from '@/components/settings/ClinicManagement';
import AnalyticsSettings from '@/components/settings/AnalyticsSettings';
import ConsultationTemplateManager from '@/components/expedix/ConsultationTemplateManager';

interface ClinicConfiguration {
  clinicInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string;
    logoPosition: string;
    logoSize: number;
  };
  printConfiguration: {
    marginLeft: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    fontSize: {
      header: number;
      patientInfo: number;
      medication: number;
      instructions: number;
      footer: number;
      clinicName: number;
      patientName: number;
      actualDate: number;
      diagnostics: number;
      prescription: number;
    };
    showPatientAge: boolean;
    showPatientBirthdate: boolean;
    showMedicName: boolean;
    showActualDate: boolean;
    showPatientName: boolean;
    showNumbers: boolean;
    showDiagnostics: boolean;
    showMeasurements: boolean;
    boldMedicine: boolean;
    boldPrescription: boolean;
    boldPatientName: boolean;
    boldPatientAge: boolean;
    boldMedicName: boolean;
    boldDate: boolean;
    boldDiagnostics: boolean;
    boldIndications: boolean;
    treatmentsAtPage: number;
  };
  digitalSignature: {
    enabled: boolean;
    signatureImageUrl: string;
    signaturePosition: string;
    signatureSize: number;
    showLicense: boolean;
    showSpecialization: boolean;
  };
  medicalRecordFields: {
    patientDemographics: {
      showCURP: boolean;
      showRFC: boolean;
      showBloodType: boolean;
      showAllergies: boolean;
      showEmergencyContact: boolean;
      requireEmergencyContact: boolean;
    };
    consultationFields: {
      showVitalSigns: boolean;
      showPhysicalExam: boolean;
      showDiagnostics: boolean;
      showTreatmentPlan: boolean;
      showFollowUp: boolean;
      customFields: any[];
    };
  };
  prescriptionSettings: {
    electronicPrescription: {
      enabled: boolean;
      vigency: number;
      auto: boolean;
      anthropometrics: boolean;
      diagnostics: boolean;
      additional: boolean;
      info: string;
    };
    defaultDuration: string;
    defaultFrequency: string;
    showInteractionWarnings: boolean;
    requireClinicalIndication: boolean;
  };
  userPreferences: {
    language: string;
    dateFormat: string;
    timeFormat: string;
    currency: string;
    timezone: string;
    defaultPage: string;
    theme: 'light' | 'dark' | 'system';
  };
}

export default function GeneralSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<ClinicConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadConfiguration();
    }
  }, [user]);

  const loadConfiguration = async () => {
    try {
      setConnectionError(false);
      console.log('🚀 [Settings GraphQL] Loading configuration via GraphQL...');
      
      // Import GraphQL service dynamically to avoid import issues
      const { settingsGraphQLService } = await import('@/lib/settings-graphql-service');
      
      // Get user context for clinic/workspace ID
      const clinicId = user?.user_metadata?.clinic_id;
      const workspaceId = user?.user_metadata?.workspace_id;
      
      const configuration = await settingsGraphQLService.getClinicConfiguration(clinicId, workspaceId);
      
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
      
      // Set minimal fallback configuration
      setConfig({
        clinicInfo: {
          name: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          phone: '',
          email: '',
          website: '',
          logoUrl: '',
          logoPosition: 'top-left',
          logoSize: 100
        },
        printConfiguration: {
          marginLeft: 1.5,
          marginTop: 2.0,
          marginRight: 1.5,
          marginBottom: 1.5,
          fontSize: {
            header: 16,
            patientInfo: 12,
            medication: 12,
            instructions: 11,
            footer: 10,
            clinicName: 14,
            patientName: 13,
            actualDate: 11,
            diagnostics: 12,
            prescription: 12
          },
          showPatientAge: true,
          showPatientBirthdate: true,
          showMedicName: true,
          showActualDate: true,
          showPatientName: true,
          showNumbers: true,
          showDiagnostics: true,
          showMeasurements: false,
          boldMedicine: true,
          boldPrescription: true,
          boldPatientName: true,
          boldPatientAge: false,
          boldMedicName: true,
          boldDate: true,
          boldDiagnostics: true,
          boldIndications: false,
          treatmentsAtPage: 5
        },
        digitalSignature: {
          enabled: false,
          signatureImageUrl: '',
          signaturePosition: 'bottom-right',
          signatureSize: 80,
          showLicense: true,
          showSpecialization: true
        },
        medicalRecordFields: {
          patientDemographics: {
            showCURP: false,
            showRFC: false,
            showBloodType: true,
            showAllergies: true,
            showEmergencyContact: true,
            requireEmergencyContact: false
          },
          consultationFields: {
            showVitalSigns: true,
            showPhysicalExam: true,
            showDiagnostics: true,
            showTreatmentPlan: true,
            showFollowUp: true,
            customFields: []
          }
        },
        prescriptionSettings: {
          electronicPrescription: {
            enabled: false,
            vigency: 30,
            auto: false,
            anthropometrics: true,
            diagnostics: true,
            additional: false,
            info: ''
          },
          defaultDuration: '7 días',
          defaultFrequency: 'Cada 8 horas',
          showInteractionWarnings: true,
          requireClinicalIndication: true
        },
        userPreferences: {
          language: 'es',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          currency: 'MXN',
          timezone: 'America/Mexico_City',
          defaultPage: '/dashboard',
          theme: 'system'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setSaving(true);
    try {
      console.log('💾 [Settings GraphQL] Saving configuration via GraphQL...');
      
      // Import GraphQL service dynamically
      const { settingsGraphQLService } = await import('@/lib/settings-graphql-service');
      
      // Get user context
      const clinicId = user?.user_metadata?.clinic_id;
      const workspaceId = user?.user_metadata?.workspace_id;
      const userId = user?.id;

      const success = await settingsGraphQLService.saveClinicConfiguration(
        config,
        clinicId,
        workspaceId,
        userId
      );

      if (success) {
        toast.success('✅ Configuración guardada exitosamente via GraphQL');
        setConnectionError(false);
        console.log('✅ [Settings GraphQL] Configuration saved successfully');
      } else {
        throw new Error('Failed to save configuration via GraphQL');
      }
    } catch (error) {
      console.error('❌ [Settings GraphQL] Error saving configuration:', error);
      toast.error('❌ Error al guardar la configuración GraphQL');
      setConnectionError(true);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof ClinicConfiguration, field: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value,
      },
    });
  };

  const updateNestedConfig = (section: keyof ClinicConfiguration, subsection: string, field: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [subsection]: {
          ...(config[section] as any)[subsection],
          [field]: value,
        },
      },
    });
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: ComputerDesktopIcon },
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'clinic', name: 'Gestión de Clínica', icon: BuildingOfficeIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'expedix', name: 'Expedix', icon: HeartIcon },
    { id: 'agenda', name: 'Agenda', icon: CalendarIcon },
    { id: 'clinimetrix', name: 'Clinimetrix', icon: ChartBarIcon },
    { id: 'formx', name: 'FormX', icon: DocumentTextIcon },
    { id: 'import', name: 'Importación Masiva', icon: ArrowUpTrayIcon },
    { id: 'preferences', name: 'Preferencias', icon: UserIcon },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!config) {
    return (
      <UnifiedSidebar>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Error al cargar la configuración</div>
        </div>
      </UnifiedSidebar>
    );
  }

  return (
    <UnifiedSidebar>
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <WrenchScrewdriverIcon className="h-8 w-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-900">Configuración General del Sistema</h1>
        </div>
        <div className="flex items-center gap-3">
          {connectionError && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">Sin conexión al servidor</span>
            </div>
          )}
          <Button 
            onClick={saveConfiguration} 
            disabled={saving || connectionError}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Custom Tab Navigation - Responsive Grid */}
      <div className="w-full">
        <div className="border-b border-gray-200">
          <nav className="-mb-px grid grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-1 md:gap-2" aria-label="Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  } py-2 px-2 border-b-2 font-medium text-xs md:text-sm flex flex-col md:flex-row items-center gap-1 md:gap-2 rounded-t-lg transition-colors`}
                  title={tab.name}
                >
                  <IconComponent className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate text-center">{tab.name}</span>
                  <span className="sm:hidden text-center text-xs truncate w-full">{tab.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <DashboardSettings />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <AnalyticsSettings />
          )}

          {/* Clinic Management Tab */}
          {activeTab === 'clinic' && (
            <ClinicManagement />
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BuildingOfficeIcon className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Información General</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="clinic-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Clínica/Consultorio
                    </label>
                    <input
                      id="clinic-name"
                      type="text"
                      value={config.clinicInfo.name}
                      onChange={(e) => updateConfig('clinicInfo', 'name', e.target.value)}
                      placeholder="Ej: Clínica de Salud Mental"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="clinic-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      id="clinic-phone"
                      type="text"
                      value={config.clinicInfo.phone}
                      onChange={(e) => updateConfig('clinicInfo', 'phone', e.target.value)}
                      placeholder="Ej: +52 (55) 1234-5678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="clinic-address" className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      id="clinic-address"
                      type="text"
                      value={config.clinicInfo.address}
                      onChange={(e) => updateConfig('clinicInfo', 'address', e.target.value)}
                      placeholder="Ej: Av. Insurgentes Sur 123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="clinic-city" className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      id="clinic-city"
                      type="text"
                      value={config.clinicInfo.city}
                      onChange={(e) => updateConfig('clinicInfo', 'city', e.target.value)}
                      placeholder="Ej: Ciudad de México"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="clinic-state" className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <input
                      id="clinic-state"
                      type="text"
                      value={config.clinicInfo.state}
                      onChange={(e) => updateConfig('clinicInfo', 'state', e.target.value)}
                      placeholder="Ej: CDMX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="clinic-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="clinic-email"
                      type="email"
                      value={config.clinicInfo.email}
                      onChange={(e) => updateConfig('clinicInfo', 'email', e.target.value)}
                      placeholder="contacto@clinica.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="clinic-website" className="block text-sm font-medium text-gray-700 mb-1">
                      Sitio Web
                    </label>
                    <input
                      id="clinic-website"
                      type="url"
                      value={config.clinicInfo.website}
                      onChange={(e) => updateConfig('clinicInfo', 'website', e.target.value)}
                      placeholder="https://www.clinica.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="clinic-logo" className="block text-sm font-medium text-gray-700 mb-1">
                      URL del Logo
                    </label>
                    <input
                      id="clinic-logo"
                      type="url"
                      value={config.clinicInfo.logoUrl}
                      onChange={(e) => updateConfig('clinicInfo', 'logoUrl', e.target.value)}
                      placeholder="https://ejemplo.com/logo.png"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Agenda Configuration Tab */}
          {activeTab === 'agenda' && (
            <AgendaConfigurationSettings />
          )}

          {/* Expedix Configuration Tab */}
          {activeTab === 'expedix' && (
            <div className="space-y-6">
              {/* Consultation Templates Management */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold">Plantillas de Consulta</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  Gestiona las plantillas de consulta para agilizar la creación de expedientes médicos. 
                  Personaliza los campos que aparecerán en cada tipo de consulta.
                </p>
                <ConsultationTemplateManager showActions={true} />
              </div>

              {/* Medical Record Fields Configuration */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HeartIcon className="h-5 w-5 text-red-600" />
                  <h2 className="text-xl font-semibold">Configuración de Expedientes Médicos</h2>
                </div>
                <div className="space-y-6">
                  {/* Patient Demographics */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Datos Demográficos del Paciente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'showCURP', label: 'Mostrar CURP' },
                        { key: 'showRFC', label: 'Mostrar RFC' },
                        { key: 'showBloodType', label: 'Mostrar tipo de sangre' },
                        { key: 'showAllergies', label: 'Mostrar alergias' },
                        { key: 'showEmergencyContact', label: 'Mostrar contacto de emergencia' },
                        { key: 'requireEmergencyContact', label: 'Requerir contacto de emergencia' },
                      ].map((option) => (
                        <div key={option.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <label className="text-sm font-medium text-gray-700">{option.label}</label>
                          <input
                            type="checkbox"
                            checked={config.medicalRecordFields.patientDemographics[option.key as keyof typeof config.medicalRecordFields.patientDemographics] as boolean}
                            onChange={(e) => updateNestedConfig('medicalRecordFields', 'patientDemographics', option.key, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consultation Fields */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Campos de Consulta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'showVitalSigns', label: 'Mostrar signos vitales' },
                        { key: 'showPhysicalExam', label: 'Mostrar examen físico' },
                        { key: 'showDiagnostics', label: 'Mostrar diagnósticos' },
                        { key: 'showTreatmentPlan', label: 'Mostrar plan de tratamiento' },
                        { key: 'showFollowUp', label: 'Mostrar seguimiento' },
                      ].map((option) => (
                        <div key={option.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <label className="text-sm font-medium text-gray-700">{option.label}</label>
                          <input
                            type="checkbox"
                            checked={config.medicalRecordFields.consultationFields[option.key as keyof typeof config.medicalRecordFields.consultationFields] as boolean}
                            onChange={(e) => updateNestedConfig('medicalRecordFields', 'consultationFields', option.key, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prescription Settings */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Configuración de Recetas</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Duración predeterminada</label>
                          <select
                            value={config.prescriptionSettings.defaultDuration}
                            onChange={(e) => updateConfig('prescriptionSettings', 'defaultDuration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="3 días">3 días</option>
                            <option value="5 días">5 días</option>
                            <option value="7 días">7 días</option>
                            <option value="10 días">10 días</option>
                            <option value="14 días">14 días</option>
                            <option value="30 días">30 días</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia predeterminada</label>
                          <select
                            value={config.prescriptionSettings.defaultFrequency}
                            onChange={(e) => updateConfig('prescriptionSettings', 'defaultFrequency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Una vez al día">Una vez al día</option>
                            <option value="Cada 12 horas">Cada 12 horas</option>
                            <option value="Cada 8 horas">Cada 8 horas</option>
                            <option value="Cada 6 horas">Cada 6 horas</option>
                            <option value="Cada 4 horas">Cada 4 horas</option>
                            <option value="Según se necesite">Según se necesite</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <label className="text-sm font-medium text-gray-700">Mostrar advertencias de interacciones</label>
                          <input
                            type="checkbox"
                            checked={config.prescriptionSettings.showInteractionWarnings}
                            onChange={(e) => updateConfig('prescriptionSettings', 'showInteractionWarnings', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <label className="text-sm font-medium text-gray-700">Requerir indicación clínica</label>
                          <input
                            type="checkbox"
                            checked={config.prescriptionSettings.requireClinicalIndication}
                            onChange={(e) => updateConfig('prescriptionSettings', 'requireClinicalIndication', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Print Configuration */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                  <h2 className="text-xl font-semibold">Configuración de Impresión - Expedix</h2>
                </div>
                <div className="space-y-6">
                  {/* Margins */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Márgenes (cm)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Izquierdo</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={config.printConfiguration.marginLeft}
                          onChange={(e) => updateConfig('printConfiguration', 'marginLeft', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-500">{config.printConfiguration.marginLeft} cm</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Superior</label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.1"
                          value={config.printConfiguration.marginTop}
                          onChange={(e) => updateConfig('printConfiguration', 'marginTop', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-500">{config.printConfiguration.marginTop} cm</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Derecho</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={config.printConfiguration.marginRight}
                          onChange={(e) => updateConfig('printConfiguration', 'marginRight', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-500">{config.printConfiguration.marginRight} cm</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inferior</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={config.printConfiguration.marginBottom}
                          onChange={(e) => updateConfig('printConfiguration', 'marginBottom', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-500">{config.printConfiguration.marginBottom} cm</span>
                      </div>
                    </div>
                  </div>

                  {/* Display Options */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Opciones de Visualización</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { key: 'showPatientAge', label: 'Mostrar edad del paciente' },
                        { key: 'showPatientBirthdate', label: 'Mostrar fecha de nacimiento' },
                        { key: 'showMedicName', label: 'Mostrar nombre del médico' },
                        { key: 'showActualDate', label: 'Mostrar fecha actual' },
                        { key: 'showDiagnostics', label: 'Mostrar diagnósticos' },
                        { key: 'showNumbers', label: 'Mostrar números' },
                      ].map((option) => (
                        <div key={option.key} className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">{option.label}</label>
                          <input
                            type="checkbox"
                            checked={config.printConfiguration[option.key as keyof typeof config.printConfiguration] as boolean}
                            onChange={(e) => updateConfig('printConfiguration', option.key, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Signature */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PencilSquareIcon className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Firma Digital - Expedix</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Habilitar firma digital</label>
                    <input
                      type="checkbox"
                      checked={config.digitalSignature.enabled}
                      onChange={(e) => updateConfig('digitalSignature', 'enabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  
                  {config.digitalSignature.enabled && (
                    <>
                      <div>
                        <label htmlFor="signature-url" className="block text-sm font-medium text-gray-700 mb-1">
                          URL de la imagen de la firma
                        </label>
                        <input
                          id="signature-url"
                          type="url"
                          value={config.digitalSignature.signatureImageUrl}
                          onChange={(e) => updateConfig('digitalSignature', 'signatureImageUrl', e.target.value)}
                          placeholder="https://ejemplo.com/firma.png"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="signature-position" className="block text-sm font-medium text-gray-700 mb-1">
                          Posición de la firma
                        </label>
                        <select
                          id="signature-position"
                          value={config.digitalSignature.signaturePosition}
                          onChange={(e) => updateConfig('digitalSignature', 'signaturePosition', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="bottom-right">Abajo derecha</option>
                          <option value="bottom-left">Abajo izquierda</option>
                          <option value="bottom-center">Abajo centro</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Clinimetrix Tab */}
          {activeTab === 'clinimetrix' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Configuración de Clinimetrix</h2>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg mb-4">La configuración específica de Clinimetrix estará disponible próximamente</p>
                <p className="text-gray-400">Aquí podrás configurar escalas predeterminadas, reportes automáticos, y más opciones de evaluación clínica.</p>
              </div>
            </div>
          )}

          {/* FormX Tab */}
          {activeTab === 'formx' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <DocumentTextIcon className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Configuración de FormX</h2>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg mb-4">La configuración específica de FormX estará disponible próximamente</p>
                <p className="text-gray-400">Aquí podrás configurar plantillas de formularios, validaciones automáticas, y opciones de exportación.</p>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Importación de Pacientes */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold">Importación de Pacientes</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">Importa múltiples pacientes desde archivos Excel o CSV. Descarga la plantilla para asegurar el formato correcto.</p>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        // Crear y descargar plantilla Excel
                        const csvContent = "first_name,paternal_last_name,maternal_last_name,email,cell_phone,birth_date,gender,curp,address,city,state,postal_code\nJuan,Pérez,García,juan@email.com,5551234567,1990-01-15,male,PEGJ900115HDFRRL09,Av. Principal 123,Ciudad de México,Ciudad de México,01000";
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'plantilla_pacientes.csv';
                        a.click();
                        window.URL.revokeObjectURL(url);
                        toast.success('Plantilla descargada exitosamente');
                      }}
                      variant="outline"
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      📥 Descargar Plantilla CSV
                    </Button>
                    
                    <Button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.csv,.xlsx,.xls';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            toast.success(`Archivo seleccionado: ${file.name}`);
                            // TODO: Implementar subida y procesamiento
                            toast('Procesamiento de importación pendiente de implementar');
                          }
                        };
                        input.click();
                      }}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      📂 Seleccionar Archivo
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p>Formatos soportados: CSV, Excel (.xlsx, .xls)</p>
                    <p>Los pacientes se asignarán automáticamente según tu tipo de licencia (individual/clínica)</p>
                  </div>
                </div>
              </div>

              {/* Importación de Medicamentos */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HeartIcon className="h-5 w-5 text-red-600" />
                  <h2 className="text-xl font-semibold">Importación de Medicamentos</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">Importa tu lista personalizada de medicamentos más utilizados para agilizar la creación de recetas en Expedix.</p>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        const csvContent = "medication_name,generic_name,presentation,concentration,dosage_form,route,therapeutic_class,common_dosage,side_effects,contraindications\nParacetamol,Paracetamol,Tabletas,500mg,Tableta,Oral,Analgésico,1 tableta cada 6-8 horas,Náusea leve,Hipersensibilidad al paracetamol\nIbuprofeno,Ibuprofeno,Cápsulas,400mg,Cápsula,Oral,AINE,1 cápsula cada 8 horas,Dolor estomacal,Úlcera péptica activa";
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'plantilla_medicamentos.csv';
                        a.click();
                        window.URL.revokeObjectURL(url);
                        toast.success('Plantilla de medicamentos descargada');
                      }}
                      variant="outline"
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      💊 Descargar Plantilla CSV
                    </Button>
                    
                    <Button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.csv,.xlsx,.xls';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            toast.success(`Archivo de medicamentos seleccionado: ${file.name}`);
                            // TODO: Implementar subida y procesamiento
                            toast('Procesamiento de medicamentos pendiente de implementar');
                          }
                        };
                        input.click();
                      }}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      📂 Seleccionar Archivo
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p>Los medicamentos se guardarán en tu biblioteca personal para uso en recetas</p>
                    <p>Incluye información completa para evitar errores de prescripción</p>
                  </div>
                </div>
              </div>

              {/* Subida de Recursos */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">Subida de Recursos</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">Sube documentos PDF e imágenes JPG para tu biblioteca de recursos médicos.</p>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.jpg,.jpeg,.png';
                        input.multiple = true;
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files && files.length > 0) {
                            toast.success(`${files.length} archivo(s) seleccionado(s)`);
                            // TODO: Implementar subida de recursos
                            toast('Subida de recursos pendiente de implementar');
                          }
                        };
                        input.click();
                      }}
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      📎 Seleccionar Archivos
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p>Formatos soportados: PDF, JPG, JPEG, PNG</p>
                    <p>Los recursos se organizarán automáticamente en categorías</p>
                    <p>Tamaño máximo por archivo: 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Preferencias de Usuario</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                      Idioma
                    </label>
                    <select
                      id="language"
                      value={config.userPreferences.language}
                      onChange={(e) => updateConfig('userPreferences', 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="es">Español</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="date-format" className="block text-sm font-medium text-gray-700 mb-1">
                      Formato de fecha
                    </label>
                    <select
                      id="date-format"
                      value={config.userPreferences.dateFormat}
                      onChange={(e) => updateConfig('userPreferences', 'dateFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="time-format" className="block text-sm font-medium text-gray-700 mb-1">
                      Formato de hora
                    </label>
                    <select
                      id="time-format"
                      value={config.userPreferences.timeFormat}
                      onChange={(e) => updateConfig('userPreferences', 'timeFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="24h">24 horas</option>
                      <option value="12h">12 horas (AM/PM)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                      Moneda
                    </label>
                    <select
                      id="currency"
                      value={config.userPreferences.currency}
                      onChange={(e) => updateConfig('userPreferences', 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MXN">Peso Mexicano (MXN)</option>
                      <option value="USD">Dólar Americano (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                      Zona horaria
                    </label>
                    <select
                      id="timezone"
                      value={config.userPreferences.timezone}
                      onChange={(e) => updateConfig('userPreferences', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="America/Mexico_City">Tiempo del Centro (UTC-6) - CDMX, Guadalajara, Monterrey, Puebla, Morelia</option>
                      <option value="America/Cancun">Tiempo del Sureste (UTC-5) - Cancún, Mérida, Chetumal (Quintana Roo, Yucatán)</option>
                      <option value="America/Chihuahua">Tiempo de la Montaña (UTC-7) - Chihuahua, Ciudad Juárez, Durango</option>
                      <option value="America/Hermosillo">Tiempo de la Montaña Sin Horario de Verano (UTC-7) - Hermosillo, Sonora</option>
                      <option value="America/Tijuana">Tiempo del Pacífico (UTC-8) - Tijuana, Mexicali, Ensenada (Baja California)</option>
                    </select>
                  </div>

                  {/* Default Page */}
                  <div className="md:col-span-2">
                    <label htmlFor="defaultPage" className="block text-sm font-medium text-gray-700 mb-1">
                      Página por defecto al iniciar sesión
                    </label>
                    <select
                      id="defaultPage"
                      value={config.userPreferences.defaultPage}
                      onChange={(e) => updateConfig('userPreferences', 'defaultPage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="/dashboard">Dashboard - Resumen principal</option>
                      <option value="/hubs/expedix">Expedix - Gestión de pacientes</option>
                      <option value="/hubs/agenda">Agenda - Citas y horarios</option>
                      <option value="/hubs/clinimetrix">ClinimetrixPro - Escalas clinimétricas</option>
                      <option value="/hubs/resources">Resources - Recursos médicos</option>
                      <option value="/hubs/finance">Finance - Control financiero</option>
                      <option value="/frontdesk">FrontDesk - Gestión de recepción</option>
                      <option value="/hubs/formx">FormX - Formularios personalizados</option>
                    </select>
                  </div>

                  {/* Theme Selector */}
                  <div className="md:col-span-2">
                    <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                      Tema de la aplicación
                    </label>
                    <select
                      id="theme"
                      value={config.userPreferences.theme}
                      onChange={(e) => updateConfig('userPreferences', 'theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">Claro - Fondo blanco con texto oscuro</option>
                      <option value="dark">Oscuro - Fondo negro con texto claro</option>
                      <option value="system">Sistema - Sigue la preferencia del dispositivo</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      El modo oscuro puede reducir la fatiga visual y el consumo de batería en dispositivos OLED.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </UnifiedSidebar>
  );
}