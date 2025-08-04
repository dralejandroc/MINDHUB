/**
 * ClinimetrixSectionHeader - Header for assessment sections
 * 
 * Displays section information, descriptions, and contextual
 * information for the current assessment section.
 */

'use client';

import React from 'react';
import type { ClinimetrixProTemplateStructure } from '@/lib/api/clinimetrix-pro-client';

interface ClinimetrixSectionHeaderProps {
  section: {
    id: string;
    title: string;
    description?: string;
    order: number;
    conditional?: {
      dependsOn: string;
      value: any;
      logic: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
    };
    items: any[];
  };
  template: ClinimetrixProTemplateStructure;
  sectionIndex: number;
  className?: string;
}

export const ClinimetrixSectionHeader: React.FC<ClinimetrixSectionHeaderProps> = ({
  section,
  template,
  sectionIndex,
  className = ''
}) => {
  const totalSections = template.structure.sections.length;
  const isMultiSection = totalSections > 1;

  return (
    <div className={`clinimetrix-section-header bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b ${className}`}>
      {/* Section Navigation */}
      {isMultiSection && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-blue-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">
              Sección {sectionIndex + 1} de {totalSections}
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            {section.items.length} pregunta{section.items.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Section Title */}
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-gray-900">
          {section.title}
        </h2>
      </div>

      {/* Section Description */}
      {section.description && (
        <div className="mb-3">
          <p className="text-gray-700 leading-relaxed">
            {section.description}
          </p>
        </div>
      )}

      {/* Conditional Section Notice */}
      {section.conditional && (
        <div className="mb-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
          <div className="flex items-center text-blue-800">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              Esta sección se muestra basada en respuestas anteriores
            </span>
          </div>
        </div>
      )}

      {/* Special Instructions */}
      {getSpecialInstructions(section, template) && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-amber-800 mb-1">
                Instrucciones especiales:
              </h4>
              <p className="text-sm text-amber-700">
                {getSpecialInstructions(section, template)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Administration Mode Notice */}
      {template.metadata.administrationMode === 'clinician_administered' && (
        <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center text-purple-800">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              Administrado por clínico - Lea las preguntas al paciente
            </span>
          </div>
        </div>
      )}

      {/* Accessibility information */}
      <div className="sr-only" aria-live="polite">
        {isMultiSection && `Sección ${sectionIndex + 1} de ${totalSections}: ${section.title}.`}
        {section.description && `Descripción: ${section.description}`}
        {section.conditional && 'Esta es una sección condicional basada en respuestas anteriores.'}
      </div>
    </div>
  );
};

// Helper function to get special instructions based on section and template
function getSpecialInstructions(section: any, template: ClinimetrixProTemplateStructure): string | null {
  // Check for reversed items in this section
  const hasReversedItems = section.items.some((item: any) => item.reversed);
  if (hasReversedItems) {
    return 'Algunas preguntas en esta sección tienen puntuación invertida. Responda según su experiencia real.';
  }

  // Check for interactive components
  const hasInteractiveItems = section.items.some((item: any) => item.interactive);
  if (hasInteractiveItems) {
    return 'Esta sección incluye componentes interactivos. Siga las instrucciones específicas para cada pregunta.';
  }

  // Check for multi-factor items
  const hasMultiFactorItems = section.items.some((item: any) => item.multiFactor);
  if (hasMultiFactorItems) {
    return 'Algunas preguntas requieren múltiples respuestas. Complete todos los factores antes de continuar.';
  }

  // Template-specific instructions
  if (template.metadata.abbreviation === 'PANSS') {
    return 'Esta evaluación requiere entrenamiento especializado. Asegúrese de tener la certificación apropiada.';
  }

  if (template.metadata.abbreviation === 'MOCA') {
    return 'Mantenga materiales de dibujo disponibles. Algunas preguntas requieren interacción física.';
  }

  if (template.metadata.abbreviation === 'DY-BOCS') {
    return 'Las secciones subsiguientes pueden variar según las respuestas iniciales.';
  }

  return null;
}

export default ClinimetrixSectionHeader;