import React, { useState, useEffect } from 'react';

interface TextQuestionProps {
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
    max_length?: number;
    rows?: number;
    placeholder?: string;
    input_type?: 'text' | 'textarea' | 'email' | 'phone' | 'number';
  };
}

export const TextQuestion: React.FC<TextQuestionProps> = ({
  item,
  value,
  onValueChange,
  metadata = {}
}) => {
  const {
    max_length = 500,
    rows = 3,
    placeholder = 'Escriba su respuesta aquí...',
    input_type = 'textarea'
  } = metadata;

  const [textValue, setTextValue] = useState(value || '');
  const [charCount, setCharCount] = useState(value?.length || 0);

  useEffect(() => {
    if (value !== null) {
      setTextValue(value);
      setCharCount(value.length);
    }
  }, [value]);

  const handleTextChange = (newValue: string) => {
    if (newValue.length <= max_length) {
      setTextValue(newValue);
      setCharCount(newValue.length);
      onValueChange(newValue, newValue, 0); // Score 0 para texto libre
    }
  };

  const getInputType = () => {
    switch (input_type) {
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      case 'number':
        return 'number';
      default:
        return 'text';
    }
  };

  const renderInput = () => {
    const commonStyles = {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      border: '2px solid #e2e8f0',
      fontSize: '1rem',
      fontFamily: 'inherit',
      outline: 'none',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.9)',
      resize: 'vertical' as const
    };

    const focusStyles = {
      borderColor: '#29A98C',
      boxShadow: '0 0 0 3px rgba(41, 169, 140, 0.1)'
    };

    if (input_type === 'textarea') {
      return (
        <textarea
          value={textValue}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={max_length}
          style={commonStyles}
          onFocus={(e) => {
            e.target.style.borderColor = '#29A98C';
            e.target.style.boxShadow = '0 0 0 3px rgba(41, 169, 140, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
            e.target.style.boxShadow = 'none';
          }}
        />
      );
    }

    return (
      <input
        type={getInputType()}
        value={textValue}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        maxLength={max_length}
        style={commonStyles}
        onFocus={(e) => {
          e.target.style.borderColor = '#29A98C';
          e.target.style.boxShadow = '0 0 0 3px rgba(41, 169, 140, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e2e8f0';
          e.target.style.boxShadow = 'none';
        }}
      />
    );
  };

  return (
    <div className="text-question">
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

      {/* Campo de texto */}
      <div style={{ marginTop: '30px' }}>
        {renderInput()}
        
        {/* Contador de caracteres */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
          fontSize: '0.85rem',
          color: '#64748b'
        }}>
          <div>
            {input_type === 'textarea' && charCount === 0 && (
              <span style={{ color: '#94a3b8' }}>
                Escriba su respuesta detallada
              </span>
            )}
          </div>
          <div style={{
            color: charCount > max_length * 0.9 ? '#E74C3C' : '#64748b'
          }}>
            {charCount}/{max_length}
          </div>
        </div>

        {/* Validación visual */}
        {item.required && charCount === 0 && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '0.85rem',
            color: '#dc2626'
          }}>
            Este campo es obligatorio
          </div>
        )}

        {/* Indicador de tipo de entrada */}
        {input_type !== 'textarea' && input_type !== 'text' && (
          <div style={{
            marginTop: '8px',
            fontSize: '0.8rem',
            color: '#94a3b8'
          }}>
            {input_type === 'email' && 'Formato: ejemplo@email.com'}
            {input_type === 'phone' && 'Formato: +1234567890'}
            {input_type === 'number' && 'Solo números'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextQuestion;