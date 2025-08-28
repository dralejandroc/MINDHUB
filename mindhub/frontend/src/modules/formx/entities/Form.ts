/**
 * Form Entity
 * Core business logic for dynamic forms - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'number' 
  | 'date' 
  | 'email' 
  | 'phone' 
  | 'file' 
  | 'signature' 
  | 'scale'
  | 'medical_scale'
  | 'section'
  | 'divider';

export type ValidationRule = {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
};

export interface FormFieldOption {
  value: string;
  label: string;
  isDefault?: boolean;
}

export interface ConditionalLogic {
  dependsOn: string; // Field ID
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'require' | 'disable';
}

export class FormField {
  constructor(
    public readonly id: string,
    public readonly type: FormFieldType,
    public readonly label: string,
    public readonly name: string,
    public readonly required: boolean = false,
    public readonly placeholder?: string,
    public readonly description?: string,
    public readonly defaultValue?: any,
    public readonly options: FormFieldOption[] = [],
    public readonly validations: ValidationRule[] = [],
    public readonly conditionalLogic: ConditionalLogic[] = [],
    public readonly order: number = 0,
    public readonly sectionId?: string,
    public readonly metadata: Record<string, any> = {},
    public readonly isActive: boolean = true
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate field configuration
   */
  private validate(): void {
    // Business rule: ID is mandatory and unique
    if (!this.id.trim()) {
      throw new Error('Field ID is required');
    }

    // Business rule: Label is mandatory
    if (!this.label.trim()) {
      throw new Error('Field label is required');
    }

    // Business rule: Name must be valid identifier
    if (!this.name.trim() || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.name)) {
      throw new Error('Field name must be a valid identifier');
    }

    // Business rule: Select/radio fields must have options
    if (['select', 'radio'].includes(this.type) && this.options.length === 0) {
      throw new Error('Select and radio fields must have options');
    }

    // Business rule: Scale fields must have min/max values
    if (this.type === 'scale' && (!this.metadata.minValue || !this.metadata.maxValue)) {
      throw new Error('Scale fields must have minValue and maxValue in metadata');
    }

    // Business rule: Medical scale must reference a valid scale
    if (this.type === 'medical_scale' && !this.metadata.scaleId) {
      throw new Error('Medical scale fields must reference a scaleId in metadata');
    }

    // Business rule: Validate conditional logic references
    this.conditionalLogic.forEach((logic, index) => {
      if (!logic.dependsOn.trim()) {
        throw new Error(`Conditional logic ${index + 1} must reference a field ID`);
      }
    });
  }

  /**
   * Business logic: Check if field should be visible based on form data
   */
  isVisible(formData: Record<string, any>): boolean {
    if (!this.isActive) return false;

    for (const logic of this.conditionalLogic) {
      if (logic.action === 'show' || logic.action === 'hide') {
        const dependentValue = formData[logic.dependsOn];
        const conditionMet = this.evaluateCondition(dependentValue, logic.condition, logic.value);

        if (logic.action === 'show' && !conditionMet) return false;
        if (logic.action === 'hide' && conditionMet) return false;
      }
    }

    return true;
  }

  /**
   * Business logic: Check if field should be required based on form data
   */
  isRequired(formData: Record<string, any>): boolean {
    let isRequired = this.required;

    for (const logic of this.conditionalLogic) {
      if (logic.action === 'require') {
        const dependentValue = formData[logic.dependsOn];
        const conditionMet = this.evaluateCondition(dependentValue, logic.condition, logic.value);
        
        if (conditionMet) {
          isRequired = true;
        }
      }
    }

    return isRequired;
  }

  /**
   * Business logic: Check if field should be disabled
   */
  isDisabled(formData: Record<string, any>): boolean {
    for (const logic of this.conditionalLogic) {
      if (logic.action === 'disable') {
        const dependentValue = formData[logic.dependsOn];
        const conditionMet = this.evaluateCondition(dependentValue, logic.condition, logic.value);
        
        if (conditionMet) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Business logic: Validate field value
   */
  validateValue(value: any, formData: Record<string, any> = {}): string[] {
    const errors: string[] = [];

    // Check if field is required
    if (this.isRequired(formData) && this.isEmpty(value)) {
      errors.push(`${this.label} is required`);
      return errors; // Don't validate other rules if required field is empty
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value)) {
      return errors;
    }

    // Apply validation rules
    for (const rule of this.validations) {
      const error = this.validateRule(value, rule);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * Business logic: Evaluate conditional logic condition
   */
  private evaluateCondition(actualValue: any, condition: string, expectedValue: any): boolean {
    switch (condition) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'contains':
        return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);
      case 'less_than':
        return Number(actualValue) < Number(expectedValue);
      default:
        return false;
    }
  }

  /**
   * Check if value is empty
   */
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  /**
   * Validate individual rule
   */
  private validateRule(value: any, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'required':
        return this.isEmpty(value) ? rule.message : null;

      case 'minLength':
        return String(value).length < rule.value ? rule.message : null;

      case 'maxLength':
        return String(value).length > rule.value ? rule.message : null;

      case 'pattern':
        const regex = new RegExp(rule.value);
        return !regex.test(String(value)) ? rule.message : null;

      case 'custom':
        // Custom validation would be handled by the application layer
        return null;

      default:
        return null;
    }
  }

  /**
   * Business logic: Get default value for field
   */
  getDefaultValue(): any {
    if (this.defaultValue !== undefined) {
      return this.defaultValue;
    }

    switch (this.type) {
      case 'checkbox':
        return false;
      case 'number':
      case 'scale':
        return 0;
      case 'date':
        return '';
      default:
        return '';
    }
  }
}

