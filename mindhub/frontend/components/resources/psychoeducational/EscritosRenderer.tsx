'use client';

import React, { useState } from 'react';
import { 
  BookOpenIcon, 
  ClockIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  PrinterIcon,
  EnvelopeIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface EscritosRendererProps {
  document: any;
  patientId?: string;
  onDownload?: (format: 'pdf' | 'json' | 'html') => void;
  onSendToPatient?: (method: 'email' | 'whatsapp') => void;
  className?: string;
}

export const EscritosRenderer: React.FC<EscritosRendererProps> = ({
  document,
  patientId,
  onDownload,
  onSendToPatient,
  className = ''
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const docData = document.document;
  const sections = docData.sections || [];
  
  const handleSectionComplete = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  const getTargetAudienceIcon = (audience: string | string[]) => {
    if (Array.isArray(audience)) {
      audience = audience[0];
    }
    
    switch (audience) {
      case 'patients':
        return '👤';
      case 'caregivers':
        return '👨‍👩‍👧‍👦';
      case 'adolescents':
        return '👨‍🎓';
      case 'adults':
        return '👩‍💼';
      case 'elderly':
        return '👴';
      default:
        return '👥';
    }
  };

  const getEvidenceLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expert':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEvidenceLevelLabel = (level: string) => {
    switch (level) {
      case 'high':
        return 'Alta Evidencia';
      case 'moderate':
        return 'Evidencia Moderada';
      case 'low':
        return 'Evidencia Limitada';
      case 'expert':
        return 'Consenso de Expertos';
      default:
        return 'Sin clasificar';
    }
  };

  return (
    <div className={`max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
      {/* Header del Documento */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <BookOpenIcon className="h-6 w-6 mr-2" />
              <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
                Documento Psicoeducativo
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{docData.title}</h1>
            
            <div className="flex items-center space-x-4 text-sm opacity-90">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>{docData.estimated_reading_time || docData.reading_time || 5} min de lectura</span>
              </div>
              
              <div className="flex items-center">
                <span className="mr-1">{getTargetAudienceIcon(docData.target_audience)}</span>
                <span>
                  {Array.isArray(docData.target_audience) 
                    ? docData.target_audience.join(', ') 
                    : docData.target_audience || 'Pacientes'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="ml-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getEvidenceLevelColor(docData.evidence_level)}`}>
              <CheckBadgeIcon className="h-3 w-3 inline mr-1" />
              {getEvidenceLevelLabel(docData.evidence_level)}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="px-6 py-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Progreso de lectura</span>
          <span>{completedSections.size} / {sections.length} secciones completadas</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${sections.length > 0 ? (completedSections.size / sections.length) * 100 : 0}%` 
            }}
          />
        </div>
      </div>

      {/* Introducción */}
      {docData.introduction && (
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Introducción</h2>
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              {docData.introduction.content}
            </p>
            {docData.introduction.key_points && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Puntos Clave:</h3>
                <ul className="space-y-1">
                  {docData.introduction.key_points.map((point: string, index: number) => (
                    <li key={index} className="text-blue-800 flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Secciones del Contenido */}
      <div className="divide-y divide-gray-200">
        {sections.map((section: any, index: number) => {
          const isCompleted = completedSections.has(section.id);
          const isActive = activeSection === section.id;
          
          return (
            <div key={section.id} className="p-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setActiveSection(isActive ? null : section.id)}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </span>
                  {section.title}
                </h3>
                <div className="text-2xl text-gray-400">
                  {isActive ? '−' : '+'}
                </div>
              </div>
              
              {isActive && (
                <div className="mt-4 ml-9 prose prose-blue max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {section.content}
                  </p>
                  
                  {section.tips && (
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-yellow-900 mb-2">💡 Consejos Prácticos:</h4>
                      <ul className="space-y-2">
                        {section.tips.map((tip: string, tipIndex: number) => (
                          <li key={tipIndex} className="text-yellow-800 flex items-start">
                            <span className="text-yellow-600 mr-2">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {section.steps && (
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-green-900 mb-2">📋 Pasos a Seguir:</h4>
                      <ol className="space-y-2">
                        {section.steps.map((step: any, stepIndex: number) => (
                          <li key={stepIndex} className="text-green-800 flex items-start">
                            <span className="text-green-600 font-bold mr-2 min-w-[24px]">
                              {step.step_number || stepIndex + 1}.
                            </span>
                            <div>
                              <div className="font-medium">{step.instruction}</div>
                              {step.detail && (
                                <div className="text-sm text-green-700 mt-1">{step.detail}</div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  {!isCompleted && (
                    <Button
                      onClick={() => handleSectionComplete(section.id)}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      Marcar como Completada
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Puntos Clave */}
      {docData.key_takeaways && (
        <div className="p-6 bg-indigo-50 border-t">
          <h2 className="text-xl font-semibold text-indigo-900 mb-4">🎯 Puntos Clave para Recordar</h2>
          <ul className="space-y-2">
            {docData.key_takeaways.map((takeaway: string, index: number) => (
              <li key={index} className="text-indigo-800 flex items-start">
                <span className="text-indigo-600 mr-2 font-bold">•</span>
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conclusión */}
      {docData.closing && (
        <div className="p-6 bg-gray-50 border-t">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Conclusión</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            {docData.closing.content}
          </p>
          {docData.closing.emergency_note && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    ⚠️ Importante
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {docData.closing.emergency_note}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Referencias */}
      {docData.references && docData.references.length > 0 && (
        <div className="p-6 bg-gray-50 border-t">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 Referencias</h2>
          <div className="space-y-2">
            {docData.references.map((ref: any, index: number) => (
              <div key={index} className="text-sm text-gray-700 p-3 bg-white rounded border">
                <div className="font-medium">{ref.authors} ({ref.year})</div>
                <div className="italic">{ref.title}</div>
                <div className="text-gray-600">{ref.source}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {docData.tags && docData.tags.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex flex-wrap gap-2">
            {docData.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Acciones del Documento */}
      <div className="p-6 bg-white border-t">
        <div className="flex flex-wrap gap-2">
          {onDownload && (
            <>
              <Button
                onClick={() => onDownload('pdf')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                PDF
              </Button>
              <Button
                onClick={() => onDownload('json')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                JSON
              </Button>
            </>
          )}
          
          {onSendToPatient && patientId && (
            <>
              <Button
                onClick={() => onSendToPatient('email')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <EnvelopeIcon className="h-4 w-4" />
                Enviar por Email
              </Button>
              <Button
                onClick={() => onSendToPatient('whatsapp')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
                WhatsApp
              </Button>
            </>
          )}
          
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <PrinterIcon className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
};