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
import { expedixApi } from '@/lib/api/expedix-client';

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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--warm-50), var(--primary-50))' }}>
      {/* Header del Paciente con diseño MindHub */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
          color: 'white'
        }}
      >
        {/* Patrón de fondo sutil */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,<svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'><g fill='none' fill-rule='evenodd'><g fill='%23ffffff' fill-opacity='0.05'><circle cx='30' cy='30' r='1'/></g></svg>")`
          }}
        />
        
        {/* Línea decorativa superior */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(90deg, var(--primary-500), var(--secondary-500), var(--accent-500))' }}
        />

        <div className="relative z-10 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-all duration-200 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                style={{ border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))',
                    boxShadow: '0 10px 25px -5px rgba(41, 169, 140, 0.3)'
                  }}
                >
                  {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                    {patient.firstName} {patient.lastName}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-white/80 mt-1">
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
              <button
                onClick={onNewConsultation}
                className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:-translate-y-1"
                style={{ 
                  background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))',
                  boxShadow: '0 8px 20px -5px rgba(41, 169, 140, 0.3)'
                }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva Consulta
              </button>
              <button
                onClick={onClinicalAssessment}
                className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:-translate-y-1"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                  boxShadow: '0 8px 20px -5px rgba(236, 115, 103, 0.3)'
                }}
              >
                <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                Evaluación
              </button>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas con diseño MindHub */}
        <div className="relative z-10 border-t border-white/10">
          <nav className="flex space-x-8 px-6">
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
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Información del Paciente */}
                <div className="lg:col-span-2 space-y-6">
                  <div 
                    className="bg-white rounded-xl p-6 border"
                    style={{ 
                      border: '1px solid rgba(8, 145, 178, 0.1)',
                      boxShadow: 'var(--shadow)'
                    }}
                  >
                    <h3 
                      className="text-lg font-bold mb-4"
                      style={{ 
                        color: 'var(--dark-green)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label 
                          className="block text-sm font-medium mb-1"
                          style={{ color: 'var(--dark-green)' }}
                        >
                          Nombre Completo
                        </label>
                        <p 
                          className="text-sm"
                          style={{ 
                            color: 'var(--neutral-700)',
                            fontFamily: 'var(--font-primary)'
                          }}
                        >
                          {patient.firstName} {patient.lastName}
                        </p>
                      </div>
                      <div>
                        <label 
                          className="block text-sm font-medium mb-1"
                          style={{ color: 'var(--dark-green)' }}
                        >
                          Fecha de Nacimiento
                        </label>
                        <p 
                          className="text-sm"
                          style={{ 
                            color: 'var(--neutral-700)',
                            fontFamily: 'var(--font-primary)'
                          }}
                        >
                          {new Date(patient.dateOfBirth).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div>
                        <label 
                          className="block text-sm font-medium mb-1"
                          style={{ color: 'var(--dark-green)' }}
                        >
                          Teléfono
                        </label>
                        <p 
                          className="text-sm flex items-center"
                          style={{ 
                            color: 'var(--neutral-700)',
                            fontFamily: 'var(--font-primary)'
                          }}
                        >
                          <PhoneIcon className="h-4 w-4 mr-1" style={{ color: 'var(--primary-500)' }} />
                          {patient.cellPhone}
                        </p>
                      </div>
                      <div>
                        <label 
                          className="block text-sm font-medium mb-1"
                          style={{ color: 'var(--dark-green)' }}
                        >
                          Email
                        </label>
                        <p 
                          className="text-sm flex items-center"
                          style={{ 
                            color: 'var(--neutral-700)',
                            fontFamily: 'var(--font-primary)'
                          }}
                        >
                          <EnvelopeIcon className="h-4 w-4 mr-1" style={{ color: 'var(--primary-500)' }} />
                          {patient.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline visual */}
                  <div 
                    className="bg-white rounded-xl p-6 border"
                    style={{ 
                      border: '1px solid rgba(8, 145, 178, 0.1)',
                      boxShadow: 'var(--shadow)'
                    }}
                  >
                    <h3 
                      className="text-lg font-bold mb-6"
                      style={{ 
                        color: 'var(--dark-green)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      Timeline Médico
                    </h3>
                    
                    {/* Timeline container */}
                    <div className="relative">
                      {/* Línea vertical del timeline */}
                      <div 
                        className="absolute left-6 top-0 bottom-0 w-0.5"
                        style={{ backgroundColor: 'var(--primary-200)' }}
                      />
                      
                      {/* Eventos del timeline */}
                      <div className="space-y-6">
                        {/* Consulta completada */}
                        <div className="relative flex items-start">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center relative z-10"
                            style={{ 
                              background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))',
                              boxShadow: '0 4px 12px rgba(41, 169, 140, 0.3)'
                            }}
                          >
                            <CalendarIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div 
                              className="rounded-lg p-4 border"
                              style={{ 
                                backgroundColor: 'var(--secondary-50)',
                                border: '1px solid var(--secondary-200)'
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 
                                  className="font-medium"
                                  style={{ 
                                    color: 'var(--dark-green)',
                                    fontFamily: 'var(--font-primary)'
                                  }}
                                >
                                  Consulta de Seguimiento
                                </h4>
                                <span 
                                  className="text-xs px-2 py-1 rounded-full font-medium"
                                  style={{ 
                                    backgroundColor: 'var(--secondary-100)',
                                    color: 'var(--secondary-700)'
                                  }}
                                >
                                  Completada
                                </span>
                              </div>
                              <p 
                                className="text-sm mb-2"
                                style={{ color: 'var(--neutral-600)' }}
                              >
                                Revisión de progreso terapéutico y ajuste de medicación.
                              </p>
                              <p 
                                className="text-xs"
                                style={{ color: 'var(--neutral-500)' }}
                              >
                                15 de Julio, 2025 • 10:30 AM
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Receta emitida */}
                        <div className="relative flex items-start">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center relative z-10"
                            style={{ 
                              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
                            }}
                          >
                            <BeakerIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div 
                              className="rounded-lg p-4 border"
                              style={{ 
                                backgroundColor: 'var(--primary-50)',
                                border: '1px solid var(--primary-200)'
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 
                                  className="font-medium"
                                  style={{ 
                                    color: 'var(--dark-green)',
                                    fontFamily: 'var(--font-primary)'
                                  }}
                                >
                                  Prescripción Médica
                                </h4>
                                <span 
                                  className="text-xs px-2 py-1 rounded-full font-medium"
                                  style={{ 
                                    backgroundColor: 'var(--primary-100)',
                                    color: 'var(--primary-700)'
                                  }}
                                >
                                  Activa
                                </span>
                              </div>
                              <div 
                                className="text-sm space-y-1 mb-2"
                                style={{ color: 'var(--neutral-600)' }}
                              >
                                <p>• Sertralina 50mg - 1 tableta cada 24h</p>
                                <p>• Lorazepam 1mg - 1/2 tableta SOS</p>
                              </div>
                              <p 
                                className="text-xs"
                                style={{ color: 'var(--neutral-500)' }}
                              >
                                15 de Julio, 2025 • Válida por 30 días
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Evaluación PHQ-9 */}
                        <div className="relative flex items-start">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center relative z-10"
                            style={{ 
                              background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                              boxShadow: '0 4px 12px rgba(236, 115, 103, 0.3)'
                            }}
                          >
                            <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div 
                              className="rounded-lg p-4 border"
                              style={{ 
                                backgroundColor: 'var(--accent-50)',
                                border: '1px solid var(--accent-200)'
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 
                                  className="font-medium"
                                  style={{ 
                                    color: 'var(--dark-green)',
                                    fontFamily: 'var(--font-primary)'
                                  }}
                                >
                                  Evaluación PHQ-9
                                </h4>
                                <span 
                                  className="text-xs px-2 py-1 rounded-full font-medium"
                                  style={{ 
                                    backgroundColor: '#fef3c7',
                                    color: '#d97706'
                                  }}
                                >
                                  Moderado
                                </span>
                              </div>
                              <p 
                                className="text-sm mb-2"
                                style={{ color: 'var(--neutral-600)' }}
                              >
                                Puntuación: 12/27 - Síntomas depresivos moderados.
                              </p>
                              <p 
                                className="text-xs"
                                style={{ color: 'var(--neutral-500)' }}
                              >
                                12 de Julio, 2025 • Evaluación completa
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="space-y-4">
                  <div 
                    className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
                    style={{ 
                      border: '1px solid rgba(8, 145, 178, 0.1)',
                      boxShadow: 'var(--shadow)',
                      borderLeft: '4px solid var(--secondary-500)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 
                        className="text-sm font-medium"
                        style={{ 
                          color: 'var(--dark-green)',
                          fontFamily: 'var(--font-primary)'
                        }}
                      >
                        Consultas Totales
                      </h4>
                      <CalendarIcon className="h-5 w-5" style={{ color: 'var(--secondary-500)' }} />
                    </div>
                    <p 
                      className="text-2xl font-bold mb-1"
                      style={{ 
                        color: 'var(--dark-green)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      12
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--neutral-500)' }}
                    >
                      Última: Hace 3 días
                    </p>
                  </div>

                  <div 
                    className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
                    style={{ 
                      border: '1px solid rgba(8, 145, 178, 0.1)',
                      boxShadow: 'var(--shadow)',
                      borderLeft: '4px solid var(--primary-500)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 
                        className="text-sm font-medium"
                        style={{ 
                          color: 'var(--dark-green)',
                          fontFamily: 'var(--font-primary)'
                        }}
                      >
                        Recetas Activas
                      </h4>
                      <BeakerIcon className="h-5 w-5" style={{ color: 'var(--primary-500)' }} />
                    </div>
                    <p 
                      className="text-2xl font-bold mb-1"
                      style={{ 
                        color: 'var(--dark-green)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      2
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--neutral-500)' }}
                    >
                      Renovar en 15 días
                    </p>
                  </div>

                  <div 
                    className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
                    style={{ 
                      border: '1px solid rgba(8, 145, 178, 0.1)',
                      boxShadow: 'var(--shadow)',
                      borderLeft: '4px solid var(--accent-500)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 
                        className="text-sm font-medium"
                        style={{ 
                          color: 'var(--dark-green)',
                          fontFamily: 'var(--font-primary)'
                        }}
                      >
                        Evaluaciones
                      </h4>
                      <ClipboardDocumentListIcon className="h-5 w-5" style={{ color: 'var(--accent-500)' }} />
                    </div>
                    <p 
                      className="text-2xl font-bold mb-1"
                      style={{ 
                        color: 'var(--dark-green)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      8
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--neutral-500)' }}
                    >
                      Última: PHQ-9
                    </p>
                  </div>

                  <div 
                    className="bg-white rounded-xl p-6 border transition-all duration-200 hover:-translate-y-1"
                    style={{ 
                      border: '1px solid rgba(8, 145, 178, 0.1)',
                      boxShadow: 'var(--shadow)',
                      borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 
                        className="text-sm font-medium"
                        style={{ 
                          color: 'var(--dark-green)',
                          fontFamily: 'var(--font-primary)'
                        }}
                      >
                        Documentos
                      </h4>
                      <DocumentTextIcon className="h-5 w-5" style={{ color: '#f59e0b' }} />
                    </div>
                    <p 
                      className="text-2xl font-bold mb-1"
                      style={{ 
                        color: 'var(--dark-green)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      5
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--neutral-500)' }}
                    >
                      Último: Hace 1 semana
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'consultations' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Historial de Consultas</h3>
                  <button
                    onClick={onNewConsultation}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nueva Consulta
                  </button>
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
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Historial de Recetas</h3>
                </div>
                <div className="space-y-4">
                  {dashboardData.prescriptions.map((prescription) => (
                    <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Receta del {new Date(prescription.date).toLocaleDateString('es-MX')}</h4>
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
              </div>
            )}

            {activeTab === 'assessments' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Evaluaciones Clínicas</h3>
                  <button
                    onClick={onClinicalAssessment}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nueva Evaluación
                  </button>
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
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Documentos del Paciente</h3>
                  <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Subir Documento
                  </button>
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
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Descargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}