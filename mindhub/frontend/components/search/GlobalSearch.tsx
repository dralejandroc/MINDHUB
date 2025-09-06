'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  ClockIcon,
  HashtagIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';

/**
 * Search result types
 */
type SearchResultType = 'patient' | 'appointment' | 'document' | 'action' | 'setting' | 'recent';

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  metadata?: any;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * Global search and command palette component
 * Provides unified search across all modules with keyboard navigation
 */
export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const modalRef = useFocusTrap(isOpen);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Mock search function - replace with actual API calls
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // Show quick actions when no query
      setResults(getQuickActions());
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mock search results
    const mockResults: SearchResult[] = [];

    // Search patients
    if (searchQuery.toLowerCase().includes('pac') || searchQuery.toLowerCase().includes('juan')) {
      mockResults.push({
        id: 'patient-1',
        type: 'patient',
        title: 'Juan Pérez García',
        subtitle: 'Paciente • Última visita: hace 3 días',
        icon: UserIcon,
        action: () => {
          router.push('/hubs/expedix/patients/1');
          onClose();
        },
        keywords: ['paciente', 'juan', 'perez', 'garcia']
      });
    }

    // Search appointments
    if (searchQuery.toLowerCase().includes('cit') || searchQuery.toLowerCase().includes('agenda')) {
      mockResults.push({
        id: 'appointment-1',
        type: 'appointment',
        title: 'Cita - María López',
        subtitle: 'Hoy 15:00 • Consulta de seguimiento',
        icon: CalendarIcon,
        action: () => {
          router.push('/hubs/agenda?date=today&appointment=1');
          onClose();
        },
        keywords: ['cita', 'appointment', 'agenda', 'maria', 'lopez']
      });
    }

    // Search actions
    const actions = getQuickActions().filter(action =>
      action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.keywords?.some(keyword => keyword.includes(searchQuery.toLowerCase()))
    );
    mockResults.push(...actions);

    setResults(mockResults);
    setIsLoading(false);
  }, [router, onClose]);

  // Get quick actions
  const getQuickActions = (): SearchResult[] => [
    {
      id: 'action-new-patient',
      type: 'action',
      title: 'Nuevo Paciente',
      subtitle: 'Registrar un nuevo paciente',
      icon: UserIcon,
      action: () => {
        router.push('/hubs/expedix/new-patient');
        onClose();
      },
      keywords: ['nuevo', 'paciente', 'registrar', 'crear']
    },
    {
      id: 'action-new-appointment',
      type: 'action',
      title: 'Nueva Cita',
      subtitle: 'Agendar una nueva cita',
      icon: CalendarIcon,
      action: () => {
        router.push('/hubs/agenda?action=new');
        onClose();
      },
      keywords: ['nueva', 'cita', 'agendar', 'programar']
    },
    {
      id: 'action-new-consultation',
      type: 'action',
      title: 'Nueva Consulta',
      subtitle: 'Iniciar una nueva consulta médica',
      icon: DocumentTextIcon,
      action: () => {
        router.push('/hubs/expedix/consultations/new');
        onClose();
      },
      keywords: ['nueva', 'consulta', 'medical', 'expediente']
    },
    {
      id: 'action-payment',
      type: 'action',
      title: 'Registrar Pago',
      subtitle: 'Registrar un nuevo pago',
      icon: CurrencyDollarIcon,
      action: () => {
        router.push('/hubs/finance/new-payment');
        onClose();
      },
      keywords: ['pago', 'cobrar', 'finance', 'dinero']
    },
    {
      id: 'action-reports',
      type: 'action',
      title: 'Ver Reportes',
      subtitle: 'Dashboard de reportes y métricas',
      icon: ChartBarIcon,
      action: () => {
        router.push('/reports');
        onClose();
      },
      keywords: ['reportes', 'reports', 'metricas', 'estadisticas']
    },
    {
      id: 'action-settings',
      type: 'setting',
      title: 'Configuración',
      subtitle: 'Configuración del sistema',
      icon: Cog6ToothIcon,
      action: () => {
        router.push('/settings');
        onClose();
      },
      keywords: ['configuracion', 'settings', 'ajustes', 'preferencias']
    }
  ];

  // Handle search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    if (query) {
      const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updatedRecent);
      localStorage.setItem('recent-searches', JSON.stringify(updatedRecent));
    }

    // Execute action
    result.action();
  };

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const getResultIcon = (result: SearchResult) => {
    const Icon = result.icon || HashtagIcon;
    return <Icon className="h-5 w-5" />;
  };

  const getResultTypeColor = (type: SearchResultType) => {
    switch (type) {
      case 'patient':
        return 'text-blue-600 bg-blue-100';
      case 'appointment':
        return 'text-green-600 bg-green-100';
      case 'document':
        return 'text-purple-600 bg-purple-100';
      case 'action':
        return 'text-orange-600 bg-orange-100';
      case 'setting':
        return 'text-gray-600 bg-gray-100';
      case 'recent':
        return 'text-gray-500 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <div
          ref={modalRef}
          className={cn(
            'w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden',
            'transform transition-all duration-200',
            'animate-in zoom-in-95 fade-in',
            className
          )}
        >
          {/* Search Input */}
          <div className="relative border-b border-gray-200">
            <div className="flex items-center px-4 py-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar pacientes, citas, acciones..."
                className="flex-1 text-base outline-none placeholder-gray-400"
                aria-label="Búsqueda global"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
              />
              
              {/* Keyboard shortcut hint */}
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">
                  ESC
                </kbd>
                <span>para cerrar</span>
              </div>
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-200">
                <div className="h-full bg-primary-600 animate-pulse" />
              </div>
            )}
          </div>

          {/* Search Results */}
          <div
            ref={resultsRef}
            id="search-results"
            className="max-h-96 overflow-y-auto"
            role="listbox"
            aria-label="Resultados de búsqueda"
          >
            {results.length === 0 && query && !isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No se encontraron resultados para "{query}"</p>
                <p className="text-sm mt-2">Intenta con otros términos</p>
              </div>
            ) : (
              results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full px-4 py-3 flex items-center gap-3',
                    'hover:bg-gray-50 transition-colors text-left',
                    'focus:outline-none focus:bg-gray-50',
                    index === selectedIndex && 'bg-gray-50'
                  )}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className={cn(
                    'p-2 rounded-lg',
                    getResultTypeColor(result.type)
                  )}>
                    {getResultIcon(result)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>

                  {index === selectedIndex && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <span>Abrir</span>
                      <ArrowRightIcon className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="border-t border-gray-200 p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Búsquedas recientes</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(search)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <ClockIcon className="h-3 w-3" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer with tips */}
          <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">↑↓</kbd>
                  Navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd>
                  Seleccionar
                </span>
              </div>
              <span className="flex items-center gap-1">
                <CommandLineIcon className="h-3 w-3" />
                Comando + K para abrir
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Global search trigger hook
 * Allows opening search from anywhere with Cmd/Ctrl + K
 */
export const useGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
};