-- =====================================================
-- SEED SQL para escala GADI
-- Inventario de Ansiedad Generalizada
-- Generado automáticamente desde JSON
-- =====================================================

-- Insertar escala principal
INSERT INTO scales (
    id, name, abbreviation, version, category, subcategory, description,
    author, publication_year, estimated_duration_minutes, administration_mode,
    target_population, total_items, scoring_method, score_range_min,
    score_range_max, instructions_professional, instructions_patient, is_active
) VALUES (
    'gadi',
    'Inventario de Ansiedad Generalizada',
    'GADI',
    '1.0',
    'ansiedad',
    'ansiedad_generalizada',
    'Escala autoaplicada de 22 ítems que evalúa síntomas de ansiedad generalizada experimentados en las últimas dos semanas. Mide tres dimensiones: síntomas cognitivos, somáticos y alteraciones del sueño.',
    'Roemer, L., Borkovec, M., Posa, S. & Borkovec, T.D.',
    1995,
    10-15 minutos,
    'self_administered',
    'Adolescentes y adultos con síntomas de ansiedad generalizada',
    22,
    'sum',
    0,
    88,
    'Instrucciones para el clínico: Aplicar en un ambiente tranquilo. Verificar que el paciente comprenda las instrucciones. La escala evalúa síntomas en las últimas dos semanas.',
    'Por favor, marque la opción que mejor describa cómo se ha sentido en las últimas dos semanas. No hay respuestas correctas o incorrectas. Responda a todas las preguntas marcando solo una opción por pregunta. Considere: En Absoluto=no me pasa, Un poco=me llego a pasar, pero menos de una ves en 2 semanas, algo=me pasa mas de una ves cada 2 semanas, mucho=me pasa mas de una ves por semana, Extremadamente=me pasa casi todos los dias',
    1
);

-- Insertar items
INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES
('gadi-item-1', 'gadi', 1, 'Estoy ansioso/a la mayoría de los días', 'GADI1', NULL, 0, 1),
('gadi-item-2', 'gadi', 2, 'Me canso fácilmente (físico o mental)', 'GADI2', NULL, 0, 1),
('gadi-item-3', 'gadi', 3, 'Me preocupo por los acontecimientos cotidianos', 'GADI3', NULL, 0, 1),
('gadi-item-4', 'gadi', 4, 'Encuentro dificultad para relajarme', 'GADI4', NULL, 0, 1),
('gadi-item-5', 'gadi', 5, 'Me siento ''al límite'' (ya no puedo mas, ya no aguanto)', 'GADI5', NULL, 0, 1),
('gadi-item-6', 'gadi', 6, 'Me despierto por la noche', 'GADI6', NULL, 0, 1),
('gadi-item-7', 'gadi', 7, 'Experimento sofocos (sensación de falta de aire) o escalofríos', 'GADI7', NULL, 0, 1),
('gadi-item-8', 'gadi', 8, 'Tengo malestar por mi ansiedad', 'GADI8', NULL, 0, 1),
('gadi-item-9', 'gadi', 9, 'Tengo la boca seca', 'GADI9', NULL, 0, 1),
('gadi-item-10', 'gadi', 10, 'Temo perder el control, desmayarme o volverme loco/a', 'GADI10', NULL, 0, 1),
('gadi-item-11', 'gadi', 11, 'Estoy molesto/a por la inquietud (necesidad de moverse)', 'GADI11', NULL, 0, 1),
('gadi-item-12', 'gadi', 12, 'Sufro mareos', 'GADI12', NULL, 0, 1),
('gadi-item-13', 'gadi', 13, 'Estoy molesto/a por tener temblores y sacudidas', 'GADI13', NULL, 0, 1),
('gadi-item-14', 'gadi', 14, 'Tengo dificultad para quedarme dormido', 'GADI14', NULL, 0, 1),
('gadi-item-15', 'gadi', 15, 'Sufro por la tensión o dolor de los músculos', 'GADI15', NULL, 0, 1),
('gadi-item-16', 'gadi', 16, 'Estoy molesto/a por la dificultad con la respiración', 'GADI16', NULL, 0, 1),
('gadi-item-17', 'gadi', 17, 'Me asusto fácilmente', 'GADI17', NULL, 0, 1),
('gadi-item-18', 'gadi', 18, 'Tengo dificultad para concentrarme', 'GADI18', NULL, 0, 1),
('gadi-item-19', 'gadi', 19, 'Tengo dificultad para controlar mi ansiedad', 'GADI19', NULL, 0, 1),
('gadi-item-20', 'gadi', 20, 'Estoy molesto/a por hormigueos o insensibilidad en las manos', 'GADI20', NULL, 0, 1),
('gadi-item-21', 'gadi', 21, 'Me preocupo excesivamente', 'GADI21', NULL, 0, 1),
('gadi-item-22', 'gadi', 22, 'Estoy irritable (Enojado/a)', 'GADI22', NULL, 0, 1);

