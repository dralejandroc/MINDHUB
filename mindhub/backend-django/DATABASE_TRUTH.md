# 🏛️ FUENTE ÚNICA DE VERDAD - BASE DE DATOS MINDHUB

## 📋 DOCUMENTO MAESTRO DE ARQUITECTURA DE DATOS

**Versión**: 2.0  
**Fecha**: 21 Agosto 2025  
**Estado**: PRODUCCIÓN ACTIVA  

---

## 🎯 PROPÓSITO

Este documento es la **FUENTE ÚNICA DE VERDAD** para toda la estructura de datos de MindHub. Define exactamente cómo se organizan usuarios, clínicas, pacientes y sus relaciones en Supabase PostgreSQL.

---

## 🗄️ ARQUITECTURA PRINCIPAL

### **Base de Datos**: Supabase PostgreSQL
- **Host**: `jvbcpldzoyicefdtnwkd.supabase.co`
- **Puerto**: 6543 (pooler)
- **Schema**: `public`
- **Autenticación**: Supabase Auth + Row Level Security

---

## 👥 TABLA MAESTRA: `profiles`

**Propósito**: Almacena TODOS los usuarios del sistema (individuales + clínicas)

```sql
CREATE TABLE profiles (
    id                  UUID PRIMARY KEY,           -- Supabase auth.users.id
    email               TEXT,                       -- Email del usuario
    full_name           TEXT,                       -- Nombre completo
    first_name          TEXT,                       -- Nombre
    last_name           TEXT,                       -- Apellido
    role                TEXT DEFAULT 'member',      -- Rol Supabase (member/professional)
    avatar_url          TEXT,                       -- Avatar URL
    phone               TEXT,                       -- Teléfono
    specialty           TEXT,                       -- Especialidad médica
    license_number      TEXT,                       -- Cédula profesional
    created_at          TIMESTAMPTZ DEFAULT NOW(),  -- Fecha creación
    updated_at          TIMESTAMPTZ DEFAULT NOW(),  -- Fecha actualización
    
    -- *** CAMPOS CLÍNICA ***
    clinic_id           UUID REFERENCES clinics(id), -- FK a clínica (NULL = usuario individual)
    clinic_role         VARCHAR(50) DEFAULT 'professional' -- Rol en clínica
);
```

### **Tipos de Usuario por `clinic_id`**:
- `clinic_id = NULL` → **Usuario Individual** (acceso solo a sus pacientes)
- `clinic_id = UUID` → **Usuario de Clínica** (acceso compartido según `clinic_role`)

### **Roles de Clínica** (`clinic_role`):
- `clinic_owner` → Propietario (acceso total)
- `administrator` → Administrador (gestión usuarios)
- `professional` → Profesional (acceso pacientes)
- `assistant` → Asistente (acceso limitado)

---

## 🏥 TABLA: `clinics`

**Propósito**: Definición de clínicas/instituciones médicas

```sql
CREATE TABLE clinics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(200) NOT NULL,         -- Nombre comercial
    legal_name          VARCHAR(200),                  -- Razón social
    rfc                 VARCHAR(13),                   -- RFC (México)
    license_number      VARCHAR(100),                  -- Licencia sanitaria
    address             TEXT,                          -- Dirección
    city                VARCHAR(100),                  -- Ciudad
    state               VARCHAR(100),                  -- Estado
    postal_code         VARCHAR(10),                   -- CP
    phone               VARCHAR(20),                   -- Teléfono
    email               VARCHAR(100),                  -- Email institucional
    website             VARCHAR(200),                  -- Sitio web
    
    -- *** CONFIGURACIÓN ***
    subscription_plan   VARCHAR(50) DEFAULT 'basic',   -- Plan de suscripción
    max_users          INTEGER DEFAULT 5,             -- Límite usuarios
    max_patients       INTEGER DEFAULT 100,           -- Límite pacientes
    is_active          BOOLEAN DEFAULT true,          -- Estado activo
    
    -- *** AUDITORÍA ***
    created_by         UUID,                          -- Supabase user ID del creador
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);
```

### **Planes de Suscripción**:
- `basic`: 5 usuarios, 100 pacientes
- `professional`: 15 usuarios, 500 pacientes  
- `enterprise`: 50 usuarios, 2000 pacientes

---

## ✉️ TABLA: `clinic_invitations`

**Propósito**: Sistema de invitaciones para unirse a clínicas

