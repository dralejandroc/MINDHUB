-- =====================================================
-- SEED SQL para escala BDI-13
-- Inventario de Depresión de Beck - Versión Abreviada
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'bdi-13',
    'Inventario de Depresión de Beck - Versión Abreviada',
    'BDI-13',
    '1.0',
    'depresion',
    'tamizaje_adultos',
    'Versión abreviada del inventario de depresión de Beck que evalúa la severidad de síntomas depresivos en adolescentes y adultos mediante 13 ítems que cubren síntomas cognitivos, afectivos y somáticos',
    'Aaron T. Beck',
    1961,
    3-5 minutos,
    'self_administered',
    'Adolescentes y adultos de 13 años en adelante',
    13,
    'sum',
    0,
    39,
    'Administre el cuestionario en un ambiente tranquilo. Asegúrese de que el paciente entienda que debe seleccionar la opción que mejor describa cómo se ha sentido actualmente.',
    'Este cuestionario consiste en 13 grupos de afirmaciones. Por favor, lea atentamente cada grupo o tarjeta completa antes de realizar su elección. Seleccione UNA sola afirmación de cada tarjeta, la que mejor describa cómo se ha sentido actualmente. Ninguna será exactamente igual, responda la que mas se parezca a su situación actual.',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('bdi13-item-1', 'bdi-13', 1, 'Estado de ánimo', 'BDI-131', NULL, 0, 1),
('bdi13-item-2', 'bdi-13', 2, 'Pesimismo', 'BDI-132', NULL, 0, 1),
('bdi13-item-3', 'bdi-13', 3, 'Sentimiento de fracaso', 'BDI-133', NULL, 0, 1),
('bdi13-item-4', 'bdi-13', 4, 'Insatisfacción', 'BDI-134', NULL, 0, 1),
('bdi13-item-5', 'bdi-13', 5, 'Sentimientos de culpa', 'BDI-135', NULL, 0, 1),
('bdi13-item-6', 'bdi-13', 6, 'Autodesprecio', 'BDI-136', NULL, 0, 1),
('bdi13-item-7', 'bdi-13', 7, 'Ideas suicidas', 'BDI-137', NULL, 0, 1),
('bdi13-item-8', 'bdi-13', 8, 'Aislamiento social', 'BDI-138', NULL, 0, 1),
('bdi13-item-9', 'bdi-13', 9, 'Indecisión', 'BDI-139', NULL, 0, 1),
('bdi13-item-10', 'bdi-13', 10, 'Imagen corporal', 'BDI-1310', NULL, 0, 1),
('bdi13-item-11', 'bdi-13', 11, 'Capacidad laboral', 'BDI-1311', NULL, 0, 1),
('bdi13-item-12', 'bdi-13', 12, 'Fatiga', 'BDI-1312', NULL, 0, 1),
('bdi13-item-13', 'bdi-13', 13, 'Pérdida de apetito', 'BDI-1313', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('bdi13-opt-0', 'bdi-13', '0', 'Opción 0', 0, 1, 1),
('bdi13-opt-1', 'bdi-13', '1', 'Opción 1', 1, 2, 1),
('bdi13-opt-2', 'bdi-13', '2', 'Opción 2', 2, 3, 1),
('bdi13-opt-3', 'bdi-13', '3', 'Opción 3', 3, 4, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('bdi13-int-minimal', 'bdi-13', 0, 8, 'minimal', 'Depresión Mínima', '#48bb78', 'Las puntuaciones en este rango indican síntomas depresivos mínimos o ausentes. Los síntomas presentes no interfieren significativamente con el funcionamiento diario.', 'Sin sintomatología depresiva clínicamente significativa. Mantener estrategias de bienestar actual.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('bdi13-int-mild', 'bdi-13', 9, 12, 'mild', 'Depresión Leve', '#f6ad55', 'Presencia de síntomas depresivos leves que pueden interferir ocasionalmente con el funcionamiento diario. Se requiere evaluación clínica adicional.', 'Sintomatología depresiva leve. Monitoreo clínico y consideración de intervenciones psicoeducativas.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('bdi13-int-moderate', 'bdi-13', 13, 20, 'moderate', 'Depresión Moderada', '#ed8936', 'Sintomatología depresiva moderada que interfiere de manera significativa con el funcionamiento diario. Se requiere intervención terapéutica estructurada.', 'Intervención psicoterapéutica estructurada y evaluación de tratamiento farmacológico.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('bdi13-int-severe', 'bdi-13', 21, 39, 'severe', 'Depresión Grave', '#f56565', 'Sintomatología depresiva grave que interfiere severamente con el funcionamiento diario. Se requiere intervención inmediata y seguimiento especializado.', 'Intervención clínica inmediata, evaluación de riesgo suicida y tratamiento farmacológico combinado.', 1);

