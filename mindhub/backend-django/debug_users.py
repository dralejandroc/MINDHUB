#!/usr/bin/env python3
"""
Script to debug user IDs and clinic relationships
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

def debug_users():
    """Debug user IDs and relationships"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== DEBUGGING USER RELATIONSHIPS ===\n")
        
        # Check all profiles
        print("📋 ALL PROFILES:")
        cursor.execute("""
            SELECT id, email, license_type, clinic_id, clinic_role
            FROM profiles 
            ORDER BY email;
        """)
        
        profiles = cursor.fetchall()
        for profile in profiles:
            print(f"   - {profile['email']}")
            print(f"     ID: {profile['id']}")
            print(f"     License: {profile['license_type']}")
            print(f"     Clinic ID: {profile['clinic_id']}")
            print(f"     Role: {profile['clinic_role']}")
            print()
        
        # Check unique clinic_ids in patients
        print("📋 CLINIC IDs IN PATIENTS:")
        cursor.execute("""
            SELECT DISTINCT clinic_id, COUNT(*) as patient_count
            FROM patients 
            GROUP BY clinic_id
            ORDER BY patient_count DESC;
        """)
        
        clinic_counts = cursor.fetchall()
        for clinic in clinic_counts:
            print(f"   - Clinic {clinic['clinic_id']}: {clinic['patient_count']} patients")
        
        print()
        
        # Check unique created_by in patients
        print("📋 CREATED_BY VALUES IN PATIENTS:")
        cursor.execute("""
            SELECT created_by, COUNT(*) as patient_count,
                   MIN(first_name || ' ' || last_name) as first_patient
            FROM patients 
            WHERE created_by IS NOT NULL
            GROUP BY created_by
            ORDER BY patient_count DESC;
        """)
        
        created_by_counts = cursor.fetchall()
        for creator in created_by_counts:
            print(f"   - Created by {creator['created_by']}: {creator['patient_count']} patients")
            print(f"     (e.g., {creator['first_patient']})")
        
        print()
        
        # Find the correct dr_aleks_c@hotmail.com profile
        print("🔍 SEARCHING FOR dr_aleks_c@hotmail.com:")
        cursor.execute("""
            SELECT id, email, license_type, clinic_id, clinic_role
            FROM profiles 
            WHERE email LIKE '%aleks%' OR email LIKE '%dr_%';
        """)
        
        aleks_profiles = cursor.fetchall()
        if aleks_profiles:
            for profile in aleks_profiles:
                print(f"   - Found: {profile['email']} (ID: {profile['id']})")
        else:
            print("   - Not found in profiles table")
            
            # Check if there's auth.users data
            cursor.execute("""
                SELECT id, email, created_at
                FROM auth.users 
                WHERE email LIKE '%aleks%' OR email LIKE '%dr_%'
                ORDER BY created_at DESC;
            """)
            
            auth_users = cursor.fetchall()
            if auth_users:
                print("   - Found in auth.users:")
                for user in auth_users:
                    print(f"     ID: {user['id']}, Email: {user['email']}")
            else:
                print("   - Not found in auth.users either")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 USER DEBUG COMPLETED!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_users()