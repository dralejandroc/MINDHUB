#!/usr/bin/env python
"""
Script to check the actual schema of Supabase tables
"""

from supabase import create_client, Client
import json

# Supabase configuration
SUPABASE_URL = "https://jvbcpldzoyicefdtnwkd.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ"

# Dr. Alejandro's user ID
DR_ALEJANDRO_USER_ID = "a1c193e9-643a-4ba9-9214-29536ea93913"

def initialize_client():
    """Initialize Supabase client"""
    try:
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Supabase client initialized successfully")
        return client
    except Exception as e:
        print(f"❌ Failed to initialize Supabase client: {str(e)}")
        return None

def check_table_structure(client, table_name):
    """Check the structure of a table by getting one record"""
    print(f"\n📋 Checking structure of table: {table_name}")
    
    try:
        result = client.table(table_name).select('*').limit(1).execute()
        
        if result.data:
            record = result.data[0]
            print(f"✅ Table {table_name} exists with columns:")
            for column, value in record.items():
                print(f"   - {column}: {type(value).__name__} = {value}")
            return record
        else:
            print(f"⚠️  Table {table_name} exists but is empty")
            
            # Try to get metadata via error message
            try:
                client.table(table_name).insert({'nonexistent': 'test'}).execute()
            except Exception as e:
                print(f"   Structure hint from error: {str(e)}")
            
            return {}
            
    except Exception as e:
        print(f"❌ Error checking table {table_name}: {str(e)}")
        return None

def check_profiles_table(client):
    """Specifically check the profiles table"""
    print(f"\n👤 Detailed profiles table check:")
    
    try:
        # Get Dr. Alejandro's profile
        result = client.table('profiles').select('*').eq('id', DR_ALEJANDRO_USER_ID).execute()
        
        if result.data:
            profile = result.data[0]
            print("✅ Dr. Alejandro's profile:")
            for key, value in profile.items():
                print(f"   {key}: {value}")
            return profile
        else:
            print("❌ Dr. Alejandro's profile not found")
            return None
            
    except Exception as e:
        print(f"❌ Error checking profiles: {str(e)}")
        return None

def check_clinics_table(client):
    """Specifically check the clinics table"""
    print(f"\n🏥 Detailed clinics table check:")
    
    try:
        # Get all clinics to see structure
        result = client.table('clinics').select('*').execute()
        
        if result.data:
            print(f"✅ Found {len(result.data)} clinic(s):")
            for i, clinic in enumerate(result.data):
                print(f"   Clinic #{i+1}:")
                for key, value in clinic.items():
                    print(f"     {key}: {value}")
                print("   ---")
            return result.data
        else:
            print("⚠️  No clinics found")
            return []
            
    except Exception as e:
        print(f"❌ Error checking clinics: {str(e)}")
        return None

def find_user_clinics_alternative(client, user_id):
    """Try alternative ways to find clinics associated with user"""
    print(f"\n🔍 Alternative search for user clinics:")
    
    # Try different possible column names
    possible_columns = ['created_by', 'owner_id', 'user_id', 'creator_id', 'admin_id']
    
    for column in possible_columns:
        try:
            print(f"   Trying column: {column}")
            result = client.table('clinics').select('*').eq(column, user_id).execute()
            
            if result.data:
                print(f"   ✅ Found {len(result.data)} clinic(s) with {column} = {user_id}")
                for clinic in result.data:
                    print(f"      - {clinic.get('name', 'Unnamed')} (ID: {clinic.get('id')})")
                return result.data
            else:
                print(f"   ⚠️  No clinics found with {column} = {user_id}")
                
        except Exception as e:
            print(f"   ❌ Error with column {column}: {str(e)}")
    
    return []

def main():
    """Main function"""
    print("🔍 MindHub Database Schema Check")
    print("=" * 40)
    
    client = initialize_client()
    if not client:
        return
    
    # Check key tables
    tables_to_check = ['profiles', 'clinics', 'patients', 'appointments']
    
    for table in tables_to_check:
        check_table_structure(client, table)
    
    # Detailed checks
    profile = check_profiles_table(client)
    clinics = check_clinics_table(client)
    
    # Alternative clinic search
    user_clinics = find_user_clinics_alternative(client, DR_ALEJANDRO_USER_ID)
    
    # Analysis
    print(f"\n📊 ANALYSIS:")
    print("=" * 20)
    
    if profile:
        print(f"✅ User Profile Found:")
        print(f"   - Email: {profile.get('email')}")
        print(f"   - Clinic ID: {profile.get('clinic_id') or 'None'}")
        print(f"   - Clinic Role: {profile.get('clinic_role') or 'None'}")
        print(f"   - User Type: {profile.get('user_type') or 'None'}")
        
        if not profile.get('clinic_id'):
            print("   ⚠️  ISSUE: User has no clinic_id assigned")
        
        if profile.get('clinic_role') == 'professional':
            print("   ⚠️  ISSUE: User has 'professional' role instead of 'clinic_owner'")
    
    if clinics:
        print(f"\n✅ Clinics in Database: {len(clinics)}")
        for clinic in clinics:
            print(f"   - {clinic.get('name', 'Unnamed')} (ID: {clinic.get('id')})")
            print(f"     Created by: {clinic.get('created_by')}")
    
    if user_clinics:
        print(f"\n✅ User-associated Clinics: {len(user_clinics)}")
    else:
        print(f"\n⚠️  No clinics directly associated with user {DR_ALEJANDRO_USER_ID}")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    print("=" * 20)
    
    if profile and not profile.get('clinic_id'):
        if clinics:
            clinic_id = clinics[0].get('id')
            print(f"1. Associate user with existing clinic: {clinic_id}")
            print(f"2. Update clinic_role to 'clinic_owner'")
            print(f"3. Set user_type to 'clinic_user'")
        else:
            print(f"1. Create a new clinic for the user")
            print(f"2. Associate user with the new clinic")
            print(f"3. Set clinic_role to 'clinic_owner'")
            print(f"4. Set user_type to 'clinic_user'")

if __name__ == "__main__":
    main()