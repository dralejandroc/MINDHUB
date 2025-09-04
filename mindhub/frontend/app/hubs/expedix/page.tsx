'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Clean Architecture: UI Layer imports
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState, PageLoadingSpinner } from '@/components/ui/loading/LoadingStates';
import { ErrorBoundary } from '@/components/ui/error/ErrorBoundary';
import { ErrorMessageResolver } from '@/components/ui/error/ErrorMessages';

// Clean Architecture: Feature component imports
import ExpedientsGrid from '@/components/expedix/ExpedientsGrid';
import PatientDashboard from '@/components/expedix/PatientDashboard';
import ConsultationNotes from '@/components/expedix/ConsultationNotes';
import CentralizedConsultationInterface from '@/components/expedix/consultation/CentralizedConsultationInterface';
import PatientManagementAdvanced from '@/components/expedix/PatientManagementAdvanced';
import PatientTimeline from '@/components/expedix/PatientTimeline';
import NewPatientModal from '@/components/expedix/NewPatientModal';
import ClinimetrixScaleSelector from '@/components/expedix/ClinimetrixScaleSelector';
import { 
  DocumentTextIcon, 
  UserIcon,
  UserGroupIcon,
  TableCellsIcon,
  Squares2X2Icon,
  FolderOpenIcon,
  PlusIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
// Clean Architecture: API Layer imports
import { expedixApi } from '@/lib/api/expedix-client';
import type { Patient } from '@/lib/api/expedix-client';
import { Button } from '@/components/ui/Button';

// Clean Architecture: Domain entities and types
type ViewMode = 'list' | 'cards' | 'timeline' | 'expedient';
type DetailView = 'dashboard' | 'consultation' | 'assessment';

interface ExpedixState {
  viewMode: ViewMode;
  detailView: DetailView;
  selectedPatient: Patient | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  showNewPatientModal: boolean;
}

// Clean Architecture: Use Cases - Expedix business logic
function ExpedixContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Clean Architecture: State management (Clean State)
  const [state, setState] = useState<ExpedixState>({
    viewMode: 'cards',
    detailView: 'dashboard',
    selectedPatient: null,
    loading: false,
    error: null,
    searchTerm: '',
    showNewPatientModal: false
  });

  // Clean Architecture: Set document title (UI layer concern)
  useEffect(() => {
    document.title = 'Gestión de Pacientes - Expedix - MindHub';
  }, []);

  // Load patient from URL parameters
  useEffect(() => {
    const patientId = searchParams?.get('patient');
    const action = searchParams?.get('action');
    
    if (patientId) {
      loadPatient(patientId, action);
    }
  }, [searchParams]);

  // Clean Architecture: Use Case - Load patient data
  const loadPatient = async (patientId: string, action: string | null = null) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await expedixApi.getPatient(patientId);
      
      if (response.data) {
        setState(prev => ({
          ...prev,
          selectedPatient: response.data,
          viewMode: 'expedient',
          detailView: action === 'consultation' ? 'consultation' : 
                     action === 'assessment' ? 'assessment' : 'dashboard',
          loading: false,
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Paciente no encontrado'
        }));
        console.warn('Patient not found with ID:', patientId);
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar el paciente'
      }));
    }
  };

  // Clean Architecture: UI Event handlers
  const handleSelectPatient = (patient: Patient) => {
    setState(prev => ({
      ...prev,
      selectedPatient: patient,
      viewMode: 'expedient',
      detailView: 'dashboard'
    }));
  };

  const handleNewConsultation = (patient: Patient) => {
    setState(prev => ({
      ...prev,
      selectedPatient: patient,
      viewMode: 'expedient',
      detailView: 'consultation'
    }));
  };

  const handleClinicalAssessment = (patient: Patient) => {
    setState(prev => ({
      ...prev,
      selectedPatient: patient,
      viewMode: 'expedient',
      detailView: 'assessment'
    }));
  };

  const handleBackToList = () => {
    setState(prev => ({
      ...prev,
      selectedPatient: null,
      viewMode: 'cards',
      detailView: 'dashboard',
      error: null
    }));
    // Clean URL
    window.history.pushState({}, '', '/hubs/expedix');
  };

  const handleBackToPatientDashboard = () => {
    setState(prev => ({ ...prev, detailView: 'dashboard' }));
  };
  
  const handleNewPatient = () => {
    setState(prev => ({ ...prev, showNewPatientModal: true }));
  };
  
  const handlePatientCreated = (newPatient: Patient) => {
    console.log('Paciente creado:', newPatient);
    window.location.reload();
  };
  
  const handleScheduleAppointment = (patient: Patient) => {
    // Navigate to agenda with patient pre-selected
    router.push(`/hubs/agenda?action=new&patient=${patient.id}&patientName=${encodeURIComponent(`${patient.first_name} ${patient.paternal_last_name}`)}`);
  };

  const handleSettings = () => {
    router.push('/hubs/expedix/settings');
  };



  // Clean Architecture: Error handling logic
  const handleRetry = () => {
    setState(prev => ({ ...prev, error: null }));
    const patientId = searchParams?.get('patient');
    if (patientId) {
      loadPatient(patientId, searchParams?.get('action'));
    }
  };

  return (
    <div className="min-h-screen w-full space-y-4 sm:space-y-6">
      {/* Clean Architecture: Error display */}
      {state.error && (
        <ErrorMessageResolver error={state.error} onRetry={handleRetry} />
      )}

      <PageHeader
        title="Expedix"
        icon={UserGroupIcon}
        actions={
          <div className="flex items-center space-x-2">
            {state.viewMode === 'expedient' && state.selectedPatient && (
              <Button onClick={handleBackToList} variant="outline" size="sm">
                ← Volver
              </Button>
            )}
            <Button onClick={handleSettings} variant="outline" size="sm">
              <UserIcon className="h-4 w-4 mr-1" />
              Configuración
            </Button>
            <Button onClick={handleNewPatient} variant="primary" size="sm">
              <PlusIcon className="h-4 w-4 mr-1" />
              Nuevo Paciente
            </Button>
          </div>
        }
      />
      
      {/* Clean Architecture: View Mode Selector - Only show when not in expedient detail */}
      <LoadingState
        isLoading={state.loading}
        error={null} // We handle error above
        loadingMessage="Cargando información del paciente..."
      >
        {state.viewMode !== 'expedient' && (
          <div className="bg-white p-3 rounded-xl shadow-lg border border-primary-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* View Mode Buttons */}
              <div className="flex items-center space-x-0.5 bg-primary-50 p-0.5 rounded-lg border border-primary-200">
                <button
                  onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    state.viewMode === 'list' 
                      ? 'gradient-primary text-white shadow-primary' 
                      : 'text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  <TableCellsIcon className="h-3 w-3 inline mr-1" />
                  Lista
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, viewMode: 'cards' }))}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    state.viewMode === 'cards' 
                      ? 'gradient-primary text-white shadow-primary' 
                      : 'text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  <Squares2X2Icon className="h-3 w-3 inline mr-1" />
                  Tarjetas
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, viewMode: 'timeline' }))}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    state.viewMode === 'timeline' 
                      ? 'gradient-primary text-white shadow-primary' 
                      : 'text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  <ClockIcon className="h-3 w-3 inline mr-1" />
                  Timeline
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="flex-1 w-full sm:w-auto">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar pacientes..."
                    value={state.searchTerm}
                    onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </LoadingState>
      
      {/* Clean Architecture: Different view modes */}
      {state.viewMode === 'list' && (
        <PatientManagementAdvanced
          onSelectPatient={handleSelectPatient}
          onNewPatient={handleNewPatient}
          onNewConsultation={handleNewConsultation}
          onClinicalAssessment={handleClinicalAssessment}
          onScheduleAppointment={handleScheduleAppointment}
          onSettings={handleSettings}
          onChangeView={(mode: ViewMode) => setState(prev => ({ ...prev, viewMode: mode }))}
        />
      )}
      
      {state.viewMode === 'cards' && (
        <ExpedientsGrid
          onSelectPatient={handleSelectPatient}
        />
      )}
      
      {state.viewMode === 'timeline' && (
        <div className="bg-white rounded-xl p-6 border shadow">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Vista Timeline Global</h3>
          <p className="text-gray-600 text-center py-8">
            Selecciona un paciente específico para ver su timeline médico completo
          </p>
          <div className="text-center">
            <button
              onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Ver Lista de Pacientes
            </button>
          </div>
        </div>
      )}
      
      {/* Clean Architecture: Expedient Detail Views */}
      {state.viewMode === 'expedient' && state.selectedPatient && (
        <>
          {state.detailView === 'dashboard' && (
            <PatientDashboard
              patient={state.selectedPatient}
              onClose={handleBackToList}
              onNewConsultation={() => handleNewConsultation(state.selectedPatient!)}
              onClinicalAssessment={() => handleClinicalAssessment(state.selectedPatient!)}
            />
          )}

          {state.detailView === 'consultation' && (
            <CentralizedConsultationInterface
              patient={state.selectedPatient}
              consultationId={searchParams?.get('consultation') || undefined}
              onClose={handleBackToPatientDashboard}
              onSave={(data) => {
                console.log('Consulta guardada:', data);
                handleBackToPatientDashboard();
              }}
            />
          )}

          {state.detailView === 'assessment' && (
            <ClinimetrixScaleSelector
              patient={{
                id: state.selectedPatient.id,
                first_name: state.selectedPatient.first_name,
                paternal_last_name: state.selectedPatient.paternal_last_name,
                maternal_last_name: state.selectedPatient.maternal_last_name,
                age: state.selectedPatient.age
              }}
              onClose={handleBackToPatientDashboard}
              consultationId={undefined}
            />
          )}
        </>
      )}
      
      {/* Clean Architecture: Modal Management */}
      <NewPatientModal
        isOpen={state.showNewPatientModal}
        onClose={() => setState(prev => ({ ...prev, showNewPatientModal: false }))}
        onSuccess={handlePatientCreated}
      />
    </div>
  );
}

// Clean Architecture: Main component with proper error boundaries and loading states
export default function ExpedixPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingSpinner message="Cargando Expedix..." />}>
        <ExpedixContent />
      </Suspense>
    </ErrorBoundary>
  );
}