'use client';

import { useState, useRef } from 'react';
import {
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  DocumentTextIcon,
  TableCellsIcon,
  UserGroupIcon,
  StarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface PatientImportManagerProps {
  onClose: () => void;
  onImportComplete: (importedCount: number) => void;
}

interface ImportResult {
  total: number;
  processed: number;
  errorsCount: number;
  warningsCount: number;
  errors: any[];
  warnings: any[];
  samplePatients?: any[];
}

interface ImportLimits {
  maxPatientsPerImport: number;
  maxFileSize: string;
  allowedFormats: string[];
  templateTypes: {
    type: string;
    name: string;
    description: string;
    maxPatients: number;
  }[];
}

export default function PatientImportManager({ onClose, onImportComplete }: PatientImportManagerProps) {
  const [step, setStep] = useState<'setup' | 'upload' | 'preview' | 'processing' | 'complete'>('setup');
  const [selectedTemplate, setSelectedTemplate] = useState<'basic' | 'complete' | 'clinic'>('complete');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limits, setLimits] = useState<ImportLimits | null>(null);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar límites y permisos al montar el componente
  useState(() => {
    loadImportLimits();
  });

  const loadImportLimits = async () => {
    try {
      const response = await fetch('/api/expedix/import/limits');
      const data = await response.json();
      
      if (data.success) {
        setLimits(data.data);
        setHasPermissions(true);
      } else {
        setHasPermissions(false);
        setError(data.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error loading import limits:', error);
      setHasPermissions(false);
      setError('Error al cargar los límites de importación');
    }
  };

  const downloadTemplate = async (templateType: string) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/expedix/import/template/${templateType}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = `plantilla-${templateType}.xlsx`;
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        }
        
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Error al descargar la plantilla');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Error al descargar la plantilla');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de archivo no permitido. Solo se aceptan archivos Excel (.xlsx, .xls) y CSV');
        return;
      }
      
      // Validar tamaño
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('El archivo es demasiado grande. Tamaño máximo: 10MB');
        return;
      }
      
      setUploadedFile(file);
      setError(null);
      setStep('upload');
    }
  };

  const processPreview = async () => {
    if (!uploadedFile) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const response = await fetch('/api/expedix/import/preview', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPreviewResult(data.data);
        setStep('preview');
      } else {
        setError(data.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error processing preview:', error);
      setError('Error al procesar la vista previa');
    } finally {
      setProcessing(false);
    }
  };

  const executeImport = async () => {
    if (!uploadedFile) return;
    
    setProcessing(true);
    setError(null);
    setStep('processing');
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const response = await fetch('/api/expedix/import/execute', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStep('complete');
        onImportComplete(data.data.processed);
      } else {
        setError(data.message || 'Error desconocido');
        setStep('preview'); // Volver a preview para mostrar errores
      }
    } catch (error) {
      console.error('Error executing import:', error);
      setError('Error al importar los pacientes');
      setStep('preview');
    } finally {
      setProcessing(false);
    }
  };

  const resetImport = () => {
    setStep('setup');
    setUploadedFile(null);
    setPreviewResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Renderizar pantalla de permisos insuficientes
  if (hasPermissions === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <StarIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Funcionalidad Premium
              </h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6 text-center">
            <div className="mb-6">
              <StarIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Importación Masiva de Pacientes
              </h3>
              <p className="text-gray-600">
                Esta funcionalidad está disponible exclusivamente para usuarios Premium y Clínicas
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Beneficios Premium:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span>Importación de hasta 1000 pacientes</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span>Plantillas predefinidas</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span>Validación automática de datos</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span>Soporte técnico prioritario</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <StarIcon className="h-4 w-4 mr-2" />
                Actualizar a Premium
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CloudArrowUpIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Importación Masiva de Pacientes
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {[
              { key: 'setup', name: 'Configuración', icon: DocumentArrowDownIcon },
              { key: 'upload', name: 'Subir Archivo', icon: CloudArrowUpIcon },
              { key: 'preview', name: 'Vista Previa', icon: TableCellsIcon },
              { key: 'complete', name: 'Completado', icon: CheckCircleIcon }
            ].map((stepItem, index) => {
              const IconComponent = stepItem.icon;
              const isActive = step === stepItem.key;
              const isCompleted = [
                'setup', 'upload', 'preview', 'processing', 'complete'
              ].indexOf(step) > index;
              
              return (
                <div key={stepItem.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isActive ? 'bg-blue-600 text-white' :
                    isCompleted ? 'bg-green-600 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' :
                    isCompleted ? 'text-green-600' :
                    'text-gray-500'
                  }`}>
                    {stepItem.name}
                  </span>
                  {index < 3 && (
                    <div className={`w-12 h-px mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {step === 'setup' && renderSetupStep()}
          {step === 'upload' && renderUploadStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );

  function renderSetupStep() {
    if (!limits) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Cargando configuración...</span>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <UserGroupIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Importa Pacientes desde Excel
          </h3>
          <p className="text-gray-600">
            Descarga una plantilla, llénala con tus datos y súbela para importar múltiples pacientes a la vez
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {limits.templateTypes.map((template) => (
            <Card key={template.type} className={`p-6 cursor-pointer transition-all ${
              selectedTemplate === template.type ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'
            }`} onClick={() => setSelectedTemplate(template.type as any)}>
              <div className="text-center">
                <div className={`w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center ${
                  template.type === 'basic' ? 'bg-green-100' :
                  template.type === 'complete' ? 'bg-blue-100' :
                  'bg-purple-100'
                }`}>
                  {template.type === 'clinic' ? (
                    <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                  ) : (
                    <DocumentTextIcon className={`h-6 w-6 ${
                      template.type === 'basic' ? 'text-green-600' :
                      template.type === 'complete' ? 'text-blue-600' :
                      'text-purple-600'
                    }`} />
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <p className="text-xs text-gray-500">Hasta {template.maxPatients} pacientes</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-between">
          <div className="text-sm text-gray-500">
            <p>Límites de tu cuenta:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Máximo {limits.maxPatientsPerImport} pacientes por importación</li>
              <li>Tamaño máximo de archivo: {limits.maxFileSize}</li>
              <li>Formatos permitidos: {limits.allowedFormats.join(', ')}</li>
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={() => downloadTemplate(selectedTemplate)}
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Descargando...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Descargar Plantilla
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderUploadStep() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sube tu Archivo Completado
          </h3>
          <p className="text-gray-600">
            Selecciona el archivo Excel que completaste con los datos de tus pacientes
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="text-center">
            <CloudArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            
            {uploadedFile ? (
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">{uploadedFile.name}</p>
                  <p className="text-sm text-green-600">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                <div className="flex justify-center space-x-3">
                  <Button variant="outline" onClick={() => setUploadedFile(null)}>
                    Cambiar Archivo
                  </Button>
                  <Button
                    onClick={processPreview}
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {processing ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Procesando...
                      </>
                    ) : (
                      'Continuar'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  Arrastra tu archivo aquí o haz click para seleccionarlo
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Seleccionar Archivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('setup')}>
            Atrás
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  function renderPreviewStep() {
    if (!previewResult) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Vista Previa de Importación
          </h3>
          <p className="text-gray-600">
            Revisa los resultados antes de proceder con la importación
          </p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{previewResult.total}</div>
            <div className="text-sm text-gray-600">Total Registros</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{previewResult.processed}</div>
            <div className="text-sm text-gray-600">Procesables</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{previewResult.warningsCount}</div>
            <div className="text-sm text-gray-600">Advertencias</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{previewResult.errorsCount}</div>
            <div className="text-sm text-gray-600">Errores</div>
          </Card>
        </div>

        {/* Errores y advertencias */}
        {(previewResult.errors.length > 0 || previewResult.warnings.length > 0) && (
          <div className="space-y-4">
            {previewResult.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Errores encontrados:</h4>
                <div className="max-h-40 overflow-y-auto">
                  {previewResult.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      Fila {error.row}: {error.field} - {error.error}
                    </div>
                  ))}
                  {previewResult.errors.length > 10 && (
                    <div className="text-sm text-red-600 font-medium">
                      ...y {previewResult.errors.length - 10} errores más
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {previewResult.warnings.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Advertencias:</h4>
                <div className="max-h-40 overflow-y-auto">
                  {previewResult.warnings.slice(0, 10).map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-700 mb-1">
                      Fila {warning.row}: {warning.field} - {warning.warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={resetImport}>
            Empezar de Nuevo
          </Button>
          
          {previewResult.errorsCount === 0 ? (
            <Button
              onClick={executeImport}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Importando...
                </>
              ) : (
                `Importar ${previewResult.processed} Pacientes`
              )}
            </Button>
          ) : (
            <div className="text-red-600 text-sm">
              Corrige los errores antes de continuar
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderProcessingStep() {
    return (
      <div className="text-center py-12">
        <LoadingSpinner size="xl" className="mb-6" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Importando Pacientes...
        </h3>
        <p className="text-gray-600">
          Por favor espera mientras procesamos tu archivo. Esto puede tomar algunos minutos.
        </p>
      </div>
    );
  }

  function renderCompleteStep() {
    return (
      <div className="text-center py-12">
        <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-6" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ¡Importación Completada!
        </h3>
        <p className="text-gray-600 mb-6">
          Se han importado exitosamente {previewResult?.processed || 0} pacientes a tu sistema.
        </p>
        
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={resetImport}>
            Importar Más
          </Button>
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
            Cerrar
          </Button>
        </div>
      </div>
    );
  }
}