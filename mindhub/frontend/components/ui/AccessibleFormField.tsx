'use client';

import React, { forwardRef, useId } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface AccessibleFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  showRequiredIndicator?: boolean;
}

/**
 * Accessible form field with proper labeling, error handling, and ARIA attributes
 * Supports screen readers and keyboard navigation
 */
export const AccessibleFormField = forwardRef<HTMLInputElement, AccessibleFormFieldProps>(
  (
    {
      label,
      error,
      success,
      hint,
      required = false,
      showRequiredIndicator = true,
      className = '',
      type = 'text',
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Generate unique IDs for accessibility
    const inputId = useId();
    const errorId = useId();
    const hintId = useId();
    const successId = useId();

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;

    const inputClasses = cn(
      'w-full px-3 py-2 rounded-lg border transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'placeholder:text-gray-400',
      {
        'border-gray-300 focus:border-primary-500 focus:ring-primary-500': !hasError && !hasSuccess,
        'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50': hasError,
        'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50': hasSuccess,
        'bg-gray-100 cursor-not-allowed opacity-60': disabled,
      },
      className
    );

    const ariaDescribedBy = [
      hint && hintId,
      error && errorId,
      success && successId,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="w-full">
        {/* Label */}
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && showRequiredIndicator && (
            <span className="text-red-500 ml-1" aria-label="campo requerido">
              *
            </span>
          )}
        </label>

        {/* Hint text */}
        {hint && !error && !success && (
          <p id={hintId} className="text-sm text-gray-600 mb-1">
            {hint}
          </p>
        )}

        {/* Input field */}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={inputClasses}
            disabled={disabled}
            required={required}
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={ariaDescribedBy || undefined}
            aria-errormessage={hasError ? errorId : undefined}
            {...props}
          />

          {/* Status icons */}
          {hasError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ExclamationCircleIcon 
                className="h-5 w-5 text-red-500" 
                aria-hidden="true"
              />
            </div>
          )}
          {hasSuccess && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <CheckCircleIcon 
                className="h-5 w-5 text-green-500" 
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p 
            id={errorId}
            role="alert"
            aria-live="polite"
            className="mt-1 text-sm text-red-600 flex items-center gap-1"
          >
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Success message */}
        {hasSuccess && (
          <p 
            id={successId}
            role="status"
            aria-live="polite"
            className="mt-1 text-sm text-green-600 flex items-center gap-1"
          >
            <CheckCircleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

AccessibleFormField.displayName = 'AccessibleFormField';

// Accessible Select Component
interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string; disabled?: boolean }[];
  error?: string;
  hint?: string;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  ({ label, options, error, hint, required = false, className = '', ...props }, ref) => {
    const selectId = useId();
    const errorId = useId();
    const hintId = useId();

    const hasError = Boolean(error);

    const selectClasses = cn(
      'w-full px-3 py-2 rounded-lg border transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'appearance-none bg-white',
      {
        'border-gray-300 focus:border-primary-500 focus:ring-primary-500': !hasError,
        'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50': hasError,
      },
      className
    );

    return (
      <div className="w-full">
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="campo requerido">
              *
            </span>
          )}
        </label>

        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-600 mb-1">
            {hint}
          </p>
        )}

        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
          required={required}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {hasError && (
          <p 
            id={errorId}
            role="alert"
            aria-live="polite"
            className="mt-1 text-sm text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';