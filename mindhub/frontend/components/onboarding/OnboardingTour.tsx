'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useOnboarding } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

interface OnboardingTourProps {
  className?: string;
}

/**
 * Onboarding tour overlay component
 * Shows guided tours with step-by-step instructions
 */
export const OnboardingTour: React.FC<OnboardingTourProps> = ({ className = '' }) => {
  const {
    isActive,
    currentStep,
    currentTour,
    nextStep,
    previousStep,
    skipTour,
    getProgress,
    totalSteps
  } = useOnboarding();

  const [highlightBounds, setHighlightBounds] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = currentTour?.steps[currentStep];

  // Calculate highlight and tooltip positions
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const targetElement = document.querySelector(currentStepData.target);
    if (!targetElement) {
      console.warn(`Target element not found: ${currentStepData.target}`);
      return;
    }

    const bounds = targetElement.getBoundingClientRect();
    setHighlightBounds(bounds);

    // Calculate tooltip position based on step position preference
    let x = bounds.left + bounds.width / 2;
    let y = bounds.top + bounds.height / 2;

    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const padding = 20;

    switch (currentStepData.position) {
      case 'top':
        y = bounds.top - tooltipHeight - padding;
        break;
      case 'bottom':
        y = bounds.bottom + padding;
        break;
      case 'left':
        x = bounds.left - tooltipWidth - padding;
        y = bounds.top;
        break;
      case 'right':
        x = bounds.right + padding;
        y = bounds.top;
        break;
      case 'center':
      default:
        // Center in viewport
        x = window.innerWidth / 2 - tooltipWidth / 2;
        y = window.innerHeight / 2 - tooltipHeight / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding));

    setTooltipPosition({ x, y });
  }, [isActive, currentStepData]);

  if (!isActive || !currentTour || !currentStepData) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={cn('fixed inset-0 z-[9999]', className)}
      onClick={(e) => {
        if (e.target === overlayRef.current && currentStepData.skippable !== false) {
          nextStep();
        }
      }}
    >
      {/* Dark overlay with highlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="highlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightBounds && (
              <rect
                x={highlightBounds.left - 5}
                y={highlightBounds.top - 5}
                width={highlightBounds.width + 10}
                height={highlightBounds.height + 10}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#highlight-mask)"
        />
      </svg>

      {/* Highlight border */}
      {highlightBounds && (
        <div
          className="absolute border-2 border-primary-500 rounded-lg pointer-events-none animate-pulse"
          style={{
            left: highlightBounds.left - 5,
            top: highlightBounds.top - 5,
            width: highlightBounds.width + 10,
            height: highlightBounds.height + 10
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-[400px]"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {currentStepData.title}
          </h3>
          <button
            onClick={skipTour}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cerrar tour"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {currentStepData.content}
        </p>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Paso {currentStep + 1} de {totalSteps}</span>
            <span>{Math.round(getProgress())}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={skipTour}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Saltar tour
          </button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={previousStep}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 
                         text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 
                         dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Anterior
              </button>
            )}
            
            <button
              onClick={nextStep}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-primary-600 text-white 
                       rounded-lg hover:bg-primary-700 transition-colors"
            >
              {currentStep === totalSteps - 1 ? 'Finalizar' : 'Siguiente'}
              {currentStep < totalSteps - 1 && <ChevronRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};