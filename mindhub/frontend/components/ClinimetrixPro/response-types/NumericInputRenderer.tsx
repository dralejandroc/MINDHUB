/**
 * NumericInputRenderer - Renders numeric input responses
 * 
 * Handles numeric inputs with validation, range constraints,
 * and proper formatting for clinical assessments.
 */

'use client';

import React, { useState, useEffect } from 'react';

interface NumericInputRendererProps {
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

export const NumericInputRenderer: React.FC<NumericInputRendererProps> = ({
  item,
  value,
  onChange
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [validationMessage, setValidationMessage] = useState<string>('');

  // Extract constraints from metadata or item configuration
  const constraints = {
    min: item.metadata?.min ?? 0,
    max: item.metadata?.max ?? 100,
    step: item.metadata?.step ?? 1,
    decimals: item.metadata?.decimals ?? 0,
    unit: item.metadata?.unit ?? '',
    placeholder: item.metadata?.placeholder ?? 'Ingrese un número'
  };

  // Initialize input value from prop
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setInputValue(value.toString());
    } else {
      setInputValue('');
    }
  }, [value]);

  // Validate numeric input
  const validateInput = (inputStr: string): { isValid: boolean; message: string; numericValue?: number } => {
    if (inputStr === '') {
      return { isValid: true, message: '' };
    }

    const numericValue = parseFloat(inputStr);

    // Check if it's a valid number
    if (isNaN(numericValue)) {
      return { isValid: false, message: 'Por favor ingrese un número válido' };
    }

    // Check range constraints
    if (numericValue < constraints.min) {
      return { 
        isValid: false, 
        message: `El valor debe ser mayor o igual a ${constraints.min}${constraints.unit ? ' ' + constraints.unit : ''}` 
      };
    }

    if (numericValue > constraints.max) {
      return { 
        isValid: false, 
        message: `El valor debe ser menor o igual a ${constraints.max}${constraints.unit ? ' ' + constraints.unit : ''}` 
      };
    }

    // Check decimal places
    if (constraints.decimals === 0 && numericValue % 1 !== 0) {
      return { isValid: false, message: 'Por favor ingrese un número entero' };
    }

    const decimalPlaces = (inputStr.split('.')[1] || '').length;
    if (decimalPlaces > constraints.decimals) {
      return { 
        isValid: false, 
        message: `Máximo ${constraints.decimals} decimal${constraints.decimals === 1 ? '' : 'es'}` 
      };
    }

    // Check step constraint
    if (constraints.step && constraints.step !== 1) {
      const remainder = (numericValue - constraints.min) % constraints.step;
      if (Math.abs(remainder) > 0.0001) { // Allow for floating point precision
        return { 
          isValid: false, 
          message: `El valor debe ser múltiplo de ${constraints.step}` 
        };
      }
    }

    return { isValid: true, message: '', numericValue };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const validation = validateInput(newValue);
    setIsValid(validation.isValid);
    setValidationMessage(validation.message);

    // Only call onChange if the value is valid or empty
    if (validation.isValid) {
      if (validation.numericValue !== undefined) {
        onChange(validation.numericValue);
      } else if (newValue === '') {
        onChange(null);
      }
    }
  };

  const handleBlur = () => {
    // Re-validate on blur
    const validation = validateInput(inputValue);
    setIsValid(validation.isValid);
    setValidationMessage(validation.message);
    
    // Format the input if valid
    if (validation.isValid && validation.numericValue !== undefined) {
      const formatted = constraints.decimals === 0 
        ? validation.numericValue.toString()
        : validation.numericValue.toFixed(constraints.decimals);
      setInputValue(formatted);
    }
  };

  // Quick select buttons for common values (if defined in metadata)
  const quickSelectValues = item.metadata?.quickSelectValues || [];

  return (
    <div className="numeric-input-renderer">
      {/* Input Field */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            min={constraints.min}
            max={constraints.max}
            step={constraints.step}
            placeholder={constraints.placeholder}
            className={`
              w-full px-4 py-3 text-lg border-2 rounded-lg
              focus:ring-4 focus:ring-opacity-50 focus:outline-none
              ${isValid
                ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-300'
                : 'border-red-300 focus:border-red-500 focus:ring-red-300 bg-red-50'
              }
            `}
            aria-invalid={!isValid}
            aria-describedby={`${item.id}-help ${item.id}-error`}
          />
          
          {/* Unit Display */}
          {constraints.unit && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
              {constraints.unit}
            </div>
          )}
        </div>

        {/* Validation Message */}
        {!isValid && validationMessage && (
          <div id={`${item.id}-error`} className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {validationMessage}
          </div>
        )}
      </div>

      {/* Quick Select Buttons */}
      {quickSelectValues.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Valores comunes:</div>
          <div className="flex flex-wrap gap-2">
            {quickSelectValues.map((quickValue: number) => (
              <button
                key={quickValue}
                type="button"
                onClick={() => {
                  setInputValue(quickValue.toString());
                  onChange(quickValue);
                  setIsValid(true);
                  setValidationMessage('');
                }}
                className={`
                  px-3 py-1 text-sm rounded-full border transition-colors
                  ${value === quickValue
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                  }
                `}
              >
                {quickValue}{constraints.unit}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Range Information */}
      <div id={`${item.id}-help`} className="text-sm text-gray-600 space-y-1">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Rango válido: {constraints.min} - {constraints.max}{constraints.unit ? ' ' + constraints.unit : ''}
          </span>
        </div>
        
        {constraints.step !== 1 && (
          <div className="ml-6">
            Incrementos de: {constraints.step}{constraints.unit ? ' ' + constraints.unit : ''}
          </div>
        )}
        
        {constraints.decimals > 0 && (
          <div className="ml-6">
            Decimales permitidos: {constraints.decimals}
          </div>
        )}
      </div>

      {/* Current Value Display */}
      {value !== undefined && value !== null && isValid && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              <strong>Valor ingresado:</strong>
            </span>
            <span className="text-sm font-medium text-blue-900">
              {value}{constraints.unit ? ' ' + constraints.unit : ''}
            </span>
          </div>
        </div>
      )}

      {/* Accessibility announcement */}
      <div className="sr-only" aria-live="polite">
        {value !== undefined && value !== null && isValid && (
          `Valor ingresado: ${value}${constraints.unit ? ' ' + constraints.unit : ''}`
        )}
      </div>
    </div>
  );
};

export default NumericInputRenderer;