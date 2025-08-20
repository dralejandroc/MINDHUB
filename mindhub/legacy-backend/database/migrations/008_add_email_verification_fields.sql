-- Add email verification fields to users table
ALTER TABLE users 
ADD COLUMN emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN emailVerificationToken VARCHAR(255) UNIQUE,
ADD COLUMN emailVerifiedAt DATETIME;

-- Add index for email verification token
CREATE INDEX idx_users_email_verification_token ON users(emailVerificationToken);

-- Add index for email verification status  
CREATE INDEX idx_users_email_verified ON users(emailVerified);