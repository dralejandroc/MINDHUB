'use client';

import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  XMarkIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CogIcon,
  CurrencyDollarIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
import { useExpedixApi, type Patient } from '@/lib/api/expedix-client';
import ResourcesTimeline from './ResourcesTimeline';
import PatientTimeline from './PatientTimeline';
import PatientDocuments from './PatientDocuments';
import PatientAssessments from './PatientAssessments';
import { Button } from '@/components/ui/Button';

interface PatientDashboardProps {
  patient: Patient;
  onClose: () => void;
  onNewConsultation: () => void;
  onClinicalAssessment: () => void;
}

interface DashboardData {
  consultations: any[];
  prescriptions: any[];
  appointments: any[];
  documents: any[];
  assessments: any[];
}

interface AdministrativeData {
  appointments: any[];
  financial: {
    totalPaid: number;
    totalCharged: number;
    currentBalance: number;
    totalInvoices: number;
    totalPayments: number;
    totalRefunds: number;
    transactions: any[];
  };
}

export default function PatientDashboard({ 
  patient, 
  onClose, 
  onNewConsultation, 
  onClinicalAssessment 
}: PatientDashboardProps) {
  const expedixApi = useExpedixApi(); // Use authenticated API client
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false); // Lazy loading state
  const [editingPatient, setEditingPatient] = useState(false);
  const [patientData, setPatientData] = useState<Patient>(patient);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    consultations: [],
    prescriptions: [],
    appointments: [],
    documents: [],
    assessments: []
  });

  const [administrativeData, setAdministrativeData] = useState<AdministrativeData>({
    appointments: [],
    financial: {
      totalPaid: 0,
      totalCharged: 0,
      currentBalance: 0,
      totalInvoices: 0,
      totalPayments: 0,
      totalRefunds: 0,
      transactions: []
    }
  });

  const tabs = [
    { id: 'timeline', name: 'Timeline', icon: ClipboardDocumentListIcon },
    { id: 'config', name: 'Datos personales', icon: IdentificationIcon },
    { id: 'consultations', name: 'Consultas', icon: CalendarIcon },
    { id: 'prescriptions', name: 'Recetas', icon: DocumentTextIcon },
    { id: 'assessments', name: 'Evaluaciones', icon: DocumentChartBarIcon },
    { id: 'administrative', name: 'Administrativo', icon: CogIcon },
    { id: 'resources', name: 'Recursos', icon: BookOpenIcon },
    { id: 'documents', name: 'Documentos', icon: DocumentArrowDownIcon }
  ];

  console.log('[PatientDashboard] Rendering with tabs:', tabs.map(t => t.name));
  console.log('[PatientDashboard] Active tab:', activeTab);

  const fetchAdministrativeData = async () => {
    try {
      const response = await fetch(`/api/expedix/patients/${patient.id}/administrative`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAdministrativeData(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading administrative data:', error);
    }
  };

  // Lazy loading functions for non-critical data
  const fetchTabData = async (tabId: string) => {
    if (tabId === 'administrative') {
      setTabLoading(true);
      await fetchAdministrativeData();
      setTabLoading(false);
      return;
    }
    
    // For other tabs, only fetch if not already loaded
    if (dashboardData.consultations.length === 0 && 
        ['consultations', 'prescriptions', 'assessments', 'documents', 'resources'].includes(tabId)) {
      setTabLoading(true);
      try {
        const patientResponse = await expedixApi.getPatient(patient.id);
        if (patientResponse?.data) {
          const patientData = patientResponse.data;
          setDashboardData({
            consultations: patientData.consultations || [],
            prescriptions: patientData.prescriptions || [],
            appointments: patientData.appointments || [],
            documents: patientData.documents || [],
            assessments: patientData.assessments || []
          });
        }
      } catch (error) {
        console.error('Error fetching tab data:', error);
      } finally {
        setTabLoading(false);
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Only fetch basic patient data initially (performance optimization)
      const patientResponse = await expedixApi.getPatient(patient.id);
      
      if (patientResponse?.data) {
        const patientData = patientResponse.data;
        
        // Initialize with empty arrays for lazy loading
        setDashboardData({
          consultations: [],
          prescriptions: [],
          appointments: [],
          documents: [],
          assessments: []
        });
        
        // Update local patient data with fresh data
        setPatientData(patientData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePatientInfo = async (updatedData: Partial<Patient>) => {
    try {
      setLoading(true);
      
      const response = await expedixApi.updatePatient(patient.id, updatedData);
      
      if (response?.data) {
        setPatientData(response.data);
        setEditingPatient(false);
        // Refresh dashboard data
        fetchDashboardData();
        alert('Información del paciente actualizada correctamente');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Error al actualizar la información del paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof Patient, value: string) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    if (patient.id) {
      fetchDashboardData();
    }
  }, [patient.id]);

  useEffect(() => {
    // Lazy load data only when tab becomes active (performance optimization)
    if (activeTab && activeTab !== 'config') {
      fetchTabData(activeTab);
    }
  }, [activeTab]);

  return (
    <div className="space-y-6" data-version="2.1-administrative">
      {/* Header - Compact & Responsive */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 lg:p-6 text-white">
        {/* Main Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
            <div className="min-w-0 flex-1">
              {/* Nombre - responsive font size */}
              <h1 className="text-lg lg:text-2xl font-bold mb-1 truncate">
                {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name || ''}
              </h1>
              
              {/* Información compacta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 text-xs lg:text-sm text-blue-100">
                <p className="flex items-center space-x-1 truncate">
                  <CalendarIcon className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                  <span className="truncate">
                    {patient.age ? `${patient.age} años` : 'Sin edad'}
                  </span>
                </p>
                <p className="flex items-center space-x-1 truncate">
                  <PhoneIcon className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                  <span className="truncate">{patient.cell_phone || patient.phone || 'Sin teléfono'}</span>
                </p>
                <p className="flex items-center space-x-1 truncate">
                  <IdentificationIcon className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                  <span className="truncate">#{patient.id.slice(-6).toUpperCase()}</span>
                </p>
              </div>
              
              {/* Info secundaria - solo en pantallas grandes */}
              <div className="hidden lg:flex flex-wrap gap-3 mt-2 pt-2 border-t border-blue-500/30 text-xs text-blue-200">
                {(patientData.blood_type || patient.blood_type) && (
                  <span>🩸 {patientData.blood_type || patient.blood_type}</span>
                )}
                {patient.gender && (
                  <span>👤 {patient.gender === 'male' ? 'M' : 'F'}</span>
                )}
                {(patientData.known_allergies || patient.allergies) && (
                  <span>🚨 Alergias</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons - Compact Grid */}
          <div className="flex flex-wrap lg:flex-nowrap gap-2">
            <button
              onClick={() => setActiveTab('config')}
              className="bg-gray-500/80 hover:bg-gray-600 text-white px-2 py-1 lg:px-3 lg:py-2 rounded text-xs lg:text-sm flex items-center space-x-1 transition-colors"
              title="Configuración"
            >
              <IdentificationIcon className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Config</span>
            </button>
            <button
              onClick={onNewConsultation}
              className="bg-green-500/80 hover:bg-green-600 text-white px-2 py-1 lg:px-3 lg:py-2 rounded text-xs lg:text-sm flex items-center space-x-1 transition-colors"
              title="Nueva Consulta"
            >
              <PlusIcon className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Consulta</span>
            </button>
            <button
              onClick={onClinicalAssessment}
              className="bg-purple-500/80 hover:bg-purple-600 text-white px-2 py-1 lg:px-3 lg:py-2 rounded text-xs lg:text-sm flex items-center space-x-1 transition-colors"
              title="Evaluación Clínica"
            >
              <DocumentChartBarIcon className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Evaluar</span>
            </button>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-1 lg:p-2 rounded transition-colors"
              title="Cerrar"
            >
              <XMarkIcon className="h-4 w-4 lg:h-5 lg:w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-white/60 hover:text-white/90 hover:border-white/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando información...</span>
          </div>
        ) : tabLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500">Cargando contenido...</span>
          </div>
        ) : (
          <div>
            {activeTab === 'timeline' && (
              <PatientTimeline
                patient={{
                  id: patient.id,
                  first_name: patient.first_name,
                  paternal_last_name: patient.paternal_last_name,
                  age: patient.age
                }}
                onNewConsultation={onNewConsultation}
              />
            )}

            {activeTab === 'config' && (
              <div className="bg-white rounded-xl p-6 border shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Datos Personales del Paciente</h3>
                  {!editingPatient ? (
                    <Button
                      onClick={() => setEditingPatient(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <IdentificationIcon className="h-4 w-4 mr-2" />
                      Editar Información
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => updatePatientInfo(patientData)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={loading}
                      >
                        Guardar
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingPatient(false);
                          setPatientData(patient);
                        }}
                        variant="outline"
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información Personal */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Información Personal</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre(s) *
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.first_name || ''}
                          onChange={(e) => handleFieldChange('first_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.first_name || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido Paterno *
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.paternal_last_name || ''}
                          onChange={(e) => handleFieldChange('paternal_last_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.paternal_last_name || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido Materno
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.maternal_last_name || ''}
                          onChange={(e) => handleFieldChange('maternal_last_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.maternal_last_name || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Nacimiento *
                      </label>
                      {editingPatient ? (
                        <input
                          type="date"
                          value={patientData.birth_date || ''}
                          onChange={(e) => handleFieldChange('birth_date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">
                          {patientData.birth_date ? new Date(patientData.birth_date).toLocaleDateString('es-ES') : 'No especificado'}
                          {patientData.age && ` (${patientData.age} años)`}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Género *
                      </label>
                      {editingPatient ? (
                        <select
                          value={patientData.gender || ''}
                          onChange={(e) => handleFieldChange('gender', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="male">Masculino</option>
                          <option value="female">Femenino</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 py-2">
                          {patientData.gender === 'male' ? 'Masculino' : 
                           patientData.gender === 'female' ? 'Femenino' : 'No especificado'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Información de Contacto</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      {editingPatient ? (
                        <input
                          type="email"
                          value={patientData.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.email || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono Celular *
                      </label>
                      {editingPatient ? (
                        <input
                          type="tel"
                          value={patientData.cell_phone || ''}
                          onChange={(e) => handleFieldChange('cell_phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.cell_phone || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono Fijo
                      </label>
                      {editingPatient ? (
                        <input
                          type="tel"
                          value={patientData.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.phone || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      {editingPatient ? (
                        <textarea
                          value={patientData.address || ''}
                          onChange={(e) => handleFieldChange('address', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.address || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.city || ''}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.city || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.state || ''}
                          onChange={(e) => handleFieldChange('state', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.state || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.postal_code || ''}
                          onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.postal_code || 'No especificado'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información Adicional - Nueva Sección */}
                <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información Personal Adicional */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Información Personal Adicional</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ocupación
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.occupation || ''}
                          onChange={(e) => handleFieldChange('occupation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.occupation || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Escolaridad
                      </label>
                      {editingPatient ? (
                        <select
                          value={patientData.education_level || ''}
                          onChange={(e) => handleFieldChange('education_level', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="sin_estudios">Sin estudios</option>
                          <option value="primaria">Primaria</option>
                          <option value="secundaria">Secundaria</option>
                          <option value="preparatoria">Preparatoria</option>
                          <option value="licenciatura">Licenciatura</option>
                          <option value="maestria">Maestría</option>
                          <option value="doctorado">Doctorado</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.education_level || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado Civil
                      </label>
                      {editingPatient ? (
                        <select
                          value={patientData.marital_status || ''}
                          onChange={(e) => handleFieldChange('marital_status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="soltero">Soltero/a</option>
                          <option value="casado">Casado/a</option>
                          <option value="divorciado">Divorciado/a</option>
                          <option value="viudo">Viudo/a</option>
                          <option value="union_libre">Unión libre</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.marital_status || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Idioma Preferido
                      </label>
                      {editingPatient ? (
                        <select
                          value={patientData.preferred_language || ''}
                          onChange={(e) => handleFieldChange('preferred_language', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="español">Español</option>
                          <option value="ingles">Inglés</option>
                          <option value="otro">Otro</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.preferred_language || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lugar de Trabajo
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.workplace || ''}
                          onChange={(e) => handleFieldChange('workplace', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.workplace || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Referencia (Quién lo envía)
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          placeholder="Doctor, clínica, familiar, etc."
                          value={patientData.referring_physician || ''}
                          onChange={(e) => handleFieldChange('referring_physician', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.referring_physician || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alergias Conocidas
                      </label>
                      {editingPatient ? (
                        <textarea
                          rows={3}
                          placeholder="Medicamentos, alimentos, sustancias..."
                          value={patientData.known_allergies || ''}
                          onChange={(e) => handleFieldChange('known_allergies', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.known_allergies || 'No especificado'}</p>
                      )}
                    </div>
                  </div>

                  {/* Contacto de Emergencia y Seguro */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Contacto de Emergencia y Seguro</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contacto de Emergencia
                      </label>
                      {editingPatient ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Nombre completo"
                            value={patientData.emergency_contact_name || ''}
                            onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="tel"
                            placeholder="Teléfono"
                            value={patientData.emergency_contact_phone || ''}
                            onChange={(e) => handleFieldChange('emergency_contact_phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Parentesco"
                            value={patientData.emergency_contact_relationship || ''}
                            onChange={(e) => handleFieldChange('emergency_contact_relationship', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-900 py-2">
                          {patientData.emergency_contact_name ? (
                            <div>
                              <p>{patientData.emergency_contact_name}</p>
                              <p className="text-sm text-gray-600">{patientData.emergency_contact_phone}</p>
                              <p className="text-sm text-gray-600">{patientData.emergency_contact_relationship}</p>
                            </div>
                          ) : (
                            'No especificado'
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aseguradora
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.insurance_provider || ''}
                          onChange={(e) => handleFieldChange('insurance_provider', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.insurance_provider || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Póliza
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.insurance_number || ''}
                          onChange={(e) => handleFieldChange('insurance_number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.insurance_number || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Médico de Referencia
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.referring_physician || ''}
                          onChange={(e) => handleFieldChange('referring_physician', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.referring_physician || 'No especificado'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información Médica y Documentos Oficiales */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Información Médica y Documentos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CURP
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.curp || ''}
                          onChange={(e) => handleFieldChange('curp', e.target.value)}
                          maxLength={18}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          placeholder="XXXX000000XXXXXX00"
                        />
                      ) : (
                        <p className="text-gray-900 py-2 font-mono">{patientData.curp || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RFC
                      </label>
                      {editingPatient ? (
                        <input
                          type="text"
                          value={patientData.rfc || ''}
                          onChange={(e) => handleFieldChange('rfc', e.target.value)}
                          maxLength={13}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          placeholder="XXXX000000XXX"
                        />
                      ) : (
                        <p className="text-gray-900 py-2 font-mono">{patientData.rfc || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Sangre
                      </label>
                      {editingPatient ? (
                        <select
                          value={patientData.blood_type || ''}
                          onChange={(e) => handleFieldChange('blood_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.blood_type || 'No especificado'}</p>
                      )}
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID del Expediente
                      </label>
                      <p className="text-gray-900 py-2 font-mono text-sm bg-gray-50 px-3 rounded inline-block">
                        {patientData.id.slice(-12).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {editingPatient && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alergias
                      </label>
                      <textarea
                        value={patientData.allergies || ''}
                        onChange={(e) => handleFieldChange('allergies', e.target.value)}
                        rows={2}
                        placeholder="Describa las alergias conocidas del paciente..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'consultations' && (
              <div className="bg-white rounded-xl p-6 border shadow">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Historial de Consultas</h3>
                {dashboardData.consultations.length === 0 ? (
                  <div className="text-center py-6">
                    <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No hay consultas registradas</p>
                    <p className="text-gray-400 text-xs mt-1">Usa el botón "Nueva Consulta" arriba para agregar una</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.consultations.map((consultation, index) => (
                      <div key={consultation.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {consultation.reason || 'Consulta médica'}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                            consultation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {consultation.status === 'completed' ? 'Completada' :
                             consultation.status === 'scheduled' ? 'Programada' : consultation.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {new Date(consultation.consultationDate).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1" />
                              Dr. Alejandro Contreras
                            </span>
                          </div>
                        </div>
                        {consultation.diagnosis && (
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Diagnóstico:</strong> {consultation.diagnosis}
                          </div>
                        )}
                        {consultation.notes && (
                          <div className="text-sm text-gray-600">
                            <strong>Notas:</strong> {consultation.notes.substring(0, 200)}
                            {consultation.notes.length > 200 && '...'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="bg-white rounded-xl p-6 border shadow">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Recetas Médicas</h3>
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay recetas registradas</p>
                </div>
              </div>
            )}

            {activeTab === 'assessments' && (
              <PatientAssessments
                patientId={patient.id}
                patientName={`${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}`}
                onNewAssessment={onClinicalAssessment}
              />
            )}

            {activeTab === 'administrative' && (
              <div className="space-y-6">
                {/* Citas Section */}
                <div className="bg-white rounded-xl p-6 border shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <CalendarIcon className="w-6 h-6 text-blue-600 mr-3" />
                      <h3 className="text-lg font-bold text-gray-900">Historial de Citas</h3>
                    </div>
                    <Button
                      onClick={() => {
                        // Navigate to agenda with patient pre-selected
                        window.location.href = `/hubs/agenda?patient=${patient.id}&action=schedule`;
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Nueva Cita
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atención</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesional</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurso</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comentarios</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {administrativeData.appointments.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                              No hay citas registradas
                            </td>
                          </tr>
                        ) : (
                          administrativeData.appointments.map((appointment, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {appointment.type || 'Consulta general'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {appointment.branch || 'Principal'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {appointment.professional || 'Por asignar'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {appointment.resource || 'Consultorio 1'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('es-MX') : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {appointment.appointment_time || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {appointment.status === 'completed' ? 'Completada' :
                                   appointment.status === 'confirmed' ? 'Confirmada' :
                                   appointment.status === 'cancelled' ? 'Cancelada' :
                                   'Programada'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${appointment.balance || '0.00'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {appointment.notes || '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Finanzas Section */}
                <div className="bg-white rounded-xl p-6 border shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="w-6 h-6 text-green-600 mr-3" />
                      <h3 className="text-lg font-bold text-gray-900">Información Financiera</h3>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          // Navigate to finance module
                          window.location.href = `/hubs/finance?patient=${patient.id}&action=payment`;
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                        Registrar Pago
                      </Button>
                      <Button
                        onClick={() => {
                          // Generate financial report
                          window.location.href = `/hubs/finance?patient=${patient.id}&action=report`;
                        }}
                        variant="outline"
                      >
                        <ClipboardIcon className="w-4 h-4 mr-2" />
                        Reporte
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-md">
                          <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-green-600 font-medium">Total Pagado</p>
                          <p className="text-2xl font-bold text-green-900">${administrativeData.financial.totalPaid.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-md">
                          <ClipboardIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-yellow-600 font-medium">Balance Pendiente</p>
                          <p className="text-2xl font-bold text-yellow-900">${administrativeData.financial.currentBalance.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-md">
                          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-blue-600 font-medium">Facturas</p>
                          <p className="text-2xl font-bold text-blue-900">{administrativeData.financial.totalInvoices}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-md">
                          <XMarkIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-red-600 font-medium">Devoluciones</p>
                          <p className="text-2xl font-bold text-red-900">{administrativeData.financial.totalRefunds}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Historial de Transacciones</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comentarios</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {administrativeData.financial.transactions.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                No hay transacciones registradas
                              </td>
                            </tr>
                          ) : (
                            administrativeData.financial.transactions.map((transaction, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString('es-MX') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    transaction.transaction_type === 'payment' ? 'bg-green-100 text-green-800' :
                                    transaction.transaction_type === 'refund' ? 'bg-red-100 text-red-800' :
                                    transaction.transaction_type === 'invoice' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {transaction.type_display || transaction.transaction_type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {transaction.concept || 'Sin concepto'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ${transaction.amount ? Number(transaction.amount).toFixed(2) : '0.00'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {transaction.status_display || transaction.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {transaction.comments || '-'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="bg-white rounded-xl p-6 border shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Recursos Psicoeducativos</h3>
                  <Button
                    onClick={() => {
                      // Navigate to resources hub with patient pre-selected
                      window.location.href = `/hubs/resources?patient=${patient.id}&action=send`;
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <BookOpenIcon className="w-4 h-4 mr-2" />
                    Enviar Recurso
                  </Button>
                </div>
                
                <ResourcesTimeline
                  patientId={patient.id}
                  patientName={`${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}`}
                  isVisible={activeTab === 'resources'}
                />
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="bg-white rounded-xl p-6 border shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Documentos del Paciente</h3>
                  <p className="text-sm text-gray-600">
                    PDFs, imágenes y documentos médicos
                  </p>
                </div>
                
                <PatientDocuments
                  patientId={patient.id}
                  patientName={`${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}`}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}