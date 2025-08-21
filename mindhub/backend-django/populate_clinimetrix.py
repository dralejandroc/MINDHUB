#!/usr/bin/env python
"""
Script to populate ClinimetrixPro scales into production database via Supabase
Loads all JSON scale files and creates the registry entries
"""

import os
import json
import sys
from pathlib import Path

# Add the Django project to path
sys.path.insert(0, str(Path(__file__).parent))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinimetrix_django.settings')
import django
django.setup()

from django.db import connection
from datetime import datetime
import uuid

def load_scales():
    """Load all scale JSON files and populate the database"""
    
    scales_dir = Path(__file__).parent / 'scales'
    scales_loaded = 0
    errors = []
    
    # Skip non-scale files
    skip_files = ['FORMATO-JSON-CLINIMETRIX-PRO.json', 'metadata-index.json']
    
    # Get all JSON files
    json_files = [f for f in scales_dir.glob('*.json') if f.name not in skip_files]
    
    print(f"Found {len(json_files)} scale files to process")
    
    for json_file in json_files:
        try:
            print(f"\nProcessing {json_file.name}...")
            
            with open(json_file, 'r', encoding='utf-8') as f:
                scale_data = json.load(f)
            
            # Extract metadata
            metadata = scale_data.get('metadata', {})
            scale_id = metadata.get('id', json_file.stem)
            
            # Prepare the registry entry
            registry_data = {
                'id': str(uuid.uuid4()),
                'scale_id': scale_id,
                'name': metadata.get('name', 'Unknown Scale'),
                'abbreviation': metadata.get('abbreviation', scale_id.upper()),
                'category': metadata.get('category', 'General'),
                'description': metadata.get('description', ''),
                'version': metadata.get('version', '1.0'),
                'language': metadata.get('language', 'es'),
                'json_data': json.dumps(scale_data, ensure_ascii=False),
                'is_active': True,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Insert into database using raw SQL for Supabase compatibility
            with connection.cursor() as cursor:
                # Check if scale already exists
                cursor.execute("""
                    SELECT COUNT(*) FROM clinimetrix_registry 
                    WHERE scale_id = %s
                """, [scale_id])
                
                if cursor.fetchone()[0] > 0:
                    print(f"  ✓ Scale {scale_id} already exists, updating...")
                    cursor.execute("""
                        UPDATE clinimetrix_registry 
                        SET name = %s, abbreviation = %s, category = %s, 
                            description = %s, version = %s, language = %s,
                            json_data = %s, updated_at = %s
                        WHERE scale_id = %s
                    """, [
                        registry_data['name'],
                        registry_data['abbreviation'],
                        registry_data['category'],
                        registry_data['description'],
                        registry_data['version'],
                        registry_data['language'],
                        registry_data['json_data'],
                        registry_data['updated_at'],
                        scale_id
                    ])
                else:
                    print(f"  ✓ Adding new scale {scale_id}...")
                    cursor.execute("""
                        INSERT INTO clinimetrix_registry 
                        (id, scale_id, name, abbreviation, category, description, 
                         version, language, json_data, is_active, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, [
                        registry_data['id'],
                        registry_data['scale_id'],
                        registry_data['name'],
                        registry_data['abbreviation'],
                        registry_data['category'],
                        registry_data['description'],
                        registry_data['version'],
                        registry_data['language'],
                        registry_data['json_data'],
                        registry_data['is_active'],
                        registry_data['created_at'],
                        registry_data['updated_at']
                    ])
                
                scales_loaded += 1
                print(f"  ✓ Successfully processed {metadata.get('name', scale_id)}")
                
        except Exception as e:
            error_msg = f"Error processing {json_file.name}: {str(e)}"
            errors.append(error_msg)
            print(f"  ✗ {error_msg}")
    
    print(f"\n{'='*60}")
    print(f"✅ Successfully loaded {scales_loaded} scales")
    
    if errors:
        print(f"\n⚠️  Encountered {len(errors)} errors:")
        for error in errors:
            print(f"  - {error}")
    
    return scales_loaded, errors

def create_sample_consultations():
    """Create sample consultations for existing patients"""
    
    print("\n" + "="*60)
    print("Creating sample consultations...")
    
    with connection.cursor() as cursor:
        # Get existing patients
        cursor.execute("""
            SELECT id, full_name FROM patients 
            WHERE deleted_at IS NULL 
            LIMIT 5
        """)
        patients = cursor.fetchall()
        
        if not patients:
            print("No patients found. Please create patients first.")
            return 0
        
        consultations_created = 0
        
        # Sample consultation data
        consultation_types = [
            ('Primera consulta', 'initial', 1500.00, 'Evaluación inicial completa'),
            ('Seguimiento', 'followup', 1000.00, 'Consulta de seguimiento'),
            ('Urgencia', 'urgent', 2000.00, 'Consulta de urgencia'),
            ('Teleconsulta', 'virtual', 800.00, 'Consulta virtual'),
            ('Evaluación psicométrica', 'assessment', 1200.00, 'Aplicación de escalas')
        ]
        
        for patient_id, patient_name in patients:
            for i, (cons_type, cons_code, amount, notes) in enumerate(consultation_types[:3]):
                try:
                    consultation_id = str(uuid.uuid4())
                    
                    # Create consultation
                    cursor.execute("""
                        INSERT INTO consultations 
                        (id, patient_id, consultation_date, consultation_type, 
                         chief_complaint, diagnosis, treatment_plan, notes, 
                         amount, status, created_at, updated_at)
                        VALUES (%s, %s, CURRENT_DATE - INTERVAL '%s days', %s, 
                                %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """, [
                        consultation_id,
                        patient_id,
                        i * 7,  # Space consultations 7 days apart
                        cons_type,
                        f'Motivo de consulta para {cons_type}',
                        'F32.1 - Episodio depresivo moderado',
                        'Psicoterapia cognitivo-conductual + Farmacoterapia',
                        notes,
                        amount,
                        'completed'
                    ])
                    
                    # Create corresponding payment
                    cursor.execute("""
                        INSERT INTO payments 
                        (id, consultation_id, patient_id, amount, payment_date, 
                         payment_method, status, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, CURRENT_DATE - INTERVAL '%s days', 
                                %s, %s, NOW(), NOW())
                    """, [
                        str(uuid.uuid4()),
                        consultation_id,
                        patient_id,
                        amount,
                        i * 7,
                        'cash' if i % 2 == 0 else 'card',
                        'paid'
                    ])
                    
                    consultations_created += 1
                    print(f"  ✓ Created consultation for {patient_name}: {cons_type}")
                    
                except Exception as e:
                    print(f"  ✗ Error creating consultation: {e}")
        
        print(f"\n✅ Created {consultations_created} consultations with payments")
        return consultations_created

def create_assessments():
    """Create sample ClinimetrixPro assessments"""
    
    print("\n" + "="*60)
    print("Creating sample ClinimetrixPro assessments...")
    
    with connection.cursor() as cursor:
        # Get patients and available scales
        cursor.execute("""
            SELECT id, full_name FROM patients 
            WHERE deleted_at IS NULL 
            LIMIT 3
        """)
        patients = cursor.fetchall()
        
        cursor.execute("""
            SELECT scale_id, name FROM clinimetrix_registry 
            WHERE is_active = true 
            LIMIT 5
        """)
        scales = cursor.fetchall()
        
        if not patients or not scales:
            print("Need both patients and scales to create assessments")
            return 0
        
        assessments_created = 0
        
        for patient_id, patient_name in patients:
            for scale_id, scale_name in scales[:2]:  # 2 assessments per patient
                try:
                    assessment_id = str(uuid.uuid4())
                    
                    cursor.execute("""
                        INSERT INTO clinimetrix_assessments 
                        (id, patient_id, scale_id, scale_name, status, 
                         score, interpretation, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """, [
                        assessment_id,
                        patient_id,
                        scale_id,
                        scale_name,
                        'completed',
                        15.5,  # Sample score
                        'Síntomas moderados - Se recomienda seguimiento'
                    ])
                    
                    assessments_created += 1
                    print(f"  ✓ Created assessment for {patient_name}: {scale_name}")
                    
                except Exception as e:
                    print(f"  ✗ Error creating assessment: {e}")
        
        print(f"\n✅ Created {assessments_created} assessments")
        return assessments_created

def main():
    """Main execution"""
    print("="*60)
    print("🚀 CLINIMETRIX PRO - DATABASE POPULATION SCRIPT")
    print("="*60)
    
    try:
        # 1. Load scales
        scales_count, errors = load_scales()
        
        # 2. Create consultations
        consultations_count = create_sample_consultations()
        
        # 3. Create assessments  
        assessments_count = create_assessments()
        
        print("\n" + "="*60)
        print("📊 SUMMARY:")
        print(f"  - Scales loaded: {scales_count}")
        print(f"  - Consultations created: {consultations_count}")
        print(f"  - Assessments created: {assessments_count}")
        print(f"  - Errors: {len(errors)}")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()