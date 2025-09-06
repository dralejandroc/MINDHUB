'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { colors, shadows, borderRadius, transitions } from '@/lib/design-system/tokens';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 for persistent
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Unified Notification Component
 * Consistent notification style across the platform
 */
export const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Match animation duration
  };

  if (!isVisible) return null;

  const typeConfig = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800',
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start p-4 rounded-lg border shadow-md',
        'transition-all duration-300',
        config.bgColor,
        config.borderColor,
        isExiting && 'opacity-0 transform translate-x-full',
        className
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconColor)} aria-hidden="true" />
      
      <div className="ml-3 flex-1">
        <h3 className={cn('text-sm font-medium', config.textColor)}>
          {title}
        </h3>
        {message && (
          <p className={cn('mt-1 text-sm', config.textColor, 'opacity-90')}>
            {message}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'mt-2 text-sm font-medium underline',
              config.textColor,
              'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2',
              'focus:ring-current rounded'
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      {onClose && (
        <button
          onClick={handleClose}
          className={cn(
            'ml-4 inline-flex rounded-md p-1.5',
            'hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2',
            'focus:ring-current'
          )}
          aria-label="Cerrar notificación"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

/**
 * Toast Notification Container
 * Manages multiple toast notifications
 */
interface ToastNotification extends NotificationProps {
  id: string;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Subscribe to toast events
  useEffect(() => {
    const handleToast = (event: CustomEvent<ToastNotification>) => {
      setToasts(prev => [...prev, event.detail]);
    };

    window.addEventListener('showToast' as any, handleToast);
    return () => window.removeEventListener('showToast' as any, handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Notification
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Helper function to show toast notifications
 */
export const showToast = (props: Omit<NotificationProps, 'onClose'>) => {
  const event = new CustomEvent('showToast', {
    detail: {
      ...props,
      id: Math.random().toString(36).substr(2, 9),
    },
  });
  window.dispatchEvent(event);
};

/**
 * Inline Alert Component
 * For inline contextual messages
 */
interface AlertProps {
  type: NotificationType;
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  children,
  className = '',
  dismissible = false,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const typeConfig = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        typeConfig[type],
        className
      )}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">{children}</div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-3 inline-flex rounded-md p-1.5 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
            aria-label="Cerrar alerta"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};