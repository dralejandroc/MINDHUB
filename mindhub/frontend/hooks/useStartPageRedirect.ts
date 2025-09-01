'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StartPagePreferences {
  selectedStartPage: string;
  showWelcomeMessage: boolean;
  quickAccessEnabled: boolean;
  rememberLastVisited: boolean;
  autoRedirectEnabled: boolean;
  autoRedirectDelay: number;
}

const DEFAULT_PREFERENCES: StartPagePreferences = {
  selectedStartPage: 'dashboard',
  showWelcomeMessage: false,
  quickAccessEnabled: true,
  rememberLastVisited: false,
  autoRedirectEnabled: false,
  autoRedirectDelay: 3
};

const START_PAGE_ROUTES = {
  dashboard: '/app',
  reports: '/reports',
  expedix: '/hubs/expedix',
  finance: '/hubs/finance',
  agenda: '/hubs/agenda',
  clinimetrix: '/hubs/clinimetrix',
  formx: '/hubs/formx',
  resources: '/hubs/resources'
};

export function useStartPageRedirect() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<StartPagePreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('startPagePreferences');
      if (saved) {
        const parsedPreferences = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsedPreferences });
      }
    } catch (error) {
      console.error('Error loading start page preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save last visited page
  const saveLastVisitedPage = (pathname: string) => {
    if (preferences.rememberLastVisited) {
      localStorage.setItem('lastVisitedPage', pathname);
    }
  };

  // Get the target route based on preferences
  const getTargetRoute = (): string => {
    if (preferences.rememberLastVisited) {
      const lastVisited = localStorage.getItem('lastVisitedPage');
      if (lastVisited && lastVisited !== '/app') {
        return lastVisited;
      }
    }
    
    const route = START_PAGE_ROUTES[preferences.selectedStartPage as keyof typeof START_PAGE_ROUTES];
    return route || '/app';
  };

  // Perform redirect with optional countdown
  const performRedirect = (targetRoute?: string) => {
    const route = targetRoute || getTargetRoute();
    
    if (route === '/app') {
      // Already on app home, no need to redirect
      return;
    }

    if (preferences.autoRedirectEnabled && !isRedirecting) {
      setIsRedirecting(true);
      setCountdown(preferences.autoRedirectDelay);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push(route);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Immediate redirect
      router.push(route);
    }
  };

  // Cancel countdown and redirect
  const cancelRedirect = () => {
    setIsRedirecting(false);
    setCountdown(0);
  };

  // Force immediate redirect
  const forceRedirect = (targetRoute?: string) => {
    const route = targetRoute || getTargetRoute();
    router.push(route);
  };

  // Check if should redirect (call this on app startup)
  const shouldRedirect = (currentPath: string): boolean => {
    if (loading) {
      return false;
    }

    // NEVER redirect when user is working on forms, consultations, or any important content
    const workingPaths = [
      '/settings',
      '/hubs/expedix',
      '/hubs/agenda', 
      '/hubs/clinimetrix',
      '/hubs/formx',
      '/hubs/finance',
      '/hubs/resources',
      '/reports',
      '/clinic',
      '/auth',
      '/forms',
      '/assessment'
    ];

    // Check if user is on any working path
    const isWorkingOnContent = workingPaths.some(path => 
      currentPath === path || currentPath.startsWith(path)
    );

    if (isWorkingOnContent) {
      return false;
    }

    // Only redirect if explicitly on /app home page AND auto-redirect is enabled
    const targetRoute = getTargetRoute();
    return currentPath === '/app' && targetRoute !== '/app' && preferences.autoRedirectEnabled;
  };

  return {
    preferences,
    loading,
    isRedirecting,
    countdown,
    shouldRedirect,
    performRedirect,
    cancelRedirect,
    forceRedirect,
    saveLastVisitedPage,
    getTargetRoute
  };
}