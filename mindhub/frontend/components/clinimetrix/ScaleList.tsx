/**
 * Scale List Component - Universal System
 * Display and manage available clinical scales using database-first architecture
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ChartBarIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useUniversalScales, useScales, UniversalScale } from '../../contexts/UniversalScalesContext';

// =============================================================================
// TYPES
// =============================================================================

interface ScaleListProps {
  onScaleSelect?: (scale: UniversalScale) => void;
  multiSelect?: boolean;
  selectedScales?: string[];
  showFilters?: boolean;
  showStats?: boolean;
  compact?: boolean;
}

interface ScaleFilters {
  category?: string;
  administrationMode?: string;
  targetPopulation?: string;
  isActive?: boolean;
  requiresTraining?: boolean;
  search?: string;
}

interface FilterPanelProps {
  filters: ScaleFilters;
  onFiltersChange: (filters: ScaleFilters) => void;
  onClose: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ScaleList({
  onScaleSelect,
  multiSelect = false,
  selectedScales = [],
  showFilters = true,
  showStats = true,
  compact = false
}: ScaleListProps) {
  const { scales, loading, error, refetch } = useScales();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ScaleFilters>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'usage'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and sort scales
  const filteredScales = scales
    .filter(scale => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          scale.name.toLowerCase().includes(query) ||
          scale.abbreviation.toLowerCase().includes(query) ||
          scale.description?.toLowerCase().includes(query) ||
          scale.category.toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (scale.category !== filters.category) return false;
      }
      
      // Administration mode filter
      if (filters.administrationMode && filters.administrationMode !== 'all') {
        if (scale.administrationMode !== filters.administrationMode) return false;
      }
      
      // Target population filter
      if (filters.targetPopulation && filters.targetPopulation !== 'all') {
        if (scale.targetPopulation !== filters.targetPopulation) return false;
      }
      
      // Active filter
      if (filters.isActive === true) {
        if (!scale.isActive) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'usage':
          // TODO: Implement usage sorting when administration count is available
          comparison = 0;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleScaleSelect = (scale: UniversalScale) => {
    onScaleSelect?.(scale);
  };

  const handleFiltersChange = (newFilters: ScaleFilters) => {
    setFilters(newFilters);
    setShowFilterPanel(false);
  };

  const isSelected = (scaleId: string) => selectedScales.includes(scaleId);

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(scales.map(s => s.category))).sort();
  const uniqueAdministrationModes = Array.from(new Set(scales.map(s => s.administrationMode))).sort();
  const uniqueTargetPopulations = Array.from(new Set(scales.map(s => s.targetPopulation))).sort();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Clinical Scales</h2>
          {showStats && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ChartBarIcon className="w-4 h-4" />
              <span>{filteredScales.length} scales available</span>
            </div>
          )}
        </div>
        
        {!compact && (
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border-gray-300 rounded-md"
            >
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
              <option value="usage">Sort by Usage</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search scales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-clinimetrix-500 focus:border-clinimetrix-500"
          />
        </div>
        
        {showFilters && (
          <Button
            variant="outline"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center space-x-2"
          >
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={refetch}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <FilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFilterPanel(false)}
          uniqueCategories={uniqueCategories}
          uniqueAdministrationModes={uniqueAdministrationModes}
          uniqueTargetPopulations={uniqueTargetPopulations}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 text-red-700">
            <InformationCircleIcon className="w-5 h-5" />
            <span>Error loading scales: {error}</span>
          </div>
        </Card>
      )}

      {/* Scales Grid */}
      {!loading && filteredScales.length > 0 && (
        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {filteredScales.map((scale) => (
            <ScaleCard
              key={scale.id}
              scale={scale}
              isSelected={isSelected(scale.id)}
              onSelect={() => handleScaleSelect(scale)}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredScales.length === 0 && (
        <Card className="p-8 text-center">
          <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scales found</h3>
          <p className="text-gray-500">
            {searchQuery || Object.keys(filters).length > 0
              ? 'Try adjusting your search or filters'
              : 'No clinical scales are available'}
          </p>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// SCALE CARD COMPONENT
// =============================================================================

interface ScaleCardProps {
  scale: UniversalScale;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
}

function ScaleCard({ scale, isSelected, onSelect, compact }: ScaleCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'depression': 'bg-blue-100 text-blue-800',
      'anxiety': 'bg-yellow-100 text-yellow-800',
      'cognitive': 'bg-green-100 text-green-800',
      'personality': 'bg-indigo-100 text-indigo-800',
      'psychosis': 'bg-purple-100 text-purple-800',
      'substance_use': 'bg-orange-100 text-orange-800',
      'autism': 'bg-pink-100 text-pink-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getAdministrationModeIcon = (mode: string) => {
    switch (mode) {
      case 'self_administered':
        return '👤';
      case 'clinician_administered':
        return '👨‍⚕️';
      case 'hybrid':
        return '👥';
      default:
        return '📋';
    }
  };

  const getAdministrationModeLabel = (mode: string) => {
    switch (mode) {
      case 'self_administered':
        return 'Self-administered';
      case 'clinician_administered':
        return 'Clinician-administered';
      case 'hybrid':
        return 'Hybrid';
      default:
        return mode;
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-clinimetrix-500 border-clinimetrix-500' : ''
      }`}
      onClick={onSelect}
    >
      <div className={`p-4 ${compact ? 'space-y-2' : 'space-y-3'}`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
                {scale.abbreviation}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(scale.category)}`}>
                {scale.category}
              </span>
            </div>
            <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'} mt-1`}>
              {scale.name}
            </p>
          </div>
          
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-clinimetrix-500 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        {/* Description */}
        {!compact && scale.description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {scale.description}
          </p>
        )}

        {/* Details */}
        <div className={`flex items-center justify-between ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span>{getAdministrationModeIcon(scale.administrationMode)}</span>
              <span>{getAdministrationModeLabel(scale.administrationMode)}</span>
            </div>
            
            {scale.estimatedDurationMinutes && (
              <div className="flex items-center space-x-1">
                <span>⏱️</span>
                <span>{scale.estimatedDurationMinutes}min</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{scale.targetPopulation}</span>
            <span>• {scale.totalItems} items</span>
            {scale.subscales && scale.subscales.length > 0 && <span>• Has subscales</span>}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            Select
          </Button>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// FILTER PANEL COMPONENT
// =============================================================================

interface FilterPanelProps {
  filters: ScaleFilters;
  onFiltersChange: (filters: ScaleFilters) => void;
  onClose: () => void;
  uniqueCategories: string[];
  uniqueAdministrationModes: string[];
  uniqueTargetPopulations: string[];
}

function FilterPanel({ 
  filters, 
  onFiltersChange, 
  onClose, 
  uniqueCategories,
  uniqueAdministrationModes,
  uniqueTargetPopulations
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<ScaleFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  return (
    <Card className="p-4 border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={localFilters.category || ''}
            onChange={(e) => setLocalFilters({
              ...localFilters,
              category: e.target.value || undefined
            })}
            className="w-full text-sm border-gray-300 rounded-md"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Administration Mode Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Administration Mode
          </label>
          <select
            value={localFilters.administrationMode || ''}
            onChange={(e) => setLocalFilters({
              ...localFilters,
              administrationMode: e.target.value || undefined
            })}
            className="w-full text-sm border-gray-300 rounded-md"
          >
            <option value="">All Modes</option>
            {uniqueAdministrationModes.map(mode => (
              <option key={mode} value={mode}>
                {mode.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Target Population Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Population
          </label>
          <select
            value={localFilters.targetPopulation || ''}
            onChange={(e) => setLocalFilters({
              ...localFilters,
              targetPopulation: e.target.value || undefined
            })}
            className="w-full text-sm border-gray-300 rounded-md"
          >
            <option value="">All Populations</option>
            {uniqueTargetPopulations.map(population => (
              <option key={population} value={population}>
                {population.charAt(0).toUpperCase() + population.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="mt-4 space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={localFilters.isActive !== false}
            onChange={(e) => setLocalFilters({
              ...localFilters,
              isActive: e.target.checked || undefined
            })}
            className="rounded border-gray-300 text-clinimetrix-600 focus:ring-clinimetrix-500"
          />
          <span className="ml-2 text-sm text-gray-700">Active scales only</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <Button variant="ghost" onClick={handleClearFilters}>
          Clear All
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ScaleList;