'use client';

import React, { useState } from 'react';
import { 
  QuestionMarkCircleIcon, 
  BookOpenIcon, 
  PlayCircleIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { AccessibleModal } from '../ui/AccessibleModal';
import { useOnboarding, onboardingTours } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule?: string;
}

/**
 * Integrated help center component
 * Provides access to documentation, tours, and support
 */
export const HelpCenter: React.FC<HelpCenterProps> = ({
  isOpen,
  onClose,
  currentModule
}) => {
  const { startTour, completedTours, resetOnboarding } = useOnboarding();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'tours' | 'docs' | 'faq' | 'support'>('tours');

  // Filter tours based on module and search
  const filteredTours = onboardingTours.filter(tour => {
    const matchesModule = !currentModule || tour.module === currentModule || !tour.module;
    const matchesSearch = !searchQuery || 
      tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  // FAQ items
  const faqItems = [
    {
      question: '¿Cómo programo una nueva cita?',
      answer: 'Ve al módulo Agenda y haz clic en "Nueva Cita" o presiona Ctrl+N. También puedes hacer clic en cualquier espacio vacío del calendario.',
      module: 'agenda'
    },
    {
      question: '¿Cómo inicio una consulta médica?',
      answer: 'En la Agenda, arrastra la tarjeta de la cita hacia el área "Iniciar Consulta". Esto abrirá automáticamente el expediente del paciente.',
      module: 'agenda'
    },
    {
      question: '¿Dónde encuentro las evaluaciones psicométricas?',
      answer: 'Las evaluaciones están en el módulo ClinimetrixPro. Selecciona la escala deseada y completa el formulario con el paciente.',
      module: 'clinimetrix'
    },
    {
      question: '¿Cómo genero una receta digital?',
      answer: 'Dentro del expediente del paciente en Expedix, haz clic en "Nueva Receta" durante o después de la consulta.',
      module: 'expedix'
    },
    {
      question: '¿Puedo personalizar mi dashboard?',
      answer: 'Sí, en el Dashboard principal puedes arrastrar y reorganizar los widgets según tu preferencia. Los cambios se guardan automáticamente.',
      module: 'dashboard'
    },
    {
      question: '¿Cómo activo el modo oscuro?',
      answer: 'Haz clic en el icono de sol/luna en la barra superior o usa el atajo de teclado Alt+D.',
      module: null
    },
    {
      question: '¿Los datos se guardan automáticamente?',
      answer: 'Sí, todos los formularios tienen guardado automático cada 30 segundos. Verás un indicador cuando se guarden los cambios.',
      module: null
    },
    {
      question: '¿Cómo busco un paciente rápidamente?',
      answer: 'Presiona Ctrl+K para abrir la búsqueda global y escribe el nombre del paciente.',
      module: null
    }
  ];

  const filteredFAQ = faqItems.filter(item => {
    const matchesModule = !currentModule || item.module === currentModule || !item.module;
    const matchesSearch = !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Centro de Ayuda"
      description="Encuentra ayuda, tutoriales y soporte"
      size="xl"
    >
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ayuda..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('tours')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2',
            activeTab === 'tours'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <PlayCircleIcon className="h-4 w-4" />
          Tours Guiados
        </button>
        
        <button
          onClick={() => setActiveTab('docs')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2',
            activeTab === 'docs'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <BookOpenIcon className="h-4 w-4" />
          Documentación
        </button>
        
        <button
          onClick={() => setActiveTab('faq')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2',
            activeTab === 'faq'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <QuestionMarkCircleIcon className="h-4 w-4" />
          Preguntas Frecuentes
        </button>
        
        <button
          onClick={() => setActiveTab('support')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2',
            activeTab === 'support'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          Soporte
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {/* Tours Tab */}
        {activeTab === 'tours' && (
          <div className="space-y-4">
            {filteredTours.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No se encontraron tours disponibles
              </p>
            ) : (
              filteredTours.map(tour => {
                const isCompleted = completedTours.includes(tour.id);
                return (
                  <div
                    key={tour.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {tour.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {tour.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{tour.steps.length} pasos</span>
                          {tour.module && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              {tour.module}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-green-600 dark:text-green-400">
                              ✓ Completado
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          startTour(tour);
                          onClose();
                        }}
                        className="ml-4 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg 
                                 hover:bg-primary-700 transition-colors"
                      >
                        {isCompleted ? 'Repetir' : 'Iniciar'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            
            {completedTours.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    if (confirm('¿Deseas reiniciar todos los tours? Esto te permitirá verlos nuevamente.')) {
                      resetOnboarding();
                    }
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 
                           dark:hover:text-gray-200 transition-colors"
                >
                  Reiniciar todos los tours
                </button>
              </div>
            )}
          </div>
        )}

        {/* Documentation Tab */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/docs/getting-started"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg 
                         hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Guía de Inicio
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Aprende los conceptos básicos de MindHub
                </p>
              </a>
              
              <a
                href="/docs/modules"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg 
                         hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Módulos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Documentación detallada de cada módulo
                </p>
              </a>
              
              <a
                href="/docs/api"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg 
                         hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  API Reference
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Documentación técnica para desarrolladores
                </p>
              </a>
              
              <a
                href="/docs/shortcuts"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg 
                         hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Atajos de Teclado
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lista completa de atajos disponibles
                </p>
              </a>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            {filteredFAQ.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No se encontraron preguntas relacionadas
              </p>
            ) : (
              filteredFAQ.map((item, idx) => (
                <details
                  key={idx}
                  className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <summary className="flex items-center justify-between cursor-pointer">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {item.question}
                    </h3>
                    <span className="ml-2 text-gray-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {item.answer}
                  </p>
                </details>
              ))
            )}
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Soporte Prioritario
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Obtén ayuda directa de nuestro equipo de soporte
              </p>
              <div className="space-y-2">
                <a
                  href="mailto:soporte@mindhub.cloud"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  📧 soporte@mindhub.cloud
                </a>
                <a
                  href="tel:+525555555555"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  📞 +52 55 5555 5555
                </a>
                <span className="block text-sm text-blue-600 dark:text-blue-400">
                  💬 Chat en vivo: Lun-Vie 9:00-18:00
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Recursos Adicionales
              </h3>
              <a
                href="/community"
                className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg 
                         hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Comunidad MindHub
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Conecta con otros profesionales de la salud
                </p>
              </a>
              
              <a
                href="/changelog"
                className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg 
                         hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Novedades
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Últimas actualizaciones y mejoras
                </p>
              </a>
              
              <a
                href="/feedback"
                className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg 
                         hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Enviar Feedback
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ayúdanos a mejorar MindHub
                </p>
              </a>
            </div>
          </div>
        )}
      </div>
    </AccessibleModal>
  );
};