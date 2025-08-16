#!/bin/bash

echo "🔄 MIGRANDO COMPONENTES CLINIMETRIX PRO"
echo "======================================"

# Definir rutas
SOURCE_DIR="/Users/alekscon/MINDHUB-Pro/mindhub/frontend"
TARGET_DIR="/Users/alekscon/CLINIMETRIX-PRO-MVP"

echo "📂 Copiando componentes ClinimetrixPro..."

# Crear directorios dinámicos de Next.js (que no se pudieron crear antes)
mkdir -p "$TARGET_DIR/app/assessment/[templateId]"
mkdir -p "$TARGET_DIR/app/results/[assessmentId]"

# Copiar componentes ClinimetrixPro
if [ -d "$SOURCE_DIR/components/ClinimetrixPro" ]; then
    cp -r "$SOURCE_DIR/components/ClinimetrixPro"/* "$TARGET_DIR/components/ClinimetrixPro/"
    echo "✅ Componentes ClinimetrixPro copiados"
else
    echo "❌ No se encontró directorio ClinimetrixPro"
fi

# Copiar utilidades relacionadas
if [ -f "$SOURCE_DIR/lib/clinimetrix-api.js" ]; then
    cp "$SOURCE_DIR/lib/clinimetrix-api.js" "$TARGET_DIR/lib/"
    echo "✅ API client copiado"
fi

# Copiar templates de escalas
SOURCE_TEMPLATES="/Users/alekscon/MINDHUB-Pro/mindhub/backend/templates/scales"
if [ -d "$SOURCE_TEMPLATES" ]; then
    cp -r "$SOURCE_TEMPLATES"/* "$TARGET_DIR/templates/scales/"
    echo "✅ Templates de escalas copiados"
else
    echo "❌ No se encontraron templates de escalas"
fi

# Copiar servicios del backend
SOURCE_BACKEND="/Users/alekscon/MINDHUB-Pro/mindhub/backend/clinimetrix-pro"
if [ -d "$SOURCE_BACKEND" ]; then
    mkdir -p "$TARGET_DIR/lib/services"
    
    # Copiar servicios principales
    if [ -d "$SOURCE_BACKEND/services" ]; then
        cp -r "$SOURCE_BACKEND/services"/* "$TARGET_DIR/lib/services/"
        echo "✅ Servicios backend copiados"
    fi
    
    # Copiar routes como referencia
    if [ -d "$SOURCE_BACKEND/routes" ]; then
        mkdir -p "$TARGET_DIR/lib/backend-reference"
        cp -r "$SOURCE_BACKEND/routes" "$TARGET_DIR/lib/backend-reference/"
        echo "✅ Routes de referencia copiados"
    fi
fi

# Copiar schema SQL
SOURCE_SQL="/Users/alekscon/MINDHUB-Pro/mindhub/backend/database/migrations"
if [ -f "$SOURCE_SQL/001_create_clinimetrix_pro_tables.sql" ]; then
    cp "$SOURCE_SQL/001_create_clinimetrix_pro_tables.sql" "$TARGET_DIR/prisma/migrations/"
    echo "✅ Schema SQL copiado"
fi

echo ""
echo "📊 RESUMEN DE MIGRACIÓN:"
echo "========================"
ls -la "$TARGET_DIR/components/ClinimetrixPro/" 2>/dev/null | wc -l | xargs echo "Componentes React:"
ls -la "$TARGET_DIR/templates/scales/" 2>/dev/null | wc -l | xargs echo "Templates escalas:"
ls -la "$TARGET_DIR/lib/services/" 2>/dev/null | wc -l | xargs echo "Servicios backend:"

echo ""
echo "🎯 SIGUIENTE PASO:"
echo "=================="
echo "1. Abrir VS Code en el nuevo proyecto:"
echo "   code /Users/alekscon/CLINIMETRIX-PRO-MVP"
echo ""
echo "2. Verificar que se copiaron correctamente:"
echo "   - components/ClinimetrixPro/"
echo "   - templates/scales/"  
echo "   - lib/services/"
echo ""
echo "3. Instalar dependencias faltantes:"
echo "   cd /Users/alekscon/CLINIMETRIX-PRO-MVP"
echo "   npm install @clerk/nextjs prisma @prisma/client"