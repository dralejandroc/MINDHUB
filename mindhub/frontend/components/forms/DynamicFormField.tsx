'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarIcon,
  ClockIcon,
  DocumentIcon,
  PencilIcon,
  PhotoIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
  value?: any;
  touched?: boolean;
  options?: FormFieldOption[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    step?: number;
  };
  conditionalLogic?: {
    showWhen: {
      field: string;
      operator: string;
      value: any;
    };
  };
  defaultValue?: any;
  displayValue?: boolean;
  labels?: {
    min?: string;
    max?: string;
  };
  suffix?: string;
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    fontWeight?: string;
  };
  rows?: Array<{ id: string; label: string }>;
  columns?: Array<{ id: string; label: string }>;
  items?: Array<{ id: string; label: string }>;
  scale?: {
    min: number;
    max: number;
    labels: string[];
  };
  calculation?: {
    type: string;
    fields: string[];
    displayAs?: string;
  };
  interpretation?: {
    ranges: Array<{
      min: number;
      max: number;
      label: string;
      color: string;
      action?: string;
    }>;
  };
}

interface DynamicFormFieldProps {
  field: FormField;
  value?: any;
  onChange: (fieldId: string, value: any) => void;
  onBlur?: (fieldId: string) => void;
  error?: string;
  disabled?: boolean;
  showConditional?: boolean;
}

