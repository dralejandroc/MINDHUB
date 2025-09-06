'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  DocumentTextIcon, 
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon
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
    consentForms: true,
    digitalSignature: false
  });

  const [showCustomFieldForm, setShowCustomFieldForm] = useState(false);
  const [newCustomField, setNewCustomField] = useState({
    name: '',
    type: 'text' as const,
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

  const loadConfig = () => {
    const saved = localStorage.getItem('expedix_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  };

  const saveConfig = () => {
    localStorage.setItem('expedix_config', JSON.stringify(config));
    toast.success('Configuración de Expedix guardada');
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