import React from 'react';
import { LikertQuestion } from './LikertQuestion';

interface FrequencyQuestionProps {
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
    time_frame?: string;
    layout?: 'vertical' | 'horizontal';
  };
}

export const FrequencyQuestion: React.FC<FrequencyQuestionProps> = (props) => {
  // FrequencyQuestion es una variante de Likert con etiquetas específicas de frecuencia
  const { metadata = {} } = props;
  const { time_frame = 'weeks' } = metadata;

  // Agregar contexto temporal al helpText
  const enhancedItem = {
    ...props.item,
    helpText: props.item.helpText || `En las últimas ${time_frame === 'weeks' ? '2 semanas' : 'semanas'}, con qué frecuencia ha experimentado esto:`
  };

  return <LikertQuestion {...props} item={enhancedItem} />;
};