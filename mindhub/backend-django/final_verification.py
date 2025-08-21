#!/usr/bin/env python
"""
Final verification script to confirm the clinic association fix
"""

from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://jvbcpldzoyicefdtnwkd.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ"

DR_ALEJANDRO_USER_ID = "a1c193e9-643a-4ba9-9214-29536ea93913"

def main():
    """Verify the fix"""
    print("🔍 Final Verification of Clinic Association Fix")
    print("=" * 50)
    
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Check user profile
    result = client.table('profiles').select('*').eq('id', DR_ALEJANDRO_USER_ID).execute()
    
    if result.data:
        profile = result.data[0]
        print("✅ User Profile Status:")
        print(f"   - Email: {profile.get('email')}")
        print(f"   - Clinic ID: {profile.get('clinic_id')}")
        print(f"   - Clinic Role: {profile.get('clinic_role')}")
        print(f"   - System Role: {profile.get('role')}")
        print(f"   - Updated At: {profile.get('updated_at')}")
        
        # Check if values are correct
        issues = []
        if not profile.get('clinic_id'):
            issues.append("❌ No clinic_id assigned")
        else:
            print(f"   ✅ Clinic ID assigned: {profile.get('clinic_id')}")
            
        if profile.get('clinic_role') != 'clinic_owner':
            issues.append(f"❌ Clinic role is '{profile.get('clinic_role')}', should be 'clinic_owner'")
        else:
            print(f"   ✅ Clinic role correct: {profile.get('clinic_role')}")
            
        if profile.get('role') != 'admin':
            issues.append(f"❌ System role is '{profile.get('role')}', should be 'admin'")
        else:
            print(f"   ✅ System role correct: {profile.get('role')}")
        
        if issues:
            print("\n⚠️  Issues found:")
            for issue in issues:
                print(f"   {issue}")
        else:
            print("\n🎉 ALL CHECKS PASSED!")
            print("\nExpected Behavior:")
            print("   - Dr. Alejandro should now be recognized as a clinic owner")
            print("   - He should see clinic patients instead of individual user view")
            print("   - He should have admin privileges within the clinic")
            print("   - The system should treat him as a clinic_user rather than individual user")
            
    else:
        print("❌ User profile not found")

if __name__ == "__main__":
    main()