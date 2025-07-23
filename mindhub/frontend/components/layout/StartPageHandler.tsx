'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useStartPageRedirect } from '@/hooks/useStartPageRedirect';
import { 
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  FolderIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const START_PAGE_OPTIONS = {
  dashboard: { name: 'Dashboard Principal', icon: HomeIcon, color: 'text-blue-600' },
  reports: { name: 'Reportes y Análisis', icon: ChartBarIcon, color: 'text-purple-600' },
  expedix: { name: 'Expedix - Pacientes', icon: UserGroupIcon, color: 'text-green-600' },
  finance: { name: 'Finance - Finanzas', icon: BanknotesIcon, color: 'text-emerald-600' },
  agenda: { name: 'Agenda - Citas', icon: CalendarDaysIcon, color: 'text-indigo-600' },
  clinimetrix: { name: 'Clinimetrix - Evaluaciones', icon: ClipboardDocumentListIcon, color: 'text-cyan-600' },
  formx: { name: 'FormX - Formularios', icon: DocumentTextIcon, color: 'text-orange-600' },
  resources: { name: 'Resources - Recursos', icon: FolderIcon, color: 'text-pink-600' }
};

export function StartPageHandler() {
  const pathname = usePathname();
  const {
    preferences,
    loading,
    isRedirecting,
    countdown,
    shouldRedirect,
    performRedirect,
    cancelRedirect,
    forceRedirect,
    saveLastVisitedPage
  } = useStartPageRedirect();

  // Save current page when navigating
  useEffect(() => {
    if (pathname && pathname !== '/') {
      saveLastVisitedPage(pathname);
    }
  }, [pathname, saveLastVisitedPage]);

  // Check for redirect when on home page
  useEffect(() => {
    if (!loading && pathname === '/' && shouldRedirect(pathname)) {
      performRedirect();
    }
  }, [loading, pathname, shouldRedirect, performRedirect]);

  // Don't show anything if not redirecting or loading
  if (loading || !isRedirecting || pathname !== '/') {
    return null;
  }

  const targetOption = START_PAGE_OPTIONS[preferences.selectedStartPage as keyof typeof START_PAGE_OPTIONS];
  const TargetIcon = targetOption?.icon || HomeIcon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-blue-100 ${targetOption?.color || 'text-blue-600'}`}>
              <TargetIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Redirigiendo...
            </h2>
          </div>
          <button
            onClick={cancelRedirect}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center space-y-4">
          {preferences.showWelcomeMessage && (
            <div className="text-gray-600 mb-4">
              ¡Bienvenido a MindHub! 👋
            </div>
          )}

          <div className="space-y-2">
            <p className="text-gray-800">
              Serás dirigido a <strong>{targetOption?.name || 'Dashboard Principal'}</strong>
            </p>
            
            {countdown > 0 && (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-2xl font-bold text-blue-600">{countdown}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => forceRedirect()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Ir Ahora
            </Button>
            <Button
              onClick={cancelRedirect}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>

          {preferences.quickAccessEnabled && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">Acceso rápido:</p>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(START_PAGE_OPTIONS).slice(0, 4).map(([key, option]) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => forceRedirect(`/${key === 'dashboard' ? '' : key === 'reports' ? 'reports' : `hubs/${key}`}`)}
                      className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${option.color}`}
                      title={option.name}
                    >
                      <Icon className="h-5 w-5 mx-auto" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}