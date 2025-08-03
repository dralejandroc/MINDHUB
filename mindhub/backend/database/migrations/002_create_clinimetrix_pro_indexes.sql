-- =====================================================
-- ClinimetrixPro Advanced Indexes and Optimization
-- =====================================================
-- Description: Creates optimized indexes for ClinimetrixPro performance
-- Date: 2025-08-02
-- Version: 1.0.0

-- =====================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- Templates: Category + Active + Usage performance
CREATE INDEX `idx_clinimetrix_templates_category_active_usage` 
ON `clinimetrix_templates` (`category`, `is_active`, `usage_count` DESC);

-- Templates: Search optimization (abbreviation + name + category)
CREATE INDEX `idx_clinimetrix_templates_search` 
ON `clinimetrix_templates` (`abbreviation`, `name`(100), `category`);

-- Templates: Full-text search capability
ALTER TABLE `clinimetrix_templates` 
ADD FULLTEXT(`name`, `category`, `subcategory`) 
WITH PARSER ngram;

-- Assessments: Status + Patient + Date range queries
CREATE INDEX `idx_clinimetrix_assessments_status_patient_date` 
ON `clinimetrix_assessments` (`status`, `patient_id`, `created_at` DESC);

-- Assessments: Administrator dashboard queries
CREATE INDEX `idx_clinimetrix_assessments_admin_status_date` 
ON `clinimetrix_assessments` (`administrator_id`, `status`, `created_at` DESC);

-- Assessments: Template usage analytics
CREATE INDEX `idx_clinimetrix_assessments_template_completed` 
ON `clinimetrix_assessments` (`template_id`, `status`, `completed_at` DESC);

-- Assessments: Performance monitoring (completion time analysis)
CREATE INDEX `idx_clinimetrix_assessments_completion_analytics` 
ON `clinimetrix_assessments` (`template_id`, `status`, `completion_time_seconds`);

-- Registry: Catalog browsing optimization
CREATE INDEX `idx_clinimetrix_registry_browse` 
ON `clinimetrix_registry` (`is_featured` DESC, `popularity_score` DESC, `average_rating` DESC);

-- Registry: Search and filter optimization
CREATE INDEX `idx_clinimetrix_registry_search_filter` 
ON `clinimetrix_registry` (`difficulty_level`, `certification_required`, `published_at` DESC);

-- Registry: Usage analytics
CREATE INDEX `idx_clinimetrix_registry_usage_analytics` 
ON `clinimetrix_registry` (`usage_count_30d` DESC, `usage_count_total` DESC, `last_used_at` DESC);

-- Responses: Item analysis optimization
CREATE INDEX `idx_clinimetrix_responses_item_analysis` 
ON `clinimetrix_assessment_responses` (`item_number`, `response_type`, `response_score`);

-- Responses: Validation and quality control
CREATE INDEX `idx_clinimetrix_responses_validation_control` 
ON `clinimetrix_assessment_responses` (`validation_status`, `is_flagged`, `is_skipped`);

-- Responses: Response time analytics
CREATE INDEX `idx_clinimetrix_responses_timing_analysis` 
ON `clinimetrix_assessment_responses` (`assessment_id`, `item_number`, `response_time_ms`);

-- Access Logs: Security and audit trails
CREATE INDEX `idx_clinimetrix_access_security_audit` 
ON `clinimetrix_access_logs` (`ip_address`, `action`, `accessed_at` DESC);

-- Access Logs: Usage analytics by resource
CREATE INDEX `idx_clinimetrix_access_usage_analytics` 
ON `clinimetrix_access_logs` (`resource_type`, `resource_id`, `accessed_at` DESC);

-- Access Logs: Error tracking and monitoring
CREATE INDEX `idx_clinimetrix_access_error_monitoring` 
ON `clinimetrix_access_logs` (`success`, `action`, `accessed_at` DESC);

-- Template Versions: Version management
CREATE INDEX `idx_clinimetrix_versions_management` 
ON `clinimetrix_template_versions` (`template_id`, `is_active` DESC, `version` DESC);

-- Template Versions: Publishing workflow
CREATE INDEX `idx_clinimetrix_versions_publishing` 
ON `clinimetrix_template_versions` (`is_draft`, `created_by`, `created_at` DESC);

-- =====================================================
-- FOREIGN KEY OPTIMIZATION INDEXES
-- =====================================================

