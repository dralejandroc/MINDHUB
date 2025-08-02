'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  conditionalLogic?: {
    showWhen?: string;
    operator?: 'equals' | 'not_equals' | 'contains';
    value?: string;
  };
  description?: string;
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

interface FormData {
  id: string;
  title: string;
  description: string;
  sections: FormSection[];
  settings: {
    submitMessage: string;
    requireSignature: boolean;
    privacyNotice: string;
  };
  token?: string;
  patientId?: string;
  assignedBy?: string;
  expiresAt?: string;
}

interface PatientFormRendererProps {
  formToken: string;
  onSubmit?: (responses: Record<string, any>) => void;
  className?: string;
}

export const PatientFormRenderer: React.FC<PatientFormRendererProps> = ({
  formToken,
  onSubmit,
  className = ''
}) => {
  const [form, setForm] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);

  // Load form data using token
  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms/token/${formToken}`
        );

        if (response.ok) {
          const formData = await response.json();
          setForm(formData.data);
          
          // Check if form has already been completed
          if (formData.data.status === 'completed') {
            setIsComplete(true);
          }
        } else if (response.status === 404) {
          toast.error('Formulario no encontrado o token inválido');
        } else if (response.status === 410) {
          toast.error('Este formulario ha expirado');
        } else {
          throw new Error('Error al cargar formulario');
        }
      } catch (error) {
        console.error('Error loading form:', error);
        toast.error('Error al cargar el formulario');
      } finally {
        setLoading(false);
      }
    };

    if (formToken) {
      loadForm();
    }
  }, [formToken]);

  // Validate field
  const validateField = useCallback((field: FormField, value: any): string | null => {
    if (field.required && (!value || value === '')) {
      return 'Este campo es requerido';
    }

    if (field.validation && value) {
      const { min, max, pattern, message } = field.validation;
      
      if (min && value.length < min) {
        return message || `Mínimo ${min} caracteres`;
      }
      
      if (max && value.length > max) {
        return message || `Máximo ${max} caracteres`;
      }
      
      if (pattern && !new RegExp(pattern).test(value)) {
        return message || 'Formato inválido';
      }
    }

    // Specific validation for field types
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Formato de email inválido';
    }

    if (field.type === 'phone' && value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, ''))) {
      return 'Formato de teléfono inválido';
    }

    return null;
  }, []);

  // Handle field value change
  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear field error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  }, [errors]);

  // Validate current section
  const validateCurrentSection = useCallback((): boolean => {
    if (!form) return false;

    const section = form.sections[currentSection];
    const newErrors: Record<string, string> = {};
    let isValid = true;

    section.fields.forEach(field => {
      // Check conditional logic
      if (field.conditionalLogic) {
        const { showWhen, operator, value: conditionValue } = field.conditionalLogic;
        const fieldValue = responses[showWhen || ''];
        
        let shouldShow = false;
        if (operator === 'equals') {
          shouldShow = fieldValue === conditionValue;
        } else if (operator === 'not_equals') {
          shouldShow = fieldValue !== conditionValue;
        } else if (operator === 'contains') {
          shouldShow = Array.isArray(fieldValue) && fieldValue.includes(conditionValue);
        }

        if (!shouldShow) {
          return; // Skip validation for hidden fields
        }
      }

      const error = validateField(field, responses[field.id]);
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [form, currentSection, responses, validateField]);

  // Navigate to next section
  const nextSection = useCallback(() => {
    if (validateCurrentSection()) {
      setCurrentSection(prev => Math.min(prev + 1, (form?.sections.length || 1) - 1));
    }
  }, [validateCurrentSection, form]);

  // Navigate to previous section
  const prevSection = useCallback(() => {
    setCurrentSection(prev => Math.max(prev - 1, 0));
  }, []);

  // Submit form
  const handleSubmit = useCallback(async () => {
    if (!form || !validateCurrentSection()) return;

    // Check privacy acceptance
    if (!privacyAccepted) {
      toast.error('Debe aceptar el aviso de privacidad para continuar');
      return;
    }

    // Check signature requirement
    if (form.settings.requireSignature && !signature) {
      toast.error('La firma es requerida para completar el formulario');
      return;
    }

    setSubmitting(true);

    try {
      const submissionData = {
        formId: form.id,
        token: formToken,
        responses,
        signature: signature || null,
        submittedAt: new Date().toISOString(),
        completionTime: Date.now() - (form as any).startTime // Track completion time
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/submissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData)
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(form.settings.submitMessage || 'Formulario enviado exitosamente');
        setIsComplete(true);
        
        if (onSubmit) {
          onSubmit(responses);
        }
      } else {
        throw new Error('Error al enviar formulario');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Error al enviar el formulario. Por favor intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }, [form, formToken, responses, signature, privacyAccepted, validateCurrentSection, onSubmit]);

  // Render signature pad (simplified)
  const SignaturePad: React.FC<{ value: string; onChange: (signature: string) => void }> = ({
    value,
    onChange
  }) => {
    const [isDrawing, setIsDrawing] = useState(false);

    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <div className="text-center mb-4">
          <PencilIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Haga clic aquí para firmar</p>
        </div>
        
        <div className="flex justify-center space-x-2">
          <Button
            onClick={() => {
              const signatureName = prompt('Por favor ingrese su nombre completo para la firma:');
              if (signatureName) {
                onChange(`Firmado digitalmente por: ${signatureName} - ${new Date().toLocaleString()}`);
              }
            }}
            variant="outline"
            size="sm"
          >
            Firmar con Nombre
          </Button>
          
          {value && (
            <Button
              onClick={() => onChange('')}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300"
            >
              Limpiar Firma
            </Button>
          )}
        </div>
        
        {value && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{value}</p>
          </div>
        )}
      </div>
    );
  };

  // Render field based on type
  const renderField = useCallback((field: FormField) => {
    const value = responses[field.id] || '';
    const error = errors[field.id];

    // Check conditional logic
    if (field.conditionalLogic) {
      const { showWhen, operator, value: conditionValue } = field.conditionalLogic;
      const fieldValue = responses[showWhen || ''];
      
      let shouldShow = false;
      if (operator === 'equals') {
        shouldShow = fieldValue === conditionValue;
      } else if (operator === 'not_equals') {
        shouldShow = fieldValue !== conditionValue;
      } else if (operator === 'contains') {
        shouldShow = Array.isArray(fieldValue) && fieldValue.includes(conditionValue);
      }

      if (!shouldShow) {
        return null;
      }
    }

    return (
      <div key={field.id} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.description && (
          <p className="text-xs text-gray-500 flex items-start">
            <InformationCircleIcon className="h-4 w-4 mr-1 mt-0.5 text-blue-400" />
            {field.description}
          </p>
        )}

        {/* Render input based on field type */}
        {field.type === 'text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        )}

        {field.type === 'email' && (
          <input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        )}

        {field.type === 'phone' && (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        )}

        {field.type === 'date' && (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        )}

        {field.type === 'select' && (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Seleccione una opción</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )}

        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleFieldChange(field.id, [...currentValues, option]);
                    } else {
                      handleFieldChange(field.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'scale' && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{field.validation?.min || 1}</span>
              <span>{field.validation?.max || 10}</span>
            </div>
            <input
              type="range"
              min={field.validation?.min || 1}
              max={field.validation?.max || 10}
              value={value || field.validation?.min || 1}
              onChange={(e) => handleFieldChange(field.id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                {value || field.validation?.min || 1}
              </span>
            </div>
          </div>
        )}

        {field.type === 'signature' && (
          <SignaturePad
            value={signature}
            onChange={setSignature}
          />
        )}

        {error && (
          <p className="text-red-600 text-sm flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  }, [responses, errors, signature, handleFieldChange]);

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulario No Encontrado</h2>
          <p className="text-gray-600">
            El enlace del formulario puede haber expirado o ser inválido.
          </p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Formulario Completado!</h2>
          <p className="text-gray-600 mb-6">
            {form.settings.submitMessage}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              Sus respuestas han sido enviadas y agregadas a su expediente médico.
              Su médico revisará la información antes de su próxima consulta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentSectionData = form.sections[currentSection];
  const progress = ((currentSection + 1) / form.sections.length) * 100;

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Privacy Notice Modal */}
      {showPrivacyNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Aviso de Privacidad</h3>
              </div>
              
              <div className="prose prose-sm max-w-none text-gray-600 mb-6">
                <pre className="whitespace-pre-wrap text-sm">{form.settings.privacyNotice}</pre>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mr-2 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Acepto el tratamiento de mis datos personales
                  </span>
                </label>
                
                <Button
                  onClick={() => setShowPrivacyNotice(false)}
                  disabled={!privacyAccepted}
                  variant="primary"
                >
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Header */}
      <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
          <p className="text-primary-100">{form.description}</p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-primary-100 mb-2">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-primary-800 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentSectionData.title}
              </h2>
              {currentSectionData.description && (
                <p className="text-sm text-gray-600">{currentSectionData.description}</p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Sección {currentSection + 1} de {form.sections.length}
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          {currentSectionData.fields.map(renderField)}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <Button
            onClick={prevSection}
            disabled={currentSection === 0}
            variant="outline"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex items-center space-x-2">
            {form.settings.privacyNotice && !privacyAccepted && (
              <Button
                onClick={() => setShowPrivacyNotice(true)}
                variant="outline"
                size="sm"
              >
                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                Ver Aviso de Privacidad
              </Button>
            )}

            {currentSection === form.sections.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting || !privacyAccepted}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Enviar Formulario
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextSection}>
                Siguiente
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};