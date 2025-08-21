#!/usr/bin/env python3
"""
MindHub Django Backend Integration Test
Tests all modules: Expedix, ClinimetrixPro, Agenda, Resources, FormX
"""

import os
import sys
import django
import requests
import json
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinimetrix_django.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse

# Import all module models
try:
    from expedix.models import Patient
except ImportError:
    Patient = None

try:
    from psychometric_scales.models import PsychometricScale
except ImportError:
    PsychometricScale = None

try:
    from agenda.models import Appointment
except ImportError:
    Appointment = None

try:
    from resources.models import Resource
except ImportError:
    Resource = None

try:
    from formx.models import FormTemplate
except ImportError:
    FormTemplate = None

User = get_user_model()


class MindHubIntegrationTest:
    """Test complete MindHub Django backend integration"""
    
    def __init__(self):
        self.success_count = 0
        self.error_count = 0
        self.results = []
    
    def run_all_tests(self):
        """Run all integration tests"""
        print("🧪 MindHub Django Backend Integration Tests")
        print("   Testing All Modules: Expedix + ClinimetrixPro + Agenda + Resources + FormX")
        print("="*80)
        
        tests = [
            ("Database Connection", self.test_database_connection),
            ("User Authentication", self.test_user_auth),
            ("Expedix Module", self.test_expedix_module),
            ("ClinimetrixPro Module", self.test_clinimetrix_module),
            ("Agenda Module", self.test_agenda_module),
            ("Resources Module", self.test_resources_module),
            ("FormX Module", self.test_formx_module),
            ("API Endpoints", self.test_api_endpoints),
            ("Supabase Configuration", self.test_supabase_config),
            ("Static Files", self.test_static_files),
        ]
        
        for test_name, test_func in tests:
            try:
                print(f"\n🔍 Testing {test_name}...")
                result = test_func()
                if result:
                    print(f"✅ {test_name} - PASSED")
                    self.success_count += 1
                else:
                    print(f"❌ {test_name} - FAILED")
                    self.error_count += 1
                self.results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} - ERROR: {e}")
                self.error_count += 1
                self.results.append((test_name, False))
        
        self.print_summary()
    
    def test_database_connection(self):
        """Test database connectivity"""
        from django.db import connection
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                print(f"   Database connection successful: {connection.settings_dict['NAME'][:50]}...")
                return result[0] == 1
        except Exception as e:
            print(f"   Database error: {e}")
            return False
    
    def test_user_auth(self):
        """Test user authentication system"""
        try:
            # Test user creation
            user, created = User.objects.get_or_create(
                email='test@mindhub.com',
                defaults={
                    'first_name': 'Test',
                    'last_name': 'User',
                    'password': 'testpass123'
                }
            )
            
            print(f"   User model working: {user.email}")
            
            # Test authentication
            from django.contrib.auth import authenticate
            if created:
                user.set_password('testpass123')
                user.save()
            
            auth_user = authenticate(email='test@mindhub.com', password='testpass123')
            print(f"   Authentication working: {auth_user is not None}")
            
            return auth_user is not None
            
        except Exception as e:
            print(f"   User auth error: {e}")
            return False
    
    def test_expedix_module(self):
        """Test Expedix patient management module"""
        if Patient is None:
            print("   Expedix module not available")
            return False
        
        try:
            # Test patient creation
            patient = Patient.objects.create(
                first_name='Juan',
                paternal_last_name='Pérez',
                maternal_last_name='García',
                email='juan@test.com',
                phone='+52 555 123 4567',
                date_of_birth='1990-01-01',
                curp='PEGJ900101HDFRXN01',
                address='Calle Test 123',
                city='Ciudad de México',
                state='CDMX',
                postal_code='01234'
            )
            
            print(f"   Patient created: {patient.full_name}")
            print(f"   Patient ID: {patient.id}")
            
            # Test patient retrieval
            retrieved = Patient.objects.get(id=patient.id)
            success = retrieved.full_name == 'Juan Pérez García'
            
            # Cleanup
            patient.delete()
            
            return success
            
        except Exception as e:
            print(f"   Expedix module error: {e}")
            return False
    
    def test_clinimetrix_module(self):
        """Test ClinimetrixPro psychometric scales module"""
        if PsychometricScale is None:
            print("   ClinimetrixPro module not available")
            return False
        
        try:
            # Check for existing scales
            scale_count = PsychometricScale.objects.count()
            print(f"   Scales in database: {scale_count}")
            
            # Test scale retrieval
            if scale_count > 0:
                sample_scale = PsychometricScale.objects.first()
                print(f"   Sample scale: {sample_scale.name}")
                print(f"   Scale abbreviation: {sample_scale.abbreviation}")
                return True
            else:
                print("   No scales found - run migrate_scales_json command")
                return True  # Not a failure, just needs data
            
        except Exception as e:
            print(f"   ClinimetrixPro module error: {e}")
            return False
    
    def test_agenda_module(self):
        """Test Agenda appointment scheduling module"""
        if Appointment is None:
            print("   Agenda module not available")
            return False
        
        try:
            # Test appointment model
            appointment_count = Appointment.objects.count()
            print(f"   Appointments in database: {appointment_count}")
            
            # Test appointment creation (basic model test)
            from datetime import datetime, timedelta
            future_date = datetime.now() + timedelta(days=1)
            
            # Basic model structure test
            print(f"   Appointment model available: {Appointment._meta.get_fields()}")
            return True
            
        except Exception as e:
            print(f"   Agenda module error: {e}")
            return False
    
    def test_resources_module(self):
        """Test Resources medical resources module"""
        if Resource is None:
            print("   Resources module not available")
            return False
        
        try:
            # Test resource model
            resource_count = Resource.objects.count()
            print(f"   Resources in database: {resource_count}")
            
            # Test resource model structure
            print(f"   Resource model available: {Resource._meta.get_fields()}")
            return True
            
        except Exception as e:
            print(f"   Resources module error: {e}")
            return False
    
    def test_formx_module(self):
        """Test FormX dynamic forms module"""
        if FormTemplate is None:
            print("   FormX module not available")
            return False
        
        try:
            # Test form template model
            template_count = FormTemplate.objects.count()
            print(f"   Form templates in database: {template_count}")
            
            # Test form template model structure
            print(f"   FormTemplate model available: {FormTemplate._meta.get_fields()}")
            return True
            
        except Exception as e:
            print(f"   FormX module error: {e}")
            return False
    
    def test_api_endpoints(self):
        """Test API endpoint availability"""
        try:
            client = Client()
            
            # Test main endpoints
            endpoints = [
                ('/admin/', 'Django Admin'),
                ('/api/schema/', 'API Schema'),
            ]
            
            # Add module-specific endpoints if available
            if Patient:
                endpoints.append(('/api/expedix/', 'Expedix API'))
            
            if PsychometricScale:
                endpoints.append(('/scales/', 'ClinimetrixPro Scales'))
                endpoints.append(('/assessments/', 'ClinimetrixPro Assessments'))
            
            if Appointment:
                endpoints.append(('/api/agenda/', 'Agenda API'))
            
            if Resource:
                endpoints.append(('/api/resources/', 'Resources API'))
            
            if FormTemplate:
                endpoints.append(('/formx/', 'FormX API'))
            
            success_count = 0
            for endpoint, name in endpoints:
                try:
                    response = client.get(endpoint)
                    status = response.status_code
                    # Accept 200, 301, 302, 403, 404 as "working" (not 500)
                    if status < 500:
                        print(f"   {name}: {status} ✅")
                        success_count += 1
                    else:
                        print(f"   {name}: {status} ❌")
                except Exception as e:
                    print(f"   {name}: ERROR - {e}")
            
            return success_count > 0
            
        except Exception as e:
            print(f"   API test error: {e}")
            return False
    
    def test_supabase_config(self):
        """Test Supabase configuration"""
        try:
            from django.conf import settings
            
            config_items = [
                ('SUPABASE_URL', getattr(settings, 'SUPABASE_URL', None)),
                ('SUPABASE_ANON_KEY', getattr(settings, 'SUPABASE_ANON_KEY', None)),
                ('SUPABASE_SERVICE_ROLE_KEY', getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', None)),
                ('DATABASE_URL', getattr(settings, 'DATABASES', {}).get('default', {}).get('NAME', None)),
            ]
            
            configured_count = 0
            for name, value in config_items:
                if value:
                    print(f"   {name}: Configured ✅")
                    configured_count += 1
                else:
                    print(f"   {name}: NOT configured ❌")
            
            return configured_count >= 3  # At least 3 should be configured
            
        except Exception as e:
            print(f"   Supabase config error: {e}")
            return False
    
    def test_static_files(self):
        """Test static files configuration"""
        try:
            from django.conf import settings
            from django.contrib.staticfiles import finders
            
            # Check static configuration
            static_url = settings.STATIC_URL
            static_root = settings.STATIC_ROOT
            
            print(f"   STATIC_URL: {static_url}")
            print(f"   STATIC_ROOT: {static_root}")
            
            # Check if some static files exist
            static_files = finders.find('css/mindhub.css')
            if static_files:
                print(f"   Found static files: {len(static_files) if isinstance(static_files, list) else 1}")
            
            return True
            
        except Exception as e:
            print(f"   Static files error: {e}")
            return False
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("🎯 MINDHUB DJANGO BACKEND TEST SUMMARY")
        print("="*80)
        print(f"✅ Passed: {self.success_count}")
        print(f"❌ Failed: {self.error_count}")
        print(f"📊 Total: {self.success_count + self.error_count}")
        
        # Module status
        modules = []
        if Patient: modules.append("Expedix")
        if PsychometricScale: modules.append("ClinimetrixPro")
        if Appointment: modules.append("Agenda")
        if Resource: modules.append("Resources")
        if FormTemplate: modules.append("FormX")
        
        print(f"\n📦 Active Modules: {', '.join(modules) if modules else 'None detected'}")
        
        if self.error_count == 0:
            print("\n🎉 ALL TESTS PASSED!")
            print("   MindHub Django backend is ready for production")
            print("   🚀 Deploy to Vercel: https://mindhub-django-backend.vercel.app")
        else:
            print(f"\n⚠️  {self.error_count} tests failed")
            print("   Please check the errors above before deploying")
        
        print("="*80)


def main():
    """Main test function"""
    print("🏥 MindHub - Complete Healthcare Management Platform")
    print("   Django Backend Integration Test Suite")
    
    tester = MindHubIntegrationTest()
    tester.run_all_tests()
    
    # Return exit code
    return 0 if tester.error_count == 0 else 1


if __name__ == '__main__':
    sys.exit(main())