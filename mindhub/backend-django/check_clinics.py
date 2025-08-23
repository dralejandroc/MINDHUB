#!/usr/bin/env python3
"""
Script to check clinics table and fix relationships
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

def check_clinics():
    """Check clinics table and fix relationships"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== CHECKING CLINICS ===\n")
        
        # Check existing clinics
        cursor.execute("""
            SELECT id, clinic_name, created_by, created_at
            FROM clinics 
            ORDER BY created_at;
        """)
        
        clinics = cursor.fetchall()
        print("📋 EXISTING CLINICS:")
        for clinic in clinics:
            print(f"   - {clinic['clinic_name']} (ID: {clinic['id']})")
            print(f"     Created by: {clinic['created_by']}")
        
        print()
        
        # Check what clinic_ids are being used in patients
        cursor.execute("""
            SELECT DISTINCT clinic_id, COUNT(*) as count
            FROM patients
            GROUP BY clinic_id;
        """)
        
        patient_clinics = cursor.fetchall()
        print("📋 CLINIC IDs USED IN PATIENTS:")
        for clinic in patient_clinics:
            print(f"   - {clinic['clinic_id']}: {clinic['count']} patients")
        
        print()
        
        # Check what clinic_ids are being used in profiles
        cursor.execute("""
            SELECT DISTINCT clinic_id, COUNT(*) as count
            FROM profiles
            WHERE clinic_id IS NOT NULL
            GROUP BY clinic_id;
        """)
        
        profile_clinics = cursor.fetchall()
        print("📋 CLINIC IDs USED IN PROFILES:")
        for clinic in profile_clinics:
            print(f"   - {clinic['clinic_id']}: {clinic['count']} profiles")
        
        print()
        
        # Strategy: Update patients to use the existing clinic_id from profiles
        if clinics and patient_clinics:
            existing_clinic_id = clinics[0]['id']  # Use first (and likely only) clinic
            patients_clinic_id = patient_clinics[0]['clinic_id']
            
            if existing_clinic_id != patients_clinic_id:
                print(f"🔧 FIXING: Update patients to use existing clinic {existing_clinic_id}")
                
                cursor.execute("""
                    UPDATE patients 
                    SET clinic_id = %s 
                    WHERE clinic_id = %s;
                """, (existing_clinic_id, patients_clinic_id))
                
                rows_updated = cursor.rowcount
                print(f"✅ Updated {rows_updated} patients")
                
                conn.commit()
            else:
                print("✅ Clinic IDs are already consistent")
        
        print("\n=== FINAL VERIFICATION ===")
        
        # Final verification
        cursor.execute("""
            SELECT p.email, pr.clinic_id, c.clinic_name,
                   (SELECT COUNT(*) FROM patients WHERE clinic_id = pr.clinic_id) as patient_count
            FROM profiles p
            JOIN profiles pr ON p.id = pr.id
            LEFT JOIN clinics c ON pr.clinic_id = c.id
            ORDER BY p.email;
        """)
        
        final_check = cursor.fetchall()
        print("📋 FINAL STATE:")
        for item in final_check:
            print(f"   - {item['email']}: clinic {item['clinic_name']} ({item['clinic_id']})")
            print(f"     Patients in clinic: {item['patient_count']}")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 CLINICS CHECK COMPLETED!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_clinics()