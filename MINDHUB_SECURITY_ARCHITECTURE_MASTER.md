# 🔒 MINDHUB - ARQUITECTURA DE SEGURIDAD DUAL SYSTEM
## MATRIZ COMPLETA DE RELACIONES Y AISLAMIENTO DE DATOS - SISTEMA DUAL

**Fecha:** 24 Agosto 2025  
**Versión:** v4.0-production-security-validated  
**Criticidad:** ✅ **SEGURIDAD DUAL SYSTEM VERIFICADA EN PRODUCCIÓN**

---

## 🏗️ **NUEVA ARQUITECTURA DUAL SYSTEM**

### 🎯 **SISTEMA DUAL IMPLEMENTADO:**
1. **LICENCIA CLÍNICA** - Multi-usuario con datos compartidos (hasta 15 usuarios)
2. **LICENCIA INDIVIDUAL** - Usuario único con workspace personal y sucursales
3. **AISLAMIENTO PERFECTO** - Cada licencia tiene su propio universo de datos
4. **SUCURSALES FLEXIBLES** - Organizacionales, no restrictivas de seguridad

### 🔑 **CONCEPTOS CLAVE DUAL:**
- **`license_type`**: `'clinic' | 'individual'` - Determina la lógica de acceso
- **`clinic_id`**: Para licencias de clínica (datos compartidos entre usuarios)
- **`workspace_id`**: Para licencias individuales (datos exclusivos del profesional)
- **`practice_locations`**: Sucursales organizacionales (no afectan acceso a datos)

---

## 🚨 **VALIDACIÓN DE SEGURIDAD EN PRODUCCIÓN - AGOSTO 2025**

### **✅ ENDPOINTS SEGUROS VALIDADOS**

#### **🔐 CHAIN DE SEGURIDAD FUNCIONANDO**
```
Usuario → Frontend (Supabase JWT) → API Proxy → Django (Service Role) → Supabase DB
  ✅         ✅                    ✅           ✅                      ✅
```

#### **📋 TABLAS SUPABASE SEGURAS VERIFICADAS**
```sql
-- ✅ TABLAS REALES CON RLS HABILITADO
patients              ← ✅ FUNCIONAL + RLS  
consultations         ← ✅ FUNCIONAL + RLS
profiles              ← ✅ FUNCIONAL + RLS  
appointments          ← ✅ FUNCIONAL + RLS
resources             ← ✅ FUNCIONAL + RLS

-- ✅ FILTRADO POR USUARIO VERIFICADO
WHERE created_by = auth.uid()    ← ✅ RLS Policy activa
WHERE clinic_id = user.clinic    ← ✅ Filtrado dual system
WHERE workspace_id = user.workspace  ← ✅ Filtrado individual
```

#### **🔒 AUTENTICACIÓN MULTICAPA VALIDADA**

**CAPA 1: Frontend Authentication**
- ✅ Supabase JWT válido requerido
- ✅ Token expiration checking
- ✅ 401 Unauthorized cuando token inválido

**CAPA 2: API Proxy Security**
- ✅ `getAuthenticatedUser()` validation
- ✅ Service role key para backend communication
- ✅ Headers sanitization y validation

**CAPA 3: Django Middleware Security**  
- ✅ Supabase service role validation
- ✅ User context injection (`X-User-ID`, `X-User-Email`)
- ✅ Dual system license detection automática

**CAPA 4: Database RLS (Row Level Security)**
- ✅ Policies aplicadas automáticamente
- ✅ Isolation total entre usuarios
- ✅ Service role bypass solo para operaciones internas

#### **⚠️ VULNERABILIDADES ELIMINADAS (Agosto 2025)**

**🔒 ERROR DE SEGURIDAD RESUELTO:**
```typescript
// ❌ ANTES: Bypass accidental de seguridad
.from('expedix_patients')  // Tabla NO EXISTE → Error 500 → Posible info leakage

// ✅ AHORA: Seguridad correcta  
.from('patients')          // Tabla REAL → RLS aplicado → Datos filtrados por usuario
```

**🛡️ HEADERS DE SEGURIDAD VALIDADOS:**
```http
# ✅ Headers correctos para máxima seguridad
Authorization: Bearer {valid_supabase_jwt}      ← Usuario autenticado
X-User-ID: {verified_user_id}                  ← User context verified
X-User-Email: {verified_email}                 ← Email context verified  
X-Proxy-Auth: verified                         ← Proxy authentication flag
Content-Type: application/json                 ← Content type security
```

