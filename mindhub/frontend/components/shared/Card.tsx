'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  touchOptimized?: boolean;
}

const Card = React.forwardRef<HTMLElement, CardProps>(({
  className,
  variant = 'default',
  padding = 'md',
  rounded = 'lg',
  interactive = false,
  touchOptimized = false,
  children,
  ...props
}, ref) => {
  const cardClasses = cn(
    // Base styles
    'bg-white',
    
    // Variant styles
    {
      'border border-gray-200': variant === 'default' || variant === 'outlined',
      'shadow-sm': variant === 'default',
      'shadow-md hover:shadow-lg transition-shadow': variant === 'elevated',
      'border-0 shadow-none': variant === 'ghost',
    },
    
    // Padding variants
    {
      'p-0': padding === 'none',
      'p-3': padding === 'sm',
      'p-4': padding === 'md',
      'p-6': padding === 'lg',
    },
    
    // Rounded variants
    {
      'rounded-none': rounded === 'none',
      'rounded-sm': rounded === 'sm',
      'rounded-md': rounded === 'md',
      'rounded-lg': rounded === 'lg',
      'rounded-xl': rounded === 'xl',
    },
    
    // Interactive states
    interactive && [
      'cursor-pointer transition-all duration-200',
      'hover:border-gray-300 hover:shadow-md',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      'active:scale-[0.99]'
    ],
    
    // Touch optimization
    touchOptimized && interactive && 'min-h-[44px]',
    
    className
  );

  const Component = interactive ? 'button' : 'div';

  return (
    <Component
      ref={ref as any}
      className={cardClasses}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

// Card sub-components
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900', className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  >
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('pt-0', className)}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };