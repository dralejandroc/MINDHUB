'use client';

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Types for FormX - Legal and Administrative Forms
export interface FormXField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'phone' | 'email' | 'number' | 
        'signature' | 'section_header' | 'info_text' | 'conditional_text' | 'legal_checkbox' | 
        'medical_history' | 'emergency_contact' | 'insurance_info' | 'satisfaction_rating';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  conditionalLogic?: {
    dependsOn: string;
    condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
    showFields?: string[];
    hideFields?: string[];
  };
  description?: string;
  defaultValue?: string;
  width?: 'full' | 'half' | 'third';
  legalConfig?: {
    requiresConsent: boolean;
    consentText?: string;
    mandatoryForTreatment?: boolean;
  };
  medicalConfig?: {
    category: 'personal' | 'family' | 'social' | 'psychiatric' | 'medical';
    relevantConditions?: string[];
  };
}

export interface FormXPage {
  id: string;
  title: string;
  description?: string;
  fields: FormXField[];
  category?: 'consent' | 'privacy_notice' | 'clinical_agreement' | 'intake' | 'satisfaction' | 'follow_up';
}

export interface FormXDefinition {
  id: string;
  title: string;
  description: string;
  pages: FormXPage[];
  settings: {
    allowSaveProgress: boolean;
    showProgressBar: boolean;
    submitButtonText: string;
    thankYouMessage: string;
    collectEmail: boolean;
    requireSignature: boolean;
    hipaaCompliant: boolean;
    encryptData: boolean;
    auditLog: boolean;
    legallyBinding: boolean;
    requiresWitness: boolean;
  };
  design: {
    global: {
      backgroundColor: string;
      fontFamily: string;
      primaryColor: string;
    };
    form: {
      backgroundColor: string;
      borderRadius: string;
      padding: string;
      shadow: string;
    };
    formGroup: {
      spacing: string;
      labelPosition: 'top' | 'left' | 'floating';
    };
    formControl: {
      borderColor: string;
      focusColor: string;
      borderRadius: string;
      padding: string;
    };
    button: {
      backgroundColor: string;
      textColor: string;
      borderRadius: string;
      size: 'sm' | 'md' | 'lg';
    };
  };
}

interface FormBuilderAdvancedProps {
  onSave: (form: FormXDefinition) => void;
  initialForm?: FormXDefinition;
}

