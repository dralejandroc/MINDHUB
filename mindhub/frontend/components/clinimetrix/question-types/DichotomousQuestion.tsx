import React from 'react';

interface DichotomousQuestionProps {
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
  value: string | null;
  onValueChange: (value: string, label: string, score: number) => void;
  metadata?: {
    layout?: 'vertical' | 'horizontal';
    style?: 'buttons' | 'radio' | 'toggle';
  };
}

export const DichotomousQuestion: React.FC<DichotomousQuestionProps> = ({
  item,
  options,
  value,
  onValueChange,
  metadata = {}
}) => {
  const {
    layout = 'horizontal',
    style = 'buttons'
  } = metadata;

  const sortedOptions = options.sort((a, b) => a.orderIndex - b.orderIndex);

  const renderToggleStyle = () => (
    <div style={{
      display: 'flex',
      background: '#f1f5f9',
      borderRadius: '50px',
      padding: '4px',
      position: 'relative',
      maxWidth: '300px',
      margin: '0 auto'
    }}>
      {sortedOptions.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.id}
            onClick={() => onValueChange(option.value, option.label, option.score)}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: '46px',
              border: 'none',
              background: isSelected ? 'linear-gradient(135deg, #29A98C, #112F33)' : 'transparent',
              color: isSelected ? 'white' : '#64748b',
              fontWeight: isSelected ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '1rem',
              zIndex: isSelected ? 2 : 1
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  const renderButtonStyle = () => (
    <div style={{
      display: 'flex',
      flexDirection: layout === 'vertical' ? 'column' : 'row',
      gap: '15px',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {sortedOptions.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.id}
            onClick={() => onValueChange(option.value, option.label, option.score)}
            style={{
              background: isSelected 
                ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: '2px solid',
              borderColor: isSelected ? '#29A98C' : '#e2e8f0',
              borderRadius: '12px',
              padding: '16px 32px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '1.1rem',
              fontWeight: '500',
              color: isSelected ? 'white' : '#112F33',
              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isSelected ? '0 8px 25px rgba(41, 169, 140, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
              minWidth: layout === 'horizontal' ? '120px' : '200px'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = '#29A98C';
                e.currentTarget.style.background = 'rgba(41, 169, 140, 0.1)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  const renderRadioStyle = () => (
    <div style={{
      display: 'flex',
      flexDirection: layout === 'vertical' ? 'column' : 'row',
      gap: '20px',
      justifyContent: 'center',
      alignItems: layout === 'vertical' ? 'flex-start' : 'center'
    }}>
      {sortedOptions.map((option) => {
        const isSelected = value === option.value;
        return (
          <label
            key={option.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: '#112F33'
            }}
          >
            <input
              type="radio"
              name={`question-${item.id}`}
              value={option.value}
              checked={isSelected}
              onChange={() => onValueChange(option.value, option.label, option.score)}
              style={{
                appearance: 'none',
                width: '20px',
                height: '20px',
                border: '2px solid #29A98C',
                borderRadius: '50%',
                position: 'relative',
                cursor: 'pointer'
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: isSelected ? '#29A98C' : 'transparent',
                transform: 'translate(-16px, 0)',
                transition: 'all 0.2s ease'
              }}
            />
            <span style={{ fontWeight: isSelected ? '600' : '400' }}>
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="dichotomous-question">
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

      {/* Opciones según el estilo */}
      <div style={{ marginTop: '30px' }}>
        {style === 'toggle' && renderToggleStyle()}
        {style === 'buttons' && renderButtonStyle()}
        {style === 'radio' && renderRadioStyle()}
      </div>
    </div>
  );
};