#!/usr/bin/env python3
"""
Script to fix patients clinic_id to match existing clinic
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

def fix_patients_clinic():
    """Fix patients clinic_id to match existing clinic"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== FIXING PATIENTS CLINIC_ID ===\n")
        
        # Get the correct clinic_id (the one that exists in clinics table)
        cursor.execute("SELECT id, name FROM clinics LIMIT 1;")
        clinic = cursor.fetchone()
        
        if not clinic:
            print("❌ No clinics found!")
            return
        
        correct_clinic_id = clinic['id']
        clinic_name = clinic['name']
        
        print(f"✅ Found clinic: {clinic_name} (ID: {correct_clinic_id})")
        
        # Check current patient distribution
        cursor.execute("""
            SELECT clinic_id, COUNT(*) as count
            FROM patients
            GROUP BY clinic_id;
        """)
        
        current_distribution = cursor.fetchall()
        print("\n📊 CURRENT PATIENT DISTRIBUTION:")
        for dist in current_distribution:
            print(f"   - Clinic {dist['clinic_id']}: {dist['count']} patients")
        
        # Update all patients to use the correct clinic_id
        print(f"\n🔧 Updating all patients to use correct clinic_id: {correct_clinic_id}")
        
        cursor.execute("""
            UPDATE patients 
            SET clinic_id = %s 
            WHERE clinic_id != %s OR clinic_id IS NULL;
        """, (correct_clinic_id, correct_clinic_id))
        
        rows_updated = cursor.rowcount
        print(f"✅ Updated {rows_updated} patients")
        
        conn.commit()
        
        # Verification
        cursor.execute("""
            SELECT clinic_id, COUNT(*) as count
            FROM patients
            GROUP BY clinic_id;
        """)
        
        final_distribution = cursor.fetchall()
        print("\n📊 FINAL PATIENT DISTRIBUTION:")
        for dist in final_distribution:
            print(f"   - Clinic {dist['clinic_id']}: {dist['count']} patients")
        
        # Also update created_by to use the correct user (dr_aleks_c)
        aleks_user_id = 'a1c193e9-643a-4ba9-9214-29536ea93913'
        test_user_id = 'a2733be9-6292-4381-a594-6fa386052052'
        
        print(f"\n🔧 Updating created_by to use dr_aleks_c@hotmail.com ({aleks_user_id})")
        
        cursor.execute("""
            UPDATE patients 
            SET created_by = %s 
            WHERE created_by = %s;
        """, (aleks_user_id, test_user_id))
        
        created_by_updated = cursor.rowcount
        print(f"✅ Updated created_by for {created_by_updated} patients")
        
        conn.commit()
        
        # Final verification - check if filtering will work
        print("\n=== TESTING FILTERING ===")
        
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM patients 
            WHERE clinic_id = %s AND is_active = true;
        """, (correct_clinic_id,))
        
        clinic_patient_count = cursor.fetchone()['count']
        print(f"📊 Patients in clinic {correct_clinic_id}: {clinic_patient_count}")
        
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM patients 
            WHERE created_by = %s AND is_active = true;
        """, (aleks_user_id,))
        
        user_patient_count = cursor.fetchone()['count']
        print(f"📊 Patients created by {aleks_user_id}: {user_patient_count}")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 PATIENTS CLINIC_ID FIXED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    fix_patients_clinic()