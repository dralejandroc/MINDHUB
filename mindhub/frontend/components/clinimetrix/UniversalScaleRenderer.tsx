'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Universal types for any scale
interface ScaleItem {
  id: string;
  itemNumber: number;
  questionText: string;
  responseType: 'likert' | 'yes_no' | 'multiple_choice' | 'text' | 'numeric' | 'visual_analog';
  responseOptions: Array<{
    value: string | number;
    label: string;
    score: number;
  }>;
  required: boolean;
  reverseScored?: boolean;
  scoringWeight?: number;
}

export interface UniversalScale {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  instructions: string[];
  category: string;
  totalItems: number;
  estimatedDurationMinutes: number;
  items: ScaleItem[];
  scoringRules: {
    method: 'sum' | 'weighted' | 'algorithm';
    maxScore: number;
    interpretationRules: Array<{
      minScore: number;
      maxScore: number;
      interpretation: string;
      severity: 'minimal' | 'mild' | 'moderate' | 'severe';
      recommendations?: string[];
    }>;
  };
  subscales?: Array<{
    name: string;
    itemIds: string[];
    maxScore: number;
  }>;
}

interface UniversalScaleRendererProps {
  scale: UniversalScale;
  patientId: string;
  administrationType: 'self_administered' | 'clinician_administered' | 'remote';
  onComplete: (results: ScaleResults) => void;
  onSave?: (responses: Record<string, any>) => void;
  autoSave?: boolean;
  showProgress?: boolean;
  enableBackNavigation?: boolean;
}

interface ScaleResults {
  scaleId: string;
  responses: Record<string, {
    itemId: string;
    value: string | number;
    score: number;
    responseTime: number;
  }>;
  scores: {
    totalScore: number;
    maxScore: number;
    subscaleScores?: Record<string, number>;
    interpretation: string;
    severity: string;
    recommendations: string[];
  };
  administrationMetadata: {
    startTime: Date;
    endTime: Date;
    durationSeconds: number;
    administrationType: string;
    patientId: string;
  };
}

