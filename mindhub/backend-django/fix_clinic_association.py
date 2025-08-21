#!/usr/bin/env python
"""
Script to diagnose and fix clinic association issues for Dr. Alejandro
This script will:
1. Check the profiles table for user a1c193e9-643a-4ba9-9214-29536ea93913
2. Check if there's a clinic created by this user
3. Update the user's profile to set the correct clinic_id if needed
4. Verify that the user has the proper clinic_role
"""

from supabase import create_client, Client
import json
import sys
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://jvbcpldzoyicefdtnwkd.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ"

# Dr. Alejandro's user ID
DR_ALEJANDRO_USER_ID = "a1c193e9-643a-4ba9-9214-29536ea93913"
DR_ALEJANDRO_EMAIL = "dr_aleks_c@hotmail.com"

def initialize_client():
    """Initialize Supabase client with service role key"""
    try:
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Supabase client initialized successfully")
        return client
    except Exception as e:
        print(f"❌ Failed to initialize Supabase client: {str(e)}")
        sys.exit(1)

def check_user_profile(client, user_id):
    """Check the user's profile in the profiles table"""
    print(f"\n🔍 Checking profile for user: {user_id}")
    
    try:
        # Check profiles table
        result = client.table('profiles').select('*').eq('id', user_id).execute()
        
        if result.data:
            profile = result.data[0]
            print("✅ User profile found:")
            print(f"   - ID: {profile.get('id')}")
            print(f"   - Email: {profile.get('email')}")
            print(f"   - Full Name: {profile.get('full_name')}")
            print(f"   - Clinic ID: {profile.get('clinic_id')}")
            print(f"   - Clinic Role: {profile.get('clinic_role')}")
            print(f"   - User Type: {profile.get('user_type')}")
            print(f"   - Created At: {profile.get('created_at')}")
            print(f"   - Updated At: {profile.get('updated_at')}")
            return profile
        else:
            print("❌ User profile not found")
            return None
            
    except Exception as e:
        print(f"❌ Error checking user profile: {str(e)}")
        return None

def check_clinics_by_user(client, user_id):
    """Check if there's a clinic created by this user"""
    print(f"\n🏥 Checking clinics created by user: {user_id}")
    
    try:
        # Check clinics table for clinics created by this user
        result = client.table('clinics').select('*').eq('created_by', user_id).execute()
        
        if result.data:
            print(f"✅ Found {len(result.data)} clinic(s) created by this user:")
            for clinic in result.data:
                print(f"   - Clinic ID: {clinic.get('id')}")
                print(f"   - Clinic Name: {clinic.get('name')}")
                print(f"   - Created By: {clinic.get('created_by')}")
                print(f"   - Created At: {clinic.get('created_at')}")
                print(f"   - Status: {clinic.get('status', 'active')}")
            return result.data
        else:
            print("⚠️  No clinics found created by this user")
            
            # Also check if user is associated with any clinic as owner
            result = client.table('clinics').select('*').eq('owner_id', user_id).execute()
            if result.data:
                print(f"✅ Found {len(result.data)} clinic(s) owned by this user:")
                for clinic in result.data:
                    print(f"   - Clinic ID: {clinic.get('id')}")
                    print(f"   - Clinic Name: {clinic.get('name')}")
                    print(f"   - Owner ID: {clinic.get('owner_id')}")
                return result.data
            else:
                print("⚠️  No clinics found owned by this user either")
                return []
            
    except Exception as e:
        print(f"❌ Error checking clinics: {str(e)}")
        return []

def check_all_clinics(client):
    """Check all clinics in the database to understand the structure"""
    print(f"\n📋 Checking all clinics in database:")
    
    try:
        result = client.table('clinics').select('*').limit(10).execute()
        
        if result.data:
            print(f"✅ Found {len(result.data)} clinic(s) in database:")
            for clinic in result.data:
                print(f"   - ID: {clinic.get('id')}")
                print(f"   - Name: {clinic.get('name', 'Unnamed')}")
                print(f"   - Created By: {clinic.get('created_by')}")
                print(f"   - Owner ID: {clinic.get('owner_id')}")
                print(f"   - Created At: {clinic.get('created_at')}")
                print("   ---")
            return result.data
        else:
            print("⚠️  No clinics found in database")
            return []
            
    except Exception as e:
        print(f"❌ Error checking all clinics: {str(e)}")
        return []

