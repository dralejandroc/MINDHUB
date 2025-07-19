import React from 'react';

interface NumericQuestionProps {
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
    layout?: 'scale' | 'input' | 'buttons';
  };
}

export const NumericQuestion: React.FC<NumericQuestionProps> = ({
  item,
  value,
  onValueChange,
  metadata = {}
}) => {
  const {
    min_value = 0,
    max_value = 10,
    step = 1,
    layout = 'scale'
  } = metadata;

  const numericValue = value ? parseFloat(value) : null;

  const handleValueChange = (newValue: number) => {
    onValueChange(newValue.toString(), newValue.toString(), newValue);
  };

  const renderScale = () => {
    const values = [];
    for (let i = min_value; i <= max_value; i += step) {
      values.push(i);
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {values.map((val) => {
          const isSelected = numericValue === val;
          return (
            <button
              key={val}
              onClick={() => handleValueChange(val)}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: isSelected ? '#29A98C' : '#e2e8f0',
                background: isSelected 
                  ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                  : 'white',
                color: isSelected ? 'white' : '#112F33',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
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
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              {val}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="numeric-question">
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

      <div style={{ marginTop: '30px' }}>
        {renderScale()}
      </div>

      {/* Etiquetas de escala */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '15px',
        fontSize: '0.9rem',
        color: '#64748b'
      }}>
        <span>{min_value}</span>
        <span>{max_value}</span>
      </div>
    </div>
  );
};