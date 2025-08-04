/**
 * ClinimetrixProgressIndicator - Shows assessment progress
 * 
 * Displays current section, item, and overall progress
 * with visual indicators and accessibility support.
 */

'use client';

import React from 'react';
import type { ClinimetrixProTemplateStructure } from '@/lib/api/clinimetrix-pro-client';

interface ClinimetrixProgressIndicatorProps {
  template: ClinimetrixProTemplateStructure;
  currentSectionIndex: number;
  currentItemIndex: number;
  responses: { [itemId: string]: any };
  percentage: number;
  className?: string;
}

export const ClinimetrixProgressIndicator: React.FC<ClinimetrixProgressIndicatorProps> = ({
  template,
  currentSectionIndex,
  currentItemIndex,
  responses,
  percentage,
  className = ''
}) => {
  const currentSection = template.structure.sections[currentSectionIndex];
  const currentItem = currentSection?.items[currentItemIndex];
  
  // Calculate item position globally
  let globalItemPosition = 0;
  for (let i = 0; i < currentSectionIndex; i++) {
    globalItemPosition += template.structure.sections[i].items.length;
  }
  globalItemPosition += currentItemIndex + 1;

  // Calculate section progress
  const sectionResponses = currentSection?.items.filter(item => 
    responses[item.id] !== undefined && responses[item.id] !== null
  ).length || 0;
  const sectionPercentage = currentSection 
    ? Math.round((sectionResponses / currentSection.items.length) * 100)
    : 0;

  return (
    <div className={`clinimetrix-progress-indicator bg-white shadow-sm border-b ${className}`}>
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Header Info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {template.metadata.name}
            </h2>
            <div className="text-sm text-gray-600">
              {template.metadata.abbreviation} • {template.metadata.category}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {percentage}%
            </div>
            <div className="text-sm text-gray-600">
              Completado
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progreso general</span>
            <span>
              {globalItemPosition} de {template.structure.totalItems} preguntas
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso general: ${percentage}% completado`}
            />
          </div>
        </div>

        {/* Section Progress */}
        {template.structure.sections.length > 1 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                Sección: {currentSection?.title || `Sección ${currentSectionIndex + 1}`}
              </span>
              <span>
                {sectionResponses} de {currentSection?.items.length || 0} respondidas
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${sectionPercentage}%` }}
                role="progressbar"
                aria-valuenow={sectionPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progreso de sección: ${sectionPercentage}% completado`}
              />
            </div>
          </div>
        )}

        {/* Section Navigation Dots */}
        {template.structure.sections.length > 1 && (
          <div className="flex items-center justify-center space-x-2">
            {template.structure.sections.map((section, index) => {
              const sectionCompleted = section.items.every(item =>
                responses[item.id] !== undefined && responses[item.id] !== null
              );
              const isCurrent = index === currentSectionIndex;
              const isAccessible = index <= currentSectionIndex; // Can only access current or previous sections

              return (
                <div
                  key={section.id}
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
                    ${isCurrent
                      ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                      : sectionCompleted
                      ? 'bg-green-500 text-white'
                      : isAccessible
                      ? 'bg-gray-300 text-gray-600'
                      : 'bg-gray-100 text-gray-400'
                    }
                  `}
                  title={section.title || `Sección ${index + 1}`}
                  aria-label={`
                    Sección ${index + 1}: ${section.title || 'Sin título'}
                    ${isCurrent ? ' (actual)' : ''}
                    ${sectionCompleted ? ' (completada)' : ''}
                  `}
                >
                  {sectionCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Current Item Info */}
        {currentItem && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              Pregunta actual: <span className="font-medium">#{currentItem.number}</span>
              {currentItem.required && (
                <span className="text-red-500 ml-1" title="Pregunta requerida">*</span>
              )}
            </div>
          </div>
        )}

        {/* Estimated Time Remaining */}
        {template.metadata.estimatedDurationMinutes && (
          <div className="mt-2 text-center text-xs text-gray-500">
            Tiempo estimado: {Math.round(template.metadata.estimatedDurationMinutes * (1 - percentage / 100))} min restantes
          </div>
        )}
      </div>

      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite">
        Progreso: {percentage}% completado. 
        Pregunta {globalItemPosition} de {template.structure.totalItems}.
        {currentSection && ` Sección: ${currentSection.title || `Sección ${currentSectionIndex + 1}`}.`}
      </div>
    </div>
  );
};

export default ClinimetrixProgressIndicator;