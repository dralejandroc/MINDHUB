'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface ResourcePreviewProps {
  resource: any;
  isOpen: boolean;
  onClose: () => void;
  onSend: () => void;
}

export const ResourcePreview: React.FC<ResourcePreviewProps> = ({
  resource,
  isOpen,
  onClose,
  onSend
}) => {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !resource) return null;

  // Handle download
  const handleDownload = () => {
    if (resource.download_url) {
      window.open(resource.download_url, '_blank');
    } else {
      // Construct download URL
      window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/resources/download/${resource.id}`, '_blank');
    }
  };

  // Render preview based on file type
  const renderPreview = () => {
    if (loading) {
      return (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando vista previa...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 p-8 rounded-lg text-center">
          <p className="text-red-600">Error al cargar vista previa: {error}</p>
        </div>
      );
    }

    // Image preview
    if (resource.mime_type?.startsWith('image/')) {
      return (
        <div className="bg-gray-100 p-4 rounded-lg">
          <img 
            src={resource.thumbnail_url || resource.download_url}
            alt={resource.title}
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
            onError={() => setError('No se pudo cargar la imagen')}
          />
        </div>
      );
    }

    // PDF preview
    if (resource.mime_type === 'application/pdf') {
      return (
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="bg-red-500 text-white p-3 rounded-lg">
              <DocumentArrowDownIcon className="h-8 w-8" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Documento PDF</h4>
              <p className="text-sm text-gray-600">
                {resource.file_size ? `${Math.round(resource.file_size / 1024)} KB` : 'Tamaño desconocido'}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded border">
            <p className="text-gray-700 text-sm">
              Para ver el contenido completo del PDF, descarga el archivo o ábrelo en una nueva pestaña.
            </p>
            <div className="mt-3 flex space-x-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Abrir PDF
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Text preview
    if (resource.mime_type?.startsWith('text/') || 
        resource.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return (
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="bg-blue-500 text-white p-3 rounded-lg">
              <DocumentArrowDownIcon className="h-8 w-8" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Documento de Texto</h4>
              <p className="text-sm text-gray-600">
                {resource.file_size ? `${Math.round(resource.file_size / 1024)} KB` : 'Tamaño desconocido'}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
            <p className="text-gray-700 text-sm">
              Vista previa del contenido de texto disponible después de la descarga.
            </p>
          </div>
        </div>
      );
    }

    // Generic file preview
    return (
      <div className="bg-gray-100 p-8 rounded-lg text-center">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="bg-gray-500 text-white p-3 rounded-lg">
            <DocumentArrowDownIcon className="h-8 w-8" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{resource.original_filename}</h4>
            <p className="text-sm text-gray-600">
              Tipo: {resource.mime_type} • 
              Tamaño: {resource.file_size ? `${Math.round(resource.file_size / 1024)} KB` : 'Desconocido'}
            </p>
          </div>
        </div>
        <p className="text-gray-500 mb-4">
          Vista previa no disponible para este tipo de archivo
        </p>
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Descargar para ver contenido
        </Button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {resource.category_name && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mr-2">
                    {resource.category_name}
                  </span>
                )}
                <span className="text-gray-500">
                  {resource.library_type === 'public' ? 'Biblioteca Pública' : 'Mi Biblioteca'}
                </span>
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {resource.description && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
              <p className="text-gray-600 text-sm">{resource.description}</p>
            </div>
          )}
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Vista Previa</h4>
            {renderPreview()}
          </div>

          {/* Resource Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900">Archivo:</span>
              <p className="text-gray-600">{resource.original_filename}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">Tipo:</span>
              <p className="text-gray-600">{resource.file_type}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">Enviado:</span>
              <p className="text-gray-600">{resource.send_count || 0} veces</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">Creado:</span>
              <p className="text-gray-600">
                {new Date(resource.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          {/* Public library attribution */}
          {resource.library_type === 'public' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 text-center">
                Hecho y distribuido por MindHub. Derechos reservados.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <Button onClick={onClose} variant="outline">Cerrar</Button>
          <div className="flex space-x-2">
            <Button onClick={handleDownload} variant="outline">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button onClick={onSend} variant="primary">
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              Enviar a Paciente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};