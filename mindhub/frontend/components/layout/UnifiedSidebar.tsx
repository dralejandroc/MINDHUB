'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { MindHubFooter } from '@/components/ui/footer';
import { useFooterConfig } from '@/hooks/useFooterVariant';
// // import { useAuth } from '@supabase/nextjs';
import {
  UserGroupIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  BookOpenIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  UserCircleIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Grouped navigation structure for better UX
const NAVIGATION_GROUPS = [
  {
    id: 'main',
    name: 'Principal',
    items: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        href: '/app',
        icon: HomeIcon,
        status: 'active',
        description: 'Vista general'
      },
      {
        id: 'frontdesk',
        name: 'Recepción',
        href: '/frontdesk',
        icon: ClipboardDocumentListIcon,
        status: 'active',
        description: 'Gestión de llegadas'
      }
    ]
  },
  {
    id: 'clinical',
    name: 'Gestión Clínica',
    items: [
      {
        id: 'agenda',
        name: 'Agenda',
        href: '/hubs/agenda',
        icon: CalendarIcon,
        status: 'active',
        description: 'Citas y horarios'
      },
      {
        id: 'expedix',
        name: 'Expedientes',
        href: '/hubs/expedix',
        icon: UserGroupIcon,
        status: 'active',
        description: 'Pacientes y consultas'
      },
      {
        id: 'clinimetrix',
        name: 'Evaluaciones',
        href: '/hubs/clinimetrix',
        icon: DocumentChartBarIcon,
        status: 'active',
        description: 'Escalas psicométricas'
      }
    ]
  },
  {
    id: 'administration',
    name: 'Administración',
    items: [
      {
        id: 'finance',
        name: 'Finanzas',
        href: '/hubs/finance',
        icon: BanknotesIcon,
        status: 'active',
        description: 'Facturación y pagos'
      },
      // {
      //   id: 'formx',
      //   name: 'Formularios',
      //   href: '/hubs/formx',
      //   icon: DocumentTextIcon,
      //   status: 'active',
      //   description: 'Plantillas médicas'
      // },
      {
        id: 'resources',
        name: 'Recursos',
        href: '/hubs/resources',
        icon: BookOpenIcon,
        status: 'active',
        description: 'Documentos y archivos'
      }
    ]
  }
];

interface UnifiedSidebarProps {
  children?: React.ReactNode;
}

