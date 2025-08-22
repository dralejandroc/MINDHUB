# 💼 MINDHUB - LÓGICA DE NEGOCIO DUAL SYSTEM
## ESPECIFICACIONES DE NEGOCIO - LICENCIAS CLÍNICAS VS INDIVIDUALES

**Fecha:** 22 Agosto 2025  
**Versión:** v1.0-business-logic  
**Estado:** 📋 **ESPECIFICACIONES COMPLETAS**

---

## 🎯 **MODELO DE NEGOCIO DUAL**

### **DOS TIPOS DE LICENCIA DIFERENCIADAS:**

#### **1. LICENCIA CLÍNICA** 💼
- **Target**: Clínicas, hospitales, centros médicos
- **Usuarios**: Hasta 15 profesionales de la salud
- **Precio**: $199.99 USD/mes
- **Modelo**: Datos compartidos entre todos los usuarios

#### **2. LICENCIA INDIVIDUAL** 👨‍⚕️  
- **Target**: Profesionales independientes, consultorios privados
- **Usuarios**: 1 profesional únicamente
- **Precio**: $49.99 USD/mes
- **Modelo**: Datos exclusivos del profesional

---

## 🏥 **LICENCIA CLÍNICA - ESPECIFICACIONES**

### **CARACTERÍSTICAS PRINCIPALES:**
- ✅ **Multi-usuario**: Hasta 15 profesionales
- ✅ **Datos compartidos**: Todos ven todos los pacientes
- ✅ **Roles diferenciados**: Admin, Doctor, Enfermera, Recepcionista
- ✅ **Sucursales múltiples**: Hasta 10 ubicaciones
- ✅ **Recursos compartidos**: Formularios, plantillas, documentos
- ✅ **Ingresos distribuidos**: División de ganancias entre profesionales

### **FUNCIONALIDADES EXCLUSIVAS:**
```
EXPEDIX (Pacientes):
- Pacientes compartidos entre todos los doctores
- Asignación de pacientes a profesionales específicos
- Historial médico accesible por todo el equipo autorizado
- Transferencia de pacientes entre doctores

FINANZAS:
- Dashboard financiero consolidado de la clínica
- División de ingresos por profesional
- Configuración de porcentajes por doctor
- Reportes de facturación consolidados
- Gestión de gastos compartidos

RECURSOS:
- Biblioteca compartida de documentos médicos
- Plantillas de formularios para toda la clínica
- Protocolos médicos estandarizados
- Recursos educativos para pacientes

AGENDA:
- Calendario compartido con vista de todos los profesionales
- Gestión de salas/consultorios
- Citas cruzadas entre especialistas
- Lista de espera compartida

CLINIMETRIX PRO:
- Escalas compartidas entre profesionales
- Evaluaciones accesibles por el equipo
- Reportes consolidados de la clínica
- Comparativas entre profesionales
```

### **LÓGICA DE PERMISOS:**
```
ADMIN CLÍNICA:
- Acceso total a todos los datos
- Configuración de usuarios y roles
- Reportes financieros completos
- Gestión de sucursales

DOCTOR:
- Acceso a todos los pacientes (lectura)
- Modificación solo de pacientes asignados
- Consultas con cualquier paciente
- Evaluaciones propias y lectura de otras

ENFERMERA/ASISTENTE:
- Acceso limitado a datos de pacientes
- Gestión de agenda
- Captura de signos vitales
- Sin acceso a finanzas
```

---

## 👨‍⚕️ **LICENCIA INDIVIDUAL - ESPECIFICACIONES**

### **CARACTERÍSTICAS PRINCIPALES:**
- ✅ **Usuario único**: Solo el profesional propietario
- ✅ **Datos exclusivos**: Total privacidad de información
- ✅ **Múltiples consultorios**: Hasta 5 ubicaciones
- ✅ **Recursos privados**: Formularios y documentos personales
- ✅ **Ingresos completos**: 100% para el profesional

### **FUNCIONALIDADES ESPECÍFICAS:**
```
EXPEDIX (Pacientes):
- Pacientes exclusivos del profesional
- Sin compartición de datos
- Historial médico completamente privado
- Control total sobre la información

FINANZAS:
- Dashboard financiero personal
- 100% de los ingresos para el profesional
- Sin división ni porcentajes
- Control total de gastos
- Facturación individualizada

RECURSOS:
- Biblioteca personal de documentos
- Plantillas y formularios privados
- Recursos exclusivos del profesional
- Sin acceso a recursos de terceros

AGENDA:
- Calendario personal únicamente
- Gestión de múltiples consultorios
- Sin vista de otros profesionales
- Agenda completamente privada

CLINIMETRIX PRO:
- Escalas y evaluaciones privadas
- Reportes individuales únicamente
- Sin acceso a data de otros profesionales
- Configuración personalizada
```

### **FLEXIBILIDAD DE SUCURSALES:**
```
CONSULTORIOS MÚLTIPLES:
Dr. Juan González (Licencia Individual)
├── Consultorio Polanco (Ubicación Principal)
├── Consultorio Roma Norte (Sucursal)
├── Consultorio Satelite (Sucursal)
└── Consultas a domicilio (Virtual)

FUNCIONALIDAD:
- El Dr. Juan ve TODOS sus pacientes desde cualquier consultorio
- Puede agendar en cualquier ubicación
- Los pacientes tienen "consultorio preferido" pero no restrictivo
- Reportes consolidados de todas las ubicaciones
```

---

## 💰 **DIFERENCIAS EN MODELO FINANCIERO**

