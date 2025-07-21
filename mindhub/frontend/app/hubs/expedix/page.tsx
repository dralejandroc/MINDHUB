'use client';

import { useState } from 'react';
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import PatientManagement from '@/components/expedix/PatientManagement';
import PatientDashboard from '@/components/expedix/PatientDashboard';
import ExpedixFeatures from '@/components/expedix/ExpedixFeatures';
import ConsultationForm from '@/components/expedix/ConsultationForm';
import NewPatientForm from '@/components/expedix/NewPatientForm';
import { UniversalScalesProvider } from '@/contexts/UniversalScalesContext';
import { UniversalScaleAssessment } from '@/components/clinimetrix/UniversalScaleAssessment';
import { expedixApi, type Patient } from '@/lib/api/expedix-client';
import SettingsPage from './settings/page';

type PageView = 'dashboard' | 'features' | 'new-patient' | 'patient-detail' | 'consultation' | 'clinical-assessment' | 'clinical-dashboard' | 'settings';

export default function ExpedixPage() {
  const [currentView, setCurrentView] = useState<PageView>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView('patient-detail');
  };

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setCurrentView('new-patient');
  };

  const handleNewConsultation = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView('consultation');
  };

  const handleClinicalAssessment = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView('clinical-assessment');
  };

  const handleSaveConsultation = (consultationData: any) => {
    const newConsultation = {
      ...consultationData,
      id: `consultation_${Date.now()}`,
      patientId: selectedPatient?.id,
      createdAt: new Date().toISOString()
    };
    setConsultations(prev => [...prev, newConsultation]);
    setCurrentView('dashboard');
    setSelectedPatient(null);
  };

  const handleSaveAssessment = (assessmentData: any) => {
    setAssessments(prev => [...prev, assessmentData]);
    setCurrentView('dashboard');
    setSelectedPatient(null);
  };

  const handleSaveNewPatient = async (patientData: any) => {
    try {
      const result = await expedixApi.createPatient(patientData);
      console.log('Paciente creado exitosamente:', result);
      
      // Mostrar información del paciente creado
      const patientName = `${result.data.first_name} ${result.data.paternal_last_name}`;
      
      // Volver al dashboard después de crear el paciente
      setTimeout(() => {
        setCurrentView('dashboard');
      }, 2000); // Dar tiempo para que el usuario vea el mensaje de éxito
      
    } catch (error) {
      console.error('Error al guardar paciente:', error);
      throw error; // Re-throw para que el formulario maneje el estado de loading
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <>
            <PageHeader
              title="Expedix - Gestión de Pacientes"
              description="Sistema integral de expedientes médicos y gestión de pacientes"
              icon={UserGroupIcon}
              iconColor="text-primary-600"
              actions={
                <Button 
                  onClick={handleNewPatient}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nuevo Paciente
                </Button>
              }
            />
            <PatientManagement
              onSelectPatient={handleSelectPatient}
              onNewPatient={handleNewPatient}
              onNewConsultation={handleNewConsultation}
              onClinicalAssessment={handleClinicalAssessment}
              onSettings={() => setCurrentView('settings')}
            />
          </>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Volver al Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Funcionalidades de Expedix
              </h1>
            </div>
            <ExpedixFeatures 
              onFeatureClick={(feature) => {
                console.log('Feature clicked:', feature);
                // Aquí se pueden agregar navegaciones específicas por funcionalidad
              }}
            />
          </div>
        );

      case 'consultation':
        return selectedPatient ? (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Volver al Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Nueva Consulta + Receta Digital 💊
              </h1>
            </div>
            <ConsultationForm
              patient={{
                ...selectedPatient,
                firstName: selectedPatient.first_name,
                paternalLastName: selectedPatient.paternal_last_name,
                maternalLastName: selectedPatient.maternal_last_name,
                birthDate: selectedPatient.birth_date,
                cellPhone: selectedPatient.cell_phone
              }}
              onSaveConsultation={handleSaveConsultation}
              onCancel={() => setCurrentView('dashboard')}
            />
          </div>
        ) : null;

      case 'clinical-assessment':
        return selectedPatient ? (
          <UniversalScalesProvider>
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Volver al Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Evaluación Clínica - {selectedPatient.first_name} {selectedPatient.paternal_last_name}
                </h1>
              </div>
              <UniversalScaleAssessment
                onBack={() => setCurrentView('dashboard')}
                onComplete={handleSaveAssessment}
              />
            </div>
          </UniversalScalesProvider>
        ) : null;

      case 'new-patient':
        return (
          <NewPatientForm
            onSave={handleSaveNewPatient}
            onCancel={() => setCurrentView('dashboard')}
          />
        );

      case 'patient-detail':
        return selectedPatient ? (
          <PatientDashboard
            patient={{
              id: selectedPatient.id,
              firstName: selectedPatient.first_name,
              lastName: `${selectedPatient.paternal_last_name} ${selectedPatient.maternal_last_name}`,
              medicalRecordNumber: `MR-${selectedPatient.id.slice(-6)}`,
              email: selectedPatient.email,
              cellPhone: selectedPatient.cell_phone,
              dateOfBirth: selectedPatient.birth_date,
              age: selectedPatient.age
            }}
            onClose={() => setCurrentView('dashboard')}
            onNewConsultation={() => handleNewConsultation(selectedPatient)}
            onClinicalAssessment={() => handleClinicalAssessment(selectedPatient)}
          />
        ) : null;

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Volver al Dashboard
              </button>
            </div>
            <SettingsPage />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderCurrentView()}
    </div>
  );
}