'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DocumentChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import type { ClinimetrixRegistry } from '@/lib/api/clinimetrix-pro-client';
import { Button } from '@/components/ui/Button';
import { ClinimetrixProAssessmentModal } from '@/components/ClinimetrixPro/ClinimetrixProAssessmentModal';

// Genera un patrón abstracto único basado en el ID de la escala - FUNCIÓN GLOBAL
function generateAbstractPattern(scaleId: string, category: string): string {
  // Validar que scaleId existe y no está vacío
  if (!scaleId || typeof scaleId !== 'string') {
    scaleId = 'default-pattern-id';
  }
  
  // Validar que category existe y no está vacío
  if (!category || typeof category !== 'string') {
    category = 'general';
  }
  
  // Colores vibrantes por categoría - SIN grises, blancos o negros
  const categoryColors: { [key: string]: { primary: string; secondary: string; accent: string; shadow: string } } = {
    'Ansiedad': { 
      primary: '#FF6B35', 
      secondary: '#FF8A50', 
      accent: '#FFD23F', 
      shadow: '#FF4500'
    },
    'Depresión': { 
      primary: '#4A90E2', 
      secondary: '#60A5FA', 
      accent: '#7BB3F0', 
      shadow: '#3B82F6'
    },
    'Esquizofrenia y Trastornos Psicóticos': { 
      primary: '#E91E63', 
      secondary: '#F43F5E', 
      accent: '#F472B6', 
      shadow: '#EC4899'
    },
    'Trastornos del Sueño': { 
      primary: '#10B981', 
      secondary: '#34D399', 
      accent: '#6EE7B7', 
      shadow: '#059669'
    },
    'general': { 
      primary: '#8B5CF6', 
      secondary: '#A78BFA', 
      accent: '#C4B5FD', 
      shadow: '#7C3AED'
    }
  };

  const colors = categoryColors[category] || categoryColors['general'];
  
  // Generar un hash simple del ID para crear variaciones únicas
  let hash = 0;
  for (let i = 0; i < scaleId.length; i++) {
    hash = ((hash << 5) - hash) + scaleId.charCodeAt(i);
    hash = hash & hash;
  }
  
  const variation = Math.abs(hash) % 8;
  
  // Patrones abstractos más vibrantes con sombras
  const patterns = [
    // Patrón 1: Círculos concéntricos con sombras
    `radial-gradient(circle at 25% 25%, ${colors.primary} 0%, transparent 45%),
     radial-gradient(circle at 75% 75%, ${colors.secondary} 0%, transparent 45%),
     radial-gradient(circle at 50% 50%, ${colors.accent}88 0%, transparent 65%),
     radial-gradient(circle at 20% 80%, ${colors.shadow}44 0%, transparent 40%),
     linear-gradient(135deg, ${colors.primary}33 0%, ${colors.secondary}33 100%)`,
    
    // Patrón 2: Ondas diagonales con profundidad
    `linear-gradient(45deg, ${colors.primary}AA 25%, transparent 25%),
     linear-gradient(-45deg, ${colors.secondary}AA 25%, transparent 25%),
     linear-gradient(45deg, transparent 75%, ${colors.accent}CC 75%),
     linear-gradient(-45deg, transparent 75%, ${colors.shadow}66 75%),
     radial-gradient(ellipse at center, ${colors.accent}22, ${colors.primary}22)`,
    
    // Patrón 3: Formas orgánicas superpuestas
    `radial-gradient(ellipse 80% 50% at top left, ${colors.primary} 0%, transparent 55%),
     radial-gradient(ellipse 60% 80% at bottom right, ${colors.secondary} 0%, transparent 55%),
     radial-gradient(ellipse 90% 40% at center, ${colors.accent}77 0%, transparent 60%),
     radial-gradient(circle at 80% 20%, ${colors.shadow}55 0%, transparent 35%)`,
    
    // Patrón 4: Geometría angular con sombras
    `linear-gradient(to top right, ${colors.primary} 0%, ${colors.primary} 45%, transparent 45%),
     linear-gradient(to bottom right, ${colors.secondary} 0%, ${colors.secondary} 45%, transparent 45%),
     linear-gradient(to top left, ${colors.accent}99 0%, ${colors.accent}99 35%, transparent 35%),
     radial-gradient(circle at 30% 70%, ${colors.shadow}66 0%, transparent 50%)`,
    
    // Patrón 5: Constelación de puntos
    `radial-gradient(circle at 15% 15%, ${colors.primary} 8%, transparent 8%),
     radial-gradient(circle at 85% 85%, ${colors.secondary} 12%, transparent 12%),
     radial-gradient(circle at 85% 15%, ${colors.accent} 10%, transparent 10%),
     radial-gradient(circle at 15% 85%, ${colors.primary} 6%, transparent 6%),
     radial-gradient(circle at 50% 30%, ${colors.shadow}88 15%, transparent 15%),
     linear-gradient(135deg, ${colors.accent}11 0%, ${colors.secondary}22 100%)`,
    
    // Patrón 6: Fluidos en movimiento
    `radial-gradient(ellipse 70% 100% at 10% 0%, ${colors.primary}DD 0%, transparent 50%),
     radial-gradient(ellipse 80% 80% at 90% 100%, ${colors.secondary}DD 0%, transparent 50%),
     radial-gradient(ellipse 60% 120% at 70% 10%, ${colors.accent}99 0%, transparent 60%),
     radial-gradient(circle at 30% 60%, ${colors.shadow}77 0%, transparent 40%)`,
    
    // Patrón 7: Mosaico orgánico
    `radial-gradient(circle at 20% 30%, ${colors.primary}EE 0%, transparent 35%),
     radial-gradient(circle at 70% 20%, ${colors.secondary}EE 0%, transparent 35%),
     radial-gradient(circle at 80% 70%, ${colors.accent}DD 0%, transparent 40%),
     radial-gradient(circle at 30% 80%, ${colors.primary}BB 0%, transparent 30%),
     radial-gradient(circle at 60% 60%, ${colors.shadow}99 0%, transparent 45%)`,
    
    // Patrón 8: Texturas superpuestas
    `linear-gradient(30deg, ${colors.primary}BB 0%, transparent 70%),
     linear-gradient(150deg, ${colors.secondary}BB 0%, transparent 70%),
     linear-gradient(270deg, ${colors.accent}99 0%, transparent 70%),
     radial-gradient(ellipse at 40% 40%, ${colors.shadow}77 0%, transparent 50%),
     radial-gradient(ellipse at 80% 10%, ${colors.primary}55 0%, transparent 60%)`
  ];
  
  return patterns[variation];
}

