"""
Django management command para cargar los items de las escalas desde archivos JSON
a la tabla scale_items
"""

import os
import json
import uuid
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection, transaction
from datetime import datetime


class Command(BaseCommand):
    help = 'Load scale items from JSON files into scale_items table'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--scale',
            type=str,
            help='Load only a specific scale (e.g., PHQ-9)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing items before loading',
        )

    def handle(self, *args, **options):
        scales_dir = os.path.join(settings.BASE_DIR, 'scales')
        
        if not os.path.exists(scales_dir):
            self.stdout.write(
                self.style.ERROR(f'Scales directory not found: {scales_dir}')
            )
            return

        # Clear existing items if requested
        if options.get('clear', False) and not options.get('dry_run', False):
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM scale_items")
                self.stdout.write(self.style.WARNING('Cleared all existing scale items'))

        # Get all JSON files excluding metadata files
        json_files = [
            f for f in os.listdir(scales_dir) 
            if f.endswith('.json') and f not in ['metadata-index.json', 'FORMATO-JSON-CLINIMETRIX-PRO.json']
        ]

        # Filter by specific scale if requested
        if options['scale']:
            scale_abbr = options['scale'].lower().replace('-', '').replace('_', '')
            json_files = [f for f in json_files if scale_abbr in f.lower().replace('-', '').replace('_', '')]
            if not json_files:
                self.stdout.write(
                    self.style.ERROR(f'No JSON file found for scale: {options["scale"]}')
                )
                return

        self.stdout.write(f'Found {len(json_files)} JSON files to process')

        total_items_loaded = 0
        scales_processed = 0
        errors = 0

        for json_file in json_files:
            try:
                json_path = os.path.join(scales_dir, json_file)
                
                # Load JSON data
                with open(json_path, 'r', encoding='utf-8') as f:
                    scale_data = json.load(f)

                # Extract metadata and structure
                metadata = scale_data.get('metadata', {})
                structure = scale_data.get('structure', {})
                response_groups = scale_data.get('responseGroups', {})
                
                abbreviation = metadata.get('abbreviation', '')
                scale_name = metadata.get('name', abbreviation)
                
                if not abbreviation:
                    self.stdout.write(
                        self.style.WARNING(f'Skipping {json_file}: No abbreviation found')
                    )
                    continue

                # Look up the scale_id from psychometric_scales table
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT id FROM psychometric_scales WHERE abbreviation = %s",
                        [abbreviation]
                    )
                    result = cursor.fetchone()
                    
                    if not result:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Scale {abbreviation} not found in psychometric_scales table. Skipping.'
                            )
                        )
                        continue
                    
                    scale_uuid = str(result[0])
                
                self.stdout.write(f'\nProcessing: {abbreviation} - {scale_name} (ID: {scale_uuid})')

                # Process sections and items
                sections = structure.get('sections', [])
                items_loaded = 0
                
                for section in sections:
                    section_items = section.get('items', [])
                    
                    for item in section_items:
                        item_number = item.get('number', 0)
                        item_text = item.get('text', '').replace("'", "''")  # Escape SQL
                        item_id = item.get('id', f'item-{item_number}')
                        response_type = item.get('responseType', 'likert')
                        response_group_id = item.get('responseGroup', '')
                        is_reverse_scored = item.get('reversed', False)
                        subscale = item.get('subscale', '')
                        
                        # Get response options from responseGroups
                        options = {}
                        scoring_weights = {}
                        
                        if response_group_id and response_group_id in response_groups:
                            response_group = response_groups[response_group_id]
                            
                            # Handle both formats: array directly or object with 'items'
                            if isinstance(response_group, list):
                                response_items = response_group
                            elif isinstance(response_group, dict):
                                response_items = response_group.get('items', [])
                            else:
                                response_items = []
                            
                            for resp_item in response_items:
                                value = resp_item.get('value', 0)
                                label = resp_item.get('label', '')
                                score = resp_item.get('score', value)
                                
                                options[str(value)] = label
                                scoring_weights[str(value)] = score
                        
                        # Generate UUID for item
                        item_uuid = str(uuid.uuid4())
                        
                        if options.get('dry_run', False):
                            self.stdout.write(
                                f'  WOULD INSERT Item {item_number}: {item_text[:50]}...'
                            )
                        else:
                            # Insert item into database
                            with connection.cursor() as cursor:
                                sql = """
                                INSERT INTO scale_items (
                                    id, scale_id, item_number, item_text, 
                                    item_type, options, scoring_weights, 
                                    is_reverse_scored, subscale, created_at,
                                    clinic_id, workspace_id
                                ) VALUES (
                                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                                )
                                ON CONFLICT (id) DO UPDATE SET
                                    item_text = EXCLUDED.item_text,
                                    options = EXCLUDED.options,
                                    scoring_weights = EXCLUDED.scoring_weights;
                                """
                                
                                # Use the existing clinic_id from the database
                                # This should be retrieved dynamically in production
                                default_clinic_id = '38633a49-10e8-4138-b44b-7b7995d887e7'
                                
                                cursor.execute(sql, [
                                    item_uuid,
                                    scale_uuid,  # Using UUID for scale_id
                                    item_number,
                                    item_text,
                                    response_type,
                                    json.dumps(options) if options else None,
                                    json.dumps(scoring_weights) if scoring_weights else None,
                                    is_reverse_scored,
                                    subscale if subscale else None,
                                    datetime.now(),
                                    default_clinic_id,  # clinic_id
                                    None  # workspace_id
                                ])
                                
                                items_loaded += 1
                
                if not options.get('dry_run', False):
                    self.stdout.write(
                        self.style.SUCCESS(f'  Loaded {items_loaded} items for {abbreviation}')
                    )
                
                total_items_loaded += items_loaded
                scales_processed += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing {json_file}: {str(e)}')
                )
                errors += 1
                # Continue with next file
                continue

        # Final summary
        if not options.get('dry_run', False):
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM scale_items")
                total_in_db = cursor.fetchone()[0]
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n' + '='*50 +
                        f'\nCompleted! ' +
                        f'\nScales processed: {scales_processed}' +
                        f'\nItems loaded: {total_items_loaded}' +
                        f'\nErrors: {errors}' +
                        f'\nTotal items in database: {total_in_db}' +
                        f'\n' + '='*50
                    )
                )
        else:
            self.stdout.write(
                f'\nDry run completed. Would process {scales_processed} scales ' +
                f'and load {total_items_loaded} items'
            )