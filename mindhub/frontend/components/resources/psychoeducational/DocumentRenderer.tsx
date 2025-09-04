'use client';

import React, { useState } from 'react';
import { PsychoeducationalDocument, DocumentRendererProps } from '@/types/psychoeducational-documents';
import { DocumentHeader } from './components/DocumentHeader';
import { DocumentIntroduction } from './components/DocumentIntroduction';
import { DocumentSection } from './components/DocumentSection';
import { DocumentExercises } from './components/DocumentExercises';
import { DocumentBibliography } from './components/DocumentBibliography';
import { DocumentActions } from './components/DocumentActions';

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  document,
  patientId,
  isPreview = false,
  onDownload,
  onSendToPatient,
  className = ''
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const content = document.document;

  const handleSectionComplete = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  return (
    <div className={`max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
      {/* Header del Documento */}
      <DocumentHeader 
        metadata={content.metadata}
        context={content.context}
        tags={content.tags}
        isPreview={isPreview}
      />

      {/* Barra de Progreso */}
      {!isPreview && (
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Progreso de lectura</span>
            <span>{completedSections.size} / {content.content.sections.length} secciones completadas</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(completedSections.size / content.content.sections.length) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="px-6 py-8 space-y-8">
        
        {/* Introducción */}
        <DocumentIntroduction 
          introduction={content.content.introduction}
          estimatedTime={content.metadata.estimated_reading_time}
        />

        {/* Secciones */}
        <div className="space-y-6">
          {content.content.sections.map((section, index) => (
            <DocumentSection
              key={section.id}
              section={section}
              index={index}
              isActive={activeSection === section.id}
              isCompleted={completedSections.has(section.id)}
              onActivate={() => setActiveSection(section.id)}
              onComplete={() => handleSectionComplete(section.id)}
              isPreview={isPreview}
            />
          ))}
        </div>

        {/* Ejercicios */}
        {content.content.exercises && content.content.exercises.length > 0 && (
          <DocumentExercises 
            exercises={content.content.exercises}
            documentId={content.id}
            patientId={patientId}
          />
        )}

        {/* Puntos Clave */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <span className="mr-2">💡</span>
            Puntos Clave para Recordar
          </h3>
          <ul className="space-y-3">
            {content.content.key_takeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full flex items-center justify-center mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-blue-800">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mensaje de Cierre */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Mensaje Final</h3>
          <p className="text-green-800 mb-4">{content.content.closing.text}</p>
          
          {content.content.closing.emergency_note && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
              <div className="flex items-start">
                <span className="text-red-400 mr-2">⚠️</span>
                <p className="text-red-800 text-sm font-medium">
                  <strong>Importante:</strong> {content.content.closing.emergency_note}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bibliografía */}
        <DocumentBibliography 
          bibliography={content.bibliography}
          relatedResources={content.related_resources}
        />
      </div>

      {/* Acciones del Documento */}
      {!isPreview && (
        <DocumentActions
          document={document}
          patientId={patientId}
          onDownload={onDownload}
          onSendToPatient={onSendToPatient}
        />
      )}
    </div>
  );
};