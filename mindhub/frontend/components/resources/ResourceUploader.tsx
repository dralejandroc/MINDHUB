'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  preview?: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface ResourceUploaderProps {
  onBack: () => void;
}

export const ResourceUploader: React.FC<ResourceUploaderProps> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/rtf': ['.rtf'],
    'application/vnd.apple.pages': ['.pages']
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file type
    const isValidType = Object.keys(acceptedFileTypes).includes(file.type) || 
                       file.name.toLowerCase().endsWith('.pages');
    
    if (!isValidType) {
      return 'Tipo de archivo no soportado. Use PDF, Word, Pages o archivos de texto.';
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'El archivo excede el tamaño máximo de 10MB.';
    }

    return null;
  };

  const processFiles = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validationError = validateFile(file);
      
      const uploadedFile: UploadedFile = {
        id: `file_${Date.now()}_${i}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        status: validationError ? 'error' : 'uploading',
        error: validationError || undefined
      };

      // Generate preview for supported types
      if (!validationError) {
        if (file.type === 'application/pdf') {
          uploadedFile.preview = 'PDF Document';
        } else if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            uploadedFile.preview = e.target?.result as string;
            setFiles(prev => prev.map(f => f.id === uploadedFile.id ? uploadedFile : f));
          };
          reader.readAsDataURL(file);
        } else {
          uploadedFile.preview = 'Document';
        }
      }

      newFiles.push(uploadedFile);
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate file processing
    for (const file of newFiles.filter(f => f.status === 'uploading')) {
      setTimeout(async () => {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing' } : f
        ));

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed', url: `/api/resources/${file.id}` } : f
        ));
      }, 500);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (type: string, status: string) => {
    if (status === 'uploading' || status === 'processing') {
      return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />;
    }
    
    if (status === 'error') {
      return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
    }

    if (type === 'application/pdf') {
      return <DocumentTextIcon className="h-6 w-6 text-red-500" />;
    }
    if (type.includes('word') || type.includes('document')) {
      return <DocumentIcon className="h-6 w-6 text-blue-500" />;
    }
    if (type === 'text/plain' || type === 'text/rtf') {
      return <DocumentTextIcon className="h-6 w-6 text-gray-500" />;
    }
    if (type.includes('pages')) {
      return <DocumentIcon className="h-6 w-6 text-orange-500" />;
    }
    
    return <DocumentIcon className="h-6 w-6 text-gray-500" />;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Subiendo...';
      case 'processing': return 'Procesando...';
      case 'completed': return 'Completado';
      case 'error': return 'Error';
      default: return '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canProceed = files.length > 0 && files.every(f => f.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <Button
          onClick={onBack}
          variant="outline"
          className="mr-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Volver a Biblioteca
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Subir y Crear Recursos</h2>
          <p className="text-sm text-gray-600">Sube documentos y personalízalos con tu marca</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.rtf,.pages"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Soporta PDF, Word (.doc, .docx), Pages, y archivos de texto
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tamaño máximo: 10MB por archivo
              </p>
            </div>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <PhotoIcon className="w-4 h-4 mr-2" />
              Seleccionar Archivos
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Archivos Subidos ({files.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div key={file.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type, file.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        file.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : file.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusText(file.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      
                      {file.status === 'processing' && (
                        <div className="flex-1 bg-gray-200 rounded-full h-1 max-w-xs">
                          <div className="bg-orange-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                      )}
                    </div>
                    
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {file.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Preview functionality
                        console.log('Preview file:', file.name);
                      }}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Step */}
      {canProceed && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                ¡Archivos listos!
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Ahora puedes personalizar tus documentos con tu marca y configuración
              </p>
            </div>
            
            <Button
              onClick={() => {
                // Navigate to branding settings
                console.log('Proceed to branding with files:', files.filter(f => f.status === 'completed'));
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Continuar con Personalización
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Tipos de archivo soportados:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>PDF:</strong> Documentos PDF existentes</li>
          <li>• <strong>Word:</strong> Documentos .doc y .docx</li>
          <li>• <strong>Pages:</strong> Documentos de Apple Pages</li>
          <li>• <strong>Texto:</strong> Archivos .txt y .rtf</li>
        </ul>
      </div>
    </div>
  );
};