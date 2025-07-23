-- Script para actualizar los tipos de aplicación de las escalas existentes
-- Este script actualiza el nuevo campo applicationType basándose en escalas conocidas

-- Actualizar escalas típicamente autoaplicadas
UPDATE assessment_scales SET applicationType = 'autoaplicada' 
WHERE abbreviation IN ('PHQ-9', 'GAD-7', 'BDI-II', 'BAI', 'PSS', 'DASS-21');

-- Actualizar escalas típicamente heteroaplicadas
UPDATE assessment_scales SET applicationType = 'heteroaplicada' 
WHERE abbreviation IN ('MMSE', 'GDS-30', 'ADAS-COG', 'CDR', 'HRS-D');

-- Actualizar escalas flexibles (pueden ser ambas)
UPDATE assessment_scales SET applicationType = 'flexible' 
WHERE abbreviation IN ('GDS-15', 'WHOQOL-BREF', 'SF-36', 'STAI');

-- Verificar los cambios
SELECT abbreviation, name, applicationType 
FROM assessment_scales 
ORDER BY applicationType, abbreviation;