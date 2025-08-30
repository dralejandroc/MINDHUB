"""
Analytics Signals - Healthcare Indicators System
Automated triggers for KPI calculations and patient classification
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from datetime import datetime, timedelta
import logging

from .models import (
    IndicatorDefinition,
    IndicatorValue,
    PatientClassification,
    SatisfactionSurvey,
    PrescriptionRefill,
    ClinicalProtocolEvaluation
)
from .services.calculators import (
    PatientGrowthCalculator,
    ClinicalProtocolComplianceCalculator,
    AbandonmentRateCalculator,
    ClinicalNotesComplianceCalculator,
    PatientClassificationService,
    SatisfactionCalculator
)

logger = logging.getLogger(__name__)


class IndicatorCalculationTask:
    """Background task simulation for indicator calculations"""
    
    @staticmethod
    def trigger_calculation(indicator_name, clinic_id=None, workspace_id=None, delay_seconds=0):
        """
        Simulate triggering a background calculation task
        In production, this would use Celery or similar task queue
        """
        try:
            logger.info(f"Triggering calculation for {indicator_name} - "
                       f"clinic_id: {clinic_id}, workspace_id: {workspace_id}")
            
            # For now, execute immediately (in production, would queue the task)
            IndicatorCalculationTask._execute_calculation(indicator_name, clinic_id, workspace_id)
            
        except Exception as e:
            logger.error(f"Error triggering calculation for {indicator_name}: {e}")
    
    @staticmethod
    def _execute_calculation(indicator_name, clinic_id=None, workspace_id=None):
        """Execute the actual calculation"""
        calculators = {
            'crecimiento de pacientes': PatientGrowthCalculator(),
            'cumplimiento de protocolos clínicos': ClinicalProtocolComplianceCalculator(),
            'tasa de abandono terapéutico': AbandonmentRateCalculator(),
            'cumplimiento de notas clínicas': ClinicalNotesComplianceCalculator(),
            'satisfacción del paciente': SatisfactionCalculator()
        }
        
        calculator = calculators.get(indicator_name.lower())
        if not calculator:
            logger.warning(f"No calculator found for indicator: {indicator_name}")
            return
        
        try:
            # Default to current month
            today = timezone.now().date()
            period_start = today.replace(day=1)
            
            if period_start.month == 12:
                period_end = period_start.replace(year=period_start.year + 1, month=1) - timedelta(days=1)
            else:
                period_end = period_start.replace(month=period_start.month + 1) - timedelta(days=1)
            
            # Calculate indicator value
            result = calculator.calculate(
                clinic_id=clinic_id,
                workspace_id=workspace_id,
                period_start=period_start,
                period_end=period_end
            )
            
            # Get indicator definition
            indicator = IndicatorDefinition.objects.filter(
                name__icontains=indicator_name,
                is_active=True
            ).first()
            
            if indicator:
                # Save or update indicator value
                IndicatorValue.objects.update_or_create(
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
                
                logger.info(f"Successfully calculated {indicator_name}: {result['value']}")
            else:
                logger.warning(f"Indicator definition not found for: {indicator_name}")
                
        except Exception as e:
            logger.error(f"Error executing calculation for {indicator_name}: {e}")


# Patient-related signals
@receiver(post_save, sender='expedix.Patient')
def patient_created_or_updated(sender, instance, created, **kwargs):
    """Trigger patient growth calculation when patient is created/updated"""
    if created:
        logger.info(f"New patient created: {instance.id}")
        # Trigger patient growth indicator calculation
        IndicatorCalculationTask.trigger_calculation(
            'crecimiento de pacientes',
            clinic_id=getattr(instance, 'clinic_id', None),
            workspace_id=getattr(instance, 'workspace_id', None)
        )


# Consultation-related signals
@receiver(post_save, sender='expedix.Consultation')
def consultation_completed(sender, instance, created, **kwargs):
    """Trigger calculations when consultation is completed"""
    if not created and getattr(instance, 'status', None) == 'completed':
        logger.info(f"Consultation completed: {instance.id}")
        
        # Get patient context for clinic/workspace
        patient = getattr(instance, 'patient', None)
        clinic_id = getattr(patient, 'clinic_id', None) if patient else None
        workspace_id = getattr(patient, 'workspace_id', None) if patient else None
        
        # Trigger multiple calculations
        calculations = [
            'cumplimiento de notas clínicas',
            'cumplimiento de protocolos clínicos',
            'tasa de abandono terapéutico'
        ]
        
        for calc_name in calculations:
            IndicatorCalculationTask.trigger_calculation(calc_name, clinic_id, workspace_id)


# Appointment-related signals
@receiver(post_save, sender='agenda.Appointment')
def appointment_status_changed(sender, instance, created, **kwargs):
    """Trigger abandonment rate calculation when appointment status changes"""
    if not created and hasattr(instance, 'status'):
        logger.info(f"Appointment status changed: {instance.id} -> {instance.status}")
        
        # Get patient context
        patient = getattr(instance, 'patient', None)
        clinic_id = getattr(patient, 'clinic_id', None) if patient else None
        workspace_id = getattr(patient, 'workspace_id', None) if patient else None
        
        # Trigger abandonment rate calculation
        IndicatorCalculationTask.trigger_calculation(
            'tasa de abandono terapéutico',
            clinic_id, 
            workspace_id,
            delay_seconds=300  # Wait 5 minutes to batch similar events
        )


# Satisfaction survey signals
@receiver(post_save, sender=SatisfactionSurvey)
def satisfaction_survey_submitted(sender, instance, created, **kwargs):
    """Trigger satisfaction calculation when survey is submitted"""
    if created:
        logger.info(f"New satisfaction survey submitted: {instance.id}")
        
        # Determine clinic/workspace from patient context
        # For now, we'll need to look up the patient to get clinic_id
        # This would require accessing the patient model
        
        IndicatorCalculationTask.trigger_calculation(
            'satisfacción del paciente',
            delay_seconds=60  # Small delay to allow for batch processing
        )


# Prescription refill signals
@receiver(post_save, sender=PrescriptionRefill)
def prescription_refill_registered(sender, instance, created, **kwargs):
    """Update patient classification when prescription refill is registered"""
    if created:
        logger.info(f"Prescription refill registered: {instance.id}")
        
        # Trigger patient classification update
        try:
            classification_service = PatientClassificationService()
            classification_service.classify_patient(
                patient_id=instance.patient_id,
                force_recalculate=True
            )
        except Exception as e:
            logger.error(f"Error updating patient classification: {e}")


# Clinical protocol evaluation signals
@receiver(post_save, sender=ClinicalProtocolEvaluation)
def protocol_evaluation_completed(sender, instance, created, **kwargs):
    """Trigger protocol compliance calculation when evaluation is completed"""
    if created:
        logger.info(f"Clinical protocol evaluation completed: {instance.id}")
        
        # Get patient context
        try:
            # Would need to access patient model to get clinic/workspace
            IndicatorCalculationTask.trigger_calculation(
                'cumplimiento de protocolos clínicos',
                delay_seconds=30
            )
        except Exception as e:
            logger.error(f"Error triggering protocol compliance calculation: {e}")


# Periodic calculation triggers (would be handled by Celery beat in production)
class PeriodicCalculationService:
    """Service for periodic indicator calculations"""
    
    @staticmethod
    def calculate_daily_indicators():
        """Calculate indicators that need daily updates"""
        logger.info("Running daily indicator calculations")
        
        indicators_to_calculate = [
            'crecimiento de pacientes',
            'satisfacción del paciente',
            'cumplimiento de notas clínicas'
        ]
        
        # Get all active clinics/workspaces
        active_entities = IndicatorValue.objects.values(
            'clinic_id', 'workspace_id'
        ).distinct()
        
        for entity in active_entities:
            clinic_id = entity.get('clinic_id')
            workspace_id = entity.get('workspace_id')
            
            for indicator_name in indicators_to_calculate:
                IndicatorCalculationTask.trigger_calculation(
                    indicator_name, clinic_id, workspace_id
                )
    
    @staticmethod
    def calculate_weekly_indicators():
        """Calculate indicators that need weekly updates"""
        logger.info("Running weekly indicator calculations")
        
        indicators_to_calculate = [
            'tasa de abandono terapéutico',
            'cumplimiento de protocolos clínicos'
        ]
        
        # Similar logic as daily calculations
        active_entities = IndicatorValue.objects.values(
            'clinic_id', 'workspace_id'
        ).distinct()
        
        for entity in active_entities:
            clinic_id = entity.get('clinic_id')
            workspace_id = entity.get('workspace_id')
            
            for indicator_name in indicators_to_calculate:
                IndicatorCalculationTask.trigger_calculation(
                    indicator_name, clinic_id, workspace_id
                )
    
    @staticmethod
    def update_patient_classifications():
        """Update all patient classifications"""
        logger.info("Running patient classification updates")
        
        try:
            classification_service = PatientClassificationService()
            
            # Get all patients that need classification updates
            # This would need to query the patient model
            # For now, just log that the service is running
            logger.info("Patient classification service executed")
            
        except Exception as e:
            logger.error(f"Error in patient classification update: {e}")


# Manual calculation triggers
def trigger_manual_calculation(indicator_name, clinic_id=None, workspace_id=None):
    """
    Manually trigger indicator calculation
    Can be called from management commands or admin actions
    """
    logger.info(f"Manual calculation triggered for {indicator_name}")
    IndicatorCalculationTask.trigger_calculation(indicator_name, clinic_id, workspace_id)


def trigger_bulk_recalculation(clinic_id=None, workspace_id=None):
    """
    Recalculate all indicators for a specific clinic or workspace
    Useful for data migrations or system maintenance
    """
    logger.info("Bulk recalculation triggered")
    
    all_indicators = [
        'crecimiento de pacientes',
        'cumplimiento de protocolos clínicos',
        'tasa de abandono terapéutico',
        'cumplimiento de notas clínicas',
        'satisfacción del paciente'
    ]
    
    for indicator_name in all_indicators:
        IndicatorCalculationTask.trigger_calculation(
            indicator_name, clinic_id, workspace_id
        )