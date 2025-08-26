'use client'
// 🚀 FORCE REBUILD: 2025-08-26 - Removed ALL mock data and connected to real Django backend APIs

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FiClock, 
  FiMail, 
  FiDownload, 
  FiPrinter, 
  FiCheck, 
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
  FiBookOpen,
  FiMessageSquare,
  FiCalendar,
  FiUser,
  FiFileText
} from 'react-icons/fi'

interface ResourceTimelineProps {
  patientId: string
  patientName: string
  isVisible?: boolean
  onResourceClick?: (resourceUsage: ResourceUsage) => void
}

interface ResourceUsage {
  id: string
  resourceId: string
  resourceTitle: string
  resourceDescription: string
  resourceType: 'text' | 'pdf' | 'image' | 'template'
  sentAt: string
  method: 'email' | 'download' | 'print'
  status: 'sent' | 'viewed' | 'downloaded' | 'completed'
  practitionerName: string
  practitionerNotes?: string
  patientFeedback?: string
  personalizedContent?: {
    patientName: string
    clinicName: string
    practitionerName: string
  }
  deliveryDetails?: {
    emailAddress?: string
    downloadUrl?: string
    printReady?: boolean
  }
  viewedAt?: string
  downloadedAt?: string
  completedAt?: string
  sessionId?: string
}

// Helper functions
const getTypeIcon = (type: string): string => {
  switch (type?.toLowerCase()) {
    case 'pdf': return '📄';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'image': return '🖼️';
    case 'document': return '📋';
    default: return '📄';
  }
};

const getStatusIcon = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed': return '✅';
    case 'in_progress': return '⏳';
    case 'pending': return '⏳';
    default: return '📄';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'Completado';
    case 'in_progress': return 'En Progreso';
    case 'pending': return 'Pendiente';
    default: return 'Desconocido';
  }
};

// Local formatDate function that returns object with date and time
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return {
    date: date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }),
    time: date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
}

const ResourcesTimeline: React.FC<ResourceTimelineProps> = ({ 
  patientId, 
  patientName, 
  isVisible = true,
  onResourceClick 
}) => {
  const [resourceUsages, setResourceUsages] = useState<ResourceUsage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUsage, setSelectedUsage] = useState<ResourceUsage | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (isVisible && patientId) {
      fetchResourceUsages()
    }
  }, [patientId, isVisible])

  const fetchResourceUsages = async () => {
    try {
      setIsLoading(true)
      
      // ✅ REAL API CALL: Fetch resource usages from Django backend
      const response = await fetch(`/api/resources/django/tracking/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token') || ''}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Transform Django backend response to match frontend ResourceUsage interface
        const transformedUsages: ResourceUsage[] = (data.results || data.data || data || []).map((item: any) => ({
          id: item.id || item.uuid,
          resourceId: item.resource_id || item.resource,
          resourceTitle: item.resource_title || item.title,
          resourceDescription: item.resource_description || item.description || '',
          resourceType: item.resource_type || item.type || 'text',
          sentAt: item.sent_at || item.created_at,
          method: item.send_method || item.method,
          status: item.status || 'sent',
          practitionerName: item.practitioner_name || item.professional_name || 'Profesional',
          practitionerNotes: item.practitioner_notes || item.notes,
          patientFeedback: item.patient_feedback || item.feedback,
          personalizedContent: item.personalized_content ? {
            patientName: item.personalized_content.patient_name || patientName,
            clinicName: item.personalized_content.clinic_name || 'Clínica MindHub',
            practitionerName: item.personalized_content.practitioner_name || 'Profesional'
          } : undefined,
          deliveryDetails: item.delivery_details || {},
          viewedAt: item.viewed_at,
          downloadedAt: item.downloaded_at,
          completedAt: item.completed_at,
          sessionId: item.session_id
        }))
        setResourceUsages(transformedUsages)
      } else {
        console.error('Failed to fetch resource usages:', response.status)
        setResourceUsages([]) // Empty array instead of mock data
      }
    } catch (error) {
      console.error('Error fetching resource usages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <FiMail className="w-4 h-4" />
      case 'download': return <FiDownload className="w-4 h-4" />
      case 'print': return <FiPrinter className="w-4 h-4" />
      default: return <FiFileText className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <FiClock className="w-4 h-4 text-blue-600" />
      case 'viewed': return <FiEye className="w-4 h-4 text-yellow-600" />
      case 'downloaded': return <FiDownload className="w-4 h-4 text-green-600" />
      case 'completed': return <FiCheckCircle className="w-4 h-4 text-purple-600" />
      default: return <FiAlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'viewed': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'downloaded': return 'bg-green-50 text-green-700 border-green-200'
      case 'completed': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return 'Enviado'
      case 'viewed': return 'Visto'
      case 'downloaded': return 'Descargado'
      case 'completed': return 'Completado'
      default: return 'Desconocido'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📄'
      case 'pdf': return '📕'
      case 'image': return '🖼️'
      case 'template': return '📋'
      default: return '📄'
    }
  }


  const handleResourceClick = (usage: ResourceUsage) => {
    setSelectedUsage(usage)
    setShowDetailsModal(true)
    
    if (onResourceClick) {
      onResourceClick(usage)
    }
  }

  const getProgressPercentage = (usage: ResourceUsage) => {
    switch (usage.status) {
      case 'sent': return 25
      case 'viewed': return 50
      case 'downloaded': return 75
      case 'completed': return 100
      default: return 0
    }
  }

  if (!isVisible) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiBookOpen className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Recursos Psicoeducativos
              </h3>
              <p className="text-sm text-gray-600">
                Historial de recursos enviados a {patientName}
              </p>
            </div>
          </div>
          
          {resourceUsages.length > 0 && (
            <div className="text-sm text-gray-500">
              {resourceUsages.length} recurso{resourceUsages.length !== 1 ? 's' : ''} enviado{resourceUsages.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : resourceUsages.length > 0 ? (
          <div className="space-y-4">
            {resourceUsages.map((usage, index) => {
              const sentDate = formatDate(usage.sentAt)
              const progress = getProgressPercentage(usage)
              
              return (
                <motion.div
                  key={usage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleResourceClick(usage)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300"
                >
                  <div className="flex items-start space-x-4">
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-200">
                        <span className="text-lg">{getTypeIcon(usage.resourceType)}</span>
                      </div>
                      {index < resourceUsages.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {usage.resourceTitle}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {usage.resourceDescription}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(usage.status)}`}>
                            {getStatusIcon(usage.status)}
                            <span>{getStatusLabel(usage.status)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            {getMethodIcon(usage.method)}
                            <span>
                              {usage.method === 'email' ? 'Email' : 
                               usage.method === 'download' ? 'Descarga' : 'Impresión'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <FiUser className="w-3 h-3" />
                            <span>{usage.practitionerName}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <FiCalendar className="w-3 h-3" />
                            <span>{sentDate.date} {sentDate.time}</span>
                          </div>
                        </div>

                        {/* Activity Timestamps */}
                        <div className="flex items-center space-x-2">
                          {usage.viewedAt && (
                            <div className="flex items-center space-x-1 text-yellow-600">
                              <FiEye className="w-3 h-3" />
                              <span className="text-xs">
                                {formatDate(usage.viewedAt).time}
                              </span>
                            </div>
                          )}
                          
                          {usage.downloadedAt && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <FiDownload className="w-3 h-3" />
                              <span className="text-xs">
                                {formatDate(usage.downloadedAt).time}
                              </span>
                            </div>
                          )}
                          
                          {usage.completedAt && (
                            <div className="flex items-center space-x-1 text-purple-600">
                              <FiCheckCircle className="w-3 h-3" />
                              <span className="text-xs">
                                {formatDate(usage.completedAt).time}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes Preview */}
                      {usage.practitionerNotes && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                          <FiMessageSquare className="w-3 h-3 inline mr-1" />
                          {usage.practitionerNotes.length > 100 
                            ? `${usage.practitionerNotes.substring(0, 100)}...`
                            : usage.practitionerNotes
                          }
                        </div>
                      )}

                      {/* Patient Feedback */}
                      {usage.patientFeedback && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                          <span className="font-medium">Feedback del paciente:</span> {usage.patientFeedback}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin recursos enviados
            </h3>
            <p className="text-gray-500">
              Aún no se han enviado recursos psicoeducativos a este paciente.
            </p>
          </div>
        )}
      </div>

      {/* Resource Details Modal */}
      {showDetailsModal && selectedUsage && (
        <ResourceDetailsModal
          usage={selectedUsage}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedUsage(null)
          }}
        />
      )}
    </div>
  )
}

