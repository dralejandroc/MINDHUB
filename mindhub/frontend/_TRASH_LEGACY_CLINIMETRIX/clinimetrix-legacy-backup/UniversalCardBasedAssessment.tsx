'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { clinimetrixApi, Scale } from '@/lib/api/clinimetrix-client';

interface UniversalCardBasedAssessmentProps {
  selectedScale: Scale;
  onBack: () => void;
  onComplete: (results: any) => void;
  fullscreen?: boolean;
}

export const UniversalCardBasedAssessment: React.FC<UniversalCardBasedAssessmentProps> = ({
  selectedScale,
  onBack,
  onComplete,
  fullscreen = false
}) => {
  const [loading, setLoading] = useState(false);

  const handleStartAssessment = async () => {
    setLoading(true);
    // TODO: Implement assessment logic with real backend
    setTimeout(() => {
      onComplete({ scale: selectedScale, completed: true });
      setLoading(false);
    }, 1000);
  };

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedScale.name}
              </h1>
              {selectedScale.abbreviation && (
                <p className="text-gray-600">({selectedScale.abbreviation})</p>
              )}
              <p className="text-gray-600 mt-4">{selectedScale.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedScale.total_items}
                </div>
                <div className="text-sm text-gray-500">Ítems</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedScale.estimated_duration_minutes}
                </div>
                <div className="text-sm text-gray-500">Minutos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {selectedScale.category}
                </div>
                <div className="text-sm text-gray-500">Categoría</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={onBack}
                variant="outline"
                disabled={loading}
              >
                Volver
              </Button>
              <Button
                onClick={handleStartAssessment}
                disabled={loading}
              >
                {loading ? 'Iniciando...' : 'Iniciar Evaluación'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">{selectedScale.name}</h2>
      <p className="text-gray-600 mb-4">{selectedScale.description}</p>
      
      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline">
          Volver
        </Button>
        <Button onClick={handleStartAssessment} disabled={loading}>
          {loading ? 'Iniciando...' : 'Iniciar Evaluación'}
        </Button>
      </div>
    </div>
  );
};