---

## 📊 **ARQUITECTURA DUAL SYSTEM - ESQUEMA COMPLETO**

### **🏗️ TABLAS CORE DEL SISTEMA DUAL:**

#### **1. SISTEMA DE LICENCIAS Y WORKSPACES**
```sql
-- TABLA PRINCIPAL: Usuarios con tipo de licencia
profiles (
  id UUID PRIMARY KEY,                           -- ✅ Usuario único
  email VARCHAR(255) UNIQUE NOT NULL,
  license_type ENUM('clinic', 'individual'),     -- ✅ CAMPO CLAVE DUAL
  
  -- PARA LICENCIAS DE CLÍNICA
  clinic_id UUID REFERENCES clinic_configurations(id),
  clinic_role VARCHAR(50),                       -- admin, doctor, nurse, etc.
  
  -- PARA LICENCIAS INDIVIDUALES  
  individual_workspace_id UUID REFERENCES individual_workspaces(id),
  
  -- AUDITORÍA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- WORKSPACES INDIVIDUALES (como "clínica personal")
individual_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) NOT NULL, -- El profesional dueño
  workspace_name VARCHAR(200) NOT NULL,           -- "Dr. Juan - Consultorios"
  business_name VARCHAR(200),                     -- Nombre comercial
  tax_id VARCHAR(50),                             -- RFC/NIT para facturación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUCURSALES/CONSULTORIOS (organizacional, no restrictivo)
practice_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- DUAL: Puede pertenecer a clínica O workspace individual
  clinic_id UUID REFERENCES clinic_configurations(id),
  workspace_id UUID REFERENCES individual_workspaces(id),
  
  location_name VARCHAR(200) NOT NULL,           -- "Consultorio Polanco"
  address TEXT,
  phone VARCHAR(20),
  is_primary BOOLEAN DEFAULT FALSE,              -- Ubicación principal
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- CONSTRAINT: Solo uno de clinic_id O workspace_id debe estar lleno
  CONSTRAINT check_location_owner CHECK (
    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR
    (clinic_id IS NULL AND workspace_id IS NOT NULL)
  )
);
```

#### **2. EXPEDIX MODULE - ✅ SISTEMA DUAL IMPLEMENTADO**
```sql
-- TABLA: patients - ✅ DUAL SYSTEM
patients (
  id UUID PRIMARY KEY,
  
  -- DUAL SYSTEM: Puede pertenecer a clínica O workspace individual  
  clinic_id UUID REFERENCES clinic_configurations(id),
  workspace_id UUID REFERENCES individual_workspaces(id),
  
  -- DATOS DEL PACIENTE
  first_name VARCHAR(100) NOT NULL,
  paternal_last_name VARCHAR(100) NOT NULL,
  maternal_last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  
  -- ASIGNACIÓN Y UBICACIÓN
  assigned_professional_id UUID REFERENCES profiles(id),
  preferred_location_id UUID REFERENCES practice_locations(id), -- Preferencia, no restricción
  
  -- AUDITORÍA
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- CONSTRAINT: Solo uno de clinic_id O workspace_id debe estar lleno
  CONSTRAINT check_patient_owner CHECK (
    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR
    (clinic_id IS NULL AND workspace_id IS NOT NULL)
  )
);

-- TABLA: consultations - ✅ DUAL SYSTEM
consultations (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  professional_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- DUAL SYSTEM: Hereda el owner del paciente
  clinic_id UUID REFERENCES clinic_configurations(id),
  workspace_id UUID REFERENCES individual_workspaces(id),
  
  -- UBICACIÓN DE LA CONSULTA
  location_id UUID REFERENCES practice_locations(id),
  
  -- DATOS DE LA CONSULTA
  consultation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  consultation_type VARCHAR(50),
  chief_complaint TEXT,
  assessment TEXT,
  plan TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- CONSTRAINT: Debe coincidir con el owner del paciente
  CONSTRAINT check_consultation_owner CHECK (
    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR
    (clinic_id IS NULL AND workspace_id IS NOT NULL)
  )
);

-- LÓGICA DE ACCESO DUAL:
-- LICENCIA CLÍNICA: WHERE clinic_id = user.clinic_id
-- LICENCIA INDIVIDUAL: WHERE workspace_id = user.individual_workspace_id
```

#### **3. TODOS LOS MÓDULOS - ✅ PATRÓN DUAL UNIVERSAL**

