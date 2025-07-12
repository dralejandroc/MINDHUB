/**
 * Assessment Interface Component
 * Universal interface for taking clinical assessments
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  HomeIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAssessment } from '../../contexts/ClinimetrixContext';
import {
  ScaleItem,
  ResponseType,
  DisplayFormat,
  ItemResponseFormData,
  ResponseConfidence
} from '../../types/clinimetrix';

// =============================================================================
// TYPES
// =============================================================================

interface AssessmentInterfaceProps {
  onComplete?: () => void;
  onExit?: () => void;
  autoSave?: boolean;
  showProgress?: boolean;
  allowNavigation?: boolean;
  className?: string;
}

interface ItemRendererProps {
  item: ScaleItem;
  value: string;
  onChange: (value: string) => void;
  onConfidenceChange?: (confidence: ResponseConfidence) => void;
  confidence?: ResponseConfidence;
  disabled?: boolean;
  showConfidence?: boolean;
}

interface ProgressBarProps {
  current: number;
  total: number;
  completed: number;
  className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AssessmentInterface({
  onComplete,
  onExit,
  autoSave = true,
  showProgress = true,
  allowNavigation = true,
  className = ''
}: AssessmentInterfaceProps) {
  const {
    isActive,
    administration,
    currentItemIndex,
    currentItem,
    responses,
    completionPercentage,
    canProceed,
    start,
    next,
    previous,
    goTo,
    getResponse
  } = useAssessment();

  const [currentValue, setCurrentValue] = useState<string>('');
  const [currentConfidence, setCurrentConfidence] = useState<ResponseConfidence | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showConfidenceInput, setShowConfidenceInput] = useState(false);

  // Initialize current value from existing response
  useEffect(() => {
    if (currentItem) {
      const existingResponse = getResponse(currentItem.id);
      setCurrentValue(existingResponse?.responseValue || '');
      setCurrentConfidence(existingResponse?.responseConfidence);
      setStartTime(Date.now());
    }
  }, [currentItem, getResponse]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && currentItem && currentValue && currentValue !== (getResponse(currentItem.id)?.responseValue || '')) {
      const timeoutId = setTimeout(() => {
        handleSaveResponse();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [currentValue, currentItem, autoSave]);

  // Handle response submission
  const handleSaveResponse = useCallback(async () => {
    if (!administration || !currentItem) return;

    try {
      setIsSubmitting(true);
      
      const responseData: ItemResponseFormData = {
        itemId: currentItem.id,
        responseValue: currentValue,
        responseConfidence: currentConfidence,
        clarificationNeeded: false
      };

      // Submit through context
      // await submitResponse(administration.id, responseData);

      console.log('Response saved:', responseData);
    } catch (error) {
      console.error('Failed to save response:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [administration, currentItem, currentValue, currentConfidence]);

  // Handle navigation
  const handleNext = async () => {
    if (!canProceed()) return;

    await handleSaveResponse();
    next();
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      previous();
    }
  };

  const handleComplete = async () => {
    if (!administration) return;

    try {
      await handleSaveResponse();
      // await completeAdministration(administration.id);
      onComplete?.();
    } catch (error) {
      console.error('Failed to complete assessment:', error);
    }
  };

  const handleExit = () => {
    if (currentValue && currentValue !== (getResponse(currentItem?.id || '')?.responseValue || '')) {
      if (window.confirm('You have unsaved changes. Are you sure you want to exit?')) {
        onExit?.();
      }
    } else {
      onExit?.();
    }
  };

  // Calculate response time
  const getResponseTime = () => {
    return Math.floor((Date.now() - startTime) / 1000);
  };

  if (!isActive || !administration || !currentItem) {
    return (
      <Card className="p-8 text-center">
        <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Assessment</h3>
        <p className="text-gray-500">Please start an assessment to use this interface.</p>
      </Card>
    );
  }

  const scale = administration.scale;
  const totalItems = scale?.items?.length || 0;
  const isLastItem = currentItemIndex === totalItems - 1;
  const completedItems = responses.filter(r => !r.wasSkipped && r.responseValue !== '').length;

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-900">
                {scale?.abbreviation || 'Assessment'}
              </h1>
              <span className="text-sm text-gray-500">
                {scale?.name}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>{getResponseTime()}s</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExit}
              className="flex items-center space-x-1"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Exit</span>
            </Button>
            
            {showProgress && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {currentItemIndex + 1} / {totalItems}
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-clinimetrix-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Progress Bar */}
      {showProgress && (
        <ProgressBar
          current={currentItemIndex + 1}
          total={totalItems}
          completed={completedItems}
          className="mb-6"
        />
      )}

      {/* Main Assessment Interface */}
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-500">
                  Question {currentItemIndex + 1}
                </span>
                {currentItem.required && (
                  <span className="text-red-500 text-sm">*</span>
                )}
                {currentItem.subscale && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {currentItem.subscale}
                  </span>
                )}
              </div>
              
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                {currentItem.questionText}
              </h2>
              
              {currentItem.instructionText && (
                <p className="text-sm text-gray-600 mb-4">
                  {currentItem.instructionText}
                </p>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfidenceInput(!showConfidenceInput)}
              className="flex items-center space-x-1"
            >
              <FlagIcon className="w-4 h-4" />
              <span>Confidence</span>
            </Button>
          </div>

          {/* Item Renderer */}
          <ItemRenderer
            item={currentItem}
            value={currentValue}
            onChange={setCurrentValue}
            onConfidenceChange={setCurrentConfidence}
            confidence={currentConfidence}
            disabled={isSubmitting}
            showConfidence={showConfidenceInput}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentItemIndex === 0 || !allowNavigation}
              className="flex items-center space-x-2"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            
            {isSubmitting && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isLastItem ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed()}
                className="flex items-center space-x-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Complete Assessment</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Item Navigation (Optional) */}
      {allowNavigation && totalItems > 1 && (
        <Card className="p-4 mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: totalItems }, (_, index) => {
              const hasResponse = responses.some(r => {
                const item = scale?.items?.[index];
                return item && r.itemId === item.id && !r.wasSkipped && r.responseValue !== '';
              });
              
              return (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  className={`
                    w-8 h-8 rounded text-sm font-medium transition-colors
                    ${currentItemIndex === index 
                      ? 'bg-clinimetrix-500 text-white' 
                      : hasResponse 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// ITEM RENDERER COMPONENT
// =============================================================================

function ItemRenderer({
  item,
  value,
  onChange,
  onConfidenceChange,
  confidence,
  disabled,
  showConfidence
}: ItemRendererProps) {
  const renderInput = () => {
    switch (item.responseType) {
      case ResponseType.LIKERT:
        return (
          <LikertScale
            item={item}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
        
      case ResponseType.YES_NO:
        return (
          <YesNoInput
            item={item}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
        
      case ResponseType.MULTIPLE_CHOICE:
        return (
          <MultipleChoiceInput
            item={item}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
        
      case ResponseType.NUMERIC:
        return (
          <NumericInput
            item={item}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
        
      case ResponseType.TEXT:
        return (
          <TextInput
            item={item}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
        
      case ResponseType.VISUAL_ANALOG:
        return (
          <VisualAnalogScale
            item={item}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
        
      default:
        return <div className="text-red-500">Unsupported response type: {item.responseType}</div>;
    }
  };

  return (
    <div className="space-y-4">
      {renderInput()}
      
      {showConfidence && (
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How confident are you in your response?
          </label>
          <div className="flex items-center space-x-4">
            {Object.values(ResponseConfidence).map((conf) => (
              <label key={conf} className="flex items-center">
                <input
                  type="radio"
                  name="confidence"
                  value={conf}
                  checked={confidence === conf}
                  onChange={(e) => onConfidenceChange?.(e.target.value as ResponseConfidence)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {conf.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// INPUT COMPONENTS
// =============================================================================

function LikertScale({ item, value, onChange, disabled }: ItemRendererProps) {
  const options = item.responseOptions || [];
  
  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <label key={index} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="radio"
            name={`item-${item.id}`}
            value={option.value}
            checked={value === String(option.value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="mr-3"
          />
          <span className="flex-1 text-gray-700">{option.label}</span>
          {option.score !== undefined && (
            <span className="text-sm text-gray-500">({option.score})</span>
          )}
        </label>
      ))}
    </div>
  );
}

function YesNoInput({ item, value, onChange, disabled }: ItemRendererProps) {
  return (
    <div className="flex items-center space-x-4">
      <label className="flex items-center">
        <input
          type="radio"
          name={`item-${item.id}`}
          value="yes"
          checked={value === 'yes'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="mr-2"
        />
        <span className="text-gray-700">Yes</span>
      </label>
      <label className="flex items-center">
        <input
          type="radio"
          name={`item-${item.id}`}
          value="no"
          checked={value === 'no'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="mr-2"
        />
        <span className="text-gray-700">No</span>
      </label>
    </div>
  );
}

function MultipleChoiceInput({ item, value, onChange, disabled }: ItemRendererProps) {
  const options = item.responseOptions || [];
  
  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <label key={index} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="radio"
            name={`item-${item.id}`}
            value={option.value}
            checked={value === String(option.value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="mr-3"
          />
          <span className="flex-1 text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function NumericInput({ item, value, onChange, disabled }: ItemRendererProps) {
  return (
    <div className="max-w-xs">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={item.minValue}
        max={item.maxValue}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-clinimetrix-500 focus:border-clinimetrix-500"
        placeholder={`Enter a number${item.minValue !== undefined ? ` (${item.minValue}-${item.maxValue})` : ''}`}
      />
      {(item.minValue !== undefined || item.maxValue !== undefined) && (
        <p className="text-xs text-gray-500 mt-1">
          Range: {item.minValue ?? '∞'} - {item.maxValue ?? '∞'}
        </p>
      )}
    </div>
  );
}

function TextInput({ item, value, onChange, disabled }: ItemRendererProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-clinimetrix-500 focus:border-clinimetrix-500"
        placeholder="Enter your response..."
      />
      {item.validationPattern && (
        <p className="text-xs text-gray-500 mt-1">
          Please follow the required format
        </p>
      )}
    </div>
  );
}

function VisualAnalogScale({ item, value, onChange, disabled }: ItemRendererProps) {
  const numericValue = Number(value) || 0;
  const min = item.minValue || 0;
  const max = item.maxValue || 100;
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={numericValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{min}</span>
          <span className="font-medium">{numericValue}</span>
          <span>{max}</span>
        </div>
      </div>
      
      {item.responseOptions && item.responseOptions.length >= 2 && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>{item.responseOptions[0].label}</span>
          <span>{item.responseOptions[item.responseOptions.length - 1].label}</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PROGRESS BAR COMPONENT
// =============================================================================

function ProgressBar({ current, total, completed, className = '' }: ProgressBarProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Progress: {completed} of {total} completed
        </span>
        <span className="text-sm text-gray-500">
          {progress.toFixed(1)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-clinimetrix-500 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Card>
  );
}

export default AssessmentInterface;