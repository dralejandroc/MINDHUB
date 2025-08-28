/**
 * SystemSettings Entity  
 * Domain entity for system-wide configuration and settings management
 */

export type SettingType = 
  | 'string'
  | 'number' 
  | 'boolean'
  | 'json'
  | 'encrypted'
  | 'file'
  | 'array'
  | 'date'
  | 'time'
  | 'duration'
  | 'url'
  | 'email'
  | 'phone';

export type SettingCategory = 
  | 'general'
  | 'security'
  | 'notifications'
  | 'integrations'
  | 'appearance'
  | 'workflow'
  | 'reporting'
  | 'backup'
  | 'compliance'
  | 'performance'
  | 'custom';

export type SettingScope = 'system' | 'clinic' | 'workspace' | 'user' | 'role';

export type SettingStatus = 'active' | 'inactive' | 'deprecated' | 'experimental';

export interface SettingValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  allowedValues?: any[];
  customValidator?: string; // Function name or expression
  dependsOn?: string[]; // Other setting keys this depends on
}

export interface SettingMetadata {
  label: string;
  description: string;
  helpText?: string;
  placeholder?: string;
  group: string;
  order: number;
  icon?: string;
  isAdvanced: boolean;
  requiresRestart: boolean;
  isSecret: boolean;
  tags: string[];
}

export interface SettingHistory {
  changedAt: Date;
  changedBy: string;
  previousValue: any;
  newValue: any;
  reason?: string;
  source: 'manual' | 'import' | 'migration' | 'api' | 'sync';
}

export interface SettingConstraints {
  editableByRole: string[];
  viewableByRole: string[];
  environment: ('development' | 'staging' | 'production')[];
  feature: string[]; // Feature flags that must be enabled
  license: string[]; // License types that allow this setting
}

export class SystemSettings {
  constructor(
    public readonly id: string,
    public readonly key: string,
    public readonly value: any,
    public readonly type: SettingType,
    public readonly category: SettingCategory,
    public readonly scope: SettingScope,
    public readonly status: SettingStatus,
    public readonly validation: SettingValidation,
    public readonly metadata: SettingMetadata,
    public readonly constraints: SettingConstraints,
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly userId?: string,
    public readonly roleId?: string,
    public readonly defaultValue: any = null,
    public readonly inheritedValue: any = null,
    public readonly isOverridden: boolean = false,
    public readonly isEncrypted: boolean = false,
    public readonly lastSyncedAt?: Date,
    public readonly syncSource?: string,
    public readonly history: SettingHistory[] = [],
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly version: number = 1
  ) {
    this.validateSetting();
  }

  private validateSetting(): void {
    if (!this.id.trim()) {
      throw new Error('Setting ID is required');
    }

    if (!this.key.trim()) {
      throw new Error('Setting key is required');
    }

    if (!this.key.match(/^[a-zA-Z0-9._-]+$/)) {
      throw new Error('Setting key must contain only alphanumeric characters, dots, underscores, and hyphens');
    }

    // Scope validation
    if (this.scope === 'clinic' && !this.clinicId) {
      throw new Error('Clinic ID is required for clinic-scoped settings');
    }

    if (this.scope === 'workspace' && !this.workspaceId) {
      throw new Error('Workspace ID is required for workspace-scoped settings');
    }

    if (this.scope === 'user' && !this.userId) {
      throw new Error('User ID is required for user-scoped settings');
    }

    if (this.scope === 'role' && !this.roleId) {
      throw new Error('Role ID is required for role-scoped settings');
    }

    // Type validation
    this.validateValueType();

    // Custom validation
    this.validateCustomRules();
  }

