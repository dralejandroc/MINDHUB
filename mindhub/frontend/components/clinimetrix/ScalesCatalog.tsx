'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BeakerIcon,
  TagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { clinimetrixApi, Scale } from '@/lib/api/clinimetrix-client';
import { Button } from '@/components/ui/Button';

interface ScalesCatalogProps {
  onSelectScale: (scale: Scale) => void;
}

// Genera un patrón abstracto único basado en el ID de la escala - FUNCIÓN GLOBAL
function generateAbstractPattern(scaleId: string, category: string): string {
  // Colores vibrantes por categoría - SIN grises, blancos o negros
  const categoryColors: { [key: string]: { primary: string; secondary: string; accent: string; shadow: string } } = {
    'ansiedad': { 
      primary: '#FF6B35', 
      secondary: '#FF8A50', 
      accent: '#FFD23F', 
      shadow: '#FF4500'
    },
    'depresion': { 
      primary: '#4A90E2', 
      secondary: '#60A5FA', 
      accent: '#7BB3F0', 
      shadow: '#3B82F6'
    },
    'personalidad': { 
      primary: '#E91E63', 
      secondary: '#F43F5E', 
      accent: '#F472B6', 
      shadow: '#EC4899'
    },
    'cognitivo': { 
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
    },
    'adicciones': { 
      primary: '#EF4444', 
      secondary: '#F87171', 
      accent: '#FCA5A5', 
      shadow: '#DC2626'
    },
    'trastornos-alimentarios': { 
      primary: '#F59E0B', 
      secondary: '#FBBF24', 
      accent: '#FCD34D', 
      shadow: '#D97706'
    },
    'tdah': { 
      primary: '#FF9800', 
      secondary: '#FFB347', 
      accent: '#FFCC80', 
      shadow: '#F57C00'
    },
    'bipolar': { 
      primary: '#06B6D4', 
      secondary: '#22D3EE', 
      accent: '#67E8F9', 
      shadow: '#0891B2'
    },
    'autismo': { 
      primary: '#9C27B0', 
      secondary: '#BA68C8', 
      accent: '#CE93D8', 
      shadow: '#7B1FA2'
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


export default function ScalesCatalog({ onSelectScale }: ScalesCatalogProps) {
  const [scales, setScales] = useState<Scale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'favorites' | 'recent'>('all');
  const [isMounted, setIsMounted] = useState(false);

  // Derived data
  const categories = Array.from(new Set(scales.map(s => s.category).filter(Boolean)));
  
  // Smart search: include abbreviations and intelligent matching
  const filteredScales = scales.filter(scale => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      scale.name.toLowerCase().includes(searchLower) ||
      scale.abbreviation?.toLowerCase().includes(searchLower) ||
      scale.description.toLowerCase().includes(searchLower) ||
      scale.category.toLowerCase().includes(searchLower) ||
      // Smart abbreviation search (e.g., "bdi" matches "BDI-21")
      scale.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(searchLower.replace(/[^a-z0-9]/g, ''));
    
    const matchesCategory = selectedCategory === 'all' || scale.category === selectedCategory;
    const matchesFavorites = !showFavoritesOnly || scale.is_favorite;
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  // Quick access sections
  const favoriteScales = scales.filter(scale => scale.is_favorite);
  const recentScales = scales.slice(0, 5); // TODO: Implement real recent scales from user activity
  const popularScales = scales.slice(0, 6); // TODO: Implement real popularity data

  useEffect(() => {
    setIsMounted(true);
    loadScales();
  }, []);

  const loadScales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const scalesData = await clinimetrixApi.getScales();
      setScales(scalesData);
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
      const scale = scales.find(s => s.id === scaleId);
      if (!scale) return;

      if (scale.is_favorite) {
        await clinimetrixApi.removeScaleFromFavorites(scaleId);
      } else {
        await clinimetrixApi.addScaleToFavorites(scaleId);
      }

      setScales(prev => prev.map(s => 
        s.id === scaleId ? { ...s, is_favorite: !s.is_favorite } : s
      ));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'ansiedad': 'text-yellow-700 bg-yellow-50 border-yellow-200',
      'depresion': 'text-blue-700 bg-blue-50 border-blue-200',
      'personalidad': 'text-purple-700 bg-purple-50 border-purple-200',
      'cognitivo': 'text-green-700 bg-green-50 border-green-200',
      'general': 'text-gray-700 bg-gray-50 border-gray-200'
    };
    return colors[category] || 'text-gray-700 bg-gray-50 border-gray-200';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setShowFavoritesOnly(false);
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

  if (scales.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay escalas disponibles
        </h3>
        <p className="text-gray-500">
          Las escalas clínicas aparecerán aquí una vez que se agreguen al sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prominent Search Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Catálogo de Escalas Clínicas</h1>
          <p className="text-teal-100 mb-4">Encuentra rápidamente las escalas que necesitas</p>
          
          {/* Enhanced Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-300" />
            <input
              type="text"
              placeholder="Buscar por nombre, abreviación o categoría (ej: BDI, depresión, ansiedad)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-teal-200 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-teal-300 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Sections - Solo favoritos si existen */}
      {!searchTerm && favoriteScales.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <HeartSolidIcon className="h-5 w-5 text-red-500 mr-2" />
              Escalas Favoritas
            </h2>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              {showFavoritesOnly ? 'Ver todas' : `Ver solo favoritas (${favoriteScales.length})`}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteScales.slice(0, 3).map(scale => (
              <ScaleCard key={scale.id} scale={scale} onToggleFavorite={toggleFavorite} onSelect={onSelectScale} />
            ))}
          </div>
        </div>
      )}

      {/* Controls siempre visibles */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtros:</span>
            
            {/* Category Quick Filters */}
            {['ansiedad', 'depresion', 'personalidad'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-teal-100 text-teal-700 border border-teal-300'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
            
            {/* Favorites Filter */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                showFavoritesOnly
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <HeartIcon className="h-3 w-3 inline mr-1" />
              Solo favoritas
            </button>
          </div>

          {/* View Mode */}
          <div className="ml-auto flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 ${viewMode === 'cards' ? 'bg-teal-100 text-teal-600' : 'bg-white text-gray-600'}`}
              title="Vista de tarjetas"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-teal-100 text-teal-600' : 'bg-white text-gray-600'}`}
              title="Vista de lista"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || showFilters || filteredScales.length !== scales.length) && (
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
                  <span>{filteredScales.filter(s => s.is_favorite).length} favoritas</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredScales.map((scale) => (
            <ScaleCard 
              key={scale.id} 
              scale={scale} 
              onToggleFavorite={toggleFavorite}
              onSelect={onSelectScale}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScales.map((scale) => (
            <ScaleListItem 
              key={scale.id} 
              scale={scale} 
              onToggleFavorite={toggleFavorite}
              onSelect={onSelectScale}
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
    </div>
  );
}

// Scale Card Component
function ScaleCard({ scale, onToggleFavorite, onSelect }: {
  scale: Scale;
  onToggleFavorite: (scaleId: string) => void;
  onSelect: (scale: Scale) => void;
}) {

  return (
    <div 
      className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-teal-400 group hover:shadow-secondary flex flex-col h-full"
      onClick={() => onSelect(scale)}
    >
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-teal-50 to-secondary-50 p-3 sm:p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl group-hover:scale-105 transition-transform overflow-hidden flex-shrink-0"
                style={{ 
                  background: generateAbstractPattern(scale.id, scale.category),
                  boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.25), 0 4px 10px -3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors text-sm sm:text-base line-clamp-2 leading-tight">
                  {scale.name}
                </h3>
                {scale.abbreviation && (
                  <p className="text-xs sm:text-sm text-teal-600 font-mono font-semibold mt-0.5">
                    {scale.abbreviation}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(scale.id);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-white rounded-lg"
          >
            {scale.is_favorite ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-3 flex-1 flex flex-col">
        {/* Category and Info button */}
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${getCategoryColor(scale.category)}`}>
            {scale.category.charAt(0).toUpperCase() + scale.category.slice(1)}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open scale documentation modal
              alert(`Ver información científica de ${scale.name}\n\nEsta funcionalidad estará disponible próximamente con bibliografía completa y evidencia científica.`);
            }}
            className="text-gray-400 hover:text-teal-600 transition-colors p-2 hover:bg-teal-50 rounded-lg"
            title="Ver información científica y bibliografía"
          >
            <InformationCircleIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Compact description */}
        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 leading-relaxed flex-1">
          {scale.description}
        </p>

        {/* Stats grid - más visual */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-1.5 bg-teal-50 rounded-lg">
            <DocumentTextIcon className="h-3 w-3 text-teal-600 mx-auto mb-0.5" />
            <div className="text-xs font-semibold text-gray-900">{scale.totalItems}</div>
            <div className="text-[10px] text-gray-600">ítems</div>
          </div>
          <div className="text-center p-1.5 bg-secondary-50 rounded-lg">
            <ClockIcon className="h-3 w-3 text-secondary-600 mx-auto mb-0.5" />
            <div className="text-xs font-semibold text-gray-900">{scale.estimatedDurationMinutes}</div>
            <div className="text-[10px] text-gray-600">min</div>
          </div>
          <div className="text-center p-1.5 bg-gray-50 rounded-lg">
            <UserGroupIcon className="h-3 w-3 text-gray-600 mx-auto mb-0.5" />
            <div className="text-[10px] font-medium text-gray-700 leading-tight">
              {scale.administrationMode === 'self_administered' ? 'Auto' : 
               scale.administrationMode === 'clinician_administered' ? 'Clínico' : 'Ambos'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 mt-auto">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(scale);
          }}
          variant="secondary"
          size="sm"
          className="w-full font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <BeakerIcon className="h-4 w-4 mr-2" />
          Aplicar Escala
        </Button>
      </div>
    </div>
  );
}

// Scale List Item Component  
function ScaleListItem({ scale, onToggleFavorite, onSelect }: {
  scale: Scale;
  onToggleFavorite: (scaleId: string) => void;
  onSelect: (scale: Scale) => void;
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
                background: generateAbstractPattern(scale.id, scale.category),
                boxShadow: '0 6px 20px -5px rgba(0, 0, 0, 0.2), 0 3px 8px -3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }}
            />
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{scale.name}</h3>
              {scale.abbreviation && (
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {scale.abbreviation}
                </span>
              )}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(scale.category)}`}>
              {scale.category}
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {scale.description}
          </p>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>{scale.totalItems} ítems</span>
            <span>{scale.estimatedDurationMinutes} min</span>
            <span>{scale.administrationMode}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(scale.id);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            {scale.is_favorite ? (
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
    'ansiedad': 'text-yellow-700 bg-yellow-50 border-yellow-200',
    'depresion': 'text-blue-700 bg-blue-50 border-blue-200',
    'personalidad': 'text-purple-700 bg-purple-50 border-purple-200',
    'cognitivo': 'text-green-700 bg-green-50 border-green-200',
    'general': 'text-gray-700 bg-gray-50 border-gray-200',
    'adicciones': 'text-red-700 bg-red-50 border-red-200',
    'trastornos-alimentarios': 'text-pink-700 bg-pink-50 border-pink-200',
    'tdah': 'text-orange-700 bg-orange-50 border-orange-200',
    'bipolar': 'text-indigo-700 bg-indigo-50 border-indigo-200',
    'autismo': 'text-cyan-700 bg-cyan-50 border-cyan-200'
  };
  return colors[category] || 'text-gray-700 bg-gray-50 border-gray-200';
}