'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  FiUpload, 
  FiX, 
  FiFile, 
  FiImage, 
  FiFileText,
  FiCheck,
  FiAlertCircle,
  FiTrash
} from 'react-icons/fi'

interface ResourceUploadProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (resourceId: string) => void
}

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  resourceData?: {
    title: string
    description: string
    category: string
    tags: string[]
  }
}

const ResourceUpload: React.FC<ResourceUploadProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const categories = [
    { id: 'terapia-individual', name: 'Terapia Individual' },
    { id: 'psicoeducacion', name: 'Psicoeducación' },
    { id: 'evaluacion', name: 'Evaluación' },
    { id: 'terapia-familiar', name: 'Terapia Familiar' },
    { id: 'terapia-grupal', name: 'Terapia Grupal' },
    { id: 'administrativo', name: 'Administrativo' }
  ]

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    const maxSize = 50 * 1024 * 1024 // 50MB

    const newFiles: UploadFile[] = files
      .filter(file => {
        if (!allowedTypes.includes(file.type)) {
          console.warn(`Tipo de archivo no permitido: ${file.type}`)
          return false
        }
        if (file.size > maxSize) {
          console.warn(`Archivo muy grande: ${file.name}`)
          return false
        }
        return true
      })
      .map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending' as const,
        progress: 0,
        resourceData: {
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: '',
          category: '',
          tags: []
        }
      }))

    setUploadFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const updateFileData = (fileId: string, field: keyof UploadFile['resourceData'], value: any) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId 
        ? {
            ...f,
            resourceData: {
              ...f.resourceData!,
              [field]: value
            }
          }
        : f
    ))
  }

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('title', uploadFile.resourceData!.title)
      formData.append('description', uploadFile.resourceData!.description)
      formData.append('category', uploadFile.resourceData!.category)
      formData.append('tags', JSON.stringify(uploadFile.resourceData!.tags))

      // Simular upload con XMLHttpRequest para mostrar progreso
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress, status: 'uploading' }
              : f
          ))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'success', progress: 100 }
              : f
          ))
          resolve()
        } else {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error', error: 'Error al subir archivo' }
              : f
          ))
          reject(new Error('Upload failed'))
        }
      })

      xhr.addEventListener('error', () => {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error', error: 'Error de conexión' }
            : f
        ))
        reject(new Error('Network error'))
      })

      // En desarrollo, simular upload exitoso
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'success', progress: 100 }
              : f
          ))
          resolve()
        }, 2000)
        return
      }

      xhr.open('POST', '/api/resources/upload')
      xhr.send(formData)
    })
  }

  const handleUploadAll = async () => {
    const filesToUpload = uploadFiles.filter(f => f.status === 'pending')
    
    if (filesToUpload.length === 0) return

    // Validar que todos los archivos tengan datos completos
    const invalidFiles = filesToUpload.filter(f => 
      !f.resourceData?.title || !f.resourceData?.category
    )

    if (invalidFiles.length > 0) {
      alert('Por favor completa el título y categoría de todos los archivos')
      return
    }

    setIsUploading(true)

    try {
      // Subir archivos en paralelo (máximo 3 a la vez)
      const chunkSize = 3
      for (let i = 0; i < filesToUpload.length; i += chunkSize) {
        const chunk = filesToUpload.slice(i, i + chunkSize)
        await Promise.allSettled(chunk.map(uploadFile))
      }

      // Verificar si todos fueron exitosos
      const successCount = uploadFiles.filter(f => f.status === 'success').length
      const errorCount = uploadFiles.filter(f => f.status === 'error').length

      if (errorCount === 0) {
        setTimeout(() => {
          onClose()
          if (onSuccess) {
            onSuccess('uploaded-resources')
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.startsWith('image/')) return <FiImage className="w-8 h-8 text-blue-600" />
    if (type === 'application/pdf') return <FiFileText className="w-8 h-8 text-red-600" />
    return <FiFile className="w-8 h-8 text-gray-600" />
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <FiCheck className="w-5 h-5 text-green-600" />
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-600" />
      case 'uploading':
        return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Subir Recursos</h2>
            <p className="text-gray-600 mt-1">
              Sube archivos PDF, imágenes o documentos para crear recursos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </h3>
            <p className="text-gray-500 mb-4">
              Tipos permitidos: PDF, Imágenes (JPG, PNG, GIF), Documentos de texto
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Tamaño máximo: 50MB por archivo
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <FiUpload className="w-4 h-4" />
              <span>Seleccionar Archivos</span>
            </label>
          </div>

          {/* Files List */}
          {uploadFiles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Archivos a Subir ({uploadFiles.length})
              </h3>
              <div className="space-y-4">
                {uploadFiles.map(uploadFile => (
                  <div
                    key={uploadFile.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start space-x-4">
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        {getFileIcon(uploadFile.file)}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900 truncate">
                              {uploadFile.file.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(uploadFile.status)}
                            {uploadFile.status === 'pending' && (
                              <button
                                onClick={() => removeFile(uploadFile.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <FiTrash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {uploadFile.status === 'uploading' && (
                          <div className="mb-3">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadFile.progress}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Subiendo... {uploadFile.progress}%
                            </p>
                          </div>
                        )}

                        {/* Error Message */}
                        {uploadFile.status === 'error' && uploadFile.error && (
                          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {uploadFile.error}
                          </div>
                        )}

                        {/* File Metadata Form */}
                        {uploadFile.status === 'pending' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Título del Recurso *
                              </label>
                              <input
                                type="text"
                                value={uploadFile.resourceData?.title || ''}
                                onChange={(e) => updateFileData(uploadFile.id, 'title' as keyof UploadFile['resourceData'], e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="Nombre del recurso"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categoría *
                              </label>
                              <select
                                value={uploadFile.resourceData?.category || ''}
                                onChange={(e) => updateFileData(uploadFile.id, 'category' as keyof UploadFile['resourceData'], e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                <option value="">Seleccionar categoría</option>
                                {categories.map(category => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                              </label>
                              <textarea
                                value={uploadFile.resourceData?.description || ''}
                                onChange={(e) => updateFileData(uploadFile.id, 'description' as keyof UploadFile['resourceData'], e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="Descripción del recurso (opcional)"
                              />
                            </div>
                          </div>
                        )}

                        {/* Success Message */}
                        {uploadFile.status === 'success' && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                            ✅ Archivo subido exitosamente
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {uploadFiles.length > 0 && (
              <>
                {uploadFiles.filter(f => f.status === 'success').length} subidos, {' '}
                {uploadFiles.filter(f => f.status === 'error').length} errores, {' '}
                {uploadFiles.filter(f => f.status === 'pending').length} pendientes
              </>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {uploadFiles.filter(f => f.status === 'success').length > 0 ? 'Cerrar' : 'Cancelar'}
            </button>
            {uploadFiles.filter(f => f.status === 'pending').length > 0 && (
              <button
                onClick={handleUploadAll}
                disabled={isUploading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiUpload className="w-4 h-4" />
                <span>{isUploading ? 'Subiendo...' : 'Subir Todos'}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ResourceUpload