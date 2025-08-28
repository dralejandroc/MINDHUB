/**
 * Create Form Use Case
 * Application business rules for form creation
 */

import { Form, FormField } from '../entities/Form';
import { FormRepository } from '../repositories/FormRepository';

export interface CreateFormRequest {
  name: string;
  description: string;
  fields: FormField[];
  accessLevel?: 'public' | 'private' | 'restricted';
  allowedUserRoles?: string[];
  isTemplate?: boolean;
  templateCategory?: string;
  clinicId?: string;
  workspaceId?: string;
  settings?: {
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
  };
}

export class CreateFormUseCase {
  constructor(
    private formRepository: FormRepository
  ) {}

  async execute(request: CreateFormRequest): Promise<Form> {
    // Business rule: Validate request data
    this.validateRequest(request);

    // Business rule: Check for duplicate names in the same tenant context
    await this.checkForDuplicateName(request.name, request.clinicId, request.workspaceId);

    // Business rule: Validate field structure
    this.validateFields(request.fields);

    // Generate unique ID
    const formId = this.generateFormId();

    // Create form entity with business rules validation
    const form = new Form(
      formId,
      request.name,
      request.description,
      request.fields,
      'draft', // All new forms start as draft
      request.accessLevel || 'private',
      request.allowedUserRoles || [],
      request.isTemplate || false,
      request.templateCategory,
      request.clinicId,
      request.workspaceId,
      '', // createdBy will be set by repository based on context
      1, // version starts at 1
      request.settings || {},
      new Date(),
      new Date()
    );

    // Persist through repository
    return await this.formRepository.create(form);
  }

  /**
   * Business rule: Validate request completeness
   */
  private validateRequest(request: CreateFormRequest): void {
    if (!request.name?.trim()) {
      throw new Error('Form name is required');
    }

    if (!request.description?.trim()) {
      throw new Error('Form description is required');
    }

    if (!request.fields || request.fields.length === 0) {
      throw new Error('At least one field is required');
    }

    // Business rule: Must specify either clinic or workspace
    if (!request.clinicId && !request.workspaceId) {
      throw new Error('Form must belong to either a clinic or workspace');
    }

    // Business rule: Cannot belong to both clinic and workspace
    if (request.clinicId && request.workspaceId) {
      throw new Error('Form cannot belong to both clinic and workspace');
    }

    // Business rule: Template forms must have category
    if (request.isTemplate && !request.templateCategory?.trim()) {
      throw new Error('Template forms must have a category');
    }

    // Business rule: Validate expiration settings
    if (request.settings?.expireAfterDays !== undefined && request.settings.expireAfterDays <= 0) {
      throw new Error('Expiration days must be greater than 0');
    }
  }

  /**
   * Business rule: Check for duplicate form names
   */
  private async checkForDuplicateName(name: string, clinicId?: string, workspaceId?: string): Promise<void> {
    const existingForm = await this.formRepository.findByName(name, { clinicId, workspaceId });
    
    if (existingForm) {
      throw new Error(`A form with name "${name}" already exists in this context`);
    }
  }

  /**
   * Business rule: Validate field structure and relationships
   */
  private validateFields(fields: FormField[]): void {
    const fieldNames = new Set<string>();
    const fieldIds = new Set<string>();

    fields.forEach((field, index) => {
      // Check for duplicate field names
      if (fieldNames.has(field.name)) {
        throw new Error(`Duplicate field name "${field.name}" found`);
      }
      fieldNames.add(field.name);

      // Check for duplicate field IDs
      if (fieldIds.has(field.id)) {
        throw new Error(`Duplicate field ID "${field.id}" found`);
      }
      fieldIds.add(field.id);

      // Validate conditional logic references
      field.conditionalLogic.forEach(logic => {
        const referencedField = fields.find(f => f.id === logic.dependsOn);
        if (!referencedField) {
          throw new Error(`Field "${field.name}" references non-existent field "${logic.dependsOn}"`);
        }

        // Business rule: Fields cannot depend on themselves
        if (logic.dependsOn === field.id) {
          throw new Error(`Field "${field.name}" cannot depend on itself`);
        }

        // Business rule: No circular dependencies
        this.checkCircularDependency(field, fields, [field.id]);
      });
    });

    // Business rule: At least one active field
    const activeFields = fields.filter(f => f.isActive);
    if (activeFields.length === 0) {
      throw new Error('Form must have at least one active field');
    }
  }

  /**
   * Business rule: Prevent circular dependencies in conditional logic
   */
  private checkCircularDependency(field: FormField, allFields: FormField[], visited: string[]): void {
    field.conditionalLogic.forEach(logic => {
      if (visited.includes(logic.dependsOn)) {
        throw new Error(`Circular dependency detected involving field "${field.name}"`);
      }

      const dependentField = allFields.find(f => f.id === logic.dependsOn);
      if (dependentField && dependentField.conditionalLogic.length > 0) {
        this.checkCircularDependency(dependentField, allFields, [...visited, logic.dependsOn]);
      }
    });
  }

  /**
   * Generate unique form ID
   */
  private generateFormId(): string {
    return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}