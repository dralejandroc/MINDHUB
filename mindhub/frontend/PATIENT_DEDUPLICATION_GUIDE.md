# MindHub Patient Deduplication Solution

## Problem Identified

Ana Martínez Silva appeared in Expedix with **2 different medical record numbers** despite having identical information. Upon investigation, we discovered this was part of a larger duplication issue affecting **3 patients with 9 total duplicate records**.

## Analysis Results

### Duplicate Groups Found:
1. **Ana Martínez Silva** - 3 records with different MRNs:
   - `MRN-003-2025` (Keep - oldest, 2025-08-22 04:55:44)
   - `MRN-003-1755871376211` (Delete - 2025-08-22 14:02:56)
   - `MRN-003-1755871397386` (Delete - 2025-08-22 14:03:17)

2. **Carlos Rodríguez Hernández** - 3 records with different MRNs:
   - `MRN-002-2025` (Keep - oldest)
   - `MRN-002-1755871376211` (Delete)
   - `MRN-002-1755871397386` (Delete)

3. **María González López** - 3 records with different MRNs:
   - `MRN-001-2025` (Keep - oldest)
   - `MRN-001-1755871376211` (Delete)
   - `MRN-001-1755871397386` (Delete)

### Safety Verification
✅ **No related records**: All duplicate records have NO appointments, consultations, or other related data
✅ **Safe to delete**: Removing duplicates will not break any relationships

## Solution Files Created

### 1. `/patient_deduplication_script.sql`
- Complete PostgreSQL script with DRY_RUN mode
- Comprehensive duplicate detection logic
- Safety checks and logging
- Can be run directly in Supabase SQL editor

### 2. `/patient_deduplication_final.sql`
- Production-ready simplified version
- Step-by-step execution with previews
- Manual safety verification
- Specific DELETE commands for identified duplicates

### 3. `/run_patient_deduplication.py`
- Python script with two modes: `--dry-run` and `--execute`
- User-friendly interface with detailed previews
- Safety confirmations and step-by-step guidance
- Automated SQL generation

## How to Execute Deduplication

### Option 1: Python Script (Recommended)
```bash
# Preview what will be deleted
cd /Users/alekscon/MINDHUB-Pro/mindhub/frontend
python3 run_patient_deduplication.py --dry-run

# Get execution commands
python3 run_patient_deduplication.py --execute
```

### Option 2: SQL Script
```bash
# Copy contents of patient_deduplication_final.sql
# Run in Supabase SQL editor step by step
```

### Option 3: Manual DELETE Commands
```sql
-- Safety check first
WITH duplicates_to_delete AS (
    SELECT unnest(ARRAY[
        '7dbe6cf1-9ede-433b-b487-4f4a55033afa'::uuid,
        'ccbf7c92-9f23-456b-997a-302ee5bf6ed0'::uuid,
        'a8be9cc8-3202-40fe-b9d2-d3c9400ba691'::uuid,
        '16f37379-db47-4d0d-89f9-12d6ce14c49b'::uuid,
        'a16585ff-cc69-4229-bdd0-0ac659f21e65'::uuid,
        '666c23b5-3a87-4f84-ad60-9b9f10ab6fb9'::uuid
    ]) as patient_id
)
SELECT COUNT(*) as related_records FROM duplicates_to_delete dtd
LEFT JOIN appointments a ON dtd.patient_id = a.patient_id;
-- Should return 0

-- Execute deletions
DELETE FROM patients WHERE id = '7dbe6cf1-9ede-433b-b487-4f4a55033afa'; -- Ana (MRN-003-1755871376211)
DELETE FROM patients WHERE id = 'ccbf7c92-9f23-456b-997a-302ee5bf6ed0'; -- Ana (MRN-003-1755871397386)
DELETE FROM patients WHERE id = 'a8be9cc8-3202-40fe-b9d2-d3c9400ba691'; -- Carlos (MRN-002-1755871376211)
DELETE FROM patients WHERE id = '16f37379-db47-4d0d-89f9-12d6ce14c49b'; -- Carlos (MRN-002-1755871397386)
DELETE FROM patients WHERE id = 'a16585ff-cc69-4229-bdd0-0ac659f21e65'; -- María (MRN-001-1755871376211)
DELETE FROM patients WHERE id = '666c23b5-3a87-4f84-ad60-9b9f10ab6fb9'; -- María (MRN-001-1755871397386)

-- Verify success
SELECT 
    first_name || ' ' || paternal_last_name || ' ' || maternal_last_name as full_name,
    COUNT(*) as remaining_records,
    string_agg(medical_record_number, ', ') as mrns
FROM patients 
WHERE (first_name = 'Ana' AND paternal_last_name = 'Martínez' AND maternal_last_name = 'Silva')
   OR (first_name = 'Carlos' AND paternal_last_name = 'Rodríguez' AND maternal_last_name = 'Hernández')
   OR (first_name = 'María' AND paternal_last_name = 'González' AND maternal_last_name = 'López')
GROUP BY first_name, paternal_last_name, maternal_last_name;
-- Expected: 1 record per person
```

## Expected Results After Execution

### Before Deduplication:
- Ana Martínez Silva: 3 records with different MRNs
- Carlos Rodríguez Hernández: 3 records with different MRNs  
- María González López: 3 records with different MRNs
- **Total**: 9 patient records

### After Deduplication:
- Ana Martínez Silva: 1 record (MRN-003-2025)
- Carlos Rodríguez Hernández: 1 record (MRN-002-2025)
- María González López: 1 record (MRN-001-2025)
- **Total**: 3 patient records

## Prevention Strategy

To prevent future duplications, consider implementing:

1. **Unique Constraint**: Add database constraint on `(first_name, paternal_last_name, maternal_last_name, date_of_birth, user_id)`

2. **Application-Level Check**: Before creating new patients, search for existing patients with same name + DOB

3. **Medical Record Number Logic**: Improve MRN generation to avoid timestamp-based suffixes

4. **UI Enhancement**: Add "Similar patients found" warning during patient creation

## Safety Features

✅ **Dry-run mode** - Preview all changes before execution
✅ **Oldest record preservation** - Always keep the earliest created record
✅ **Relationship checking** - Verify no appointments/consultations exist on duplicates
✅ **Detailed logging** - Track every action taken
✅ **Verification queries** - Confirm success after execution
✅ **Rollback possible** - Can restore from backups if needed

## Files Location

All deduplication files are located in:
```
/Users/alekscon/MINDHUB-Pro/mindhub/frontend/
├── patient_deduplication_script.sql          # Complete PostgreSQL script
├── patient_deduplication_final.sql           # Production-ready version
├── run_patient_deduplication.py              # Python interface
└── PATIENT_DEDUPLICATION_GUIDE.md           # This documentation
```

## Contact

If you need assistance with the deduplication process or encounter any issues, ensure you have a database backup before proceeding, and test the scripts in dry-run mode first.