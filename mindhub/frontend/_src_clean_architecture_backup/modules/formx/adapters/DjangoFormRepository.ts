/**
 * Django Form Repository Adapter
 * Implements FormRepository interface using Django REST API
 */

import { Form, FormField, FormFieldType, ValidationRule, ConditionalLogic, FormFieldOption } from '../entities/Form';
import { FormRepository, FormFilters } from '../repositories/FormRepository';

interface DjangoFormResponse {
  id: string;
  name: string;
  description: string;
  fields: DjangoFormFieldResponse[];
  status: 'draft' | 'published' | 'archived';
  access_level: 'public' | 'private' | 'restricted';
  allowed_user_roles: string[];
  is_template: boolean;
  template_category?: string;
  clinic_id?: string;
  workspace_id?: string;
  created_by: string;
  version: number;
  settings: any;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface DjangoFormFieldResponse {
  id: string;
  type: FormFieldType;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  default_value?: any;
  options: DjangoFormFieldOptionResponse[];
  validations: DjangoValidationRuleResponse[];
  conditional_logic: DjangoConditionalLogicResponse[];
  order: number;
  section_id?: string;
  metadata: Record<string, any>;
  is_active: boolean;
}

interface DjangoFormFieldOptionResponse {
  value: string;
  label: string;
  is_default?: boolean;
}

interface DjangoValidationRuleResponse {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

interface DjangoConditionalLogicResponse {
  depends_on: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'require' | 'disable';
}

export class DjangoFormRepository implements FormRepository {
  private baseUrl: string;

  constructor(baseUrl = '/api/formx/django') {
    this.baseUrl = baseUrl;
  }

  async findById(id: string): Promise<Form | null> {
    try {
      const response = await fetch(`${this.baseUrl}/forms/${id}/`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch form: ${response.statusText}`);
      }

      const data: DjangoFormResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error fetching form by ID:', error);
      throw error;
    }
  }

  async findByName(name: string, context: { clinicId?: string; workspaceId?: string }): Promise<Form | null> {
    try {
      const params = new URLSearchParams();
      params.append('name', name);
      
      if (context.clinicId) {
        params.append('clinic_id', context.clinicId);
      }
      if (context.workspaceId) {
        params.append('workspace_id', context.workspaceId);
      }

      const response = await fetch(`${this.baseUrl}/forms/by-name/?${params.toString()}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch form by name: ${response.statusText}`);
      }

      const data: DjangoFormResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error fetching form by name:', error);
      throw error;
    }
  }

  async findAll(filters?: FormFilters): Promise<Form[]> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await fetch(`${this.baseUrl}/forms/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch forms: ${response.statusText}`);
      }

      const data: { results: DjangoFormResponse[] } = await response.json();
      return data.results.map(form => this.mapToEntity(form));
    } catch (error) {
      console.error('Error fetching forms:', error);
      throw error;
    }
  }

  async search(query: string, filters?: FormFilters): Promise<Form[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('search', query);
      
      const response = await fetch(`${this.baseUrl}/forms/search/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search forms: ${response.statusText}`);
      }

      const data: { results: DjangoFormResponse[] } = await response.json();
      return data.results.map(form => this.mapToEntity(form));
    } catch (error) {
      console.error('Error searching forms:', error);
      throw error;
    }
  }

  async findByCategory(category: string, filters?: FormFilters): Promise<Form[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('template_category', category);
      
      const response = await fetch(`${this.baseUrl}/forms/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch forms by category: ${response.statusText}`);
      }

      const data: { results: DjangoFormResponse[] } = await response.json();
      return data.results.map(form => this.mapToEntity(form));
    } catch (error) {
      console.error('Error fetching forms by category:', error);
      throw error;
    }
  }

  async findByUserRole(role: string, filters?: FormFilters): Promise<Form[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('user_role', role);
      
      const response = await fetch(`${this.baseUrl}/forms/by-role/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch forms by user role: ${response.statusText}`);
      }

      const data: { results: DjangoFormResponse[] } = await response.json();
      return data.results.map(form => this.mapToEntity(form));
    } catch (error) {
      console.error('Error fetching forms by user role:', error);
      throw error;
    }
  }

  async create(form: Form): Promise<Form> {
    try {
      const payload = this.mapToPayload(form);
      
      const response = await fetch(`${this.baseUrl}/forms/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create form: ${errorData.detail || response.statusText}`);
      }

      const data: DjangoFormResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error creating form:', error);
      throw error;
    }
  }

  async update(form: Form): Promise<Form> {
    try {
      const payload = this.mapToPayload(form);
      
      const response = await fetch(`${this.baseUrl}/forms/${form.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update form: ${errorData.detail || response.statusText}`);
      }

      const data: DjangoFormResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error updating form:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/forms/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete form: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      throw error;
    }
  }

  async archive(id: string): Promise<Form> {
    try {
      const response = await fetch(`${this.baseUrl}/forms/${id}/archive/`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to archive form: ${response.statusText}`);
      }

      const data: DjangoFormResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error archiving form:', error);
      throw error;
    }
  }

