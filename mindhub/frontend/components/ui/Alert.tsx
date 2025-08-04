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
      containerClass: 'bg-red-50 border border-red-200 text-red-700',
      iconClass: 'text-red-400',
      Icon: ExclamationTriangleIcon
    },
    success: {
      containerClass: 'bg-green-50 border border-green-200 text-green-700',
      iconClass: 'text-green-400',
      Icon: CheckCircleIcon
    },
    info: {
      containerClass: 'bg-blue-50 border border-blue-200 text-blue-700',
      iconClass: 'text-blue-400',
      Icon: InformationCircleIcon
    },
    warning: {
      containerClass: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
      iconClass: 'text-yellow-400',
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