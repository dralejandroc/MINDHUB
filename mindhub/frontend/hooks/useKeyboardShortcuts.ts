import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
  category?: string;
  enabled?: boolean;
}

/**
 * Keyboard shortcuts hook
 * Maps keyboard combinations to actions
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const enabledRef = useRef(true);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabledRef.current) return;

    // Check if user is typing in an input field
    const target = e.target as HTMLElement;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    const isContentEditable = target.contentEditable === 'true';
    
    // Don't trigger shortcuts when typing
    if (isInput || isContentEditable) {
      // Allow some global shortcuts even in inputs
      const allowedInInput = ['Escape', 'Enter'];
      if (!allowedInInput.includes(e.key) && !e.ctrlKey && !e.metaKey) {
        return;
      }
    }

    shortcuts.forEach(shortcut => {
      if (shortcut.enabled === false) return;

      const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const matchesCtrl = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
      const matchesCmd = shortcut.cmd ? e.metaKey : true;
      const matchesShift = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const matchesAlt = shortcut.alt ? e.altKey : !e.altKey;

      if (matchesKey && matchesCtrl && matchesCmd && matchesShift && matchesAlt) {
        e.preventDefault();
        shortcut.action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const enable = () => { enabledRef.current = true; };
  const disable = () => { enabledRef.current = false; };

  return { enable, disable };
};

/**
 * Global keyboard shortcuts for the application
 */
export const globalShortcuts: KeyboardShortcut[] = [
  // Navigation
  {
    key: 'g',
    ctrl: true,
    action: () => {},
    description: 'Ir a...',
    category: 'Navegación'
  },
  {
    key: 'h',
    ctrl: true,
    action: () => window.location.href = '/app',
    description: 'Ir a Inicio',
    category: 'Navegación'
  },
  {
    key: 'a',
    ctrl: true,
    shift: true,
    action: () => window.location.href = '/hubs/agenda',
    description: 'Ir a Agenda',
    category: 'Navegación'
  },
  {
    key: 'p',
    ctrl: true,
    shift: true,
    action: () => window.location.href = '/hubs/expedix',
    description: 'Ir a Pacientes',
    category: 'Navegación'
  },
  
  // Actions
  {
    key: 'n',
    ctrl: true,
    action: () => {},
    description: 'Nuevo (contexto)',
    category: 'Acciones'
  },
  {
    key: 's',
    ctrl: true,
    action: () => {},
    description: 'Guardar',
    category: 'Acciones'
  },
  {
    key: 'Enter',
    ctrl: true,
    action: () => {},
    description: 'Enviar formulario',
    category: 'Acciones'
  },
  
  // Search
  {
    key: 'k',
    ctrl: true,
    action: () => {},
    description: 'Búsqueda global',
    category: 'Búsqueda'
  },
  {
    key: '/',
    action: () => {},
    description: 'Buscar en página',
    category: 'Búsqueda'
  },
  
  // UI
  {
    key: 'b',
    ctrl: true,
    action: () => {},
    description: 'Toggle sidebar',
    category: 'Interfaz'
  },
  {
    key: '?',
    shift: true,
    action: () => {},
    description: 'Mostrar ayuda',
    category: 'Ayuda'
  },
  {
    key: 'Escape',
    action: () => {},
    description: 'Cerrar/Cancelar',
    category: 'Interfaz'
  }
];

/**
 * Format shortcut for display
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const keys = [];
  
  if (shortcut.ctrl) keys.push('Ctrl');
  if (shortcut.cmd) keys.push('⌘');
  if (shortcut.alt) keys.push('Alt');
  if (shortcut.shift) keys.push('Shift');
  
  keys.push(shortcut.key.toUpperCase());
  
  return keys.join(' + ');
};