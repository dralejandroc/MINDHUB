'use client';

import React, { useState } from 'react';
import {
  DocumentTextIcon,
  PhotoIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'word' | 'text' | 'pages' | 'template';
  category: 'psychoeducational' | 'assessment' | 'therapeutic' | 'administrative';
  tags: string[];
  fileSize: string;
  createdAt: string;
  lastModified: string;
  author: string;
  downloadCount: number;
  shareCount: number;
  thumbnail?: string;
  isPersonalized: boolean;
}

interface ResourceLibraryProps {
  onNewResource: () => void;
}

// Mock data for demonstration
const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'Guía de Manejo de Ansiedad',
    description: 'Técnicas y estrategias para el manejo de la ansiedad en pacientes adultos',
    type: 'pdf',
    category: 'psychoeducational',
    tags: ['ansiedad', 'terapia cognitiva', 'adultos'],
    fileSize: '2.5 MB',
    createdAt: '2024-01-15',
    lastModified: '2024-01-20',
    author: 'Dr. Ana García',
    downloadCount: 45,
    shareCount: 12,
    isPersonalized: true
  },
  {
    id: '2',
    title: 'Ejercicios de Relajación Progresiva',
    description: 'Serie de ejercicios de relajación muscular progresiva de Jacobson',
    type: 'word',
    category: 'therapeutic',
    tags: ['relajación', 'ejercicios', 'estrés'],
    fileSize: '1.8 MB',
    createdAt: '2024-01-10',
    lastModified: '2024-01-18',
    author: 'Lic. Carlos Ruiz',
    downloadCount: 32,
    shareCount: 8,
    isPersonalized: false
  },
  {
    id: '3',
    title: 'Registro de Pensamientos Automáticos',
    description: 'Template para el registro y análisis de pensamientos automáticos',
    type: 'template',
    category: 'assessment',
    tags: ['pensamientos', 'terapia cognitiva', 'registro'],
    fileSize: '0.8 MB',
    createdAt: '2024-01-12',
    lastModified: '2024-01-16',
    author: 'Dra. María López',
    downloadCount: 67,
    shareCount: 23,
    isPersonalized: true
  },
  {
    id: '4',
    title: 'Protocolo de Admisión',
    description: 'Documento estándar para el proceso de admisión de nuevos pacientes',
    type: 'pdf',
    category: 'administrative',
    tags: ['admisión', 'protocolo', 'pacientes'],
    fileSize: '1.2 MB',
    createdAt: '2024-01-08',
    lastModified: '2024-01-14',
    author: 'Administración',
    downloadCount: 89,
    shareCount: 5,
    isPersonalized: true
  }
];

const CATEGORIES = {
  psychoeducational: 'Psicoeducativo',
  assessment: 'Evaluación',
  therapeutic: 'Terapéutico',
  administrative: 'Administrativo'
};

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ onNewResource }) => {
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'name'>('recent');
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [editResource, setEditResource] = useState<Resource | null>(null);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloadCount - a.downloadCount;
      case 'name':
        return a.title.localeCompare(b.title);
      case 'recent':
      default:
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <DocumentTextIcon className="h-6 w-6 text-red-500" />;
      case 'word':
        return <DocumentTextIcon className="h-6 w-6 text-blue-500" />;
      case 'template':
        return <DocumentTextIcon className="h-6 w-6 text-green-500" />;
      case 'pages':
        return <DocumentTextIcon className="h-6 w-6 text-orange-500" />;
      default:
        return <DocumentTextIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleShare = (resource: Resource) => {
    console.log('Share resource:', resource.id);
    // Implementation for sharing functionality
  };

  const handleDownload = (resource: Resource) => {
    console.log('Download resource:', resource.id);
    setResources(prev => prev.map(r => 
      r.id === resource.id ? { ...r, downloadCount: r.downloadCount + 1 } : r
    ));
  };

  const handleDelete = (resourceId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este recurso?')) {
      setResources(prev => prev.filter(r => r.id !== resourceId));
    }
  };

  const handlePreview = (resource: Resource) => {
    setPreviewResource(resource);
  };

  const handleEdit = (resource: Resource) => {
    setEditResource(resource);
  };

  const handleSaveEdit = (updatedResource: Resource) => {
    setResources(prev => prev.map(r => 
      r.id === updatedResource.id ? updatedResource : r
    ));
    setEditResource(null);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Todas las categorías</option>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="pdf">PDF</option>
              <option value="word">Word</option>
              <option value="template">Template</option>
              <option value="pages">Pages</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="recent">Más recientes</option>
              <option value="popular">Más populares</option>
              <option value="name">Por nombre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredResources.length} recursos encontrados
        </p>
        <Button
          onClick={onNewResource}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          Crear Nuevo Recurso
        </Button>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <div key={resource.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(resource.type)}
                  {resource.isPersonalized && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full" title="Personalizado" />
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  resource.category === 'psychoeducational' ? 'bg-blue-100 text-blue-800' :
                  resource.category === 'assessment' ? 'bg-purple-100 text-purple-800' :
                  resource.category === 'therapeutic' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {CATEGORIES[resource.category]}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                {resource.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {resource.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {resource.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
                {resource.tags.length > 3 && (
                  <span className="text-xs text-gray-400">+{resource.tags.length - 3}</span>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-2 mb-4 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="h-3 w-3" />
                    <span>{resource.author}</span>
                  </div>
                  <span>{resource.fileSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>{new Date(resource.lastModified).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span>↓{resource.downloadCount}</span>
                    <span>↗{resource.shareCount}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(resource)}
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Vista
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(resource)}
                  >
                    <ShareIcon className="w-4 h-4 mr-1" />
                    Enviar
                  </Button>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(resource)}
                    title="Descargar"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(resource)}
                    title="Editar"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(resource.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron recursos
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
              ? 'Prueba ajustando los filtros de búsqueda'
              : 'Comienza creando tu primer recurso personalizado'}
          </p>
          <Button
            onClick={onNewResource}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Crear Primer Recurso
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {previewResource.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {previewResource.description}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                {getTypeIcon(previewResource.type)}
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Tamaño:</span> {previewResource.fileSize}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Autor:</span> {previewResource.author}
                  </p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Vista previa del documento: {previewResource.title}
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => handleDownload(previewResource)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                  <Button
                    onClick={() => handleShare(previewResource)}
                    variant="outline"
                  >
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Editar Recurso
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={editResource.title}
                    onChange={(e) => setEditResource({
                      ...editResource,
                      title: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={editResource.description}
                    onChange={(e) => setEditResource({
                      ...editResource,
                      description: e.target.value
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editResource.category}
                    onChange={(e) => setEditResource({
                      ...editResource,
                      category: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {Object.entries(CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (separados por coma)
                  </label>
                  <input
                    type="text"
                    value={editResource.tags.join(', ')}
                    onChange={(e) => setEditResource({
                      ...editResource,
                      tags: e.target.value.split(',').map(tag => tag.trim())
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <Button
                onClick={() => setEditResource(null)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleSaveEdit(editResource)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};