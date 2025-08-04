/**
 * TextInputRenderer - Renders text input responses
 * 
 * Handles open-text responses with character limits,
 * validation, and formatting for clinical assessments.
 */

'use client';

import React, { useState, useEffect } from 'react';

interface TextInputRendererProps {
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

export const TextInputRenderer: React.FC<TextInputRendererProps> = ({
  item,
  value,
  onChange
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [validationMessage, setValidationMessage] = useState<string>('');

  // Extract constraints from metadata or item configuration
  const constraints = {
    minLength: item.metadata?.minLength ?? 0,
    maxLength: item.metadata?.maxLength ?? 500,
    placeholder: item.metadata?.placeholder ?? 'Escriba su respuesta aquí...',
    multiline: item.metadata?.multiline ?? true,
    rows: item.metadata?.rows ?? 4,
    pattern: item.metadata?.pattern ?? null, // Regex pattern for validation
    patternMessage: item.metadata?.patternMessage ?? 'Formato no válido'
  };

  // Initialize input value from prop
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setInputValue(value.toString());
    } else {
      setInputValue('');
    }
  }, [value]);

  // Validate text input
  const validateInput = (inputStr: string): { isValid: boolean; message: string } => {
    if (inputStr === '' && constraints.minLength === 0) {
      return { isValid: true, message: '' };
    }

    // Check minimum length
    if (inputStr.length < constraints.minLength) {
      return { 
        isValid: false, 
        message: constraints.minLength === 1 
          ? 'Este campo es requerido'
          : `Mínimo ${constraints.minLength} caracteres requeridos` 
      };
    }

    // Check maximum length
    if (inputStr.length > constraints.maxLength) {
      return { 
        isValid: false, 
        message: `Máximo ${constraints.maxLength} caracteres permitidos` 
      };
    }

    // Check pattern if provided
    if (constraints.pattern && inputStr.length > 0) {
      const regex = new RegExp(constraints.pattern);
      if (!regex.test(inputStr)) {
        return { isValid: false, message: constraints.patternMessage };
      }
    }

    return { isValid: true, message: '' };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Prevent exceeding max length
    if (newValue.length <= constraints.maxLength) {
      setInputValue(newValue);

      const validation = validateInput(newValue);
      setIsValid(validation.isValid);
      setValidationMessage(validation.message);

      // Always call onChange to update the value
      onChange(newValue || null);
    }
  };

  const handleBlur = () => {
    // Re-validate on blur
    const validation = validateInput(inputValue);
    setIsValid(validation.isValid);
    setValidationMessage(validation.message);
  };

  // Character count
  const characterCount = inputValue.length;
  const isNearLimit = characterCount > constraints.maxLength * 0.8;

  // Get appropriate input component
  const InputComponent = constraints.multiline ? 'textarea' : 'input';
  const inputProps = constraints.multiline 
    ? { rows: constraints.rows }
    : { type: 'text' };

  return (
    <div className="text-input-renderer">
      {/* Input Field */}
      <div className="mb-2">
        <InputComponent
          {...inputProps}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={constraints.placeholder}
          className={`
            w-full px-4 py-3 text-base border-2 rounded-lg resize-none
            focus:ring-4 focus:ring-opacity-50 focus:outline-none
            ${isValid
              ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-300'
              : 'border-red-300 focus:border-red-500 focus:ring-red-300 bg-red-50'
            }
          `}
          aria-invalid={!isValid}
          aria-describedby={`${item.id}-help ${item.id}-error ${item.id}-count`}
        />
      </div>

      {/* Character Count */}
      <div className="flex justify-between items-center mb-2">
        <div>
          {/* Validation Message */}
          {!isValid && validationMessage && (
            <div id={`${item.id}-error`} className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {validationMessage}
            </div>
          )}
        </div>
        
        {/* Character Count */}
        <div 
          id={`${item.id}-count`}
          className={`text-sm ${isNearLimit ? 'text-orange-600' : 'text-gray-500'}`}
        >
          {characterCount}/{constraints.maxLength}
        </div>
      </div>

      {/* Help Text */}
      <div id={`${item.id}-help`} className="text-sm text-gray-600 space-y-1">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {constraints.minLength > 0 && (
              <>Mínimo {constraints.minLength} caracteres. </>
            )}
            {constraints.multiline 
              ? 'Use saltos de línea para separar ideas.' 
              : 'Respuesta en una sola línea.'}
          </span>
        </div>
        
        {constraints.pattern && (
          <div className="ml-6 text-xs text-gray-500">
            Formato específico requerido.
          </div>
        )}
      </div>

      {/* Word Count (for longer text) */}
      {constraints.multiline && inputValue.length > 50 && (
        <div className="mt-2 text-xs text-gray-500">
          Palabras aproximadas: {inputValue.trim().split(/\s+/).filter(word => word.length > 0).length}
        </div>
      )}

      {/* Current Value Display (truncated if long) */}
      {value && isValid && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800 mb-1">
            <strong>Respuesta ingresada:</strong>
          </div>
          <div className="text-sm text-blue-900">
            {value.length > 100 
              ? `${value.substring(0, 100)}...` 
              : value}
          </div>
          {value.length > 100 && (
            <div className="text-xs text-blue-600 mt-1">
              (Mostrando primeros 100 caracteres)
            </div>
          )}
        </div>
      )}

      {/* Accessibility announcement */}
      <div className="sr-only" aria-live="polite">
        {!isValid && validationMessage && `Error: ${validationMessage}`}
        {isNearLimit && `Acercándose al límite de caracteres: ${characterCount} de ${constraints.maxLength}`}
      </div>
    </div>
  );
};

export default TextInputRenderer;