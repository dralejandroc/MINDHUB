/**
 * Settings Module - Clean Architecture Implementation
 * 
 * This module implements the Settings domain using Clean Architecture principles:
 * 
 * 1. Entities: Pure business objects with domain logic
 * 2. Use Cases: Application-specific business rules  
 * 3. Interface Adapters: Convert data between use cases and external concerns
 * 4. Frameworks & Drivers: External concerns like web, DB, devices, etc.
 * 
 * Domain: System configuration, user preferences, and settings management
 */

// ================================
// ENTITIES (Domain Layer)
// ================================
export { SystemSettings } from './entities/SystemSettings';
export type {
  SettingType,
  SettingCategory,
  SettingScope,
  SettingStatus,
  SettingValidation,
  SettingMetadata,
  SettingHistory,
  SettingConstraints
} from './entities/SystemSettings';

export { UserPreferences } from './entities/UserPreferences';
export type {
  PreferenceCategory,
  NotificationChannel,
  NotificationPriority,
  ThemeMode,
  Language,
  DateFormat,
  TimeFormat,
  NumberFormat,
  AppearancePreferences,
  LocalizationPreferences,
  NotificationPreferences,
  WorkflowPreferences,
  PrivacyPreferences,
  AccessibilityPreferences,
  DashboardPreferences,
  IntegrationPreferences,
  SecurityPreferences,
  PreferenceHistory
} from './entities/UserPreferences';

// ================================
// MODULE METADATA
// ================================
export const SETTINGS_MODULE = {
  name: 'Settings',
  version: '1.0.0',
  domain: 'Configuration and Preferences Management',
  architecture: 'Clean Architecture',
  layers: {
    entities: 2,
    useCases: 0, // To be implemented
    adapters: 0, // To be implemented  
    frameworks: 0 // To be implemented
  },
  capabilities: [
    'System settings management',
    'User preferences customization',
    'Multi-scope configuration (system, clinic, workspace, user)',
    'Settings validation and constraints',
    'Preference history and auditing',
    'Notification preferences management',
    'Appearance and theme customization',
    'Security and privacy controls',
    'Integration and workflow settings',
    'Accessibility support',
    'Settings inheritance and overrides',
    'Encryption for sensitive settings',
    'Import/export configuration',
    'Settings synchronization'
  ]
} as const;