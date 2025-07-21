'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  touchOptimized?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  touchOptimized = false,
  children,
  disabled,
  ...props
}, ref) => {
  const baseClasses = cn(
    // Base styles
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95',
    
    // Touch optimization
    touchOptimized && 'min-h-[44px] min-w-[44px]', // iOS HIG minimum touch target
    
    // Size variants
    {
      'px-2 py-1 text-xs rounded-md': size === 'xs',
      'px-3 py-1.5 text-sm rounded-md': size === 'sm',
      'px-4 py-2 text-sm rounded-lg': size === 'md',
      'px-6 py-3 text-base rounded-lg': size === 'lg',
      'px-8 py-4 text-lg rounded-xl': size === 'xl',
    },
    
    // Variant styles
    {
      // Primary
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm': 
        variant === 'primary',
      
      // Secondary  
      'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500': 
        variant === 'secondary',
      
      // Outline
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500': 
        variant === 'outline',
      
      // Ghost
      'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500': 
        variant === 'ghost',
      
      // Danger
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm': 
        variant === 'danger',
      
      // Success
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm': 
        variant === 'success',
    },
    
    // Full width
    fullWidth && 'w-full',
    
    className
  );

  return (
    <button
      ref={ref}
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
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
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={cn('flex-shrink-0', children && 'mr-2')}>
          {icon}
        </span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={cn('flex-shrink-0', children && 'ml-2')}>
          {icon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };