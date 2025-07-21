'use client';

import { 
  DocumentTextIcon,
  CalendarIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ChartBarIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

interface FeatureCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  status: 'available' | 'beta' | 'coming-soon';
  onClick?: () => void;
}

function FeatureCard({ icon: Icon, title, description, status, onClick }: FeatureCardProps) {
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    beta: 'bg-blue-100 text-blue-800', 
    'coming-soon': 'bg-gray-100 text-gray-600'
  };

  const statusText = {
    available: 'Disponible',
    beta: 'Beta',
    'coming-soon': 'Próximamente'
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-200 ${
        onClick ? 'hover:shadow-md cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>
          {statusText[status]}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

interface ExpedixFeaturesProps {
  onFeatureClick?: (feature: string) => void;
}

export default function ExpedixFeatures({ onFeatureClick }: ExpedixFeaturesProps) {
  const features = [
    {
      id: 'prescriptions',
      icon: DocumentTextIcon,
      title: 'Sistema de Recetas Avanzado',
      description: 'Recetas digitales con márgenes personalizables, historial de medicamentos e interacciones.',
      status: 'available' as const
    },
    {
      id: 'appointments',
      icon: CalendarIcon,
      title: 'Gestión de Citas',
      description: 'Programación inteligente con confirmaciones automáticas y recordatorios.',
      status: 'available' as const
    },
    {
      id: 'documents',
      icon: CloudArrowUpIcon,
      title: 'Documentos Seguros',
      description: 'Gestión encriptada de documentos médicos con control de acceso por niveles.',
      status: 'available' as const
    },
    {
      id: 'patient-portal',
      icon: UserCircleIcon,
      title: 'Portal de Pacientes',
      description: 'Acceso seguro para pacientes con confirmación de citas y pre-llenado de formularios.',
      status: 'beta' as const
    },
    {
      id: 'patient-tags',
      icon: TagIcon,
      title: 'Etiquetas de Pacientes',
      description: 'Sistema de clasificación visual con etiquetas personalizables por prioridad y condición.',
      status: 'available' as const
    },
    {
      id: 'clinical-reports',
      icon: ChartBarIcon,
      title: 'Reportes Clínicos',
      description: 'Generación automática de reportes en PDF, Excel y JSON para documentación.',
      status: 'available' as const
    },
    {
      id: 'compliance',
      icon: ShieldCheckIcon,
      title: 'Cumplimiento NOM-024',
      description: 'Auditoría completa y cumplimiento de normativas mexicanas de salud.',
      status: 'available' as const
    },
    {
      id: 'hub-integration',
      icon: ClipboardDocumentListIcon,
      title: 'Integración de Hubs',
      description: 'Conexión completa con Clinimetrix y FormX para gestión integral.',
      status: 'available' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Expedix - Sistema Integral de Expedientes</h2>
        <p className="text-blue-100">
          Plataforma completa para la gestión de pacientes con funcionalidades avanzadas de seguridad, 
          cumplimiento normativo y integración con otros sistemas de salud.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            status={feature.status}
            onClick={onFeatureClick ? () => onFeatureClick(feature.id) : undefined}
          />
        ))}
      </div>

      {/* Implementation Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Implementación</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">APIs Backend</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
              100% Completado
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Base de Datos</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
              Configurada
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Seguridad y Cumplimiento</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
              NOM-024 Implementado
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Interface de Usuario</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              En Desarrollo
            </span>
          </div>
        </div>
      </div>

      {/* API Endpoints Available */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">APIs Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Gestión de Pacientes</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• GET /api/expedix/patients</li>
              <li>• POST /api/expedix/patients</li>
              <li>• GET /api/expedix/patients/:id</li>
              <li>• PUT /api/expedix/patients/:id</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Citas y Recetas</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• POST /api/expedix/appointments</li>
              <li>• POST /api/expedix/prescriptions</li>
              <li>• GET /api/expedix/appointments/:id/confirm</li>
              <li>• GET /api/expedix/prescriptions/history</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Documentos</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• POST /api/expedix/patient-documents/:id/upload</li>
              <li>• GET /api/expedix/patient-documents/:id</li>
              <li>• GET /api/expedix/patient-documents/:id/download</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Portal y Reportes</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• POST /api/expedix/patient-portal/login</li>
              <li>• GET /api/expedix/patient-portal/dashboard</li>
              <li>• POST /api/expedix/clinical-reports/generate</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}