-- Optimize foreign key lookups and joins
CREATE INDEX `idx_clinimetrix_assessments_fk_optimization` 
ON `clinimetrix_assessments` (`template_id`, `patient_id`, `administrator_id`);

CREATE INDEX `idx_clinimetrix_responses_fk_optimization` 
ON `clinimetrix_assessment_responses` (`assessment_id`, `item_id`);

CREATE INDEX `idx_clinimetrix_access_fk_optimization` 
ON `clinimetrix_access_logs` (`assessment_id`, `template_id`, `user_id`);

-- =====================================================
-- TEMPORAL INDEXES FOR TIME-BASED QUERIES
-- =====================================================

-- Recent activity indexes
CREATE INDEX `idx_clinimetrix_templates_recent_activity` 
ON `clinimetrix_templates` (`updated_at` DESC, `is_active`);

CREATE INDEX `idx_clinimetrix_assessments_recent_activity` 
ON `clinimetrix_assessments` (`last_response_at` DESC, `status`);

-- Expiration management
CREATE INDEX `idx_clinimetrix_assessments_expiration_management` 
ON `clinimetrix_assessments` (`expires_at` ASC, `status`);

-- Completion trends
CREATE INDEX `idx_clinimetrix_assessments_completion_trends` 
ON `clinimetrix_assessments` (`completed_at` DESC, `template_id`, `completion_time_seconds`);

-- =====================================================
-- JSON FIELD OPTIMIZATION (MySQL 8.0+)
-- =====================================================

-- Add functional indexes for commonly queried JSON fields

-- Template JSON structure optimization
CREATE INDEX `idx_clinimetrix_templates_json_category` 
ON `clinimetrix_templates` ((CAST(JSON_EXTRACT(`template_json`, '$.metadata.category') AS CHAR(50))));

CREATE INDEX `idx_clinimetrix_templates_json_duration` 
ON `clinimetrix_templates` ((CAST(JSON_EXTRACT(`template_json`, '$.metadata.estimatedDurationMinutes') AS UNSIGNED)));

-- Assessment scoring optimization
CREATE INDEX `idx_clinimetrix_assessments_json_scores` 
ON `clinimetrix_assessments` ((CAST(JSON_EXTRACT(`scoring_results`, '$.totalScore') AS DECIMAL(10,3))));

-- Registry tags and keywords optimization
CREATE INDEX `idx_clinimetrix_registry_json_tags` 
ON `clinimetrix_registry` ((JSON_EXTRACT(`tags`, '$[*]')));

-- Response metadata optimization
CREATE INDEX `idx_clinimetrix_responses_json_metadata` 
ON `clinimetrix_assessment_responses` ((JSON_EXTRACT(`metadata`, '$.flagReason')));

-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- Dashboard performance - most used templates
CREATE INDEX `idx_clinimetrix_dashboard_popular_templates` 
ON `clinimetrix_templates` (`is_active`, `usage_count` DESC, `created_at` DESC);

-- Dashboard performance - recent assessments by user
CREATE INDEX `idx_clinimetrix_dashboard_user_assessments` 
ON `clinimetrix_assessments` (`administrator_id`, `created_at` DESC, `status`);

-- Analytics queries - template performance metrics
CREATE INDEX `idx_clinimetrix_analytics_template_performance` 
ON `clinimetrix_assessments` (`template_id`, `status`, `completion_time_seconds`, `created_at`);

-- Search performance - patient assessments
CREATE INDEX `idx_clinimetrix_search_patient_assessments` 
ON `clinimetrix_assessments` (`patient_id`, `status`, `completed_at` DESC);

-- Reporting queries - usage statistics
CREATE INDEX `idx_clinimetrix_reporting_usage_stats` 
ON `clinimetrix_access_logs` (`template_id`, `action`, `accessed_at`, `success`);

-- =====================================================
-- MAINTENANCE AND MONITORING INDEXES
-- =====================================================

-- System health monitoring
CREATE INDEX `idx_clinimetrix_system_health` 
ON `clinimetrix_assessments` (`status`, `created_at`, `expires_at`);

-- Data integrity checks
CREATE INDEX `idx_clinimetrix_data_integrity` 
ON `clinimetrix_assessment_responses` (`assessment_id`, `validation_status`, `created_at`);

-- Performance monitoring
CREATE INDEX `idx_clinimetrix_performance_monitoring` 
ON `clinimetrix_access_logs` (`action`, `duration_ms`, `accessed_at` DESC);

