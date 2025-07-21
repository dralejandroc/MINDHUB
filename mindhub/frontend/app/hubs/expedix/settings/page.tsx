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
  UserIcon 
} from '@heroicons/react/24/outline';

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

export default function SettingsPage() {
  const [config, setConfig] = useState<ClinicConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('clinic');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_EXPEDIX_API || 'http://localhost:8080';
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_EXPEDIX_API || 'http://localhost:8080';
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
    { id: 'clinic', name: 'Clínica', icon: BuildingOfficeIcon },
    { id: 'print', name: 'Impresión', icon: DocumentTextIcon },
    { id: 'signature', name: 'Firma Digital', icon: PencilSquareIcon },
    { id: 'medical', name: 'Expediente', icon: HeartIcon },
    { id: 'prescriptions', name: 'Recetas', icon: DocumentTextIcon },
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
          <CogIcon className="h-8 w-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
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
          {/* Clinic Information Tab */}
          {activeTab === 'clinic' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BuildingOfficeIcon className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Información de la Clínica</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="clinic-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Clínica
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

          {/* Print Configuration Tab */}
          {activeTab === 'print' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <DocumentTextIcon className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Configuración de Impresión</h2>
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

                {/* Bold Formatting Options */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Formato en Negrita</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'boldMedicine', label: 'Medicamentos en negrita' },
                      { key: 'boldPatientName', label: 'Nombre del paciente en negrita' },
                      { key: 'boldPrescription', label: 'Prescripción en negrita' },
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

                {/* Treatments per Page */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tratamientos por página</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={config.printConfiguration.treatmentsAtPage}
                    onChange={(e) => updateConfig('printConfiguration', 'treatmentsAtPage', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{config.printConfiguration.treatmentsAtPage} tratamientos</span>
                </div>
              </div>
            </div>
          )}

          {/* Digital Signature Tab */}
          {activeTab === 'signature' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <PencilSquareIcon className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Firma Digital</h2>
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de la firma</label>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        step="0.5"
                        value={config.digitalSignature.signatureSize}
                        onChange={(e) => updateConfig('digitalSignature', 'signatureSize', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{config.digitalSignature.signatureSize} cm</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Mostrar cédula profesional</label>
                        <input
                          type="checkbox"
                          checked={config.digitalSignature.showLicense}
                          onChange={(e) => updateConfig('digitalSignature', 'showLicense', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Mostrar especialización</label>
                        <input
                          type="checkbox"
                          checked={config.digitalSignature.showSpecialization}
                          onChange={(e) => updateConfig('digitalSignature', 'showSpecialization', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Medical Record Fields Tab */}
          {activeTab === 'medical' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <HeartIcon className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Campos del Expediente Médico</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Datos Demográficos del Paciente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'showCURP', label: 'Mostrar CURP' },
                      { key: 'showRFC', label: 'Mostrar RFC' },
                      { key: 'showBloodType', label: 'Mostrar tipo de sangre' },
                      { key: 'showAllergies', label: 'Mostrar alergias' },
                      { key: 'showEmergencyContact', label: 'Mostrar contacto de emergencia' },
                      { key: 'requireEmergencyContact', label: 'Requerir contacto de emergencia' },
                    ].map((option) => (
                      <div key={option.key} className="flex items-center justify-between">
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

                <div>
                  <h3 className="text-lg font-semibold mb-3">Campos de Consulta</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'showVitalSigns', label: 'Mostrar signos vitales' },
                      { key: 'showPhysicalExam', label: 'Mostrar examen físico' },
                      { key: 'showDiagnostics', label: 'Mostrar diagnósticos' },
                      { key: 'showTreatmentPlan', label: 'Mostrar plan de tratamiento' },
                      { key: 'showFollowUp', label: 'Mostrar seguimiento' },
                    ].map((option) => (
                      <div key={option.key} className="flex items-center justify-between">
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
              </div>
            </div>
          )}

          {/* Prescription Settings Tab */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <DocumentTextIcon className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Configuración de Recetas</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Receta Electrónica</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Habilitar receta electrónica</label>
                      <input
                        type="checkbox"
                        checked={config.prescriptionSettings.electronicPrescription.enabled}
                        onChange={(e) => updateNestedConfig('prescriptionSettings', 'electronicPrescription', 'enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    {config.prescriptionSettings.electronicPrescription.enabled && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia (días)</label>
                          <input
                            type="range"
                            min="1"
                            max="365"
                            step="1"
                            value={config.prescriptionSettings.electronicPrescription.vigency}
                            onChange={(e) => updateNestedConfig('prescriptionSettings', 'electronicPrescription', 'vigency', parseInt(e.target.value))}
                            className="w-full"
                          />
                          <span className="text-sm text-gray-500">{config.prescriptionSettings.electronicPrescription.vigency} días</span>
                        </div>
                        
                        <div className="space-y-3">
                          {[
                            { key: 'auto', label: 'Generación automática' },
                            { key: 'anthropometrics', label: 'Incluir antropométricos' },
                            { key: 'diagnostics', label: 'Incluir diagnósticos' },
                          ].map((option) => (
                            <div key={option.key} className="flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700">{option.label}</label>
                              <input
                                type="checkbox"
                                checked={config.prescriptionSettings.electronicPrescription[option.key as keyof typeof config.prescriptionSettings.electronicPrescription] as boolean}
                                onChange={(e) => updateNestedConfig('prescriptionSettings', 'electronicPrescription', option.key, e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Valores por Defecto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="default-duration" className="block text-sm font-medium text-gray-700 mb-1">
                        Duración por defecto
                      </label>
                      <input
                        id="default-duration"
                        type="text"
                        value={config.prescriptionSettings.defaultDuration}
                        onChange={(e) => updateConfig('prescriptionSettings', 'defaultDuration', e.target.value)}
                        placeholder="Ej: 7 días"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="default-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                        Frecuencia por defecto
                      </label>
                      <input
                        id="default-frequency"
                        type="text"
                        value={config.prescriptionSettings.defaultFrequency}
                        onChange={(e) => updateConfig('prescriptionSettings', 'defaultFrequency', e.target.value)}
                        placeholder="Ej: Cada 8 horas"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Opciones Adicionales</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'showInteractionWarnings', label: 'Mostrar advertencias de interacción' },
                      { key: 'requireClinicalIndication', label: 'Requerir indicación clínica' },
                    ].map((option) => (
                      <div key={option.key} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">{option.label}</label>
                        <input
                          type="checkbox"
                          checked={config.prescriptionSettings[option.key as keyof typeof config.prescriptionSettings] as boolean}
                          onChange={(e) => updateConfig('prescriptionSettings', option.key, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    ))}
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