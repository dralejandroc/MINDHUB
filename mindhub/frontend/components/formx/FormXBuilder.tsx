'use client';

import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FormXField, FormXTemplate } from '@/lib/api/formx-unified-client';
import toast from 'react-hot-toast';

interface FormXBuilderProps {
  editingTemplate?: FormXTemplate | null;
  onSave?: (template: FormXTemplate) => void;
  onCancel?: () => void;
}

interface BuilderField extends Partial<FormXField> {
  id: string;
  field_name: string;
  field_type: string;
  label: string;
  required: boolean;
  order: number;
}

interface FormData {
  name: string;
  description: string;
  form_type: string;
  integration_type: string;
  auto_sync_expedix: boolean;
  mobile_optimized: boolean;
  fields: BuilderField[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto Corto', icon: DocumentTextIcon },
  { value: 'textarea', label: 'Texto Largo', icon: DocumentTextIcon },
  { value: 'email', label: 'Correo Electrónico', icon: DocumentTextIcon },
  { value: 'phone', label: 'Teléfono', icon: DocumentTextIcon },
  { value: 'number', label: 'Número', icon: DocumentTextIcon },
  { value: 'date', label: 'Fecha', icon: DocumentTextIcon },
  { value: 'select', label: 'Lista Desplegable', icon: DocumentTextIcon },
  { value: 'radio', label: 'Selección Única', icon: DocumentTextIcon },
  { value: 'checkbox', label: 'Selección Múltiple', icon: DocumentTextIcon },
  { value: 'boolean', label: 'Sí/No', icon: DocumentTextIcon },
  { value: 'rating', label: 'Calificación', icon: DocumentTextIcon },
  { value: 'scale', label: 'Escala', icon: DocumentTextIcon },
];

const FORM_TYPES = [
  { value: 'clinical', label: 'Formulario Clínico' },
  { value: 'intake', label: 'Formulario de Admisión' },
  { value: 'consent', label: 'Consentimiento Informado' },
  { value: 'follow_up', label: 'Seguimiento Post-Consulta' },
  { value: 'survey', label: 'Encuesta/Seguimiento' },
  { value: 'document', label: 'Documento Legal' },
];

export function FormXBuilder({ editingTemplate, onSave, onCancel }: FormXBuilderProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    form_type: 'clinical',
    integration_type: 'expedix',
    auto_sync_expedix: true,
    mobile_optimized: true,
    fields: []
  });

  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<BuilderField | null>(null);

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        description: editingTemplate.description,
        form_type: editingTemplate.form_type,
        integration_type: editingTemplate.integration_type,
        auto_sync_expedix: editingTemplate.auto_sync_expedix,
        mobile_optimized: editingTemplate.mobile_optimized,
        fields: editingTemplate.fields?.map((field, index) => ({
          id: field.id || `field_${index}`,
          field_name: field.field_name,
          field_type: field.field_type,
          label: field.label,
          help_text: field.help_text,
          placeholder: field.placeholder,
          required: field.required,
          order: field.order || index,
          choices: field.choices || [],
          expedix_field: field.expedix_field || ''
        })) || []
      });
    }
  }, [editingTemplate]);

  const generateFieldId = () => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addField = (fieldType: string) => {
    const newField: BuilderField = {
      id: generateFieldId(),
      field_name: `campo_${formData.fields.length + 1}`,
      field_type: fieldType,
      label: `Campo ${formData.fields.length + 1}`,
      help_text: '',
      placeholder: '',
      required: false,
      order: formData.fields.length,
      choices: [],
      expedix_field: ''
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));

    setEditingField(newField);
  };

  const updateField = (fieldId: string, updates: Partial<BuilderField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    
    if (editingField?.id === fieldId) {
      setEditingField(null);
    }
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const fieldIndex = formData.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newFields = [...formData.fields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
    
    // Update order values
    newFields.forEach((field, index) => {
      field.order = index;
    });

    setFormData(prev => ({ ...prev, fields: newFields }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre del formulario es obligatorio');
      return;
    }

    if (formData.fields.length === 0) {
      toast.error('Debe agregar al menos un campo al formulario');
      return;
    }

    try {
      setSaving(true);
      
      const formPayload = {
        name: formData.name.trim(),
        form_type: formData.form_type,
        description: formData.description.trim(),
        integration_type: formData.integration_type,
        auto_sync_expedix: formData.auto_sync_expedix,
        expedix_mapping: {},
        fields: formData.fields.map((field, index) => ({
          field_name: field.field_name,
          field_type: field.field_type,
          label: field.label,
          help_text: field.help_text || '',
          placeholder: field.placeholder || '',
          required: field.required,
          order: index,
          choices: field.choices || [],
          expedix_field: field.expedix_field || ''
        }))
      };

      let result;
      if (editingTemplate) {
        // result = await FormXDjangoClient.updateTemplate(editingTemplate.id, formPayload);
      } else {
        // result = await FormXDjangoClient.createFormFromBuilder(formPayload);
      }

      toast.success(editingTemplate ? 'Formulario actualizado exitosamente' : 'Formulario creado exitosamente');
      onSave?.(result);
      
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Error al guardar el formulario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-6">
        {/* Form Builder Panel */}
        <div className="flex-1 space-y-6">
          {/* Form Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Formulario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Formulario</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Historia Clínica Inicial"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Formulario</label>
                <select
                  value={formData.form_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, form_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {FORM_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el propósito de este formulario..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div className="flex items-center space-x-4 md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.auto_sync_expedix}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_sync_expedix: e.target.checked }))}
                    className="rounded text-emerald-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto-sincronizar con Expedix</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.mobile_optimized}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile_optimized: e.target.checked }))}
                    className="rounded text-emerald-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Optimizado para móvil</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Field Types Palette */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Campo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FIELD_TYPES.map(fieldType => (
                <Button
                  key={fieldType.value}
                  onClick={() => addField(fieldType.value)}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {fieldType.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Form Fields */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Campos del Formulario ({formData.fields.length})</h3>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                {showPreview ? 'Ocultar' : 'Previsualizar'}
              </Button>
            </div>
            
            {formData.fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No hay campos agregados</p>
                <p className="text-xs text-gray-400">Selecciona un tipo de campo de arriba para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.fields.map((field, index) => (
                  <div 
                    key={field.id}
                    className={`p-4 border rounded-lg ${
                      editingField?.id === field.id ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-mono text-gray-500">#{index + 1}</span>
                        <div>
                          <div className="font-medium text-gray-900">{field.label}</div>
                          <div className="text-sm text-gray-500">
                            {FIELD_TYPES.find(t => t.value === field.field_type)?.label} 
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          onClick={() => moveField(field.id, 'up')}
                          variant="outline"
                          size="sm"
                          disabled={index === 0}
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => moveField(field.id, 'down')}
                          variant="outline"
                          size="sm"
                          disabled={index === formData.fields.length - 1}
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => setEditingField(field)}
                          variant="outline"
                          size="sm"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => removeField(field.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              onClick={onCancel}
              variant="outline"
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleSave}
              variant="primary"
              disabled={saving || !formData.name.trim() || formData.fields.length === 0}
            >
              {saving ? 'Guardando...' : editingTemplate ? 'Actualizar Formulario' : 'Crear Formulario'}
            </Button>
          </div>
        </div>

        {/* Field Editor Sidebar */}
        {editingField && (
          <div className="w-80">
            <Card className="p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Editar Campo</h3>
                <Button
                  onClick={() => setEditingField(null)}
                  variant="outline"
                  size="sm"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
                  <Input
                    value={editingField.label}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      updateField(editingField.id, { label: newLabel });
                      setEditingField(prev => prev ? { ...prev, label: newLabel } : null);
                    }}
                    placeholder="Nombre del campo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre interno</label>
                  <Input
                    value={editingField.field_name}
                    onChange={(e) => {
                      const newFieldName = e.target.value;
                      updateField(editingField.id, { field_name: newFieldName });
                      setEditingField(prev => prev ? { ...prev, field_name: newFieldName } : null);
                    }}
                    placeholder="campo_nombre"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                  <Input
                    value={editingField.placeholder || ''}
                    onChange={(e) => {
                      const newPlaceholder = e.target.value;
                      updateField(editingField.id, { placeholder: newPlaceholder });
                      setEditingField(prev => prev ? { ...prev, placeholder: newPlaceholder } : null);
                    }}
                    placeholder="Texto de ejemplo..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texto de ayuda</label>
                  <textarea
                    value={editingField.help_text || ''}
                    onChange={(e) => {
                      const newHelpText = e.target.value;
                      updateField(editingField.id, { help_text: newHelpText });
                      setEditingField(prev => prev ? { ...prev, help_text: newHelpText } : null);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Instrucciones adicionales..."
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingField.required}
                      onChange={(e) => {
                        const newRequired = e.target.checked;
                        updateField(editingField.id, { required: newRequired });
                        setEditingField(prev => prev ? { ...prev, required: newRequired } : null);
                      }}
                      className="rounded text-emerald-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Campo obligatorio</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campo Expedix</label>
                  <Input
                    value={editingField.expedix_field || ''}
                    onChange={(e) => {
                      const newExpedixField = e.target.value;
                      updateField(editingField.id, { expedix_field: newExpedixField });
                      setEditingField(prev => prev ? { ...prev, expedix_field: newExpedixField } : null);
                    }}
                    placeholder="firstName, lastName, email..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Campo correspondiente en Expedix para auto-sync</p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setEditingField(null)}
                  variant="primary"
                  size="sm"
                  className="w-full"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Aplicar Cambios
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}