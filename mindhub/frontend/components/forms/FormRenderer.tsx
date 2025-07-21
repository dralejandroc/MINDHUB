'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  ShareIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import DynamicFormField, { FormField } from './DynamicFormField';

interface FormInstance {
  id: string;
  templateId: string;
  patientId: string;
  consultationId?: string;
  title: string;
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
  fields: FormField[];
  summary?: {
    completedAt: string;
    totalFields: number;
    completedFields: number;
    keyFindings: string[];
    scores: Record<string, any>;
    recommendations: string[];
  };
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
}

interface FormRendererProps {
  form: FormInstance;
  template: FormTemplate;
  onSave: (formId: string, fieldId: string, value: any) => void;
  onComplete: (formId: string) => void;
  onBack: () => void;
  readOnly?: boolean;
  autoSave?: boolean;
}

export default function FormRenderer({ 
  form, 
  template, 
  onSave, 
  onComplete, 
  onBack,
  readOnly = false,
  autoSave = true 
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [progress, setProgress] = useState(0);

  // Inicializar datos del formulario
  useEffect(() => {
    const initialData: Record<string, any> = {};
    form.fields.forEach(field => {
      if (field.value !== null && field.value !== undefined) {
        initialData[field.id] = field.value;
      }
    });
    setFormData(initialData);
  }, [form]);

  // Calcular progreso
  useEffect(() => {
    const requiredFields = form.fields.filter(field => 
      field.required && !['section_header', 'divider', 'calculated_field'].includes(field.type)
    );
    const completedRequired = requiredFields.filter(field => {
      const value = formData[field.id];
      return value !== null && value !== undefined && value !== '';
    });
    
    const newProgress = requiredFields.length > 0 
      ? Math.round((completedRequired.length / requiredFields.length) * 100)
      : 100;
    
    setProgress(newProgress);
  }, [formData, form.fields]);

  // Auto-guardar
  useEffect(() => {
    if (autoSave && !readOnly && Object.keys(formData).length > 0) {
      const timeoutId = setTimeout(() => {
        setLastSaved(new Date());
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData, autoSave, readOnly]);

  const handleFieldChange = (fieldId: string, value: any) => {
    const newData = { ...formData, [fieldId]: value };
    setFormData(newData);
    
    // Limpiar error si existe
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }

    // Recalcular campos dependientes
    calculateDependentFields(newData);

    // Guardar automáticamente
    if (!readOnly) {
      onSave(form.id, fieldId, value);
    }
  };

  const handleFieldBlur = (fieldId: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldId]: true }));
    validateField(fieldId, formData[fieldId]);
  };

  const validateField = (fieldId: string, value: any): string | null => {
    const field = form.fields.find(f => f.id === fieldId);
    if (!field) return null;

    const errors: string[] = [];

    // Campo requerido
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push('Este campo es requerido');
    }

    // Validaciones específicas por tipo
    if (value !== null && value !== undefined && value !== '') {
      switch (field.type) {
        case 'short_text':
        case 'long_text':
        case 'paragraph':
          if (typeof value === 'string') {
            if (field.validation?.minLength && value.length < field.validation.minLength) {
              errors.push(`Mínimo ${field.validation.minLength} caracteres`);
            }
            if (field.validation?.maxLength && value.length > field.validation.maxLength) {
              errors.push(`Máximo ${field.validation.maxLength} caracteres`);
            }
            if (field.validation?.pattern) {
              const regex = new RegExp(field.validation.pattern);
              if (!regex.test(value)) {
                errors.push('Formato inválido');
              }
            }
          }
          break;

        case 'number':
        case 'slider':
        case 'rating':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors.push('Debe ser un número válido');
          } else {
            if (field.validation?.min !== undefined && numValue < field.validation.min) {
              errors.push(`Valor mínimo: ${field.validation.min}`);
            }
            if (field.validation?.max !== undefined && numValue > field.validation.max) {
              errors.push(`Valor máximo: ${field.validation.max}`);
            }
          }
          break;

        case 'email':
          if (typeof value === 'string') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push('Email inválido');
            }
          }
          break;

        case 'phone':
          if (typeof value === 'string') {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
              errors.push('Teléfono inválido');
            }
          }
          break;

        case 'url':
          if (typeof value === 'string') {
            try {
              new URL(value);
            } catch {
              errors.push('URL inválida');
            }
          }
          break;
      }
    }

    const errorMessage = errors.join(', ');
    if (errorMessage) {
      setErrors(prev => ({ ...prev, [fieldId]: errorMessage }));
      return errorMessage;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
      return null;
    }
  };

  const calculateDependentFields = (data: Record<string, any>) => {
    const calculatedFields = form.fields.filter(field => field.type === 'calculated_field');
    
    calculatedFields.forEach(calcField => {
      if (!calcField.calculation) return;

      let result = 0;

      switch (calcField.calculation.type) {
        case 'sum':
          result = calcField.calculation.fields.reduce((sum, fieldPath) => {
            const value = getFieldValue(data, fieldPath);
            return sum + (Number(value) || 0);
          }, 0);
          break;

        case 'average':
          const values = calcField.calculation.fields.map(fieldPath => Number(getFieldValue(data, fieldPath)) || 0);
          result = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
          break;

        case 'risk_assessment':
          result = calculateRiskScore(data, calcField.calculation);
          break;
      }

      setFormData(prev => ({ ...prev, [calcField.id]: result }));
    });
  };

  const getFieldValue = (data: Record<string, any>, fieldPath: string) => {
    const parts = fieldPath.split('.');
    const fieldId = parts[0];
    const subfield = parts[1];

    const value = data[fieldId];
    if (!value) return null;

    if (subfield && typeof value === 'object') {
      return value[subfield];
    }

    return value;
  };

  const calculateRiskScore = (data: Record<string, any>, calculation: any): number => {
    // Implementar algoritmos de riesgo específicos
    if (calculation.algorithm === 'suicide_risk') {
      let score = 0;
      
      const thoughts = data['suicidal_thoughts'];
      const plan = data['suicide_plan'];
      const means = data['suicide_means'];
      const protectiveFactors = data['protective_factors'] || [];

      const thoughtsScore = {
        'never': 0,
        'rarely': 2,
        'sometimes': 4,
        'often': 6,
        'always': 8
      };
      
      score += thoughtsScore[thoughts as keyof typeof thoughtsScore] || 0;
      
      if (plan === 'yes') score += 2;
      if (means === 'yes') score += 2;
      
      const protectionReduction = Math.min(protectiveFactors.length * 0.5, 3);
      score = Math.max(0, score - protectionReduction);
      
      return Math.round(score);
    }
    
    return 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    form.fields.forEach(field => {
      if (field.required && !['section_header', 'divider', 'calculated_field'].includes(field.type)) {
        const error = validateField(field.id, formData[field.id]);
        if (error) {
          newErrors[field.id] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Por favor, complete todos los campos requeridos correctamente.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(form.id);
    } catch (error) {
      console.error('Error completing form:', error);
      alert('Error al completar el formulario. Inténtelo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkConditionalLogic = (field: FormField): boolean => {
    if (!field.conditionalLogic) return true;

    const condition = field.conditionalLogic.showWhen;
    const fieldValue = formData[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      default:
        return true;
    }
  };

  const getStatusIcon = () => {
    switch (form.status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'draft':
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusLabel = () => {
    switch (form.status) {
      case 'completed':
        return 'Completado';
      case 'in_progress':
        return 'En Progreso';
      case 'draft':
        return 'Borrador';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="bg-white border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--neutral-200)' }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              
              <div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <h1 
                    className="text-xl font-bold"
                    style={{ color: 'var(--dark-green)' }}
                  >
                    {form.title}
                  </h1>
                  <span 
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ 
                      backgroundColor: form.status === 'completed' ? '#dcfce7' : form.status === 'in_progress' ? '#fef3c7' : 'var(--neutral-100)',
                      color: form.status === 'completed' ? '#166534' : form.status === 'in_progress' ? '#d97706' : 'var(--neutral-600)'
                    }}
                  >
                    {getStatusLabel()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mt-1 text-sm" style={{ color: 'var(--neutral-600)' }}>
                  <span>Creado: {new Date(form.createdAt).toLocaleDateString('es-ES')}</span>
                  {form.completedAt && (
                    <span>Completado: {new Date(form.completedAt).toLocaleDateString('es-ES')}</span>
                  )}
                  {lastSaved && !readOnly && (
                    <span>Guardado: {lastSaved.toLocaleTimeString('es-ES')}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Barra de progreso */}
              {!readOnly && form.status !== 'completed' && (
                <div className="flex items-center space-x-2">
                  <span 
                    className="text-sm font-medium"
                    style={{ color: 'var(--neutral-600)' }}
                  >
                    {progress}%
                  </span>
                  <div 
                    className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden"
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: progress === 100 ? 'var(--secondary-500)' : 'var(--primary-500)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              {form.status === 'completed' && (
                <>
                  <button
                    onClick={() => window.print()}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Imprimir"
                  >
                    <PrinterIcon className="h-5 w-5" />
                  </button>
                  
                  <button
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Exportar PDF"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                  </button>
                  
                  <button
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Compartir"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                </>
              )}

              {!readOnly && form.status !== 'completed' && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || progress < 100}
                  className={`
                    px-6 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200
                    ${progress === 100 && !isSubmitting
                      ? 'hover:-translate-y-1 bg-green-600 hover:bg-green-700'
                      : 'opacity-50 cursor-not-allowed bg-gray-400'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Completando...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 inline mr-2" />
                      Completar Formulario
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del formulario */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {template.description && (
          <div 
            className="mb-8 p-4 rounded-lg border-l-4"
            style={{ 
              backgroundColor: 'var(--primary-50)',
              borderLeftColor: 'var(--primary-500)'
            }}
          >
            <p 
              className="text-sm"
              style={{ color: 'var(--primary-700)' }}
            >
              {template.description}
            </p>
          </div>
        )}

        {/* Campos del formulario */}
        <div className="space-y-8">
          {form.fields
            .sort((a, b) => a.order - b.order)
            .map((field) => {
              if (!checkConditionalLogic(field)) {
                return null;
              }

              return (
                <div 
                  key={field.id}
                  className={`
                    bg-white rounded-lg p-6 transition-all duration-200
                    ${touchedFields[field.id] && errors[field.id] 
                      ? 'border-2 border-red-300 shadow-red-100' 
                      : 'border shadow-sm hover:shadow-md'
                    }
                  `}
                  style={{ 
                    borderColor: touchedFields[field.id] && errors[field.id] ? undefined : 'var(--neutral-200)'
                  }}
                >
                  <DynamicFormField
                    field={field}
                    value={formData[field.id]}
                    onChange={handleFieldChange}
                    onBlur={handleFieldBlur}
                    error={touchedFields[field.id] ? errors[field.id] : undefined}
                    disabled={readOnly}
                    showConditional={checkConditionalLogic(field)}
                  />
                </div>
              );
            })}
        </div>

        {/* Resumen (solo en formularios completados) */}
        {form.status === 'completed' && form.summary && (
          <div 
            className="mt-12 bg-white rounded-xl p-6 border"
            style={{ borderColor: 'var(--neutral-200)' }}
          >
            <h3 
              className="text-lg font-bold mb-4"
              style={{ color: 'var(--dark-green)' }}
            >
              Resumen de Resultados
            </h3>
            
            {/* Puntuaciones */}
            {Object.keys(form.summary.scores).length > 0 && (
              <div className="mb-6">
                <h4 
                  className="font-medium mb-3"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  Puntuaciones Calculadas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(form.summary.scores).map(([key, score]) => (
                    <div 
                      key={key}
                      className="p-4 rounded-lg border"
                      style={{ borderColor: 'var(--neutral-200)' }}
                    >
                      <div 
                        className="font-medium text-sm mb-1"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        {score.label}
                      </div>
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-2xl font-bold"
                          style={{ color: 'var(--primary-600)' }}
                        >
                          {score.value}
                        </span>
                        {score.interpretation && (
                          <span 
                            className="text-sm px-2 py-1 rounded-full"
                            style={{ 
                              backgroundColor: 'var(--secondary-100)',
                              color: 'var(--secondary-700)'
                            }}
                          >
                            {score.interpretation}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hallazgos clave */}
            {form.summary.keyFindings.length > 0 && (
              <div className="mb-6">
                <h4 
                  className="font-medium mb-3"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  Hallazgos Clave
                </h4>
                <ul className="space-y-2">
                  {form.summary.keyFindings.map((finding, index) => (
                    <li 
                      key={index}
                      className="flex items-start space-x-2"
                    >
                      <ExclamationTriangleIcon 
                        className="h-4 w-4 mt-0.5 flex-shrink-0"
                        style={{ color: 'var(--accent-500)' }}
                      />
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        {finding}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendaciones */}
            {form.summary.recommendations.length > 0 && (
              <div>
                <h4 
                  className="font-medium mb-3"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  Recomendaciones
                </h4>
                <ul className="space-y-2">
                  {form.summary.recommendations.map((recommendation, index) => (
                    <li 
                      key={index}
                      className="flex items-start space-x-2"
                    >
                      <CheckCircleIcon 
                        className="h-4 w-4 mt-0.5 flex-shrink-0"
                        style={{ color: 'var(--secondary-500)' }}
                      />
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        {recommendation}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Información del formulario */}
        <div 
          className="mt-8 text-center text-xs"
          style={{ color: 'var(--neutral-500)' }}
        >
          Formulario ID: {form.id} | Template: {template.name} | 
          Progreso: {form.summary?.completedFields || 0}/{form.summary?.totalFields || form.fields.length} campos
        </div>
      </div>
    </div>
  );
}