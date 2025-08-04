/**
 * LikertScaleRenderer - Renders Likert-type scale responses
 * 
 * Handles standard Likert scales (3, 5, 7 points) with proper spacing
 * and visual feedback. Supports both global response groups and item-specific options.
 */

'use client';

import React from 'react';

interface LikertScaleRendererProps {
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

export const LikertScaleRenderer: React.FC<LikertScaleRendererProps> = ({
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
    
    // Default Likert scale based on response type
    switch (item.responseType) {
      case 'likert_3':
        return [
          { value: 0, label: 'Nunca', score: 0 },
          { value: 1, label: 'A veces', score: 1 },
          { value: 2, label: 'Siempre', score: 2 }
        ];
      case 'likert_5':
      case 'likert':
        return [
          { value: 0, label: 'Nunca', score: 0 },
          { value: 1, label: 'Casi nunca', score: 1 },
          { value: 2, label: 'A veces', score: 2 },
          { value: 3, label: 'Casi siempre', score: 3 },
          { value: 4, label: 'Siempre', score: 4 }
        ];
      case 'likert_7':
        return [
          { value: 0, label: 'Completamente en desacuerdo', score: 0 },
          { value: 1, label: 'Muy en desacuerdo', score: 1 },
          { value: 2, label: 'En desacuerdo', score: 2 },
          { value: 3, label: 'Neutral', score: 3 },
          { value: 4, label: 'De acuerdo', score: 4 },
          { value: 5, label: 'Muy de acuerdo', score: 5 },
          { value: 6, label: 'Completamente de acuerdo', score: 6 }
        ];
      default:
        return [
          { value: 0, label: 'Nunca', score: 0 },
          { value: 1, label: 'Casi nunca', score: 1 },
          { value: 2, label: 'A veces', score: 2 },
          { value: 3, label: 'Casi siempre', score: 3 },
          { value: 4, label: 'Siempre', score: 4 }
        ];
    }
  };

  const options = getResponseOptions();
  const optionCount = options.length;

  // Determine grid layout based on option count
  const getGridCols = () => {
    switch (optionCount) {
      case 3: return 'grid-cols-3';
      case 5: return 'grid-cols-5';
      case 7: return 'grid-cols-7';
      default: return `grid-cols-${Math.min(optionCount, 6)}`;
    }
  };

  return (
    <div className="likert-scale-renderer">
      {/* Response Options */}
      <div className={`grid ${getGridCols()} gap-2 mb-4`}>
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;
          
          return (
            <div key={option.value} className="flex flex-col items-center">
              {/* Radio Button */}
              <button
                type="button"
                onClick={() => onChange(option.value)}
                className={`
                  w-12 h-12 rounded-full border-2 flex items-center justify-center
                  transition-all duration-200 mb-2
                  ${isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
                  }
                `}
                aria-pressed={isSelected}
                aria-label={`Opción ${index + 1}: ${option.label}`}
              >
                <span className="text-sm font-medium">
                  {index + 1}
                </span>
              </button>
              
              {/* Option Label */}
              <div className="text-center">
                <div className={`
                  text-sm font-medium px-2 py-1 rounded
                  ${isSelected ? 'text-blue-700 bg-blue-50' : 'text-gray-700'}
                `}>
                  {option.label}
                </div>
                
                {/* Score indicator for debugging/admin mode */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-400 mt-1">
                    Score: {option.score}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scale Labels (for scales with clear extremes) */}
      {optionCount >= 5 && (
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span className="text-left">{options[0].label}</span>
          <span className="text-right">{options[options.length - 1].label}</span>
        </div>
      )}

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

      {/* Accessibility and Usage Notes */}
      <div className="sr-only" aria-live="polite">
        {value !== undefined && value !== null && (
          `Seleccionado: ${options.find(opt => opt.value === value)?.label}`
        )}
      </div>
    </div>
  );
};

export default LikertScaleRenderer;