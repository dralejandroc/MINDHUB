#!/usr/bin/env python3
"""
Script to fix user and clinic relationships in the database
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

def fix_relationships():
    """Fix user and clinic relationships"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== FIXING RELATIONSHIPS ===\n")
        
        # Strategy: Update the profiles' clinic_id to match the patients' clinic_id
        # This makes more sense since the patients already exist and have data
        
        patients_clinic_id = '38633a49-10e8-4138-b44b-7b7995d887e7'
        profiles_clinic_id = 'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0'
        
        print(f"🔧 Updating profiles clinic_id from {profiles_clinic_id} to {patients_clinic_id}")
        
        cursor.execute("""
            UPDATE profiles 
            SET clinic_id = %s 
            WHERE clinic_id = %s;
        """, (patients_clinic_id, profiles_clinic_id))
        
        rows_updated = cursor.rowcount
        print(f"✅ Updated {rows_updated} profiles")
        
        # Also, let's ensure created_by relationships are correct
        # Update all patients created by test@mindhub.com to be created by dr_aleks_c@hotmail.com
        test_user_id = 'a2733be9-6292-4381-a594-6fa386052052'
        aleks_user_id = 'a1c193e9-643a-4ba9-9214-29536ea93913'
        
        print(f"\n🔧 Updating patients created_by from {test_user_id} (test@mindhub.com) to {aleks_user_id} (dr_aleks_c@hotmail.com)")
        
        cursor.execute("""
            UPDATE patients 
            SET created_by = %s 
            WHERE created_by = %s;
        """, (aleks_user_id, test_user_id))
        
        patients_updated = cursor.rowcount
        print(f"✅ Updated {patients_updated} patients")
        
        # Commit the changes
        conn.commit()
        
        print("\n=== VERIFICATION ===")
        
        # Verify profiles
        cursor.execute("""
            SELECT id, email, license_type, clinic_id, clinic_role
            FROM profiles 
            ORDER BY email;
        """)
        
        profiles = cursor.fetchall()
        print("📋 UPDATED PROFILES:")
        for profile in profiles:
            print(f"   - {profile['email']} (ID: {profile['id']})")
            print(f"     Clinic ID: {profile['clinic_id']}")
        
        # Verify patient counts by clinic
        cursor.execute("""
            SELECT clinic_id, COUNT(*) as patient_count
            FROM patients 
            GROUP BY clinic_id;
        """)
        
        clinic_counts = cursor.fetchall()
        print("\n📋 PATIENTS BY CLINIC:")
        for clinic in clinic_counts:
            print(f"   - Clinic {clinic['clinic_id']}: {clinic['patient_count']} patients")
        
        # Verify patient counts by creator
        cursor.execute("""
            SELECT created_by, COUNT(*) as patient_count
            FROM patients 
            WHERE created_by IS NOT NULL
            GROUP BY created_by;
        """)
        
        creator_counts = cursor.fetchall()
        print("\n📋 PATIENTS BY CREATOR:")
        for creator in creator_counts:
            # Find creator email
            cursor.execute("SELECT email FROM profiles WHERE id = %s", (creator['created_by'],))
            creator_profile = cursor.fetchone()
            creator_email = creator_profile['email'] if creator_profile else 'Unknown'
            print(f"   - {creator_email} ({creator['created_by']}): {creator['patient_count']} patients")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 RELATIONSHIPS FIXED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    fix_relationships()