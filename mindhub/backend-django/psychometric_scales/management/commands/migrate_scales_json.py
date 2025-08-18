#!/usr/bin/env python3
"""
Django Management Command: Migrate JSON scales to database
Migra las escalas del directorio scales/ a la base de datos Django
"""

import os
import json
import logging
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from psychometric_scales.models import PsychometricScale, ScaleCategory, ScaleTag

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Migra escalas JSON del directorio scales/ a la base de datos Django'

    def add_arguments(self, parser):
        parser.add_argument(
            '--scales-dir',
            type=str,
            default='scales',
            help='Directorio con archivos JSON de escalas (default: scales/)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Sobrescribir escalas existentes'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué haría sin ejecutar cambios'
        )
        parser.add_argument(
            '--exclude',
            nargs='*',
            default=['FORMATO-JSON-CLINIMETRIX-PRO.json', 'metadata-index.json'],
            help='Archivos a excluir (default: formato y metadata)'
        )

    def handle(self, *args, **options):
        scales_dir = Path(options['scales_dir'])
        force = options['force']
        dry_run = options['dry_run']
        exclude_files = options['exclude']

        if not scales_dir.exists():
            raise CommandError(f'El directorio {scales_dir} no existe')

        self.stdout.write(f'🔍 Escaneando directorio: {scales_dir.absolute()}')

        # Encontrar archivos JSON
        json_files = list(scales_dir.glob('*.json'))
        json_files = [f for f in json_files if f.name not in exclude_files]

        if not json_files:
            self.stdout.write(self.style.WARNING('⚠️  No se encontraron archivos JSON válidos'))
            return

        self.stdout.write(f'📋 Encontrados {len(json_files)} archivos para procesar')

        # Estadísticas
        stats = {
            'processed': 0,
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'errors': 0
        }

        # Procesar cada archivo en su propia transacción para evitar rollback en cascada
        for json_file in json_files:
            try:
                with transaction.atomic():
                    result = self.process_scale_file(json_file, force, dry_run)
                    stats[result] += 1
                    stats['processed'] += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error procesando {json_file.name}: {str(e)}')
                )
                stats['errors'] += 1
                logger.exception(f'Error processing {json_file}')

        # Mostrar resultados
        self.display_results(stats, dry_run)

    def process_scale_file(self, json_file, force, dry_run):
        """Procesa un archivo JSON individual"""
        self.stdout.write(f'📄 Procesando: {json_file.name}')

        # Leer y validar JSON
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                scale_data = json.load(f)
        except json.JSONDecodeError as e:
            raise CommandError(f'JSON inválido en {json_file.name}: {str(e)}')

        # Validar estructura requerida
        if not self.validate_json_structure(scale_data):
            raise CommandError(f'Estructura JSON inválida en {json_file.name}')

        metadata = scale_data['metadata']
        abbreviation = metadata.get('abbreviation', '').upper()

        if not abbreviation:
            raise CommandError(f'Falta abbreviation en {json_file.name}')

        # Verificar si ya existe
        existing_scale = PsychometricScale.objects.filter(abbreviation=abbreviation).first()

        if existing_scale and not force:
            self.stdout.write(f'   ⏭️  Ya existe: {abbreviation} (usar --force para sobrescribir)')
            return 'skipped'

        if dry_run:
            action = 'actualizaría' if existing_scale else 'crearía'
            self.stdout.write(f'   🧪 DRY-RUN: {action} {abbreviation}')
            return 'created' if not existing_scale else 'updated'

        # Crear o actualizar la escala
        scale_obj = self.create_or_update_scale(scale_data, json_file, existing_scale)
        
        action = 'actualizada' if existing_scale else 'creada'
        self.stdout.write(f'   ✅ Escala {action}: {scale_obj.abbreviation} - {scale_obj.name}')
        
        return 'updated' if existing_scale else 'created'

    def validate_json_structure(self, data):
        """Valida que el JSON tenga la estructura requerida"""
        required_fields = ['metadata', 'structure', 'scoring', 'interpretation']
        metadata_required = ['name', 'abbreviation', 'category', 'year']
        
        for field in required_fields:
            if field not in data:
                return False
        
        for field in metadata_required:
            if field not in data['metadata']:
                return False
        
        return True

    def create_or_update_scale(self, scale_data, json_file, existing_scale=None):
        """Crea o actualiza una escala en la base de datos"""
        metadata = scale_data['metadata']
        structure = scale_data['structure']
        
        # Obtener o crear categoría
        category_name = metadata.get('category', 'General')
        category, _ = ScaleCategory.objects.get_or_create(
            name=category_name,
            defaults={
                'description': f'Categoría para escalas de {category_name}',
                'color': self.get_category_color(category_name)
            }
        )

        # Mapear datos del JSON al modelo Django
        scale_data_mapped = {
            'name': metadata['name'],
            'abbreviation': metadata['abbreviation'].upper(),
            'category': category,
            'authors': metadata.get('authors', []),
            'year': int(metadata.get('year', 2000)),
            'description': metadata.get('description', ''),
            'indication': self.extract_indication(scale_data),
            'population': self.map_population(metadata.get('targetPopulation', {})),
            'application_type': self.map_application_type(metadata.get('administrationMode', 'auto')),
            'estimated_duration_minutes': self.parse_duration_minutes(metadata.get('estimatedDurationMinutes', 10)),
            'total_items': structure.get('totalItems', 0),
            'json_file_path': str(json_file.name),  # Solo el nombre del archivo
            'primary_reference': self.extract_primary_reference(scale_data),
            'additional_references': self.extract_additional_references(scale_data),
            'is_active': True,
            'is_validated': True,
        }

        # Propiedades psicométricas si están disponibles
        psychometric = scale_data.get('documentation', {}).get('psychometricProperties', {})
        if psychometric:
            scale_data_mapped.update(self.extract_psychometric_properties(psychometric))

        if existing_scale:
            # Actualizar escala existente
            for key, value in scale_data_mapped.items():
                setattr(existing_scale, key, value)
            existing_scale.save()
            scale_obj = existing_scale
        else:
            # Crear nueva escala
            scale_obj = PsychometricScale.objects.create(**scale_data_mapped)

        # Procesar tags
        self.process_tags(scale_obj, metadata, scale_data)

        return scale_obj

    def extract_indication(self, scale_data):
        """Extrae las indicaciones clínicas de la escala"""
        help_text = scale_data.get('metadata', {}).get('helpText', {})
        if isinstance(help_text, dict) and 'professional' in help_text:
            return help_text['professional'][:500]  # Limitar longitud
        
        description = scale_data.get('metadata', {}).get('description', '')
        return description[:500] if description else 'Evaluación psicométrica'

    def map_population(self, target_population):
        """Mapea la población objetivo al modelo Django"""
        if not target_population:
            return 'adult'
        
        age_groups = target_population.get('ageGroups', [])
        if not age_groups:
            return 'adult'
        
        # Mapeo de grupos de edad
        age_mapping = {
            'adultos': 'adult',
            'adolescentes': 'adolescent', 
            'niños': 'child',
            'adultos mayores': 'elderly',
            'todas las edades': 'all'
        }
        
        for age_group in age_groups:
            mapped = age_mapping.get(age_group.lower(), 'adult')
            if mapped != 'adult':  # Si no es adulto, usar el específico
                return mapped
        
        return 'adult'

    def map_application_type(self, admin_mode):
        """Mapea el modo de administración"""
        mapping = {
            'auto': 'auto',
            'self_administered': 'auto',
            'hetero': 'hetero',
            'interviewer_administered': 'hetero',
            'both': 'both',
            'mixed': 'both'
        }
        return mapping.get(admin_mode.lower(), 'auto')

    def parse_duration_minutes(self, duration_value):
        """Parsea duración en minutos, manejando rangos como '15-20'"""
        if isinstance(duration_value, int):
            return duration_value
        
        if isinstance(duration_value, str):
            # Manejar rangos como "15-20"
            if '-' in duration_value:
                try:
                    parts = duration_value.split('-')
                    # Tomar el valor promedio del rango
                    min_val = int(parts[0].strip())
                    max_val = int(parts[1].strip())
                    return (min_val + max_val) // 2
                except (ValueError, IndexError):
                    pass
            
            # Intentar convertir directamente
            try:
                return int(duration_value)
            except ValueError:
                pass
        
        # Valor por defecto si no se puede parsear
        return 10

    def extract_psychometric_properties(self, psychometric):
        """Extrae propiedades psicométricas del JSON"""
        props = {}
        
        reliability = psychometric.get('reliability', {})
        if reliability:
            if 'cronbachAlpha' in reliability:
                try:
                    props['reliability_alpha'] = float(reliability['cronbachAlpha'])
                except (ValueError, TypeError):
                    pass
            
            if 'testRetest' in reliability:
                try:
                    props['test_retest_reliability'] = float(reliability['testRetest'])
                except (ValueError, TypeError):
                    pass

        validity = psychometric.get('validity', {})
        if validity:
            if 'sensitivity' in validity:
                try:
                    # Convertir porcentaje a decimal
                    sens = validity['sensitivity']
                    if isinstance(sens, str) and sens.endswith('%'):
                        sens = float(sens.rstrip('%')) / 100
                    props['sensitivity'] = float(sens)
                except (ValueError, TypeError):
                    pass
            
            if 'specificity' in validity:
                try:
                    # Convertir porcentaje a decimal
                    spec = validity['specificity']
                    if isinstance(spec, str) and spec.endswith('%'):
                        spec = float(spec.rstrip('%')) / 100
                    props['specificity'] = float(spec)
                except (ValueError, TypeError):
                    pass

        return props

    def extract_primary_reference(self, scale_data):
        """Extrae la referencia primaria"""
        docs = scale_data.get('documentation', {})
        bibliography = docs.get('bibliography', [])
        
        if bibliography and len(bibliography) > 0:
            return bibliography[0][:500]  # Primera referencia, limitada
        
        metadata = scale_data.get('metadata', {})
        authors = metadata.get('authors', [])
        year = metadata.get('year', '')
        name = metadata.get('name', '')
        
        if authors and year:
            author_str = ', '.join(authors[:2])  # Primeros 2 autores
            return f"{author_str} ({year}). {name}."
        
        return ''

    def extract_additional_references(self, scale_data):
        """Extrae referencias adicionales"""
        docs = scale_data.get('documentation', {})
        bibliography = docs.get('bibliography', [])
        
        if len(bibliography) > 1:
            return bibliography[1:]  # Todas excepto la primera
        
        return []

    def process_tags(self, scale_obj, metadata, scale_data):
        """Procesa y asigna tags a la escala"""
        tags_to_add = []
        
        # Tag por categoría
        category_name = metadata.get('category', '')
        if category_name:
            category_tag, _ = ScaleTag.objects.get_or_create(
                slug=f"category-{category_name.lower().replace(' ', '-')}",
                defaults={
                    'name': category_name,
                    'tag_type': ScaleTag.TagType.DIAGNOSTIC,
                    'color': self.get_category_color(category_name),
                    'is_system': True
                }
            )
            tags_to_add.append(category_tag)

        # Tag por población
        target_pop = metadata.get('targetPopulation', {})
        age_groups = target_pop.get('ageGroups', [])
        for age_group in age_groups:
            pop_tag, _ = ScaleTag.objects.get_or_create(
                slug=f"population-{age_group.lower().replace(' ', '-')}",
                defaults={
                    'name': age_group.title(),
                    'tag_type': ScaleTag.TagType.POPULATION,
                    'color': '#10B981',
                    'is_system': True
                }
            )
            tags_to_add.append(pop_tag)

        # Tag por modo de administración
        admin_mode = metadata.get('administrationMode', 'auto')
        mode_label = {
            'auto': 'Autoaplicada',
            'hetero': 'Heteroaplicada', 
            'both': 'Ambas'
        }.get(admin_mode, 'Autoaplicada')
        
        mode_tag, _ = ScaleTag.objects.get_or_create(
            slug=f"mode-{admin_mode}",
            defaults={
                'name': mode_label,
                'tag_type': ScaleTag.TagType.SPECIALTY,
                'color': '#8B5CF6',
                'is_system': True
            }
        )
        tags_to_add.append(mode_tag)

        # Asignar todos los tags
        if tags_to_add:
            scale_obj.tags.set(tags_to_add)

    def get_category_color(self, category_name):
        """Obtiene color para una categoría"""
        color_mapping = {
            'depresión': '#3B82F6',
            'ansiedad': '#F59E0B', 
            'esquizofrenia': '#8B5CF6',
            'trastornos del sueño': '#10B981',
            'cognitivo': '#EF4444',
            'personalidad': '#F97316',
            'general': '#6B7280'
        }
        
        for key, color in color_mapping.items():
            if key in category_name.lower():
                return color
        
        return '#6B7280'  # Gris por defecto

    def display_results(self, stats, dry_run):
        """Muestra los resultados de la migración"""
        self.stdout.write('\n' + '='*50)
        mode = 'SIMULACIÓN (DRY-RUN)' if dry_run else 'MIGRACIÓN COMPLETADA'
        self.stdout.write(f'📊 {mode}')
        self.stdout.write('='*50)
        
        self.stdout.write(f'📄 Archivos procesados: {stats["processed"]}')
        
        if not dry_run:
            self.stdout.write(f'✅ Escalas creadas: {stats["created"]}')
            self.stdout.write(f'🔄 Escalas actualizadas: {stats["updated"]}')
        else:
            self.stdout.write(f'🆕 Se crearían: {stats["created"]}')
            self.stdout.write(f'🔄 Se actualizarían: {stats["updated"]}')
        
        self.stdout.write(f'⏭️  Escalas omitidas: {stats["skipped"]}')
        self.stdout.write(f'❌ Errores: {stats["errors"]}')
        
        if stats['errors'] == 0:
            self.stdout.write(self.style.SUCCESS('\n🎉 Migración exitosa!'))
        else:
            self.stdout.write(self.style.WARNING(f'\n⚠️  Migración completada con {stats["errors"]} errores'))
        
        if dry_run:
            self.stdout.write(self.style.NOTICE('\n💡 Ejecuta sin --dry-run para aplicar los cambios'))