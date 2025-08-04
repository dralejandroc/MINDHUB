'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import type { ClinimetrixProRegistry } from '@/lib/api/clinimetrix-pro-client';

// =============================================================================
// TYPES
// =============================================================================

interface ClinimetrixPatientInterfaceProps {
  templateId: string;
  onComplete?: (results: AssessmentResults) => void;
  onExit?: () => void;
  patientId?: string;
  autoAdvanceDelay?: number;
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

export function ClinimetrixPatientInterface({
  templateId,
  onComplete,
  onExit,
  patientId,
  autoAdvanceDelay = 1500,
  className = ''
}: ClinimetrixPatientInterfaceProps) {
  const [template, setTemplate] = useState<ClinimetrixProRegistry | null>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, ResponseData>>(new Map());
  const [currentValue, setCurrentValue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState<Date>(new Date());
  const [itemStartTime, setItemStartTime] = useState<number>(Date.now());
  const [showHelp, setShowHelp] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentItem = assessmentData?.items?.[currentItemIndex];
  const totalItems = assessmentData?.items?.length || 0;
  const isLastItem = currentItemIndex === totalItems - 1;
  const completedItems = Array.from(responses.values()).filter(r => !r.wasSkipped && r.responseValue !== '').length;

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

  // Auto-advance functionality
  useEffect(() => {
    if (currentValue && currentItem && !isPaused && !showHelp) {
      const timeoutId = setTimeout(() => {
        handleAutoAdvance();
      }, autoAdvanceDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [currentValue, currentItem, isPaused, showHelp]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const templateData = await clinimetrixProClient.templates.getById(templateId);
      setTemplate(templateData);
      
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
    
    try {
      await clinimetrixProClient.assessments.saveResponse(templateId, responseData);
    } catch (error) {
      console.error('Failed to save response:', error);
    }
  }, [currentItem, currentValue, itemStartTime, templateId]);

  const getResponseText = (value: string): string => {
    if (!currentItem?.responseOptions) return value;
    const option = currentItem.responseOptions.find(opt => opt.value === value);
    return option?.label || value;
  };

  const handleAutoAdvance = async () => {
    if (!currentValue || isAnimating) return;

    setIsAnimating(true);
    await handleSaveResponse();
    
    setTimeout(() => {
      if (isLastItem) {
        handleComplete();
      } else {
        setCurrentItemIndex(prev => Math.min(prev + 1, totalItems - 1));
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleManualNext = async () => {
    if (!currentValue || isAnimating) return;
    setIsPaused(true); // Pause auto-advance temporarily
    await handleAutoAdvance();
    setTimeout(() => setIsPaused(false), 2000); // Resume after 2 seconds
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentItemIndex(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
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

      await clinimetrixProClient.assessments.submit(templateId, results);
      onComplete?.(results);
    } catch (error) {
      console.error('Failed to complete assessment:', error);
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    if (!isAnimating) {
      setCurrentValue(optionValue);
    }
  };

  const renderQuestionCard = () => {
    if (!currentItem) return null;

    return (
      <div 
        className={`transition-all duration-300 ${isAnimating ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'}`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.2) inset',
          border: '1px solid rgba(255,255,255,0.3)',
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        {/* Número de pregunta circular */}
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #29A98C, #112F33)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 30px',
          fontWeight: '600',
          fontSize: '1.2rem',
          boxShadow: '0 8px 20px rgba(41, 169, 140, 0.3)'
        }}>
          {currentItem.itemNumber}
        </div>

        {/* Título de la pregunta */}
        <h2 style={{
          color: '#112F33',
          fontSize: '1.5rem',
          marginBottom: '20px',
          fontWeight: '500',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          {currentItem.questionText}
          {currentItem.required && <span style={{ color: '#E74C3C', marginLeft: '8px' }}>*</span>}
        </h2>

        {/* Texto de instrucciones */}
        {currentItem.instructionText && (
          <p style={{
            color: '#666',
            fontSize: '1rem',
            textAlign: 'center',
            marginBottom: '40px',
            fontStyle: 'italic'
          }}>
            {currentItem.instructionText}
          </p>
        )}

        {/* Opciones de respuesta */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginTop: '40px'
        }}>
          {currentItem.responseOptions?.map((option, index) => {
            const isSelected = currentValue === option.value;
            
            return (
              <button
                key={`${option.value}-${index}`}
                onClick={() => handleOptionSelect(option.value)}
                disabled={isAnimating}
                style={{
                  background: isSelected 
                    ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                    : 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid',
                  borderColor: isSelected ? '#29A98C' : 'rgba(226, 232, 240, 0.8)',
                  borderRadius: '16px',
                  padding: '18px 24px',
                  cursor: isAnimating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'left',
                  fontSize: '1.1rem',
                  lineHeight: '1.5',
                  color: isSelected ? 'white' : '#112F33',
                  fontWeight: isSelected ? '600' : '500',
                  transform: isSelected ? 'translateY(-3px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: isSelected 
                    ? '0 12px 24px rgba(41, 169, 140, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset' 
                    : '0 4px 12px rgba(0,0,0,0.08)',
                  opacity: isAnimating ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isAnimating) {
                    e.currentTarget.style.borderColor = '#29A98C';
                    e.currentTarget.style.background = 'rgba(41, 169, 140, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(41, 169, 140, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isAnimating) {
                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando evaluación...</h3>
          <p className="text-gray-500">Preparando su escala clínica</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
          maxWidth: '400px'
        }}>
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAssessment}
            style={{
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!template || !assessmentData || !currentItem) {
    return null;
  }

  return (
    <div 
      className={`min-h-screen p-6 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {/* Controles flotantes discretos */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 100
      }}>
        {/* Botón de ayuda */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: showHelp 
              ? 'linear-gradient(135deg, #29A98C, #112F33)' 
              : 'rgba(255,255,255,0.9)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: showHelp ? 'white' : '#112F33',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
        </button>

        {/* Botón de pausa */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isPaused 
              ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
              : 'rgba(255,255,255,0.9)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isPaused ? 'white' : '#112F33',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
        >
          {isPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Indicador de progreso discreto */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '20px',
        padding: '8px 16px',
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#112F33',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        zIndex: 100
      }}>
        {currentItemIndex + 1} / {totalItems}
      </div>

      {/* Panel de ayuda */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '20px',
          maxWidth: '300px',
          boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
          zIndex: 101
        }}>
          <h4 style={{ color: '#112F33', fontWeight: '600', marginBottom: '12px' }}>
            {template.name}
          </h4>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '12px' }}>
            {template.description}
          </p>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>
            <p>• Auto-avance activado</p>
            <p>• {template.estimatedDurationMinutes} min estimados</p>
            {isPaused && <p style={{ color: '#f59e0b' }}>• En pausa</p>}
          </div>
        </div>
      )}

      {/* Contenido principal centrado */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl">
          {renderQuestionCard()}
          
          {/* Controles de navegación discretos */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '30px',
            paddingLeft: '20px',
            paddingRight: '20px'
          }}>
            <button
              onClick={handlePrevious}
              disabled={currentItemIndex === 0 || isAnimating}
              style={{
                background: currentItemIndex === 0 ? 'transparent' : 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                cursor: currentItemIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentItemIndex === 0 ? 'transparent' : '#112F33',
                boxShadow: currentItemIndex === 0 ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                opacity: isAnimating ? 0.5 : 1
              }}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {!isLastItem && currentValue && (
              <button
                onClick={handleManualNext}
                disabled={isAnimating}
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  cursor: isAnimating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#112F33',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  opacity: isAnimating ? 0.5 : 1
                }}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            )}

            {isLastItem && currentValue && (
              <button
                onClick={handleComplete}
                disabled={isAnimating}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  cursor: isAnimating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.3s ease',
                  opacity: isAnimating ? 0.5 : 1
                }}
              >
                <CheckCircleIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClinimetrixPatientInterface;