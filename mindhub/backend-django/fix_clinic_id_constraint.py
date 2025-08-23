#!/usr/bin/env python3
"""
Script to fix the clinic_id NOT NULL constraint to support dual system
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

def fix_clinic_id_constraint():
    """Remove NOT NULL constraint from clinic_id to support dual system"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== FIXING CLINIC_ID CONSTRAINT FOR DUAL SYSTEM ===\n")
        
        # Step 1: Remove NOT NULL constraint from clinic_id
        print("📋 STEP 1: Removing NOT NULL constraint from clinic_id...")
        
        cursor.execute("""
            ALTER TABLE patients 
            ALTER COLUMN clinic_id DROP NOT NULL;
        """)
        print("✅ clinic_id NOT NULL constraint removed")
        
        # Step 2: Verify constraint is removed
        print("\n📋 STEP 2: Verifying constraint change...")
        
        cursor.execute("""
            SELECT column_name, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'patients' 
              AND column_name IN ('clinic_id', 'workspace_id')
            ORDER BY column_name;
        """)
        
        constraints = cursor.fetchall()
        print("📊 COLUMN CONSTRAINTS:")
        for constraint in constraints:
            nullable = "NULL" if constraint['is_nullable'] == 'YES' else "NOT NULL"
            print(f"   - {constraint['column_name']}: {nullable}")
        
        conn.commit()
        
        print(f"\n✅ CONSTRAINT FIXED! Now both clinic_id and workspace_id can be NULL")
        print("🎯 Ready to continue with dual system implementation")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    fix_clinic_id_constraint()