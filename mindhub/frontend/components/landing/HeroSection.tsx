'use client';

import Link from 'next/link';

interface HeroSectionProps {
  onBetaClick: () => void;
}

export function HeroSection({ onBetaClick }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-white via-gray-50 to-white py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Beta Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-blue/10 text-primary-blue text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-primary-blue rounded-full mr-2 animate-pulse"></span>
            Beta Abierto - Registro Gratuito
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            La plataforma integral para
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-blue to-primary-purple">
              profesionales de salud mental
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Gestiona expedientes clínicos completos inteligentes, aplica escalas clinimétricas estandarizadas automáticas, organiza recursos terapéuticos y psicoeducativos y administra tu práctica desde una sola plataforma diseñada por psiquiatras y psicólogos para psicólogos y psiquiatras.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={onBetaClick}
              className="w-full sm:w-auto bg-gradient-to-r from-primary-teal to-primary-blue text-white px-8 py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg"
            >
              🚀 Únete al Beta Gratuito
            </button>
            <button
              onClick={onBetaClick}
              className="w-full sm:w-auto border-2 border-primary-teal text-primary-teal px-8 py-4 rounded-xl hover:bg-primary-teal hover:text-white hover:shadow-lg transition-all duration-300 font-semibold text-lg"
            >
              Más Información
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-primary-teal mb-2">50+</div>
              <div className="text-gray-600">Escalas Clínicas</div>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-primary-blue mb-2">100%</div>
              <div className="text-gray-600">Cumplimiento NOM</div>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-accent-coral mb-2">24/7</div>
              <div className="text-gray-600">Acceso Seguro</div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-primary-teal/20 to-primary-blue/20 blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-primary-blue/20 to-accent-coral/20 blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent rounded-full blur-2xl"></div>
        </div>
      </div>
    </section>
  );
}