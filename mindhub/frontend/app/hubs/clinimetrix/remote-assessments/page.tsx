'use client';

import React, { useState } from 'react';
import { Send, Eye, Plus, User, Scale, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Scale as ScaleType } from '@/lib/api/clinimetrix-client';
import ScalesCatalog from '@/components/clinimetrix-legacy-backup/ScalesCatalog';
import SendRemoteAssessmentModal from '@/components/clinimetrix-legacy-backup/SendRemoteAssessmentModal';
import RemoteAssessmentsTracker from '@/components/clinimetrix-legacy-backup/RemoteAssessmentsTracker';
import { useCurrentUser } from '@/hooks/useCurrentUser';

import { expedixApi } from '@/lib/api/expedix-client';
import type { Patient } from '@/lib/api/expedix-client';

type ViewMode = 'overview' | 'send' | 'tracker';

export default function RemoteAssessmentsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  
  // Estado para envío de evaluaciones
  const [selectedScale, setSelectedScale] = useState<ScaleType | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  
  // Estado para manejo de pacientes reales
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  // Cargar pacientes reales desde Expedix
  const loadPatients = async () => {
    setPatientsLoading(true);
    setPatientsError(null);
    try {
      const patientsData = await expedixApi.getPatients();
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatientsError('Error al cargar la lista de pacientes');
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleScaleSelection = (scale: ScaleType) => {
    setSelectedScale(scale);
    loadPatients(); // Cargar pacientes cuando se selecciona una escala
    setShowPatientSelector(true);
  };

  const handlePatientSelection = (patient: any) => {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
    setShowSendModal(true);
  };

  const handleSendSuccess = (assessment: any) => {
    setShowSendModal(false);
    setSelectedScale(null);
    setSelectedPatient(null);
    setViewMode('tracker'); // Cambiar a vista de seguimiento
  };

  const PatientSelector = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Seleccionar Paciente
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Escala: {selectedScale?.name}
              </p>
            </div>
            <button
              onClick={() => {
                setShowPatientSelector(false);
                setSelectedScale(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {patientsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando pacientes...</span>
            </div>
          ) : patientsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{patientsError}</p>
              <button
                onClick={loadPatients}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron pacientes</p>
              <p className="text-sm mt-2">Primero registra pacientes en Expedix</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelection(patient)}
                  className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {patient.email && <p>📧 {patient.email}</p>}
                        {patient.phone && <p>📱 {patient.phone}</p>}
                        {patient.dateOfBirth && (
                          <p>🎂 {new Date(patient.dateOfBirth).toLocaleDateString('es-ES')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/hubs/clinimetrix')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Evaluaciones Remotas
                </h1>
                <p className="text-sm text-gray-600">
                  Envía escalas clínicas a pacientes vía enlaces tokenizados
                </p>
              </div>
            </div>
            
            {/* Navigation tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'overview'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Scale className="w-4 h-4 inline mr-2" />
                Enviar
              </button>
              <button
                onClick={() => setViewMode('tracker')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'tracker'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Seguimiento
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'overview' && (
          <div className="space-y-8">
            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                <Send className="w-5 h-5 inline mr-2" />
                Cómo Enviar Evaluaciones Remotas
              </h2>
              <div className="text-blue-800 space-y-2">
                <p className="font-medium">Proceso simple en 3 pasos:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Selecciona la escala clínica que deseas aplicar</li>
                  <li>Elige el paciente al que enviarás la evaluación</li>
                  <li>Configura el mensaje y método de envío (WhatsApp, enlace)</li>
                </ol>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm">
                    <strong>Seguridad:</strong> Cada enlace es único, tiene fecha de expiración configurable 
                    y todos los accesos quedan registrados para auditoría.
                  </p>
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Send className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Enlaces Seguros</h3>
                <p className="text-gray-600 text-sm">
                  Tokens únicos de 64 caracteres con expiración configurable de 1 a 30 días.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Sin Registro</h3>
                <p className="text-gray-600 text-sm">
                  Los pacientes acceden directamente con el enlace, sin necesidad de crear cuentas.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Seguimiento</h3>
                <p className="text-gray-600 text-sm">
                  Monitorea el estado en tiempo real y recibe notificaciones cuando se complete.
                </p>
              </div>
            </div>

            {/* Catálogo de escalas */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Selecciona una Escala para Enviar
              </h2>
              <ScalesCatalog onSelectScale={handleScaleSelection} />
            </div>
          </div>
        )}

        {viewMode === 'tracker' && user && (
          <RemoteAssessmentsTracker administratorId={user.id} />
        )}
      </div>

      {/* Modales */}
      {showPatientSelector && <PatientSelector />}
      
      {showSendModal && selectedScale && selectedPatient && user && (
        <SendRemoteAssessmentModal
          isOpen={showSendModal}
          onClose={() => {
            setShowSendModal(false);
            setSelectedScale(null);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
          scale={selectedScale}
          administratorId={user.id}
          onSuccess={handleSendSuccess}
        />
      )}
    </div>
  );
}