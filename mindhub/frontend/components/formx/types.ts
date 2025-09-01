export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'tel' | 'date' | 'select' | 'checkbox' | 'radio' | 'scale' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  description?: string;
}

export interface FormTemplate {
  name: string;
  description: string;
  category: string;
  estimatedTime: string;
  instructions: string;
  fields: FormField[];
}