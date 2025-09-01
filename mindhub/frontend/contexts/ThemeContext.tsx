'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light'); // Start with 'light' as default
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Detect system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Update effective theme based on user preference and system
  useEffect(() => {
    const updateEffectiveTheme = () => {
      let newEffectiveTheme: 'light' | 'dark';
      
      if (theme === 'system') {
        newEffectiveTheme = getSystemTheme();
      } else {
        newEffectiveTheme = theme;
      }
      
      setEffectiveTheme(newEffectiveTheme);
      
      // Update document class and data attribute with smooth transition
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        
        // Add switching flag to disable transitions temporarily
        root.setAttribute('data-theme-switching', 'true');
        
        // Update theme
        root.classList.remove('light', 'dark');
        root.classList.add(newEffectiveTheme);
        root.setAttribute('data-theme', newEffectiveTheme);
        
        // Re-enable transitions after a brief delay
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            root.removeAttribute('data-theme-switching');
          });
        });
      }
    };

    updateEffectiveTheme();

    // Listen for system theme changes
    if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addListener(updateEffectiveTheme);
      
      return () => mediaQuery.removeListener(updateEffectiveTheme);
    }
  }, [theme]);

  // Load theme from localStorage on mount and apply initial theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('mindhub-theme') as Theme;
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setThemeState(storedTheme);
      } else {
        // Apply default theme immediately
        const root = document.documentElement;
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
      }
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mindhub-theme', newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}