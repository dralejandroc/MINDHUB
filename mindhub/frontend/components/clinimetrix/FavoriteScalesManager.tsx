'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  StarIcon, 
  Bars3Icon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ClinimetrixRegistry } from '@/lib/clinimetrix-registry';
import toast from 'react-hot-toast';

interface FavoriteScale extends ClinimetrixRegistry {
  isFavorite: boolean;
  displayOrder: number;
  isVisible: boolean;
  usageCount?: number;
  lastUsed?: Date;
}

interface FavoriteScalesManagerProps {
  onSave: (favoriteScales: FavoriteScale[]) => void;
  initialScales?: FavoriteScale[];
}

export function FavoriteScalesManager({ onSave, initialScales = [] }: FavoriteScalesManagerProps) {
  const [scales, setScales] = useState<FavoriteScale[]>([]);
  const [draggedScale, setDraggedScale] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load all available scales from registry
  useEffect(() => {
    const loadScales = async () => {
      try {
        setLoading(true);
        
        // Import scales from the comprehensive registry
        const { CLINIMETRIX_REGISTRY } = await import('@/lib/clinimetrix-registry');
        const availableScales: ClinimetrixRegistry[] = CLINIMETRIX_REGISTRY;

        // Merge with existing favorites if provided
        const scalesWithFavorites = availableScales.map((scale, index) => {
          const existing = initialScales.find(f => f.id === scale.id);
          return {
            ...scale,
            isFavorite: existing?.isFavorite || false,
            displayOrder: existing?.displayOrder || index,
            isVisible: existing?.isVisible !== false,
            usageCount: existing?.usageCount || 0,
            lastUsed: existing?.lastUsed
          } as FavoriteScale;
        });

        // Sort by display order
        scalesWithFavorites.sort((a, b) => a.displayOrder - b.displayOrder);
        setScales(scalesWithFavorites);

      } catch (error) {
        console.error('Error loading scales:', error);
        toast.error('Error al cargar las escalas');
      } finally {
        setLoading(false);
      }
    };

    loadScales();
  }, [initialScales]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newScales = Array.from(scales);
    const [reorderedScale] = newScales.splice(result.source.index, 1);
    newScales.splice(result.destination.index, 0, reorderedScale);

    // Update display order
    const updatedScales = newScales.map((scale, index) => ({
      ...scale,
      displayOrder: index
    }));

    setScales(updatedScales);
    setDraggedScale(null);
  };

  const toggleFavorite = (scaleId: string) => {
    setScales(prevScales => 
      prevScales.map(scale => 
        scale.id === scaleId 
          ? { ...scale, isFavorite: !scale.isFavorite }
          : scale
      )
    );
  };

  const toggleVisibility = (scaleId: string) => {
    setScales(prevScales => 
      prevScales.map(scale => 
        scale.id === scaleId 
          ? { ...scale, isVisible: !scale.isVisible }
          : scale
      )
    );
  };

  const moveScale = (scaleId: string, direction: 'up' | 'down') => {
    const currentIndex = scales.findIndex(scale => scale.id === scaleId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(scales.length - 1, currentIndex + 1);

    if (newIndex === currentIndex) return;

    const newScales = [...scales];
    [newScales[currentIndex], newScales[newIndex]] = [newScales[newIndex], newScales[currentIndex]];

    // Update display order
    const updatedScales = newScales.map((scale, index) => ({
      ...scale,
      displayOrder: index
    }));

    setScales(updatedScales);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(scales);
      toast.success('Configuración de escalas guardada exitosamente');
    } catch (error) {
      console.error('Error saving scale preferences:', error);
      toast.error('Error al guardar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  const favoriteScales = scales.filter(scale => scale.isFavorite);
  const regularScales = scales.filter(scale => !scale.isFavorite);

  if (loading && scales.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando escalas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Favorite Scales Section */}
      {favoriteScales.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <HeartIcon className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Escalas Favoritas</h3>
            <span className="text-sm text-gray-500">({favoriteScales.length})</span>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="favorites">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {favoriteScales.map((scale, index) => (
                    <Draggable key={scale.id} draggableId={scale.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg transition-all ${
                            snapshot.isDragging ? 'shadow-lg ring-2 ring-red-300' : 'hover:bg-red-100'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <Bars3Icon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{scale.name}</h4>
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                  {scale.category}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{scale.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>{scale.questions} preguntas</span>
                                <span>~{scale.timeEstimate} min</span>
                                {scale.usageCount && <span>Usada {scale.usageCount} veces</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => moveScale(scale.id, 'up')}
                              variant="ghost"
                              size="sm"
                              disabled={index === 0}
                            >
                              <ArrowUpIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => moveScale(scale.id, 'down')}
                              variant="ghost"
                              size="sm"
                              disabled={index === favoriteScales.length - 1}
                            >
                              <ArrowDownIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => toggleVisibility(scale.id)}
                              variant="ghost"
                              size="sm"
                              title={scale.isVisible ? 'Ocultar' : 'Mostrar'}
                            >
                              {scale.isVisible ? (
                                <EyeIcon className="h-4 w-4 text-gray-600" />
                              ) : (
                                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            
                            <Button
                              onClick={() => toggleFavorite(scale.id)}
                              variant="ghost"
                              size="sm"
                            >
                              <StarSolidIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Card>
      )}

      {/* All Scales Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <StarIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Todas las Escalas</h3>
            <span className="text-sm text-gray-500">({scales.length})</span>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={loading}
            variant="primary"
            size="sm"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scales.map((scale) => (
            <div
              key={scale.id}
              className={`p-4 border rounded-lg transition-all ${
                scale.isFavorite 
                  ? 'bg-red-50 border-red-200' 
                  : scale.isVisible 
                    ? 'bg-white border-gray-200 hover:bg-gray-50'
                    : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{scale.name}</h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {scale.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{scale.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                    <span>{scale.questions} preguntas</span>
                    <span>~{scale.timeEstimate} min</span>
                    <span>Orden: {scale.displayOrder + 1}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    onClick={() => toggleVisibility(scale.id)}
                    variant="ghost"
                    size="sm"
                    title={scale.isVisible ? 'Ocultar' : 'Mostrar'}
                  >
                    {scale.isVisible ? (
                      <EyeIcon className="h-4 w-4 text-gray-600" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => toggleFavorite(scale.id)}
                    variant="ghost"
                    size="sm"
                    title={scale.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  >
                    {scale.isFavorite ? (
                      <StarSolidIcon className="h-4 w-4 text-red-500" />
                    ) : (
                      <StarIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Statistics */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{scales.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{favoriteScales.length}</div>
            <div className="text-sm text-gray-600">Favoritas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{scales.filter(s => s.isVisible).length}</div>
            <div className="text-sm text-gray-600">Visibles</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{scales.filter(s => s.usageCount && s.usageCount > 0).length}</div>
            <div className="text-sm text-gray-600">Usadas</div>
          </div>
        </div>
      </Card>
    </div>
  );
}