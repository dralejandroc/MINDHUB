"""
Management command to migrate from old scales to new ScalesV3 JSON-based system
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from assessments.template_loader import template_loader
from assessments.models import Assessment
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Migrate from old scale system to new ScalesV3 JSON-based templates'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without making changes'
        )
        parser.add_argument(
            '--validate-only',
            action='store_true',
            help='Only validate ScalesV3 templates without migrating'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force migration even if validation fails'
        )
    
    def handle(self, *args, **options):
        if options['validate_only']:
            self.validate_scales()
            return
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        try:
            self.migrate_scales(dry_run=options['dry_run'], force=options['force'])
        except Exception as e:
            raise CommandError(f'Migration failed: {str(e)}')
    
    def validate_scales(self):
        """
        Validate all ScalesV3 templates
        """
        self.stdout.write('Validating ScalesV3 templates...')
        
        scales = template_loader.get_available_scales()
        total_scales = len(scales)
        valid_scales = 0
        errors = []
        
        for scale in scales:
            scale_id = scale['id']
            is_valid, scale_errors = template_loader.validate_template(scale_id)
            
            if is_valid:
                valid_scales += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ {scale["abbreviation"]} - {scale["name"]}')
                )
            else:
                errors.extend([f'{scale_id}: {error}' for error in scale_errors])
                self.stdout.write(
                    self.style.ERROR(f'✗ {scale["abbreviation"]} - {scale["name"]}')
                )
                for error in scale_errors:
                    self.stdout.write(f'    - {error}')
        
        self.stdout.write('')
        self.stdout.write(f'Validation Summary:')
        self.stdout.write(f'  Total scales: {total_scales}')
        self.stdout.write(f'  Valid scales: {valid_scales}')
        self.stdout.write(f'  Invalid scales: {total_scales - valid_scales}')
        
        if errors and not options.get('force', False):
            self.stdout.write('')
            self.stdout.write(self.style.ERROR('Validation failed. Fix errors before migrating.'))
            self.stdout.write('Use --force to migrate anyway (not recommended).')
            return False
        
        return True
    
    def migrate_scales(self, dry_run=False, force=False):
        """
        Migrate assessments to use new template system
        """
        # First validate templates
        if not self.validate_scales() and not force:
            return
        
        self.stdout.write('')
        self.stdout.write('Starting migration to ScalesV3 system...')
        
        # Get available scales
        available_scales = template_loader.get_available_scales()
        scale_mapping = self.create_scale_mapping(available_scales)
        
        if not scale_mapping:
            self.stdout.write(self.style.WARNING('No scale mappings found - nothing to migrate'))
            return
        
        # Find assessments that need migration
        assessments_to_migrate = Assessment.objects.filter(
            template_id__isnull=True  # Old assessments without template_id
        ).exclude(
            status='cancelled'
        )
        
        total_assessments = assessments_to_migrate.count()
        self.stdout.write(f'Found {total_assessments} assessments to migrate')
        
        if dry_run:
            self.show_migration_preview(assessments_to_migrate, scale_mapping)
            return
        
        # Perform migration
        with transaction.atomic():
            migrated_count = 0
            error_count = 0
            
            for assessment in assessments_to_migrate:
                try:
                    # Map old scale to new template
                    new_template_id = self.map_assessment_to_template(assessment, scale_mapping)
                    
                    if new_template_id:
                        # Update assessment with new template
                        assessment.template_id = new_template_id
                        
                        # Load template to get metadata
                        template = template_loader.get_scale_template(new_template_id.replace('-1.0', ''))
                        
                        if template:
                            # Update metadata
                            if not assessment.metadata:
                                assessment.metadata = {}
                            
                            assessment.metadata.update({
                                'migrated_from_legacy': True,
                                'migration_date': timezone.now().isoformat(),
                                'template_version': template['metadata']['version'],
                                'scale_name': template['metadata']['name'],
                                'scale_abbreviation': template['metadata']['abbreviation']
                            })
                        
                        assessment.save()
                        migrated_count += 1
                        
                        if migrated_count % 100 == 0:
                            self.stdout.write(f'Migrated {migrated_count}/{total_assessments} assessments...')
                    else:
                        error_count += 1
                        logger.warning(f'Could not map assessment {assessment.id} to new template')
                
                except Exception as e:
                    error_count += 1
                    logger.error(f'Error migrating assessment {assessment.id}: {str(e)}')
            
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS(f'Migration completed!'))
            self.stdout.write(f'  Migrated: {migrated_count} assessments')
            self.stdout.write(f'  Errors: {error_count} assessments')
            
            if error_count > 0:
                self.stdout.write(self.style.WARNING('Some assessments could not be migrated. Check logs for details.'))
    
    def create_scale_mapping(self, available_scales):
        """
        Create mapping from old scale identifiers to new template IDs
        """
        mapping = {}
        
        # Common mappings based on typical scale names/abbreviations
        common_mappings = {
            # Depression scales
            'phq9': 'phq9-1.0',
            'phq-9': 'phq9-1.0',
            'beck_depression': 'bdi-13-1.0',
            'bdi': 'bdi-13-1.0',
            'bdi-13': 'bdi-13-1.0',
            'geriatric_depression': 'gds-15-1.0',
            'gds': 'gds-15-1.0',
            'gds-15': 'gds-15-1.0',
            'gds-30': 'gds-30-1.0',
            
            # Anxiety scales
            'gadi': 'gadi-1.0',
            'gad': 'gadi-1.0',
            'generalized_anxiety': 'gadi-1.0',
            
            # Other scales
            'mos_sleep': 'mos-sleep-1.0',
            'suicide_scale': 'sss-v-1.0',
            'ybocs': 'ybocs-1.0',
            'yale_brown': 'ybocs-1.0'
        }
        
        # Create mapping based on available scales
        for scale in available_scales:
            scale_id = scale['id']
            template_id = scale['template_id']
            abbreviation = scale['abbreviation'].lower()
            name_parts = scale['name'].lower().split()
            
            # Add direct mappings
            mapping[scale_id] = template_id
            mapping[abbreviation] = template_id
            
            # Add common mapping if exists
            for old_name, new_template in common_mappings.items():
                if new_template == template_id:
                    mapping[old_name] = template_id
        
        return mapping
    
    def map_assessment_to_template(self, assessment, scale_mapping):
        """
        Map an individual assessment to a new template ID
        """
        # Try to find mapping based on existing data
        possible_keys = []
        
        # Try metadata first
        if assessment.metadata:
            if 'scale_id' in assessment.metadata:
                possible_keys.append(assessment.metadata['scale_id'].lower())
            if 'scale_name' in assessment.metadata:
                possible_keys.append(assessment.metadata['scale_name'].lower())
            if 'abbreviation' in assessment.metadata:
                possible_keys.append(assessment.metadata['abbreviation'].lower())
        
        # Try notes or other text fields for scale indicators
        text_fields = [assessment.notes, assessment.clinical_notes, assessment.observations]
        for field in text_fields:
            if field:
                field_lower = field.lower()
                for scale_key in scale_mapping.keys():
                    if scale_key in field_lower:
                        possible_keys.append(scale_key)
        
        # Find best match
        for key in possible_keys:
            if key in scale_mapping:
                return scale_mapping[key]
        
        # Default fallback - try to guess from response patterns
        if assessment.responses:
            num_responses = len(assessment.responses)
            
            # PHQ-9 has 9 items
            if num_responses == 9:
                return scale_mapping.get('phq9', None)
            # GADI has 7 items
            elif num_responses == 7:
                return scale_mapping.get('gadi', None)
            # BDI-13 has 13 items
            elif num_responses == 13:
                return scale_mapping.get('bdi-13', None)
        
        return None
    
    def show_migration_preview(self, assessments, scale_mapping):
        """
        Show preview of what would be migrated
        """
        self.stdout.write('')
        self.stdout.write('Migration Preview:')
        self.stdout.write('=' * 50)
        
        # Count by potential template mapping
        template_counts = {}
        unmappable = 0
        
        for assessment in assessments[:100]:  # Sample first 100
            template_id = self.map_assessment_to_template(assessment, scale_mapping)
            if template_id:
                if template_id not in template_counts:
                    template_counts[template_id] = 0
                template_counts[template_id] += 1
            else:
                unmappable += 1
        
        for template_id, count in template_counts.items():
            self.stdout.write(f'  {template_id}: {count} assessments')
        
        if unmappable > 0:
            self.stdout.write(f'  Unmappable: {unmappable} assessments')
        
        self.stdout.write('')
        self.stdout.write('Available ScalesV3 templates:')
        scales = template_loader.get_available_scales()
        for scale in scales:
            self.stdout.write(f'  - {scale["abbreviation"]}: {scale["name"]} ({scale["id"]})')