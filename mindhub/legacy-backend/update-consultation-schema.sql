-- Script para actualizar el esquema de consultations y soportar notas largas
-- Ejecutar este script en la base de datos MySQL para ampliar los campos de texto

USE mindhub_db;

-- Modificar la tabla consultations para soportar textos largos
ALTER TABLE consultations 
MODIFY COLUMN reason TEXT,
MODIFY COLUMN notes LONGTEXT,
MODIFY COLUMN diagnosis TEXT,
MODIFY COLUMN treatmentPlan TEXT;

-- Verificar los cambios
DESCRIBE consultations;