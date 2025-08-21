#!/usr/bin/env python
"""
Script to check Supabase table schema
"""

from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://jvbcpldzoyicefdtnwkd.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Checking Supabase tables...")

tables_to_check = [
    'clinimetrix_registry',
    'patients', 
    'consultations',
    'payments',
    'assessments',
    'clinimetrix_assessments'
]

for table_name in tables_to_check:
    try:
        print(f"\n📋 Table: {table_name}")
        
        # Try to get one record to see the structure
        result = supabase.table(table_name).select('*').limit(1).execute()
        
        if result.data:
            print(f"   ✅ Table exists with {len(result.data[0])} columns:")
            for column in result.data[0].keys():
                print(f"      - {column}")
        else:
            print(f"   ⚠️  Table exists but is empty")
            
    except Exception as e:
        print(f"   ❌ Error accessing {table_name}: {e}")

print(f"\n🔗 Try direct queries...")

# Try some specific queries
try:
    print("\n📊 Clinimetrix Registry:")
    result = supabase.table('clinimetrix_registry').select('*').limit(3).execute()
    if result.data:
        print(f"   Found {len(result.data)} records")
        for record in result.data:
            print(f"   - ID: {record.get('id', 'N/A')}")
            # Print first few keys to understand structure
            keys = list(record.keys())[:5]
            print(f"     Columns: {keys}")
            break
    else:
        print("   No records found")
except Exception as e:
    print(f"   Error: {e}")

try:
    print("\n👥 Patients:")
    result = supabase.table('patients').select('*').limit(3).execute()
    if result.data:
        print(f"   Found {len(result.data)} records")
        for record in result.data:
            print(f"   - ID: {record.get('id', 'N/A')}")
            print(f"     Name: {record.get('full_name', record.get('first_name', 'N/A'))}")
            # Print column structure
            keys = list(record.keys())[:8]
            print(f"     Columns: {keys}")
            break
    else:
        print("   No records found")
except Exception as e:
    print(f"   Error: {e}")

print("\n✅ Schema check completed!")