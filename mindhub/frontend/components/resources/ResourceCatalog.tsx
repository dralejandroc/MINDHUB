'use client';

import { useState } from 'react';
import { 
  BookOpenIcon, 
  DocumentIcon, 
  VideoCameraIcon, 
  SpeakerWaveIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'pdf' | 'video' | 'audio' | 'image';
  size: string;
  uploadDate: string;
  downloadCount: number;
  tags: string[];
  fileUrl: string;
  thumbnailUrl?: string;
}

interface ResourceCatalogProps {
  onUploadResource: () => void;
}

const SAMPLE_RESOURCES: Resource[] = [
  {
    id: 'res_1',
    title: 'Guía de Manejo de Ansiedad',
    description: 'Manual completo para el tratamiento de trastornos de ansiedad generalizada con técnicas cognitivo-conductuales.',
    category: 'Trastornos de Ansiedad',
    type: 'pdf',
    size: '2.4 MB',
    uploadDate: '2024-07-01',
    downloadCount: 127,
    tags: ['ansiedad', 'CBT', 'psicoterapia', 'manual'],
    fileUrl: '/resources/guia-ansiedad.pdf'
  },
  {
    id: 'res_2',
    title: 'Técnicas de Relajación Progresiva',
    description: 'Audio guía para técnicas de relajación muscular progresiva y mindfulness.',
    category: 'Técnicas Terapéuticas',
    type: 'audio',
    size: '15.7 MB',
    uploadDate: '2024-06-28',
    downloadCount: 89,
    tags: ['relajación', 'mindfulness', 'audio', 'meditación'],
    fileUrl: '/resources/relajacion-progresiva.mp3'
  },
  {
    id: 'res_3',
    title: 'Protocolo PHQ-9 Evaluación Depresión',
    description: 'Protocolo completo para la aplicación e interpretación del cuestionario PHQ-9.',
    category: 'Instrumentos de Evaluación',
    type: 'pdf',
    size: '1.8 MB',
    uploadDate: '2024-07-10',
    downloadCount: 203,
    tags: ['PHQ-9', 'depresión', 'evaluación', 'protocolo'],
    fileUrl: '/resources/protocolo-phq9.pdf'
  },
  {
    id: 'res_4',
    title: 'Psicoeducación sobre Depresión',
    description: 'Video educativo para pacientes sobre síntomas, causas y tratamiento de la depresión.',
    category: 'Psicoeducación',
    type: 'video',
    size: '45.2 MB',
    uploadDate: '2024-06-15',
    downloadCount: 156,
    tags: ['depresión', 'psicoeducación', 'video', 'pacientes'],
    fileUrl: '/resources/psicoeducacion-depresion.mp4'
  },
  {
    id: 'res_5',
    title: 'Ejercicios de Reestructuración Cognitiva',
    description: 'Hoja de trabajo con ejercicios prácticos para identificar y modificar pensamientos automáticos.',
    category: 'Hojas de Trabajo',
    type: 'pdf',
    size: '856 KB',
    uploadDate: '2024-07-05',
    downloadCount: 94,
    tags: ['CBT', 'pensamientos', 'ejercicios', 'reestructuración'],
    fileUrl: '/resources/ejercicios-reestructuracion.pdf'
  },
  {
    id: 'res_6',
    title: 'Guía Familiar: Apoyo en Crisis',
    description: 'Manual para familiares sobre cómo brindar apoyo durante crisis de salud mental.',
    category: 'Apoyo Familiar',
    type: 'pdf',
    size: '3.1 MB',
    uploadDate: '2024-06-20',
    downloadCount: 78,
    tags: ['familia', 'crisis', 'apoyo', 'manual'],
    fileUrl: '/resources/guia-familiar-crisis.pdf'
  }
];

const CATEGORIES = [
  'Todas las categorías',
  'Trastornos de Ansiedad',
  'Trastornos del Estado de Ánimo',
  'Instrumentos de Evaluación',
  'Técnicas Terapéuticas',
  'Psicoeducación',
  'Hojas de Trabajo',
  'Apoyo Familiar'
];

const FILE_TYPES = [
  'Todos los tipos',
  'PDF',
  'Video',
  'Audio',
  'Imagen'
];

export default function ResourceCatalog({ onUploadResource }: ResourceCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas las categorías');
  const [selectedType, setSelectedType] = useState('Todos los tipos');
  const [resources] = useState<Resource[]>(SAMPLE_RESOURCES);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Todas las categorías' || 
                           resource.category === selectedCategory;
    
    const matchesType = selectedType === 'Todos los tipos' || 
                       resource.type.toUpperCase() === selectedType.toUpperCase();

    return matchesSearch && matchesCategory && matchesType;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <DocumentIcon className="h-8 w-8 text-red-500" />;
      case 'video':
        return <VideoCameraIcon className="h-8 w-8 text-blue-500" />;
      case 'audio':
        return <SpeakerWaveIcon className="h-8 w-8 text-green-500" />;
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'video':
        return 'bg-blue-100 text-blue-800';
      case 'audio':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (resource: Resource) => {
    // Simulate download
    console.log('Downloading:', resource.title);
    // In a real implementation, this would handle secure download with logging
  };

  const handlePreview = (resource: Resource) => {
    // Simulate preview
    console.log('Previewing:', resource.title);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Recursos</h1>
          <p className="text-gray-600">Materiales psicoeducativos y recursos terapéuticos</p>
        </div>
        <Button onClick={onUploadResource} className="bg-indigo-600 hover:bg-indigo-700">
          <BookOpenIcon className="h-5 w-5 mr-2" />
          Subir Recurso
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar recursos, etiquetas, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {FILE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredResources.length} recursos encontrados
        </p>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">Ordenar por fecha de subida</span>
        </div>
      </div>

      {/* Resource Grid */}
      {filteredResources.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron recursos</h3>
          <p className="text-gray-600 mb-6">
            Intenta ajustar los filtros o términos de búsqueda
          </p>
          <Button onClick={() => {
            setSearchTerm('');
            setSelectedCategory('Todas las categorías');
            setSelectedType('Todos los tipos');
          }} variant="outline">
            Limpiar filtros
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getFileIcon(resource.type)}
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(resource.type)}`}>
                      {resource.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{resource.size}</span>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                {resource.title}
              </h3>

              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {resource.description}
              </p>

              <div className="mb-4">
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                  {resource.category}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {resource.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded">
                    #{tag}
                  </span>
                ))}
                {resource.tags.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    +{resource.tags.length - 3}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>Subido: {new Date(resource.uploadDate).toLocaleDateString('es-ES')}</span>
                <span>{resource.downloadCount} descargas</span>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handlePreview(resource)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Vista Previa
                </Button>
                <Button
                  onClick={() => handleDownload(resource)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  size="sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Descargar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{resources.length}</div>
          <div className="text-sm text-gray-600">Total Recursos</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {resources.filter(r => r.type === 'pdf').length}
          </div>
          <div className="text-sm text-gray-600">Documentos PDF</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {resources.filter(r => r.type === 'video').length}
          </div>
          <div className="text-sm text-gray-600">Videos</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {resources.reduce((sum, r) => sum + r.downloadCount, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Descargas</div>
        </Card>
      </div>
    </div>
  );
}