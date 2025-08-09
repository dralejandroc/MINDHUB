'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import ExpedientsGrid from '@/components/expedix/ExpedientsGrid';
import PatientDashboard from '@/components/expedix/PatientDashboard';
import ConsultationNotes from '@/components/expedix/ConsultationNotes';
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
import { expedixApi } from '@/lib/api/expedix-client';
import type { Patient } from '@/lib/api/expedix-client';
import { Button } from '@/components/ui/Button';

type ViewMode = 'list' | 'cards' | 'timeline' | 'expedient';
type DetailView = 'dashboard' | 'consultation' | 'assessment';

export default function ExpedixPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [detailView, setDetailView] = useState<DetailView>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load patient from URL parameters
  useEffect(() => {
    const patientId = searchParams?.get('patient');
    const action = searchParams?.get('action');
    
    if (patientId) {
      loadPatient(patientId, action);
    }
  }, [searchParams]);

  const loadPatient = async (patientId: string, action: string | null = null) => {
    try {
      setLoading(true);
      const response = await expedixApi.getPatient(patientId);
      if (response.data) {
        setSelectedPatient(response.data);
        
        // Set view based on action parameter
        setViewMode('expedient');
        if (action === 'consultation') {
          setDetailView('consultation');
        } else if (action === 'assessment') {
          setDetailView('assessment');
        } else {
          setDetailView('dashboard');
        }
      } else {
        // Patient not found, redirect back to expedients view
        handleBackToList();
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      // On error, redirect back to expedients view and clear URL params
      handleBackToList();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewMode('expedient');
    setDetailView('dashboard');
  };

  const handleNewConsultation = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewMode('expedient');
    setDetailView('consultation');
  };

  const handleClinicalAssessment = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewMode('expedient');
    setDetailView('assessment');
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setViewMode('cards'); // Reset to default view
    setDetailView('dashboard');
    // Update URL to remove patient parameter
    window.history.pushState({}, '', '/hubs/expedix');
  };

  const handleBackToPatientDashboard = () => {
    setDetailView('dashboard');
  };
  
  const handleNewPatient = () => {
    setShowNewPatientModal(true);
  };
  
  const handlePatientCreated = (newPatient: Patient) => {
    console.log('Paciente creado:', newPatient);
    window.location.reload();
  };
  
  const handleSettings = () => {
    console.log('Settings');
  };


  // Get page header info based on current view and patient
  const getPageHeaderInfo = () => {
    if (viewMode === 'expedient' && selectedPatient) {
      switch (detailView) {
        case 'dashboard':
          return {
            title: `Expediente - ${selectedPatient.first_name} ${selectedPatient.paternal_last_name}`,
            description: 'Historial clínico completo y timeline del paciente',
            icon: FolderOpenIcon,
            iconColor: 'text-primary-600'
          };
        case 'consultation':
          return {
            title: `${selectedPatient.first_name} ${selectedPatient.paternal_last_name}`,
            description: `Expediente médico • ${selectedPatient.age} años`,
            icon: UserIcon,
            iconColor: 'text-primary-600'
          };
        case 'assessment':
          return {
            title: `Evaluación - ${selectedPatient.first_name} ${selectedPatient.paternal_last_name}`,
            description: 'Escalas psicológicas y evaluaciones clínicas',
            icon: DocumentTextIcon,
            iconColor: 'text-purple-600'
          };
      }
    }
    
    return {
      title: 'Expedix - Sistema de Expedientes',
      description: 'Gestión completa de pacientes y expedientes médicos',
      icon: UserGroupIcon,
      iconColor: 'text-primary-600'
    };
  };

  const headerInfo = getPageHeaderInfo();

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando paciente...</span>
        </div>
      )}

      {/* Compact Header - Agenda Style */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {viewMode === 'expedient' && selectedPatient && (
              <Button onClick={handleBackToList} variant="outline" size="sm" className="h-8 px-2 text-xs mr-2">
                ← Volver
              </Button>
            )}
            <UserGroupIcon className="h-5 w-5 text-primary-600" />
            <h1 className="text-lg font-bold text-dark-green">
              {viewMode === 'expedient' && selectedPatient 
                ? `${selectedPatient.first_name} ${selectedPatient.paternal_last_name}` 
                : 'Expedix - Sistema de Expedientes'}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleSettings} variant="outline" size="sm" className="h-8 px-2 text-xs">
              <UserIcon className="h-3 w-3 mr-1" />
              Config
            </Button>
            <Button onClick={handleNewPatient} variant="primary" size="sm" className="h-8 px-2 text-xs">
              <PlusIcon className="h-3 w-3 mr-1" />
              Nuevo Paciente
            </Button>
          </div>
        </div>
      </div>
      
      {/* View Mode Selector with Search - Only show when not in expedient detail */}
      {viewMode !== 'expedient' && (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-primary-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* View Mode Buttons */}
            <div className="flex items-center space-x-0.5 bg-primary-50 p-0.5 rounded-lg border border-primary-200">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'gradient-primary text-white shadow-primary' 
                    : 'text-primary-600 hover:bg-primary-100'
                }`}
              >
                <TableCellsIcon className="h-3 w-3 inline mr-1" />
                Lista
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  viewMode === 'cards' 
                    ? 'gradient-primary text-white shadow-primary' 
                    : 'text-primary-600 hover:bg-primary-100'
                }`}
              >
                <Squares2X2Icon className="h-3 w-3 inline mr-1" />
                Tarjetas
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  viewMode === 'timeline' 
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* List View */}
      {viewMode === 'list' && (
        <PatientManagementAdvanced
          onSelectPatient={handleSelectPatient}
          onNewPatient={handleNewPatient}
          onNewConsultation={handleNewConsultation}
          onClinicalAssessment={handleClinicalAssessment}
          onSettings={handleSettings}
          onChangeView={setViewMode}
        />
      )}
      
      {/* Cards View */}
      {viewMode === 'cards' && (
        <ExpedientsGrid
          onSelectPatient={handleSelectPatient}
        />
      )}
      
      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <PatientTimeline
          onSelectPatient={handleSelectPatient}
        />
      )}
      
      {/* Expedient Detail Views */}
      {viewMode === 'expedient' && selectedPatient && (
        <>
          {detailView === 'dashboard' && (
            <PatientDashboard
              patient={selectedPatient}
              onClose={handleBackToList}
              onNewConsultation={() => handleNewConsultation(selectedPatient)}
              onClinicalAssessment={() => handleClinicalAssessment(selectedPatient)}
            />
          )}

          {detailView === 'consultation' && (
            <ConsultationNotes
              patient={selectedPatient}
              onSaveConsultation={(data) => {
                console.log('Consulta guardada:', data);
                handleBackToPatientDashboard();
              }}
              onCancel={handleBackToPatientDashboard}
            />
          )}

          {detailView === 'assessment' && (
            <ClinimetrixScaleSelector
              patient={{
                id: selectedPatient.id,
                first_name: selectedPatient.first_name,
                paternal_last_name: selectedPatient.paternal_last_name,
                maternal_last_name: selectedPatient.maternal_last_name,
                age: selectedPatient.age
              }}
              onClose={handleBackToPatientDashboard}
              consultationId={undefined} // TODO: Pasar ID de consulta si hay una abierta
            />
          )}
        </>
      )}
      
      {/* New Patient Modal */}
      <NewPatientModal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        onSuccess={handlePatientCreated}
      />
    </div>
  );
}