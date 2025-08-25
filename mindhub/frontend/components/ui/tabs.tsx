'use client';

import * as React from 'react';
import { clsx } from 'clsx';

interface TabsContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({});

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, onValueChange, defaultValue, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    
    const currentValue = value ?? internalValue;
    const handleValueChange = React.useCallback((newValue: string) => {
      if (!value) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    }, [value, onValueChange]);

    return (
      <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
        <div
          ref={ref}
          className={clsx('w-full', className)}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;

    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          isActive
            ? 'bg-white text-gray-950 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
          className
        )}
        onClick={() => context.onValueChange?.(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;

    if (!isActive) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';