export const FormBuilderAdvanced: React.FC<FormBuilderAdvancedProps> = ({
  onSave,
  initialForm
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'settings' | 'code'>('fields');
  const [designPanelSection, setDesignPanelSection] = useState<string>('global');
  const [form, setForm] = useState<FormXDefinition>(initialForm || {
    id: '',
    title: 'Nuevo Consentimiento Informado',
    description: 'Formulario para consentimientos, avisos de privacidad y acuerdos clínicos',
    pages: [{
      id: 'page_1',
      title: 'Información del Paciente',
      description: 'Datos de identificación y contacto',
      category: 'intake',
      fields: []
    }],
    settings: {
      allowSaveProgress: true,
      showProgressBar: true,
      submitButtonText: 'Firmar y Enviar',
      thankYouMessage: 'Gracias por completar el formulario. Su consentimiento ha sido registrado correctamente.',
      collectEmail: true,
      requireSignature: true,
      hipaaCompliant: true,
      encryptData: true,
      auditLog: true,
      legallyBinding: true,
      requiresWitness: false
    },
    design: {
      global: {
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        primaryColor: '#0891b2'
      },
      form: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      },
      formGroup: {
        spacing: '20px',
        labelPosition: 'top'
      },
      formControl: {
        borderColor: '#d1d5db',
        focusColor: '#0891b2',
        borderRadius: '8px',
        padding: '12px'
      },
      button: {
        backgroundColor: '#0891b2',
        textColor: '#ffffff',
        borderRadius: '8px',
        size: 'md'
      }
    }
  });

  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // FormX-specific field templates for legal and administrative forms
  const formXFieldTemplates: Record<string, Partial<FormXField>> = {
    // Basic fields
    text: {
      type: 'text',
      label: 'Campo de Texto',
      placeholder: 'Escriba aquí...',
      required: false,
      width: 'full'
    },
    textarea: {
      type: 'textarea',
      label: 'Área de Texto',
      placeholder: 'Describa con detalle...',
      required: false,
      width: 'full'
    },
    select: {
      type: 'select',
      label: 'Lista Desplegable',
      required: false,
      options: ['Seleccione una opción', 'Opción 1', 'Opción 2'],
      width: 'full'
    },
    radio: {
      type: 'radio',
      label: 'Selección Única',
      required: false,
      options: ['Sí', 'No', 'No aplica'],
      width: 'full'
    },
    checkbox: {
      type: 'checkbox',
      label: 'Selección Múltiple',
      required: false,
      options: ['Opción 1', 'Opción 2', 'Opción 3'],
      width: 'full'
    },
    date: {
      type: 'date',
      label: 'Fecha',
      required: false,
      width: 'half'
    },
    phone: {
      type: 'phone',
      label: 'Teléfono',
      placeholder: '555-123-4567',
      required: false,
      width: 'half'
    },
    email: {
      type: 'email',
      label: 'Correo Electrónico',
      placeholder: 'ejemplo@correo.com',
      required: false,
      width: 'half'
    },
    number: {
      type: 'number',
      label: 'Número',
      required: false,
      width: 'half'
    },
    signature: {
      type: 'signature',
      label: 'Firma Digital',
      required: true,
      width: 'full'
    },
    section_header: {
      type: 'section_header',
      label: 'Encabezado de Sección',
      required: false,
      width: 'full'
    },
    info_text: {
      type: 'info_text',
      label: 'Texto Informativo',
      description: 'Información importante para el paciente',
      required: false,
      width: 'full'
    },
    // FormX-specific fields
    legal_checkbox: {
      type: 'legal_checkbox',
      label: 'Aceptación Legal',
      required: true,
      width: 'full',
      legalConfig: {
        requiresConsent: true,
        consentText: 'He leído, entendido y acepto los términos y condiciones.',
        mandatoryForTreatment: true
      }
    },
    medical_history: {
      type: 'medical_history',
      label: 'Antecedentes Médicos',
      required: false,
      width: 'full',
      medicalConfig: {
        category: 'medical',
        relevantConditions: ['diabetes', 'hipertensión', 'alergias']
      }
    },
    emergency_contact: {
      type: 'emergency_contact',
      label: 'Contacto de Emergencia',
      required: true,
      width: 'full'
    },
    insurance_info: {
      type: 'insurance_info',
      label: 'Información del Seguro',
      required: false,
      width: 'full'
    },
    satisfaction_rating: {
      type: 'satisfaction_rating',
      label: 'Calificación de Satisfacción',
      required: false,
      width: 'full',
      options: ['Muy insatisfecho', 'Insatisfecho', 'Neutral', 'Satisfecho', 'Muy satisfecho']
    },
    conditional_text: {
      type: 'conditional_text',
      label: 'Campo Condicional',
      placeholder: 'Solo se muestra si se cumple la condición...',
      required: false,
      width: 'full',
      conditionalLogic: {
        dependsOn: '',
        condition: 'equals',
        value: '',
        showFields: [],
        hideFields: []
      }
    }
  };

  const fieldCategories = [
    {
      name: 'Campos Básicos',
      fields: ['text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'phone', 'email', 'number']
    },
    {
      name: 'Elementos Legales',
      fields: ['signature', 'legal_checkbox', 'section_header', 'info_text']
    },
    {
      name: 'Información Médica',
      fields: ['medical_history', 'emergency_contact', 'insurance_info']
    },
    {
      name: 'Seguimiento',
      fields: ['satisfaction_rating']
    },
    {
      name: 'Lógica Condicional',
      fields: ['conditional_text']
    }
  ];

  const designPanelSections = [
    { id: 'global', name: 'Global', icon: '🌐' },
    { id: 'form', name: 'Form', icon: '📋' },
    { id: 'formGroup', name: 'Form Group', icon: '📦' },
    { id: 'formControl', name: 'Form Control', icon: '🎛️' },
    { id: 'button', name: 'Button', icon: '🔘' },
    { id: 'label', name: 'Label', icon: '🏷️' },
    { id: 'heading', name: 'Heading', icon: '📰' },
    { id: 'paragraph', name: 'Paragraph', icon: '📄' }
  ];

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Adding new field from palette
    if (source.droppableId === 'field-palette' && destination.droppableId === 'form-canvas') {
      const fieldType = draggableId.replace('palette-', '');
      const template = formXFieldTemplates[fieldType];
      
      if (!template) return;

      const newField: FormXField = {
        id: `field_${Date.now()}`,
        ...template,
        label: template.label || 'Nuevo campo'
      } as FormXField;

      const updatedPages = [...form.pages];
      const targetPage = updatedPages[selectedPageIndex];
      
      // Insert at specific position
      targetPage.fields.splice(destination.index, 0, newField);
      
      setForm(prev => ({
        ...prev,
        pages: updatedPages
      }));

      setSelectedFieldId(newField.id);
      return;
    }

    // Reordering existing fields
    if (source.droppableId === 'form-canvas' && destination.droppableId === 'form-canvas') {
      const updatedPages = [...form.pages];
      const targetPage = updatedPages[selectedPageIndex];
      const fields = Array.from(targetPage.fields);
      
      const [reorderedField] = fields.splice(source.index, 1);
      fields.splice(destination.index, 0, reorderedField);
      
      targetPage.fields = fields;
      
      setForm(prev => ({
        ...prev,
        pages: updatedPages
      }));
    }
  }, [form.pages, selectedPageIndex, formXFieldTemplates]);

  const updateField = useCallback((fieldId: string, updates: Partial<FormXField>) => {
    const updatedPages = [...form.pages];
    const fieldIndex = updatedPages[selectedPageIndex].fields.findIndex(f => f.id === fieldId);
    
    if (fieldIndex !== -1) {
      updatedPages[selectedPageIndex].fields[fieldIndex] = {
        ...updatedPages[selectedPageIndex].fields[fieldIndex],
        ...updates
      };
      
      setForm(prev => ({
        ...prev,
        pages: updatedPages
      }));
    }
  }, [form.pages, selectedPageIndex]);

  const deleteField = useCallback((fieldId: string) => {
    const updatedPages = [...form.pages];
    updatedPages[selectedPageIndex].fields = updatedPages[selectedPageIndex].fields.filter(f => f.id !== fieldId);
    
    setForm(prev => ({
      ...prev,
      pages: updatedPages
    }));

    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [form.pages, selectedPageIndex, selectedFieldId]);

  const currentPage = form.pages[selectedPageIndex];
  const selectedField = selectedFieldId ? currentPage?.fields.find(f => f.id === selectedFieldId) : null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-formx-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{form.title}</h1>
                  <p className="text-sm text-gray-600">Constructor de Formularios de Salud Mental</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Tab Navigation */}
                <div className="flex rounded-lg bg-gray-100 p-1">
                  <button
                    onClick={() => setActiveTab('fields')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'fields' 
                        ? 'bg-white text-formx-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Fields
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'settings' 
                        ? 'bg-white text-formx-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'code' 
                        ? 'bg-white text-formx-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Code
                  </button>
                </div>

                <button
                  onClick={() => onSave(form)}
                  className="px-4 py-2 bg-formx-600 text-white rounded-lg hover:bg-formx-700 font-medium transition-colors"
                >
                  💾 Save Form
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - 3 Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Fields Palette */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Campos del Formulario</h3>
              <p className="text-sm text-gray-600 mt-1">Arrastra los elementos al canvas</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <Droppable droppableId="field-palette" isDropDisabled={true}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-6">
                    {fieldCategories.map((category) => (
                      <div key={category.name}>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                          {category.name}
                        </h4>
                        <div className="space-y-2">
                          {category.fields.map((fieldType, index) => {
                            const template = formXFieldTemplates[fieldType];
                            if (!template) return null;
                            
                            return (
                              <Draggable
                                key={fieldType}
                                draggableId={`palette-${fieldType}`}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`w-full text-left px-3 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing ${
                                      snapshot.isDragging ? 'shadow-lg ring-2 ring-formx-400' : ''
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">
                                        {fieldType === 'signature' ? '✍️' :
                                         fieldType === 'legal_checkbox' ? '⚖️' :
                                         fieldType === 'medical_history' ? '🏥' :
                                         fieldType === 'emergency_contact' ? '🚨' :
                                         fieldType === 'insurance_info' ? '🛡️' :
                                         fieldType === 'satisfaction_rating' ? '⭐' :
                                         fieldType === 'section_header' ? '📋' :
                                         fieldType === 'info_text' ? 'ℹ️' :
                                         fieldType === 'conditional_text' ? '🔀' : '📝'}
                                      </span>
                                      <span className="font-medium">{template.label}</span>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* Center Panel - Form Canvas */}
          <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
            {/* Page Tabs */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {form.pages.map((page, index) => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPageIndex(index)}
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                        selectedPageIndex === index 
                          ? 'bg-formx-100 text-formx-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const newPage: FormXPage = {
                      id: `page_${Date.now()}`,
                      title: `Página ${form.pages.length + 1}`,
                      description: '',
                      fields: []
                    };
                    setForm(prev => ({
                      ...prev,
                      pages: [...prev.pages, newPage]
                    }));
                    setSelectedPageIndex(form.pages.length);
                  }}
                  className="px-3 py-1 text-sm text-formx-600 hover:text-formx-700 font-medium"
                >
                  + Agregar Página
                </button>
              </div>
            </div>

            {/* Form Canvas */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
                  style={{
                    backgroundColor: form.design.form.backgroundColor,
                    borderRadius: form.design.form.borderRadius,
                    padding: form.design.form.padding,
                    boxShadow: form.design.form.shadow
                  }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentPage?.title}</h2>
                    {currentPage?.description && (
                      <p className="text-gray-600">{currentPage.description}</p>
                    )}
                  </div>

                  <Droppable droppableId="form-canvas">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-4 min-h-64 ${
                          snapshot.isDraggingOver ? 'bg-formx-50 border-2 border-dashed border-formx-300 rounded-lg p-4' : ''
                        }`}
                      >
                        {currentPage?.fields.length === 0 ? (
                          <div className="text-center py-16">
                            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Canvas vacío
                            </h3>
                            <p className="text-gray-500 mb-4">
                              Arrastra elementos desde el panel izquierdo para construir tu formulario
                            </p>
                            <div className="text-sm text-gray-400">
                              💡 Comienza con campos básicos como "Texto" o "Selección única"
                            </div>
                          </div>
                        ) : (
                          currentPage?.fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  onClick={() => setSelectedFieldId(field.id)}
                                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                    selectedFieldId === field.id 
                                      ? 'border-formx-300 bg-formx-50 ring-2 ring-formx-200' 
                                      : 'border-gray-200 hover:border-gray-300 bg-white'
                                  } ${
                                    snapshot.isDragging ? 'shadow-lg' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      {/* Field Label */}
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                      </label>
                                      
                                      {/* Field Preview */}
                                      <FieldPreview field={field} />
                                    </div>

                                    {/* Field Controls */}
                                    <div className="ml-4 flex items-center space-x-2">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                      >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 6 10">
                                          <circle cx="1" cy="1" r="1"/>
                                          <circle cx="1" cy="5" r="1"/>
                                          <circle cx="1" cy="9" r="1"/>
                                          <circle cx="5" cy="1" r="1"/>
                                          <circle cx="5" cy="5" r="1"/>
                                          <circle cx="5" cy="9" r="1"/>
                                        </svg>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteField(field.id);
                                        }}
                                        className="p-1 text-red-400 hover:text-red-600"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Design Panel */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Design</h3>
              <p className="text-sm text-gray-600 mt-1">Personaliza la apariencia</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {/* Design Section Navigation */}
              <div className="border-b border-gray-200">
                {designPanelSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setDesignPanelSection(section.id)}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between ${
                      designPanelSection === section.id
                        ? 'bg-formx-50 text-formx-700 border-r-2 border-formx-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span>{section.icon}</span>
                      <span>{section.name}</span>
                    </div>
                    {designPanelSection === section.id ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>

              {/* Design Controls */}
              <div className="p-4">
                <DesignPanel
                  section={designPanelSection}
                  form={form}
                  selectedField={selectedField || null}
                  onUpdateForm={setForm}
                  onUpdateField={updateField}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

// Field Preview Component
const FieldPreview: React.FC<{ field: FormXField }> = ({ field }) => {
  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          placeholder={field.placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
          disabled
        />
      );
    
    case 'textarea':
      return (
        <textarea
          placeholder={field.placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
          disabled
        />
      );
    
    case 'select':
      return (
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" disabled>
          {field.options?.map((option, i) => (
            <option key={i}>{option}</option>
          ))}
        </select>
      );
    
    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((option, i) => (
            <label key={i} className="flex items-center">
              <input type="radio" name={field.id} className="mr-2" disabled />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      );
    
    case 'checkbox':
      return (
        <div className="space-y-2">
          {field.options?.map((option, i) => (
            <label key={i} className="flex items-center">
              <input type="checkbox" className="mr-2" disabled />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      );
    
    case 'legal_checkbox':
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <label className="flex items-start space-x-3">
            <input type="checkbox" className="mt-1" disabled />
            <div>
              <span className="font-medium text-yellow-900">Aceptación Legal</span>
              <p className="text-sm text-yellow-700 mt-1">
                {field.legalConfig?.consentText || 'He leído, entendido y acepto los términos y condiciones.'}
              </p>
              {field.legalConfig?.mandatoryForTreatment && (
                <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  Obligatorio para el tratamiento
                </span>
              )}
            </div>
          </label>
        </div>
      );
    
    case 'medical_history':
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">🏥</span>
            <span className="font-medium text-blue-900">Antecedentes Médicos</span>
          </div>
          <p className="text-sm text-blue-700">
            Información sobre historial médico personal y familiar
          </p>
          {field.medicalConfig?.relevantConditions && (
            <div className="mt-2 flex flex-wrap gap-1">
              {field.medicalConfig.relevantConditions.map((condition, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {condition}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    
    case 'emergency_contact':
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">🚨</span>
            <span className="font-medium text-red-900">Contacto de Emergencia</span>
          </div>
          <div className="space-y-2 text-sm">
            <input type="text" placeholder="Nombre completo" className="w-full px-2 py-1 border rounded" disabled />
            <input type="tel" placeholder="Teléfono" className="w-full px-2 py-1 border rounded" disabled />
            <input type="text" placeholder="Relación" className="w-full px-2 py-1 border rounded" disabled />
          </div>
        </div>
      );
    
    case 'insurance_info':
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">🛡️</span>
            <span className="font-medium text-green-900">Información del Seguro</span>
          </div>
          <div className="space-y-2 text-sm">
            <input type="text" placeholder="Compañía aseguradora" className="w-full px-2 py-1 border rounded" disabled />
            <input type="text" placeholder="Número de póliza" className="w-full px-2 py-1 border rounded" disabled />
            <input type="text" placeholder="Grupo" className="w-full px-2 py-1 border rounded" disabled />
          </div>
        </div>
      );
    
    case 'satisfaction_rating':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Muy insatisfecho</span>
            <span>Muy satisfecho</span>
          </div>
          <div className="flex items-center space-x-2">
            {['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'].map((stars, i) => (
              <label key={i} className="flex flex-col items-center">
                <input type="radio" name={field.id} className="mb-1" disabled />
                <span className="text-xs">{stars}</span>
              </label>
            ))}
          </div>
        </div>
      );
    
    case 'section_header':
      return (
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          {field.label}
        </h3>
      );
    
    case 'info_text':
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">{field.description}</p>
        </div>
      );
    
    case 'conditional_text':
      return (
        <div className="relative">
          <input
            type="text"
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            disabled
          />
          <div className="absolute top-0 right-0 -mt-2 -mr-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              🔀 Condicional
            </span>
          </div>
        </div>
      );
    
    case 'signature':
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <span className="text-gray-500 text-sm">✍️ Área de firma digital</span>
        </div>
      );
    
    default:
      return (
        <div className="text-gray-500 text-sm">
          Vista previa no disponible para este tipo de campo
        </div>
      );
  }
};

// Design Panel Component
const DesignPanel: React.FC<{
  section: string;
  form: FormXDefinition;
  selectedField: FormXField | null;
  onUpdateForm: (form: FormXDefinition) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormXField>) => void;
}> = ({ section, form, selectedField, onUpdateForm, onUpdateField }) => {
  if (selectedField) {
    return <FieldProperties field={selectedField} onUpdate={onUpdateField} />;
  }

  switch (section) {
    case 'global':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Color
            </label>
            <input
              type="color"
              value={form.design.global.backgroundColor}
              onChange={(e) => onUpdateForm({
                ...form,
                design: {
                  ...form.design,
                  global: {
                    ...form.design.global,
                    backgroundColor: e.target.value
                  }
                }
              })}
              className="w-full h-10 rounded border border-gray-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <input
              type="color"
              value={form.design.global.primaryColor}
              onChange={(e) => onUpdateForm({
                ...form,
                design: {
                  ...form.design,
                  global: {
                    ...form.design.global,
                    primaryColor: e.target.value
                  }
                }
              })}
              className="w-full h-10 rounded border border-gray-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Family
            </label>
            <select
              value={form.design.global.fontFamily}
              onChange={(e) => onUpdateForm({
                ...form,
                design: {
                  ...form.design,
                  global: {
                    ...form.design.global,
                    fontFamily: e.target.value
                  }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Inter, system-ui, sans-serif">Inter</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Times New Roman, serif">Times New Roman</option>
            </select>
          </div>
        </div>
      );
    
    case 'form':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Color
            </label>
            <input
              type="color"
              value={form.design.form.backgroundColor}
              onChange={(e) => onUpdateForm({
                ...form,
                design: {
                  ...form.design,
                  form: {
                    ...form.design.form,
                    backgroundColor: e.target.value
                  }
                }
              })}
              className="w-full h-10 rounded border border-gray-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Border Radius
            </label>
            <select
              value={form.design.form.borderRadius}
              onChange={(e) => onUpdateForm({
                ...form,
                design: {
                  ...form.design,
                  form: {
                    ...form.design.form,
                    borderRadius: e.target.value
                  }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="0px">Sin bordes redondeados</option>
              <option value="4px">Pequeño</option>
              <option value="8px">Mediano</option>
              <option value="12px">Grande</option>
              <option value="16px">Extra grande</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Padding
            </label>
            <select
              value={form.design.form.padding}
              onChange={(e) => onUpdateForm({
                ...form,
                design: {
                  ...form.design,
                  form: {
                    ...form.design.form,
                    padding: e.target.value
                  }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="16px">Pequeño</option>
              <option value="24px">Mediano</option>
              <option value="32px">Grande</option>
              <option value="48px">Extra grande</option>
            </select>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            Selecciona una sección para personalizar
          </p>
        </div>
      );
  }
};

// Field Properties Component
const FieldProperties: React.FC<{
  field: FormXField;
  onUpdate: (fieldId: string, updates: Partial<FormXField>) => void;
}> = ({ field, onUpdate }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Propiedades del Campo</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Etiqueta
        </label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate(field.id, { label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
        />
      </div>

      {(field.type === 'text' || field.type === 'textarea' || field.type === 'conditional_text') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Placeholder
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
          />
        </div>
      )}

      {field.type !== 'section_header' && field.type !== 'info_text' && (
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Campo obligatorio</span>
          </label>
        </div>
      )}

      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opciones (una por línea)
          </label>
          <textarea
            value={field.options?.join('\n') || ''}
            onChange={(e) => onUpdate(field.id, { 
              options: e.target.value.split('\n').filter(opt => opt.trim()) 
            })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
          />
        </div>
      )}

      {field.type === 'info_text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenido
          </label>
          <textarea
            value={field.description || ''}
            onChange={(e) => onUpdate(field.id, { description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
          />
        </div>
      )}

      {field.type === 'conditional_text' && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-900">Lógica Condicional</h5>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depende del campo
            </label>
            <input
              type="text"
              value={field.conditionalLogic?.dependsOn || ''}
              onChange={(e) => onUpdate(field.id, { 
                conditionalLogic: { 
                  ...field.conditionalLogic, 
                  dependsOn: e.target.value 
                } as any
              })}
              placeholder="ID del campo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condición
            </label>
            <select
              value={field.conditionalLogic?.condition || 'equals'}
              onChange={(e) => onUpdate(field.id, { 
                conditionalLogic: { 
                  ...field.conditionalLogic, 
                  condition: e.target.value as any 
                } as any
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
            >
              <option value="equals">Igual a</option>
              <option value="not_equals">No igual a</option>
              <option value="contains">Contiene</option>
              <option value="greater_than">Mayor que</option>
              <option value="less_than">Menor que</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor
            </label>
            <input
              type="text"
              value={field.conditionalLogic?.value || ''}
              onChange={(e) => onUpdate(field.id, { 
                conditionalLogic: { 
                  ...field.conditionalLogic, 
                  value: e.target.value 
                } as any
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
            />
          </div>
        </div>
      )}

      {field.type === 'legal_checkbox' && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-900">Configuración Legal</h5>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto de consentimiento
            </label>
            <textarea
              value={field.legalConfig?.consentText || ''}
              onChange={(e) => onUpdate(field.id, { 
                legalConfig: { 
                  ...field.legalConfig, 
                  consentText: e.target.value 
                } as any
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
            />
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.legalConfig?.mandatoryForTreatment || false}
                onChange={(e) => onUpdate(field.id, { 
                  legalConfig: { 
                    ...field.legalConfig, 
                    mandatoryForTreatment: e.target.checked 
                  } as any
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Obligatorio para el tratamiento</span>
            </label>
          </div>
        </div>
      )}

      {field.type === 'medical_history' && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-900">Configuración Médica</h5>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={field.medicalConfig?.category || 'medical'}
              onChange={(e) => onUpdate(field.id, { 
                medicalConfig: { 
                  ...field.medicalConfig, 
                  category: e.target.value as any 
                } as any
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
            >
              <option value="personal">Personal</option>
              <option value="family">Familiar</option>
              <option value="social">Social</option>
              <option value="psychiatric">Psiquiátrico</option>
              <option value="medical">Médico</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condiciones relevantes (una por línea)
            </label>
            <textarea
              value={field.medicalConfig?.relevantConditions?.join('\n') || ''}
              onChange={(e) => onUpdate(field.id, { 
                medicalConfig: { 
                  ...field.medicalConfig, 
                  relevantConditions: e.target.value.split('\n').filter(c => c.trim()) 
                } as any
              })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ancho
        </label>
        <select
          value={field.width || 'full'}
          onChange={(e) => onUpdate(field.id, { 
            width: e.target.value as 'full' | 'half' | 'third' 
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
        >
          <option value="full">Ancho completo</option>
          <option value="half">Media columna</option>
          <option value="third">Tercio de columna</option>
        </select>
      </div>
    </div>
  );
};

export default FormBuilderAdvanced;