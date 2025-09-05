-- =====================================================
-- 🏥 SISTEMA DE CREDENCIALES MÉDICAS BÁSICAS
-- =====================================================
-- 
-- EJECUTAR EN SUPABASE SQL EDITOR
-- Agrega campos médicos básicos al sistema existente
-- =====================================================

-- 1. AGREGAR CAMPOS MÉDICOS A LA TABLA profiles
DO $$
BEGIN
    -- Verificar si la columna no existe antes de agregarla
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'professional_license_number') THEN
        ALTER TABLE profiles ADD COLUMN professional_license_number VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'medical_specialization') THEN
        ALTER TABLE profiles ADD COLUMN medical_specialization VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'medical_school') THEN
        ALTER TABLE profiles ADD COLUMN medical_school VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'graduation_year') THEN
        ALTER TABLE profiles ADD COLUMN graduation_year INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'professional_board') THEN
        ALTER TABLE profiles ADD COLUMN professional_board VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'license_expiry_date') THEN
        ALTER TABLE profiles ADD COLUMN license_expiry_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'credentials_verified') THEN
        ALTER TABLE profiles ADD COLUMN credentials_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
        ALTER TABLE profiles ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'professional_signature_url') THEN
        ALTER TABLE profiles ADD COLUMN professional_signature_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'secondary_specializations') THEN
        ALTER TABLE profiles ADD COLUMN secondary_specializations TEXT[];
    END IF;
    
    RAISE NOTICE '✅ Campos médicos agregados a profiles';
END $$;

-- 2. CREAR TABLA DE ESPECIALIZACIONES MÉDICAS MEXICANAS
CREATE TABLE IF NOT EXISTS medical_specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    requires_subspecialty BOOLEAN DEFAULT FALSE,
    years_of_residency INTEGER DEFAULT 4,
    regulatory_body VARCHAR(255) DEFAULT 'CONACEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name)
);

-- 3. INSERTAR ESPECIALIZACIONES MÉDICAS COMUNES EN MÉXICO
INSERT INTO medical_specializations (name, category, requires_subspecialty, years_of_residency, regulatory_body) VALUES
-- Medicina General y Familiar
('Medicina General', 'Medicina General', FALSE, 0, 'SSA'),
('Medicina Familiar', 'Medicina Familiar', FALSE, 3, 'CONACEM'),

-- Especialidades Médicas
('Cardiología', 'Medicina Interna', TRUE, 4, 'CONACEM'),
('Neurología', 'Medicina Interna', TRUE, 4, 'CONACEM'),
('Endocrinología', 'Medicina Interna', TRUE, 4, 'CONACEM'),
('Gastroenterología', 'Medicina Interna', TRUE, 4, 'CONACEM'),
('Nefrología', 'Medicina Interna', TRUE, 4, 'CONACEM'),
('Neumología', 'Medicina Interna', TRUE, 4, 'CONACEM'),
('Reumatología', 'Medicina Interna', TRUE, 4, 'CONACEM'),
('Hematología', 'Medicina Interna', TRUE, 4, 'CONACEM'),
('Oncología Médica', 'Medicina Interna', TRUE, 4, 'CONACEM'),

-- Especialidades Quirúrgicas
('Cirugía General', 'Cirugía', TRUE, 4, 'CONACEM'),
('Cirugía Plástica y Reconstructiva', 'Cirugía', FALSE, 5, 'CONACEM'),
('Cirugía Cardiovascular', 'Cirugía', FALSE, 5, 'CONACEM'),
('Neurocirugía', 'Cirugía', FALSE, 6, 'CONACEM'),
('Ortopedia y Traumatología', 'Cirugía', FALSE, 4, 'CONACEM'),
('Urología', 'Cirugía', FALSE, 4, 'CONACEM'),
('Otorrinolaringología', 'Cirugía', FALSE, 4, 'CONACEM'),
('Oftalmología', 'Cirugía', FALSE, 4, 'CONACEM'),

