export { LikertQuestion } from './LikertQuestion';
export { DichotomousQuestion } from './DichotomousQuestion';
export { VASQuestion } from './VASQuestion';
export { TextQuestion } from './TextQuestion';
export { ChecklistQuestion } from './ChecklistQuestion';

// Tipos adicionales que se pueden implementar después
export { NumericQuestion } from './NumericQuestion';
export { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
export { RankingQuestion } from './RankingQuestion';
export { SemanticDifferentialQuestion } from './SemanticDifferentialQuestion';
export { FrequencyQuestion } from './FrequencyQuestion';

// Mapa de componentes por tipo
export const QuestionTypeComponents = {
  likert: LikertQuestion,
  dichotomous: DichotomousQuestion,
  vas: VASQuestion,
  text: TextQuestion,
  checklist: ChecklistQuestion,
  numeric: NumericQuestion,
  multiple_choice: MultipleChoiceQuestion,
  ranking: RankingQuestion,
  semantic_diff: SemanticDifferentialQuestion,
  frequency: FrequencyQuestion
};

// Función helper para obtener componente por tipo
export const getQuestionComponent = (questionType: string) => {
  return QuestionTypeComponents[questionType as keyof typeof QuestionTypeComponents];
};