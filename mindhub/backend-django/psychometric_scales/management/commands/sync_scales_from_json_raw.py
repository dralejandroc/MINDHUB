"""
Comando Django simplificado para sincronizar escalas desde archivos JSON
usando SQL RAW directo - evita problemas de model mismatch
"""

import os
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection


class Command(BaseCommand):
    help = 'Sync scales from JSON files using raw SQL'

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

        # Get all JSON files excluding metadata files
        json_files = [
            f for f in os.listdir(scales_dir) 
            if f.endswith('.json') and f not in ['metadata-index.json', 'FORMATO-JSON-CLINIMETRIX-PRO.json']
        ]

        self.stdout.write(f'Found {len(json_files)} JSON files to process')

        processed = 0
        created = 0
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
                if not abbreviation:
                    self.stdout.write(
                        self.style.WARNING(f'Skipping {json_file}: No abbreviation found')
                    )
                    continue

                # Prepare scale data for SQL insertion
                scale_id = abbreviation.lower().replace('-', '_').replace(' ', '_')
                name = metadata.get('name', abbreviation)
                category = metadata.get('category', 'Otros')
                subcategory = metadata.get('subcategory', '')
                description = metadata.get('description', '').replace("'", "''")  # Escape SQL
                version = metadata.get('version', '1.0')
                language = metadata.get('language', 'es')
                authors_json = json.dumps(metadata.get('authors', []))
                year = metadata.get('year', 2020)
                admin_mode = metadata.get('administrationMode', 'self')
                duration = metadata.get('estimatedDurationMinutes', 10)
                target_pop_json = json.dumps(metadata.get('targetPopulation', {}))
                total_items = structure.get('totalItems', 0)
                score_min = structure.get('scoreRange', {}).get('min', 0)
                score_max = structure.get('scoreRange', {}).get('max', 100)
                tags_array = f"ARRAY['{category}', '{subcategory}']"

                if options['dry_run']:
                    self.stdout.write(f'WOULD INSERT: {abbreviation} - {name}')
                else:
                    # Use raw SQL to insert/update
                    with connection.cursor() as cursor:
                        sql = f"""
                        INSERT INTO clinimetrix_registry (
                            id, abbreviation, name, category, subcategory, description, 
                            version, language, authors, year, administration_mode, 
                            estimated_duration_minutes, target_population, total_items, 
                            score_range_min, score_range_max, is_active, is_public, 
                            tags, created_at, updated_at
                        ) VALUES (
                            '{scale_id}',
                            '{abbreviation}',
                            '{name}',
                            '{category}',
                            '{subcategory}',
                            '{description}',
                            '{version}',
                            '{language}',
                            '{authors_json}'::jsonb,
                            {year},
                            '{admin_mode}',
                            {duration},
                            '{target_pop_json}'::jsonb,
                            {total_items},
                            {score_min},
                            {score_max},
                            true,
                            true,
                            {tags_array}::text[],
                            NOW(),
                            NOW()
                        )
                        ON CONFLICT (id) DO UPDATE SET
                            name = EXCLUDED.name,
                            category = EXCLUDED.category,
                            description = EXCLUDED.description,
                            total_items = EXCLUDED.total_items,
                            updated_at = NOW();
                        """
                        
                        cursor.execute(sql)
                        
                        self.stdout.write(
                            self.style.SUCCESS(f'Inserted/Updated: {abbreviation} - {name}')
                        )
                        created += 1

                processed += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing {json_file}: {str(e)}')
                )
                errors += 1

        if not options['dry_run']:
            # Verify results
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM clinimetrix_registry")
                total_scales = cursor.fetchone()[0]
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\nCompleted! Processed: {processed}, Created/Updated: {created}, Errors: {errors}'
                    )
                )
                self.stdout.write(f'Total scales in registry: {total_scales}')
        else:
            self.stdout.write(f'\nDry run completed. Would process {processed} files')