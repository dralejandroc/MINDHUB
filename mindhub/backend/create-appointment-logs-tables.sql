-- Create appointment logs table for tracking all appointment changes
CREATE TABLE IF NOT EXISTS appointment_logs (
    id VARCHAR(255) PRIMARY KEY,
    appointment_id VARCHAR(255),
    patient_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- created, updated, cancelled, rescheduled, time_changed, date_changed, no_show, completed
    previous_data TEXT, -- JSON string of previous appointment state
    new_data TEXT, -- JSON string of new appointment state
    changes TEXT, -- Human readable summary of changes
    reason TEXT, -- Reason for the change (optional)
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Create patient alerts table for automatic alert generation
CREATE TABLE IF NOT EXISTS patient_alerts (
    id VARCHAR(255) PRIMARY KEY,
    patient_id VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- frequent_appointment_changes, no_show_pattern, late_cancellation, etc.
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    message TEXT NOT NULL,
    metadata TEXT, -- JSON string with additional alert data
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    acknowledged_by VARCHAR(255), -- User ID who acknowledged the alert
    acknowledged_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_type (type),
    INDEX idx_severity (severity),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);

-- Insert some sample IDs to match existing records
INSERT IGNORE INTO appointment_logs (id, appointment_id, patient_id, user_id, user_name, action, new_data, created_at) VALUES
('log-sample-1', 'apt-001', 'EXP-2025-0003', 'user-dr-alejandro', 'Dr. Alejandro Contreras', 'created', '{"date":"2025-01-15","time":"10:00","type":"Evaluación inicial","status":"confirmed"}', '2025-01-15 09:00:00'),
('log-sample-2', 'apt-002', 'EXP-2025-0004', 'user-dr-alejandro', 'Dr. Alejandro Contreras', 'created', '{"date":"2025-01-20","time":"14:30","type":"Seguimiento","status":"confirmed"}', '2025-01-20 13:30:00'),
('log-sample-3', 'apt-003', 'EXP-2025-0005', 'user-dr-alejandro', 'Dr. Alejandro Contreras', 'created', '{"date":"2025-01-25","time":"11:00","type":"Evaluación cognitiva","status":"confirmed"}', '2025-01-25 10:00:00');