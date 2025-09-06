'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ariaLabel?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaDescribedBy?: string;
  tooltipText?: string;
}

/**
 * Accessible button component with focus management and ARIA attributes
 * Includes loading states, keyboard navigation, and screen reader support
 */
export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      ariaLabel,
      ariaPressed,
      ariaExpanded,
      ariaControls,
      ariaDescribedBy,
      tooltipText,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-all duration-200 transform',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-95'
    );

    const variantStyles = {
      primary: cn(
        'bg-primary-600 text-white hover:bg-primary-700',
        'focus-visible:ring-primary-500',
        'shadow-sm hover:shadow-md'
      ),
      secondary: cn(
        'bg-white text-gray-700 border border-gray-300',
        'hover:bg-gray-50 hover:border-gray-400',
        'focus-visible:ring-gray-500'
      ),
      danger: cn(
        'bg-red-600 text-white hover:bg-red-700',
        'focus-visible:ring-red-500',
        'shadow-sm hover:shadow-md'
      ),
      ghost: cn(
        'text-gray-700 hover:bg-gray-100',
        'focus-visible:ring-gray-500'
      ),
      link: cn(
        'text-primary-600 underline-offset-4 hover:underline',
        'focus-visible:ring-primary-500'
      )
    };

    const sizeStyles = {
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5'
    };

    const iconSizeStyles = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    const buttonClasses = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    const LoadingSpinner = () => (
      <svg
        className={cn('animate-spin', iconSizeStyles[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-describedby={ariaDescribedBy}
        aria-busy={isLoading}
        title={tooltipText}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {!isLoading && leftIcon && (
          <span className={iconSizeStyles[size]} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className={iconSizeStyles[size]} aria-hidden="true">
            {rightIcon}
          </span>
        )}
        {isLoading && <span className="sr-only">Cargando...</span>}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Keyboard shortcut indicator component
export const KeyboardShortcut: React.FC<{ keys: string[] }> = ({ keys }) => (
  <kbd className="ml-2 px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
    {keys.join(' + ')}
  </kbd>
);