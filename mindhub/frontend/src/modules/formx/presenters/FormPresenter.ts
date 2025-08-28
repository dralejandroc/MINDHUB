/**
 * Form Presenter
 * Transforms Form entities into UI-friendly view models
 */

import { Form, FormField } from '../entities/Form';

export interface FormViewModel {
  id: string;
  name: string;
  description: string;
  status: {
    value: 'draft' | 'published' | 'archived';
    label: string;
    color: string;
  };
  accessLevel: {
    value: 'public' | 'private' | 'restricted';
    label: string;
    icon: string;
  };
  isTemplate: boolean;
  templateCategory?: string;
  fieldCount: number;
  activeFieldCount: number;
  version: number;
  canEdit: boolean;
  canPublish: boolean;
  settings: {
    allowMultipleSubmissions: boolean;
    showProgressBar: boolean;
    saveAsDraft: boolean;
    requireSignature: boolean;
    expireAfterDays?: number;
    hasNotifications: boolean;
  };
  dates: {
    created: string;
    updated: string;
    published?: string;
  };
  tenant: {
    type: 'clinic' | 'workspace';
    id: string;
  } | null;
  createdBy: string;
}

export interface FormFieldViewModel {
  id: string;
  type: {
    value: string;
    label: string;
    icon: string;
  };
  label: string;
  name: string;
  required: boolean;
  hasValidations: boolean;
  hasConditionalLogic: boolean;
  isActive: boolean;
  order: number;
  description?: string;
  optionCount: number;
  validationCount: number;
  conditionalLogicCount: number;
}

export interface FormBuilderViewModel {
  form: FormViewModel;
  fields: FormFieldViewModel[];
  fieldTypes: Array<{
    value: string;
    label: string;
    icon: string;
    category: string;
  }>;
  validationOptions: Array<{
    type: string;
    label: string;
    description: string;
    hasValue: boolean;
  }>;
}

export interface FormListViewModel {
  forms: FormViewModel[];
  totalCount: number;
  statusSummary: {
    draft: number;
    published: number;
    archived: number;
  };
  categorySummary: Record<string, number>;
  recentActivity: Array<{
    formId: string;
    formName: string;
    action: string;
    timestamp: string;
  }>;
}

export interface FormStatsViewModel {
  totalForms: number;
  publishedForms: number;
  templateForms: number;
  averageFields: number;
  mostUsedFieldTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  formsByCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  recentForms: FormViewModel[];
}

export class FormPresenter {
  /**
   * Transform single Form entity to view model
   */
  static toViewModel(form: Form): FormViewModel {
    return {
      id: form.id,
      name: form.name,
      description: form.description,
      status: {
        value: form.status,
        label: this.getStatusLabel(form.status),
        color: this.getStatusColor(form.status)
      },
      accessLevel: {
        value: form.accessLevel,
        label: this.getAccessLevelLabel(form.accessLevel),
        icon: this.getAccessLevelIcon(form.accessLevel)
      },
      isTemplate: form.isTemplate,
      templateCategory: form.templateCategory,
      fieldCount: form.fields.length,
      activeFieldCount: form.fields.filter(f => f.isActive).length,
      version: form.version,
      canEdit: form.canBeEdited(),
      canPublish: form.canBePublished(),
      settings: {
        allowMultipleSubmissions: form.settings.allowMultipleSubmissions || false,
        showProgressBar: form.settings.showProgressBar || false,
        saveAsDraft: form.settings.saveAsDraft || false,
        requireSignature: form.settings.requireSignature || false,
        expireAfterDays: form.settings.expireAfterDays,
        hasNotifications: !!(form.settings.notificationSettings?.sendToCreator || form.settings.notificationSettings?.sendToPatient)
      },
      dates: {
        created: this.formatDate(form.createdAt),
        updated: this.formatDate(form.updatedAt),
        published: form.publishedAt ? this.formatDate(form.publishedAt) : undefined
      },
      tenant: form.clinicId 
        ? { type: 'clinic', id: form.clinicId }
        : form.workspaceId 
          ? { type: 'workspace', id: form.workspaceId }
          : null,
      createdBy: form.createdBy
    };
  }

  /**
   * Transform Form field to view model
   */
  static toFieldViewModel(field: FormField): FormFieldViewModel {
    return {
      id: field.id,
      type: {
        value: field.type,
        label: this.getFieldTypeLabel(field.type),
        icon: this.getFieldTypeIcon(field.type)
      },
      label: field.label,
      name: field.name,
      required: field.required,
      hasValidations: field.validations.length > 0,
      hasConditionalLogic: field.conditionalLogic.length > 0,
      isActive: field.isActive,
      order: field.order,
      description: field.description,
      optionCount: field.options.length,
      validationCount: field.validations.length,
      conditionalLogicCount: field.conditionalLogic.length
    };
  }

