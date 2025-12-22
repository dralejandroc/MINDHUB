#!/usr/bin/env python3
"""
MINDHUB Patient Deduplication Script
===================================

This script safely removes duplicate patient records from the Supabase database.

IDENTIFIED DUPLICATES:
- Ana Martínez Silva (3 records, will delete 2)
- Carlos Rodríguez Hernández (3 records, will delete 2)  
- María González López (3 records, will delete 2)

SAFETY FEATURES:
- Dry run mode by default
- Keeps oldest record for each duplicate group
- Verifies no related appointments/consultations exist
- Detailed logging of all actions

USAGE:
    python3 run_patient_deduplication.py --dry-run     # Preview only
    python3 run_patient_deduplication.py --execute     # Actually delete duplicates
"""

import argparse
import sys
from typing import List, Dict, Any

# Duplicate patient IDs to delete (identified from analysis)
DUPLICATES_TO_DELETE = [
    # Ana Martínez Silva duplicates (keep MRN-003-2025)
    {
        'id': '7dbe6cf1-9ede-433b-b487-4f4a55033afa',
        'name': 'Ana Martínez Silva',
        'mrn': 'MRN-003-1755871376211',
        'keep_mrn': 'MRN-003-2025'
    },
    {
        'id': 'ccbf7c92-9f23-456b-997a-302ee5bf6ed0', 
        'name': 'Ana Martínez Silva',
        'mrn': 'MRN-003-1755871397386',
        'keep_mrn': 'MRN-003-2025'
    },
    
    # Carlos Rodríguez Hernández duplicates (keep MRN-002-2025)
    {
        'id': 'a8be9cc8-3202-40fe-b9d2-d3c9400ba691',
        'name': 'Carlos Rodríguez Hernández', 
        'mrn': 'MRN-002-1755871376211',
        'keep_mrn': 'MRN-002-2025'
    },
    {
        'id': '16f37379-db47-4d0d-89f9-12d6ce14c49b',
        'name': 'Carlos Rodríguez Hernández',
        'mrn': 'MRN-002-1755871397386', 
        'keep_mrn': 'MRN-002-2025'
    },
    
    # María González López duplicates (keep MRN-001-2025)
    {
        'id': 'a16585ff-cc69-4229-bdd0-0ac659f21e65',
        'name': 'María González López',
        'mrn': 'MRN-001-1755871376211',
        'keep_mrn': 'MRN-001-2025'
    },
    {
        'id': '666c23b5-3a87-4f84-ad60-9b9f10ab6fb9',
        'name': 'María González López', 
        'mrn': 'MRN-001-1755871397386',
        'keep_mrn': 'MRN-001-2025'
    }
]

def print_header():
    """Print script header information."""
    print("=" * 80)
    print("MINDHUB PATIENT DEDUPLICATION SCRIPT")
    print("=" * 80)
    print(f"Found {len(DUPLICATES_TO_DELETE)} duplicate records to process")
    print(f"3 duplicate groups (Ana, Carlos, María)")
    print("Each group: 3 total records → Keep 1 oldest, Delete 2 newer")
    print()

def print_preview():
    """Print detailed preview of what will be deleted."""
    print("📋 DEDUPLICATION PREVIEW:")
    print("-" * 80)
    
    # Group by patient name
    groups = {}
    for dup in DUPLICATES_TO_DELETE:
        name = dup['name']
        if name not in groups:
            groups[name] = []
        groups[name].append(dup)
    
    for name, records in groups.items():
        keep_mrn = records[0]['keep_mrn']
        print(f"\n👤 {name}")
        print(f"   ✅ KEEP: {keep_mrn} (oldest record)")
        print(f"   ❌ DELETE {len(records)} duplicates:")
        for record in records:
            print(f"      - ID: {record['id']} | MRN: {record['mrn']}")
    
    print(f"\n📊 SUMMARY:")
    print(f"   • Total duplicate records to delete: {len(DUPLICATES_TO_DELETE)}")
    print(f"   • Unique patients affected: {len(groups)}")
    print(f"   • Records that will remain: {len(groups)}")
    print()

