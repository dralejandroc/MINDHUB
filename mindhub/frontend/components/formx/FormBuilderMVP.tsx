'use client';

import React, { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

// Form field types based on the JotForm analysis
export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'phone' | 'email' | 'number' | 'signature' | 'section_header' | 'info_text';
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
    condition: 'equals' | 'not_equals' | 'contains';
    value: string;
  };
  description?: string;
  defaultValue?: string;
  width?: 'full' | 'half' | 'third';
}

export interface FormPage {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormDefinition {
  id: string;
  title: string;
  description: string;
  pages: FormPage[];
  settings: {
    allowSaveProgress: boolean;
    showProgressBar: boolean;
    submitButtonText: string;
    thankYouMessage: string;
    collectEmail: boolean;
    requireSignature: boolean;
  };
}

interface FormBuilderMVPProps {
  onSave: (form: FormDefinition) => void;
  initialForm?: FormDefinition;
}

export const FormBuilderMVP: React.FC<FormBuilderMVPProps> = ({ 
  onSave, 
  initialForm 
}) => {
  const [activeTab, setActiveTab] = useState<'builder' | 'preview' | 'settings'>('builder');
  const [form, setForm] = useState<FormDefinition>(initialForm || {
    id: '',
    title: 'Nuevo Formulario',
    description: 'Descripción del formulario',
    pages: [{
      id: 'page_1',
      title: 'Página 1',
      description: '',
      fields: []
    }],
    settings: {
      allowSaveProgress: true,
      showProgressBar: true,
      submitButtonText: 'Enviar',
      thankYouMessage: 'Gracias por completar el formulario',
      collectEmail: false,
      requireSignature: false
    }
  });

  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Field type templates
  const fieldTemplates: Record<string, Partial<FormField>> = {
    text: {
      type: 'text',
      label: 'Campo de texto',
      placeholder: 'Ingrese texto...',
      required: false,
      width: 'full'
    },
    textarea: {
      type: 'textarea',
      label: 'Área de texto',
      placeholder: 'Ingrese descripción...',
      required: false,
      width: 'full'
    },
    select: {
      type: 'select',
      label: 'Lista desplegable',
      required: false,
      options: ['Opción 1', 'Opción 2', 'Opción 3'],
      width: 'full'
    },
    radio: {
      type: 'radio',
      label: 'Selección única',
      required: false,
      options: ['Sí', 'No'],
      width: 'full'
    },
    checkbox: {
      type: 'checkbox',
      label: 'Casillas de verificación',
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
      label: 'Correo electrónico',
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
    section_header: {
      type: 'section_header',
      label: 'Título de Sección',
      required: false,
      width: 'full'
    },
    info_text: {
      type: 'info_text',
      label: 'Texto informativo',
      description: 'Información adicional para el usuario',
      required: false,
      width: 'full'
    },
    signature: {
      type: 'signature',
      label: 'Firma',
      required: false,
      width: 'full'
    }
  };

  const addField = (fieldType: string) => {
    const template = fieldTemplates[fieldType];
    if (!template) return;

    const newField: FormField = {
      id: `field_${Date.now()}`,
      ...template,
      label: template.label || 'Nuevo campo'
    } as FormField;

    const updatedPages = [...form.pages];
    updatedPages[selectedPageIndex].fields.push(newField);
    
    setForm(prev => ({
      ...prev,
      pages: updatedPages
    }));

    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
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
  };

  const deleteField = (fieldId: string) => {
    const updatedPages = [...form.pages];
    updatedPages[selectedPageIndex].fields = updatedPages[selectedPageIndex].fields.filter(f => f.id !== fieldId);
    
    setForm(prev => ({
      ...prev,
      pages: updatedPages
    }));

    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const updatedPages = [...form.pages];
    const fields = updatedPages[selectedPageIndex].fields;
    const currentIndex = fields.findIndex(f => f.id === fieldId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < fields.length) {
      [fields[currentIndex], fields[newIndex]] = [fields[newIndex], fields[currentIndex]];
      
      setForm(prev => ({
        ...prev,
        pages: updatedPages
      }));
    }
  };

  const addPage = () => {
    const newPage: FormPage = {
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
  };

  const currentPage = form.pages[selectedPageIndex];
  const selectedField = selectedFieldId ? currentPage?.fields.find(f => f.id === selectedFieldId) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-formx-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{form.title}</h1>
                <p className="text-sm text-gray-600">Constructor de Formularios</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Tab Navigation */}
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setActiveTab('builder')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'builder' 
                      ? 'bg-white text-formx-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Constructor
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'preview' 
                      ? 'bg-white text-formx-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Vista Previa
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-white text-formx-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Configuración
                </button>
              </div>

              <button
                onClick={() => onSave(form)}
                className="px-4 py-2 bg-formx-600 text-white rounded-lg hover:bg-formx-700 font-medium transition-colors"
              >
                Guardar Formulario
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Field Types Palette */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Elementos del Formulario</h3>
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Campos Básicos</div>
                {Object.entries(fieldTemplates).slice(0, 6).map(([type, template]) => (
                  <button
                    key={type}
                    onClick={() => addField(type)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {template.label}
                  </button>
                ))}
                
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider pt-3">Especiales</div>
                {Object.entries(fieldTemplates).slice(6).map(([type, template]) => (
                  <button
                    key={type}
                    onClick={() => addField(type)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Builder Canvas */}
            <div className="lg:col-span-2 space-y-4">
              {/* Page Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
                    onClick={addPage}
                    className="px-3 py-1 text-sm text-formx-600 hover:text-formx-700 font-medium"
                  >
                    + Agregar Página
                  </button>
                </div>

                {/* Form Fields */}
                <div className="p-6 space-y-4">
                  {currentPage?.fields.length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No hay campos en esta página</p>
                      <p className="text-sm text-gray-500">Arrastra elementos desde la barra lateral</p>
                    </div>
                  ) : (
                    currentPage?.fields.map((field, index) => (
                      <div
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedFieldId === field.id 
                            ? 'border-formx-300 bg-formx-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            {/* Field Preview */}
                            {field.type === 'text' && (
                              <input
                                type="text"
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                disabled
                              />
                            )}
                            
                            {field.type === 'textarea' && (
                              <textarea
                                placeholder={field.placeholder}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                disabled
                              />
                            )}
                            
                            {field.type === 'select' && (
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled>
                                <option>Seleccione una opción</option>
                                {field.options?.map((option, i) => (
                                  <option key={i}>{option}</option>
                                ))}
                              </select>
                            )}
                            
                            {field.type === 'radio' && (
                              <div className="space-y-2">
                                {field.options?.map((option, i) => (
                                  <label key={i} className="flex items-center">
                                    <input type="radio" name={field.id} className="mr-2" disabled />
                                    <span className="text-sm text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            {field.type === 'checkbox' && (
                              <div className="space-y-2">
                                {field.options?.map((option, i) => (
                                  <label key={i} className="flex items-center">
                                    <input type="checkbox" className="mr-2" disabled />
                                    <span className="text-sm text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            {field.type === 'section_header' && (
                              <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>
                            )}
                            
                            {field.type === 'info_text' && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">{field.description}</p>
                              </div>
                            )}
                          </div>

                          {/* Field Controls */}
                          <div className="ml-4 flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveField(field.id, 'up');
                              }}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                              <ArrowUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveField(field.id, 'down');
                              }}
                              disabled={index === currentPage.fields.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                              <ArrowDownIcon className="h-4 w-4" />
                            </button>
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
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Field Properties Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                {selectedField ? 'Propiedades del Campo' : 'Configuración de Página'}
              </h3>
              
              {selectedField ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Etiqueta
                    </label>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
                    />
                  </div>

                  {selectedField.type !== 'section_header' && selectedField.type !== 'info_text' && (
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedField.required}
                          onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Campo obligatorio</span>
                      </label>
                    </div>
                  )}

                  {(selectedField.type === 'text' || selectedField.type === 'textarea') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placeholder
                      </label>
                      <input
                        type="text"
                        value={selectedField.placeholder || ''}
                        onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
                      />
                    </div>
                  )}

                  {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opciones (una por línea)
                      </label>
                      <textarea
                        value={selectedField.options?.join('\n') || ''}
                        onChange={(e) => updateField(selectedField.id, { 
                          options: e.target.value.split('\n').filter(opt => opt.trim()) 
                        })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
                      />
                    </div>
                  )}

                  {selectedField.type === 'info_text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contenido
                      </label>
                      <textarea
                        value={selectedField.description || ''}
                        onChange={(e) => updateField(selectedField.id, { description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ancho
                    </label>
                    <select
                      value={selectedField.width || 'full'}
                      onChange={(e) => updateField(selectedField.id, { 
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
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título de la página
                    </label>
                    <input
                      type="text"
                      value={currentPage?.title || ''}
                      onChange={(e) => {
                        const updatedPages = [...form.pages];
                        updatedPages[selectedPageIndex].title = e.target.value;
                        setForm(prev => ({ ...prev, pages: updatedPages }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={currentPage?.description || ''}
                      onChange={(e) => {
                        const updatedPages = [...form.pages];
                        updatedPages[selectedPageIndex].description = e.target.value;
                        setForm(prev => ({ ...prev, pages: updatedPages }));
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{form.title}</h2>
              <p className="text-gray-600 mb-8">{form.description}</p>
              
              {/* Preview form content will be rendered here */}
              <div className="text-center py-12 text-gray-500">
                Vista previa del formulario en desarrollo...
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuración del Formulario</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del formulario
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-md font-medium text-gray-900">Opciones de presentación</h3>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.settings.showProgressBar}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, showProgressBar: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Mostrar barra de progreso</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.settings.allowSaveProgress}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, allowSaveProgress: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Permitir guardar progreso</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.settings.requireSignature}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, requireSignature: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Requerir firma digital</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto del botón de envío
                  </label>
                  <input
                    type="text"
                    value={form.settings.submitButtonText}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      settings: { ...prev.settings, submitButtonText: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje de agradecimiento
                  </label>
                  <textarea
                    value={form.settings.thankYouMessage}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      settings: { ...prev.settings, thankYouMessage: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-formx-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilderMVP;