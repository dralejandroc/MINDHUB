"""
Django management command para cargar escalas con la nueva estructura separada:
- scaleid_catalog.json: información de la escala para mostrar
- scaleid_assessment.json: items, lógica de resultados, recomendaciones
"""

import os
import json
import uuid
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection, transaction
from datetime import datetime


class Command(BaseCommand):
    help = 'Load scales from separated catalog and assessment JSON files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--scale-id',
            type=str,
            help='Load only a specific scale by its ID (e.g., phq9)',
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing data for the scale before loading',
        )

    def handle(self, *args, **options):
        scales_dir = os.path.join(settings.BASE_DIR, 'scalesV3')
        
        if not os.path.exists(scales_dir):
            self.stdout.write(
                self.style.ERROR(f'Scales directory not found: {scales_dir}')
            )
            return

        # Get the clinic_id to use
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM clinic_configurations LIMIT 1")
            result = cursor.fetchone()
            if result:
                clinic_id = str(result[0])
            else:
                self.stdout.write(self.style.ERROR('No clinic configuration found'))
                return

        # Find all catalog files
        catalog_files = []
        for file in os.listdir(scales_dir):
            if file.endswith('_catalog.json'):
                scale_id = file.replace('_catalog.json', '')
                catalog_path = os.path.join(scales_dir, file)
                assessment_path = os.path.join(scales_dir, f"{scale_id}_assessment.json")
                
                if os.path.exists(assessment_path):
                    catalog_files.append((scale_id, catalog_path, assessment_path))
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Assessment file not found for {scale_id}: {assessment_path}')
                    )

        # Filter by specific scale if requested
        if options.get('scale_id'):
            target_scale_id = options['scale_id']
            catalog_files = [
                (scale_id, catalog_path, assessment_path) 
                for scale_id, catalog_path, assessment_path in catalog_files 
                if scale_id == target_scale_id
            ]
            
            if not catalog_files:
                self.stdout.write(
                    self.style.ERROR(f'Scale {target_scale_id} not found or missing files')
                )
                return

        self.stdout.write(f'Found {len(catalog_files)} complete scale pairs to process')

        scales_registered = 0
        items_loaded = 0
        errors = 0

        for scale_id, catalog_path, assessment_path in catalog_files:
            try:
                self.stdout.write(f'\n{"="*60}')
                self.stdout.write(f'Processing scale: {scale_id}')
                self.stdout.write(f'  Catalog: {os.path.basename(catalog_path)}')
                self.stdout.write(f'  Assessment: {os.path.basename(assessment_path)}')
                
                # Load catalog data
                with open(catalog_path, 'r', encoding='utf-8') as f:
                    catalog_data = json.load(f)
                
                # Load assessment data
                with open(assessment_path, 'r', encoding='utf-8') as f:
                    assessment_data = json.load(f)

                # Extract catalog information - try both 'catalog' and 'metadata' structure
                catalog_info = catalog_data.get('catalog', catalog_data.get('metadata', {}))
                abbreviation = catalog_info.get('abbreviation', '')
                scale_name = catalog_info.get('name', abbreviation)
                
                if not abbreviation:
                    self.stdout.write(
                        self.style.WARNING(f'Skipping {scale_id}: No abbreviation in catalog')
                    )
                    continue

                # Extract assessment information
                metadata = assessment_data.get('metadata', {})
                structure = assessment_data.get('structure', {})
                
                # Prepare scale data
                category = catalog_info.get('category', 'General')
                description = catalog_info.get('description', '').replace("'", "''")
                version = catalog_info.get('version', '1.0')
                total_items = structure.get('totalItems', 0)
                
                # Parse duration
                duration_raw = catalog_info.get('estimatedDurationMinutes', 10)
                if isinstance(duration_raw, str):
                    if '-' in duration_raw:
                        duration = int(duration_raw.split('-')[0])
                    else:
                        try:
                            duration = int(duration_raw)
                        except ValueError:
                            duration = 10
                else:
                    duration = int(duration_raw) if duration_raw else 10

                if options.get('dry_run', False):
                    self.stdout.write(f'WOULD REGISTER: {abbreviation} - {scale_name}')
                    self.stdout.write(f'  Items to load: {total_items}')
                    continue

                # Clear existing data if requested
                if options.get('clear_existing', False):
                    with connection.cursor() as cursor:
                        cursor.execute("DELETE FROM scale_items WHERE scale_id IN (SELECT id FROM psychometric_scales WHERE abbreviation = %s)", [abbreviation])
                        cursor.execute("DELETE FROM psychometric_scales WHERE abbreviation = %s", [abbreviation])
                        self.stdout.write(self.style.WARNING(f'Cleared existing data for {abbreviation}'))

                # Register or update scale in psychometric_scales
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT id FROM psychometric_scales WHERE abbreviation = %s",
                        [abbreviation]
                    )
                    existing = cursor.fetchone()
                    
                    if existing:
                        # Update existing scale
                        scale_uuid = str(existing[0])
                        sql = """
                        UPDATE psychometric_scales 
                        SET scale_name = %s,
                            category = %s,
                            description = %s,
                            version = %s,
                            total_items = %s,
                            estimated_duration_minutes = %s,
                            updated_at = %s
                        WHERE abbreviation = %s
                        """
                        
                        cursor.execute(sql, [
                            scale_name,
                            category,
                            description,
                            version,
                            total_items,
                            duration,
                            datetime.now(),
                            abbreviation
                        ])
                        
                        self.stdout.write(
                            self.style.SUCCESS(f'Updated scale: {abbreviation} (ID: {scale_uuid})')
                        )
                    else:
                        # Insert new scale
                        scale_uuid = str(uuid.uuid4())
                        
                        sql = """
                        INSERT INTO psychometric_scales (
                            id, clinic_id, scale_name, abbreviation, version,
                            category, description, total_items, 
                            estimated_duration_minutes, is_active,
                            created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                        """
                        
                        cursor.execute(sql, [
                            scale_uuid,
                            clinic_id,
                            scale_name,
                            abbreviation,
                            version,
                            category,
                            description,
                            total_items,
                            duration,
                            True,  # is_active
                            datetime.now(),
                            datetime.now()
                        ])
                        
                        self.stdout.write(
                            self.style.SUCCESS(f'Registered scale: {abbreviation} (ID: {scale_uuid})')
                        )
                    
                    scales_registered += 1

                # Clear existing items for this scale before loading new ones
                with connection.cursor() as cursor:
                    cursor.execute("DELETE FROM scale_items WHERE scale_id = %s", [scale_uuid])
                    self.stdout.write(f'    Cleared existing items for {abbreviation}')

                # Load scale items from assessment data
                sections = structure.get('sections', [])
                response_groups = assessment_data.get('responseGroups', {})
                items_for_this_scale = 0
                
                for section in sections:
                    section_items = section.get('items', [])
                    
                    for item in section_items:
                        item_number = item.get('number', 0)
                        item_text = item.get('text', '').replace("'", "''")
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
                            
                            cursor.execute(sql, [
                                item_uuid,
                                scale_uuid,
                                item_number,
                                item_text,
                                response_type,
                                json.dumps(options) if options else None,
                                json.dumps(scoring_weights) if scoring_weights else None,
                                is_reverse_scored,
                                subscale if subscale else None,
                                datetime.now(),
                                clinic_id,
                                None  # workspace_id
                            ])
                            
                            items_for_this_scale += 1
                
                self.stdout.write(
                    self.style.SUCCESS(f'  Loaded {items_for_this_scale} items for {abbreviation}')
                )
                items_loaded += items_for_this_scale

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing {scale_id}: {str(e)}')
                )
                errors += 1
                continue

        # Final summary
        if not options.get('dry_run', False):
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM psychometric_scales")
                total_scales = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM scale_items")
                total_items = cursor.fetchone()[0]
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n' + '='*60 +
                        f'\nCOMPLETED!' +
                        f'\nScales processed: {scales_registered}' +
                        f'\nItems loaded: {items_loaded}' +
                        f'\nErrors: {errors}' +
                        f'\nTotal scales in database: {total_scales}' +
                        f'\nTotal items in database: {total_items}' +
                        f'\n' + '='*60
                    )
                )
        else:
            self.stdout.write(
                f'\nDry run completed. Would process {len(catalog_files)} scale pairs'
            )