```sql
CREATE TABLE clinic_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id       UUID NOT NULL REFERENCES clinics(id),   -- Clínica destino
    email           VARCHAR(100) NOT NULL,                  -- Email invitado
    role            VARCHAR(50) DEFAULT 'clinic_professional', -- Rol asignado
    token           VARCHAR(100) NOT NULL UNIQUE,           -- Token único
    invited_by      UUID NOT NULL,                         -- Quien invita
    expires_at      TIMESTAMPTZ NOT NULL,                  -- Expiración
    used_at         TIMESTAMPTZ,                           -- Cuándo se usó
    is_used         BOOLEAN DEFAULT false,                 -- Estado de uso
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### **Flujo de Invitación**:
1. Owner/Admin crea invitación → Genera token único
2. Invitación se envía por email → URL: `/auth/join-clinic/[token]`
3. Usuario acepta → `profiles.clinic_id` se actualiza + `is_used = true`

---

## 🏥 TABLA: `patients`

**Propósito**: Pacientes del sistema (individuales o de clínica)

```sql
CREATE TABLE patients (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- *** INFORMACIÓN PERSONAL ***
    first_name           VARCHAR(100) NOT NULL,
    last_name            VARCHAR(100) NOT NULL,
    email                VARCHAR(100),
    phone                VARCHAR(20),
    date_of_birth        DATE,
    gender               VARCHAR(20),
    
    -- *** UBICACIÓN ***
    address              TEXT,
    city                 VARCHAR(100),
    state                VARCHAR(100),
    postal_code          VARCHAR(10),
    
    -- *** MÉXICO ESPECÍFICO ***
    curp                 VARCHAR(18),                -- CURP único
    rfc                  VARCHAR(13),                -- RFC
    medical_record_number VARCHAR(50),               -- Número expediente
    blood_type           VARCHAR(5),                 -- Tipo sangre
    
    -- *** ASOCIACIÓN CRÍTICA ***
    created_by           UUID,                       -- Supabase user ID del creador
    clinic_id            UUID REFERENCES clinics(id), -- NULL = paciente individual
    assigned_professional_id UUID,                    -- Profesional asignado
    
    -- *** ESTADO ***
    patient_category     TEXT DEFAULT 'general',     -- Categoría
    is_active           BOOLEAN DEFAULT true,        -- Estado activo
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### **Lógica de Acceso a Pacientes**:
- **Usuario Individual**: Solo ve pacientes donde `created_by = su_user_id` y `clinic_id IS NULL`
- **Usuario Clínica**: Ve pacientes donde `clinic_id = su_clinic_id` (independiente del creador)

---

## 🔐 POLÍTICAS DE SEGURIDAD (RLS)

### **1. Profiles Table**
```sql
-- Usuario puede ver/editar solo su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles  
    FOR UPDATE USING (auth.uid() = id);
```

### **2. Clinics Table**
```sql
-- Solo miembros de clínica pueden verla
CREATE POLICY "Clinic members can view clinic" ON clinics
    FOR SELECT USING (
        id IN (
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND clinic_id IS NOT NULL
        )
    );
```

### **3. Patients Table**
```sql
-- Acceso basado en ownership individual o clínica
CREATE POLICY "Patient access policy" ON patients
    FOR SELECT USING (
        created_by = auth.uid()                    -- Paciente propio
        OR clinic_id IN (                         -- O paciente de mi clínica
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND clinic_id IS NOT NULL
        )
    );
```

---

## 🔄 FLUJOS CRÍTICOS

### **A. Registro Usuario Individual**
1. Usuario se registra → Supabase Auth crea `auth.users`
2. Trigger crea entrada en `profiles` con `clinic_id = NULL`
3. Usuario crea pacientes → `patients.clinic_id = NULL`

### **B. Registro Clínica**
1. Propietario registra clínica → `clinics` table
2. Su `profiles.clinic_id` se actualiza → Se convierte en `clinic_owner`
3. Crea pacientes → `patients.clinic_id = clinic_id`

### **C. Invitación a Clínica**
1. Owner crea invitación → `clinic_invitations`
2. Invitado acepta → `profiles.clinic_id` se actualiza
3. Acceso a pacientes compartido automáticamente

### **D. Migración Individual → Clínica**
1. Admin actualiza `profiles.clinic_id` del usuario
2. Sus pacientes pueden migrar → `UPDATE patients SET clinic_id = X WHERE created_by = user_id`
3. Acceso expandido inmediatamente

---

## 📊 ESTADOS DE INTEGRIDAD

### **Verificaciones Críticas**:

```sql
-- 1. NUNCA debe haber usuarios sin perfil
SELECT COUNT(*) as huerfanos 
FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id 
WHERE p.id IS NULL;
-- Resultado esperado: 0

-- 2. Usuarios de clínica deben tener clínica válida
SELECT COUNT(*) as inconsistentes
FROM profiles p 
LEFT JOIN clinics c ON p.clinic_id = c.id 
WHERE p.clinic_id IS NOT NULL AND c.id IS NULL;
-- Resultado esperado: 0

-- 3. Pacientes de clínica deben tener clínica válida
SELECT COUNT(*) as pacientes_huerfanos
FROM patients pa
LEFT JOIN clinics c ON pa.clinic_id = c.id 
WHERE pa.clinic_id IS NOT NULL AND c.id IS NULL;
-- Resultado esperado: 0
```

---

## 🏗️ IMPLEMENTACIÓN DJANGO

### **Configuración de Modelos**:
- Todos los modelos usan `managed = False` 
- Supabase es la fuente de verdad
- Django solo accede/consulta, no crea tablas

### **Middleware de Autenticación**:
```python
# middleware/supabase_auth.py
class SupabaseAuthMiddleware:
    def __call__(self, request):
        # 1. Valida JWT token de Supabase
        # 2. Extrae user_id 
        # 3. Consulta profiles para obtener clinic_id
        # 4. Establece contexto: request.user_clinic_id
        # 5. Filtra automáticamente por clínica/usuario
```

---

## ⚡ PUNTOS DE ACCESO API

### **Frontend Proxy Routes**:
- `/api/clinics/django/clinics/` → Django Clinic management
- `/api/clinics/django/invitations/` → Invitation system
- `/api/expedix/patients/` → Patient management (clinic-aware)

### **Autenticación**:
- Header: `Authorization: Bearer [supabase_jwt_token]`
- Headers proxy: `X-User-ID`, `X-User-Email`
- Middleware extrae automáticamente `clinic_id`

---

## 🚨 REGLAS DE ORO

### **1. NUNCA mezclar usuarios de diferentes clínicas**
- Middleware garantiza filtrado automático por `clinic_id`
- RLS policies bloquean acceso cruzado

### **2. Usuario sin clinic_id = Usuario Individual**
- Solo ve sus propios pacientes
- No puede ver pacientes de clínicas

### **3. Usuario con clinic_id = Usuario de Clínica**  
- Ve TODOS los pacientes de la clínica
- Comparte acceso según su `clinic_role`

### **4. Migration Path: Individual → Clínica**
- Actualizar `profiles.clinic_id`
- Migrar pacientes si es necesario
- Proceso controlado, NUNCA automático

---

## 📈 MÉTRICAS DE MONITOREO

### **Queries de Salud del Sistema**:

```sql
-- Dashboard de Integridad
SELECT 
    'Total Usuarios' as metric, COUNT(*) as value FROM profiles
UNION ALL
SELECT 
    'Usuarios Individuales', COUNT(*) FROM profiles WHERE clinic_id IS NULL
UNION ALL  
SELECT 
    'Usuarios de Clínica', COUNT(*) FROM profiles WHERE clinic_id IS NOT NULL
UNION ALL
SELECT 
    'Total Clínicas', COUNT(*) FROM clinics WHERE is_active = true
UNION ALL
SELECT 
    'Total Pacientes', COUNT(*) FROM patients WHERE is_active = true
UNION ALL
SELECT 
    'Pacientes Individuales', COUNT(*) FROM patients WHERE clinic_id IS NULL
UNION ALL
SELECT 
    'Pacientes de Clínica', COUNT(*) FROM patients WHERE clinic_id IS NOT NULL;
```

---

## 🔧 HERRAMIENTAS DE DIAGNÓSTICO

### **Script de Validación** (`validate_db_integrity.py`):
```python
def validate_database_integrity():
    """Valida integridad completa de la BD"""
    checks = [
        check_orphaned_profiles(),
        check_invalid_clinic_references(), 
        check_patient_ownership_integrity(),
        check_invitation_consistency()
    ]
    return all(checks)
```

---

**🏆 ESTE DOCUMENTO ES LA ÚNICA FUENTE DE VERDAD PARA TODA LA ARQUITECTURA DE DATOS DE MINDHUB**

*Cualquier discrepancia entre este documento y la implementación debe resolverse actualizando la implementación para que coincida con este documento.*