/**
 * Form Repository Interface
 * Defines the contract for form data operations - Pure abstraction
 */

import { Form } from '../entities/Form';

export interface FormFilters {
  clinicId?: string;
  workspaceId?: string;
  status?: 'draft' | 'published' | 'archived';
  isTemplate?: boolean;
  templateCategory?: string;
  createdBy?: string;
  accessLevel?: 'public' | 'private' | 'restricted';
  includeArchived?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface FormRepository {
  /**
   * Find form by ID
   */
  findById(id: string): Promise<Form | null>;

  /**
   * Find form by name within a tenant context
   */
  findByName(name: string, context: { clinicId?: string; workspaceId?: string }): Promise<Form | null>;

  /**
   * Find all forms matching filters
   */
  findAll(filters?: FormFilters): Promise<Form[]>;

  /**
   * Search forms by name or description
   */
  search(query: string, filters?: FormFilters): Promise<Form[]>;

  /**
   * Get forms by category (for templates)
   */
  findByCategory(category: string, filters?: FormFilters): Promise<Form[]>;

  /**
   * Get forms accessible to specific user role
   */
  findByUserRole(role: string, filters?: FormFilters): Promise<Form[]>;

  /**
   * Create new form
   */
  create(form: Form): Promise<Form>;

  /**
   * Update existing form
   */
  update(form: Form): Promise<Form>;

  /**
   * Delete form (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Archive form (soft delete)
   */
  archive(id: string): Promise<Form>;

  /**
   * Restore archived form
   */
  restore(id: string): Promise<Form>;

  /**
   * Publish form (change status from draft to published)
   */
  publish(id: string): Promise<Form>;

  /**
   * Create form from template
   */
  createFromTemplate(templateId: string, overrides: Partial<Form>): Promise<Form>;

  /**
   * Duplicate existing form
   */
  duplicate(id: string, newName: string): Promise<Form>;

  /**
   * Get form usage statistics
   */
  getStats(filters?: FormFilters): Promise<{
    totalForms: number;
    publishedForms: number;
    draftForms: number;
    archivedForms: number;
    templateForms: number;
    formsByCategory: Record<string, number>;
  }>;

  /**
   * Get recently created forms
   */
  getRecentForms(limit?: number, filters?: FormFilters): Promise<Form[]>;

  /**
   * Get popular forms (by submission count)
   */
  getPopularForms(limit?: number, filters?: FormFilters): Promise<Array<{
    form: Form;
    submissionCount: number;
  }>>;

  /**
   * Check if form name is available in context
   */
  isNameAvailable(name: string, context: { clinicId?: string; workspaceId?: string }, excludeId?: string): Promise<boolean>;

  /**
   * Get forms that reference a specific field type or scale
   */
  findByFieldType(fieldType: string, filters?: FormFilters): Promise<Form[]>;

  /**
   * Get forms with specific settings
   */
  findWithSettings(settingsQuery: Record<string, any>, filters?: FormFilters): Promise<Form[]>;
}