-- Insertar opciones de respuesta
INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES
('gadi-opt-0', 'gadi', '0', 'En absoluto o no ha ocurrido', 0, 1, 1),
('gadi-opt-1', 'gadi', '1', 'Un poco', 1, 2, 1),
('gadi-opt-2', 'gadi', '2', 'Algo', 2, 3, 1),
('gadi-opt-3', 'gadi', '3', 'Mucho', 3, 4, 1),
('gadi-opt-4', 'gadi', '4', 'Extremadamente', 4, 5, 1);

-- Insertar reglas de interpretación
INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gadi-int-minimal', 'gadi', 0, 12, 'minimal', 'Ansiedad Mínima', '#27AE60', 'Nivel mínimo de sintomatología ansiosa, dentro de rangos normativos. Los síntomas reportados no sugieren la presencia de un Trastorno de Ansiedad Generalizada.', 'Nivel óptimo de funcionamiento. Mantener estrategias actuales de afrontamiento.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gadi-int-mild', 'gadi', 13, 22, 'mild', 'Ansiedad Leve-Moderada', '#F39C12', 'Nivel leve a moderado de síntomas ansiosos. Aunque no alcanza puntos de corte para TAG severo, puede beneficiarse de estrategias de manejo de estrés.', 'Evaluar factores estresantes actuales y recursos de afrontamiento. Considerar técnicas de manejo de estrés.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gadi-int-moderate', 'gadi', 23, 34, 'moderate', 'Ansiedad Moderada-Severa', '#E67E22', 'Sintomatología ansiosa clínicamente significativa. Pueden indicar riesgo de Trastorno de Ansiedad Generalizada.', 'Se recomienda evaluación clínica detallada y consideración de intervención terapéutica.', 1);

INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES
('gadi-int-severe', 'gadi', 35, 88, 'severe', 'Ansiedad Severa', '#E74C3C', 'Nivel severo de sintomatología ansiosa que sugiere presencia de TAG clínicamente significativo. Interferencia significativa en funcionamiento.', 'Se recomienda evaluación psiquiátrica urgente e intervención terapéutica inmediata.', 1);

-- Insertar subescalas
INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES
('gadi-sub-cognitive', 'gadi', 'Síntomas Cognitivos', 'cognitive', 0, 36, 'Evalúa preocupación excesiva, dificultades para controlar la ansiedad y síntomas cognitivos del TAG', 1),
('gadi-sub-somatic', 'gadi', 'Síntomas Somáticos', 'somatic', 0, 44, 'Evalúa manifestaciones físicas de ansiedad, incluyendo tensión muscular, síntomas autonómicos y fatiga', 1),
('gadi-sub-sleep', 'gadi', 'Alteraciones del Sueño', 'sleep', 0, 8, 'Evalúa dificultades para conciliar el sueño y despertares nocturnos asociados con ansiedad', 1);
