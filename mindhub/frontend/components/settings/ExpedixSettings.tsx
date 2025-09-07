'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  DocumentTextIcon, 
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

interface ExpedixConfig {
  consultationDuration: number;
  autoSaveInterval: number;
  requiredFields: string[];
  customFields: Array<{
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
  prescriptionTemplates: Array<{
    id: string;
    name: string;
    content: string;
  }>;
  prescriptionPrintSettings: {
    headerText: string;
    footerText: string;
    fontSize: {
      header: number;
      medication: number;
      instructions: number;
      footer: number;
    };
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    includeFields: {
      patientInfo: boolean;
      date: boolean;
      doctorSignature: boolean;
      doctorLicense: boolean;
      clinicAddress: boolean;
      medicationInstructions: boolean;
    };
    paperSize: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
  };
  consentForms: boolean;
  digitalSignature: boolean;
}

export function ExpedixSettings() {
  const [config, setConfig] = useState<ExpedixConfig>({
    consultationDuration: 60,
    autoSaveInterval: 30,
    requiredFields: ['chief_complaint', 'diagnosis', 'treatment_plan'],
    customFields: [],
    prescriptionTemplates: [],
    prescriptionPrintSettings: {
      headerText: 'PRESCRIPCIÓN MÉDICA',
      footerText: 'Esta receta es válida por 30 días a partir de su fecha de emisión.',
      fontSize: {
        header: 16,
        medication: 12,
        instructions: 10,
        footer: 8
      },
      margins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      },
      includeFields: {
        patientInfo: true,
        date: true,
        doctorSignature: true,
        doctorLicense: true,
        clinicAddress: true,
        medicationInstructions: true
      },
      paperSize: 'A4',
      orientation: 'portrait'
    },
    consentForms: true,
    digitalSignature: false
  });

