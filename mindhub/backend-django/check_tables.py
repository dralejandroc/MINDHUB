#!/usr/bin/env python3
"""
Script to check table structures
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

def check_tables():
    """Check table structures"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== CHECKING TABLE STRUCTURES ===\n")
        
        # Check clinics table structure
        cursor.execute("""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'clinics'
            ORDER BY ordinal_position;
        """)
        
        clinics_columns = cursor.fetchall()
        
        if clinics_columns:
            print("📋 CLINICS TABLE STRUCTURE:")
            for col in clinics_columns:
                print(f"   - {col['column_name']}: {col['data_type']} {'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'}")
        else:
            print("❌ CLINICS TABLE NOT FOUND")
        
        print()
        
        # Check what's actually in clinics table (if it exists)
        if clinics_columns:
            # Get first few columns for a basic query
            basic_columns = [col['column_name'] for col in clinics_columns[:5]]
            column_list = ', '.join(basic_columns)
            
            cursor.execute(f"SELECT {column_list} FROM clinics LIMIT 5;")
            clinic_data = cursor.fetchall()
            
            print(f"📋 CLINICS TABLE DATA ({len(clinic_data)} rows):")
            for clinic in clinic_data:
                print(f"   - {dict(clinic)}")
        
        print("\n" + "="*50)
        
        # Let's also check what constraint is failing
        cursor.execute("""
            SELECT 
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name = 'profiles'
                AND kcu.column_name = 'clinic_id';
        """)
        
        fk_info = cursor.fetchall()
        print("📋 FOREIGN KEY CONSTRAINT INFO:")
        for fk in fk_info:
            print(f"   - {fk['table_name']}.{fk['column_name']} -> {fk['foreign_table_name']}.{fk['foreign_column_name']}")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 TABLE STRUCTURES CHECKED!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_tables()