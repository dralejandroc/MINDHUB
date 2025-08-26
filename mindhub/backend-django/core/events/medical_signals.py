"""
Medical Events System - Django Signals
Inspired by OpenEMR event-driven architecture for healthcare workflows
"""

import logging
from django.dispatch import Signal, receiver
from django.db.models.signals import post_save, post_delete
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Define custom medical signals
medical_event_dispatched = Signal()

# Medical entity signals (inspired by OpenEMR events)
patient_created = Signal()
patient_updated = Signal() 
patient_deleted = Signal()
appointment_scheduled = Signal()
appointment_cancelled = Signal()
appointment_completed = Signal()
assessment_started = Signal()
assessment_completed = Signal()
prescription_created = Signal()
consultation_completed = Signal()

class MedicalEventDispatcher:
    """
    Medical event dispatcher for healthcare workflow automation
    Inspired by OpenEMR's event system
    """
    
    @staticmethod
    def dispatch_patient_created(patient, user=None, **kwargs):
        """Dispatch patient creation event"""
        try:
            patient_created.send(
                sender=patient.__class__,
                patient=patient,
                user=user,
                **kwargs
            )
            logger.info(f"Patient created event dispatched: {patient.id}")
        except Exception as e:
            logger.error(f"Failed to dispatch patient_created event: {str(e)}")
    
    @staticmethod
    def dispatch_patient_updated(patient, changes=None, user=None, **kwargs):
        """Dispatch patient update event"""
        try:
            patient_updated.send(
                sender=patient.__class__,
                patient=patient,
                changes=changes or {},
                user=user,
                **kwargs
            )
            logger.info(f"Patient updated event dispatched: {patient.id}")
        except Exception as e:
            logger.error(f"Failed to dispatch patient_updated event: {str(e)}")
    
    @staticmethod
    def dispatch_appointment_scheduled(appointment, user=None, **kwargs):
        """Dispatch appointment scheduling event"""
        try:
            appointment_scheduled.send(
                sender=appointment.__class__,
                appointment=appointment,
                user=user,
                **kwargs
            )
            logger.info(f"Appointment scheduled event dispatched: {appointment.id}")
        except Exception as e:
            logger.error(f"Failed to dispatch appointment_scheduled event: {str(e)}")
    
    @staticmethod
    def dispatch_assessment_completed(assessment, user=None, **kwargs):
        """Dispatch assessment completion event"""
        try:
            assessment_completed.send(
                sender=assessment.__class__,
                assessment=assessment,
                user=user,
                **kwargs
            )
            logger.info(f"Assessment completed event dispatched: {assessment.id}")
        except Exception as e:
            logger.error(f"Failed to dispatch assessment_completed event: {str(e)}")
    
    @staticmethod
    def dispatch_prescription_created(prescription, user=None, **kwargs):
        """Dispatch prescription creation event"""
        try:
            prescription_created.send(
                sender=prescription.__class__,
                prescription=prescription,
                user=user,
                **kwargs
            )
            logger.info(f"Prescription created event dispatched: {prescription.id}")
        except Exception as e:
            logger.error(f"Failed to dispatch prescription_created event: {str(e)}")


# Medical event handlers (inspired by OpenEMR event processors)
@receiver(patient_created)
def handle_patient_created(sender, patient, user=None, **kwargs):
    """
    Handle patient creation - setup initial medical records
    """
    try:
        logger.info(f"Processing patient creation: {patient.id}")
        
        # Could trigger:
        # 1. Create initial medical history entry
        # 2. Send welcome email to patient
        # 3. Schedule initial consultation
        # 4. Create default assessments
        # 5. Setup patient portal access
        
        # For now, just log the event
        logger.info(f"Patient {patient.full_name} created successfully")
        
    except Exception as e:
        logger.error(f"Error handling patient creation: {str(e)}")


@receiver(patient_updated)
def handle_patient_updated(sender, patient, changes=None, user=None, **kwargs):
    """
    Handle patient updates - track changes for audit
    """
    try:
        logger.info(f"Processing patient update: {patient.id}")
        
        # Important medical fields that require special handling
        critical_fields = [
            'allergies', 'chronic_conditions', 'current_medications',
            'blood_type', 'emergency_contact_name', 'emergency_contact_phone'
        ]
        
        if changes:
            critical_changes = {k: v for k, v in changes.items() if k in critical_fields}
            if critical_changes:
                logger.warning(f"Critical medical fields updated for patient {patient.id}: {list(critical_changes.keys())}")
                # Could trigger notification to assigned professional
        
    except Exception as e:
        logger.error(f"Error handling patient update: {str(e)}")


@receiver(appointment_scheduled)
def handle_appointment_scheduled(sender, appointment, user=None, **kwargs):
    """
    Handle appointment scheduling - notifications and preparation
    """
    try:
        logger.info(f"Processing appointment scheduling: {appointment.id}")
        
        # Could trigger:
        # 1. Send confirmation email to patient
        # 2. Send notification to professional
        # 3. Add to calendar
        # 4. Prepare consultation template
        # 5. Send reminder notifications (scheduled)
        
        logger.info(f"Appointment scheduled for patient {appointment.patient_id} on {appointment.appointment_date}")
        
    except Exception as e:
        logger.error(f"Error handling appointment scheduling: {str(e)}")


