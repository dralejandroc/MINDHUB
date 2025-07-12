'use client';

import { useState } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import PatientManagement from '@/components/expedix/PatientManagement';
import ConsultationForm from '@/components/expedix/ConsultationForm';
import NewPatientForm from '@/components/expedix/NewPatientForm';
import PHQ9Scale from '@/components/clinimetrix/PHQ9Scale';

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  birth_date: string;
  age: number;
  gender: 'masculine' | 'feminine';
  email: string;
  cell_phone: string;
  created_at: string;
  updated_at: string;
}

type PageView = 'dashboard' | 'new-patient' | 'patient-detail' | 'consultation' | 'clinical-assessment' | 'clinical-dashboard';

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
      const response = await fetch('http://localhost:8080/api/expedix/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Error al crear el paciente');
      }

      const result = await response.json();
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
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Expedi+Recetix</h1>
                  <p className="text-gray-600">Sistema Integral de Expedientes y Recetas Digitales</p>
                </div>
              </div>
            </div>

            <PatientManagement
              onSelectPatient={handleSelectPatient}
              onNewPatient={handleNewPatient}
              onNewConsultation={handleNewConsultation}
              onClinicalAssessment={handleClinicalAssessment}
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
              patient={selectedPatient}
              onSaveConsultation={handleSaveConsultation}
              onCancel={() => setCurrentView('dashboard')}
            />
          </div>
        ) : null;

      case 'clinical-assessment':
        return selectedPatient ? (
          <PHQ9Scale
            patient={selectedPatient}
            onComplete={handleSaveAssessment}
            onCancel={() => setCurrentView('dashboard')}
          />
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
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Volver al Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Expediente: {selectedPatient.first_name} {selectedPatient.paternal_last_name}
              </h1>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <p className="text-gray-600 text-center mb-4">
                Vista detallada del expediente del paciente (próximamente)
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleNewConsultation(selectedPatient)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  🩺 Nueva Consulta
                </button>
                <button
                  onClick={() => handleClinicalAssessment(selectedPatient)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  📋 Evaluación PHQ-9
                </button>
              </div>
            </div>
          </div>
        ) : null;

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