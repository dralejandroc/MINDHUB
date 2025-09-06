'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QuestionMarkCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ContextualTooltipProps {
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  variant?: 'help' | 'info' | 'warning';
  maxWidth?: number;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Contextual tooltip component for inline help
 * Provides helpful information without leaving the page
 */
export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  content,
  title,
  position = 'top',
  trigger = 'hover',
  variant = 'help',
  maxWidth = 300,
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Calculate tooltip position
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const triggerBounds = triggerRef.current.getBoundingClientRect();
    const tooltipBounds = tooltipRef.current.getBoundingClientRect();
    const padding = 8;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = triggerBounds.left + triggerBounds.width / 2 - tooltipBounds.width / 2;
        y = triggerBounds.top - tooltipBounds.height - padding;
        break;
      case 'bottom':
        x = triggerBounds.left + triggerBounds.width / 2 - tooltipBounds.width / 2;
        y = triggerBounds.bottom + padding;
        break;
      case 'left':
        x = triggerBounds.left - tooltipBounds.width - padding;
        y = triggerBounds.top + triggerBounds.height / 2 - tooltipBounds.height / 2;
        break;
      case 'right':
        x = triggerBounds.right + padding;
        y = triggerBounds.top + triggerBounds.height / 2 - tooltipBounds.height / 2;
        break;
    }

    // Keep tooltip within viewport
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipBounds.width - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipBounds.height - padding));

    setTooltipPosition({ x, y });
  }, [isVisible, position]);

  const handleShow = () => {
    if (trigger === 'hover') {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsVisible(true), 200);
    } else {
      setIsVisible(true);
    }
  };

  const handleHide = () => {
    if (trigger === 'hover') {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsVisible(false), 100);
    } else if (trigger === 'focus') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const Icon = variant === 'info' ? InformationCircleIcon : QuestionMarkCircleIcon;
  
  const iconColorClass = {
    help: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
    info: 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-300',
    warning: 'text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300'
  }[variant];

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-flex items-center', className)}
        onMouseEnter={trigger === 'hover' ? handleShow : undefined}
        onMouseLeave={trigger === 'hover' ? handleHide : undefined}
        onFocus={trigger === 'focus' ? handleShow : undefined}
        onBlur={trigger === 'focus' ? handleHide : undefined}
        onClick={handleClick}
      >
        {children || (
          <button
            type="button"
            className={cn(
              'p-0.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
              iconColorClass
            )}
            aria-label="Mostrar ayuda"
          >
            <Icon className="h-4 w-4" />
          </button>
        )}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9998] animate-fadeIn"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            maxWidth
          }}
          onMouseEnter={trigger === 'hover' ? handleShow : undefined}
          onMouseLeave={trigger === 'hover' ? handleHide : undefined}
        >
          <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl p-3">
            {title && (
              <div className="font-semibold text-sm mb-1">{title}</div>
            )}
            <div className="text-sm leading-relaxed">{content}</div>
          </div>
          
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-8 border-transparent',
              position === 'top' && 'bottom-[-16px] left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-800',
              position === 'bottom' && 'top-[-16px] left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-800',
              position === 'left' && 'right-[-16px] top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-800',
              position === 'right' && 'left-[-16px] top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-800'
            )}
          />
        </div>
      )}
    </>
  );
};