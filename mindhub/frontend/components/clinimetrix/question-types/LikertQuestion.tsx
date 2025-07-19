import React from 'react';

interface LikertQuestionProps {
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
    show_numbers?: boolean;
    show_labels?: boolean;
    randomize_options?: boolean;
  };
}

export const LikertQuestion: React.FC<LikertQuestionProps> = ({
  item,
  options,
  value,
  onValueChange,
  metadata = {}
}) => {
  const {
    layout = 'vertical',
    show_numbers = true,
    show_labels = true,
    randomize_options = false
  } = metadata;

  const processedOptions = randomize_options 
    ? [...options].sort(() => Math.random() - 0.5)
    : options.sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="likert-question">
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

      {/* Opciones */}
      <div style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        gap: layout === 'vertical' ? '15px' : '10px',
        marginTop: '30px',
        flexWrap: layout === 'horizontal' ? 'wrap' : 'nowrap'
      }}>
        {processedOptions.map((option, index) => {
          const isSelected = value === option.value;
          
          return (
            <button
              key={option.id}
              onClick={() => onValueChange(option.value, option.label, option.score)}
              style={{
                background: isSelected 
                  ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                  : 'rgba(255, 255, 255, 0.8)',
                border: '2px solid #e2e8f0',
                borderColor: isSelected ? '#29A98C' : '#e2e8f0',
                borderRadius: '12px',
                padding: '15px 20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left',
                fontSize: '1rem',
                lineHeight: '1.4',
                color: isSelected ? 'white' : '#112F33',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isSelected ? '0 4px 12px rgba(41, 169, 140, 0.3)' : 'none',
                minWidth: layout === 'horizontal' ? '120px' : 'auto',
                flex: layout === 'horizontal' ? '1' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#29A98C';
                  e.currentTarget.style.background = 'rgba(41, 169, 140, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 169, 140, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {show_numbers && (
                  <span style={{
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    opacity: 0.8
                  }}>
                    {option.value}
                  </span>
                )}
                {show_labels && (
                  <span>{option.label}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};