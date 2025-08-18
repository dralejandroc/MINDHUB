from django.core.management.base import BaseCommand
from django.utils.text import slugify
from psychometric_scales.models import ScaleTag


class Command(BaseCommand):
    help = 'Crear tags del sistema para las escalas psicométricas'

    def handle(self, *args, **options):
        # Tags de diagnóstico
        diagnostic_tags = [
            {'name': 'Depresión', 'color': '#3B82F6'},
            {'name': 'Ansiedad', 'color': '#EF4444'},
            {'name': 'TEA', 'color': '#8B5CF6'},
            {'name': 'TDAH', 'color': '#F59E0B'},
            {'name': 'Bipolar', 'color': '#10B981'},
            {'name': 'Esquizofrenia', 'color': '#6366F1'},
            {'name': 'Trastornos Alimentarios', 'color': '#EC4899'},
            {'name': 'TOC', 'color': '#14B8A6'},
            {'name': 'TEPT', 'color': '#F97316'},
            {'name': 'Demencia', 'color': '#84CC16'},
        ]

        # Tags de población
        population_tags = [
            {'name': 'Adultos', 'color': '#1F2937'},
            {'name': 'Adolescentes', 'color': '#059669'},
            {'name': 'Niños', 'color': '#DC2626'},
            {'name': 'Adultos Mayores', 'color': '#7C3AED'},
            {'name': 'Todas las Edades', 'color': '#6B7280'},
        ]

        # Tags de dominio
        domain_tags = [
            {'name': 'Screening', 'color': '#0891B2'},
            {'name': 'Diagnóstico', 'color': '#BE185D'},
            {'name': 'Evaluación Cognitiva', 'color': '#7C2D12'},
            {'name': 'Estado de Ánimo', 'color': '#1E40AF'},
            {'name': 'Personalidad', 'color': '#92400E'},
            {'name': 'Funcionamiento', 'color': '#065F46'},
            {'name': 'Calidad de Vida', 'color': '#7C3AED'},
        ]

        # Tags de especialidad
        specialty_tags = [
            {'name': 'Psiquiatría', 'color': '#1F2937'},
            {'name': 'Psicología Clínica', 'color': '#991B1B'},
            {'name': 'Neuropsicología', 'color': '#92400E'},
            {'name': 'Geriatría', 'color': '#059669'},
            {'name': 'Pediatría', 'color': '#DC2626'},
            {'name': 'Atención Primaria', 'color': '#0891B2'},
        ]

        tag_groups = [
            (diagnostic_tags, ScaleTag.TagType.DIAGNOSTIC),
            (population_tags, ScaleTag.TagType.POPULATION),
            (domain_tags, ScaleTag.TagType.DOMAIN),
            (specialty_tags, ScaleTag.TagType.SPECIALTY),
        ]

        created_count = 0
        for tag_list, tag_type in tag_groups:
            for tag_data in tag_list:
                slug = slugify(tag_data['name'])
                tag, created = ScaleTag.objects.get_or_create(
                    slug=slug,
                    defaults={
                        'name': tag_data['name'],
                        'tag_type': tag_type,
                        'color': tag_data['color'],
                        'is_system': True,
                    }
                )
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Creado tag: {tag.name} ({tag.get_tag_type_display()})')
                    )

        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Se crearon {created_count} tags del sistema.')
        )