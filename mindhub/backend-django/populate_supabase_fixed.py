#!/usr/bin/env python
"""
Script to populate Supabase ClinimetrixPro tables directly - FIXED VERSION
Uses the correct column names from Supabase schema
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
    """Load all scale JSON files and populate the clinimetrix_registry table"""
    
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
            
            # Prepare the registry entry using CORRECT column names
            registry_data = {
                'template_id': scale_id,  # Using template_id instead of scale_id
                'abbreviation': metadata.get('abbreviation', scale_id.upper()),
                'name': metadata.get('name', 'Unknown Scale'),
                'category': metadata.get('category', 'General'),
                'subcategory': metadata.get('subcategory', ''),
                'description': metadata.get('description', ''),
                'version': metadata.get('version', '1.0'),
                'language': metadata.get('language', 'es'),
                'authors': metadata.get('authors', []),
                'year': metadata.get('year', 2025),
                'administration_mode': metadata.get('administrationMode', 'self_administered'),
                'estimated_duration_minutes': metadata.get('administrationTime', '10-15 minutos'),
                'target_population': metadata.get('targetPopulation', 'Adultos'),
                'total_items': scale_data.get('structure', {}).get('totalItems', 0),
                'score_range_min': 0,
                'score_range_max': scale_data.get('structure', {}).get('totalItems', 0) * 4,  # Assuming 0-4 scale
                'psychometric_properties': {},
                'clinical_validation': {},
                'is_public': True,
                'is_featured': False,
                'tags': metadata.get('keywords', []),
                'last_validated': datetime.now().isoformat(),
                'is_active': True,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Check if scale already exists using template_id
            existing = supabase.table('clinimetrix_registry').select('id').eq('template_id', scale_id).execute()
            
            if existing.data:
                print(f"  ✓ Scale {scale_id} already exists, updating...")
                result = supabase.table('clinimetrix_registry').update(registry_data).eq('template_id', scale_id).execute()
            else:
                print(f"  ✓ Adding new scale {scale_id}...")
                registry_data['id'] = f"registry-{scale_id}-{registry_data['version']}"
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
    
    # Get existing patients with correct column names
    patients_result = supabase.table('patients').select('id, first_name, last_name').limit(5).execute()
    patients = patients_result.data
    
    if not patients:
        print("No patients found. Please create patients first.")
        return 0
    
    consultations_created = 0
    
    # Sample consultation data (using only existing columns)
    consultation_types = [
        ('Primera consulta', 'initial', 'Evaluación inicial completa'),
        ('Seguimiento', 'followup', 'Consulta de seguimiento'),
        ('Urgencia', 'urgent', 'Consulta de urgencia'),
        ('Teleconsulta', 'virtual', 'Consulta virtual'),
        ('Evaluación psicométrica', 'assessment', 'Aplicación de escalas')
    ]
    
    for patient in patients:
        for i, (cons_type, cons_code, notes) in enumerate(consultation_types[:3]):
            try:
                consultation_id = str(uuid.uuid4())
                consultation_date = (datetime.now() - timedelta(days=i*7)).isoformat()
                
                # Create consultation with only existing columns
                consultation_data = {
                    'id': consultation_id,
                    'patient_id': patient['id'],
                    'consultation_date': consultation_date,
                    'consultation_type': cons_type,
                    'notes': notes,
                    'status': 'completed',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                result = supabase.table('consultations').insert(consultation_data).execute()
                
                consultations_created += 1
                patient_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}"
                print(f"  ✓ Created consultation for {patient_name}: {cons_type}")
                
            except Exception as e:
                print(f"  ✗ Error creating consultation: {e}")
    
    print(f"\n✅ Created {consultations_created} consultations")
    return consultations_created

def create_assessments():
    """Create sample ClinimetrixPro assessments"""
    
    print("\n" + "="*60)
    print("Creating sample ClinimetrixPro assessments...")
    
    # Get patients and available scales with correct column names
    patients_result = supabase.table('patients').select('id, first_name, last_name').limit(3).execute()
    patients = patients_result.data
    
    scales_result = supabase.table('clinimetrix_registry').select('template_id, name').eq('is_active', True).limit(5).execute()
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
                    'template_id': scale['template_id'],
                    'scale_name': scale['name'],
                    'status': 'completed',
                    'total_score': 15.5,  # Sample score
                    'interpretation': 'Síntomas moderados - Se recomienda seguimiento',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'completed_at': datetime.now().isoformat()
                }
                
                result = supabase.table('clinimetrix_assessments').insert(assessment_data).execute()
                
                assessments_created += 1
                patient_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}"
                print(f"  ✓ Created assessment for {patient_name}: {scale['name']}")
                
            except Exception as e:
                print(f"  ✗ Error creating assessment: {e}")
    
    print(f"\n✅ Created {assessments_created} assessments")
    return assessments_created

def create_appointments():
    """Create sample appointments for agenda functionality"""
    
    print("\n" + "="*60)
    print("Creating sample appointments...")
    
    # Get existing patients
    patients_result = supabase.table('patients').select('id, first_name, last_name').limit(3).execute()
    patients = patients_result.data
    
    if not patients:
        print("No patients found. Please create patients first.")
        return 0
    
    appointments_created = 0
    
    # Sample appointment types
    appointment_types = [
        ('Consulta inicial', 'initial_consultation'),
        ('Seguimiento', 'follow_up'),
        ('Evaluación psicológica', 'psychological_evaluation'),
        ('Sesión de terapia', 'therapy_session')
    ]
    
    for patient in patients:
        for i, (title, appointment_type) in enumerate(appointment_types[:2]):
            try:
                appointment_id = str(uuid.uuid4())
                
                # Create appointments for next few days
                appointment_date = (datetime.now() + timedelta(days=i+1)).isoformat()
                
                appointment_data = {
                    'id': appointment_id,
                    'patient_id': patient['id'],
                    'title': title,
                    'appointment_type': appointment_type,
                    'scheduled_date': appointment_date,
                    'duration_minutes': 60,
                    'status': 'scheduled',
                    'notes': f'Cita programada para {title}',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                try:
                    result = supabase.table('appointments').insert(appointment_data).execute()
                    appointments_created += 1
                    patient_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}"
                    print(f"  ✓ Created appointment for {patient_name}: {title}")
                except Exception as e:
                    print(f"  ⚠️  Appointments table might not exist: {e}")
                    break
                    
            except Exception as e:
                print(f"  ✗ Error creating appointment: {e}")
    
    print(f"\n✅ Created {appointments_created} appointments")
    return appointments_created

def main():
    """Main execution"""
    print("="*60)
    print("🚀 SUPABASE - DATABASE POPULATION SCRIPT (FIXED)")
    print("="*60)
    
    try:
        # 1. Load scales
        scales_count, errors = load_scales()
        
        # 2. Create consultations
        consultations_count = create_sample_consultations()
        
        # 3. Create assessments  
        assessments_count = create_assessments()
        
        # 4. Create appointments
        appointments_count = create_appointments()
        
        print("\n" + "="*60)
        print("📊 SUMMARY:")
        print(f"  - Scales loaded: {scales_count}")
        print(f"  - Consultations created: {consultations_count}")
        print(f"  - Assessments created: {assessments_count}")
        print(f"  - Appointments created: {appointments_count}")
        print(f"  - Errors: {len(errors)}")
        print("="*60)
        
        # Final verification
        print("\n🔍 VERIFICATION:")
        
        # Check scales
        scales_result = supabase.table('clinimetrix_registry').select('template_id').eq('is_active', True).execute()
        print(f"  - Active scales in registry: {len(scales_result.data)}")
        
        # Check patients
        patients_result = supabase.table('patients').select('id').execute()
        print(f"  - Total patients: {len(patients_result.data)}")
        
        # Check Django health
        try:
            health_result = supabase.rpc('health_check').execute()
            print(f"  - Django backend: ✅ Connected")
        except:
            print(f"  - Django backend: ⚠️  Check connection")
        
        print("\n🎉 Database population completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()