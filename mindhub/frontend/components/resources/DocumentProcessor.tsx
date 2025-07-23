'use client';

import { useState, useCallback } from 'react';
import { 
  DocumentTextIcon, 
  SparklesIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DocumentProcessorProps {
  onComplete?: (result: any) => void;
  onCancel?: () => void;
}

interface ProcessingResult {
  resourceId: number;
  preview: string;
  wordCount: number;
  estimatedPages: number;
  fileSize: number;
  downloadUrl: string;
}

export default function DocumentProcessor({ onComplete, onCancel }: DocumentProcessorProps) {
  const [inputText, setInputText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [variables, setVariables] = useState({
    nombrePaciente: '',
    nombreProfesional: '',
    nombreClinica: '',
    fechaHoy: new Date().toLocaleDateString('es-MX')
  });
  const [preview, setPreview] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState('');
  
  const templates = [
    {
      id: 'default',
      name: 'Documento Estándar',
      description: 'Formato básico para documentos generales',
      icon: DocumentTextIcon
    },
    {
      id: 'educational',
      name: 'Material Educativo',
      description: 'Para recursos psicoeducativos y folletos informativos',
      icon: SparklesIcon
    },
    {
      id: 'worksheet',
      name: 'Hoja de Trabajo',
      description: 'Para ejercicios y actividades terapéuticas',
      icon: ClockIcon
    },
    {
      id: 'instructions',
      name: 'Instrucciones',
      description: 'Para indicaciones y pautas de tratamiento',
      icon: CheckCircleIcon
    }
  ];

  const handlePreview = useCallback(async () => {
    if (!inputText.trim()) return;

    try {
      const response = await fetch('/api/resources/documents/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          template: selectedTemplate,
          variables
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPreview(data.data.preview);
      } else {
        setError(data.error || 'Error generando vista previa');
      }
    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Error de conexión al generar vista previa');
    }
  }, [inputText, selectedTemplate, variables]);

  const handleProcess = async () => {
    if (!inputText.trim()) {
      setError('Por favor ingresa algún texto para procesar');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/resources/documents/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          template: selectedTemplate,
          variables,
          brandingOptions: {
            clinicName: variables.nombreClinica,
            contactInfo: {
              // These would come from user settings in a real app
            }
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        if (onComplete) {
          onComplete(data.data);
        }
      } else {
        setError(data.error || 'Error procesando el documento');
      }
    } catch (err) {
      console.error('Error processing document:', err);
      setError('Error de conexión al procesar el documento');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.downloadUrl) return;

    try {
      const response = await fetch(result.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `documento_procesado_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Error al descargar el archivo');
    }
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                ¡Documento Procesado Exitosamente!
              </h2>
              <p className="text-gray-600">
                Tu documento ha sido formateado y está listo para descargar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.wordCount}</div>
              <div className="text-sm text-blue-600">Palabras</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.estimatedPages}</div>
              <div className="text-sm text-green-600">Páginas estimadas</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(result.fileSize / 1024 / 1024).toFixed(2)} MB
              </div>
              <div className="text-sm text-purple-600">Tamaño del archivo</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Vista previa del contenido:</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {result.preview}
            </p>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Descargar PDF</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setInputText('');
                setPreview('');
              }}
              className="flex-1"
            >
              Crear Nuevo Documento
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <SparklesIcon className="h-8 w-8 text-orange-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Procesador Automático de Documentos
            </h2>
            <p className="text-gray-600">
              Sube tu texto y el sistema lo formateará automáticamente con marca profesional
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selecciona una plantilla
              </label>
              <div className="grid grid-cols-1 gap-3">
                {templates.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <label key={template.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplate === template.id}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-lg border-2 transition-all ${
                        selectedTemplate === template.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <IconComponent className={`h-6 w-6 mt-0.5 ${
                            selectedTemplate === template.id ? 'text-orange-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1">
                            <div className={`font-medium ${
                              selectedTemplate === template.id ? 'text-orange-900' : 'text-gray-900'
                            }`}>
                              {template.name}
                            </div>
                            <div className={`text-sm ${
                              selectedTemplate === template.id ? 'text-orange-600' : 'text-gray-500'
                            }`}>
                              {template.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Variables Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Variables de personalización
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre del paciente"
                  value={variables.nombrePaciente}
                  onChange={(e) => setVariables({...variables, nombrePaciente: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  placeholder="Nombre del profesional"
                  value={variables.nombreProfesional}
                  onChange={(e) => setVariables({...variables, nombreProfesional: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  placeholder="Nombre de la clínica"
                  value={variables.nombreClinica}
                  onChange={(e) => setVariables({...variables, nombreClinica: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Contenido del documento
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe o pega tu texto aquí. El sistema lo formateará automáticamente..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <div className="text-sm text-gray-500 mt-2">
                {inputText.length} caracteres • {inputText.split(/\s+/).filter(word => word.length > 0).length} palabras
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Vista Previa</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!inputText.trim()}
                className="flex items-center space-x-2"
              >
                <EyeIcon className="h-4 w-4" />
                <span>Actualizar Vista Previa</span>
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 min-h-[400px]">
              {preview ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                    {preview}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>La vista previa aparecerá aquí</p>
                    <p className="text-sm">Escribe algo y haz clic en "Actualizar Vista Previa"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleProcess}
            disabled={!inputText.trim() || processing}
            className="flex items-center space-x-2"
          >
            {processing ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                <span>Generar Documento PDF</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}