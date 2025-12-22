'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  UserGroupIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  BookOpenIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  Bars3Icon,
  XMarkIcon
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

// Clean Architecture: Domain entities for navigation
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
      'Historial Clínico',
      'Portal de Pacientes'
    ]
  },
  {
    id: 'agenda',
    name: 'Agenda',
    description: 'Sistema de Citas y Programación',
    icon: CalendarDaysIcon,
    href: '/hubs/agenda',
    status: 'active',
    features: [
      'Programación de Citas',
      'Gestión de Horarios',
      'Lista de Espera',
      'Notificaciones Automáticas',
      'Drag & Drop'
    ]
  },
  {
    id: 'clinimetrix',
    name: 'ClinimetrixPro',
    description: 'Sistema de Evaluaciones Psicométricas',
    icon: ClipboardDocumentCheckIcon,
    href: '/hubs/clinimetrix',
    status: 'active',
    features: [
      '29+ Escalas Psicométricas',
      'PHQ-9, BDI, GADI, HARS',
      'Scoring Automático',
      'Integración con Expedix',
      'Reportes Clínicos'
    ]
  },
  // {
  //   id: 'formx',
  //   name: 'FormX',
  //   description: 'Constructor de Formularios',
  //   icon: DocumentTextIcon,
  //   href: '/hubs/formx',
  //   status: 'active',
  //   features: [
  //     'Templates Médicos',
  //     'Formularios Personalizados',
  //     'Validación Automática',
  //     'Integración con Consultas',
  //     'Exportación de Datos'
  //   ]
  // },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Gestión Financiera y Facturación',
    icon: CurrencyDollarIcon,
    href: '/hubs/finance',
    status: 'active',
    features: [
      'Sistema de Facturación',
      'Gestión de Servicios',
      'Cortes de Caja',
      'Reportes Financieros',
      'Multi-métodos de Pago'
    ]
  },
  {
    id: 'frontdesk',
    name: 'FrontDesk',
    description: 'Recepción y Gestión de Flujo',
    icon: BuildingOfficeIcon,
    href: '/hubs/frontdesk',
    status: 'active',
    features: [
      'Dashboard de Recepción',
      'Check-in de Pacientes',
      'Gestión de Esperas',
      'Comunicación Interna',
      'Vista Multi-profesional'
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
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Clean Architecture: Mobile state management

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
              <Image
                src="/logos/glian-logo-primary.png"
                alt="Glian - Plataforma de Gestión Clínica"
                width={120}
                height={32}
                className="h-10 w-auto"
                priority
              />
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {showMobileMenu ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
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

      {/* Mobile Navigation - Only show when menu is open */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
          {/* Mobile User Info */}
          {currentUser && (
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  <p className="text-xs text-blue-600 capitalize">{currentUser.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Hub Navigation */}
          <div className="px-4 py-3 space-y-2">
            {HUBS.map((hub) => {
              const Icon = hub.icon;
              const isCurrent = isCurrentHub(hub.href);
              
              return (
                <Link
                  key={hub.id}
                  href={hub.status === 'active' ? hub.href : '#'}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${isCurrent 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : hub.status === 'active'
                        ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        : 'text-gray-400 cursor-not-allowed'
                    }
                  `}
                  onClick={(e) => {
                    if (hub.status !== 'active') {
                      e.preventDefault();
                    } else {
                      setShowMobileMenu(false); // Close menu when navigating
                    }
                  }}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="flex-1">{hub.name}</span>
                  <div className="ml-2">
                    {getStatusBadge(hub.status)}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile User Actions */}
          {currentUser && (
            <div className="px-4 py-3 border-t border-gray-200 space-y-2">
              <Link
                href="/settings"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <CogIcon className="w-4 h-4 mr-3" />
                Configuración
              </Link>
              {onLogout && (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onLogout();
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-3" />
                  Cerrar Sesión
                </button>
              )}
            </div>
          )}

          {/* Mobile Sign In - Show when no user */}
          {!currentUser && (
            <div className="px-4 py-3 border-t border-gray-200">
              <Link
                href="/auth/sign-in"
                className="block w-full text-center bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}