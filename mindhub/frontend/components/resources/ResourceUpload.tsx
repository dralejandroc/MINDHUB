'use client';

import { useState } from 'react';
import { 
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ResourceUploadProps {
  onCancel: () => void;
  onSave: (resourceData: any) => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}

const CATEGORIES = [
  'Trastornos de Ansiedad',
  'Trastornos del Estado de Ánimo',
  'Instrumentos de Evaluación',
  'Técnicas Terapéuticas',
  'Psicoeducación',
  'Hojas de Trabajo',
  'Apoyo Familiar'
];

export default function ResourceUpload({ onCancel, onSave }: ResourceUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [resourceData, setResourceData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    accessLevel: 'public',
    expirationDate: ''
  });
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles: UploadFile[] = Array.from(files).map(file => ({
      file,
      id: `${Date.now()}_${file.name}`,
      status: 'uploading' as const,
      progress: 0
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach(uploadFile => {
      simulateUpload(uploadFile.id);
    });
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        setUploadFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'success', progress: 100 } : f
        ));
        clearInterval(interval);
      } else {
        setUploadFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ));
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return { type: 'PDF', color: 'text-red-500' };
      case 'mp4':
      case 'avi':
      case 'mov':
        return { type: 'Video', color: 'text-blue-500' };
      case 'mp3':
      case 'wav':
        return { type: 'Audio', color: 'text-green-500' };
      case 'jpg':
      case 'jpeg':
      case 'png':
        return { type: 'Imagen', color: 'text-purple-500' };
      default:
        return { type: 'Archivo', color: 'text-gray-500' };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadFiles.length === 0) {
      alert('Por favor selecciona al menos un archivo');
      return;
    }

    if (!resourceData.title || !resourceData.category) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    const newResource = {
      ...resourceData,
      files: uploadFiles.map(f => ({
        name: f.file.name,
        size: getFileSize(f.file.size),
        type: getFileType(f.file.name).type.toLowerCase()
      })),
      id: `resource_${Date.now()}`,
      uploadDate: new Date().toISOString(),
      downloadCount: 0
    };

    onSave(newResource);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subir Nuevo Recurso</h1>
          <p className="text-gray-600">Agregar material psicoeducativo a la biblioteca</p>
        </div>
        <Button onClick={onCancel} variant="outline">
          <XMarkIcon className="h-5 w-5 mr-2" />
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Archivos</h3>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </h4>
            <p className="text-gray-600 mb-4">
              Soporta PDF, videos, audios e imágenes. Máximo 50MB por archivo.
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.mp4,.avi,.mov,.mp3,.wav,.jpg,.jpeg,.png"
            />
            <Button type="button" variant="outline">
              Seleccionar Archivos
            </Button>
          </div>

          {/* Uploaded Files List */}
          {uploadFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-gray-900">Archivos seleccionados:</h4>
              {uploadFiles.map((uploadFile) => {
                const fileTypeInfo = getFileType(uploadFile.file.name);
                return (
                  <div key={uploadFile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className={`h-8 w-8 ${fileTypeInfo.color}`} />
                      <div>
                        <p className="font-medium text-gray-900">{uploadFile.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {getFileSize(uploadFile.file.size)} • {fileTypeInfo.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {uploadFile.status === 'uploading' && (
                        <div className="w-32">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadFile.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.round(uploadFile.progress)}%
                          </p>
                        </div>
                      )}
                      
                      {uploadFile.status === 'success' && (
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                      )}
                      
                      <button
                        type="button"
                        onClick={() => removeFile(uploadFile.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Resource Information */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Recurso</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={resourceData.title}
                onChange={(e) => setResourceData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nombre descriptivo del recurso"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={resourceData.description}
                onChange={(e) => setResourceData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Descripción detallada del contenido y uso del recurso"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                value={resourceData.category}
                onChange={(e) => setResourceData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Seleccionar categoría</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etiquetas
              </label>
              <input
                type="text"
                value={resourceData.tags}
                onChange={(e) => setResourceData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Etiquetas separadas por comas (ej: ansiedad, CBT, manual)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de Acceso
              </label>
              <select
                value={resourceData.accessLevel}
                onChange={(e) => setResourceData(prev => ({ ...prev, accessLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="public">Público</option>
                <option value="professional">Solo Profesionales</option>
                <option value="restricted">Acceso Restringido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Expiración (Opcional)
              </label>
              <input
                type="date"
                value={resourceData.expirationDate}
                onChange={(e) => setResourceData(prev => ({ ...prev, expirationDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" onClick={onCancel} variant="outline">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={uploadFiles.length === 0 || uploadFiles.some(f => f.status === 'uploading')}
          >
            📚 Guardar Recurso
          </Button>
        </div>
      </form>
    </div>
  );
}