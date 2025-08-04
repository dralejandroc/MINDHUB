'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    name: 'Home',
    href: '/app',
    icon: HomeIcon,
    status: 'active'
  },
  {
    id: 'agenda',
    name: 'Agenda',
    href: '/hubs/agenda',
    icon: CalendarIcon,
    status: 'active'
  },
  {
    id: 'expedix',
    name: 'Expedix',
    href: '/hubs/expedix',
    icon: UserGroupIcon,
    status: 'active'
  },
  {
    id: 'clinimetrix',
    name: 'ClinimetrixPro',
    href: '/hubs/clinimetrix',
    icon: DocumentChartBarIcon,
    status: 'active'
  },
  {
    id: 'resources',
    name: 'Resources',
    href: '/hubs/resources',
    icon: BookOpenIcon,
    status: 'active'
  },
  {
    id: 'finance',
    name: 'Finance',
    href: '/hubs/finance',
    icon: BanknotesIcon,
    status: 'active'
  },
  {
    id: 'frontdesk',
    name: 'FrontDesk',
    href: '/frontdesk',
    icon: ClipboardDocumentListIcon,
    status: 'active'
  }
  // FormX removed for beta deployment
  // Reports integrated into other modules
];

interface UnifiedSidebarProps {
  children?: React.ReactNode;
  currentUser?: {
    name?: string;
    email?: string;
    role?: string;
  };
}

export function UnifiedSidebar({ children, currentUser }: UnifiedSidebarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed

  // Keep sidebar collapsed when navigating between pages
  useEffect(() => {
    setIsCollapsed(true);
    setSidebarOpen(false); // Also close mobile sidebar when navigating
  }, [pathname]);

  // Default user if not provided - read from localStorage first
  const user = currentUser || (() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    }
    return {
      id: '',
    name: 'Loading...',
    email: '',
    role: ''
    };
  })();

  const handleLogout = async () => {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      try {
        // Call logout API
        const token = localStorage.getItem('auth_token');
        if (token) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear all auth data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
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
    setIsCollapsed(!isCollapsed);
  };

  const sidebarWidth = isCollapsed ? 'w-12' : 'w-40'; // Collapsed: w-12, Expanded: w-40 (10% increase from w-36)
  const sidebarWidthLg = isCollapsed ? 'sm:w-12' : 'sm:w-40';

  const renderNavigationItem = (item: typeof NAVIGATION_ITEMS[0]) => {
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
              ? 'gradient-primary text-white shadow-primary'
              : isDisabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700',
            isCollapsed ? 'justify-center px-2 py-1.5' : 'justify-start px-3 py-1.5'
          )}
          title={isCollapsed ? item.name : undefined}
        >
          <IconComponent 
            className={cn(
              'h-4 w-4 flex-shrink-0',
              isCurrent ? 'text-white' : 'text-gray-400 group-hover:text-primary-600',
              isCollapsed ? 'mr-0' : 'mr-2'
            )}
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

  const renderSidebar = () => (
    <>
      {/* Mobile Sidebar */}
      <aside 
        className={cn(
          'sm:hidden fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out',
          sidebarWidth,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderSidebarContent()}
      </aside>
      
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          'hidden sm:flex sm:flex-col sm:fixed sm:inset-y-0 sm:left-0 sm:z-40 bg-white border-r border-primary-200 transition-all duration-300 shadow-primary relative before:absolute before:top-0 before:right-0 before:bottom-0 before:w-1 before:border-gradient',
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
        'flex items-center justify-between py-3 gradient-background border-b border-primary-200',
        isCollapsed ? 'px-2' : 'px-3'
      )}>
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
              <HeartIcon className="h-4 w-4 text-white" />
            </div>
            <span className="ml-2 text-lg font-bold text-dark-green font-heading">✨ MindHub</span>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center w-full">
            <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
              <HeartIcon className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        
        {/* Mobile close button */}
        <button
          onClick={toggleSidebar}
          className="sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Collapse/Expand button for desktop - above navigation */}
      <div className="hidden sm:block border-b border-primary-100">
        <button
          onClick={toggleCollapse}
          className={cn(
            'w-full flex items-center justify-center py-1.5 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200',
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

      {/* Navigation */}
      <nav className={cn(
        'flex-1 py-4 space-y-1 overflow-y-auto',
        isCollapsed ? 'px-2' : 'px-3'
      )}>
        <ul className="space-y-1">
          {NAVIGATION_ITEMS.map(renderNavigationItem)}
        </ul>
      </nav>

      {/* User section - only show when not collapsed */}
      {!isCollapsed && (
        <div className="border-t border-primary-200 gradient-background p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="h-7 w-7 gradient-secondary rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-dark-green">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Link
                href="/settings"
                className="p-1 text-gray-500 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition-all duration-200"
                title="Configuración"
              >
                <CogIcon className="h-3 w-3" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-1 text-accent-600 hover:bg-accent-50 rounded-lg transition-all duration-200"
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
        <div className="border-t border-primary-200 gradient-background p-2">
          <div className="flex flex-col items-center space-y-1.5">
            <div className="w-7 h-7 gradient-secondary rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <Link
              href="/settings"
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-all duration-200"
              title="Configuración"
            >
              <CogIcon className="h-3 w-3" />
            </Link>
            <button
              onClick={handleLogout}
              className="w-7 h-7 flex items-center justify-center text-accent-600 hover:bg-accent-50 rounded-lg transition-all duration-200"
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
    <div className="min-h-screen gradient-background">
      {renderSidebar()}
      
      {/* Mobile menu button - only on very small screens */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border border-gray-200 text-gray-600 hover:text-gray-900"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      )}

      {/* Main content area */}
      <div className={cn(
        'min-h-screen transition-all duration-300 relative z-10',
        // Mobile: full width
        'w-full',
        // Desktop: account for sidebar width
        isCollapsed ? 'sm:ml-12' : 'sm:ml-40'
      )}>
        {/* Top bar for mobile/collapsed mode user info */}
        <div className={cn(
          'sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8',
          !isCollapsed && 'sm:hidden'
        )}>
          <div className="flex items-center">
            {/* Mobile hamburger - only show on very small screens */}
            <button
              type="button"
              className="sm:hidden -m-2.5 p-2.5 text-gray-700"
              onClick={toggleSidebar}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          {/* User info in top bar when collapsed on desktop */}
          <div className={cn(
            'flex items-center gap-x-3',
            !isCollapsed && 'sm:hidden'
          )}>
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
            <div className="hidden sm:flex sm:flex-col sm:items-start">
              <span className="text-sm font-semibold leading-6 text-gray-900">
                {user.name}
              </span>
              <span className="text-xs leading-5 text-gray-500">
                {user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-500"
              title="Cerrar Sesión"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay - only on very small screens */}
      {sidebarOpen && (
        <div 
          className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}