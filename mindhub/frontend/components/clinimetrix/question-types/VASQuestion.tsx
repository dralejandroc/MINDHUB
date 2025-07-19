import React, { useState, useRef, useEffect } from 'react';

interface VASQuestionProps {
  item: {
    id: string;
    number: number;
    text: string;
    helpText?: string;
    required: boolean;
  };
  value: string | null;
  onValueChange: (value: string, label: string, score: number) => void;
  metadata?: {
    min_value?: number;
    max_value?: number;
    step?: number;
    left_label?: string;
    right_label?: string;
    show_scale?: boolean;
    scale_range?: { min: number; max: number };
  };
}

export const VASQuestion: React.FC<VASQuestionProps> = ({
  item,
  value,
  onValueChange,
  metadata = {}
}) => {
  const {
    min_value = 0,
    max_value = 100,
    step = 1,
    left_label = 'Mínimo',
    right_label = 'Máximo',
    show_scale = true,
    scale_range
  } = metadata;

  const [sliderValue, setSliderValue] = useState<number>(
    value ? parseFloat(value) : min_value
  );
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== null) {
      setSliderValue(parseFloat(value));
    }
  }, [value]);

  const handleSliderChange = (newValue: number) => {
    const clampedValue = Math.max(min_value, Math.min(max_value, newValue));
    setSliderValue(clampedValue);
    
    // Calcular score basado en scale_range si está definido
    let score = clampedValue;
    if (scale_range) {
      const percentage = (clampedValue - min_value) / (max_value - min_value);
      score = Math.round(scale_range.min + (percentage * (scale_range.max - scale_range.min)));
    }
    
    onValueChange(clampedValue.toString(), `${clampedValue}`, score);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderFromMouse(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateSliderFromMouse(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateSliderFromMouse = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = min_value + (percentage * (max_value - min_value));
    
    handleSliderChange(Math.round(newValue / step) * step);
  };

  const percentage = ((sliderValue - min_value) / (max_value - min_value)) * 100;

  return (
    <div className="vas-question">
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
          marginBottom: '30px',
          fontStyle: 'italic'
        }}>
          {item.helpText}
        </p>
      )}

      {/* Slider VAS */}
      <div style={{ marginTop: '40px', marginBottom: '20px' }}>
        {/* Etiquetas superior */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '20px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <span>{left_label}</span>
          <span>{right_label}</span>
        </div>

        {/* Slider container */}
        <div
          ref={sliderRef}
          style={{
            position: 'relative',
            height: '8px',
            background: '#e2e8f0',
            borderRadius: '4px',
            cursor: 'pointer',
            margin: '20px 0'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Barra de progreso */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, #29A98C, #112F33)',
              borderRadius: '4px',
              transition: isDragging ? 'none' : 'width 0.2s ease'
            }}
          />

          {/* Indicador/handle */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${percentage}%`,
              width: '24px',
              height: '24px',
              background: '#29A98C',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              cursor: 'grab',
              boxShadow: '0 2px 8px rgba(41, 169, 140, 0.3)',
              border: '3px solid white',
              transition: isDragging ? 'none' : 'left 0.2s ease'
            }}
          />
        </div>

        {/* Valor actual */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #29A98C, #112F33)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            {sliderValue.toFixed(step < 1 ? 1 : 0)}
          </div>
        </div>

        {/* Escala numérica opcional */}
        {show_scale && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '15px',
            fontSize: '0.8rem',
            color: '#94a3b8'
          }}>
            {Array.from({ length: 11 }, (_, i) => {
              const scaleValue = min_value + (i * (max_value - min_value) / 10);
              return (
                <span key={i} style={{
                  textAlign: 'center',
                  minWidth: '20px'
                }}>
                  {Math.round(scaleValue)}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Input numérico alternativo */}
      <div style={{
        textAlign: 'center',
        marginTop: '20px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#666',
          marginBottom: '10px'
        }}>
          O ingrese un valor exacto:
        </div>
        <input
          type="number"
          min={min_value}
          max={max_value}
          step={step}
          value={sliderValue}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value) || min_value)}
          style={{
            width: '100px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '2px solid #e2e8f0',
            textAlign: 'center',
            fontSize: '1rem',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#29A98C';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
          }}
        />
      </div>
    </div>
  );
};