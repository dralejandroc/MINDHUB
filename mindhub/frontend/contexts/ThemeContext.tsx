'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light'; // Removed 'dark' and 'system' options

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>('light'); // Always light
  const [effectiveTheme] = useState<'light'>('light'); // Always light

  // Force light theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      // Force light mode
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      
      // Clear any stored theme preference
      localStorage.removeItem('mindhub-theme');
    }
  }, []);

  // Disabled setTheme function
  const setTheme = (newTheme: Theme) => {
    // Do nothing - theme is always light
    console.log('Theme switching is disabled. Application is locked to light mode.');
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