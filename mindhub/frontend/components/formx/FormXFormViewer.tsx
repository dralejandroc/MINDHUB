'use client';

import { useState, useEffect } from 'react';
import { 
  CheckIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

import { FormField, FormTemplate } from './types';

interface FormXFormViewerProps {
  template: FormTemplate;
  patientId?: string;
  onBack: () => void;
  onSubmit: (responses: { [key: string]: any }) => void;
}

export function FormXFormViewer({ template, patientId, onBack, onSubmit }: FormXFormViewerProps) {
  const [responses, setResponses] = useState<{ [key: string]: any }>({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [showAllFields, setShowAllFields] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    updateProgress();
  }, [responses, template.fields]);

  const updateProgress = () => {
    const requiredFields = template.fields.filter(field => field.required);
    const answeredRequired = requiredFields.filter(field => 
      responses[field.id] !== undefined && 
      responses[field.id] !== '' && 
      responses[field.id] !== null
    ).length;
    const newProgress = requiredFields.length > 0 ? (answeredRequired / requiredFields.length) * 100 : 100;
    setProgress(newProgress);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when field is filled
    if (errors[fieldId] && value !== undefined && value !== '' && value !== null) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    template.fields.forEach(field => {
      if (field.required) {
        const value = responses[field.id];
        if (value === undefined || value === '' || value === null || 
            (Array.isArray(value) && value.length === 0)) {
          newErrors[field.id] = `${field.label} es requerido`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await onSubmit(responses);
        toast.success('Formulario enviado exitosamente');
      } catch (error) {
        toast.error('Error enviando el formulario. Inténtalo de nuevo.');
      }
    } else {
      toast.error('Por favor completa todos los campos requeridos');
      setShowAllFields(true);
    }
  };

  const renderField = (field: FormField, index: number) => {
    const value = responses[field.id] || '';
    const hasError = errors[field.id];
    const isRequired = field.required;

    return (
      <div key={field.id} className={`space-y-3 ${showAllFields ? 'block' : (index === currentFieldIndex ? 'block' : 'hidden')}`}>
        <Card className={`p-6 ${hasError ? 'border-red-300 bg-red-50' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <label className="block text-lg font-medium text-gray-900 mb-2">
                {!showAllFields && (
                  <span className="text-sm text-gray-500 font-normal mr-2">
                    {index + 1} de {template.fields.length}
                  </span>
                )}
                {field.label}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.description && (
                <p className="text-sm text-gray-600 mb-3">{field.description}</p>
              )}
            </div>
            {value && !hasError && (
              <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
            )}
          </div>

          {/* Render different field types */}
          {field.type === 'text' && (
            <Input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? 'border-red-500' : ''}
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasError ? 'border-red-500' : 'border-gray-300'}`}
            />
          )}

          {field.type === 'email' && (
            <Input
              type="email"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? 'border-red-500' : ''}
            />
          )}

          {field.type === 'tel' && (
            <Input
              type="tel"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? 'border-red-500' : ''}
            />
          )}

          {field.type === 'date' && (
            <Input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
          )}

          {field.type === 'select' && field.options && (
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasError ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Seleccione una opción...</option>
              {field.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )}

          {field.type === 'radio' && field.options && (
            <div className="space-y-2">
              {field.options.map(option => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {field.type === 'checkbox' && field.options && (
            <div className="space-y-2">
              {field.options.map(option => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(option)}
                    onChange={(e) => {
                      const currentValue = Array.isArray(value) ? value : [];
                      const newValue = e.target.checked
                        ? [...currentValue, option]
                        : currentValue.filter(v => v !== option);
                      handleFieldChange(field.id, newValue);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {field.type === 'scale' && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{field.min || 1}</span>
                <span>{field.max || 10}</span>
              </div>
              <input
                type="range"
                min={field.min || 1}
                max={field.max || 10}
                value={value || field.min || 1}
                onChange={(e) => handleFieldChange(field.id, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center">
                <span className="text-lg font-semibold text-blue-600">
                  {value || field.min || 1}
                </span>
              </div>
            </div>
          )}

          {field.type === 'file' && (
            <input
              type="file"
              onChange={(e) => handleFieldChange(field.id, e.target.files?.[0])}
              className={`w-full px-3 py-2 border rounded-md ${hasError ? 'border-red-500' : 'border-gray-300'}`}
            />
          )}

          {hasError && (
            <div className="mt-2 flex items-center text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">{hasError}</span>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const nextField = () => {
    if (currentFieldIndex < template.fields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
    }
  };

  const prevField = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1);
    }
  };

  const canContinue = () => {
    const currentField = template.fields[currentFieldIndex];
    const value = responses[currentField.id];
    
    if (currentField.required) {
      return value !== undefined && value !== '' && value !== null && 
             !(Array.isArray(value) && value.length === 0);
    }
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
          </div>
          <p className="text-gray-600">{template.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">{template.category}</Badge>
            <span className="text-sm text-gray-500">⏱️ {template.estimatedTime}</span>
          </div>
        </div>
        <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </Button>
      </div>

      {/* Instructions */}
      {template.instructions && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Instrucciones</h3>
          <p className="text-blue-800 text-sm">{template.instructions}</p>
        </Card>
      )}

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso del formulario</span>
          <span className="text-sm text-gray-600">{Math.round(progress)}% completado</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Campos requeridos: {template.fields.filter(f => f.required).length}</span>
          <span>Total de campos: {template.fields.length}</span>
        </div>
      </Card>

      {/* Toggle View Mode */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowAllFields(!showAllFields)}
          variant="outline"
          className="flex items-center gap-2"
        >
          {showAllFields ? 'Vista por pasos' : 'Ver todos los campos'}
        </Button>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {template.fields.map((field, index) => renderField(field, index))}
      </div>

      {/* Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {!showAllFields ? (
            <>
              <Button
                onClick={prevField}
                variant="outline"
                disabled={currentFieldIndex === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Anterior
              </Button>

              <div className="text-sm text-gray-600">
                Campo {currentFieldIndex + 1} de {template.fields.length}
              </div>

              {currentFieldIndex === template.fields.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  className="flex items-center gap-2"
                  disabled={progress < 100}
                >
                  <CheckIcon className="h-4 w-4" />
                  Enviar Formulario
                </Button>
              ) : (
                <Button
                  onClick={nextField}
                  disabled={!canContinue()}
                  className="flex items-center gap-2"
                >
                  Siguiente
                  <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                </Button>
              )}
            </>
          ) : (
            <div className="w-full flex justify-center">
              <Button
                onClick={handleSubmit}
                className="flex items-center gap-2"
                size="lg"
              >
                <CheckIcon className="h-5 w-5" />
                Enviar Formulario
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <h3 className="font-medium text-red-900 mb-2 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            Campos pendientes por completar
          </h3>
          <ul className="text-sm text-red-800 space-y-1">
            {Object.entries(errors).map(([fieldId, error]) => (
              <li key={fieldId}>• {error}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}