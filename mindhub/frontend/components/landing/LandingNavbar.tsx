'use client';

import Link from 'next/link';
import { FlickeringGrid } from '@/components/ui/flickering-grid';

interface LandingNavbarProps {
  onBetaClick: () => void;
}

export function LandingNavbar({ onBetaClick }: LandingNavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-teal-100 relative overflow-hidden">
      {/* Subtle FlickeringGrid Background */}
      <div className="absolute inset-0 z-0">
        <FlickeringGrid
          squareSize={2}
          gridGap={8}
          flickerChance={0.2}
          color="rgb(20, 184, 166)" // teal-500
          maxOpacity={0.03}
          className="w-full h-full"
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600">MindHub</span>
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
              href="/sign-in"
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