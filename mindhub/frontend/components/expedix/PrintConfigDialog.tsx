'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { XMarkIcon, CogIcon } from '@heroicons/react/24/outline';
import { PrintConfigManager, type PrintConfig, DEFAULT_PRINT_CONFIG } from '@/lib/utils/print-config';

interface PrintConfigDialogProps {
  onClose: () => void;
  onSave: (config: PrintConfig) => void;
}

export default function PrintConfigDialog({ onClose, onSave }: PrintConfigDialogProps) {
  const [config, setConfig] = useState<PrintConfig>(PrintConfigManager.getCurrentConfig());

  const handleSave = () => {
    if (PrintConfigManager.validateConfig(config)) {
      PrintConfigManager.saveConfig(config);
      onSave(config);
      onClose();
    } else {
      alert('Por favor verifica que todos los campos requeridos estén completos');
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_PRINT_CONFIG);
  };

  const updateConfig = (section: keyof PrintConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' 
        ? { ...prev[section] as any, [field]: value }
        : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <CogIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold">Configuración de Impresión</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información General */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Información de la Clínica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Clínica *
                </label>
                <input
                  type="text"
                  value={config.clinicName}
                  onChange={(e) => updateConfig('clinicName', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Doctor *
                </label>
                <input
                  type="text"
                  value={config.doctorName}
                  onChange={(e) => updateConfig('doctorName', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula Profesional *
                </label>
                <input
                  type="text"
                  value={config.professionalId}
                  onChange={(e) => updateConfig('professionalId', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => updateConfig('phone', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => updateConfig('email', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección (Opcional)
                </label>
                <input
                  type="text"
                  value={config.address || ''}
                  onChange={(e) => updateConfig('address', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Configuración General de Impresión */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Configuración General</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamaño de Papel
                </label>
                <select
                  value={config.paperSize}
                  onChange={(e) => updateConfig('paperSize', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="letter">Carta (Letter)</option>
                  <option value="a4">A4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Márgenes
                </label>
                <select
                  value={config.margins}
                  onChange={(e) => updateConfig('margins', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="compact">Compacto (ahorra papel)</option>
                  <option value="normal">Normal</option>
                  <option value="wide">Amplio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamaño de Fuente
                </label>
                <select
                  value={config.fontSize}
                  onChange={(e) => updateConfig('fontSize', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="small">Pequeña (ahorra papel)</option>
                  <option value="normal">Normal</option>
                  <option value="large">Grande</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Configuración de Recetas */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">📋 Configuración de Recetas</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.prescription.includeHeader}
                    onChange={(e) => updateConfig('prescription', 'includeHeader', e.target.checked)}
                    className="mr-2"
                  />
                  Incluir encabezado "RECETA MÉDICA"
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.prescription.includePatientInfo}
                    onChange={(e) => updateConfig('prescription', 'includePatientInfo', e.target.checked)}
                    className="mr-2"
                  />
                  Incluir datos del paciente
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.prescription.includeAge}
                    onChange={(e) => updateConfig('prescription', 'includeAge', e.target.checked)}
                    className="mr-2"
                  />
                  Incluir edad del paciente
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.prescription.includeDate}
                    onChange={(e) => updateConfig('prescription', 'includeDate', e.target.checked)}
                    className="mr-2"
                  />
                  Incluir fecha
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.prescription.rxSymbol}
                    onChange={(e) => updateConfig('prescription', 'rxSymbol', e.target.checked)}
                    className="mr-2"
                  />
                  Mostrar símbolo ℞
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.prescription.numberedMedications}
                    onChange={(e) => updateConfig('prescription', 'numberedMedications', e.target.checked)}
                    className="mr-2"
                  />
                  Numerar medicamentos
                </label>
              </div>
            </div>
          </Card>

          {/* Configuración de Consultas */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">📋 Configuración de Notas de Consulta</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.consultation.includeFullMentalExam}
                    onChange={(e) => updateConfig('consultation', 'includeFullMentalExam', e.target.checked)}
                    className="mr-2"
                  />
                  Incluir examen mental completo (vs. resumen)
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.consultation.compactLayout}
                    onChange={(e) => updateConfig('consultation', 'compactLayout', e.target.checked)}
                    className="mr-2"
                  />
                  Layout compacto (ahorra papel)
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.consultation.includeNextAppointment}
                    onChange={(e) => updateConfig('consultation', 'includeNextAppointment', e.target.checked)}
                    className="mr-2"
                  />
                  Incluir próxima cita
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.consultation.groupSections}
                    onChange={(e) => updateConfig('consultation', 'groupSections', e.target.checked)}
                    className="mr-2"
                  />
                  Agrupar secciones relacionadas
                </label>
              </div>
            </div>
          </Card>

          {/* Configuración de Expedientes */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">📁 Configuración de Expedientes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultas por página
                </label>
                <select
                  value={config.medicalRecord.maxConsultationsPerPage}
                  onChange={(e) => updateConfig('medicalRecord', 'maxConsultationsPerPage', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5 consultas</option>
                  <option value={10}>10 consultas</option>
                  <option value={15}>15 consultas</option>
                  <option value={20}>20 consultas</option>
                </select>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.medicalRecord.includeSummaryOnly}
                  onChange={(e) => updateConfig('medicalRecord', 'includeSummaryOnly', e.target.checked)}
                  className="mr-2"
                />
                Solo resúmenes (no detalles completos)
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.medicalRecord.chronologicalOrder}
                  onChange={(e) => updateConfig('medicalRecord', 'chronologicalOrder', e.target.checked)}
                  className="mr-2"
                />
                Orden cronológico (más reciente primero)
              </label>
            </div>
          </Card>

          {/* Configuración Rápida */}
          <Card className="p-4 bg-blue-50">
            <h3 className="text-lg font-medium mb-4">⚡ Configuración Rápida</h3>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => setConfig(PrintConfigManager.getEconomicConfig())}
              >
                🌿 Modo Económico (Ahorra Papel)
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
              >
                🔄 Restaurar Predeterminados
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar Configuración
          </Button>
        </div>
      </div>
    </div>
  );
}