'use client';

import React, { useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  CloudArrowUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useFormValidation, ValidationRule, FieldConfig } from '@/hooks/useFormValidation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/design-system/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select' | 'date';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  autoComplete?: string;
  rows?: number;
  formProps: ReturnType<typeof useFormValidation>;
}

/**
 * Individual form field component with validation
 */
const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  options,
  required,
  autoComplete,
  rows = 3,
  formProps
}) => {
  const { values, errors, touched, handleChange, handleBlur } = formProps;
  const hasError = touched[name] && errors[name];
  const isValid = touched[name] && !errors[name] && values[name];

  const inputClasses = cn(
    'w-full px-3 py-2 rounded-lg border transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    {
      'border-gray-300 focus:border-primary-500 focus:ring-primary-500': !hasError && !isValid,
      'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50': hasError,
      'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50': isValid,
    }
  );

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={values[name] || ''}
            onChange={(e) => handleChange(name, e.target.value)}
            onBlur={() => handleBlur(name)}
            placeholder={placeholder}
            rows={rows}
            className={inputClasses}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? `${name}-error` : undefined}
          />
        ) : type === 'select' ? (
          <select
            id={name}
            name={name}
            value={values[name] || ''}
            onChange={(e) => handleChange(name, e.target.value)}
            onBlur={() => handleBlur(name)}
            className={inputClasses}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? `${name}-error` : undefined}
          >
            <option value="">Seleccionar...</option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={values[name] || ''}
            onChange={(e) => handleChange(name, e.target.value)}
            onBlur={() => handleBlur(name)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={inputClasses}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? `${name}-error` : undefined}
          />
        )}

        {/* Status icons */}
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}
        {isValid && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Error message with animation */}
      {hasError && (
        <p 
          id={`${name}-error`}
          className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200"
          role="alert"
        >
          {errors[name]}
        </p>
      )}

      {/* Character count for text fields */}
      {(type === 'text' || type === 'textarea') && values[name] && (
        <p className="text-xs text-gray-500 text-right">
          {values[name].length} caracteres
        </p>
      )}
    </div>
  );
};

interface ValidatedFormProps {
  title?: string;
  description?: string;
  fields: Array<{
    name: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select' | 'date';
    placeholder?: string;
    options?: { value: string; label: string }[];
    rules?: ValidationRule;
    defaultValue?: any;
    autoComplete?: string;
    rows?: number;
  }>;
  onSubmit: (data: any) => Promise<void> | void;
  onAutoSave?: (data: any) => Promise<void> | void;
  autoSaveDelay?: number;
  submitButtonText?: string;
  showProgress?: boolean;
}

/**
 * Enhanced form component with validation and auto-save
 */
export const ValidatedForm: React.FC<ValidatedFormProps> = ({
  title,
  description,
  fields,
  onSubmit,
  onAutoSave,
  autoSaveDelay = 30000,
  submitButtonText = 'Guardar',
  showProgress = true
}) => {
  const formConfig: FieldConfig[] = fields.map(field => ({
    name: field.name,
    rules: field.rules,
    defaultValue: field.defaultValue
  }));

  const form = useFormValidation({
    fields: formConfig,
    onSubmit,
    onAutoSave,
    autoSaveDelay,
    validateOnChange: true,
    validateOnBlur: true
  });

  const {
    isSubmitting,
    isAutoSaving,
    isDirty,
    lastSaved,
    isValid,
    handleSubmit
  } = form;

  // Calculate form completion percentage
  const filledFields = Object.keys(form.values).filter(key => 
    form.values[key] && form.values[key] !== ''
  ).length;
  const completionPercentage = Math.round((filledFields / fields.length) * 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form header */}
      {(title || description) && (
        <div>
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
      )}

      {/* Progress indicator */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progreso del formulario</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
              role="progressbar"
              aria-valuenow={completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Auto-save indicator */}
      {onAutoSave && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {isAutoSaving ? (
              <>
                <CloudArrowUpIcon className="h-4 w-4 text-blue-600 animate-pulse" />
                <span className="text-sm text-blue-600">Guardando automáticamente...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">
                  Guardado {format(lastSaved, 'HH:mm:ss', { locale: es })}
                </span>
              </>
            ) : isDirty ? (
              <>
                <ClockIcon className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-600">Cambios sin guardar</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Sin cambios</span>
              </>
            )}
          </div>
          {isDirty && !isAutoSaving && (
            <button
              type="button"
              onClick={() => form.forceAutoSave()}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Guardar ahora
            </button>
          )}
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        {fields.map(field => (
          <FormField
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            options={field.options}
            required={field.rules?.required}
            autoComplete={field.autoComplete}
            rows={field.rows}
            formProps={form}
          />
        ))}
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => form.reset()}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Restablecer formulario
        </button>
        
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={!isValid || isSubmitting}
        >
          {submitButtonText}
        </Button>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-gray-500 text-center">
        Presiona <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl</kbd> + 
        <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded ml-1">S</kbd> para guardar
      </p>
    </form>
  );
};

// Add keyboard shortcut support
export const FormWithKeyboardShortcuts: React.FC<ValidatedFormProps> = (props) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.querySelector<HTMLFormElement>('form')?.requestSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <ValidatedForm {...props} />;
};