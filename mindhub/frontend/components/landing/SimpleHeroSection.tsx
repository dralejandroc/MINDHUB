'use client';

import Image from 'next/image';
import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface SimpleHeroSectionProps {
  onBetaClick: () => void;
}

export function SimpleHeroSection({ onBetaClick }: SimpleHeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background - matching the image */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e0f5f8] via-[#b8e6dd] to-[#0991b2]"></div>

      {/* Decorative shape in center */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="relative w-96 h-96">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-dark-500 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-dark-500 rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-dark-500 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-dark-500 rotate-45"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-dark-500 mb-6">
            Todo lo que necesitas
            <br />
            en una sola plataforma
          </h1>
          <p className="text-xl text-dark-500 max-w-3xl mx-auto">
            Descubre cómo Glian revoluciona la gestión sanitaria con
            herramientas inteligentes diseñadas para optimizar cada
            aspecto de tu práctica médica.
          </p>
        </div>

        {/* Feature Grid - matching the image layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Expedientes Médicos digitales */}
          <div className="flex items-start space-x-4 bg-white/40 backdrop-blur-sm p-6 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-dark-500 rounded-xl flex items-center justify-center transform -rotate-6">
                <ClipboardDocumentListIcon className="w-10 h-10 text-primary-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-dark-500 mb-2">
                Expedientes
                <br />
                Médicos digitales
              </h3>
              <p className="text-dark-500">
                Gestión completa de historiales clínicos con
                encriptación y acceso seguro desde cualquier
                dispositivo.
              </p>
            </div>
          </div>

          {/* Evaluaciones Psicométricas */}
          <div className="flex items-start space-x-4 bg-white/40 backdrop-blur-sm p-6 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-dark-500 rounded-xl flex items-center justify-center transform rotate-6">
                <ChartBarIcon className="w-10 h-10 text-primary-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-dark-500 mb-2">
                Evaluaciones
                <br />
                Psicométricas
              </h3>
              <p className="text-dark-500">
                29 escalas especializadas con scoring
                automático e interpretación clínica instantánea.
              </p>
            </div>
          </div>

          {/* Agenda inteligente */}
          <div className="flex items-start space-x-4 bg-white/40 backdrop-blur-sm p-6 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-dark-500 rounded-xl flex items-center justify-center transform -rotate-6">
                <CalendarDaysIcon className="w-10 h-10 text-primary-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-dark-500 mb-2">
                Agenda
                <br />
                inteligente
              </h3>
              <p className="text-dark-500">
                Sistema de citas con recordatorios automáticos,
                lista de espera y sincronización multi-dispositivo.
              </p>
            </div>
          </div>

          {/* Portal de Pacientes */}
          <div className="flex items-start space-x-4 bg-white/40 backdrop-blur-sm p-6 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-dark-500 rounded-xl flex items-center justify-center transform rotate-6">
                <UserGroupIcon className="w-10 h-10 text-primary-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-dark-500 mb-2">
                Portal
                <br />
                de Pacientes
              </h3>
              <p className="text-dark-500">
                Acceso seguro para pacientes a sus resultados,
                citas y comunicación directa con profesionales.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12 text-center">
          <button
            onClick={onBetaClick}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-dark-500 rounded-xl hover:bg-dark-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Unirse al Beta
          </button>
        </div>
      </div>
    </section>
  );
}
