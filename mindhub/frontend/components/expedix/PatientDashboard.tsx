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
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { useExpedixApi, Patient } from '@/lib/api/expedix-client';
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

export default function PatientDashboard({ 
  patient, 
  onClose, 
  onNewConsultation, 
  onClinicalAssessment 
}: PatientDashboardProps) {
  const expedixApi = useExpedixApi(); // Use authenticated API client
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(false);
  const [editingPatient, setEditingPatient] = useState(false);
  const [patientData, setPatientData] = useState<Patient>(patient);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    consultations: [],
    prescriptions: [],
    appointments: [],
    documents: [],
    assessments: []
  });

  const tabs = [
    { id: 'timeline', name: 'Timeline', icon: ClipboardDocumentListIcon },
    { id: 'config', name: 'Configuración', icon: IdentificationIcon },
    { id: 'consultations', name: 'Consultas', icon: CalendarIcon },
    { id: 'prescriptions', name: 'Recetas', icon: DocumentTextIcon },
    { id: 'assessments', name: 'Evaluaciones', icon: DocumentChartBarIcon },
    { id: 'resources', name: 'Recursos', icon: BookOpenIcon },
    { id: 'documents', name: 'Documentos', icon: DocumentArrowDownIcon }
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient data from API
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name || ''}</h1>
              <p className="text-blue-100">Expediente: {patient.id.slice(-8).toUpperCase()}</p>
              <p className="text-blue-100">{patient.age} años • {patient.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('config')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <IdentificationIcon className="h-4 w-4" />
              <span>Config</span>
            </button>
            <button
              onClick={onNewConsultation}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nueva Consulta</span>
            </button>
            <button
              onClick={onClinicalAssessment}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <DocumentChartBarIcon className="h-4 w-4" />
              <span>Evaluación</span>
            </button>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
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
                  <h3 className="text-lg font-bold text-gray-900">Configuración del Paciente</h3>
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
                          <option value="masculine">Masculino</option>
                          <option value="feminine">Femenino</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 py-2">
                          {patientData.gender === 'masculine' ? 'Masculino' : 
                           patientData.gender === 'feminine' ? 'Femenino' : 'No especificado'}
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
                        Dirección
                      </label>
                      {editingPatient ? (
                        <textarea
                          value={patientData.address || ''}
                          onChange={(e) => handleFieldChange('address', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.address || 'No especificado'}</p>
                      )}
                    </div>

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
                        </div>
                      ) : (
                        <div className="text-gray-900 py-2">
                          {patientData.emergency_contact_name ? (
                            <div>
                              <p>{patientData.emergency_contact_name}</p>
                              <p className="text-sm text-gray-600">{patientData.emergency_contact_phone}</p>
                            </div>
                          ) : (
                            'No especificado'
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Información Médica</h4>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{patientData.curp || 'No especificado'}</p>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID del Expediente
                      </label>
                      <p className="text-gray-900 py-2 font-mono text-sm bg-gray-50 px-2 rounded">
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