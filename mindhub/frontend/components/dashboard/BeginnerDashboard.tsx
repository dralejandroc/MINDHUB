'use client';

import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface BeginnerDashboardProps {
  onNavigate?: (path: string) => void;
}

export function BeginnerDashboard({ onNavigate }: BeginnerDashboardProps) {
  const hubs = [
    {
      id: 'expedix',
      name: 'Expedix',
      description: 'Sistema integral de expedientes médicos',
      longDescription: 'Gestiona pacientes, consultas médicas, recetas digitales y seguimiento clínico de manera integral.',
      features: ['Expedientes digitales', 'Consultas médicas', 'Recetas digitales', 'Seguimiento de pacientes'],
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      path: '/hubs/expedix'
    },
    {
      id: 'clinimetrix',
      name: 'Clinimetrix', 
      description: 'Sistema de evaluación clínica especializado',
      longDescription: 'Aplica escalas clínicas estandarizadas, realiza evaluaciones psicológicas y genera reportes automáticos.',
      features: ['50+ escalas clínicas', 'Evaluaciones automatizadas', 'Reportes detallados', 'Seguimiento temporal'],
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      path: '/hubs/clinimetrix'
    },
    {
      id: 'formx',
      name: 'FormX',
      description: 'Constructor de formularios y cuestionarios',
      longDescription: 'Crea formularios personalizados, cuestionarios de admisión y documentos digitales adaptativos.',
      features: ['Constructor visual', 'Formularios adaptativos', 'Integración PDF', 'Respuestas en tiempo real'],
      color: 'bg-emerald-50 border-emerald-200',
      iconColor: 'text-emerald-600',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
      path: '/hubs/formx'
    },
    {
      id: 'resources',
      name: 'Hub de Recursos',
      description: 'Biblioteca de materiales psicoeducativos',
      longDescription: 'Gestiona recursos educativos, materiales terapéuticos y contenido multimedia para pacientes.',
      features: ['Biblioteca digital', 'Recursos categorizados', 'Envío automatizado', 'Materiales personalizados'],
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-600',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      path: '/hubs/resources'
    }
  ];

  const quickActions = [
    { name: 'Nuevo Paciente', path: '/hubs/expedix?action=new-patient', icon: '👤' },
    { name: 'Ver Agenda', path: '/hubs/agenda', icon: '📅' },
    { name: 'Nueva Evaluación', path: '/hubs/clinimetrix', icon: '📋' },
    { name: 'Crear Formulario', path: '/hubs/formx?action=new-form', icon: '📝' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Bienvenido a MindHub
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tu plataforma integral para la gestión de salud mental. 
          Explora cada hub para descubrir todas las herramientas disponibles.
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.path}>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-2xl mb-2">{action.icon}</span>
                <span className="text-sm font-medium text-gray-900 text-center">{action.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Hubs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hubs.map((hub) => (
          <Card key={hub.id} className={`p-6 ${hub.color} transition-all duration-200 hover:shadow-lg`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`text-xl font-bold ${hub.iconColor} mb-2`}>
                  {hub.name}
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  {hub.description}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  {hub.longDescription}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Características principales:</h4>
              <ul className="space-y-1">
                {hub.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-700">
                    <div className={`w-1.5 h-1.5 rounded-full ${hub.iconColor.replace('text-', 'bg-')} mr-2`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <Link href={hub.path}>
              <Button 
                className={`w-full ${hub.buttonColor} text-white flex items-center justify-center space-x-2`}
              >
                <span>Explorar {hub.name}</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {/* Getting Started Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">💡 Consejos para empezar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h3 className="font-semibold mb-1">1. Configura tu primera clínica</h3>
            <p>Comienza en Expedix registrando tu información básica y tus primeros pacientes.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">2. Explora las escalas</h3>
            <p>En Clinimetrix encontrarás más de 50 escalas clínicas para evaluaciones.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">3. Crea formularios personalizados</h3>
            <p>FormX te permite crear cuestionarios adaptados a tu práctica clínica.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">4. Gestiona recursos</h3>
            <p>Organiza materiales psicoeducativos en el Hub de Recursos.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}