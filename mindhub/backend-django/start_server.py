#!/usr/bin/env python3
"""
MindHub Django Backend Development Server
Starts complete Django backend with all modules
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

# Project paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

def check_environment():
    """Check if environment is properly configured"""
    print("🔍 Checking environment configuration...")
    
    # Check required environment variables (can be from .env or system)
    required_vars = [
        'SECRET_KEY', 
        'DATABASE_URL', 
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
    ]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("   See VERCEL_ENV_VARIABLES.md for configuration")
        return False
    
    print("✅ Environment configuration OK")
    return True


def check_dependencies():
    """Check if dependencies are installed"""
    print("📦 Checking dependencies...")
    
    try:
        import django
        from rest_framework import __version__ as drf_version
        print(f"✅ Django {django.get_version()} installed")
        print(f"✅ Django REST Framework {drf_version} installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("   Run: pip install -r requirements.txt")
        return False


def run_migrations():
    """Run database migrations"""
    print("🗄️ Running database migrations...")
    
    try:
        # Make migrations
        subprocess.run([
            sys.executable, 'manage.py', 'makemigrations'
        ], check=True, cwd=BASE_DIR)
        
        # Apply migrations
        subprocess.run([
            sys.executable, 'manage.py', 'migrate'
        ], check=True, cwd=BASE_DIR)
        
        print("✅ Database migrations completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e}")
        return False


def migrate_scales():
    """Migrate ClinimetrixPro scales"""
    print("📊 Migrating ClinimetrixPro scales...")
    
    try:
        subprocess.run([
            sys.executable, 'manage.py', 'migrate_scales_json'
        ], check=True, cwd=BASE_DIR)
        
        print("✅ Scales migration completed")
        return True
    except subprocess.CalledProcessError:
        print("⚠️ Scales migration skipped (may already exist)")
        return True


def collect_static():
    """Collect static files"""
    print("📁 Collecting static files...")
    
    try:
        subprocess.run([
            sys.executable, 'manage.py', 'collectstatic', '--noinput'
        ], check=True, cwd=BASE_DIR)
        
        print("✅ Static files collected")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Static collection failed: {e}")
        return False


def check_ports():
    """Check if required ports are available"""
    import socket
    
    def is_port_open(port):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        try:
            result = sock.connect_ex(('localhost', port))
            return result != 0  # Port is available if connection fails
        finally:
            sock.close()
    
    ports_to_check = [8000, 8001, 8080]
    available_port = None
    
    for port in ports_to_check:
        if is_port_open(port):
            available_port = port
            break
    
    if available_port:
        print(f"✅ Port {available_port} is available")
        return available_port
    else:
        print("❌ No available ports found (8000, 8001, 8080)")
        return None


def start_development_server(port=8000):
    """Start Django development server"""
    print(f"\n🚀 Starting MindHub Django Backend on port {port}...")
    print("="*70)
    print("🏥 MindHub Complete Healthcare Platform")
    print("   Django Backend - All Modules Active")
    print("="*70)
    print(f"\n📍 Server URLs:")
    print(f"   🏠 Django Admin:    http://localhost:{port}/admin/")
    print(f"   🩺 Expedix API:     http://localhost:{port}/api/expedix/")
    print(f"   🧠 ClinimetrixPro:  http://localhost:{port}/assessments/")
    print(f"   📊 Scales API:      http://localhost:{port}/scales/")
    print(f"   📅 Agenda API:      http://localhost:{port}/api/agenda/")
    print(f"   📚 Resources API:   http://localhost:{port}/api/resources/")
    print(f"   📋 FormX API:       http://localhost:{port}/formx/")
    print(f"   📖 API Docs:        http://localhost:{port}/api/schema/swagger-ui/")
    print(f"\n🔑 Default Admin Credentials:")
    print(f"   Email: admin@mindhub.com")
    print(f"   Password: admin123")
    print(f"\n🌐 Frontend Integration:")
    print(f"   Production:  https://mindhub.cloud → https://mindhub-django-backend.vercel.app")
    print(f"   Development: http://localhost:3002 → http://localhost:{port}")
    print(f"\n🗃️ Database:")
    print(f"   Provider: Supabase PostgreSQL")
    print(f"   Auth: Supabase JWT middleware")
    print("="*70)
    print("Press Ctrl+C to stop the server")
    print("="*70)
    
    try:
        # Start server
        subprocess.run([
            sys.executable, 'manage.py', 'runserver', f'0.0.0.0:{port}'
        ], cwd=BASE_DIR)
    except KeyboardInterrupt:
        print("\n\n👋 MindHub Django Backend stopped")
    except Exception as e:
        print(f"\n❌ Server error: {e}")


def main():
    """Main function"""
    print("🚀 Starting MindHub Django Backend")
    print("   Complete Healthcare Platform - All Modules")
    print("="*70)
    
    # Load environment
    try:
        import environ
        env = environ.Env()
        # Try loading .env if it exists
        env_file = BASE_DIR / '.env'
        if env_file.exists():
            environ.Env.read_env(env_file)
    except ImportError:
        print("❌ django-environ not installed")
        return 1
    except Exception as e:
        print(f"⚠️ Environment file warning: {e}")
    
    # Check environment
    if not check_environment():
        return 1
    
    # Check dependencies
    if not check_dependencies():
        return 1
    
    # Check available ports
    port = check_ports()
    if not port:
        return 1
    
    # Run migrations
    if not run_migrations():
        return 1
    
    # Migrate scales
    if not migrate_scales():
        return 1
    
    # Collect static files
    if not collect_static():
        return 1
    
    # Start server
    start_development_server(port)
    return 0


if __name__ == '__main__':
    sys.exit(main())