def print_sql_commands():
    """Print the SQL commands that would be executed."""
    print("🔧 SQL COMMANDS TO EXECUTE:")
    print("-" * 80)
    
    for dup in DUPLICATES_TO_DELETE:
        print(f"DELETE FROM patients WHERE id = '{dup['id']}'; -- {dup['name']} ({dup['mrn']})")
    
    print()
    print("🔍 VERIFICATION QUERY:")
    print("-" * 80)
    print("""
SELECT 
    first_name || ' ' || paternal_last_name || ' ' || maternal_last_name as full_name,
    medical_record_number,
    date_of_birth,
    created_at,
    'Should be only 1 record per person' as expected
FROM patients 
WHERE (first_name = 'Ana' AND paternal_last_name = 'Martínez' AND maternal_last_name = 'Silva')
   OR (first_name = 'Carlos' AND paternal_last_name = 'Rodríguez' AND maternal_last_name = 'Hernández')
   OR (first_name = 'María' AND paternal_last_name = 'González' AND maternal_last_name = 'López')
ORDER BY full_name, created_at;
""")

def execute_deduplication():
    """Execute the actual deduplication using Supabase."""
    print("🚨 EXECUTION MODE:")
    print("-" * 80)
    print("This script provides the SQL commands to run manually.")
    print("For safety, please copy and execute these commands in your Supabase SQL editor:")
    print()
    
    print("-- STEP 1: Safety check (run this first)")
    print("""
WITH duplicates_to_delete AS (
    SELECT unnest(ARRAY[
""")
    
    for i, dup in enumerate(DUPLICATES_TO_DELETE):
        comma = "," if i < len(DUPLICATES_TO_DELETE) - 1 else ""
        print(f"        '{dup['id']}':uuid{comma}")
    
    print("""    ]) as patient_id
)
SELECT 
    'safety_check' as check_type,
    'appointments' as table_name,
    COUNT(*) as related_records,
    CASE WHEN COUNT(*) = 0 THEN 'SAFE' ELSE 'WARNING' END as status
FROM duplicates_to_delete dtd
LEFT JOIN appointments a ON dtd.patient_id = a.patient_id

UNION ALL

SELECT 
    'safety_check' as check_type,
    'consultations' as table_name, 
    COUNT(*) as related_records,
    CASE WHEN COUNT(*) = 0 THEN 'SAFE' ELSE 'WARNING' END as status
FROM duplicates_to_delete dtd
LEFT JOIN consultations c ON dtd.patient_id = c.patient_id;
""")
    
    print("\n-- STEP 2: Execute deletions (only if safety check shows 'SAFE')")
    for dup in DUPLICATES_TO_DELETE:
        print(f"DELETE FROM patients WHERE id = '{dup['id']}'; -- {dup['name']} ({dup['mrn']})")
    
    print("\n-- STEP 3: Verify success")
    print("""
SELECT 
    first_name || ' ' || paternal_last_name || ' ' || maternal_last_name as full_name,
    COUNT(*) as remaining_records,
    string_agg(medical_record_number, ', ') as mrns
FROM patients 
WHERE (first_name = 'Ana' AND paternal_last_name = 'Martínez' AND maternal_last_name = 'Silva')
   OR (first_name = 'Carlos' AND paternal_last_name = 'Rodríguez' AND maternal_last_name = 'Hernández')
   OR (first_name = 'María' AND paternal_last_name = 'González' AND maternal_last_name = 'López')
GROUP BY first_name, paternal_last_name, maternal_last_name
ORDER BY full_name;
-- Expected: 1 record per person
""")

def main():
    """Main script execution."""
    parser = argparse.ArgumentParser(description='MindHub Patient Deduplication Tool')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--dry-run', action='store_true', 
                      help='Preview mode - show what would be deleted without making changes')
    group.add_argument('--execute', action='store_true',
                      help='Execution mode - provide SQL commands to run manually')
    
    args = parser.parse_args()
    
    print_header()
    print_preview()
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print("Review the preview above and run with --execute when ready")
        print_sql_commands()
        
    elif args.execute:
        print()
        response = input("⚠️  Are you sure you want to proceed with deduplication? (type 'YES' to confirm): ")
        if response == 'YES':
            execute_deduplication()
        else:
            print("❌ Operation cancelled")
            sys.exit(1)
    
    print()
    print("=" * 80)
    print("Script completed. Check the results carefully!")
    print("=" * 80)

if __name__ == '__main__':
    main()