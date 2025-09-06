import { useState, useEffect, useCallback } from 'react';

export interface OnboardingStep {
  id: string;
  target: string; // CSS selector for element to highlight
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
  skippable?: boolean;
}

export interface OnboardingTour {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  module?: string; // Specific module this tour belongs to
}

/**
 * Onboarding hook for guided tours and tooltips
 */
export const useOnboarding = (tourId?: string) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [skippedTours, setSkippedTours] = useState<string[]>([]);
  const [currentTour, setCurrentTour] = useState<OnboardingTour | null>(null);

  // Load saved onboarding state
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_state');
    if (saved) {
      const state = JSON.parse(saved);
      setCompletedTours(state.completed || []);
      setSkippedTours(state.skipped || []);
    }
  }, []);

  // Save onboarding state
  const saveState = useCallback(() => {
    localStorage.setItem('onboarding_state', JSON.stringify({
      completed: completedTours,
      skipped: skippedTours,
      lastUpdated: new Date().toISOString()
    }));
  }, [completedTours, skippedTours]);

  // Start a tour
  const startTour = useCallback((tour: OnboardingTour) => {
    setCurrentTour(tour);
    setCurrentStep(0);
    setIsActive(true);
    
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_started', {
        tour_id: tour.id,
        tour_name: tour.name
      });
    }
  }, []);

  // Go to next step
  const nextStep = useCallback(() => {
    if (!currentTour) return;
    
    if (currentStep < currentTour.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentTour, currentStep]);

  // Go to previous step
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Skip tour
  const skipTour = useCallback(() => {
    if (!currentTour) return;
    
    setSkippedTours(prev => [...prev, currentTour.id]);
    setIsActive(false);
    setCurrentTour(null);
    saveState();
  }, [currentTour, saveState]);

  // Complete tour
  const completeTour = useCallback(() => {
    if (!currentTour) return;
    
    setCompletedTours(prev => [...prev, currentTour.id]);
    setIsActive(false);
    setCurrentTour(null);
    saveState();
    
    // Track completion
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_completed', {
        tour_id: currentTour.id,
        tour_name: currentTour.name
      });
    }
  }, [currentTour, saveState]);

  // Check if should show tour
  const shouldShowTour = useCallback((tourId: string) => {
    return !completedTours.includes(tourId) && !skippedTours.includes(tourId);
  }, [completedTours, skippedTours]);

  // Reset onboarding for user
  const resetOnboarding = useCallback(() => {
    setCompletedTours([]);
    setSkippedTours([]);
    localStorage.removeItem('onboarding_state');
  }, []);

  // Get progress
  const getProgress = useCallback(() => {
    if (!currentTour) return 0;
    return ((currentStep + 1) / currentTour.steps.length) * 100;
  }, [currentStep, currentTour]);

  return {
    isActive,
    currentStep,
    currentTour,
    completedTours,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    shouldShowTour,
    resetOnboarding,
    getProgress,
    totalSteps: currentTour?.steps.length || 0
  };
};

/**
 * Predefined onboarding tours
 */
export const onboardingTours: OnboardingTour[] = [
  {
    id: 'welcome',
    name: 'Bienvenida a MindHub',
    description: 'Tour general de la plataforma',
    steps: [
      {
        id: 'welcome-1',
        target: '.sidebar',
        title: 'Panel de Navegación',
        content: 'Aquí encontrarás todos los módulos de MindHub organizados por categorías',
        position: 'right'
      },
      {
        id: 'welcome-2',
        target: '[data-module="expedix"]',
        title: 'Gestión de Pacientes',
        content: 'Expedix te permite gestionar expedientes médicos y consultas',
        position: 'right'
      },
      {
        id: 'welcome-3',
        target: '[data-module="agenda"]',
        title: 'Agenda de Citas',
        content: 'Programa y gestiona todas tus citas médicas',
        position: 'right'
      },
      {
        id: 'welcome-4',
        target: '.global-search-trigger',
        title: 'Búsqueda Global',
        content: 'Presiona ⌘K para buscar pacientes, citas o cualquier información',
        position: 'bottom'
      },
      {
        id: 'welcome-5',
        target: '.dark-mode-toggle',
        title: 'Modo Oscuro',
        content: 'Cambia entre modo claro y oscuro según tu preferencia',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'agenda-tour',
    name: 'Tour de Agenda',
    description: 'Aprende a usar el sistema de citas',
    module: 'agenda',
    steps: [
      {
        id: 'agenda-1',
        target: '.weekly-view',
        title: 'Vista Semanal',
        content: 'Visualiza todas las citas de la semana en una sola pantalla',
        position: 'center'
      },
      {
        id: 'agenda-2',
        target: '.appointment-card',
        title: 'Tarjetas de Citas',
        content: 'Arrastra y suelta para reprogramar citas fácilmente',
        position: 'top'
      },
      {
        id: 'agenda-3',
        target: '.new-appointment-btn',
        title: 'Nueva Cita',
        content: 'Haz clic aquí o presiona Ctrl+N para crear una nueva cita',
        position: 'bottom'
      },
      {
        id: 'agenda-4',
        target: '.consultation-action',
        title: 'Iniciar Consulta',
        content: 'Arrastra una cita aquí para iniciar la consulta médica',
        position: 'top'
      }
    ]
  },
  {
    id: 'expedix-tour',
    name: 'Tour de Expedientes',
    description: 'Gestión de pacientes y expedientes',
    module: 'expedix',
    steps: [
      {
        id: 'expedix-1',
        target: '.patient-list',
        title: 'Lista de Pacientes',
        content: 'Aquí puedes ver y buscar todos tus pacientes',
        position: 'center'
      },
      {
        id: 'expedix-2',
        target: '.new-patient-btn',
        title: 'Nuevo Paciente',
        content: 'Registra nuevos pacientes con información completa',
        position: 'bottom'
      },
      {
        id: 'expedix-3',
        target: '.patient-record',
        title: 'Expediente Médico',
        content: 'Accede al historial completo del paciente',
        position: 'right'
      },
      {
        id: 'expedix-4',
        target: '.prescription-btn',
        title: 'Recetas',
        content: 'Genera recetas digitales directamente desde el expediente',
        position: 'left'
      }
    ]
  },
  {
    id: 'clinimetrix-tour',
    name: 'Tour de Evaluaciones',
    description: 'Sistema de evaluaciones psicométricas',
    module: 'clinimetrix',
    steps: [
      {
        id: 'clinimetrix-1',
        target: '.scale-selector',
        title: 'Selector de Escalas',
        content: 'Elige entre 29 escalas psicométricas disponibles',
        position: 'center'
      },
      {
        id: 'clinimetrix-2',
        target: '.scale-categories',
        title: 'Categorías',
        content: 'Las escalas están organizadas por tipo: depresión, ansiedad, etc.',
        position: 'right'
      },
      {
        id: 'clinimetrix-3',
        target: '.evaluation-form',
        title: 'Formulario de Evaluación',
        content: 'Completa las preguntas y obtén resultados automáticos',
        position: 'center'
      },
      {
        id: 'clinimetrix-4',
        target: '.results-panel',
        title: 'Resultados',
        content: 'Los resultados se guardan automáticamente en el expediente',
        position: 'left'
      }
    ]
  }
];