-- Behavioral Tracking Tables for Enhanced Patient Analysis
-- These tables capture real behavioral data for more accurate patient timeline analysis

-- Table for appointment behavioral events (delays, no-shows, etc.)
CREATE TABLE IF NOT EXISTS appointment_behavioral_logs (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    appointment_id VARCHAR(191),
    patient_id VARCHAR(191) NOT NULL,
    event_type ENUM('late_arrival', 'no_show', 'cancelled_last_minute', 'early_arrival', 'communication_issue', 'payment_delay') NOT NULL,
    description TEXT,
    delay_minutes INT DEFAULT NULL,
    recorded_by VARCHAR(191) NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_event_type (event_type),
    INDEX idx_recorded_at (recorded_at)
);

-- Table for patient communications between sessions
CREATE TABLE IF NOT EXISTS patient_communications (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(191) NOT NULL,
    communication_type ENUM('phone_call', 'whatsapp', 'email', 'in_person') NOT NULL,
    direction ENUM('incoming', 'outgoing') NOT NULL,
    content TEXT,
    duration INT DEFAULT NULL, -- in seconds for calls
    recorded_by VARCHAR(191) NOT NULL,
    communication_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_communication_type (communication_type),
    INDEX idx_direction (direction),
    INDEX idx_communication_date (communication_date)
);

-- Table for appointment reschedule/cancellation requests
CREATE TABLE IF NOT EXISTS appointment_changes (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    original_appointment_id VARCHAR(191) NOT NULL,
    patient_id VARCHAR(191) NOT NULL,
    change_type ENUM('reschedule', 'cancellation', 'no_show') NOT NULL,
    reason TEXT,
    advance_notice_hours INT DEFAULT NULL, -- How much advance notice was given
    requested_new_date DATETIME DEFAULT NULL,
    recorded_by VARCHAR(191) NOT NULL,
    change_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_original_appointment (original_appointment_id),
    INDEX idx_change_type (change_type),
    INDEX idx_change_date (change_date)
);

-- View for comprehensive behavioral analysis
CREATE OR REPLACE VIEW patient_behavioral_summary AS
SELECT 
    p.id as patient_id,
    p.firstName,
    p.paternalLastName,
    
    -- Appointment punctuality metrics
    COUNT(CASE WHEN abl.event_type = 'late_arrival' THEN 1 END) as total_late_arrivals,
    AVG(CASE WHEN abl.event_type = 'late_arrival' THEN abl.delay_minutes END) as avg_delay_minutes,
    COUNT(CASE WHEN abl.event_type = 'no_show' THEN 1 END) as total_no_shows,
    COUNT(CASE WHEN abl.event_type = 'early_arrival' THEN 1 END) as total_early_arrivals,
    
    -- Communication frequency
    COUNT(pc.id) as total_communications,
    COUNT(CASE WHEN pc.direction = 'incoming' THEN 1 END) as incoming_communications,
    COUNT(CASE WHEN pc.direction = 'outgoing' THEN 1 END) as outgoing_communications,
    COUNT(CASE WHEN pc.communication_type = 'phone_call' THEN 1 END) as phone_calls,
    COUNT(CASE WHEN pc.communication_type = 'whatsapp' THEN 1 END) as whatsapp_messages,
    
    -- Appointment changes
    COUNT(ac.id) as total_appointment_changes,
    COUNT(CASE WHEN ac.change_type = 'reschedule' THEN 1 END) as total_reschedules,
    COUNT(CASE WHEN ac.change_type = 'cancellation' THEN 1 END) as total_cancellations,
    AVG(ac.advance_notice_hours) as avg_advance_notice_hours,
    
    -- Total consultations for comparison
    COUNT(c.id) as total_consultations,
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_consultations
    
FROM patients p
LEFT JOIN appointment_behavioral_logs abl ON p.id = abl.patient_id
LEFT JOIN patient_communications pc ON p.id = pc.patient_id
LEFT JOIN appointment_changes ac ON p.id = ac.patient_id
LEFT JOIN consultations c ON p.id = c.patientId
GROUP BY p.id, p.firstName, p.paternalLastName;