/**
 * SELECTOR UNIVERSAL DE ESCALAS
 * Componente principal que combina filtros, búsqueda y grid de escalas
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UniversalScaleGrid } from './UniversalScaleGrid';

interface UniversalScaleSelectorProps {
  onScaleSelect: (scaleId: string) => void;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showCategoryFilter?: boolean;
  showAdministrationModeFilter?: boolean;
  defaultCategory?: string;
  maxHeight?: string;
}

export const UniversalScaleSelector: React.FC<UniversalScaleSelectorProps> = ({
  onScaleSelect,
  title = 'Seleccionar Escala',
  subtitle = 'Elige una escala para comenzar la evaluación',
  showSearch = true,
  showCategoryFilter = true,
  showAdministrationModeFilter = true,
  defaultCategory = 'all',
  maxHeight = '80vh'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedAdministrationMode, setSelectedAdministrationMode] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Cargar categorías disponibles
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch('/api/scales/categories');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCategories(data.data || []);
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Formatear nombre de categoría
  const formatCategoryName = (category: string) => {
    const nameMap: { [key: string]: string } = {
      'all': 'Todas las categorías',
      'depression': 'Depresión',
      'anxiety': 'Ansiedad',
      'autism_screening': 'Screening Autismo',
      'family_assessment': 'Evaluación Familiar',
      'bipolar': 'Trastorno Bipolar',
      'adhd': 'TDAH',
      'ptsd': 'TEPT',
      'substance_use': 'Uso de Sustancias',
      'eating_disorders': 'Trastornos Alimentarios',
      'personality': 'Personalidad',
      'cognitive': 'Cognitivo'
    };
    return nameMap[category] || category;
  };

  // Formatear modo de administración
  const formatAdministrationMode = (mode: string) => {
    const modeMap: { [key: string]: string } = {
      'all': 'Todos los modos',
      'self_administered': 'Autoaplicada',
      'clinician_administered': 'Aplicada por clínico',
      'both': 'Ambos modos'
    };
    return modeMap[mode] || mode;
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedAdministrationMode('all');
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFF8EE, #29A98C)',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Encabezado */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#112F33',
            marginBottom: '0.5rem'
          }}>
            {title}
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#64748b',
            marginBottom: '0'
          }}>
            {subtitle}
          </p>
        </div>

        {/* Panel de filtros */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: showSearch && showCategoryFilter && showAdministrationModeFilter ? 
              'repeat(auto-fit, minmax(250px, 1fr))' : 
              'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            {/* Búsqueda */}
            {showSearch && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#112F33',
                  marginBottom: '0.5rem'
                }}>
                  🔍 Buscar escala
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, abreviación o descripción..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#29A98C'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            )}

            {/* Filtro por categoría */}
            {showCategoryFilter && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#112F33',
                  marginBottom: '0.5rem'
                }}>
                  📂 Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'white',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#29A98C'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {formatCategoryName(category)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por modo de administración */}
            {showAdministrationModeFilter && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#112F33',
                  marginBottom: '0.5rem'
                }}>
                  👥 Modo de administración
                </label>
                <select
                  value={selectedAdministrationMode}
                  onChange={(e) => setSelectedAdministrationMode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'white',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#29A98C'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="all">Todos los modos</option>
                  <option value="self_administered">Autoaplicada</option>
                  <option value="clinician_administered">Aplicada por clínico</option>
                  <option value="both">Ambos modos</option>
                </select>
              </div>
            )}

            {/* Botón limpiar filtros */}
            <div>
              <button
                onClick={clearFilters}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#f8f9fa',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#29A98C';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = '#29A98C';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                🗑️ Limpiar filtros
              </button>
            </div>
          </div>

          {/* Indicadores de filtros activos */}
          {(searchTerm || selectedCategory !== 'all' || selectedAdministrationMode !== 'all') && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e2e8f0'
            }}>
              <span style={{
                fontSize: '0.875rem',
                color: '#64748b',
                fontWeight: '600'
              }}>
                Filtros activos:
              </span>
              
              {searchTerm && (
                <span style={{
                  backgroundColor: '#29A98C',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  Búsqueda: "{searchTerm}"
                </span>
              )}
              
              {selectedCategory !== 'all' && (
                <span style={{
                  backgroundColor: '#4ECDC4',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {formatCategoryName(selectedCategory)}
                </span>
              )}
              
              {selectedAdministrationMode !== 'all' && (
                <span style={{
                  backgroundColor: '#45B7D1',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {formatAdministrationMode(selectedAdministrationMode)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Grid de escalas */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          maxHeight: maxHeight,
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <UniversalScaleGrid
            onScaleSelect={onScaleSelect}
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
            showInactive={false}
          />
        </div>
      </div>
    </div>
  );
};

export default UniversalScaleSelector;