-- Ginecología y Obstetricia
('Ginecología y Obstetricia', 'Gineco-Obstetricia', TRUE, 4, 'CONACEM'),

-- Pediatría
('Pediatría', 'Pediatría', TRUE, 3, 'CONACEM'),
('Neonatología', 'Pediatría', FALSE, 4, 'CONACEM'),

-- Psiquiatría y Salud Mental
('Psiquiatría', 'Salud Mental', TRUE, 4, 'CONACEM'),
('Psicología Clínica', 'Salud Mental', FALSE, 2, 'CONACEM'),

-- Diagnóstico e Imagen
('Radiología e Imagen', 'Diagnóstico', TRUE, 4, 'CONACEM'),
('Patología', 'Diagnóstico', FALSE, 4, 'CONACEM'),

-- Anestesiología
('Anestesiología', 'Anestesiología', TRUE, 4, 'CONACEM'),

-- Medicina de Urgencias
('Medicina de Urgencias', 'Urgencias', FALSE, 3, 'CONACEM'),

-- Dermatología
('Dermatología', 'Dermatología', TRUE, 4, 'CONACEM'),

-- Medicina Preventiva y Social
('Epidemiología', 'Medicina Preventiva', FALSE, 3, 'CONACEM'),
('Medicina del Trabajo', 'Medicina Preventiva', FALSE, 3, 'CONACEM')

ON CONFLICT (name) DO NOTHING;

-- 4. CREAR TABLA DE UNIVERSIDADES MÉDICAS MEXICANAS
CREATE TABLE IF NOT EXISTS medical_schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    acronym VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(50) DEFAULT 'México',
    recognition VARCHAR(50) DEFAULT 'RVOE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, city)
);

-- 5. INSERTAR PRINCIPALES UNIVERSIDADES MÉDICAS MEXICANAS
INSERT INTO medical_schools (name, acronym, city, state, recognition) VALUES
-- Ciudad de México
('Universidad Nacional Autónoma de México', 'UNAM', 'Ciudad de México', 'CDMX', 'RVOE'),
('Instituto Politécnico Nacional', 'IPN', 'Ciudad de México', 'CDMX', 'RVOE'),
('Universidad La Salle', 'ULSA', 'Ciudad de México', 'CDMX', 'RVOE'),
('Universidad Anáhuac México', 'ANAHUAC', 'Ciudad de México', 'CDMX', 'RVOE'),
('Universidad Panamericana', 'UP', 'Ciudad de México', 'CDMX', 'RVOE'),

-- Guadalajara
('Universidad de Guadalajara', 'UDG', 'Guadalajara', 'Jalisco', 'RVOE'),
('Universidad Autónoma de Guadalajara', 'UAG', 'Guadalajara', 'Jalisco', 'RVOE'),
('Tecnológico de Monterrey Campus Guadalajara', 'TEC GDL', 'Guadalajara', 'Jalisco', 'RVOE'),

-- Monterrey
('Universidad Autónoma de Nuevo León', 'UANL', 'Monterrey', 'Nuevo León', 'RVOE'),
('Tecnológico de Monterrey', 'TEC', 'Monterrey', 'Nuevo León', 'RVOE'),

-- Otras ciudades importantes
('Universidad Autónoma de Yucatán', 'UADY', 'Mérida', 'Yucatán', 'RVOE'),
('Universidad Veracruzana', 'UV', 'Xalapa', 'Veracruz', 'RVOE'),
('Universidad de Colima', 'UCOL', 'Colima', 'Colima', 'RVOE'),
('Universidad Autónoma de San Luis Potosí', 'UASLP', 'San Luis Potosí', 'San Luis Potosí', 'RVOE'),
('Benemérita Universidad Autónoma de Puebla', 'BUAP', 'Puebla', 'Puebla', 'RVOE'),
('Universidad Autónoma de Sinaloa', 'UAS', 'Culiacán', 'Sinaloa', 'RVOE'),
('Universidad de Sonora', 'UNISON', 'Hermosillo', 'Sonora', 'RVOE'),
('Universidad Autónoma de Chihuahua', 'UACH', 'Chihuahua', 'Chihuahua', 'RVOE'),
('Universidad Juárez del Estado de Durango', 'UJED', 'Durango', 'Durango', 'RVOE')