export default function ClinimetrixPage() {
  const router = useRouter();
  const [scales, setScales] = useState<ClinimetrixRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedScale, setSelectedScale] = useState<ClinimetrixRegistry | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);

  // Derived data with defensive checks
  const safeScales = Array.isArray(scales) ? scales : [];
  const categories = Array.from(new Set(safeScales.map(s => s?.category).filter(Boolean)));
  
  // Smart search: include abbreviations and intelligent matching
  const filteredScales = safeScales.filter(scale => {
    if (!scale) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (scale?.name && scale.name.toLowerCase().includes(searchLower)) ||
      (scale?.abbreviation && scale.abbreviation.toLowerCase().includes(searchLower)) ||
      (scale?.description && scale.description.toLowerCase().includes(searchLower)) ||
      (scale?.category && scale.category.toLowerCase().includes(searchLower)) ||
      // Smart abbreviation search (e.g., "bdi" matches "BDI-21")
      (scale?.name && scale.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(searchLower.replace(/[^a-z0-9]/g, '')));
    
    const matchesCategory = selectedCategory === 'all' || scale?.category === selectedCategory;
    const matchesFavorites = !showFavoritesOnly || scale?.isFeatured; // Using isFeatured as favorites for now
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  // Quick access sections with defensive checks
  const favoriteScales = safeScales.filter(scale => scale?.isFeatured);
  const recentScales = safeScales.slice(0, 5);
  const popularScales = safeScales.slice(0, 6);

  useEffect(() => {
    setIsMounted(true);
    loadScales();
  }, []);

  const loadScales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const scalesData = await clinimetrixProClient.getTemplateCatalog();
      
      // Cargar favoritos desde localStorage
      const favorites = JSON.parse(localStorage.getItem('clinimetrix-favorites') || '[]');
      const scalesWithFavorites = scalesData.map(scale => ({
        ...scale,
        isFeatured: favorites.includes(scale?.templateId)
      }));
      
      setScales(scalesWithFavorites);
    } catch (err) {
      console.error('Error loading scales:', err);
      setError('Error al cargar las escalas');
      setScales([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (scaleId: string) => {
    try {
      // Encontrar la escala y cambiar su estado de favorito
      const safeScales = Array.isArray(scales) ? scales : [];
      const updatedScales = safeScales.map(scale => 
        scale?.templateId === scaleId 
          ? { ...scale, isFeatured: !scale?.isFeatured }
          : scale
      );
      setScales(updatedScales);
      
      // TODO: Guardar en localStorage o backend
      const favorites = JSON.parse(localStorage.getItem('clinimetrix-favorites') || '[]');
      const scale = safeScales.find(s => s?.templateId === scaleId);
      
      if (scale?.isFeatured) {
        // Remover de favoritos
        const newFavorites = favorites.filter((id: string) => id !== scaleId);
        localStorage.setItem('clinimetrix-favorites', JSON.stringify(newFavorites));
      } else {
        // Agregar a favoritos
        favorites.push(scaleId);
        localStorage.setItem('clinimetrix-favorites', JSON.stringify(favorites));
      }
      
      console.log('Toggle favorite for:', scaleId, scale?.isFeatured ? 'removed' : 'added');
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Ansiedad': 'text-yellow-700 bg-yellow-50 border-yellow-200',
      'Depresión': 'text-blue-700 bg-blue-50 border-blue-200',
      'Esquizofrenia y Trastornos Psicóticos': 'text-purple-700 bg-purple-50 border-purple-200',
      'Trastornos del Sueño': 'text-green-700 bg-green-50 border-green-200',
      'general': 'text-gray-700 bg-gray-50 border-gray-200'
    };
    return colors[category] || 'text-gray-700 bg-gray-50 border-gray-200';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setShowFavoritesOnly(false);
  };

  const handleSelectScale = (scale: ClinimetrixRegistry) => {
    setSelectedScale(scale);
    setShowAssessment(true);
  };

  const handleCloseAssessment = () => {
    setShowAssessment(false);
    setSelectedScale(null);
  };

  const handleAssessmentComplete = (results: any) => {
    console.log('Assessment completed:', results);
    // Handle assessment completion - could show results modal, save to database, etc.
    alert(`¡Evaluación ${selectedScale?.name} completada exitosamente!\n\nLos resultados han sido guardados.`);
    handleCloseAssessment();
  };

  // Prevenir hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        <div className="text-center">
          <p className="text-gray-900 font-medium">Iniciando catálogo...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        <div className="text-center">
          <p className="text-gray-900 font-medium">Cargando escalas clínicas...</p>
          <p className="text-gray-500 text-sm">Preparando el catálogo de evaluaciones</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={loadScales}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (safeScales.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <DocumentChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay escalas disponibles
        </h3>
        <p className="text-gray-500">
          Las escalas clínicas aparecerán aquí una vez que se agreguen al sistema.
        </p>
        <Button onClick={loadScales} className="mt-4">
          Recargar escalas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact Header - MindHub Style */}
      <div className="bg-white rounded-lg shadow-sm border border-purple-100 p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DocumentChartBarIcon className="h-5 w-5 text-purple-600" />
            <div>
              <h1 className="text-lg font-bold text-dark-green">Clinimetrix - Escalas Clínicas</h1>
              <p className="text-xs text-gray-600">Evaluaciones psicológicas y escalas científicamente validadas</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
              <Cog6ToothIcon className="h-3 w-3 mr-1" />
              Config
            </Button>
            <Button variant="primary" size="sm" className="h-8 px-2 text-xs bg-purple-600 hover:bg-purple-700">
              <BeakerIcon className="h-3 w-3 mr-1" />
              Nueva Evaluación
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar - Compact */}
      <div className="bg-white p-3 rounded-xl shadow-lg border border-purple-100">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar escalas por nombre, abreviación o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>


      {/* Controls - MindHub Style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* View Mode Buttons */}
        <div className="flex items-center space-x-0.5 bg-purple-50 p-0.5 rounded-lg border border-purple-200">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              viewMode === 'cards' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-purple-600 hover:bg-purple-100'
            }`}
          >
            <Squares2X2Icon className="h-3 w-3 inline mr-1" />
            Tarjetas
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              viewMode === 'list' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-purple-600 hover:bg-purple-100'
            }`}
          >
            <ListBulletIcon className="h-3 w-3 inline mr-1" />
            Lista
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-600">Categorías:</span>
          {categories.slice(0, 4).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || showFavoritesOnly || filteredScales.length !== safeScales.length) && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>{filteredScales.length} escalas {searchTerm ? 'encontradas' : 'mostradas'}</span>
              </div>
              {favoriteScales.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{filteredScales.filter(s => s?.isFeatured).length} destacadas</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{categories.length} categorías</span>
              </div>
            </div>
            
            {(searchTerm || selectedCategory !== 'all' || showFavoritesOnly) && (
              <button
                onClick={clearFilters}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredScales.map((scale) => scale && (
            <ScaleCard 
              key={scale?.templateId || `scale-${Math.random()}`} 
              scale={scale} 
              onToggleFavorite={toggleFavorite}
              onSelect={handleSelectScale}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScales.map((scale) => scale && (
            <ScaleListItem 
              key={scale?.templateId || `scale-${Math.random()}`} 
              scale={scale} 
              onToggleFavorite={toggleFavorite}
              onSelect={handleSelectScale}
            />
          ))}
        </div>
      )}

      {filteredScales.length === 0 && (searchTerm || selectedCategory !== 'all' || showFavoritesOnly) && (
        <div className="text-center py-16 space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron escalas
            </h3>
            <p className="text-gray-500 mb-4">
              No hay escalas que coincidan con los filtros aplicados.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                Intenta con otros términos de búsqueda o categorías
              </p>
              <Button onClick={clearFilters} variant="outline" size="sm">
                Limpiar todos los filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Modal */}
      {showAssessment && selectedScale && (
        <ClinimetrixProAssessmentModal
          templateId={selectedScale.templateId}
          scaleName={selectedScale.name}
          scaleAbbreviation={selectedScale.abbreviation}
          onComplete={handleAssessmentComplete}
          onExit={handleCloseAssessment}
        />
      )}
    </div>
  );
}

// Scale Card Component
function ScaleCard({ scale, onToggleFavorite, onSelect }: {
  scale: ClinimetrixRegistry;
  onToggleFavorite: (scaleId: string) => void;
  onSelect: (scale: ClinimetrixRegistry) => void;
}) {

  return (
    <div 
      className="bg-white rounded-lg border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-purple-400 group hover:shadow-purple flex flex-col h-full"
      onClick={() => onSelect(scale)}
    >
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-2.5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg group-hover:scale-105 transition-transform overflow-hidden flex-shrink-0"
                style={{ 
                  background: generateAbstractPattern(scale?.templateId || 'default', scale?.category || 'general'),
                  boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15), 0 2px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors text-xs line-clamp-2 leading-tight">
                  {scale?.name || 'Escala sin nombre'}
                </h3>
                {scale?.abbreviation && (
                  <p className="text-[10px] text-purple-600 font-mono font-semibold mt-0.5">
                    {scale.abbreviation}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(scale?.templateId || '');
            }}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-white rounded"
          >
            {scale?.isFeatured ? (
              <HeartSolidIcon className="h-3 w-3 text-red-500" />
            ) : (
              <HeartIcon className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-2 flex-1 flex flex-col">
        {/* Category and Info button */}
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold border shadow-sm ${getCategoryColor(scale?.category || 'general')}`}>
            {scale?.category || 'General'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open scale documentation modal
              alert(`Ver información científica de ${scale?.name || 'esta escala'}\n\nEsta funcionalidad estará disponible próximamente con bibliografía completa y evidencia científica.`);
            }}
            className="text-gray-400 hover:text-purple-600 transition-colors p-1 hover:bg-purple-50 rounded"
            title="Ver información científica y bibliografía"
          >
            <InformationCircleIcon className="h-3 w-3" />
          </button>
        </div>

        {/* Compact description */}
        <p className="text-gray-600 text-[10px] line-clamp-2 leading-relaxed flex-1">
          {scale?.description || 'Descripción no disponible'}
        </p>

        {/* Stats grid - más visual */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="text-center p-1 bg-purple-50 rounded">
            <DocumentTextIcon className="h-2.5 w-2.5 text-purple-600 mx-auto mb-0.5" />
            <div className="text-[9px] font-semibold text-gray-900">N/A</div>
            <div className="text-[8px] text-gray-600">ítems</div>
          </div>
          <div className="text-center p-1 bg-blue-50 rounded">
            <ClockIcon className="h-2.5 w-2.5 text-blue-600 mx-auto mb-0.5" />
            <div className="text-[9px] font-semibold text-gray-900">{scale.administrationTime}</div>
            <div className="text-[8px] text-gray-600">min</div>
          </div>
          <div className="text-center p-1 bg-gray-50 rounded">
            <UserGroupIcon className="h-2.5 w-2.5 text-gray-600 mx-auto mb-0.5" />
            <div className="text-[8px] font-medium text-gray-700 leading-tight">
              Profesional
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-2.5 pb-2.5 mt-auto">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(scale);
          }}
          variant="secondary"
          size="sm"
          className="w-full font-semibold shadow-sm hover:shadow-md transition-all text-[10px] py-1.5 bg-purple-600 text-white hover:bg-purple-700"
        >
          <BeakerIcon className="h-3 w-3 mr-1" />
          Aplicar Escala
        </Button>
      </div>
    </div>
  );
}

// Scale List Item Component  
function ScaleListItem({ scale, onToggleFavorite, onSelect }: {
  scale: ClinimetrixRegistry;
  onToggleFavorite: (scaleId: string) => void;
  onSelect: (scale: ClinimetrixRegistry) => void;
}) {
  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:shadow-secondary transition-all cursor-pointer hover:border-teal-400"
      onClick={() => onSelect(scale)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-2">
            {/* Imagen abstracta para vista de lista */}
            <div 
              className="w-10 h-10 rounded-lg flex-shrink-0"
              style={{ 
                background: generateAbstractPattern(scale?.templateId || 'default', scale?.category || 'general'),
                boxShadow: '0 6px 20px -5px rgba(0, 0, 0, 0.2), 0 3px 8px -3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }}
            />
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{scale?.name || 'Escala sin nombre'}</h3>
              {scale?.abbreviation && (
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {scale.abbreviation}
                </span>
              )}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(scale?.category || 'general')}`}>
              {scale?.category || 'General'}
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {scale?.description || 'Descripción no disponible'}
          </p>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>N/A ítems</span>
            <span>{scale.administrationTime}</span>
            <span>Profesional</span>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(scale?.templateId || '');
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            {scale?.isFeatured ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </button>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(scale);
            }}
            variant="outline"
            size="sm"
          >
            Aplicar Escala
          </Button>
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(category: string) {
  const colors: { [key: string]: string } = {
    'Ansiedad': 'text-yellow-700 bg-yellow-50 border-yellow-200',
    'Depresión': 'text-blue-700 bg-blue-50 border-blue-200',
    'Esquizofrenia y Trastornos Psicóticos': 'text-purple-700 bg-purple-50 border-purple-200',
    'Trastornos del Sueño': 'text-green-700 bg-green-50 border-green-200',
    'general': 'text-gray-700 bg-gray-50 border-gray-200'
  };
  return colors[category] || 'text-gray-700 bg-gray-50 border-gray-200';
}