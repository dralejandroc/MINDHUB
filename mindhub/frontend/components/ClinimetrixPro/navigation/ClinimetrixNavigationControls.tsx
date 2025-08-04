/**
 * ClinimetrixNavigationControls - Navigation controls for assessments
 * 
 * Provides previous/next navigation, save functionality,
 * and completion controls with proper state management.
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ClinimetrixNavigationControlsProps {
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  isLastItem: boolean;
  saving: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  onComplete: () => void;
  onCancel?: () => void;
  className?: string;
}

export const ClinimetrixNavigationControls: React.FC<ClinimetrixNavigationControlsProps> = ({
  canNavigatePrevious,
  canNavigateNext,
  isLastItem,
  saving,
  onPrevious,
  onNext,
  onSave,
  onComplete,
  onCancel,
  className = ''
}) => {
  return (
    <div className={`clinimetrix-navigation-controls bg-gray-50 px-6 py-4 border-t ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left Side - Previous Button */}
        <div className="flex items-center">
          <Button
            onClick={onPrevious}
            disabled={!canNavigatePrevious || saving}
            variant="outline"
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </Button>
        </div>

        {/* Center - Save Button */}
        <div className="flex items-center space-x-3">
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="ghost"
              disabled={saving}
              className="text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </Button>
          )}
          
          <Button
            onClick={onSave}
            disabled={saving}
            variant="outline"
            className="flex items-center"
          >
            {saving ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>

        {/* Right Side - Next/Complete Button */}
        <div className="flex items-center">
          {isLastItem ? (
            <Button
              onClick={onComplete}
              disabled={!canNavigateNext || saving}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {saving ? 'Completando...' : 'Completar'}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canNavigateNext || saving}
              className="flex items-center"
            >
              Siguiente
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-3 text-center">
        <div className="text-sm text-gray-500 space-x-4">
          <span className="flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isLastItem 
              ? 'Última pregunta - Haga clic en "Completar" para finalizar la evaluación'
              : canNavigateNext 
                ? 'Puede continuar a la siguiente pregunta'
                : 'Complete la pregunta actual antes de continuar'
            }
          </span>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-2 text-center">
        <div className="text-xs text-gray-400">
          <span className="space-x-3">
            <span>← Anterior</span>
            <span>→ Siguiente</span>
            <span>Ctrl+S Guardar</span>
          </span>
        </div>
      </div>

      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite">
        {saving && 'Guardando respuestas...'}
        {!canNavigateNext && 'Complete la pregunta actual antes de continuar'}
        {isLastItem && canNavigateNext && 'Última pregunta completada, puede finalizar la evaluación'}
      </div>
    </div>
  );
};

export default ClinimetrixNavigationControls;