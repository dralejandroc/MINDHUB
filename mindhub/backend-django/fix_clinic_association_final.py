#!/usr/bin/env python
"""
Final script to fix clinic association for Dr. Alejandro
Based on actual database schema analysis
"""

from supabase import create_client, Client
from datetime import datetime, timezone
import sys

# Supabase configuration
SUPABASE_URL = "https://jvbcpldzoyicefdtnwkd.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ"

# Dr. Alejandro's information
DR_ALEJANDRO_USER_ID = "a1c193e9-643a-4ba9-9214-29536ea93913"
DR_ALEJANDRO_EMAIL = "dr_aleks_c@hotmail.com"

# Existing clinic to associate with
EXISTING_CLINIC_ID = "bf005c17-508f-4d3e-aee0-cb2d87f1a5d0"

def initialize_client():
    """Initialize Supabase client"""
    try:
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Supabase client initialized successfully")
        return client
    except Exception as e:
        print(f"❌ Failed to initialize Supabase client: {str(e)}")
        return None

def get_current_profile(client, user_id):
    """Get current user profile"""
    try:
        result = client.table('profiles').select('*').eq('id', user_id).execute()
        if result.data:
            return result.data[0]
        return None
    except Exception as e:
        print(f"❌ Error getting profile: {str(e)}")
        return None

