'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { 
  CogIcon, 
  ArrowLeftIcon,
  CheckIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FormTemplate {
  id: string;
  name: string;
  category: FormCategory;
  description: string;
  fields: number;
  isActive: boolean;
  lastModified: string;
  usage: number;
  isRequired: boolean;
}

type FormCategory = 
  | 'admission' 
  | 'consent' 
  | 'privacy_notice' 
  | 'legal_documents' 
  | 'medical_intake' 
  | 'follow_up'
  | 'custom';

interface FormCategoryConfig {
  id: FormCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  isExpanded: boolean;
}

export default function FormXSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);

  // Categories configuration
  const [categories, setCategories] = useState<FormCategoryConfig[]>([
    {
      id: 'admission',
      name: 'Formularios de Ingreso',
      description: 'Formularios para el registro inicial de pacientes',
      icon: '📝',
      color: 'blue',
      isExpanded: true
    },
    {
      id: 'consent',
      name: 'Consentimientos Informados',
      description: 'Formularios de autorización y consentimientos médicos',
      icon: '✅',
      color: 'green',
      isExpanded: true
    },
    {
      id: 'privacy_notice',
      name: 'Avisos de Privacidad',
      description: 'Documentos de protección de datos personales',
      icon: '🔐',
      color: 'purple',
      isExpanded: true
    },
    {
      id: 'legal_documents',
      name: 'Documentos Legales',
      description: 'Contratos, responsivas y documentos jurídicos',
      icon: '⚖️',
      color: 'red',
      isExpanded: true
    },
    {
      id: 'medical_intake',
      name: 'Historia Clínica Inicial',
      description: 'Formularios de antecedentes y evaluación médica',
      icon: '🏥',
      color: 'indigo',
      isExpanded: true
    },
    {
      id: 'follow_up',
      name: 'Formularios de Seguimiento',
      description: 'Evaluaciones de progreso y seguimiento',
      icon: '📊',
      color: 'yellow',
      isExpanded: true
    },
    {
      id: 'custom',
      name: 'Formularios Personalizados',
      description: 'Templates creados por el usuario',
      icon: '🎨',
      color: 'gray',
      isExpanded: true
    }
  ]);

  // New form modal state
  const [newFormData, setNewFormData] = useState({
    name: '',
    category: 'admission' as FormCategory,
    description: '',
    isRequired: false
  });

  // Load form templates from Django API
  useEffect(() => {
    loadFormTemplates();
  }, []);

  const loadFormTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/formx/django/templates/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setTemplates(data);
        } else if (data.results && Array.isArray(data.results)) {
          setTemplates(data.results);
        } else {
          setTemplates([]);
        }
      } else {
        console.log(`FormX templates API returned ${response.status}`);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading form templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };


  const toggleCategoryExpansion = (categoryId: FormCategory) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, isExpanded: !cat.isExpanded }
        : cat
    ));
  };

  const getTemplatesByCategory = (categoryId: FormCategory) => {
    return templates.filter(template => template.category === categoryId);
  };

  const getCategoryColor = (category: FormCategory) => {
    const categoryConfig = categories.find(cat => cat.id === category);
    return categoryConfig?.color || 'gray';
  };

  const moveTemplate = (templateId: string, direction: 'up' | 'down') => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const categoryTemplates = getTemplatesByCategory(template.category);
    const currentIndex = categoryTemplates.findIndex(t => t.id === templateId);
    
    if (direction === 'up' && currentIndex > 0) {
      // Move up logic
      toast.success('Formulario movido hacia arriba');
    } else if (direction === 'down' && currentIndex < categoryTemplates.length - 1) {
      // Move down logic  
      toast.success('Formulario movido hacia abajo');
    }
  };

  const duplicateTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newTemplate: FormTemplate = {
      ...template,
      id: `${templateId}-copy-${Date.now()}`,
      name: `${template.name} (Copia)`,
      usage: 0,
      lastModified: new Date().toISOString().split('T')[0]
    };

    setTemplates(prev => [...prev, newTemplate]);
    toast.success('Formulario duplicado exitosamente');
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este formulario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/formx/django/templates/${templateId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success('Formulario eliminado exitosamente');
      } else {
        throw new Error(`Failed to delete template: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar el formulario');
    }
  };

  const toggleTemplateStatus = (templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isActive: !template.isActive }
        : template
    ));
    toast.success('Estado del formulario actualizado');
  };

  const handleCreateNewForm = async () => {
    if (!newFormData.name.trim()) {
      toast.error('El nombre del formulario es requerido');
      return;
    }

    try {
      const response = await fetch('/api/formx/django/templates/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFormData.name,
          category: newFormData.category,
          description: newFormData.description,
          is_required: newFormData.isRequired,
          fields: []
        })
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates(prev => [...prev, newTemplate]);
        toast.success('Formulario creado exitosamente');
      } else {
        throw new Error(`Failed to create template: ${response.status}`);
      }

      setNewFormData({ name: '', category: 'admission', description: '', isRequired: false });
      setShowNewFormModal(false);
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Error al crear el formulario');
    }
  };

  const handleEditForm = (template: FormTemplate) => {
    setEditingForm(template);
    setNewFormData({
      name: template.name,
      category: template.category,
      description: template.description,
      isRequired: template.isRequired
    });
    setShowNewFormModal(true);
  };

  const handleUpdateForm = async () => {
    if (!editingForm || !newFormData.name.trim()) {
      toast.error('El nombre del formulario es requerido');
      return;
    }

    try {
      setTemplates(prev => prev.map(template => 
        template.id === editingForm.id 
          ? {
              ...template,
              name: newFormData.name,
              category: newFormData.category,
              description: newFormData.description,
              isRequired: newFormData.isRequired,
              lastModified: new Date().toISOString().split('T')[0]
            }
          : template
      ));

      toast.success('Formulario actualizado exitosamente');
      setNewFormData({ name: '', category: 'admission', description: '', isRequired: false });
      setEditingForm(null);
      setShowNewFormModal(false);
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Error al actualizar el formulario');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de FormX"
        description="Configuraciones para el generador de formularios médicos FormX."
        icon={CogIcon}
        iconColor="text-gray-600"
        actions={
          <div className="flex space-x-2">
            <Button onClick={() => router.push('/hubs/formx')} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button 
              onClick={() => {
                setEditingForm(null);
                setNewFormData({ name: '', category: 'admission', description: '', isRequired: false });
                setShowNewFormModal(true);
              }}
              variant="primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Formulario
            </Button>
          </div>
        }
      />
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Cargando formularios...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(category => {
            const categoryTemplates = getTemplatesByCategory(category.id);
            
            return (
              <div key={category.id} className="bg-white rounded-lg shadow border border-gray-200">
                {/* Category Header */}
                <div 
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors bg-${category.color}-50`}
                  onClick={() => toggleCategoryExpansion(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className={`font-semibold text-${category.color}-900`}>
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${category.color}-100 text-${category.color}-800`}>
                        {categoryTemplates.length} formulario{categoryTemplates.length !== 1 ? 's' : ''}
                      </span>
                      {category.isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Category Content */}
                {category.isExpanded && (
                  <div className="p-4">
                    {categoryTemplates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No hay formularios en esta categoría</p>
                        <p className="text-sm mt-1">Agregue un nuevo formulario para comenzar</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categoryTemplates.map((template, index) => (
                          <div 
                            key={template.id} 
                            className={`p-4 border rounded-lg hover:border-gray-300 transition-colors ${
                              template.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className={`font-medium ${template.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {template.name}
                                  </span>
                                  {template.isRequired && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Requerido
                                    </span>
                                  )}
                                  {!template.isActive && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                      Inactivo
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>{template.fields} campos</span>
                                  <span>Usado {template.usage} veces</span>
                                  <span>Modificado: {new Date(template.lastModified).toLocaleDateString('es-MX')}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 ml-4">
                                {/* Move Up/Down */}
                                <button
                                  onClick={() => moveTemplate(template.id, 'up')}
                                  disabled={index === 0}
                                  className={`p-1 rounded ${
                                    index === 0 
                                      ? 'text-gray-300 cursor-not-allowed' 
                                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                  title="Mover arriba"
                                >
                                  <ArrowUpIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => moveTemplate(template.id, 'down')}
                                  disabled={index === categoryTemplates.length - 1}
                                  className={`p-1 rounded ${
                                    index === categoryTemplates.length - 1
                                      ? 'text-gray-300 cursor-not-allowed' 
                                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                  title="Mover abajo"
                                >
                                  <ArrowDownIcon className="h-4 w-4" />
                                </button>

                                {/* Preview */}
                                <button
                                  onClick={() => toast.success('Vista previa: ' + template.name)}
                                  className="p-1 rounded text-primary-500 hover:text-primary-700 hover:bg-primary-50"
                                  title="Vista previa"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>

                                {/* Edit */}
                                <button
                                  onClick={() => handleEditForm(template)}
                                  className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                  title="Editar"
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>

                                {/* Duplicate */}
                                <button
                                  onClick={() => duplicateTemplate(template.id)}
                                  className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                  title="Duplicar"
                                >
                                  <DocumentArrowDownIcon className="h-4 w-4" />
                                </button>

                                {/* Toggle Active */}
                                <button
                                  onClick={() => toggleTemplateStatus(template.id)}
                                  className={`p-1 rounded ${
                                    template.isActive 
                                      ? 'text-green-500 hover:text-green-700 hover:bg-green-50' 
                                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                  }`}
                                  title={template.isActive ? 'Desactivar' : 'Activar'}
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => deleteTemplate(template.id)}
                                  className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Eliminar"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New/Edit Form Modal */}
      {showNewFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingForm ? 'Editar Formulario' : 'Nuevo Formulario'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Formulario *
                </label>
                <input
                  type="text"
                  value={newFormData.name}
                  onChange={(e) => setNewFormData({ ...newFormData, name: e.target.value })}
                  placeholder="Ej: Registro de Paciente Nuevo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={newFormData.category}
                  onChange={(e) => setNewFormData({ ...newFormData, category: e.target.value as FormCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newFormData.description}
                  onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })}
                  placeholder="Descripción del formulario..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newFormData.isRequired}
                  onChange={(e) => setNewFormData({ ...newFormData, isRequired: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                />
                <span className="text-sm text-gray-700">Formulario requerido</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowNewFormModal(false);
                  setEditingForm(null);
                  setNewFormData({ name: '', category: 'admission', description: '', isRequired: false });
                }}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                onClick={editingForm ? handleUpdateForm : handleCreateNewForm}
                variant="primary"
                disabled={!newFormData.name.trim()}
              >
                {editingForm ? 'Actualizar' : 'Crear'} Formulario
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}