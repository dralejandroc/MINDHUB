#!/usr/bin/env python
"""
Script to populate Supabase ClinimetrixPro tables directly
Uses the existing tables in Supabase
"""

import os
import json
import sys
from pathlib import Path
from supabase import create_client, Client
from datetime import datetime, timedelta
import uuid

# Supabase configuration
SUPABASE_URL = "https://jvbcpldzoyicefdtnwkd.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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
                'scale_id': scale_id,
                'name': metadata.get('name', 'Unknown Scale'),
                'abbreviation': metadata.get('abbreviation', scale_id.upper()),
                'category': metadata.get('category', 'General'),
                'description': metadata.get('description', ''),
                'version': metadata.get('version', '1.0'),
                'language': metadata.get('language', 'es'),
                'json_data': scale_data,  # Store the entire scale data
                'is_active': True,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Check if scale already exists
            existing = supabase.table('clinimetrix_registry').select('id').eq('scale_id', scale_id).execute()
            
            if existing.data:
                print(f"  ✓ Scale {scale_id} already exists, updating...")
                result = supabase.table('clinimetrix_registry').update(registry_data).eq('scale_id', scale_id).execute()
            else:
                print(f"  ✓ Adding new scale {scale_id}...")
                registry_data['id'] = str(uuid.uuid4())
                result = supabase.table('clinimetrix_registry').insert(registry_data).execute()
            
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
    
    # Get existing patients
    patients_result = supabase.table('patients').select('*').limit(5).execute()
    patients = patients_result.data
    
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
    
    for patient in patients:
        for i, (cons_type, cons_code, amount, notes) in enumerate(consultation_types[:3]):
            try:
                consultation_id = str(uuid.uuid4())
                consultation_date = (datetime.now() - timedelta(days=i*7)).isoformat()
                
                # Create consultation
                consultation_data = {
                    'id': consultation_id,
                    'patient_id': patient['id'],
                    'consultation_date': consultation_date,
                    'consultation_type': cons_type,
                    'chief_complaint': f'Motivo de consulta para {cons_type}',
                    'diagnosis': 'F32.1 - Episodio depresivo moderado',
                    'treatment_plan': 'Psicoterapia cognitivo-conductual + Farmacoterapia',
                    'notes': notes,
                    'amount': amount,
                    'status': 'completed',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                result = supabase.table('consultations').insert(consultation_data).execute()
                
                # Create corresponding payment
                payment_data = {
                    'id': str(uuid.uuid4()),
                    'consultation_id': consultation_id,
                    'patient_id': patient['id'],
                    'amount': amount,
                    'payment_date': consultation_date,
                    'payment_method': 'cash' if i % 2 == 0 else 'card',
                    'status': 'paid',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                result = supabase.table('payments').insert(payment_data).execute()
                
                consultations_created += 1
                patient_name = patient.get('full_name', patient.get('name', 'Unknown'))
                print(f"  ✓ Created consultation for {patient_name}: {cons_type}")
                
            except Exception as e:
                print(f"  ✗ Error creating consultation: {e}")
    
    print(f"\n✅ Created {consultations_created} consultations with payments")
    return consultations_created

def create_assessments():
    """Create sample ClinimetrixPro assessments"""
    
    print("\n" + "="*60)
    print("Creating sample ClinimetrixPro assessments...")
    
    # Get patients and available scales
    patients_result = supabase.table('patients').select('*').limit(3).execute()
    patients = patients_result.data
    
    scales_result = supabase.table('clinimetrix_registry').select('scale_id, name').eq('is_active', True).limit(5).execute()
    scales = scales_result.data
    
    if not patients or not scales:
        print("Need both patients and scales to create assessments")
        return 0
    
    assessments_created = 0
    
    for patient in patients:
        for scale in scales[:2]:  # 2 assessments per patient
            try:
                assessment_id = str(uuid.uuid4())
                
                assessment_data = {
                    'id': assessment_id,
                    'patient_id': patient['id'],
                    'scale_id': scale['scale_id'],
                    'scale_name': scale['name'],
                    'status': 'completed',
                    'score': 15.5,  # Sample score
                    'interpretation': 'Síntomas moderados - Se recomienda seguimiento',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'completed_at': datetime.now().isoformat()
                }
                
                # Check if table exists, if not use a different table name
                try:
                    result = supabase.table('clinimetrix_assessments').insert(assessment_data).execute()
                except:
                    # Try alternative table name
                    result = supabase.table('assessments').insert(assessment_data).execute()
                
                assessments_created += 1
                patient_name = patient.get('full_name', patient.get('name', 'Unknown'))
                print(f"  ✓ Created assessment for {patient_name}: {scale['name']}")
                
            except Exception as e:
                print(f"  ✗ Error creating assessment: {e}")
    
    print(f"\n✅ Created {assessments_created} assessments")
    return assessments_created

def main():
    """Main execution"""
    print("="*60)
    print("🚀 SUPABASE - DATABASE POPULATION SCRIPT")
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
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()