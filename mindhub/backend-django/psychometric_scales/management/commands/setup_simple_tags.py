from django.core.management.base import BaseCommand
from django.utils.text import slugify
from psychometric_scales.models import ScaleTag, PsychometricScale


class Command(BaseCommand):
    help = 'Configurar tags simples para las escalas psicométricas'

    def handle(self, *args, **options):
        # Limpiar tags existentes
        ScaleTag.objects.all().delete()
        self.stdout.write('🧹 Tags existentes eliminadas')
        
        # Tags simples y específicas
        simple_tags = [
            {'name': 'Ansiedad', 'color': '#EF4444'},
            {'name': 'Depre', 'color': '#3B82F6'},
            {'name': 'Personalidad', 'color': '#8B5CF6'},
            {'name': 'Pánico', 'color': '#F59E0B'},
            {'name': 'Niño', 'color': '#10B981'},
            {'name': 'Adolescente', 'color': '#06B6D4'},
            {'name': 'Adulto', 'color': '#6B7280'},
            {'name': 'AdultoMayor', 'color': '#7C3AED'},
            {'name': 'TEA', 'color': '#EC4899'},
            {'name': 'TOC', 'color': '#14B8A6'},
            {'name': 'TDAH', 'color': '#F97316'},
            {'name': 'Bipolar', 'color': '#84CC16'},
            {'name': 'Psicosis', 'color': '#DC2626'},
            {'name': 'Screening', 'color': '#0891B2'},
            {'name': 'Cognitivo', 'color': '#92400E'},
            {'name': 'Sueño', 'color': '#5B21B6'},
            {'name': 'Alimentario', 'color': '#BE185D'},
            {'name': 'Trauma', 'color': '#B91C1C'},
        ]

        created_count = 0
        for tag_data in simple_tags:
            slug = slugify(tag_data['name'].lower())
            tag, created = ScaleTag.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': tag_data['name'],
                    'tag_type': ScaleTag.TagType.CUSTOM,
                    'color': tag_data['color'],
                    'is_system': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Creado tag: {tag.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Se crearon {created_count} tags simples.')
        )
        
        # Asignar tags a escalas automáticamente basándose en sus nombres y categorías
        self.assign_tags_to_scales()

    def assign_tags_to_scales(self):
        """Asignar tags automáticamente a escalas existentes"""
        self.stdout.write('\n📋 Asignando tags a escalas existentes...')
        
        # Obtener tags
        tags = {tag.slug: tag for tag in ScaleTag.objects.all()}
        
        # Mapeo de escalas a tags
        scale_mappings = {
            # Escalas de depresión
            'PHQ-9': ['depre', 'adulto', 'screening'],
            'BDI-21': ['depre', 'adulto'],
            'BDI-13': ['depre', 'adulto'],
            'MADRS': ['depre', 'adulto'],
            'HDRS-17': ['depre', 'adulto'],
            'GDS-15': ['depre', 'adultoomayor'],
            'GDS-30': ['depre', 'adultoomayor'],
            'GDS-5': ['depre', 'adultoomayor'],
            'RADS2': ['depre', 'adolescente'],
            
            # Escalas de ansiedad
            'HARS': ['ansiedad', 'adulto'],
            'STAI': ['ansiedad', 'adulto'],
            
            # Escalas de TEA
            'AQ-Adolescent': ['tea', 'adolescente', 'screening'],
            'AQ-Child': ['tea', 'nino', 'screening'],
            
            # Escalas de TOC
            'Y-BOCS': ['toc', 'adulto'],
            'DY-BOCS': ['toc', 'nino', 'adolescente'],
            
            # Escalas de TDAH/Tics
            'YGTSS': ['tdah', 'nino', 'adolescente'],
            
            # Escalas cognitivas
            'MoCA': ['cognitivo', 'adulto', 'adultoomayor', 'screening'],
            
            # Escalas de pánico/trauma
            'DTS': ['trauma', 'adulto'],
            
            # Escalas de alimentación
            'EAT-26': ['alimentario', 'adolescente', 'adulto'],
            
            # Escalas de sueño
            'MOS Sleep': ['sueño', 'adulto'],
            
            # Escalas de personalidad/psicosis
            'PANSS': ['psicosis', 'adulto'],
            'IPDE-CIE10': ['personalidad', 'adulto'],
            'IPDE-DSMIV': ['personalidad', 'adulto'],
            
            # Escalas generales/funcionamiento
            'ESADFUN': ['adulto', 'screening'],
            'GADI': ['ansiedad', 'adulto'],
            'EMUN-AR': ['adulto'],
            'SSS-V': ['adulto'],
            'Cuestionario-Salamanca': ['adulto'],
        }
        
        assigned_count = 0
        for scale_abbrev, tag_slugs in scale_mappings.items():
            try:
                # Buscar escala por abreviación (más flexible)
                scale = None
                for s in PsychometricScale.objects.all():
                    if scale_abbrev.lower() in s.abbreviation.lower():
                        scale = s
                        break
                
                if not scale:
                    self.stdout.write(f'⚠️  Escala no encontrada: {scale_abbrev}')
                    continue
                
                # Asignar tags existentes
                scale_tags = []
                for tag_slug in tag_slugs:
                    if tag_slug in tags:
                        scale_tags.append(tags[tag_slug])
                
                if scale_tags:
                    scale.tags.set(scale_tags)
                    assigned_count += 1
                    tag_names = [t.name for t in scale_tags]
                    self.stdout.write(f'✓ {scale.abbreviation}: {", ".join(tag_names)}')
                
            except Exception as e:
                self.stdout.write(f'❌ Error con {scale_abbrev}: {e}')
        
        self.stdout.write(
            self.style.SUCCESS(f'\n🎯 Tags asignadas a {assigned_count} escalas.')
        )