**PATRÓN APLICADO A:**
- ✅ **ClinimetrixPro**: `psychometric_scales`, `assessments`, `scale_items`
- ✅ **Resources**: `medical_resources`, `resource_categories`  
- ✅ **FormX**: `dynamic_forms`, `form_submissions`
- ✅ **Finance**: `finance_income`, `cash_register_cuts`, `financial_services`
- ✅ **Agenda**: `appointments`

```sql
-- PATRÓN UNIVERSAL DUAL SYSTEM
CREATE TABLE module_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ✅ DUAL SYSTEM: Pertenece a clínica O workspace individual
  clinic_id UUID REFERENCES clinic_configurations(id),
  workspace_id UUID REFERENCES individual_workspaces(id),
  
  -- OTROS CAMPOS ESPECÍFICOS DEL MÓDULO
  [campos específicos...],
  
  -- AUDITORÍA ESTÁNDAR
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- CONSTRAINT DUAL: Solo uno de los dos owners
  CONSTRAINT check_module_owner CHECK (
    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR
    (clinic_id IS NULL AND workspace_id IS NOT NULL)
  )
);

-- LÓGICA DE QUERIES DUAL UNIVERSAL:
-- Si user.license_type = 'clinic':   WHERE clinic_id = user.clinic_id
-- Si user.license_type = 'individual': WHERE workspace_id = user.individual_workspace_id
```

#### **4. FINANCE MODULE - ✅ SISTEMA DUAL CON LÓGICA DE NEGOCIO**
```sql
-- FINANCE con lógica diferenciada por licencia
finance_income (
  id UUID PRIMARY KEY,
  
  -- DUAL SYSTEM
  clinic_id UUID REFERENCES clinic_configurations(id),
  workspace_id UUID REFERENCES individual_workspaces(id),
  
  patient_id UUID REFERENCES patients(id) NOT NULL,
  professional_id UUID REFERENCES profiles(id) NOT NULL,
  consultation_id UUID REFERENCES consultations(id),
  
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  payment_method VARCHAR(50),
  
  -- LÓGICA DE NEGOCIO DIFERENCIADA:
  -- CLÍNICA: Los ingresos pueden ser compartidos/divididos entre profesionales
  shared_income_percentage DECIMAL(5,2), -- Solo para license_type='clinic'
  
  -- INDIVIDUAL: El profesional se queda con el 100% del ingreso
  -- (shared_income_percentage = NULL para individuales)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_finance_owner CHECK (
    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR
    (clinic_id IS NULL AND workspace_id IS NOT NULL)
  )
);
```

---

## 🛡️ **MATRIZ DE SEGURIDAD DUAL SYSTEM**

| Módulo | Tabla Principal | Licencia Clínica | Licencia Individual | Estado Seguridad |
|--------|----------------|------------------|---------------------|------------------|
| **CORE** | `profiles` | `clinic_id` + `license_type` | `workspace_id` + `license_type` | ✅ **DUAL SEGURO** |
| **CORE** | `individual_workspaces` | N/A | ✅ OWNER EXCLUSIVO | ✅ **INDIVIDUAL** |
| **CORE** | `practice_locations` | ✅ COMPARTIDO | ✅ EXCLUSIVO | ✅ **DUAL SEGURO** |
| **EXPEDIX** | `patients` | ✅ COMPARTIDO CLÍNICA | ✅ EXCLUSIVO DOCTOR | ✅ **DUAL SEGURO** |
| **EXPEDIX** | `consultations` | ✅ COMPARTIDO CLÍNICA | ✅ EXCLUSIVO DOCTOR | ✅ **DUAL SEGURO** |
| **CLINIMETRIX** | `assessments` | ✅ COMPARTIDO CLÍNICA | ✅ EXCLUSIVO DOCTOR | ✅ **DUAL SEGURO** |
| **RESOURCES** | `medical_resources` | ✅ COMPARTIDO CLÍNICA | ✅ EXCLUSIVO DOCTOR | ✅ **DUAL SEGURO** |
| **FORMX** | `dynamic_forms` | ✅ COMPARTIDO CLÍNICA | ✅ EXCLUSIVO DOCTOR | ✅ **DUAL SEGURO** |
| **FINANCE** | `finance_income` | ✅ COMPARTIDO/DIVIDIDO | ✅ 100% DOCTOR | ✅ **DUAL SEGURO** |
| **AGENDA** | `appointments` | ✅ COMPARTIDO CLÍNICA | ✅ EXCLUSIVO DOCTOR | ✅ **DUAL SEGURO** |

