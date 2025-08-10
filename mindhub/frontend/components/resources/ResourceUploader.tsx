'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TagIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface ResourceUploaderProps {
  categories: Category[];
  onUploadComplete: (resource: any) => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  preview?: string;
}

export const ResourceUploader: React.FC<ResourceUploaderProps> = ({
  categories,
  onUploadComplete
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    tags: [] as string[],
    libraryType: 'private' as 'public' | 'private'
  });
  const [tagInput, setTagInput] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 10, // Máximo 10 archivos
    multiple: true
  });

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    const formDataToSend = new FormData();
    formDataToSend.append('file', uploadFile.file);
    formDataToSend.append('title', uploadFile.file.name.split('.')[0]);
    formDataToSend.append('categoryId', formData.categoryId);
    formDataToSend.append('libraryType', formData.libraryType);
    formDataToSend.append('tags', JSON.stringify(formData.tags));

    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resources/upload`, {
        method: 'POST',
        body: formDataToSend,
        // Add progress tracking if needed
      });

      if (response.ok) {
        const result = await response.json();
        
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'completed', progress: 100 } : f
        ));

        return result.data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir archivo');
      }
    } catch (error) {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Error desconocido'
        } : f
      ));
      throw error;
    }
  };

  const handleUploadAll = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of uploadFiles.filter(f => f.status === 'pending')) {
        const resource = await uploadFile(file);
        if (resource) {
          onUploadComplete(resource);
        }
      }
      
      toast.success(`${uploadFiles.length} archivo(s) subido(s) exitosamente`);
      
      // Clear completed files after a delay
      setTimeout(() => {
        setUploadFiles(prev => prev.filter(f => f.status !== 'completed'));
      }, 2000);
      
    } catch (error) {
      toast.error('Error al subir algunos archivos');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <DocumentTextIcon className="h-8 w-8 text-red-500" />;
    }
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-lg text-primary-600 font-medium">
              Suelta los archivos aquí...
            </p>
          ) : (
            <div>
              <p className="text-lg text-gray-900 font-medium mb-2">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Soporta: PDF, imágenes (JPG, PNG, GIF), documentos de texto (TXT, DOC, DOCX)
              </p>
              <p className="text-xs text-gray-500">
                Tamaño máximo por archivo: 100MB
              </p>
            </div>
          )}
        </div>

        {/* File Metadata Form */}
        {uploadFiles.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Configuración de Archivos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FolderIcon className="h-4 w-4 inline mr-1" />
                  Categoría
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Library Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biblioteca
                </label>
                <select
                  value={formData.libraryType}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    libraryType: e.target.value as 'public' | 'private'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="private">Mi Biblioteca (Privada)</option>
                  <option value="public">Biblioteca Pública</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TagIcon className="h-4 w-4 inline mr-1" />
                Etiquetas
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Agregar etiqueta..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  onClick={addTag}
                  variant="outline"
                  size="sm"
                  disabled={!tagInput.trim()}
                >
                  Agregar
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Archivos Seleccionados ({uploadFiles.length})
            </h3>
            <div className="flex space-x-2">
              <Button
                onClick={() => setUploadFiles([])}
                variant="outline"
                size="sm"
                disabled={uploading}
              >
                Limpiar
              </Button>
              <Button
                onClick={handleUploadAll}
                variant="primary"
                disabled={uploading || uploadFiles.length === 0}
              >
                {uploading ? 'Subiendo...' : 'Subir Todos'}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {uploadFile.preview ? (
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(uploadFile.file)
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === 'completed' && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                      {uploadFile.status === 'error' && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      )}
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        disabled={uploading}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-2">
                    {formatFileSize(uploadFile.file.size)} • {uploadFile.file.type}
                  </p>

                  {/* Progress Bar */}
                  {uploadFile.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadFile.status === 'error' && uploadFile.error && (
                    <p className="text-sm text-red-600 mt-1">
                      {uploadFile.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};