export const UniversalScaleRenderer: React.FC<UniversalScaleRendererProps> = ({
  scale,
  patientId,
  administrationType,
  onComplete,
  onSave,
  autoSave = true,
  showProgress = true,
  enableBackNavigation = true
}) => {
  // State management
  const [currentCard, setCurrentCard] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [startTime] = useState(new Date());
  const [itemStartTime, setItemStartTime] = useState(new Date());
  const [isCompleted, setIsCompleted] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && onSave && Object.keys(responses).length > 0) {
      const saveTimer = setTimeout(() => {
        onSave(responses);
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(saveTimer);
    }
  }, [responses, autoSave, onSave]);

  // Calculate progress
  const progress = ((currentCard) / (scale.totalItems + 1)) * 100;

  // Handle option selection
  const selectOption = (itemId: string, value: string | number, score: number) => {
    const responseTime = (new Date().getTime() - itemStartTime.getTime()) / 1000;
    
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        itemId,
        value,
        score,
        responseTime
      }
    }));

    // Auto-advance for self-administered
    if (administrationType === 'self_administered') {
      setTimeout(() => {
        nextCard();
      }, 300);
    }
  };

  // Navigation functions
  const nextCard = () => {
    if (currentCard < scale.totalItems) {
      setCurrentCard(prev => prev + 1);
      setItemStartTime(new Date());
    } else {
      completeAssessment();
    }
  };

  const previousCard = () => {
    if (currentCard > 0) {
      setCurrentCard(prev => prev - 1);
      setItemStartTime(new Date());
    }
  };

  // Calculate scores and complete assessment
  const completeAssessment = () => {
    const endTime = new Date();
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    // Calculate total score
    let totalScore = 0;
    const processedResponses: Record<string, any> = {};

    scale.items.forEach(item => {
      const response = responses[item.id];
      if (response) {
        let score = response.score;
        
        // Apply reverse scoring if needed
        if (item.reverseScored) {
          const maxItemScore = Math.max(...item.responseOptions.map(opt => opt.score));
          score = maxItemScore - score;
        }

        // Apply weight if specified
        if (item.scoringWeight) {
          score = score * item.scoringWeight;
        }

        totalScore += score;
        processedResponses[item.id] = {
          ...response,
          score: score
        };
      }
    });

    // Calculate subscale scores if defined
    const subscaleScores: Record<string, number> = {};
    if (scale.subscales) {
      scale.subscales.forEach(subscale => {
        let subscaleScore = 0;
        subscale.itemIds.forEach(itemId => {
          const response = processedResponses[itemId];
          if (response) {
            subscaleScore += response.score;
          }
        });
        subscaleScores[subscale.name] = subscaleScore;
      });
    }

    // Find interpretation
    const interpretation = scale.scoringRules.interpretationRules.find(rule =>
      totalScore >= rule.minScore && totalScore <= rule.maxScore
    );

    const results: ScaleResults = {
      scaleId: scale.id,
      responses: processedResponses,
      scores: {
        totalScore,
        maxScore: scale.scoringRules.maxScore,
        subscaleScores: Object.keys(subscaleScores).length > 0 ? subscaleScores : undefined,
        interpretation: interpretation?.interpretation || 'No interpretation available',
        severity: interpretation?.severity || 'unknown',
        recommendations: interpretation?.recommendations || []
      },
      administrationMetadata: {
        startTime,
        endTime,
        durationSeconds,
        administrationType,
        patientId
      }
    };

    setIsCompleted(true);
    onComplete(results);
  };

  // Render welcome card
  const renderWelcomeCard = () => (
    <div className="bg-white rounded-3xl p-8 shadow-xl max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-clinimetrix-600 to-clinimetrix-800 text-white p-6 rounded-2xl mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">{scale.abbreviation}</h1>
        <p className="text-lg opacity-90">{scale.name}</p>
      </div>

      <div className="bg-clinimetrix-50 border-l-4 border-clinimetrix-500 p-6 rounded-lg mb-6">
        <h3 className="text-xl font-semibold text-clinimetrix-900 mb-4">Instrucciones importantes:</h3>
        <ul className="text-clinimetrix-800 space-y-2">
          {scale.instructions.map((instruction, index) => (
            <li key={index} className="flex items-start">
              <span className="text-clinimetrix-500 mr-2">•</span>
              <span>{instruction}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center">
        <div className="text-sm text-gray-600 mb-4">
          <p><strong>Número de preguntas:</strong> {scale.totalItems}</p>
          <p><strong>Tiempo estimado:</strong> {scale.estimatedDurationMinutes} minutos</p>
          <p><strong>Categoría:</strong> {scale.category}</p>
        </div>
        <button 
          onClick={nextCard}
          className="bg-gradient-to-r from-clinimetrix-600 to-clinimetrix-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-clinimetrix-700 hover:to-clinimetrix-800 transition-all duration-200 transform hover:scale-105"
        >
          Comenzar Evaluación
        </button>
      </div>
    </div>
  );

  // Render question card
  const renderQuestionCard = (itemIndex: number) => {
    const item = scale.items[itemIndex];
    if (!item) return null;

    const currentResponse = responses[item.id];

    return (
      <div className="bg-white rounded-3xl p-8 shadow-xl max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-clinimetrix-600 to-clinimetrix-700 text-white px-6 py-3 rounded-xl inline-block mb-6">
          <span className="font-semibold text-lg">
            Pregunta {item.itemNumber} de {scale.totalItems}
          </span>
        </div>

        <div className="text-xl text-gray-800 mb-8 leading-relaxed font-medium">
          {item.questionText}
        </div>

        <div className="space-y-4">
          {item.responseOptions.map((option, optionIndex) => (
            <button
              key={optionIndex}
              onClick={() => selectOption(item.id, option.value, option.score)}
              className={`
                w-full p-6 rounded-xl border-2 transition-all duration-200 text-left
                ${currentResponse?.value === option.value
                  ? 'bg-gradient-to-r from-clinimetrix-600 to-clinimetrix-700 text-white border-clinimetrix-600 transform scale-105 shadow-lg'
                  : 'bg-clinimetrix-50 border-clinimetrix-200 hover:border-clinimetrix-400 hover:bg-clinimetrix-100 hover:transform hover:scale-102'
                }
              `}
            >
              <span className="text-lg font-medium">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Manual navigation for clinician-administered */}
        {administrationType === 'clinician_administered' && currentResponse && (
          <div className="flex justify-between mt-8">
            {enableBackNavigation && currentCard > 1 && (
              <button
                onClick={previousCard}
                className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Anterior
              </button>
            )}
            <button
              onClick={nextCard}
              className="flex items-center px-6 py-3 bg-clinimetrix-600 text-white rounded-xl hover:bg-clinimetrix-700 transition-colors ml-auto"
            >
              {currentCard === scale.totalItems ? 'Finalizar' : 'Siguiente'}
              {currentCard < scale.totalItems && <ChevronRightIcon className="w-5 h-5 ml-2" />}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render completion message
  const renderCompletionCard = () => (
    <div className="bg-white rounded-3xl p-8 shadow-xl max-w-2xl mx-auto text-center">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl mb-6">
        <h1 className="text-2xl font-bold mb-2">✓ Evaluación Completada</h1>
        <p className="text-lg opacity-90">Muchas gracias por completar la evaluación</p>
      </div>

      <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg mb-6">
        <h3 className="text-xl font-semibold text-green-900 mb-4">Evaluación finalizada</h3>
        <p className="text-green-800 mb-4">
          <strong>Por favor, entregue el dispositivo a su médico o profesional de la salud</strong> para la revisión e interpretación de los resultados.
        </p>
        <p className="text-green-700">
          Los resultados de esta escala deben ser interpretados por un profesional capacitado en el contexto de una evaluación clínica completa.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinimetrix-50 to-white p-4 flex items-center justify-center">
      {/* Progress bar */}
      {showProgress && (
        <div className="fixed top-0 left-0 w-full h-2 bg-gray-200 z-50">
          <div 
            className="h-full bg-gradient-to-r from-clinimetrix-500 to-clinimetrix-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Back button */}
      {enableBackNavigation && currentCard > 0 && !isCompleted && administrationType !== 'self_administered' && (
        <button
          onClick={previousCard}
          className="fixed bottom-6 right-6 bg-clinimetrix-600 text-white p-4 rounded-full shadow-lg hover:bg-clinimetrix-700 transition-all duration-200 z-40"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}

      {/* Auto-save indicator */}
      {autoSave && Object.keys(responses).length > 0 && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm z-40">
          Guardado automático
        </div>
      )}

      {/* Main content */}
      {isCompleted ? (
        renderCompletionCard()
      ) : currentCard === 0 ? (
        renderWelcomeCard()
      ) : (
        renderQuestionCard(currentCard - 1)
      )}
    </div>
  );
};

export default UniversalScaleRenderer;