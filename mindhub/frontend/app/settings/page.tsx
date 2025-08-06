'use client';

import React, { useState, useEffect } from 'react';
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
  CalendarIcon
} from '@heroicons/react/24/outline';
import { DashboardSettings } from '@/components/settings/DashboardSettings';
import { AgendaConfigurationSettings } from '@/components/settings/AgendaConfigurationSettings';

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
  };
}

export default function GeneralSettingsPage() {
  const [config, setConfig] = useState<ClinicConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-production.up.railway.app';
      const response = await fetch(`${API_BASE_URL}/api/v1/expedix/clinic-configuration`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data.data.configuration);
      } else {
        // Load default configuration if none exists
        const defaultResponse = await fetch(`${API_BASE_URL}/api/v1/expedix/clinic-configuration/default`);
        if (defaultResponse.ok) {
          const defaultData = await defaultResponse.json();
          setConfig(defaultData.data);
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-production.up.railway.app';
      const response = await fetch(`${API_BASE_URL}/api/v1/expedix/clinic-configuration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configuration: config }),
      });

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
      } else {
        throw new Error('Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error al guardar la configuración');
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
    { id: 'expedix', name: 'Expedix', icon: HeartIcon },
    { id: 'agenda', name: 'Agenda', icon: CalendarIcon },
    { id: 'clinimetrix', name: 'Clinimetrix', icon: ChartBarIcon },
    { id: 'formx', name: 'FormX', icon: DocumentTextIcon },
    { id: 'preferences', name: 'Preferencias', icon: UserIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando configuración...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error al cargar la configuración</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <WrenchScrewdriverIcon className="h-8 w-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-900">Configuración General del Sistema</h1>
        </div>
        <Button 
          onClick={saveConfiguration} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      {/* Custom Tab Navigation */}
      <div className="w-full">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.name}
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
              {/* Print Configuration */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DocumentTextIcon className="h-5 w-5" />
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
                      <option value="en">English</option>
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
                      <option value="America/Mexico_City">México (Ciudad de México)</option>
                      <option value="America/Cancun">México (Cancún)</option>
                      <option value="America/Chihuahua">México (Chihuahua)</option>
                      <option value="America/Hermosillo">México (Hermosillo)</option>
                      <option value="America/Tijuana">México (Tijuana)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}