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
  CalendarIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/hubs',
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
    name: 'Clinimetrix',
    href: '/hubs/clinimetrix',
    icon: DocumentChartBarIcon,
    status: 'active'
  },
  {
    id: 'formx',
    name: 'FormX',
    href: '/hubs/formx',
    icon: DocumentTextIcon,
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
    id: 'reports',
    name: 'Reportes',
    href: '/reports',
    icon: ChartBarIcon,
    status: 'active'
  },
  {
    id: 'settings',
    name: 'Configuración',
    href: '/settings',
    icon: CogIcon,
    status: 'active'
  }
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

  // Default user if not provided
  const user = currentUser || {
    name: 'Administrador',
    email: 'admin@mindhub.com',
    role: 'professional'
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const isCurrentPage = (href: string) => {
    if (href === '/hubs') {
      return pathname === '/hubs' || pathname === '/';
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
            'group flex items-center text-sm font-medium rounded-md transition-all duration-200',
            isCurrent
              ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
              : isDisabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
            isCollapsed ? 'justify-center px-2 py-2' : 'justify-start px-3 py-2'
          )}
          title={isCollapsed ? item.name : undefined}
        >
          <IconComponent 
            className={cn(
              'h-5 w-5 flex-shrink-0',
              isCurrent ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500',
              isCollapsed ? 'mr-0' : 'mr-3'
            )}
          />
          {!isCollapsed && (
            <>
              <span className="flex-1">{item.name}</span>
              {item.status === 'coming-soon' && (
                <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
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
          'hidden sm:flex sm:flex-col sm:fixed sm:inset-y-0 sm:left-0 sm:z-40 bg-white border-r border-gray-200 transition-all duration-300',
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
        'flex items-center justify-between py-4 border-b border-gray-200',
        isCollapsed ? 'px-2' : 'px-3'
      )}>
        {!isCollapsed && (
          <div className="flex items-center">
            <HeartIcon className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">MindHub</span>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center w-full">
            <HeartIcon className="h-8 w-8 text-primary-600" />
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
      <div className="hidden sm:block border-b border-gray-200">
        <button
          onClick={toggleCollapse}
          className={cn(
            'w-full flex items-center justify-center py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            isCollapsed ? 'px-2' : 'px-3'
          )}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              <span>Contraer</span>
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
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center mb-3">
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      )}

      {/* Collapsed user section */}
      {isCollapsed && (
        <div className="border-t border-gray-200 p-2">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
              title="Cerrar Sesión"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
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