'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
  ClockIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import type { ClinimetrixProRegistry } from '@/lib/api/clinimetrix-pro-client';

// =============================================================================
// TYPES
// =============================================================================

interface ClinimetrixCardRendererProps {
  templateId: string;
  onComplete?: (results: AssessmentResults) => void;
  onExit?: () => void;
  patientId?: string;
  autoSave?: boolean;
  showProgress?: boolean;
  allowNavigation?: boolean;
  className?: string;
}

interface AssessmentResults {
  templateId: string;
  responses: ResponseData[];
  totalScore?: number;
  subscaleScores?: { [key: string]: number };
  completionTime: number;
  startTime: Date;
  endTime: Date;
}

interface ResponseData {
  itemId: string;
  itemNumber: number;
  responseValue: string;
  responseText?: string;
  responseTime: number;
  wasSkipped: boolean;
}

interface AssessmentItem {
  id: string;
  itemNumber: number;
  questionText: string;
  instructionText?: string;
  responseType: string;
  responseOptions?: ResponseOption[];
  required: boolean;
  subscale?: string;
}

interface ResponseOption {
  value: string;
  label: string;
  score?: number;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ClinimetrixCardRenderer({
  templateId,
  onComplete,
  onExit,
  patientId,
  autoSave = true,
  showProgress = true,
  allowNavigation = true,
  className = ''
}: ClinimetrixCardRendererProps) {
  const [template, setTemplate] = useState<ClinimetrixProRegistry | null>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, ResponseData>>(new Map());
  const [currentValue, setCurrentValue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState<Date>(new Date());
  const [itemStartTime, setItemStartTime] = useState<number>(Date.now());
  const [showHelp, setShowHelp] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentItem = assessmentData?.items?.[currentItemIndex];
  const totalItems = assessmentData?.items?.length || 0;
  const isLastItem = currentItemIndex === totalItems - 1;
  const completedItems = Array.from(responses.values()).filter(r => !r.wasSkipped && r.responseValue !== '').length;
  const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Initialize assessment
  useEffect(() => {
    loadAssessment();
  }, [templateId]);

  // Initialize current value from existing response
  useEffect(() => {
    if (currentItem) {
      const existingResponse = responses.get(currentItem.id);
      setCurrentValue(existingResponse?.responseValue || '');
      setItemStartTime(Date.now());
    }
  }, [currentItem, responses]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && currentItem && currentValue && currentValue !== (responses.get(currentItem.id)?.responseValue || '')) {
      const timeoutId = setTimeout(() => {
        handleSaveResponse();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [currentValue, currentItem, autoSave]);

  // Auto-advance functionality
  useEffect(() => {
    if (currentValue && currentItem && !isPaused) {
      const timeoutId = setTimeout(() => {
        if (canProceed()) {
          handleNext();
        }
      }, 1500); // Auto-advance after 1.5 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [currentValue, currentItem, isPaused]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load template metadata
      const templateData = await clinimetrixProClient.templates.getById(templateId);
      setTemplate(templateData);
      
      // Load assessment structure
      const assessmentStructure = await clinimetrixProClient.assessments.getStructure(templateId);
      setAssessmentData(assessmentStructure);
      
    } catch (err) {
      console.error('Error loading assessment:', err);
      setError('Error al cargar la evaluación');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResponse = useCallback(async () => {
    if (!currentItem || !currentValue) return;

    try {
      setIsSubmitting(true);
      
      const responseTime = Date.now() - itemStartTime;
      
      const responseData: ResponseData = {
        itemId: currentItem.id,
        itemNumber: currentItem.itemNumber,
        responseValue: currentValue,
        responseText: getResponseText(currentValue),
        responseTime,
        wasSkipped: false
      };

      setResponses(prev => new Map(prev.set(currentItem.id, responseData)));

      // Save to backend if auto-save is enabled
      if (autoSave) {
        await clinimetrixProClient.assessments.saveResponse(templateId, responseData);
      }

      console.log('Response saved:', responseData);
    } catch (error) {
      console.error('Failed to save response:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentItem, currentValue, itemStartTime, templateId, autoSave]);

  const getResponseText = (value: string): string => {
    if (!currentItem?.responseOptions) return value;
    const option = currentItem.responseOptions.find(opt => opt.value === value);
    return option?.label || value;
  };

  const canProceed = (): boolean => {
    if (!currentItem) return false;
    if (currentItem.required && !currentValue) return false;
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    await handleSaveResponse();
    
    if (isLastItem) {
      handleComplete();
    } else {
      setCurrentItemIndex(prev => Math.min(prev + 1, totalItems - 1));
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    }
  };

  const handleGoTo = (index: number) => {
    if (index >= 0 && index < totalItems) {
      setCurrentItemIndex(index);
    }
  };

  const handleSkip = async () => {
    if (!currentItem) return;

    const responseTime = Date.now() - itemStartTime;
    
    const responseData: ResponseData = {
      itemId: currentItem.id,
      itemNumber: currentItem.itemNumber,
      responseValue: '',
      responseTime,
      wasSkipped: true
    };

    setResponses(prev => new Map(prev.set(currentItem.id, responseData)));
    
    if (isLastItem) {
      handleComplete();
    } else {
      setCurrentItemIndex(prev => Math.min(prev + 1, totalItems - 1));
    }
  };

  const handleComplete = async () => {
    try {
      await handleSaveResponse();
      
      const results: AssessmentResults = {
        templateId,
        responses: Array.from(responses.values()),
        completionTime: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date()
      };

      // Submit complete assessment
      await clinimetrixProClient.assessments.submit(templateId, results);
      
      onComplete?.(results);
    } catch (error) {
      console.error('Failed to complete assessment:', error);
    }
  };

  const handleExit = () => {
    const hasUnsavedChanges = currentValue && currentValue !== (responses.get(currentItem?.id || '')?.responseValue || '');
    
    if (hasUnsavedChanges) {
      if (window.confirm('Tienes cambios no guardados. ¿Estás seguro que quieres salir?')) {
        onExit?.();
      }
    } else {
      onExit?.();
    }
  };

  const getResponseTime = () => {
    return Math.floor((Date.now() - itemStartTime) / 1000);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando evaluación...</h3>
          <p className="text-gray-500">Preparando {template?.name || 'la escala clínica'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <Alert variant="error">
          <p>{error}</p>
          <button
            onClick={loadAssessment}
            className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
          >
            Intentar de nuevo
          </button>
        </Alert>
      </div>
    );
  }

  if (!template || !assessmentData || !currentItem) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <Alert variant="error">
          <p>No se pudo cargar la evaluación</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-900">
                {template.abbreviation || template.name}
              </h1>
              <span className="text-sm text-gray-500">
                {template.name}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>{getResponseTime()}s</span>
              
              <button
                onClick={togglePause}
                className="ml-2 p-1 hover:bg-gray-100 rounded"
                title={isPaused ? "Reanudar" : "Pausar"}
              >
                {isPaused ? (
                  <PlayIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <PauseIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center space-x-1"
            >
              <QuestionMarkCircleIcon className="w-4 h-4" />
              <span>Ayuda</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExit}
              className="flex items-center space-x-1"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Salir</span>
            </Button>
            
            {showProgress && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {currentItemIndex + 1} / {totalItems}
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-teal-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-teal-800 mb-2">
                Información sobre {template.name}
              </h3>
              <p className="text-sm text-teal-700 mb-2">
                {template.description}
              </p>
              <div className="text-xs text-teal-600">
                <p>• Tiempo estimado: {template.estimatedDurationMinutes} minutos</p>
                <p>• Total de ítems: {template.totalItems}</p>
                <p>• Categoría: {template.category}</p>
                <p>• Auto-avance: Habilitado (se avanza automáticamente tras responder)</p>
                <p>• Navegación: Use los botones Anterior/Siguiente o haga clic en los números</p>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="ml-auto text-teal-400 hover:text-teal-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && (
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progreso: {completedItems} de {totalItems} completados
            </span>
            <span className="text-sm text-gray-500">
              {completionPercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-teal-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Assessment Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-lg font-bold text-teal-600">
                Pregunta {currentItemIndex + 1}
              </span>
              {currentItem.required && (
                <span className="text-red-500 text-lg">*</span>
              )}
              {currentItem.subscale && (
                <span className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {currentItem.subscale}
                </span>
              )}
            </div>
            
            <h2 className="text-xl font-medium text-gray-900 mb-4 leading-relaxed">
              {currentItem.questionText}
            </h2>
            
            {currentItem.instructionText && (
              <p className="text-sm text-gray-600 mb-6 italic">
                {currentItem.instructionText}
              </p>
            )}
          </div>

          {/* Response Options - Card Style */}
          <div className="grid gap-4 max-w-2xl mx-auto">
            {currentItem.responseOptions?.map((option, index) => (
              <div
                key={index}
                className={`
                  p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md
                  ${currentValue === option.value 
                    ? 'border-teal-500 bg-teal-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                  ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !isPaused && setCurrentValue(option.value)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${currentValue === option.value 
                        ? 'border-teal-500 bg-teal-500' 
                        : 'border-gray-300'
                      }
                    `}>
                      {currentValue === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-800 font-medium">{option.label}</span>
                  </div>
                  {option.score !== undefined && (
                    <span className="text-sm text-gray-500 font-mono">({option.score})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentItemIndex === 0 || !allowNavigation || isPaused}
              className="flex items-center space-x-2"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Anterior</span>
            </Button>
            
            {!currentItem.required && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isPaused}
                className="text-gray-500"
              >
                Omitir
              </Button>
            )}
            
            {isSubmitting && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
                <span>Guardando...</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {isPaused && (
              <span className="text-orange-600 text-sm font-medium">
                Auto-avance pausado
              </span>
            )}
            
            {!isLastItem ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isPaused}
                className="flex items-center space-x-2"
              >
                <span>Siguiente</span>
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || isPaused}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Completar Evaluación</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      {allowNavigation && totalItems > 1 && (
        <div className="bg-white rounded-lg p-4 mt-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Navegación Rápida</h3>
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: totalItems }, (_, index) => {
              const hasResponse = responses.has(assessmentData.items[index]?.id);
              
              return (
                <button
                  key={index}
                  onClick={() => handleGoTo(index)}
                  disabled={isPaused}
                  className={`
                    w-8 h-8 rounded text-sm font-medium transition-colors
                    ${currentItemIndex === index 
                      ? 'bg-teal-500 text-white' 
                      : hasResponse 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                    ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClinimetrixCardRenderer;