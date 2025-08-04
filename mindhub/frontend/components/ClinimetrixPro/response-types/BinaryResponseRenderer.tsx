/**
 * BinaryResponseRenderer - Renders binary choice responses
 * 
 * Handles yes/no, true/false, and other binary responses
 * with clear visual distinction and proper accessibility.
 */

'use client';

import React from 'react';

interface BinaryResponseRendererProps {
  item: {
    id: string;
    text: string;
    responseType: string;
    responseGroup?: string;
    specificOptions?: Array<{
      value: any;
      label: string;
      score: number;
    }>;
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

export const BinaryResponseRenderer: React.FC<BinaryResponseRendererProps> = ({
  item,
  value,
  onChange,
  responseGroups
}) => {
  // Determine response options
  const getResponseOptions = () => {
    // Use item-specific options if available
    if (item.specificOptions && item.specificOptions.length > 0) {
      return item.specificOptions;
    }
    
    // Use response group if specified
    if (item.responseGroup && responseGroups?.[item.responseGroup]) {
      return responseGroups[item.responseGroup];
    }
    
    // Default binary options based on response type
    switch (item.responseType) {
      case 'yes_no':
        return [
          { value: 1, label: 'Sí', score: 1 },
          { value: 0, label: 'No', score: 0 }
        ];
      case 'true_false':
        return [
          { value: 1, label: 'Verdadero', score: 1 },
          { value: 0, label: 'Falso', score: 0 }
        ];
      case 'binary':
      default:
        return [
          { value: 1, label: 'Sí', score: 1 },
          { value: 0, label: 'No', score: 0 }
        ];
    }
  };

  const options = getResponseOptions();

  // Ensure we have exactly 2 options for binary
  if (options.length !== 2) {
    console.warn(`Binary response expected 2 options, got ${options.length} for item ${item.id}`);
  }

  return (
    <div className="binary-response-renderer">
      {/* Response Options */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {options.map((option) => {
          const isSelected = value === option.value;
          const isPositive = option.value === 1 || option.value === true;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                relative p-4 rounded-lg border-2 font-medium transition-all duration-200
                focus:ring-4 focus:ring-opacity-50 focus:outline-none
                ${isSelected
                  ? isPositive
                    ? 'bg-green-600 border-green-600 text-white shadow-lg focus:ring-green-300'
                    : 'bg-red-600 border-red-600 text-white shadow-lg focus:ring-red-300'
                  : isPositive
                    ? 'bg-white border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 focus:ring-green-300'
                    : 'bg-white border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 focus:ring-red-300'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`Seleccionar ${option.label}`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {/* Option Icon */}
              <div className="flex items-center justify-center mb-2">
                {isPositive ? (
                  <svg className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              {/* Option Label */}
              <div className="text-lg font-semibold">
                {option.label}
              </div>
              
              {/* Score indicator for debugging/admin mode */}
              {process.env.NODE_ENV === 'development' && (
                <div className={`text-xs mt-1 ${isSelected ? 'text-gray-200' : 'text-gray-400'}`}>
                  Score: {option.score}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Selection Display */}
      {value !== undefined && value !== null && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              <strong>Respuesta seleccionada:</strong>
            </span>
            <span className="text-sm font-medium text-blue-900">
              {options.find(opt => opt.value === value)?.label || 'Desconocida'}
            </span>
          </div>
        </div>
      )}

      {/* Accessibility announcement */}
      <div className="sr-only" aria-live="polite">
        {value !== undefined && value !== null && (
          `Seleccionado: ${options.find(opt => opt.value === value)?.label}`
        )}
      </div>
    </div>
  );
};

export default BinaryResponseRenderer;