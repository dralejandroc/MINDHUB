'use client';

import React from 'react';
import { Reference } from '@/types/psychoeducational-documents';
import { 
  BookOpenIcon, 
  AcademicCapIcon, 
  GlobeAltIcon, 
  NewspaperIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface DocumentBibliographyProps {
  bibliography: Reference[];
  relatedResources: string[];
}

export const DocumentBibliography: React.FC<DocumentBibliographyProps> = ({
  bibliography,
  relatedResources
}) => {
  const getReferenceIcon = (type: string) => {
    switch (type) {
      case 'book':
        return BookOpenIcon;
      case 'journal':
        return AcademicCapIcon;
      case 'article':
        return NewspaperIcon;
      case 'website':
        return GlobeAltIcon;
      default:
        return BookOpenIcon;
    }
  };

  const formatReference = (ref: Reference) => {
    const authors = ref.authors.join(', ');
    
    switch (ref.type) {
      case 'journal':
        return `${authors} (${ref.year}). ${ref.title}. ${ref.journal}${ref.volume ? `, ${ref.volume}` : ''}${ref.pages ? `, ${ref.pages}` : ''}.`;
      case 'book':
        return `${authors} (${ref.year}). ${ref.title}. ${ref.publisher}.`;
      case 'article':
        return `${authors} (${ref.year}). ${ref.title}. ${ref.source}.`;
      case 'website':
        return `${authors} (${ref.year}). ${ref.title}. ${ref.source}.`;
      default:
        return `${authors} (${ref.year}). ${ref.title}.`;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'journal':
        return 'Artículo Científico';
      case 'book':
        return 'Libro';
      case 'article':
        return 'Artículo';
      case 'website':
        return 'Sitio Web';
      default:
        return 'Referencia';
    }
  };

  if (!bibliography.length && !relatedResources.length) return null;

  return (
    <div className="space-y-6">
      {/* Bibliografía */}
      {bibliography.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpenIcon className="w-6 h-6 mr-2" />
            Referencias Bibliográficas
          </h3>
          
          <div className="space-y-4">
            {bibliography.map((ref, index) => {
              const ReferenceIcon = getReferenceIcon(ref.type);
              
              return (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                      <ReferenceIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {getTypeLabel(ref.type)}
                        </span>
                        <span className="text-xs text-gray-400">
                          #{index + 1}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2">
                        {formatReference(ref)}
                      </p>
                      
                      {/* Enlaces adicionales */}
                      <div className="flex flex-wrap gap-2">
                        {ref.doi && (
                          <a
                            href={`https://doi.org/${ref.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            DOI: {ref.doi}
                          </a>
                        )}
                        {ref.url && (
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Ver online
                          </a>
                        )}
                        {ref.isbn && (
                          <span className="text-xs text-gray-500">
                            ISBN: {ref.isbn}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recursos Relacionados */}
      {relatedResources.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Recursos Relacionados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relatedResources.map((resourceId, index) => (
              <div
                key={index}
                className="bg-white border border-blue-200 rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {resourceId}
                  </span>
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-700 mt-3">
            Haz clic en cualquier recurso para acceder a documentos complementarios
          </p>
        </div>
      )}

      {/* Nota sobre el contenido */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Nota importante:</strong> Este documento tiene fines educativos e informativos. 
              No reemplaza el consejo médico profesional, diagnóstico o tratamiento. 
              Siempre consulta con tu profesional de salud mental para obtener orientación específica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};