export default function DynamicFormField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  showConditional = true
}: DynamicFormFieldProps) {
  const [internalValue, setInternalValue] = useState(value ?? field.defaultValue ?? '');

  useEffect(() => {
    setInternalValue(value ?? field.defaultValue ?? '');
  }, [value, field.defaultValue]);

  const handleChange = (newValue: any) => {
    setInternalValue(newValue);
    onChange(field.id, newValue);
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur(field.id);
    }
  };

  // No renderizar si hay lógica condicional y no se cumple
  if (!showConditional) {
    return null;
  }

  const fieldClasses = `
    w-full px-4 py-3 text-sm rounded-lg focus:outline-none transition-all duration-200
    ${error 
      ? 'border-2 border-red-500 bg-red-50' 
      : 'border-2 border-gray-200 focus:border-blue-500'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
  `;

  const renderField = () => {
    switch (field.type) {
      case 'short_text':
        return (
          <input
            type="text"
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            disabled={disabled}
            className={fieldClasses}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
            style={{ fontFamily: 'var(--font-primary)' }}
          />
        );

      case 'long_text':
        return (
          <textarea
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={4}
            className={`${fieldClasses} resize-none`}
            maxLength={field.validation?.maxLength}
            style={{ fontFamily: 'var(--font-primary)' }}
          />
        );

      case 'paragraph':
        return (
          <textarea
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={6}
            className={`${fieldClasses} resize-none`}
            maxLength={field.validation?.maxLength}
            style={{ fontFamily: 'var(--font-primary)' }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={internalValue}
            onChange={(e) => handleChange(Number(e.target.value))}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            disabled={disabled}
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.validation?.step}
            className={fieldClasses}
            style={{ fontFamily: 'var(--font-primary)' }}
          />
        );

      case 'dropdown':
        return (
          <select
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            className={`${fieldClasses} appearance-none`}
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={internalValue === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  style={{ accentColor: 'var(--primary-500)' }}
                />
                <span 
                  className="text-sm"
                  style={{ 
                    color: disabled ? 'var(--neutral-400)' : 'var(--neutral-700)',
                    fontFamily: 'var(--font-primary)'
                  }}
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
      case 'multi_select':
        const selectedValues = Array.isArray(internalValue) ? internalValue : [];
        return (
          <div className="space-y-3">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value);
                    handleChange(newValues);
                  }}
                  onBlur={handleBlur}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  style={{ accentColor: 'var(--primary-500)' }}
                />
                <span 
                  className="text-sm"
                  style={{ 
                    color: disabled ? 'var(--neutral-400)' : 'var(--neutral-700)',
                    fontFamily: 'var(--font-primary)'
                  }}
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="range"
                value={internalValue}
                onChange={(e) => handleChange(Number(e.target.value))}
                onBlur={handleBlur}
                min={field.validation?.min || 0}
                max={field.validation?.max || 100}
                step={field.validation?.step || 1}
                disabled={disabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${
                    ((Number(internalValue) - (field.validation?.min || 0)) / 
                     ((field.validation?.max || 100) - (field.validation?.min || 0))) * 100
                  }%, #e2e8f0 ${
                    ((Number(internalValue) - (field.validation?.min || 0)) / 
                     ((field.validation?.max || 100) - (field.validation?.min || 0))) * 100
                  }%, #e2e8f0 100%)`
                }}
              />
              {field.displayValue && (
                <div 
                  className="text-center mt-2 font-medium"
                  style={{ color: 'var(--primary-600)' }}
                >
                  {internalValue}{field.suffix || ''}
                </div>
              )}
            </div>
            {field.labels && (
              <div className="flex justify-between text-xs" style={{ color: 'var(--neutral-500)' }}>
                <span>{field.labels.min}</span>
                <span>{field.labels.max}</span>
              </div>
            )}
          </div>
        );

      case 'rating':
      case 'scale_10':
        const maxRating = field.type === 'scale_10' ? 10 : (field.validation?.max || 5);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleChange(rating)}
                  onBlur={handleBlur}
                  disabled={disabled}
                  className={`
                    w-10 h-10 rounded-full border-2 text-sm font-medium transition-all duration-200
                    ${Number(internalValue) >= rating
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                  `}
                  style={{
                    backgroundColor: Number(internalValue) >= rating ? 'var(--primary-500)' : 'white',
                    borderColor: Number(internalValue) >= rating ? 'var(--primary-500)' : 'var(--neutral-300)',
                    color: Number(internalValue) >= rating ? 'white' : 'var(--neutral-600)'
                  }}
                >
                  {rating}
                </button>
              ))}
            </div>
            {field.labels && (
              <div className="flex justify-between text-xs" style={{ color: 'var(--neutral-500)' }}>
                <span>{field.labels.min}</span>
                <span>{field.labels.max}</span>
              </div>
            )}
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex space-x-6">
            {[
              { value: 'yes', label: 'Sí' },
              { value: 'no', label: 'No' }
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={internalValue === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  style={{ accentColor: 'var(--primary-500)' }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ 
                    color: disabled ? 'var(--neutral-400)' : 'var(--neutral-700)',
                    fontFamily: 'var(--font-primary)'
                  }}
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <div className="relative">
            <CalendarIcon 
              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--neutral-400)' }}
            />
            <input
              type="date"
              value={internalValue}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              disabled={disabled}
              className={`${fieldClasses} pl-10`}
              style={{ fontFamily: 'var(--font-primary)' }}
            />
          </div>
        );

      case 'time':
        return (
          <div className="relative">
            <ClockIcon 
              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--neutral-400)' }}
            />
            <input
              type="time"
              value={internalValue}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              disabled={disabled}
              className={`${fieldClasses} pl-10`}
              style={{ fontFamily: 'var(--font-primary)' }}
            />
          </div>
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            className={fieldClasses}
            style={{ fontFamily: 'var(--font-primary)' }}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            disabled={disabled}
            className={fieldClasses}
            style={{ fontFamily: 'var(--font-primary)' }}
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder || "+52 55 1234-5678"}
            disabled={disabled}
            className={fieldClasses}
            style={{ fontFamily: 'var(--font-primary)' }}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder || "https://"}
            disabled={disabled}
            className={fieldClasses}
            style={{ fontFamily: 'var(--font-primary)' }}
          />
        );

      case 'file_upload':
        return (
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              style={{ borderColor: error ? 'red' : 'var(--neutral-300)' }}
            >
              <PhotoIcon 
                className="h-12 w-12 mx-auto mb-4"
                style={{ color: 'var(--neutral-400)' }}
              />
              <p 
                className="text-sm mb-2"
                style={{ color: 'var(--neutral-600)' }}
              >
                Haga clic para seleccionar archivos o arrastre y suelte
              </p>
              <input
                type="file"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleChange(files);
                }}
                onBlur={handleBlur}
                disabled={disabled}
                multiple
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>
            {Array.isArray(internalValue) && internalValue.length > 0 && (
              <div className="space-y-2">
                {internalValue.map((file: File, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                    <DocumentIcon className="h-4 w-4" style={{ color: 'var(--neutral-500)' }} />
                    <span className="text-sm" style={{ color: 'var(--neutral-700)' }}>
                      {file.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'multi_select_grid':
        const gridValues = internalValue || {};
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50"></th>
                  {field.columns?.map((column) => (
                    <th 
                      key={column.id} 
                      className="border p-2 bg-gray-50 text-sm font-medium"
                      style={{ color: 'var(--neutral-700)' }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {field.rows?.map((row) => (
                  <tr key={row.id}>
                    <td 
                      className="border p-2 font-medium text-sm"
                      style={{ color: 'var(--neutral-700)' }}
                    >
                      {row.label}
                    </td>
                    {field.columns?.map((column) => (
                      <td key={`${row.id}-${column.id}`} className="border p-2 text-center">
                        <input
                          type="checkbox"
                          checked={gridValues[row.id]?.includes(column.id) || false}
                          onChange={(e) => {
                            const rowValues = gridValues[row.id] || [];
                            const newRowValues = e.target.checked
                              ? [...rowValues, column.id]
                              : rowValues.filter((v: string) => v !== column.id);
                            
                            handleChange({
                              ...gridValues,
                              [row.id]: newRowValues
                            });
                          }}
                          disabled={disabled}
                          className="w-4 h-4"
                          style={{ accentColor: 'var(--primary-500)' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'likert_scale':
        const likertValues = internalValue || {};
        return (
          <div className="space-y-4">
            {field.items?.map((item) => (
              <div key={item.id} className="space-y-2">
                <label 
                  className="block text-sm font-medium"
                  style={{ color: 'var(--neutral-700)' }}
                >
                  {item.label}
                </label>
                <div className="flex items-center space-x-4">
                  {field.scale?.labels.map((label, index) => (
                    <label key={index} className="flex flex-col items-center space-y-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`${field.id}_${item.id}`}
                        value={index + field.scale!.min}
                        checked={likertValues[item.id] === (index + field.scale!.min)}
                        onChange={(e) => {
                          handleChange({
                            ...likertValues,
                            [item.id]: Number(e.target.value)
                          });
                        }}
                        disabled={disabled}
                        className="w-4 h-4"
                        style={{ accentColor: 'var(--primary-500)' }}
                      />
                      <span 
                        className="text-xs text-center max-w-20"
                        style={{ color: 'var(--neutral-600)' }}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'calculated_field':
        const interpretation = field.interpretation?.ranges.find(
          range => Number(internalValue) >= range.min && Number(internalValue) <= range.max
        );
        
        return (
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: interpretation ? `${interpretation.color}20` : 'var(--neutral-50)',
              borderColor: interpretation?.color || 'var(--neutral-200)'
            }}
          >
            <div className="flex items-center justify-between">
              <span 
                className="text-lg font-bold"
                style={{ color: interpretation?.color || 'var(--neutral-700)' }}
              >
                {internalValue !== null && internalValue !== undefined ? internalValue : '---'}
              </span>
              {interpretation && (
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: interpretation.color,
                    color: 'white'
                  }}
                >
                  {interpretation.label}
                </span>
              )}
            </div>
            {interpretation?.action && (
              <p 
                className="text-sm mt-2"
                style={{ color: 'var(--neutral-600)' }}
              >
                <strong>Recomendación:</strong> {interpretation.action}
              </p>
            )}
          </div>
        );

      case 'section_header':
        return (
          <div 
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: field.styling?.backgroundColor || 'var(--primary-50)',
              borderLeftColor: 'var(--primary-500)',
              color: field.styling?.textColor || 'var(--primary-700)'
            }}
          >
            <h3 
              className="font-bold"
              style={{
                fontSize: field.styling?.fontSize || '16px',
                fontWeight: field.styling?.fontWeight || 'bold'
              }}
            >
              {field.label}
            </h3>
          </div>
        );

      case 'divider':
        return (
          <hr 
            className="my-6"
            style={{ borderColor: 'var(--neutral-200)' }}
          />
        );

      case 'signature':
        return (
          <div className="space-y-4">
            <div 
              className="border-2 rounded-lg h-32 flex items-center justify-center cursor-pointer bg-gray-50"
              style={{ borderColor: 'var(--neutral-300)' }}
            >
              <div className="text-center">
                <PencilIcon 
                  className="h-8 w-8 mx-auto mb-2"
                  style={{ color: 'var(--neutral-400)' }}
                />
                <p 
                  className="text-sm"
                  style={{ color: 'var(--neutral-600)' }}
                >
                  Haga clic para firmar
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div 
            className="p-4 border-2 border-dashed rounded-lg text-center"
            style={{ borderColor: 'var(--neutral-300)' }}
          >
            <p 
              className="text-sm"
              style={{ color: 'var(--neutral-500)' }}
            >
              Tipo de campo no soportado: {field.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== 'section_header' && field.type !== 'divider' && (
        <label 
          className="block text-sm font-medium"
          style={{ color: 'var(--dark-green)' }}
        >
          {field.label}
          {field.required && (
            <span style={{ color: 'var(--accent-500)' }}> *</span>
          )}
        </label>
      )}
      
      {renderField()}
      
      {error && (
        <p 
          className="text-sm"
          style={{ color: 'var(--accent-600)' }}
        >
          {error}
        </p>
      )}
      
      {field.validation?.minLength && field.type.includes('text') && (
        <p 
          className="text-xs"
          style={{ color: 'var(--neutral-500)' }}
        >
          Mínimo {field.validation.minLength} caracteres
          {typeof internalValue === 'string' && (
            <span> ({internalValue.length}/{field.validation.maxLength || '∞'})</span>
          )}
        </p>
      )}
    </div>
  );
}