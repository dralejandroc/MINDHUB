'use client';

import Link from 'next/link';

interface LandingNavbarProps {
  onBetaClick: () => void;
}

export function LandingNavbar({ onBetaClick }: LandingNavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-blue to-primary-purple rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">MindHub</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary-blue transition-colors">
                Características
              </a>
              <a href="#plans" className="text-gray-600 hover:text-primary-blue transition-colors">
                Planes
              </a>
              <a href="#contact" className="text-gray-600 hover:text-primary-blue transition-colors">
                Contacto
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/login"
              className="text-gray-600 hover:text-primary-blue transition-colors font-medium"
            >
              Iniciar Sesión
            </Link>
            <button
              onClick={onBetaClick}
              className="bg-gradient-to-r from-primary-blue to-primary-purple text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
            >
              Unirse al Beta
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}