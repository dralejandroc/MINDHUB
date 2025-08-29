/**
 * COMPONENTE OPTIMIZADO - PatientDashboard
 * Implementa lazy loading, memoización y Clean Architecture
 */

'use client';

import React, { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { 
  UserIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  XMarkIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  BookOpenIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Patient } from '@/lib/api/expedix-client';
import { Button } from '@/components/ui/Button';

// Lazy loading de componentes pesados
const PatientTimeline = lazy(() => import('./PatientTimeline'));
const PatientDocuments = lazy(() => import('./PatientDocuments'));
const PatientAssessments = lazy(() => import('./PatientAssessments'));
const ResourcesTimeline = lazy(() => import('./ResourcesTimeline'));
const ConsultationNotesOptimized = lazy(() => import('./ConsultationNotesOptimized'));

interface PatientDashboardOptimizedProps {
  patient: Patient;
  onClose: () => void;
  onNewConsultation: () => void;
  onClinicalAssessment: () => void;
}

type TabId = 'timeline' | 'config' | 'consultations' | 'prescriptions' | 'assessments' | 'administrative' | 'resources' | 'documents';

interface Tab {
  id: TabId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  lazy?: boolean;
}

export default function PatientDashboardOptimized({ 
  patient, 
  onClose, 
  onNewConsultation, 
  onClinicalAssessment 
}: PatientDashboardOptimizedProps) {
  const [activeTab, setActiveTab] = useState<TabId>('timeline');
  const [editingPatient, setEditingPatient] = useState(false);
  const [patientData, setPatientData] = useState<Patient>(patient);

  // Configuración de tabs con lazy loading
  const tabs: Tab[] = useMemo(() => [
    { id: 'timeline', name: 'Timeline', icon: ClipboardDocumentListIcon, lazy: true },
    { id: 'config', name: 'Datos personales', icon: UserIcon },
    { id: 'consultations', name: 'Consultas', icon: CalendarIcon },
    { id: 'prescriptions', name: 'Recetas', icon: DocumentTextIcon },
    { id: 'assessments', name: 'Evaluaciones', icon: DocumentChartBarIcon, lazy: true },
    { id: 'administrative', name: 'Administrativo', icon: CogIcon },
    { id: 'resources', name: 'Recursos', icon: BookOpenIcon, lazy: true },
    { id: 'documents', name: 'Documentos', icon: DocumentArrowDownIcon, lazy: true }
  ], []);

  // Handlers optimizados con useCallback
  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const handlePatientUpdate = useCallback((updatedPatient: Patient) => {
    setPatientData(updatedPatient);
    setEditingPatient(false);
  }, []);

  const handleEditToggle = useCallback(() => {
    setEditingPatient(prev => !prev);
  }, []);

  // Loading fallback component
  const LoadingFallback = ({ message = "Cargando..." }: { message?: string }) => (
    <div className="flex items-center justify-center py-12">
      <div className="space-y-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );

  // Render optimizado de contenido por tab
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'timeline':
        return (
          <Suspense fallback={<LoadingFallback message="Cargando timeline del paciente..." />}>
            <PatientTimeline patient={patientData} />
          </Suspense>
        );

      case 'config':
        return (
          <PatientConfigSection 
            patient={patientData}
            isEditing={editingPatient}
            onUpdate={handlePatientUpdate}
            onEditToggle={handleEditToggle}
          />
        );

      case 'consultations':
        return <ConsultationsSection patient={patientData} />;

      case 'prescriptions':
        return <PrescriptionsSection patient={patientData} />;

      case 'assessments':
        return (
          <Suspense fallback={<LoadingFallback message="Cargando evaluaciones..." />}>
            <PatientAssessments patient={patientData} />
          </Suspense>
        );

      case 'administrative':
        return <AdministrativeSection patient={patientData} />;

      case 'resources':
        return (
          <Suspense fallback={<LoadingFallback message="Cargando recursos..." />}>
            <ResourcesTimeline patient={patientData} />
          </Suspense>
        );

      case 'documents':
        return (
          <Suspense fallback={<LoadingFallback message="Cargando documentos..." />}>
            <PatientDocuments patient={patientData} />
          </Suspense>
        );

      default:
        return <div>Sección no encontrada</div>;
    }
  }, [activeTab, patientData, editingPatient, handlePatientUpdate, handleEditToggle]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {patientData.first_name} {patientData.last_name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                ID: {patientData.id} | Edad: {calculateAge(patientData.date_of_birth)} años
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={onNewConsultation}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Nueva Consulta
              </Button>
              
              <Button
                onClick={onClinicalAssessment}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <DocumentChartBarIcon className="w-4 h-4 mr-2" />
                Evaluación
              </Button>
              
              <Button
                onClick={onClose}
                variant="outline"
                className="text-gray-600 border-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r bg-gray-50 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes internos optimizados
const PatientConfigSection = React.memo(({ 
  patient, 
  isEditing, 
  onUpdate, 
  onEditToggle 
}: {
  patient: Patient;
  isEditing: boolean;
  onUpdate: (patient: Patient) => void;
  onEditToggle: () => void;
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-semibold">Información del Paciente</h3>
      <Button onClick={onEditToggle} variant="outline">
        {isEditing ? 'Cancelar' : 'Editar'}
      </Button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre Completo
        </label>
        <p className="text-gray-900">{patient.first_name} {patient.last_name}</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha de Nacimiento
        </label>
        <p className="text-gray-900">{formatDate(patient.date_of_birth)}</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <p className="text-gray-900">{patient.email || 'No registrado'}</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono
        </label>
        <p className="text-gray-900">{patient.phone || 'No registrado'}</p>
      </div>
    </div>
  </div>
));

const ConsultationsSection = React.memo(({ patient }: { patient: Patient }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Historial de Consultas</h3>
    <div className="text-gray-600">
      <p>Lista de consultas del paciente...</p>
      {/* TODO: Implementar lista de consultas */}
    </div>
  </div>
));

const PrescriptionsSection = React.memo(({ patient }: { patient: Patient }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Recetas Médicas</h3>
    <div className="text-gray-600">
      <p>Lista de recetas del paciente...</p>
      {/* TODO: Implementar lista de recetas */}
    </div>
  </div>
));

const AdministrativeSection = React.memo(({ patient }: { patient: Patient }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Información Administrativa</h3>
    <div className="text-gray-600">
      <p>Información financiera y administrativa del paciente...</p>
      {/* TODO: Implementar datos administrativos */}
    </div>
  </div>
));

// Utility functions
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}