// Resource Details Modal Component
interface ResourceDetailsModalProps {
  usage: ResourceUsage
  onClose: () => void
}

const ResourceDetailsModal: React.FC<ResourceDetailsModalProps> = ({ 
  usage, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Detalles del Recurso
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          <div className="space-y-6">
            {/* Resource Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Información del Recurso</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{getTypeIcon(usage.resourceType)}</span>
                  <div>
                    <p className="font-medium">{usage.resourceTitle}</p>
                    <p className="text-sm text-gray-600">{usage.resourceDescription}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Detalles de Envío</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Método</p>
                  <p className="font-medium capitalize">{usage.method}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Enviado por</p>
                  <p className="font-medium">{usage.practitionerName}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Fecha de envío</p>
                  <p className="font-medium">{formatDate(usage.sentAt).date} {formatDate(usage.sentAt).time}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Estado actual</p>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(usage.status)}
                    <span className="font-medium">{getStatusLabel(usage.status)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cronología de Actividad</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                  <FiMail className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Recurso enviado</p>
                    <p className="text-xs text-gray-600">{formatDate(usage.sentAt).date} {formatDate(usage.sentAt).time}</p>
                  </div>
                </div>

                {usage.viewedAt && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded">
                    <FiEye className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Recurso visualizado</p>
                      <p className="text-xs text-gray-600">{formatDate(usage.viewedAt).date} {formatDate(usage.viewedAt).time}</p>
                    </div>
                  </div>
                )}

                {usage.downloadedAt && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded">
                    <FiDownload className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Recurso descargado</p>
                      <p className="text-xs text-gray-600">{formatDate(usage.downloadedAt).date} {formatDate(usage.downloadedAt).time}</p>
                    </div>
                  </div>
                )}

                {usage.completedAt && (
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded">
                    <FiCheckCircle className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Recurso completado</p>
                      <p className="text-xs text-gray-600">{formatDate(usage.completedAt).date} {formatDate(usage.completedAt).time}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {(usage.practitionerNotes || usage.patientFeedback) && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Notas y Comentarios</h4>
                <div className="space-y-3">
                  {usage.practitionerNotes && (
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-1">Notas del especialista</p>
                      <p className="text-sm text-blue-700">{usage.practitionerNotes}</p>
                    </div>
                  )}
                  
                  {usage.patientFeedback && (
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm font-medium text-green-900 mb-1">Feedback del paciente</p>
                      <p className="text-sm text-green-700">{usage.patientFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function FiX({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default ResourcesTimeline