  /**
   * Transform list of Forms to list view model
   */
  static toListViewModel(forms: Form[]): FormListViewModel {
    const formViewModels = forms.map(form => this.toViewModel(form));
    
    const statusSummary = {
      draft: forms.filter(f => f.status === 'draft').length,
      published: forms.filter(f => f.status === 'published').length,
      archived: forms.filter(f => f.status === 'archived').length
    };

    const categorySummary: Record<string, number> = {};
    forms.forEach(form => {
      if (form.templateCategory) {
        categorySummary[form.templateCategory] = (categorySummary[form.templateCategory] || 0) + 1;
      }
    });

    const recentActivity = forms
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
      .slice(0, 10)
      .map(form => ({
        formId: form.id,
        formName: form.name,
        action: form.publishedAt ? 'published' : 'updated',
        timestamp: this.formatRelativeTime(form.updatedAt)
      }));

    return {
      forms: formViewModels,
      totalCount: forms.length,
      statusSummary,
      categorySummary,
      recentActivity
    };
  }

  /**
   * Transform Form to form builder view model
   */
  static toBuilderViewModel(form: Form): FormBuilderViewModel {
    return {
      form: this.toViewModel(form),
      fields: form.fields
        .sort((a, b) => a.order - b.order)
        .map(field => this.toFieldViewModel(field)),
      fieldTypes: this.getFieldTypeOptions(),
      validationOptions: this.getValidationOptions()
    };
  }

