'use client';

import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FormXDjangoClient, FormXTemplate, FormXCatalogResponse } from '@/lib/api/formx-django-client';
import { FormXPredefinedTemplates } from './FormXPredefinedTemplates';
import toast from 'react-hot-toast';

interface FormXTemplatesProps {
  onCreateNew: () => void;
  onEditTemplate: (template: FormXTemplate) => void;
  onAssignTemplate: (template: FormXTemplate) => void;
}

export function FormXTemplates({ onCreateNew, onEditTemplate, onAssignTemplate }: FormXTemplatesProps) {
  const [catalog, setCatalog] = useState<FormXCatalogResponse>({
    templates: [],
    total: 0,
    categories: []
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<FormXTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<'my-templates' | 'predefined'>('my-templates');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const catalogData = await FormXDjangoClient.getTemplatesCatalog();
      setCatalog(catalogData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error al cargar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (template: FormXTemplate) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el template "${template.name}"?`)) {
      return;
    }

    try {
      await FormXDjangoClient.deleteTemplate(template.id);
      toast.success('Template eliminado exitosamente');
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar template');
    }
  };

  const handlePreviewTemplate = async (template: FormXTemplate) => {
    try {
      setSelectedTemplate(template);
      const preview = await FormXDjangoClient.previewTemplate(template.id);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Error al cargar previsualización');
    }
  };

  const filteredTemplates = catalog.templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || template.form_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Cargando templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentTab('my-templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'my-templates'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mis Templates ({catalog.total})
          </button>
          <button
            onClick={() => setCurrentTab('predefined')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              currentTab === 'predefined'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SparklesIcon className="h-4 w-4 mr-1" />
            Templates Predefinidos
          </button>
        </nav>
      </div>

      {/* Predefined Templates Tab */}
      {currentTab === 'predefined' && (
        <FormXPredefinedTemplates 
          onCreateFromTemplate={() => {
            loadTemplates();
            setCurrentTab('my-templates');
          }}
        />
      )}

      {/* My Templates Tab */}
      {currentTab === 'my-templates' && (
        <>
          {/* Search and Filters */}
          <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar templates por nombre o descripción..."
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todas las categorías</option>
              {catalog.categories.map(category => (
                <option key={category.key} value={category.key}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <Button onClick={onCreateNew} variant="primary">
            <PlusIcon className="h-4 w-4 mr-1" />
            Nuevo Template
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            Mostrando {filteredTemplates.length} de {catalog.total} templates
          </span>
          <Button onClick={loadTemplates} variant="outline" size="sm">
            Actualizar
          </Button>
        </div>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedCategory ? 'No se encontraron templates' : 'No hay templates creados'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primer template de formulario médico'
            }
          </p>
          <Button onClick={onCreateNew} variant="primary">
            <PlusIcon className="h-4 w-4 mr-1" />
            Crear Primer Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                </div>
                
                <div className="flex items-center space-x-1 ml-2">
                  {template.is_active ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" title="Activo" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-gray-400" title="Inactivo" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium capitalize">
                    {catalog.categories.find(c => c.key === template.form_type)?.name || template.form_type}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Campos:</span>
                  <span className="font-medium">{template.total_fields}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Respuestas:</span>
                  <span className="font-medium">{template.total_submissions}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Integración:</span>
                  <span className="font-medium capitalize">{template.integration_type}</span>
                </div>
                
                {template.auto_sync_expedix && (
                  <div className="flex items-center text-xs text-green-600">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Auto-sync Expedix
                  </div>
                )}
                
                {template.mobile_optimized && (
                  <div className="flex items-center text-xs text-blue-600">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Optimizado móvil
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handlePreviewTemplate(template)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    Vista Previa
                  </Button>
                  
                  <Button
                    onClick={() => onAssignTemplate(template)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <UserGroupIcon className="h-3 w-3 mr-1" />
                    Asignar
                  </Button>
                  
                  <Button
                    onClick={() => onEditTemplate(template)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <PencilIcon className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    onClick={() => handleDeleteTemplate(template)}
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Creado: {new Date(template.created_at).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Vista Previa: {selectedTemplate.name}
                </h3>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  size="sm"
                >
                  Cerrar
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  {selectedTemplate.description}
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Campos ({previewData.total_fields})
                  </h4>
                  
                  <div className="space-y-3">
                    {previewData.fields.map((field: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{field.label}</span>
                          {field.required && (
                            <span className="text-xs text-red-600">Obligatorio</span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          Tipo: {field.type} • Nombre: {field.name}
                        </div>
                        
                        {field.help_text && (
                          <div className="text-xs text-gray-500 mt-1">
                            {field.help_text}
                          </div>
                        )}
                        
                        {field.placeholder && (
                          <div className="text-xs text-gray-400 mt-1">
                            Placeholder: "{field.placeholder}"
                          </div>
                        )}
                        
                        {field.choices && field.choices.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Opciones: {field.choices.map((choice: any) => choice.label).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    onClick={() => onEditTemplate(selectedTemplate)}
                    variant="outline"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Editar Template
                  </Button>
                  
                  <Button
                    onClick={() => onAssignTemplate(selectedTemplate)}
                    variant="primary"
                  >
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    Asignar a Paciente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}