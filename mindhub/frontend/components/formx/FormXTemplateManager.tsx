'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  EyeIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon as DuplicateIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface FormXTemplateManagerProps {
  onNavigate: (view: 'builder' | 'dashboard' | 'templates' | 'responses', data?: any) => void;
}

export function FormXTemplateManager({ onNavigate }: FormXTemplateManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/formx/django/templates');
      if (response.ok) {
        const data = await response.json();
        // Transform Django data to match current interface
        const transformedTemplates = data.map((template: any) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: getCategoryDisplay(template.form_type),
          questions: template.fields?.length || template.total_fields || 0,
          estimatedTime: getEstimatedTime(template.fields?.length || template.total_fields || 0),
          status: template.is_active ? 'active' : 'draft',
          createdDate: new Date(template.created_at).toLocaleDateString(),
          lastModified: new Date(template.updated_at).toLocaleDateString(),
          responses: 0, // Will be fetched separately
          fields: template.fields?.map((field: any) => ({
            type: field.field_type,
            label: field.label,
            required: field.required,
            options: field.choices?.map((choice: any) => choice.label) || [],
            min: field.min_value,
            max: field.max_value
          })) || []
        }));
        setTemplates(transformedTemplates);
      } else {
        // Fallback to predefined templates if API fails
        setTemplates(predefinedTemplates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Fallback to predefined templates
      setTemplates(predefinedTemplates);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDisplay = (formType: string) => {
    const mapping: { [key: string]: string } = {
      'intake': 'Admisión',
      'follow_up': 'Seguimiento',
      'clinical': 'Psiquiatría Infantil',
      'survey': 'Screening',
      'document': 'Especialidad',
      'consent': 'General'
    };
    return mapping[formType] || 'General';
  };

  const getEstimatedTime = (fieldCount: number) => {
    if (fieldCount <= 5) return '5-10 min';
    if (fieldCount <= 10) return '8-12 min';
    if (fieldCount <= 15) return '10-15 min';
    if (fieldCount <= 20) return '15-20 min';
    return '20+ min';
  };

  // Predefined templates as fallback
  const predefinedTemplates = [
    {
      id: 'psychiatric-child',
      name: 'Formulario Psiquiátrico Niño (5-11 años)',
      description: 'Evaluación completa para niños con preguntas adaptadas a su edad',
      category: 'Psiquiatría Infantil',
      questions: 15,
      estimatedTime: '10-15 min',
      status: 'active',
      createdDate: '2024-01-15',
      lastModified: '2024-01-20',
      responses: 23,
      fields: [
        { type: 'text', label: 'Nombre del niño', required: true },
        { type: 'date', label: 'Fecha de nacimiento', required: true },
        { type: 'select', label: '¿Cómo se siente hoy?', options: ['Feliz', 'Triste', 'Nervioso', 'Enojado'] },
        { type: 'text', label: '¿Qué te gusta hacer?', required: false }
      ]
    },
    {
      id: 'adult-intake',
      name: 'Formulario de Admisión Adultos',
      description: 'Registro inicial completo para pacientes adultos',
      category: 'Admisión',
      questions: 25,
      estimatedTime: '15-20 min',
      status: 'active',
      createdDate: '2024-01-10',
      lastModified: '2024-01-18',
      responses: 45,
      fields: [
        { type: 'text', label: 'Nombre completo', required: true },
        { type: 'email', label: 'Correo electrónico', required: true },
        { type: 'textarea', label: 'Motivo de la consulta', required: true },
        { type: 'select', label: 'Estado civil', options: ['Soltero', 'Casado', 'Divorciado', 'Viudo'] }
      ]
    },
    {
      id: 'follow-up',
      name: 'Formulario de Seguimiento',
      description: 'Evaluación de progreso para citas de seguimiento',
      category: 'Seguimiento',
      questions: 12,
      estimatedTime: '8-10 min',
      status: 'active',
      createdDate: '2024-01-12',
      lastModified: '2024-01-19',
      responses: 12,
      fields: [
        { type: 'scale', label: '¿Cómo te sientes comparado con la última visita?', min: 1, max: 10 },
        { type: 'checkbox', label: '¿Has experimentado alguno de estos síntomas?', options: ['Dolor de cabeza', 'Náuseas', 'Mareo'] },
        { type: 'textarea', label: 'Comentarios adicionales', required: false }
      ]
    },
    {
      id: 'mental-health-screening',
      name: 'Screening de Salud Mental',
      description: 'Evaluación rápida del estado mental del paciente',
      category: 'Screening',
      questions: 20,
      estimatedTime: '12-15 min',
      status: 'draft',
      createdDate: '2024-01-14',
      lastModified: '2024-01-21',
      responses: 0,
      fields: [
        { type: 'scale', label: 'Nivel de ansiedad (1-10)', min: 1, max: 10 },
        { type: 'select', label: 'Calidad del sueño', options: ['Muy buena', 'Buena', 'Regular', 'Mala', 'Muy mala'] },
        { type: 'textarea', label: 'Describe cómo te has sentido esta semana', required: true }
      ]
    }
  ];

  const categories = ['Todos', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'Todos' || 
                           template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePreviewTemplate = (template: any) => {
    setPreviewTemplate(template);
  };

  const handleEditTemplate = (template: any) => {
    toast.success(`Abriendo editor para: ${template.name}`);
    onNavigate('builder', { templateId: template.id });
  };

  const handleDuplicateTemplate = (template: any) => {
    toast.success(`Template "${template.name}" duplicado exitosamente`);
  };

  const handleDeleteTemplate = (template: any) => {
    if (confirm(`¿Estás seguro de que deseas eliminar "${template.name}"?`)) {
      toast.success(`Template "${template.name}" eliminado exitosamente`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'draft': return 'Borrador';
      case 'archived': return 'Archivado';
      default: return status;
    }
  };

  const TemplatePreview = ({ template, onClose }: { template: any, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Vista Previa: {template.name}</h3>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Categoría:</span>
              <span className="ml-2">{template.category}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tiempo estimado:</span>
              <span className="ml-2">{template.estimatedTime}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Preguntas:</span>
              <span className="ml-2">{template.questions}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Respuestas:</span>
              <span className="ml-2">{template.responses}</span>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Campos del Formulario:</h4>
            <div className="space-y-3">
              {template.fields.map((field: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{field.label}</span>
                    <Badge variant={field.required ? 'default' : 'secondary'}>
                      {field.required ? 'Requerido' : 'Opcional'}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    Tipo: {field.type}
                    {field.options && ` • Opciones: ${field.options.join(', ')}`}
                    {field.min && field.max && ` • Escala: ${field.min} - ${field.max}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={() => handleEditTemplate(template)} className="flex-1">
              Editar Template
            </Button>
            <Button variant="outline" onClick={() => handleDuplicateTemplate(template)}>
              Duplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-7 w-7" />
            Gestión de Templates
          </h1>
          <p className="text-gray-600 mt-1">
            Organiza y personaliza tus plantillas de formularios médicos
          </p>
        </div>
        <Button onClick={() => onNavigate('builder')} className="flex items-center gap-2">
          <PencilSquareIcon className="h-4 w-4" />
          Crear Nuevo Template
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category === 'Todos' ? '' : category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{template.category}</Badge>
                  <Badge className={getStatusColor(template.status)}>
                    {getStatusLabel(template.status)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {template.description}
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-4">
              <div>📝 {template.questions} preguntas</div>
              <div>⏱️ {template.estimatedTime}</div>
              <div>📊 {template.responses} respuestas</div>
              <div>📅 {template.lastModified}</div>
            </div>
            
            <div className="flex gap-1">
              <Button 
                onClick={() => handlePreviewTemplate(template)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                Ver
              </Button>
              <Button 
                onClick={() => handleEditTemplate(template)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <PencilSquareIcon className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button 
                onClick={() => handleDuplicateTemplate(template)}
                variant="ghost"
                size="sm"
              >
                <DuplicateIcon className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => handleDeleteTemplate(template)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron templates</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primer template de formulario'
            }
          </p>
          <Button onClick={() => onNavigate('builder')}>
            Crear Nuevo Template
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreview 
          template={previewTemplate} 
          onClose={() => setPreviewTemplate(null)} 
        />
      )}
    </div>
  );
}