ON CONFLICT (name, city) DO NOTHING;

-- 6. AGREGAR CONSTRAINTS Y VALIDACIONES
ALTER TABLE profiles 
ADD CONSTRAINT valid_verification_status 
CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired'));

ALTER TABLE profiles 
ADD CONSTRAINT valid_graduation_year 
CHECK (graduation_year IS NULL OR (graduation_year >= 1950 AND graduation_year <= EXTRACT(YEAR FROM CURRENT_DATE)));

-- 7. HABILITAR RLS EN NUEVAS TABLAS
ALTER TABLE medical_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_schools ENABLE ROW LEVEL SECURITY;

-- Políticas de solo lectura para las tablas de catálogos
CREATE POLICY "Anyone can view specializations" ON medical_specializations
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view medical schools" ON medical_schools
    FOR SELECT USING (true);

-- 8. CREAR ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_profiles_license_number ON profiles(professional_license_number);
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON profiles(medical_specialization);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_specializations_category ON medical_specializations(category);
CREATE INDEX IF NOT EXISTS idx_medical_schools_state ON medical_schools(state);

-- 9. FUNCIÓN PARA VALIDAR FORMATO DE CÉDULA PROFESIONAL MEXICANA
CREATE OR REPLACE FUNCTION validate_mexican_professional_license(license_number TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Formato básico: 8-12 dígitos
    -- Algunos formatos comunes: 12345678, 1234567, 123456789012
    IF license_number IS NULL OR LENGTH(license_number) = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Remover espacios y guiones
    license_number := REGEXP_REPLACE(license_number, '[^0-9]', '', 'g');
    
    -- Verificar que solo contenga números y tenga longitud válida
    RETURN license_number ~ '^[0-9]{7,12}$';
END;
$$ LANGUAGE plpgsql;

-- 10. TRIGGER PARA VALIDAR CÉDULA AL INSERTAR/ACTUALIZAR
CREATE OR REPLACE FUNCTION validate_profile_medical_data()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validar formato de cédula si se proporciona
    IF NEW.professional_license_number IS NOT NULL AND 
       NEW.professional_license_number != '' AND 
       NOT validate_mexican_professional_license(NEW.professional_license_number) THEN
        RAISE EXCEPTION 'Formato de cédula profesional inválido. Use formato numérico de 7-12 dígitos.';
    END IF;
    
    -- Validar que el año de graduación sea coherente
    IF NEW.graduation_year IS NOT NULL AND NEW.graduation_year > EXTRACT(YEAR FROM CURRENT_DATE) THEN
        RAISE EXCEPTION 'El año de graduación no puede ser futuro.';
    END IF;
    
    -- Si tiene cédula y especialización, marcar como candidato a verificación
    IF NEW.professional_license_number IS NOT NULL AND 
       NEW.medical_specialization IS NOT NULL AND
       NEW.verification_status = 'pending' THEN
        NEW.verification_status := 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_validate_profile_medical ON profiles;
CREATE TRIGGER trigger_validate_profile_medical
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_profile_medical_data();

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Sistema de credenciales médicas básicas implementado';
    RAISE NOTICE '🏥 Campos médicos agregados a profiles';
    RAISE NOTICE '📚 Catálogo de especializaciones médicas mexicanas creado';
    RAISE NOTICE '🎓 Catálogo de universidades médicas mexicanas creado';
    RAISE NOTICE '🔒 RLS y validaciones de seguridad habilitadas';
    RAISE NOTICE '📋 Validador de cédulas profesionales mexicanas activo';
    RAISE NOTICE '✅ Sistema listo para configuración médica profesional';
END $$;