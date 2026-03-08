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
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
              <Icon className={cn('h-4 w-4', iconColor)} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-gray-500 truncate">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}