def create_clinic_for_user(client, user_id, user_email):
    """Create a clinic for the user if none exists"""
    print(f"\n🏗️  Creating clinic for user: {user_id}")
    
    clinic_data = {
        'id': f"clinic_{user_id}",
        'name': "Clínica Dr. Alejandro",
        'created_by': user_id,
        'owner_id': user_id,
        'status': 'active',
        'settings': {
            'default_appointment_duration': 60,
            'timezone': 'America/Mexico_City',
            'language': 'es'
        },
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    try:
        result = client.table('clinics').insert(clinic_data).execute()
        
        if result.data:
            clinic = result.data[0]
            print("✅ Clinic created successfully:")
            print(f"   - Clinic ID: {clinic.get('id')}")
            print(f"   - Clinic Name: {clinic.get('name')}")
            print(f"   - Owner: {clinic.get('owner_id')}")
            return clinic
        else:
            print("❌ Failed to create clinic")
            return None
            
    except Exception as e:
        print(f"❌ Error creating clinic: {str(e)}")
        return None

def update_user_profile(client, user_id, clinic_id):
    """Update user profile to associate with clinic"""
    print(f"\n🔄 Updating user profile to associate with clinic: {clinic_id}")
    
    update_data = {
        'clinic_id': clinic_id,
        'clinic_role': 'clinic_owner',
        'user_type': 'clinic_user',
        'updated_at': datetime.utcnow().isoformat()
    }
    
    try:
        result = client.table('profiles').update(update_data).eq('id', user_id).execute()
        
        if result.data:
            profile = result.data[0]
            print("✅ Profile updated successfully:")
            print(f"   - Clinic ID: {profile.get('clinic_id')}")
            print(f"   - Clinic Role: {profile.get('clinic_role')}")
            print(f"   - User Type: {profile.get('user_type')}")
            return profile
        else:
            print("❌ Failed to update profile")
            return None
            
    except Exception as e:
        print(f"❌ Error updating profile: {str(e)}")
        return None

def verify_fix(client, user_id):
    """Verify that the fix was successful"""
    print(f"\n✅ Verifying fix for user: {user_id}")
    
    # Check updated profile
    profile = check_user_profile(client, user_id)
    
    if profile:
        clinic_id = profile.get('clinic_id')
        clinic_role = profile.get('clinic_role')
        user_type = profile.get('user_type')
        
        if clinic_id and clinic_role == 'clinic_owner' and user_type == 'clinic_user':
            print("✅ SUCCESS: User is now properly associated with clinic")
            
            # Check that the clinic exists
            try:
                result = client.table('clinics').select('*').eq('id', clinic_id).execute()
                if result.data:
                    clinic = result.data[0]
                    print(f"✅ Associated clinic verified:")
                    print(f"   - Clinic Name: {clinic.get('name')}")
                    print(f"   - Clinic ID: {clinic.get('id')}")
                    print(f"   - Owner: {clinic.get('owner_id')}")
                    return True
                else:
                    print("❌ Associated clinic not found")
                    return False
            except Exception as e:
                print(f"❌ Error verifying clinic: {str(e)}")
                return False
        else:
            print("❌ Profile still not properly configured")
            return False
    else:
        print("❌ Could not verify profile")
        return False

def generate_sql_script():
    """Generate SQL script for manual execution if needed"""
    sql_script = f"""
-- SQL Script to Fix Clinic Association for Dr. Alejandro
-- User ID: {DR_ALEJANDRO_USER_ID}
-- Email: {DR_ALEJANDRO_EMAIL}

-- Step 1: Check current user profile
SELECT id, email, clinic_id, clinic_role, user_type, created_at, updated_at 
FROM profiles 
WHERE id = '{DR_ALEJANDRO_USER_ID}';

-- Step 2: Check if clinic exists for this user
SELECT id, name, created_by, owner_id, status, created_at 
FROM clinics 
WHERE created_by = '{DR_ALEJANDRO_USER_ID}' OR owner_id = '{DR_ALEJANDRO_USER_ID}';

-- Step 3: Create clinic if it doesn't exist
INSERT INTO clinics (
    id, 
    name, 
    created_by, 
    owner_id, 
    status, 
    settings, 
    created_at, 
    updated_at
) VALUES (
    'clinic_{DR_ALEJANDRO_USER_ID}',
    'Clínica Dr. Alejandro',
    '{DR_ALEJANDRO_USER_ID}',
    '{DR_ALEJANDRO_USER_ID}',
    'active',
    '{{"default_appointment_duration": 60, "timezone": "America/Mexico_City", "language": "es"}}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Update user profile to associate with clinic
UPDATE profiles 
SET 
    clinic_id = 'clinic_{DR_ALEJANDRO_USER_ID}',
    clinic_role = 'clinic_owner',
    user_type = 'clinic_user',
    updated_at = NOW()
WHERE id = '{DR_ALEJANDRO_USER_ID}';

-- Step 5: Verify the fix
SELECT 
    p.id as user_id,
    p.email,
    p.clinic_id,
    p.clinic_role,
    p.user_type,
    c.name as clinic_name,
    c.status as clinic_status
FROM profiles p
LEFT JOIN clinics c ON p.clinic_id = c.id
WHERE p.id = '{DR_ALEJANDRO_USER_ID}';
"""
    
    with open('/Users/alekscon/MINDHUB-Pro/mindhub/backend-django/fix_clinic_association.sql', 'w') as f:
        f.write(sql_script)
    
    print(f"\n📄 SQL script generated: fix_clinic_association.sql")
    return sql_script

def main():
    """Main function to diagnose and fix clinic association"""
    print("🔧 MindHub Clinic Association Fix Tool")
    print("=" * 50)
    
    # Initialize client
    client = initialize_client()
    
    # Step 1: Check user profile
    profile = check_user_profile(client, DR_ALEJANDRO_USER_ID)
    
    if not profile:
        print("❌ Cannot proceed without user profile")
        sys.exit(1)
    
    # Step 2: Check clinics
    user_clinics = check_clinics_by_user(client, DR_ALEJANDRO_USER_ID)
    
    # Step 3: Check all clinics to understand structure
    all_clinics = check_all_clinics(client)
    
    # Step 4: Determine if we need to create a clinic
    clinic_id = profile.get('clinic_id')
    
    if not clinic_id and not user_clinics:
        print("\n⚠️  User has no associated clinic. Creating one...")
        clinic = create_clinic_for_user(client, DR_ALEJANDRO_USER_ID, DR_ALEJANDRO_EMAIL)
        if clinic:
            clinic_id = clinic.get('id')
        else:
            print("❌ Failed to create clinic")
            sys.exit(1)
    elif user_clinics:
        clinic_id = user_clinics[0].get('id')
        print(f"\n✅ Using existing clinic: {clinic_id}")
    
    # Step 5: Update user profile if needed
    current_clinic_id = profile.get('clinic_id')
    current_role = profile.get('clinic_role')
    current_type = profile.get('user_type')
    
    if (current_clinic_id != clinic_id or 
        current_role != 'clinic_owner' or 
        current_type != 'clinic_user'):
        
        print("\n🔄 Updating user profile...")
        updated_profile = update_user_profile(client, DR_ALEJANDRO_USER_ID, clinic_id)
        
        if not updated_profile:
            print("❌ Failed to update profile")
            sys.exit(1)
    else:
        print("\n✅ User profile already properly configured")
    
    # Step 6: Verify the fix
    success = verify_fix(client, DR_ALEJANDRO_USER_ID)
    
    # Step 7: Generate SQL script for manual execution
    generate_sql_script()
    
    if success:
        print("\n🎉 SUCCESS: Clinic association fixed!")
        print("Dr. Alejandro should now see clinic patients instead of being treated as individual user.")
    else:
        print("\n❌ FAILED: Could not fix clinic association")
        print("Please check the generated SQL script for manual execution.")
    
    return success

if __name__ == "__main__":
    main()