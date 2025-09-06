'use client';

import React, { useState, useEffect } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

/**
 * Mobile-optimized layout with responsive breakpoints
 * Provides touch-friendly interfaces and optimized viewport management
 */
export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
  children,
  sidebar,
  header,
  showBottomNav = true,
  className = ''
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      
      // Handle mobile viewport height (accounts for browser chrome)
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(`${window.innerHeight}px`);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, sidebarOpen]);

  return (
    <div 
      className={cn(
        'flex flex-col md:flex-row',
        className
      )}
      style={{ minHeight: viewportHeight }}
    >
      {/* Mobile Header */}
      {isMobile && header && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {sidebar && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {sidebarOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            )}
            <div className="flex-1">{header}</div>
          </div>
        </header>
      )}

      {/* Sidebar - Drawer on mobile, fixed on desktop */}
      {sidebar && (
        <>
          {/* Mobile Sidebar Drawer */}
          {isMobile && (
            <>
              {/* Overlay */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                  aria-hidden="true"
                />
              )}
              
              {/* Drawer */}
              <aside
                className={cn(
                  'fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden',
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
              >
                <div className="h-full overflow-y-auto">
                  {sidebar}
                </div>
              </aside>
            </>
          )}

          {/* Desktop Sidebar */}
          {!isMobile && (
            <aside className="hidden md:block md:w-64 lg:w-72 bg-white border-r border-gray-200">
              <div className="h-full overflow-y-auto">
                {sidebar}
              </div>
            </aside>
          )}
        </>
      )}

      {/* Main Content */}
      <main 
        className={cn(
          'flex-1 overflow-y-auto',
          isMobile && header && 'pt-16', // Account for fixed header
          isMobile && showBottomNav && 'pb-16' // Account for bottom nav
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && showBottomNav && (
        <MobileBottomNav />
      )}
    </div>
  );
};

/**
 * Mobile bottom navigation component
 * Provides thumb-friendly navigation for mobile users
 */
const MobileBottomNav: React.FC = () => {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: '🏠', href: '/app' },
    { id: 'agenda', label: 'Agenda', icon: '📅', href: '/hubs/agenda' },
    { id: 'patients', label: 'Pacientes', icon: '👥', href: '/hubs/expedix' },
    { id: 'more', label: 'Más', icon: '⋯', href: '#' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 safe-bottom">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-primary-600 transition-colors touch-manipulation"
            aria-label={item.label}
          >
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};

/**
 * Touch-optimized button with larger hit targets
 */
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'min-h-[44px] px-4 py-2 text-sm', // 44px minimum for touch targets
    md: 'min-h-[48px] px-5 py-3 text-base',
    lg: 'min-h-[56px] px-6 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
  };

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors touch-manipulation',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95 transform',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};