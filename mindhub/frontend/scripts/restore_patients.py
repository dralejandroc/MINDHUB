#!/usr/bin/env python3
"""
Script to check and restore test patients for Dr. Alejandro
"""
import os
import sys
import json
from datetime import datetime
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://jvbcpldzoicefdtnwkd.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_user_and_workspace():
    """Check user profile and workspace"""
    print("\n📊 CHECKING USER AND WORKSPACE STATUS\n")
    
    try:
        # 1. Check user profile
        result = supabase.table('profiles').select('*').eq('email', 'dr_aleks_c@hotmail.com').execute()
        
        if not result.data:
            print("❌ User profile not found")
            return None
        
        profile = result.data[0]
        print(f"✅ User found:")
        print(f"   ID: {profile['id']}")
        print(f"   Email: {profile['email']}")
        print(f"   Name: {profile.get('full_name', 'N/A')}")
        print(f"   Role: {profile.get('role', 'N/A')}")
        
        # 2. Check individual workspace
        workspace_result = supabase.table('individual_workspaces').select('*').eq('owner_id', profile['id']).execute()
        
        if not workspace_result.data:
            print("⚠️ No individual workspace found for user")
            # Create workspace
            new_workspace = {
                'owner_id': profile['id'],
                'workspace_name': f"Consultorio Dr. {profile.get('full_name', 'Alejandro')}",
                'business_name': 'Consultorio Privado',
                'is_active': True
            }
            
            create_result = supabase.table('individual_workspaces').insert(new_workspace).execute()
            if create_result.data:
                workspace = create_result.data[0]
                print(f"✅ Workspace created: {workspace['id']}")
            else:
                print("❌ Error creating workspace")
                return None
        else:
            workspace = workspace_result.data[0]
            print(f"✅ Workspace found:")
            print(f"   ID: {workspace['id']}")
            print(f"   Name: {workspace['workspace_name']}")
            print(f"   Active: {workspace['is_active']}")
        
        return {'profile': profile, 'workspace': workspace}
        
    except Exception as e:
        print(f"❌ Error checking user/workspace: {e}")
        return None

def check_existing_patients(workspace_id):
    """Check existing patients in workspace"""
    print("\n📊 CHECKING EXISTING PATIENTS\n")
    
    try:
        result = supabase.table('patients').select('id, first_name, last_name, email, created_at').eq('workspace_id', workspace_id).order('created_at', desc=True).execute()
        
        patients = result.data if result.data else []
        print(f"Found {len(patients)} patients in workspace")
        
        if patients:
            print("\nExisting patients:")
            for i, p in enumerate(patients[:5]):
                print(f"   - {p['first_name']} {p['last_name']} ({p.get('email', 'N/A')})")
            if len(patients) > 5:
                print(f"   ... and {len(patients) - 5} more")
        
        return patients
        
    except Exception as e:
        print(f"❌ Error checking patients: {e}")
        return []

