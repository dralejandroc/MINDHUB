/**
 * 🚨 DRUG INTERACTIONS MODAL
 * 
 * Modal para verificar interacciones farmacológicas
 * Muestra alertas de seguridad antes de confirmar receta
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  InformationCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Medication {
  medication_name: string;
  active_ingredient?: string;
  dosage?: string;
  frequency?: string;
}

interface Interaction {
  type: 'drug-drug' | 'drug-allergy' | 'drug-condition' | 'drug-age';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  recommendation: string;
  medications_involved: string[];
  factor?: string;
}

interface Warning {
  type: 'controlled-substance' | 'duplicate-therapy' | 'dosage-alert' | 'age-inappropriate';
  message: string;
  medication: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  medications: Medication[];
  patientAllergies?: string[];
  patientConditions?: string[];
  patientAge?: number;
  patientName: string;
}

export function DrugInteractionsModal({
  isOpen,
  onClose,
  onConfirm,
  medications,
  patientAllergies,
  patientConditions,
  patientAge,
  patientName
}: Props) {
  const [loading, setLoading] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [safetyScore, setSafetyScore] = useState<number>(100);
  const [hasInteractions, setHasInteractions] = useState(false);

  useEffect(() => {
    if (isOpen && medications.length > 0) {
      checkInteractions();
    }
  }, [isOpen, medications]);

  const checkInteractions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/prescriptions/interactions/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medications,
          patient_allergies: patientAllergies,
          patient_conditions: patientConditions,
          patient_age: patientAge
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setInteractions(data.data.interactions || []);
        setWarnings(data.data.warnings || []);
        setSafetyScore(data.data.safety_score || 100);
        setHasInteractions(data.data.has_interactions || false);
      }
    } catch (error) {
      console.error('Error checking interactions:', error);
      toast.error('Error al verificar interacciones');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ShieldExclamationIcon className="h-5 w-5" />;
      case 'moderate':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <InformationCircleIcon className="h-5 w-5" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleConfirm = () => {
    if (safetyScore < 40) {
      const confirm = window.confirm(
        '⚠️ ADVERTENCIA: El puntaje de seguridad es muy bajo. ¿Está seguro de continuar con esta prescripción?'
      );
      if (!confirm) return;
    }
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <BeakerIcon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Análisis de Interacciones Farmacológicas</h2>
                <p className="text-blue-100 mt-1">Paciente: {patientName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600">Analizando interacciones medicamentosas...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Safety Score */}
            <div className="bg-gray-50 border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Puntaje de Seguridad</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Evaluación general de la prescripción
                  </p>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(safetyScore)}`}>
                    {safetyScore}%
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {safetyScore >= 80 ? 'Seguro' :
                     safetyScore >= 60 ? 'Precaución' :
                     safetyScore >= 40 ? 'Riesgo Moderado' :
                     'Alto Riesgo'}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[400px] p-6">
              {/* Critical Interactions */}
              {interactions.filter(i => i.severity === 'critical').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-3">
                    ⛔ Interacciones Críticas
                  </h3>
                  <div className="space-y-3">
                    {interactions.filter(i => i.severity === 'critical').map((interaction, index) => (
                      <div
                        key={index}
                        className="border-2 border-red-300 bg-red-50 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <ShieldExclamationIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-red-900">
                              {interaction.medications_involved.join(' + ')}
                              {interaction.factor && ` con ${interaction.factor}`}
                            </p>
                            <p className="text-red-800 mt-1">{interaction.description}</p>
                            <div className="mt-2 p-2 bg-white rounded border border-red-200">
                              <p className="text-sm text-red-700">
                                <strong>Recomendación:</strong> {interaction.recommendation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* High/Moderate Interactions */}
              {interactions.filter(i => i.severity === 'high' || i.severity === 'moderate').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-orange-800 mb-3">
                    ⚠️ Interacciones Importantes
                  </h3>
                  <div className="space-y-3">
                    {interactions.filter(i => i.severity === 'high' || i.severity === 'moderate').map((interaction, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${getSeverityColor(interaction.severity)}`}
                      >
                        <div className="flex items-start space-x-3">
                          {getSeverityIcon(interaction.severity)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">
                                {interaction.medications_involved.join(' + ')}
                                {interaction.factor && ` con ${interaction.factor}`}
                              </p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                interaction.severity === 'high' ? 
                                  'bg-orange-200 text-orange-800' : 
                                  'bg-yellow-200 text-yellow-800'
                              }`}>
                                {interaction.severity === 'high' ? 'Alta' : 'Moderada'}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{interaction.description}</p>
                            <p className="text-sm mt-2">
                              <strong>Recomendación:</strong> {interaction.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Interactions */}
              {interactions.filter(i => i.severity === 'low').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">
                    ℹ️ Interacciones Menores
                  </h3>
                  <div className="space-y-2">
                    {interactions.filter(i => i.severity === 'low').map((interaction, index) => (
                      <div
                        key={index}
                        className="border border-blue-200 bg-blue-50 rounded-lg p-3"
                      >
                        <p className="text-sm text-blue-900">
                          <strong>{interaction.medications_involved.join(' + ')}:</strong> {interaction.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">
                    📋 Advertencias Adicionales
                  </h3>
                  <div className="space-y-2">
                    {warnings.map((warning, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-3 bg-purple-50 border border-purple-200 rounded-lg"
                      >
                        <InformationCircleIcon className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium text-purple-900">{warning.medication}:</span>
                          <span className="text-purple-800 ml-1">{warning.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Interactions */}
              {!hasInteractions && warnings.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
                  <h3 className="mt-4 text-xl font-semibold text-green-800">
                    No se detectaron interacciones significativas
                  </h3>
                  <p className="mt-2 text-gray-600">
                    La prescripción es segura según los parámetros evaluados
                  </p>
                </div>
              )}

              {/* Medications Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Medicamentos Analizados:</h4>
                <div className="flex flex-wrap gap-2">
                  {medications.map((med, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700"
                    >
                      {med.medication_name} {med.dosage && `- ${med.dosage}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        {!loading && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                * Este análisis es una herramienta de apoyo. Siempre use su criterio clínico.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    safetyScore < 40 ?
                      'bg-red-600 text-white hover:bg-red-700' :
                    safetyScore < 70 ?
                      'bg-yellow-600 text-white hover:bg-yellow-700' :
                      'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {safetyScore < 40 ? 'Confirmar con Precaución' : 'Confirmar Prescripción'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}