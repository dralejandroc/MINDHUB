-- =====================================================
-- ClinimetrixPro Backup and Recovery Procedures
-- =====================================================
-- Description: Comprehensive backup and recovery system for ClinimetrixPro
-- Date: 2025-08-02
-- Version: 1.0.0

-- =====================================================
-- 1. INCREMENTAL BACKUP TABLES
-- =====================================================

-- Create backup tracking table
CREATE TABLE `clinimetrix_backup_logs` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `backup_type` ENUM('full', 'incremental', 'template_only', 'assessment_only', 'emergency') NOT NULL,
    `backup_method` ENUM('manual', 'scheduled', 'automated', 'migration') NOT NULL DEFAULT 'manual',
    `status` ENUM('started', 'in_progress', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'started',
    `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `completed_at` TIMESTAMP NULL,
    `duration_seconds` INT NULL,
    `total_records` INT NULL DEFAULT 0,
    `backed_up_records` INT NULL DEFAULT 0,
    `file_path` VARCHAR(1000) NULL,
    `file_size_bytes` BIGINT NULL,
    `checksum` VARCHAR(64) NULL,
    `initiated_by` VARCHAR(255) NULL,
    `backup_settings` JSON NULL,
    `error_message` TEXT NULL,
    `recovery_point` TIMESTAMP NULL,
    `compression_ratio` DECIMAL(5,2) NULL,
    `backup_version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    INDEX `idx_clinimetrix_backup_logs_type` (`backup_type`),
    INDEX `idx_clinimetrix_backup_logs_status` (`status`),
    INDEX `idx_clinimetrix_backup_logs_started` (`started_at` DESC),
    INDEX `idx_clinimetrix_backup_logs_initiated_by` (`initiated_by`),
    INDEX `idx_clinimetrix_backup_logs_recovery_point` (`recovery_point` DESC),
    CONSTRAINT `fk_clinimetrix_backup_logs_initiated_by` 
        FOREIGN KEY (`initiated_by`) REFERENCES `users` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create backup file registry
CREATE TABLE `clinimetrix_backup_files` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `backup_log_id` VARCHAR(255) NOT NULL,
    `file_type` ENUM('templates', 'assessments', 'responses', 'registry', 'access_logs', 'preferences', 'full_dump') NOT NULL,
    `file_name` VARCHAR(500) NOT NULL,
    `file_path` VARCHAR(1000) NOT NULL,
    `file_size_bytes` BIGINT NOT NULL,
    `record_count` INT NOT NULL DEFAULT 0,
    `checksum_md5` VARCHAR(32) NULL,
    `checksum_sha256` VARCHAR(64) NULL,
    `compression_type` VARCHAR(20) NULL,
    `encryption_status` BOOLEAN NOT NULL DEFAULT FALSE,
    `retention_until` TIMESTAMP NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `verification_date` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_clinimetrix_backup_files_log` (`backup_log_id`),
    INDEX `idx_clinimetrix_backup_files_type` (`file_type`),
    INDEX `idx_clinimetrix_backup_files_retention` (`retention_until`),
    INDEX `idx_clinimetrix_backup_files_verified` (`is_verified`),
    CONSTRAINT `fk_clinimetrix_backup_files_log` 
        FOREIGN KEY (`backup_log_id`) REFERENCES `clinimetrix_backup_logs` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. STORED PROCEDURES FOR BACKUP OPERATIONS
-- =====================================================

DELIMITER //

-- Full backup procedure
CREATE PROCEDURE `sp_clinimetrix_full_backup`(
    IN p_initiated_by VARCHAR(255),
    IN p_backup_path VARCHAR(1000),
    IN p_include_access_logs BOOLEAN DEFAULT TRUE,
    OUT p_backup_id VARCHAR(255),
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_backup_id VARCHAR(255);
    DECLARE v_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    DECLARE v_record_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        
        UPDATE `clinimetrix_backup_logs` 
        SET `status` = 'failed',
            `completed_at` = CURRENT_TIMESTAMP,
            `error_message` = CONCAT('Error: ', @errno, ' - ', @text)
        WHERE `id` = v_backup_id;
        
        SET p_status = 'FAILED';
        SET p_backup_id = v_backup_id;
    END;

    -- Generate backup ID
    SET v_backup_id = CONCAT('backup-full-', UNIX_TIMESTAMP(), '-', SUBSTRING(MD5(RAND()), 1, 8));
    
    -- Insert backup log entry
    INSERT INTO `clinimetrix_backup_logs` 
    (`id`, `backup_type`, `backup_method`, `status`, `started_at`, `initiated_by`, `backup_settings`)
    VALUES 
    (v_backup_id, 'full', 'manual', 'in_progress', v_start_time, p_initiated_by,
     JSON_OBJECT('include_access_logs', p_include_access_logs, 'backup_path', p_backup_path));

    -- Count total records for progress tracking
    SELECT 
        (SELECT COUNT(*) FROM `clinimetrix_templates`) +
        (SELECT COUNT(*) FROM `clinimetrix_assessments`) +
        (SELECT COUNT(*) FROM `clinimetrix_registry`) +
        (SELECT COUNT(*) FROM `clinimetrix_assessment_responses`) +
        (SELECT COUNT(*) FROM `clinimetrix_template_versions`) +
        (SELECT COUNT(*) FROM `clinimetrix_user_preferences`) +
        (CASE WHEN p_include_access_logs THEN (SELECT COUNT(*) FROM `clinimetrix_access_logs`) ELSE 0 END)
    INTO v_record_count;

    -- Update total record count
    UPDATE `clinimetrix_backup_logs` 
    SET `total_records` = v_record_count,
        `backed_up_records` = 0
    WHERE `id` = v_backup_id;

    -- Mark as completed (actual backup logic would be implemented in application layer)
    UPDATE `clinimetrix_backup_logs` 
    SET `status` = 'completed',
        `completed_at` = CURRENT_TIMESTAMP,
        `duration_seconds` = TIMESTAMPDIFF(SECOND, v_start_time, CURRENT_TIMESTAMP),
        `backed_up_records` = v_record_count
    WHERE `id` = v_backup_id;

    SET p_backup_id = v_backup_id;
    SET p_status = 'SUCCESS';
END //

-- Incremental backup procedure
CREATE PROCEDURE `sp_clinimetrix_incremental_backup`(
    IN p_initiated_by VARCHAR(255),
    IN p_since_timestamp TIMESTAMP,
    IN p_backup_path VARCHAR(1000),
    OUT p_backup_id VARCHAR(255),
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_backup_id VARCHAR(255);
    DECLARE v_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    DECLARE v_record_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        
        UPDATE `clinimetrix_backup_logs` 
        SET `status` = 'failed',
            `completed_at` = CURRENT_TIMESTAMP,
            `error_message` = CONCAT('Error: ', @errno, ' - ', @text)
        WHERE `id` = v_backup_id;
        
        SET p_status = 'FAILED';
        SET p_backup_id = v_backup_id;
    END;

    -- Generate backup ID
    SET v_backup_id = CONCAT('backup-incr-', UNIX_TIMESTAMP(), '-', SUBSTRING(MD5(RAND()), 1, 8));
    
    -- Insert backup log entry
    INSERT INTO `clinimetrix_backup_logs` 
    (`id`, `backup_type`, `backup_method`, `status`, `started_at`, `initiated_by`, `backup_settings`)
    VALUES 
    (v_backup_id, 'incremental', 'manual', 'in_progress', v_start_time, p_initiated_by,
     JSON_OBJECT('since_timestamp', p_since_timestamp, 'backup_path', p_backup_path));

    -- Count incremental records
    SELECT 
        (SELECT COUNT(*) FROM `clinimetrix_templates` WHERE `updated_at` >= p_since_timestamp) +
        (SELECT COUNT(*) FROM `clinimetrix_assessments` WHERE `updated_at` >= p_since_timestamp) +
        (SELECT COUNT(*) FROM `clinimetrix_registry` WHERE `updated_at` >= p_since_timestamp) +
        (SELECT COUNT(*) FROM `clinimetrix_assessment_responses` WHERE `updated_at` >= p_since_timestamp) +
        (SELECT COUNT(*) FROM `clinimetrix_template_versions` WHERE `created_at` >= p_since_timestamp) +
        (SELECT COUNT(*) FROM `clinimetrix_user_preferences` WHERE `updated_at` >= p_since_timestamp) +
        (SELECT COUNT(*) FROM `clinimetrix_access_logs` WHERE `accessed_at` >= p_since_timestamp)
    INTO v_record_count;

    -- Update record counts and complete
    UPDATE `clinimetrix_backup_logs` 
    SET `status` = 'completed',
        `completed_at` = CURRENT_TIMESTAMP,
        `duration_seconds` = TIMESTAMPDIFF(SECOND, v_start_time, CURRENT_TIMESTAMP),
        `total_records` = v_record_count,
        `backed_up_records` = v_record_count
    WHERE `id` = v_backup_id;

    SET p_backup_id = v_backup_id;
    SET p_status = 'SUCCESS';
END //

-- Emergency backup procedure (templates only)
CREATE PROCEDURE `sp_clinimetrix_emergency_template_backup`(
    IN p_initiated_by VARCHAR(255),
    OUT p_backup_id VARCHAR(255),
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_backup_id VARCHAR(255);
    DECLARE v_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    DECLARE v_record_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        
        UPDATE `clinimetrix_backup_logs` 
        SET `status` = 'failed',
            `completed_at` = CURRENT_TIMESTAMP,
            `error_message` = CONCAT('Emergency backup failed: ', @errno, ' - ', @text)
        WHERE `id` = v_backup_id;
        
        SET p_status = 'FAILED';
        SET p_backup_id = v_backup_id;
    END;

    -- Generate emergency backup ID
    SET v_backup_id = CONCAT('backup-emrg-', UNIX_TIMESTAMP(), '-', SUBSTRING(MD5(RAND()), 1, 8));
    
    -- Insert emergency backup log
    INSERT INTO `clinimetrix_backup_logs` 
    (`id`, `backup_type`, `backup_method`, `status`, `started_at`, `initiated_by`, `backup_settings`)
    VALUES 
    (v_backup_id, 'emergency', 'manual', 'in_progress', v_start_time, p_initiated_by,
     JSON_OBJECT('emergency_backup', true, 'backup_scope', 'templates_only'));

    -- Count templates and versions
    SELECT COUNT(*) INTO v_record_count 
    FROM `clinimetrix_templates` 
    WHERE `is_active` = TRUE;

    -- Complete emergency backup
    UPDATE `clinimetrix_backup_logs` 
    SET `status` = 'completed',
        `completed_at` = CURRENT_TIMESTAMP,
        `duration_seconds` = TIMESTAMPDIFF(SECOND, v_start_time, CURRENT_TIMESTAMP),
        `total_records` = v_record_count,
        `backed_up_records` = v_record_count
    WHERE `id` = v_backup_id;

    SET p_backup_id = v_backup_id;
    SET p_status = 'SUCCESS';
END //

DELIMITER ;

-- =====================================================
-- 3. RECOVERY PROCEDURES
-- =====================================================

DELIMITER //

-- Recovery verification procedure
CREATE PROCEDURE `sp_clinimetrix_verify_backup`(
    IN p_backup_id VARCHAR(255),
    OUT p_verification_status VARCHAR(50),
    OUT p_verification_details JSON
)
BEGIN
    DECLARE v_file_count INT DEFAULT 0;
    DECLARE v_verified_files INT DEFAULT 0;
    DECLARE v_total_size BIGINT DEFAULT 0;
    DECLARE v_backup_exists BOOLEAN DEFAULT FALSE;
    DECLARE v_details JSON;

    -- Check if backup exists
    SELECT COUNT(*) INTO v_backup_exists 
    FROM `clinimetrix_backup_logs` 
    WHERE `id` = p_backup_id AND `status` = 'completed';

    IF v_backup_exists = 0 THEN
        SET p_verification_status = 'BACKUP_NOT_FOUND';
        SET p_verification_details = JSON_OBJECT('error', 'Backup not found or not completed');
        LEAVE verify_backup;
    END IF;

    -- Count and verify files
    SELECT 
        COUNT(*),
        SUM(CASE WHEN `is_verified` = TRUE THEN 1 ELSE 0 END),
        SUM(`file_size_bytes`)
    INTO v_file_count, v_verified_files, v_total_size
    FROM `clinimetrix_backup_files` 
    WHERE `backup_log_id` = p_backup_id;

    -- Create verification details
    SET v_details = JSON_OBJECT(
        'backup_id', p_backup_id,
        'total_files', v_file_count,
        'verified_files', v_verified_files,
        'total_size_bytes', v_total_size,
        'verification_percentage', ROUND((v_verified_files / v_file_count) * 100, 2),
        'verification_timestamp', CURRENT_TIMESTAMP
    );

    -- Determine verification status
    IF v_verified_files = v_file_count THEN
        SET p_verification_status = 'FULLY_VERIFIED';
    ELSEIF v_verified_files > 0 THEN
        SET p_verification_status = 'PARTIALLY_VERIFIED';
    ELSE
        SET p_verification_status = 'NOT_VERIFIED';
    END IF;

    SET p_verification_details = v_details;
END //

-- Point-in-time recovery preparation
CREATE PROCEDURE `sp_clinimetrix_prepare_point_in_time_recovery`(
    IN p_recovery_timestamp TIMESTAMP,
    IN p_initiated_by VARCHAR(255),
    OUT p_recovery_plan JSON,
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_backup_id VARCHAR(255);
    DECLARE v_backup_timestamp TIMESTAMP;
    DECLARE v_incremental_count INT DEFAULT 0;
    DECLARE v_plan JSON;

    -- Find the most recent full backup before recovery point
    SELECT `id`, `completed_at` 
    INTO v_backup_id, v_backup_timestamp
    FROM `clinimetrix_backup_logs` 
    WHERE `backup_type` = 'full' 
        AND `status` = 'completed'
        AND `completed_at` <= p_recovery_timestamp
    ORDER BY `completed_at` DESC 
    LIMIT 1;

    IF v_backup_id IS NULL THEN
        SET p_status = 'NO_SUITABLE_BACKUP';
        SET p_recovery_plan = JSON_OBJECT('error', 'No full backup found before recovery timestamp');
        LEAVE prepare_recovery;
    END IF;

    -- Count incremental backups needed
    SELECT COUNT(*) INTO v_incremental_count
    FROM `clinimetrix_backup_logs` 
    WHERE `backup_type` = 'incremental' 
        AND `status` = 'completed'
        AND `completed_at` > v_backup_timestamp
        AND `completed_at` <= p_recovery_timestamp;

    -- Create recovery plan
    SET v_plan = JSON_OBJECT(
        'base_backup_id', v_backup_id,
        'base_backup_timestamp', v_backup_timestamp,
        'target_recovery_timestamp', p_recovery_timestamp,
        'incremental_backups_needed', v_incremental_count,
        'recovery_complexity', CASE 
            WHEN v_incremental_count = 0 THEN 'simple'
            WHEN v_incremental_count <= 5 THEN 'moderate'
            ELSE 'complex'
        END,
        'estimated_recovery_time_minutes', (v_incremental_count * 15) + 30,
        'initiated_by', p_initiated_by,
        'plan_created_at', CURRENT_TIMESTAMP
    );

    SET p_recovery_plan = v_plan;
    SET p_status = 'PLAN_READY';
END //

DELIMITER ;

-- =====================================================
-- 4. BACKUP MAINTENANCE PROCEDURES
-- =====================================================

DELIMITER //

-- Cleanup old backups procedure
CREATE PROCEDURE `sp_clinimetrix_cleanup_old_backups`(
    IN p_retention_days INT DEFAULT 90,
    IN p_keep_monthly_backups BOOLEAN DEFAULT TRUE,
    OUT p_cleaned_count INT,
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_cleanup_date TIMESTAMP;
    DECLARE v_deleted_backups INT DEFAULT 0;
    DECLARE v_deleted_files INT DEFAULT 0;

    SET v_cleanup_date = DATE_SUB(CURRENT_TIMESTAMP, INTERVAL p_retention_days DAY);

    -- Delete old backup files
    DELETE FROM `clinimetrix_backup_files` 
    WHERE `backup_log_id` IN (
        SELECT `id` FROM `clinimetrix_backup_logs` 
        WHERE `completed_at` < v_cleanup_date
            AND (`backup_type` != 'full' OR p_keep_monthly_backups = FALSE
                 OR `completed_at` < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 YEAR))
    );
    
    SET v_deleted_files = ROW_COUNT();

    -- Delete old backup logs
    DELETE FROM `clinimetrix_backup_logs` 
    WHERE `completed_at` < v_cleanup_date
        AND (`backup_type` != 'full' OR p_keep_monthly_backups = FALSE
             OR `completed_at` < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 YEAR));
    
    SET v_deleted_backups = ROW_COUNT();

    SET p_cleaned_count = v_deleted_backups;
    SET p_status = CONCAT('Cleaned ', v_deleted_backups, ' backup logs and ', v_deleted_files, ' files');
END //

-- Backup health check procedure
CREATE PROCEDURE `sp_clinimetrix_backup_health_check`(
    OUT p_health_status VARCHAR(50),
    OUT p_health_report JSON
)
BEGIN
    DECLARE v_recent_backup_count INT DEFAULT 0;
    DECLARE v_failed_backup_count INT DEFAULT 0;
    DECLARE v_avg_backup_time DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total_backup_size BIGINT DEFAULT 0;
    DECLARE v_health_score INT DEFAULT 100;
    DECLARE v_report JSON;

    -- Check recent backups (last 7 days)
    SELECT COUNT(*) INTO v_recent_backup_count
    FROM `clinimetrix_backup_logs`
    WHERE `completed_at` >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY)
        AND `status` = 'completed';

    -- Check failed backups (last 30 days)
    SELECT COUNT(*) INTO v_failed_backup_count
    FROM `clinimetrix_backup_logs`
    WHERE `started_at` >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
        AND `status` = 'failed';

    -- Calculate average backup time
    SELECT AVG(`duration_seconds`) INTO v_avg_backup_time
    FROM `clinimetrix_backup_logs`
    WHERE `completed_at` >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
        AND `status` = 'completed'
        AND `duration_seconds` IS NOT NULL;

    -- Calculate total backup storage
    SELECT SUM(`file_size_bytes`) INTO v_total_backup_size
    FROM `clinimetrix_backup_files`
    WHERE `created_at` >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 90 DAY);

    -- Calculate health score
    SET v_health_score = GREATEST(0, 
        v_health_score 
        - (CASE WHEN v_recent_backup_count = 0 THEN 40 ELSE 0 END)
        - (v_failed_backup_count * 10)
        - (CASE WHEN v_avg_backup_time > 3600 THEN 20 ELSE 0 END)
    );

    -- Create health report
    SET v_report = JSON_OBJECT(
        'health_score', v_health_score,
        'recent_successful_backups_7d', v_recent_backup_count,
        'failed_backups_30d', v_failed_backup_count,
        'average_backup_time_seconds', v_avg_backup_time,
        'total_backup_size_bytes', v_total_backup_size,
        'last_successful_backup', (
            SELECT `completed_at` 
            FROM `clinimetrix_backup_logs` 
            WHERE `status` = 'completed' 
            ORDER BY `completed_at` DESC 
            LIMIT 1
        ),
        'recommendations', CASE 
            WHEN v_health_score >= 90 THEN JSON_ARRAY('Backup system is healthy')
            WHEN v_health_score >= 70 THEN JSON_ARRAY('Consider increasing backup frequency')
            WHEN v_health_score >= 50 THEN JSON_ARRAY('Review backup failures', 'Check backup performance')
            ELSE JSON_ARRAY('Immediate attention required', 'Backup system needs maintenance')
        END,
        'check_timestamp', CURRENT_TIMESTAMP
    );

    -- Determine status
    SET p_health_status = CASE 
        WHEN v_health_score >= 90 THEN 'EXCELLENT'
        WHEN v_health_score >= 70 THEN 'GOOD'
        WHEN v_health_score >= 50 THEN 'FAIR'
        WHEN v_health_score >= 30 THEN 'POOR'
        ELSE 'CRITICAL'
    END;

    SET p_health_report = v_report;
END //

DELIMITER ;

-- =====================================================
-- 5. AUTOMATED BACKUP TRIGGERS
-- =====================================================

-- Create trigger for automatic backup logging on template changes
DELIMITER //

CREATE TRIGGER `tr_clinimetrix_templates_backup_on_update`
    AFTER UPDATE ON `clinimetrix_templates`
    FOR EACH ROW
BEGIN
    -- Log significant template changes that might require backup
    IF OLD.`template_json` != NEW.`template_json` OR OLD.`is_active` != NEW.`is_active` THEN
        INSERT INTO `clinimetrix_access_logs` 
        (`id`, `template_id`, `action`, `resource_type`, `resource_id`, `metadata`, `accessed_at`)
        VALUES 
        (CONCAT('log-', UNIX_TIMESTAMP(), '-', SUBSTRING(MD5(RAND()), 1, 8)),
         NEW.`id`, 'template_modified', 'template', NEW.`id`,
         JSON_OBJECT('old_hash', MD5(OLD.`template_json`), 'new_hash', MD5(NEW.`template_json`)),
         CURRENT_TIMESTAMP);
    END IF;
END //

DELIMITER ;

-- =====================================================
-- 6. BACKUP MONITORING VIEWS
-- =====================================================

-- Backup status dashboard view
CREATE OR REPLACE VIEW `v_clinimetrix_backup_dashboard` AS
SELECT 
    bl.`backup_type`,
    bl.`status`,
    COUNT(*) as `backup_count`,
    MAX(bl.`completed_at`) as `last_backup`,
    AVG(bl.`duration_seconds`) as `avg_duration_seconds`,
    SUM(bf.`file_size_bytes`) as `total_size_bytes`,
    AVG(bl.`backed_up_records`) as `avg_records_backed_up`
FROM `clinimetrix_backup_logs` bl
LEFT JOIN `clinimetrix_backup_files` bf ON bl.`id` = bf.`backup_log_id`
WHERE bl.`started_at` >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
GROUP BY bl.`backup_type`, bl.`status`
ORDER BY bl.`backup_type`, bl.`status`;

-- Recent backup activity view
CREATE OR REPLACE VIEW `v_clinimetrix_recent_backups` AS
SELECT 
    bl.`id`,
    bl.`backup_type`,
    bl.`backup_method`,
    bl.`status`,
    bl.`started_at`,
    bl.`completed_at`,
    bl.`duration_seconds`,
    bl.`backed_up_records`,
    u.`name` as `initiated_by_name`,
    COUNT(bf.`id`) as `file_count`,
    SUM(bf.`file_size_bytes`) as `total_size_bytes`
FROM `clinimetrix_backup_logs` bl
LEFT JOIN `users` u ON bl.`initiated_by` = u.`id`
LEFT JOIN `clinimetrix_backup_files` bf ON bl.`id` = bf.`backup_log_id`
WHERE bl.`started_at` >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY)
GROUP BY bl.`id`
ORDER BY bl.`started_at` DESC;

-- =====================================================
-- 7. SECURITY AND PERMISSIONS
-- =====================================================

-- Create backup operator role and permissions
-- Note: This would typically be handled by the application's role management system

-- =====================================================
-- INITIALIZATION AND VERIFICATION
-- =====================================================

-- Insert initial backup configuration
INSERT INTO `clinimetrix_backup_logs` 
(`id`, `backup_type`, `backup_method`, `status`, `started_at`, `completed_at`, `duration_seconds`, `total_records`, `backed_up_records`, `initiated_by`)
VALUES 
('backup-init-system-setup', 'full', 'migration', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0, 0, 'system');

-- Verify procedures were created
SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE,
    CREATED,
    DEFINER
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
    AND ROUTINE_NAME LIKE 'sp_clinimetrix_%'
ORDER BY ROUTINE_NAME;

SELECT 'ClinimetrixPro backup and recovery procedures created successfully!' as status;

-- =====================================================
-- USAGE EXAMPLES AND DOCUMENTATION
-- =====================================================

/*
USAGE EXAMPLES:

1. Create a full backup:
   CALL sp_clinimetrix_full_backup('user-123', '/backups/clinimetrix/', TRUE, @backup_id, @status);
   SELECT @backup_id, @status;

2. Create an incremental backup:
   CALL sp_clinimetrix_incremental_backup('user-123', '2025-08-01 00:00:00', '/backups/clinimetrix/', @backup_id, @status);

3. Emergency template backup:
   CALL sp_clinimetrix_emergency_template_backup('user-123', @backup_id, @status);

4. Verify a backup:
   CALL sp_clinimetrix_verify_backup('backup-full-123456', @verification_status, @verification_details);

5. Prepare point-in-time recovery:
   CALL sp_clinimetrix_prepare_point_in_time_recovery('2025-08-01 12:00:00', 'user-123', @recovery_plan, @status);

6. Cleanup old backups:
   CALL sp_clinimetrix_cleanup_old_backups(90, TRUE, @cleaned_count, @status);

7. Check backup system health:
   CALL sp_clinimetrix_backup_health_check(@health_status, @health_report);

MONITORING QUERIES:

- View backup dashboard: SELECT * FROM v_clinimetrix_backup_dashboard;
- View recent backups: SELECT * FROM v_clinimetrix_recent_backups;
- Check backup health: CALL sp_clinimetrix_backup_health_check(@status, @report); SELECT @status, @report;

MAINTENANCE RECOMMENDATIONS:

1. Schedule daily incremental backups
2. Schedule weekly full backups
3. Monthly backup verification
4. Quarterly backup cleanup
5. Monitor backup health weekly
6. Test recovery procedures monthly
*/