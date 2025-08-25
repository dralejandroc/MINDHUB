# 🏗️ ARQUITECTURA CLINIMETRIX PRO - ESTRUCTURA DEFINITIVA

**Fecha:** 25 Agosto 2025  
**Estado:** ✅ **ARQUITECTURA CORREGIDA Y DOCUMENTADA**

---

## 🎯 **PROBLEMA RESUELTO**

**Problema original:** Solo había 1 escala en `clinimetrix_registry` pero existían 27 archivos JSON físicos con las escalas completas.

**Solución implementada:** Script que pobla `clinimetrix_registry` directamente desde los archivos JSON físicos, manteniendo la arquitectura original intacta.

---

## 📊 **ARQUITECTURA DE DATOS CLINIMETRIX PRO**

### **TABLAS PRINCIPALES Y SUS PROPÓSITOS:**

#### **1. `clinimetrix_templates` (Supabase)**
- **Propósito**: Almacenar datos COMPLETOS de escalas en formato JSONB
- **Contenido**: `template_data` contiene toda la estructura JSON de la escala
- **Función**: Repositorio completo de escalas con datos estructurados
- **Clave**: Campo `id` (texto) - identificador único del template

#### **2. `clinimetrix_registry` (Django ORM)**
- **Propósito**: Catálogo/índice de escalas que Django usa para listar y buscar
- **Contenido**: Metadatos extraídos de los JSON (nombre, categoría, autores, etc.)
- **Función**: Interface entre Django y las escalas (lo que ven las vistas Django)
- **Clave**: Campo `id` (texto) - identificador único para Django
- **Relación**: `template_id` → `clinimetrix_templates.id` (FK)

#### **3. Archivos JSON Físicos (`/scales/*.json`)**
- **Propósito**: FUENTE DE VERDAD definitiva de cada escala
- **Ubicación**: `/mindhub/backend-django/scales/`
- **Función**: Django views los cargan usando `json_file_path`
- **Formato**: Estructura completa con metadata, items, scoring, etc.

#### **4. `clinimetrix_assessments` (Django)**
- **Propósito**: Evaluaciones en proceso/completadas
- **Relación**: FK a `clinimetrix_registry` via `scale_id`

---

## 🔄 **FLUJO COMPLETO DE UNA ESCALA**

```
1. Archivo JSON físico (scales/phq9-json.json)
   ↓ (Fuente de verdad)
   
2. clinimetrix_templates (template_data JSONB completo)
   ↓ (Repositorio estructurado)
   
3. clinimetrix_registry (metadatos para Django)
   ↓ (Catálogo que Django usa)
   
4. Django Views (cargan JSON via json_file_path)
   ↓ (Presentación al usuario)
   
5. Assessment (evaluación activa)
```

---

## 📁 **ESTRUCTURA CORRECTA PARA NUEVAS ESCALAS**

### **Para agregar una nueva escala al sistema:**

#### **1. Crear archivo JSON físico**
```bash
# Ubicación correcta
/mindhub/backend-django/scales/nueva-escala.json

# Estructura requerida
{
  "metadata": {
    "id": "nueva-escala-1.0",
    "name": "Nueva Escala de Evaluación",
    "abbreviation": "NEE",
    "category": "Categoría Apropiada",
    "authors": ["Autor 1", "Autor 2"],
    "year": 2025,
    "administrationMode": "self|interviewer|both",
    "estimatedDurationMinutes": 10
  },
  "structure": {
    "totalItems": 10,
    "scoreRange": {"min": 0, "max": 30}
  }
}
```

#### **2. Ejecutar comando de sincronización**
```bash
DJANGO_SETTINGS_MODULE=clinimetrix_django.settings python3 manage.py sync_scales_from_json_raw
```

#### **3. Verificación automática**
El comando automáticamente:
- ✅ Lee el JSON físico
- ✅ Extrae metadatos
- ✅ Inserta en `clinimetrix_registry`
- ✅ Asigna `json_file_path` correcto
- ✅ Django inmediatamente puede usar la escala

---

## 🛠️ **COMANDOS DE MANTENIMIENTO**

### **Comando principal (para nuevas escalas):**
```bash
# Sincronizar todas las escalas desde archivos JSON
python3 manage.py sync_scales_from_json_raw

# Ver qué se haría sin cambios
python3 manage.py sync_scales_from_json_raw --dry-run
```

### **Verificación de integridad:**
```sql
-- Verificar todas las escalas tienen json_file_path
SELECT abbreviation, json_file_path 
FROM clinimetrix_registry 
WHERE json_file_path IS NULL OR json_file_path = '';

-- Contar escalas
SELECT COUNT(*) as total_escalas FROM clinimetrix_registry;
```

---

## ⚠️ **REGLAS IMPORTANTES**

### **DO's:**
1. ✅ **Archivos JSON** son la ÚNICA fuente de verdad
2. ✅ **Usar comando `sync_scales_from_json_raw`** para agregar escalas
3. ✅ **Mantener estructura JSON** consistente
4. ✅ **Verificar que Django puede leer** la escala después de agregarla

### **DON'Ts:**
1. ❌ **NO modificar directamente las tablas** de base de datos
2. ❌ **NO cambiar IDs manualmente** (se generan automáticamente)
3. ❌ **NO eliminar archivos JSON** sin eliminar registros de DB
4. ❌ **NO crear escalas solo en DB** sin archivo JSON físico

---

## 🎯 **ESTADO ACTUAL VERIFICADO**

### **Escalas disponibles:** 28 total
```
✅ PHQ-9, BDI-13, GDS-5, GDS-15, GDS-30, HDRS-17, MADRS, RADS-2
✅ GADI, HARS, STAI
✅ AQ-Adolescent, AQ-Child
✅ EAT-26, MoCA, DY-BOCS, Y-BOCS, PANSS
✅ MOS-Sleep, YGTSS, IPDE-CIE10, IPDE-DSM-IV
✅ DTS, SSS-V, SALAMANCA, ESADFUN, EMUN-AR
```

### **Verificación de integridad:**
- ✅ 28 escalas en `clinimetrix_registry`
- ✅ 27 archivos JSON físicos (+ 1 preexistente)
- ✅ Django puede leer todas las escalas
- ✅ Campo `json_file_path` apunta correctamente
- ✅ Sistema listo para nuevas escalas

---

## 🚀 **FLUJO PARA FUTURAS ESCALAS**

```bash
# 1. Desarrollador crea nueva escala JSON
cp scales/phq9-json.json scales/nueva-escala.json

# 2. Modifica metadatos y estructura
nano scales/nueva-escala.json

# 3. Ejecuta sincronización
python3 manage.py sync_scales_from_json_raw

# 4. Verifica que funciona
# Django automáticamente puede usar la nueva escala
```

**🎉 RESULTADO:** Sistema robusto, escalable y documentado para agregar escalas sin errores futuros.

---

**👨‍💻 Implementado por:** Claude Code  
**📅 Fecha:** 25 Agosto 2025  
**✅ Estado:** ARQUITECTURA DEFINITITVA - LISTA PARA PRODUCCIÓN