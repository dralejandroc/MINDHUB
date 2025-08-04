import React from 'react';

interface SemanticDifferentialQuestionProps {
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
    left_concept?: string;
    right_concept?: string;
    scale_points?: number;
    show_numbers?: boolean;
  };
}

export const SemanticDifferentialQuestion: React.FC<SemanticDifferentialQuestionProps> = ({
  item,
  value,
  onValueChange,
  metadata = {}
}) => {
  const {
    left_concept = 'Negativo',
    right_concept = 'Positivo',
    scale_points = 7,
    show_numbers = true
  } = metadata;

  const numericValue = value ? parseInt(value) : null;

  const handleValueChange = (newValue: number) => {
    const label = `${left_concept} ←→ ${right_concept} (${newValue})`;
    onValueChange(newValue.toString(), label, newValue);
  };

  const generateScale = () => {
    const points = [];
    for (let i = 1; i <= scale_points; i++) {
      points.push(i);
    }
    return points;
  };

  return (
    <div className="semantic-differential-question">
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

      <div style={{ marginTop: '40px' }}>
        {/* Conceptos opuestos */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '20px',
          fontSize: '1rem',
          fontWeight: '600',
          color: '#112F33'
        }}>
          <span>{left_concept}</span>
          <span>{right_concept}</span>
        </div>

        {/* Escala */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '5px'
        }}>
          {generateScale().map((point) => {
            const isSelected = numericValue === point;
            return (
              <div
                key={point}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {show_numbers && (
                  <span style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    {point}
                  </span>
                )}
                
                <button
                  onClick={() => handleValueChange(point)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: isSelected ? '#29A98C' : '#cbd5e1',
                    background: isSelected ? '#29A98C' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    boxShadow: isSelected ? '0 4px 12px rgba(41, 169, 140, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#29A98C';
                      e.currentTarget.style.background = 'rgba(41, 169, 140, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Línea conectora */}
        <div style={{
          height: '2px',
          background: '#e2e8f0',
          margin: '10px 0',
          position: 'relative'
        }}>
          {numericValue && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${((numericValue - 1) / (scale_points - 1)) * 100}%`,
                width: '4px',
                height: '20px',
                background: '#29A98C',
                transform: 'translate(-50%, -50%)',
                borderRadius: '2px'
              }}
            />
          )}
        </div>

        {/* Valor seleccionado */}
        {numericValue && (
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '1rem',
            color: '#112F33'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '15px',
              fontWeight: '600'
            }}>
              Valor seleccionado: {numericValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SemanticDifferentialQuestion;