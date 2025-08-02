'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  CameraIcon,
  MicrophoneIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface MobileFormField {
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
  description?: string;
  customProperties?: Record<string, any>;
}

interface MobileFormSection {
  id: string;
  title: string;
  description?: string;
  fields: MobileFormField[];
}

interface MobileFormData {
  id: string;
  title: string;
  description: string;
  sections: MobileFormSection[];
  token?: string;
  patientId?: string;
  expiresAt?: string;
  message?: string;
}

interface MobileFormRendererProps {
  formData: MobileFormData;
  onSubmit: (responses: Record<string, any>) => void;
  onSave?: (responses: Record<string, any>) => void; // Save draft
}

export const MobileFormRenderer: React.FC<MobileFormRendererProps> = ({
  formData,
  onSubmit,
  onSave
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  const currentSection = formData.sections[currentSectionIndex] || formData.sections[0];
  const currentField = currentSection?.fields[currentFieldIndex];
  const totalFields = formData.sections.reduce((acc, section) => acc + section.fields.length, 0);
  const completedFields = Object.keys(responses).length;

  // Update progress
  useEffect(() => {
    const newProgress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
    setProgress(newProgress);
  }, [completedFields, totalFields]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (onSave && Object.keys(responses).length > 0) {
      const interval = setInterval(() => {
        onSave(responses);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [responses, onSave]);

  const validateField = (field: MobileFormField, value: any): string | null => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} es requerido`;
    }

    if (field.validation && value) {
      if (field.validation.min && value.length < field.validation.min) {
        return `${field.label} debe tener al menos ${field.validation.min} caracteres`;
      }
      if (field.validation.max && value.length > field.validation.max) {
        return `${field.label} debe tener máximo ${field.validation.max} caracteres`;
      }
      if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
        return field.validation.message || `${field.label} no tiene el formato correcto`;
      }
    }

    return null;
  };

  const updateResponse = (fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error if exists
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const goToNextField = () => {
    if (!currentField) return;

    // Validate current field
    const error = validateField(currentField, responses[currentField.id]);
    if (error) {
      setErrors(prev => ({ ...prev, [currentField.id]: error }));
      return;
    }

    // Move to next field
    if (currentFieldIndex < currentSection.fields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
    } else if (currentSectionIndex < formData.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentFieldIndex(0);
    }

    // Smooth scroll to top
    formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousField = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      const prevSection = formData.sections[currentSectionIndex - 1];
      setCurrentFieldIndex(prevSection.fields.length - 1);
    }

    // Smooth scroll to top
    formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    // Validate all required fields
    const validationErrors: Record<string, string> = {};
    
    formData.sections.forEach(section => {
      section.fields.forEach(field => {
        const error = validateField(field, responses[field.id]);
        if (error) {
          validationErrors[field.id] = error;
        }
      });
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(responses);
      toast.success('Formulario enviado exitosamente');
    } catch (error) {
      toast.error('Error al enviar el formulario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: MobileFormField) => {
    const error = errors[field.id];
    const value = responses[field.id] || '';

    const inputClassName = `w-full px-4 py-3 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
    }`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div className="space-y-2">
            <input
              type={field.type}
              value={value}
              onChange={(e) => updateResponse(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={inputClassName}
              autoFocus
            />
            {field.type === 'email' && (
              <div className="flex items-center text-gray-500 text-sm">
                <EnvelopeIcon className="h-4 w-4 mr-1" />
                Ejemplo: correo@ejemplo.com
              </div>
            )}
            {field.type === 'phone' && (
              <div className="flex items-center text-gray-500 text-sm">
                <PhoneIcon className="h-4 w-4 mr-1" />
                Ejemplo: +52 555 123 4567
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={inputClassName}
            autoFocus
          />
        );

      case 'date':
        return (
          <div className="space-y-2">
            <input
              type="date"
              value={value}
              onChange={(e) => updateResponse(field.id, e.target.value)}
              className={inputClassName}
              autoFocus
            />
            <div className="flex items-center text-gray-500 text-sm">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Seleccione una fecha
            </div>
          </div>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            className={inputClassName}
            autoFocus
          >
            <option value="">Seleccione una opción</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                  value === option ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                  className="mr-3 w-5 h-5 text-primary-600"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => {
              const isChecked = Array.isArray(value) ? value.includes(option) : false;
              return (
                <label
                  key={index}
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                    isChecked ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(v => v !== option);
                      updateResponse(field.id, newValues);
                    }}
                    className="mr-3 w-5 h-5 text-primary-600"
                  />
                  <span className="text-lg">{option}</span>
                </label>
              );
            })}
          </div>
        );

      case 'scale':
      case 'pain_scale':
        const min = field.validation?.min || field.customProperties?.min || 0;
        const max = field.validation?.max || field.customProperties?.max || 10;
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {value || min}
              </div>
              <div className="text-sm text-gray-500">
                {field.type === 'pain_scale' ? 
                  ['Sin dolor', 'Dolor leve', 'Dolor moderado', 'Dolor severo', 'Dolor muy severo'][Math.floor((value || 0) / 2)] || 'Sin dolor'
                  : `Escala de ${min} a ${max}`
                }
              </div>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              value={value || min}
              onChange={(e) => updateResponse(field.id, parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        );

      case 'vital_signs':
        const measurements = field.customProperties?.measurements || ['presión_arterial', 'pulso', 'temperatura'];
        const vitalValues = value || {};
        return (
          <div className="space-y-4">
            {measurements.map((measurement: string) => (
              <div key={measurement} className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <HeartIcon className="h-4 w-4 mr-2 text-red-500" />
                  {measurement.replace('_', ' ').toUpperCase()}
                </label>
                <input
                  type="text"
                  value={vitalValues[measurement] || ''}
                  onChange={(e) => updateResponse(field.id, {
                    ...vitalValues,
                    [measurement]: e.target.value
                  })}
                  placeholder={`Ingrese ${measurement.replace('_', ' ')}`}
                  className={inputClassName}
                />
              </div>
            ))}
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <PencilIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Área de firma digital</p>
              <Button
                variant="outline"
                onClick={() => updateResponse(field.id, `Firma_${Date.now()}`)}
                className="bg-white"
              >
                Firmar aquí
              </Button>
            </div>
            {value && (
              <div className="flex items-center justify-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Documento firmado
              </div>
            )}
          </div>
        );

      case 'medical_image_upload':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Subir imagen médica</p>
              <input
                type="file"
                accept={field.customProperties?.acceptedTypes?.join(',') || 'image/*'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateResponse(field.id, {
                      file: file,
                      name: file.name,
                      size: file.size
                    });
                  }
                }}
                className="hidden"
                id={`file-${field.id}`}
              />
              <label
                htmlFor={`file-${field.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <CameraIcon className="h-4 w-4 mr-2" />
                Seleccionar imagen
              </label>
            </div>
            {value?.name && (
              <div className="flex items-center justify-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {value.name}
              </div>
            )}
          </div>
        );

      case 'voice_note':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <MicrophoneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Grabar nota de voz</p>
              <Button
                variant="outline"
                onClick={() => updateResponse(field.id, `Audio_${Date.now()}`)}
                className="bg-white"
              >
                <MicrophoneIcon className="h-4 w-4 mr-2" />
                Iniciar grabación
              </Button>
            </div>
            {value && (
              <div className="flex items-center justify-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Nota de voz grabada
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={inputClassName}
            autoFocus
          />
        );
    }
  };

  const isLastField = currentSectionIndex === formData.sections.length - 1 && 
                    currentFieldIndex === currentSection.fields.length - 1;
  const isFirstField = currentSectionIndex === 0 && currentFieldIndex === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Progress */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {formData.title}
            </h1>
            <span className="text-sm text-gray-500">
              {completedFields}/{totalFields}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div ref={formRef} className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          {currentField && (
            <div className="space-y-6">
              {/* Section Header */}
              {currentFieldIndex === 0 && (
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentSection.title}
                  </h2>
                  {currentSection.description && (
                    <p className="text-gray-600">{currentSection.description}</p>
                  )}
                </div>
              )}

              {/* Field */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xl font-medium text-gray-900 mb-2">
                    {currentField.label}
                    {currentField.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {currentField.description && (
                    <p className="text-gray-600 text-sm mb-4">{currentField.description}</p>
                  )}
                </div>

                {renderField(currentField)}

                {errors[currentField.id] && (
                  <div className="flex items-center text-red-600 text-sm">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors[currentField.id]}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 space-y-3">
        <div className="flex justify-between items-center">
          <Button
            onClick={goToPreviousField}
            disabled={isFirstField}
            variant="outline"
            className="flex items-center"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {isLastField ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center px-8"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Formulario'}
              <CheckCircleIcon className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={goToNextField}
              className="bg-primary-600 hover:bg-primary-700 text-white flex items-center"
            >
              Siguiente
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Save Draft Button */}
        {onSave && Object.keys(responses).length > 0 && (
          <Button
            onClick={() => onSave(responses)}
            variant="outline"
            size="sm"
            className="w-full text-center"
          >
            Guardar borrador
          </Button>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};