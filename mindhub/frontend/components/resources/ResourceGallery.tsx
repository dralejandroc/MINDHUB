'use client';

import React from 'react';
import {
  DocumentTextIcon,
  PhotoIcon,
  FilmIcon,
  DocumentIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ClockIcon,
  TagIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface Resource {
  id: string;
  title: string;
  description?: string;
  filename: string;
  file_type: 'pdfs' | 'images' | 'documents';
  file_size: number;
  mime_type: string;
  thumbnail_path?: string;
  library_type: 'public' | 'private';
  category_name?: string;
  uploader_name?: string;
  created_at: string;
  tags: string[];
  send_count: number;
}

interface ResourceGalleryProps {
  resources: Resource[];
  loading: boolean;
  onResourceSelect: (resource: Resource) => void;
  onSendResource: (resource: Resource) => void;
  libraryType: 'all' | 'public' | 'private';
  selectedResources?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActionsEnabled?: boolean;
}

export const ResourceGallery: React.FC<ResourceGalleryProps> = ({
  resources,
  loading,
  onResourceSelect,
  onSendResource,
  libraryType,
  selectedResources = [],
  onSelectionChange,
  bulkActionsEnabled = false
}) => {
  const getFileIcon = (fileType: string, mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <PhotoIcon className="h-6 w-6 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <DocumentTextIcon className="h-6 w-6 text-red-500" />;
    } else if (mimeType.includes('video')) {
      return <FilmIcon className="h-6 w-6 text-purple-500" />;
    }
    return <DocumentIcon className="h-6 w-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleResourceToggle = (resourceId: string) => {
    if (!onSelectionChange) return;
    
    const newSelection = selectedResources.includes(resourceId)
      ? selectedResources.filter(id => id !== resourceId)
      : [...selectedResources, resourceId];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedResources.length === resources.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(resources.map(r => r.id));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {libraryType === 'public' ? 'No hay recursos públicos disponibles' :
           libraryType === 'private' ? 'No tienes recursos privados' :
           'No se encontraron recursos'}
        </h3>
        <p className="text-gray-600 mb-6">
          {libraryType === 'private' ? 
            'Comienza subiendo tu primer documento a tu biblioteca personal.' :
            'Intenta con diferentes filtros de búsqueda.'}
        </p>
        {libraryType === 'private' && (
          <Button variant="primary">
            Subir Primer Recurso
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Bulk Selection Bar */}
      {bulkActionsEnabled && selectedResources.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-800">
                {selectedResources.length} recursos seleccionados
              </span>
              <button
                onClick={() => onSelectionChange?.([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Deseleccionar todo
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Mover a Categoría
              </Button>
              <Button variant="outline" size="sm">
                Agregar Etiquetas
              </Button>
              <Button variant="outline" size="sm">
                Envío Masivo
              </Button>
              <Button variant="danger" size="sm">
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {resources.length} {resources.length === 1 ? 'Recurso' : 'Recursos'}
            {libraryType === 'public' && ' - Biblioteca Pública'}
            {libraryType === 'private' && ' - Mi Biblioteca'}
          </h3>
          
          {bulkActionsEnabled && resources.length > 0 && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedResources.length === resources.length && resources.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">Seleccionar todo</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Ordenar por:</span>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value="date">Fecha</option>
            <option value="name">Nombre</option>
            <option value="size">Tamaño</option>
            <option value="sends">Más Enviados</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className={`border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 bg-white overflow-hidden group relative ${
              selectedResources.includes(resource.id) ? 'ring-2 ring-primary-500 bg-primary-50' : ''
            }`}
          >
            {/* Selection Checkbox */}
            {bulkActionsEnabled && (
              <div className="absolute top-2 right-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedResources.includes(resource.id)}
                  onChange={() => handleResourceToggle(resource.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {/* Thumbnail */}
            <div className="aspect-video bg-gray-50 flex items-center justify-center border-b border-gray-200 relative">
              {resource.thumbnail_path ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/storage/resources/${resource.thumbnail_path}`}
                  alt={resource.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  {getFileIcon(resource.file_type, resource.mime_type)}
                  <span className="text-xs text-gray-500 mt-2 uppercase">
                    {resource.file_type}
                  </span>
                </div>
              )}
              
              {/* Library Type Badge */}
              <div className="absolute top-2 left-2">
                {resource.library_type === 'public' ? (
                  <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    <GlobeAltIcon className="h-3 w-3 mr-1" />
                    Pública
                  </div>
                ) : (
                  <div className="flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    <LockClosedIcon className="h-3 w-3 mr-1" />
                    Privada
                  </div>
                )}
              </div>

              {/* Action Buttons - Show on Hover */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex space-x-2">
                  <Button
                    onClick={() => onResourceSelect(resource)}
                    variant="outline"
                    size="sm"
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onSendResource(resource)}
                    variant="primary"
                    size="sm"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                  {resource.title}
                </h4>
              </div>

              {resource.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {resource.description}
                </p>
              )}

              {/* Metadata */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                    {formatFileSize(resource.file_size)}
                  </span>
                  <span className="flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {formatDate(resource.created_at)}
                  </span>
                </div>

                {resource.category_name && (
                  <div className="flex items-center text-xs text-gray-500">
                    <TagIcon className="h-3 w-3 mr-1" />
                    {resource.category_name}
                  </div>
                )}

                {resource.send_count > 0 && (
                  <div className="flex items-center text-xs text-blue-600">
                    <PaperAirplaneIcon className="h-3 w-3 mr-1" />
                    Enviado {resource.send_count} {resource.send_count === 1 ? 'vez' : 'veces'}
                  </div>
                )}

                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {resource.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {resource.tags.length > 3 && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{resource.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* MindHub Attribution for Public Resources */}
              {resource.library_type === 'public' && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    Hecho y distribuido por MindHub
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {resources.length >= 50 && (
        <div className="mt-8 text-center">
          <Button variant="outline">
            Cargar Más Recursos
          </Button>
        </div>
      )}
    </div>
  );
};