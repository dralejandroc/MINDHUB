'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AccessibleModal } from './AccessibleModal';
import { globalShortcuts, formatShortcut, useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Keyboard shortcuts cheatsheet modal
 * Shows with ? key
 */
export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose
}) => {
  // Group shortcuts by category
  const shortcutsByCategory = globalShortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof globalShortcuts>);

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Atajos de Teclado"
      description="Acciones rápidas para mejorar tu productividad"
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {shortcut.description}
                  </span>
                  <kbd className="ml-2 px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 
                                 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                                 rounded-lg shadow-sm">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Presiona <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 
                                  border border-gray-300 dark:border-gray-600 rounded">?</kbd> en 
          cualquier momento para ver esta ayuda
        </p>
      </div>
    </AccessibleModal>
  );
};

/**
 * Global keyboard shortcuts provider
 * Handles all app-wide shortcuts
 */
export const KeyboardShortcutsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Define shortcuts with actual actions
  const shortcuts = [
    ...globalShortcuts.map(s => ({
      ...s,
      action: s.key === '?' && s.shift 
        ? () => setShowHelp(true)
        : s.key === 'k' && s.ctrl
        ? () => setShowSearch(true)
        : s.action
    }))
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <>
      {children}
      <KeyboardShortcutsHelp 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
      {/* Global search would be shown here */}
    </>
  );
};

/**
 * Inline keyboard shortcut indicator
 */
export const KeyboardShortcutBadge: React.FC<{ 
  keys: string[];
  className?: string;
}> = ({ keys, className = '' }) => {
  return (
    <kbd className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5',
      'text-xs font-semibold text-gray-700 dark:text-gray-300',
      'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600',
      'rounded shadow-sm',
      className
    )}>
      {keys.map((key, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-gray-400">+</span>}
          <span>{key}</span>
        </React.Fragment>
      ))}
    </kbd>
  );
};