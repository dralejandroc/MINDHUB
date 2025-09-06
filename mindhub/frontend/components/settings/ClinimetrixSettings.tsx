'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  ChartBarIcon, 
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { CLINIMETRIX_REGISTRY } from '@/lib/clinimetrix-registry';

interface ClinimetrixConfig {
  favoriteScales: string[];
  scaleOrder: string[];
  defaultInterpretation: boolean;
  showSubscales: boolean;
}

export function ClinimetrixSettings() {
  const scaleIds = CLINIMETRIX_REGISTRY.map(scale => scale.id);
  
  const [config, setConfig] = useState<ClinimetrixConfig>({
    favoriteScales: [],
    scaleOrder: scaleIds,
    defaultInterpretation: true,
    showSubscales: true
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/clinimetrix/django/api/settings/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          // Ensure all scales are in the order
          const allScales = CLINIMETRIX_REGISTRY.map(s => s.id);
          const missingScales = allScales.filter(s => !data.settings.scaleOrder?.includes(s));
          setConfig({
            ...config,
            ...data.settings,
            scaleOrder: [...(data.settings.scaleOrder || allScales), ...missingScales]
          });
        }
      }
    } catch (error) {
      console.error('Error loading Clinimetrix configuration:', error);
      // Keep default configuration on error
    }
  };

  const saveConfig = async () => {
    try {
      const response = await fetch('/api/clinimetrix/django/api/settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: config,
          module: 'clinimetrix'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save Clinimetrix configuration');
      }
      
      toast.success('Configuración de Clinimetrix guardada');
    } catch (error) {
      console.error('Error saving Clinimetrix configuration:', error);
      toast.error('Error al guardar la configuración');
    }
  };

  const toggleFavorite = (scaleId: string) => {
    setConfig(prev => ({
      ...prev,
      favoriteScales: prev.favoriteScales.includes(scaleId)
        ? prev.favoriteScales.filter(id => id !== scaleId)
        : [...prev.favoriteScales, scaleId]
    }));
  };

  const moveScale = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...config.scaleOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setConfig(prev => ({ ...prev, scaleOrder: newOrder }));
  };

  const resetOrder = () => {
    setConfig(prev => ({
      ...prev,
      scaleOrder: CLINIMETRIX_REGISTRY.map(s => s.id)
    }));
    toast.success('Orden restablecido');
  };

  return (
    <div className="space-y-6">
      {/* Configuración General */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Configuración General de Clinimetrix</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.defaultInterpretation}
              onChange={(e) => setConfig({ ...config, defaultInterpretation: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Mostrar interpretación automática de resultados
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showSubscales}
              onChange={(e) => setConfig({ ...config, showSubscales: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Mostrar subescalas cuando estén disponibles
            </span>
          </label>
        </div>
      </div>

      {/* Escalas Favoritas y Orden */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Escalas Favoritas y Orden de Presentación</h3>
          </div>
          <Button
            onClick={resetOrder}
            variant="outline"
            size="sm"
          >
            Restablecer Orden
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Marque sus escalas favoritas y ajuste el orden en que aparecen en el selector.
        </p>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {config.scaleOrder.map((scaleId, index) => {
            const scale = CLINIMETRIX_REGISTRY.find(s => s.id === scaleId);
            if (!scale) return null;
            
            const isFavorite = config.favoriteScales.includes(scaleId);

            return (
              <div 
                key={scaleId}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isFavorite ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleFavorite(scaleId)}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    {isFavorite ? (
                      <StarSolid className="h-5 w-5" />
                    ) : (
                      <StarIcon className="h-5 w-5" />
                    )}
                  </button>
                  
                  <div>
                    <p className="font-medium text-sm">{scale.name}</p>
                    <p className="text-xs text-gray-500">{scale.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveScale(index, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded ${
                      index === 0 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-600 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveScale(index, 'down')}
                    disabled={index === config.scaleOrder.length - 1}
                    className={`p-1 rounded ${
                      index === config.scaleOrder.length - 1
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-600 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {config.favoriteScales.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>{config.favoriteScales.length}</strong> escalas marcadas como favoritas.
              Estas aparecerán primero en el selector de escalas.
            </p>
          </div>
        )}
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button
          onClick={saveConfig}
          variant="primary"
        >
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Guardar Configuración de Clinimetrix
        </Button>
      </div>
    </div>
  );
}