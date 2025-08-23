#!/usr/bin/env python3
"""
Script to fix the profiles table - set license_type for existing users
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

def fix_profiles():
    """Fix profiles table - set license_type based on existing data"""
    
    # Database connection string from settings
    DATABASE_URL = "postgresql://postgres.jvbcpldzoyicefdtnwkd:53AlfaCoca.@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("=== FIXING PROFILES TABLE ===\n")
        
        # First, let's check the current state
        cursor.execute("""
            SELECT id, email, license_type, clinic_id, individual_workspace_id 
            FROM profiles 
            ORDER BY created_at;
        """)
        
        profiles = cursor.fetchall()
        
        print("📊 CURRENT PROFILES STATE:")
        for profile in profiles:
            print(f"   - {profile['email']}: license_type={profile['license_type']}, clinic_id={profile['clinic_id']}, workspace_id={profile['individual_workspace_id']}")
        
        print()
        
        # Update logic:
        # If a user has clinic_id but no individual_workspace_id -> clinic license
        # If a user has individual_workspace_id but no clinic_id -> individual license  
        # If a user has both or neither -> need to decide based on context
        
        updates_made = 0
        
        for profile in profiles:
            profile_id = profile['id']
            email = profile['email']
            current_license = profile['license_type']
            clinic_id = profile['clinic_id']
            workspace_id = profile['individual_workspace_id']
            
            new_license_type = None
            
            if current_license is None:  # Only update if not already set
                if clinic_id and not workspace_id:
                    new_license_type = 'clinic'
                    print(f"🔧 Setting {email} to CLINIC license (has clinic_id: {clinic_id})")
                elif workspace_id and not clinic_id:
                    new_license_type = 'individual'
                    print(f"🔧 Setting {email} to INDIVIDUAL license (has workspace_id: {workspace_id})")
                elif clinic_id and workspace_id:
                    # User has both - default to clinic since they're in a clinic
                    new_license_type = 'clinic'
                    print(f"🔧 Setting {email} to CLINIC license (has both, defaulting to clinic)")
                elif not clinic_id and not workspace_id:
                    # User has neither - default to individual and create workspace_id
                    new_license_type = 'individual'
                    # Generate workspace_id
                    cursor.execute("""
                        UPDATE profiles 
                        SET individual_workspace_id = gen_random_uuid()
                        WHERE id = %s;
                    """, (profile_id,))
                    print(f"🔧 Setting {email} to INDIVIDUAL license (created new workspace_id)")
                
                if new_license_type:
                    cursor.execute("""
                        UPDATE profiles 
                        SET license_type = %s
                        WHERE id = %s;
                    """, (new_license_type, profile_id))
                    updates_made += 1
            else:
                print(f"✅ {email} already has license_type: {current_license}")
        
        if updates_made > 0:
            conn.commit()
            print(f"\n✅ Updated {updates_made} profiles with license_type")
        else:
            print(f"\n✅ All profiles already have license_type set")
        
        # Verify the updates
        print("\n=== VERIFICATION ===")
        cursor.execute("""
            SELECT id, email, license_type, clinic_id, individual_workspace_id 
            FROM profiles 
            ORDER BY created_at;
        """)
        
        updated_profiles = cursor.fetchall()
        
        print("📊 UPDATED PROFILES STATE:")
        for profile in updated_profiles:
            print(f"   - {profile['email']}: license_type={profile['license_type']}, clinic_id={profile['clinic_id']}, workspace_id={profile['individual_workspace_id']}")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 PROFILES FIXED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    fix_profiles()