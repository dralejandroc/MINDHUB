// FormX Templates - Psychiatric Intake Forms by Age Group
import { FormTemplate } from '../types';

export { ADULT_PSYCHIATRIC_INTAKE_TEMPLATE } from './AdultPsychiatricIntake';
export { ADOLESCENT_PSYCHIATRIC_INTAKE_TEMPLATE } from './AdolescentPsychiatricIntake';
export { CHILD_PSYCHIATRIC_INTAKE_TEMPLATE } from './ChildPsychiatricIntake';
export { MATURE_PSYCHIATRIC_INTAKE_TEMPLATE } from './MaturePsychiatricIntake';

// All available templates array for easy access
import { ADULT_PSYCHIATRIC_INTAKE_TEMPLATE } from './AdultPsychiatricIntake';
import { ADOLESCENT_PSYCHIATRIC_INTAKE_TEMPLATE } from './AdolescentPsychiatricIntake';
import { CHILD_PSYCHIATRIC_INTAKE_TEMPLATE } from './ChildPsychiatricIntake';
import { MATURE_PSYCHIATRIC_INTAKE_TEMPLATE } from './MaturePsychiatricIntake';

export const PSYCHIATRIC_TEMPLATES = [
  ADULT_PSYCHIATRIC_INTAKE_TEMPLATE,
  ADOLESCENT_PSYCHIATRIC_INTAKE_TEMPLATE,
  CHILD_PSYCHIATRIC_INTAKE_TEMPLATE,
  MATURE_PSYCHIATRIC_INTAKE_TEMPLATE
] as const;

export const TEMPLATE_MAP: Record<string, FormTemplate> = {
  'adult-psychiatric': ADULT_PSYCHIATRIC_INTAKE_TEMPLATE as FormTemplate,
  'adolescent-psychiatric': ADOLESCENT_PSYCHIATRIC_INTAKE_TEMPLATE as FormTemplate,
  'child-psychiatric': CHILD_PSYCHIATRIC_INTAKE_TEMPLATE as FormTemplate,
  'mature-psychiatric': MATURE_PSYCHIATRIC_INTAKE_TEMPLATE as FormTemplate
};