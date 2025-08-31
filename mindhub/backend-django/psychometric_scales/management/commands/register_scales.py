"""
Django management command to register all scales from JSON files
into the psychometric_scales table
"""

import os
import json
import uuid
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
from datetime import datetime


class Command(BaseCommand):
    help = 'Register all scales from JSON files into psychometric_scales table'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        scales_dir = os.path.join(settings.BASE_DIR, 'scales')
        
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

        # Get all JSON files excluding metadata files
        json_files = [
            f for f in os.listdir(scales_dir) 
            if f.endswith('.json') and f not in ['metadata-index.json', 'FORMATO-JSON-CLINIMETRIX-PRO.json']
        ]

        self.stdout.write(f'Found {len(json_files)} JSON files to process')

        registered = 0
        updated = 0
        errors = 0

        for json_file in json_files:
            try:
                json_path = os.path.join(scales_dir, json_file)
                
                # Load JSON data
                with open(json_path, 'r', encoding='utf-8') as f:
                    scale_data = json.load(f)

                # Extract metadata
                metadata = scale_data.get('metadata', {})
                structure = scale_data.get('structure', {})
                
                abbreviation = metadata.get('abbreviation', '')
                scale_name = metadata.get('name', abbreviation)
                
                if not abbreviation:
                    self.stdout.write(
                        self.style.WARNING(f'Skipping {json_file}: No abbreviation found')
                    )
                    continue

                # Prepare data for insertion
                category = metadata.get('category', 'General')
                description = metadata.get('description', '').replace("'", "''")
                version = metadata.get('version', '1.0')
                total_items = structure.get('totalItems', 0)
                
                # Parse duration - handle ranges like "5-8" or "15-20"
                duration_raw = metadata.get('estimatedDurationMinutes', 10)
                if isinstance(duration_raw, str):
                    # Extract first number from range
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
                else:
                    # Check if scale already exists
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "SELECT id FROM psychometric_scales WHERE abbreviation = %s",
                            [abbreviation]
                        )
                        existing = cursor.fetchone()
                        
                        if existing:
                            # Update existing scale
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
                                self.style.SUCCESS(f'Updated: {abbreviation} - {scale_name}')
                            )
                            updated += 1
                        else:
                            # Insert new scale
                            scale_id = str(uuid.uuid4())
                            
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
                                scale_id,
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
                                self.style.SUCCESS(f'Registered: {abbreviation} - {scale_name} (ID: {scale_id})')
                            )
                            registered += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing {json_file}: {str(e)}')
                )
                errors += 1

        # Final summary
        if not options.get('dry_run', False):
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM psychometric_scales")
                total_scales = cursor.fetchone()[0]
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n' + '='*50 +
                        f'\nCompleted!' +
                        f'\nRegistered: {registered}' +
                        f'\nUpdated: {updated}' +
                        f'\nErrors: {errors}' +
                        f'\nTotal scales in database: {total_scales}' +
                        f'\n' + '='*50
                    )
                )
        else:
            self.stdout.write(
                f'\nDry run completed. Would register/update {registered + updated} scales'
            )