-- =====================================================
-- SEED SQL para escala PHQ-9
-- Cuestionario de Salud del Paciente-9
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'phq9',
    'Cuestionario de Salud del Paciente-9',
    'PHQ-9',
    '1.0',
    'depression',
    'screening',
    'Cuestionario de autoevaluación para la detección y valoración de la gravedad de la depresión basado en los criterios diagnósticos del DSM-IV',
    'Kroenke, Spitzer y Williams',
    2001,
    5,
    'self_administered',
    'Adultos mayores de 18 años',
    10,
    'sum',
    0,
    27,
    'Escala breve con alta confiabilidades para test y retest para evaluar sintomatología depresiva, altamente recomendada por su confiabilidad y rapidez para aplicación en entornos clínicos',
    'Durante las últimas DOS SEMANAS, ¿con qué frecuencia le ha afectado alguno de los siguientes problemas?',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('phq9-item-1', 'phq9', 1, 'Poco interés o alegría para hacer las cosas', 'PHQ-91', NULL, 0, 1),
('phq9-item-2', 'phq9', 2, 'Sensación de estar decaído, deprimido o desesperanzado', 'PHQ-92', NULL, 0, 1),
('phq9-item-3', 'phq9', 3, 'Problemas para quedarse dormido, para seguir durmiendo o dormir demasiado', 'PHQ-93', NULL, 0, 1),
('phq9-item-4', 'phq9', 4, 'Sensación de cansancio o de tener poca energía', 'PHQ-94', NULL, 0, 1),
('phq9-item-5', 'phq9', 5, 'Poco apetito o comer demasiado', 'PHQ-95', NULL, 0, 1),
('phq9-item-6', 'phq9', 6, 'Sentirse mal consigo mismo; sentir que es un fracasado o que ha decepcionado a su familia o a sí mismo', 'PHQ-96', NULL, 0, 1),
('phq9-item-7', 'phq9', 7, 'Problemas para concentrarse en algo, como leer el periódico o ver la televisión', 'PHQ-97', NULL, 0, 1),
('phq9-item-8', 'phq9', 8, 'Moverse o hablar tan despacio que los demás pueden haberlo notado. O lo contrario: estar tan inquieto o agitado que se ha estado moviendo de un lado a otro más de lo habitual', 'PHQ-98', NULL, 0, 1),
('phq9-item-9', 'phq9', 9, 'Pensamientos de que estaría mejor muerto o de querer hacerse daño de algún modo', 'PHQ-99', NULL, 0, 1),
('phq9-item-10', 'phq9', 10, 'Si ha marcado alguno de los problemas de este cuestionario, ¿hasta qué punto estos problemas le han creado dificultades para hacer su trabajo, ocuparse de la casa o relacionarse con los demás?', 'PHQ-910', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('phq9-opt-0', 'phq9', '0', 'Nunca', 0, 1, 1),
('phq9-opt-1', 'phq9', '1', 'Varios días', 1, 2, 1),
('phq9-opt-2', 'phq9', '2', 'Más de la mitad de los días', 2, 3, 1),
('phq9-opt-3', 'phq9', '3', 'Casi todos los días', 3, 4, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('phq9-int-minimal', 'phq9', 0, 4, 'minimal', 'Sintomatología Depresiva Mínima', '#48bb78', 'Los síntomas reportados son mínimos y no sugieren un episodio depresivo clínicamente significativo', 'Mantenimiento de rutinas saludables, ejercicio regular, y seguimiento preventivo', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('phq9-int-mild', 'phq9', 5, 9, 'mild', 'Sintomatología Depresiva Leve', '#f6ad55', 'Presencia de síntomas depresivos leves que pueden requerir vigilancia clínica', 'De tener relación con eventos estresantes de vida, sugerir TCC, técnicas de manejo del estrés, y seguimiento clínico de 1 a 2 meses', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('phq9-int-moderate', 'phq9', 10, 14, 'moderate', 'Sintomatología Depresiva Moderada', '#ed8936', 'Síntomas depresivos moderados que requieren intervención clínica activa', 'De estar indicado iniciar tratamiento farmacológico, inicio de psicoterapia estructurada, y seguimiento clínico estrecho a corto plazo', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('phq9-int-moderate-severe', 'phq9', 15, 19, 'moderate-severe', 'Sintomatología Depresiva Moderada-Severa', '#f56565', 'Síntomas depresivos moderados a severos que requieren intervención inmediata', 'Indispensable iniciar tratamiento farmacológico, de no tener licencia para recetar medicamentos enviar inmediatamente a psiquiatría, tratamiento combinado recomendable (farmacológico y psicoterapéutico)', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('phq9-int-severe', 'phq9', 20, 27, 'severe', 'Sintomatología Depresiva Severa', '#742a2a', 'Síntomas depresivos severos que requieren atención clínica inmediata', 'Evaluar la necesidad de hospitalización si es necesario, tratamiento intensivo combinado (Tratamiento farmacológico y psicotérapeutico) sin dilación', 1);