-- Error tracking and debugging
CREATE INDEX `idx_clinimetrix_error_tracking` 
ON `clinimetrix_access_logs` (`success`, `error_message`(100), `accessed_at` DESC);

-- =====================================================
-- COVERING INDEXES FOR READ-HEAVY QUERIES
-- =====================================================

-- Template catalog browsing (covering index)
CREATE INDEX `idx_clinimetrix_templates_catalog_covering` 
ON `clinimetrix_templates` (`category`, `is_active`, `name`, `abbreviation`, `usage_count`, `estimated_duration_minutes`);

-- Assessment listing (covering index)
CREATE INDEX `idx_clinimetrix_assessments_listing_covering` 
ON `clinimetrix_assessments` (`patient_id`, `status`, `template_id`, `created_at`, `completion_time_seconds`, `total_score`);

-- Registry browsing (covering index)
CREATE INDEX `idx_clinimetrix_registry_browsing_covering` 
ON `clinimetrix_registry` (`is_featured`, `popularity_score`, `average_rating`, `display_name`, `difficulty_level`, `usage_count_30d`);

-- =====================================================
-- SPATIAL INDEXES (for future geographic features)
-- =====================================================

-- Prepare for potential geographic analysis
-- Note: Uncomment when geographic features are implemented
-- ALTER TABLE `clinimetrix_access_logs` ADD COLUMN `location_point` POINT NULL;
-- CREATE SPATIAL INDEX `idx_clinimetrix_access_location` ON `clinimetrix_access_logs` (`location_point`);

-- =====================================================
-- HASH INDEXES (for exact match queries)
-- =====================================================

-- Session token lookups (using MEMORY engine would be ideal for these)
-- CREATE INDEX `idx_clinimetrix_assessments_token_hash` ON `clinimetrix_assessments` (`session_token`) USING HASH;

-- Template hash lookups for version control
CREATE INDEX `idx_clinimetrix_templates_hash_lookup` 
ON `clinimetrix_templates` (`template_hash`);

CREATE INDEX `idx_clinimetrix_versions_hash_lookup` 
ON `clinimetrix_template_versions` (`template_hash`);

-- =====================================================
-- INDEX STATISTICS AND MONITORING
-- =====================================================

-- Create a view for index usage monitoring
CREATE OR REPLACE VIEW `v_clinimetrix_index_usage` AS
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY,
    SUB_PART,
    PACKED,
    NULLABLE,
    INDEX_TYPE,
    COMMENT
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME LIKE 'clinimetrix_%'
ORDER BY TABLE_NAME, INDEX_NAME;

-- =====================================================
-- COMPLETION VERIFICATION
-- =====================================================

-- Verify all indexes were created successfully
SELECT 
    TABLE_NAME,
    COUNT(*) as INDEX_COUNT
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME LIKE 'clinimetrix_%'
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;

SELECT 'ClinimetrixPro advanced indexes created successfully!' as status;

-- =====================================================
-- MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- Add comments for maintenance
ALTER TABLE `clinimetrix_templates` COMMENT = 'ClinimetrixPro: JSON-based scale templates storage';
ALTER TABLE `clinimetrix_assessments` COMMENT = 'ClinimetrixPro: Assessment sessions and responses';
ALTER TABLE `clinimetrix_registry` COMMENT = 'ClinimetrixPro: Central catalog for template discovery';
ALTER TABLE `clinimetrix_assessment_responses` COMMENT = 'ClinimetrixPro: Detailed response tracking';
ALTER TABLE `clinimetrix_access_logs` COMMENT = 'ClinimetrixPro: Access and usage tracking';
ALTER TABLE `clinimetrix_template_versions` COMMENT = 'ClinimetrixPro: Template version control';
ALTER TABLE `clinimetrix_user_preferences` COMMENT = 'ClinimetrixPro: User preferences and settings';

-- Optimization notes for future maintenance
/*
MAINTENANCE NOTES:
1. Monitor index usage with: SHOW INDEX FROM table_name;
2. Analyze query performance with: EXPLAIN FORMAT=JSON SELECT ...;
3. Consider partitioning for large tables (assessments, access_logs) when > 10M records
4. Regular ANALYZE TABLE statements for accurate statistics
5. Monitor slow query log for additional index opportunities
6. Consider read replicas for heavy analytics workloads
*/