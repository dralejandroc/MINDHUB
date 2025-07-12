'use client';

import React, { useState, useRef } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { FormDefinition, FormField } from './FormBuilderMVP';

interface FormSubmission {
  formId: string;
  responses: Record<string, any>;
  submittedAt: Date;
  submitterEmail?: string;
  signature?: string;
}

interface FormRendererMVPProps {
  form: FormDefinition;
  onSubmit: (submission: FormSubmission) => void;
  allowSaveProgress?: boolean;
  onSaveProgress?: (responses: Record<string, any>) => void;
  initialResponses?: Record<string, any>;
}

export const FormRendererMVP: React.FC<FormRendererMVPProps> = ({
  form,
  onSubmit,
  allowSaveProgress = false,
  onSaveProgress,
  initialResponses = {}
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const currentPage = form.pages[currentPageIndex];
  const isLastPage = currentPageIndex === form.pages.length - 1;
  const progress = ((currentPageIndex + 1) / form.pages.length) * 100;

  // Handle field response
  const handleFieldResponse = (fieldId: string, value: any) => {
    const newResponses = {
      ...responses,
      [fieldId]: value
    };

    setResponses(newResponses);

    // Clear field error
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }

    // Auto-save progress if enabled
    if (allowSaveProgress && onSaveProgress) {
      onSaveProgress(newResponses);
    }
  };

  // Validate current page
  const validateCurrentPage = (): boolean => {
    const pageErrors: Record<string, string> = {};
    
    currentPage.fields.forEach(field => {
      if (field.required && !responses[field.id]) {
        pageErrors[field.id] = 'Este campo es obligatorio';
      }

      // Email validation
      if (field.type === 'email' && responses[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(responses[field.id])) {
          pageErrors[field.id] = 'Formato de email inválido';
        }
      }

      // Phone validation
      if (field.type === 'phone' && responses[field.id]) {
        const phoneRegex = /^[\d\s\-\(\)\+]+$/;
        if (!phoneRegex.test(responses[field.id])) {
          pageErrors[field.id] = 'Formato de teléfono inválido';
        }
      }

      // Number validation
      if (field.type === 'number' && responses[field.id]) {
        if (isNaN(Number(responses[field.id]))) {
          pageErrors[field.id] = 'Debe ser un número válido';
        }
        if (field.validation?.min && Number(responses[field.id]) < field.validation.min) {
          pageErrors[field.id] = `El valor mínimo es ${field.validation.min}`;
        }
        if (field.validation?.max && Number(responses[field.id]) > field.validation.max) {
          pageErrors[field.id] = `El valor máximo es ${field.validation.max}`;
        }
      }

      // Text validation
      if ((field.type === 'text' || field.type === 'textarea') && responses[field.id]) {
        if (field.validation?.minLength && responses[field.id].length < field.validation.minLength) {
          pageErrors[field.id] = `Mínimo ${field.validation.minLength} caracteres`;
        }
        if (field.validation?.maxLength && responses[field.id].length > field.validation.maxLength) {
          pageErrors[field.id] = `Máximo ${field.validation.maxLength} caracteres`;
        }
      }
    });

    setErrors(pageErrors);
    return Object.keys(pageErrors).length === 0;
  };

  // Navigate to next page
  const handleNextPage = () => {
    if (validateCurrentPage()) {
      if (isLastPage) {
        setShowConfirmation(true);
      } else {
        setCurrentPageIndex(prev => prev + 1);
      }
    }
  };

  // Navigate to previous page
  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      let signature = '';
      
      // Capture signature if required
      if (form.settings.requireSignature && signatureRef.current) {
        signature = signatureRef.current.toDataURL();
      }

      const submission: FormSubmission = {
        formId: form.id,
        responses,
        submittedAt: new Date(),
        submitterEmail: form.settings.collectEmail ? responses['email'] : undefined,
        signature
      };

      await onSubmit(submission);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if field should be visible based on conditional logic
  const isFieldVisible = (field: FormField): boolean => {
    if (!field.conditionalLogic) return true;

    const dependentValue = responses[field.conditionalLogic.dependsOn];
    const targetValue = field.conditionalLogic.value;

    switch (field.conditionalLogic.condition) {
      case 'equals':
        return dependentValue === targetValue;
      case 'not_equals':
        return dependentValue !== targetValue;
      case 'contains':
        return dependentValue && dependentValue.includes(targetValue);
      default:
        return true;
    }
  };

  // Signature drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = signatureRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Render field based on type
  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null;

    const fieldValue = responses[field.id] || '';
    const hasError = !!errors[field.id];
    const widthClass = field.width === 'half' ? 'col-span-1' : field.width === 'third' ? 'col-span-1 lg:col-span-1' : 'col-span-full';

    const baseInputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500 focus:border-transparent ${
      hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
    }`;

    switch (field.type) {
      case 'section_header':
        return (
          <div key={field.id} className="col-span-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              {field.label}
            </h3>
          </div>
        );

      case 'info_text':
        return (
          <div key={field.id} className="col-span-full">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">{field.description}</p>
            </div>
          </div>
        );

      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className={widthClass}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              value={fieldValue}
              onChange={(e) => handleFieldResponse(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={baseInputClasses}
            />
            {hasError && (
              <p className="text-red-600 text-sm mt-1">{errors[field.id]}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className={widthClass}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={fieldValue}
              onChange={(e) => handleFieldResponse(field.id, e.target.value)}
              min={field.validation?.min}
              max={field.validation?.max}
              className={baseInputClasses}
            />
            {hasError && (
              <p className="text-red-600 text-sm mt-1">{errors[field.id]}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className={widthClass}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={fieldValue}
              onChange={(e) => handleFieldResponse(field.id, e.target.value)}
              className={baseInputClasses}
            />
            {hasError && (
              <p className="text-red-600 text-sm mt-1">{errors[field.id]}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={fieldValue}
              onChange={(e) => handleFieldResponse(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={baseInputClasses}
            />
            {hasError && (
              <p className="text-red-600 text-sm mt-1">{errors[field.id]}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className={widthClass}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={fieldValue}
              onChange={(e) => handleFieldResponse(field.id, e.target.value)}
              className={baseInputClasses}
            >
              <option value="">Seleccione una opción</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {hasError && (
              <p className="text-red-600 text-sm mt-1">{errors[field.id]}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className={widthClass}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={fieldValue === option}
                    onChange={(e) => handleFieldResponse(field.id, e.target.value)}
                    className="mr-3 h-4 w-4 text-formx-600 border-gray-300 focus:ring-formx-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {hasError && (
              <p className="text-red-600 text-sm mt-1">{errors[field.id]}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className={widthClass}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option}
                    checked={Array.isArray(fieldValue) && fieldValue.includes(option)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
                      if (e.target.checked) {
                        handleFieldResponse(field.id, [...currentValues, option]);
                      } else {
                        handleFieldResponse(field.id, currentValues.filter(v => v !== option));
                      }
                    }}
                    className="mr-3 h-4 w-4 text-formx-600 border-gray-300 rounded focus:ring-formx-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {hasError && (
              <p className="text-red-600 text-sm mt-1">{errors[field.id]}</p>
            )}
          </div>
        );

      case 'signature':
        return (
          <div key={field.id} className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border border-gray-300 rounded-lg p-4">
              <canvas
                ref={signatureRef}
                width={400}
                height={150}
                className="border border-gray-200 rounded w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <button
                type="button"
                onClick={clearSignature}
                className="mt-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Limpiar firma
              </button>
            </div>
            {hasError && (
              <p className="text-red-600 text-sm mt-1">{errors[field.id]}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-formx-50 to-white p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Confirmar Envío</h1>
            <p className="text-gray-600 mb-8">
              ¿Está seguro de que desea enviar el formulario? Una vez enviado, no podrá realizar cambios.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Revisar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-formx-600 text-white rounded-lg hover:bg-formx-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : form.settings.submitButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-formx-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-xl p-6 border-b border-gray-200">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
            <p className="text-gray-600 mb-4">{form.description}</p>
            
            {form.settings.showProgressBar && (
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Página {currentPageIndex + 1} de {form.pages.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-formx-600 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentPage.title}</h2>
            {currentPage.description && (
              <p className="text-gray-600">{currentPage.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPage.fields.map(renderField)}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-b-2xl shadow-xl p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              {currentPageIndex > 0 && (
                <button
                  onClick={handlePreviousPage}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-2" />
                  Anterior
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {allowSaveProgress && onSaveProgress && (
                <button
                  onClick={() => onSaveProgress(responses)}
                  className="px-4 py-2 text-formx-600 hover:text-formx-700 font-medium transition-colors"
                >
                  Guardar Progreso
                </button>
              )}

              <button
                onClick={handleNextPage}
                className="flex items-center px-6 py-2 bg-formx-600 text-white rounded-lg hover:bg-formx-700 font-medium transition-colors"
              >
                {isLastPage ? form.settings.submitButtonText : 'Siguiente'}
                {!isLastPage && <ChevronRightIcon className="h-4 w-4 ml-2" />}
              </button>
            </div>
          </div>
        </div>

        {/* Auto-save indicator */}
        {allowSaveProgress && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            Progreso guardado automáticamente
          </div>
        )}
      </div>
    </div>
  );
};

export default FormRendererMVP;