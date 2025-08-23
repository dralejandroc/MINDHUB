#!/usr/bin/env python3
"""
Script to debug the complete authentication and filtering flow
"""
import os
import sys
import django
import psycopg2
from psycopg2.extras import DictCursor

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinimetrix_django.settings')
django.setup()

def debug_full_flow():
    """Debug the complete flow from auth to patient filtering"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    # Test user data from headers
    test_user_id = 'a2733be9-6292-4381-a594-6fa386052052'
    test_email = 'dr_aleks_c@hotmail.com'
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== DEBUGGING FULL FLOW ===\n")
        print(f"🔍 Testing with user: {test_email} (ID: {test_user_id})\n")
        
        # Step 1: Check if user exists in profiles
        print("STEP 1: Check user in profiles table")
        cursor.execute("""
            SELECT 
                id, email, license_type, 
                clinic_id, individual_workspace_id, clinic_role
            FROM profiles 
            WHERE id = %s
        """, (test_user_id,))
        
        profile = cursor.fetchone()
        
        if profile:
            print(f"✅ Profile found:")
            print(f"   - Email: {profile['email']}")
            print(f"   - License Type: {profile['license_type']}")
            print(f"   - Clinic ID: {profile['clinic_id']}")
            print(f"   - Workspace ID: {profile['individual_workspace_id']}")
            print(f"   - Clinic Role: {profile['clinic_role']}")
            
            # Determine expected filtering logic
            license_type = profile['license_type']
            clinic_id = profile['clinic_id']
            workspace_id = profile['individual_workspace_id']
            
            print(f"\n🎯 Expected filtering logic:")
            if license_type == 'clinic' and clinic_id:
                print(f"   - Filter: clinic_id = {clinic_id}")
                filter_field = 'clinic_id'
                filter_value = clinic_id
            elif license_type == 'individual':
                print(f"   - Filter: created_by = {test_user_id}")
                filter_field = 'created_by'
                filter_value = test_user_id
            else:
                print(f"   - ERROR: Unclear filtering logic")
                filter_field = None
                filter_value = None
            
        else:
            print(f"❌ Profile not found for user {test_user_id}")
            return
        
        print()
        
        # Step 2: Test the filtering query
        print("STEP 2: Test patient filtering query")
        
        if filter_field and filter_value:
            if filter_field == 'clinic_id':
                query = "SELECT id, first_name, last_name, created_by, clinic_id FROM patients WHERE clinic_id = %s AND is_active = true ORDER BY created_at DESC LIMIT 10"
                params = (filter_value,)
            elif filter_field == 'created_by':
                query = "SELECT id, first_name, last_name, created_by, clinic_id FROM patients WHERE created_by = %s AND is_active = true ORDER BY created_at DESC LIMIT 10"
                params = (filter_value,)
            
            print(f"🔍 Query: {query}")
            print(f"🔍 Params: {params}")
            
            cursor.execute(query, params)
            patients = cursor.fetchall()
            
            print(f"📊 Found {len(patients)} patients:")
            for patient in patients[:5]:  # Show first 5
                print(f"   - {patient['first_name']} {patient['last_name']} (created_by: {patient['created_by']}, clinic_id: {patient['clinic_id']})")
            
            if len(patients) > 5:
                print(f"   ... and {len(patients) - 5} more")
                
        else:
            print("❌ Cannot test filtering - no valid filter logic determined")
        
        print()
        
        # Step 3: Test Django ORM equivalent
        print("STEP 3: Test Django ORM equivalent")
        
        try:
            from expedix.models import Patient
            
            if filter_field == 'clinic_id':
                django_patients = Patient.objects.filter(clinic_id=filter_value, is_active=True).order_by('-created_at')[:10]
            elif filter_field == 'created_by':
                django_patients = Patient.objects.filter(created_by=filter_value, is_active=True).order_by('-created_at')[:10]
            else:
                django_patients = []
            
            print(f"📊 Django ORM found {len(django_patients)} patients:")
            for patient in django_patients[:5]:
                print(f"   - {patient.first_name} {patient.last_name} (created_by: {patient.created_by}, clinic_id: {patient.clinic_id})")
            
            if len(django_patients) > 5:
                print(f"   ... and {len(django_patients) - 5} more")
                
        except Exception as e:
            print(f"❌ Django ORM error: {e}")
        
        print()
        
        # Step 4: Check for potential data issues
        print("STEP 4: Data consistency checks")
        
        # Check for patients with NULL clinic_id
        cursor.execute("SELECT COUNT(*) FROM patients WHERE clinic_id IS NULL")
        null_clinic_count = cursor.fetchone()[0]
        print(f"📊 Patients with NULL clinic_id: {null_clinic_count}")
        
        # Check for patients with NULL created_by
        cursor.execute("SELECT COUNT(*) FROM patients WHERE created_by IS NULL")
        null_created_by_count = cursor.fetchone()[0]
        print(f"📊 Patients with NULL created_by: {null_created_by_count}")
        
        # Check for patients with NULL is_active
        cursor.execute("SELECT COUNT(*) FROM patients WHERE is_active IS NULL")
        null_is_active_count = cursor.fetchone()[0]
        print(f"📊 Patients with NULL is_active: {null_is_active_count}")
        
        # Check total patient count
        cursor.execute("SELECT COUNT(*) FROM patients")
        total_patients = cursor.fetchone()[0]
        print(f"📊 Total patients in database: {total_patients}")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 DEBUG COMPLETED!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_full_flow()