"""
Django management command to set up psychometric scales
Loads all JSON scales from the scales directory
"""

import json
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from psychometric_scales.models import PsychometricScale, ScaleTag


class Command(BaseCommand):
    help = 'Set up psychometric scales from JSON files'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--scales-dir',
            type=str,
            default=None,
            help='Directory containing scale JSON files'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force overwrite existing scales'
        )
    
    def handle(self, *args, **options):
        """Main command handler"""
        self.stdout.write("🧠 Setting up ClinimetrixPro scales...")
        
        # Determine scales directory
        scales_dir = options['scales_dir']
        if not scales_dir:
            scales_dir = settings.BASE_DIR / 'scales'
        else:
            scales_dir = Path(scales_dir)
        
        if not scales_dir.exists():
            self.stdout.write(
                self.style.ERROR(f"Scales directory not found: {scales_dir}")
            )
            return
        
        # Find all JSON files
        json_files = list(scales_dir.glob('*.json'))
        if not json_files:
            self.stdout.write(
                self.style.WARNING(f"No JSON files found in {scales_dir}")
            )
            return
        
        self.stdout.write(f"📋 Found {len(json_files)} scale files")
        
        # Process each scale file
        created_count = 0
        updated_count = 0
        error_count = 0
        
        for json_file in json_files:
            try:
                result = self.process_scale_file(json_file, options['force'])
                if result == 'created':
                    created_count += 1
                elif result == 'updated':
                    updated_count += 1
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f"❌ Error processing {json_file.name}: {e}")
                )
        
        # Summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write("🎉 Scale setup completed!")
        self.stdout.write(f"   ✅ Created: {created_count} scales")
        self.stdout.write(f"   🔄 Updated: {updated_count} scales")
        self.stdout.write(f"   ❌ Errors: {error_count} scales")
        self.stdout.write("="*50)
    
    def process_scale_file(self, json_file, force_update=False):
        """Process a single scale JSON file"""
        self.stdout.write(f"📊 Processing {json_file.name}...")
        
        # Load JSON data
        with open(json_file, 'r', encoding='utf-8') as f:
            scale_data = json.load(f)
        
        # Extract metadata
        metadata = scale_data.get('metadata', {})
        if not metadata:
            raise ValueError("No metadata found in scale JSON")
        
        # Check if scale exists
        scale_id = metadata.get('id') or json_file.stem
        existing_scale = PsychometricScale.objects.filter(id=scale_id).first()
        
        if existing_scale and not force_update:
            self.stdout.write(f"   ⏭️  Scale {scale_id} already exists (use --force to update)")
            return 'skipped'
        
        # Prepare scale data
        scale_fields = {
            'name': metadata.get('name', ''),
            'abbreviation': metadata.get('abbreviation', ''),
            'version': metadata.get('version', '1.0'),
            'description': metadata.get('description', ''),
            'category': metadata.get('category', 'other'),
            'subcategory': metadata.get('subcategory', ''),
            'target_population': metadata.get('targetPopulation', []),
            'administration_mode': metadata.get('administrationMode', 'self_administered'),
            'estimated_duration_minutes': metadata.get('estimatedDurationMinutes', 15),
            'language': metadata.get('language', 'es'),
            'authors': metadata.get('authors', []),
            'year': metadata.get('year'),
            'scale_data': scale_data,
            'is_active': True,
            'is_validated': True,
        }
        
        # Create or update scale
        if existing_scale:
            for field, value in scale_fields.items():
                setattr(existing_scale, field, value)
            existing_scale.save()
            self.stdout.write(f"   🔄 Updated scale: {scale_id}")
            result = 'updated'
        else:
            scale_fields['id'] = scale_id
            scale = PsychometricScale.objects.create(**scale_fields)
            self.stdout.write(f"   ✅ Created scale: {scale_id}")
            result = 'created'
        
        # Process tags
        if 'tags' in metadata:
            self.process_scale_tags(scale_id, metadata['tags'])
        
        return result
    
    def process_scale_tags(self, scale_id, tags):
        """Process tags for a scale"""
        scale = PsychometricScale.objects.get(id=scale_id)
        
        # Clear existing tags
        scale.tags.clear()
        
        # Add new tags
        for tag_name in tags:
            tag, created = ScaleTag.objects.get_or_create(
                name=tag_name,
                defaults={'description': f'Tag for {tag_name} scales'}
            )
            scale.tags.add(tag)
        
        self.stdout.write(f"   🏷️  Added {len(tags)} tags")
    
    def create_default_tags(self):
        """Create default scale tags"""
        default_tags = [
            ('Depression', 'Depression assessment scales'),
            ('Anxiety', 'Anxiety assessment scales'),
            ('Autism', 'Autism spectrum disorder scales'),
            ('Cognitive', 'Cognitive assessment scales'),
            ('Personality', 'Personality assessment scales'),
            ('Sleep', 'Sleep disorder scales'),
            ('Trauma', 'Trauma and PTSD scales'),
            ('OCD', 'Obsessive-compulsive disorder scales'),
            ('Psychosis', 'Psychosis and schizophrenia scales'),
            ('Eating', 'Eating disorder scales'),
            ('Substance', 'Substance use disorder scales'),
            ('General', 'General mental health scales'),
        ]
        
        for tag_name, description in default_tags:
            ScaleTag.objects.get_or_create(
                name=tag_name,
                defaults={'description': description}
            )