-- =====================================================
-- ClinimetrixPro Database Infrastructure Migration
-- =====================================================
-- Description: Creates core tables for ClinimetrixPro template-based system
-- Date: 2025-08-02
-- Version: 1.0.0

-- =====================================================
-- 1. CLINIMETRIX TEMPLATES TABLE
-- =====================================================
-- Stores JSON-based scale templates for ClinimetrixPro
CREATE TABLE `clinimetrix_templates` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `name` VARCHAR(500) NOT NULL,
    `abbreviation` VARCHAR(50) NOT NULL,
    `version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    `category` VARCHAR(100) NOT NULL,
    `subcategory` VARCHAR(100) NULL,
    `template_json` LONGTEXT NOT NULL,
    `template_hash` VARCHAR(64) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `is_validated` BOOLEAN NOT NULL DEFAULT FALSE,
    `validation_errors` JSON NULL,
    `created_by` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_validated_at` TIMESTAMP NULL,
    `usage_count` INT NOT NULL DEFAULT 0,
    `estimated_duration_minutes` INT NULL,
    `target_population` TEXT NULL,
    `administration_mode` ENUM('self_administered', 'clinician_administered', 'both') NOT NULL DEFAULT 'both',
    `language` VARCHAR(10) NOT NULL DEFAULT 'es',
    `compatibility_level` VARCHAR(20) NOT NULL DEFAULT 'stable',
    INDEX `idx_clinimetrix_templates_category` (`category`),
    INDEX `idx_clinimetrix_templates_abbreviation` (`abbreviation`),
    INDEX `idx_clinimetrix_templates_active` (`is_active`),
    INDEX `idx_clinimetrix_templates_validated` (`is_validated`),
    INDEX `idx_clinimetrix_templates_hash` (`template_hash`),
    INDEX `idx_clinimetrix_templates_created_by` (`created_by`),
    INDEX `idx_clinimetrix_templates_usage` (`usage_count`),
    UNIQUE KEY `uk_clinimetrix_templates_abbreviation_version` (`abbreviation`, `version`),
    CONSTRAINT `fk_clinimetrix_templates_created_by` 
        FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. CLINIMETRIX ASSESSMENTS TABLE
