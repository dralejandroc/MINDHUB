"""
Management command to synchronize scales from JSON files
"""
import json
import os
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from psychometric_scales.models import PsychometricScale, ScaleCategory


class Command(BaseCommand):
    help = 'Synchronize psychometric scales from JSON files in scales/ directory'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating it'
        )
        parser.add_argument(
            '--force-update',
            action='store_true', 
            help='Update existing scales with new data from JSON files'
        )

    def handle(self, *args, **options):
        scales_dir = os.path.join(settings.BASE_DIR, 'scales')
        
        if not os.path.exists(scales_dir):
            raise CommandError(f'Scales directory does not exist: {scales_dir}')
        
        # Get all JSON files except format and index files
        json_files = [f for f in os.listdir(scales_dir) 
                     if f.endswith('.json') and 
                     f not in ['FORMATO-JSON-CLINIMETRIX-PRO.json', 'metadata-index.json']]
        
        self.stdout.write(f'Found {len(json_files)} JSON files to process')
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for json_file in sorted(json_files):
            file_path = os.path.join(scales_dir, json_file)
            result = self.process_scale_file(file_path, json_file, options)
            
            if result == 'created':
                created_count += 1
            elif result == 'updated':
                updated_count += 1
            else:
                skipped_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nCompleted: {created_count} created, {updated_count} updated, {skipped_count} skipped'
            )
        )

    def process_scale_file(self, file_path, json_filename, options):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            metadata = data.get('metadata', {})
            if not metadata:
                self.stdout.write(
                    self.style.WARNING(f'Skipping {json_filename}: No metadata found')
                )
                return 'skipped'
            
            # Extract basic information
            abbreviation = metadata.get('abbreviation', '')
            name = metadata.get('fullName', metadata.get('name', ''))
            
            if not abbreviation or not name:
                self.stdout.write(
                    self.style.WARNING(f'Skipping {json_filename}: Missing name or abbreviation')
                )
                return 'skipped'
            
            # Check if scale already exists
            existing_scale = PsychometricScale.objects.filter(abbreviation=abbreviation).first()
            
            if existing_scale and not options['force_update']:
                self.stdout.write(f'Skipping {abbreviation}: Already exists')
                return 'skipped'
            
            # Get or create category
            category_name = self.get_category_name(metadata, data)
            category, _ = ScaleCategory.objects.get_or_create(name=category_name)
            
            # Extract scale details
            scale_data = self.extract_scale_data(data, metadata, json_filename)
            scale_data['category'] = category
            
            if options['dry_run']:
                self.stdout.write(f'Would create/update: {abbreviation} - {name}')
                return 'created' if not existing_scale else 'updated'
            
            # Create or update scale
            if existing_scale:
                for key, value in scale_data.items():
                    setattr(existing_scale, key, value)
                existing_scale.save()
                self.stdout.write(f'Updated: {abbreviation} - {name}')
                return 'updated'
            else:
                scale = PsychometricScale.objects.create(**scale_data)
                self.stdout.write(f'Created: {abbreviation} - {name}')
                return 'created'
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error processing {json_filename}: {str(e)}')
            )
            return 'skipped'

    def extract_scale_data(self, data, metadata, json_filename):
        """Extract scale data from JSON structure"""
        
        # Count total items
        total_items = 0
        structure = data.get('structure', {})
        if 'sections' in structure:
            for section in structure['sections']:
                if 'items' in section:
                    total_items += len(section['items'])
        
        # Get administration details
        administration = metadata.get('administration', {})
        
        # Determine population
        population = self.get_population(metadata)
        
        # Get training requirements
        training = metadata.get('training', {})
        requires_training = 'minimal'
        if training:
            level = training.get('level', '').lower()
            if 'high' in level or 'extensive' in level:
                requires_training = 'extensive'
            elif 'moderate' in level or 'medium' in level:
                requires_training = 'moderate'
        
        # Handle year field (extract first year if range)
        year_field = metadata.get('year', 2024)
        if isinstance(year_field, str):
            # Extract first year from range like "1982-1983"
            year = int(year_field.split('-')[0]) if '-' in year_field else int(year_field)
        else:
            year = int(year_field)
        
        return {
            'name': metadata.get('fullName', metadata.get('name', '')),
            'abbreviation': metadata.get('abbreviation', ''),
            'description': metadata.get('description', ''),
            'authors': metadata.get('authors', []),
            'year': year,
            'total_items': total_items,
            'estimated_duration_minutes': administration.get('estimatedDurationMinutes', 10),
            'population': population,
            'requires_training': requires_training,
            'indication': metadata.get('clinicalApplication', {}).get('primaryIndications', ''),
            'json_file_path': f'scales/{json_filename}',
            'is_active': True,
        }
    
    def get_category_name(self, metadata, data):
        """Determine category based on metadata and content"""
        
        # Check clinical application
        clinical_app = metadata.get('clinicalApplication', {})
        primary_indications = clinical_app.get('primaryIndications', '').lower()
        
        # Map based on common terms
        if any(term in primary_indications for term in ['depresi', 'depression', 'mood']):
            return 'Trastornos del Estado de Ánimo'
        elif any(term in primary_indications for term in ['ansied', 'anxiety', 'panic']):
            return 'Trastornos de Ansiedad'
        elif any(term in primary_indications for term in ['cognitiv', 'cognitive', 'dementia', 'memory']):
            return 'Evaluación Cognitiva'
        elif any(term in primary_indications for term in ['trauma', 'ptsd', 'stress']):
            return 'Trastornos Relacionados con Traumas'
        elif any(term in primary_indications for term in ['psycho', 'schizo', 'psychosis']):
            return 'Trastornos Psicóticos'
        elif any(term in primary_indications for term in ['obsess', 'compuls', 'ocd']):
            return 'Trastornos Obsesivo-Compulsivos'
        elif any(term in primary_indications for term in ['eating', 'alimentari', 'anorex', 'bulim']):
            return 'Trastornos de la Conducta Alimentaria'
        elif any(term in primary_indications for term in ['autism', 'autis', 'asperger']):
            return 'Trastornos del Espectro Autista'
        elif any(term in primary_indications for term in ['sleep', 'sueño']):
            return 'Trastornos del Sueño'
        elif any(term in primary_indications for term in ['personality', 'personalidad']):
            return 'Trastornos de la Personalidad'
        elif any(term in primary_indications for term in ['pediatr', 'child', 'adolesc', 'niño']):
            return 'Evaluación Pediátrica'
        elif any(term in primary_indications for term in ['geriatr', 'elderly', 'adulto mayor']):
            return 'Evaluación Geriátrica'
        else:
            # Default category
            return 'Evaluación General'
    
    def get_population(self, metadata):
        """Determine target population"""
        administration = metadata.get('administration', {})
        target_pop = administration.get('targetPopulation', {})
        
        age_range = target_pop.get('ageRange', {})
        min_age = age_range.get('min', 0)
        max_age = age_range.get('max', 100)
        
        if max_age <= 12:
            return 'child'
        elif max_age <= 17:
            return 'adolescent'
        elif min_age >= 65:
            return 'elderly' 
        elif min_age >= 18:
            return 'adult'
        else:
            return 'all'