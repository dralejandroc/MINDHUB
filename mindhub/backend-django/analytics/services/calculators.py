"""
Healthcare Indicators Calculators
Automated calculation services for all healthcare KPIs
"""

from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count, F, Avg
from typing import Dict, Any, List, Tuple, Optional
import logging

# Import models from other apps (we'll need to adjust these imports)
from ..models import (
    IndicatorDefinition, 
    IndicatorValue, 
    PatientClassification,
    PrescriptionRefill,
    ClinicalProtocolEvaluation
)

logger = logging.getLogger(__name__)


class IndicatorCalculator:
    """
    Base class for all indicator calculators
    """
    
    def __init__(self, clinic_id: str = None, workspace_id: str = None):
        self.clinic_id = clinic_id
        self.workspace_id = workspace_id
        self.now = timezone.now()
    
    def get_dual_system_filter(self):
        """Returns Q filter for dual system (clinic or workspace)"""
        if self.clinic_id:
            return Q(clinic_id=self.clinic_id)
        elif self.workspace_id:
            return Q(workspace_id=self.workspace_id) | Q(created_by=self.workspace_id)
        return Q()


class PatientGrowthCalculator(IndicatorCalculator):
    """
    Calculator for patient growth indicators
    """
    
    def calculate_monthly_growth(self, target_date: datetime = None) -> float:
        """
        Calculate patient growth percentage for a given month
        Formula: [(Current month patients - Previous month patients) / Previous month patients] * 100
        """
        target_date = target_date or self.now.date()
        
        # Current month range
        current_month_start = target_date.replace(day=1)
        if target_date.month == 12:
            current_month_end = current_month_start.replace(year=target_date.year + 1, month=1) - timedelta(days=1)
        else:
            current_month_end = current_month_start.replace(month=target_date.month + 1) - timedelta(days=1)
        
        # Previous month range
        if target_date.month == 1:
            previous_month_start = current_month_start.replace(year=target_date.year - 1, month=12)
        else:
            previous_month_start = current_month_start.replace(month=target_date.month - 1)
        
        previous_month_end = current_month_start - timedelta(days=1)
        
        try:
            # Import here to avoid circular imports
            from expedix.models import Patient
            
            dual_filter = self.get_dual_system_filter()
            
            current_month_patients = Patient.objects.filter(
                dual_filter,
                created_at__date__gte=current_month_start,
                created_at__date__lte=current_month_end,
                is_active=True
            ).count()
            
            previous_month_patients = Patient.objects.filter(
                dual_filter,
                created_at__date__gte=previous_month_start,
                created_at__date__lte=previous_month_end,
                is_active=True
            ).count()
            
            if previous_month_patients == 0:
                return 100.0 if current_month_patients > 0 else 0.0
            
            growth_rate = ((current_month_patients - previous_month_patients) / previous_month_patients) * 100
            
            logger.info(f"Patient growth calculated: {growth_rate}% (Current: {current_month_patients}, Previous: {previous_month_patients})")
            return round(growth_rate, 2)
            
        except Exception as e:
            logger.error(f"Error calculating patient growth: {e}")
            return 0.0

    def calculate(
        self,
        clinic_id: Optional[str],
        workspace_id: Optional[str],
        period_start,  # date
        period_end     # date
    ) -> Dict[str, Any]:
        # Ajusta el contexto dual
        self.clinic_id = clinic_id
        self.workspace_id = workspace_id

        # Usamos el primer día del periodo como "target_date" para tu cálculo mensual
        target_date = period_start
        value = self.calculate_monthly_growth(target_date=target_date)

        return {
            "value": value,
            "raw_data": {
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "clinic_id": clinic_id,
                "workspace_id": workspace_id,
                "metric": "monthly_patient_growth_percent"
            }
        }


