'use client';

import React, { useState } from 'react';
import { DocumentSection as DocumentSectionType } from '@/types/psychoeducational-documents';
import { 
  CheckCircleIcon, 
  PlayCircleIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface DocumentSectionProps {
  section: DocumentSectionType;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onActivate: () => void;
  onComplete: () => void;
  isPreview: boolean;
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  section,
  index,
  isActive,
  isCompleted,
  onActivate,
  onComplete,
  isPreview
}) => {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div className={`
      border rounded-lg transition-all duration-300
      ${isActive ? 'border-blue-500 shadow-md' : 'border-gray-200'}
      ${isCompleted ? 'bg-green-50 border-green-300' : 'bg-white'}
    `}>
      {/* Header de la Sección */}
      <div 
        className="p-6 cursor-pointer"
        onClick={onActivate}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
            `}>
              {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : index + 1}
            </div>
            <h3 className={`text-xl font-semibold ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
              {section.title}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isPreview && (
              <PlayCircleIcon className={`w-6 h-6 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
            )}
            {isActive ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Contenido de la Sección */}
      {isActive && (
        <div className="px-6 pb-6 space-y-6">
          {/* Contenido Principal */}
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed">{section.content}</p>
          </div>

          {/* Pasos de la Técnica */}
          {section.steps && section.steps.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Pasos a Seguir</h4>
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center"
                >
                  {showSteps ? 'Ocultar pasos' : 'Mostrar pasos'}
                  {showSteps ? (
                    <ChevronDownIcon className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  )}
                </button>
              </div>
              
              {showSteps && (
                <div className="space-y-3">
                  {section.steps.map((step) => (
                    <div key={step.number} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                          {step.number}
                        </span>
                        <div>
                          <p className="font-medium text-blue-900">{step.instruction}</p>
                          <p className="text-blue-700 text-sm mt-1">{step.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {section.tips && section.tips.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                <ExclamationCircleIcon className="w-5 h-5 mr-2" />
                Consejos Útiles
              </h4>
              <ul className="space-y-2">
                {section.tips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-600 mr-2 mt-1">•</span>
                    <span className="text-yellow-800 text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Horario de Práctica */}
          {section.practice_schedule && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" />
                Programa de Práctica
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-purple-800">Frecuencia:</span>
                  <p className="text-purple-700">{section.practice_schedule.frequency}</p>
                </div>
                <div>
                  <span className="font-medium text-purple-800">Duración:</span>
                  <p className="text-purple-700">{section.practice_schedule.duration}</p>
                </div>
                <div>
                  <span className="font-medium text-purple-800">Mejores momentos:</span>
                  <p className="text-purple-700">
                    {section.practice_schedule.best_times.map(time => {
                      const timeMap: Record<string, string> = {
                        morning: 'Mañana',
                        afternoon: 'Tarde',
                        evening: 'Noche',
                        before_sleep: 'Antes de dormir'
                      };
                      return timeMap[time] || time;
                    }).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botón de Completar */}
          {!isPreview && !isCompleted && (
            <div className="flex justify-end">
              <button
                onClick={onComplete}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Marcar como Completada
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};