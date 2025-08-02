'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ResourceGallery } from '@/components/resources/ResourceGallery';
import { ResourceUploader } from '@/components/resources/ResourceUploader';
import { ResourceSearch } from '@/components/resources/ResourceSearch';
import { ResourcePreview } from '@/components/resources/ResourcePreview';
import { SendResourceModal } from '@/components/resources/SendResourceModal';
import { WatermarkEditor } from '@/components/resources/WatermarkEditor';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LibraryTypeExplainer } from '@/components/resources/LibraryTypeExplainer';
import { 
  DocumentTextIcon, 
  PlusIcon, 
  FolderIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ResourcesPage() {
  const [currentView, setCurrentView] = useState<'gallery' | 'upload' | 'watermark'>('gallery');
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [libraryType, setLibraryType] = useState<'all' | 'public' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stats, setStats] = useState({
    totalResources: 0,
    publicResources: 0,
    privateResources: 0,
    totalSize: 0
  });
  
  // Bulk operations state
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [bulkActionsEnabled, setBulkActionsEnabled] = useState(false);

  // Load initial data and state persistence
  useEffect(() => {
    // Load saved state from sessionStorage
    const savedState = sessionStorage.getItem('resources-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setLibraryType(parsed.libraryType || 'all');
        setSearchQuery(parsed.searchQuery || '');
        setSelectedCategory(parsed.selectedCategory || '');
      } catch (error) {
        console.warn('Failed to parse saved state:', error);
      }
    }
    loadData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadData();
  }, [libraryType, searchQuery, selectedCategory]);

  // Save state to sessionStorage when it changes
  useEffect(() => {
    const stateToSave = {
      libraryType,
      searchQuery,
      selectedCategory,
      timestamp: Date.now()
    };
    sessionStorage.setItem('resources-state', JSON.stringify(stateToSave));
  }, [libraryType, searchQuery, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load resources
      const resourcesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/resources?` + new URLSearchParams({
          libraryType: libraryType,
          ...(searchQuery && { q: searchQuery }),
          ...(selectedCategory && { categoryId: selectedCategory }),
          limit: '50'
        })
      );

      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData.data || []);
      }

      // Load categories
      const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/resources/categories`);
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.data || []);
      }

      // Calculate stats
      calculateStats();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los recursos');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalResources = resources.length;
    const publicResources = resources.filter(r => r.library_type === 'public').length;
    const privateResources = resources.filter(r => r.library_type === 'private').length;
    const totalSize = resources.reduce((sum, r) => sum + (r.file_size || 0), 0);

    setStats({
      totalResources,
      publicResources,
      privateResources,
      totalSize: Math.round(totalSize / (1024 * 1024)) // MB
    });
  };

  const handleResourceUpload = (newResource: any) => {
    setResources(prev => [newResource, ...prev]);
    toast.success('Recurso subido exitosamente');
    setCurrentView('gallery');
  };

  const handleResourceSelect = (resource: any) => {
    setSelectedResource(resource);
    setShowPreview(true);
  };

  const handleSendResource = (resource: any) => {
    setSelectedResource(resource);
    setShowSendModal(true);
  };

  const handleResourceSent = () => {
    toast.success('Recurso enviado al paciente');
    setShowSendModal(false);
    setSelectedResource(null);
  };

  if (currentView === 'upload') {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Resources', href: '#', current: false },
            { label: 'Subir Archivo', current: true }
          ]}
          className="mb-4"
        />
        
        <PageHeader
          title="Resources - Subir Archivo"
          description="Sube nuevos documentos a tu biblioteca de recursos"
          icon={CloudArrowUpIcon}
          iconColor="text-blue-600"
          actions={[
            <Button
              key="back"
              onClick={() => setCurrentView('gallery')}
              variant="outline"
            >
              Volver a Galería
            </Button>
          ]}
        />
        
        <ResourceUploader
          categories={categories}
          onUploadComplete={handleResourceUpload}
        />
      </div>
    );
  }

  if (currentView === 'watermark') {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Resources', href: '#', current: false },
            { label: 'Editor de Marcas de Agua', current: true }
          ]}
          className="mb-4"
        />
        
        <PageHeader
          title="Resources - Editor de Marcas de Agua"
          description="Configura plantillas de marca de agua para tus documentos"
          icon={AdjustmentsHorizontalIcon}
          iconColor="text-purple-600"
          actions={[
            <Button
              key="back"
              onClick={() => setCurrentView('gallery')}
              variant="outline"
            >
              Volver a Galería
            </Button>
          ]}
        />
        
        <WatermarkEditor />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources - Biblioteca de Documentos"
        description="Gestiona y organiza tus recursos médicos y educativos"
        icon={DocumentTextIcon}
        iconColor="text-blue-600"
        actions={[
          <Button
            key="upload"
            onClick={() => setCurrentView('upload')}
            variant="primary"
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Subir Archivo
          </Button>,
          <Button
            key="watermark"
            onClick={() => setCurrentView('watermark')}
            variant="outline"
            size="sm"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Marcas de Agua
          </Button>,
          <Button
            key="bulk"
            onClick={() => {
              setBulkActionsEnabled(!bulkActionsEnabled);
              setSelectedResources([]);
            }}
            variant={bulkActionsEnabled ? "primary" : "outline"}
            size="sm"
          >
            {bulkActionsEnabled ? 'Salir Selección' : 'Selección Múltiple'}
          </Button>
        ]}
      />

      {/* Library Type Selector */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Biblioteca</h3>
          <div className="flex space-x-2">
            <Button
              onClick={() => setLibraryType('all')}
              variant={libraryType === 'all' ? 'primary' : 'outline'}
              size="sm"
            >
              <FolderIcon className="h-4 w-4 mr-1" />
              Todas
            </Button>
            <Button
              onClick={() => setLibraryType('public')}
              variant={libraryType === 'public' ? 'primary' : 'outline'}
              size="sm"
            >
              <BookOpenIcon className="h-4 w-4 mr-1" />
              Pública
            </Button>
            <Button
              onClick={() => setLibraryType('private')}
              variant={libraryType === 'private' ? 'primary' : 'outline'}
              size="sm"
            >
              <FolderIcon className="h-4 w-4 mr-1" />
              Privada
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalResources}</div>
            <div className="text-sm text-blue-800">Total Recursos</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.publicResources}</div>
            <div className="text-sm text-green-800">Biblioteca Pública</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.privateResources}</div>
            <div className="text-sm text-purple-800">Mi Biblioteca</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.totalSize}</div>
            <div className="text-sm text-orange-800">MB Total</div>
          </div>
        </div>
      </div>

      {/* Library Type Explainer - Show first time or on request */}
      <LibraryTypeExplainer compact className="mb-6" />

      {/* Search and Filters */}
      <ResourceSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onRefresh={loadData}
      />

      {/* Resource Gallery */}
      <ResourceGallery
        resources={resources}
        loading={loading}
        onResourceSelect={handleResourceSelect}
        onSendResource={handleSendResource}
        libraryType={libraryType}
        selectedResources={selectedResources}
        onSelectionChange={setSelectedResources}
        bulkActionsEnabled={bulkActionsEnabled}
      />

      {/* Resource Preview Modal */}
      {showPreview && selectedResource && (
        <ResourcePreview
          resource={selectedResource}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedResource(null);
          }}
          onSend={() => {
            setShowPreview(false);
            setShowSendModal(true);
          }}
        />
      )}

      {/* Send Resource Modal */}
      {showSendModal && selectedResource && (
        <SendResourceModal
          resource={selectedResource}
          isOpen={showSendModal}
          onClose={() => {
            setShowSendModal(false);
            setSelectedResource(null);
          }}
          onSent={handleResourceSent}
        />
      )}
    </div>
  );
}