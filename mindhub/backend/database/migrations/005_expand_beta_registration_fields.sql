-- Migration: Expand BetaRegistration with additional fields
-- Created: 2025-08-04
-- Description: Add city, country, howDidYouHear, yearsOfPractice, specialization, and expectations fields

USE mindhub_dev;

-- Add new fields to beta_registrations table
ALTER TABLE beta_registrations 
ADD COLUMN city VARCHAR(255) NULL AFTER professionalType,
ADD COLUMN country VARCHAR(255) NULL AFTER city,
ADD COLUMN howDidYouHear VARCHAR(255) NULL AFTER country,
ADD COLUMN yearsOfPractice VARCHAR(255) NULL AFTER howDidYouHear,
ADD COLUMN specialization VARCHAR(255) NULL AFTER yearsOfPractice,
ADD COLUMN expectations TEXT NULL AFTER specialization;

-- Add indexes for better query performance
ALTER TABLE beta_registrations 
ADD INDEX idx_country (country),
ADD INDEX idx_professionalType (professionalType),
ADD INDEX idx_yearsOfPractice (yearsOfPractice),
ADD INDEX idx_howDidYouHear (howDidYouHear);

-- Verify the changes
DESCRIBE beta_registrations;