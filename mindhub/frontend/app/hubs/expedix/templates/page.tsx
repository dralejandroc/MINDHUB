'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConsultationTemplateManager from '@/components/expedix/ConsultationTemplateManager';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeftIcon, SettingsIcon, FileTextIcon } from 'lucide-react';
import Link from 'next/link';

export default function ConsultationTemplatesPage() {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/hubs/expedix">
                <Button variant="ghost" size="sm">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Volver a Expedix
                </Button>
              </Link>
              <div className="h-8 border-l border-gray-200"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Configuración de Plantillas
                </h1>
                <p className="text-sm text-gray-500">
                  Gestiona plantillas de consulta personalizables
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <FileTextIcon className="w-4 h-4" />
              <span>Plantillas</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <SettingsIcon className="w-4 h-4" />
              <span>Configuración</span>
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <ConsultationTemplateManager showActions={true} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Configuración Global</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Plantillas por Defecto</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Configura qué plantillas se usarán por defecto para diferentes tipos de consulta
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Primera Consulta
                      </label>
                      <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500">
                        <option value="">Seleccionar plantilla...</option>
                        {/* Templates will be populated dynamically */}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Consulta de Seguimiento
                      </label>
                      <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500">
                        <option value="">Seleccionar plantilla...</option>
                        {/* Templates will be populated dynamically */}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Opciones de Formulario</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">
                        Mostrar campos obligatorios con asterisco (*)
                      </span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">
                        Autoguardar formularios cada 30 segundos
                      </span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">
                        Validar campos antes de guardar
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Integración con FormX</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Las plantillas pueden sincronizarse automáticamente con FormX para formularios avanzados
                  </p>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">
                        Crear automáticamente formularios FormX para nuevas plantillas
                      </span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">
                        Sincronizar cambios bidireccionales con FormX
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Guardar Configuración
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}