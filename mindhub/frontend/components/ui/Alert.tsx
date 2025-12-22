import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface AlertProps {
  variant: 'error' | 'success' | 'info' | 'warning';
  className?: string;
  children: React.ReactNode;
}

export function Alert({ variant, className = '', children }: AlertProps) {
  const variants = {
    error: {
      containerClass: 'bg-error-50 border border-error-200 text-error-700',
      iconClass: 'text-error-400',
      Icon: ExclamationTriangleIcon
    },
    success: {
      containerClass: 'bg-success-50 border border-success-200 text-success-700',
      iconClass: 'text-success-400',
      Icon: CheckCircleIcon
    },
    info: {
      containerClass: 'bg-primary-50 border border-primary-200 text-primary-700',
      iconClass: 'text-primary-400',
      Icon: InformationCircleIcon
    },
    warning: {
      containerClass: 'bg-warning-50 border border-warning-200 text-warning-700',
      iconClass: 'text-warning-400',
      Icon: ExclamationTriangleIcon
    }
  };

  const { containerClass, iconClass, Icon } = variants[variant];

  return (
    <div className={`rounded-md p-4 ${containerClass} ${className}`}>
      <div className="flex">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <div className="ml-3">
          {children}
        </div>
      </div>
    </div>
  );
}