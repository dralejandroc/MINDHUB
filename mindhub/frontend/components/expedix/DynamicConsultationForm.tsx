'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon,
  LinkIcon,
  CameraIcon,
  DocumentArrowUpIcon 
} from '@heroicons/react/24/outline';

interface FieldConfig {
  field: string;
  label: string;
  type: 'textarea' | 'text' | 'datetime' | 'integration' | 'file_upload';
  required?: boolean;
  placeholder?: string;
  integration_type?: 'clinimetrix' | 'resources' | 'prescriptions';
  multiple?: boolean;
  accept?: string;
}

interface ConsultationTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  fields_config: FieldConfig[];
  is_default: boolean;
  is_active: boolean;
}

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name?: string;
  age?: number;
}

interface DynamicConsultationFormProps {
  patient: Patient;
  template?: ConsultationTemplate;
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function DynamicConsultationForm({ 
  patient, 
  template, 
  onSave, 
  onCancel, 
  initialData = {} 
}: DynamicConsultationFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  
  useEffect(() => {
    // Initialize form data with initial values
    const initial = { ...initialData };
    if (template?.fields_config) {
      template.fields_config.forEach(field => {
        if (!(field.field in initial)) {
          initial[field.field] = '';
        }
      });
    }
    setFormData(initial);
  }, [template, initialData]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleFileUpload = (fieldName: string, files: File[]) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldName]: files
    }));
  };

  const renderField = (fieldConfig: FieldConfig) => {
    const value = formData[fieldConfig.field] || '';
    
    switch (fieldConfig.type) {
      case 'textarea':
        return (
          <div key={fieldConfig.field} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {fieldConfig.label}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(fieldConfig.field, e.target.value)}
              placeholder={fieldConfig.placeholder}
              required={fieldConfig.required}
              rows={6}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              style={{
                fontFamily: 'var(--font-mono, "SF Mono", "Consolas", monospace)',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            />
          </div>
        );

      case 'text':
        return (
          <div key={fieldConfig.field} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {fieldConfig.label}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(fieldConfig.field, e.target.value)}
              placeholder={fieldConfig.placeholder}
              required={fieldConfig.required}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        );

      case 'datetime':
        return (
          <div key={fieldConfig.field} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {fieldConfig.label}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <CalendarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="datetime-local"
                value={value}
                onChange={(e) => handleFieldChange(fieldConfig.field, e.target.value)}
                required={fieldConfig.required}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        );

      case 'integration':
        return (
          <div key={fieldConfig.field} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {fieldConfig.label}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="text-center">
                {fieldConfig.integration_type === 'clinimetrix' && (
                  <>
                    <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-purple-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-3">{fieldConfig.placeholder}</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // TODO: Open Clinimetrix integration
                        alert('Abrir ClinimetrixPro para aplicar escalas');
                      }}
                      className="text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Aplicar Escalas Psicométricas
                    </Button>
                  </>
                )}
                
                {fieldConfig.integration_type === 'resources' && (
                  <>
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-blue-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-3">{fieldConfig.placeholder}</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // TODO: Open Resources integration
                        alert('Abrir sistema de recursos médicos');
                      }}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Enviar Recursos al Paciente
                    </Button>
                  </>
                )}
                
                {fieldConfig.integration_type === 'prescriptions' && (
                  <>
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-green-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-3">{fieldConfig.placeholder}</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // TODO: Open Prescriptions integration
                        alert('Abrir Recetix para generar prescripciones');
                      }}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Generar Recetas Médicas
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case 'file_upload':
        return (
          <div key={fieldConfig.field} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {fieldConfig.label}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:border-primary-400 transition-colors">
              <div className="text-center">
                <div className="flex justify-center space-x-4 mb-4">
                  <CameraIcon className="h-8 w-8 text-gray-400" />
                  <DocumentArrowUpIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {fieldConfig.placeholder || 'Arrastra archivos aquí o haz clic para seleccionar'}
                </p>
                <input
                  type="file"
                  accept={fieldConfig.accept}
                  multiple={fieldConfig.multiple}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    handleFileUpload(fieldConfig.field, files);
                  }}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    cursor-pointer"
                />
                {uploadedFiles[fieldConfig.field] && uploadedFiles[fieldConfig.field].length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600">
                      {uploadedFiles[fieldConfig.field].length} archivo(s) seleccionado(s)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Combine form data with uploaded files
      const submissionData = {
        ...formData,
        patient_id: patient.id,
        template_id: template?.id,
        template_name: template?.name,
        template_type: template?.template_type,
        consultation_date: new Date().toISOString(),
        attached_files: uploadedFiles
      };
      
      console.log('[DynamicConsultationForm] Submitting consultation data:', Object.keys(submissionData));
      
      // Call the API to save the consultation
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/expedix/dynamic-consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(submissionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[DynamicConsultationForm] Consultation saved successfully:', result.data?.id);
      
      // Call the parent's onSave with the result
      await onSave(result.data);
      
    } catch (error) {
      console.error('[DynamicConsultationForm] Error saving consultation:', error);
      alert(`Error al guardar la consulta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!template) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No se ha seleccionado ninguna plantilla</p>
        <Button onClick={onCancel} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-600">{template.description}</p>
          </div>
          <Button onClick={onCancel} variant="outline">
            ← Volver
          </Button>
        </div>
        
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h2 className="font-semibold text-primary-800 mb-1">
            {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name}
          </h2>
          <p className="text-sm text-primary-600">
            {patient.age && `${patient.age} años`} • {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Dynamic Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          {template.fields_config.map(fieldConfig => renderField(fieldConfig))}
          
          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {loading ? 'Guardando...' : 'Guardar Consulta'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}