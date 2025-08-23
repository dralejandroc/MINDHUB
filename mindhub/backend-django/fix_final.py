#!/usr/bin/env python3
"""
Script to fix the final relationships - use the clinic_id that works
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

def fix_final():
    """Fix the final relationships to use the clinic_id that actually works"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== FINAL FIX - USE WORKING CLINIC_ID ===\n")
        
        # The clinic_id that patients are using (and that has configuration)
        working_clinic_id = '38633a49-10e8-4138-b44b-7b7995d887e7'
        problematic_clinic_id = 'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0'
        
        print(f"🎯 Strategy: Update profiles to use working clinic_id: {working_clinic_id}")
        
        # First, verify this clinic_id exists in clinic_configurations
        cursor.execute("SELECT * FROM clinic_configurations WHERE id = %s;", (working_clinic_id,))
        config = cursor.fetchone()
        
        if config:
            print(f"✅ Found clinic configuration: {config['clinic_name']}")
        else:
            print(f"❌ No configuration found for {working_clinic_id}")
            return
        
        # Check how many patients are using this clinic_id
        cursor.execute("SELECT COUNT(*) as count FROM patients WHERE clinic_id = %s;", (working_clinic_id,))
        patient_count = cursor.fetchone()['count']
        print(f"📊 Patients using this clinic_id: {patient_count}")
        
        # Check if there's a corresponding record in clinics table
        cursor.execute("SELECT * FROM clinics WHERE id = %s;", (working_clinic_id,))
        clinic_record = cursor.fetchone()
        
        if not clinic_record:
            print(f"🔧 Creating clinic record for {working_clinic_id}")
            
            # Create the clinic record to satisfy the foreign key
            cursor.execute("""
                INSERT INTO clinics (id, name, legal_name, is_active, created_by, created_at, updated_at)
                VALUES (%s, %s, %s, true, %s, NOW(), NOW());
            """, (
                working_clinic_id, 
                'MindHub Clinic',
                'MindHub Clinic S.A.', 
                'a1c193e9-643a-4ba9-9214-29536ea93913'  # dr_aleks_c
            ))
            print(f"✅ Created clinic record")
        else:
            print(f"✅ Clinic record already exists: {clinic_record['name']}")
        
        # Now update the profiles to use the working clinic_id
        print(f"\n🔧 Updating profiles to use working clinic_id")
        
        cursor.execute("""
            UPDATE profiles 
            SET clinic_id = %s 
            WHERE clinic_id = %s;
        """, (working_clinic_id, problematic_clinic_id))
        
        profiles_updated = cursor.rowcount
        print(f"✅ Updated {profiles_updated} profiles")
        
        conn.commit()
        
        print("\n=== FINAL VERIFICATION ===")
        
        # Verify everything is consistent now
        cursor.execute("""
            SELECT p.email, p.license_type, p.clinic_id, c.name as clinic_name,
                   (SELECT COUNT(*) FROM patients WHERE clinic_id = p.clinic_id) as patient_count
            FROM profiles p
            LEFT JOIN clinics c ON p.clinic_id = c.id
            ORDER BY p.email;
        """)
        
        final_check = cursor.fetchall()
        print("📋 FINAL STATE:")
        for item in final_check:
            print(f"   - {item['email']} ({item['license_type']})")
            print(f"     Clinic: {item['clinic_name']} ({item['clinic_id']})")
            print(f"     Patients in clinic: {item['patient_count']}")
            print()
        
        # Test the filtering that will be used in the API
        aleks_user_id = 'a1c193e9-643a-4ba9-9214-29536ea93913'
        
        print("🧪 TESTING API FILTERING:")
        
        # For clinic license, should filter by clinic_id
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM patients 
            WHERE clinic_id = %s AND is_active = true;
        """, (working_clinic_id,))
        
        clinic_filtered_count = cursor.fetchone()['count']
        print(f"   - Clinic filtering (clinic_id = {working_clinic_id}): {clinic_filtered_count} patients")
        
        # For individual license, would filter by created_by
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM patients 
            WHERE created_by = %s AND is_active = true;
        """, (aleks_user_id,))
        
        user_filtered_count = cursor.fetchone()['count']
        print(f"   - Individual filtering (created_by = {aleks_user_id}): {user_filtered_count} patients")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 FINAL FIX COMPLETED! The API should now work.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    fix_final()