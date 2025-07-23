'use client';

import { useState, useRef } from 'react';
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface PatientDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url?: string;
}

interface PatientDocumentsProps {
  patientId: string;
  patientName: string;
}

export default function PatientDocuments({ patientId, patientName }: PatientDocumentsProps) {
  const [documents, setDocuments] = useState<PatientDocument[]>([
    // Mock data - replace with real API calls
    {
      id: '1',
      name: 'Resultados_de_laboratorio.pdf',
      type: 'application/pdf',
      size: 1024 * 256, // 256KB
      uploadedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Radiografia_torax.jpg',
      type: 'image/jpeg',
      size: 1024 * 512, // 512KB
      uploadedAt: '2024-01-10T14:20:00Z'
    }
  ]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return PhotoIcon;
    }
    return DocumentTextIcon;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      // Simulate file upload - replace with real API call
      for (const file of Array.from(files)) {
        const newDocument: PatientDocument = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
        
        // Add to documents list
        setDocuments(prev => [newDocument, ...prev]);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return;
    }

    try {
      // Simulate deletion - replace with real API call
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento. Inténtalo de nuevo.');
    }
  };

  const handleViewDocument = (document: PatientDocument) => {
    // In a real implementation, this would open the document
    console.log('Viewing document:', document.name);
    alert(`Función de visualización en desarrollo para: ${document.name}`);
  };

  const handleDownloadDocument = (document: PatientDocument) => {
    // In a real implementation, this would trigger download
    console.log('Downloading document:', document.name);
    alert(`Función de descarga en desarrollo para: ${document.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <div className="text-center">
          <DocumentArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Subir Documentos
          </h3>
          <p className="text-gray-600 mb-4">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Formatos soportados: PDF, JPG, PNG, DOCX (Máximo 10MB por archivo)
          </p>
          
          <div className="space-y-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              {uploading ? 'Subiendo...' : 'Seleccionar Archivos'}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Documentos del Paciente
          </h3>
          <span className="text-sm text-gray-500">
            {documents.length} documento{documents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin documentos
            </h3>
            <p className="text-gray-600 mb-4">
              Este paciente no tiene documentos subidos todavía
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Subir primer documento
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {documents.map((document) => {
              const IconComponent = getFileIcon(document.type);
              
              return (
                <div
                  key={document.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <IconComponent className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {document.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>{formatFileSize(document.size)}</span>
                          <span>•</span>
                          <span>{formatDate(document.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => handleViewDocument(document)}
                        variant="ghost"
                        className="p-2 h-8 w-8"
                        title="Ver documento"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDownloadDocument(document)}
                        variant="ghost"
                        className="p-2 h-8 w-8"
                        title="Descargar documento"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteDocument(document.id)}
                        variant="ghost"
                        className="p-2 h-8 w-8 text-red-600 hover:bg-red-50"
                        title="Eliminar documento"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-900 font-medium">
            Almacenamiento utilizado
          </span>
          <span className="text-blue-700">
            {formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))} / 100 MB
          </span>
        </div>
        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min((documents.reduce((total, doc) => total + doc.size, 0) / (100 * 1024 * 1024)) * 100, 100)}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}