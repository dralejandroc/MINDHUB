'use client';

import Link from 'next/link';
import Image from 'next/image';

interface LandingNavbarProps {
  onBetaClick: () => void;
}

export function LandingNavbar({ onBetaClick }: LandingNavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-primary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logos/glian-logo-primary.png"
                alt="Glian"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">
                Características
              </a>
              <a href="#plans" className="text-gray-600 hover:text-primary-600 transition-colors">
                Planes
              </a>
              <a href="#contact" className="text-gray-600 hover:text-primary-600 transition-colors">
                Contacto
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href="/sign-in"
              className="text-gray-600 hover:text-primary-600 transition-colors font-medium"
            >
              Iniciar Sesión
            </Link>
            <button
              onClick={onBetaClick}
              className="gradient-primary text-white px-6 py-2 rounded-lg hover:shadow-primary-hover transition-all duration-200 font-medium"
            >
              Unirse al Beta
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}