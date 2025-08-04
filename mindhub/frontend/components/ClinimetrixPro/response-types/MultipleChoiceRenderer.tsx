/**
 * MultipleChoiceRenderer - Renders multiple choice responses
 * 
 * Handles single-select multiple choice questions with
 * variable number of options and proper accessibility.
 */

'use client';

import React from 'react';

interface MultipleChoiceRendererProps {
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

export const MultipleChoiceRenderer: React.FC<MultipleChoiceRendererProps> = ({
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
    
    // Default multiple choice options
    return [
      { value: 'a', label: 'Opción A', score: 0 },
      { value: 'b', label: 'Opción B', score: 1 },
      { value: 'c', label: 'Opción C', score: 2 },
      { value: 'd', label: 'Opción D', score: 3 }
    ];
  };

  const options = getResponseOptions();

  // Generate option letters
  const getOptionLetter = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  };

  return (
    <div className="multiple-choice-renderer">
      {/* Response Options */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const optionLetter = getOptionLetter(index);
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                w-full p-4 text-left rounded-lg border-2 transition-all duration-200
                focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none
                ${isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`Opción ${optionLetter}: ${option.label}`}
            >
              <div className="flex items-center">
                {/* Option Letter Circle */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold text-sm
                  ${isSelected
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-100 text-blue-600'
                  }
                `}>
                  {optionLetter}
                </div>
                
                {/* Option Content */}
                <div className="flex-1">
                  <div className="font-medium">
                    {option.label}
                  </div>
                  
                  {/* Score indicator for debugging/admin mode */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className={`text-xs mt-1 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                      Score: {option.score}
                    </div>
                  )}
                </div>
                
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="ml-4">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
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
              {(() => {
                const selectedOption = options.find(opt => opt.value === value);
                const selectedIndex = options.findIndex(opt => opt.value === value);
                return selectedOption 
                  ? `${getOptionLetter(selectedIndex)}) ${selectedOption.label}`
                  : 'Desconocida';
              })()}
            </span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Selecciona una opción haciendo clic en ella.
        </div>
      </div>

      {/* Accessibility announcement */}
      <div className="sr-only" aria-live="polite">
        {value !== undefined && value !== null && (
          (() => {
            const selectedOption = options.find(opt => opt.value === value);
            const selectedIndex = options.findIndex(opt => opt.value === value);
            return selectedOption 
              ? `Seleccionado opción ${getOptionLetter(selectedIndex)}: ${selectedOption.label}`
              : '';
          })()
        )}
      </div>
    </div>
  );
};

export default MultipleChoiceRenderer;