'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { expedixApi } from '@/lib/api/expedix-client';
import { supabase } from '@/lib/supabase/client';

interface ConsultationTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  fields_config: string[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ConsultationTemplateManagerProps {
  onTemplateSelect?: (template: ConsultationTemplate) => void;
  showActions?: boolean;
}

const TEMPLATE_TYPES = [
  { value: 'general', label: 'Consulta General' },
  { value: 'followup', label: 'Consulta de Seguimiento' },
  { value: 'initial', label: 'Primera Consulta' },
  { value: 'emergency', label: 'Consulta de Emergencia' },
  { value: 'specialized', label: 'Consulta Especializada' },
  { value: 'custom', label: 'Plantilla Personalizada' }
];

const DEFAULT_FIELD_OPTIONS = [
  { value: 'vitalSigns', label: 'Signos Vitales' },
  { value: 'currentCondition', label: 'Padecimiento Actual' },
  { value: 'physicalExamination', label: 'Exploración Física' },
  { value: 'mentalExam', label: '🧠 Examen Mental', isDefault: true }, // Por defecto en aplicaciones de salud mental
  { value: 'labResults', label: 'Resultados de Laboratorio' },
  { value: 'diagnosis', label: 'Diagnóstico' },
  { value: 'medications', label: 'Medicamentos' },
  { value: 'additionalInstructions', label: 'Instrucciones Adicionales' },
  { value: 'labOrders', label: 'Órdenes de Laboratorio' },
  { value: 'nextAppointment', label: 'Próxima Cita' }
];

export default function ConsultationTemplateManager({ 
  onTemplateSelect, 
  showActions = true 
}: ConsultationTemplateManagerProps) {
  const [templates, setTemplates] = useState<ConsultationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ConsultationTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'general',
    fields_config: ['mentalExam'] as string[], // Incluir examen mental por defecto
    is_default: false
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  // Helper function to get authentication headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token || ''}`,
      'Content-Type': 'application/json'
    };
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/expedix/consultation-templates/', {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        // Ensure templates is always an array
        const templatesData = data.data || data || [];
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading consultation templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const headers = await getAuthHeaders();
      
      if (editingTemplate) {
        // Update existing template
        const response = await fetch(`/api/expedix/consultation-templates/?id=${editingTemplate.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } else {
        // Create new template
        const response = await fetch('/api/expedix/consultation-templates/', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      }
      
      await loadTemplates();
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/expedix/consultation-templates/?id=${templateId}`, {
          method: 'DELETE',
          headers
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await loadTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleEdit = (template: ConsultationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      template_type: template.template_type,
      fields_config: template.fields_config || [],
      is_default: template.is_default
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_type: 'general',
      fields_config: ['mentalExam'], // Mantener examen mental por defecto
      is_default: false
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const toggleField = (fieldValue: string) => {
    setFormData(prev => ({
      ...prev,
      fields_config: prev.fields_config.includes(fieldValue)
        ? prev.fields_config.filter(f => f !== fieldValue)
        : [...prev.fields_config, fieldValue]
    }));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Plantillas de Consulta</h3>
          <p className="text-sm text-gray-600">
            Gestiona plantillas personalizables para diferentes tipos de consulta
          </p>
        </div>
        {showActions && (
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
        )}
      </div>

      {/* Template Form */}
      {showForm && (
        <Card className="p-6">
          <h4 className="text-lg font-medium mb-4">
            {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de la plantilla"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={formData.template_type}
                onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {TEMPLATE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción de la plantilla"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Campos a Incluir</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DEFAULT_FIELD_OPTIONS.map(field => (
                <label key={field.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.fields_config.includes(field.value)}
                    onChange={() => toggleField(field.value)}
                    className="rounded"
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Usar como plantilla por defecto</span>
            </label>
          </div>
          
          <div className="flex space-x-3">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
            </Button>
            <Button onClick={resetForm} variant="outline">
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(templates) && templates.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium">{template.name}</h4>
                {template.is_default && (
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                    Por defecto
                  </span>
                )}
              </div>
              {showActions && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
            
            <div className="text-xs text-gray-500 mb-3">
              <span className="font-medium">Tipo:</span> {
                TEMPLATE_TYPES.find(t => t.value === template.template_type)?.label || template.template_type
              }
            </div>
            
            <div className="text-xs text-gray-500 mb-3">
              <span className="font-medium">Campos:</span> {template.fields_config?.length || 0}
            </div>
            
            {onTemplateSelect && (
              <Button
                onClick={() => onTemplateSelect(template)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-2"
              >
                Usar Plantilla
              </Button>
            )}
          </Card>
        ))}
        
        {templates.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p>No hay plantillas configuradas</p>
            {showActions && (
              <Button
                onClick={() => setShowForm(true)}
                className="mt-3 bg-blue-600 hover:bg-blue-700"
              >
                Crear Primera Plantilla
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}