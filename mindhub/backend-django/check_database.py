#!/usr/bin/env python3
"""
Script to check the current database structure and create necessary tables for the dual system
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

def check_database():
    """Check current database structure"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== CHECKING DATABASE STRUCTURE ===\n")
        
        # Check if profiles table exists
        cursor.execute("""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            ORDER BY ordinal_position;
        """)
        
        profiles_columns = cursor.fetchall()
        
        if profiles_columns:
            print("✅ PROFILES TABLE EXISTS:")
            for col in profiles_columns:
                print(f"   - {col['column_name']}: {col['data_type']} {'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'}")
        else:
            print("❌ PROFILES TABLE NOT FOUND")
            
        print()
        
        # Check if patients table exists and its structure
        cursor.execute("""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'patients' 
            ORDER BY ordinal_position;
        """)
        
        patients_columns = cursor.fetchall()
        
        if patients_columns:
            print("✅ PATIENTS TABLE EXISTS:")
            for col in patients_columns:
                print(f"   - {col['column_name']}: {col['data_type']} {'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'}")
        else:
            print("❌ PATIENTS TABLE NOT FOUND")
            
        print()
        
        # Check for any existing user/profile data
        if profiles_columns:
            cursor.execute("SELECT id, license_type, clinic_id FROM profiles LIMIT 5;")
            profile_data = cursor.fetchall()
            
            if profile_data:
                print("📊 SAMPLE PROFILES DATA:")
                for profile in profile_data:
                    print(f"   - ID: {profile['id']}, License: {profile['license_type']}, Clinic: {profile['clinic_id']}")
            else:
                print("📊 PROFILES TABLE IS EMPTY")
        
        print()
        
        # Check patients data
        if patients_columns:
            cursor.execute("SELECT id, first_name, last_name, created_by, clinic_id FROM patients LIMIT 5;")
            patient_data = cursor.fetchall()
            
            if patient_data:
                print("📊 SAMPLE PATIENTS DATA:")
                for patient in patient_data:
                    print(f"   - {patient['first_name']} {patient['last_name']}, Created by: {patient['created_by']}, Clinic: {patient['clinic_id']}")
            else:
                print("📊 PATIENTS TABLE IS EMPTY")
        
        print("\n=== RECOMMENDATIONS ===")
        
        if not profiles_columns:
            print("🔧 NEED TO CREATE PROFILES TABLE")
            print("   This table is required for the dual system to work")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_database()