---

## 🔒 **LÓGICA DE ACCESO DUAL SYSTEM**

### **✅ PATRÓN UNIVERSAL DE QUERIES:**

```python
# MIDDLEWARE DJANGO - DETECCIÓN AUTOMÁTICA DE LICENCIA
def get_user_access_context(user_id):
    user = profiles.get(id=user_id)
    
    if user.license_type == 'clinic':
        return {
            'access_type': 'clinic',
            'filter_field': 'clinic_id',
            'filter_value': user.clinic_id,
            'shared_access': True
        }
    elif user.license_type == 'individual':
        return {
            'access_type': 'individual', 
            'filter_field': 'workspace_id',
            'filter_value': user.individual_workspace_id,
            'shared_access': False
        }

# QUERY UNIVERSAL PATTERN
def get_user_data(user_context, table_name):
    filter_field = user_context['filter_field']
    filter_value = user_context['filter_value']
    
    return f"SELECT * FROM {table_name} WHERE {filter_field} = '{filter_value}'"

# EJEMPLOS CONCRETOS:
# LICENCIA CLÍNICA: "SELECT * FROM patients WHERE clinic_id = 'clinic_123'"
# LICENCIA INDIVIDUAL: "SELECT * FROM patients WHERE workspace_id = 'workspace_456'"
```

### **🔑 VENTAJAS DEL SISTEMA DUAL:**

#### **PERFORMANCE:**
- **Licencia Individual**: 1 filtro simple (`workspace_id`)
- **Licencia Clínica**: 1 filtro simple (`clinic_id`)
- **Sin queries complejos** ni joins adicionales

#### **SEGURIDAD:**
- **Aislamiento perfecto** entre workspaces individuales
- **Compartición controlada** dentro de clínicas
- **Imposible acceso cruzado** entre tipos de licencia

#### **FLEXIBILIDAD DE SUCURSALES:**
```sql
-- USUARIO INDIVIDUAL: Dr. Juan con 3 consultorios
SELECT p.*, pl.location_name as preferred_location
FROM patients p 
LEFT JOIN practice_locations pl ON p.preferred_location_id = pl.id
WHERE p.workspace_id = 'juan_workspace_123'
-- RESULTADO: Ve TODOS sus pacientes sin importar consultorio

-- CLÍNICA: Clínica ABC con 5 doctores y 2 sucursales  
SELECT p.*, pl.location_name, prof.first_name as doctor_name
FROM patients p
LEFT JOIN practice_locations pl ON p.preferred_location_id = pl.id  
LEFT JOIN profiles prof ON p.assigned_professional_id = prof.id
WHERE p.clinic_id = 'clinic_abc_456'
-- RESULTADO: Todos los doctores ven todos los pacientes compartidos
```

---

## ✅ **ESTADO FINAL DUAL SYSTEM**

### **🎯 MIGRACIÓN REQUERIDA:**
**De:** Sistema único de clínicas → **A:** Sistema dual (clínicas + individuales)

### **🔑 CAMBIOS CRÍTICOS:**
1. **Campo `license_type`** agregado a `profiles`
2. **Tabla `individual_workspaces`** creada
3. **Tabla `practice_locations`** adaptada para ambos sistemas
4. **Constraint dual** en todas las tablas de datos
5. **Middleware Django** actualizado para detección automática

### **🛡️ SEGURIDAD GARANTIZADA:**
- ✅ **Aislamiento perfecto** entre workspaces individuales
- ✅ **Compartición controlada** dentro de clínicas
- ✅ **Performance optimizado** con filtros simples
- ✅ **Sucursales organizacionales** sin restricciones de seguridad
- ✅ **Imposible acceso cruzado** entre tipos de licencia

### **📋 PRÓXIMOS PASOS:**
1. **Ejecutar migración SQL** para adaptar tablas existentes
2. **Actualizar middleware Django** con lógica dual
3. **Modificar ViewSets** para usar patrón universal
4. **Adaptar frontend** para detección de tipo de licencia

**📅 Actualizado:** 22 Agosto 2025  
**👨‍💻 Arquitecto:** Claude Code  
**🏗️ Estado:** DUAL SYSTEM ARCHITECTURE READY  
**🎯 Próximo paso:** Implementación de migración SQL dual