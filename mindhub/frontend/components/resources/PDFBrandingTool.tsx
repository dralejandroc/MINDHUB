'use client';

import { useState, useCallback } from 'react';
import { 
  DocumentIcon,
  CloudArrowUpIcon,
  CogIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface BrandingSettings {
  clinicName: string;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
  watermark: boolean;
  headerFooter: boolean;
}

interface PDFBrandingToolProps {
  onComplete?: (result: any) => void;
  onCancel?: () => void;
}

export default function PDFBrandingTool({ onComplete, onCancel }: PDFBrandingToolProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    clinicName: '',
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    watermark: true,
    headerFooter: true
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Por favor selecciona solo archivos PDF');
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Por favor selecciona solo archivos PDF');
      }
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona un archivo PDF');
      return;
    }

    if (!brandingSettings.clinicName.trim()) {
      setError('Por favor ingresa el nombre de la clínica');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('clinicSettings', JSON.stringify(brandingSettings));

      const response = await fetch('/api/resources/documents/add-branding', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        if (onComplete) {
          onComplete(data.data);
        }
      } else {
        setError(data.error || 'Error aplicando marca al PDF');
      }
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError('Error de conexión al procesar el PDF');
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
      a.download = `branded_${selectedFile?.name || 'document.pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Error al descargar el archivo');
    }
  };

  const updateContactInfo = (field: keyof BrandingSettings['contactInfo'], value: string) => {
    setBrandingSettings(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                ¡Marca Aplicada Exitosamente!
              </h2>
              <p className="text-gray-600">
                Tu PDF ha sido procesado con la marca corporativa
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center space-x-3">
              <DocumentIcon className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">
                  {selectedFile?.name}
                </div>
                <div className="text-sm text-gray-600">
                  Tamaño: {(result.fileSize / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Descargar PDF con Marca</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setSelectedFile(null);
              }}
              className="flex-1"
            >
              Procesar Otro PDF
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CogIcon className="h-8 w-8 text-orange-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Aplicar Marca a PDF
            </h2>
            <p className="text-gray-600">
              Agrega automáticamente tu marca y datos de contacto a cualquier PDF
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
          {/* File Upload Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Subir Archivo PDF
              </label>
              
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-orange-500 bg-orange-50' 
                    : selectedFile 
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {selectedFile ? (
                  <div className="space-y-3">
                    <DocumentIcon className="h-12 w-12 text-green-600 mx-auto" />
                    <div>
                      <div className="font-medium text-green-900">
                        {selectedFile.name}
                      </div>
                      <div className="text-sm text-green-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <div className="text-lg font-medium text-gray-900">
                        Arrastra tu PDF aquí
                      </div>
                      <div className="text-gray-600">
                        o haz clic para seleccionar
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Solo archivos PDF • Máximo 50MB
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Branding Settings */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Configuración de Marca
              </label>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre de la clínica *"
                  value={brandingSettings.clinicName}
                  onChange={(e) => setBrandingSettings({...brandingSettings, clinicName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={brandingSettings.contactInfo.phone}
                  onChange={(e) => updateContactInfo('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                <input
                  type="email"
                  placeholder="Email"
                  value={brandingSettings.contactInfo.email}
                  onChange={(e) => updateContactInfo('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                <input
                  type="url"
                  placeholder="Sitio web"
                  value={brandingSettings.contactInfo.website}
                  onChange={(e) => updateContactInfo('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Opciones de Marca
              </label>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={brandingSettings.watermark}
                    onChange={(e) => setBrandingSettings({...brandingSettings, watermark: e.target.checked})}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-3 text-sm">
                    Agregar marca de agua diagonal
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={brandingSettings.headerFooter}
                    onChange={(e) => setBrandingSettings({...brandingSettings, headerFooter: e.target.checked})}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-3 text-sm">
                    Agregar header y footer con información de contacto
                  </span>
                </label>
              </div>
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
            disabled={!selectedFile || !brandingSettings.clinicName.trim() || processing}
            className="flex items-center space-x-2"
          >
            {processing ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Aplicando Marca...</span>
              </>
            ) : (
              <>
                <CogIcon className="h-4 w-4" />
                <span>Aplicar Marca al PDF</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}