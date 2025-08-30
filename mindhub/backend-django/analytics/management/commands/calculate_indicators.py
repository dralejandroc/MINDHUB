"""
Management command to calculate healthcare indicators
Usage: python manage.py calculate_indicators [options]
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import datetime, timedelta
import uuid

from analytics.models import IndicatorDefinition, IndicatorValue
from analytics.services.calculators import (
    PatientGrowthCalculator,
    ClinicalProtocolComplianceCalculator,
    AbandonmentRateCalculator,
    ClinicalNotesComplianceCalculator,
    SatisfactionCalculator
)


class Command(BaseCommand):
    help = 'Calculate healthcare indicators for specified period'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--indicator',
            type=str,
            help='Specific indicator to calculate (leave empty for all)'
        )
        parser.add_argument(
            '--clinic-id',
            type=str,
            help='Clinic ID to calculate for'
        )
        parser.add_argument(
            '--workspace-id',
            type=str,
            help='Workspace ID to calculate for'
        )
        parser.add_argument(
            '--period-start',
            type=str,
            help='Period start date (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--period-end',
            type=str,
            help='Period end date (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force recalculation even if value exists'
        )
    
    def handle(self, *args, **options):
        # Parse arguments
        indicator_name = options.get('indicator')
        clinic_id = self._parse_uuid(options.get('clinic_id'))
        workspace_id = self._parse_uuid(options.get('workspace_id'))
        force = options.get('force', False)
        
        # Validate clinic_id XOR workspace_id
        if bool(clinic_id) == bool(workspace_id):
            raise CommandError("Must specify either --clinic-id OR --workspace-id, not both or neither")
        
        # Parse dates
        try:
            if options.get('period_start'):
                period_start = datetime.strptime(options['period_start'], '%Y-%m-%d').date()
            else:
                today = timezone.now().date()
                period_start = today.replace(day=1)
            
            if options.get('period_end'):
                period_end = datetime.strptime(options['period_end'], '%Y-%m-%d').date()
            else:
                if period_start.month == 12:
                    period_end = period_start.replace(year=period_start.year + 1, month=1) - timedelta(days=1)
                else:
                    period_end = period_start.replace(month=period_start.month + 1) - timedelta(days=1)
        except ValueError as e:
            raise CommandError(f"Invalid date format: {e}")
        
        self.stdout.write(
            self.style.SUCCESS(f"Calculating indicators for period: {period_start} to {period_end}")
        )
        
        # Get calculators
        calculators = {
            'crecimiento de pacientes': PatientGrowthCalculator(),
            'cumplimiento de protocolos clínicos': ClinicalProtocolComplianceCalculator(),
            'tasa de abandono terapéutico': AbandonmentRateCalculator(),
            'cumplimiento de notas clínicas': ClinicalNotesComplianceCalculator(),
            'satisfacción del paciente': SatisfactionCalculator()
        }
        
        # Get indicators to calculate
        if indicator_name:
            indicators = IndicatorDefinition.objects.filter(
                name__icontains=indicator_name,
                is_active=True
            )
            if not indicators.exists():
                raise CommandError(f"No active indicator found matching: {indicator_name}")
        else:
            indicators = IndicatorDefinition.objects.filter(is_active=True)
        
        results = []
        
        for indicator in indicators:
            try:
                # Check if value already exists
                if not force:
                    existing = IndicatorValue.objects.filter(
                        indicator=indicator,
                        clinic_id=clinic_id,
                        workspace_id=workspace_id,
                        period_start=period_start,
                        period_end=period_end
                    ).exists()
                    
                    if existing:
                        self.stdout.write(
                            self.style.WARNING(f"Skipping {indicator.name} - value already exists (use --force to recalculate)")
                        )
                        continue
                
                # Find appropriate calculator
                calculator = None
                for calc_name, calc_instance in calculators.items():
                    if calc_name.lower() in indicator.name.lower():
                        calculator = calc_instance
                        break
                
                if not calculator:
                    self.stdout.write(
                        self.style.WARNING(f"No calculator found for indicator: {indicator.name}")
                    )
                    continue
                
                # Calculate value
                self.stdout.write(f"Calculating {indicator.name}...")
                
                result = calculator.calculate(
                    clinic_id=clinic_id,
                    workspace_id=workspace_id,
                    period_start=period_start,
                    period_end=period_end
                )
                
                # Save result
                indicator_value, created = IndicatorValue.objects.update_or_create(
                    indicator=indicator,
                    clinic_id=clinic_id,
                    workspace_id=workspace_id,
                    period_start=period_start,
                    period_end=period_end,
                    defaults={
                        'calculated_value': result['value'],
                        'raw_data': result.get('raw_data', {}),
                        'status': 'calculated',
                        'calculated_at': timezone.now()
                    }
                )
                
                action = "Created" if created else "Updated"
                results.append({
                    'indicator': indicator.name,
                    'value': result['value'],
                    'action': action,
                    'status': 'success'
                })
                
                self.stdout.write(
                    self.style.SUCCESS(f"✓ {action} {indicator.name}: {result['value']}")
                )
                
            except Exception as e:
                results.append({
                    'indicator': indicator.name,
                    'status': 'error',
                    'error': str(e)
                })
                
                self.stdout.write(
                    self.style.ERROR(f"✗ Error calculating {indicator.name}: {e}")
                )
        
        # Summary
        success_count = len([r for r in results if r['status'] == 'success'])
        error_count = len([r for r in results if r['status'] == 'error'])
        
        self.stdout.write("\n" + "="*50)
        self.stdout.write(f"Summary: {success_count} successful, {error_count} errors")
        
        if error_count > 0:
            self.stdout.write("\nErrors:")
            for result in results:
                if result['status'] == 'error':
                    self.stdout.write(
                        self.style.ERROR(f"  - {result['indicator']}: {result['error']}")
                    )
    
    def _parse_uuid(self, uuid_string):
        """Parse UUID string, return None if invalid or empty"""
        if not uuid_string:
            return None
        try:
            return uuid.UUID(uuid_string)
        except ValueError:
            raise CommandError(f"Invalid UUID format: {uuid_string}")