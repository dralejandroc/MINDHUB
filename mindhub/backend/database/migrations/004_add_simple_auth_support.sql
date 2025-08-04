-- Migration: Add Simple Auth Support
-- Created: 2025-08-03
-- Description: Add support for simple authentication without Auth0

-- Make auth0Id nullable and add password field
ALTER TABLE users MODIFY COLUMN auth0Id VARCHAR(191) NULL;
ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL AFTER auth0Id;
ALTER TABLE users ADD COLUMN organizationId VARCHAR(191) NULL AFTER picture;
ALTER TABLE users ADD COLUMN accountType ENUM('INDIVIDUAL', 'CLINIC') DEFAULT 'INDIVIDUAL' AFTER organizationId;
ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT TRUE AFTER accountType;
ALTER TABLE users ADD COLUMN isBetaUser BOOLEAN DEFAULT TRUE AFTER isActive;

-- Create organizations table
CREATE TABLE organizations (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('CLINIC', 'HOSPITAL', 'CONSULTORIO') DEFAULT 'CLINIC',
    maxUsers INT DEFAULT 15,
    isActive BOOLEAN DEFAULT TRUE,
    isBetaOrg BOOLEAN DEFAULT TRUE,
    subscriptionPlan VARCHAR(255) NULL,
    createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Create auth sessions table
CREATE TABLE auth_sessions (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    userId VARCHAR(191) NOT NULL,
    token TEXT NOT NULL,
    refreshToken TEXT NULL,
    expiresAt DATETIME(3) NOT NULL,
    createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_auth_sessions_userId (userId),
    INDEX idx_auth_sessions_token (token(255))
);

-- Create beta registrations table
CREATE TABLE beta_registrations (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NULL,
    professionalType VARCHAR(100) NULL,
    inviteCode VARCHAR(100) NULL,
    hasJoined BOOLEAN DEFAULT FALSE,
    registeredAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
);

-- Add foreign key constraint for organizations
ALTER TABLE users ADD CONSTRAINT fk_users_organization 
    FOREIGN KEY (organizationId) REFERENCES organizations(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default roles if they don't exist
INSERT IGNORE INTO roles (id, name, description, permissions) VALUES
('role-admin', 'admin', 'System Administrator', '["all"]'),
('role-clinic-admin', 'clinic_admin', 'Clinic Administrator', '["clinic_manage", "users_manage", "patients_all"]'),
('role-professional', 'professional', 'Healthcare Professional', '["patients_own", "assessments_all", "resources_all"]'),
('role-psicologo', 'psicologo', 'Psicólogo', '["patients_own", "assessments_basic", "resources_all"]'),
('role-psiquiatra', 'psiquiatra', 'Psiquiatra', '["patients_own", "assessments_all", "prescriptions_all", "resources_all"]');

-- Update any existing users to have a default role if they don't have one
-- This is safe because we're only adding roles, not removing them