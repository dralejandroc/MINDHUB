#!/usr/bin/env python3
"""
Setup script for MindHub Django Backend
Configures all modules: Expedix, ClinimetrixPro, Agenda, Resources, FormX
"""

import os
import sys
import subprocess
import django
from pathlib import Path

# Add the project directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinimetrix_django.settings')


def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error in {description}:")
        print(f"   Command: {command}")
        print(f"   Error: {e.stderr}")
        return False


def check_environment():
    """Check if required environment variables are set"""
    print("\n🔍 Checking environment configuration...")
    
    required_vars = [
        'SECRET_KEY',
        'DATABASE_URL',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_ANON_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("   Please check VERCEL_ENV_VARIABLES.md for configuration")
        return False
    
    print("✅ Environment configuration is complete")
    return True


def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing Python dependencies...")
    return run_command("pip install -r requirements.txt", "Installing dependencies")


def setup_database():
    """Set up database migrations"""
    print("\n🗄️ Setting up database...")
    
    # Make migrations
    if not run_command("python manage.py makemigrations", "Creating migrations"):
        return False
    
    # Apply migrations
    if not run_command("python manage.py migrate", "Applying migrations"):
        return False
    
    return True


def migrate_scales():
    """Migrate ClinimetrixPro scales from JSON"""
    print("\n📊 Migrating ClinimetrixPro scales...")
    return run_command("python manage.py migrate_scales_json", "Migrating psychometric scales")


def create_superuser():
    """Create Django superuser"""
    print("\n👤 Creating Django superuser...")
    
    # Check if superuser already exists
    django.setup()
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    if User.objects.filter(is_superuser=True).exists():
        print("✅ Superuser already exists")
        return True
    
    print("Creating superuser (admin/admin@mindhub.com)...")
    try:
        User.objects.create_superuser(
            email='admin@mindhub.com',
            password='admin123',
            first_name='Admin',
            last_name='MindHub'
        )
        print("✅ Superuser created successfully")
        print("   Email: admin@mindhub.com")
        print("   Password: admin123")
        return True
    except Exception as e:
        print(f"❌ Error creating superuser: {e}")
        return False


def collect_static_files():
    """Collect static files for production"""
    print("\n📁 Collecting static files...")
    return run_command("python manage.py collectstatic --noinput", "Collecting static files")


def test_integration():
    """Test Django backend integration"""
    print("\n🧪 Testing Django backend integration...")
    
    django.setup()
    
    try:
        # Test database connection
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Database connection successful")
        
        # Test all modules
        modules_status = []
        
        # Test Expedix
        try:
            from expedix.models import Patient
            patient_count = Patient.objects.count()
            modules_status.append(f"✅ Expedix - {patient_count} patients")
        except Exception as e:
            modules_status.append(f"❌ Expedix - Error: {e}")
        
        # Test ClinimetrixPro
        try:
            from psychometric_scales.models import PsychometricScale
            scale_count = PsychometricScale.objects.count()
            modules_status.append(f"✅ ClinimetrixPro - {scale_count} scales")
        except Exception as e:
            modules_status.append(f"❌ ClinimetrixPro - Error: {e}")
        
        # Test Agenda
        try:
            from agenda.models import Appointment
            appointment_count = Appointment.objects.count()
            modules_status.append(f"✅ Agenda - {appointment_count} appointments")
        except Exception as e:
            modules_status.append(f"❌ Agenda - Error: {e}")
        
        # Test Resources
        try:
            from resources.models import Resource
            resource_count = Resource.objects.count()
            modules_status.append(f"✅ Resources - {resource_count} resources")
        except Exception as e:
            modules_status.append(f"❌ Resources - Error: {e}")
        
        # Test FormX
        try:
            from formx.models import FormTemplate
            form_count = FormTemplate.objects.count()
            modules_status.append(f"✅ FormX - {form_count} templates")
        except Exception as e:
            modules_status.append(f"❌ FormX - Error: {e}")
        
        # Print module status
        print("\n📦 Module Status:")
        for status in modules_status:
            print(f"   {status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False


def print_startup_info():
    """Print information about starting the Django server"""
    print("\n" + "="*60)
    print("🎉 MindHub Django Backend Setup Complete!")
    print("="*60)
    print("\n📋 Next Steps:")
    print("1. Start the Django development server:")
    print("   python manage.py runserver 0.0.0.0:8000")
    print("\n2. Access Django Admin:")
    print("   http://localhost:8000/admin/")
    print("   Email: admin@mindhub.com")
    print("   Password: admin123")
    print("\n🏥 API Endpoints by Module:")
    print("   Expedix:        /api/expedix/")
    print("   ClinimetrixPro:  /scales/ and /assessments/")
    print("   Agenda:         /api/agenda/")
    print("   Resources:      /api/resources/")
    print("   FormX:          /formx/")
    print("\n📖 API Documentation:")
    print("   http://localhost:8000/api/schema/swagger-ui/")
    print("\n🌐 Frontend Integration:")
    print("   Production:  https://mindhub.cloud")
    print("   Development: http://localhost:3002")
    print("\n🗃️ Database:")
    print("   Provider: Supabase PostgreSQL")
    print("   Auth:     Supabase JWT middleware")
    print("\n" + "="*60)


def main():
    """Main setup function"""
    print("🚀 Setting up MindHub Django Backend")
    print("   All Modules: Expedix + ClinimetrixPro + Agenda + Resources + FormX")
    print("="*80)
    
    success = True
    
    # Check environment
    if not check_environment():
        success = False
    
    # Install dependencies
    if success and not install_dependencies():
        success = False
    
    # Setup database
    if success and not setup_database():
        success = False
    
    # Migrate scales
    if success and not migrate_scales():
        success = False
    
    # Create superuser
    if success and not create_superuser():
        success = False
    
    # Collect static files
    if success and not collect_static_files():
        success = False
    
    # Test integration
    if success and not test_integration():
        success = False
    
    if success:
        print_startup_info()
        return 0
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        print("   See VERCEL_ENV_VARIABLES.md for environment configuration.")
        return 1


if __name__ == '__main__':
    sys.exit(main())