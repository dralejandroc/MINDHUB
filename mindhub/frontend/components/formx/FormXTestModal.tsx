'use client';

import { useState } from 'react';
import { 
  XMarkIcon,
  UserIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface FormXTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest: (templateId: string, testPatient: any) => void;
  templates: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    estimatedTime: string;
  }>;
}

export function FormXTestModal({ isOpen, onClose, onStartTest, templates }: FormXTestModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [testPatient, setTestPatient] = useState({
    name: 'Paciente de Prueba',
    age: '35',
    email: 'test@example.com'
  });

  if (!isOpen) return null;

  const handleStartTest = () => {
    if (!selectedTemplate) {
      alert('Por favor selecciona un template');
      return;
    }

    onStartTest(selectedTemplate, {
      id: 'test-patient-' + Date.now(),
      ...testPatient
    });
    onClose();
  };

  const resetForm = () => {
    setSelectedTemplate('');
    setTestPatient({
      name: 'Paciente de Prueba',
      age: '35',
      email: 'test@example.com'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <PlayIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Probar Formulario
                </h2>
                <p className="text-sm text-gray-600">
                  Selecciona un template y configura un paciente de prueba
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Template Selection */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona el Template a Probar
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.category} ({template.estimatedTime})
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {(() => {
                  const template = templates.find(t => t.id === selectedTemplate);
                  return template ? (
                    <div>
                      <h4 className="font-medium text-blue-900">{template.name}</h4>
                      <p className="text-sm text-blue-700 mt-1">{template.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                        <span>📋 {template.category}</span>
                        <span>⏱️ {template.estimatedTime}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Test Patient Configuration */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <UserIcon className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Configuración del Paciente de Prueba
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Paciente
                </label>
                <Input
                  type="text"
                  value={testPatient.name}
                  onChange={(e) => setTestPatient(prev => ({...prev, name: e.target.value}))}
                  placeholder="Nombre del paciente de prueba"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad
                </label>
                <Input
                  type="text"
                  value={testPatient.age}
                  onChange={(e) => setTestPatient(prev => ({...prev, age: e.target.value}))}
                  placeholder="Edad del paciente"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  value={testPatient.email}
                  onChange={(e) => setTestPatient(prev => ({...prev, email: e.target.value}))}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                💡 <strong>Nota:</strong> Este es un paciente de prueba. Los datos ingresados en el formulario 
                no se guardarán en el sistema real de pacientes.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={resetForm}
              variant="ghost"
              className="text-gray-600"
            >
              Reiniciar
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleStartTest}
                className="flex items-center gap-2"
                disabled={!selectedTemplate}
              >
                <PlayIcon className="h-4 w-4" />
                Iniciar Prueba
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}