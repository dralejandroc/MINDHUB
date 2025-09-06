'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Quick Win: Consistent loading states across the platform
 */

// Skeleton loader for content
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div 
    className={cn(
      'animate-pulse bg-gray-200 rounded',
      className
    )}
    aria-hidden="true"
  />
);

// Card skeleton
export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <Skeleton className="h-6 w-1/3 mb-4" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

// Table row skeleton
export const TableRowSkeleton: React.FC = () => (
  <tr>
    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
  </tr>
);

// Spinner loader
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-gray-300 border-t-primary-600',
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label="Cargando"
      >
        <span className="sr-only">Cargando...</span>
      </div>
    </div>
  );
};

// Full page loader
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <div className="min-h-[400px] flex flex-col items-center justify-center">
    <Spinner size="lg" />
    <p className="mt-4 text-gray-600">{message}</p>
  </div>
);

// Inline loader
export const InlineLoader: React.FC<{ text?: string }> = ({ text = 'Cargando' }) => (
  <span className="inline-flex items-center gap-2 text-sm text-gray-600">
    <Spinner size="sm" />
    <span>{text}</span>
  </span>
);