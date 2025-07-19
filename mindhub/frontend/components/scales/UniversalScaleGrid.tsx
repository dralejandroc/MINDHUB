/**
 * GRID UNIVERSAL DE ESCALAS
 * Componente que muestra todas las escalas disponibles de forma dinámica
 */

'use client';

import React, { useState, useEffect } from 'react';

interface Scale {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  category: string;
  subcategory?: string;
  totalItems: number;
  estimatedDurationMinutes: number;
  administrationMode: string;
  targetPopulation: string;
  isActive: boolean;
  createdAt: string;
}

interface UniversalScaleGridProps {
  onScaleSelect: (scaleId: string) => void;
  selectedCategory?: string;
  searchTerm?: string;
  showInactive?: boolean;
}

export const UniversalScaleGrid: React.FC<UniversalScaleGridProps> = ({
  onScaleSelect,
  selectedCategory,
  searchTerm = '',
  showInactive = false
}) => {
  const [scales, setScales] = useState<Scale[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredScales, setFilteredScales] = useState<Scale[]>([]);

  // Cargar escalas desde API
  useEffect(() => {
    const loadScales = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/scales');
        
        if (!response.ok) {
          throw new Error(`Error cargando escalas: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Error desconocido');
        }
        
        setScales(data.data || []);
        
        // Extraer categorías únicas
        const uniqueCategories = [...new Set(data.data.map((scale: Scale) => scale.category))];
        setCategories(uniqueCategories.filter(Boolean));
        
      } catch (err) {
        console.error('Error loading scales:', err);
        setError(err instanceof Error ? err.message : 'Error cargando escalas');
      } finally {
        setIsLoading(false);
      }
    };

    loadScales();
  }, []);

  // Filtrar escalas
  useEffect(() => {
    let filtered = scales;

    // Filtrar por activas/inactivas
    if (!showInactive) {
      filtered = filtered.filter(scale => scale.isActive);
    }

    // Filtrar por categoría
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(scale => scale.category === selectedCategory);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(scale => 
        scale.name.toLowerCase().includes(searchLower) ||
        scale.abbreviation.toLowerCase().includes(searchLower) ||
        scale.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredScales(filtered);
  }, [scales, selectedCategory, searchTerm, showInactive]);

  // Obtener color por categoría
  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'depression': '#FF6B6B',
      'anxiety': '#4ECDC4',
      'autism_screening': '#45B7D1',
      'family_assessment': '#96CEB4',
      'bipolar': '#FFEAA7',
      'adhd': '#DDA0DD',
      'ptsd': '#F39C12',
      'substance_use': '#8E44AD',
      'eating_disorders': '#E74C3C',
      'personality': '#3498DB',
      'cognitive': '#9B59B6',
      'default': '#95A5A6'
    };
    return colorMap[category] || colorMap['default'];
  };

  // Obtener icono por categoría
  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'depression': '😔',
      'anxiety': '😰',
      'autism_screening': '🧩',
      'family_assessment': '👨‍👩‍👧‍👦',
      'bipolar': '🎭',
      'adhd': '⚡',
      'ptsd': '💭',
      'substance_use': '🚫',
      'eating_disorders': '🍽️',
      'personality': '🎭',
      'cognitive': '🧠',
      'default': '📋'
    };
    return iconMap[category] || iconMap['default'];
  };

  // Formatear nombre de categoría
  const formatCategoryName = (category: string) => {
    const nameMap: { [key: string]: string } = {
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

  if (isLoading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
        padding: '1rem'
      }}>
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '1.5rem',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #29A98C',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: '12px',
        margin: '1rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h3 style={{ color: '#F44336', marginBottom: '1rem' }}>
          Error al Cargar Escalas
        </h3>
        <p style={{ color: '#64748b' }}>{error}</p>
      </div>
    );
  }

  if (filteredScales.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        backgroundColor: 'rgba(158, 158, 158, 0.1)',
        borderRadius: '12px',
        margin: '1rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h3 style={{ color: '#112F33', marginBottom: '1rem' }}>
          No se encontraron escalas
        </h3>
        <p style={{ color: '#64748b' }}>
          {searchTerm ? 
            `No hay escalas que coincidan con "${searchTerm}"` : 
            'No hay escalas disponibles para los filtros seleccionados'
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .scale-card {
          transition: all 0.3s ease;
        }
        
        .scale-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }
        
        .scale-card:active {
          transform: translateY(-2px);
        }
        
        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          margin-bottom: 1rem;
        }
        
        .administration-mode {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background-color: rgba(41, 169, 140, 0.1);
          color: #29A98C;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .stats-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }
        
        .stat-item {
          text-align: center;
          flex: 1;
        }
        
        .stat-value {
          font-size: 1.25rem;
          font-weight: 'bold';
          color: #112F33;
          margin-bottom: 0.25rem;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
        }
      `}</style>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem',
        padding: '1rem'
      }}>
        {filteredScales.map((scale) => (
          <div
            key={scale.id}
            className="scale-card"
            onClick={() => onScaleSelect(scale.id)}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Categoría */}
            <div 
              className="category-badge"
              style={{
                backgroundColor: getCategoryColor(scale.category)
              }}
            >
              <span>{getCategoryIcon(scale.category)}</span>
              <span>{formatCategoryName(scale.category)}</span>
            </div>

            {/* Título y abreviación */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#112F33',
                marginBottom: '0.5rem',
                lineHeight: '1.4'
              }}>
                {scale.name}
              </h3>
              <div style={{
                fontSize: '0.875rem',
                color: '#29A98C',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                {scale.abbreviation}
              </div>
            </div>

            {/* Descripción */}
            <p style={{
              color: '#64748b',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              marginBottom: '1rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {scale.description}
            </p>

            {/* Modo de administración */}
            <div style={{ marginBottom: '1rem' }}>
              <div className="administration-mode">
                <span>
                  {scale.administrationMode === 'self_administered' ? '👤' : 
                   scale.administrationMode === 'clinician_administered' ? '👨‍⚕️' : '👥'}
                </span>
                <span>
                  {scale.administrationMode === 'self_administered' ? 'Autoaplicada' : 
                   scale.administrationMode === 'clinician_administered' ? 'Clínico' : 'Ambos'}
                </span>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="stats-container">
              <div className="stat-item">
                <div className="stat-value">{scale.totalItems}</div>
                <div className="stat-label">Items</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{scale.estimatedDurationMinutes}</div>
                <div className="stat-label">Minutos</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ fontSize: '0.875rem' }}>
                  {scale.targetPopulation}
                </div>
                <div className="stat-label">Población</div>
              </div>
            </div>

            {/* Indicador de estado */}
            {!scale.isActive && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: '#F44336',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                Inactiva
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumen de resultados */}
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        color: '#64748b',
        fontSize: '0.875rem'
      }}>
        Mostrando {filteredScales.length} de {scales.length} escalas
        {selectedCategory && selectedCategory !== 'all' && (
          <span> en categoría "{formatCategoryName(selectedCategory)}"</span>
        )}
        {searchTerm && (
          <span> que coinciden con "{searchTerm}"</span>
        )}
      </div>
    </div>
  );
};

export default UniversalScaleGrid;