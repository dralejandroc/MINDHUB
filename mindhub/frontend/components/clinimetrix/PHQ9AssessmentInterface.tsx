'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentCheckIcon, 
  UserIcon, 
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { PHQ9Scale } from './scales/PHQ9Scale';

// Types for assessment management
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  medicalRecordNumber: string;
}

interface AssessmentSession {
  id: string;
  patientId: string;
  sessionName: string;
  sessionDate: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  administeredBy: string;
  administrationMode: 'in_person' | 'remote' | 'self_administered';
}

interface PHQ9AssessmentInterfaceProps {
  patient?: Patient;
  sessionId?: string;
  onComplete?: (results: any) => void;
  onCancel?: () => void;
}

export const PHQ9AssessmentInterface: React.FC<PHQ9AssessmentInterfaceProps> = ({
  patient,
  sessionId,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<'select_patient' | 'configure_session' | 'administer_scale' | 'review_results'>('select_patient');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patient || null);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load patients for selection
  useEffect(() => {
    if (currentStep === 'select_patient' && !patient) {
      loadPatients();
    }
  }, [currentStep, patient]);

  // Auto-advance if patient is provided
  useEffect(() => {
    if (patient) {
      setSelectedPatient(patient);
      setCurrentStep('configure_session');
    }
  }, [patient]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/expedix/patients?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.data);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAssessmentSession = async (sessionData: Partial<AssessmentSession>) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/clinimetrix/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient?.id,
          sessionName: sessionData.sessionName,
          sessionType: 'routine',
          administrationMode: sessionData.administrationMode,
          location: 'clinic'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSession(data.data);
        setCurrentStep('administer_scale');
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScaleComplete = async (results: any) => {
    try {
      setIsLoading(true);
      
      // Save assessment results
      const response = await fetch('/api/clinimetrix/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session?.id,
          scaleId: 'phq-9',
          responses: results.responses,
          scores: results.scores,
          metadata: results.administrationMetadata,
          clinicalData: results.clinicalData,
          alerts: results.alerts
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAssessmentResults({
          ...results,
          assessmentId: data.data.id
        });
        setCurrentStep('review_results');
        
        if (onComplete) {
          onComplete({
            ...results,
            assessmentId: data.data.id
          });
        }
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName} ${p.medicalRecordNumber}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Step 1: Patient Selection
  const renderPatientSelection = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <UserIcon className="h-8 w-8 text-clinimetrix-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Seleccionar Paciente</h2>
          <p className="text-gray-600">Busque y seleccione el paciente para la evaluación</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o número de expediente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinimetrix-500"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <ArrowPathIcon className="h-8 w-8 text-clinimetrix-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Cargando pacientes...</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredPatients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => {
                setSelectedPatient(patient);
                setCurrentStep('configure_session');
              }}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-clinimetrix-300 hover:bg-clinimetrix-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Expediente: {patient.medicalRecordNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    Fecha de nacimiento: {new Date(patient.dateOfBirth).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}
          
          {filteredPatients.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron pacientes
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Step 2: Session Configuration
  const renderSessionConfiguration = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <CalendarDaysIcon className="h-8 w-8 text-clinimetrix-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configurar Sesión de Evaluación</h2>
          <p className="text-gray-600">Configure los detalles de la evaluación PHQ-9</p>
        </div>
      </div>

      {selectedPatient && (
        <div className="bg-clinimetrix-50 border border-clinimetrix-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-clinimetrix-900 mb-2">Paciente Seleccionado</h3>
          <p className="text-clinimetrix-800">
            <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
          </p>
          <p className="text-sm text-clinimetrix-600">
            Expediente: {selectedPatient.medicalRecordNumber}
          </p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la sesión
          </label>
          <input
            type="text"
            defaultValue={`Evaluación PHQ-9 - ${new Date().toLocaleDateString('es-MX')}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinimetrix-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modo de administración
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="administrationMode"
                value="in_person"
                defaultChecked
                className="mr-3 h-4 w-4 text-clinimetrix-600"
              />
              <span className="text-gray-700">Presencial con profesional</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="administrationMode"
                value="self_administered"
                className="mr-3 h-4 w-4 text-clinimetrix-600"
              />
              <span className="text-gray-700">Auto-administrada</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="administrationMode"
                value="remote"
                className="mr-3 h-4 w-4 text-clinimetrix-600"
              />
              <span className="text-gray-700">Remota (enlace por email)</span>
            </label>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Acerca del PHQ-9</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Evalúa síntomas depresivos en las últimas 2 semanas</li>
            <li>• 9 preguntas principales + 1 pregunta funcional</li>
            <li>• Tiempo estimado: 5 minutos</li>
            <li>• Incluye detección de riesgo suicida</li>
          </ul>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentStep('select_patient')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Cambiar Paciente
          </button>
          <button
            onClick={(e) => {
              const form = e.currentTarget.closest('div')?.querySelector('form') as HTMLFormElement;
              const formData = new FormData(form || e.currentTarget.closest('div') as HTMLElement);
              const sessionName = (document.querySelector('input[type="text"]') as HTMLInputElement)?.value;
              const administrationMode = (document.querySelector('input[name="administrationMode"]:checked') as HTMLInputElement)?.value;
              
              createAssessmentSession({
                sessionName: sessionName || `Evaluación PHQ-9 - ${new Date().toLocaleDateString('es-MX')}`,
                administrationMode: administrationMode as any || 'in_person'
              });
            }}
            disabled={isLoading}
            className="px-6 py-2 bg-clinimetrix-600 text-white rounded-lg hover:bg-clinimetrix-700 font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creando...' : 'Iniciar Evaluación'}
          </button>
        </div>
      </div>
    </div>
  );

  // Step 3: Scale Administration
  const renderScaleAdministration = () => (
    <PHQ9Scale
      patientId={selectedPatient?.id || ''}
      administrationType={session?.administrationMode === 'in_person' ? 'clinician_administered' : 'self_administered'}
      onComplete={handleScaleComplete}
      onSave={(responses) => {
        // Auto-save functionality
        console.log('Auto-saving responses:', responses);
      }}
    />
  );

  // Step 4: Results Review
  const renderResultsReview = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <CheckCircleIcon className="h-8 w-8 text-green-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Evaluación Completada</h2>
          <p className="text-gray-600">Revise los resultados del PHQ-9</p>
        </div>
      </div>

      {selectedPatient && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Información del Paciente</h3>
          <p><strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong></p>
          <p className="text-sm text-gray-600">Expediente: {selectedPatient.medicalRecordNumber}</p>
          <p className="text-sm text-gray-600">Fecha: {new Date().toLocaleDateString('es-MX')}</p>
        </div>
      )}

      {assessmentResults && (
        <div className="space-y-6">
          {/* Score Display */}
          <div className="bg-gradient-to-r from-clinimetrix-600 to-clinimetrix-700 text-white p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-2">Puntuación PHQ-9</h3>
            <div className="text-3xl font-bold">
              {assessmentResults.scores.totalScore}/27
            </div>
            <p className="opacity-90 mt-2">
              Severidad: {assessmentResults.scores.severity}
            </p>
          </div>

          {/* Interpretation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Interpretación Clínica</h4>
            <p className="text-blue-800">{assessmentResults.scores.interpretation}</p>
          </div>

          {/* Recommendations */}
          {assessmentResults.scores.recommendations && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Recomendaciones</h4>
              <ul className="text-green-800 space-y-1">
                {assessmentResults.scores.recommendations.map((rec: string, index: number) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Clinical Alerts */}
          {assessmentResults.alerts && assessmentResults.alerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">
                <ExclamationTriangleIcon className="h-5 w-5 inline mr-1" />
                Alertas Clínicas
              </h4>
              <div className="space-y-2">
                {assessmentResults.alerts.map((alert: any, index: number) => (
                  <div key={index} className="text-red-800">
                    <strong>{alert.title}</strong>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DSM-5 Analysis */}
          {assessmentResults.clinicalData?.dsm5_criteria && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">Análisis DSM-5</h4>
              <div className="text-purple-800 space-y-1">
                <p>
                  <strong>Síntomas centrales:</strong> {assessmentResults.clinicalData.dsm5_criteria.core_symptom_count}/2
                </p>
                <p>
                  <strong>Síntomas totales:</strong> {assessmentResults.clinicalData.dsm5_criteria.total_symptom_count}/9
                </p>
                <p>
                  <strong>Umbral de síntomas:</strong> {assessmentResults.clinicalData.dsm5_criteria.meets_symptom_threshold ? 'Sí' : 'No'} (≥5 síntomas)
                </p>
                <p>
                  <strong>Probable episodio depresivo mayor:</strong> {assessmentResults.clinicalData.dsm5_criteria.probable_major_depression ? 'Sí' : 'No'}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={() => {
                // Generate PDF report
                console.log('Generating PDF report...');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              📄 Generar Reporte
            </button>
            <button
              onClick={() => {
                // Start new assessment
                setCurrentStep('select_patient');
                setSelectedPatient(null);
                setSession(null);
                setAssessmentResults(null);
              }}
              className="px-4 py-2 bg-clinimetrix-600 text-white rounded-lg hover:bg-clinimetrix-700 font-medium"
            >
              🔄 Nueva Evaluación
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinimetrix-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <ClipboardDocumentCheckIcon className="h-10 w-10 text-clinimetrix-600" />
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Evaluación PHQ-9</h1>
          </div>
          <p className="text-gray-600">Cuestionario de Salud del Paciente para síntomas depresivos</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[
              { step: 'select_patient', label: 'Paciente', number: 1 },
              { step: 'configure_session', label: 'Configuración', number: 2 },
              { step: 'administer_scale', label: 'Evaluación', number: 3 },
              { step: 'review_results', label: 'Resultados', number: 4 }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === item.step 
                    ? 'bg-clinimetrix-600 text-white' 
                    : ['select_patient', 'configure_session', 'administer_scale'].indexOf(currentStep) > index
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {['select_patient', 'configure_session', 'administer_scale'].indexOf(currentStep) > index ? '✓' : item.number}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === item.step ? 'text-clinimetrix-600' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
                {index < 3 && (
                  <div className={`w-8 h-px mx-4 ${
                    ['select_patient', 'configure_session', 'administer_scale'].indexOf(currentStep) > index
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {currentStep === 'select_patient' && renderPatientSelection()}
        {currentStep === 'configure_session' && renderSessionConfiguration()}
        {currentStep === 'administer_scale' && renderScaleAdministration()}
        {currentStep === 'review_results' && renderResultsReview()}
      </div>
    </div>
  );
};

export default PHQ9AssessmentInterface;