'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from './Button';

export interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className
}) => {
  const variants = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: CheckCircleIcon,
      iconColor: 'text-green-400'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-400'
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: XCircleIcon,
      iconColor: 'text-red-400'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-400'
    }
  };

  const config = variants[variant];
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        'border rounded-lg p-4',
        config.container,
        className
      )}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={cn('h-5 w-5', config.iconColor)} />
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          
          <div className={cn('text-sm', !title && 'mt-0')}>
            {children}
          </div>
        </div>
        
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <Button
              variant="ghost"
              size="xs"
              onClick={onDismiss}
              className={cn(
                'hover:bg-transparent focus:ring-offset-transparent',
                variant === 'success' && 'text-green-600 hover:text-green-800',
                variant === 'warning' && 'text-yellow-600 hover:text-yellow-800',
                variant === 'error' && 'text-red-600 hover:text-red-800',
                variant === 'info' && 'text-blue-600 hover:text-blue-800'
              )}
            >
              <XMarkIcon className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Preset alert components for common use cases
const SuccessAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert variant="success" {...props} />
);

const WarningAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert variant="warning" {...props} />
);

const ErrorAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert variant="error" {...props} />
);

const InfoAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert variant="info" {...props} />
);

export { Alert, SuccessAlert, WarningAlert, ErrorAlert, InfoAlert };