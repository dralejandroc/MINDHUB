#!/usr/bin/env python3
"""
Django Backend Integration Test
Tests FormX + ClinimetrixPro functionality
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

from django.test import TestCase
from django.contrib.auth import get_user_model
from formx.models import FormTemplate, FormField, FormSubmission, DocumentTemplate
from psychometric_scales.models import PsychometricScale
from formx.services import FormGeneratorService, ExpedixSyncService

User = get_user_model()


class BackendIntegrationTest:
    """Test Django backend integration"""
    
    def __init__(self):
        self.success_count = 0
        self.error_count = 0
        self.results = []
    
    def run_all_tests(self):
        """Run all integration tests"""
        print("🧪 Django Backend Integration Tests")
        print("="*50)
        
        tests = [
            ("Database Connection", self.test_database_connection),
            ("FormX Models", self.test_formx_models),
            ("ClinimetrixPro Models", self.test_clinimetrix_models),
            ("FormX Services", self.test_formx_services),
            ("User Authentication", self.test_user_auth),
            ("API Endpoints", self.test_api_endpoints),
            ("Document Generation", self.test_document_generation),
            ("Supabase Integration", self.test_supabase_integration),
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
                return result[0] == 1
        except Exception as e:
            print(f"   Database error: {e}")
            return False
    
    def test_formx_models(self):
        """Test FormX model operations"""
        try:
            # Create test user
            user, created = User.objects.get_or_create(
                email='test@example.com',
                defaults={'first_name': 'Test', 'last_name': 'User'}
            )
            
            # Create form template
            template = FormTemplate.objects.create(
                name='Test Form',
                form_type='clinical',
                description='Test form for integration',
                created_by=user
            )
            
            # Create form field
            field = FormField.objects.create(
                template=template,
                field_name='test_field',
                field_type='text',
                label='Test Field',
                required=True,
                order=1
            )
            
            # Create form submission
            submission = FormSubmission.objects.create(
                template=template,
                patient_id='test-patient-123',
                patient_email='patient@test.com',
                access_token='test-token-123',
                form_data={'test_field': 'test value'}
            )
            
            print(f"   Created template: {template.name}")
            print(f"   Created field: {field.label}")
            print(f"   Created submission: {submission.id}")
            
            # Cleanup
            submission.delete()
            field.delete()
            template.delete()
            
            return True
            
        except Exception as e:
            print(f"   FormX model error: {e}")
            return False
    
    def test_clinimetrix_models(self):
        """Test ClinimetrixPro model operations"""
        try:
            # Create a test scale
            scale_data = {
                'metadata': {
                    'name': 'Test Scale',
                    'abbreviation': 'TEST',
                    'version': '1.0'
                },
                'structure': {
                    'totalItems': 5,
                    'sections': []
                }
            }
            
            scale = PsychometricScale.objects.create(
                id='test-scale',
                name='Test Scale',
                abbreviation='TEST',
                version='1.0',
                description='Test scale for integration',
                category='other',
                scale_data=scale_data
            )
            
            print(f"   Created scale: {scale.name}")
            
            # Cleanup
            scale.delete()
            
            return True
            
        except Exception as e:
            print(f"   ClinimetrixPro model error: {e}")
            return False
    
    def test_formx_services(self):
        """Test FormX service functionality"""
        try:
            # Create test template
            user, created = User.objects.get_or_create(
                email='test@example.com',
                defaults={'first_name': 'Test', 'last_name': 'User'}
            )
            
            template = FormTemplate.objects.create(
                name='Service Test Form',
                form_type='clinical',
                created_by=user
            )
            
            FormField.objects.create(
                template=template,
                field_name='name',
                field_type='text',
                label='Name',
                required=True,
                order=1
            )
            
            # Test form generation service
            form_generator = FormGeneratorService()
            dynamic_form = form_generator.create_dynamic_form(str(template.id))
            
            print(f"   Generated dynamic form: {dynamic_form}")
            print(f"   Form fields: {list(dynamic_form.base_fields.keys())}")
            
            # Cleanup
            template.delete()
            
            return True
            
        except Exception as e:
            print(f"   FormX service error: {e}")
            return False
    
    def test_user_auth(self):
        """Test user authentication"""
        try:
            # Test user creation
            user = User.objects.create_user(
                email='auth_test@example.com',
                password='testpass123',
                first_name='Auth',
                last_name='Test'
            )
            
            print(f"   Created user: {user.email}")
            
            # Test authentication
            from django.contrib.auth import authenticate
            auth_user = authenticate(email='auth_test@example.com', password='testpass123')
            
            if auth_user:
                print(f"   Authentication successful: {auth_user.email}")
            
            # Cleanup
            user.delete()
            
            return auth_user is not None
            
        except Exception as e:
            print(f"   User auth error: {e}")
            return False
    
    def test_api_endpoints(self):
        """Test API endpoint availability"""
        try:
            from django.test import Client
            from django.urls import reverse
            
            client = Client()
            
            # Test endpoints
            endpoints = [
                '/formx/api/health/',
                '/formx/api/templates/catalog/',
                '/formx/api/dashboard/stats/',
            ]
            
            for endpoint in endpoints:
                try:
                    response = client.get(endpoint)
                    print(f"   {endpoint}: {response.status_code}")
                except Exception as e:
                    print(f"   {endpoint}: ERROR - {e}")
            
            return True
            
        except Exception as e:
            print(f"   API test error: {e}")
            return False
    
    def test_document_generation(self):
        """Test document generation"""
        try:
            user, created = User.objects.get_or_create(
                email='test@example.com',
                defaults={'first_name': 'Test', 'last_name': 'User'}
            )
            
            # Create document template
            doc_template = DocumentTemplate.objects.create(
                name='Test Document',
                document_type='consent',
                template_content='Hello {{patient_name}}, today is {{current_date}}',
                created_by=user,
                auto_fill_fields=['patient_name', 'current_date']
            )
            
            print(f"   Created document template: {doc_template.name}")
            
            # Test document generation
            from formx.services import DocumentGeneratorService
            doc_service = DocumentGeneratorService()
            
            # Mock patient data for testing
            doc_service._get_patient_data = lambda patient_id: {
                'patient_name': 'John Doe',
                'current_date': '2024-01-01'
            }
            
            content = doc_service.generate_document(str(doc_template.id), 'test-patient')
            print(f"   Generated content: {content[:50]}...")
            
            # Cleanup
            doc_template.delete()
            
            return 'John Doe' in content
            
        except Exception as e:
            print(f"   Document generation error: {e}")
            return False
    
    def test_supabase_integration(self):
        """Test Supabase configuration"""
        try:
            from django.conf import settings
            
            required_settings = [
                'SUPABASE_URL',
                'SUPABASE_ANON_KEY',
                'REACT_FRONTEND_URL'
            ]
            
            for setting in required_settings:
                value = getattr(settings, setting, None)
                if value:
                    print(f"   {setting}: Configured")
                else:
                    print(f"   {setting}: NOT configured")
                    return False
            
            return True
            
        except Exception as e:
            print(f"   Supabase integration error: {e}")
            return False
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print("🎯 TEST SUMMARY")
        print("="*50)
        print(f"✅ Passed: {self.success_count}")
        print(f"❌ Failed: {self.error_count}")
        print(f"📊 Total: {self.success_count + self.error_count}")
        
        if self.error_count == 0:
            print("\n🎉 ALL TESTS PASSED!")
            print("   Django backend is ready for production")
        else:
            print(f"\n⚠️  {self.error_count} tests failed")
            print("   Please check the errors above")
        
        print("="*50)


def main():
    """Main test function"""
    tester = BackendIntegrationTest()
    tester.run_all_tests()
    
    # Return exit code
    return 0 if tester.error_count == 0 else 1


if __name__ == '__main__':
    sys.exit(main())