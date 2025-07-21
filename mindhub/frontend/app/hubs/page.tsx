'use client';

// import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  SparklesIcon,
  BookOpenIcon,
  ArrowRightIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function HubsPage() {
  // const { user } = useUser();
  const user = { name: 'Usuario de Desarrollo' }; // Temporal para desarrollo

  const hubs = [
    {
      id: 'clinimetrix',
      name: 'Clinimetrix',
      description: 'Sistema de Evaluación Clínica',
      longDescription: 'Sistema automatizado de evaluación clínica con más de 50 escalas estandarizadas para evaluación integral de pacientes.',
      icon: ClipboardDocumentListIcon,
      color: 'clinimetrix',
      href: '/hubs/clinimetrix',
      features: [
        'Más de 50 escalas de evaluación validadas',
        'Administración remota y presencial',
        'Puntuación e informes automatizados',
        'Seguimiento del progreso en el tiempo'
      ],
      stats: {
        assessments: 0,
        patients: 0,
        completion: '0%'
      }
    },
    {
      id: 'expedix',
      name: 'Expedix',
      description: 'Sistema de Gestión de Pacientes',
      longDescription: 'Expedientes digitales integrales de pacientes con gestión automatizada de prescripciones y documentación clínica.',
      icon: UserGroupIcon,
      color: 'expedix',
      href: '/hubs/expedix',
      features: [
        'Expedientes digitales de pacientes',
        'Gestión de prescripciones con códigos QR',
        'Seguimiento del historial de consultas',
        'Sistema de categorización de pacientes'
      ],
      stats: {
        patients: 0,
        prescriptions: 0,
        consultations: 0
      }
    },
    {
      id: 'formx',
      name: 'Formx',
      description: 'Sistema Constructor de Formularios',
      longDescription: 'Constructor de formularios de arrastrar y soltar para crear formularios personalizados, encuestas y cuestionarios.',
      icon: SparklesIcon,
      color: 'formx',
      href: '/hubs/formx',
      features: [
        'Constructor de arrastrar y soltar',
        'Importación de PDF y JotForm',
        'Tipos de campo personalizados',
        'Distribución automatizada'
      ],
      stats: {
        forms: 0,
        responses: 0,
        templates: 0
      }
    },
    {
      id: 'resources',
      name: 'Resources',
      description: 'Biblioteca Psicoeducativa',
      longDescription: 'Biblioteca curada de materiales psicoeducativos con distribución segura y control de versiones.',
      icon: BookOpenIcon,
      color: 'resources',
      href: '/hubs/resources',
      features: [
        'Biblioteca de recursos categorizada',
        'Distribución digital segura',
        'Sistema de control de versiones',
        'Seguimiento de uso y analíticas'
      ],
      stats: {
        resources: 0,
        downloads: 0,
        categories: 0
      }
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      clinimetrix: 'border-clinimetrix-200 bg-clinimetrix-50 hover:bg-clinimetrix-100',
      expedix: 'border-expedix-200 bg-expedix-50 hover:bg-expedix-100',
      formx: 'border-formx-200 bg-formx-50 hover:bg-formx-100',
      resources: 'border-resources-200 bg-resources-50 hover:bg-resources-100'
    };
    return colorMap[color] || 'border-gray-200 bg-gray-50 hover:bg-gray-100';
  };

  const getIconColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      clinimetrix: 'text-clinimetrix-600',
      expedix: 'text-expedix-600',
      formx: 'text-formx-600',
      resources: 'text-resources-600'
    };
    return colorMap[color] || 'text-gray-600';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido de vuelta, {user?.name?.split(' ')[0] || 'Doctor'}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Accede a tus herramientas clínicas y gestiona el cuidado de pacientes en todas las plataformas de MindHub.
          </p>
        </div>
        
        <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
          <Link href="/hubs/agenda">
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Agenda de Hoy
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" size="sm">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Analíticas
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-clinimetrix-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Evaluaciones</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-formx-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Formularios Creados</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpenIcon className="h-8 w-8 text-resources-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recursos Compartidos</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Hubs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {hubs.map((hub) => {
          const IconComponent = hub.icon;
          return (
            <Card
              key={hub.id}
              className={`p-8 transition-all duration-200 cursor-pointer ${getColorClasses(hub.color)}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center`}>
                    <IconComponent className={`h-6 w-6 ${getIconColorClasses(hub.color)}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900">{hub.name}</h3>
                    <p className={`text-sm font-medium ${getIconColorClasses(hub.color)}`}>
                      {hub.description}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{hub.longDescription}</p>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Características Principales:</h4>
                <ul className="space-y-2">
                  {hub.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Comenzar con {hub.name}
                </div>
                <Link href={hub.href}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="group"
                  >
                    Abrir Hub
                    <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Getting Started Section */}
      <Card className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Comenzando con MindHub
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            ¿Nuevo en MindHub? Sigue estos pasos para configurar tu consulta y comenzar a usar 
            nuestras herramientas integrales de atención médica.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Configura tu Perfil</h3>
              <p className="text-sm text-gray-600">
                Completa tu perfil profesional e información de la clínica
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Importa tus Datos</h3>
              <p className="text-sm text-gray-600">
                Sube expedientes de pacientes existentes y datos de evaluación
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Comienza a Usar los Hubs</h3>
              <p className="text-sm text-gray-600">
                Comienza con evaluaciones clínicas y gestión de pacientes
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}