"""
Management command to initialize default healthcare indicators
Usage: python manage.py initialize_indicators
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from analytics.models import IndicatorDefinition


class Command(BaseCommand):
    help = 'Initialize default healthcare indicators for MindHub Analytics'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force recreation of indicators even if they exist'
        )
    
    def handle(self, *args, **options):
        force = options.get('force', False)
        
        if force:
            self.stdout.write(
                self.style.WARNING('Force mode enabled - recreating all indicators')
            )
        
        indicators_data = [
            {
                'name': 'Crecimiento de Pacientes',
                'objective': 'Medir la cantidad de nuevos pacientes registrados en el período para evaluar el crecimiento de la práctica clínica',
                'formula': 'COUNT(Pacientes WHERE fecha_registro BETWEEN periodo_inicio AND periodo_fin)',
                'data_source': 'expedix.Patient',
                'frequency': 'monthly',
                'target_value': 10,
                'indicator_type': 'volume',
                'category': 'Crecimiento',
                'applies_to': 'both'
            },
            {
                'name': 'Cumplimiento de Protocolos Clínicos',
                'objective': 'Evaluar la coherencia entre diagnósticos y tratamientos según guías clínicas establecidas (DSM-5/ICD-10)',
                'formula': 'PORCENTAJE(Consultas WHERE protocolo_cumplido = true) / TOTAL(Consultas)',
                'data_source': 'expedix.Consultation + analytics.ClinicalProtocolEvaluation',
                'frequency': 'weekly',
                'target_value': 85,
                'indicator_type': 'performance',
                'category': 'Calidad',
                'applies_to': 'both'
            },
            {
                'name': 'Tasa de Abandono Terapéutico',
                'objective': 'Identificar pacientes que han abandonado el tratamiento basado en márgenes adaptativos de tolerancia por tipo de cita',
                'formula': 'PORCENTAJE(Pacientes WHERE días_sin_cita > tolerancia_abandono AND estado != alta)',
                'data_source': 'agenda.Appointment + expedix.Patient',
                'frequency': 'weekly',
                'target_value': 15,  # Meta: menos del 15% de abandono
                'indicator_type': 'result',
                'category': 'Calidad',
                'applies_to': 'both'
            },
            {
                'name': 'Cumplimiento de Notas Clínicas',
                'objective': 'Verificar la completitud de notas clínicas incluyendo diagnóstico, plan de tratamiento y seguimiento dentro de 5 días',
                'formula': 'PORCENTAJE(Consultas WHERE completitud_nota >= umbral_minimo AND próxima_cita <= 5_días)',
                'data_source': 'expedix.Consultation',
                'frequency': 'weekly',
                'target_value': 90,
                'indicator_type': 'process',
                'category': 'Calidad',
                'applies_to': 'both'
            },
            {
                'name': 'Satisfacción del Paciente',
                'objective': 'Medir la satisfacción promedio de los pacientes a través de encuestas de retroalimentación',
                'formula': 'PROMEDIO(puntuación_satisfacción) WHERE fecha BETWEEN periodo_inicio AND periodo_fin',
                'data_source': 'analytics.SatisfactionSurvey',
                'frequency': 'monthly',
                'target_value': 8,  # Meta: promedio de 8/10
                'indicator_type': 'result',
                'category': 'Satisfacción',
                'applies_to': 'both'
            },
            {
                'name': 'Eficiencia en Consultas',
                'objective': 'Evaluar la optimización del tiempo de consulta y la productividad del profesional',
                'formula': 'PROMEDIO(duración_consulta) / PROMEDIO(tiempo_programado) * 100',
                'data_source': 'agenda.Appointment + expedix.Consultation',
                'frequency': 'weekly',
                'target_value': 85,  # Meta: 85% de eficiencia
                'indicator_type': 'performance',
                'category': 'Eficiencia',
                'applies_to': 'both'
            },
            {
                'name': 'Resurtidos Sin Consulta',
                'objective': 'Monitorear la cantidad de resurtidos de medicamentos realizados sin consulta presencial',
                'formula': 'COUNT(Resurtidos WHERE tipo_resurtido != presencial) / TOTAL(Resurtidos) * 100',
                'data_source': 'analytics.PrescriptionRefill',
                'frequency': 'monthly',
                'target_value': 30,  # Meta: 30% o menos de resurtidos remotos
                'indicator_type': 'management',
                'category': 'Gestión',
                'applies_to': 'both'
            }
        ]
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        with transaction.atomic():
            for indicator_data in indicators_data:
                try:
                    indicator, created = IndicatorDefinition.objects.get_or_create(
                        name=indicator_data['name'],
                        defaults=indicator_data
                    )
                    
                    if created:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"✓ Creado: {indicator.name}")
                        )
                    elif force:
                        # Update existing indicator
                        for key, value in indicator_data.items():
                            setattr(indicator, key, value)
                        indicator.save()
                        updated_count += 1
                        self.stdout.write(
                            self.style.WARNING(f"⟲ Actualizado: {indicator.name}")
                        )
                    else:
                        skipped_count += 1
                        self.stdout.write(
                            self.style.HTTP_INFO(f"⊝ Ya existe: {indicator.name}")
                        )
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"✗ Error creando {indicator_data['name']}: {e}")
                    )
        
        # Summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write(f"Resumen de inicialización:")
        self.stdout.write(f"  • Indicadores creados: {created_count}")
        if force:
            self.stdout.write(f"  • Indicadores actualizados: {updated_count}")
        self.stdout.write(f"  • Indicadores existentes: {skipped_count}")
        self.stdout.write(f"  • Total procesados: {len(indicators_data)}")
        
        if created_count > 0 or (force and updated_count > 0):
            self.stdout.write(
                self.style.SUCCESS(f"\n🎉 Inicialización completada exitosamente!")
            )
            self.stdout.write(
                "Los indicadores están listos para ser utilizados en el sistema de analytics."
            )
        else:
            self.stdout.write(
                self.style.HTTP_INFO(f"\nℹ️  Todos los indicadores ya existen. Use --force para actualizarlos.")
            )