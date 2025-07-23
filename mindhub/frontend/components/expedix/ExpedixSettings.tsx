'use client';

import { useState } from 'react';
import {
  CogIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  TableCellsIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import PatientImportManager from './PatientImportManager';
import { PageHeader } from '@/components/layout/PageHeader';

interface ExpedixSettingsProps {
  onClose?: () => void;
}

export default function ExpedixSettings({ onClose }: ExpedixSettingsProps) {
  const [showImportManager, setShowImportManager] = useState(false);
  const [activeSection, setActiveSection] = useState('import');

  const settingSections = [
    {
      id: 'import',
      name: 'Importación de Datos',
      icon: CloudArrowUpIcon,
      description: 'Importar pacientes desde archivos Excel'
    },
    {
      id: 'export',
      name: 'Exportación de Datos',
      icon: DocumentArrowDownIcon,
      description: 'Configurar opciones de exportación'
    },
    {
      id: 'patients',
      name: 'Gestión de Pacientes',
      icon: UserGroupIcon,
      description: 'Configuración general de pacientes'
    },
    {
      id: 'reports',
      name: 'Reportes',
      icon: ChartBarIcon,
      description: 'Configuración de reportes y estadísticas'
    },
    {
      id: 'security',
      name: 'Seguridad y Privacidad',
      icon: ShieldCheckIcon,
      description: 'Configuración de seguridad de datos'
    },
    {
      id: 'notifications',
      name: 'Notificaciones',
      icon: BellIcon,
      description: 'Configurar alertas y notificaciones'
    }
  ];

  const handleImportComplete = (importedCount: number) => {
    // Mostrar notificación de éxito o actualizar lista de pacientes
    alert(`Se importaron ${importedCount} pacientes exitosamente`);
    setShowImportManager(false);
  };

  const renderImportSection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Importación Masiva de Pacientes
          </h3>
          <p className="text-gray-600 mb-6">
            Importa múltiples pacientes desde archivos Excel de forma rápida y segura.
            Perfecto para clínicas que migran desde otros sistemas o necesitan agregar
            muchos pacientes de una vez.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <CloudArrowUpIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Importación Rápida</h4>
                <p className="text-sm text-gray-600">Sube archivos Excel</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Descarga nuestra plantilla, llénala con los datos de tus pacientes
              y súbela para importar todos de una vez.
            </p>
            <Button
              onClick={() => setShowImportManager(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Iniciar Importación
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <DocumentArrowDownIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Plantillas</h4>
                <p className="text-sm text-gray-600">Descarga y personaliza</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Tenemos plantillas para diferentes necesidades: básica, completa
              y especializada para clínicas.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plantilla Básica:</span>
                <span className="text-blue-600 font-medium">Hasta 100 pacientes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plantilla Completa:</span>
                <span className="text-blue-600 font-medium">Hasta 500 pacientes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plantilla Clínica:</span>
                <span className="text-blue-600 font-medium">Hasta 1000 pacientes</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Seguridad y Validación
              </h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• Todos los datos se validan automáticamente antes de la importación</p>
                <p>• Los archivos se procesan de forma segura y se eliminan después</p>
                <p>• Vista previa completa antes de confirmar la importación</p>
                <p>• Cumplimiento con estándares de protección de datos médicos</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderExportSection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Configuración de Exportación
          </h3>
          <p className="text-gray-600 mb-6">
            Personaliza cómo se exportan los datos de tus pacientes y expedientes.
          </p>
        </div>

        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Opciones por Defecto</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Incluir consultas individuales</p>
                <p className="text-sm text-gray-600">En exportaciones de expedientes completos</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Incluir evaluaciones</p>
                <p className="text-sm text-gray-600">Escalas clínicas y evaluaciones</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Compresión máxima</p>
                <p className="text-sm text-gray-600">Archivos más pequeños, procesamiento más lento</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Limpieza Automática</h4>
          <p className="text-sm text-gray-600 mb-4">
            Los archivos exportados se eliminan automáticamente del servidor
            después de la descarga para proteger tu privacidad.
          </p>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Tiempo de retención</p>
              <p className="text-sm text-gray-600">Cuánto tiempo mantener archivos temporales</p>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="immediate">Inmediatamente después de descarga</option>
              <option value="1h" selected>1 hora</option>
              <option value="24h">24 horas</option>
            </select>
          </div>
        </Card>
      </div>
    );
  };

  const renderPatientsSection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Configuración de Pacientes
          </h3>
          <p className="text-gray-600 mb-6">
            Personaliza cómo se manejan los datos de los pacientes en tu sistema.
          </p>
        </div>

        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Numeración de Expedientes</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de número de expediente
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="EXP-YYYY-NNNN" selected>EXP-AÑO-Número (EXP-2025-0001)</option>
                <option value="YYYY-NNNN">AÑO-Número (2025-0001)</option>
                <option value="NNNN">Solo número secuencial (0001)</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Próximo número
              </label>
              <input
                type="number"
                defaultValue={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-1">
                El próximo paciente registrado recibirá este número
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Campos Requeridos</h4>
          
          <div className="space-y-3">
            {[
              { field: 'phone', label: 'Teléfono', required: true },
              { field: 'email', label: 'Email', required: false },
              { field: 'address', label: 'Dirección', required: false },
              { field: 'emergencyContact', label: 'Contacto de emergencia', required: false },
              { field: 'bloodType', label: 'Tipo de sangre', required: false },
              { field: 'allergies', label: 'Alergias', required: false }
            ].map((item) => (
              <div key={item.field} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked={item.required}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'import': return renderImportSection();
      case 'export': return renderExportSection();
      case 'patients': return renderPatientsSection();
      case 'reports':
        return (
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Configuración de reportes próximamente</p>
          </div>
        );
      case 'security':
        return (
          <div className="text-center py-12">
            <ShieldCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Configuración de seguridad próximamente</p>
          </div>
        );
      case 'notifications':
        return (
          <div className="text-center py-12">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Configuración de notificaciones próximamente</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Configuración de Expedix"
        description="Personaliza y configura tu sistema de gestión de pacientes"
        icon={CogIcon}
        iconColor="text-gray-600"
        actions={
          onClose && (
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          )
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingSections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent className="h-5 w-5 mr-3" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{section.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {section.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {renderCurrentSection()}
            </div>
          </div>
        </div>
      </div>

      {/* Import Manager Modal */}
      {showImportManager && (
        <PatientImportManager
          onClose={() => setShowImportManager(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
}