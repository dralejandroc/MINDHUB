'use client';

import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ClipboardDocumentListIcon,
  BeakerIcon,
  XMarkIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
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
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    prescriptions: [],
    appointments: [],
    documents: [],
    assessments: []
  });

  useEffect(() => {
    loadPatientData();
  }, [patient.id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      // Simulate API calls - replace with actual API when available
      setTimeout(() => {
        setDashboardData({
          prescriptions: [
            {
              id: '1',
              date: '2025-07-15',
              medications: ['Sertralina 50mg', 'Lorazepam 1mg'],
              status: 'active'
            }
          ],
          appointments: [
            {
              id: '1',
              date: '2025-07-25',
              time: '10:00',
              type: 'Consulta de seguimiento',
              status: 'scheduled'
            }
          ],
          documents: [
            {
              id: '1',
              name: 'Reporte de laboratorio',
              date: '2025-07-10',
              type: 'PDF'
            }
          ],
          assessments: [
            {
              id: '1',
              date: '2025-07-12',
              scale: 'PHQ-9',
              score: 12,
              severity: 'Moderado'
            }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading patient data:', error);
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'Información General', icon: UserIcon },
    { id: 'consultations', name: 'Consultas', icon: CalendarIcon },
    { id: 'prescriptions', name: 'Recetas', icon: BeakerIcon },
    { id: 'assessments', name: 'Evaluaciones', icon: ClipboardDocumentListIcon },
    { id: 'documents', name: 'Documentos', icon: DocumentTextIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header del Paciente */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-lg font-bold">
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center">
                    <IdentificationIcon className="h-4 w-4 mr-1" />
                    {patient.medicalRecordNumber}
                  </span>
                  <span>{patient.age} años</span>
                  <span>{new Date(patient.dateOfBirth).toLocaleDateString('es-MX')}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button onClick={onNewConsultation} variant="primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Consulta
            </Button>
            <Button onClick={onClinicalAssessment} variant="outline">
              <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
              Evaluación
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center space-x-6">
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2" />
            {patient.cellPhone}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            {patient.email}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600">Cargando información...</span>
          </div>
        ) : (
          <div>
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="lg:col-span-2">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre Completo
                        </label>
                        <p className="text-sm text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Nacimiento
                        </label>
                        <p className="text-sm text-gray-900">
                          {new Date(patient.dateOfBirth).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <p className="text-sm text-gray-900">{patient.cellPhone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <p className="text-sm text-gray-900">{patient.email}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">12</p>
                        <p className="text-sm text-gray-600">Consultas Totales</p>
                      </div>
                      <CalendarIcon className="h-8 w-8 text-blue-600" />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">2</p>
                        <p className="text-sm text-gray-600">Recetas Activas</p>
                      </div>
                      <BeakerIcon className="h-8 w-8 text-green-600" />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">8</p>
                        <p className="text-sm text-gray-600">Evaluaciones</p>
                      </div>
                      <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600" />
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'consultations' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Historial de Consultas</h3>
                  <Button onClick={onNewConsultation} size="sm" variant="primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nueva Consulta
                  </Button>
                </div>
                <div className="space-y-4">
                  {dashboardData.appointments.map((appointment) => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{appointment.type}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(appointment.date).toLocaleDateString('es-MX')} a las {appointment.time}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.status === 'completed' ? 'Completada' : 'Programada'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'prescriptions' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Historial de Recetas</h3>
                <div className="space-y-4">
                  {dashboardData.prescriptions.map((prescription) => (
                    <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Receta del {new Date(prescription.date).toLocaleDateString('es-MX')}
                          </h4>
                          <div className="mt-2 space-y-1">
                            {prescription.medications.map((med: string, index: number) => (
                              <p key={index} className="text-sm text-gray-600">• {med}</p>
                            ))}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          prescription.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {prescription.status === 'active' ? 'Activa' : 'Completada'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'assessments' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Evaluaciones Clínicas</h3>
                  <Button onClick={onClinicalAssessment} size="sm" variant="primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nueva Evaluación
                  </Button>
                </div>
                <div className="space-y-4">
                  {dashboardData.assessments.map((assessment) => (
                    <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{assessment.scale}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(assessment.date).toLocaleDateString('es-MX')}
                          </p>
                          <p className="text-sm text-gray-800 mt-1">
                            Puntuación: {assessment.score} - {assessment.severity}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">Ver detalles</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Documentos del Paciente</h3>
                  <Button size="sm" variant="primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Subir Documento
                  </Button>
                </div>
                <div className="space-y-4">
                  {dashboardData.documents.map((document) => (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
                          <div>
                            <h4 className="font-medium text-gray-900">{document.name}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(document.date).toLocaleDateString('es-MX')} • {document.type}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Descargar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}