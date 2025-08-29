'use client';

import { ContainerScroll } from '@/components/ui/container-scroll';
import Image from 'next/image';

interface HeroScrollSectionProps {
  onBetaClick: () => void;
}

export function HeroScrollSection({ onBetaClick }: HeroScrollSectionProps) {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            {/* Beta Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-blue/10 text-primary-blue text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-primary-blue rounded-full mr-2 animate-pulse"></span>
              Beta Abierto - Registro Gratuito
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              La plataforma integral para
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-blue to-primary-teal">
                profesionales de salud mental
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Gestiona expedientes clínicos, aplica escalas clinimétricas estandarizadas, 
              organiza recursos terapéuticos y administra tu práctica desde una plataforma 
              diseñada por y para profesionales de salud mental.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
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
          </>
        }
      >
        {/* MindHub Platform Preview */}
        <div className="mx-auto rounded-2xl object-cover h-full w-full">
          <div className="bg-gradient-to-br from-primary-teal/5 to-primary-blue/5 h-full w-full rounded-2xl border border-gray-200 p-4">
            {/* Simulated MindHub Interface */}
            <div className="bg-white rounded-xl h-full w-full shadow-inner border border-gray-100 overflow-hidden">
              
              {/* Header Bar */}
              <div className="bg-gradient-to-r from-primary-teal to-primary-blue p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="font-bold">M</span>
                    </div>
                    <span className="font-semibold text-lg">MindHub Pro</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm opacity-90">En línea</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="flex space-x-6">
                  <div className="px-3 py-2 bg-primary-teal/10 text-primary-teal rounded-lg text-sm font-medium">
                    Dashboard
                  </div>
                  <div className="px-3 py-2 text-gray-600 text-sm">Expedix</div>
                  <div className="px-3 py-2 text-gray-600 text-sm">ClinimetrixPro</div>
                  <div className="px-3 py-2 text-gray-600 text-sm">Agenda</div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">127</div>
                    <div className="text-sm text-gray-600">Pacientes</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">34</div>
                    <div className="text-sm text-gray-600">Citas Hoy</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">89</div>
                    <div className="text-sm text-gray-600">Evaluaciones</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Actividad Reciente</h3>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">MP</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">María Pérez</div>
                      <div className="text-xs text-gray-600">Evaluación PHQ-9 completada</div>
                    </div>
                    <div className="text-xs text-gray-500">Hace 2 min</div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm font-medium">JG</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Juan García</div>
                      <div className="text-xs text-gray-600">Cita agendada para mañana</div>
                    </div>
                    <div className="text-xs text-gray-500">Hace 5 min</div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-medium">AS</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Ana Sánchez</div>
                      <div className="text-xs text-gray-600">Expediente actualizado</div>
                    </div>
                    <div className="text-xs text-gray-500">Hace 10 min</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
}