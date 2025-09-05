# 💊 SISTEMA COMPLETO DE RECETAS DIGITALES - DISEÑO TÉCNICO

**Fecha**: 2025-01-19  
**Estado**: 🏗️ EN IMPLEMENTACIÓN COMPLETA  
**Objetivo**: Sistema profesional de recetas médicas digitales integrado con MindHub

---

## 🎯 VISIÓN DEL SISTEMA

### **Funcionalidades Principales**
1. **Creación de Recetas**: Interfaz intuitiva para médicos
2. **Base de Datos de Medicamentos**: Integración con PLM/COFEPRIS
3. **Generación de PDFs**: Recetas profesionales con firma digital
4. **Validación y Seguridad**: Códigos QR, firmas, validaciones
5. **Historial Completo**: Seguimiento de prescripciones por paciente
6. **Integración con Consultas**: Recetas directas desde expedientes

### **Usuarios del Sistema**
- **Médicos**: Crear y gestionar recetas
- **Pacientes**: Ver sus recetas digitales
- **Farmacias**: Validar recetas (futuro)
- **Reguladores**: Auditoría y cumplimiento

---

## 🗄️ ESQUEMA DE BASE DE DATOS

### **1. `digital_prescriptions` - Tabla Principal**
```sql
CREATE TABLE digital_prescriptions (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number VARCHAR(50) UNIQUE NOT NULL, -- Folio único
    
    -- Relaciones principales
    patient_id UUID NOT NULL REFERENCES patients(id),
    professional_id UUID NOT NULL REFERENCES profiles(id),
    consultation_id UUID REFERENCES consultations(id),
    
    -- Información médica
    diagnosis TEXT NOT NULL,
    clinical_notes TEXT,
    
    -- Datos de prescripción
    prescription_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until DATE NOT NULL, -- Vigencia de la receta
    is_chronic BOOLEAN DEFAULT FALSE, -- Tratamiento crónico
    refills_allowed INTEGER DEFAULT 0, -- Resurtidos permitidos
    refills_used INTEGER DEFAULT 0,
    
    -- Estado y seguridad
    status VARCHAR(20) DEFAULT 'active', -- active, dispensed, expired, cancelled
    verification_code VARCHAR(20) UNIQUE, -- Código de verificación
    qr_code_data TEXT, -- Datos del código QR
    digital_signature TEXT, -- Firma digital del médico
    
    -- Validación externa
    external_validation_id VARCHAR(100), -- ID en sistema externo si aplica
    regulatory_notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    issued_by_system VARCHAR(50) DEFAULT 'mindhub',
    
    -- Tenant context (consistente con arquitectura)
    clinic_id UUID REFERENCES clinics(id),
    workspace_id UUID REFERENCES individual_workspaces(id),
    
    -- Constraints
    CONSTRAINT prescription_tenant_xor CHECK (
        (clinic_id IS NOT NULL AND workspace_id IS NULL) OR 
        (clinic_id IS NULL AND workspace_id IS NOT NULL)
    ),
    CONSTRAINT valid_status CHECK (status IN ('active', 'dispensed', 'expired', 'cancelled'))
);
```