  private validateValueType(): void {
    if (this.value === null || this.value === undefined) {
      if (this.validation.required) {
        throw new Error(`Setting ${this.key} is required but has no value`);
      }
      return;
    }

    switch (this.type) {
      case 'string':
        if (typeof this.value !== 'string') {
          throw new Error(`Setting ${this.key} must be a string`);
        }
        break;
      
      case 'number':
        if (typeof this.value !== 'number') {
          throw new Error(`Setting ${this.key} must be a number`);
        }
        break;
      
      case 'boolean':
        if (typeof this.value !== 'boolean') {
          throw new Error(`Setting ${this.key} must be a boolean`);
        }
        break;
      
      case 'json':
        if (typeof this.value !== 'object') {
          throw new Error(`Setting ${this.key} must be a valid JSON object`);
        }
        break;
      
      case 'array':
        if (!Array.isArray(this.value)) {
          throw new Error(`Setting ${this.key} must be an array`);
        }
        break;
      
      case 'date':
        if (!(this.value instanceof Date) && !this.isValidDateString(this.value)) {
          throw new Error(`Setting ${this.key} must be a valid date`);
        }
        break;
      
      case 'url':
        if (typeof this.value !== 'string' || !this.isValidUrl(this.value)) {
          throw new Error(`Setting ${this.key} must be a valid URL`);
        }
        break;
      
      case 'email':
        if (typeof this.value !== 'string' || !this.isValidEmail(this.value)) {
          throw new Error(`Setting ${this.key} must be a valid email address`);
        }
        break;
    }
  }

  private validateCustomRules(): void {
    const validation = this.validation;
    
    if (validation.minLength && typeof this.value === 'string' && this.value.length < validation.minLength) {
      throw new Error(`Setting ${this.key} must be at least ${validation.minLength} characters long`);
    }

    if (validation.maxLength && typeof this.value === 'string' && this.value.length > validation.maxLength) {
      throw new Error(`Setting ${this.key} must be at most ${validation.maxLength} characters long`);
    }

    if (validation.minValue && typeof this.value === 'number' && this.value < validation.minValue) {
      throw new Error(`Setting ${this.key} must be at least ${validation.minValue}`);
    }

    if (validation.maxValue && typeof this.value === 'number' && this.value > validation.maxValue) {
      throw new Error(`Setting ${this.key} must be at most ${validation.maxValue}`);
    }

    if (validation.pattern && typeof this.value === 'string' && !new RegExp(validation.pattern).test(this.value)) {
      throw new Error(`Setting ${this.key} does not match required pattern`);
    }

    if (validation.allowedValues && !validation.allowedValues.includes(this.value)) {
      throw new Error(`Setting ${this.key} must be one of: ${validation.allowedValues.join(', ')}`);
    }
  }

  // Business Logic Methods

  canBeModified(): boolean {
    return this.isActive && 
           this.status === 'active' &&
           !this.metadata.isSecret;
  }

  canBeViewed(userRole: string): boolean {
    return this.constraints.viewableByRole.includes(userRole) ||
           this.constraints.editableByRole.includes(userRole);
  }

  canBeEdited(userRole: string): boolean {
    return this.constraints.editableByRole.includes(userRole);
  }

  canBeDeleted(): boolean {
    return this.scope !== 'system' && 
           this.status !== 'deprecated' &&
           !this.metadata.isSecret;
  }

  canBeInherited(): boolean {
    return this.scope !== 'system' && 
           this.inheritedValue !== null &&
           !this.isOverridden;
  }

  requiresRestart(): boolean {
    return this.metadata.requiresRestart;
  }

  isSecret(): boolean {
    return this.metadata.isSecret || 
           this.type === 'encrypted' ||
           this.isEncrypted;
  }

  isValid(): boolean {
    try {
      this.validateValueType();
      this.validateCustomRules();
      return true;
    } catch {
      return false;
    }
  }

  getDisplayValue(): any {
    if (this.isSecret()) {
      return '••••••••';
    }
    
    if (this.type === 'json') {
      return JSON.stringify(this.value, null, 2);
    }
    
    return this.value;
  }

  getEffectiveValue(): any {
    if (this.isOverridden || this.inheritedValue === null) {
      return this.value;
    }
    
    return this.inheritedValue;
  }

  hasChanged(): boolean {
    return this.history.length > 0;
  }

  getLastChange(): SettingHistory | undefined {
    return this.history[this.history.length - 1];
  }

  // State Transformation Methods

