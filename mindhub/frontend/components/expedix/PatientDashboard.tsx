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
import { expedixApi } from '@/lib/api/expedix-client';
import ResourcesTimeline from './ResourcesTimeline';
import PatientTimeline from './PatientTimeline';
import PatientDocuments from './PatientDocuments';
import { Button } from '@/components/ui/Button';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  medicalRecordNumber: string;
  email: string;
  cellPhone: string;
  dateOfBirth: string;
  age: number;
}

interface PatientDashboardProps {
  patient: Patient;
  onClose: () => void;
  onNewConsultation: () => void;
  onClinicalAssessment: () => void;
}

interface DashboardData {
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
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    prescriptions: [],
    appointments: [],
    documents: [],
    assessments: []
  });

  const tabs = [
    { id: 'timeline', name: 'Timeline', icon: ClipboardDocumentListIcon },
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
      // const data = await expedixApi.getPatientDashboard(patient.id);
      // setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h1>
              <p className="text-blue-100">Expediente: {patient.medicalRecordNumber}</p>
              <p className="text-blue-100">{patient.age} años • {patient.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
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
                  firstName: patient.firstName,
                  lastName: patient.lastName,
                  age: patient.age,
                  medicalRecordNumber: patient.medicalRecordNumber
                }}
                onNewConsultation={onNewConsultation}
                onClinicalAssessment={onClinicalAssessment}
              />
            )}

            {activeTab === 'consultations' && (
              <div className="bg-white rounded-xl p-6 border shadow">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Historial de Consultas</h3>
                <div className="text-center py-6">
                  <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No hay consultas registradas</p>
                  <p className="text-gray-400 text-xs mt-1">Usa el botón "Nueva Consulta" arriba para agregar una</p>
                </div>
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
              <div className="bg-white rounded-xl p-6 border shadow">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Evaluaciones Clínicas</h3>
                <div className="text-center py-8">
                  <DocumentChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay evaluaciones registradas</p>
                  <button
                    onClick={onClinicalAssessment}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                  >
                    Nueva Evaluación
                  </button>
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
                  patientName={`${patient.firstName} ${patient.lastName}`}
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
                  patientName={`${patient.firstName} ${patient.lastName}`}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}