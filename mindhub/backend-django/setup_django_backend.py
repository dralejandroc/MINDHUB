#!/usr/bin/env python3
"""
Setup script for Django Backend - FormX & ClinimetrixPro
Configures backend for integration with Supabase and React frontend
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
        'SUPABASE_ANON_KEY',
        'REACT_FRONTEND_URL'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("   Please create a .env file based on .env.example")
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


def setup_formx_templates():
    """Set up FormX with sample templates"""
    print("\n📋 Setting up FormX templates...")
    
    django.setup()
    from formx.models import FormTemplate, FormField, DocumentTemplate
    
    try:
        # Create sample FormX template
        if not FormTemplate.objects.filter(name='Registro de Paciente').exists():
            from django.contrib.auth import get_user_model
            User = get_user_model()
            admin_user = User.objects.filter(is_superuser=True).first()
            
            if admin_user:
                template = FormTemplate.objects.create(
                    name='Registro de Paciente',
                    form_type='intake',
                    description='Formulario de registro inicial para nuevos pacientes',
                    integration_type='expedix',
                    created_by=admin_user,
                    auto_sync_expedix=True,
                    mobile_optimized=True,
                    expedix_mapping={
                        'first_name': 'firstName',
                        'paternal_last_name': 'paternalLastName',
                        'maternal_last_name': 'maternalLastName',
                        'email': 'email',
                        'phone': 'phone',
                        'date_of_birth': 'dateOfBirth'
                    }
                )
                
                # Add fields
                fields_data = [
                    {'field_name': 'first_name', 'field_type': 'text', 'label': 'Nombre', 'required': True},
                    {'field_name': 'paternal_last_name', 'field_type': 'text', 'label': 'Apellido Paterno', 'required': True},
                    {'field_name': 'maternal_last_name', 'field_type': 'text', 'label': 'Apellido Materno'},
                    {'field_name': 'email', 'field_type': 'email', 'label': 'Correo Electrónico', 'required': True},
                    {'field_name': 'phone', 'field_type': 'phone', 'label': 'Teléfono', 'required': True},
                    {'field_name': 'date_of_birth', 'field_type': 'date', 'label': 'Fecha de Nacimiento', 'required': True},
                    {'field_name': 'emergency_contact', 'field_type': 'text', 'label': 'Contacto de Emergencia'},
                    {'field_name': 'allergies', 'field_type': 'textarea', 'label': 'Alergias Conocidas'},
                    {'field_name': 'current_medications', 'field_type': 'textarea', 'label': 'Medicamentos Actuales'},
                ]
                
                for i, field_data in enumerate(fields_data):
                    FormField.objects.create(
                        template=template,
                        order=i,
                        **field_data
                    )
                
                print("✅ Sample FormX template created")
            else:
                print("❌ No superuser found to create templates")
        else:
            print("✅ FormX templates already exist")
        
        # Create sample document template
        if not DocumentTemplate.objects.filter(name='Consentimiento Informado').exists():
            DocumentTemplate.objects.create(
                name='Consentimiento Informado',
                document_type='consent',
                description='Consentimiento informado para tratamiento psicológico',
                created_by=admin_user,
                template_content="""
                <h2>CONSENTIMIENTO INFORMADO PARA TRATAMIENTO PSICOLÓGICO</h2>
                
                <p>Yo, <strong>{{patient_name}}</strong>, con fecha de nacimiento {{date_of_birth}}, 
                acepto voluntariamente recibir tratamiento psicológico en MindHub.</p>
                
                <p><strong>Fecha:</strong> {{current_date}}</p>
                <p><strong>Email:</strong> {{patient_email}}</p>
                
                <p>He sido informado sobre los procedimientos, riesgos y beneficios del tratamiento.</p>
                
                <div style="margin-top: 50px;">
                    <p>_________________________________</p>
                    <p>Firma del Paciente</p>
                </div>
                """,
                auto_fill_fields=['patient_name', 'date_of_birth', 'patient_email', 'current_date'],
                requires_signature=True
            )
            print("✅ Sample document template created")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up FormX templates: {e}")
        return False


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
        
        # Test FormX models
        from formx.models import FormTemplate
        template_count = FormTemplate.objects.count()
        print(f"✅ FormX integration working - {template_count} templates found")
        
        # Test ClinimetrixPro models
        from psychometric_scales.models import PsychometricScale
        scale_count = PsychometricScale.objects.count()
        print(f"✅ ClinimetrixPro integration working - {scale_count} scales found")
        
        return True
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False


def print_startup_info():
    """Print information about starting the Django server"""
    print("\n" + "="*60)
    print("🎉 Django Backend Setup Complete!")
    print("="*60)
    print("\n📋 Next Steps:")
    print("1. Start the Django development server:")
    print("   python manage.py runserver 0.0.0.0:8000")
    print("\n2. Access Django Admin:")
    print("   http://localhost:8000/admin/")
    print("   Email: admin@mindhub.com")
    print("   Password: admin123")
    print("\n3. FormX API Endpoints:")
    print("   http://localhost:8000/formx/api/")
    print("\n4. ClinimetrixPro Endpoints:")
    print("   http://localhost:8000/assessments/")
    print("   http://localhost:8000/scales/")
    print("\n5. API Documentation:")
    print("   http://localhost:8000/api/schema/swagger-ui/")
    print("\n🌐 Frontend Integration:")
    print("   Make sure your React frontend points to:")
    print("   http://localhost:8000 (development)")
    print("   Or your production Django URL")
    print("\n" + "="*60)


def main():
    """Main setup function"""
    print("🚀 Setting up Django Backend for MindHub")
    print("   FormX + ClinimetrixPro Integration")
    print("="*60)
    
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
    
    # Create superuser
    if success and not create_superuser():
        success = False
    
    # Collect static files
    if success and not collect_static_files():
        success = False
    
    # Setup FormX templates
    if success and not setup_formx_templates():
        success = False
    
    # Test integration
    if success and not test_integration():
        success = False
    
    if success:
        print_startup_info()
        return 0
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        return 1


if __name__ == '__main__':
    sys.exit(main())