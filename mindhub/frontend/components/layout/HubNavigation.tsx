'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserGroupIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  BookOpenIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface Hub {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  status: 'active' | 'beta' | 'coming-soon';
  features: string[];
}

const HUBS: Hub[] = [
  {
    id: 'expedix',
    name: 'Expedix',
    description: 'Sistema de Expedientes y Recetas Digitales',
    icon: UserGroupIcon,
    href: '/hubs/expedix',
    status: 'active',
    features: [
      'Gestión de Pacientes',
      'Consultas Médicas',
      'Recetas Digitales',
      'Historial Clínico'
    ]
  },
  {
    id: 'clinimetrix',
    name: 'Clinimetrix',
    description: 'Sistema de Evaluación Clínica',
    icon: DocumentChartBarIcon,
    href: '/hubs/clinimetrix',
    status: 'beta',
    features: [
      '50+ Escalas Clínicas',
      'PHQ-9, GAD-7, Beck',
      'Scoring Automático',
      'Enlaces Seguros'
    ]
  },
  {
    id: 'formx',
    name: 'Formx',
    description: 'Constructor de Formularios',
    icon: DocumentTextIcon,
    href: '/hubs/formx',
    status: 'coming-soon',
    features: [
      'Editor Drag & Drop',
      'Importar PDF',
      'Compatibilidad JotForm',
      'Enlaces Públicos'
    ]
  },
  {
    id: 'resources',
    name: 'Resources',
    description: 'Biblioteca Psicoeducacional',
    icon: BookOpenIcon,
    href: '/hubs/resources',
    status: 'coming-soon',
    features: [
      'Catálogo Categorizado',
      'Descargas Seguras',
      'Control de Versiones',
      'Análisis de Uso'
    ]
  }
];

interface HubNavigationProps {
  currentUser?: {
    name: string;
    email: string;
    role: string;
  };
  onLogout?: () => void;
}

export default function HubNavigation({ currentUser, onLogout }: HubNavigationProps) {
  const pathname = usePathname();
  const [expandedHub, setExpandedHub] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Activo
          </span>
        );
      case 'beta':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Beta
          </span>
        );
      case 'coming-soon':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Próximamente
          </span>
        );
      default:
        return null;
    }
  };

  const isCurrentHub = (hubHref: string) => {
    return pathname?.startsWith(hubHref) || false;
  };

  const toggleHubExpansion = (hubId: string) => {
    setExpandedHub(expandedHub === hubId ? null : hubId);
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MH</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MindHub</h1>
                <p className="text-xs text-gray-500">Sistema Médico Integral</p>
              </div>
            </Link>
          </div>

          {/* Hub Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {HUBS.map((hub) => {
              const Icon = hub.icon;
              const isCurrent = isCurrentHub(hub.href);
              const isExpanded = expandedHub === hub.id;
              
              return (
                <div key={hub.id} className="relative">
                  <div className="flex items-center">
                    {/* Main Hub Link */}
                    <Link
                      href={hub.status === 'active' ? hub.href : '#'}
                      className={`
                        flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isCurrent 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : hub.status === 'active'
                            ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            : 'text-gray-400 cursor-not-allowed'
                        }
                      `}
                      onClick={hub.status !== 'active' ? (e) => e.preventDefault() : undefined}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {hub.name}
                      {getStatusBadge(hub.status)}
                    </Link>

                    {/* Expansion Toggle */}
                    <button
                      onClick={() => toggleHubExpansion(hub.id)}
                      className="ml-1 p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Features Menu */}
                  {isExpanded && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white shadow-lg border border-gray-200 rounded-md z-50">
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-2">{hub.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{hub.description}</p>
                        <div className="space-y-1">
                          {hub.features.map((feature, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-500">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                              {feature}
                            </div>
                          ))}
                        </div>
                        {hub.status === 'active' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Link
                              href={hub.href}
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Ir al Hub →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block font-medium">{currentUser.name}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg border border-gray-200 rounded-md z-50">
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/settings"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <CogIcon className="w-4 h-4 mr-2" />
                        Configuración
                      </Link>
                      {onLogout && (
                        <button
                          onClick={onLogout}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" />
                          Cerrar Sesión
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation (if needed) */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-3 space-y-2">
          {HUBS.map((hub) => {
            const Icon = hub.icon;
            const isCurrent = isCurrentHub(hub.href);
            
            return (
              <Link
                key={hub.id}
                href={hub.status === 'active' ? hub.href : '#'}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${isCurrent 
                    ? 'bg-blue-100 text-blue-700' 
                    : hub.status === 'active'
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-400'
                  }
                `}
                onClick={hub.status !== 'active' ? (e) => e.preventDefault() : undefined}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{hub.name}</span>
                <div className="ml-auto">
                  {getStatusBadge(hub.status)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}