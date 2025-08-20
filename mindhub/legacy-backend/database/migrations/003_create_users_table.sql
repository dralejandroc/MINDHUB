-- Tabla de usuarios del sistema MindHub
-- Migración: 003_create_users_table.sql

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Para autenticación local (opcional si usamos Auth0)
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'admin', 'professional', 'doctor', 'psychologist', 'patient'
  specialty VARCHAR(100), -- Para profesionales: 'psychiatry', 'psychology', etc.
  license_number VARCHAR(100), -- Número de cédula profesional
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  is_email_verified BOOLEAN DEFAULT 0,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Insertar usuarios de ejemplo desde el backend
INSERT INTO users (id, email, name, role, specialty, is_active, is_email_verified) VALUES 
  ('user-admin-system', 'admin@mindhub.com', 'Administrador del Sistema', 'admin', NULL, 1, 1),
  ('user-dr-alejandro', 'alejandro@mindhub.com', 'Dr. Alejandro Contreras', 'professional', 'psychiatry', 1, 1),
  ('user-dr-aleks', 'dr_aleks_c@hotmail.com', 'Dr. Alejandro Contreras', 'doctor', 'psychiatry', 1, 1);