export function UnifiedSidebar({ children }: UnifiedSidebarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
  const footerConfig = useFooterConfig();

  // Close mobile sidebar on navigation, but persist desktop collapse state
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Persist collapse state in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setIsCollapsed(saved === 'true');
  }, []);

  const persistCollapse = (value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem('sidebar-collapsed', String(value));
  };

  // Get user from Supabase Auth
  const { user } = useAuth();
  
  const displayUser = {
    name: user?.user_metadata?.first_name ? 
      `${user.user_metadata.first_name} ${user.user_metadata.last_name}`.trim() :
      user?.email?.split('@')[0] || 'Usuario',
    email: user?.email || '',
    role: user?.user_metadata?.role || 'professional'
  };

  const handleLogout = async () => {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      try {
        // Use Supabase signOut
        const { signOut } = await import('@/lib/supabase/client');
        await signOut();
        // Clear any non-auth local storage if needed
        localStorage.removeItem('userMetrics');
        window.location.href = '/sign-in';
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const isCurrentPage = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    
    // Handle specific cases for Expedix vs Pacientes
    if (href === '/hubs/expedix/pacientes') {
      return pathname === '/hubs/expedix/pacientes';
    }
    if (href === '/hubs/expedix') {
      return pathname === '/hubs/expedix' || (pathname?.startsWith('/hubs/expedix') && !pathname?.includes('pacientes'));
    }
    
    return pathname?.startsWith(href) || false;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapse = () => {
    persistCollapse(!isCollapsed);
  };

  const sidebarWidth = isCollapsed ? 'w-14' : 'w-56';
  const sidebarWidthLg = isCollapsed ? 'sm:w-14' : 'sm:w-56';

  const renderNavigationItem = (item: typeof NAVIGATION_GROUPS[0]['items'][0]) => {
    const IconComponent = item.icon;
    const isCurrent = isCurrentPage(item.href);
    const isDisabled = item.status === 'coming-soon';
    
    return (
      <li key={item.id}>
        <Link
          href={isDisabled ? '#' : item.href}
          onClick={isDisabled ? (e) => e.preventDefault() : undefined}
          className={cn(
            'group flex items-center text-xs font-medium rounded-xl transition-all duration-300 hover-lift',
            isCurrent
              ? 'bg-primary text-theme-on-accent shadow-theme-md'
              : isDisabled
                ? 'text-theme-tertiary cursor-not-allowed'
                : 'text-theme-secondary hover:bg-theme-tertiary hover:text-primary',
            isCollapsed ? 'justify-center px-2 py-1.5' : 'justify-start px-3 py-1.5'
          )}
          title={isCollapsed ? `${item.name}: ${item.description}` : item.description}
          aria-label={`${item.name}: ${item.description}`}
          aria-current={isCurrent ? 'page' : undefined}
        >
          <IconComponent 
            className={cn(
              'h-4 w-4 flex-shrink-0',
              isCurrent ? 'text-theme-on-accent' : 'text-theme-tertiary group-hover:text-primary',
              isCollapsed ? 'mr-0' : 'mr-2'
            )}
            aria-hidden="true"
          />
          {!isCollapsed && (
            <>
              <span className="flex-1">{item.name}</span>
              {item.status === 'coming-soon' && (
                <span className="ml-auto text-xs bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded-full font-medium">
                  Próximo
                </span>
              )}
            </>
          )}
        </Link>
      </li>
    );
  };

  const renderNavigationGroup = (group: typeof NAVIGATION_GROUPS[0]) => {
    return (
      <div key={group.id} className="mb-4">
        {!isCollapsed && (
          <h3 className="px-3 mb-2 text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
            {group.name}
          </h3>
        )}
        {isCollapsed && (
          <div className="mb-2 border-t border-theme-primary opacity-20" aria-hidden="true" />
        )}
        <ul className="space-y-1">
          {group.items.map(renderNavigationItem)}
        </ul>
      </div>
    );
  };

  const renderSidebar = () => (
    <>
      {/* Mobile Sidebar */}
      <aside 
        className={cn(
          'sm:hidden fixed inset-y-0 left-0 z-50 sidebar-theme transform transition-all duration-300 ease-in-out',
          sidebarWidth,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderSidebarContent()}
      </aside>
      
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          'hidden sm:flex sm:flex-col sm:fixed sm:inset-y-0 sm:left-0 sm:z-40 sidebar-theme transition-all duration-300 shadow-theme-lg relative before:absolute before:top-0 before:right-0 before:bottom-0 before:w-1 before:border-gradient',
          sidebarWidthLg
        )}
      >
        {renderSidebarContent()}
      </aside>
    </>
  );

  const renderSidebarContent = () => (
    <>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between py-3 bg-theme-surface border-b border-theme-primary',
        isCollapsed ? 'px-2' : 'px-3'
      )}>
        {!isCollapsed && (
          <div className="flex items-center">
            <Image
              src="/logos/glian-logo-primary.png"
              alt="Glian"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center w-full">
            <Image
              src="/logos/glian-isotipo.png"
              alt="Glian"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
          </div>
        )}
        
        {/* Mobile close button */}
        <button
          onClick={toggleSidebar}
          className="sm:hidden p-2 rounded-md text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Collapse/Expand button for desktop - above navigation */}
      <div className="hidden sm:block border-b border-theme-primary">
        <button
          onClick={toggleCollapse}
          className={cn(
            'w-full flex items-center justify-center py-1.5 text-xs text-primary hover:text-primary-dark hover:bg-theme-tertiary transition-all duration-200',
            isCollapsed ? 'px-2' : 'px-3'
          )}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-3 w-3" />
          ) : (
            <>
              <ChevronLeftIcon className="h-3 w-3 mr-1" />
              <span className="font-medium">Contraer</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation with Groups */}
      <nav 
        className={cn(
          'flex-1 py-4 overflow-y-auto',
          isCollapsed ? 'px-2' : 'px-0'
        )}
        role="navigation"
        aria-label="Navegación principal"
      >
        {NAVIGATION_GROUPS.map(renderNavigationGroup)}
      </nav>

      {/* User section - only show when not collapsed */}
      {!isCollapsed && (
        <div className="border-t border-theme-primary bg-theme-surface p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="h-7 w-7 gradient-secondary rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {displayUser.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-theme-primary">{displayUser.name}</p>
                <p className="text-xs text-theme-secondary">{displayUser.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Link
                href="/settings"
                className="p-1 text-theme-secondary hover:text-primary hover:bg-theme-tertiary rounded-lg transition-all duration-200"
                title="Configuración"
              >
                <CogIcon className="h-3 w-3" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-1 text-danger hover:bg-danger-light rounded-lg transition-all duration-200"
                title="Cerrar Sesión"
              >
                <ArrowLeftOnRectangleIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed user section */}
      {isCollapsed && (
        <div className="border-t border-theme-primary bg-theme-surface p-2">
          <div className="flex flex-col items-center space-y-1.5">
            <div className="w-7 h-7 gradient-secondary rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {displayUser.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <Link
              href="/settings"
              className="w-7 h-7 flex items-center justify-center text-theme-secondary hover:bg-theme-tertiary hover:text-primary rounded-lg transition-all duration-200"
              title="Configuración"
            >
              <CogIcon className="h-3 w-3" />
            </Link>
            <button
              onClick={handleLogout}
              className="w-7 h-7 flex items-center justify-center text-danger hover:bg-danger-light rounded-lg transition-all duration-200"
              title="Cerrar Sesión"
            >
              <ArrowLeftOnRectangleIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="overflow-x-hidden gradient-background">
      {renderSidebar()}

      {/* Main content: block element — naturally shrinks to (100vw - sidebar) */}
      <div className={cn(
        'flex flex-col min-h-screen transition-all duration-300',
        isCollapsed ? 'sm:ml-14' : 'sm:ml-56'
      )}>
        {/* Mobile-only top bar */}
        <div className="sm:hidden shrink-0 flex h-10 items-center justify-between border-b border-gray-200 bg-white px-3 shadow-sm">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            title="Cerrar Sesión"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="px-3 sm:px-4 lg:px-5 py-3 sm:py-4">
            {children}
          </div>
        </main>

        {/* Adaptive Footer */}
        {footerConfig.show && (
          <MindHubFooter
            variant={footerConfig.variant}
            className={footerConfig.className}
          />
        )}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}