export type FormStatus = 'draft' | 'published' | 'archived';
export type FormAccessLevel = 'public' | 'private' | 'restricted';

export class Form {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly fields: FormField[],
    public readonly status: FormStatus = 'draft',
    public readonly accessLevel: FormAccessLevel = 'private',
    public readonly allowedUserRoles: string[] = [],
    public readonly isTemplate: boolean = false,
    public readonly templateCategory?: string,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdBy: string = '',
    public readonly version: number = 1,
    public readonly settings: {
      allowMultipleSubmissions?: boolean;
      showProgressBar?: boolean;
      saveAsDraft?: boolean;
      requireSignature?: boolean;
      expireAfterDays?: number;
      notificationSettings?: {
        sendToCreator?: boolean;
        sendToPatient?: boolean;
        emailTemplate?: string;
      };
    } = {},
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly publishedAt?: Date
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate form integrity
   */
  private validate(): void {
    // Business rule: Form must have name
    if (!this.name.trim()) {
      throw new Error('Form name is required');
    }

    // Business rule: Form must have at least one field
    if (this.fields.length === 0) {
      throw new Error('Form must have at least one field');
    }

    // Business rule: Field names must be unique
    const fieldNames = this.fields.map(f => f.name);
    const uniqueNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueNames.size) {
      throw new Error('Field names must be unique within a form');
    }

    // Business rule: Field IDs must be unique
    const fieldIds = this.fields.map(f => f.id);
    const uniqueIds = new Set(fieldIds);
    if (fieldIds.length !== uniqueIds.size) {
      throw new Error('Field IDs must be unique within a form');
    }

    // Business rule: Cannot have both clinic and workspace
    if (this.clinicId && this.workspaceId) {
      throw new Error('Form cannot belong to both clinic and workspace');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Form must belong to either clinic or workspace');
    }

    // Business rule: Published forms cannot be empty
    if (this.status === 'published' && this.fields.length === 0) {
      throw new Error('Published forms must have fields');
    }

