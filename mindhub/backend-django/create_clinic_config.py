#!/usr/bin/env python3
"""
Script to create missing clinic configuration
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

def create_clinic_config():
    """Create missing clinic configuration"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== CREATING CLINIC CONFIGURATION ===\n")
        
        # Check clinic_configurations table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'clinic_configurations'
            ORDER BY ordinal_position;
        """)
        
        config_columns = cursor.fetchall()
        
        if not config_columns:
            print("❌ clinic_configurations table not found")
            return
        
        print("📋 CLINIC_CONFIGURATIONS TABLE STRUCTURE:")
        for col in config_columns:
            print(f"   - {col['column_name']}: {col['data_type']} {'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'} (default: {col['column_default']})")
        
        # Check what's currently in clinic_configurations
        cursor.execute("SELECT * FROM clinic_configurations LIMIT 5;")
        existing_configs = cursor.fetchall()
        
        print(f"\n📊 EXISTING CLINIC CONFIGURATIONS ({len(existing_configs)}):")
        for config in existing_configs:
            print(f"   - {dict(config)}")
        
        # Get the clinic that needs configuration
        clinic_id = 'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0'
        
        # Check if configuration already exists
        cursor.execute("SELECT * FROM clinic_configurations WHERE clinic_id = %s;", (clinic_id,))
        existing_config = cursor.fetchone()
        
        if existing_config:
            print(f"✅ Configuration already exists for clinic {clinic_id}")
        else:
            print(f"🔧 Creating configuration for clinic {clinic_id}")
            
            # Create basic clinic configuration
            insert_data = {
                'clinic_id': clinic_id,
                'max_users': 15,
                'max_patients': 1000,
                'features_enabled': ['patients', 'consultations', 'medical_history', 'appointments', 'resources'],
                'created_at': 'NOW()',
                'updated_at': 'NOW()'
            }
            
            # Build INSERT statement dynamically based on available columns
            available_columns = [col['column_name'] for col in config_columns]
            insert_columns = []
            insert_values = []
            
            for key, value in insert_data.items():
                if key in available_columns:
                    insert_columns.append(key)
                    if key in ['created_at', 'updated_at'] and value == 'NOW()':
                        insert_values.append('NOW()')
                    else:
                        insert_values.append('%s')
            
            # Remove NOW() values from the params list
            params = [v for k, v in insert_data.items() if k in insert_columns and v != 'NOW()']
            
            columns_str = ', '.join(insert_columns)
            values_str = ', '.join(insert_values)
            
            query = f"INSERT INTO clinic_configurations ({columns_str}) VALUES ({values_str});"
            
            print(f"🔍 Query: {query}")
            print(f"🔍 Params: {params}")
            
            cursor.execute(query, params)
            
            print(f"✅ Created clinic configuration")
            
        conn.commit()
        
        # Now try to fix the patients
        print(f"\n🔧 Now updating patients to use correct clinic_id: {clinic_id}")
        
        cursor.execute("""
            UPDATE patients 
            SET clinic_id = %s 
            WHERE clinic_id != %s;
        """, (clinic_id, clinic_id))
        
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
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 CLINIC CONFIGURATION CREATED!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    create_clinic_config()