#!/bin/bash

# =====================================================================
# SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS - MINDHUB
# Con soporte para Supabase PostgreSQL
# =====================================================================

echo "🧠 MindHub - Configuración de Base de Datos"
echo "============================================"
echo ""

# Verificar si estamos usando Supabase o PostgreSQL local
echo "¿Qué tipo de base de datos deseas usar?"
echo "1) Supabase (Recomendado - PostgreSQL en la nube)"
echo "2) PostgreSQL local"
echo ""
read -p "Selecciona una opción (1 o 2): " DB_OPTION

if [ "$DB_OPTION" = "1" ]; then
    echo ""
    echo "📦 Configuración con Supabase"
    echo "==============================="
    echo ""
    echo "1. Ve a https://supabase.com y crea una cuenta/proyecto"
    echo "2. En el dashboard de tu proyecto, ve a Settings > API"
    echo "3. Copia las siguientes credenciales:"
    echo ""
    echo "   - Project URL (ej: https://xxxxx.supabase.co)"
    echo "   - Anon Key (public)"
    echo "   - Service Role Key (secret)"
    echo ""
    echo "4. Ve a Settings > Database"
    echo "5. Copia el Connection String (URI)"
    echo ""
    read -p "¿Ya tienes estas credenciales? (s/n): " HAS_CREDS
    
    if [ "$HAS_CREDS" = "s" ]; then
        echo ""
        read -p "Ingresa tu Project URL: " SUPABASE_URL
        read -p "Ingresa tu Anon Key: " SUPABASE_ANON_KEY
        read -p "Ingresa tu Service Role Key: " SUPABASE_SERVICE_KEY
        read -p "Ingresa tu Database URL: " DATABASE_URL
        
        # Crear archivo .env
        cat > .env << EOF
# =====================================================================
# MINDHUB - CONFIGURACIÓN CON SUPABASE
# =====================================================================

# Database - Supabase PostgreSQL
DATABASE_URL="$DATABASE_URL"

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY"

# API Configuration
NODE_ENV="development"
PORT=3002

# Frontend URL
NEXT_PUBLIC_API_URL="http://localhost:3002"
FRONTEND_URL="http://localhost:3000"

# JWT Secret
JWT_SECRET="mindhub_supabase_jwt_secret_2025"
EOF
        
        echo ""
        echo "✅ Archivo .env creado con configuración de Supabase"
        echo ""
        echo "Ejecutando migración de base de datos..."
        npm run db:setup
        
        echo ""
        echo "🎉 ¡Configuración completada!"
        echo ""
        echo "Para iniciar el servidor:"
        echo "  npm run start:clean"
        echo ""
    else
        echo ""
        echo "👉 Por favor, crea un proyecto en Supabase primero"
        echo "   Ve a: https://supabase.com"
        echo ""
    fi
    
elif [ "$DB_OPTION" = "2" ]; then
    echo ""
    echo "🐘 Configuración con PostgreSQL Local"
    echo "======================================"
    echo ""
    
    # Verificar si PostgreSQL está instalado
    if ! command -v psql &> /dev/null; then
        echo "❌ PostgreSQL no está instalado"
        echo ""
        echo "Para instalar PostgreSQL:"
        echo ""
        echo "macOS:"
        echo "  brew install postgresql"
        echo "  brew services start postgresql"
        echo ""
        echo "Ubuntu/Debian:"
        echo "  sudo apt update"
        echo "  sudo apt install postgresql postgresql-contrib"
        echo "  sudo systemctl start postgresql"
        echo ""
        echo "Después de instalar, ejecuta este script nuevamente"
        exit 1
    fi
    
    echo "✅ PostgreSQL detectado"
    echo ""
    
    # Crear base de datos
    read -p "Nombre de la base de datos (default: mindhub_clean): " DB_NAME
    DB_NAME=${DB_NAME:-mindhub_clean}
    
    read -p "Usuario de PostgreSQL (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -s -p "Contraseña de PostgreSQL: " DB_PASSWORD
    echo ""
    
    # Crear base de datos
    echo ""
    echo "Creando base de datos..."
    PGPASSWORD=$DB_PASSWORD createdb -U $DB_USER $DB_NAME 2>/dev/null || echo "Base de datos ya existe o error al crear"
    
    # Crear archivo .env
    cat > .env << EOF
# =====================================================================
# MINDHUB - CONFIGURACIÓN CON POSTGRESQL LOCAL
# =====================================================================

# Database - PostgreSQL Local
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# Supabase Authentication (dejar vacío para desarrollo local)
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# API Configuration
NODE_ENV="development"
PORT=3002

# Frontend URL
NEXT_PUBLIC_API_URL="http://localhost:3002"
FRONTEND_URL="http://localhost:3000"

# JWT Secret
JWT_SECRET="mindhub_local_jwt_secret_2025"
EOF
    
    echo ""
    echo "✅ Archivo .env creado con configuración local"
    echo ""
    echo "Ejecutando migración de base de datos..."
    npm run db:setup
    
    echo ""
    echo "🎉 ¡Configuración completada!"
    echo ""
    echo "Para iniciar el servidor:"
    echo "  npm run start:clean"
    echo ""
else
    echo "❌ Opción inválida"
    exit 1
fi