    // Business rule: Validate conditional logic references exist
    this.fields.forEach(field => {
      field.conditionalLogic.forEach(logic => {
        const referencedField = this.fields.find(f => f.id === logic.dependsOn);
        if (!referencedField) {
          throw new Error(`Field ${field.name} references non-existent field ${logic.dependsOn}`);
        }
      });
    });
  }

  /**
   * Business logic: Check if form can be published
   */
  canBePublished(): boolean {
    return this.status === 'draft' && 
           this.fields.length > 0 &&
           this.fields.some(f => f.isActive);
  }

  /**
   * Business logic: Check if form can be edited
   */
  canBeEdited(): boolean {
    return this.status !== 'archived';
  }

  /**
   * Business logic: Get visible fields based on form data
   */
  getVisibleFields(formData: Record<string, any> = {}): FormField[] {
    return this.fields
      .filter(field => field.isVisible(formData))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Business logic: Validate entire form data
   */
  validateFormData(formData: Record<string, any>): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    const visibleFields = this.getVisibleFields(formData);

    visibleFields.forEach(field => {
      const fieldErrors = field.validateValue(formData[field.name], formData);
      if (fieldErrors.length > 0) {
        errors[field.name] = fieldErrors;
      }
    });

    return errors;
  }

  /**
   * Business logic: Check if form data is complete
   */
  isFormComplete(formData: Record<string, any>): boolean {
    const errors = this.validateFormData(formData);
    return Object.keys(errors).length === 0;
  }

  /**
   * Business logic: Get completion percentage
   */
  getCompletionPercentage(formData: Record<string, any>): number {
    const visibleFields = this.getVisibleFields(formData);
    const requiredFields = visibleFields.filter(field => field.isRequired(formData));
    
    if (requiredFields.length === 0) return 100;

    const completedFields = requiredFields.filter(field => {
      const value = formData[field.name];
      return !field.validateValue(value, formData).length;
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  /**
   * Business logic: Publish form
   */
  publish(): Form {
    if (!this.canBePublished()) {
      throw new Error('Form cannot be published in current state');
    }

    return new Form(
      this.id,
      this.name,
      this.description,
      this.fields,
      'published',
      this.accessLevel,
      this.allowedUserRoles,
      this.isTemplate,
      this.templateCategory,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.version + 1,
      this.settings,
      this.createdAt,
      new Date(),
      new Date()
    );
  }

  /**
   * Business logic: Archive form
   */
  archive(): Form {
    return new Form(
      this.id,
      this.name,
      this.description,
      this.fields,
      'archived',
      this.accessLevel,
      this.allowedUserRoles,
      this.isTemplate,
      this.templateCategory,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.version,
      this.settings,
      this.createdAt,
      new Date(),
      this.publishedAt
    );
  }

  /**
   * Business logic: Add field to form
   */
  addField(field: FormField): Form {
    if (!this.canBeEdited()) {
      throw new Error('Cannot modify archived form');
    }

    // Check for duplicate names/IDs
    if (this.fields.some(f => f.name === field.name)) {
      throw new Error(`Field name '${field.name}' already exists`);
    }

    if (this.fields.some(f => f.id === field.id)) {
      throw new Error(`Field ID '${field.id}' already exists`);
    }

    const updatedFields = [...this.fields, field];

    return new Form(
      this.id,
      this.name,
      this.description,
      updatedFields,
      this.status,
      this.accessLevel,
      this.allowedUserRoles,
      this.isTemplate,
      this.templateCategory,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.version,
      this.settings,
      this.createdAt,
      new Date(),
      this.publishedAt
    );
  }

  /**
   * Business logic: Remove field from form
   */
  removeField(fieldId: string): Form {
    if (!this.canBeEdited()) {
      throw new Error('Cannot modify archived form');
    }

    const updatedFields = this.fields.filter(f => f.id !== fieldId);

    return new Form(
      this.id,
      this.name,
      this.description,
      updatedFields,
      this.status,
      this.accessLevel,
      this.allowedUserRoles,
      this.isTemplate,
      this.templateCategory,
      this.clinicId,
      this.workspaceId,
      this.createdBy,
      this.version,
      this.settings,
      this.createdAt,
      new Date(),
      this.publishedAt
    );
  }
}