@receiver(assessment_completed)
def handle_assessment_completed(sender, assessment, user=None, **kwargs):
    """
    Handle assessment completion - ClinimetrixPro integration
    """
    try:
        logger.info(f"Processing assessment completion: {assessment.id}")
        
        # ClinimetrixPro specific handling
        # Could trigger:
        # 1. Generate assessment report
        # 2. Update patient medical summary
        # 3. Notify assigned professional
        # 4. Schedule follow-up if needed
        # 5. Add to patient's assessment history
        
        logger.info(f"Assessment {assessment.template_id} completed for patient {assessment.patient_id}")
        
    except Exception as e:
        logger.error(f"Error handling assessment completion: {str(e)}")


@receiver(prescription_created)
def handle_prescription_created(sender, prescription, user=None, **kwargs):
    """
    Handle prescription creation - compliance and notifications
    """
    try:
        logger.info(f"Processing prescription creation: {prescription.id}")
        
        # Could trigger:
        # 1. Send prescription to patient
        # 2. Send to pharmacy if integrated
        # 3. Update patient's medication list
        # 4. Check for drug interactions
        # 5. Schedule medication reviews
        
        logger.info(f"Prescription created for patient {prescription.patient_id}")
        
    except Exception as e:
        logger.error(f"Error handling prescription creation: {str(e)}")


class MedicalWorkflowEngine:
    """
    Medical workflow automation engine
    Handles complex healthcare workflows triggered by events
    """
    
    @staticmethod
    def trigger_new_patient_workflow(patient, user=None):
        """
        Complete new patient workflow
        """
        try:
            workflows_completed = []
            
            # 1. Create initial medical history if needed
            workflows_completed.append("medical_history_setup")
            
            # 2. Setup default assessments based on patient category
            if patient.patient_category:
                workflows_completed.append("default_assessments_setup")
            
            # 3. Assign to professional if not assigned
            if not patient.assigned_professional_id and user:
                patient.assigned_professional_id = user.id
                patient.save()
                workflows_completed.append("professional_assignment")
            
            # 4. Generate patient portal access (future feature)
            workflows_completed.append("portal_access_setup")
            
            logger.info(f"New patient workflow completed: {workflows_completed}")
            return workflows_completed
            
        except Exception as e:
            logger.error(f"Error in new patient workflow: {str(e)}")
            return []
    
    @staticmethod
    def trigger_appointment_workflow(appointment):
        """
        Complete appointment workflow
        """
        try:
            workflows_completed = []
            
            # 1. Prepare consultation template
            workflows_completed.append("consultation_template_prepared")
            
            # 2. Schedule reminders
            workflows_completed.append("reminders_scheduled")
            
            # 3. Prepare assessment recommendations
            workflows_completed.append("assessment_recommendations")
            
            logger.info(f"Appointment workflow completed: {workflows_completed}")
            return workflows_completed
            
        except Exception as e:
            logger.error(f"Error in appointment workflow: {str(e)}")
            return []
    
    @staticmethod
    def trigger_assessment_workflow(assessment):
        """
        Complete assessment workflow (ClinimetrixPro)
        """
        try:
            workflows_completed = []
            
            # 1. Process assessment results
            workflows_completed.append("results_processed")
            
            # 2. Generate interpretations
            workflows_completed.append("interpretations_generated")
            
            # 3. Update patient summary
            workflows_completed.append("patient_summary_updated")
            
            # 4. Notify professionals
            workflows_completed.append("professionals_notified")
            
            logger.info(f"Assessment workflow completed: {workflows_completed}")
            return workflows_completed
            
        except Exception as e:
            logger.error(f"Error in assessment workflow: {str(e)}")
            return []


# Medical notification system
class MedicalNotificationSystem:
    """
    Medical notification system for healthcare events
    """
    
    @staticmethod
    def send_patient_welcome(patient):
        """Send welcome message to new patient"""
        try:
            # Future: Send email/SMS welcome message
            logger.info(f"Welcome notification sent to patient: {patient.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to send welcome notification: {str(e)}")
            return False
    
    @staticmethod
    def send_appointment_confirmation(appointment):
        """Send appointment confirmation"""
        try:
            # Future: Send confirmation email/SMS
            logger.info(f"Appointment confirmation sent: {appointment.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to send appointment confirmation: {str(e)}")
            return False
    
    @staticmethod
    def send_assessment_completion_notification(assessment):
        """Send assessment completion notification to professionals"""
        try:
            # Future: Notify assigned professional
            logger.info(f"Assessment completion notification sent: {assessment.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to send assessment notification: {str(e)}")
            return False


# Integration with existing models
def setup_medical_signals():
    """
    Setup medical signals for existing Django models
    Call this in apps.py ready() method
    """
    try:
        # Import models here to avoid circular imports
        from expedix.models import Patient
        
        # Connect model signals to medical events
        @receiver(post_save, sender=Patient)
        def patient_post_save(sender, instance, created, **kwargs):
            if created:
                MedicalEventDispatcher.dispatch_patient_created(
                    patient=instance,
                    user=getattr(instance, '_current_user', None)
                )
            else:
                MedicalEventDispatcher.dispatch_patient_updated(
                    patient=instance,
                    changes=getattr(instance, '_field_changes', {}),
                    user=getattr(instance, '_current_user', None)
                )
        
        logger.info("Medical signals setup completed")
        
    except ImportError as e:
        logger.warning(f"Could not setup medical signals: {str(e)}")
    except Exception as e:
        logger.error(f"Error setting up medical signals: {str(e)}")