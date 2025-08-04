import React, { useState, useEffect } from 'react';

interface RankingQuestionProps {
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
    max_rank?: number;
    allow_ties?: boolean;
  };
}

export const RankingQuestion: React.FC<RankingQuestionProps> = ({
  item,
  options,
  value,
  onValueChange,
  metadata = {}
}) => {
  const { max_rank = options.length, allow_ties = false } = metadata;
  
  const [rankings, setRankings] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setRankings(parsed);
      } catch (e) {
        setRankings({});
      }
    }
  }, [value]);

  const handleRankChange = (optionValue: string, rank: number) => {
    const newRankings = { ...rankings };
    
    if (rank === 0) {
      // Remover ranking
      delete newRankings[optionValue];
    } else {
      // Verificar si el ranking ya existe (si no se permiten empates)
      if (!allow_ties) {
        const existingOption = Object.keys(newRankings).find(key => newRankings[key] === rank);
        if (existingOption) {
          delete newRankings[existingOption];
        }
      }
      newRankings[optionValue] = rank;
    }

    setRankings(newRankings);
    
    // Calcular score y crear representación de string
    const totalScore = Object.values(newRankings).reduce((sum, rank) => sum + rank, 0);
    const rankingString = JSON.stringify(newRankings);
    
    onValueChange(rankingString, `Rankings: ${Object.keys(newRankings).length}`, totalScore);
  };

  return (
    <div className="ranking-question">
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
        {options.map((option) => {
          const currentRank = rankings[option.value] || 0;
          
          return (
            <div
              key={option.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '15px',
                marginBottom: '10px',
                borderRadius: '12px',
                border: '2px solid',
                borderColor: currentRank > 0 ? '#29A98C' : '#e2e8f0',
                background: currentRank > 0 ? 'rgba(41, 169, 140, 0.1)' : 'white'
              }}
            >
              <span style={{
                flex: 1,
                fontSize: '1rem',
                color: '#112F33'
              }}>
                {option.label}
              </span>
              
              <div style={{
                display: 'flex',
                gap: '5px'
              }}>
                {[0, 1, 2, 3, 4, 5].slice(0, max_rank + 1).map((rank) => (
                  <button
                    key={rank}
                    onClick={() => handleRankChange(option.value, rank)}
                    style={{
                      width: '35px',
                      height: '35px',
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: currentRank === rank ? '#29A98C' : '#e2e8f0',
                      background: currentRank === rank ? '#29A98C' : 'white',
                      color: currentRank === rank ? 'white' : '#64748b',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {rank === 0 ? '—' : rank}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RankingQuestion;