def update_user_profile_association(client, user_id, clinic_id):
    """Update user profile to associate with clinic"""
    print(f"\n🔄 Updating user profile association...")
    print(f"   User ID: {user_id}")
    print(f"   Clinic ID: {clinic_id}")
    
    # The update data based on actual schema
    update_data = {
        'clinic_id': clinic_id,
        'clinic_role': 'clinic_owner',  # Change from 'professional' to 'clinic_owner'
        'role': 'admin',  # Change from 'member' to 'admin' for clinic management
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    try:
        result = client.table('profiles').update(update_data).eq('id', user_id).execute()
        
        if result.data:
            profile = result.data[0]
            print("✅ Profile updated successfully:")
            print(f"   - Clinic ID: {profile.get('clinic_id')}")
            print(f"   - Clinic Role: {profile.get('clinic_role')}")
            print(f"   - Role: {profile.get('role')}")
            print(f"   - Updated At: {profile.get('updated_at')}")
            return profile
        else:
            print("❌ No data returned from update")
            return None
            
    except Exception as e:
        print(f"❌ Error updating profile: {str(e)}")
        return None

def verify_clinic_exists(client, clinic_id):
    """Verify that the clinic exists"""
    try:
        result = client.table('clinics').select('*').eq('id', clinic_id).execute()
        if result.data:
            clinic = result.data[0]
            print(f"✅ Clinic verified:")
            print(f"   - ID: {clinic.get('id')}")
            print(f"   - Name: {clinic.get('name')}")
            print(f"   - Created By: {clinic.get('created_by')}")
            print(f"   - Active: {clinic.get('is_active')}")
            return clinic
        else:
            print(f"❌ Clinic {clinic_id} not found")
            return None
    except Exception as e:
        print(f"❌ Error verifying clinic: {str(e)}")
        return None

def update_patients_clinic_association(client, clinic_id):
    """Update patients to be associated with the clinic"""
    print(f"\n🏥 Updating patient associations...")
    
    try:
        # Get patients that don't have clinic_id set
        result = client.table('patients').select('id, first_name, last_name, clinic_id').is_('clinic_id', 'null').execute()
        
        if result.data:
            print(f"   Found {len(result.data)} patients without clinic association")
            
            # Update all patients to be associated with the clinic
            update_result = client.table('patients').update({
                'clinic_id': clinic_id,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).is_('clinic_id', 'null').execute()
            
            if update_result.data:
                print(f"   ✅ Updated {len(update_result.data)} patients")
                return True
            else:
                print("   ⚠️  No patients were updated")
                return True
        else:
            print("   ✅ All patients already have clinic associations")
            return True
            
    except Exception as e:
        print(f"   ❌ Error updating patients: {str(e)}")
        return False

def verify_final_state(client, user_id, clinic_id):
    """Verify that the fix was successful"""
    print(f"\n✅ Verifying final state...")
    
    # Check profile
    profile = get_current_profile(client, user_id)
    if not profile:
        print("❌ Could not verify profile")
        return False
    
    success = True
    
    print(f"📋 Profile Status:")
    print(f"   - Clinic ID: {profile.get('clinic_id')}")
    print(f"   - Clinic Role: {profile.get('clinic_role')}")
    print(f"   - Role: {profile.get('role')}")
    
    if profile.get('clinic_id') != clinic_id:
        print("   ❌ Clinic ID not set correctly")
        success = False
    
    if profile.get('clinic_role') != 'clinic_owner':
        print("   ❌ Clinic role not set to 'clinic_owner'")
        success = False
    
    # Check patients
    try:
        result = client.table('patients').select('id, clinic_id').eq('clinic_id', clinic_id).execute()
        patient_count = len(result.data) if result.data else 0
        print(f"📋 Patients associated with clinic: {patient_count}")
        
        if patient_count == 0:
            print("   ⚠️  No patients associated with clinic")
    except Exception as e:
        print(f"   ❌ Error checking patients: {str(e)}")
        success = False
    
    return success

def generate_sql_script():
    """Generate SQL script for manual execution"""
    sql_script = f"""-- MindHub Clinic Association Fix Script
-- Date: {datetime.now(timezone.utc).isoformat()}
-- User: Dr. Alejandro ({DR_ALEJANDRO_EMAIL})
-- User ID: {DR_ALEJANDRO_USER_ID}
-- Clinic ID: {EXISTING_CLINIC_ID}

-- Step 1: Check current user profile
SELECT 
    id,
    email,
    clinic_id,
    clinic_role,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE id = '{DR_ALEJANDRO_USER_ID}';

-- Step 2: Verify clinic exists
SELECT 
    id,
    name,
    created_by,
    is_active,
    created_at
FROM clinics 
WHERE id = '{EXISTING_CLINIC_ID}';

-- Step 3: Update user profile to associate with clinic
UPDATE profiles 
SET 
    clinic_id = '{EXISTING_CLINIC_ID}',
    clinic_role = 'clinic_owner',
    role = 'admin',
    updated_at = NOW()
WHERE id = '{DR_ALEJANDRO_USER_ID}';

-- Step 4: Update patients without clinic association
UPDATE patients 
SET 
    clinic_id = '{EXISTING_CLINIC_ID}',
    updated_at = NOW()
WHERE clinic_id IS NULL;

-- Step 5: Verify the fix
SELECT 
    p.id as user_id,
    p.email,
    p.clinic_id,
    p.clinic_role,
    p.role,
    c.name as clinic_name,
    c.is_active as clinic_active
FROM profiles p
LEFT JOIN clinics c ON p.clinic_id = c.id
WHERE p.id = '{DR_ALEJANDRO_USER_ID}';

-- Step 6: Check patient associations
SELECT 
    COUNT(*) as patient_count,
    clinic_id
FROM patients 
WHERE clinic_id = '{EXISTING_CLINIC_ID}'
GROUP BY clinic_id;

-- Expected Results:
-- - User should have clinic_id = '{EXISTING_CLINIC_ID}'
-- - User should have clinic_role = 'clinic_owner'
-- - User should have role = 'admin'
-- - Patients should be associated with the clinic
"""
    
    return sql_script

def main():
    """Main function to fix clinic association"""
    print("🔧 MindHub Clinic Association Fix - Final Version")
    print("=" * 55)
    
    # Initialize client
    client = initialize_client()
    if not client:
        sys.exit(1)
    
    # Step 1: Get current profile
    print(f"\n📋 Current Profile Status:")
    current_profile = get_current_profile(client, DR_ALEJANDRO_USER_ID)
    if not current_profile:
        print("❌ Cannot find user profile")
        sys.exit(1)
    
    print(f"   - Email: {current_profile.get('email')}")
    print(f"   - Current Clinic ID: {current_profile.get('clinic_id') or 'None'}")
    print(f"   - Current Clinic Role: {current_profile.get('clinic_role')}")
    print(f"   - Current Role: {current_profile.get('role')}")
    
    # Step 2: Verify clinic exists
    print(f"\n🏥 Verifying Clinic:")
    clinic = verify_clinic_exists(client, EXISTING_CLINIC_ID)
    if not clinic:
        print("❌ Cannot proceed without valid clinic")
        sys.exit(1)
    
    # Step 3: Update profile association
    print(f"\n🔄 Updating Profile Association:")
    updated_profile = update_user_profile_association(client, DR_ALEJANDRO_USER_ID, EXISTING_CLINIC_ID)
    if not updated_profile:
        print("❌ Failed to update profile")
        sys.exit(1)
    
    # Step 4: Update patient associations
    print(f"\n👥 Updating Patient Associations:")
    patients_updated = update_patients_clinic_association(client, EXISTING_CLINIC_ID)
    if not patients_updated:
        print("⚠️  Warning: Could not update patient associations")
    
    # Step 5: Verify final state
    success = verify_final_state(client, DR_ALEJANDRO_USER_ID, EXISTING_CLINIC_ID)
    
    # Step 6: Generate SQL script
    print(f"\n📄 Generating SQL script...")
    sql_script = generate_sql_script()
    with open('/Users/alekscon/MINDHUB-Pro/mindhub/backend-django/clinic_association_fix.sql', 'w') as f:
        f.write(sql_script)
    print(f"   ✅ SQL script saved: clinic_association_fix.sql")
    
    # Final results
    print(f"\n🎯 FINAL RESULTS:")
    print("=" * 20)
    
    if success:
        print("✅ SUCCESS: Clinic association has been fixed!")
        print("\nChanges made:")
        print(f"   - User {DR_ALEJANDRO_EMAIL} is now associated with clinic '{clinic.get('name')}'")
        print(f"   - User role changed to 'clinic_owner'")
        print(f"   - User system role changed to 'admin'")
        print(f"   - Patients are now associated with the clinic")
        print("\nResult:")
        print("   - Dr. Alejandro should now see clinic patients instead of being treated as individual user")
        print("   - The system should recognize him as a clinic owner with admin privileges")
    else:
        print("❌ PARTIAL SUCCESS: Some issues remain")
        print("   Please check the generated SQL script for manual verification")
    
    return success

if __name__ == "__main__":
    main()