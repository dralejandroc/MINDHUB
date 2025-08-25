import { useState, useEffect } from 'react';
import { expedixApi } from '@/lib/api/expedix-client';

export interface ConsultationTemplate {
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

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
  icon: string;
}

// Icon mapping for different template types
const TEMPLATE_ICONS: Record<string, string> = {
  general: '📋',
  followup: '🔄',
  initial: '👤',
  emergency: '🚨',
  specialized: '🧬',
  custom: '⚙️',
  // Legacy mappings for backward compatibility
  'primera-vez': '👤',
  'primera-vez-psicologia': '🧠',
  'primera-vez-psiquiatria': '🧬',
  'subsecuente': '📋',
  'subsecuente-psicologia': '📈',
  'subsecuente-psiquiatria': '🔄',
  'soap': '📝',
  'psicoterapia': '🧠',
  'seguimiento': '🔄',
  'urgencias': '🚨',
  'alta-psiquiatria': '🎯',
  'evento-entre-consultas': '⚡'
};

export function useConsultationTemplates() {
  const [templates, setTemplates] = useState<ConsultationTemplate[]>([]);
  const [noteTemplates, setNoteTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/expedix/consultation-templates/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const templateData = data.data || data || [];
      
      setTemplates(templateData);
      
      // Convert to NoteTemplate format for backward compatibility
      const noteTemplatesData: NoteTemplate[] = templateData.map((template: ConsultationTemplate) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        fields: template.fields_config || [],
        icon: TEMPLATE_ICONS[template.template_type] || TEMPLATE_ICONS.custom
      }));
      
      setNoteTemplates(noteTemplatesData);
      
    } catch (err) {
      console.error('Error loading consultation templates:', err);
      setError('Error al cargar las plantillas de consulta');
      
      // Fallback to default templates if API fails
      setNoteTemplates(getDefaultTemplates());
      
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: Partial<ConsultationTemplate>) => {
    try {
      await expedixApi.post('/consultation-templates/', templateData);
      await loadTemplates(); // Reload templates
    } catch (err) {
      console.error('Error creating template:', err);
      throw err;
    }
  };

  const updateTemplate = async (templateId: string, templateData: Partial<ConsultationTemplate>) => {
    try {
      await expedixApi.put(`/consultation-templates/${templateId}/`, templateData);
      await loadTemplates(); // Reload templates
    } catch (err) {
      console.error('Error updating template:', err);
      throw err;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      await expedixApi.delete(`/consultation-templates/${templateId}/`);
      await loadTemplates(); // Reload templates
    } catch (err) {
      console.error('Error deleting template:', err);
      throw err;
    }
  };

  const getDefaultTemplate = () => {
    const defaultTemplate = templates.find(t => t.is_default);
    if (defaultTemplate) {
      return noteTemplates.find(nt => nt.id === defaultTemplate.id);
    }
    return noteTemplates[0] || getDefaultTemplates()[0];
  };

  return {
    templates,
    noteTemplates,
    loading,
    error,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getDefaultTemplate
  };
}

// Fallback default templates for when API is not available
function getDefaultTemplates(): NoteTemplate[] {
  return [
    {
      id: 'default-general',
      name: 'Consulta General',
      description: 'Plantilla básica para consulta general',
      fields: ['currentCondition', 'physicalExamination', 'diagnosis', 'medications'],
      icon: '📋'
    },
    {
      id: 'default-initial',
      name: 'Primera Consulta',
      description: 'Evaluación inicial completa',
      fields: ['vitalSigns', 'currentCondition', 'physicalExamination', 'diagnosis', 'medications'],
      icon: '👤'
    },
    {
      id: 'default-followup',
      name: 'Consulta de Seguimiento',
      description: 'Seguimiento y evaluación de progreso',
      fields: ['currentCondition', 'physicalExamination', 'diagnosis', 'medications'],
      icon: '🔄'
    },
    {
      id: 'default-emergency',
      name: 'Consulta de Urgencias',
      description: 'Atención de urgencia médica',
      fields: ['vitalSigns', 'currentCondition', 'diagnosis', 'medications'],
      icon: '🚨'
    }
  ];
}