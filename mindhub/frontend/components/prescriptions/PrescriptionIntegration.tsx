/**
 * 🔗 PRESCRIPTION INTEGRATION COMPONENT
 * 
 * Integración del sistema de recetas con consultas médicas
 * Permite crear recetas directamente desde el expediente del paciente
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { PrescriptionCreator } from './PrescriptionCreator';
import { PrescriptionsList } from './PrescriptionsList';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  allergies?: string[];
  chronic_conditions?: string[];
}

interface Consultation {
  id: string;
  consultation_date: string;
  consultation_type: string;
  chief_complaint?: string;
  diagnosis?: string;
  assessment?: string;
  treatment_plan?: string;
}

interface Props {
  patient: Patient;
  consultation?: Consultation;
  mode?: 'list' | 'create' | 'view';
  onClose?: () => void;
}

export function PrescriptionIntegration({ patient, consultation, mode = 'list', onClose }: Props) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar recetas recientes del paciente
  useEffect(() => {
    if (currentMode === 'list') {
      loadRecentPrescriptions();
    }
  }, [patient.id, currentMode]);

  const loadRecentPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/prescriptions?patient_id=${patient.id}&limit=5`);
      const data = await response.json();
      
      if (data.success) {
        setRecentPrescriptions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading recent prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (prescription: any) => {
    toast.success(`Receta ${prescription.prescription_number} creada exitosamente`);
    setCurrentMode('list');
    loadRecentPrescriptions(); // Recargar la lista
  };

  const downloadPDF = async (prescriptionId: string, prescriptionNumber: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receta_${prescriptionNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('PDF descargado exitosamente');
      } else {
        toast.error('Error al descargar el PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  if (currentMode === 'create') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Nueva Receta Médica</h3>
          <button
            onClick={() => setCurrentMode('list')}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <PrescriptionCreator
          patient={patient}
          consultationId={consultation?.id}
          onSuccess={handleCreateSuccess}
          onCancel={() => setCurrentMode('list')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con información del paciente */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-900">
              Recetas de {patient.first_name} {patient.last_name} {patient.paternal_last_name}
            </h3>
            {patient.date_of_birth && (
              <p className="text-sm text-blue-700 mt-1">
                Fecha de Nacimiento: {new Date(patient.date_of_birth).toLocaleDateString('es-MX')}
              </p>
            )}
            
            {/* Alertas médicas */}
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  <strong>🚨 Alergias:</strong> {patient.allergies.join(', ')}
                </p>
              </div>
            )}
            
            {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Condiciones Crónicas:</strong> {patient.chronic_conditions.join(', ')}
                </p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setCurrentMode('create')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nueva Receta</span>
          </button>
        </div>
      </div>

      {/* Información de la consulta actual */}
      {consultation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">Consulta Actual</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Fecha:</strong> {new Date(consultation.consultation_date).toLocaleDateString('es-MX')}
            </div>
            <div>
              <strong>Tipo:</strong> {consultation.consultation_type || 'General'}
            </div>
            {consultation.chief_complaint && (
              <div className="md:col-span-2">
                <strong>Motivo:</strong> {consultation.chief_complaint}
              </div>
            )}
            {consultation.diagnosis && (
              <div className="md:col-span-2">
                <strong>Diagnóstico:</strong> {consultation.diagnosis}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de recetas recientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Recetas Recientes</h4>
          <span className="text-sm text-gray-500">
            Últimas {recentPrescriptions.length} recetas
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-teal border-t-transparent"></div>
            <span className="ml-2 text-gray-600">Cargando recetas...</span>
          </div>
        ) : recentPrescriptions.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay recetas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Este paciente no tiene recetas médicas registradas.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setCurrentMode('create')}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-teal-600 transition-colors mx-auto"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Crear Primera Receta</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="font-medium text-gray-900">
                        {prescription.prescription_number}
                      </h5>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                        prescription.status === 'dispensed' ? 'bg-blue-100 text-blue-800' :
                        prescription.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        prescription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {prescription.status === 'active' ? 'Activa' :
                         prescription.status === 'dispensed' ? 'Surtida' :
                         prescription.status === 'expired' ? 'Expirada' :
                         prescription.status === 'cancelled' ? 'Cancelada' :
                         'Parcial'}
                      </span>
                      {prescription.is_chronic && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Crónico
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Fecha:</strong> {new Date(prescription.prescription_date).toLocaleDateString('es-MX')} • 
                      <strong> Válida hasta:</strong> {new Date(prescription.valid_until).toLocaleDateString('es-MX')}
                    </p>
                    
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Diagnóstico:</strong> {prescription.diagnosis}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {prescription.prescription_medications?.slice(0, 3).map((med: any, index: number) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            med.is_controlled_substance ? 
                              'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {med.is_controlled_substance && '🔒 '}
                          {med.medication_name}
                        </span>
                      ))}
                      {prescription.prescription_medications?.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          +{prescription.prescription_medications.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => window.open(`/hubs/expedix/prescriptions/${prescription.id}`, '_blank')}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-primary-teal border border-primary-teal rounded hover:bg-teal-50 transition-colors"
                    >
                      <EyeIcon className="h-3 w-3" />
                      <span>Ver</span>
                    </button>
                    
                    <button
                      onClick={() => downloadPDF(prescription.id, prescription.prescription_number)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      <DocumentArrowDownIcon className="h-3 w-3" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Enlace para ver todas las recetas */}
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                onClick={() => window.open(`/hubs/expedix/prescriptions?patient_id=${patient.id}`, '_blank')}
                className="text-primary-teal hover:text-teal-600 font-medium text-sm"
              >
                Ver todas las recetas de este paciente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botón de cierre si está en modal */}
      {onClose && (
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}