-- Migration: Add response groups support to universal scales system
-- Supports scales like STAI with different response options per item group

-- Add response_group field to scale_items
ALTER TABLE scale_items 
ADD COLUMN response_group VARCHAR(50) NULL AFTER subscale,
ADD INDEX idx_scale_items_response_group (scale_id, response_group);

-- Add response_group field to scale_response_options  
ALTER TABLE scale_response_options
ADD COLUMN response_group VARCHAR(50) NULL AFTER scale_id,
ADD INDEX idx_scale_response_options_group (scale_id, response_group);

-- Create response_groups table for metadata
CREATE TABLE IF NOT EXISTS scale_response_groups (
  id VARCHAR(100) PRIMARY KEY,
  scale_id VARCHAR(50) NOT NULL,
  group_key VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (scale_id) REFERENCES scales(id) ON DELETE CASCADE,
  UNIQUE KEY uk_scale_group (scale_id, group_key),
  INDEX idx_scale_response_groups_scale (scale_id)
);

-- Comments for documentation
ALTER TABLE scale_items COMMENT = 'Items table with optional response_group for multi-option scales like STAI';
ALTER TABLE scale_response_options COMMENT = 'Response options with optional response_group for grouped options';
ALTER TABLE scale_response_groups COMMENT = 'Metadata for response groups (e.g., STAI Estado/Rasgo)';