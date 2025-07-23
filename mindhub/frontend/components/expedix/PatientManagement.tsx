'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, PlusIcon, MagnifyingGlassIcon, CalendarIcon, ClipboardDocumentListIcon, DocumentTextIcon, CogIcon, BookOpenIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { expedixApi, type Patient } from '@/lib/api/expedix-client';
import ResourcesIntegration from './ResourcesIntegration';
import ExportDropdown from './ExportDropdown';

interface PatientManagementProps {
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
  onNewConsultation: (patient: Patient) => void;
  onClinicalAssessment: (patient: Patient) => void;
  onSettings?: () => void;
}

export default function PatientManagement({
  onSelectPatient,
  onNewPatient,
  onNewConsultation,
  onClinicalAssessment,
  onSettings
}: PatientManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [selectedPatientForResources, setSelectedPatientForResources] = useState<Patient | null>(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingAssessments: 0,
    todayPrescriptions: 0
  });

  // Fetch patients from API using the API client
  const fetchPatients = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching patients from API...');
      const response = await expedixApi.getPatients(searchTerm || undefined);
      console.log('📊 API Response:', response);
      console.log('👥 Patients received:', response.data);
      setPatients(response.data || []);
      setStats(prev => ({ ...prev, totalPatients: response.total || response.data.length }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
      console.error('❌ Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const [todayAppointments, pendingAssessments, todayPrescriptions] = await Promise.all([
        expedixApi.getTodayAppointments().catch(() => ({ data: [] })),
        expedixApi.getPendingAssessments().catch(() => ({ data: [] })),
        expedixApi.getTodayPrescriptions().catch(() => ({ data: [] }))
      ]);

      setStats(prev => ({
        ...prev,
        todayAppointments: todayAppointments?.data?.length || 0,
        pendingAssessments: pendingAssessments?.data?.length || 0,
        todayPrescriptions: todayPrescriptions?.data?.length || 0
      }));
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPatients();
    fetchStats();
  }, []);

  // Refetch when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPatients();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle resources modal
  const handleOpenResources = (patient: Patient) => {
    setSelectedPatientForResources(patient);
    setShowResourcesModal(true);
  };

  const handleCloseResources = () => {
    setShowResourcesModal(false);
    setSelectedPatientForResources(null);
  };


  const handleResourceSent = (resourceId: string, method: string) => {
    console.log(`Resource ${resourceId} sent via ${method} to patient ${selectedPatientForResources?.id}`);
    // Aquí se podría actualizar estadísticas o mostrar notificación
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando pacientes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={fetchPatients} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda con diseño MindHub */}
        <div 
          className="bg-white rounded-xl p-6 mb-6 border"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon 
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: 'var(--primary-500)' }}
              />
              <input
                type="text"
                placeholder="Buscar paciente por nombre, teléfono o expediente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm rounded-lg transition-all duration-200 focus:outline-none focus:-translate-y-0.5"
                style={{ 
                  border: '2px solid var(--neutral-200)',
                  fontFamily: 'var(--font-primary)',
                  borderRadius: 'var(--radius-lg)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-500)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(8, 145, 178, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--neutral-200)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            {loading && searchTerm && (
              <div className="flex items-center justify-center w-8 h-8">
                <div 
                  className="animate-spin rounded-full h-4 w-4 border-b-2"
                  style={{ borderColor: 'var(--primary-500)' }}
                />
              </div>
            )}
            
            {/* Export Table Dropdown */}
            <ExportDropdown
              showPatientOptions={false}
              showConsultationOptions={false}
              showTableOption={true}
            />
          </div>
        </div>

        {/* Tabla de pacientes con diseño MindHub */}
        <div 
          className="bg-white rounded-xl border overflow-hidden"
          style={{ 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            boxShadow: 'var(--shadow)'
          }}
        >
          {patients.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Sin resultados' : 'Sin pacientes registrados'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'No se encontraron pacientes que coincidan con tu búsqueda.' 
                  : 'Comienza agregando tu primer paciente al sistema.'
                }
              </p>
              <button
                onClick={onNewPatient}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar Paciente
              </button>
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Paciente</div>
                  <div className="col-span-2">Edad</div>
                  <div className="col-span-3">Contacto</div>
                  <div className="col-span-3">Acciones</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {console.log('🎨 Rendering patients in table:', patients) || patients.map((patient) => (
                  <div key={patient.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Patient Info */}
                      <div className="col-span-4 flex items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3"
                          style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' }}
                        >
                          {patient.first_name?.charAt(0) || 'P'}{patient.paternal_last_name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div 
                            className="text-sm font-medium"
                            style={{ 
                              color: 'var(--dark-green)',
                              fontFamily: 'var(--font-primary)'
                            }}
                          >
                            {patient.first_name || 'N/A'} {patient.paternal_last_name || ''} {patient.maternal_last_name || ''}
                          </div>
                          <div 
                            className="text-xs"
                            style={{ color: 'var(--neutral-500)' }}
                          >
                            ID: {patient.id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Age */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900">{patient.age || 'N/A'} años</div>
                        <div className="text-xs text-gray-500 capitalize">{patient.gender === 'masculine' ? 'Masculino' : patient.gender === 'feminine' ? 'Femenino' : 'N/A'}</div>
                      </div>

                      {/* Contact */}
                      <div className="col-span-3">
                        <div className="text-sm text-gray-900">{patient.cell_phone || 'N/A'}</div>
                        <div className="text-xs text-gray-500 truncate">{patient.email || 'N/A'}</div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 flex items-center space-x-1">
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="inline-flex items-center px-2 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                        >
                          <ClipboardDocumentListIcon className="h-3 w-3 mr-1" />
                          Expediente
                        </button>
                        <button
                          onClick={() => onNewConsultation(patient)}
                          className="inline-flex items-center px-2 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-200"
                        >
                          <DocumentTextIcon className="h-3 w-3 mr-1" />
                          Consulta
                        </button>
                        <button
                          onClick={() => handleOpenResources(patient)}
                          className="inline-flex items-center px-2 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                        >
                          <BookOpenIcon className="h-3 w-3 mr-1" />
                          Recursos
                        </button>
                        <button
                          onClick={() => onClinicalAssessment(patient)}
                          className="inline-flex items-center px-2 py-1.5 border border-purple-300 text-xs font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors duration-200"
                        >
                          Evaluación
                        </button>
                        <ExportDropdown
                          patientId={patient.id}
                          showPatientOptions={true}
                          showConsultationOptions={false}
                          showTableOption={false}
                          className="scale-90 origin-left"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tarjetas de estadísticas con diseño MindHub */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div 
            className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)',
              borderLeft: '4px solid var(--primary-500)'
            }}
          >
            <div className="flex items-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
                  color: 'var(--primary-600)'
                }}
              >
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <div 
                  className="text-2xl font-bold"
                  style={{ 
                    color: 'var(--dark-green)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {stats.totalPatients}
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: 'var(--neutral-600)' }}
                >
                  Pacientes Totales
                </div>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)',
              borderLeft: '4px solid var(--secondary-500)'
            }}
          >
            <div className="flex items-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, var(--secondary-100), var(--secondary-200))',
                  color: 'var(--secondary-600)'
                }}
              >
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <div 
                  className="text-2xl font-bold"
                  style={{ 
                    color: 'var(--dark-green)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {stats.todayAppointments}
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: 'var(--neutral-600)' }}
                >
                  Consultas Hoy
                </div>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)',
              borderLeft: '4px solid var(--accent-500)'
            }}
          >
            <div className="flex items-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-100), var(--accent-200))',
                  color: 'var(--accent-600)'
                }}
              >
                <ClipboardDocumentListIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <div 
                  className="text-2xl font-bold"
                  style={{ 
                    color: 'var(--dark-green)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {stats.pendingAssessments}
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: 'var(--neutral-600)' }}
                >
                  Evaluaciones
                </div>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
            style={{ 
              border: '1px solid rgba(8, 145, 178, 0.1)',
              boxShadow: 'var(--shadow)',
              borderLeft: '4px solid #f59e0b'
            }}
          >
            <div className="flex items-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  color: '#d97706'
                }}
              >
                <DocumentTextIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <div 
                  className="text-2xl font-bold"
                  style={{ 
                    color: 'var(--dark-green)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {stats.todayPrescriptions}
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: 'var(--neutral-600)' }}
                >
                  Recetas Hoy
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Resources Integration Modal */}
      {showResourcesModal && selectedPatientForResources && (
        <ResourcesIntegration
          patientId={selectedPatientForResources.id}
          patientName={`${selectedPatientForResources.first_name} ${selectedPatientForResources.paternal_last_name}`}
          isOpen={showResourcesModal}
          onClose={handleCloseResources}
          onResourceSent={handleResourceSent}
        />
      )}

    </div>
  );
}