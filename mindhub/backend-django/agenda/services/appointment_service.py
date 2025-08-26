"""
Appointment Service - Medical appointment management
Inspired by OpenEMR appointment scheduling architecture
"""

import uuid
from typing import Any, Dict, List, Optional, Union
from datetime import date, datetime, time, timedelta
from django.db import transaction
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
import logging

from core.services.base_service import BaseService
from core.utils.processing_result import ProcessingResult
from core.events.medical_signals import MedicalEventDispatcher
from ..models import Appointment
from ..validators.appointment_validator import AppointmentValidator

logger = logging.getLogger(__name__)


class AppointmentService(BaseService):
    """
    Appointment management service with healthcare scheduling logic
    """
    
    def get_validator(self) -> AppointmentValidator:
        """Return appointment validator"""
        return AppointmentValidator()
    
    def _create_entity(self, data: Dict[str, Any]) -> Appointment:
        """Create appointment in database"""
        # Set default values
        if 'status' not in data:
            data['status'] = 'scheduled'
        
        # Create appointment
        appointment = Appointment.objects.create(**data)
        return appointment
    
    def _update_entity(self, entity: Appointment, data: Dict[str, Any]) -> Appointment:
        """Update appointment in database"""
        # Track status changes for event system
        old_status = entity.status
        
        # Update fields
        for field, value in data.items():
            if hasattr(entity, field):
                setattr(entity, field, value)
        
        entity.save()
        
        # Dispatch status change events
        if 'status' in data and data['status'] != old_status:
            self._handle_status_change(entity, old_status, data['status'])
        
        return entity
    
    def _get_entity(self, entity_id: Union[str, uuid.UUID]) -> Optional[Appointment]:
        """Get appointment by ID"""
        try:
            return Appointment.objects.get(id=entity_id)
        except ObjectDoesNotExist:
            return None
    
    def _delete_entity(self, entity: Appointment) -> None:
        """Cancel appointment (soft delete for medical data)"""
        entity.status = 'cancelled'
        entity.save()
    
    def _search_entities(self, filters: Dict[str, Any], pagination: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Advanced appointment search with healthcare-specific filtering
        """
        queryset = Appointment.objects.all()
        
        # Apply security filters first
        queryset = self._apply_security_filters(queryset)
        
        # Apply search filters
        queryset = self._apply_search_filters(queryset, filters)
        
        # Apply pagination
        page = pagination.get('page', 1) if pagination else 1
        page_size = pagination.get('page_size', 20) if pagination else 20
        
        total_count = queryset.count()
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        appointments = list(queryset[start_index:end_index].values())
        
        return {
            'results': appointments,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        }
    
    def _apply_search_filters(self, queryset, filters: Dict[str, Any]):
        """Apply advanced search filters for appointments"""
        
        # Patient filter
        if filters.get('patient_id'):
            queryset = queryset.filter(patient_id=filters['patient_id'])
        
        # Professional filter
        if filters.get('professional_id'):
            queryset = queryset.filter(professional_id=filters['professional_id'])
        
        # Date range filters
        if filters.get('date_from'):
            queryset = queryset.filter(appointment_date__gte=filters['date_from'])
        
        if filters.get('date_to'):
            queryset = queryset.filter(appointment_date__lte=filters['date_to'])
        
        # Today's appointments
        if filters.get('today'):
            today = date.today()
            queryset = queryset.filter(appointment_date=today)
        
        # This week's appointments
        if filters.get('this_week'):
            today = date.today()
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            queryset = queryset.filter(
                appointment_date__gte=start_of_week,
                appointment_date__lte=end_of_week
            )
        
        # Status filter
        if filters.get('status'):
            if isinstance(filters['status'], list):
                queryset = queryset.filter(status__in=filters['status'])
            else:
                queryset = queryset.filter(status=filters['status'])
        
        # Type filter
        if filters.get('appointment_type'):
            queryset = queryset.filter(appointment_type=filters['appointment_type'])
        
        # Time range filter
        if filters.get('time_from'):
            queryset = queryset.filter(start_time__gte=filters['time_from'])
        
        if filters.get('time_to'):
            queryset = queryset.filter(end_time__lte=filters['time_to'])
        
        # Search in notes and reason
        if filters.get('search'):
            search_term = filters['search']
            queryset = queryset.filter(
                Q(reason__icontains=search_term) |
                Q(notes__icontains=search_term) |
                Q(internal_notes__icontains=search_term)
            )
        
        # Confirmation status
        if filters.get('confirmed'):
            queryset = queryset.filter(confirmation_sent=filters['confirmed'])
        
        if filters.get('reminded'):
            queryset = queryset.filter(reminder_sent=filters['reminded'])
        
        # Recurring appointments
        if filters.get('recurring'):
            queryset = queryset.filter(is_recurring=filters['recurring'])
        
        return queryset
    
    # Healthcare-specific appointment methods
    
    def schedule_appointment(self, appointment_data: Dict[str, Any]) -> ProcessingResult:
        """
        Schedule a new appointment with conflict detection
        """
        try:
            # Check for scheduling conflicts first
            conflict_check = self.check_scheduling_conflicts(appointment_data)
            if not conflict_check.is_valid:
                return conflict_check
            
            # Add conflict warnings to appointment data if any
            if conflict_check.warnings:
                appointment_data['_warnings'] = conflict_check.warnings
            
            # Create the appointment
            result = self.create(appointment_data)
            
            if result.is_valid:
                # Dispatch scheduling event
                MedicalEventDispatcher.dispatch_appointment_scheduled(
                    appointment=result.data,
                    user=self.user
                )
                
                # Add any scheduling warnings
                if conflict_check.warnings:
                    for warning in conflict_check.warnings:
                        result.add_warning(warning)
            
            return result
            
        except Exception as e:
            logger.error(f"Error scheduling appointment: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Failed to schedule appointment: {str(e)}"]
            )
    
    def reschedule_appointment(self, appointment_id: Union[str, uuid.UUID], new_date: date, new_start_time: time, new_end_time: time) -> ProcessingResult:
        """
        Reschedule an existing appointment
        """
        try:
            # Get existing appointment
            appointment = self._get_entity(appointment_id)
            if not appointment:
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=["Appointment not found"]
                )
            
            # Check if appointment can be rescheduled
            if appointment.status == 'completed':
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=["Cannot reschedule a completed appointment"]
                )
            
            # Prepare update data
            update_data = {
                'appointment_date': new_date,
                'start_time': new_start_time,
                'end_time': new_end_time,
                'status': 'rescheduled'
            }
            
            # Check for conflicts with new time
            conflict_check = self.check_scheduling_conflicts(update_data)
            if not conflict_check.is_valid:
                return conflict_check
            
            # Update appointment
            result = self.update(appointment_id, update_data)
            
            if result.is_valid and conflict_check.warnings:
                for warning in conflict_check.warnings:
                    result.add_warning(warning)
            
            return result
            
        except Exception as e:
            logger.error(f"Error rescheduling appointment: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Failed to reschedule appointment: {str(e)}"]
            )
    
    def cancel_appointment(self, appointment_id: Union[str, uuid.UUID], reason: str = "") -> ProcessingResult:
        """
        Cancel an appointment
        """
        try:
            appointment = self._get_entity(appointment_id)
            if not appointment:
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=["Appointment not found"]
                )
            
            # Check if appointment can be cancelled
            if appointment.status == 'completed':
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=["Cannot cancel a completed appointment"]
                )
            
            # Update appointment status
            update_data = {
                'status': 'cancelled',
                'internal_notes': f"{appointment.internal_notes or ''}\nCancelled: {reason}".strip()
            }
            
            result = self.update(appointment_id, update_data)
            return result
            
        except Exception as e:
            logger.error(f"Error cancelling appointment: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Failed to cancel appointment: {str(e)}"]
            )
    
    def complete_appointment(self, appointment_id: Union[str, uuid.UUID], completion_notes: str = "") -> ProcessingResult:
        """
        Mark appointment as completed
        """
        try:
            appointment = self._get_entity(appointment_id)
            if not appointment:
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=["Appointment not found"]
                )
            
            # Update appointment status
            update_data = {
                'status': 'completed',
                'internal_notes': f"{appointment.internal_notes or ''}\nCompleted: {completion_notes}".strip()
            }
            
            result = self.update(appointment_id, update_data)
            return result
            
        except Exception as e:
            logger.error(f"Error completing appointment: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Failed to complete appointment: {str(e)}"]
            )
    
    def check_scheduling_conflicts(self, appointment_data: Dict[str, Any]) -> ProcessingResult:
        """
        Check for scheduling conflicts
        """
        try:
            conflicts = []
            warnings = []
            
            professional_id = appointment_data.get('professional_id')
            patient_id = appointment_data.get('patient_id')
            appointment_date = appointment_data.get('appointment_date')
            start_time = appointment_data.get('start_time')
            end_time = appointment_data.get('end_time')
            
            if not all([professional_id, appointment_date, start_time, end_time]):
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=["Missing required fields for conflict check"]
                )
            
            # Check professional conflicts
            professional_conflicts = Appointment.objects.filter(
                professional_id=professional_id,
                appointment_date=appointment_date,
                status__in=['scheduled', 'confirmed'],
            ).filter(
                Q(start_time__lt=end_time, end_time__gt=start_time)
            )
            
            if professional_conflicts.exists():
                conflicts.append(f"Professional has {professional_conflicts.count()} conflicting appointment(s)")
            
            # Check patient conflicts
            if patient_id:
                patient_conflicts = Appointment.objects.filter(
                    patient_id=patient_id,
                    appointment_date=appointment_date,
                    status__in=['scheduled', 'confirmed'],
                ).filter(
                    Q(start_time__lt=end_time, end_time__gt=start_time)
                )
                
                if patient_conflicts.exists():
                    conflicts.append(f"Patient has {patient_conflicts.count()} conflicting appointment(s)")
            
            # Check business hours
            if isinstance(start_time, str):
                start_time = datetime.strptime(start_time, '%H:%M').time()
            if isinstance(end_time, str):
                end_time = datetime.strptime(end_time, '%H:%M').time()
            
            if start_time < time(6, 0) or end_time > time(22, 0):
                warnings.append("Appointment is outside typical business hours")
            
            # Check weekend scheduling
            if isinstance(appointment_date, str):
                appointment_date = datetime.fromisoformat(appointment_date).date()
            
            if appointment_date.weekday() >= 5:  # Saturday or Sunday
                warnings.append("Appointment scheduled on weekend")
            
            if conflicts:
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=conflicts,
                    warnings=warnings
                )
            
            return ProcessingResult(
                data={"conflicts": False},
                is_valid=True,
                warnings=warnings,
                message="No scheduling conflicts found"
            )
            
        except Exception as e:
            logger.error(f"Error checking conflicts: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Failed to check conflicts: {str(e)}"]
            )
    
    def get_professional_schedule(self, professional_id: Union[str, uuid.UUID], date_from: date, date_to: date) -> ProcessingResult:
        """
        Get professional's schedule for a date range
        """
        try:
            appointments = Appointment.objects.filter(
                professional_id=professional_id,
                appointment_date__gte=date_from,
                appointment_date__lte=date_to,
                status__in=['scheduled', 'confirmed']
            ).order_by('appointment_date', 'start_time')
            
            # Apply security filters
            appointments = self._apply_security_filters(appointments)
            
            schedule_data = {}
            for appointment in appointments:
                date_key = appointment.appointment_date.isoformat()
                if date_key not in schedule_data:
                    schedule_data[date_key] = []
                
                schedule_data[date_key].append({
                    'id': str(appointment.id),
                    'start_time': appointment.start_time.strftime('%H:%M'),
                    'end_time': appointment.end_time.strftime('%H:%M'),
                    'patient_id': str(appointment.patient_id),
                    'appointment_type': appointment.appointment_type,
                    'status': appointment.status,
                    'reason': appointment.reason
                })
            
            return ProcessingResult(
                data=schedule_data,
                is_valid=True,
                message=f"Schedule retrieved for {len(schedule_data)} days"
            )
            
        except Exception as e:
            logger.error(f"Error getting professional schedule: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Failed to get schedule: {str(e)}"]
            )
    
    def get_patient_appointments(self, patient_id: Union[str, uuid.UUID], include_past: bool = False) -> ProcessingResult:
        """
        Get all appointments for a patient
        """
        try:
            queryset = Appointment.objects.filter(patient_id=patient_id)
            
            if not include_past:
                queryset = queryset.filter(appointment_date__gte=date.today())
            
            # Apply security filters
            queryset = self._apply_security_filters(queryset)
            
            appointments = queryset.order_by('appointment_date', 'start_time')
            
            return ProcessingResult(
                data=list(appointments.values()),
                is_valid=True,
                message=f"Found {appointments.count()} appointments for patient"
            )
            
        except Exception as e:
            logger.error(f"Error getting patient appointments: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Failed to get patient appointments: {str(e)}"]
            )
    
    def _handle_status_change(self, appointment: Appointment, old_status: str, new_status: str):
        """Handle appointment status changes with events"""
        try:
            if new_status == 'cancelled':
                # Could trigger cancellation notifications
                logger.info(f"Appointment {appointment.id} cancelled")
                
            elif new_status == 'completed':
                # Could trigger completion workflows
                logger.info(f"Appointment {appointment.id} completed")
                
            elif new_status == 'confirmed':
                # Could trigger confirmation notifications
                logger.info(f"Appointment {appointment.id} confirmed")
                
        except Exception as e:
            logger.error(f"Error handling status change: {str(e)}")
    
    # Hook overrides for appointment-specific processing
    def pre_create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Pre-create processing for appointments"""
        # Set clinic_id or workspace_id from context
        if self.context.get('clinic_id'):
            data['clinic_id'] = self.context['clinic_id']
        elif self.context.get('workspace_id'):
            data['workspace_id'] = self.context['workspace_id']
        
        return data
    
    def post_create(self, entity: Appointment, data: Dict[str, Any]) -> Appointment:
        """Post-create processing for appointments"""
        logger.info(f"Appointment created: {entity.id} for patient {entity.patient_id}")
        return entity