'use client';

import React from 'react';
import { DocumentMetadata, DocumentContext } from '@/types/psychoeducational-documents';
import { DOCUMENT_CATEGORIES } from '@/types/psychoeducational-documents';
import { 
  ClockIcon, 
  UserIcon, 
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DocumentHeaderProps {
  metadata: DocumentMetadata;
  context: DocumentContext;
  tags: string[];
  isPreview: boolean;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  metadata,
  context,
  tags,
  isPreview
}) => {
  const categoryConfig = DOCUMENT_CATEGORIES.find(cat => cat.id === metadata.category);
  
  const getEvidenceLevelConfig = (level: string) => {
    switch (level) {
      case 'high':
        return { label: 'Alta Evidencia', color: 'green', icon: CheckBadgeIcon };
      case 'moderate':
        return { label: 'Evidencia Moderada', color: 'yellow', icon: CheckBadgeIcon };
      case 'low':
        return { label: 'Evidencia Limitada', color: 'orange', icon: ExclamationTriangleIcon };
      case 'expert':
        return { label: 'Consenso de Expertos', color: 'blue', icon: UserIcon };
      default:
        return { label: 'No especificado', color: 'gray', icon: ExclamationTriangleIcon };
    }
  };

  const evidenceConfig = getEvidenceLevelConfig(context.evidence_level);
  const EvidenceIcon = evidenceConfig.icon;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          {/* Categoría */}
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2">{categoryConfig?.icon}</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              {categoryConfig?.name}
            </span>
          </div>

          {/* Título y Subtítulo */}
          <h1 className="text-3xl font-bold mb-2">{metadata.title}</h1>
          <p className="text-blue-100 text-lg mb-4">{metadata.subtitle}</p>

          {/* Metadatos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              <span>{metadata.estimated_reading_time} min de lectura</span>
            </div>
            <div className="flex items-center">
              <EvidenceIcon className={`w-4 h-4 mr-2`} />
              <span>{evidenceConfig.label}</span>
            </div>
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2" />
              <span>Rango: {context.age_range.min}-{context.age_range.max} años</span>
            </div>
          </div>
        </div>

        {/* Información del Autor */}
        <div className="ml-6 text-right">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <h4 className="font-semibold">{metadata.author.name}</h4>
            <p className="text-blue-200 text-sm">{metadata.author.credentials}</p>
            <p className="text-blue-200 text-sm">{metadata.author.institution}</p>
            <p className="text-blue-300 text-xs mt-2">v{metadata.version}</p>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-6">
        <p className="text-blue-100">{context.description}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 6).map((tag, index) => (
          <span
            key={index}
            className="bg-white/20 px-3 py-1 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
        {tags.length > 6 && (
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
            +{tags.length - 6} más
          </span>
        )}
      </div>

      {/* Condiciones Clínicas */}
      {context.clinical_conditions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <h4 className="font-medium mb-2 text-blue-200">Aplicable para:</h4>
          <div className="flex flex-wrap gap-2">
            {context.clinical_conditions.map((condition, index) => (
              <span
                key={index}
                className="bg-blue-500/30 px-2 py-1 rounded text-xs"
              >
                {condition.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Advertencias */}
      {context.contraindications.length > 0 && (
        <div className="mt-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-300 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-200 mb-1">Contraindicaciones:</h4>
              <ul className="text-yellow-100 text-sm space-y-1">
                {context.contraindications.map((contraindication, index) => (
                  <li key={index}>• {contraindication}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};