class ClinicalProtocolComplianceCalculator(IndicatorCalculator):
    """
    Calculator for clinical protocol compliance
    """
    
    # Standard clinical guidelines mapping (DSM-5/ICD-10)
    CLINICAL_GUIDELINES = {
        'F32': {  # Major depressive episode
            'name': 'Episodio Depresivo Mayor',
            'medications': ['fluoxetina', 'sertralina', 'escitalopram', 'paroxetina', 'citalopram'],
            'therapy': ['CBT', 'terapia_cognitivo_conductual', 'terapia_interpersonal'],
            'follow_up_days': 14
        },
        'F33': {  # Recurrent depressive disorder
            'name': 'Trastorno Depresivo Recurrente',
            'medications': ['fluoxetina', 'sertralina', 'escitalopram', 'venlafaxina'],
            'therapy': ['CBT', 'terapia_cognitivo_conductual'],
            'follow_up_days': 14
        },
        'F41.0': {  # Panic disorder
            'name': 'Trastorno de Pánico',
            'medications': ['alprazolam', 'clonazepam', 'escitalopram', 'paroxetina'],
            'therapy': ['CBT', 'terapia_exposicion'],
            'follow_up_days': 21
        },
        'F41.1': {  # Generalized anxiety disorder
            'name': 'Trastorno de Ansiedad Generalizada',
            'medications': ['clonazepam', 'alprazolam', 'escitalopram', 'venlafaxina'],
            'therapy': ['CBT', 'terapia_relajacion'],
            'follow_up_days': 21
        },
        'F20': {  # Schizophrenia
            'name': 'Esquizofrenia',
            'medications': ['olanzapina', 'risperidona', 'quetiapina', 'aripiprazol'],
            'therapy': ['terapia_familiar', 'rehabilitacion_cognitiva'],
            'follow_up_days': 7
        },
        'F31': {  # Bipolar disorder
            'name': 'Trastorno Bipolar',
            'medications': ['litio', 'valproato', 'quetiapina', 'olanzapina'],
            'therapy': ['psicoeducacion', 'terapia_familiar'],
            'follow_up_days': 14
        },
        'F90': {  # ADHD
            'name': 'TDAH',
            'medications': ['metilfenidato', 'atomoxetina', 'lisdexanfetamina'],
            'therapy': ['terapia_conductual', 'entrenamiento_padres'],
            'follow_up_days': 30
        }
    }
    
    def calculate_monthly_compliance(self, target_date: datetime = None) -> float:
        """
        Calculate protocol compliance for 10% random sample of consultations
        """
        target_date = target_date or self.now.date()
        month_start = target_date.replace(day=1)
        month_end = (month_start.replace(month=month_start.month % 12 + 1) - timedelta(days=1))
        
        try:
            from expedix.models import Consultation
            
            dual_filter = self.get_dual_system_filter()
            
            # Get all consultations from the month
            consultations = list(Consultation.objects.filter(
                dual_filter,
                consultation_date__gte=month_start,
                consultation_date__lte=month_end
            ).select_related('patient'))
            
            if not consultations:
                return 0.0
            
            # Random 10% sample
            import random
            sample_size = max(1, int(len(consultations) * 0.1))
            sample_consultations = random.sample(consultations, sample_size)
            
            compliant_count = 0
            total_evaluated = 0
            
            for consultation in sample_consultations:
                compliance_result = self.evaluate_consultation_compliance(consultation)
                if compliance_result is not None:
                    total_evaluated += 1
                    if compliance_result:
                        compliant_count += 1
            
            if total_evaluated == 0:
                return 0.0
            
            compliance_rate = (compliant_count / total_evaluated) * 100
            
            logger.info(f"Protocol compliance calculated: {compliance_rate}% ({compliant_count}/{total_evaluated})")
            return round(compliance_rate, 2)
            
        except Exception as e:
            logger.error(f"Error calculating protocol compliance: {e}")
            return 0.0
    
    def evaluate_consultation_compliance(self, consultation) -> Optional[bool]:
        """
        Evaluate if a consultation complies with clinical protocols
        """
        try:
            # Check if consultation has required fields
            if not consultation.diagnosis or not consultation.treatment_plan:
                return False
            
            # Extract diagnosis code (first 3-5 characters)
            diagnosis_code = consultation.diagnosis.split(' ')[0] if consultation.diagnosis else ''
            
            # Find matching guideline
            guideline = None
            for code, guide in self.CLINICAL_GUIDELINES.items():
                if diagnosis_code.startswith(code):
                    guideline = guide
                    break
            
            if not guideline:
                # If no specific guideline, check basic completeness
                return bool(consultation.diagnosis and consultation.treatment_plan and consultation.notes)
            
            # Check medication appropriateness
            if hasattr(consultation, 'prescriptions'):
                prescribed_meds = []
                for prescription in consultation.prescriptions.all():
                    if hasattr(prescription, 'medications') and prescription.medications:
                        for med in prescription.medications:
                            if isinstance(med, dict) and 'name' in med:
                                prescribed_meds.append(med['name'].lower())
                
                # Check if at least one prescribed medication is in guidelines
                if prescribed_meds:
                    has_appropriate_med = any(
                        rec_med in ' '.join(prescribed_meds)
                        for rec_med in guideline['medications']
                    )
                    
                    if not has_appropriate_med:
                        return False
            
            # Check follow-up appropriateness
            if hasattr(consultation, 'next_appointment_date') and consultation.next_appointment_date:
                days_to_followup = (consultation.next_appointment_date - consultation.consultation_date).days
                recommended_days = guideline.get('follow_up_days', 30)
                
                # Allow some flexibility (±50% of recommended interval)
                min_days = recommended_days * 0.5
                max_days = recommended_days * 1.5
                
                if not (min_days <= days_to_followup <= max_days):
                    return False
            
            # Record evaluation
            ClinicalProtocolEvaluation.objects.update_or_create(
                consultation_id=consultation.id,
                defaults={
                    'patient_id': consultation.patient_id,
                    'diagnosis_code': diagnosis_code,
                    'treatment_plan': {'notes': consultation.treatment_plan},
                    'protocol_compliance': True,
                    'evaluated_at': timezone.now()
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error evaluating consultation compliance: {e}")
            return None

    def calculate(
        self,
        clinic_id: Optional[str],
        workspace_id: Optional[str],
        period_start,
        period_end
    ) -> Dict[str, Any]:
        self.clinic_id = clinic_id
        self.workspace_id = workspace_id

        target_date = period_start
        value = self.calculate_monthly_compliance(target_date=target_date)

        return {
            "value": value,
            "raw_data": {
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "clinic_id": clinic_id,
                "workspace_id": workspace_id,
                "metric": "monthly_protocol_compliance_percent"
            }
        }


class AbandonmentRateCalculator(IndicatorCalculator):
    """
    Calculator for therapy abandonment rates
    """
    
    def calculate_monthly_abandonment(self, target_date: datetime = None) -> float:
        """
        Calculate abandonment rate based on scheduled vs attended appointments
        with adaptive tolerance margins
        """
        target_date = target_date or self.now.date()
        one_month_ago = target_date - timedelta(days=30)
        
        try:
            from agenda.models import Appointment
            
            dual_filter = self.get_dual_system_filter()
            
            # Get completed appointments with next appointment scheduled
            appointments_with_followup = Appointment.objects.filter(
                dual_filter,
                status='completed',
                appointment_date__lte=one_month_ago
            ).exclude(
                # Assuming we add next_appointment_date field to Appointment model
                # For now, we'll work with available data
                Q(notes__isnull=True) | Q(notes='')
            )
            
            abandoned_count = 0
            active_count = 0
            
            for appointment in appointments_with_followup:
                is_abandoned = self.check_patient_abandonment(appointment)
                
                if is_abandoned:
                    abandoned_count += 1
                else:
                    active_count += 1
            
            total = abandoned_count + active_count
            abandonment_rate = (abandoned_count / total * 100) if total > 0 else 0.0
            
            logger.info(f"Abandonment rate calculated: {abandonment_rate}% ({abandoned_count}/{total})")
            return round(abandonment_rate, 2)
            
        except Exception as e:
            logger.error(f"Error calculating abandonment rate: {e}")
            return 0.0
    
    def check_patient_abandonment(self, appointment) -> bool:
        """
        Check if a patient abandoned therapy based on appointment patterns
        """
        try:
            from agenda.models import Appointment
            
            # Get patient's appointment history
            patient_appointments = Appointment.objects.filter(
                patient_id=appointment.patient_id,
                appointment_date__gte=appointment.appointment_date
            ).order_by('appointment_date')
            
            if len(patient_appointments) < 2:
                return True  # No follow-up appointments
            
            # Calculate typical interval between appointments
            intervals = []
            for i in range(len(patient_appointments) - 1):
                interval = (patient_appointments[i+1].appointment_date - patient_appointments[i].appointment_date).days
                intervals.append(interval)
            
            if not intervals:
                return True
            
            avg_interval = sum(intervals) / len(intervals)
            
            # Check for prescription refills as alternative contact
            has_recent_refill = PrescriptionRefill.objects.filter(
                patient_id=appointment.patient_id,
                refill_date__gte=appointment.appointment_date,
                refill_date__lte=appointment.appointment_date + timedelta(days=avg_interval * 1.5)
            ).exists()
            
            if has_recent_refill:
                return False  # Patient maintained contact through refills
            
            # Check if last appointment was too long ago
            last_appointment = patient_appointments.last()
            days_since_last = (self.now.date() - last_appointment.appointment_date).days
            
            # Define abandonment threshold based on typical interval
            abandonment_threshold = avg_interval * 2  # Double the usual interval
            
            return days_since_last > abandonment_threshold
            
        except Exception as e:
            logger.error(f"Error checking patient abandonment: {e}")
            return False

    def calculate(
        self,
        clinic_id: Optional[str],
        workspace_id: Optional[str],
        period_start,
        period_end
    ) -> Dict[str, Any]:
        self.clinic_id = clinic_id
        self.workspace_id = workspace_id

        # Este usa una ventana de ~30 días hacia atrás desde target_date
        target_date = period_start
        value = self.calculate_monthly_abandonment(target_date=target_date)

        return {
            "value": value,
            "raw_data": {
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "clinic_id": clinic_id,
                "workspace_id": workspace_id,
                "metric": "monthly_abandonment_rate_percent"
            }
        }


class ClinicalNotesComplianceCalculator(IndicatorCalculator):
    """
    Calculator for clinical notes updating compliance
    """
    
    def calculate_monthly_notes_compliance(self, target_date: datetime = None) -> float:
        """
        Calculate percentage of consultations with complete notes updated within 5 days
        """
        target_date = target_date or self.now.date()
        month_start = target_date.replace(day=1)
        month_end = (month_start.replace(month=month_start.month % 12 + 1) - timedelta(days=1))
        
        try:
            from expedix.models import Consultation
            
            dual_filter = self.get_dual_system_filter()
            
            consultations = Consultation.objects.filter(
                dual_filter,
                consultation_date__gte=month_start,
                consultation_date__lte=month_end
            )
            
            compliant_count = 0
            total_count = consultations.count()
            
            for consultation in consultations:
                if self.is_consultation_compliant(consultation):
                    compliant_count += 1
            
            compliance_rate = (compliant_count / total_count * 100) if total_count > 0 else 0.0
            
            logger.info(f"Notes compliance calculated: {compliance_rate}% ({compliant_count}/{total_count})")
            return round(compliance_rate, 2)
            
        except Exception as e:
            logger.error(f"Error calculating notes compliance: {e}")
            return 0.0
    
    def is_consultation_compliant(self, consultation) -> bool:
        """
        Check if consultation has complete notes updated within 5 days
        """
        try:
            # Check completeness of critical fields
            has_complete_notes = all([
                consultation.notes and len(consultation.notes.strip()) > 50,  # Substantial notes
                consultation.diagnosis and len(consultation.diagnosis.strip()) > 0,  # Diagnosis present
                consultation.treatment_plan and len(consultation.treatment_plan.strip()) > 0,  # Treatment plan present
            ])
            
            # Check if there's follow-up planning (next appointment or discharge)
            has_followup_plan = bool(
                hasattr(consultation, 'next_appointment_date') and consultation.next_appointment_date
            ) or bool(
                hasattr(consultation, 'discharge_notes') and consultation.discharge_notes
            )
            
            # Check timeliness (updated within 5 days)
            days_to_update = (consultation.updated_at.date() - consultation.consultation_date).days
            is_timely = days_to_update <= 5
            
            return has_complete_notes and has_followup_plan and is_timely
            
        except Exception as e:
            logger.error(f"Error checking consultation compliance: {e}")
            return False

    def calculate(
        self,
        clinic_id: Optional[str],
        workspace_id: Optional[str],
        period_start,
        period_end
    ) -> Dict[str, Any]:
        self.clinic_id = clinic_id
        self.workspace_id = workspace_id

        target_date = period_start
        value = self.calculate_monthly_notes_compliance(target_date=target_date)

        return {
            "value": value,
            "raw_data": {
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "clinic_id": clinic_id,
                "workspace_id": workspace_id,
                "metric": "monthly_notes_compliance_percent"
            }
        }


class PatientClassificationService(IndicatorCalculator):
    """
    Service for automatic patient classification
    """
    
    def classify_patient(self, patient_id: str) -> str:
        """
        Classify patient based on engagement criteria
        """
        try:
            from expedix.models import Patient
            from agenda.models import Appointment
            
            patient = Patient.objects.get(id=patient_id)
            
            # Calculate attendance rate
            total_appointments = Appointment.objects.filter(patient_id=patient_id).count()
            attended_appointments = Appointment.objects.filter(
                patient_id=patient_id, 
                status='completed'
            ).count()
            
            attendance_rate = (attended_appointments / total_appointments * 100) if total_appointments > 0 else 0
            
            # Count different professionals consulted
            professionals_seen = self.count_professionals_consulted(patient_id)
            
            # Calculate time in treatment
            first_appointment = Appointment.objects.filter(
                patient_id=patient_id
            ).order_by('appointment_date').first()
            
            days_in_treatment = 0
            if first_appointment:
                days_in_treatment = (self.now.date() - first_appointment.appointment_date).days
            
            # Count additional programs (placeholder - would need actual data)
            additional_programs = 0  # TODO: Implement when group sessions/workshops are available
            
            # Determine classification
            classification = self.determine_classification(
                attendance_rate=attendance_rate,
                professionals_count=professionals_seen,
                days_in_treatment=days_in_treatment,
                additional_programs=additional_programs
            )
            
            # Update or create classification
            PatientClassification.objects.update_or_create(
                patient_id=patient_id,
                defaults={
                    'classification': classification,
                    'attendance_rate': attendance_rate,
                    'professionals_seen': professionals_seen,
                    'time_in_treatment': days_in_treatment,
                    'additional_programs': additional_programs,
                    'last_evaluation': self.now.date()
                }
            )
            
            return classification
            
        except Exception as e:
            logger.error(f"Error classifying patient {patient_id}: {e}")
            return 'P_INCONSTANTE'
    
    def count_professionals_consulted(self, patient_id: str) -> int:
        """
        Count different professionals (specialties) the patient has consulted
        """
        try:
            from agenda.models import Appointment
            
            # Get unique professional IDs for this patient
            professional_ids = Appointment.objects.filter(
                patient_id=patient_id,
                status='completed'
            ).values_list('professional_id', flat=True).distinct()
            
            return len(professional_ids)
            
        except Exception as e:
            logger.error(f"Error counting professionals for patient {patient_id}: {e}")
            return 0
    
    def determine_classification(self, attendance_rate: float, professionals_count: int, 
                               days_in_treatment: int, additional_programs: int) -> str:
        """
        Determine patient classification based on criteria
        """
        if attendance_rate < 50 and days_in_treatment < 90:
            return 'P_INCONSTANTE'
        
        elif attendance_rate >= 50 and professionals_count <= 2 and days_in_treatment < 60:
            return 'P_EN_ACOMPAÑAMIENTO'
        
        elif attendance_rate == 100 and days_in_treatment < 60:
            return 'INTEGRACION_INICIAL'
        
        elif attendance_rate >= 80 and days_in_treatment >= 90 and professionals_count >= 2:
            if additional_programs >= 1:
                return 'P_INTEGRACION_AVANZADA'
            else:
                return 'INTEGRACION_INICIAL'
        
        elif attendance_rate >= 80 and days_in_treatment >= 180 and professionals_count >= 2:
            if additional_programs >= 1:
                return 'P_INTEGRADO'
            else:
                return 'P_INTEGRACION_AVANZADA'
        
        elif attendance_rate >= 80 and days_in_treatment >= 365 and professionals_count >= 2:
            if additional_programs >= 2:
                return 'ARRAIGADO'
            else:
                return 'P_INTEGRADO'
        
        elif attendance_rate >= 80 and professionals_count >= 2 and additional_programs >= 2:
            # Check for discharge notes to classify as "P_DE_ALTA"
            # This would require checking latest consultation
            return 'P_DE_ALTA'  # Placeholder
        
        return 'P_INCONSTANTE'  # Default classification


class SatisfactionCalculator(IndicatorCalculator):
    """
    Calculator for patient satisfaction indicators
    """
    
    def calculate_monthly_satisfaction(self, survey_type: str = 'global', target_date: datetime = None) -> float:
        """
        Calculate satisfaction percentage for a given survey type and month
        """
        target_date = target_date or self.now.date()
        month_start = target_date.replace(day=1)
        month_end = (month_start.replace(month=month_start.month % 12 + 1) - timedelta(days=1))
        
        try:
            from ..models import SatisfactionSurvey
            
            # Get surveys for the month
            surveys = SatisfactionSurvey.objects.filter(
                survey_type=survey_type,
                created_at__date__gte=month_start,
                created_at__date__lte=month_end
            )
            
            if not surveys.exists():
                return 0.0
            
            # Calculate positive responses (score >= 7 out of 10)
            positive_surveys = surveys.filter(score__gte=7).count()
            total_surveys = surveys.count()
            
            satisfaction_rate = (positive_surveys / total_surveys * 100) if total_surveys > 0 else 0.0
            
            logger.info(f"Satisfaction calculated: {satisfaction_rate}% ({positive_surveys}/{total_surveys})")
            return round(satisfaction_rate, 2)
            
        except Exception as e:
            logger.error(f"Error calculating satisfaction: {e}")
            return 0.0

    def calculate(
            self,
            clinic_id: Optional[str],
            workspace_id: Optional[str],
            period_start,
            period_end
        ) -> Dict[str, Any]:
        # (Este indicador no usa dual filter hoy, pero mantenemos la firma por consistencia)
        self.clinic_id = clinic_id
        self.workspace_id = workspace_id

        target_date = period_start
        value = self.calculate_monthly_satisfaction(survey_type='global', target_date=target_date)

        return {
            "value": value,
            "raw_data": {
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "clinic_id": clinic_id,
                "workspace_id": workspace_id,
                "metric": "monthly_satisfaction_percent",
                "survey_type": "global"
            }
        }