'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { colors, typography, spacing, borderRadius, shadows, transitions } from '@/lib/design-system/tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Unified Button Component
 * Consolidates all button variants across the platform
 * Only 3 main variants for consistency (reduced from 9)
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-200 transform',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-[0.98]',
      fullWidth && 'w-full'
    );

    // Variant styles (consolidated from 9 to 5)
    const variantStyles = {
      primary: cn(
        'bg-primary-600 text-white',
        'hover:bg-primary-700',
        'focus-visible:ring-primary-500',
        'shadow-sm hover:shadow-md'
      ),
      secondary: cn(
        'bg-secondary-600 text-white',
        'hover:bg-secondary-700',
        'focus-visible:ring-secondary-500',
        'shadow-sm hover:shadow-md'
      ),
      outline: cn(
        'bg-transparent border-2 border-gray-300 text-gray-700',
        'hover:bg-gray-50 hover:border-gray-400',
        'focus-visible:ring-gray-500'
      ),
      ghost: cn(
        'bg-transparent text-gray-700',
        'hover:bg-gray-100',
        'focus-visible:ring-gray-500'
      ),
      danger: cn(
        'bg-red-600 text-white',
        'hover:bg-red-700',
        'focus-visible:ring-red-500',
        'shadow-sm hover:shadow-md'
      ),
    };

    // Size styles with improved touch targets
    const sizeStyles = {
      sm: cn(
        'text-sm px-3 py-2 gap-1.5',
        'rounded-md',
        'min-h-[36px]' // Minimum touch target
      ),
      md: cn(
        'text-base px-4 py-2.5 gap-2',
        'rounded-lg',
        'min-h-[44px]' // WCAG compliant touch target
      ),
      lg: cn(
        'text-lg px-6 py-3 gap-2.5',
        'rounded-lg',
        'min-h-[52px]' // Comfortable touch target
      ),
    };

    // Icon size based on button size
    const iconSizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className={cn('animate-spin', iconSizeClasses[size])}
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
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span className="ml-2">Cargando...</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className={iconSizeClasses[size]} aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className={iconSizeClasses[size]} aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Icon Button Component
 * For icon-only buttons with proper accessibility
 */
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  ariaLabel: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, ariaLabel, size = 'md', className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'p-2',
      md: 'p-2.5',
      lg: 'p-3',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(sizeClasses[size], '!p-0 aspect-square', className)}
        aria-label={ariaLabel}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * Button Group Component
 * For grouping related actions
 */
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = '',
  orientation = 'horizontal',
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>button]:rounded-none',
        orientation === 'horizontal' 
          ? '[&>button:first-child]:rounded-l-lg [&>button:last-child]:rounded-r-lg'
          : '[&>button:first-child]:rounded-t-lg [&>button:last-child]:rounded-b-lg',
        '[&>button:not(:first-child)]:border-l-0',
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
};