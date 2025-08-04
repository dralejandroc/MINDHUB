/**
 * Universal Scale Assessment Component
 * Handles dynamic assessment rendering for any scale
 */

'use client';

import React, { useState } from 'react';

interface UniversalScaleAssessmentProps {
  scaleId?: string;
  patientId?: string;
  onComplete?: (results: any) => void;
  onCancel?: () => void;
}

export const UniversalScaleAssessment: React.FC<UniversalScaleAssessmentProps> = ({
  scaleId,
  patientId,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});

  const handleSubmit = () => {
    const results = {
      scaleId,
      patientId,
      responses,
      completedAt: new Date().toISOString()
    };
    onComplete?.(results);
  };

  if (!scaleId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona una escala
          </h3>
          <p className="text-gray-600">
            Elige una escala de evaluación para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Evaluación Universal
        </h2>
        <p className="text-gray-600">
          Escala ID: {scaleId} | Paciente ID: {patientId}
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            Sistema de evaluación universal en desarrollo.
            Esta interfaz cargará dinámicamente la escala seleccionada.
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Completar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalScaleAssessment;