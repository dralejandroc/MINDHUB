/**
 * ClinimetrixRenderer - Universal Dynamic Scale Renderer
 * 
 * This component can render any psychometric scale based on JSON templates
 * from the ClinimetrixPro system. It handles all response types, navigation,
 * progress tracking, and scoring automatically.
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { clinimetrixProClient, type ClinimetrixAssessment } from '@/lib/api/clinimetrix-pro-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/shared/Alert';

// Response type components (we'll create these next)
import { LikertScaleRenderer } from './response-types/LikertScaleRenderer';
import { BinaryResponseRenderer } from './response-types/BinaryResponseRenderer';
import { MultipleChoiceRenderer } from './response-types/MultipleChoiceRenderer';
import { NumericInputRenderer } from './response-types/NumericInputRenderer';
import { TextInputRenderer } from './response-types/TextInputRenderer';
import { InteractiveComponentRenderer } from './response-types/InteractiveComponentRenderer';
import { MultiFactorRenderer } from './response-types/MultiFactorRenderer';

// Navigation and progress components
import { ClinimetrixProgressIndicator } from './navigation/ClinimetrixProgressIndicator';
import { ClinimetrixNavigationControls } from './navigation/ClinimetrixNavigationControls';
import { ClinimetrixSectionHeader } from './navigation/ClinimetrixSectionHeader';

// =================== TYPES ===================

export interface ClinimetrixRendererProps {
  templateId: string;
  assessmentId?: string;
  patientId?: string;
  administratorId: string;
  mode?: 'new' | 'resume' | 'review';
  onComplete?: (assessment: ClinimetrixAssessment) => void;
  onSave?: (assessment: ClinimetrixAssessment) => void;
  onCancel?: () => void;
  className?: string;
}

interface RendererState {
  template: any | null;
  assessment: ClinimetrixAssessment | null;
  currentSectionIndex: number;
  currentItemIndex: number;
  responses: { [itemId: string]: any };
  loading: boolean;
  error: string | null;
  saving: boolean;
  completed: boolean;
  showHelpModal: boolean;
}

// =================== MAIN COMPONENT ===================

export const ClinimetrixRenderer: React.FC<ClinimetrixRendererProps> = ({
  templateId,
  assessmentId,
  patientId,
  administratorId,
  mode = 'new',
  onComplete,
  onSave,
  onCancel,
  className = ''
}) => {
  // =================== STATE ===================
  
  const [state, setState] = useState<RendererState>({
    template: null,
    assessment: null,
    currentSectionIndex: 0,
    currentItemIndex: 0,
    responses: {},
    loading: true,
    error: null,
    saving: false,
    completed: false,
    showHelpModal: false
  });

  // =================== COMPUTED VALUES ===================

  const currentSection = useMemo(() => {
    if (!state.template) return null;
    return state.template.structure.sections[state.currentSectionIndex] || null;
  }, [state.template, state.currentSectionIndex]);

  const currentItem = useMemo(() => {
    if (!currentSection) return null;
    return currentSection.items[state.currentItemIndex] || null;
  }, [currentSection, state.currentItemIndex]);

  const progressPercentage = useMemo(() => {
    if (!state.template) return 0;
    const totalItems = state.template.structure.totalItems;
    const completedItems = Object.keys(state.responses).length;
    return Math.round((completedItems / totalItems) * 100);
  }, [state.template, state.responses]);

  const canNavigateNext = useMemo(() => {
    if (!currentItem || !currentSection) return false;
    
    // Check if current item is required and has response
    if (currentItem.required && !state.responses[currentItem.id]) {
      return false;
    }

    return true;
  }, [currentItem, currentSection, state.responses]);

  const canNavigatePrevious = useMemo(() => {
    return state.currentSectionIndex > 0 || state.currentItemIndex > 0;
  }, [state.currentSectionIndex, state.currentItemIndex]);

  const isLastItem = useMemo(() => {
    if (!state.template) return false;
    const lastSectionIndex = state.template.structure.sections.length - 1;
    const lastSection = state.template.structure.sections[lastSectionIndex];
    const lastItemIndex = lastSection ? lastSection.items.length - 1 : 0;
    
    return state.currentSectionIndex === lastSectionIndex && 
           state.currentItemIndex === lastItemIndex;
  }, [state.template, state.currentSectionIndex, state.currentItemIndex]);

  // =================== EFFECTS ===================

  // Load template and assessment on mount
  useEffect(() => {
    loadTemplateAndAssessment();
  }, [templateId, assessmentId]);

  // Auto-save responses periodically
  useEffect(() => {
    if (state.assessment && Object.keys(state.responses).length > 0) {
      const autoSaveInterval = setInterval(() => {
        autoSaveResponses();
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [state.assessment, state.responses]);

  // =================== HANDLERS ===================

  const loadTemplateAndAssessment = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Load template
      const templateResponse = await clinimetrixProClient.getTemplate(templateId);

      let assessment: ClinimetrixAssessment | null = null;

      if (assessmentId) {
        // Load existing assessment
        assessment = await clinimetrixProClient.getAssessment(assessmentId);
      } else if (mode === 'new' && patientId) {
        // Create new assessment
        assessment = await clinimetrixProClient.createAssessment({
          templateId,
          patientId,
          administratorId,
          mode: 'professional'
        });
      }

      setState(prev => ({
        ...prev,
        template: templateResponse,
        assessment,
        responses: assessment?.responses || {},
        currentSectionIndex: 0,
        currentItemIndex: assessment?.currentStep || 0,
        loading: false
      }));

    } catch (error) {
      console.error('Error loading template/assessment:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load assessment'
      }));
    }
  };

  const handleResponseChange = useCallback((itemId: string, value: any) => {
    setState(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [itemId]: value
      }
    }));
  }, []);

  const autoSaveResponses = async () => {
    if (!state.assessment || state.saving) return;

    try {
      setState(prev => ({ ...prev, saving: true }));
      
      await clinimetrixProClient.updateAssessmentResponses(
        state.assessment!.id, 
        state.responses
      );
      
      setState(prev => ({ ...prev, saving: false }));
    } catch (error) {
      console.error('Auto-save failed:', error);
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const navigateNext = useCallback(() => {
    if (!canNavigateNext || !state.template) return;

    setState(prev => {
      const currentSec = prev.template!.structure.sections[prev.currentSectionIndex];
      const isLastItemInSection = prev.currentItemIndex >= currentSec.items.length - 1;

      if (isLastItemInSection) {
        // Move to next section
        const nextSectionIndex = prev.currentSectionIndex + 1;
        return {
          ...prev,
          currentSectionIndex: nextSectionIndex,
          currentItemIndex: 0
        };
      } else {
        // Move to next item in current section
        return {
          ...prev,
          currentItemIndex: prev.currentItemIndex + 1
        };
      }
    });
  }, [canNavigateNext, state.template]);

  const navigatePrevious = useCallback(() => {
    if (!canNavigatePrevious || !state.template) return;

    setState(prev => {
      if (prev.currentItemIndex > 0) {
        // Move to previous item in current section
        return {
          ...prev,
          currentItemIndex: prev.currentItemIndex - 1
        };
      } else {
        // Move to previous section
        const prevSectionIndex = prev.currentSectionIndex - 1;
        const prevSection = prev.template!.structure.sections[prevSectionIndex];
        return {
          ...prev,
          currentSectionIndex: prevSectionIndex,
          currentItemIndex: prevSection.items.length - 1
        };
      }
    });
  }, [canNavigatePrevious, state.template]);

  const handleComplete = async () => {
    if (!state.assessment) return;

    try {
      setState(prev => ({ ...prev, saving: true }));
      
      const response = await clinimetrixProClient.completeAssessment(
        state.assessment!.id, 
        { responses: state.responses }
      );
      
      setState(prev => ({ 
        ...prev, 
        completed: true, 
        assessment: response.assessment,
        saving: false 
      }));
      
      if (onComplete) {
        onComplete(response.assessment);
      }
    } catch (error) {
      console.error('Error completing assessment:', error);
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const handleSave = async () => {
    if (!state.assessment) return;

    try {
      setState(prev => ({ ...prev, saving: true }));
      
      const response = await clinimetrixProClient.updateAssessmentResponses(
        state.assessment!.id, 
        state.responses
      );
      
      setState(prev => ({ ...prev, saving: false }));
      
      if (onSave) {
        onSave(response);
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const handleShowHelp = () => {
    setState(prev => ({ ...prev, showHelpModal: true }));
  };

  const handleCloseHelp = () => {
    setState(prev => ({ ...prev, showHelpModal: false }));
  };

  // Helper function to generate help content for an item
  const getHelpContent = (item: any) => {
    if (item.helpText) {
      return item.helpText;
    }

    // Generate default help based on response type
    const defaultHelp = {
      likert: "Selecciona la opción que mejor describe tu experiencia o situación. Las opciones van desde la menor hasta la mayor intensidad.",
      binary: "Selecciona 'Sí' si la afirmación se aplica a ti, o 'No' si no se aplica.",
      multiple_choice: "Selecciona una de las opciones disponibles que mejor describa tu situación.",
      numeric: "Ingresa un número que represente tu respuesta. Asegúrate de que esté dentro del rango permitido.",
      text: "Escribe tu respuesta de forma libre y detallada. Sé honesto y específico en tu respuesta."
    };

    return defaultHelp[item.responseType as keyof typeof defaultHelp] || 
           "Lee cuidadosamente la pregunta y selecciona o escribe la respuesta que mejor refleje tu situación actual.";
  };

  // =================== RESPONSE TYPE RENDERER ===================

  const renderResponseComponent = () => {
    if (!currentItem) return null;

    const commonProps = {
      item: currentItem,
      value: state.responses[currentItem.id],
      onChange: (value: any) => handleResponseChange(currentItem.id, value),
      responseGroups: state.template?.responseGroups
    };

    switch (currentItem.responseType) {
      case 'likert':
      case 'likert_5':
      case 'likert_7':
        return <LikertScaleRenderer {...commonProps} />;
      
      case 'binary':
      case 'yes_no':
      case 'true_false':
        return <BinaryResponseRenderer {...commonProps} />;
      
      case 'multiple_choice':
      case 'single_select':
        return <MultipleChoiceRenderer {...commonProps} />;
      
      case 'numeric':
      case 'number':
        return <NumericInputRenderer {...commonProps} />;
      
      case 'text':
      case 'open_text':
        return <TextInputRenderer {...commonProps} />;
      
      case 'interactive':
        return <InteractiveComponentRenderer {...commonProps} />;
      
      case 'multi_factor':
        return <MultiFactorRenderer {...commonProps} />;
      
      default:
        return (
          <Alert variant="warning">
            Tipo de respuesta no soportado: {currentItem.responseType}
          </Alert>
        );
    }
  };

  // =================== RENDER ===================

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg">Cargando evaluación...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <Alert variant="error" className="max-w-md mx-auto">
        <h3 className="font-semibold mb-2">Error al cargar la evaluación</h3>
        <p>{state.error}</p>
        <Button 
          onClick={loadTemplateAndAssessment} 
          className="mt-3"
          variant="outline"
        >
          Reintentar
        </Button>
      </Alert>
    );
  }

  if (state.completed) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-green-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Evaluación Completada
        </h2>
        <p className="text-gray-600 mb-6">
          {state.template?.metadata.name} se ha completado exitosamente.
        </p>
        <div className="space-x-4">
          <Button onClick={() => onComplete?.(state.assessment!)}>
            Ver Resultados
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cerrar
          </Button>
        </div>
      </Card>
    );
  }

  if (!state.template || !currentSection || !currentItem) {
    return (
      <Alert variant="error">
        No se pudo cargar la estructura de la evaluación.
      </Alert>
    );
  }

  return (
    <div className={`clinimetrix-renderer ${className}`}>
      {/* Progress Indicator */}
      <ClinimetrixProgressIndicator
        template={state.template}
        currentSectionIndex={state.currentSectionIndex}
        currentItemIndex={state.currentItemIndex}
        responses={state.responses}
        percentage={progressPercentage}
      />

      {/* Main Content */}
      <Card className="max-w-4xl mx-auto">
        {/* Section Header */}
        <ClinimetrixSectionHeader
          section={currentSection}
          template={state.template}
          sectionIndex={state.currentSectionIndex}
        />

        {/* Question Content */}
        <div className="px-6 py-8">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 leading-relaxed flex-1">
                <span className="text-blue-600 font-semibold mr-2">
                  {currentItem.number}.
                </span>
                {currentItem.text}
              </h3>
              <div className="flex items-center ml-4">
                {currentItem.required && (
                  <span className="text-red-500 text-sm font-medium mr-2">*</span>
                )}
                <button
                  onClick={handleShowHelp}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                  title="Ayuda para responder esta pregunta"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {currentItem.reversed && (
              <Alert variant="info" className="mb-4">
                <strong>Nota:</strong> Esta pregunta tiene puntuación invertida.
              </Alert>
            )}
          </div>

          {/* Response Component */}
          <div className="mb-8">
            {renderResponseComponent()}
          </div>
        </div>

        {/* Navigation Controls */}
        <ClinimetrixNavigationControls
          canNavigatePrevious={canNavigatePrevious}
          canNavigateNext={canNavigateNext}
          isLastItem={isLastItem}
          saving={state.saving}
          onPrevious={navigatePrevious}
          onNext={navigateNext}
          onSave={handleSave}
          onComplete={handleComplete}
          onCancel={onCancel}
        />
      </Card>

      {/* Help Modal */}
      {state.showHelpModal && currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Ayuda - Pregunta {currentItem.number}
                </h3>
              </div>
              <button
                onClick={handleCloseHelp}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Pregunta:</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {currentItem.text}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Cómo responder:</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {getHelpContent(currentItem)}
                </p>
              </div>

              {currentItem.responseType === 'likert' && state.template?.responseGroups && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Opciones de respuesta:</h4>
                  <div className="space-y-1">
                    {state.template.responseGroups[currentItem.responseGroup]?.map((option: any, index: number) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="font-mono text-blue-600 mr-2">{option.score}</span>
                        <span className="text-gray-700">{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentItem.required && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-800 text-sm">
                    <span className="font-semibold">⚠️ Pregunta requerida:</span> 
                    Debes responder esta pregunta para poder continuar con la evaluación.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex justify-end">
                <Button
                  onClick={handleCloseHelp}
                  variant="primary"
                >
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save Indicator */}
      {state.saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-40">
          <div className="flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            Guardando...
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinimetrixRenderer;