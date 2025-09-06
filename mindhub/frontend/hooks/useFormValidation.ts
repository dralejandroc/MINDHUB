import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';

/**
 * Form validation rules
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData?: any) => string | undefined;
  message?: string;
}

export interface FieldConfig {
  name: string;
  rules?: ValidationRule;
  defaultValue?: any;
}

export interface FormConfig {
  fields: FieldConfig[];
  onSubmit?: (data: any) => Promise<void> | void;
  onAutoSave?: (data: any) => Promise<void> | void;
  autoSaveDelay?: number; // milliseconds
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Advanced form validation hook with auto-save
 * Provides real-time validation and automatic saving
 */
export function useFormValidation(config: FormConfig) {
  const {
    fields,
    onSubmit,
    onAutoSave,
    autoSaveDelay = 30000, // 30 seconds default
    validateOnChange = true,
    validateOnBlur = true,
  } = config;

  // Form state
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      initialValues[field.name] = field.defaultValue || '';
    });
    return initialValues;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const debouncedAutoSaveRef = useRef<any>();

  // Initialize debounced auto-save
  useEffect(() => {
    if (onAutoSave) {
      debouncedAutoSaveRef.current = debounce(async (data: any) => {
        setIsAutoSaving(true);
        try {
          await onAutoSave(data);
          setLastSaved(new Date());
          setIsDirty(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }, 2000); // 2 second debounce
    }

    return () => {
      debouncedAutoSaveRef.current?.cancel();
    };
  }, [onAutoSave]);

  // Auto-save timer
  useEffect(() => {
    if (onAutoSave && isDirty && autoSaveDelay > 0) {
      clearTimeout(autoSaveTimerRef.current);
      
      autoSaveTimerRef.current = setTimeout(() => {
        debouncedAutoSaveRef.current?.(values);
      }, autoSaveDelay);

      return () => {
        clearTimeout(autoSaveTimerRef.current);
      };
    }
  }, [values, isDirty, onAutoSave, autoSaveDelay]);

  // Trigger immediate auto-save when user stops typing
  useEffect(() => {
    if (onAutoSave && isDirty) {
      debouncedAutoSaveRef.current?.(values);
    }
  }, [values, isDirty, onAutoSave]);

  // Validation function
  const validateField = useCallback((name: string, value: any, allValues?: any): string | undefined => {
    const field = fields.find(f => f.name === name);
    if (!field?.rules) return undefined;

    const rules = field.rules;

    // Required validation
    if (rules.required && (!value || value === '')) {
      return rules.message || `${name} es requerido`;
    }

    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength) {
      return rules.message || `${name} debe tener al menos ${rules.minLength} caracteres`;
    }

    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return rules.message || `${name} debe tener máximo ${rules.maxLength} caracteres`;
    }

    // Pattern validation
    if (rules.pattern && value && !rules.pattern.test(value)) {
      return rules.message || `${name} no tiene el formato correcto`;
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value, allValues || values);
    }

    return undefined;
  }, [fields, values]);

  // Validate all fields
  const validateAllFields = useCallback(() => {
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    fields.forEach(field => {
      const error = validateField(field.name, values[field.name], values);
      if (error) {
        newErrors[field.name] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [fields, values, validateField]);

  // Handle field change
  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);

    if (validateOnChange && touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || '',
      }));
    }
  }, [validateOnChange, touched, validateField]);

  // Handle field blur
  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error || '',
      }));
    }
  }, [validateOnBlur, values, validateField]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    fields.forEach(field => {
      allTouched[field.name] = true;
    });
    setTouched(allTouched);

    // Validate all fields
    if (!validateAllFields()) {
      return;
    }

    // Submit form
    setIsSubmitting(true);
    try {
      await onSubmit?.(values);
      setIsDirty(false);
    } catch (error) {
      console.error('Form submission failed:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, values, validateAllFields, onSubmit]);

  // Reset form
  const reset = useCallback(() => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      initialValues[field.name] = field.defaultValue || '';
    });
    
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [fields]);

  // Set field value programmatically
  const setFieldValue = useCallback((name: string, value: any) => {
    handleChange(name, value);
  }, [handleChange]);

  // Set field error programmatically
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  // Force auto-save
  const forceAutoSave = useCallback(async () => {
    if (onAutoSave && isDirty) {
      debouncedAutoSaveRef.current?.cancel();
      setIsAutoSaving(true);
      try {
        await onAutoSave(values);
        setLastSaved(new Date());
        setIsDirty(false);
      } catch (error) {
        console.error('Force auto-save failed:', error);
        throw error;
      } finally {
        setIsAutoSaving(false);
      }
    }
  }, [onAutoSave, isDirty, values]);

  return {
    // Form state
    values,
    errors,
    touched,
    
    // Status flags
    isSubmitting,
    isAutoSaving,
    isDirty,
    lastSaved,
    isValid: Object.keys(errors).length === 0,
    
    // Field handlers
    handleChange,
    handleBlur,
    handleSubmit,
    
    // Utility functions
    reset,
    setFieldValue,
    setFieldError,
    clearFieldError,
    validateField,
    validateAllFields,
    forceAutoSave,
    
    // Helper function to get field props
    getFieldProps: (name: string) => ({
      name,
      value: values[name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleChange(name, e.target.value),
      onBlur: () => handleBlur(name),
      error: touched[name] ? errors[name] : undefined,
      'aria-invalid': touched[name] && !!errors[name],
      'aria-describedby': touched[name] && errors[name] ? `${name}-error` : undefined,
    }),
  };
}