  async restore(id: string): Promise<Form> {
    try {
      const response = await fetch(`${this.baseUrl}/forms/${id}/restore/`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to restore form: ${response.statusText}`);
      }

      const data: DjangoFormResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error restoring form:', error);
      throw error;
    }
  }

  async publish(id: string): Promise<Form> {
    try {
      const response = await fetch(`${this.baseUrl}/forms/${id}/publish/`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to publish form: ${response.statusText}`);
      }

      const data: DjangoFormResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error publishing form:', error);
      throw error;
    }
  }

  async createFromTemplate(templateId: string, overrides: Partial<Form>): Promise<Form> {
    try {
      const response = await fetch(`${this.baseUrl}/forms/${templateId}/create-from-template/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: overrides.name,
          description: overrides.description,
          clinic_id: overrides.clinicId,
          workspace_id: overrides.workspaceId,
          settings: overrides.settings,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create form from template: ${response.statusText}`);
      }

      const data: DjangoFormResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error creating form from template:', error);
      throw error;
    }
  }

  async duplicate(id: string, newName: string): Promise<Form> {
    try {
      const response = await fetch(`${this.baseUrl}/forms/${id}/duplicate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to duplicate form: ${response.statusText}`);
      }

      const data: DjangoFormResponse = await response.json();
      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error duplicating form:', error);
      throw error;
    }
  }

  async getStats(filters?: FormFilters): Promise<any> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await fetch(`${this.baseUrl}/forms/stats/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch form stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching form stats:', error);
      throw error;
    }
  }

  async getRecentForms(limit?: number, filters?: FormFilters): Promise<Form[]> {
    try {
      const params = this.buildQueryParams(filters);
      if (limit) {
        params.append('limit', limit.toString());
      }
      
      const response = await fetch(`${this.baseUrl}/forms/recent/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recent forms: ${response.statusText}`);
      }

      const data: { results: DjangoFormResponse[] } = await response.json();
      return data.results.map(form => this.mapToEntity(form));
    } catch (error) {
      console.error('Error fetching recent forms:', error);
      throw error;
    }
  }

  async getPopularForms(limit?: number, filters?: FormFilters): Promise<Array<{ form: Form; submissionCount: number }>> {
    try {
      const params = this.buildQueryParams(filters);
      if (limit) {
        params.append('limit', limit.toString());
      }
      
      const response = await fetch(`${this.baseUrl}/forms/popular/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch popular forms: ${response.statusText}`);
      }

      const data: { results: Array<{ form: DjangoFormResponse; submission_count: number }> } = await response.json();
      return data.results.map(item => ({
        form: this.mapToEntity(item.form),
        submissionCount: item.submission_count
      }));
    } catch (error) {
      console.error('Error fetching popular forms:', error);
      throw error;
    }
  }

  async isNameAvailable(name: string, context: { clinicId?: string; workspaceId?: string }, excludeId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('name', name);
      
      if (context.clinicId) {
        params.append('clinic_id', context.clinicId);
      }
      if (context.workspaceId) {
        params.append('workspace_id', context.workspaceId);
      }
      if (excludeId) {
        params.append('exclude_id', excludeId);
      }

      const response = await fetch(`${this.baseUrl}/forms/name-available/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to check name availability: ${response.statusText}`);
      }

      const data: { available: boolean } = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking name availability:', error);
      throw error;
    }
  }

  async findByFieldType(fieldType: string, filters?: FormFilters): Promise<Form[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('field_type', fieldType);
      
      const response = await fetch(`${this.baseUrl}/forms/by-field-type/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch forms by field type: ${response.statusText}`);
      }

      const data: { results: DjangoFormResponse[] } = await response.json();
      return data.results.map(form => this.mapToEntity(form));
    } catch (error) {
      console.error('Error fetching forms by field type:', error);
      throw error;
    }
  }

  async findWithSettings(settingsQuery: Record<string, any>, filters?: FormFilters): Promise<Form[]> {
    try {
      const params = this.buildQueryParams(filters);
      params.append('settings', JSON.stringify(settingsQuery));
      
      const response = await fetch(`${this.baseUrl}/forms/with-settings/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch forms with settings: ${response.statusText}`);
      }

      const data: { results: DjangoFormResponse[] } = await response.json();
      return data.results.map(form => this.mapToEntity(form));
    } catch (error) {
      console.error('Error fetching forms with settings:', error);
      throw error;
    }
  }

  /**
   * Map Django response to Form entity
   */
  private mapToEntity(data: DjangoFormResponse): Form {
    const fields = data.fields.map(field => new FormField(
      field.id,
      field.type,
      field.label,
      field.name,
      field.required,
      field.placeholder,
      field.description,
      field.default_value,
      field.options.map(opt => ({
        value: opt.value,
        label: opt.label,
        isDefault: opt.is_default
      })),
      field.validations.map(val => ({
        type: val.type,
        value: val.value,
        message: val.message
      })),
      field.conditional_logic.map(logic => ({
        dependsOn: logic.depends_on,
        condition: logic.condition,
        value: logic.value,
        action: logic.action
      })),
      field.order,
      field.section_id,
      field.metadata,
      field.is_active
    ));

    return new Form(
      data.id,
      data.name,
      data.description,
      fields,
      data.status,
      data.access_level,
      data.allowed_user_roles,
      data.is_template,
      data.template_category,
      data.clinic_id,
      data.workspace_id,
      data.created_by,
      data.version,
      data.settings,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.published_at ? new Date(data.published_at) : undefined
    );
  }

  /**
   * Map Form entity to Django payload
   */
  private mapToPayload(form: Form): any {
    return {
      name: form.name,
      description: form.description,
      fields: form.fields.map(field => ({
        id: field.id,
        type: field.type,
        label: field.label,
        name: field.name,
        required: field.required,
        placeholder: field.placeholder,
        description: field.description,
        default_value: field.defaultValue,
        options: field.options.map(opt => ({
          value: opt.value,
          label: opt.label,
          is_default: opt.isDefault
        })),
        validations: field.validations.map(val => ({
          type: val.type,
          value: val.value,
          message: val.message
        })),
        conditional_logic: field.conditionalLogic.map(logic => ({
          depends_on: logic.dependsOn,
          condition: logic.condition,
          value: logic.value,
          action: logic.action
        })),
        order: field.order,
        section_id: field.sectionId,
        metadata: field.metadata,
        is_active: field.isActive
      })),
      status: form.status,
      access_level: form.accessLevel,
      allowed_user_roles: form.allowedUserRoles,
      is_template: form.isTemplate,
      template_category: form.templateCategory,
      clinic_id: form.clinicId,
      workspace_id: form.workspaceId,
      settings: form.settings
    };
  }

  /**
   * Build query parameters from filters
   */
  private buildQueryParams(filters?: FormFilters): URLSearchParams {
    const params = new URLSearchParams();
    
    if (!filters) return params;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else if (typeof value === 'boolean') {
          params.append(key, value.toString());
        } else {
          params.append(key, String(value));
        }
      }
    });

    return params;
  }
}