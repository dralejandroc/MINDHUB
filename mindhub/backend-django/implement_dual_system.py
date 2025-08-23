#!/usr/bin/env python3
"""
Script to implement the complete dual system according to MINDHUB_SECURITY_ARCHITECTURE_MASTER.md
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

def implement_dual_system():
    """Implement the complete dual system according to architecture"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== IMPLEMENTING DUAL SYSTEM ===\n")
        
        # Step 1: Create individual_workspaces table if it doesn't exist
        print("📋 STEP 1: Creating individual_workspaces table...")
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS individual_workspaces (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID REFERENCES profiles(id) NOT NULL,
                workspace_name VARCHAR(200) NOT NULL,
                business_name VARCHAR(200),
                tax_id VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        print("✅ individual_workspaces table created")
        
        # Step 2: Add workspace_id column to patients table if it doesn't exist
        print("\n📋 STEP 2: Adding workspace_id to patients table...")
        
        try:
            cursor.execute("""
                ALTER TABLE patients 
                ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES individual_workspaces(id);
            """)
            print("✅ workspace_id column added to patients")
        except Exception as e:
            print(f"ℹ️  workspace_id column may already exist: {e}")
        
        # Step 3: Create the dual system constraint
        print("\n📋 STEP 3: Creating dual system constraint...")
        
        try:
            # Remove existing constraint if it exists
            cursor.execute("""
                ALTER TABLE patients 
                DROP CONSTRAINT IF EXISTS check_patient_owner;
            """)
            
            # Add the dual system constraint
            cursor.execute("""
                ALTER TABLE patients 
                ADD CONSTRAINT check_patient_owner CHECK (
                    (clinic_id IS NOT NULL AND workspace_id IS NULL) OR
                    (clinic_id IS NULL AND workspace_id IS NOT NULL)
                );
            """)
            print("✅ Dual system constraint added to patients")
        except Exception as e:
            print(f"⚠️  Constraint error: {e}")
        
        # Step 4: Create individual workspace for dr_aleks_c
        print("\n📋 STEP 4: Creating individual workspace for dr_aleks_c...")
        
        aleks_user_id = 'a1c193e9-643a-4ba9-9214-29536ea93913'
        
        # Check if workspace already exists
        cursor.execute("""
            SELECT id, workspace_name FROM individual_workspaces 
            WHERE owner_id = %s;
        """, (aleks_user_id,))
        
        existing_workspace = cursor.fetchone()
        
        if existing_workspace:
            workspace_id = existing_workspace['id']
            print(f"✅ Found existing workspace: {existing_workspace['workspace_name']} ({workspace_id})")
        else:
            # Create new workspace
            cursor.execute("""
                INSERT INTO individual_workspaces (owner_id, workspace_name, business_name, tax_id)
                VALUES (%s, 'Dr. Alejandro - Consultorio Individual', 'Consultorio Dr. Alejandro', 'RFC123456789')
                RETURNING id;
            """, (aleks_user_id,))
            
            workspace_id = cursor.fetchone()['id']
            print(f"✅ Created new individual workspace: {workspace_id}")
        
        # Step 5: Update profiles to support both license types
        print("\n📋 STEP 5: Configuring dual license support in profiles...")
        
        # Set dr_aleks_c as individual license with workspace
        cursor.execute("""
            UPDATE profiles 
            SET license_type = 'individual',
                individual_workspace_id = %s,
                clinic_id = NULL
            WHERE id = %s;
        """, (workspace_id, aleks_user_id))
        
        print(f"✅ Set dr_aleks_c as individual license with workspace {workspace_id}")
        
        # Keep test@mindhub.com as clinic license
        test_user_id = 'a2733be9-6292-4381-a594-6fa386052052'
        cursor.execute("""
            UPDATE profiles 
            SET license_type = 'clinic',
                individual_workspace_id = NULL
            WHERE id = %s;
        """, (test_user_id,))
        
        print("✅ Kept test@mindhub.com as clinic license")
        
        # Step 6: Migrate some patients to individual workspace for testing
        print("\n📋 STEP 6: Migrating some patients to individual workspace...")
        
        # Move half of the patients to individual workspace
        cursor.execute("""
            WITH patient_ids AS (
                SELECT id 
                FROM patients 
                ORDER BY created_at 
                LIMIT 10
            )
            UPDATE patients 
            SET clinic_id = NULL,
                workspace_id = %s,
                created_by = %s
            WHERE id IN (SELECT id FROM patient_ids);
        """, (workspace_id, aleks_user_id))
        
        moved_count = cursor.rowcount
        print(f"✅ Moved {moved_count} patients to individual workspace")
        
        conn.commit()
        
        # Step 7: Verification
        print("\n=== DUAL SYSTEM VERIFICATION ===")
        
        # Verify profiles
        cursor.execute("""
            SELECT p.email, p.license_type, p.clinic_id, p.individual_workspace_id,
                   iw.workspace_name
            FROM profiles p
            LEFT JOIN individual_workspaces iw ON p.individual_workspace_id = iw.id
            ORDER BY p.email;
        """)
        
        profiles = cursor.fetchall()
        print("\n📋 PROFILES CONFIGURATION:")
        for profile in profiles:
            print(f"   - {profile['email']}")
            print(f"     License Type: {profile['license_type']}")
            if profile['license_type'] == 'clinic':
                print(f"     Clinic ID: {profile['clinic_id']}")
            elif profile['license_type'] == 'individual':
                print(f"     Workspace: {profile['workspace_name']} ({profile['individual_workspace_id']})")
            print()
        
        # Verify patient distribution
        cursor.execute("""
            SELECT 
                COUNT(CASE WHEN clinic_id IS NOT NULL THEN 1 END) as clinic_patients,
                COUNT(CASE WHEN workspace_id IS NOT NULL THEN 1 END) as workspace_patients,
                COUNT(*) as total_patients
            FROM patients;
        """)
        
        distribution = cursor.fetchone()
        print("📊 PATIENT DISTRIBUTION:")
        print(f"   - Clinic Patients: {distribution['clinic_patients']}")
        print(f"   - Individual Workspace Patients: {distribution['workspace_patients']}")
        print(f"   - Total Patients: {distribution['total_patients']}")
        
        # Test filtering queries
        print("\n🧪 TESTING DUAL SYSTEM QUERIES:")
        
        # Test clinic filtering
        clinic_id = '38633a49-10e8-4138-b44b-7b7995d887e7'
        cursor.execute("""
            SELECT COUNT(*) as count, 'clinic' as type
            FROM patients 
            WHERE clinic_id = %s AND is_active = true;
        """, (clinic_id,))
        
        clinic_result = cursor.fetchone()
        print(f"   - Clinic filtering (clinic_id = {clinic_id}): {clinic_result['count']} patients")
        
        # Test individual workspace filtering
        cursor.execute("""
            SELECT COUNT(*) as count, 'workspace' as type
            FROM patients 
            WHERE workspace_id = %s AND is_active = true;
        """, (workspace_id,))
        
        workspace_result = cursor.fetchone()
        print(f"   - Workspace filtering (workspace_id = {workspace_id}): {workspace_result['count']} patients")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 DUAL SYSTEM IMPLEMENTED SUCCESSFULLY!")
        print("✅ Both clinic and individual modes are now supported")
        print("✅ Database constraints ensure data integrity")
        print("✅ Ready for Django middleware integration")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    implement_dual_system()