'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { OnboardingTour } from './OnboardingTour';
import { HelpCenter } from './HelpCenter';
import { useOnboarding, onboardingTours } from '@/hooks/useOnboarding';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface OnboardingProviderProps {
  children: React.ReactNode;
}

/**
 * Global onboarding provider
 * Manages tours, tooltips, and help center
 */
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const { shouldShowTour, startTour } = useOnboarding();
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Detect current module from pathname
  const getCurrentModule = () => {
    if (!pathname) return null;
    if (pathname.includes('/agenda')) return 'agenda';
    if (pathname.includes('/expedix')) return 'expedix';
    if (pathname.includes('/clinimetrix')) return 'clinimetrix';
    if (pathname.includes('/formx')) return 'formx';
    if (pathname.includes('/finance')) return 'finance';
    if (pathname.includes('/frontdesk')) return 'frontdesk';
    if (pathname.includes('/dashboard')) return 'dashboard';
    return null;
  };

  const currentModule = getCurrentModule();

  // Auto-start welcome tour for new users
  useEffect(() => {
    if (!hasShownWelcome && shouldShowTour('welcome')) {
      const isNewUser = !localStorage.getItem('user_welcomed');
      if (isNewUser) {
        setTimeout(() => {
          const welcomeTour = onboardingTours.find(t => t.id === 'welcome');
          if (welcomeTour) {
            startTour(welcomeTour);
            localStorage.setItem('user_welcomed', 'true');
            setHasShownWelcome(true);
          }
        }, 1000);
      }
    }
  }, [shouldShowTour, startTour, hasShownWelcome]);

  // Auto-start module-specific tours
  useEffect(() => {
    if (currentModule) {
      const moduleTour = onboardingTours.find(t => t.module === currentModule);
      if (moduleTour && shouldShowTour(moduleTour.id)) {
        const hasSeenModule = localStorage.getItem(`module_tour_${currentModule}`);
        if (!hasSeenModule) {
          setTimeout(() => {
            startTour(moduleTour);
            localStorage.setItem(`module_tour_${currentModule}`, 'true');
          }, 500);
        }
      }
    }
  }, [currentModule, shouldShowTour, startTour]);

  // Keyboard shortcut for help center
  useKeyboardShortcuts([
    {
      key: 'h',
      shift: true,
      action: () => setShowHelpCenter(true),
      description: 'Abrir centro de ayuda'
    }
  ]);

  return (
    <>
      {children}
      
      {/* Floating help button */}
      <button
        onClick={() => setShowHelpCenter(true)}
        className="fixed bottom-6 right-6 z-50 p-3 bg-primary-600 text-white rounded-full 
                   shadow-lg hover:bg-primary-700 transition-all hover:scale-110
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Centro de ayuda"
      >
        <QuestionMarkCircleIcon className="h-6 w-6" />
      </button>

      {/* Onboarding tour overlay */}
      <OnboardingTour />

      {/* Help center modal */}
      <HelpCenter
        isOpen={showHelpCenter}
        onClose={() => setShowHelpCenter(false)}
        currentModule={currentModule || undefined}
      />
    </>
  );
};