### **LICENCIA CLÍNICA - DISTRIBUCIÓN DE INGRESOS:**
```python
# Ejemplo: Consulta de $500 MXN
ingreso_total = 500.00

# Configuración de la clínica (ejemplo)
porcentaje_clinica = 30%    # $150 para gastos/ganancia clínica
porcentaje_doctor = 70%     # $350 para el doctor

# Dashboard de la clínica muestra:
- Ingresos totales: $500
- Distribución: Clínica $150, Dr. López $350
- Métricas: Todos los doctores y sus ingresos

# Dashboard del doctor muestra:
- Sus ingresos: $350 (70% de $500)
- Sus pacientes atendidos
- Sus estadísticas personales
```

### **LICENCIA INDIVIDUAL - INGRESOS COMPLETOS:**
```python
# Ejemplo: Consulta de $500 MXN
ingreso_total = 500.00

# Para licencia individual:
porcentaje_profesional = 100%    # $500 completos para el doctor

# Dashboard del profesional muestra:
- Ingresos totales: $500 (100%)
- Sin división ni distribución
- Control total de las finanzas
- Gestión personalizada de gastos
```

---

## 🔄 **ESCALABILIDAD Y UPGRADES**

### **MIGRACIÓN INDIVIDUAL → CLÍNICA:**
```
ESCENARIO: Dr. Juan (licencia individual) contrata a la Dra. Ana

PROCESO AUTOMÁTICO:
1. El workspace individual se convierte en clínica
2. Los datos del Dr. Juan se mantienen
3. Se crea acceso para la Dra. Ana
4. Los pacientes pasan a ser "compartidos" 
5. Se configura distribución de ingresos
6. Se actualiza la facturación automáticamente

RESULTADO:
- Dr. Juan mantiene acceso a todos sus pacientes históricos
- Dra. Ana puede ver pacientes existentes (con permisos)
- Nuevos pacientes son compartidos por defecto
- Finanzas se redistribuyen según configuración
```

### **DOWNGRADE CLÍNICA → INDIVIDUAL:**
```
ESCENARIO: Clínica se reduce a 1 solo profesional

PROCESO CONTROLADO:
1. Se identifica al profesional principal/propietario
2. Los datos se filtran para mostrar solo sus pacientes
3. Se oculta información de otros profesionales
4. Se actualiza modelo financiero a 100%
5. Se elimina acceso de usuarios adicionales

PROTECCIÓN DE DATOS:
- Cada profesional conserva sus datos al irse
- No se pierde información histórica
- Exportación completa antes del downgrade
```

---

## 📊 **FEATURES COMPARISON TABLE**

| Feature | Licencia Clínica | Licencia Individual |
|---------|------------------|---------------------|
| **Usuarios** | Hasta 15 | 1 único |
| **Precio/mes** | $199.99 USD | $49.99 USD |
| **Pacientes** | Compartidos | Exclusivos |
| **Sucursales** | Hasta 10 | Hasta 5 |
| **Ingresos** | Distribuidos % | 100% profesional |
| **Recursos** | Compartidos | Privados |
| **Agenda** | Multi-profesional | Personal |
| **Evaluaciones** | Compartidas | Privadas |
| **Roles/Permisos** | Múltiples roles | Solo propietario |
| **Reportes** | Consolidados | Individuales |
| **Escalabilidad** | Automática | Upgrade manual |
| **Data Privacy** | Nivel clínica | Nivel profesional |

---

## 🎯 **TARGET CUSTOMERS**

### **LICENCIA CLÍNICA - IDEAL PARA:**
- 🏥 Clínicas médicas con múltiples especialistas
- 🏥 Centros de salud mental con equipo multidisciplinario  
- 🏥 Consultorios grupales de psicología
- 🏥 Hospitales pequeños y medianos
- 🏥 Centros de rehabilitación
- 🏥 Clínicas especializadas (cardiología, dermatología, etc.)

### **LICENCIA INDIVIDUAL - IDEAL PARA:**
- 👨‍⚕️ Psicólogos independientes
- 👨‍⚕️ Psiquiatras en práctica privada
- 👨‍⚕️ Médicos familiares independientes
- 👨‍⚕️ Terapeutas en consulta privada
- 👨‍⚕️ Profesionales con múltiples consultorios
- 👨‍⚕️ Doctores emprendiendo su práctica

---

## 📈 **PROYECCIÓN DE CRECIMIENTO**

### **RUTA DE CRECIMIENTO TÍPICA:**
```
1. PROFESIONAL INDIVIDUAL
   └── Licencia Individual ($49.99/mes)
   
2. CRECIMIENTO DEL NEGOCIO  
   └── Contrata asistente/enfermera
   
3. UPGRADE A CLÍNICA
   └── Licencia Clínica ($199.99/mes)
   
4. EXPANSIÓN DE EQUIPO
   └── Hasta 15 profesionales incluidos
   
5. ENTERPRISE (FUTURO)
   └── Licencias corporativas para hospitales
```

### **RETENCIÓN Y FIDELIZACIÓN:**
- ✅ **Migración sin pérdida de datos**
- ✅ **Grandfathering de precios** por 6 meses
- ✅ **Soporte premium** durante transición
- ✅ **Training gratuito** para nuevos usuarios en clínicas
- ✅ **API access** para integraciones empresariales

---

**📅 Especificado:** 22 Agosto 2025  
**👨‍💼 Business Analyst:** Claude Code  
**📋 Estado:** LÓGICA DE NEGOCIO COMPLETA  
**🎯 Resultado:** Especificaciones listas para implementación técnica