  updateValue(newValue: any, updatedBy: string, reason?: string): SystemSettings {
    // Validate new value
    const tempSetting = new SystemSettings(
      this.id,
      this.key,
      newValue,
      this.type,
      this.category,
      this.scope,
      this.status,
      this.validation,
      this.metadata,
      this.constraints,
      this.clinicId,
      this.workspaceId,
      this.userId,
      this.roleId,
      this.defaultValue,
      this.inheritedValue,
      true, // Mark as overridden
      this.isEncrypted,
      this.lastSyncedAt,
      this.syncSource,
      this.history,
      this.isActive,
      this.createdAt,
      new Date(),
      this.version + 1
    );

    // Add history entry
    const historyEntry: SettingHistory = {
      changedAt: new Date(),
      changedBy: updatedBy,
      previousValue: this.value,
      newValue,
      reason,
      source: 'manual'
    };

    return new SystemSettings(
      this.id,
      this.key,
      newValue,
      this.type,
      this.category,
      this.scope,
      this.status,
      this.validation,
      this.metadata,
      this.constraints,
      this.clinicId,
      this.workspaceId,
      this.userId,
      this.roleId,
      this.defaultValue,
      this.inheritedValue,
      true,
      this.isEncrypted,
      this.lastSyncedAt,
      this.syncSource,
      [...this.history, historyEntry],
      this.isActive,
      this.createdAt,
      new Date(),
      this.version + 1
    );
  }

  resetToDefault(resetBy: string): SystemSettings {
    if (this.defaultValue === null) {
      throw new Error('No default value available for this setting');
    }

    return this.updateValue(this.defaultValue, resetBy, 'Reset to default value');
  }

  resetToInherited(resetBy: string): SystemSettings {
    if (this.inheritedValue === null) {
      throw new Error('No inherited value available for this setting');
    }

    const historyEntry: SettingHistory = {
      changedAt: new Date(),
      changedBy: resetBy,
      previousValue: this.value,
      newValue: this.inheritedValue,
      reason: 'Reset to inherited value',
      source: 'manual'
    };

    return new SystemSettings(
      this.id,
      this.key,
      this.inheritedValue,
      this.type,
      this.category,
      this.scope,
      this.status,
      this.validation,
      this.metadata,
      this.constraints,
      this.clinicId,
      this.workspaceId,
      this.userId,
      this.roleId,
      this.defaultValue,
      this.inheritedValue,
      false, // No longer overridden
      this.isEncrypted,
      this.lastSyncedAt,
      this.syncSource,
      [...this.history, historyEntry],
      this.isActive,
      this.createdAt,
      new Date(),
      this.version + 1
    );
  }

  updateStatus(newStatus: SettingStatus, updatedBy: string): SystemSettings {
    return new SystemSettings(
      this.id,
      this.key,
      this.value,
      this.type,
      this.category,
      this.scope,
      newStatus,
      this.validation,
      this.metadata,
      this.constraints,
      this.clinicId,
      this.workspaceId,
      this.userId,
      this.roleId,
      this.defaultValue,
      this.inheritedValue,
      this.isOverridden,
      this.isEncrypted,
      this.lastSyncedAt,
      this.syncSource,
      this.history,
      newStatus === 'active',
      this.createdAt,
      new Date(),
      this.version + 1
    );
  }

  encrypt(encryptionKey: string): SystemSettings {
    if (this.isEncrypted) {
      return this;
    }

    // In a real implementation, this would use proper encryption
    const encryptedValue = `encrypted:${btoa(JSON.stringify(this.value))}`;

    return new SystemSettings(
      this.id,
      this.key,
      encryptedValue,
      this.type === 'string' ? 'encrypted' : this.type,
      this.category,
      this.scope,
      this.status,
      this.validation,
      { ...this.metadata, isSecret: true },
      this.constraints,
      this.clinicId,
      this.workspaceId,
      this.userId,
      this.roleId,
      this.defaultValue,
      this.inheritedValue,
      this.isOverridden,
      true, // isEncrypted
      this.lastSyncedAt,
      this.syncSource,
      this.history,
      this.isActive,
      this.createdAt,
      new Date(),
      this.version + 1
    );
  }

