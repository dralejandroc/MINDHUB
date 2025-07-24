-- Crear tabla para opciones de respuesta específicas por ítem
-- Necesaria para escalas como BDI-21 donde cada ítem tiene opciones únicas

CREATE TABLE IF NOT EXISTS scale_item_specific_options (
  id VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
  item_id VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  option_value VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  option_label TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  score_value INT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  metadata JSON DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  FOREIGN KEY (item_id) REFERENCES scale_items(id) ON DELETE CASCADE,
  INDEX idx_item_specific_options_item_id (item_id),
  INDEX idx_item_specific_options_active (is_active),
  INDEX idx_item_specific_options_order (display_order)
);

-- Comentario sobre uso:
-- Esta tabla permite que cada ítem tenga sus propias opciones de respuesta específicas
-- Se usa cuando los ítems no comparten las mismas opciones globales de la escala
-- Ejemplos: BDI-21 (opciones variables), escalas con ramificaciones condicionales