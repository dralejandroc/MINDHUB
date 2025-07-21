'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FiSave, 
  FiX, 
  FiEye, 
  FiUpload, 
  FiType, 
  FiImage, 
  FiFile,
  FiTemplate,
  FiSettings,
  FiUsers,
  FiTag,
  FiInfo
} from 'react-icons/fi'

interface ResourceEditorProps {
  isOpen: boolean
  onClose: () => void
  resourceId?: string
  mode: 'create' | 'edit'
}

interface ResourceForm {
  title: string
  description: string
  category: string
  subcategory: string
  tags: string[]
  type: 'text' | 'pdf' | 'image' | 'template'
  content: {
    rawText: string
    hasVariables: boolean
    variables: string[]
  }
  permissions: {
    public: boolean
    allowedRoles: string[]
    restrictedClinics: string[]
  }
  personalization: {
    enabled: boolean
    brandingOptions: {
      allowLogo: boolean
      allowCustomColors: boolean
      allowFontCustomization: boolean
    }
  }
  status: 'draft' | 'active'
}

const ResourceEditor: React.FC<ResourceEditorProps> = ({ 
  isOpen, 
  onClose, 
  resourceId, 
  mode 
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'permissions' | 'preview'>('content')
  const [formData, setFormData] = useState<ResourceForm>({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    tags: [],
    type: 'text',
    content: {
      rawText: '',
      hasVariables: false,
      variables: []
    },
    permissions: {
      public: true,
      allowedRoles: ['psychiatrist', 'psychologist'],
      restrictedClinics: []
    },
    personalization: {
      enabled: true,
      brandingOptions: {
        allowLogo: true,
        allowCustomColors: true,
        allowFontCustomization: false
      }
    },
    status: 'draft'
  })
  const [newTag, setNewTag] = useState('')
  const [previewData, setPreviewData] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [categories] = useState([
    { id: 'terapia-individual', name: 'Terapia Individual' },
    { id: 'psicoeducacion', name: 'Psicoeducación' },
    { id: 'evaluacion', name: 'Evaluación' },
    { id: 'terapia-familiar', name: 'Terapia Familiar' },
    { id: 'terapia-grupal', name: 'Terapia Grupal' },
    { id: 'administrativo', name: 'Administrativo' }
  ])

  useEffect(() => {
    if (isOpen && resourceId && mode === 'edit') {
      loadResource(resourceId)
    }
  }, [isOpen, resourceId, mode])

  useEffect(() => {
    // Detectar variables en el texto
    const variableRegex = /{([^}]+)}/g
    const variables = []
    let match
    
    while ((match = variableRegex.exec(formData.content.rawText)) !== null) {
      const varName = match[1].trim()
      if (!variables.includes(varName)) {
        variables.push(varName)
      }
    }

    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        hasVariables: variables.length > 0,
        variables
      }
    }))
  }, [formData.content.rawText])

  const loadResource = async (id: string) => {
    try {
      // En producción, cargar desde API
      // const response = await fetch(`/api/resources/${id}`)
      // const resource = await response.json()
      
      // Mock data para desarrollo
      console.log('Loading resource:', id)
    } catch (error) {
      console.error('Error loading resource:', error)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const endpoint = mode === 'create' 
        ? '/api/resources' 
        : `/api/resources/${resourceId}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onClose()
        // Recargar lista de recursos
      } else {
        throw new Error('Error saving resource')
      }
    } catch (error) {
      console.error('Error saving resource:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const generatePreview = async () => {
    try {
      const response = await fetch('/api/resources/download/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceId: 'preview',
          personalizationData: {
            variables: {
              nombrePaciente: 'Juan Pérez',
              nombreClinica: 'Clínica MindHub',
              nombreProfesional: 'Dr. María García',
              fechaHoy: new Date().toLocaleDateString('es-MX')
            }
          }
        })
      })

      if (response.ok) {
        const { data } = await response.json()
        setPreviewData(data.previewContent)
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      // Generar preview local
      let preview = formData.content.rawText
      preview = preview.replace(/{nombrePaciente}/g, 'Juan Pérez')
      preview = preview.replace(/{nombreClinica}/g, 'Clínica MindHub')
      preview = preview.replace(/{nombreProfesional}/g, 'Dr. María García')
      preview = preview.replace(/{fechaHoy}/g, new Date().toLocaleDateString('es-MX'))
      setPreviewData(preview)
    }
  }

  useEffect(() => {
    if (activeTab === 'preview') {
      generatePreview()
    }
  }, [activeTab, formData.content.rawText])

  if (!isOpen) return null

  return (
    <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4\">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className=\"bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden\"
      >
        {/* Header */}
        <div className=\"flex items-center justify-between p-6 border-b border-gray-200\">
          <div>
            <h2 className=\"text-2xl font-bold text-gray-900\">
              {mode === 'create' ? 'Crear Nuevo Recurso' : 'Editar Recurso'}
            </h2>
            <p className=\"text-gray-600 mt-1\">
              {mode === 'create' 
                ? 'Crea un nuevo recurso psicoeducativo personalizable'
                : 'Modifica el recurso existente'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className=\"p-2 hover:bg-gray-100 rounded-lg transition-colors\"
          >
            <FiX className=\"w-6 h-6 text-gray-500\" />
          </button>
        </div>

        {/* Tabs */}
        <div className=\"border-b border-gray-200\">
          <nav className=\"flex space-x-8 px-6\">
            {[
              { id: 'content', label: 'Contenido', icon: FiType },
              { id: 'settings', label: 'Configuración', icon: FiSettings },
              { id: 'permissions', label: 'Permisos', icon: FiUsers },
              { id: 'preview', label: 'Vista Previa', icon: FiEye }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className=\"w-4 h-4\" />
                <span className=\"font-medium\">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className=\"flex-1 overflow-y-auto p-6\" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'content' && (
            <div className=\"space-y-6\">
              {/* Basic Info */}
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                    Título del Recurso *
                  </label>
                  <input
                    type=\"text\"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
                    placeholder=\"Ej: Técnicas de Respiración para la Ansiedad\"
                  />
                </div>

                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                    Tipo de Recurso *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                  >
                    <option value=\"text\">📄 Texto</option>
                    <option value=\"template\">📋 Plantilla</option>
                    <option value=\"pdf\">📕 PDF</option>
                    <option value=\"image\">🖼️ Imagen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
                  placeholder=\"Describe el propósito y contenido del recurso...\"
                />
              </div>

              {/* Category */}
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                  >
                    <option value=\"\">Seleccionar categoría</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                    Subcategoría
                  </label>
                  <input
                    type=\"text\"
                    value={formData.subcategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                    placeholder=\"Ej: ejercicios-respiracion\"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Etiquetas
                </label>
                <div className=\"flex flex-wrap gap-2 mb-3\">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className=\"inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm\"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className=\"text-blue-500 hover:text-blue-700\"
                      >
                        <FiX className=\"w-3 h-3\" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className=\"flex space-x-2\">
                  <input
                    type=\"text\"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className=\"flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                    placeholder=\"Agregar etiqueta...\"
                  />
                  <button
                    onClick={handleAddTag}
                    className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors\"
                  >
                    <FiTag className=\"w-4 h-4\" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Contenido del Recurso *
                </label>
                <div className=\"mb-3 p-3 bg-blue-50 rounded-lg\">
                  <div className=\"flex items-start space-x-2\">
                    <FiInfo className=\"w-5 h-5 text-blue-600 mt-0.5\" />
                    <div className=\"text-sm text-blue-700\">
                      <p className=\"font-medium mb-1\">Variables disponibles para personalización:</p>
                      <p><code>{`{nombrePaciente}`}</code>, <code>{`{nombreClinica}`}</code>, <code>{`{nombreProfesional}`}</code>, <code>{`{fechaHoy}`}</code></p>
                    </div>
                  </div>
                </div>
                <textarea
                  value={formData.content.rawText}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, rawText: e.target.value }
                  }))}
                  rows={12}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm\"
                  placeholder={`Ejemplo de contenido personalizable:

# Técnicas de Respiración

Estimado/a {nombrePaciente},

Desde {nombreClinica} te compartimos estas técnicas de respiración que te ayudarán a manejar la ansiedad...

Atentamente,
{nombreProfesional}
{fechaHoy}`}
                />
                
                {formData.content.hasVariables && (
                  <div className=\"mt-3 p-3 bg-green-50 rounded-lg\">
                    <div className=\"flex items-center space-x-2\">
                      <span className=\"text-green-600\">✨</span>
                      <span className=\"text-sm text-green-700 font-medium\">
                        Variables detectadas: {formData.content.variables.join(', ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className=\"space-y-6\">
              <div>
                <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Configuración de Personalización</h3>
                
                <div className=\"space-y-4\">
                  <label className=\"flex items-center space-x-3\">
                    <input
                      type=\"checkbox\"
                      checked={formData.personalization.enabled}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalization: {
                          ...prev.personalization,
                          enabled: e.target.checked
                        }
                      }))}
                      className=\"w-4 h-4 text-blue-600 rounded focus:ring-blue-500\"
                    />
                    <span className=\"text-sm font-medium text-gray-700\">
                      Habilitar personalización
                    </span>
                  </label>

                  {formData.personalization.enabled && (
                    <div className=\"ml-7 space-y-3\">
                      <label className=\"flex items-center space-x-3\">
                        <input
                          type=\"checkbox\"
                          checked={formData.personalization.brandingOptions.allowLogo}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalization: {
                              ...prev.personalization,
                              brandingOptions: {
                                ...prev.personalization.brandingOptions,
                                allowLogo: e.target.checked
                              }
                            }
                          }))}
                          className=\"w-4 h-4 text-blue-600 rounded focus:ring-blue-500\"
                        />
                        <span className=\"text-sm text-gray-600\">Permitir logo de clínica</span>
                      </label>

                      <label className=\"flex items-center space-x-3\">
                        <input
                          type=\"checkbox\"
                          checked={formData.personalization.brandingOptions.allowCustomColors}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalization: {
                              ...prev.personalization,
                              brandingOptions: {
                                ...prev.personalization.brandingOptions,
                                allowCustomColors: e.target.checked
                              }
                            }
                          }))}
                          className=\"w-4 h-4 text-blue-600 rounded focus:ring-blue-500\"
                        />
                        <span className=\"text-sm text-gray-600\">Permitir colores personalizados</span>
                      </label>

                      <label className=\"flex items-center space-x-3\">
                        <input
                          type=\"checkbox\"
                          checked={formData.personalization.brandingOptions.allowFontCustomization}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalization: {
                              ...prev.personalization,
                              brandingOptions: {
                                ...prev.personalization.brandingOptions,
                                allowFontCustomization: e.target.checked
                              }
                            }
                          }))}
                          className=\"w-4 h-4 text-blue-600 rounded focus:ring-blue-500\"
                        />
                        <span className=\"text-sm text-gray-600\">Permitir personalización de fuentes</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Estado del Recurso</h3>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className=\"w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                >
                  <option value=\"draft\">🟡 Borrador</option>
                  <option value=\"active\">🟢 Activo</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className=\"space-y-6\">
              <div>
                <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Control de Acceso</h3>
                
                <div className=\"space-y-4\">
                  <label className=\"flex items-center space-x-3\">
                    <input
                      type=\"checkbox\"
                      checked={formData.permissions.public}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          public: e.target.checked
                        }
                      }))}
                      className=\"w-4 h-4 text-blue-600 rounded focus:ring-blue-500\"
                    />
                    <span className=\"text-sm font-medium text-gray-700\">
                      Recurso público (visible para todos los usuarios autorizados)
                    </span>
                  </label>

                  <div>
                    <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                      Roles permitidos
                    </label>
                    <div className=\"space-y-2\">
                      {['psychiatrist', 'psychologist', 'nurse', 'admin'].map(role => (
                        <label key={role} className=\"flex items-center space-x-3\">
                          <input
                            type=\"checkbox\"
                            checked={formData.permissions.allowedRoles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: {
                                    ...prev.permissions,
                                    allowedRoles: [...prev.permissions.allowedRoles, role]
                                  }
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: {
                                    ...prev.permissions,
                                    allowedRoles: prev.permissions.allowedRoles.filter(r => r !== role)
                                  }
                                }))
                              }
                            }}
                            className=\"w-4 h-4 text-blue-600 rounded focus:ring-blue-500\"
                          />
                          <span className=\"text-sm text-gray-600 capitalize\">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className=\"space-y-6\">
              <div>
                <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Vista Previa Personalizada</h3>
                <p className=\"text-sm text-gray-600 mb-4\">
                  Vista previa con variables de ejemplo: Juan Pérez, Clínica MindHub, Dr. María García
                </p>
                
                <div className=\"bg-gray-50 border border-gray-200 rounded-lg p-6\">
                  <div className=\"prose max-w-none\">
                    {previewData ? (
                      <pre className=\"whitespace-pre-wrap font-sans text-gray-900 leading-relaxed\">
                        {previewData}
                      </pre>
                    ) : (
                      <p className=\"text-gray-500 italic\">
                        No hay contenido para mostrar en la vista previa
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className=\"flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50\">
          <button
            onClick={onClose}
            className=\"px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors\"
          >
            Cancelar
          </button>
          <div className=\"flex space-x-3\">
            <button
              onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
              disabled={isSaving}
              className=\"px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50\"
            >
              Guardar como Borrador
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.title || !formData.content.rawText}
              className=\"flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors\"
            >
              <FiSave className=\"w-4 h-4\" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Recurso'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ResourceEditor