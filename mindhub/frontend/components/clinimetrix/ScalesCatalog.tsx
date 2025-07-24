'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  HeartIcon,
  TagIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { clinimetrixApi, Scale, FilterOptions } from '@/lib/api/clinimetrix-client';
import { Button } from '@/components/ui/Button';

interface ScalesCatalogProps {
  onSelectScale?: (scale: Scale) => void;
}

// Helper function for category colors
const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    'ansiedad': 'bg-yellow-100 text-yellow-800',
    'depresion': 'bg-blue-100 text-blue-800',
    'personalidad': 'bg-purple-100 text-purple-800',
    'cognitivo': 'bg-green-100 text-green-800',
    'general': 'bg-gray-100 text-gray-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

export function ScalesCatalog({ onSelectScale }: ScalesCatalogProps) {
  // State
  const [scales, setScales] = useState<Scale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [categories, setCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load scales when filters change
  useEffect(() => {
    loadScales();
  }, [searchTerm, selectedCategory, selectedTags, showFavoritesOnly]);

  const loadInitialData = async () => {
    try {
      const [scalesData, categoriesData, tagsData] = await Promise.all([
        clinimetrixApi.getScales(),
        clinimetrixApi.getScaleCategories(),
        clinimetrixApi.getScaleTags()
      ]);
      
      setScales(scalesData);
      setCategories(categoriesData);
      setAvailableTags(tagsData);
    } catch (err) {
      setError('Error al cargar los datos iniciales');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadScales = async () => {
    try {
      setLoading(true);
      
      const filters: FilterOptions = {
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        favorites_only: showFavoritesOnly
      };

      const scalesData = await clinimetrixApi.getScales(filters);
      setScales(scalesData);
    } catch (err) {
      setError('Error al cargar las escalas');
      console.error('Error loading scales:', err);
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

      // Update local state
      setScales(prev => prev.map(s => 
        s.id === scaleId ? { ...s, is_favorite: !s.is_favorite } : s
      ));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTags([]);
    setShowFavoritesOnly(false);
  };

  if (loading && scales.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Cargando escalas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">{error}</div>
        <Button onClick={loadInitialData} variant="outline" size="sm">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar escalas por nombre, categoría o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Favorites Toggle */}
          <Button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            variant={showFavoritesOnly ? "purple" : "outline"}
            size="sm"
          >
            <HeartIcon className="h-4 w-4 mr-1" />
            Favoritos
          </Button>

          {/* Filters Toggle */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            Filtros
          </Button>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 ${viewMode === 'cards' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600'}`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-600'}`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Filtros</h3>
            <Button onClick={clearFilters} variant="ghost" size="sm">
              Limpiar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 text-xs rounded-full border ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <TagIcon className="h-3 w-3 inline mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {scales.length} escala{scales.length !== 1 ? 's' : ''} encontrada{scales.length !== 1 ? 's' : ''}
        </span>
        {(selectedTags.length > 0 || selectedCategory !== 'all' || searchTerm || showFavoritesOnly) && (
          <Button onClick={clearFilters} variant="ghost" size="sm">
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Scales Grid/List */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scales.map(scale => (
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
          {scales.map(scale => (
            <ScaleListItem 
              key={scale.id} 
              scale={scale} 
              onToggleFavorite={toggleFavorite}
              onSelect={onSelectScale}
            />
          ))}
        </div>
      )}

      {scales.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No se encontraron escalas que coincidan con los filtros aplicados.</p>
          <Button onClick={clearFilters} variant="outline" size="sm" className="mt-2">
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}

// Scale Card Component
function ScaleCard({ scale, onToggleFavorite, onSelect }: {
  scale: Scale;
  onToggleFavorite: (scaleId: string) => void;
  onSelect?: (scale: Scale) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">{scale.name}</h3>
            {scale.abbreviation && (
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {scale.abbreviation}
              </span>
            )}
          </div>
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(scale.category)}`}>
            {scale.category}
          </div>
        </div>
        <button
          onClick={() => onToggleFavorite(scale.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          {scale.is_favorite ? (
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {scale.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <DocumentTextIcon className="h-3 w-3" />
          <span>{scale.total_items} ítems</span>
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          <span>{scale.estimated_duration_minutes} min</span>
        </div>
        <div className="flex items-center gap-1">
          <UserGroupIcon className="h-3 w-3" />
          <span>{scale.administration_mode}</span>
        </div>
      </div>

      {scale.tags && scale.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {scale.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">
              {tag}
            </span>
          ))}
          {scale.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{scale.tags.length - 3} más</span>
          )}
        </div>
      )}

      <Button
        onClick={() => onSelect?.(scale)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        Ver Escala
      </Button>
    </div>
  );
}

// Scale List Item Component  
function ScaleListItem({ scale, onToggleFavorite, onSelect }: {
  scale: Scale;
  onToggleFavorite: (scaleId: string) => void;
  onSelect?: (scale: Scale) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{scale.name}</h3>
              {scale.abbreviation && (
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {scale.abbreviation}
                </span>
              )}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(scale.category)}`}>
              {scale.category}
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {scale.description}
          </p>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>{scale.total_items} ítems</span>
            <span>{scale.estimated_duration_minutes} min</span>
            <span>{scale.administration_mode}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          <button
            onClick={() => onToggleFavorite(scale.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            {scale.is_favorite ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </button>
          
          <Button
            onClick={() => onSelect?.(scale)}
            variant="outline"
            size="sm"
          >
            Ver Escala
          </Button>
        </div>
      </div>
    </div>
  );
}