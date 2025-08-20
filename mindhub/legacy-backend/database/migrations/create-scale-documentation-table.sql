-- Tabla para almacenar documentación científica de las escalas
-- Esta tabla complementa la tabla de escalas con información académica y clínica detallada

CREATE TABLE IF NOT EXISTS scale_documentation (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    scale_id VARCHAR(191) NOT NULL,
    
    -- Información bibliográfica
    bibliography TEXT COMMENT 'Referencias bibliográficas completas en formato APA',
    
    -- Fuentes consultadas
    sources_consulted JSON COMMENT 'Array de fuentes consultadas con autor, año, título',
    
    -- Notas de implementación
    implementation_notes TEXT COMMENT 'Notas técnicas sobre la implementación de la escala',
    
    -- Propiedades psicométricas
    psychometric_properties JSON COMMENT 'Propiedades como alpha de Cronbach, validez, confiabilidad',
    
    -- Consideraciones clínicas
    clinical_considerations TEXT COMMENT 'Consideraciones especiales para la aplicación clínica',
    
    -- Información sobre ítems especiales
    special_items_notes JSON COMMENT 'Notas sobre ítems inversos, alertas, etc.',
    
    -- Notas de versión
    version_notes TEXT COMMENT 'Información sobre adaptaciones y versiones',
    
    -- Población objetivo detallada
    target_population_details TEXT COMMENT 'Descripción detallada de la población objetivo',
    
    -- Interpretación clínica adicional
    clinical_interpretation TEXT COMMENT 'Guías adicionales para interpretación clínica',
    
    -- Metadatos
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Llave foránea a la tabla de escalas
    FOREIGN KEY (scale_id) REFERENCES scales(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_scale_id (scale_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentario de tabla
ALTER TABLE scale_documentation COMMENT = 'Documentación científica y académica de las escalas psicométricas';