def create_test_patients(workspace_id, user_id):
    """Create test patients"""
    print("\n🔧 CREATING TEST PATIENTS\n")
    
    test_patients = [
        {
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'paternal_last_name': 'Pérez',
            'maternal_last_name': 'García',
            'email': 'juan.perez@example.com',
            'phone': '555-0101',
            'date_of_birth': '1985-03-15',
            'gender': 'male',
            'blood_type': 'O+',
            'address': 'Calle Principal 123, Col. Centro',
            'city': 'Ciudad de México',
            'state': 'CDMX',
            'zip_code': '01000',
            'curp': 'PEPJ850315HDFRNN01',
            'workspace_id': workspace_id,
            'created_by': user_id,
            'is_active': True
        },
        {
            'first_name': 'María',
            'last_name': 'González',
            'paternal_last_name': 'González',
            'maternal_last_name': 'López',
            'email': 'maria.gonzalez@example.com',
            'phone': '555-0102',
            'date_of_birth': '1990-07-22',
            'gender': 'female',
            'blood_type': 'A+',
            'address': 'Av. Reforma 456, Col. Juárez',
            'city': 'Ciudad de México',
            'state': 'CDMX',
            'zip_code': '06600',
            'curp': 'GOLM900722MDFNPR08',
            'workspace_id': workspace_id,
            'created_by': user_id,
            'is_active': True
        },
        {
            'first_name': 'Carlos',
            'last_name': 'Rodríguez',
            'paternal_last_name': 'Rodríguez',
            'maternal_last_name': 'Martínez',
            'email': 'carlos.rodriguez@example.com',
            'phone': '555-0103',
            'date_of_birth': '1978-11-30',
            'gender': 'male',
            'blood_type': 'B+',
            'address': 'Calle Madero 789, Col. Roma',
            'city': 'Ciudad de México',
            'state': 'CDMX',
            'zip_code': '06700',
            'curp': 'ROMC781130HDFDRR05',
            'workspace_id': workspace_id,
            'created_by': user_id,
            'is_active': True
        },
        {
            'first_name': 'Ana',
            'last_name': 'Martínez',
            'paternal_last_name': 'Martínez',
            'maternal_last_name': 'Hernández',
            'email': 'ana.martinez@example.com',
            'phone': '555-0104',
            'date_of_birth': '1995-05-18',
            'gender': 'female',
            'blood_type': 'AB+',
            'address': 'Av. Insurgentes 321, Col. Condesa',
            'city': 'Ciudad de México',
            'state': 'CDMX',
            'zip_code': '06140',
            'curp': 'MAHA950518MDFRRN09',
            'workspace_id': workspace_id,
            'created_by': user_id,
            'is_active': True
        },
        {
            'first_name': 'Roberto',
            'last_name': 'López',
            'paternal_last_name': 'López',
            'maternal_last_name': 'Sánchez',
            'email': 'roberto.lopez@example.com',
            'phone': '555-0105',
            'date_of_birth': '1982-09-10',
            'gender': 'male',
            'blood_type': 'O-',
            'address': 'Calle Hidalgo 654, Col. Del Valle',
            'city': 'Ciudad de México',
            'state': 'CDMX',
            'zip_code': '03100',
            'curp': 'LOSR820910HDFPNB02',
            'workspace_id': workspace_id,
            'created_by': user_id,
            'is_active': True
        },
        {
            'first_name': 'Laura',
            'last_name': 'Sánchez',
            'paternal_last_name': 'Sánchez',
            'maternal_last_name': 'Torres',
            'email': 'laura.sanchez@example.com',
            'phone': '555-0106',
            'date_of_birth': '1988-12-05',
            'gender': 'female',
            'blood_type': 'B-',
            'address': 'Calle Morelos 852, Col. Polanco',
            'city': 'Ciudad de México',
            'state': 'CDMX',
            'zip_code': '11560',
            'curp': 'SATL881205MDFNRR07',
            'workspace_id': workspace_id,
            'created_by': user_id,
            'is_active': True
        },
        {
            'first_name': 'Pedro',
            'last_name': 'Hernández',
            'paternal_last_name': 'Hernández',
            'maternal_last_name': 'Díaz',
            'email': 'pedro.hernandez@example.com',
            'phone': '555-0107',
            'date_of_birth': '1975-02-28',
            'gender': 'male',
            'blood_type': 'A-',
            'address': 'Av. Universidad 159, Col. Narvarte',
            'city': 'Ciudad de México',
            'state': 'CDMX',
            'zip_code': '03020',
            'curp': 'HEDP750228HDFRZD04',
            'workspace_id': workspace_id,
            'created_by': user_id,
            'is_active': True
        },
        {
            'first_name': 'Patricia',
            'last_name': 'Ramírez',
            'paternal_last_name': 'Ramírez',
            'maternal_last_name': 'Flores',
            'email': 'patricia.ramirez@example.com',
            'phone': '555-0108',
            'date_of_birth': '1993-08-17',
            'gender': 'female',
            'blood_type': 'O+',
            'address': 'Calle Zaragoza 753, Col. Centro',
            'city': 'Ciudad de México',
            'state': 'CDMX',
            'zip_code': '06050',
            'curp': 'RAFP930817MDFMLR01',
            'workspace_id': workspace_id,
            'created_by': user_id,
            'is_active': True
        }
    ]
    
    results = []
    for patient in test_patients:
        try:
            # Check if patient already exists
            existing = supabase.table('patients').select('id').eq('email', patient['email']).eq('workspace_id', workspace_id).execute()
            
            if existing.data:
                print(f"   ⚠️ Patient {patient['first_name']} {patient['last_name']} already exists")
                results.append(existing.data[0])
            else:
                result = supabase.table('patients').insert(patient).execute()
                if result.data:
                    print(f"   ✅ Created patient: {patient['first_name']} {patient['last_name']}")
                    results.append(result.data[0])
                else:
                    print(f"   ❌ Error creating {patient['first_name']} {patient['last_name']}")
        except Exception as e:
            print(f"   ❌ Error processing {patient['first_name']}: {e}")
    
    print(f"\n✅ Total patients processed: {len(results)}")
    return results

def main():
    print("========================================")
    print("  MINDHUB - PATIENT DATA CHECK & RESTORE")
    print("========================================")
    
    # 1. Check user and workspace
    user_info = check_user_and_workspace()
    if not user_info:
        print("\n❌ Cannot proceed without user/workspace")
        return
    
    profile = user_info['profile']
    workspace = user_info['workspace']
    
    # 2. Check existing patients
    existing_patients = check_existing_patients(workspace['id'])
    
    # 3. Create test patients if needed
    if len(existing_patients) < 5:
        print("\n⚠️ Less than 5 patients found, creating test data...")
        create_test_patients(workspace['id'], profile['id'])
    
    # 4. Final verification
    print("\n📊 FINAL VERIFICATION\n")
    final_patients = check_existing_patients(workspace['id'])
    
    print("\n========================================")
    print("  PROCESS COMPLETED")
    print("========================================")
    print(f"Total patients in workspace: {len(final_patients)}")
    print(f"Workspace ID: {workspace['id']}")
    print(f"User ID: {profile['id']}")
    print("\n✅ Data ready for testing!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Script error: {e}")
        sys.exit(1)