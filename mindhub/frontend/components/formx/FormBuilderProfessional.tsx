'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ListBulletIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  HeartIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  CalculatorIcon,
  CameraIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

// Field Types Definition
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
  medicalCategory?: string;
  duplicatedFrom?: string; // Track field duplication
  customProperties?: Record<string, any>; // Extensible properties
}

interface FormStructure {
  id: string;
  title: string;
  description: string;
  sections: FormSection[];
  settings: FormSettings;
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

interface FormSettings {
  submitMessage: string;
  redirectUrl?: string;
  emailNotifications: boolean;
  patientVisible: boolean;
  requireSignature: boolean;
  privacyNotice: string;
  clinimetrixIntegration?: {
    enabled: boolean;
    scales: string[];
  };
}

// Field Type Templates
const FIELD_TYPES = {
  text: {
    icon: DocumentTextIcon,
    label: 'Texto',
    description: 'Campo de texto simple',
    category: 'basic',
    defaultProps: { placeholder: 'Ingrese su respuesta' }
  },
  textarea: {
    icon: DocumentTextIcon,
    label: 'Texto Largo',
    description: 'Campo de texto multilínea',
    category: 'basic',
    defaultProps: { placeholder: 'Describa detalladamente...' }
  },
  email: {
    icon: EnvelopeIcon,
    label: 'Email',
    description: 'Campo de correo electrónico',
    category: 'basic',
    defaultProps: { placeholder: 'ejemplo@correo.com' }
  },
  phone: {
    icon: PhoneIcon,
    label: 'Teléfono',
    description: 'Campo de número telefónico',
    category: 'basic',
    defaultProps: { placeholder: '+52 555 123 4567' }
  },
  date: {
    icon: CalendarIcon,
    label: 'Fecha',
    description: 'Selector de fecha',
    category: 'basic',
    defaultProps: {}
  },
  select: {
    icon: ListBulletIcon,
    label: 'Selección',
    description: 'Lista desplegable',
    category: 'choice',
    defaultProps: { options: ['Opción 1', 'Opción 2', 'Opción 3'] }
  },
  radio: {
    icon: CheckCircleIcon,
    label: 'Opción Única',
    description: 'Botones de radio',
    category: 'choice',
    defaultProps: { options: ['Sí', 'No'] }
  },
  checkbox: {
    icon: CheckCircleIcon,
    label: 'Múltiple',
    description: 'Casillas de verificación',
    category: 'choice',
    defaultProps: { options: ['Opción A', 'Opción B', 'Opción C'] }
  },
  scale: {
    icon: ListBulletIcon,
    label: 'Escala',
    description: 'Escala numérica (1-10)',
    category: 'medical',
    defaultProps: { min: 1, max: 10 }
  },
  signature: {
    icon: PencilIcon,
    label: 'Firma',
    description: 'Campo de firma digital',
    category: 'medical',
    defaultProps: {}
  },
  // Advanced Medical Fields
  vital_signs: {
    icon: HeartIcon,
    label: 'Signos Vitales',
    description: 'Presión, pulso, temperatura',
    category: 'medical_advanced',
    defaultProps: { 
      customProperties: { 
        measurements: ['presión_arterial', 'pulso', 'temperatura', 'saturación_oxígeno'] 
      } 
    }
  },
  lab_results: {
    icon: BeakerIcon,
    label: 'Resultados de Laboratorio',
    description: 'Valores de exámenes médicos',
    category: 'medical_advanced',
    defaultProps: { 
      customProperties: { 
        testTypes: ['hemograma', 'química_sanguínea', 'perfil_lipídico', 'otro'] 
      } 
    }
  },
  medication_dosage: {
    icon: CalculatorIcon,
    label: 'Dosificación de Medicamento',
    description: 'Dosis, frecuencia y duración',
    category: 'medical_advanced',
    defaultProps: { 
      customProperties: { 
        units: ['mg', 'ml', 'comprimidos', 'gotas'],
        frequencies: ['cada_8_horas', 'cada_12_horas', 'diario', 'según_necesidad']
      } 
    }
  },
  pain_scale: {
    icon: ListBulletIcon,
    label: 'Escala de Dolor',
    description: 'Escala visual analógica 0-10',
    category: 'medical_advanced',
    defaultProps: { 
      min: 0, 
      max: 10,
      customProperties: { 
        visualScale: true,
        painDescriptors: ['sin_dolor', 'leve', 'moderado', 'severo', 'muy_severo'] 
      }
    }
  },
  consent_checkbox: {
    icon: ClipboardDocumentCheckIcon,
    label: 'Consentimiento Informado',
    description: 'Casilla de consentimiento legal',
    category: 'medical_advanced',
    defaultProps: { 
      required: true,
      customProperties: { 
        consentType: 'general',
        legalText: 'Acepto el tratamiento propuesto y he sido informado de los riesgos y beneficios.'
      }
    }
  },
  medical_image_upload: {
    icon: CameraIcon,
    label: 'Subir Imagen Médica',
    description: 'Cargar radiografías, ecografías, etc.',
    category: 'medical_advanced',
    defaultProps: { 
      customProperties: { 
        acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        maxSize: 10, // MB
        imageTypes: ['radiografía', 'ecografía', 'tomografía', 'resonancia', 'otro']
      }
    }
  },
  voice_note: {
    icon: MicrophoneIcon,
    label: 'Nota de Voz',
    description: 'Grabación de audio del paciente',
    category: 'medical_advanced',
    defaultProps: { 
      customProperties: { 
        maxDuration: 300, // seconds
        format: 'audio/mp3'
      }
    }
  }
};

// Medical Templates
const MEDICAL_TEMPLATES = {
  basic_info: {
    title: 'Información Básica',
    fields: [
      { type: 'text', label: 'Nombre completo', required: true },
      { type: 'date', label: 'Fecha de nacimiento', required: true },
      { type: 'phone', label: 'Teléfono', required: true },
      { type: 'email', label: 'Correo electrónico', required: false }
    ]
  },
  medical_history: {
    title: 'Antecedentes Médicos',
    fields: [
      { type: 'radio', label: '¿Tiene alergias conocidas?', options: ['Sí', 'No'], required: true },
      { type: 'textarea', label: 'Especifique alergias (si aplica)', required: false },
      { type: 'checkbox', label: 'Enfermedades crónicas', options: ['Diabetes', 'Hipertensión', 'Cardiopatía', 'Otra'], required: false },
      { type: 'textarea', label: 'Medicamentos actuales', required: false }
    ]
  },
  mental_health: {
    title: 'Salud Mental',
    fields: [
      { type: 'scale', label: 'Nivel de estrés (1-10)', required: true },
      { type: 'radio', label: '¿Ha recibido tratamiento psicológico?', options: ['Sí', 'No'], required: true },
      { type: 'textarea', label: 'Describa el motivo de consulta', required: true },
      { type: 'select', label: 'Frecuencia de síntomas', options: ['Diario', 'Semanal', 'Mensual', 'Ocasional'], required: true }
    ]
  }
};

interface FormBuilderProfessionalProps {
  editingForm?: FormStructure | null;
  onFormSaved?: () => void;
}

export const FormBuilderProfessional: React.FC<FormBuilderProfessionalProps> = ({ 
  editingForm = null,
  onFormSaved
}) => {
  const [form, setForm] = useState<FormStructure>({
    id: `form_${Date.now()}`,
    title: 'Nuevo Formulario Médico',
    description: 'Descripción del formulario',
    sections: [{
      id: `section_${Date.now()}`,
      title: 'Información General',
      fields: [],
      order: 0
    }],
    settings: {
      submitMessage: 'Gracias por completar el formulario. Su información ha sido enviada correctamente.',
      emailNotifications: true,
      patientVisible: true,
      requireSignature: false,
      privacyNotice: 'Sus datos serán tratados conforme a la Ley de Protección de Datos Personales...'
    }
  });

  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'templates' | 'settings'>('fields');

  // Load editing form if provided
  React.useEffect(() => {
    if (editingForm) {
      setForm(editingForm);
    }
  }, [editingForm]);

  // Generate unique ID
  const generateId = useCallback(() => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Add field to form
  const addField = useCallback((fieldType: string, sectionId?: string) => {
    const targetSectionId = sectionId || form.sections[0].id;
    const fieldTemplate = FIELD_TYPES[fieldType as keyof typeof FIELD_TYPES];
    
    const newField: FormField = {
      id: generateId(),
      type: fieldType,
      label: `Nueva ${fieldTemplate.label}`,
      required: false,
      ...fieldTemplate.defaultProps
    };

    setForm(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === targetSectionId 
          ? { ...section, fields: [...section.fields, newField] }
          : section
      )
    }));

    toast.success(`Campo ${fieldTemplate.label} agregado`);
  }, [form.sections, generateId]);

  // Duplicate field
  const duplicateField = useCallback((fieldId: string) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        const fieldIndex = section.fields.findIndex(field => field.id === fieldId);
        if (fieldIndex !== -1) {
          const originalField = section.fields[fieldIndex];
          const duplicatedField: FormField = {
            ...originalField,
            id: generateId(),
            label: `${originalField.label} (Copia)`,
            duplicatedFrom: originalField.id
          };
          
          const newFields = [...section.fields];
          newFields.splice(fieldIndex + 1, 0, duplicatedField);
          
          return { ...section, fields: newFields };
        }
        return section;
      })
    }));
    
    toast.success('Campo duplicado exitosamente');
  }, [generateId]);

  // Remove field
  const removeField = useCallback((fieldId: string) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        fields: section.fields.filter(field => field.id !== fieldId)
      }))
    }));
    
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
    
    toast.success('Campo eliminado');
  }, [selectedField]);

  // Handle drag and drop
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Handle reordering within the same section
    if (source.droppableId === destination.droppableId) {
      const sectionId = source.droppableId;
      
      setForm(prev => ({
        ...prev,
        sections: prev.sections.map(section => {
          if (section.id === sectionId) {
            const newFields = Array.from(section.fields);
            const [removed] = newFields.splice(source.index, 1);
            newFields.splice(destination.index, 0, removed);
            return { ...section, fields: newFields };
          }
          return section;
        })
      }));
    }
  }, []);

  // Add template section
  const addTemplate = useCallback((templateKey: string) => {
    const template = MEDICAL_TEMPLATES[templateKey as keyof typeof MEDICAL_TEMPLATES];
    
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: template.title,
      fields: template.fields.map(fieldData => ({
        id: generateId(),
        ...fieldData,
        options: (fieldData as any).options || []
      })),
      order: form.sections.length
    };

    setForm(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));

    toast.success(`Template ${template.title} agregado`);
  }, [form.sections, generateId]);

  // Save form
  const saveForm = useCallback(async () => {
    try {
      const isEditing = editingForm && editingForm.id;
      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms/${editingForm.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Prepare form data for API
      const formData = {
        title: form.title,
        description: form.description,
        sections: form.sections,
        settings: form.settings
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedForm = await response.json();
        toast.success(isEditing ? 'Formulario actualizado exitosamente' : 'Formulario guardado exitosamente');
        console.log('Form saved:', savedForm);
        
        if (onFormSaved) {
          onFormSaved();
        }
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Error al guardar el formulario');
    }
  }, [form, editingForm, onFormSaved]);

  // Field editor component
  const FieldEditor = useMemo(() => {
    if (!selectedField) return null;

    return (
      <div className="bg-white border-l border-gray-200 w-80 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-green">Configurar Campo</h3>
          <button
            onClick={() => setSelectedField(null)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiqueta
            </label>
            <input
              type="text"
              value={selectedField.label}
              onChange={(e) => setSelectedField({ ...selectedField, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {selectedField.type !== 'signature' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={selectedField.placeholder || ''}
                onChange={(e) => setSelectedField({ ...selectedField, placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedField.required}
                onChange={(e) => setSelectedField({ ...selectedField, required: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Campo requerido</span>
            </label>
          </div>

          {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opciones (una por línea)
              </label>
              <textarea
                value={selectedField.options?.join('\n') || ''}
                onChange={(e) => setSelectedField({ 
                  ...selectedField, 
                  options: e.target.value.split('\n').filter(o => o.trim()) 
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción/Ayuda
            </label>
            <textarea
              value={selectedField.description || ''}
              onChange={(e) => setSelectedField({ ...selectedField, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Advanced Medical Field Properties */}
          {selectedField.type === 'vital_signs' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mediciones a incluir
              </label>
              {['presión_arterial', 'pulso', 'temperatura', 'saturación_oxígeno'].map(measurement => (
                <label key={measurement} className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={selectedField.customProperties?.measurements?.includes(measurement) || false}
                    onChange={(e) => {
                      const currentMeasurements = selectedField.customProperties?.measurements || [];
                      const newMeasurements = e.target.checked
                        ? [...currentMeasurements, measurement]
                        : currentMeasurements.filter((m: string) => m !== measurement);
                      
                      setSelectedField({
                        ...selectedField,
                        customProperties: {
                          ...selectedField.customProperties,
                          measurements: newMeasurements
                        }
                      });
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">{measurement.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          )}

          {selectedField.type === 'pain_scale' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor mínimo
                </label>
                <input
                  type="number"
                  value={(selectedField as any).min || 0}
                  onChange={(e) => setSelectedField({ ...selectedField, min: parseInt(e.target.value) } as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor máximo
                </label>
                <input
                  type="number"
                  value={(selectedField as any).max || 10}
                  onChange={(e) => setSelectedField({ ...selectedField, max: parseInt(e.target.value) } as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {selectedField.type === 'consent_checkbox' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto del consentimiento
              </label>
              <textarea
                value={selectedField.customProperties?.legalText || ''}
                onChange={(e) => setSelectedField({
                  ...selectedField,
                  customProperties: {
                    ...selectedField.customProperties,
                    legalText: e.target.value
                  }
                })}
                rows={4}
                placeholder="Texto legal del consentimiento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {selectedField.type === 'medical_image_upload' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipos de imagen permitidos
                </label>
                {['radiografía', 'ecografía', 'tomografía', 'resonancia', 'otro'].map(imageType => (
                  <label key={imageType} className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      checked={selectedField.customProperties?.imageTypes?.includes(imageType) || false}
                      onChange={(e) => {
                        const currentTypes = selectedField.customProperties?.imageTypes || [];
                        const newTypes = e.target.checked
                          ? [...currentTypes, imageType]
                          : currentTypes.filter((t: string) => t !== imageType);
                        
                        setSelectedField({
                          ...selectedField,
                          customProperties: {
                            ...selectedField.customProperties,
                            imageTypes: newTypes
                          }
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 capitalize">{imageType}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamaño máximo (MB)
                </label>
                <input
                  type="number"
                  value={selectedField.customProperties?.maxSize || 10}
                  onChange={(e) => setSelectedField({
                    ...selectedField,
                    customProperties: {
                      ...selectedField.customProperties,
                      maxSize: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex space-x-2">
          <Button
            onClick={() => {
              // Update field in form
              setForm(prev => ({
                ...prev,
                sections: prev.sections.map(section => ({
                  ...section,
                  fields: section.fields.map(field => 
                    field.id === selectedField.id ? selectedField : field
                  )
                }))
              }));
              setSelectedField(null);
              toast.success('Campo actualizado');
            }}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
          >
            Aplicar Cambios
          </Button>
          <Button
            onClick={() => removeField(selectedField.id)}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }, [selectedField, removeField]);

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-dark-green">Vista Previa - {form.title}</h1>
            <Button
              onClick={() => setPreviewMode(false)}
              variant="outline"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cerrar Vista Previa
            </Button>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-dark-green mb-2">{form.title}</h2>
              <p className="text-gray-600">{form.description}</p>
            </div>

            {form.sections.map((section) => (
              <div key={section.id} className="mb-8">
                <h3 className="text-xl font-semibold text-dark-green mb-4 border-b border-gray-200 pb-2">
                  {section.title}
                </h3>
                
                <div className="space-y-6">
                  {section.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.description && (
                        <p className="text-xs text-gray-500">{field.description}</p>
                      )}

                      {/* Render field based on type */}
                      {field.type === 'text' && (
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          disabled
                        />
                      )}
                      
                      {field.type === 'textarea' && (
                        <textarea
                          placeholder={field.placeholder}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          disabled
                        />
                      )}
                      
                      {field.type === 'select' && (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          disabled
                        >
                          <option>Seleccione una opción</option>
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
                                className="mr-2"
                                disabled
                              />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {field.type === 'signature' && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                          <PencilIcon className="h-8 w-8 mx-auto mb-2" />
                          <p>Área de firma digital</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3" disabled>
                Enviar Formulario (Vista Previa)
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Tools */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-dark-green">Constructor de Formularios</h2>
          <p className="text-sm text-gray-600">Arrastra campos para crear tu formulario</p>
        </div>

        <div className="p-4">
          <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'fields' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Campos
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'templates' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'settings' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Configuración
            </button>
          </div>

          {activeTab === 'fields' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Campos Básicos</h3>
                <div className="space-y-2">
                  {Object.entries(FIELD_TYPES)
                    .filter(([, field]) => field.category === 'basic')
                    .map(([key, field]) => {
                      const IconComponent = field.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => addField(key)}
                          className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        >
                          <IconComponent className="h-5 w-5 text-primary-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{field.label}</div>
                            <div className="text-xs text-gray-500">{field.description}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Campos de Selección</h3>
                <div className="space-y-2">
                  {Object.entries(FIELD_TYPES)
                    .filter(([, field]) => field.category === 'choice')
                    .map(([key, field]) => {
                      const IconComponent = field.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => addField(key)}
                          className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        >
                          <IconComponent className="h-5 w-5 text-primary-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{field.label}</div>
                            <div className="text-xs text-gray-500">{field.description}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Campos Médicos Básicos</h3>
                <div className="space-y-2">
                  {Object.entries(FIELD_TYPES)
                    .filter(([, field]) => field.category === 'medical')
                    .map(([key, field]) => {
                      const IconComponent = field.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => addField(key)}
                          className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                        >
                          <IconComponent className="h-5 w-5 text-emerald-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{field.label}</div>
                            <div className="text-xs text-gray-500">{field.description}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Campos Médicos Avanzados</h3>
                <div className="space-y-2">
                  {Object.entries(FIELD_TYPES)
                    .filter(([, field]) => field.category === 'medical_advanced')
                    .map(([key, field]) => {
                      const IconComponent = field.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => addField(key)}
                          className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                        >
                          <IconComponent className="h-5 w-5 text-purple-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{field.label}</div>
                            <div className="text-xs text-gray-500">{field.description}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Templates Médicos</h3>
              {Object.entries(MEDICAL_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => addTemplate(key)}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <ClipboardDocumentIcon className="h-5 w-5 text-emerald-500 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{template.title}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {template.fields.length} campos incluidos
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Formulario
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.settings.emailNotifications}
                    onChange={(e) => setForm({
                      ...form,
                      settings: { ...form.settings, emailNotifications: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Notificaciones por email</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.settings.requireSignature}
                    onChange={(e) => setForm({
                      ...form,
                      settings: { ...form.settings, requireSignature: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Requerir firma digital</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.settings.patientVisible}
                    onChange={(e) => setForm({
                      ...form,
                      settings: { ...form.settings, patientVisible: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Visible para pacientes</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-dark-green">{form.title}</h1>
              <p className="text-sm text-gray-600">
                {form.sections.reduce((acc, section) => acc + section.fields.length, 0)} campos en {form.sections.length} sección(es)
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setPreviewMode(true)}
                variant="outline"
                size="sm"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
              
              <Button
                onClick={saveForm}
                className="bg-primary-500 hover:bg-primary-600 text-white"
                size="sm"
              >
                Guardar Formulario
              </Button>
            </div>
          </div>
        </div>

        {/* Form Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              {form.sections.map((section, sectionIndex) => (
                <div key={section.id} className="mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-dark-green">{section.title}</h3>
                          {section.description && (
                            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {section.fields.length} campo(s)
                        </div>
                      </div>
                    </div>

                    <Droppable droppableId={section.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-6 min-h-[200px] ${
                            snapshot.isDraggingOver ? 'bg-primary-50' : 'bg-white'
                          }`}
                        >
                          {section.fields.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-sm">Arrastra campos aquí para comenzar</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {section.fields.map((field, index) => (
                                <Draggable key={field.id} draggableId={field.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors ${
                                        snapshot.isDragging ? 'shadow-lg' : ''
                                      } ${
                                        selectedField?.id === field.id ? 'border-primary-500 bg-primary-50' : 'bg-white'
                                      }`}
                                      onClick={() => setSelectedField(field)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center mb-2">
                                            <span className="text-sm font-medium text-gray-900">
                                              {field.label}
                                              {field.required && <span className="text-red-500 ml-1">*</span>}
                                            </span>
                                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                              {FIELD_TYPES[field.type as keyof typeof FIELD_TYPES]?.label || field.type}
                                            </span>
                                            {field.duplicatedFrom && (
                                              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded flex items-center">
                                                <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
                                                Duplicado
                                              </span>
                                            )}
                                          </div>
                                          {field.description && (
                                            <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                                          )}
                                          {field.placeholder && (
                                            <p className="text-xs text-gray-400 italic">Placeholder: {field.placeholder}</p>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              duplicateField(field.id);
                                            }}
                                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                                            title="Duplicar campo"
                                          >
                                            <DocumentDuplicateIcon className="h-4 w-4 text-blue-500" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedField(field);
                                            }}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            title="Configurar campo"
                                          >
                                            <Cog6ToothIcon className="h-4 w-4 text-gray-500" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeField(field.id);
                                            }}
                                            className="p-1 hover:bg-red-100 rounded transition-colors"
                                            title="Eliminar campo"
                                          >
                                            <TrashIcon className="h-4 w-4 text-red-500" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </DragDropContext>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Field Editor */}
      {selectedField && FieldEditor}
    </div>
  );
};