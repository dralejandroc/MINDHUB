'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiGrid, 
  FiList, 
  FiDownload, 
  FiEdit, 
  FiTrash,
  FiEye,
  FiShare2,
  FiTag,
  FiFolder,
  FiUpload
} from 'react-icons/fi'

interface Resource {
  id: string
  title: string
  description: string
  category: string
  subcategory: string
  tags: string[]
  type: 'text' | 'pdf' | 'image' | 'template'
  content: {
    rawText?: string
    filePath?: string
    hasVariables: boolean
    variables: string[]
  }
  metadata: {
    createdAt: string
    updatedAt: string
    downloadCount: number
    useCount: number
  }
  permissions: {
    public: boolean
    allowedRoles: string[]
  }
  status: 'active' | 'draft' | 'archived'
}

interface Category {
  id: string
  name: string
  description: string
  icon: string
  color: string
  resourceCount: number
}

const ResourcesLibrary: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Cargar recursos y categorías
  useEffect(() => {
    fetchResources()
    fetchCategories()
  }, [])

  // Filtrar recursos
  useEffect(() => {
    let filtered = resources

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory)
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(resource => resource.type === selectedType)
    }

    setFilteredResources(filtered)
  }, [resources, searchTerm, selectedCategory, selectedType])

  const fetchResources = async () => {
    try {
      setIsLoading(true)
      // En producción, hacer llamada real a la API
      // const response = await fetch('/api/resources')
      // const data = await response.json()
      
      // Mock data para desarrollo
      const mockResources: Resource[] = [
        {
          id: '1',
          title: 'Técnicas de Respiración para la Ansiedad',
          description: 'Guía completa de ejercicios de respiración para reducir la ansiedad',
          category: 'terapia-individual',
          subcategory: 'ejercicios-respiracion',
          tags: ['ansiedad', 'respiracion', 'adultos'],
          type: 'text',
          content: {
            rawText: 'Estimado/a {nombrePaciente}, te comparto...',
            hasVariables: true,
            variables: ['nombrePaciente', 'nombreClinica']
          },
          metadata: {
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z',
            downloadCount: 25,
            useCount: 45
          },
          permissions: {
            public: true,
            allowedRoles: ['psychiatrist', 'psychologist']
          },
          status: 'active'
        },
        {
          id: '2',
          title: 'Registro de Emociones Diario',
          description: 'Plantilla para el registro diario de emociones y pensamientos',
          category: 'evaluacion',
          subcategory: 'registros-sintomas',
          tags: ['emociones', 'autorregistro', 'seguimiento'],
          type: 'template',
          content: {
            rawText: '# Registro de Emociones\\n**Paciente:** {nombrePaciente}',
            hasVariables: true,
            variables: ['nombrePaciente', 'fechaHoy']
          },
          metadata: {
            createdAt: '2025-01-14T15:30:00Z',
            updatedAt: '2025-01-14T15:30:00Z',
            downloadCount: 18,
            useCount: 32
          },
          permissions: {
            public: true,
            allowedRoles: ['psychiatrist', 'psychologist']
          },
          status: 'active'
        }
      ]
      
      setResources(mockResources)
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      // Mock categories
      const mockCategories: Category[] = [
        {
          id: 'terapia-individual',
          name: 'Terapia Individual',
          description: 'Recursos para sesiones individuales',
          icon: 'person',
          color: '#2196F3',
          resourceCount: 12
        },
        {
          id: 'psicoeducacion',
          name: 'Psicoeducación',
          description: 'Materiales educativos',
          icon: 'school',
          color: '#4CAF50',
          resourceCount: 8
        },
        {
          id: 'evaluacion',
          name: 'Evaluación',
          description: 'Herramientas de evaluación',
          icon: 'assessment',
          color: '#FF9800',
          resourceCount: 6
        }
      ]
      
      setCategories(mockCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleDownload = async (resourceId: string) => {
    try {
      // Generar token de descarga
      const tokenResponse = await fetch('/api/resources/download/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId })
      })
      
      if (tokenResponse.ok) {
        const { data } = await tokenResponse.json()
        window.open(data.downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Error downloading resource:', error)
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

  const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className=\"bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden\"
    >
      <div className=\"p-6\">
        <div className=\"flex items-start justify-between mb-4\">
          <div className=\"flex items-center space-x-3\">
            <span className=\"text-2xl\">{getTypeIcon(resource.type)}</span>
            <div>
              <h3 className=\"font-semibold text-gray-900 text-lg\">{resource.title}</h3>
              <p className=\"text-sm text-gray-500\">{resource.category}</p>
            </div>
          </div>
          <div className=\"flex space-x-2\">
            <button
              onClick={() => handleDownload(resource.id)}
              className=\"p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors\"
            >
              <FiDownload className=\"w-4 h-4\" />
            </button>
            <button className=\"p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors\">
              <FiShare2 className=\"w-4 h-4\" />
            </button>
            <button className=\"p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors\">
              <FiEdit className=\"w-4 h-4\" />
            </button>
          </div>
        </div>

        <p className=\"text-gray-600 text-sm mb-4 line-clamp-2\">{resource.description}</p>

        <div className=\"flex flex-wrap gap-2 mb-4\">
          {resource.tags.map(tag => (
            <span
              key={tag}
              className=\"px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full\"
            >
              #{tag}
            </span>
          ))}
        </div>

        {resource.content.hasVariables && (
          <div className=\"mb-4\">
            <span className=\"text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full\">
              ✨ Personalizable
            </span>
          </div>
        )}

        <div className=\"flex items-center justify-between text-sm text-gray-500\">
          <div className=\"flex space-x-4\">
            <span>↓ {resource.metadata.downloadCount}</span>
            <span>📤 {resource.metadata.useCount}</span>
          </div>
          <span>{new Date(resource.metadata.createdAt).toLocaleDateString('es-MX')}</span>
        </div>
      </div>
    </motion.div>
  )

  const ResourceListItem: React.FC<{ resource: Resource }> = ({ resource }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className=\"bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200\"
    >
      <div className=\"p-4 flex items-center space-x-4\">
        <span className=\"text-2xl\">{getTypeIcon(resource.type)}</span>
        <div className=\"flex-1 min-w-0\">
          <h3 className=\"font-semibold text-gray-900 truncate\">{resource.title}</h3>
          <p className=\"text-sm text-gray-500 truncate\">{resource.description}</p>
          <div className=\"flex items-center space-x-4 mt-2 text-xs text-gray-400\">
            <span>{resource.category}</span>
            <span>↓ {resource.metadata.downloadCount}</span>
            <span>📤 {resource.metadata.useCount}</span>
          </div>
        </div>
        <div className=\"flex space-x-2\">
          <button
            onClick={() => handleDownload(resource.id)}
            className=\"p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors\"
          >
            <FiDownload className=\"w-4 h-4\" />
          </button>
          <button className=\"p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors\">
            <FiShare2 className=\"w-4 h-4\" />
          </button>
          <button className=\"p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors\">
            <FiEdit className=\"w-4 h-4\" />
          </button>
        </div>
      </div>
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center h-64\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
      </div>
    )
  }

  return (
    <div className=\"max-w-7xl mx-auto p-6\">
      {/* Header */}
      <div className=\"mb-8\">
        <div className=\"flex items-center justify-between mb-6\">
          <div>
            <h1 className=\"text-3xl font-bold text-gray-900\">Biblioteca de Recursos</h1>
            <p className=\"text-gray-600 mt-2\">
              Gestiona y comparte recursos psicoeducativos personalizables
            </p>
          </div>
          <div className=\"flex space-x-3\">
            <button
              onClick={() => setShowUploadModal(true)}
              className=\"flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors\"
            >
              <FiUpload className=\"w-4 h-4\" />
              <span>Subir Archivo</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className=\"flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors\"
            >
              <FiPlus className=\"w-4 h-4\" />
              <span>Crear Recurso</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4 mb-6\">
          <div className=\"bg-blue-50 p-4 rounded-lg\">
            <div className=\"flex items-center space-x-3\">
              <FiFolder className=\"w-8 h-8 text-blue-600\" />
              <div>
                <p className=\"text-sm text-blue-600\">Total Recursos</p>
                <p className=\"text-2xl font-bold text-blue-900\">{resources.length}</p>
              </div>
            </div>
          </div>
          <div className=\"bg-green-50 p-4 rounded-lg\">
            <div className=\"flex items-center space-x-3\">
              <FiDownload className=\"w-8 h-8 text-green-600\" />
              <div>
                <p className=\"text-sm text-green-600\">Descargas</p>
                <p className=\"text-2xl font-bold text-green-900\">
                  {resources.reduce((sum, r) => sum + r.metadata.downloadCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className=\"bg-purple-50 p-4 rounded-lg\">
            <div className=\"flex items-center space-x-3\">
              <FiShare2 className=\"w-8 h-8 text-purple-600\" />
              <div>
                <p className=\"text-sm text-purple-600\">Compartidos</p>
                <p className=\"text-2xl font-bold text-purple-900\">
                  {resources.reduce((sum, r) => sum + r.metadata.useCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className=\"bg-orange-50 p-4 rounded-lg\">
            <div className=\"flex items-center space-x-3\">
              <FiTag className=\"w-8 h-8 text-orange-600\" />
              <div>
                <p className=\"text-sm text-orange-600\">Categorías</p>
                <p className=\"text-2xl font-bold text-orange-900\">{categories.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className=\"flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4\">
          <div className=\"flex-1 max-w-md\">
            <div className=\"relative\">
              <FiSearch className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5\" />
              <input
                type=\"text\"
                placeholder=\"Buscar recursos...\"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className=\"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
              />
            </div>
          </div>

          <div className=\"flex items-center space-x-4\">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className=\"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
            >
              <option value=\"all\">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className=\"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
            >
              <option value=\"all\">Todos los tipos</option>
              <option value=\"text\">Texto</option>
              <option value=\"pdf\">PDF</option>
              <option value=\"image\">Imagen</option>
              <option value=\"template\">Plantilla</option>
            </select>

            <div className=\"flex items-center space-x-2 border border-gray-300 rounded-lg p-1\">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                <FiGrid className=\"w-4 h-4\" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                <FiList className=\"w-4 h-4\" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid/List */}
      {filteredResources.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? \"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\"
            : \"space-y-4\"
        }>
          {filteredResources.map(resource => 
            viewMode === 'grid' 
              ? <ResourceCard key={resource.id} resource={resource} />
              : <ResourceListItem key={resource.id} resource={resource} />
          )}
        </div>
      ) : (
        <div className=\"text-center py-12\">
          <FiFolder className=\"w-16 h-16 text-gray-300 mx-auto mb-4\" />
          <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No se encontraron recursos</h3>
          <p className=\"text-gray-500 mb-4\">
            {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primer recurso psicoeducativo'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className=\"inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors\"
          >
            <FiPlus className=\"w-4 h-4\" />
            <span>Crear Primer Recurso</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ResourcesLibrary