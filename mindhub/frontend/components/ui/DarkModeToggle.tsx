'use client';

import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '@/hooks/useDarkMode';
import { cn } from '@/lib/utils';

interface DarkModeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'dropdown' | 'switch';
}

/**
 * Dark Mode Toggle Component
 * Provides multiple UI variants for theme switching
 */
export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  className = '',
  showLabel = false,
  variant = 'button'
}) => {
  const { theme, resolvedTheme, changeTheme, toggleTheme } = useDarkMode();

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          className
        )}
        aria-label={`Cambiar a modo ${resolvedTheme === 'light' ? 'oscuro' : 'claro'}`}
      >
        {resolvedTheme === 'light' ? (
          <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        )}
        {showLabel && (
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
            {resolvedTheme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'dropdown') {
    const [isOpen, setIsOpen] = React.useState(false);

    const options = [
      { value: 'light', label: 'Claro', icon: SunIcon },
      { value: 'dark', label: 'Oscuro', icon: MoonIcon },
      { value: 'system', label: 'Sistema', icon: ComputerDesktopIcon }
    ];

    const currentOption = options.find(opt => opt.value === theme) || options[2];

    return (
      <div className={cn('relative', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Seleccionar tema"
          aria-expanded={isOpen}
        >
          <currentOption.icon className="h-4 w-4" />
          {showLabel && <span className="text-sm">{currentOption.label}</span>}
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 
                          border border-gray-200 dark:border-gray-700 z-20">
              {options.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      changeTheme(option.value as any);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      theme === option.value && 'bg-gray-50 dark:bg-gray-700'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                    {theme === option.value && (
                      <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Switch variant
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showLabel && (
        <span className="text-sm text-gray-700 dark:text-gray-300">Modo Oscuro</span>
      )}
      <button
        role="switch"
        aria-checked={resolvedTheme === 'dark'}
        onClick={toggleTheme}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          resolvedTheme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'
        )}
      >
        <span className="sr-only">Activar modo oscuro</span>
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
};