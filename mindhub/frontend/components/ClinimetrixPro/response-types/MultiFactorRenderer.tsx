/**
 * MultiFactorRenderer - Renders multi-factor response items
 * 
 * Handles items that require multiple responses like DTS
 * (frequency + severity) with proper validation and scoring.
 */

'use client';

import React from 'react';

interface MultiFactorRendererProps {
  item: {
    id: string;
    text: string;
    responseType: string;
    multiFactor?: {
      factors: Array<{
        name: string;
        responseGroup: string;
      }>;
    };
    metadata?: any;
  };
  value: any;
  onChange: (value: any) => void;
  responseGroups?: {
    [key: string]: Array<{
      value: any;
      label: string;
      score: number;
    }>;
  };
}

export const MultiFactorRenderer: React.FC<MultiFactorRendererProps> = ({
  item,
  value,
  onChange,
  responseGroups
}) => {
  if (!item.multiFactor || !item.multiFactor.factors) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          Configuración multi-factor no encontrada.
        </div>
      </div>
    );
  }

  const factors = item.multiFactor.factors;
  const currentValue = value || {};

  const handleFactorChange = (factorName: string, factorValue: any) => {
    const newValue = {
      ...currentValue,
      [factorName]: factorValue
    };
    onChange(newValue);
  };

  const getFactorOptions = (responseGroupName: string) => {
    if (responseGroups && responseGroups[responseGroupName]) {
      return responseGroups[responseGroupName];
    }

    // Default options based on factor name
    switch (responseGroupName.toLowerCase()) {
      case 'frequency':
      case 'frecuencia':
        return [
          { value: 0, label: 'Nunca', score: 0 },
          { value: 1, label: '1 vez', score: 1 },
          { value: 2, label: '2-3 veces', score: 2 },
          { value: 3, label: '4-6 veces', score: 3 },
          { value: 4, label: 'Diariamente', score: 4 }
        ];
      case 'severity':
      case 'severidad':
        return [
          { value: 0, label: 'Nada', score: 0 },
          { value: 1, label: 'Leve', score: 1 },
          { value: 2, label: 'Moderado', score: 2 },
          { value: 3, label: 'Severo', score: 3 },
          { value: 4, label: 'Extremo', score: 4 }
        ];
      default:
        return [
          { value: 0, label: 'Bajo', score: 0 },
          { value: 1, label: 'Medio-Bajo', score: 1 },
          { value: 2, label: 'Medio', score: 2 },
          { value: 3, label: 'Medio-Alto', score: 3 },
          { value: 4, label: 'Alto', score: 4 }
        ];
    }
  };

  // Check if all factors have been responded
  const allFactorsCompleted = factors.every(factor => 
    currentValue[factor.name] !== undefined && currentValue[factor.name] !== null
  );

  // Calculate combined score if all factors are completed
  const calculateCombinedScore = () => {
    if (!allFactorsCompleted) return null;
    
    let totalScore = 0;
    factors.forEach(factor => {
      const factorValue = currentValue[factor.name];
      const options = getFactorOptions(factor.responseGroup);
      const option = options.find(opt => opt.value === factorValue);
      if (option) {
        totalScore += option.score;
      }
    });
    return totalScore;
  };

  const combinedScore = calculateCombinedScore();

  return (
    <div className="multi-factor-renderer">
      <div className="space-y-6">
        {factors.map((factor, factorIndex) => {
          const options = getFactorOptions(factor.responseGroup);
          const factorValue = currentValue[factor.name];
          
          return (
            <div key={factor.name} className="factor-group">
              {/* Factor Title */}
              <div className="mb-3">
                <h4 className="text-base font-medium text-gray-900 mb-1">
                  {factor.name}
                </h4>
                <div className="text-sm text-gray-600">
                  {factor.responseGroup === 'frequency' || factor.responseGroup === 'frecuencia' 
                    ? '¿Con qué frecuencia?' 
                    : factor.responseGroup === 'severity' || factor.responseGroup === 'severidad'
                    ? '¿Qué tan severo?'
                    : `Seleccione el nivel de ${factor.name.toLowerCase()}`}
                </div>
              </div>

              {/* Factor Options */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {options.map((option, optionIndex) => {
                  const isSelected = factorValue === option.value;
                  
                  return (
                    <div key={option.value} className="flex flex-col items-center">
                      {/* Option Button */}
                      <button
                        type="button"
                        onClick={() => handleFactorChange(factor.name, option.value)}
                        className={`
                          w-12 h-12 rounded-full border-2 flex items-center justify-center
                          transition-all duration-200 mb-2
                          ${isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                            : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
                          }
                        `}
                        aria-pressed={isSelected}
                        aria-label={`${factor.name}: ${option.label}`}
                      >
                        <span className="text-sm font-medium">
                          {optionIndex}
                        </span>
                      </button>
                      
                      {/* Option Label */}
                      <div className="text-center">
                        <div className={`
                          text-xs font-medium px-2 py-1 rounded
                          ${isSelected ? 'text-blue-700 bg-blue-50' : 'text-gray-700'}
                        `}>
                          {option.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Factor Selection Status */}
              {factorValue !== undefined && factorValue !== null && (
                <div className="text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {factor.name}: {options.find(opt => opt.value === factorValue)?.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Combined Results */}
      {allFactorsCompleted && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-blue-800 mb-3">
            <strong>Respuestas completadas:</strong>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            {factors.map(factor => {
              const factorValue = currentValue[factor.name];
              const options = getFactorOptions(factor.responseGroup);
              const selectedOption = options.find(opt => opt.value === factorValue);
              
              return (
                <div key={factor.name} className="flex justify-between">
                  <span className="text-blue-700 font-medium">{factor.name}:</span>
                  <span className="text-blue-900">
                    {selectedOption?.label} ({selectedOption?.score} pts)
                  </span>
                </div>
              );
            })}
          </div>

          {combinedScore !== null && (
            <div className="border-t border-blue-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-800 font-semibold">Puntuación combinada:</span>
                <span className="text-blue-900 font-bold text-lg">{combinedScore}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-4">
        <div className="flex items-center text-sm text-gray-600">
          <div className="flex-1">
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(Object.keys(currentValue).length / factors.length) * 100}%` 
                  }}
                />
              </div>
              <span className="whitespace-nowrap">
                {Object.keys(currentValue).length}/{factors.length} factores
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility announcement */}
      <div className="sr-only" aria-live="polite">
        {allFactorsCompleted && (
          `Todos los factores completados. Puntuación combinada: ${combinedScore}`
        )}
      </div>
    </div>
  );
};

export default MultiFactorRenderer;