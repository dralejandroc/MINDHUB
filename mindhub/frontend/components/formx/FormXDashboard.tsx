'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  PlusIcon, 
  ClipboardDocumentListIcon,
  ChartBarIcon,
  PencilSquareIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authGet } from '@/lib/api/auth-fetch';
import toast from 'react-hot-toast';
import { PSYCHIATRIC_TEMPLATES } from './templates';
import { FormXTestModal } from './FormXTestModal';

interface FormXDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

export function FormXDashboard({ onNavigate }: FormXDashboardProps) {
  const [stats, setStats] = useState({
    totalForms: 0,
    activeForms: 0,
    responses: 0,
    templates: 0
  });
  const [showTestModal, setShowTestModal] = useState(false);

  useEffect(() => {
    fetchFormXStats();
  }, []);

  const fetchFormXStats = async () => {
    try {
      // Fetch templates count
      const templatesResponse = await authGet('/api/formx/django/templates/');
      const templatesData = await templatesResponse.json().catch(() => []);
      const templatesCount = Array.isArray(templatesData) ? templatesData.length : 0;
      
      // Fetch submissions count
      const submissionsResponse = await authGet('/api/formx/django/submissions/');
      const submissionsData = await submissionsResponse.json().catch(() => []);
      const submissionsCount = Array.isArray(submissionsData) ? submissionsData.length : 0;
      
      setStats({
        totalForms: templatesCount,
        activeForms: templatesCount, // All templates are considered active for now
        responses: submissionsCount,
        templates: templatesCount
      });
    } catch (error) {
      console.error('Error fetching FormX stats:', error);
      // Keep default values on error
    }
  };

  const quickActions = [
    {
      title: 'Crear Nuevo Formulario',
      description: 'Diseña un formulario personalizado desde cero con nuestro constructor intuitivo',
      icon: PlusIcon,
      action: () => onNavigate('builder'),
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white'
    },
    {
      title: 'Gestionar Templates',
      description: 'Explora, edita y organiza tus templates de formularios predefinidos',
      icon: ClipboardDocumentListIcon,
      action: () => onNavigate('templates'),
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-white'
    },
    {
      title: 'Ver Respuestas',
      description: 'Analiza las respuestas recibidas de pacientes y genera reportes',
      icon: ChartBarIcon,
      action: () => onNavigate('responses'),
      color: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-white'
    },
    {
      title: 'Probar Formulario',
      description: 'Prueba cualquier formulario con datos de ejemplo para verificar su funcionamiento',
      icon: PlayIcon,
      action: () => setShowTestModal(true),
      color: 'bg-orange-500 hover:bg-orange-600',
      textColor: 'text-white'
    }
  ];

  const predefinedTemplates = [
    {
      id: 'adult-psychiatric',
      name: 'Formulario de Primera Vez - Adulto (18-60 años)',
      description: 'Formulario completo de admisión psiquiátrica para adultos',
      category: 'Psiquiatría Adultos',
      questions: PSYCHIATRIC_TEMPLATES[0].fields.length,
      estimatedTime: PSYCHIATRIC_TEMPLATES[0].estimatedTime
    },
    {
      id: 'adolescent-psychiatric',
      name: 'Formulario de Primera Vez - Adolescente (12-17 años)',
      description: 'Formulario completo de admisión psiquiátrica para adolescentes',
      category: 'Psiquiatría Adolescentes',
      questions: PSYCHIATRIC_TEMPLATES[1].fields.length,
      estimatedTime: PSYCHIATRIC_TEMPLATES[1].estimatedTime
    },
    {
      id: 'child-psychiatric',
      name: 'Formulario de Primera Vez - Niño (5-11 años)',
      description: 'Formulario completo de admisión psiquiátrica para niños (llenado por padres/tutores)',
      category: 'Psiquiatría Infantil',
      questions: PSYCHIATRIC_TEMPLATES[2].fields.length,
      estimatedTime: PSYCHIATRIC_TEMPLATES[2].estimatedTime
    },
    {
      id: 'mature-psychiatric',
      name: 'Formulario de Primera Vez - Adulto Maduro (61+ años)',
      description: 'Formulario completo de admisión psiquiátrica para adultos mayores',
      category: 'Psiquiatría Geriátrica',
      questions: PSYCHIATRIC_TEMPLATES[3].fields.length,
      estimatedTime: PSYCHIATRIC_TEMPLATES[3].estimatedTime
    }
  ];

  const handleUseTemplate = (template: any) => {
    // Mostrar un mensaje de éxito claro
    toast.success(`Iniciando constructor con template: "${template.name}"`);
    
    // Navegar al constructor con el template seleccionado
    onNavigate('builder', { templateId: template.id });
  };

  const handleStartTest = (templateId: string, testPatient: any) => {
    toast.success(`Iniciando prueba del formulario con paciente: "${testPatient.name}"`);
    onNavigate('form-viewer', { 
      templateId: templateId, 
      patientId: testPatient.id 
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <DocumentTextIcon className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          FormX - Generador de Formularios Médicos
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Crea, personaliza y gestiona formularios médicos para optimizar la recolección de información 
          de tus pacientes de manera eficiente y profesional.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalForms}</div>
          <div className="text-sm text-gray-600">Formularios Totales</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.activeForms}</div>
          <div className="text-sm text-gray-600">Formularios Activos</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.responses}</div>
          <div className="text-sm text-gray-600">Respuestas Recibidas</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-orange-600">{predefinedTemplates.length}</div>
          <div className="text-sm text-gray-600">Templates Disponibles</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index}
                className={`${action.color} ${action.textColor} p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                onClick={action.action}
              >
                <div className="flex items-center mb-3">
                  <Icon className="h-6 w-6 mr-3" />
                  <h3 className="font-semibold text-lg">{action.title}</h3>
                </div>
                <p className="opacity-90 text-sm leading-relaxed">
                  {action.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Predefined Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Templates Predefinidos</h2>
          <Button 
            onClick={() => onNavigate('templates')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Ver Todos los Templates
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predefinedTemplates.map((template) => (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {template.category}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{template.questions} preguntas</span>
                <span>{template.estimatedTime}</span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1"
                  variant="outline"
                >
                  Editar Template
                </Button>
                <Button 
                  onClick={() => onNavigate('form-viewer', { templateId: template.id })}
                  className="flex-1"
                  variant="primary"
                >
                  Llenar Formulario
                </Button>
                <Button 
                  onClick={() => onNavigate('templates')}
                  variant="ghost"
                  className="px-3"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Test Modal */}
      <FormXTestModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        onStartTest={handleStartTest}
        templates={predefinedTemplates}
      />

      {/* Help Section */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            📚
          </div>
          ¿Cómo usar FormX? - Guía paso a paso
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-2">📝 Crear o Elegir Template</div>
              <div className="text-gray-700 leading-relaxed">
                <strong>Opción A:</strong> Usa el botón "Crear Nuevo Formulario" para diseñar desde cero<br/>
                <strong>Opción B:</strong> Selecciona un template predefinido y personalízalo
              </div>
              <div className="mt-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                💡 Los templates ahorran tiempo con configuraciones predefinidas
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-2">⚙️ Personalizar y Configurar</div>
              <div className="text-gray-700 leading-relaxed">
                <strong>Wizard paso a paso:</strong><br/>
                • Información básica del formulario<br/>
                • Agregar y configurar campos<br/>
                • Ajustar configuraciones avanzadas<br/>
                • Vista previa antes de guardar
              </div>
              <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                ✅ Interface intuitiva con instrucciones claras
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-2">📊 Usar y Analizar</div>
              <div className="text-gray-700 leading-relaxed">
                <strong>Una vez guardado:</strong><br/>
                • Formulario se integra automáticamente en consultas<br/>
                • Pacientes completan via web o tablet<br/>
                • Analiza respuestas en tiempo real<br/>
                • Exporta datos para reportes
              </div>
              <div className="mt-2 text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">
                📈 Análisis automático con puntuaciones y tendencias
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-900 mb-2">🎯 ¿Qué tipos de formularios puedes crear?</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="text-gray-700">
              <strong>📋 Admisión:</strong><br/>
              Datos personales, antecedentes médicos
            </div>
            <div className="text-gray-700">
              <strong>🔄 Seguimiento:</strong><br/>
              Evolución, síntomas, medicamentos
            </div>
            <div className="text-gray-700">
              <strong>👶 Infantiles:</strong><br/>
              Preguntas adaptadas por edad
            </div>
            <div className="text-gray-700">
              <strong>🔍 Screening:</strong><br/>
              Evaluaciones específicas
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}