### **2. `prescription_medications` - Medicamentos de la Receta**
```sql
CREATE TABLE prescription_medications (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES digital_prescriptions(id) ON DELETE CASCADE,
    
    -- Información del medicamento
    medication_name VARCHAR(255) NOT NULL,
    active_ingredient VARCHAR(255),
    concentration VARCHAR(100),
    pharmaceutical_form VARCHAR(100), -- tabletas, cápsulas, jarabe, etc.
    presentation VARCHAR(100), -- caja con 10 tabletas, frasco 120ml, etc.
    
    -- PLM/External Integration
    plm_product_id VARCHAR(50), -- ID en PLM si está disponible
    registry_number VARCHAR(50), -- Registro COFEPRIS
    laboratory VARCHAR(255),
    
    -- Prescripción específica
    dosage VARCHAR(255) NOT NULL, -- "250mg cada 8 horas"
    frequency VARCHAR(100) NOT NULL, -- "Cada 8 horas", "3 veces al día"
    duration VARCHAR(100) NOT NULL, -- "Por 7 días", "1 mes"
    quantity_prescribed DECIMAL(10,2), -- Cantidad total prescrita
    unit_of_measure VARCHAR(50), -- tabletas, ml, mg, etc.
    
    -- Instrucciones
    administration_route VARCHAR(50), -- oral, intravenosa, tópica, etc.
    special_instructions TEXT,
    food_instructions VARCHAR(100), -- "Con alimentos", "En ayunas"
    
    -- Validación y seguridad
    is_controlled_substance BOOLEAN DEFAULT FALSE,
    requires_special_handling BOOLEAN DEFAULT FALSE,
    substitution_allowed BOOLEAN DEFAULT TRUE,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_index INTEGER DEFAULT 1 -- Para ordenar medicamentos en la receta
);
```

### **3. `prescription_interactions` - Interacciones Medicamentosas**
```sql
CREATE TABLE prescription_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES digital_prescriptions(id) ON DELETE CASCADE,
    
    -- Detalles de la interacción
    interaction_type VARCHAR(50) NOT NULL, -- drug-drug, drug-food, drug-allergy
    severity_level VARCHAR(20) NOT NULL, -- low, moderate, high, critical
    description TEXT NOT NULL,
    recommendation TEXT,
    
    -- Medicamentos involucrados
    medication_1_id UUID REFERENCES prescription_medications(id),
    medication_2_id UUID REFERENCES prescription_medications(id),
    external_factor VARCHAR(255), -- Para interacciones con alimentos/alergias
    
    -- Estado
    acknowledged_by_doctor BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **4. `prescription_dispensing_log` - Control de Surtimiento**
```sql
CREATE TABLE prescription_dispensing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES digital_prescriptions(id),
    medication_id UUID NOT NULL REFERENCES prescription_medications(id),
    
    -- Información del surtimiento
    dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quantity_dispensed DECIMAL(10,2) NOT NULL,
    remaining_quantity DECIMAL(10,2),
    
    -- Farmacia (futuro)
    pharmacy_name VARCHAR(255),
    pharmacy_license VARCHAR(100),
    pharmacist_name VARCHAR(255),
    pharmacist_license VARCHAR(100),
    
    -- Validación
    verification_method VARCHAR(50), -- qr_code, manual, system
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **5. `medication_database` - Base de Datos Local de Medicamentos**
```sql
CREATE TABLE medication_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificación oficial
    registry_number VARCHAR(50) UNIQUE, -- Registro COFEPRIS
    plm_id VARCHAR(50), -- ID de PLM si disponible
    
    -- Información básica
    commercial_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    active_ingredients TEXT[], -- Array de principios activos
    
    -- Presentación
    concentration VARCHAR(100),
    pharmaceutical_form VARCHAR(100),
    presentation VARCHAR(255),
    
    -- Fabricante
    laboratory VARCHAR(255),
    distributor VARCHAR(255),
    
    -- Clasificación
    therapeutic_group VARCHAR(255),
    atc_code VARCHAR(20), -- Código ATC
    is_controlled BOOLEAN DEFAULT FALSE,
    controlled_substance_category VARCHAR(10), -- I, II, III, IV, V
    
    -- Información clínica
    indications TEXT[],
    contraindications TEXT[],
    side_effects TEXT[],
    interactions TEXT[],
    
    -- Datos comerciales
    average_price DECIMAL(10,2),
    availability_status VARCHAR(50) DEFAULT 'available',
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(50), -- plm, cofepris, manual
    last_verified_at TIMESTAMP WITH TIME ZONE
);
```

---

## 🔧 ARQUITECTURA DE APIs

### **Endpoints Principales**

