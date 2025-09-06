'use client';

import React from 'react';
import { 
  ExclamationTriangleIcon, 
  XCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/design-system/Button';
import { cn } from '@/lib/utils';

/**
 * Quick Win: Improved error messages with clear actions
 */

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  retry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'error',
  action,
  retry,
  className = ''
}) => {
  const config = {
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      defaultTitle: 'Error'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      defaultTitle: 'Advertencia'
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      defaultTitle: 'Información'
    }
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor, defaultTitle } = config[type];

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        bgColor,
        borderColor,
        className
      )}
      role="alert"
    >
      <div className="flex">
        <Icon className={cn('h-5 w-5 flex-shrink-0', iconColor)} aria-hidden="true" />
        <div className="ml-3 flex-1">
          <h3 className={cn('text-sm font-medium', textColor)}>
            {title || defaultTitle}
          </h3>
          <p className={cn('mt-1 text-sm', textColor, 'opacity-90')}>
            {message}
          </p>
          {(action || retry) && (
            <div className="mt-3 flex gap-2">
              {retry && (
                <button
                  onClick={retry}
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium',
                    textColor,
                    'hover:opacity-80'
                  )}
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Reintentar
                </button>
              )}
              {action && (
                <button
                  onClick={action.onClick}
                  className={cn(
                    'text-sm font-medium underline',
                    textColor,
                    'hover:opacity-80'
                  )}
                >
                  {action.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty state component
export const EmptyState: React.FC<{
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}> = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={cn('text-center py-12', className)}>
    {Icon && (
      <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" aria-hidden="true" />
    )}
    <h3 className="text-sm font-medium text-gray-900">{title}</h3>
    {description && (
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    )}
    {action && (
      <div className="mt-6">
        <Button onClick={action.onClick} variant="primary" size="sm">
          {action.label}
        </Button>
      </div>
    )}
  </div>
);

// Error boundary fallback
export const ErrorBoundaryFallback: React.FC<{
  error?: Error;
  resetError?: () => void;
}> = ({ error, resetError }) => (
  <div className="min-h-[400px] flex items-center justify-center p-4">
    <div className="max-w-md w-full">
      <ErrorMessage
        type="error"
        title="Algo salió mal"
        message={error?.message || 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.'}
        retry={resetError}
      />
    </div>
  </div>
);