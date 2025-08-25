# 📋 INSTRUCCIONES CRÍTICAS PARA CONSULTA DE ARQUITECTURA

## 🎯 **FUENTES DE VERDAD OFICIALES**

Cada vez que se requiera hacer un ajuste, cambio, update, o implementación nueva en MindHub, **OBLIGATORIAMENTE** consultar estos archivos como fuente de información más actualizada:

### **📚 ARCHIVOS DE REFERENCIA OBLIGATORIA:**

1. **`/MINDHUB_API_ARCHITECTURE_MASTER.md`** - Arquitectura completa, endpoints, patrones de diseño
2. **`/MINDHUB_LESSONS_LEARNED.md`** - Errores conocidos, soluciones validadas, mejores prácticas
3. **`/MINDHUB_SECURITY_ARCHITECTURE_MASTER.md`** - Seguridad, permisos, constraints, validaciones

## 🔥 **PROTOCOLO DE CONSULTA OBLIGATORIO**

### **ANTES de implementar CUALQUIER cambio:**

1. **Leer los 3 archivos** para entender el contexto actual
2. **Verificar patrones existentes** para mantener consistencia  
3. **Revisar lecciones aprendidas** para evitar errores conocidos
4. **Validar seguridad** contra matriz de permisos establecida
5. **Seguir arquitectura dual system** para escalabilidad

### **DESPUÉS de implementar cambios:**

1. **Actualizar los 3 archivos** con la nueva información
2. **Documentar lecciones aprendidas** de la implementación  
3. **Validar seguridad** de los nuevos endpoints/funcionalidades
4. **Incrementar versión** en headers de documentos

## 🎯 **OBJETIVOS DE ESTA PRÁCTICA:**

- ✅ **Escalabilidad**: Mantener patrones consistentes
- ✅ **Consistencia**: Evitar duplicación de esfuerzos  
- ✅ **Calidad**: Aplicar mejores prácticas validadas
- ✅ **Seguridad**: Seguir matriz de permisos establecida
- ✅ **Documentación**: Base de conocimiento actualizada
- ✅ **Eficiencia**: Evitar repetir errores ya resueltos

## ⚠️ **ADVERTENCIA CRÍTICA**

**NO IMPLEMENTAR** ningún cambio sin consultar estos archivos. La información aquí contenida ha sido validada en producción y representa el conocimiento acumulado del proyecto.

La omisión de esta consulta puede resultar en:
- 🚨 Errores de arquitectura
- 🚨 Vulnerabilidades de seguridad
- 🚨 Inconsistencias de diseño  
- 🚨 Duplicación de trabajo
- 🚨 Regresión de funcionalidades

## 📅 **VIGENCIA**

Esta instrucción tiene vigencia permanente y debe ser respetada por todos los desarrolladores y sistemas que trabajen en MindHub.

---

**Creado:** 25 Agosto 2025  
**Autor:** Claude Code + Usuario  
**Propósito:** Garantizar consulta obligatoria de fuentes de verdad  
**Estado:** ACTIVO - CONSULTA OBLIGATORIA