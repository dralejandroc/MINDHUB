'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { shadows, borderRadius, spacing } from '@/lib/design-system/tokens';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hoverable?: boolean;
}

/**
 * Unified Card Component
 * Consistent card styling across the platform
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
  hoverable = false,
}) => {
  const variantStyles = {
    default: 'bg-white border border-gray-200 shadow-sm',
    bordered: 'bg-white border-2 border-gray-300',
    elevated: 'bg-white shadow-lg',
    flat: 'bg-gray-50',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const isClickable = Boolean(onClick) || hoverable;

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        isClickable && [
          'cursor-pointer',
          'hover:shadow-md',
          'hover:scale-[1.01]',
          'active:scale-[0.99]',
        ],
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
};

/**
 * Card Header Component
 */
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={cn('flex items-start justify-between', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
};

/**
 * Card Body Component
 */
interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={cn('mt-4', className)}>
      {children}
    </div>
  );
};

/**
 * Card Footer Component
 */
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  divider = true,
}) => {
  return (
    <div
      className={cn(
        'mt-6 flex items-center justify-end gap-3',
        divider && 'pt-4 border-t border-gray-200',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Stat Card Component
 * For displaying metrics and statistics
 */
interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  icon,
  className = '',
}) => {
  const changeColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={cn('mt-2 text-sm', changeColors[change.type])}>
              {change.type === 'increase' && '↑'}
              {change.type === 'decrease' && '↓'}
              {change.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * Info Card Component
 * For displaying informational content
 */
interface InfoCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  icon,
  action,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-gray-50 border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const iconColors = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start">
        {icon && (
          <div className={cn('flex-shrink-0 mr-3', iconColors[variant])}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};