#!/bin/bash

echo "🚀 INICIANDO CREACIÓN DE CLINIMETRIX PRO MVP"
echo "==========================================="

# Paso 1: Crear directorio del proyecto
echo "📁 Creando directorio del proyecto..."
cd /Users/alekscon
mkdir -p CLINIMETRIX-PRO-MVP
cd CLINIMETRIX-PRO-MVP

# Paso 2: Inicializar Next.js project
echo "⚡ Inicializando Next.js 14..."
npx create-next-app@14.2.30 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"

# Paso 3: Inicializar Git
echo "🔧 Inicializando repositorio Git..."
git init
git add .
git commit -m "feat: Initial Next.js 14 setup for ClinimetrixPro MVP

- Next.js 14.2.30 with App Router
- TypeScript + Tailwind CSS
- ESLint configuration
- Ready for ClinimetrixPro component migration

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Paso 4: Crear estructura de directorios
echo "📂 Creando estructura de directorios..."
mkdir -p components/ClinimetrixPro
mkdir -p lib/utils
mkdir -p templates/scales
mkdir -p prisma/migrations
mkdir -p app/dashboard
mkdir -p app/assessment/[templateId]
mkdir -p app/results/[assessmentId]
mkdir -p app/patients
mkdir -p app/api/templates
mkdir -p app/api/assessments
mkdir -p app/api/patients

echo "✅ Proyecto base creado exitosamente!"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Crear repositorio en GitHub: clinimetrix-pro-mvp"
echo "2. Conectar repositorio local:"
echo "   git remote add origin https://github.com/dralejandroc/clinimetrix-pro-mvp.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo "3. Abrir VS Code en el nuevo proyecto:"
echo "   code /Users/alekscon/clinimetrix-pro-mvp"
echo ""
echo "📍 Ubicación del proyecto: /Users/alekscon/clinimetrix-pro-mvp"