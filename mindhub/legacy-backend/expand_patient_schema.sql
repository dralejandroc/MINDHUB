-- Expand Patient Schema Migration
-- Add new fields to support frontend requirements

ALTER TABLE `patients` 
ADD COLUMN `city` VARCHAR(191) NULL,
ADD COLUMN `state` VARCHAR(191) NULL,
ADD COLUMN `postalCode` VARCHAR(191) NULL,
ADD COLUMN `curp` VARCHAR(191) NULL,
ADD COLUMN `rfc` VARCHAR(191) NULL,
ADD COLUMN `bloodType` VARCHAR(191) NULL,
ADD COLUMN `allergies` TEXT NULL,
ADD COLUMN `emergencyContactName` VARCHAR(191) NULL,
ADD COLUMN `emergencyContactPhone` VARCHAR(191) NULL,
ADD COLUMN `consentToTreatment` BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN `consentToDataProcessing` BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN `createdBy` VARCHAR(191) NULL;

-- Add unique constraint for CURP (only if not null)
ALTER TABLE `patients` 
ADD UNIQUE KEY `patients_curp_key` (`curp`);

-- Add foreign key constraint for createdBy
ALTER TABLE `patients` 
ADD CONSTRAINT `patients_createdBy_fkey` 
FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Update existing records to have default values
UPDATE `patients` SET 
  `consentToTreatment` = TRUE,
  `consentToDataProcessing` = TRUE,
  `isActive` = TRUE
WHERE `consentToTreatment` IS NULL 
   OR `consentToDataProcessing` IS NULL 
   OR `isActive` IS NULL;