#!/usr/bin/env python3
"""
Django Development Server Starter
Optimized for FormX & ClinimetrixPro integration
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
    
    # Check for .env file
    env_file = BASE_DIR / '.env'
    if not env_file.exists():
        print("❌ .env file not found")
        print("   Please copy .env.example to .env and configure it")
        return False
    
    # Check required environment variables
    required_vars = ['SECRET_KEY', 'DATABASE_URL', 'SUPABASE_URL']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
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
    print(f"\n🚀 Starting Django development server on port {port}...")
    print("="*60)
    print("🌟 MindHub Django Backend")
    print("   FormX + ClinimetrixPro Integration")
    print("="*60)
    print(f"\n📍 Server URLs:")
    print(f"   🏠 Django Admin: http://localhost:{port}/admin/")
    print(f"   📋 FormX API: http://localhost:{port}/formx/api/")
    print(f"   🧠 ClinimetrixPro: http://localhost:{port}/assessments/")
    print(f"   📊 Scales API: http://localhost:{port}/scales/")
    print(f"   📚 API Docs: http://localhost:{port}/api/schema/swagger-ui/")
    print(f"\n🔑 Default Admin Credentials:")
    print(f"   Email: admin@mindhub.com")
    print(f"   Password: admin123")
    print(f"\n🔗 Integration:")
    print(f"   React Frontend should point to: http://localhost:{port}")
    print("="*60)
    print("Press Ctrl+C to stop the server")
    print("="*60)
    
    try:
        # Start server
        subprocess.run([
            sys.executable, 'manage.py', 'runserver', f'0.0.0.0:{port}'
        ], cwd=BASE_DIR)
    except KeyboardInterrupt:
        print("\n\n👋 Django server stopped")
    except Exception as e:
        print(f"\n❌ Server error: {e}")


def main():
    """Main function"""
    print("🚀 Starting MindHub Django Backend")
    print("   FormX & ClinimetrixPro Integration")
    print("="*60)
    
    # Load environment
    try:
        import environ
        env = environ.Env()
        environ.Env.read_env(BASE_DIR / '.env')
    except ImportError:
        print("❌ django-environ not installed")
        return 1
    except Exception as e:
        print(f"❌ Error loading environment: {e}")
    
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
    
    # Collect static files
    if not collect_static():
        return 1
    
    # Start server
    start_development_server(port)
    return 0


if __name__ == '__main__':
    sys.exit(main())