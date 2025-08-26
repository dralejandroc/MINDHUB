'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, PlusIcon, MagnifyingGlassIcon, CalendarIcon, ClipboardDocumentListIcon, DocumentTextIcon, CogIcon, BookOpenIcon, DocumentArrowDownIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useExpedixApi, type Patient } from '@/lib/api/expedix-client';
import ResourcesIntegration from './ResourcesIntegration';
import ExportDropdown from './ExportDropdown';

interface PatientManagementProps {
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
  onNewConsultation: (patient: Patient) => void;
  onClinicalAssessment: (patient: Patient) => void;
  onScheduleAppointment?: (patient: Patient) => void;
  onSettings?: () => void;
}

export default function PatientManagement({
  onSelectPatient,
  onNewPatient,
  onNewConsultation,
  onClinicalAssessment,
  onScheduleAppointment,
  onSettings
}: PatientManagementProps) {
  // Use the authenticated Expedix API hook
  const expedixApi = useExpedixApi();
  
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

  // Fetch patients from API using the authenticated API client
  const fetchPatients = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching patients from API with authentication...');
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

  // Fetch dashboard stats (temporarily disabled - these methods need to be added to the hook)
  const fetchStats = async () => {
    try {
      // TODO: Add these methods to useExpedixApi hook
      // For now, just set empty stats to avoid errors
      setStats(prev => ({
        ...prev,
        todayAppointments: 0,
        pendingAssessments: 0,
        todayPrescriptions: 0
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
                {searchTerm ? 'Sin resultados' : 'Sistema de expedientes médicos'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'No se encontraron pacientes que coincidan con tu búsqueda.' 
                  : 'Gestión completa de pacientes y expedientes médicos. Comienza agregando tu primer paciente al sistema.'
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
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Paciente</div>
                  <div className="col-span-2">Info</div>
                  <div className="col-span-3">Contacto</div>
                  <div className="col-span-3">Acciones</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <div key={patient.id} className="px-4 py-3 hover:bg-gray-50 transition-colors duration-150">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* Patient Info */}
                      <div className="col-span-4 flex items-center">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3"
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
                            {patient.id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Age & Gender - More compact */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900">{patient.age || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : '-'}</div>
                      </div>

                      {/* Contact */}
                      <div className="col-span-3">
                        <div className="text-sm text-gray-900 truncate">{patient.cell_phone || 'N/A'}</div>
                        <div className="text-xs text-gray-500 truncate">{patient.email || 'N/A'}</div>
                      </div>

                      {/* Actions - More compact tag-style buttons */}
                      <div className="col-span-3 flex items-center space-x-1">
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-full transition-colors duration-200"
                        >
                          <ClipboardDocumentListIcon className="h-3 w-3 mr-0.5" />
                          Ver
                        </button>
                        <button
                          onClick={() => onNewConsultation(patient)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200"
                        >
                          <DocumentTextIcon className="h-3 w-3 mr-0.5" />
                          Consulta
                        </button>
                        {onScheduleAppointment && (
                          <button
                            onClick={() => onScheduleAppointment(patient)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-full transition-colors duration-200"
                          >
                            <CalendarIcon className="h-3 w-3 mr-0.5" />
                            Cita
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenResources(patient)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors duration-200"
                        >
                          <BookOpenIcon className="h-3 w-3 mr-0.5" />
                          Recursos
                        </button>
                        <button
                          onClick={() => onClinicalAssessment(patient)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-full transition-colors duration-200"
                        >
                          <DocumentChartBarIcon className="h-3 w-3 mr-0.5" />
                          Eval
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compact legends - only show when patients exist */}
        {patients.length > 0 && (
          <div className="bg-white rounded-lg p-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>{stats.totalPatients} pacientes</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                <span>{stats.todayAppointments} consultas hoy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>{stats.pendingAssessments} evaluaciones</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>{stats.todayPrescriptions} recetas hoy</span>
              </div>
            </div>
          </div>
        )}

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