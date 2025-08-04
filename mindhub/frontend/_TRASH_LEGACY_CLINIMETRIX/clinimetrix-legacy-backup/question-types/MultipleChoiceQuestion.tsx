import React from 'react';
import { LikertQuestion } from './LikertQuestion';

interface MultipleChoiceQuestionProps {
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
    randomize?: boolean;
  };
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = (props) => {
  // MultipleChoice es esencialmente igual a Likert, pero con diferentes opciones
  // Reutilizamos el componente Likert con configuración específica
  return <LikertQuestion {...props} />;
};

export default MultipleChoiceQuestion;