-- Crear tabla para escalas favoritas de usuarios
CREATE TABLE IF NOT EXISTS user_favorite_scales (
  id VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
  user_id VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  scale_id VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  FOREIGN KEY (scale_id) REFERENCES scales(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_scale (user_id, scale_id),
  INDEX idx_user_favorites (user_id),
  INDEX idx_scale_favorites (scale_id)
);