  /**
   * Calculate form statistics
   */
  static calculateStats(forms: Form[]): FormStatsViewModel {
    const totalForms = forms.length;
    const publishedForms = forms.filter(f => f.status === 'published').length;
    const templateForms = forms.filter(f => f.isTemplate).length;
    
    const totalFields = forms.reduce((sum, form) => sum + form.fields.length, 0);
    const averageFields = totalForms > 0 ? Math.round(totalFields / totalForms) : 0;

    // Count field types
    const fieldTypeCounts: Record<string, number> = {};
    forms.forEach(form => {
      form.fields.forEach(field => {
        fieldTypeCounts[field.type] = (fieldTypeCounts[field.type] || 0) + 1;
      });
    });

    const mostUsedFieldTypes = Object.entries(fieldTypeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / totalFields) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Count categories
    const categoryCounts: Record<string, number> = {};
    forms.forEach(form => {
      if (form.templateCategory) {
        categoryCounts[form.templateCategory] = (categoryCounts[form.templateCategory] || 0) + 1;
      }
    });

    const formsByCategory = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalForms) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const recentForms = forms
      .filter(f => f.createdAt)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 5)
      .map(form => this.toViewModel(form));

    return {
      totalForms,
      publishedForms,
      templateForms,
      averageFields,
      mostUsedFieldTypes,
      formsByCategory,
      recentForms
    };
  }

  /**
   * Filter forms by search query
   */
  static filterBySearch(forms: Form[], query: string): Form[] {
    if (!query.trim()) return forms;

    const lowerQuery = query.toLowerCase();
    return forms.filter(form =>
      form.name.toLowerCase().includes(lowerQuery) ||
      form.description.toLowerCase().includes(lowerQuery) ||
      (form.templateCategory && form.templateCategory.toLowerCase().includes(lowerQuery)) ||
      form.fields.some(field => 
        field.label.toLowerCase().includes(lowerQuery) ||
        field.name.toLowerCase().includes(lowerQuery)
      )
    );
  }

  /**
   * Sort forms by specified criteria
   */
  static sortForms(forms: Form[], sortBy: 'name' | 'date' | 'status' | 'usage'): Form[] {
    return [...forms].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0);
        case 'status':
          const statusOrder = { 'published': 0, 'draft': 1, 'archived': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'usage':
          // This would require submission count data
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }

  /**
   * Group forms by category
   */
  static groupByCategory(forms: Form[]): Map<string, Form[]> {
    const groups = new Map<string, Form[]>();
    
    forms.forEach(form => {
      const category = form.templateCategory || 'Sin Categoría';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(form);
    });

    return groups;
  }

  /**
   * Get forms that need attention (validation issues, etc.)
   */
  static getFormsNeedingAttention(forms: Form[]): Array<{
    form: FormViewModel;
    issues: string[];
  }> {
    const formsWithIssues: Array<{ form: FormViewModel; issues: string[] }> = [];

    forms.forEach(form => {
      const issues: string[] = [];
      const viewModel = this.toViewModel(form);

      // Check for common issues
      if (form.fields.length === 0) {
        issues.push('No tiene campos definidos');
      }

      if (form.fields.filter(f => f.isActive).length === 0) {
        issues.push('No tiene campos activos');
      }

      if (form.status === 'draft' && form.fields.length > 0) {
        issues.push('Formulario listo para publicar');
      }

      const requiredFieldsWithoutValidation = form.fields.filter(f => 
        f.required && f.validations.filter(v => v.type === 'required').length === 0
      );
      if (requiredFieldsWithoutValidation.length > 0) {
        issues.push(`${requiredFieldsWithoutValidation.length} campos requeridos sin validación`);
      }

      if (issues.length > 0) {
        formsWithIssues.push({ form: viewModel, issues });
      }
    });

    return formsWithIssues;
  }

  // Helper methods
  private static getStatusLabel(status: string): string {
    const labels = {
      draft: 'Borrador',
      published: 'Publicado',
      archived: 'Archivado'
    };
    return labels[status as keyof typeof labels] || status;
  }

  private static getStatusColor(status: string): string {
    const colors = {
      draft: 'yellow',
      published: 'green',
      archived: 'gray'
    };
    return colors[status as keyof typeof colors] || 'gray';
  }

  private static getAccessLevelLabel(level: string): string {
    const labels = {
      public: 'Público',
      private: 'Privado',
      restricted: 'Restringido'
    };
    return labels[level as keyof typeof labels] || level;
  }

  private static getAccessLevelIcon(level: string): string {
    const icons = {
      public: '🌐',
      private: '🔒',
      restricted: '⚠️'
    };
    return icons[level as keyof typeof icons] || '🔒';
  }

  private static getFieldTypeLabel(type: string): string {
    const labels = {
      text: 'Texto',
      textarea: 'Texto Largo',
      select: 'Selección',
      radio: 'Opción Única',
      checkbox: 'Casilla',
      number: 'Número',
      date: 'Fecha',
      email: 'Email',
      phone: 'Teléfono',
      file: 'Archivo',
      signature: 'Firma',
      scale: 'Escala',
      medical_scale: 'Escala Médica',
      section: 'Sección',
      divider: 'Divisor'
    };
    return labels[type as keyof typeof labels] || type;
  }

  private static getFieldTypeIcon(type: string): string {
    const icons = {
      text: '📝',
      textarea: '📄',
      select: '📋',
      radio: '⭕',
      checkbox: '☑️',
      number: '🔢',
      date: '📅',
      email: '📧',
      phone: '📞',
      file: '📎',
      signature: '✍️',
      scale: '📏',
      medical_scale: '🏥',
      section: '📂',
      divider: '➖'
    };
    return icons[type as keyof typeof icons] || '❓';
  }

  private static getFieldTypeOptions() {
    return [
      { value: 'text', label: 'Texto', icon: '📝', category: 'Básicos' },
      { value: 'textarea', label: 'Texto Largo', icon: '📄', category: 'Básicos' },
      { value: 'number', label: 'Número', icon: '🔢', category: 'Básicos' },
      { value: 'date', label: 'Fecha', icon: '📅', category: 'Básicos' },
      { value: 'email', label: 'Email', icon: '📧', category: 'Básicos' },
      { value: 'phone', label: 'Teléfono', icon: '📞', category: 'Básicos' },
      { value: 'select', label: 'Selección', icon: '📋', category: 'Selección' },
      { value: 'radio', label: 'Opción Única', icon: '⭕', category: 'Selección' },
      { value: 'checkbox', label: 'Casilla', icon: '☑️', category: 'Selección' },
      { value: 'file', label: 'Archivo', icon: '📎', category: 'Avanzados' },
      { value: 'signature', label: 'Firma', icon: '✍️', category: 'Avanzados' },
      { value: 'scale', label: 'Escala', icon: '📏', category: 'Médicos' },
      { value: 'medical_scale', label: 'Escala Médica', icon: '🏥', category: 'Médicos' },
      { value: 'section', label: 'Sección', icon: '📂', category: 'Organización' },
      { value: 'divider', label: 'Divisor', icon: '➖', category: 'Organización' }
    ];
  }

  private static getValidationOptions() {
    return [
      {
        type: 'required',
        label: 'Requerido',
        description: 'El campo debe ser completado',
        hasValue: false
      },
      {
        type: 'minLength',
        label: 'Longitud Mínima',
        description: 'Número mínimo de caracteres',
        hasValue: true
      },
      {
        type: 'maxLength',
        label: 'Longitud Máxima',
        description: 'Número máximo de caracteres',
        hasValue: true
      },
      {
        type: 'pattern',
        label: 'Patrón',
        description: 'Expresión regular para validar formato',
        hasValue: true
      },
      {
        type: 'custom',
        label: 'Personalizado',
        description: 'Validación personalizada',
        hasValue: true
      }
    ];
  }

  private static formatDate(date?: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private static formatRelativeTime(date?: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return this.formatDate(date);
  }
}