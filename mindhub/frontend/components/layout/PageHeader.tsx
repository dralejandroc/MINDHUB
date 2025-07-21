'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  icon: Icon, 
  iconColor = 'text-primary-600',
  actions,
  children 
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start space-x-4">
          {Icon && (
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                <Icon className={cn('h-6 w-6', iconColor)} />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-lg text-gray-600">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-3">
            {actions}
          </div>
        )}
      </div>
      
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
}