  const [showCustomFieldForm, setShowCustomFieldForm] = useState(false);
  const [newCustomField, setNewCustomField] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'date' | 'select',
    required: false,
    options: [] as string[]
  });

  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/expedix/django/configuration/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setConfig(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (error) {
      console.error('Error loading Expedix configuration:', error);
      // Keep default configuration on error
    }
  };

  const saveConfig = async () => {
    try {
      const response = await fetch('/api/expedix/django/configuration/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: config,
          module: 'expedix'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save Expedix configuration');
      }
      
      toast.success('Configuración de Expedix guardada');
    } catch (error) {
      console.error('Error saving Expedix configuration:', error);
      toast.error('Error al guardar la configuración');
    }
  };

  const addCustomField = () => {
    if (!newCustomField.name) {
      toast.error('El nombre del campo es requerido');
      return;
    }

    const field = {
      id: Date.now().toString(),
      name: newCustomField.name,
      type: newCustomField.type,
      required: newCustomField.required,
      options: newCustomField.type === 'select' ? newCustomField.options : undefined
    };

    setConfig(prev => ({
      ...prev,
      customFields: [...prev.customFields, field]
    }));

    setNewCustomField({ name: '', type: 'text', required: false, options: [] });
    setShowCustomFieldForm(false);
    toast.success('Campo personalizado agregado');
  };

  const removeCustomField = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f.id !== id)
    }));
    toast.success('Campo eliminado');
  };

  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast.error('Complete todos los campos del template');
      return;
    }

    const template = {
      id: Date.now().toString(),
      name: newTemplate.name,
      content: newTemplate.content
    };

    setConfig(prev => ({
      ...prev,
      prescriptionTemplates: [...prev.prescriptionTemplates, template]
    }));

    setNewTemplate({ name: '', content: '' });
    setShowTemplateForm(false);
    toast.success('Template de receta agregado');
  };

  const removeTemplate = (id: string) => {
    setConfig(prev => ({
      ...prev,
      prescriptionTemplates: prev.prescriptionTemplates.filter(t => t.id !== id)
    }));
    toast.success('Template eliminado');
  };

  return (
    <div className="space-y-6">
      {/* Configuración General de Consultas */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Configuración de Consultas</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración Predeterminada (minutos)
            </label>
            <input
              type="number"
              value={config.consultationDuration}
              onChange={(e) => setConfig({ ...config, consultationDuration: parseInt(e.target.value) || 60 })}
              min="15"
              max="180"
              step="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervalo de Autoguardado (segundos)
            </label>
            <input
              type="number"
              value={config.autoSaveInterval}
              onChange={(e) => setConfig({ ...config, autoSaveInterval: parseInt(e.target.value) || 30 })}
              min="10"
              max="300"
              step="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.consentForms}
              onChange={(e) => setConfig({ ...config, consentForms: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Requerir consentimiento informado</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.digitalSignature}
              onChange={(e) => setConfig({ ...config, digitalSignature: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Habilitar firma digital en documentos</span>
          </label>
        </div>
      </div>

      {/* Campos Personalizados */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Campos Personalizados del Expediente</h3>
          </div>
          <Button
            onClick={() => setShowCustomFieldForm(!showCustomFieldForm)}
            variant="outline"
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar Campo
          </Button>
        </div>

        {showCustomFieldForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Campo
                </label>
                <input
                  type="text"
                  value={newCustomField.name}
                  onChange={(e) => setNewCustomField({ ...newCustomField, name: e.target.value })}
                  placeholder="Ej: Alergias"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Campo
                </label>
                <select
                  value={newCustomField.type}
                  onChange={(e) => setNewCustomField({ ...newCustomField, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Texto</option>
                  <option value="number">Número</option>
                  <option value="date">Fecha</option>
                  <option value="select">Lista de Opciones</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCustomField.required}
                  onChange={(e) => setNewCustomField({ ...newCustomField, required: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Campo Requerido</span>
              </label>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowCustomFieldForm(false);
                    setNewCustomField({ name: '', type: 'text', required: false, options: [] });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={addCustomField}
                  variant="primary"
                  size="sm"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {config.customFields.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay campos personalizados configurados
            </p>
          ) : (
            config.customFields.map(field => (
              <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-sm">{field.name}</span>
                  <span className="ml-2 text-xs text-gray-500">({field.type})</span>
                  {field.required && (
                    <span className="ml-2 text-xs text-red-600">* Requerido</span>
                  )}
                </div>
                <button
                  onClick={() => removeCustomField(field.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Templates de Recetas */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Templates de Recetas</h3>
          </div>
          <Button
            onClick={() => setShowTemplateForm(!showTemplateForm)}
            variant="outline"
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar Template
          </Button>
        </div>

        {showTemplateForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Template
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Ej: Tratamiento para Ansiedad"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido del Template
                </label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Escriba el contenido de la receta..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setShowTemplateForm(false);
                    setNewTemplate({ name: '', content: '' });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={addTemplate}
                  variant="primary"
                  size="sm"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {config.prescriptionTemplates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay templates de recetas configurados
            </p>
          ) : (
            config.prescriptionTemplates.map(template => (
              <div key={template.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{template.content}</p>
                  </div>
                  <button
                    onClick={() => removeTemplate(template.id)}
                    className="ml-2 text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Configuraciones de Impresión de Recetas */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6">
          <PrinterIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Configuraciones de Impresión de Recetas</h3>
        </div>

        {/* Textos de Encabezado y Pie */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto de Encabezado
            </label>
            <input
              type="text"
              value={config.prescriptionPrintSettings.headerText}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                prescriptionPrintSettings: {
                  ...prev.prescriptionPrintSettings,
                  headerText: e.target.value
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="PRESCRIPCIÓN MÉDICA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto de Pie de Página
            </label>
            <textarea
              value={config.prescriptionPrintSettings.footerText}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                prescriptionPrintSettings: {
                  ...prev.prescriptionPrintSettings,
                  footerText: e.target.value
                }
              }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Esta receta es válida por 30 días..."
            />
          </div>
        </div>

        {/* Configuración de Fuentes */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Tamaño de Fuentes (px)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Encabezado
              </label>
              <input
                type="number"
                value={config.prescriptionPrintSettings.fontSize.header}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    fontSize: {
                      ...prev.prescriptionPrintSettings.fontSize,
                      header: parseInt(e.target.value) || 16
                    }
                  }
                }))}
                min="10"
                max="24"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicamentos
              </label>
              <input
                type="number"
                value={config.prescriptionPrintSettings.fontSize.medication}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    fontSize: {
                      ...prev.prescriptionPrintSettings.fontSize,
                      medication: parseInt(e.target.value) || 12
                    }
                  }
                }))}
                min="8"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instrucciones
              </label>
              <input
                type="number"
                value={config.prescriptionPrintSettings.fontSize.instructions}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    fontSize: {
                      ...prev.prescriptionPrintSettings.fontSize,
                      instructions: parseInt(e.target.value) || 10
                    }
                  }
                }))}
                min="6"
                max="16"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pie de página
              </label>
              <input
                type="number"
                value={config.prescriptionPrintSettings.fontSize.footer}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    fontSize: {
                      ...prev.prescriptionPrintSettings.fontSize,
                      footer: parseInt(e.target.value) || 8
                    }
                  }
                }))}
                min="6"
                max="14"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Márgenes */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Márgenes de Página (mm)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Superior
              </label>
              <input
                type="number"
                value={config.prescriptionPrintSettings.margins.top}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    margins: {
                      ...prev.prescriptionPrintSettings.margins,
                      top: parseInt(e.target.value) || 20
                    }
                  }
                }))}
                min="5"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inferior
              </label>
              <input
                type="number"
                value={config.prescriptionPrintSettings.margins.bottom}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    margins: {
                      ...prev.prescriptionPrintSettings.margins,
                      bottom: parseInt(e.target.value) || 20
                    }
                  }
                }))}
                min="5"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Izquierdo
              </label>
              <input
                type="number"
                value={config.prescriptionPrintSettings.margins.left}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    margins: {
                      ...prev.prescriptionPrintSettings.margins,
                      left: parseInt(e.target.value) || 20
                    }
                  }
                }))}
                min="5"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Derecho
              </label>
              <input
                type="number"
                value={config.prescriptionPrintSettings.margins.right}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    margins: {
                      ...prev.prescriptionPrintSettings.margins,
                      right: parseInt(e.target.value) || 20
                    }
                  }
                }))}
                min="5"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Campos a Incluir */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Campos a Incluir en la Impresión</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.prescriptionPrintSettings.includeFields.patientInfo}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    includeFields: {
                      ...prev.prescriptionPrintSettings.includeFields,
                      patientInfo: e.target.checked
                    }
                  }
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Información del Paciente</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.prescriptionPrintSettings.includeFields.date}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    includeFields: {
                      ...prev.prescriptionPrintSettings.includeFields,
                      date: e.target.checked
                    }
                  }
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Fecha de Prescripción</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.prescriptionPrintSettings.includeFields.doctorSignature}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    includeFields: {
                      ...prev.prescriptionPrintSettings.includeFields,
                      doctorSignature: e.target.checked
                    }
                  }
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Firma del Doctor</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.prescriptionPrintSettings.includeFields.doctorLicense}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    includeFields: {
                      ...prev.prescriptionPrintSettings.includeFields,
                      doctorLicense: e.target.checked
                    }
                  }
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Cédula Profesional</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.prescriptionPrintSettings.includeFields.clinicAddress}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    includeFields: {
                      ...prev.prescriptionPrintSettings.includeFields,
                      clinicAddress: e.target.checked
                    }
                  }
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Dirección de la Clínica</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.prescriptionPrintSettings.includeFields.medicationInstructions}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  prescriptionPrintSettings: {
                    ...prev.prescriptionPrintSettings,
                    includeFields: {
                      ...prev.prescriptionPrintSettings.includeFields,
                      medicationInstructions: e.target.checked
                    }
                  }
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Instrucciones de Medicamentos</span>
            </label>
          </div>
        </div>

        {/* Configuración de Papel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamaño de Papel
            </label>
            <select
              value={config.prescriptionPrintSettings.paperSize}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                prescriptionPrintSettings: {
                  ...prev.prescriptionPrintSettings,
                  paperSize: e.target.value as 'A4' | 'Letter' | 'Legal'
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Carta (216 × 279 mm)</option>
              <option value="Legal">Oficio (216 × 356 mm)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Orientación
            </label>
            <select
              value={config.prescriptionPrintSettings.orientation}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                prescriptionPrintSettings: {
                  ...prev.prescriptionPrintSettings,
                  orientation: e.target.value as 'portrait' | 'landscape'
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="portrait">Vertical</option>
              <option value="landscape">Horizontal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button
          onClick={saveConfig}
          variant="primary"
        >
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Guardar Configuración de Expedix
        </Button>
      </div>
    </div>
  );
}