-- =====================================================
-- Stores assessment sessions and responses for ClinimetrixPro
CREATE TABLE `clinimetrix_assessments` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `template_id` VARCHAR(255) NOT NULL,
    `patient_id` VARCHAR(255) NOT NULL,
    `administrator_id` VARCHAR(255) NOT NULL,
    `session_token` VARCHAR(128) NULL,
    `status` ENUM('created', 'started', 'in_progress', 'completed', 'abandoned', 'expired') NOT NULL DEFAULT 'created',
    `administration_type` ENUM('local', 'remote', 'embedded') NOT NULL DEFAULT 'local',
    `responses_json` LONGTEXT NULL,
    `scoring_results` JSON NULL,
    `validity_indicators` JSON NULL,
    `total_score` DECIMAL(10,3) NULL,
    `percentile_score` DECIMAL(5,2) NULL,
    `t_score` DECIMAL(6,2) NULL,
    `z_score` DECIMAL(8,3) NULL,
    `severity_level` VARCHAR(50) NULL,
    `interpretation` TEXT NULL,
    `subscale_scores` JSON NULL,
    `completion_time_seconds` INT NULL,
    `started_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `notes` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `device_info` JSON NULL,
    `progress_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `last_response_at` TIMESTAMP NULL,
    `reminder_count` INT NOT NULL DEFAULT 0,
    `access_count` INT NOT NULL DEFAULT 0,
    INDEX `idx_clinimetrix_assessments_template` (`template_id`),
    INDEX `idx_clinimetrix_assessments_patient` (`patient_id`),
    INDEX `idx_clinimetrix_assessments_administrator` (`administrator_id`),
    INDEX `idx_clinimetrix_assessments_status` (`status`),
    INDEX `idx_clinimetrix_assessments_type` (`administration_type`),
    INDEX `idx_clinimetrix_assessments_created` (`created_at`),
    INDEX `idx_clinimetrix_assessments_completed` (`completed_at`),
    INDEX `idx_clinimetrix_assessments_token` (`session_token`),
    INDEX `idx_clinimetrix_assessments_expires` (`expires_at`),
    INDEX `idx_clinimetrix_assessments_progress` (`progress_percentage`),
    CONSTRAINT `fk_clinimetrix_assessments_template` 
        FOREIGN KEY (`template_id`) REFERENCES `clinimetrix_templates` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_clinimetrix_assessments_patient` 
        FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_clinimetrix_assessments_administrator` 
        FOREIGN KEY (`administrator_id`) REFERENCES `users` (`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. CLINIMETRIX REGISTRY TABLE
-- =====================================================
-- Central catalog/registry for discovering and managing templates
CREATE TABLE `clinimetrix_registry` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `template_id` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(500) NOT NULL,
    `short_description` TEXT NULL,
    `detailed_description` LONGTEXT NULL,
    `keywords` JSON NULL,
    `tags` JSON NULL,
    `difficulty_level` ENUM('basic', 'intermediate', 'advanced', 'expert') NOT NULL DEFAULT 'intermediate',
    `certification_required` BOOLEAN NOT NULL DEFAULT FALSE,
    `certification_details` TEXT NULL,
    `age_groups` JSON NULL,
    `clinical_conditions` JSON NULL,
    `contraindications` JSON NULL,
    `special_considerations` TEXT NULL,
    `psychometric_properties` JSON NULL,
    `bibliography` JSON NULL,
    `normative_data` JSON NULL,
    `cutoff_points` JSON NULL,
    `sensitivity_specificity` JSON NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_recommended` BOOLEAN NOT NULL DEFAULT FALSE,
    `popularity_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `average_rating` DECIMAL(3,2) NULL,
    `total_ratings` INT NOT NULL DEFAULT 0,
    `usage_count_total` INT NOT NULL DEFAULT 0,
    `usage_count_30d` INT NOT NULL DEFAULT 0,
    `last_used_at` TIMESTAMP NULL,
    `published_at` TIMESTAMP NULL,
    `reviewed_at` TIMESTAMP NULL,
    `reviewed_by` VARCHAR(255) NULL,
    `review_notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_clinimetrix_registry_template` (`template_id`),
    INDEX `idx_clinimetrix_registry_featured` (`is_featured`),
    INDEX `idx_clinimetrix_registry_recommended` (`is_recommended`),
    INDEX `idx_clinimetrix_registry_difficulty` (`difficulty_level`),
    INDEX `idx_clinimetrix_registry_certification` (`certification_required`),
    INDEX `idx_clinimetrix_registry_popularity` (`popularity_score`),
    INDEX `idx_clinimetrix_registry_rating` (`average_rating`),
    INDEX `idx_clinimetrix_registry_usage_30d` (`usage_count_30d`),
    INDEX `idx_clinimetrix_registry_published` (`published_at`),
    INDEX `idx_clinimetrix_registry_reviewed` (`reviewed_at`),
    INDEX `idx_clinimetrix_registry_reviewed_by` (`reviewed_by`),
    UNIQUE KEY `uk_clinimetrix_registry_template` (`template_id`),
    CONSTRAINT `fk_clinimetrix_registry_template` 
        FOREIGN KEY (`template_id`) REFERENCES `clinimetrix_templates` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_clinimetrix_registry_reviewed_by` 
        FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. CLINIMETRIX ASSESSMENT RESPONSES TABLE
-- =====================================================
-- Detailed response tracking for analytics and validation
CREATE TABLE `clinimetrix_assessment_responses` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `assessment_id` VARCHAR(255) NOT NULL,
    `item_number` INT NOT NULL,
    `item_id` VARCHAR(255) NOT NULL,
    `section_id` VARCHAR(255) NULL,
    `response_type` VARCHAR(50) NOT NULL,
    `response_value` TEXT NOT NULL,
    `response_text` TEXT NULL,
    `response_score` DECIMAL(10,3) NULL,
    `response_time_ms` INT NULL,
    `is_skipped` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_flagged` BOOLEAN NOT NULL DEFAULT FALSE,
    `flag_reason` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `interactive_data` LONGTEXT NULL,
    `validation_status` ENUM('valid', 'invalid', 'warning', 'pending') NOT NULL DEFAULT 'pending',
    `validation_messages` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_clinimetrix_responses_assessment` (`assessment_id`),
    INDEX `idx_clinimetrix_responses_item` (`item_number`),
    INDEX `idx_clinimetrix_responses_section` (`section_id`),
    INDEX `idx_clinimetrix_responses_type` (`response_type`),
    INDEX `idx_clinimetrix_responses_time` (`response_time_ms`),
    INDEX `idx_clinimetrix_responses_skipped` (`is_skipped`),
    INDEX `idx_clinimetrix_responses_flagged` (`is_flagged`),
    INDEX `idx_clinimetrix_responses_validation` (`validation_status`),
    UNIQUE KEY `uk_clinimetrix_responses_assessment_item` (`assessment_id`, `item_number`),
    CONSTRAINT `fk_clinimetrix_responses_assessment` 
        FOREIGN KEY (`assessment_id`) REFERENCES `clinimetrix_assessments` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. CLINIMETRIX ACCESS LOGS TABLE
-- =====================================================
-- Comprehensive access and usage tracking
CREATE TABLE `clinimetrix_access_logs` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `assessment_id` VARCHAR(255) NULL,
    `template_id` VARCHAR(255) NULL,
    `user_id` VARCHAR(255) NULL,
    `session_token` VARCHAR(128) NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` ENUM('template', 'assessment', 'catalog', 'api') NOT NULL,
    `resource_id` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `referer` TEXT NULL,
    `device_type` ENUM('mobile', 'tablet', 'desktop', 'unknown') NOT NULL DEFAULT 'unknown',
    `browser` VARCHAR(100) NULL,
    `operating_system` VARCHAR(100) NULL,
    `country_code` VARCHAR(3) NULL,
    `city` VARCHAR(100) NULL,
    `duration_ms` INT NULL,
    `success` BOOLEAN NOT NULL DEFAULT TRUE,
    `error_message` TEXT NULL,
    `metadata` JSON NULL,
    `accessed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_clinimetrix_access_assessment` (`assessment_id`),
    INDEX `idx_clinimetrix_access_template` (`template_id`),
    INDEX `idx_clinimetrix_access_user` (`user_id`),
    INDEX `idx_clinimetrix_access_action` (`action`),
    INDEX `idx_clinimetrix_access_resource` (`resource_type`, `resource_id`),
    INDEX `idx_clinimetrix_access_device` (`device_type`),
    INDEX `idx_clinimetrix_access_time` (`accessed_at`),
    INDEX `idx_clinimetrix_access_success` (`success`),
    INDEX `idx_clinimetrix_access_token` (`session_token`),
    CONSTRAINT `fk_clinimetrix_access_assessment` 
        FOREIGN KEY (`assessment_id`) REFERENCES `clinimetrix_assessments` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_clinimetrix_access_template` 
        FOREIGN KEY (`template_id`) REFERENCES `clinimetrix_templates` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_clinimetrix_access_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. CLINIMETRIX TEMPLATE VERSIONS TABLE
-- =====================================================
-- Version control for templates
CREATE TABLE `clinimetrix_template_versions` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `template_id` VARCHAR(255) NOT NULL,
    `version` VARCHAR(20) NOT NULL,
    `template_json` LONGTEXT NOT NULL,
    `template_hash` VARCHAR(64) NOT NULL,
    `change_summary` TEXT NULL,
    `change_details` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_draft` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_by` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `published_at` TIMESTAMP NULL,
    `deprecated_at` TIMESTAMP NULL,
    INDEX `idx_clinimetrix_versions_template` (`template_id`),
    INDEX `idx_clinimetrix_versions_version` (`version`),
    INDEX `idx_clinimetrix_versions_active` (`is_active`),
    INDEX `idx_clinimetrix_versions_draft` (`is_draft`),
    INDEX `idx_clinimetrix_versions_hash` (`template_hash`),
    INDEX `idx_clinimetrix_versions_created_by` (`created_by`),
    INDEX `idx_clinimetrix_versions_published` (`published_at`),
    UNIQUE KEY `uk_clinimetrix_versions_template_version` (`template_id`, `version`),
    CONSTRAINT `fk_clinimetrix_versions_template` 
        FOREIGN KEY (`template_id`) REFERENCES `clinimetrix_templates` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_clinimetrix_versions_created_by` 
        FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. CLINIMETRIX USER PREFERENCES TABLE
-- =====================================================
-- User-specific preferences and configurations
CREATE TABLE `clinimetrix_user_preferences` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(255) NOT NULL,
    `favorite_templates` JSON NULL,
    `recent_templates` JSON NULL,
    `default_settings` JSON NULL,
    `ui_preferences` JSON NULL,
    `notification_settings` JSON NULL,
    `accessibility_settings` JSON NULL,
    `custom_shortcuts` JSON NULL,
    `analytics_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_clinimetrix_preferences_user` (`user_id`),
    INDEX `idx_clinimetrix_preferences_analytics` (`analytics_enabled`),
    UNIQUE KEY `uk_clinimetrix_preferences_user` (`user_id`),
    CONSTRAINT `fk_clinimetrix_preferences_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default system preferences for ClinimetrixPro
INSERT INTO `clinimetrix_user_preferences` (`id`, `user_id`, `default_settings`, `ui_preferences`, `notification_settings`, `analytics_enabled`)
SELECT 
    CONCAT('pref-', id) as id,
    id as user_id,
    JSON_OBJECT(
        'autoSave', true,
        'sessionTimeout', 3600,
        'validationLevel', 'standard',
        'reminderEnabled', true
    ) as default_settings,
    JSON_OBJECT(
        'theme', 'professional',
        'language', 'es',
        'density', 'comfortable',
        'animations', true
    ) as ui_preferences,
    JSON_OBJECT(
        'emailNotifications', true,
        'pushNotifications', false,
        'reminderFrequency', 'daily'
    ) as notification_settings,
    true as analytics_enabled
FROM `users` 
WHERE NOT EXISTS (
    SELECT 1 FROM `clinimetrix_user_preferences` 
    WHERE `user_id` = `users`.`id`
);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'ClinimetrixPro database infrastructure created successfully!' as status;