  decrypt(encryptionKey: string): SystemSettings {
    if (!this.isEncrypted) {
      return this;
    }

    // In a real implementation, this would use proper decryption
    let decryptedValue = this.value;
    if (typeof this.value === 'string' && this.value.startsWith('encrypted:')) {
      try {
        decryptedValue = JSON.parse(atob(this.value.replace('encrypted:', '')));
      } catch {
        throw new Error('Failed to decrypt setting value');
      }
    }

    return new SystemSettings(
      this.id,
      this.key,
      decryptedValue,
      this.type === 'encrypted' ? 'string' : this.type,
      this.category,
      this.scope,
      this.status,
      this.validation,
      { ...this.metadata, isSecret: false },
      this.constraints,
      this.clinicId,
      this.workspaceId,
      this.userId,
      this.roleId,
      this.defaultValue,
      this.inheritedValue,
      this.isOverridden,
      false, // isEncrypted
      this.lastSyncedAt,
      this.syncSource,
      this.history,
      this.isActive,
      this.createdAt,
      new Date(),
      this.version + 1
    );
  }

  sync(source: string, syncedBy: string): SystemSettings {
    return new SystemSettings(
      this.id,
      this.key,
      this.value,
      this.type,
      this.category,
      this.scope,
      this.status,
      this.validation,
      this.metadata,
      this.constraints,
      this.clinicId,
      this.workspaceId,
      this.userId,
      this.roleId,
      this.defaultValue,
      this.inheritedValue,
      this.isOverridden,
      this.isEncrypted,
      new Date(), // lastSyncedAt
      source, // syncSource
      this.history,
      this.isActive,
      this.createdAt,
      new Date(),
      this.version
    );
  }

  // Helper Methods

  private isValidDateString(value: any): boolean {
    return typeof value === 'string' && !isNaN(Date.parse(value));
  }

  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  // Static Factory Methods

  static createSystem(
    id: string,
    key: string,
    value: any,
    type: SettingType,
    category: SettingCategory,
    metadata: SettingMetadata,
    validation: SettingValidation = { required: false },
    constraints: SettingConstraints = {
      editableByRole: ['admin'],
      viewableByRole: ['admin'],
      environment: ['development', 'staging', 'production'],
      feature: [],
      license: []
    }
  ): SystemSettings {
    return new SystemSettings(
      id,
      key,
      value,
      type,
      category,
      'system',
      'active',
      validation,
      metadata,
      constraints,
      undefined, // No clinic
      undefined, // No workspace
      undefined, // No user
      undefined, // No role
      value // Default value same as initial value
    );
  }

  static createClinic(
    id: string,
    key: string,
    value: any,
    type: SettingType,
    category: SettingCategory,
    clinicId: string,
    metadata: SettingMetadata,
    inheritedValue?: any
  ): SystemSettings {
    return new SystemSettings(
      id,
      key,
      value,
      type,
      category,
      'clinic',
      'active',
      { required: false },
      metadata,
      {
        editableByRole: ['clinic_admin', 'admin'],
        viewableByRole: ['clinic_admin', 'admin', 'clinic_user'],
        environment: ['development', 'staging', 'production'],
        feature: [],
        license: []
      },
      clinicId,
      undefined,
      undefined,
      undefined,
      inheritedValue || value,
      inheritedValue,
      inheritedValue !== null && inheritedValue !== value
    );
  }

  static createUser(
    id: string,
    key: string,
    value: any,
    type: SettingType,
    category: SettingCategory,
    userId: string,
    metadata: SettingMetadata,
    inheritedValue?: any
  ): SystemSettings {
    return new SystemSettings(
      id,
      key,
      value,
      type,
      category,
      'user',
      'active',
      { required: false },
      metadata,
      {
        editableByRole: ['user', 'admin'],
        viewableByRole: ['user', 'admin'],
        environment: ['development', 'staging', 'production'],
        feature: [],
        license: []
      },
      undefined,
      undefined,
      userId,
      undefined,
      inheritedValue || value,
      inheritedValue,
      inheritedValue !== null && inheritedValue !== value
    );
  }
}