import React, { useState, useEffect } from 'react';

interface ChecklistQuestionProps {
  item: {
    id: string;
    number: number;
    text: string;
    helpText?: string;
    required: boolean;
  };
  options: Array<{
    id: string;
    value: string;
    label: string;
    score: number;
    orderIndex: number;
  }>;
  value: string[] | null;
  onValueChange: (value: string[], label: string, score: number) => void;
  metadata?: {
    min_selections?: number;
    max_selections?: number;
    layout?: 'vertical' | 'horizontal' | 'grid';
    columns?: number;
  };
}

export const ChecklistQuestion: React.FC<ChecklistQuestionProps> = ({
  item,
  options,
  value,
  onValueChange,
  metadata = {}
}) => {
  const {
    min_selections = 0,
    max_selections = options.length,
    layout = 'vertical',
    columns = 2
  } = metadata;

  const [selectedValues, setSelectedValues] = useState<string[]>(value || []);

  useEffect(() => {
    if (value !== null) {
      setSelectedValues(value);
    }
  }, [value]);

  const handleOptionToggle = (optionValue: string) => {
    let newSelected: string[];
    
    if (selectedValues.includes(optionValue)) {
      // Deseleccionar
      newSelected = selectedValues.filter(val => val !== optionValue);
    } else {
      // Seleccionar (si no excede el máximo)
      if (selectedValues.length < max_selections) {
        newSelected = [...selectedValues, optionValue];
      } else {
        return; // No agregar más opciones
      }
    }

    setSelectedValues(newSelected);
    
    // Calcular score total
    const totalScore = newSelected.reduce((sum, val) => {
      const option = options.find(opt => opt.value === val);
      return sum + (option?.score || 0);
    }, 0);

    // Crear label descriptivo
    const selectedLabels = newSelected.map(val => {
      const option = options.find(opt => opt.value === val);
      return option?.label || val;
    });

    onValueChange(newSelected, selectedLabels.join(', '), totalScore);
  };

  const sortedOptions = options.sort((a, b) => a.orderIndex - b.orderIndex);

  const getLayoutStyles = () => {
    switch (layout) {
      case 'horizontal':
        return {
          display: 'flex',
          flexDirection: 'row' as const,
          flexWrap: 'wrap' as const,
          gap: '15px'
        };
      case 'grid':
        return {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '15px'
        };
      default:
        return {
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '15px'
        };
    }
  };

  const isValidSelection = selectedValues.length >= min_selections && 
                          selectedValues.length <= max_selections;

  return (
    <div className="checklist-question">
      {/* Número de pregunta */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #29A98C, #112F33)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        fontWeight: '600',
        fontSize: '1.1rem'
      }}>
        {item.number}
      </div>

      {/* Título de la pregunta */}
      <h3 style={{
        color: '#112F33',
        fontSize: '1.4rem',
        marginBottom: '15px',
        fontWeight: '500',
        textAlign: 'center'
      }}>
        {item.text}
        {item.required && <span style={{ color: '#E74C3C', marginLeft: '5px' }}>*</span>}
      </h3>

      {/* Texto de ayuda */}
      {item.helpText && (
        <p style={{
          color: '#666',
          fontSize: '0.9rem',
          textAlign: 'center',
          marginBottom: '20px',
          fontStyle: 'italic'
        }}>
          {item.helpText}
        </p>
      )}

      {/* Instrucciones de selección */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        fontSize: '0.9rem',
        color: '#64748b'
      }}>
        {min_selections === 0 && max_selections === options.length ? (
          'Seleccione todas las opciones que apliquen'
        ) : min_selections === max_selections ? (
          `Seleccione exactamente ${min_selections} opciones`
        ) : (
          `Seleccione entre ${min_selections} y ${max_selections} opciones`
        )}
        
        {selectedValues.length > 0 && (
          <div style={{
            marginTop: '8px',
            color: isValidSelection ? '#059669' : '#dc2626',
            fontWeight: '500'
          }}>
            {selectedValues.length} de {max_selections} seleccionadas
          </div>
        )}
      </div>

      {/* Opciones */}
      <div style={getLayoutStyles()}>
        {sortedOptions.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          const isDisabled = !isSelected && selectedValues.length >= max_selections;
          
          return (
            <div
              key={option.id}
              onClick={() => !isDisabled && handleOptionToggle(option.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid',
                borderColor: isSelected ? '#29A98C' : '#e2e8f0',
                background: isSelected 
                  ? 'rgba(41, 169, 140, 0.1)' 
                  : isDisabled 
                    ? '#f8fafc' 
                    : 'rgba(255, 255, 255, 0.9)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isDisabled ? 0.5 : 1,
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isSelected ? '0 4px 12px rgba(41, 169, 140, 0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isDisabled && !isSelected) {
                  e.currentTarget.style.borderColor = '#29A98C';
                  e.currentTarget.style.background = 'rgba(41, 169, 140, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled && !isSelected) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                }
              }}
            >
              {/* Checkbox personalizado */}
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: '2px solid',
                  borderColor: isSelected ? '#29A98C' : '#cbd5e1',
                  background: isSelected ? '#29A98C' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                {isSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    style={{ color: 'white' }}
                  >
                    <path
                      d="M2 6L4.5 8.5L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              {/* Label */}
              <span style={{
                fontSize: '1rem',
                color: isDisabled ? '#94a3b8' : '#112F33',
                fontWeight: isSelected ? '500' : '400',
                lineHeight: '1.4'
              }}>
                {option.label}
              </span>

              {/* Score indicator (opcional) */}
              {option.score > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.8rem',
                  color: '#64748b',
                  background: '#f1f5f9',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  +{option.score}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Validación */}
      {item.required && selectedValues.length < min_selections && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#dc2626',
          textAlign: 'center'
        }}>
          Debe seleccionar al menos {min_selections} opciones
        </div>
      )}

      {/* Resumen de selección */}
      {selectedValues.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#166534'
        }}>
          <strong>Seleccionado:</strong> {selectedValues.map(val => {
            const option = options.find(opt => opt.value === val);
            return option?.label || val;
          }).join(', ')}
        </div>
      )}
    </div>
  );
};