#### **1. Creación de Recetas**
```
POST /api/prescriptions/
GET  /api/prescriptions/
GET  /api/prescriptions/{id}
PUT  /api/prescriptions/{id}
DELETE /api/prescriptions/{id}
```

#### **2. Gestión de Medicamentos**
```
GET  /api/prescriptions/{id}/medications
POST /api/prescriptions/{id}/medications
PUT  /api/prescriptions/{id}/medications/{med_id}
DELETE /api/prescriptions/{id}/medications/{med_id}
```

#### **3. Base de Datos de Medicamentos**
```
GET  /api/medications/search?q={query}
GET  /api/medications/{id}
POST /api/medications/interactions/check
GET  /api/medications/alternatives/{id}
```

#### **4. Generación de Documentos**
```
GET  /api/prescriptions/{id}/pdf
GET  /api/prescriptions/{id}/qr-code
POST /api/prescriptions/{id}/send-email
```

#### **5. Validación y Seguridad**
```
GET  /api/prescriptions/verify/{code}
POST /api/prescriptions/{id}/digital-sign
GET  /api/prescriptions/patient/{patient_id}
```

---

## 🎨 INTERFAZ DE USUARIO

### **1. Módulo de Creación de Recetas**
- **Buscador de medicamentos** con autocompletado
- **Información en tiempo real** del medicamento seleccionado
- **Validación de interacciones** automática
- **Plantillas de prescripción** frecuentes
- **Integración con consulta** médica actual

### **2. Vista de Gestión**
- **Lista de recetas** del paciente
- **Estados de surtimiento** y vigencia
- **Historial completo** de prescripciones
- **Búsqueda y filtros** avanzados

### **3. Generación de PDFs**
- **Diseño profesional** con logo de la clínica
- **Código QR** para validación
- **Información completa** del médico y paciente
- **Formato estándar** mexicano

---

## 🔐 SEGURIDAD Y VALIDACIÓN

### **Medidas de Seguridad**
1. **Códigos de verificación únicos** por receta
2. **Códigos QR** con información encriptada
3. **Firmas digitales** del médico prescriptor
4. **Audit trail completo** de todas las operaciones
5. **Validación de interacciones** medicamentosas

### **Cumplimiento Regulatorio**
- **Formato conforme** a NOM-059-SSA1-2015
- **Información mínima requerida** por COFEPRIS
- **Trazabilidad completa** para auditorías
- **Respaldo digital** de todas las recetas

---

## 📊 INTEGRACIONES EXTERNAS

### **1. PLM (Diccionario de Medicamentos)**
- **API de consulta** de medicamentos
- **Precios actualizados**
- **Información técnica completa**
- **Alertas de interacciones**

### **2. COFEPRIS (Futuro)**
- **Validación de registros sanitarios**
- **Reporte de sustancias controladas**
- **Cumplimiento regulatorio**

### **3. Farmacias (Futuro)**
- **Validación de recetas**
- **Confirmación de surtimiento**
- **Control de inventarios**

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Base de Datos y APIs (INMEDIATO)**
1. Crear tablas en Supabase
2. Implementar endpoints básicos
3. Sistema de validación y seguridad
4. Integración con tenant architecture

### **Fase 2: Interfaz de Usuario (SIGUIENTE)**
1. Componentes de creación de recetas
2. Buscador de medicamentos
3. Vista de gestión y listados
4. Integración con módulo de consultas

### **Fase 3: Generación de PDFs (DESPUÉS)**
1. Plantillas profesionales
2. Códigos QR y validación
3. Sistema de envío por email
4. Impresión directa

### **Fase 4: Integraciones Externas (FINAL)**
1. Conexión con PLM
2. Base de datos de medicamentos
3. Sistema de validación externa
4. Preparación para farmacias

---

**🎯 OBJETIVO**: Sistema completo, profesional y funcional de recetas digitales integrado perfectamente con MindHub, listo para uso en producción con todas las validaciones y seguridades necesarias.**